import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';
import { DocumentType, DocumentStatus } from '../../../common/enums';

export type ERPDocumentDocument = ERPDocument & Document;

@Schema({ _id: false })
export class DocumentAttachment {
  @Prop({ required: true })
  fileId: string;

  @Prop({ required: true, trim: true })
  fileName: string;

  @Prop({ required: true, trim: true })
  fileUrl: string;

  @Prop({ required: true, trim: true })
  mimeType: string;

  @Prop({ required: true, min: 0 })
  fileSize: number;

  @Prop({ default: Date.now })
  uploadedAt: Date;
}

export const DocumentAttachmentSchema =
  SchemaFactory.createForClass(DocumentAttachment);

@Schema({ _id: false })
export class DocumentAuditLog {
  @Prop({ required: true })
  action: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  actor: Types.ObjectId;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ trim: true })
  note?: string;
}

export const DocumentAuditLogSchema =
  SchemaFactory.createForClass(DocumentAuditLog);

@Schema({ timestamps: true })
export class ERPDocument {
  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  documentNumber: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({
    type: String,
    enum: DocumentType,
    required: true,
    index: true,
  })
  documentType: DocumentType;

  @Prop({
    type: String,
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
    index: true,
  })
  status: DocumentStatus;

  @Prop({ default: Date.now, index: true })
  postingDate: Date;

  @Prop({
    type: String,
    enum: ['SUPPLIER', 'CUSTOMER', 'STAFF', 'ORDER', 'INTERNAL'],
    default: 'INTERNAL',
  })
  entityType: string;

  @Prop({ type: SchemaTypes.ObjectId })
  entityId?: Types.ObjectId;

  @Prop({ trim: true })
  entityName?: string;

  @Prop({ trim: true, uppercase: true, index: true })
  linkedDocumentNumber?: string;

  @Prop({ default: 0 })
  amount?: number;

  @Prop({ type: [DocumentAttachmentSchema], default: [] })
  attachments: DocumentAttachment[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: [DocumentAuditLogSchema], default: [] })
  auditLog: DocumentAuditLog[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;
}

export const ERPDocumentSchema = SchemaFactory.createForClass(ERPDocument);

ERPDocumentSchema.index({ documentNumber: 1 }, { unique: true });
ERPDocumentSchema.index({ documentType: 1, status: 1 });
ERPDocumentSchema.index({ postingDate: -1 });
ERPDocumentSchema.index({ linkedDocumentNumber: 1 });

