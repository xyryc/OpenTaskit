import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  DisputeStatus,
  EscrowStatus,
  NotificationType,
  OfferStatus,
  TaskStatus,
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
    private readonly notificationsService: NotificationsService,
  ) {}

  async createHold(
    tx: Tx,
    params: { taskId: string; paymentId: string; amount: number },
  ) {
    const holdDays = await this.platformConfig.getEscrowHoldDays();
    const autoReleaseAt = new Date(
      Date.now() + holdDays * 24 * 60 * 60 * 1000,
    );
    this.logger.log(
      `Creating escrow hold for task ${params.taskId}: amount ${params.amount}, holdDays ${holdDays}, autoReleaseAt ${autoReleaseAt.toISOString()}`,
    );

    return tx.escrowHold.create({
      data: {
        taskId: params.taskId,
        paymentId: params.paymentId,
        amount: params.amount,
        status: EscrowStatus.HELD,
        autoReleaseAt,
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
    const result = await this.prisma.$transaction(async (tx) => {
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
      const platformFee =
        Math.round(hold.amount * (feePercent / 100) * 100) / 100;
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

      const updatedHold = await tx.escrowHold.update({
        where: { id: hold.id },
        data: {
          status: EscrowStatus.RELEASED,
          platformFee,
          releasedAt: new Date(),
          resolutionSource,
        },
      });

      return {
        updatedHold,
        taskerId,
        taskTitle: task.title,
        payoutAmount,
      };
    });

    if (result) {
      try {
        await this.notificationsService.createNotification({
          userId: result.taskerId,
          type: NotificationType.PAYMENT,
          title: 'Payment Cleared to Wallet',
          body: `Rs ${result.payoutAmount.toLocaleString()} has been released to your wallet for "${result.taskTitle}".`,
          taskId,
          actionUrl: '/(screens)/wallet',
        });
      } catch (err) {
        this.logger.error('Failed to dispatch escrow-release notification:', err);
      }
    }

    return result?.updatedHold ?? null;
  }

  // Admin bypass: immediately release held escrow funds to tasker
  async adminReleaseNow(taskId: string) {
    const hold = await this.prisma.escrowHold.findUnique({ where: { taskId } });
    if (!hold || hold.status !== EscrowStatus.HELD) {
      throw new BadRequestException(
        'No active escrow hold currently held for this task to release',
      );
    }
    this.logger.log(`Admin requested early release for task ${taskId}`);
    return this.releaseForTask(taskId, 'COMPLETION');
  }

  // 50/50 Split Payout for Dispute Resolution
  async splitPayoutForTask(taskId: string, resolutionNotes?: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const hold = await tx.escrowHold.findUnique({ where: { taskId } });
      if (!hold || hold.status !== EscrowStatus.HELD) {
        this.logger.debug(
          `No active escrow hold for task ${taskId}; skipping split payout`,
        );
        return null;
      }

      const task = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
        include: { offers: { where: { status: OfferStatus.ACCEPTED } } },
      });
      const taskerId = task.offers[0]?.userId;
      const posterId = task.userId;

      if (!taskerId) {
        throw new NotFoundException(
          `Task ${taskId} has no accepted offer for escrow split`,
        );
      }

      const feePercent = await this.platformConfig.getPlatformFeePercent();
      const totalPlatformFee =
        Math.round(hold.amount * (feePercent / 100) * 100) / 100;
      const feePerParty = Math.round((totalPlatformFee / 2) * 100) / 100;
      const halfAmount = Math.round((hold.amount / 2) * 100) / 100;
      const payoutPerParty = halfAmount - feePerParty;

      // 1. Credit Poster Wallet (50% minus half fee)
      const posterWallet = await this.walletService.ensureWallet(posterId, tx);
      await this.walletService.recordTransaction(tx, {
        walletId: posterWallet.id,
        type: WalletTransactionType.DISPUTE_SPLIT,
        amount: payoutPerParty,
        taskId,
        escrowHoldId: hold.id,
        description: `Dispute 50/50 split refund for "${task.title}" (${feePercent / 2}% fee deducted)`,
      });

      // 2. Credit Tasker Wallet (50% minus half fee)
      const taskerWallet = await this.walletService.ensureWallet(taskerId, tx);
      await this.walletService.recordTransaction(tx, {
        walletId: taskerWallet.id,
        type: WalletTransactionType.DISPUTE_SPLIT,
        amount: payoutPerParty,
        taskId,
        escrowHoldId: hold.id,
        description: `Dispute 50/50 split payout for "${task.title}" (${feePercent / 2}% fee deducted)`,
      });

      const updatedHold = await tx.escrowHold.update({
        where: { id: hold.id },
        data: {
          status: EscrowStatus.RELEASED,
          platformFee: totalPlatformFee,
          releasedAt: new Date(),
          resolutionSource: 'DISPUTE',
        },
      });

      return {
        updatedHold,
        posterId,
        taskerId,
        taskTitle: task.title,
        payoutPerParty,
      };
    });

    if (result) {
      // Notify both parties of their wallet credit
      await Promise.allSettled([
        this.notificationsService.createNotification({
          userId: result.posterId,
          type: NotificationType.DISPUTE,
          title: 'Dispute Split Refund Credited',
          body: `Rs ${result.payoutPerParty.toLocaleString()} has been refunded to your wallet for "${result.taskTitle}".`,
          taskId,
          actionUrl: '/(screens)/wallet',
        }),
        this.notificationsService.createNotification({
          userId: result.taskerId,
          type: NotificationType.DISPUTE,
          title: 'Dispute Split Payout Credited',
          body: `Rs ${result.payoutPerParty.toLocaleString()} has been paid to your wallet for "${result.taskTitle}".`,
          taskId,
          actionUrl: '/(screens)/wallet',
        }),
      ]);
    }

    return result?.updatedHold ?? null;
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

  // Background cron: runs every 10 minutes to auto-release expired escrow holds
  @Cron(CronExpression.EVERY_10_MINUTES)
  async autoReleaseExpiredHolds() {
    const now = new Date();
    const expiredHolds = await this.prisma.escrowHold.findMany({
      where: {
        status: EscrowStatus.HELD,
        autoReleaseAt: { lte: now },
        task: {
          status: { not: TaskStatus.DISPUTED },
        },
      },
      include: {
        task: {
          include: {
            disputes: {
              where: {
                status: {
                  in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW],
                },
              },
            },
          },
        },
      },
    });

    if (expiredHolds.length === 0) {
      return;
    }

    this.logger.log(
      `Checking auto-release: found ${expiredHolds.length} candidate expired hold(s)`,
    );

    for (const hold of expiredHolds) {
      if (hold.task.disputes && hold.task.disputes.length > 0) {
        this.logger.debug(
          `Skipping auto-release for task ${hold.taskId}; active dispute exists`,
        );
        continue;
      }

      try {
        this.logger.log(
          `Auto-releasing escrow for task ${hold.taskId} after hold period expired`,
        );
        await this.releaseForTask(hold.taskId, 'COMPLETION');
      } catch (err) {
        this.logger.error(
          `Failed to auto-release escrow hold ${hold.id} for task ${hold.taskId}:`,
          err,
        );
      }
    }
  }
}

