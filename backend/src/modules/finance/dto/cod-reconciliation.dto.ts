import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoObjectId } from '../../../common/validators';

export class ReconcileCodItemDto {
  @ApiProperty({
    description: 'Mã vận đơn đối soát của nhà vận chuyển (tracking code)',
    example: 'GHN_TEST_123',
  })
  @IsNotEmpty({ message: 'trackingCode không được để trống' })
  @IsString({ message: 'trackingCode phải là chuỗi ký tự' })
  trackingCode: string;

  @ApiProperty({
    description: 'Số tiền thu hộ COD thực tế theo bảng kê (VND)',
    example: 250000,
  })
  @IsNotEmpty({ message: 'codAmount không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'codAmount phải là số' })
  @Min(0, { message: 'codAmount không được âm' })
  codAmount: number;

  @ApiProperty({
    description: 'Cước phí vận chuyển bị cấn trừ theo bảng kê (VND)',
    example: 22000,
  })
  @IsNotEmpty({ message: 'shippingFee không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'shippingFee phải là số' })
  @Min(0, { message: 'shippingFee không được âm' })
  shippingFee: number;

  @ApiPropertyOptional({
    description: 'Phí vận chuyển hoàn (nếu đơn chuyển hoàn) (VND)',
    example: 10000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'returnFee phải là số' })
  @Min(0, { message: 'returnFee không được âm' })
  returnFee?: number;
}

export class ReconcileCodStatementDto {
  @ApiProperty({
    description: 'Mã bảng kê đối soát từ nhà vận chuyển (duy nhất)',
    example: 'STMT-GHN-20261103-01',
  })
  @IsNotEmpty({ message: 'statementId không được để trống' })
  @IsString({ message: 'statementId phải là chuỗi ký tự' })
  statementId: string;

  @ApiPropertyOptional({
    description: 'Tên đối tác vận chuyển',
    example: 'GHN',
    default: 'GHN',
  })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiProperty({
    description:
      'ID Sổ quỹ ngân hàng nhận tiền chuyển khoản đối soát (CashAccount)',
  })
  @IsNotEmpty({ message: 'bankAccountId không được để trống' })
  @IsMongoObjectId({ message: 'bankAccountId phải là ObjectId hợp lệ' })
  bankAccountId: string;

  @ApiPropertyOptional({
    description: 'Ghi chú cho phiên đối soát',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Danh sách các vận đơn trong bảng kê đối soát',
    type: [ReconcileCodItemDto],
  })
  @IsArray({ message: 'items phải là mảng' })
  @ArrayMinSize(1, { message: 'Bảng kê đối soát phải có ít nhất 1 vận đơn' })
  @ValidateNested({ each: true })
  @Type(() => ReconcileCodItemDto)
  items: ReconcileCodItemDto[];
}
