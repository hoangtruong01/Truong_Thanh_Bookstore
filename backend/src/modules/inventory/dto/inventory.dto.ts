import { IsNotEmpty, IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryTransactionType } from '../../../common/enums';

export class InventoryTransactionDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  product: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdjustInventoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  product: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
