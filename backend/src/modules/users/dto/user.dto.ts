import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, StaffPermission } from '../../../common/enums';
import { IsPhoneNumberVN } from '../../../common/validators/custom-validators';

/**
 * FEAT-001: ValidationPipe bật enableImplicitConversion, nên class-transformer
 * gọi Boolean(value) TRƯỚC @Transform ("false" -> true). Vì vậy phải đọc giá trị
 * gốc từ obj[key]. Giá trị không hợp lệ được giữ nguyên để @IsBoolean từ chối.
 */
const toStrictBoolean = ({
  obj,
  key,
}: {
  obj: Record<string, unknown>;
  key: string;
}): unknown => {
  const raw = obj?.[key];
  if (raw === true || raw === 'true' || raw === 1 || raw === '1') return true;
  if (raw === false || raw === 'false' || raw === 0 || raw === '0')
    return false;
  return raw;
};

export class CreateStaffUserDto {
  @ApiProperty({ example: 'Nguyễn Văn Nhân Viên' })
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @MinLength(2, { message: 'Họ và tên phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  fullName: string;

  @ApiProperty({ example: 'staff@truongthanh.vn' })
  @IsEmail({}, { message: 'Email không đúng định dạng hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @ApiProperty({ example: 'Staff@123456' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có độ dài tối thiểu 8 ký tự' })
  // bcrypt bỏ qua phần vượt quá 72 byte
  @MaxLength(72, { message: 'Mật khẩu không được vượt quá 72 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  })
  password: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsPhoneNumberVN({
    message:
      'Số điện thoại Việt Nam không hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08, 09 hoặc +84)',
  })
  phone?: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.STAFF })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò người dùng không hợp lệ' })
  role?: UserRole;

  @ApiPropertyOptional({
    enum: StaffPermission,
    isArray: true,
    example: [StaffPermission.MANAGE_ORDERS, StaffPermission.VIEW_REPORTS],
  })
  @IsOptional()
  @IsArray({ message: 'Danh sách quyền phải là một mảng' })
  @IsEnum(StaffPermission, {
    each: true,
    message: 'Quyền nhân viên không hợp lệ',
  })
  permissions?: StaffPermission[];
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.STAFF })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  @IsEnum(UserRole, { message: 'Vai trò người dùng không hợp lệ' })
  role: UserRole;
}

export class UpdateUserPermissionsDto {
  @ApiProperty({
    enum: StaffPermission,
    isArray: true,
    example: [StaffPermission.MANAGE_ORDERS, StaffPermission.MANAGE_PRODUCTS],
  })
  @IsArray({ message: 'Danh sách quyền phải là một mảng' })
  @IsEnum(StaffPermission, {
    each: true,
    message: 'Quyền nhân viên không hợp lệ',
  })
  permissions: StaffPermission[];
}

export class UpdateUserStatusDto {
  @ApiProperty({ example: true })
  @Transform(toStrictBoolean)
  @IsBoolean({ message: 'Trạng thái phải là boolean (true/false)' })
  status: boolean;
}

export class UserQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang tối thiểu là 1' })
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng phần tử mỗi trang phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  @Max(100, { message: 'Số lượng tối đa mỗi trang là 100' })
  limit?: number = 10;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò lọc không hợp lệ' })
  role?: UserRole;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toStrictBoolean)
  @IsBoolean({ message: 'Trạng thái lọc phải là boolean' })
  status?: boolean;

  @ApiPropertyOptional({ example: 'admin' })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;
}
