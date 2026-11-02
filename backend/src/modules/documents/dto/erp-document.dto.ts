import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsMongoId,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType, DocumentStatus } from '../../../common/enums';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateERPDocumentDto {
  @ApiProperty({
    description: 'Tiêu đề chứng từ',
    example: 'Hóa đơn GTGT mua sách NXB Trẻ',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: DocumentType, description: 'Loại chứng từ' })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;

  @ApiPropertyOptional({ description: 'Ngày ghi sổ' })
  @IsOptional()
  postingDate?: Date;

  @ApiPropertyOptional({
    enum: ['SUPPLIER', 'CUSTOMER', 'STAFF', 'ORDER', 'INTERNAL'],
  })
  @IsString()
  @IsOptional()
  entityType?: string;

  @ApiPropertyOptional({ description: 'ID đối tượng liên quan' })
  @IsMongoId()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Tên đối tượng liên quan' })
  @IsString()
  @IsOptional()
  entityName?: string;

  @ApiPropertyOptional({ description: 'Mã chứng từ gốc liên kết' })
  @IsString()
  @IsOptional()
  linkedDocumentNumber?: string;

  @ApiPropertyOptional({ description: 'Số tiền chứng từ', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ description: 'Thông tin bổ sung dạng JSON' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AddAttachmentDto {
  @ApiProperty({ description: 'Tên file', example: 'hoa-don-vat-001.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'URL file đã upload',
    example: 'https://storage.../hoa-don.pdf',
  })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({
    description: 'MIME type của file',
    example: 'application/pdf',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ description: 'Kích thước file (bytes)', minimum: 1 })
  @IsNumber()
  @Min(1)
  fileSize: number;
}

export class ReverseDocumentDto {
  @ApiProperty({
    description: 'Lý do hoàn đảo chứng từ',
    example: 'Sai lệch số tiền hóa đơn',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ERPDocumentQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Tìm theo mã hoặc tiêu đề chứng từ' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: DocumentType })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @ApiPropertyOptional({ enum: DocumentStatus })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;

  @ApiPropertyOptional({ description: 'Phân loại đối tượng' })
  @IsString()
  @IsOptional()
  entityType?: string;
}
