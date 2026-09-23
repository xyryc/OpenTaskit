import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LegalService } from './legal.service';
import { UpdateLegalDocumentDto } from './dto/update-legal-document.dto';

@ApiTags('Legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  // GET /api/v1/legal - Public: both documents, used by the admin CMS overview
  @ApiOperation({ summary: 'Get all legal documents' })
  @Get()
  findAll() {
    return this.legalService.findAll();
  }

  // GET /api/v1/legal/:slug - Public: read one document (app screens, pre-login flows)
  @ApiOperation({ summary: 'Get a legal document by slug (terms | privacy)' })
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.legalService.findBySlug(slug);
  }

  // PATCH /api/v1/legal/:slug - Admin only: edit sections and bump the version
  @ApiOperation({ summary: 'Update a legal document (Admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateLegalDocumentDto) {
    return this.legalService.update(slug, dto);
  }
}
