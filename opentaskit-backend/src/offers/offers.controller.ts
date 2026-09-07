import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Offers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  // POST /api/v1/tasks/:taskId/offers - Submit an Offer
  @ApiOperation({ summary: 'Submit an offer/bid on a task' })
  @Post('tasks/:taskId/offers')
  create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOfferDto,
  ) {
    return this.offersService.create(taskId, userId, dto);
  }

  // GET /api/v1/tasks/:taskId/offers - Fetch all offers for a task;
  @ApiOperation({ summary: 'Get all offers submitted for a specific task' })
  @Get('tasks/:taskId/offers')
  findByTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.offersService.findByTask(taskId);
  }

  // POST /api/v1/offers/:offerId/accept - Accept an offer
  @ApiOperation({ summary: 'Accept a task offer (Poster only)' })
  @Post('offers/:offerId/accept')
  accept(
    @Param('offerId', ParseUUIDPipe) offerId: string,
    @CurrentUser('id') posterId: string,
  ) {
    return this.offersService.accept(offerId, posterId);
  }
}
