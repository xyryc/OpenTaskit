import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import {
  EscrowStatus,
  OfferStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums';
import type { Prisma } from '../../generated/prisma/client';
import { refundPayment } from './payhere.util';

type Tx = Prisma.TransactionClient;

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly platformConfig: PlatformConfigService,
  ) {}

  async createHold(
    tx: Tx,
    params: { taskId: string; paymentId: string; amount: number },
  ) {
    return tx.escrowHold.create({
      data: {
        taskId: params.taskId,
        paymentId: params.paymentId,
        amount: params.amount,
        status: EscrowStatus.HELD,
      },
    });
  }

  // Releases held funds to the assigned tasker's wallet, minus the current
  // platform fee. No-op (logged, not thrown) if the task was never funded
  // through escrow - cash-paid tasks have no EscrowHold at all.
  async releaseForTask(
    taskId: string,
    resolutionSource: 'COMPLETION' | 'DISPUTE',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const hold = await tx.escrowHold.findUnique({ where: { taskId } });
      if (!hold || hold.status !== EscrowStatus.HELD) {
        this.logger.debug(
          `No active escrow hold for task ${taskId}; skipping release`,
        );
        return null;
      }

      const task = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
        include: { offers: { where: { status: OfferStatus.ACCEPTED } } },
      });
      const taskerId = task.offers[0]?.userId;
      if (!taskerId) {
        throw new NotFoundException(
          `Task ${taskId} has no accepted offer to release escrow to`,
        );
      }

      const feePercent = await this.platformConfig.getPlatformFeePercent();
      const platformFee = Math.round(hold.amount * (feePercent / 100) * 100) / 100;
      const payoutAmount = hold.amount - platformFee;

      const wallet = await this.walletService.ensureWallet(taskerId, tx);
      await this.walletService.recordTransaction(tx, {
        walletId: wallet.id,
        type: WalletTransactionType.ESCROW_RELEASE,
        amount: payoutAmount,
        taskId,
        escrowHoldId: hold.id,
        description: `Escrow released for "${task.title}" (${feePercent}% platform fee deducted)`,
      });

      return tx.escrowHold.update({
        where: { id: hold.id },
        data: {
          status: EscrowStatus.RELEASED,
          platformFee,
          releasedAt: new Date(),
          resolutionSource,
        },
      });
    });
  }

  // Refunds held funds back to the poster's card via the PayHere Refund API.
  // No-op (logged, not thrown) if the task was never funded through escrow.
  async refundForTask(
    taskId: string,
    resolutionSource: 'CANCELLATION' | 'DISPUTE',
    reason: string,
  ) {
    const hold = await this.prisma.escrowHold.findUnique({
      where: { taskId },
      include: { payment: true },
    });
    if (!hold || hold.status !== EscrowStatus.HELD) {
      this.logger.debug(
        `No active escrow hold for task ${taskId}; skipping refund`,
      );
      return null;
    }

    if (hold.payment.payherePaymentId) {
      await refundPayment({
        payherePaymentId: hold.payment.payherePaymentId,
        amount: hold.amount,
        description: reason,
      });
    } else {
      this.logger.warn(
        `Escrow hold ${hold.id} has no PayHere payment id; marking refunded without calling the gateway`,
      );
    }

    return this.prisma.escrowHold.update({
      where: { id: hold.id },
      data: {
        status: EscrowStatus.REFUNDED,
        refundedAt: new Date(),
        resolutionSource,
      },
    });
  }
}
