import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TasksService } from '../tasks/tasks.service';
import { OffersService } from 'src/offers/offers.service';
import { UsersService } from './users.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FilterUsersDto } from './dto/filter-users.dto';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
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

  // GET /api/v1/users - Admin User Directory with Search & Pagination;
  @ApiOperation({
    summary: 'List and search users with pagination (Admin only)',
  })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll(@Query() query: FilterUsersDto) {
    return this.usersService.findAll(query);
  }

  // GET /api/v1/users/:id - Admin Get Single User Details & Activity History
  @ApiOperation({
    summary: 'Get single user profile and history by ID (Admin only)',
  })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
