import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Max,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 5, description: 'Đánh giá từ 1 đến 5 sao' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Sản phẩm rất tốt, đóng gói cẩn thận.' })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: ['https://example.com/review1.jpg'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'Sản phẩm dùng tốt sau 1 tuần.' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: ['https://example.com/review1.jpg'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class ModerateReviewDto {
  @ApiProperty({ description: 'Trạng thái hiển thị đánh giá' })
  @IsNotEmpty()
  @IsBoolean()
  isVisible: boolean;
}
