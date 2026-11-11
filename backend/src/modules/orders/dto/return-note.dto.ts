import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Ghi chú tùy chọn khi duyệt trả hàng / xác nhận đã nhận hàng trả.
 * SEC-033: validate kiểu dữ liệu và giới hạn độ dài để tránh payload tùy ý.
 */
export class ReturnNoteDto {
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
