import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../../../common/enums';
import { IsMongoObjectId } from '../../../common/validators';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID đơn hàng', example: '507f1f77bcf86cd799439011' })
  @IsNotEmpty({ message: 'orderId không được để trống' })
  @IsMongoObjectId({ message: 'orderId phải là ObjectId hợp lệ' })
  orderId: string;

  @ApiProperty({ description: 'Mã đơn hàng', example: 'TT260823001' })
  @IsNotEmpty({ message: 'orderCode không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  orderCode: string;

  @ApiProperty({ description: 'Số tiền thanh toán', example: 150000 })
  @IsNotEmpty({ message: 'amount không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'amount phải là số' })
  @Min(0, { message: 'Số tiền thanh toán không được âm' })
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.COD })
  @IsNotEmpty({ message: 'provider không được để trống' })
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  provider: PaymentMethod;
}

export class PaymentCallbackDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsNotEmpty({ message: 'provider không được để trống' })
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  provider: PaymentMethod;

  @ApiProperty({ description: 'Mã giao dịch từ cổng thanh toán' })
  @IsNotEmpty({ message: 'transactionId không được để trống' })
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  transactionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  gatewayResponse?: Record<string, any>;
}

export class PaymentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoObjectId({ message: 'orderId phải là ObjectId hợp lệ' })
  orderId?: string;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'Trạng thái thanh toán không hợp lệ' })
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  provider?: PaymentMethod;
}
