import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  PayoutStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { ProcessPayoutRequestDto } from './dto/process-payout-request.dto';
import { FilterAdminPayoutsDto } from './dto/filter-admin-payouts.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Requesting a payout reserves the funds immediately (debits the wallet),
  // so the same balance can't be withdrawn twice while a request is pending.
  async create(userId: string, dto: CreatePayoutRequestDto) {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });
    if (!bankAccount || bankAccount.userId !== userId) {
      throw new NotFoundException('Bank account not found');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const wallet = await this.walletService.ensureWallet(userId, tx);
      if (wallet.availableBalance < dto.amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      const payoutRequest = await tx.payoutRequest.create({
        data: {
          walletId: wallet.id,
          bankAccountId: dto.bankAccountId,
          amount: dto.amount,
          status: PayoutStatus.PENDING,
        },
      });

      await this.walletService.recordTransaction(tx, {
        walletId: wallet.id,
        type: WalletTransactionType.WITHDRAWAL,
        amount: -dto.amount,
        payoutRequestId: payoutRequest.id,
        description: 'Withdrawal requested - pending admin approval',
      });

      return payoutRequest;
    });

    this.notificationsService
      .notifyAdmins({
        type: NotificationType.PAYMENT,
        title: `Withdrawal Request: Rs ${dto.amount.toLocaleString()}`,
        body: `Bank payout requested for Rs ${dto.amount.toLocaleString()} to ${bankAccount.bankName} (Ref: #${result.id.slice(0, 8).toUpperCase()}).`,
        actionUrl: '/finance/payouts',
      })
      .catch(() => null);

    return result;
  }

  findMine(userId: string) {
    return this.prisma.payoutRequest.findMany({
      where: { wallet: { userId } },
      include: { bankAccount: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin(query: FilterAdminPayoutsDto) {
    const { status, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PayoutRequestWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { wallet: { user: { fullName: { contains: q, mode: 'insensitive' } } } },
        { wallet: { user: { email: { contains: q, mode: 'insensitive' } } } },
        { bankAccount: { accountNumber: { contains: q, mode: 'insensitive' } } },
        { bankAccount: { bankName: { contains: q, mode: 'insensitive' } } },
        { bankAccount: { accountHolderName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total, statusGroups] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bankAccount: true,
          wallet: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true, phoneNumber: true },
              },
            },
          },
          processedBy: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.payoutRequest.count({ where }),
      this.prisma.payoutRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const metrics = {
      pendingCount: 0,
      pendingAmount: 0,
      approvedCount: 0,
      approvedAmount: 0,
      paidCount: 0,
      paidAmount: 0,
      rejectedCount: 0,
      rejectedAmount: 0,
      totalCount: 0,
      totalAmount: 0,
    };

    for (const group of statusGroups) {
      const count = group._count._all || 0;
      const amount = group._sum.amount || 0;
      metrics.totalCount += count;
      metrics.totalAmount += amount;

      if (group.status === PayoutStatus.PENDING) {
        metrics.pendingCount = count;
        metrics.pendingAmount = amount;
      } else if (group.status === PayoutStatus.APPROVED) {
        metrics.approvedCount = count;
        metrics.approvedAmount = amount;
      } else if (group.status === PayoutStatus.PAID) {
        metrics.paidCount = count;
        metrics.paidAmount = amount;
      } else if (group.status === PayoutStatus.REJECTED) {
        metrics.rejectedCount = count;
        metrics.rejectedAmount = amount;
      }
    }

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      metrics,
    };
  }

  // Rejecting a payout refunds the reserved amount back to the wallet.
  // Approving transitions PENDING -> APPROVED (queued for transfer).
  // Marking PAID transitions PENDING/APPROVED -> PAID (records bankRef & admin notes).
  async process(id: string, adminId: string, dto: ProcessPayoutRequestDto) {
    const payoutRequest = await this.prisma.payoutRequest.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        wallet: { include: { user: true } },
      },
    });
    if (!payoutRequest) {
      throw new NotFoundException('Payout request not found');
    }

    if (
      payoutRequest.status === PayoutStatus.PAID ||
      payoutRequest.status === PayoutStatus.REJECTED
    ) {
      throw new BadRequestException(
        `This payout request has already been finalized as ${payoutRequest.status.toLowerCase()}`,
      );
    }

    if ((dto.status as PayoutStatus) === PayoutStatus.PENDING) {
      throw new BadRequestException(
        'Cannot reset a payout request back to PENDING',
      );
    }

    if (
      payoutRequest.status === PayoutStatus.APPROVED &&
      dto.status === PayoutStatus.APPROVED
    ) {
      throw new BadRequestException('This payout request is already approved');
    }

    if (dto.status === PayoutStatus.REJECTED) {
      if (!dto.adminNotes || !dto.adminNotes.trim()) {
        throw new BadRequestException(
          'A reason is required when rejecting a withdrawal request',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.status === PayoutStatus.REJECTED) {
        await this.walletService.recordTransaction(tx, {
          walletId: payoutRequest.walletId,
          type: WalletTransactionType.ADJUSTMENT,
          amount: payoutRequest.amount,
          payoutRequestId: payoutRequest.id,
          description: `Withdrawal request rejected: ${dto.adminNotes!.trim()} - amount returned to wallet`,
        });
      }

      return tx.payoutRequest.update({
        where: { id },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes?.trim() || payoutRequest.adminNotes,
          bankReference:
            dto.bankReference?.trim() || payoutRequest.bankReference,
          processedById: adminId,
          processedAt: new Date(),
        },
        include: {
          bankAccount: true,
          wallet: {
            include: {
              user: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
          processedBy: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });
    });

    // Notify tasker outside transaction
    const targetUserId = payoutRequest.wallet.userId;
    const amountStr = `Rs ${payoutRequest.amount.toLocaleString()}`;
    const bankDetails = `${payoutRequest.bankAccount.bankName} (${payoutRequest.bankAccount.accountNumber})`;

    if (dto.status === PayoutStatus.APPROVED) {
      await this.notificationsService
        .createNotification({
          userId: targetUserId,
          type: NotificationType.PAYMENT,
          title: 'Withdrawal Request Approved',
          body: `Your withdrawal request for ${amountStr} to ${bankDetails} has been approved and queued for bank transfer.`,
          actionUrl: '/(screens)/wallet',
        })
        .catch(() => null);
    } else if (dto.status === PayoutStatus.PAID) {
      const refSuffix = dto.bankReference?.trim()
        ? ` · Ref: ${dto.bankReference.trim()}`
        : '';
      await this.notificationsService
        .createNotification({
          userId: targetUserId,
          type: NotificationType.PAYMENT,
          title: 'Withdrawal Transferred to Bank',
          body: `${amountStr} has been transferred to your ${bankDetails}${refSuffix}.`,
          actionUrl: '/(screens)/wallet',
        })
        .catch(() => null);
    } else if (dto.status === PayoutStatus.REJECTED) {
      await this.notificationsService
        .createNotification({
          userId: targetUserId,
          type: NotificationType.PAYMENT,
          title: 'Withdrawal Request Rejected',
          body: `Your withdrawal request for ${amountStr} was rejected: ${dto.adminNotes!.trim()}. The funds have been refunded to your wallet.`,
          actionUrl: '/(screens)/wallet',
        })
        .catch(() => null);
    }

    return updated;
  }
}
