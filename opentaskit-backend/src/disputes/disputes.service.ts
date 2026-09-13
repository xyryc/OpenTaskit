import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

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

    // Rule B: Can only dispute ASSIGNED or COMPLETED tasks
    if (
      task.status !== TaskStatus.ASSIGNED &&
      task.status !== TaskStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `Disputes can only be opened on ASSIGNED or COMPLETED tasks. Current status: ${task.status}`,
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

    // Atomic transaction: create dispute + set task status to DISPUTED + notify counterparty
    return this.prisma.$transaction(async (tx) => {
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

      // Send in-app notification to the counterparty
      await tx.notification.create({
        data: {
          userId: againstUserId,
          type: NotificationType.DISPUTE,
          title: 'Dispute Opened on Task',
          body: `A dispute has been opened regarding task "${task.title}". Our mediation team will review the case.`,
          taskId,
          actionUrl: `/tasks/${taskId}/disputes`,
        },
      });

      return dispute;
    });
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
    } else if (
      dto.resolution === DisputeResolution.PAY_TASKER ||
      dto.resolution === DisputeResolution.SPLIT_PAYMENT
    ) {
      targetTaskStatus = TaskStatus.COMPLETED;
    } else {
      // If DISMISSED, restore task to ASSIGNED
      targetTaskStatus = TaskStatus.ASSIGNED;
    }

    const finalDisputeStatus =
      dto.resolution === DisputeResolution.DISMISSED
        ? DisputeStatus.DISMISSED
        : DisputeStatus.RESOLVED;

    return this.prisma.$transaction(async (tx) => {
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

      // 3. Notify Filer
      await tx.notification.create({
        data: {
          userId: dispute.raisedById,
          type: NotificationType.DISPUTE,
          title: 'Dispute Resolved',
          body: `The dispute on task "${dispute.task.title}" has been concluded. Verdict: ${dto.resolution}.`,
          taskId: dispute.taskId,
          actionUrl: `/tasks/${dispute.taskId}/disputes`,
        },
      });

      // 4. Notify Respondent
      await tx.notification.create({
        data: {
          userId: dispute.againstUserId,
          type: NotificationType.DISPUTE,
          title: 'Dispute Resolved',
          body: `The dispute on task "${dispute.task.title}" has been concluded. Verdict: ${dto.resolution}.`,
          taskId: dispute.taskId,
          actionUrl: `/tasks/${dispute.taskId}/disputes`,
        },
      });

      return updatedDispute;
    });
  }
}
