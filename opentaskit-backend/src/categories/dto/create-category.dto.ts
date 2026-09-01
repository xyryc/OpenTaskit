import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name: string;

  @IsString()
  @IsOptional()
  slug?: string; // e.g. "cleaning" (if not sent, service will generate it automatically)

  @IsString()
  @IsOptional()
  icon?: string; // e.g. "broom" or icon URL

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
