import { IsString, IsNotEmpty, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'ID sản phẩm', example: '507f1f77bcf86cd799439011' })
  @IsString()
  @IsNotEmpty({ message: 'productId không được để trống' })
  productId: string;

  @ApiProperty({ description: 'Số lượng mua', example: 1, minimum: 1 })
  @IsNumber()
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'Số lượng mới', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export class CartSyncItemDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Số lượng', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class SyncCartDto {
  @ApiProperty({ description: 'Danh sách sản phẩm cần đồng bộ', type: [CartSyncItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartSyncItemDto)
  items: CartSyncItemDto[];
}
