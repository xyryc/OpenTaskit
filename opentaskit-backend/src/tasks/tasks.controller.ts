import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // POST /tasks - Create a Task (Requires JWT Login)
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(userId, dto);
  }

  // GET /tasks - Marketplace Feed (Public endpoint, no login required)
  @Get()
  findAll(@Query() query: FilterTasksDto) {
    return this.tasksService.findAll(query);
  }

  // GET /tasks/my - Fetch authenticated user's posted tasks
  @UseGuards(JwtAuthGuard)
  @Get('my')
  findMyTasks(@CurrentUser('id') userId: string) {
    return this.tasksService.findMyTasks(userId);
  }

  // GET /tasks/:id - Inspect a single task (Public)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // PATCH /tasks/:id - Update Task (Owner or Admin)
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, userId, userRole, dto);
  }

  // DELETE /tasks/:id - Delete a Task (Owner or Admin)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.tasksService.remove(id, userId, userRole);
  }

  // POST /tasks/:id/save - Save/Bookmark a Task
  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  saveTask(@CurrentUser('id') userId: string, @Param('id') taskId: string) {
    return this.tasksService.saveTask(userId, taskId);
  }

  // DELETE /tasks/:id/save - Remove Bookmark
  @UseGuards(JwtAuthGuard)
  @Delete(':id/save')
  unsaveTask(@CurrentUser('id') userId: string, @Param('id') taskId: string) {
    return this.tasksService.unsaveTask(userId, taskId);
  }
}
