import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsString,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPhoneNumberVN } from '../../../common/validators';

/** SEC-028: giới hạn độ dài mật khẩu (bcrypt cắt ở 72 byte, chuỗi quá dài gây tốn CPU). */
const PASSWORD_MAX_LENGTH = 128;
const FULL_NAME_MAX_LENGTH = 100;
const AVATAR_URL_MAX_LENGTH = 2048;
// Ảnh data URL (frontend gửi ảnh đã nén 400x400) sẽ được upload lên Cloudinary.
const AVATAR_DATA_URL_MAX_LENGTH = 3 * 1024 * 1024;
const AVATAR_DATA_URL_REGEX =
  /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;

export function isValidAvatarValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.startsWith('data:')) {
    return (
      value.length <= AVATAR_DATA_URL_MAX_LENGTH &&
      AVATAR_DATA_URL_REGEX.test(value)
    );
  }
  if (value.length > AVATAR_URL_MAX_LENGTH || /\s/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Avatar hợp lệ: URL http/https (<= 2048 ký tự) hoặc data URL ảnh base64 (sẽ được upload). */
export function IsAvatarValue(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isAvatarValue',
      validator: {
        validate: (value: unknown) => isValidAvatarValue(value),
        defaultMessage: () =>
          'Ảnh đại diện phải là URL http/https hợp lệ (tối đa 2048 ký tự) hoặc ảnh tải lên hợp lệ',
      },
    },
    validationOptions,
  );
}

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @IsString()
  @MaxLength(FULL_NAME_MAX_LENGTH, {
    message: `Họ và tên tối đa ${FULL_NAME_MAX_LENGTH} ký tự`,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`,
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số',
  })
  password: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsPhoneNumberVN()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@truongthanh.vn' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ example: 'Admin@123456' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Mật khẩu tối đa ${PASSWORD_MAX_LENGTH} ký tự`,
  })
  password: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  @MaxLength(FULL_NAME_MAX_LENGTH, {
    message: `Họ và tên tối đa ${FULL_NAME_MAX_LENGTH} ký tự`,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsPhoneNumberVN()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @ApiPropertyOptional({ example: 'data:image/png;base64,...' })
  @IsOptional()
  @IsString()
  @IsAvatarValue()
  avatar?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123' })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  @IsString()
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Mật khẩu hiện tại tối đa ${PASSWORD_MAX_LENGTH} ký tự`,
  })
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Mật khẩu mới tối đa ${PASSWORD_MAX_LENGTH} ký tự`,
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số',
  })
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty({ message: 'Mã OTP không được để trống' })
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm đúng 6 chữ số' })
  otp: string;
}

export class RefreshTokenDto {
  @ApiPropertyOptional({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Mã OTP phải gồm đúng 6 chữ số' })
  otp?: string;

  @ApiPropertyOptional({ example: 'eyJhbGciOiJIUzI1NiIsIn...' })
  @IsOptional()
  @IsString()
  resetToken?: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Mật khẩu mới tối đa ${PASSWORD_MAX_LENGTH} ký tự`,
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số',
  })
  newPassword: string;
}
