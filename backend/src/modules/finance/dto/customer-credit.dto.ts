import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreditStatus } from '../schemas/customer-credit-profile.schema';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateCustomerCreditProfileDto {
  @IsMongoId({ message: 'ID khách hàng không hợp lệ' })
  @IsNotEmpty({ message: 'customerId không được để trống' })
  customerId: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
  customerName: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Hạn mức nợ phải là số' })
  @Min(0, { message: 'Hạn mức nợ không được âm' })
  creditLimit: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  paymentTermDays?: number;

  @IsOptional()
  @IsEnum(CreditStatus)
  creditStatus?: CreditStatus;

  @IsOptional()
  @IsString()
  creditNote?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateCustomerCreditProfileDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsEnum(CreditStatus)
  creditStatus?: CreditStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  paymentTermDays?: number;

  @IsOptional()
  @IsString()
  creditNote?: string;

  @IsString()
  @IsNotEmpty({
    message: 'Bắt buộc phải nhập lý do điều chỉnh hạn mức/trạng thái',
  })
  reason: string;
}

export class CustomerCreditProfileQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CreditStatus)
  creditStatus?: CreditStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export class AgingReportQueryDto {
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @IsOptional()
  @IsString()
  asOfDate?: string;
}
