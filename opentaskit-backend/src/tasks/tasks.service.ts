import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FilterTasksDto, TaskStatus } from './dto/filter-tasks.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new task
  async create(userId: string, dto: CreateTaskDto) {
    // 1. Verify category exists in database
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Selected category does not exist');
    }

    // 2. Save task record in Prisma
    return this.prisma.task.create({
      data: {
        ...dto,
        userId,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
      },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        user: { select: { id: true, fullName: true, phoneNumber: true } },
      },
    });
  }

  // 2. Fetch Marketplace Tasks with Filters & Pagination
  async findAll(query: FilterTasksDto) {
    const {
      search,
      categoryId,
      status,
      locationType,
      minBudget,
      maxBudget,
      page = 1,
      limit = 20,
    } = query;

    const skip = (page - 1) * limit;

    // Build dynamic SQL where clause
    const where: any = {
      status: status || TaskStatus.OPEN,
      ...(categoryId && { categoryId }),
      ...(locationType && { locationType }),
      ...((minBudget || maxBudget) && {
        budget: {
          ...(minBudget && { gte: minBudget }),
          ...(maxBudget && { lte: maxBudget }),
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { details: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Run count and query in parallel
    const [total, tasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
          user: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: tasks,
    };
  }
}
