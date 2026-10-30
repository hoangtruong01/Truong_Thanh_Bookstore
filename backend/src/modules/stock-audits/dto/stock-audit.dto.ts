import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockAuditStatus } from '../schemas/stock-audit.schema';
import { IsMongoObjectId } from '../../../common/validators';

export class CreateStockAuditDto {
  @ApiProperty({
    description: 'Tên đợt kiểm kê',
    example: 'Kiểm kê định kỳ Cuối Tháng 10/2026',
  })
  @IsNotEmpty({ message: 'Tiêu đề đợt kiểm kê không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiPropertyOptional({
    description:
      'Danh sách ID sản phẩm cần kiểm kê (nếu để trống sẽ kiểm kê tất cả sản phẩm đang bán)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsMongoObjectId({ each: true, message: 'ID sản phẩm không hợp lệ' })
  productIds?: string[];

  @ApiPropertyOptional({ description: 'Ghi chú đợt kiểm kê' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class SubmitStockAuditItemDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNotEmpty({ message: 'product không được để trống' })
  @IsMongoObjectId({ message: 'product phải là ObjectId hợp lệ' })
  product: string;

  @ApiProperty({
    description: 'Số lượng thực đếm tại quầy/kho',
    example: 98,
  })
  @IsNotEmpty({ message: 'actualStock không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số lượng thực tế phải là số nguyên' })
  @Min(0, { message: 'Số lượng thực tế không được âm' })
  actualStock: number;

  @ApiPropertyOptional({
    description: 'Lý do chênh lệch (thất thoát, hàng hỏng, kiểm đếm nhầm)',
    example: 'Mất mát 2 cây do khách thử bút làm rơi mất',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reason?: string;
}

export class SubmitStockAuditDto {
  @ApiProperty({
    description: 'Danh sách số lượng thực tế kiểm đếm',
    type: [SubmitStockAuditItemDto],
  })
  @IsArray({ message: 'items phải là mảng danh sách' })
  @ArrayMinSize(1, { message: 'Cần nhập số liệu kiểm đếm ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => SubmitStockAuditItemDto)
  items: SubmitStockAuditItemDto[];

  @ApiPropertyOptional({ description: 'Ghi chú kiểm đếm' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class ApproveStockAuditDto {
  @ApiPropertyOptional({ description: 'Ghi chú phê duyệt đợt kiểm kê' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  note?: string;
}

export class RejectStockAuditDto {
  @ApiProperty({
    description: 'Lý do từ chối kết quả kiểm kê',
    example: 'Số liệu chênh lệch bất thường, yêu cầu kiểm đếm lại',
  })
  @IsNotEmpty({ message: 'Lý do từ chối không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reason: string;
}

export class StockAuditQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Tìm theo mã kiểm kê hoặc tiêu đề' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({ enum: StockAuditStatus })
  @IsOptional()
  @IsEnum(StockAuditStatus)
  status?: StockAuditStatus;

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
