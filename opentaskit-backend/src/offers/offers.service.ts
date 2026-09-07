import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferStatus, TaskStatus } from '../../generated/prisma/enums';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Submit an offer on a task
  async create(taskId: string, userId: string, dto: CreateOfferDto) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Cannot bid on your own task
    if (task.userId === userId) {
      throw new BadRequestException(
        'You cannot submit an offer on your own task',
      );
    }

    // Can only bid on OPEN tasks
    if (task.status !== TaskStatus.OPEN) {
      throw new BadRequestException(
        'Offers can only be submitted on OPEN tasks',
      );
    }

    // Save or update tasker's offer
    return this.prisma.offer.upsert({
      where: { taskId_userId: { taskId, userId } },
      create: {
        taskId,
        userId,
        amount: dto.amount,
        message: dto.message,
        status: OfferStatus.PENDING,
      },
      update: {
        amount: dto.amount,
        message: dto.message,
        status: OfferStatus.PENDING,
      },
      include: {
        user: { select: { id: true, fullName: true, phoneNumber: true } },
      },
    });
  }

  // 2. Fetch all offers for a specific task
  async findByTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.offer.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            createdAt: true,
          },
        },
      },
    });
  }
}
