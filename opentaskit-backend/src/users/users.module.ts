import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TasksModule } from '../tasks/tasks.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [UsersController],
})
export class UsersModule {}
