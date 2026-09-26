import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { Prisma } from '../../generated/prisma/client';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. list all users
  async findAll(query: FilterUsersDto) {
    const { search, role, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (status === 'ACTIVE' || status === 'SUSPENDED') {
      where.status = status;
    } else if (status === 'PENDING_VERIFICATION') {
      where.kycVerifications = {
        some: { status: 'PENDING' },
      };
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phoneNumber: { contains: term } },
      ];
    }

    const [rows, total, totalUsers, totalAdmins, totalSuspended, totalVerified, totalPendingKyc] =
      await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            role: true,
            status: true,
            avatarUrl: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
            location: true,
            createdAt: true,
            updatedAt: true,
            kycVerifications: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                documentType: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                tasks: true,
                offers: true,
              },
            },
            wallet: {
              select: { availableBalance: true },
            },
          },
        }),
        this.prisma.user.count({ where }),
        this.prisma.user.count({ where: { role: 'USER' } }),
        this.prisma.user.count({ where: { role: 'ADMIN' } }),
        this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
        this.prisma.user.count({ where: { isVerified: true } }),
        this.prisma.kycVerification.count({ where: { status: 'PENDING' } }),
      ]);

    const escrowLockedByUserId = await this.getEscrowLockedByUserId(
      rows.map((u) => u.id),
    );
    const data = rows.map(({ wallet, ...u }) => ({
      ...u,
      walletBalance: wallet?.availableBalance ?? 0,
      escrowLockedBalance: escrowLockedByUserId.get(u.id) ?? 0,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        totalUsers: totalUsers + totalAdmins,
        totalRegularUsers: totalUsers,
        totalAdmins,
        totalSuspended,
        totalVerified,
        totalPendingKyc,
      },
    };
  }

  // 2. Admin Get Single User Details & Activity History
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        avatarUrl: true,
        headline: true,
        bio: true,
        location: true,
        skills: true,
        rating: true,
        reviewCount: true,
        isVerified: true,
        termsAcceptedAt: true,
        createdAt: true,
        updatedAt: true,
        kycVerifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            documentType: true,
            idNumber: true,
            fullName: true,
            frontPhotoUrl: true,
            backPhotoUrl: true,
            selfieUrl: true,
            status: true,
            rejectionReason: true,
            reviewNotes: true,
            createdAt: true,
            reviewedAt: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            offers: true,
            savedTasks: true,
          },
        },
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            budget: true,
            status: true,
            createdAt: true,
            category: {
              select: { id: true, name: true, slug: true, icon: true },
            },
            _count: {
              select: { offers: true },
            },
          },
        },
        offers: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
            task: {
              select: {
                id: true,
                title: true,
                budget: true,
                status: true,
              },
            },
          },
        },
        wallet: {
          select: { availableBalance: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const [tasksCompletedCount, escrowLockedByUserId] = await Promise.all([
      this.prisma.task.count({
        where: {
          offers: {
            some: { userId: id, status: 'ACCEPTED' },
          },
          status: 'COMPLETED',
        },
      }),
      this.getEscrowLockedByUserId([id]),
    ]);

    const { wallet, ...rest } = user;

    return {
      ...rest,
      tasksCompletedCount,
      walletBalance: wallet?.availableBalance ?? 0,
      escrowLockedBalance: escrowLockedByUserId.get(id) ?? 0,
    };
  }

  // Sum of funds currently HELD in escrow for tasks posted by each given
  // user - i.e. money they've paid that hasn't been released or refunded yet.
  private async getEscrowLockedByUserId(
    userIds: string[],
  ): Promise<Map<string, number>> {
    if (userIds.length === 0) {
      return new Map();
    }
    const holds = await this.prisma.escrowHold.findMany({
      where: { status: 'HELD', task: { userId: { in: userIds } } },
      select: { amount: true, task: { select: { userId: true } } },
    });
    const totals = new Map<string, number>();
    for (const hold of holds) {
      totals.set(
        hold.task.userId,
        (totals.get(hold.task.userId) ?? 0) + hold.amount,
      );
    }
    return totals;
  }

  // 3. Admin Update User Status (Suspend / Reactivate)
  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  // 4. Admin Update User Role (Promote / Demote)
  async updateRole(id: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  // 5. Get full authenticated profile with activity stats
  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        avatarUrl: true,
        headline: true,
        bio: true,
        location: true,
        skills: true,
        rating: true,
        reviewCount: true,
        isVerified: true,
        createdAt: true,
        providerServices: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, fromPrice: true, createdAt: true },
        },
        portfolioItems: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, title: true, imageUrl: true, createdAt: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Aggregate user activity statistics
    const [tasksPosted, offersSubmitted, tasksCompleted, unreadNotifications] =
      await Promise.all([
        this.prisma.task.count({ where: { userId } }),
        this.prisma.offer.count({ where: { userId } }),
        this.prisma.task.count({
          where: {
            offers: {
              some: { userId, status: 'ACCEPTED' },
            },
            status: 'COMPLETED',
          },
        }),
        this.prisma.notification.count({
          where: { userId, isRead: false },
        }),
      ]);

    const { providerServices, portfolioItems, ...rest } = user;

    return {
      ...rest,
      services: providerServices,
      portfolio: portfolioItems,
      stats: {
        tasksPosted,
        offersSubmitted,
        tasksCompleted,
        unreadNotifications,
      },
    };
  }

  // 5b. Services & portfolio management for the authenticated user
  async addService(userId: string, dto: CreateServiceDto) {
    return this.prisma.providerService.create({
      data: { userId, name: dto.name.trim(), fromPrice: dto.fromPrice },
    });
  }

  async removeService(userId: string, serviceId: string) {
    const service = await this.prisma.providerService.findUnique({
      where: { id: serviceId },
    });
    if (!service || service.userId !== userId) {
      throw new NotFoundException('Service not found');
    }
    await this.prisma.providerService.delete({ where: { id: serviceId } });
    return { success: true };
  }

  async addPortfolioItem(userId: string, dto: CreatePortfolioItemDto) {
    return this.prisma.portfolioItem.create({
      data: { userId, title: dto.title.trim(), imageUrl: dto.imageUrl },
    });
  }

  async removePortfolioItem(userId: string, itemId: string) {
    const item = await this.prisma.portfolioItem.findUnique({
      where: { id: itemId },
    });
    if (!item || item.userId !== userId) {
      throw new NotFoundException('Portfolio item not found');
    }
    await this.prisma.portfolioItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  // 6. Update authenticated user's profile
  async updateMyProfile(userId: string, dto: UpdateMyProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.headline !== undefined && { headline: dto.headline }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.skills !== undefined && { skills: dto.skills }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        role: true,
        status: true,
        avatarUrl: true,
        headline: true,
        bio: true,
        location: true,
        skills: true,
        rating: true,
        reviewCount: true,
        updatedAt: true,
      },
    });
  }

  // 7. Get public user profile by ID (for tasker/poster profile cards)
  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        headline: true,
        bio: true,
        location: true,
        skills: true,
        rating: true,
        reviewCount: true,
        createdAt: true,
        status: true,
        providerServices: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, fromPrice: true, createdAt: true },
        },
        portfolioItems: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, title: true, imageUrl: true, createdAt: true },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new NotFoundException('User profile not found or inactive');
    }

    // Aggregate public stats & top 3 recent reviews
    const [tasksCompleted, tasksPosted, recentReviews] = await Promise.all([
      this.prisma.task.count({
        where: {
          offers: {
            some: { userId: id, status: 'ACCEPTED' },
          },
          status: 'COMPLETED',
        },
      }),
      this.prisma.task.count({
        where: { userId: id },
      }),
      this.prisma.review.findMany({
        where: { toUserId: id },
        take: 3,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          text: true,
          tags: true,
          createdAt: true,
          fromUser: {
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
      }),
    ]);

    const { status: _status, providerServices, portfolioItems, ...publicData } = user;

    return {
      ...publicData,
      services: providerServices,
      portfolio: portfolioItems,
      memberSince: user.createdAt,
      stats: {
        tasksCompleted,
        tasksPosted,
      },
      recentReviews,
    };
  }
}
