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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FilterTasksDto } from './dto/filter-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // 1. POST /tasks - Create a Task (Requires JWT Login)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new marketplace task' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(userId, dto);
  }

  // 2. GET /tasks - Marketplace Feed (Public endpoint, no login required)
  @ApiOperation({ summary: 'Browse marketplace tasks with filters and search' })
  @Get()
  findAll(@Query() query: FilterTasksDto) {
    return this.tasksService.findAll(query);
  }

  // 3. GET /tasks/:id - Inspect a single task (Public)
  @ApiOperation({ summary: 'Get single task details by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  // 4. PATCH /tasks/:id - Update Task (Owner or Admin)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a task (Owner or Admin)' })
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

  // 5. DELETE /tasks/:id - Delete a Task (Owner or Admin)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a task (Owner or Admin)' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.tasksService.remove(id, userId, userRole);
  }

  // 6. POST /tasks/:id/save - Save/Bookmark a Task
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bookmark / save a task' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  saveTask(@CurrentUser('id') userId: string, @Param('id') taskId: string) {
    return this.tasksService.saveTask(userId, taskId);
  }

  // 7. DELETE /tasks/:id/save - Remove Bookmark
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove task from bookmarks' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/save')
  unsaveTask(@CurrentUser('id') userId: string, @Param('id') taskId: string) {
    return this.tasksService.unsaveTask(userId, taskId);
  }
}
