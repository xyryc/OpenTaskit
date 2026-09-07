import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TasksService } from '../tasks/tasks.service';
import { OffersService } from 'src/offers/offers.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly offersService: OffersService,
  ) {}

  // GET /users/me/tasks - Tasks posted by the authenticated user
  @ApiOperation({ summary: "Get authenticated user's posted tasks" })
  @Get('me/tasks')
  getMyTasks(@CurrentUser('id') userId: string) {
    return this.tasksService.findMyTasks(userId);
  }

  // GET /users/me/saved-tasks - Tasks bookmarked by the authenticated user
  @ApiOperation({ summary: "Get authenticated user's bookmarked tasks" })
  @Get('me/saved-tasks')
  getMySavedTasks(@CurrentUser('id') userId: string) {
    return this.tasksService.findSavedTasks(userId);
  }

  // GET /users/me/offers - Offers submitted by the authenticated user
  @ApiOperation({ summary: "Get authenticated user's submitted offers/bids" })
  @Get('me/offers')
  getMyOffers(@CurrentUser('id') userId: string) {
    return this.offersService.findMyOffers(userId);
  }
}
