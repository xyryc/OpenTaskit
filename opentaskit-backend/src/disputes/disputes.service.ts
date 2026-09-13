import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import {
  DisputeStatus,
  NotificationType,
  OfferStatus,
  TaskStatus,
} from '../../generated/prisma/enums';

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
}
