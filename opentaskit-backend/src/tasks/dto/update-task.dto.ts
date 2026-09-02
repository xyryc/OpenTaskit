import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { LocationType, PaymentMethod, TimeType } from './create-task.dto';
import { TaskStatus } from './filter-tasks.dto';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  details?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsEnum(LocationType, {
    message: 'Location type must be IN_PERSON or REMOTE',
  })
  @IsOptional()
  locationType?: LocationType;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @Min(100, { message: 'Minimum budget is LKR 100' })
  @IsOptional()
  budget?: number;

  @IsBoolean()
  @IsOptional()
  isBudgetFlexible?: boolean;

  @IsEnum(PaymentMethod, {
    message: 'Payment method must be CASH, CARD, or WALLET',
  })
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsEnum(TimeType, {
    message: 'Time type must be ASAP, SPECIFIC_DATE, or FLEXIBLE',
  })
  @IsOptional()
  timeType?: TimeType;

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @IsOptional()
  scheduledTime?: string;

  @IsEnum(TaskStatus, {
    message: 'Status must be OPEN, ASSIGNED, COMPLETED, or CANCELLED',
  })
  @IsOptional()
  status?: TaskStatus;
}
