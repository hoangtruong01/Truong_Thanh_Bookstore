import {
  IsNotEmpty,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
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
  @ValidateNested({ each: true })
  @Type(() => CartSyncItemDto)
  items: CartSyncItemDto[];
}

export class ApplyVoucherDto {
  @ApiProperty({ description: 'Mã giảm giá', example: 'CHAOBANMOI' })
  @IsNotEmpty({ message: 'Mã voucher không được để trống' })
  code: string;
}
