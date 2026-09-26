import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { KycStatus } from '../../generated/prisma/enums';
import { UploadsService } from '../uploads/uploads.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from 'generated/prisma/client';
import { FilterAdminKycDto } from './dto/filter-admin-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

export interface KycUploadFiles {
  frontPhoto?: Express.Multer.File[];
  backPhoto?: Express.Multer.File[];
  selfie?: Express.Multer.File[];
}

@Injectable()
export class KycService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async submit(userId: string, dto: SubmitKycDto, files?: KycUploadFiles) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, isVerified: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Your identity is already verified.');
    }

    // Check if there is already an active pending submission
    const existingPending = await this.prisma.kycVerification.findFirst({
      where: {
        userId,
        status: KycStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new BadRequestException(
        'You already have an identity verification submission under review.',
      );
    }

    // 1. Front photo from file upload or fallback to URL
    let frontPhotoUrl = dto.frontPhotoUrl;
    if (files?.frontPhoto?.[0]) {
      const [uploaded] = await this.uploadsService.uploadFiles(
        [files.frontPhoto[0]],
        'opentaskit/kyc',
      );
      frontPhotoUrl = uploaded;
    }

    if (!frontPhotoUrl) {
      throw new BadRequestException('Front photo of the document is required.');
    }

    // 2. Back photo from file upload or fallback to URL
    let backPhotoUrl = dto.backPhotoUrl;
    if (files?.backPhoto?.[0]) {
      const [uploaded] = await this.uploadsService.uploadFiles(
        [files.backPhoto[0]],
        'opentaskit/kyc',
      );
      backPhotoUrl = uploaded;
    }

    // 3. Selfie photo from file upload or fallback to URL
    let selfieUrl = dto.selfieUrl;
    if (files?.selfie?.[0]) {
      const [uploaded] = await this.uploadsService.uploadFiles(
        [files.selfie[0]],
        'opentaskit/kyc',
      );
      selfieUrl = uploaded;
    }

    const verification = await this.prisma.kycVerification.create({
      data: {
        userId,
        documentType: dto.documentType,
        idNumber: dto.idNumber.trim(),
        fullName: dto.fullName?.trim() || user.fullName,
        dob: dto.dob,
        frontPhotoUrl,
        backPhotoUrl,
        selfieUrl,
        status: KycStatus.PENDING,
      },
    });

    // Notify user
    await this.notificationsService.createNotification({
      userId,
      type: 'SYSTEM',
      title: 'KYC Submitted',
      body: 'Your identity verification documents have been received and are under review by our team.',
      actionUrl: '/(screens)/kyc',
    });

    return verification;
  }

  async getMyKyc(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isVerified: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const latestVerification = await this.prisma.kycVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        idNumber: true,
        fullName: true,
        dob: true,
        frontPhotoUrl: true,
        backPhotoUrl: true,
        selfieUrl: true,
        status: true,
        rejectionReason: true,
        reviewNotes: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      isVerified: user.isVerified,
      status: latestVerification ? latestVerification.status : 'NONE',
      verification: latestVerification || null,
    };
  }

  async findAllAdmin(query: FilterAdminKycDto) {
    const { status, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.KycVerificationWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { idNumber: { contains: term, mode: 'insensitive' } },
        { fullName: { contains: term, mode: 'insensitive' } },
        { user: { fullName: { contains: term, mode: 'insensitive' } } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { phoneNumber: { contains: term } } },
      ];
    }

    const [data, total, pendingCount, verifiedCount, rejectedCount] =
      await Promise.all([
        this.prisma.kycVerification.findMany({
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
                isVerified: true,
              },
            },
            reviewedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.kycVerification.count({ where }),
        this.prisma.kycVerification.count({
          where: { status: KycStatus.PENDING },
        }),
        this.prisma.kycVerification.count({
          where: { status: KycStatus.VERIFIED },
        }),
        this.prisma.kycVerification.count({
          where: { status: KycStatus.REJECTED },
        }),
      ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        pending: pendingCount,
        verified: verifiedCount,
        rejected: rejectedCount,
        total: pendingCount + verifiedCount + rejectedCount,
      },
    };
  }

  async review(id: string, adminId: string, dto: ReviewKycDto) {
    const verification = await this.prisma.kycVerification.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!verification) {
      throw new NotFoundException(
        `KYC verification record with ID ${id} not found`,
      );
    }

    if (dto.status === KycStatus.REJECTED && !dto.rejectionReason?.trim()) {
      throw new BadRequestException(
        'Please provide a rejectionReason when rejecting a verification.',
      );
    }

    const isVerified = dto.status === KycStatus.VERIFIED;

    // Run in a transaction: update KYC record and update User isVerified.
    // createNotification() is a real (already-executing) Promise, not a
    // deferred PrismaPromise, so it can't be a member of this batched
    // array-transaction - it runs after the transaction commits instead.
    const [updatedVerification] = await this.prisma.$transaction([
      this.prisma.kycVerification.update({
        where: { id },
        data: {
          status: dto.status,
          rejectionReason: isVerified ? null : dto.rejectionReason?.trim(),
          reviewNotes: dto.reviewNotes?.trim(),
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified },
      }),
    ]);

    await this.notificationsService
      .createNotification({
        userId: verification.userId,
        type: 'SYSTEM',
        title: isVerified ? 'Identity Verified! 🎉' : 'Verification Update',
        body: isVerified
          ? 'Your identity documents have been approved. Your verified badge is now active on your profile.'
          : `Your identity verification was not approved: ${dto.rejectionReason}. Please review and resubmit.`,
        actionUrl: '/(screens)/kyc',
      })
      .catch((err) => console.error('Failed to dispatch KYC review notification:', err));

    return updatedVerification;
  }
}
