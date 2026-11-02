import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsMongoId,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarehouseType, StockTransferStatus } from '../../../common/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateWarehouseDto {
  @ApiProperty({
    description: 'Mã kho (duy nhất, viết hoa)',
    example: 'KHO-TONG',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Tên kho', example: 'Kho Tổng Trường Thành' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: WarehouseType, default: WarehouseType.MAIN })
  @IsEnum(WarehouseType)
  @IsOptional()
  type?: WarehouseType;

  @ApiProperty({
    description: 'Địa chỉ kho',
    example: '123 Nguyễn Huệ, Q1, TP.HCM',
  })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'ID người quản lý kho' })
  @IsMongoId()
  @IsOptional()
  manager?: string;

  @ApiPropertyOptional({ description: 'Đặt làm kho mặc định' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateWarehouseDto {
  @ApiPropertyOptional({ description: 'Tên kho' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: WarehouseType })
  @IsEnum(WarehouseType)
  @IsOptional()
  type?: WarehouseType;

  @ApiPropertyOptional({ description: 'Địa chỉ kho' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'ID người quản lý' })
  @IsMongoId()
  @IsOptional()
  manager?: string;

  @ApiPropertyOptional({ description: 'Đặt làm kho mặc định' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateStockTransferItemDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsMongoId()
  @IsNotEmpty()
  product: string;

  @ApiProperty({ description: 'Số lượng yêu cầu chuyển', minimum: 1 })
  @IsNumber()
  @Min(1)
  requestedQty: number;

  @ApiPropertyOptional({ description: 'Ghi chú từng mặt hàng' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateStockTransferDto {
  @ApiProperty({ description: 'ID kho xuất' })
  @IsMongoId()
  @IsNotEmpty()
  fromWarehouse: string;

  @ApiProperty({ description: 'ID kho nhập' })
  @IsMongoId()
  @IsNotEmpty()
  toWarehouse: string;

  @ApiProperty({ type: [CreateStockTransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockTransferItemDto)
  items: CreateStockTransferItemDto[];

  @ApiPropertyOptional({ description: 'Ghi chú phiếu chuyển kho' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class ReceiveStockTransferItemDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsMongoId()
  @IsNotEmpty()
  product: string;

  @ApiProperty({ description: 'Số lượng thực tế nhận được', minimum: 0 })
  @IsNumber()
  @Min(0)
  receivedQty: number;

  @ApiPropertyOptional({ description: 'Ghi chú khi nhận hàng / lý do hao hụt' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class ReceiveStockTransferDto {
  @ApiProperty({ type: [ReceiveStockTransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveStockTransferItemDto)
  items: ReceiveStockTransferItemDto[];

  @ApiPropertyOptional({ description: 'Ghi chú nhận hàng' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class WarehouseQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Tìm theo mã hoặc tên kho' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: WarehouseType })
  @IsEnum(WarehouseType)
  @IsOptional()
  type?: WarehouseType;

  @ApiPropertyOptional({ description: 'Lọc kho hoạt động' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class StockTransferQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Tìm theo mã phiếu chuyển kho' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Kho xuất' })
  @IsMongoId()
  @IsOptional()
  fromWarehouse?: string;

  @ApiPropertyOptional({ description: 'Kho nhập' })
  @IsMongoId()
  @IsOptional()
  toWarehouse?: string;

  @ApiPropertyOptional({ enum: StockTransferStatus })
  @IsEnum(StockTransferStatus)
  @IsOptional()
  status?: StockTransferStatus;
}
