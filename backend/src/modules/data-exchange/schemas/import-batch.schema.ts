import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ImportBatchDocument = ImportBatch & Document;

export enum ImportBatchStatus {
  COMPLETED = 'COMPLETED',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

@Schema({ timestamps: true })
export class ImportBatch {
  @Prop({ required: true, unique: true, index: true })
  batchId: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true, index: true })
  fileHash: string;

  @Prop({
    required: true,
    index: true,
    enum: ['products', 'suppliers', 'opening_stock'],
  })
  importType: 'products' | 'suppliers' | 'opening_stock';

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  uploadedBy: any;

  @Prop({
    required: true,
    enum: ImportBatchStatus,
    default: ImportBatchStatus.COMPLETED,
  })
  status: ImportBatchStatus;

  @Prop({ required: true, default: 0 })
  totalRows: number;

  @Prop({ required: true, default: 0 })
  successCount: number;

  @Prop({ required: true, default: 0 })
  failedCount: number;

  @Prop({ required: true, default: 0 })
  skippedCount: number;

  @Prop({ required: true, default: false })
  partialSuccess: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  options: Record<string, any>;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  importErrors: Array<{
    rowNumber: number;
    column: string;
    field: string;
    value: any;
    message: string;
  }>;

  @Prop({ type: [String], default: [] })
  importedCodes: string[];
}

export const ImportBatchSchema = SchemaFactory.createForClass(ImportBatch);
ImportBatchSchema.index({ fileHash: 1, importType: 1 });
