import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferStatus, TaskStatus } from '../../generated/prisma/enums';
import { UpdateOfferDto } from './dto/update-offer.dto';

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

  // 3. Poster accepts an offer
  async accept(offerId: string, posterId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { task: true },
    });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Rule A: Only the task poster can accept offers
    if (offer.task.userId !== posterId) {
      throw new ForbiddenException('Only the task owner can accept offers');
    }

    // Rule B: Can only accept on OPEN tasks
    if (offer.task.status !== TaskStatus.OPEN) {
      throw new BadRequestException(
        'This task is no longer open for assignment',
      );
    }

    // Atomic transaction: Accept chosen offer, reject others, assign task
    return this.prisma.$transaction(async (tx) => {
      // 1. Mark this offer as ACCEPTED
      const acceptedOffer = await tx.offer.update({
        where: { id: offerId },
        data: { status: OfferStatus.ACCEPTED },
      });

      // 2. Mark all competing offers for this task as REJECTED
      await tx.offer.updateMany({
        where: {
          taskId: offer.taskId,
          id: { not: offerId },
        },
        data: { status: OfferStatus.REJECTED },
      });

      // 3. Update Task status to ASSIGNED
      await tx.task.update({
        where: { id: offer.taskId },
        data: { status: TaskStatus.ASSIGNED },
      });

      return {
        message: 'Offer accepted successfully. Task is now assigned.',
        offer: acceptedOffer,
      };
    });
  }

  // 4. Tasker withdraws an offer
  async withdraw(offerId: string, userId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { task: true },
    });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Ownership check: only the bidder can withdraw
    if (offer.userId !== userId) {
      throw new ForbiddenException('You can only withdraw your own offer');
    }

    // Cannot withdraw if the task is already assigned or completed
    if (offer.task.status !== TaskStatus.OPEN) {
      throw new BadRequestException(
        'Cannot withdraw an offer on an assigned or closed task',
      );
    }

    await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: OfferStatus.WITHDRAWN },
    });

    return {
      message: 'Offer withdrawn successfully',
      offerId,
    };
  }

  // 5. Fetch all offers submitted by the current tasker
  async findMyOffers(userId: string) {
    return this.prisma.offer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            budget: true,
            status: true,
            address: true,
            locationType: true,
          },
        },
      },
    });
  }

  // 6. Tasker updates their existing pending offer
  async update(offerId: string, userId: string, dto: UpdateOfferDto) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { task: true },
    });

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    // Rule 1: Only the tasker who created the offer can edit it
    if (offer.userId !== userId) {
      throw new ForbiddenException('You can only edit your own offer');
    }

    // Rule 2: Offer must still be PENDING
    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Only pending offers can be edited');
    }

    // Rule 3: The task must still be OPEN
    if (offer.task.status !== TaskStatus.OPEN) {
      throw new BadRequestException(
        'Cannot edit an offer on a task that is no longer open',
      );
    }

    return this.prisma.offer.update({
      where: { id: offerId },
      data: {
        amount: dto.amount !== undefined ? dto.amount : offer.amount,
        message: dto.message !== undefined ? dto.message : offer.message,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            budget: true,
            status: true,
          },
        },
      },
    });
  }
}
