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
    // If the authenticated user is an administrator, sync pending platform events
    await this.syncAdminNotifications(userId);

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

  // Helper method to dispatch notifications to all platform administrators
  async notifyAdmins(data: {
    type: NotificationType;
    title: string;
    body: string;
    taskId?: string;
    actionUrl?: string;
  }) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      if (!admins.length) return;

      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: data.type,
          title: data.title,
          body: data.body,
          taskId: data.taskId,
          actionUrl: data.actionUrl,
        })),
      });
    } catch (err) {
      console.error('Failed to notify admins:', err);
    }
  }

  // Auto-sync initial/pending platform events into admin notifications
  private async syncAdminNotifications(adminUserId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: adminUserId },
        select: { role: true },
      });
      if (!user || user.role !== 'ADMIN') return;

      const existing = await this.prisma.notification.findMany({
        where: { userId: adminUserId },
        select: { actionUrl: true, title: true, body: true },
      });

      const toCreate: Array<{
        userId: string;
        type: NotificationType;
        title: string;
        body: string;
        taskId?: string;
        actionUrl?: string;
        createdAt: Date;
      }> = [];

      // 1. Pending KYC submissions
      const pendingKyc = await this.prisma.kycVerification.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true } } },
      });
      for (const kyc of pendingKyc) {
        const title = `KYC Review: ${kyc.user?.fullName || kyc.fullName || 'User'}`;
        if (!existing.some((e) => e.actionUrl === '/kyc' && e.title === title)) {
          toCreate.push({
            userId: adminUserId,
            type: NotificationType.SYSTEM,
            title,
            body: `National ID verification pending (${kyc.documentType} · ID: ${kyc.idNumber}).`,
            actionUrl: '/kyc',
            createdAt: kyc.createdAt,
          });
        }
      }

      // 2. Open Disputes
      const openDisputes = await this.prisma.dispute.findMany({
        where: { status: 'OPEN' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { task: { select: { title: true } } },
      });
      for (const disp of openDisputes) {
        const title = `Dispute Opened #${disp.id.slice(0, 8).toUpperCase()}`;
        if (!existing.some((e) => e.title === title)) {
          toCreate.push({
            userId: adminUserId,
            type: NotificationType.TASK,
            title,
            body: `Arbitration pending on task "${disp.task?.title || 'Task'}".`,
            actionUrl: '/disputes',
            taskId: disp.taskId,
            createdAt: disp.createdAt,
          });
        }
      }

      // 3. Pending Payout Requests
      const pendingPayouts = await this.prisma.payoutRequest.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: { include: { user: { select: { fullName: true } } } },
          bankAccount: { select: { bankName: true } },
        },
      });
      for (const payout of pendingPayouts) {
        const title = `Withdrawal Request: Rs ${payout.amount.toLocaleString()}`;
        const refId = payout.id.slice(0, 8).toUpperCase();
        if (!existing.some((e) => e.title === title && e.body.includes(refId))) {
          toCreate.push({
            userId: adminUserId,
            type: NotificationType.PAYMENT,
            title,
            body: `${payout.wallet?.user?.fullName || 'User'} requested withdrawal to ${payout.bankAccount?.bankName || 'Bank'} (Ref: #${refId}).`,
            actionUrl: '/finance/payouts',
            createdAt: payout.createdAt,
          });
        }
      }

      // 4. Open Problem Reports
      const openReports = await this.prisma.problemReport.findMany({
        where: { status: 'OPEN' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true } } },
      });
      for (const rep of openReports) {
        const refId = rep.id.slice(0, 8).toUpperCase();
        if (!existing.some((e) => e.actionUrl === '/support' && e.body.includes(refId))) {
          toCreate.push({
            userId: adminUserId,
            type: NotificationType.SYSTEM,
            title: `Support Ticket: ${rep.category}`,
            body: `${rep.user?.fullName || 'User'}: ${rep.description.slice(0, 75)}... Ref: #${refId}`,
            actionUrl: '/support',
            createdAt: rep.createdAt,
          });
        }
      }

      if (toCreate.length > 0) {
        await this.prisma.notification.createMany({
          data: toCreate,
        });
      }
    } catch (err) {
      console.error('Error syncing admin notifications:', err);
    }
  }
}
