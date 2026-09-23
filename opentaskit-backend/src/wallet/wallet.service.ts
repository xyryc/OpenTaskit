import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletTransactionType } from '../../generated/prisma/enums';
import type { Prisma } from '../../generated/prisma/client';

type Tx = Prisma.TransactionClient;

@Injectable()
export class WalletService {
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
        description: params.description,
      },
    });
  }
}
