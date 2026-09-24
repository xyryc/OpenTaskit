import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowService } from '../payments/escrow.service';
import { CreateTaskDto, LocationType } from './dto/create-task.dto';
import { FilterTasksDto, TaskStatus } from './dto/filter-tasks.dto';
import { OfferStatus } from '../../generated/prisma/enums';
import { UpdateTaskDto } from './dto/update-task.dto';

function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrowService: EscrowService,
  ) {}

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
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });
  }

  // 2. Fetch Marketplace Tasks with Filters, Geospatial Radius & Pagination
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
      lat,
      lng,
      radiusKm,
      sortBy = 'recommended',
    } = query;

    const skip = (page - 1) * limit;
    const hasCoords =
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng);
    const hasRadius = typeof radiusKm === 'number' && radiusKm > 0;

    const andConditions: any[] = [];

    // Keyword search filter across title, details, and address
    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { details: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // High-performance Bounding Box filter for geospatial coordinates
    if (hasCoords && hasRadius) {
      const deltaLat = radiusKm / 111.0;
      const cosLat = Math.cos((lat * Math.PI) / 180);
      const deltaLng =
        radiusKm / (111.0 * (Math.abs(cosLat) > 0.0001 ? Math.abs(cosLat) : 1));
      const minLat = lat - deltaLat;
      const maxLat = lat + deltaLat;
      const minLng = lng - deltaLng;
      const maxLng = lng + deltaLng;

      if (locationType === LocationType.IN_PERSON) {
        andConditions.push({
          latitude: { gte: minLat, lte: maxLat },
          longitude: { gte: minLng, lte: maxLng },
        });
      } else if (!locationType) {
        // If locationType is not explicitly restricted, allow REMOTE or IN_PERSON within bounding box
        andConditions.push({
          OR: [
            { locationType: LocationType.REMOTE },
            {
              locationType: LocationType.IN_PERSON,
              latitude: { gte: minLat, lte: maxLat },
              longitude: { gte: minLng, lte: maxLng },
            },
          ],
        });
      }
    }

    // Build dynamic SQL where clause
    const where: any = {
      ...(status ? { status } : allStatuses ? {} : { status: TaskStatus.OPEN }),
      ...(categoryId && { categoryId }),
      ...(locationType && (!hasCoords || !hasRadius) && { locationType }),
      ...((minBudget || maxBudget) && {
        budget: {
          ...(minBudget && { gte: minBudget }),
          ...(maxBudget && { lte: maxBudget }),
        },
      }),
      ...(andConditions.length > 0 && { AND: andConditions }),
    };

    // If no coordinates provided, use database-level pagination & ordering
    if (!hasCoords) {
      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'budget_high') orderBy = { budget: 'desc' };
      if (sortBy === 'budget_low') orderBy = { budget: 'asc' };
      if (sortBy === 'latest') orderBy = { createdAt: 'desc' };

      const [total, tasks] = await Promise.all([
        this.prisma.task.count({ where }),
        this.prisma.task.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            category: {
              select: { id: true, name: true, slug: true, icon: true },
            },
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                isVerified: true,
              },
            },
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
        data: tasks.map((t) => ({
          ...t,
          distanceKm: t.locationType === LocationType.REMOTE ? 0 : null,
        })),
      };
    }

    // Geospatial search: fetch candidate tasks in the bounding box, compute exact Haversine distance,
    // filter exact circular radius, and sort accurately
    const candidateTasks = await this.prisma.task.findMany({
      where,
      take: 1000, // Safe bounding box candidate limit
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        _count: {
          select: { offers: true },
        },
      },
    });

    const tasksWithDistance = candidateTasks.map((task) => {
      let distanceKm: number | null = null;
      if (task.locationType === LocationType.REMOTE) {
        distanceKm = 0;
      } else if (
        typeof task.latitude === 'number' &&
        typeof task.longitude === 'number'
      ) {
        distanceKm = calculateHaversineKm(
          lat,
          lng,
          task.latitude,
          task.longitude,
        );
      }
      return {
        ...task,
        distanceKm,
      };
    });

    // Exact circular radius filter (pruning bounding box corners)
    const filteredTasks = hasRadius
      ? tasksWithDistance.filter(
          (t) =>
            t.locationType === LocationType.REMOTE ||
            (t.distanceKm !== null && t.distanceKm <= radiusKm),
        )
      : tasksWithDistance;

    // Sort by requested ordering
    if (sortBy === 'nearest') {
      filteredTasks.sort((a, b) => {
        const distA = a.distanceKm ?? 999999;
        const distB = b.distanceKm ?? 999999;
        return distA - distB;
      });
    } else if (sortBy === 'latest') {
      filteredTasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === 'budget_high') {
      filteredTasks.sort((a, b) => b.budget - a.budget);
    } else if (sortBy === 'budget_low') {
      filteredTasks.sort((a, b) => a.budget - b.budget);
    } else {
      // 'recommended': blend distance and recency
      filteredTasks.sort((a, b) => {
        const distA = a.distanceKm ?? 25;
        const distB = b.distanceKm ?? 25;
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return distA / 10 - distB / 10 + (timeB - timeA) / 1e9;
      });
    }

    const total = filteredTasks.length;
    const paginated = filteredTasks.slice(skip, skip + limit);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: paginated,
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
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        _count: {
          select: { offers: true },
        },
      },
    });
  }

  // Get all tasks assigned to the logged-in user (jobs)
  async findAssignedTasks(userId: string) {
    return this.prisma.task.findMany({
      where: {
        offers: {
          some: {
            userId,
            status: OfferStatus.ACCEPTED,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
        offers: {
          where: {
            status: OfferStatus.ACCEPTED,
          },
          select: {
            id: true,
            amount: true,
            message: true,
            status: true,
            userId: true,
          },
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
            avatarUrl: true,
            isVerified: true,
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
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            isVerified: true,
          },
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

  // 10. Start task (transition from ASSIGNED to IN_PROGRESS)
  async startTask(taskId: string, userId: string, userRole: string) {
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
        `Only assigned tasks can be started. Current status: ${task.status}`,
      );
    }

    // Rule 2: Caller must be the assigned provider or an Admin
    const isAssignedProvider = task.offers.some(
      (offer) => offer.userId === userId,
    );
    const isAdmin = userRole === 'ADMIN';

    if (!isAssignedProvider && !isAdmin) {
      throw new ForbiddenException(
        'Only the assigned tasker can start this task',
      );
    }

    const inProgressTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.IN_PROGRESS },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    return {
      message: 'Task is now in progress',
      task: inProgressTask,
    };
  }

  // 11. Mark task as COMPLETED
  // Two-step handshake: the tasker marks the task done (-> AWAITING_CONFIRMATION),
  // then the poster confirms it (-> COMPLETED). Admins may finalize at either step.
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

    let nextStatus: TaskStatus;

    if (isAdmin) {
      // Admins may push a task to COMPLETED from any active, non-terminal state.
      if (
        task.status !== TaskStatus.IN_PROGRESS &&
        task.status !== TaskStatus.ASSIGNED &&
        task.status !== TaskStatus.AWAITING_CONFIRMATION
      ) {
        throw new BadRequestException(
          `Only in-progress, assigned or awaiting-confirmation tasks can be marked as completed. Current status: ${task.status}`,
        );
      }
      nextStatus = TaskStatus.COMPLETED;
    } else if (isPoster) {
      // The poster's call is a confirmation - the tasker must have marked it done first.
      if (task.status !== TaskStatus.AWAITING_CONFIRMATION) {
        throw new BadRequestException(
          'The tasker must mark this task as done before you can confirm completion',
        );
      }
      nextStatus = TaskStatus.COMPLETED;
    } else {
      // The tasker's call marks the task done and awaits the poster's confirmation.
      if (
        task.status !== TaskStatus.IN_PROGRESS &&
        task.status !== TaskStatus.ASSIGNED
      ) {
        throw new BadRequestException(
          task.status === TaskStatus.AWAITING_CONFIRMATION
            ? 'This task is already awaiting the poster’s confirmation'
            : `Only in-progress or assigned tasks can be marked as done. Current status: ${task.status}`,
        );
      }
      nextStatus = TaskStatus.AWAITING_CONFIRMATION;
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: nextStatus },
      include: {
        category: {
          select: { id: true, name: true, slug: true, icon: true },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            isVerified: true,
          },
        },
      },
    });

    if (nextStatus === TaskStatus.COMPLETED) {
      // No-op if this task was never funded through escrow (cash payment).
      await this.escrowService.releaseForTask(taskId, 'COMPLETION');
    }

    return {
      message:
        nextStatus === TaskStatus.COMPLETED
          ? 'Task marked as completed successfully'
          : 'Task marked as done, awaiting the poster’s confirmation',
      task: updatedTask,
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

    // Rule 4: Once the tasker has started work, only an Admin can cancel
    if (
      userRole !== 'ADMIN' &&
      (task.status === TaskStatus.IN_PROGRESS ||
        task.status === TaskStatus.AWAITING_CONFIRMATION)
    ) {
      throw new BadRequestException(
        'This task has already been started and can no longer be cancelled',
      );
    }

    // Atomic transaction: Cancel task and mark active offers as WITHDRAWN;
    const result = await this.prisma.$transaction(async (tx) => {
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

    // No-op if this task was never funded through escrow (cash payment).
    await this.escrowService.refundForTask(
      taskId,
      'CANCELLATION',
      'Task was cancelled before completion',
    );

    return result;
  }
}
