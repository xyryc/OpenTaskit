import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetThreadDto } from './dto/get-thread.dto';

@ApiTags('Messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Send a message about a task' })
  @Post('tasks/:taskId/messages')
  create(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(taskId, userId, dto);
  }

  @ApiOperation({ summary: 'Get the message thread for a task' })
  @Get('tasks/:taskId/messages')
  findThread(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @CurrentUser('id') userId: string,
    @Query() query: GetThreadDto,
  ) {
    return this.messagesService.findThread(taskId, userId, query.withUserId);
  }

  @ApiOperation({ summary: "Get the authenticated user's conversation list" })
  @Get('messages/conversations')
  getConversations(@CurrentUser('id') userId: string) {
    return this.messagesService.getConversations(userId);
  }
}
