import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PayoutStatus, WalletTransactionType } from '../../generated/prisma/enums';
import { CreatePayoutRequestDto } from './dto/create-payout-request.dto';
import { ProcessPayoutRequestDto } from './dto/process-payout-request.dto';
import { FilterAdminPayoutsDto } from './dto/filter-admin-payouts.dto';

@Injectable()
export class PayoutsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
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

    return this.prisma.$transaction(async (tx) => {
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
  }

  findMine(userId: string) {
    return this.prisma.payoutRequest.findMany({
      where: { wallet: { userId } },
      include: { bankAccount: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin(query: FilterAdminPayoutsDto) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bankAccount: true,
          wallet: { include: { user: { select: { id: true, fullName: true, email: true } } } },
        },
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  // Rejecting a payout refunds the reserved amount back to the wallet.
  // Approving/marking-paid just records the admin's decision - the money
  // already left the wallet at request time.
  async process(id: string, adminId: string, dto: ProcessPayoutRequestDto) {
    const payoutRequest = await this.prisma.payoutRequest.findUnique({
      where: { id },
    });
    if (!payoutRequest) {
      throw new NotFoundException('Payout request not found');
    }
    if (payoutRequest.status !== PayoutStatus.PENDING) {
      throw new BadRequestException(
        `This payout request has already been ${payoutRequest.status.toLowerCase()}`,
      );
    }
    if ((dto.status as PayoutStatus) === PayoutStatus.PENDING) {
      throw new BadRequestException('Cannot process a payout request back to PENDING');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.status === PayoutStatus.REJECTED) {
        await this.walletService.recordTransaction(tx, {
          walletId: payoutRequest.walletId,
          type: WalletTransactionType.ADJUSTMENT,
          amount: payoutRequest.amount,
          payoutRequestId: payoutRequest.id,
          description: 'Withdrawal request rejected - amount returned to wallet',
        });
      }

      return tx.payoutRequest.update({
        where: { id },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes,
          processedById: adminId,
          processedAt: new Date(),
        },
      });
    });
  }
}
