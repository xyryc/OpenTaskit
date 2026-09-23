import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { CreateServiceDto } from './dto/create-service.dto';
import { CreatePortfolioItemDto } from './dto/create-portfolio-item.dto';

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

  // GET /users/me/tasks - Tasks posted or assigned to the authenticated user
  @ApiOperation({ summary: "Get authenticated user's posted or assigned tasks" })
  @Get('me/tasks')
  getMyTasks(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
  ) {
    if (type === 'assigned' || type === 'jobs') {
      return this.tasksService.findAssignedTasks(userId);
    }
    return this.tasksService.findMyTasks(userId);
  }

  // GET /users/me/assigned-tasks - Tasks where the authenticated user is the hired tasker
  @ApiOperation({ summary: "Get tasks assigned to the authenticated user" })
  @Get('me/assigned-tasks')
  getMyAssignedTasks(@CurrentUser('id') userId: string) {
    return this.tasksService.findAssignedTasks(userId);
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

  // POST /api/v1/users/me/services - Add a service to the authenticated user profile
  @ApiOperation({ summary: 'Add a service to the authenticated user profile' })
  @Post('me/services')
  addService(@CurrentUser('id') userId: string, @Body() dto: CreateServiceDto) {
    return this.usersService.addService(userId, dto);
  }

  // DELETE /api/v1/users/me/services/:serviceId - Remove one of my services
  @ApiOperation({ summary: 'Remove a service from the authenticated user profile' })
  @Delete('me/services/:serviceId')
  removeService(
    @CurrentUser('id') userId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ) {
    return this.usersService.removeService(userId, serviceId);
  }

  // POST /api/v1/users/me/portfolio - Add a portfolio item to the authenticated user profile
  @ApiOperation({ summary: 'Add a portfolio item to the authenticated user profile' })
  @Post('me/portfolio')
  addPortfolioItem(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePortfolioItemDto,
  ) {
    return this.usersService.addPortfolioItem(userId, dto);
  }

  // DELETE /api/v1/users/me/portfolio/:itemId - Remove one of my portfolio items
  @ApiOperation({ summary: 'Remove a portfolio item from the authenticated user profile' })
  @Delete('me/portfolio/:itemId')
  removePortfolioItem(
    @CurrentUser('id') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.usersService.removePortfolioItem(userId, itemId);
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
