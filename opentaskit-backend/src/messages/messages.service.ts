import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { NotificationType, OfferStatus } from '../../generated/prisma/enums';
import type { Task, Offer } from '../../generated/prisma/client';

const USER_SUMMARY_SELECT = {
  id: true,
  fullName: true,
  avatarUrl: true,
  lastActiveAt: true,
} as const;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  // Resolves who the other party in the conversation is, and authorizes that
  // the requesting user is actually allowed to be part of it.
  //
  // A conversation is scoped to (taskId, counterpart) rather than just
  // taskId, because a task can have several prospective taskers messaging
  // the poster before one is accepted.
  private resolveCounterpart(
    task: Task & { offers: Offer[] },
    userId: string,
    withUserId?: string,
  ): string {
    const isPoster = task.userId === userId;
    const acceptedOffer = task.offers.find(
      (o) => o.status === OfferStatus.ACCEPTED,
    );

    if (acceptedOffer) {
      // Once a tasker is assigned, the conversation pair is fixed.
      if (isPoster) return acceptedOffer.userId;
      if (acceptedOffer.userId === userId) return task.userId;
      throw new ForbiddenException(
        'You are not a participant in this task\'s conversation',
      );
    }

    if (isPoster) {
      if (!withUserId) {
        throw new BadRequestException(
          'This task has no accepted offer yet - specify which applicant to message (withUserId)',
        );
      }
      const hasOffer = task.offers.some((o) => o.userId === withUserId);
      if (!hasOffer) {
        throw new BadRequestException(
          'That user has not made an offer on this task',
        );
      }
      return withUserId;
    }

    // A prospective tasker can only message the poster once they've
    // submitted their own offer on this task.
    const myOffer = task.offers.find((o) => o.userId === userId);
    if (!myOffer) {
      throw new ForbiddenException(
        'You must submit an offer on this task before messaging the poster',
      );
    }
    return task.userId;
  }

  private async getTaskWithOffers(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        offers: true,
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async create(taskId: string, senderId: string, dto: CreateMessageDto) {
    if (!dto.text?.trim() && !dto.attachmentUrl) {
      throw new BadRequestException(
        'A message must include text or an attachment',
      );
    }

    const task = await this.getTaskWithOffers(taskId);
    const receiverId = this.resolveCounterpart(task, senderId, dto.toUserId);

    const message = await this.prisma.message.create({
      data: {
        taskId,
        senderId,
        receiverId,
        text: dto.text?.trim(),
        attachmentUrl: dto.attachmentUrl,
      },
      include: { sender: { select: USER_SUMMARY_SELECT } },
    });

    this.prisma.notification
      .create({
        data: {
          userId: receiverId,
          type: NotificationType.MESSAGE,
          title: `New message from ${message.sender.fullName}`,
          body: dto.text?.trim() || 'Sent a photo',
          taskId,
          // Encodes which specific conversation this is, since a task can
          // have several concurrent pre-assignment threads with different
          // applicants - taskId alone wouldn't be enough to reopen the right
          // one.
          actionUrl: `/(screens)/chat/${taskId}?otherUserId=${senderId}`,
        },
      })
      .catch((err) => console.error('Failed to dispatch message notification:', err));

    return message;
  }

  async findThread(taskId: string, userId: string, withUserId?: string) {
    const task = await this.getTaskWithOffers(taskId);
    const counterpartId = this.resolveCounterpart(task, userId, withUserId);

    const messages = await this.prisma.message.findMany({
      where: {
        taskId,
        OR: [
          { senderId: userId, receiverId: counterpartId },
          { senderId: counterpartId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: USER_SUMMARY_SELECT } },
    });

    await this.prisma.message.updateMany({
      where: {
        taskId,
        senderId: counterpartId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    const otherUser = await this.prisma.user.findUnique({
      where: { id: counterpartId },
      select: USER_SUMMARY_SELECT,
    });

    return {
      task: {
        id: task.id,
        title: task.title,
        status: task.status,
        budget: task.budget,
        address: task.address,
        locationType: task.locationType,
        category: task.category,
      },
      otherUser,
      messages,
    };
  }

  // Lists one row per (task, counterpart) pair the user has exchanged
  // messages in, most recent first - grouping is done in application code
  // since "the other party" is a different column depending on whether the
  // user was the sender or receiver on a given row.
  async getConversations(userId: string) {
    const recentMessages = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        task: { select: { id: true, title: true, status: true, budget: true } },
        sender: { select: USER_SUMMARY_SELECT },
        receiver: { select: USER_SUMMARY_SELECT },
      },
    });

    const unreadCounts = await this.prisma.message.groupBy({
      by: ['taskId', 'senderId'],
      where: { receiverId: userId, isRead: false },
      _count: { _all: true },
    });
    const unreadMap = new Map<string, number>();
    for (const row of unreadCounts) {
      unreadMap.set(`${row.taskId}:${row.senderId}`, row._count._all);
    }

    const conversations = new Map<string, (typeof recentMessages)[number]>();
    for (const message of recentMessages) {
      const otherUserId =
        message.senderId === userId ? message.receiverId : message.senderId;
      const key = `${message.taskId}:${otherUserId}`;
      if (!conversations.has(key)) {
        conversations.set(key, message);
      }
    }

    return Array.from(conversations.entries())
      .map(([key, message]) => {
        const otherUserId =
          message.senderId === userId ? message.receiverId : message.senderId;
        const otherUser =
          message.senderId === userId ? message.receiver : message.sender;
        return {
          taskId: message.taskId,
          task: message.task,
          otherUser,
          lastMessage: {
            id: message.id,
            text: message.text,
            attachmentUrl: message.attachmentUrl,
            senderId: message.senderId,
            isRead: message.isRead,
            createdAt: message.createdAt,
          },
          unreadCount: unreadMap.get(key) ?? 0,
        };
      })
      .sort(
        (a, b) =>
          b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime(),
      );
  }

  // Fast count of all unread messages for the given user across all threads
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
    return { count };
  }
}
