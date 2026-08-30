import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  Max,
  IsOptional,
  IsArray,
  IsBoolean,
  IsInt,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 5, description: 'Đánh giá từ 1 đến 5 sao' })
  @IsNotEmpty({ message: 'Số sao đánh giá không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số sao phải là số nguyên từ 1 đến 5' })
  @Min(1, { message: 'Số sao tối thiểu là 1' })
  @Max(5, { message: 'Số sao tối đa là 5' })
  rating: number;

  @ApiProperty({ example: 'Sản phẩm rất tốt, đóng gói cẩn thận.' })
  @IsNotEmpty({ message: 'Nội dung đánh giá không được để trống' })
  @IsString()
  @MinLength(2, { message: 'Nội dung đánh giá phải có ít nhất 2 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
  @Type(() => Number)
  @IsInt({ message: 'Số sao phải là số nguyên từ 1 đến 5' })
  @Min(1, { message: 'Số sao tối thiểu là 1' })
  @Max(5, { message: 'Số sao tối đa là 5' })
  rating?: number;

  @ApiPropertyOptional({ example: 'Sản phẩm dùng tốt sau 1 tuần.' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nội dung đánh giá phải có ít nhất 2 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  content?: string;

  @ApiPropertyOptional({ example: ['https://example.com/review1.jpg'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class ModerateReviewDto {
  @ApiProperty({ description: 'Trạng thái hiển thị đánh giá' })
  @IsNotEmpty({ message: 'isVisible không được để trống' })
  @IsBoolean({ message: 'isVisible phải là boolean' })
  isVisible: boolean;
}

export class AdminReplyReviewDto {
  @ApiProperty({ example: 'Cảm ơn bạn đã ủng hộ Trường Thành Bookstore!' })
  @IsNotEmpty({ message: 'Nội dung phản hồi không được để trống' })
  @IsString()
  @MinLength(2, { message: 'Nội dung phản hồi phải có ít nhất 2 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reply: string;
}

export class ReviewQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Lọc theo ID sản phẩm' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo số sao (1-5)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Lọc theo trạng thái hiển thị' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên khách hàng hoặc nội dung' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
}
