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
  OfferStatus,
  PaymentStatus,
  TaskStatus,
} from '../../generated/prisma/enums';
import { FilterAdminPaymentsDto } from './dto/filter-admin-payments.dto';
import {
  formatAmount,
  generateCheckoutHash,
  getMerchantId,
  getPayHereCheckoutBaseUrl,
  PAYHERE_STATUS_CODE,
  PayHereIpnPayload,
  verifyIpnSignature,
} from './payhere.util';

const CURRENCY = 'LKR';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
  ) {}

  // Poster funds escrow for a task they've already accepted an offer on.
  // Returns everything the app needs to render/submit PayHere's Hosted
  // Checkout form (or open it in a WebView).
  async initiateCheckout(taskId: string, posterId: string) {
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
    if (task.status !== TaskStatus.ASSIGNED) {
      throw new BadRequestException(
        `Escrow can only be funded once a task is assigned. Current status: ${task.status}`,
      );
    }
    const acceptedOffer = task.offers[0];
    if (!acceptedOffer) {
      throw new BadRequestException('This task has no accepted offer to fund');
    }
    if (task.payments.length > 0) {
      throw new BadRequestException('This task has already been funded');
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

    return {
      checkoutUrl: getPayHereCheckoutBaseUrl(),
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
  }

  // PayHere server-to-server webhook (IPN). Idempotent on payhereOrderId -
  // PayHere retries this call, and duplicates must not double-fund escrow.
  async handleIpn(payload: PayHereIpnPayload) {
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

    if (payment.status === PaymentStatus.COMPLETED) {
      // Already processed - PayHere retried the webhook. Nothing to do.
      return { received: true };
    }

    if (payload.status_code === PAYHERE_STATUS_CODE.SUCCESS) {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            payherePaymentId: payload.payment_id,
            payhereRawPayload: payload as any,
          },
        });
        await this.escrowService.createHold(tx, {
          taskId: updated.taskId,
          paymentId: updated.id,
          amount: updated.amount,
        });
      });
    } else if (payload.status_code === PAYHERE_STATUS_CODE.PENDING) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { payhereRawPayload: payload as any },
      });
    } else {
      const status =
        payload.status_code === PAYHERE_STATUS_CODE.CANCELLED
          ? PaymentStatus.CANCELLED
          : PaymentStatus.FAILED;
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status, payhereRawPayload: payload as any },
      });
    }

    return { received: true };
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
        { task: { title: { contains: search, mode: 'insensitive' } } },
        { payer: { fullName: { contains: search, mode: 'insensitive' } } },
        { payer: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total, heldAgg, releasedAgg, refundedAgg] = await Promise.all([
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
    ]);

    const releasedTotal = releasedAgg._sum.amount ?? 0;
    const platformFeeTotal = releasedAgg._sum.platformFee ?? 0;

    return {
      data,
      metrics: {
        activeEscrowTotal: heldAgg._sum.amount ?? 0,
        releasedToTaskersTotal: releasedTotal - platformFeeTotal,
        refundedToPostersTotal: refundedAgg._sum.amount ?? 0,
        platformFeeTotal,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    };
  }

  async getPaymentStatus(taskId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: { escrowHold: true },
    });
    if (!payment) {
      throw new NotFoundException('No payment found for this task');
    }
    if (payment.payerId !== userId) {
      throw new ForbiddenException('You cannot view this payment');
    }
    return payment;
  }
}
