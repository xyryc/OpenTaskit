import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TasksModule } from '../tasks/tasks.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OffersModule } from 'src/offers/offers.module';

@Module({
  imports: [PrismaModule, TasksModule, OffersModule],
  controllers: [UsersController],
})
export class UsersModule {}
