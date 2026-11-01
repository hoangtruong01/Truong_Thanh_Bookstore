import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsEnum,
  Min,
  IsMongoId,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaymentMethod } from '../../../common/enums';
import {
  POSCustomerType,
  POSItemCondition,
  POSOrderStatus,
} from '../schemas/pos-order.schema';

export class CreatePOSOrderItemDto {
  @ApiProperty({
    description: 'ID sản phẩm',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'Product ID không được để trống' })
  @IsMongoId({ message: 'Product ID phải là ObjectId hợp lệ' })
  productId: string;

  @ApiProperty({ description: 'Số lượng mua (theo đơn vị bán)', example: 2 })
  @IsNumber()
  @Min(1, { message: 'Số lượng mua phải lớn hơn hoặc bằng 1' })
  quantity: number;

  @ApiPropertyOptional({ description: 'Đơn vị tính bán', example: 'hộp' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({
    description: 'Tỷ lệ quy đổi về đơn vị tồn gốc',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  conversionRatio?: number;

  @ApiPropertyOptional({
    description: 'Chiết khấu từng dòng (VND)',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    description: 'Đơn giá tùy chỉnh dòng (VND)',
    example: 45000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class POSSplitPaymentItemDto {
  @ApiProperty({
    enum: [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER],
    example: PaymentMethod.CASH,
  })
  @IsEnum([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER], {
    message: 'Hình thức thanh toán split phải là CASH hoặc BANK_TRANSFER',
  })
  method: PaymentMethod;

  @ApiProperty({ description: 'Số tiền thanh toán', example: 200000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    description: 'ID sổ quỹ chỉ định',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'accountId phải là ObjectId hợp lệ' })
  accountId?: string;

  @ApiPropertyOptional({ description: 'Mã tham chiếu / giao dịch ngân hàng' })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class CreatePOSOrderDto {
  @ApiProperty({ type: [CreatePOSOrderItemDto] })
  @IsArray()
  @ArrayNotEmpty({ message: 'Danh sách sản phẩm trong giỏ không được rỗng' })
  @ValidateNested({ each: true })
  @Type(() => CreatePOSOrderItemDto)
  items: CreatePOSOrderItemDto[];

  @ApiPropertyOptional({
    description: 'ID khách hàng (bắt buộc khi bán chịu công nợ)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'customerId phải là ObjectId hợp lệ' })
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Tên khách hàng',
    example: 'Khách lẻ tại quầy',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại khách hàng',
    example: '0901234567',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({
    enum: POSCustomerType,
    default: POSCustomerType.RETAIL,
  })
  @IsOptional()
  @IsEnum(POSCustomerType)
  customerType?: POSCustomerType;

  @ApiPropertyOptional({
    description: 'Tổng số tiền giảm giá trên đơn',
    example: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ enum: ['FIXED', 'PERCENT'], default: 'FIXED' })
  @IsOptional()
  @IsString()
  discountType?: 'FIXED' | 'PERCENT';

  @ApiPropertyOptional({
    description: 'Lý do chiết khấu đơn',
    example: 'Khách quen thân thiết',
  })
  @IsOptional()
  @IsString()
  discountReason?: string;

  @ApiPropertyOptional({
    description: 'ID người quản lý phê duyệt (nếu mức giảm giá tổng > 20%)',
    example: '507f1f77bcf86cd799439099',
  })
  @IsOptional()
  @IsMongoId({ message: 'approvedById phải là ObjectId hợp lệ' })
  approvedById?: string;

  @ApiPropertyOptional({
    description:
      'Mật khẩu của người quản lý phê duyệt (nếu mức giảm giá tổng > 20%)',
    example: 'ManagerPass123@',
  })
  @IsOptional()
  @IsString()
  managerPassword?: string;

  @ApiPropertyOptional({
    description: 'Approval token của người quản lý phê duyệt',
  })
  @IsOptional()
  @IsString()
  approvalToken?: string;

  @ApiPropertyOptional({ description: 'Số tiền khách đưa', example: 200000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashGiven?: number;

  @ApiPropertyOptional({
    description: 'Số tiền trả trước (khi bán chịu nợ một phần)',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @ApiPropertyOptional({
    description: 'Hạn thanh toán công nợ',
    example: '2026-12-01',
  })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({
    enum: [
      PaymentMethod.CASH,
      PaymentMethod.BANK_TRANSFER,
      PaymentMethod.CREDIT,
    ],
    default: PaymentMethod.CASH,
  })
  @IsOptional()
  @IsEnum(
    [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER, PaymentMethod.CREDIT],
    {
      message:
        'Hình thức thanh toán tại quầy phải là CASH, BANK_TRANSFER hoặc CREDIT',
    },
  )
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'ID sổ quỹ chỉ định nhận tiền',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'accountId phải là ObjectId hợp lệ' })
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Chi tiết thanh toán chia tách (Split Payment)',
    type: [POSSplitPaymentItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => POSSplitPaymentItemDto)
  splitPayments?: POSSplitPaymentItemDto[];

  @ApiPropertyOptional({ description: 'Ghi chú đơn hàng quầy' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Khóa chống tạo đơn trùng lặp (Idempotency Key)',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class RefundPOSItemDto {
  @ApiProperty({
    description: 'ID sản phẩm trả lại',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'Product ID không được để trống' })
  @IsMongoId({ message: 'Product ID phải là ObjectId hợp lệ' })
  productId: string;

  @ApiProperty({ description: 'Số lượng trả lại', example: 1 })
  @IsNumber()
  @Min(1, { message: 'Số lượng trả lại phải lớn hơn hoặc bằng 1' })
  quantity: number;

  @ApiPropertyOptional({ description: 'Đơn vị tính hàng trả', example: 'cái' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ enum: POSItemCondition, example: POSItemCondition.GOOD })
  @IsEnum(POSItemCondition, {
    message:
      'Tình trạng hàng trả phải là GOOD (tái nhập kho) hoặc DAMAGED (hàng lỗi/hỏng)',
  })
  condition: POSItemCondition;
}

export class RefundPOSOrderDto {
  @ApiProperty({ type: [RefundPOSItemDto] })
  @IsArray()
  @ArrayNotEmpty({ message: 'Danh sách sản phẩm hoàn trả không được rỗng' })
  @ValidateNested({ each: true })
  @Type(() => RefundPOSItemDto)
  items: RefundPOSItemDto[];

  @ApiProperty({
    description: 'Lý do trả hàng',
    example: 'Khách đổi ý mua nhầm mẫu',
  })
  @IsNotEmpty({ message: 'Bắt buộc nhập lý do trả hàng' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Khóa chống hoàn trả trùng lặp' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}

export class POSOrderQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Mã phiếu, tên khách hoặc SĐT' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'ID nhân viên thu ngân' })
  @IsOptional()
  @IsString()
  cashierId?: string;

  @ApiPropertyOptional({ enum: POSOrderStatus })
  @IsOptional()
  @IsEnum(POSOrderStatus)
  status?: POSOrderStatus;

  @ApiPropertyOptional({
    enum: [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER],
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

export enum POSShift {
  MORNING = 'MORNING', // 06:00 - 12:00
  AFTERNOON = 'AFTERNOON', // 12:00 - 18:00
  EVENING = 'EVENING', // 18:00 - 23:00
  ALL = 'ALL', // 00:00 - 23:59:59
}

export class POSSessionReportQueryDto {
  @ApiPropertyOptional({
    description: 'ID thu ngân (mặc định thu ngân hiện tại nếu là STAFF)',
  })
  @IsOptional()
  @IsString()
  cashierId?: string;

  @ApiPropertyOptional({ description: 'Ngày xem báo cáo (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    enum: POSShift,
    description: 'Ca làm việc (MORNING, AFTERNOON, EVENING, ALL)',
  })
  @IsOptional()
  @IsEnum(POSShift, { message: 'Ca làm việc không hợp lệ' })
  shift?: POSShift;

  @ApiPropertyOptional({ description: 'Giờ bắt đầu tùy chọn (HH:mm)' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Giờ kết thúc tùy chọn (HH:mm)' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Tiền mặt đầu ca (VND)',
    example: 1000000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  openingCash?: number;

  @ApiPropertyOptional({
    description: 'Tiền mặt thực tế kiểm đếm cuối ca (VND)',
    example: 3500000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCash?: number;
}

export class ReconcilePOSQueryDto {
  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  toDate?: string;
}
