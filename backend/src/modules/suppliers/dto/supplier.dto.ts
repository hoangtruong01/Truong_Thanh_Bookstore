import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsEmail,
  Min,
  IsInt,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { SupplierStatus } from '../schemas/supplier.schema';
import { IsMongoObjectId } from '../../../common/validators';

export class CreateSupplierDto {
  @ApiPropertyOptional({
    description: 'Mã nhà cung cấp (tự động tạo dạng NCC-0001 nếu để trống)',
    example: 'NCC-THIENLONG',
  })
  @IsOptional()
  @IsString({ message: 'Mã nhà cung cấp phải là chuỗi' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code?: string;

  @ApiProperty({
    description: 'Tên nhà cung cấp / công ty',
    example: 'Công ty Cổ phần Tập đoàn Thiên Long',
  })
  @IsNotEmpty({ message: 'Tên nhà cung cấp không được để trống' })
  @IsString({ message: 'Tên nhà cung cấp phải là chuỗi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiPropertyOptional({
    description: 'Người liên hệ đại diện',
    example: 'Nguyễn Văn Đại',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  contactPerson?: string;

  @ApiProperty({
    description: 'Số điện thoại liên hệ',
    example: '0901234567',
  })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @Matches(/^[0-9+\s\-().]{8,20}$/, {
    message: 'Số điện thoại không đúng định dạng',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;

  @ApiPropertyOptional({
    description: 'Email liên hệ',
    example: 'contact@thienlong.com.vn',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email?: string;

  @ApiPropertyOptional({
    description: 'Địa chỉ nhà cung cấp',
    example: 'Lô 6-8-10-12, Đường số 3, KCN Tân Tạo, Q. Bình Tân, TP. HCM',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  address?: string;

  @ApiPropertyOptional({
    description: 'Mã số thuế',
    example: '0301464830',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  taxCode?: string;

  @ApiPropertyOptional({
    enum: SupplierStatus,
    default: SupplierStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(SupplierStatus, {
    message: 'Trạng thái nhà cung cấp không hợp lệ',
  })
  status?: SupplierStatus;

  @ApiPropertyOptional({
    description: 'Ghi chú thêm',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  notes?: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}

export class SupplierQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên, mã NCC, SĐT, người liên hệ',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: SupplierStatus })
  @IsOptional()
  @IsEnum(SupplierStatus)
  status?: SupplierStatus;
}

export class RecordPurchaseDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNotEmpty({ message: 'product không được để trống' })
  @IsMongoObjectId({ message: 'product phải là ObjectId hợp lệ' })
  product: string;

  @ApiProperty({ description: 'Giá mua gần nhất (VND)', example: 5000 })
  @IsNotEmpty({ message: 'lastPurchasePrice không được để trống' })
  @Type(() => Number)
  @Min(0, { message: 'Giá mua không được âm' })
  lastPurchasePrice: number;

  @ApiPropertyOptional({ description: 'Ngày mua' })
  @IsOptional()
  @Type(() => Date)
  lastPurchasedAt?: Date;
}
