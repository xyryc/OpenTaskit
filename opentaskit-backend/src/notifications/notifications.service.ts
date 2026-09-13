import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';
import { NotificationType } from '../../generated/prisma/enums';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Fetch notifications for authenticated user
  async findAll(userId: string, query: FilterNotificationsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };
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

  // Helper method to dispatch notifications from any service in the backend
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    taskId?: string;
    actionUrl?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        taskId: data.taskId,
        actionUrl: data.actionUrl,
      },
    });
  }
}
