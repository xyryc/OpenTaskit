import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { FilterReportsDto } from './dto/filter-reports.dto';
import { Prisma } from '../../generated/prisma/client';
import { NotificationType, ReportStatus } from '../../generated/prisma/enums';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // 1. User submits a problem report
  async create(userId: string, dto: CreateReportDto) {
    const report = await this.prisma.problemReport.create({
      data: {
        userId,
        category: dto.category,
        description: dto.description.trim(),
        taskRef: dto.taskRef?.trim() || null,
        images: dto.images || [],
        status: ReportStatus.OPEN,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.notificationsService
      .notifyAdmins({
        type: NotificationType.SYSTEM,
        title: `Support Ticket: ${report.category}`,
        body: `${report.user?.fullName || 'User'} reported an issue: ${dto.description.slice(0, 75)}... (Ref: #${report.id.slice(0, 8).toUpperCase()})`,
        actionUrl: '/support',
      })
      .catch(() => null);

    return report;
  }

  // 1b. User queries their own reports
  async findMyReports(userId: string) {
    return this.prisma.problemReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 2. Admin queries all problem reports with filtering and pagination
  async findAllAdmin(query: FilterReportsDto) {
    const { status, category, search, page = 1, limit = 15 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProblemReportWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { description: { contains: term, mode: 'insensitive' } },
        { taskRef: { contains: term, mode: 'insensitive' } },
        { adminNotes: { contains: term, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { fullName: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
              { phoneNumber: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.problemReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.problemReport.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // 3. Admin gets a single report detail
  async findOneAdmin(id: string) {
    const report = await this.prisma.problemReport.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Problem report with ID ${id} not found`);
    }

    return report;
  }

  // 4. Admin updates report status and resolution notes
  async updateAdmin(id: string, adminId: string, dto: UpdateReportDto) {
    const existing = await this.prisma.problemReport.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Problem report with ID ${id} not found`);
    }

    const isResolving =
      dto.status === ReportStatus.RESOLVED || dto.status === ReportStatus.DISMISSED;

    return this.prisma.problemReport.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.adminNotes !== undefined && { adminNotes: dto.adminNotes.trim() }),
        ...(isResolving && {
          resolvedBy: adminId,
          resolvedAt: new Date(),
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
