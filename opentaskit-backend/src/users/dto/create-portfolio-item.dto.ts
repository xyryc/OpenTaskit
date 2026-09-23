import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreatePortfolioItemDto {
  @ApiProperty({ example: 'Modern kitchen cabinet installation' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/v1/portfolio.jpg',
  })
  @IsString()
  imageUrl: string;
}
