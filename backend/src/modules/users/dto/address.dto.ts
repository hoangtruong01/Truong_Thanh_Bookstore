import { IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Nhà riêng' })
  @IsNotEmpty({ message: 'Tên nhãn địa chỉ không được để trống' })
  label: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  recipientName: string;

  @ApiProperty({ example: '0901234567' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone: string;

  @ApiProperty({ example: 'Thành phố Hồ Chí Minh' })
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  province: string;

  @ApiProperty({ example: 'Quận 1' })
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  district: string;

  @ApiProperty({ example: 'Phường Bến Nghé' })
  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  ward: string;

  @ApiProperty({ example: '123 Nguyễn Huệ' })
  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được để trống' })
  detail: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Nhà riêng' })
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  recipientName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Thành phố Hồ Chí Minh' })
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ example: 'Quận 1' })
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: 'Phường Bến Nghé' })
  @IsOptional()
  ward?: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Huệ' })
  @IsOptional()
  detail?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
