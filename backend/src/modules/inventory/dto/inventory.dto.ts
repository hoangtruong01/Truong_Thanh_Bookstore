import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  IsInt,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryTransactionType } from '../../../common/enums';
import { IsMongoObjectId } from '../../../common/validators';

export class InventoryTransactionDto {
  @ApiProperty({ description: 'ID sản phẩm', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty({ message: 'product không được để trống' })
  @IsMongoObjectId({ message: 'product phải là ObjectId hợp lệ' })
  product: string;

  @ApiProperty({ description: 'Số lượng giao dịch', example: 10 })
  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;

  @ApiPropertyOptional({ enum: InventoryTransactionType, default: InventoryTransactionType.IMPORT })
  @IsOptional()
  @IsEnum(InventoryTransactionType, { message: 'Loại giao dịch kho không hợp lệ' })
  type?: InventoryTransactionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class AdjustInventoryDto {
  @ApiProperty({ description: 'ID sản phẩm', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty({ message: 'product không được để trống' })
  @IsMongoObjectId({ message: 'product phải là ObjectId hợp lệ' })
  product: string;

  @ApiProperty({ description: 'Số lượng điều chỉnh (có thể âm hoặc dương)', example: -5 })
  @IsNotEmpty({ message: 'Số lượng điều chỉnh không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng điều chỉnh phải là số nguyên' })
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}
