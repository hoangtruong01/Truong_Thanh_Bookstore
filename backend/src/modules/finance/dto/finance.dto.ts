import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsMongoId,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CashAccountType,
  CashAccountStatus,
} from '../schemas/cash-account.schema';
import {
  CashEntryDirection,
  CashEntryCategory,
  CashEntryStatus,
} from '../schemas/cash-entry.schema';
import { SupplierPayableStatus } from '../schemas/supplier-payable.schema';
import { CustomerReceivableStatus } from '../schemas/customer-receivable.schema';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateCashAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã sổ quỹ không được để trống' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên sổ quỹ không được để trống' })
  name: string;

  @IsEnum(CashAccountType, { message: 'Loại sổ quỹ không hợp lệ' })
  type: CashAccountType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingBalance?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateCashAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CashAccountStatus)
  status?: CashAccountStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateCashEntryDto {
  @IsMongoId({ message: 'ID sổ quỹ không hợp lệ' })
  account: string;

  @IsEnum(CashEntryDirection, { message: 'Loại phiếu thu/chi không hợp lệ' })
  direction: CashEntryDirection;

  @IsEnum(CashEntryCategory, { message: 'Danh mục thu/chi không hợp lệ' })
  category: CashEntryCategory;

  @Type(() => Number)
  @IsNumber({}, { message: 'Số tiền phải là số' })
  @Min(1, { message: 'Số tiền phải lớn hơn 0' })
  amount: number;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  partnerName?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class ReverseCashEntryDto {
  @IsString()
  @IsNotEmpty({ message: 'Lý do hoàn đảo phiếu bắt buộc phải có' })
  reason: string;
}

export class CashEntryQueryDto extends PaginationDto {
  @IsOptional()
  @IsMongoId()
  accountId?: string;

  @IsOptional()
  @IsEnum(CashEntryDirection)
  direction?: CashEntryDirection;

  @IsOptional()
  @IsEnum(CashEntryCategory)
  category?: CashEntryCategory;

  @IsOptional()
  @IsEnum(CashEntryStatus)
  status?: CashEntryStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class PaySupplierDto {
  @IsMongoId({ message: 'ID sổ quỹ chi tiền không hợp lệ' })
  accountId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Số tiền thanh toán phải lớn hơn 0' })
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class SupplierPayableQueryDto extends PaginationDto {
  @IsOptional()
  @IsMongoId()
  supplierId?: string;

  @IsOptional()
  @IsEnum(SupplierPayableStatus)
  status?: SupplierPayableStatus;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateCustomerReceivableDto {
  @IsMongoId({ message: 'ID khách hàng không hợp lệ' })
  customerId: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên khách hàng không được để trống' })
  customerName: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsString()
  @IsNotEmpty({ message: 'Mã hóa đơn / đơn hàng không được để trống' })
  invoiceCode: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Tổng tiền phải lớn hơn hoặc bằng 0' })
  totalAmount: number;

  @IsDateString({}, { message: 'Ngày đến hạn không đúng định dạng ISO date' })
  dueDate: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  creditLimit?: number;

  @IsOptional()
  @IsMongoId()
  orderId?: string;

  @IsOptional()
  @IsMongoId()
  posOrderId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CollectCustomerPaymentDto {
  @IsMongoId({ message: 'ID sổ quỹ thu tiền không hợp lệ' })
  accountId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Số tiền thu phải lớn hơn 0' })
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class CustomerReceivableQueryDto extends PaginationDto {
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @IsOptional()
  @IsEnum(CustomerReceivableStatus)
  status?: CustomerReceivableStatus;

  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
