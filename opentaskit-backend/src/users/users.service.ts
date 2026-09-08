import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterUsersDto } from './dto/filter-users.dto';
import { Prisma } from '../../generated/prisma/client';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

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

    if (status) {
      where.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { fullName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phoneNumber: { contains: term } },
      ];
    }

    const [data, total, totalUsers, totalAdmins, totalSuspended] =
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
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                tasks: true,
                offers: true,
              },
            },
          },
        }),
        this.prisma.user.count({ where }),
        this.prisma.user.count({ where: { role: 'USER' } }),
        this.prisma.user.count({ where: { role: 'ADMIN' } }),
        this.prisma.user.count({ where: { status: 'SUSPENDED' } }),
      ]);

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
        termsAcceptedAt: true,
        createdAt: true,
        updatedAt: true,
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
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
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
}
