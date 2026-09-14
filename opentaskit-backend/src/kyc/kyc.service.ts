import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { KycStatus } from '../../generated/prisma/enums';
import { UploadsService } from '../uploads/uploads.service';

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
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'KYC Submitted',
        body: 'Your identity verification documents have been received and are under review by our team.',
        actionUrl: '/(screens)/kyc',
      },
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
}
