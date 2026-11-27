import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  AbExperiment,
  AbExperimentDocument,
  ExperimentStatus,
  ExperimentVariant,
} from './schemas/ab-experiment.schema';
import {
  CreateAbExperimentDto,
  UpdateAbExperimentDto,
  RecordAbImpressionDto,
  RecordAbConversionDto,
} from './dto/ab-experiment.dto';

export interface VariantAssignmentResult {
  experimentKey: string;
  variantKey: string;
  variantName: string;
  payload: Record<string, any>;
  isControl: boolean;
  status: ExperimentStatus;
}

export interface ExperimentAnalyticsVariantResult {
  key: string;
  name: string;
  weight: number;
  impressions: number;
  conversions: number;
  conversionRate: number; // percentage e.g. 3.45%
  revenue: number;
  averageRevenuePerVisitor: number;
  upliftVsControl: number; // percentage uplift relative to control
}

export interface ExperimentAnalyticsResult {
  experimentId: string;
  name: string;
  key: string;
  status: ExperimentStatus;
  variants: ExperimentAnalyticsVariantResult[];
  winningVariantKey?: string;
  totalImpressions: number;
  totalConversions: number;
  totalRevenue: number;
}

@Injectable()
export class AbTestingService {
  private readonly logger = new Logger(AbTestingService.name);

  constructor(
    @InjectModel(AbExperiment.name)
    private readonly experimentModel: Model<AbExperimentDocument>,
  ) {}

  async create(dto: CreateAbExperimentDto, userId?: string): Promise<AbExperimentDocument> {
    const existing = await this.experimentModel.findOne({ key: dto.key.toLowerCase().trim() });
    if (existing) {
      throw new ConflictException(`Thử nghiệm với key "${dto.key}" đã tồn tại.`);
    }

    if (!dto.variants || dto.variants.length < 2) {
      throw new BadRequestException('Thử nghiệm A/B phải có ít nhất 2 biến thể (Control và Variant).');
    }

    const created = new this.experimentModel({
      ...dto,
      key: dto.key.toLowerCase().trim(),
      createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
      metrics: {
        impressions: {},
        conversions: {},
        revenue: {},
      },
    });

    return created.save();
  }

  async findAll(): Promise<AbExperimentDocument[]> {
    return this.experimentModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<AbExperimentDocument> {
    const experiment = await this.experimentModel.findById(id).exec();
    if (!experiment) {
      throw new NotFoundException(`Không tìm thấy thử nghiệm A/B với ID: ${id}`);
    }
    return experiment;
  }

  async findByKey(key: string): Promise<AbExperimentDocument | null> {
    return this.experimentModel.findOne({ key: key.toLowerCase().trim() }).exec();
  }

  async update(id: string, dto: UpdateAbExperimentDto): Promise<AbExperimentDocument> {
    const updated = await this.experimentModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Không tìm thấy thử nghiệm A/B với ID: ${id}`);
    }
    return updated;
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const res = await this.experimentModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException(`Không tìm thấy thử nghiệm A/B với ID: ${id}`);
    }
    return { deleted: true };
  }

  /**
   * Deterministic user-variant bucketing based on hash.
   * Ensures the same distinctId always receives the exact same variant across sessions.
   */
  async assignVariant(experimentKey: string, distinctId: string): Promise<VariantAssignmentResult | null> {
    const experiment = await this.findByKey(experimentKey);
    if (!experiment || !experiment.variants || experiment.variants.length === 0) {
      return null;
    }

    const controlVariant = experiment.variants[0];

    // If experiment is not RUNNING, return control or winning variant
    if (experiment.status !== ExperimentStatus.RUNNING) {
      const activeVariant = experiment.winningVariantKey
        ? experiment.variants.find((v) => v.key === experiment.winningVariantKey) || controlVariant
        : controlVariant;

      return {
        experimentKey: experiment.key,
        variantKey: activeVariant.key,
        variantName: activeVariant.name,
        payload: activeVariant.payload || {},
        isControl: activeVariant.key === controlVariant.key,
        status: experiment.status,
      };
    }

    // Calculate total weight
    const totalWeight = experiment.variants.reduce((sum, v) => sum + (v.weight || 0), 0);
    if (totalWeight <= 0) {
      return {
        experimentKey: experiment.key,
        variantKey: controlVariant.key,
        variantName: controlVariant.name,
        payload: controlVariant.payload || {},
        isControl: true,
        status: experiment.status,
      };
    }

    // Hash distinctId + key into an integer modulo totalWeight
    const hashSeed = `${experiment.key}:${distinctId || 'anonymous'}`;
    const hash = crypto.createHash('md5').update(hashSeed).digest();
    const hashValue = hash.readUInt32BE(0) % totalWeight;

    let cumulative = 0;
    let selectedVariant: ExperimentVariant = controlVariant;

    for (const v of experiment.variants) {
      cumulative += v.weight || 0;
      if (hashValue < cumulative) {
        selectedVariant = v;
        break;
      }
    }

    return {
      experimentKey: experiment.key,
      variantKey: selectedVariant.key,
      variantName: selectedVariant.name,
      payload: selectedVariant.payload || {},
      isControl: selectedVariant.key === controlVariant.key,
      status: experiment.status,
    };
  }

  async recordImpression(dto: RecordAbImpressionDto): Promise<{ success: boolean }> {
    const key = dto.experimentKey.toLowerCase().trim();
    const field = `metrics.impressions.${dto.variantKey}`;

    const updated = await this.experimentModel.findOneAndUpdate(
      { key, status: ExperimentStatus.RUNNING },
      { $inc: { [field]: 1 } },
      { new: true },
    );

    return { success: !!updated };
  }

  async recordConversion(dto: RecordAbConversionDto): Promise<{ success: boolean }> {
    const key = dto.experimentKey.toLowerCase().trim();
    const convField = `metrics.conversions.${dto.variantKey}`;
    const revField = `metrics.revenue.${dto.variantKey}`;

    const updateOps: any = {
      $inc: {
        [convField]: 1,
      },
    };

    if (dto.revenue && dto.revenue > 0) {
      updateOps.$inc[revField] = dto.revenue;
    }

    const updated = await this.experimentModel.findOneAndUpdate(
      { key },
      updateOps,
      { new: true },
    );

    return { success: !!updated };
  }

  async getExperimentResults(idOrKey: string): Promise<ExperimentAnalyticsResult> {
    const isObjectId = Types.ObjectId.isValid(idOrKey);
    const experiment = isObjectId
      ? await this.experimentModel.findById(idOrKey).exec()
      : await this.findByKey(idOrKey);

    if (!experiment) {
      throw new NotFoundException(`Không tìm thấy thử nghiệm với ID/Key: ${idOrKey}`);
    }

    const impressionsMap = experiment.metrics?.impressions instanceof Map
      ? Object.fromEntries(experiment.metrics.impressions)
      : (experiment.metrics?.impressions || {});

    const conversionsMap = experiment.metrics?.conversions instanceof Map
      ? Object.fromEntries(experiment.metrics.conversions)
      : (experiment.metrics?.conversions || {});

    const revenueMap = experiment.metrics?.revenue instanceof Map
      ? Object.fromEntries(experiment.metrics.revenue)
      : (experiment.metrics?.revenue || {});

    const controlVariant = experiment.variants[0];
    const controlImpressions = Number(impressionsMap[controlVariant?.key] || 0);
    const controlConversions = Number(conversionsMap[controlVariant?.key] || 0);
    const controlCr = controlImpressions > 0 ? (controlConversions / controlImpressions) * 100 : 0;

    let totalImpressions = 0;
    let totalConversions = 0;
    let totalRevenue = 0;

    const variantResults: ExperimentAnalyticsVariantResult[] = experiment.variants.map((v) => {
      const imp = Number(impressionsMap[v.key] || 0);
      const conv = Number(conversionsMap[v.key] || 0);
      const rev = Number(revenueMap[v.key] || 0);

      totalImpressions += imp;
      totalConversions += conv;
      totalRevenue += rev;

      const cr = imp > 0 ? (conv / imp) * 100 : 0;
      const arpu = imp > 0 ? rev / imp : 0;

      // Uplift calculation vs control
      let uplift = 0;
      if (controlCr > 0 && v.key !== controlVariant.key) {
        uplift = ((cr - controlCr) / controlCr) * 100;
      }

      return {
        key: v.key,
        name: v.name,
        weight: v.weight,
        impressions: imp,
        conversions: conv,
        conversionRate: Math.round(cr * 100) / 100,
        revenue: rev,
        averageRevenuePerVisitor: Math.round(arpu),
        upliftVsControl: Math.round(uplift * 100) / 100,
      };
    });

    return {
      experimentId: (experiment as any)._id.toString(),
      name: experiment.name,
      key: experiment.key,
      status: experiment.status,
      variants: variantResults,
      winningVariantKey: experiment.winningVariantKey,
      totalImpressions,
      totalConversions,
      totalRevenue,
    };
  }
}
