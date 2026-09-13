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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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
}
