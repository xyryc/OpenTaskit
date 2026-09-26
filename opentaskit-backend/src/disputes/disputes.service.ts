import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowService } from '../payments/escrow.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import {
  DisputeResolution,
  DisputeStatus,
  NotificationType,
  OfferStatus,
  TaskStatus,
} from '../../generated/prisma/enums';
import { FilterMyDisputesDto } from './dto/filter-my-disputes.dto';
import { FilterAdminDisputesDto } from './dto/filter-admin-disputes.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // 1. File / Raise a Dispute
  async create(taskId: string, userId: string, dto: CreateDisputeDto) {
    // Fetch task and check for accepted offer
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        offers: {
          where: { status: OfferStatus.ACCEPTED },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const acceptedOffer = task.offers[0];
    const isPoster = task.userId === userId;
    const isTasker = acceptedOffer && acceptedOffer.userId === userId;

    // Rule A: Only the task poster or accepted tasker can file a dispute
    if (!isPoster && !isTasker) {
      throw new ForbiddenException(
        'You must be either the task poster or the assigned tasker to dispute this task',
      );
    }

    // Rule B: Can only dispute a task once a tasker is assigned - covers
    // issues reported while work is ongoing (ASSIGNED/IN_PROGRESS), while
    // waiting on the poster's confirmation, or after it's been completed.
    const disputableStatuses: TaskStatus[] = [
      TaskStatus.ASSIGNED,
      TaskStatus.IN_PROGRESS,
      TaskStatus.AWAITING_CONFIRMATION,
      TaskStatus.COMPLETED,
    ];
    if (!disputableStatuses.includes(task.status)) {
      throw new BadRequestException(
        `Disputes can only be opened once a tasker is assigned. Current status: ${task.status}`,
      );
    }

    // Rule C: Check if there is already an active dispute on this task
    const existingActiveDispute = await this.prisma.dispute.findFirst({
      where: {
        taskId,
        status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
      },
    });

    if (existingActiveDispute) {
      throw new BadRequestException(
        'An active dispute is already open for this task and is pending mediation',
      );
    }

    // Determine counterparty
    const againstUserId = isPoster ? acceptedOffer.userId : task.userId;

    // Atomic transaction: create dispute + set task status to DISPUTED
    const dispute = await this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: {
          taskId,
          raisedById: userId,
          againstUserId,
          reason: dto.reason,
          description: dto.description,
          evidenceUrls: dto.evidenceUrls || [],
          status: DisputeStatus.OPEN,
        },
        include: {
          task: {
            select: { id: true, title: true, status: true, budget: true },
          },
          raisedBy: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          againstUser: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      });

      // Freeze task status
      await tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.DISPUTED },
      });

      return dispute;
    });

    // Notification (and push) fire after the transaction commits - network
    // calls don't belong inside a DB transaction.
    this.notificationsService
      .createNotification({
        userId: againstUserId,
        type: NotificationType.DISPUTE,
        title: 'Dispute Opened on Task',
        body: `A dispute has been opened regarding task "${dispute.task.title}". Our mediation team will review the case.`,
        taskId,
        actionUrl: `/tasks/${taskId}/disputes`,
      })
      .catch((err) => console.error('Failed to dispatch dispute-opened notification:', err));

    return dispute;
  }

  // 2. Get dispute details for a specific task
  async findByTask(taskId: string, userId: string, userRole: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        offers: {
          where: { status: OfferStatus.ACCEPTED },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const acceptedOffer = task.offers[0];
    const isPoster = task.userId === userId;
    const isTasker = acceptedOffer && acceptedOffer.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    // Only poster, assigned tasker, or admin can view disputes for this task
    if (!isPoster && !isTasker && !isAdmin) {
      throw new ForbiddenException(
        'You are not authorized to view dispute details for this task',
      );
    }

    return this.prisma.dispute.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: { id: true, title: true, status: true, budget: true },
        },
        raisedBy: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        againstUser: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        resolvedBy: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  // 3. Get disputes filed by or against the authenticated user
  async findMyDisputes(userId: string, query: FilterMyDisputesDto) {
    const { status, role = 'all', page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role === 'raised') {
      where.raisedById = userId;
    } else if (role === 'received') {
      where.againstUserId = userId;
    } else {
      where.OR = [{ raisedById: userId }, { againstUserId: userId }];
    }

    if (status) {
      where.status = status;
    }

    const [disputes, total, openCount] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          task: {
            select: { id: true, title: true, status: true, budget: true },
          },
          raisedBy: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          againstUser: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          resolvedBy: {
            select: { id: true, fullName: true },
          },
        },
      }),
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.count({
        where: {
          OR: [{ raisedById: userId }, { againstUserId: userId }],
          status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
        },
      }),
    ]);

    return {
      data: disputes,
      openCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // 4. Admin list and search disputes across the platform
  async findAllAdmin(query: FilterAdminDisputesDto) {
    const { search, status, reason, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (reason) {
      where.reason = reason;
    }

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { task: { title: { contains: search, mode: 'insensitive' } } },
        { raisedBy: { fullName: { contains: search, mode: 'insensitive' } } },
        {
          againstUser: { fullName: { contains: search, mode: 'insensitive' } },
        },
      ];
    }

    const [disputes, total, openCount, underReviewCount, resolvedCount] =
      await Promise.all([
        this.prisma.dispute.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            task: {
              select: { id: true, title: true, status: true, budget: true },
            },
            raisedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
            againstUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
            resolvedBy: {
              select: { id: true, fullName: true },
            },
          },
        }),
        this.prisma.dispute.count({ where }),
        this.prisma.dispute.count({ where: { status: DisputeStatus.OPEN } }),
        this.prisma.dispute.count({
          where: { status: DisputeStatus.UNDER_REVIEW },
        }),
        this.prisma.dispute.count({
          where: { status: DisputeStatus.RESOLVED },
        }),
      ]);

    return {
      data: disputes,
      metrics: {
        openCount,
        underReviewCount,
        resolvedCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // 5. Admin resolve dispute and issue verdict
  async resolve(id: string, adminId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        task: true,
      },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (
      dispute.status === DisputeStatus.RESOLVED ||
      dispute.status === DisputeStatus.DISMISSED
    ) {
      throw new BadRequestException(
        `This dispute has already been finalized with status: ${dispute.status}`,
      );
    }

    // Determine target task status according to verdict
    let targetTaskStatus: TaskStatus;
    if (
      dto.resolution === DisputeResolution.REFUND_POSTER ||
      dto.resolution === DisputeResolution.CANCELLED_NO_PENALTY
    ) {
      targetTaskStatus = TaskStatus.CANCELLED;
    } else if (dto.resolution === DisputeResolution.PAY_TASKER) {
      targetTaskStatus = TaskStatus.COMPLETED;
    } else {
      // If DISMISSED, restore task to ASSIGNED
      targetTaskStatus = TaskStatus.ASSIGNED;
    }

    const finalDisputeStatus =
      dto.resolution === DisputeResolution.DISMISSED
        ? DisputeStatus.DISMISSED
        : DisputeStatus.RESOLVED;

    const updatedDispute = await this.prisma.$transaction(async (tx) => {
      // 1. Update dispute record
      const updatedDispute = await tx.dispute.update({
        where: { id },
        data: {
          status: finalDisputeStatus,
          resolution: dto.resolution,
          resolutionNotes: dto.resolutionNotes,
          resolvedById: adminId,
          resolvedAt: new Date(),
        },
        include: {
          task: {
            select: { id: true, title: true, status: true, budget: true },
          },
          raisedBy: {
            select: { id: true, fullName: true, email: true },
          },
          againstUser: {
            select: { id: true, fullName: true, email: true },
          },
          resolvedBy: {
            select: { id: true, fullName: true },
          },
        },
      });

      // 2. Unfreeze task status
      await tx.task.update({
        where: { id: dispute.taskId },
        data: { status: targetTaskStatus },
      });

      return updatedDispute;
    });

    // Notifications fire after the transaction commits - network calls
    // don't belong inside a DB transaction. Promise.allSettled so one
    // failing notification doesn't affect the other.
    await Promise.allSettled([
      this.notificationsService.createNotification({
        userId: dispute.raisedById,
        type: NotificationType.DISPUTE,
        title: 'Dispute Resolved',
        body: `The dispute on task "${dispute.task.title}" has been concluded. Verdict: ${dto.resolution}.`,
        taskId: dispute.taskId,
        actionUrl: `/tasks/${dispute.taskId}/disputes`,
      }),
      this.notificationsService.createNotification({
        userId: dispute.againstUserId,
        type: NotificationType.DISPUTE,
        title: 'Dispute Resolved',
        body: `The dispute on task "${dispute.task.title}" has been concluded. Verdict: ${dto.resolution}.`,
        taskId: dispute.taskId,
        actionUrl: `/tasks/${dispute.taskId}/disputes`,
      }),
    ]);

    // Escrow settlement runs after the dispute/task transaction commits -
    // EscrowService manages its own transaction and can't be nested inside
    // the one above. If this task was never funded through escrow (cash
    // payment), these are safe no-ops.
    if (
      dto.resolution === DisputeResolution.REFUND_POSTER ||
      dto.resolution === DisputeResolution.CANCELLED_NO_PENALTY
    ) {
      await this.escrowService.refundForTask(
        dispute.taskId,
        'DISPUTE',
        `Dispute resolved: ${dto.resolution}. ${dto.resolutionNotes}`,
      );
    } else if (dto.resolution === DisputeResolution.PAY_TASKER) {
      await this.escrowService.releaseForTask(dispute.taskId, 'DISPUTE');
    }

    return updatedDispute;
  }
}
