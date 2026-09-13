import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TasksService } from '../tasks/tasks.service';
import { OffersService } from 'src/offers/offers.service';
import { UsersService } from './users.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

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

  // GET /api/v1/users/me - Full authenticated profile with statistics
  @ApiOperation({ summary: 'Get full authenticated user profile and stats' })
  @Get('me')
  getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getMyProfile(userId);
  }

  // PATCH /api/v1/users/me - Update authenticated user profile
  @ApiOperation({ summary: 'Update authenticated user profile' })
  @Patch('me')
  updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMyProfile(userId, dto);
  }

  // GET /api/v1/users/:id/profile - Public Profile Card
  @ApiOperation({ summary: 'Get public user profile card by ID' })
  @Get(':id/profile')
  getPublicProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getPublicProfile(id);
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

  // PATCH /api/v1/users/:id/status - Admin Suspend or Reactivate Account;
  @ApiOperation({ summary: 'Update user account status (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto);
  }

  // PATCH /api/v1/users/:id/role - Admin Update User Role
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto);
  }
}
