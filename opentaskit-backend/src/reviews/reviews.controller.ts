import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Get,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FilterReviewsDto } from './dto/filter-reviews.dto';
import { FilterAdminReviewsDto } from './dto/filter-admin-reviews.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit a review for a completed task' })
  @UseGuards(JwtAuthGuard)
  @Post('tasks/:taskId/reviews')
  create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(taskId, userId, dto);
  }

  @ApiOperation({ summary: 'Get all reviews attached to a specific task' })
  @Get('tasks/:taskId/reviews')
  findByTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.reviewsService.findByTask(taskId);
  }

  @ApiOperation({
    summary: 'Get reviews received by a user with rating metrics',
  })
  @Get('users/:userId/reviews')
  findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: FilterReviewsDto,
  ) {
    return this.reviewsService.findByUser(userId, query);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get reviews received and given by authenticated user',
  })
  @UseGuards(JwtAuthGuard)
  @Get('reviews/me')
  findMyReviews(
    @CurrentUser('id') userId: string,
    @Query('type') type?: 'all' | 'received' | 'given',
  ) {
    return this.reviewsService.findMyReviews(userId, type);
  }

  // GET /api/v1/admin/reviews - Admin list all reviews with metrics
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List and filter all reviews platform-wide (Admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/reviews')
  findAllAdmin(@Query() query: FilterAdminReviewsDto) {
    return this.reviewsService.findAllAdmin(query);
  }

  // PATCH /api/v1/admin/reviews/:id/moderate - Admin moderate review (hide / restore)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Hide or restore a review with moderation notes (Admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/reviews/:id/moderate')
  moderate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(id, dto);
  }

  // DELETE /api/v1/admin/reviews/:id - Admin delete review
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Permanently delete a review and recalculate rating (Admin only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('admin/reviews/:id')
  deleteReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.deleteReview(id);
  }
}
