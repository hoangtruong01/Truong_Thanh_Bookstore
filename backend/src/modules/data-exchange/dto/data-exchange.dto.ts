import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export interface RowError {
  rowNumber: number;
  column: string;
  field: string;
  value: any;
  message: string;
}

export enum OnDuplicateSkuAction {
  UPDATE = 'UPDATE',
  SKIP = 'SKIP',
  REJECT = 'REJECT',
}

export class ImportOptionsDto {
  @IsOptional()
  @IsBoolean()
  skipErrors?: boolean;

  @IsOptional()
  @IsEnum(OnDuplicateSkuAction)
  onDuplicateSku?: OnDuplicateSkuAction;

  @IsOptional()
  @IsBoolean()
  createCategoryIfMissing?: boolean;

  @IsOptional()
  @IsBoolean()
  allowReimport?: boolean;
}

export interface NormalizedRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: RowError[];
  warnings: string[];
  isValid: boolean;
}

export interface PreviewResult {
  templateType: string;
  fileHash: string;
  isDuplicateFile: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  errors: RowError[];
  warnings: string[];
  previewData: any[];
}

export interface ImportResult {
  batchId: string;
  templateType: string;
  success: boolean;
  partialSuccess: boolean;
  totalRows: number;
  totalProcessed: number;
  successCount: number;
  importedCount: number;
  updatedCount: number;
  failedCount: number;
  skippedCount: number;
  importedCodes: string[];
  errors: RowError[];
}
