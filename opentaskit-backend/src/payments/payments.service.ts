import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowService } from './escrow.service';
import {
  EscrowStatus,
  NotificationType,
  OfferStatus,
  PaymentStatus,
  TaskStatus,
  WalletTransactionType,
} from '../../generated/prisma/enums';
import { FilterAdminPaymentsDto } from './dto/filter-admin-payments.dto';
import {
  formatAmount,
  generateCheckoutHash,
  getMerchantId,
  getPayHereCheckoutBaseUrl,
  isSandbox,
  mapRetrievalStatusToCode,
  PAYHERE_STATUS_CODE,
  PayHereIpnPayload,
  retrievePaymentByOrderId,
  verifyIpnSignature,
} from './payhere.util';
import { WalletService } from '../wallet/wallet.service';
import { NotificationsService } from '../notifications/notifications.service';

const CURRENCY = 'LKR';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
    private readonly walletService: WalletService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Poster pays for a task once the tasker has marked it done and the poster
  // is confirming completion. Returns everything the app needs to open
  // PayHere's native checkout sheet.
  async initiateCheckout(taskId: string, posterId: string) {
    this.logger.log(`initiateCheckout called for task ${taskId} by user ${posterId}`);
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: true,
        offers: { where: { status: OfferStatus.ACCEPTED } },
        payments: {
          where: { status: { in: [PaymentStatus.PENDING, PaymentStatus.COMPLETED] } },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (task.userId !== posterId) {
      throw new ForbiddenException('Only the task poster can fund this task');
    }
    if (task.status !== TaskStatus.AWAITING_CONFIRMATION) {
      throw new BadRequestException(
        `Payment can only be started once the tasker has marked the task done and it awaits your confirmation. Current status: ${task.status}`,
      );
    }
    const acceptedOffer = task.offers[0];
    if (!acceptedOffer) {
      throw new BadRequestException('This task has no accepted offer to fund');
    }
    if (task.payments.some((p) => p.status === PaymentStatus.COMPLETED)) {
      throw new BadRequestException('This task has already been funded');
    }
    // Abandoned/failed attempts (sheet closed, sandbox test aborted, etc.)
    // leave PENDING rows behind - cancel them so the poster can retry.
    const stalePending = task.payments.filter((p) => p.status === PaymentStatus.PENDING);
    if (stalePending.length > 0) {
      await this.prisma.payment.updateMany({
        where: { id: { in: stalePending.map((p) => p.id) } },
        data: { status: PaymentStatus.CANCELLED },
      });
    }

    const orderId = `task-${taskId}-${Date.now()}`;
    const amount = acceptedOffer.amount;

    await this.prisma.payment.create({
      data: {
        taskId,
        payerId: posterId,
        amount,
        currency: CURRENCY,
        status: PaymentStatus.PENDING,
        payhereOrderId: orderId,
      },
    });

    const appBaseUrl = process.env.APP_BASE_URL || 'https://opentaskit.app';
    const [firstName, ...lastNameParts] = (task.user.fullName || 'OpenTaskit User').split(' ');

    const result = {
      checkoutUrl: getPayHereCheckoutBaseUrl(),
      sandbox: isSandbox(),
      merchant_id: getMerchantId(),
      return_url: `${appBaseUrl}/payments/return`,
      cancel_url: `${appBaseUrl}/payments/cancel`,
      notify_url: `${process.env.API_BASE_URL || appBaseUrl}/api/v1/payments/ipn`,
      order_id: orderId,
      items: task.title,
      currency: CURRENCY,
      amount: formatAmount(amount),
      first_name: firstName,
      last_name: lastNameParts.join(' ') || firstName,
      email: task.user.email,
      phone: task.user.phoneNumber,
      address: task.address || 'N/A',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash: generateCheckoutHash({ orderId, amount, currency: CURRENCY }),
    };
    this.logger.log(
      `initiateCheckout succeeded for task ${taskId}: order ${orderId}, amount ${amount}, sandbox ${isSandbox()}, merchant_id ${getMerchantId()}`,
    );
    return result;
  }

  // Poster pays for an awaiting-confirmation task using their digital wallet balance.
  // Performs an atomic transaction:
  // 1. Validates wallet has sufficient available balance.
  // 2. Debits the poster's wallet and records ESCROW_HOLD WalletTransaction.
  // 3. Creates a Payment record (status: COMPLETED, payhereOrderId: wallet-task-..., payherePaymentId: WALLET-...).
  // 4. Creates an EscrowHold record (status: HELD, autoReleaseAt: now + holdDays).
  // 5. Updates the task status to COMPLETED.
  // 6. Notifies the tasker that payment is secured in escrow.
  async payWithWallet(taskId: string, posterId: string) {
    this.logger.log(`payWithWallet called for task ${taskId} by user ${posterId}`);
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: true,
        offers: { where: { status: OfferStatus.ACCEPTED } },
        payments: {
          where: { status: { in: [PaymentStatus.PENDING, PaymentStatus.COMPLETED] } },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    if (task.userId !== posterId) {
      throw new ForbiddenException('Only the task poster can pay for this task');
    }
    if (task.status !== TaskStatus.AWAITING_CONFIRMATION) {
      throw new BadRequestException(
        `Payment can only be confirmed once the tasker has marked the task done. Current status: ${task.status}`,
      );
    }
    const acceptedOffer = task.offers[0];
    if (!acceptedOffer) {
      throw new BadRequestException('This task has no accepted offer to fund');
    }
    if (task.payments.some((p) => p.status === PaymentStatus.COMPLETED)) {
      throw new BadRequestException('This task has already been funded');
    }

    const amount = acceptedOffer.amount;
    const wallet = await this.walletService.ensureWallet(posterId);

    if (wallet.availableBalance < amount) {
      throw new BadRequestException(
        `Insufficient wallet balance (LKR ${wallet.availableBalance.toLocaleString()}). You need LKR ${amount.toLocaleString()}. Please top up your wallet.`,
      );
    }

    // Cancel any stale pending payments
    const stalePending = task.payments.filter((p) => p.status === PaymentStatus.PENDING);
    if (stalePending.length > 0) {
      await this.prisma.payment.updateMany({
        where: { id: { in: stalePending.map((p) => p.id) } },
        data: { status: PaymentStatus.CANCELLED },
      });
    }

    const orderId = `wallet-task-${taskId}-${Date.now()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Debit poster's wallet with an ESCROW_HOLD transaction
      const walletTx = await this.walletService.recordTransaction(tx, {
        walletId: wallet.id,
        type: WalletTransactionType.ESCROW_HOLD,
        amount: -amount,
        taskId,
        description: `Escrow hold for "${task.title}"`,
      });

      // 2. Create COMPLETED Payment record so it shows in Admin Escrow Ledger & PayHere Transactions
      const payment = await tx.payment.create({
        data: {
          taskId,
          payerId: posterId,
          amount,
          currency: CURRENCY,
          status: PaymentStatus.COMPLETED,
          payhereOrderId: orderId,
          payherePaymentId: `WALLET-${walletTx.id}`,
          payhereRawPayload: {
            method: 'WALLET',
            walletId: wallet.id,
            walletTransactionId: walletTx.id,
          },
        },
      });

      // 3. Create EscrowHold record (holds funds for tasker with auto-release delay)
      const hold = await this.escrowService.createHold(tx, {
        taskId,
        paymentId: payment.id,
        amount,
      });

      // 4. Update the wallet transaction with escrowHoldId
      await tx.walletTransaction.update({
        where: { id: walletTx.id },
        data: { escrowHoldId: hold.id },
      });

      // 5. Update task to COMPLETED
      const completedTask = await tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.COMPLETED },
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      });

      return { payment, hold, task: completedTask, walletTx };
    });

    // 🔔 Notify tasker that task was confirmed and payment is in escrow
    try {
      await this.notificationsService.createNotification({
        userId: acceptedOffer.userId,
        type: NotificationType.TASK,
        title: 'Task Confirmed & Payment Held in Escrow',
        body: `"${task.title}" has been confirmed by the poster. Payment of Rs ${amount.toLocaleString()} is held in escrow and will auto-release in 3 days.`,
        taskId,
        actionUrl: `/(screens)/job/${taskId}`,
      });
    } catch (err) {
      this.logger.error('Failed to dispatch completion notification to tasker:', err);
    }

    return {
      message: 'Task confirmed and payment secured in escrow',
      payment: result.payment,
      hold: result.hold,
      task: result.task,
    };
  }

  // PayHere server-to-server webhook (IPN). Idempotent on payhereOrderId -
  // PayHere retries this call, and duplicates must not double-fund escrow.
  async handleIpn(payload: PayHereIpnPayload) {
    this.logger.log(`handleIpn received for order ${payload.order_id}, status_code ${payload.status_code}`);
    if (!verifyIpnSignature(payload)) {
      this.logger.warn(`Rejected IPN with invalid signature for order ${payload.order_id}`);
      throw new BadRequestException('Invalid IPN signature');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { payhereOrderId: payload.order_id },
    });
    if (!payment) {
      this.logger.warn(`Received IPN for unknown order ${payload.order_id}`);
      return { received: true };
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      await this.applyPaymentOutcome(payment, payload.status_code, payload.payment_id, payload);
    }

    return { received: true };
  }

  // Client-triggered fallback confirmation, used right after the native
  // PayHere SDK reports a completed payment in-app. Needed because the IPN
  // webhook can't reach a local/sandbox build with no public URL - this
  // checks PayHere's own Retrieval API instead of trusting the client.
  async verifyPayment(orderId: string, userId: string) {
    this.logger.log(`verifyPayment called for order ${orderId} by user ${userId}`);
    const payment = await this.prisma.payment.findUnique({
      where: { payhereOrderId: orderId },
      include: { escrowHold: true },
    });
    if (!payment) {
      this.logger.warn(`verifyPayment: no payment record found for order ${orderId}`);
      throw new NotFoundException('Payment not found');
    }
    if (payment.payerId !== userId) {
      throw new ForbiddenException('You cannot verify this payment');
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      this.logger.log(`verifyPayment: order ${orderId} already COMPLETED`);
      return payment;
    }

    const remote = await retrievePaymentByOrderId(orderId);
    if (!remote) {
      this.logger.warn(`verifyPayment: PayHere has no record yet for order ${orderId}`);
      // Nothing on PayHere's side yet - leave it pending, the app can retry.
      return payment;
    }
    this.logger.log(
      `verifyPayment: PayHere returned status ${remote.status} for order ${orderId}`,
    );

    await this.applyPaymentOutcome(
      payment,
      mapRetrievalStatusToCode(remote.status),
      remote.payment_id !== undefined ? String(remote.payment_id) : undefined,
      remote,
    );

    return this.prisma.payment.findUnique({
      where: { id: payment.id },
      include: { escrowHold: true },
    });
  }

  // Shared by the IPN webhook and the client-triggered verify fallback -
  // both must apply the exact same idempotent state transition.
  private async applyPaymentOutcome(
    payment: { id: string; taskId: string; amount: number },
    statusCode: string | number,
    payherePaymentId: string | undefined,
    rawPayload: unknown,
  ) {
    const code = String(statusCode);

    if (code === PAYHERE_STATUS_CODE.SUCCESS) {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            payherePaymentId,
            payhereRawPayload: rawPayload as any,
          },
        });
        await this.escrowService.createHold(tx, {
          taskId: updated.taskId,
          paymentId: updated.id,
          amount: updated.amount,
        });
      });
    } else if (code === PAYHERE_STATUS_CODE.PENDING) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { payhereRawPayload: rawPayload as any },
      });
    } else {
      const status =
        code === PAYHERE_STATUS_CODE.CANCELLED
          ? PaymentStatus.CANCELLED
          : PaymentStatus.FAILED;
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status, payhereRawPayload: rawPayload as any },
      });
    }
  }

  // Admin ledger: every funding attempt plus its escrow outcome, with
  // platform-wide totals for the summary cards.
  async findAllAdmin(query: FilterAdminPaymentsDto) {
    const { search, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { payhereOrderId: { contains: search, mode: 'insensitive' } },
        { task: { title: { contains: search, mode: 'insensitive' } } },
        { payer: { fullName: { contains: search, mode: 'insensitive' } } },
        { payer: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total, heldAgg, releasedAgg, refundedAgg, activeEscrowCount] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          task: { select: { id: true, title: true, status: true } },
          payer: { select: { id: true, fullName: true, email: true } },
          escrowHold: true,
        },
      }),
      this.prisma.payment.count({ where }),
      this.prisma.escrowHold.aggregate({
        where: { status: EscrowStatus.HELD },
        _sum: { amount: true },
      }),
      this.prisma.escrowHold.aggregate({
        where: { status: EscrowStatus.RELEASED },
        _sum: { amount: true, platformFee: true },
      }),
      this.prisma.escrowHold.aggregate({
        where: { status: EscrowStatus.REFUNDED },
        _sum: { amount: true },
      }),
      this.prisma.escrowHold.count({
        where: { status: EscrowStatus.HELD },
      }),
    ]);

    const releasedTotal = releasedAgg._sum.amount ?? 0;
    const platformFeeTotal = releasedAgg._sum.platformFee ?? 0;

    return {
      data,
      metrics: {
        activeEscrowTotal: heldAgg._sum.amount ?? 0,
        activeEscrowCount,
        releasedToTaskersTotal: releasedTotal - platformFeeTotal,
        refundedToPostersTotal: refundedAgg._sum.amount ?? 0,
        platformFeeTotal,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getPaymentStatus(taskId: string, userId: string, userRole?: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        escrowHold: true,
        task: {
          include: {
            offers: {
              where: { status: OfferStatus.ACCEPTED },
            },
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException('No payment found for this task');
    }
    const taskerId = payment.task?.offers[0]?.userId;
    const isPayer = payment.payerId === userId;
    const isTasker = taskerId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isPayer && !isTasker && !isAdmin) {
      throw new ForbiddenException('You cannot view this payment');
    }
    return payment;
  }
}
