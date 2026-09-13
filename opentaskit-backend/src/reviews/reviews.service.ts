import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { TaskStatus, OfferStatus } from '../../generated/prisma/enums';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Post a review
  async create(taskId: string, currentUserId: string, dto: CreateReviewDto) {
    // 1. Fetch task with its accepted offer
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

    // Rule 1: Task must be COMPLETED
    if (task.status !== TaskStatus.COMPLETED) {
      throw new BadRequestException(
        'Reviews can only be submitted for completed tasks',
      );
    }

    const acceptedOffer = task.offers[0];
    if (!acceptedOffer) {
      throw new BadRequestException('Task does not have an assigned provider');
    }

    const posterId = task.userId;
    const taskerId = acceptedOffer.userId;

    // Rule 2: Caller must be either poster or tasker
    let targetUserId: string;
    if (currentUserId === posterId) {
      targetUserId = taskerId; // Poster reviews Tasker
    } else if (currentUserId === taskerId) {
      targetUserId = posterId; // Tasker reviews Poster
    } else {
      throw new ForbiddenException(
        'Only the task poster or assigned tasker can review this task',
      );
    }

    // Rule 3: Check for duplicate review
    const existingReview = await this.prisma.review.findUnique({
      where: {
        taskId_fromUserId: {
          taskId,
          fromUserId: currentUserId,
        },
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'You have already submitted a review for this task',
      );
    }

    // Atomic transaction: Create Review + Recalculate target User average rating
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the Review
      const review = await tx.review.create({
        data: {
          rating: dto.rating,
          text: dto.text,
          tags: dto.tags || [],
          taskId,
          fromUserId: currentUserId,
          toUserId: targetUserId,
        },
        include: {
          fromUser: {
            select: { id: true, fullName: true },
          },
          toUser: {
            select: { id: true, fullName: true },
          },
        },
      });

      // 2. Aggregate all reviews received by the target user
      const aggregate = await tx.review.aggregate({
        where: { toUserId: targetUserId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const newAvgRating = aggregate._avg.rating
        ? Math.round(aggregate._avg.rating * 10) / 10
        : 0;
      const totalCount = aggregate._count.rating || 0;

      // 3. Update target User rating metrics
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          rating: newAvgRating,
          reviewCount: totalCount,
        },
      });

      return review;
    });
  }

  // 2. Get all reviews for a specific task
  async findByTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.review.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        toUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }
}
