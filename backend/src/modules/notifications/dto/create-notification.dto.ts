import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiPropertyOptional({
    description: 'ID người nhận (nếu để trống là thông báo toàn hệ thống)',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: 'Đơn hàng mới #TTB-123456' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề thông báo không được để trống' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({ example: 'Đơn hàng của bạn đang được chuẩn bị và đóng gói.' })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung thông báo không được để trống' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  message: string;

  @ApiPropertyOptional({
    enum: [
      'order',
      'promotion',
      'loyalty',
      'tier',
      'review',
      'stock',
      'payment',
      'system',
    ],
    default: 'order',
  })
  @IsEnum([
    'order',
    'promotion',
    'loyalty',
    'tier',
    'review',
    'stock',
    'payment',
    'system',
  ])
  @IsOptional()
  type?: string = 'order';

  @ApiPropertyOptional({ example: { orderId: '507f1f77bcf86cd799439011' } })
  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}

export class BroadcastNotificationDto {
  @ApiProperty({ example: 'Khuyến mãi đặc biệt mừng năm học mới!' })
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiProperty({
    example: 'Giảm ngay 20% cho toàn bộ sách giáo khoa và dụng cụ học tập.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  message: string;

  @ApiPropertyOptional({ enum: ['promotion', 'system'], default: 'promotion' })
  @IsEnum(['promotion', 'system'])
  @IsOptional()
  type?: string = 'promotion';

  @ApiPropertyOptional({ example: { promoCode: 'BACK2SCHOOL' } })
  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: [
      'order',
      'promotion',
      'loyalty',
      'tier',
      'review',
      'stock',
      'payment',
      'system',
    ],
  })
  @IsOptional()
  @IsString()
  type?: string;
}
