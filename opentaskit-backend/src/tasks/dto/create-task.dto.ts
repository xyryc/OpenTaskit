import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum LocationType {
  IN_PERSON = 'IN_PERSON',
  REMOTE = 'REMOTE',
}

export enum TimeType {
  ASAP = 'ASAP',
  SPECIFIC_DATE = 'SPECIFIC_DATE',
  FLEXIBLE = 'FLEXIBLE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  WALLET = 'WALLET',
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'Task title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Task description details are required' })
  details: string;

  @IsString()
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId: string;

  /** First item in array (images[0]) acts as the Cover Image */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsEnum(LocationType, {
    message: 'Location type must be IN_PERSON or REMOTE',
  })
  @IsOptional()
  locationType?: LocationType = LocationType.IN_PERSON;

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
  budget: number;

  @IsBoolean()
  @IsOptional()
  isBudgetFlexible?: boolean = false;

  @IsEnum(PaymentMethod, {
    message: 'Payment method must be CASH, CARD, or WALLET',
  })
  @IsOptional()
  paymentMethod?: PaymentMethod = PaymentMethod.CASH;

  @IsEnum(TimeType, {
    message: 'Time type must be ASAP, SPECIFIC_DATE, or FLEXIBLE',
  })
  @IsOptional()
  timeType?: TimeType = TimeType.ASAP;

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @IsOptional()
  scheduledTime?: string;
}
