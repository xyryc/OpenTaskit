import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { TasksModule } from '../tasks/tasks.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OffersModule } from 'src/offers/offers.module';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, TasksModule, OffersModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
