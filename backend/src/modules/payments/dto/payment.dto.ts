import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../../../common/enums';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID đơn hàng' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Mã đơn hàng', example: 'TT260823001' })
  @IsString()
  @IsNotEmpty()
  orderCode: string;

  @ApiProperty({ description: 'Số tiền thanh toán', example: 150000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.COD })
  @IsEnum(PaymentMethod)
  provider: PaymentMethod;
}

export class PaymentCallbackDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  provider: PaymentMethod;

  @ApiProperty({ description: 'Mã giao dịch từ cổng thanh toán' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiPropertyOptional()
  @IsOptional()
  gatewayResponse?: Record<string, any>;
}

export class PaymentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  provider?: PaymentMethod;
}
