import { IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPhoneNumberVN } from '../../../common/validators';

export class CreateAddressDto {
  @ApiProperty({ example: 'Nhà riêng' })
  @IsNotEmpty({ message: 'Tên nhãn địa chỉ không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  label: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  recipientName: string;

  @ApiProperty({ example: '0901234567' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumberVN()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;

  @ApiProperty({ example: 'Thành phố Hồ Chí Minh' })
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  province: string;

  @ApiProperty({ example: 'Quận 1' })
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  district: string;

  @ApiProperty({ example: 'Phường Bến Nghé' })
  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  ward: string;

  @ApiProperty({ example: '123 Nguyễn Huệ' })
  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  detail: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Nhà riêng' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  label?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  recipientName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsPhoneNumberVN()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @ApiPropertyOptional({ example: 'Thành phố Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  province?: string;

  @ApiPropertyOptional({ example: 'Quận 1' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  district?: string;

  @ApiPropertyOptional({ example: 'Phường Bến Nghé' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  ward?: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Huệ' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  detail?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
