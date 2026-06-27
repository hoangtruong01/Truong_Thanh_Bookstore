import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@truongthanh.vn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin@123456' })
  @IsNotEmpty()
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'data:image/png;base64,...' })
  @IsOptional()
  avatar?: string;
}

