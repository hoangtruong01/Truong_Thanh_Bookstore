import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CustomerType,
  CustomerCRMTier,
  CarePriority,
} from '../../../common/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class UpdateCustomerCRMProfileDto {
  @ApiPropertyOptional({ enum: CustomerType })
  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @ApiPropertyOptional({ enum: CustomerCRMTier })
  @IsEnum(CustomerCRMTier)
  @IsOptional()
  tier?: CustomerCRMTier;

  @ApiPropertyOptional({ enum: CarePriority })
  @IsEnum(CarePriority)
  @IsOptional()
  carePriority?: CarePriority;

  @ApiPropertyOptional({ description: 'Lý do thay đổi thông tin / hạng thẻ' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Ghi chú chăm sóc' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Khóa / Mở tín dụng' })
  @IsBoolean()
  @IsOptional()
  creditBlocked?: boolean;
}

export class CustomerCRMQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên, email, SĐT' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: CustomerType })
  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @ApiPropertyOptional({ enum: CustomerCRMTier })
  @IsEnum(CustomerCRMTier)
  @IsOptional()
  tier?: CustomerCRMTier;

  @ApiPropertyOptional({ enum: CarePriority })
  @IsEnum(CarePriority)
  @IsOptional()
  carePriority?: CarePriority;
}
