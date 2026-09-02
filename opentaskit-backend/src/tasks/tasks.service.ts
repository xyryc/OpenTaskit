import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

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
}
