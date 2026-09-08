import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { FilterTasksDto, TaskStatus } from './dto/filter-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

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
      allStatuses,
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
      ...(status ? { status } : allStatuses ? {} : { status: TaskStatus.OPEN }),
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
          _count: {
            select: { offers: true },
          },
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

  // 3. Get all tasks posted by the logged-in user
  async findMyTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        _count: {
          select: { offers: true },
        },
      },
    });
  }

  // 4. Fetch single task details by ID
  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            createdAt: true,
          },
        },
        _count: {
          select: { offers: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  // 5. Update task details (Owner or Admin only)
  async update(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateTaskDto,
  ) {
    // 1. Find existing task
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 2. Ownership check: Only task creator or Admin can edit
    if (task.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have permission to edit this task',
      );
    }

    // 3. Update task
    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        scheduledDate: dto.scheduledDate
          ? new Date(dto.scheduledDate)
          : undefined,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        user: {
          select: { id: true, fullName: true, phoneNumber: true },
        },
      },
    });
  }

  // 6. Delete / Cancel a task (Owner or Admin only)
  async remove(id: string, userId: string, userRole: string) {
    // 1. Check if task exists
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 2. Ownership check
    if (task.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have permission to delete this task',
      );
    }

    // 3. Delete from database
    await this.prisma.task.delete({ where: { id } });

    return {
      message: 'Task deleted successfully',
      id,
    };
  }

  // 7. Save / Bookmark a task
  async saveTask(userId: string, taskId: string) {
    // Check if task exists
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Upsert prevents duplicate save entries
    await this.prisma.savedTask.upsert({
      where: {
        userId_taskId: {
          userId,
          taskId,
        },
      },
      create: {
        userId,
        taskId,
      },
      update: {},
    });

    return {
      message: 'Task saved successfully',
      taskId,
    };
  }

  // 8. Remove from saved bookmarks
  async unsaveTask(userId: string, taskId: string) {
    await this.prisma.savedTask.deleteMany({
      where: {
        userId,
        taskId,
      },
    });

    return {
      message: 'Task removed from saved bookmarks',
      taskId,
    };
  }

  // 9. Fetch all tasks saved by the logged-in user
  async findSavedTasks(userId: string) {
    const saved = await this.prisma.savedTask.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          include: {
            category: {
              select: { id: true, name: true, slug: true, icon: true },
            },
            user: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
    });

    // Map to return just the task objects
    return saved.map((item) => item.task);
  }

  // 10. Mark task as COMPLETED
  async completeTask(taskId: string, userId: string, userRole: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        offers: {
          where: { status: 'ACCEPTED' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Rule 1: Task must currently be in ASSIGNED status
    if (task.status !== TaskStatus.ASSIGNED) {
      throw new BadRequestException(
        `Only assigned tasks can be marked as completed. Current       
  status: ${task.status}`,
      );
    }

    // Rule 2: Caller must be the task poster, the assigned provider, or an Admin
    const isPoster = task.userId === userId;
    const isAssignedProvider = task.offers.some(
      (offer) => offer.userId === userId,
    );
    const isAdmin = userRole === 'ADMIN';

    if (!isPoster && !isAssignedProvider && !isAdmin) {
      throw new ForbiddenException(
        'Only the task poster or assigned provider can mark this task as completed',
      );
    }

    const completedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.COMPLETED },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        user: {
          select: { id: true, fullName: true, phoneNumber: true },
        },
      },
    });

    return {
      message: 'Task marked as completed successfully',
      task: completedTask,
    };
  }

  // 11. Cancel a task (Owner or Admin only)
  async cancelTask(taskId: string, userId: string, userRole: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Rule 1: Only the task owner or an Admin can cancel
    if (task.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Only the task owner or an admin can cancel this task',
      );
    }

    // Rule 2: Cannot cancel completed task
    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel an already completed task');
    }

    // Rule 3: Cannot cancel already cancelled task
    if (task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException('Task is already cancelled');
    }

    // Atomic transaction: Cancel task and mark active offers as WITHDRAWN;
    return this.prisma.$transaction(async (tx) => {
      const cancelledTask = await tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.CANCELLED },
        include: {
          category: {
            select: { id: true, name: true, slug: true, icon: true },
          },
        },
      });

      // Withdraw any active offers
      await tx.offer.updateMany({
        where: {
          taskId,
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
        data: { status: 'WITHDRAWN' },
      });

      return {
        message: 'Task cancelled successfully',
        task: cancelledTask,
      };
    });
  }
}
