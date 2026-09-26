import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from '../push/push-notification.service';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';
import { NotificationType } from '../../generated/prisma/enums';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
  ) {}

  // 1. Fetch notifications for authenticated user
  async findAll(userId: string, query: FilterNotificationsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.NotificationWhereInput = { userId };
    if (query.unreadOnly) {
      whereClause.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({
        where: whereClause,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      unreadCount,
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // 2. Mark a single notification as read
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this notification',
      );
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // 3. Mark all unread notifications as read for authenticated user
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      message: 'All notifications marked as read',
      count: result.count,
    };
  }

  // 4. Delete / Dismiss a single notification
  async remove(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this notification',
      );
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return {
      message: 'Notification deleted successfully',
      id: notificationId,
    };
  }

  // Helper method to dispatch notifications from other backend services
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    taskId?: string;
    actionUrl?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        taskId: data.taskId,
        actionUrl: data.actionUrl,
      },
    });

    // Fire-and-forget: a push failure must never surface to callers of
    // createNotification (offer/message/dispute/kyc flows all depend on it).
    this.pushService
      .sendToUser(data.userId, {
        title: data.title,
        body: data.body,
        data: {
          type: data.type,
          taskId: data.taskId ?? '',
          actionUrl: data.actionUrl ?? '',
          notificationId: notification.id,
        },
      })
      .catch((err) => console.error('Push dispatch failed:', err));

    return notification;
  }
}
