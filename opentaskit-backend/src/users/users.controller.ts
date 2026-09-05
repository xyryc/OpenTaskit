import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TasksService } from '../tasks/tasks.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly tasksService: TasksService) {}

  // GET /users/me/tasks - Tasks posted by the authenticated user
  @Get('me/tasks')
  getMyTasks(@CurrentUser('id') userId: string) {
    return this.tasksService.findMyTasks(userId);
  }

  // GET /users/me/saved-tasks - Tasks bookmarked by the authenticated user
  @Get('me/saved-tasks')
  getMySavedTasks(@CurrentUser('id') userId: string) {
    return this.tasksService.findSavedTasks(userId);
  }
}
