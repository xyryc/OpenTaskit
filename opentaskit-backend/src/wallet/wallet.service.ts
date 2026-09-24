import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, WalletTransactionType } from '../../generated/prisma/enums';
import type { Prisma } from '../../generated/prisma/client';
import {
  formatAmount,
  generateCheckoutHash,
  getMerchantId,
  getPayHereCheckoutBaseUrl,
  isSandbox,
  mapRetrievalStatusToCode,
  PAYHERE_STATUS_CODE,
  retrievePaymentByOrderId,
} from '../payments/payhere.util';

type Tx = Prisma.TransactionClient;

const CURRENCY = 'LKR';
const MIN_TOPUP_AMOUNT = 100;

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Wallets are created lazily on first use rather than at signup, since most
  // users never earn/withdraw money on the platform.
  async ensureWallet(userId: string, tx: Tx | PrismaService = this.prisma) {
    const existing = await tx.wallet.findUnique({ where: { userId } });
    if (existing) {
      return existing;
    }
    return tx.wallet.create({ data: { userId } });
  }

  async getMyWallet(userId: string) {
    const wallet = await this.ensureWallet(userId);
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return { ...wallet, transactions };
  }

  // Appends a ledger entry and adjusts the wallet's available balance.
  // Must be called inside the same transaction as whatever business event
  // (escrow release, payout) triggered the credit/debit, to keep the ledger
  // and the running balance consistent.
  async recordTransaction(
    tx: Tx,
    params: {
      walletId: string;
      type: WalletTransactionType;
      amount: number; // positive = credit, negative = debit
      taskId?: string;
      escrowHoldId?: string;
      payoutRequestId?: string;
      walletTopUpId?: string;
      description?: string;
    },
  ) {
    const wallet = await tx.wallet.findUniqueOrThrow({
      where: { id: params.walletId },
    });

    const balanceAfter = wallet.availableBalance + params.amount;
    if (balanceAfter < 0) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    await tx.wallet.update({
      where: { id: params.walletId },
      data: { availableBalance: balanceAfter },
    });

    return tx.walletTransaction.create({
      data: {
        walletId: params.walletId,
        type: params.type,
        amount: params.amount,
        balanceAfter,
        taskId: params.taskId,
        escrowHoldId: params.escrowHoldId,
        payoutRequestId: params.payoutRequestId,
        walletTopUpId: params.walletTopUpId,
        description: params.description,
      },
    });
  }

  // Starts a PayHere checkout to top up the authenticated user's own wallet
  // balance (as opposed to Payment, which always funds a specific task).
  async initiateTopUp(userId: string, amount: number) {
    if (!Number.isFinite(amount) || amount < MIN_TOPUP_AMOUNT) {
      throw new BadRequestException(
        `Minimum top-up amount is ${MIN_TOPUP_AMOUNT} ${CURRENCY}`,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orderId = `topup-${userId}-${Date.now()}`;

    await this.prisma.walletTopUp.create({
      data: {
        userId,
        amount,
        currency: CURRENCY,
        status: PaymentStatus.PENDING,
        payhereOrderId: orderId,
      },
    });

    const appBaseUrl = process.env.APP_BASE_URL || 'https://opentaskit.app';
    const [firstName, ...lastNameParts] = (user.fullName || 'OpenTaskit User').split(' ');

    return {
      checkoutUrl: getPayHereCheckoutBaseUrl(),
      sandbox: isSandbox(),
      merchant_id: getMerchantId(),
      return_url: `${appBaseUrl}/payments/return`,
      cancel_url: `${appBaseUrl}/payments/cancel`,
      notify_url: `${process.env.API_BASE_URL || appBaseUrl}/api/v1/payments/ipn`,
      order_id: orderId,
      items: 'OpenTaskit wallet top-up',
      currency: CURRENCY,
      amount: formatAmount(amount),
      first_name: firstName,
      last_name: lastNameParts.join(' ') || firstName,
      email: user.email,
      phone: user.phoneNumber,
      address: 'N/A',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash: generateCheckoutHash({ orderId, amount, currency: CURRENCY }),
    };
  }

  // Client-triggered fallback confirmation, mirroring
  // PaymentsService.verifyPayment - checks PayHere's Retrieval API directly
  // since the IPN webhook can't reach a local/sandbox build.
  async verifyTopUp(orderId: string, userId: string) {
    this.logger.log(`verifyTopUp called for order ${orderId} by user ${userId}`);
    const topUp = await this.prisma.walletTopUp.findUnique({
      where: { payhereOrderId: orderId },
    });
    if (!topUp) {
      throw new NotFoundException('Top-up not found');
    }
    if (topUp.userId !== userId) {
      throw new ForbiddenException('You cannot verify this top-up');
    }
    if (topUp.status === PaymentStatus.COMPLETED) {
      return topUp;
    }

    const remote = await retrievePaymentByOrderId(orderId);
    if (!remote) {
      this.logger.warn(`verifyTopUp: PayHere has no record yet for order ${orderId}`);
      return topUp;
    }

    const code = mapRetrievalStatusToCode(remote.status);
    if (code === PAYHERE_STATUS_CODE.SUCCESS) {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.walletTopUp.update({
          where: { id: topUp.id },
          data: {
            status: PaymentStatus.COMPLETED,
            payherePaymentId:
              remote.payment_id !== undefined ? String(remote.payment_id) : undefined,
            payhereRawPayload: remote as any,
          },
        });
        const wallet = await this.ensureWallet(userId, tx);
        await this.recordTransaction(tx, {
          walletId: wallet.id,
          type: WalletTransactionType.TOPUP,
          amount: updated.amount,
          walletTopUpId: updated.id,
          description: 'Wallet top-up via PayHere',
        });
      });
    } else {
      this.logger.warn(
        `verifyTopUp: order ${orderId} not yet successful (status ${remote.status})`,
      );
    }

    return this.prisma.walletTopUp.findUnique({ where: { id: topUp.id } });
  }
}
