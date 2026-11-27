import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TriggerRestockAlertDto {
  @ApiProperty({ description: 'ID sản phẩm vừa có hàng trở lại' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Số lượng tồn kho mới', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  newStock?: number;
}

export class TriggerPriceDropAlertDto {
  @ApiProperty({ description: 'ID sản phẩm vừa giảm giá' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Giá cũ trước khi giảm', example: 120000 })
  @IsNumber()
  @Min(0)
  oldPrice: number;

  @ApiProperty({ description: 'Giá mới sau khi giảm', example: 95000 })
  @IsNumber()
  @Min(0)
  newPrice: number;
}

export class TriggerAbandonedCartDto {
  @ApiPropertyOptional({ description: 'Thời gian giỏ hàng bị bỏ quên tối thiểu (phút)', default: 120 })
  @IsOptional()
  @IsNumber()
  @Min(30)
  minInactiveMinutes?: number;

  @ApiPropertyOptional({ description: 'Thời gian giỏ hàng tối đa (giờ)', default: 48 })
  @IsOptional()
  @IsNumber()
  maxInactiveHours?: number;
}
