import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { KycService } from './kyc.service';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FilterAdminKycDto } from './dto/filter-admin-kyc.dto';
import { ReviewKycDto } from './dto/review-kyc.dto';

@ApiTags('KYC & Verification')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @ApiOperation({
    summary: 'Submit identity verification document with image files',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['documentType', 'idNumber'],
      properties: {
        documentType: {
          type: 'string',
          enum: ['NIC', 'DRIVING_LICENSE', 'PASSPORT'],
          example: 'NIC',
        },
        idNumber: { type: 'string', example: '199512345678' },
        fullName: { type: 'string', example: 'Jane Doe' },
        dob: { type: 'string', example: '1995-04-12' },
        frontPhoto: {
          type: 'string',
          format: 'binary',
          description: 'Front photo of the government ID (Required)',
        },
        backPhoto: {
          type: 'string',
          format: 'binary',
          description: 'Back photo of the government ID (Optional)',
        },
        selfie: {
          type: 'string',
          format: 'binary',
          description: 'Liveness / Selfie photo (Optional)',
        },
      },
    },
  })
  @Post('kyc/submit')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'frontPhoto', maxCount: 1 },
      { name: 'backPhoto', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  submit(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitKycDto,
    @UploadedFiles()
    files: {
      frontPhoto?: Express.Multer.File[];
      backPhoto?: Express.Multer.File[];
      selfie?: Express.Multer.File[];
    },
  ) {
    return this.kycService.submit(userId, dto, files);
  }

  @ApiOperation({ summary: 'Get current user identity verification status' })
  @Get('kyc/me')
  getMyKyc(@CurrentUser('id') userId: string) {
    return this.kycService.getMyKyc(userId);
  }

  @ApiOperation({ summary: 'Admin identity verification queue (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/kyc')
  findAllAdmin(@Query() query: FilterAdminKycDto) {
    return this.kycService.findAllAdmin(query);
  }

  @ApiOperation({
    summary: 'Approve or reject a KYC verification (Admin only)',
  })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/kyc/:id/review')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: ReviewKycDto,
  ) {
    return this.kycService.review(id, adminId, dto);
  }
}
