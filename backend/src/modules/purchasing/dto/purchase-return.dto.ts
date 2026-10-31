import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsMongoId,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ItemCondition } from '../schemas/goods-receipt.schema';
import {
  PurchaseReturnStatus,
  CreditAdjustmentStatus,
} from '../schemas/purchase-return.schema';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class PurchaseReturnItemDto {
  @IsMongoId({ message: 'ID sản phẩm không hợp lệ' })
  productId: string;

  @IsString()
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  unit: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Số lượng trả phải lớn hơn hoặc bằng 1' })
  returnedQuantity: number;

  @IsOptional()
  @IsEnum(ItemCondition, { message: 'Tình trạng hàng trả không hợp lệ' })
  condition?: ItemCondition;

  @IsString()
  @IsNotEmpty({ message: 'Lý do trả hàng không được để trống' })
  reason: string;
}

export class CreatePurchaseReturnDto {
  @IsMongoId({ message: 'ID phiếu nhận hàng (GRN) không hợp lệ' })
  goodsReceiptId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Phiếu trả phải có ít nhất 1 dòng sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => PurchaseReturnItemDto)
  items: PurchaseReturnItemDto[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsBoolean()
  applyCreditAdjustmentImmediately?: boolean;
}

export class ConfirmCreditAdjustmentDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  adjustmentAmount?: number;
}

export class PurchaseReturnQueryDto extends PaginationDto {
  @IsOptional()
  @IsMongoId()
  supplierId?: string;

  @IsOptional()
  @IsMongoId()
  goodsReceiptId?: string;

  @IsOptional()
  @IsEnum(PurchaseReturnStatus)
  status?: PurchaseReturnStatus;

  @IsOptional()
  @IsEnum(CreditAdjustmentStatus)
  creditAdjustmentStatus?: CreditAdjustmentStatus;

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
