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
import { FilterReviewsDto } from './dto/filter-reviews.dto';
import {
  FilterAdminReviewsDto,
  AdminReviewStatusFilter,
} from './dto/filter-admin-reviews.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { Prisma } from '../../generated/prisma/client';

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
            select: { id: true, fullName: true, avatarUrl: true },
          },
          toUser: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          task: {
            select: { id: true, title: true, images: true },
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
            avatarUrl: true,
          },
        },
        toUser: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            images: true,
          },
        },
      },
    });
  }

  // 3. Get reviews received by a specific user with rating metrics
  async findByUser(userId: string, query: FilterReviewsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, rating: true, reviewCount: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [reviews, total, allReviews] = await Promise.all([
      this.prisma.review.findMany({
        where: { toUserId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          task: {
            select: { id: true, title: true, images: true },
          },
        },
      }),
      this.prisma.review.count({
        where: { toUserId: userId },
      }),
      this.prisma.review.findMany({
        where: { toUserId: userId },
        select: { rating: true, tags: true },
      }),
    ]);

    // 5-star distribution breakdown
    const distribution: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    const tagCounts: Record<string, number> = {};

    for (const r of allReviews) {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      }
      for (const tag of r.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        averageRating: user.rating,
        totalReviews: user.reviewCount,
      },
      distribution,
      topTags,
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // 4. Get reviews received and given by authenticated user
  async findMyReviews(
    userId: string,
    type: 'all' | 'received' | 'given' = 'all',
  ) {
    const promises: [Promise<any[]>, Promise<any[]>] = [
      type !== 'given'
        ? this.prisma.review.findMany({
            where: { toUserId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
              fromUser: { select: { id: true, fullName: true, avatarUrl: true } },
              task: { select: { id: true, title: true, images: true } },
            },
          })
        : Promise.resolve([]),
      type !== 'received'
        ? this.prisma.review.findMany({
            where: { fromUserId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
              toUser: { select: { id: true, fullName: true, avatarUrl: true } },
              task: { select: { id: true, title: true, images: true } },
            },
          })
        : Promise.resolve([]),
    ];

    const [received, given] = await Promise.all(promises);

    return {
      received,
      given,
      totalReceived: received.length,
      totalGiven: given.length,
    };
  }

  // 5. Admin List & Filter All Reviews with Summary Metrics
  async findAllAdmin(query: FilterAdminReviewsDto) {
    const {
      search,
      rating,
      status = AdminReviewStatusFilter.ALL,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};

    if (rating) {
      where.rating = rating;
    }

    if (status === AdminReviewStatusFilter.PUBLISHED) {
      where.isHidden = false;
    } else if (status === AdminReviewStatusFilter.HIDDEN) {
      where.isHidden = true;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { text: { contains: term, mode: 'insensitive' } },
        { task: { title: { contains: term, mode: 'insensitive' } } },
        { fromUser: { fullName: { contains: term, mode: 'insensitive' } } },
        { toUser: { fullName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [
      data,
      total,
      totalReviews,
      avgAggregate,
      fiveStarCount,
      hiddenCount,
    ] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromUser: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              role: true,
              email: true,
            },
          },
          toUser: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              role: true,
              email: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              budget: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.count(),
      this.prisma.review.aggregate({
        _avg: { rating: true },
      }),
      this.prisma.review.count({
        where: { rating: 5 },
      }),
      this.prisma.review.count({
        where: { isHidden: true },
      }),
    ]);

    const averageRating = avgAggregate._avg.rating
      ? Math.round(avgAggregate._avg.rating * 10) / 10
      : 5.0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        totalReviews,
        averageRating,
        fiveStarCount,
        hiddenCount,
      },
    };
  }

  // 6. Admin Moderate Review (Hide / Restore)
  async moderate(id: string, dto: ModerateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        isHidden: dto.isHidden,
        moderationReason: dto.moderationReason ?? null,
      },
      include: {
        fromUser: { select: { id: true, fullName: true, avatarUrl: true } },
        toUser: { select: { id: true, fullName: true, avatarUrl: true } },
        task: { select: { id: true, title: true } },
      },
    });

    // Recalculate target user average rating considering only non-hidden reviews
    const aggregate = await this.prisma.review.aggregate({
      where: { toUserId: review.toUserId, isHidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const newAvgRating = aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : 0;
    const totalCount = aggregate._count.rating || 0;

    await this.prisma.user.update({
      where: { id: review.toUserId },
      data: {
        rating: newAvgRating,
        reviewCount: totalCount,
      },
    });

    return updated;
  }

  // 7. Admin Permanently Delete a Review
  async deleteReview(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    await this.prisma.review.delete({
      where: { id },
    });

    // Recalculate target user average rating after review deletion
    const aggregate = await this.prisma.review.aggregate({
      where: { toUserId: review.toUserId, isHidden: false },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const newAvgRating = aggregate._avg.rating
      ? Math.round(aggregate._avg.rating * 10) / 10
      : 0;
    const totalCount = aggregate._count.rating || 0;

    await this.prisma.user.update({
      where: { id: review.toUserId },
      data: {
        rating: newAvgRating,
        reviewCount: totalCount,
      },
    });

    return {
      success: true,
      message: 'Review permanently deleted and user rating recalculated',
    };
  }
}
