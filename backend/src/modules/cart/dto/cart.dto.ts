import {
  IsNotEmpty,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  ArrayMaxSize,
  IsIn,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CART_SYNC_MODES = ['merge', 'replace'] as const;
export type CartSyncMode = (typeof CART_SYNC_MODES)[number];
import { IsMongoObjectId } from '../../../common/validators';

export class AddToCartDto {
  @ApiProperty({
    description: 'ID sản phẩm',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'productId không được để trống' })
  @IsMongoObjectId({ message: 'productId phải là ObjectId hợp lệ' })
  productId: string;

  @ApiProperty({ description: 'Số lượng mua', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mua phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'Số lượng mới', example: 2, minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng mua phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export class CartSyncItemDto {
  @ApiProperty({
    description: 'ID sản phẩm',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'productId không được để trống' })
  @IsMongoObjectId({ message: 'productId phải là ObjectId hợp lệ' })
  productId: string;

  @ApiProperty({ description: 'Số lượng', minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;
}

export class SyncCartDto {
  @ApiProperty({
    description: 'Danh sách sản phẩm cần đồng bộ',
    type: [CartSyncItemDto],
  })
  @IsArray({ message: 'items phải là một danh sách' })
  @ArrayMaxSize(200, { message: 'Giỏ hàng tối đa 200 dòng sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => CartSyncItemDto)
  items: CartSyncItemDto[];

  @ApiPropertyOptional({
    description:
      "'merge' (mặc định): cộng dồn vào giỏ server; 'replace': giỏ server phản chiếu đúng payload",
    enum: CART_SYNC_MODES,
    default: 'merge',
  })
  @IsOptional()
  @IsIn(CART_SYNC_MODES, { message: "mode phải là 'merge' hoặc 'replace'" })
  mode?: CartSyncMode;
}

export class ApplyVoucherDto {
  @ApiProperty({ description: 'Mã giảm giá', example: 'CHAOBANMOI' })
  @IsNotEmpty({ message: 'Mã voucher không được để trống' })
  code: string;
}
