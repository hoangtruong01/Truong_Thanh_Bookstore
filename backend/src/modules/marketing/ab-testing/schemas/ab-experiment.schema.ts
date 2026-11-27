import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type AbExperimentDocument = AbExperiment & Document;

export enum ExperimentStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

@Schema({ _id: false })
export class ExperimentVariant {
  @Prop({ required: true, trim: true })
  key: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, default: 50, min: 1, max: 100 })
  weight: number;

  @Prop({ type: Object, default: {} })
  payload?: Record<string, any>;
}

export const ExperimentVariantSchema = SchemaFactory.createForClass(ExperimentVariant);

@Schema({ timestamps: true })
export class AbExperiment {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  key: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({
    type: String,
    enum: ExperimentStatus,
    default: ExperimentStatus.DRAFT,
    index: true,
  })
  status: ExperimentStatus;

  @Prop({ type: [ExperimentVariantSchema], default: [] })
  variants: ExperimentVariant[];

  @Prop({
    type: {
      impressions: { type: SchemaTypes.Map, of: Number, default: {} },
      conversions: { type: SchemaTypes.Map, of: Number, default: {} },
      revenue: { type: SchemaTypes.Map, of: Number, default: {} },
    },
    default: () => ({ impressions: {}, conversions: {}, revenue: {} }),
  })
  metrics: {
    impressions: Map<string, number> | Record<string, number>;
    conversions: Map<string, number> | Record<string, number>;
    revenue: Map<string, number> | Record<string, number>;
  };

  @Prop({ default: 'ALL' })
  targetAudience: string;

  @Prop({ default: null })
  winningVariantKey?: string;

  @Prop({ type: Date, default: null })
  startDate?: Date;

  @Prop({ type: Date, default: null })
  endDate?: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const AbExperimentSchema = SchemaFactory.createForClass(AbExperiment);
AbExperimentSchema.index({ status: 1, key: 1 });
