import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AdsPerformance,
  AdsPerformanceDocument,
} from './schemas/ads-performance.schema';
import {
  RecordAdPerformanceDto,
  QueryAdPerformanceDto,
  MapAdCampaignDto,
} from './dto/ads.dto';
import { Order, OrderDocument } from '../../orders/schemas/order.schema';

@Injectable()
export class AdsService {
  constructor(
    @InjectModel(AdsPerformance.name)
    private adsModel: Model<AdsPerformanceDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
  ) {}

  private normalizeDate(dateStr: string): Date {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      throw new BadRequestException('Ngày báo cáo không hợp lệ');
    }
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  // Record or update daily ad performance idempotently (ADS-01)
  async recordPerformance(
    dto: RecordAdPerformanceDto,
  ): Promise<AdsPerformance> {
    const normalizedDate = this.normalizeDate(dto.date);

    return this.adsModel
      .findOneAndUpdate(
        {
          platform: dto.platform,
          adAccountId: dto.adAccountId,
          campaignId: dto.campaignId,
          date: normalizedDate,
        },
        {
          $set: {
            campaignName: dto.campaignName,
            internalCampaignCode: dto.internalCampaignCode,
            spend: dto.spend,
            currency: dto.currency || 'VND',
            impressions: dto.impressions,
            clicks: dto.clicks,
            providerConversions: dto.providerConversions || 0,
            providerConversionValue: dto.providerConversionValue || 0,
            isArchived: false,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async findAll(query?: QueryAdPerformanceDto): Promise<{
    items: AdsPerformance[];
    summary: {
      totalSpend: number;
      totalImpressions: number;
      totalClicks: number;
      totalProviderConversions: number;
      totalProviderConversionValue: number;
      ctrPercentage: number;
      cpcVnd: number;
    };
  }> {
    const filter: any = { isArchived: false };

    if (query?.platform) {
      filter.platform = query.platform;
    }
    if (query?.internalCampaignCode) {
      filter.internalCampaignCode = query.internalCampaignCode;
    }
    if (query?.startDate || query?.endDate) {
      filter.date = {};
      if (query.startDate) {
        filter.date.$gte = this.normalizeDate(query.startDate);
      }
      if (query.endDate) {
        filter.date.$lte = this.normalizeDate(query.endDate);
      }
    }

    const items = await this.adsModel.find(filter).sort({ date: -1 }).exec();

    const summary = items.reduce(
      (acc, item) => {
        acc.totalSpend += item.spend || 0;
        acc.totalImpressions += item.impressions || 0;
        acc.totalClicks += item.clicks || 0;
        acc.totalProviderConversions += item.providerConversions || 0;
        acc.totalProviderConversionValue += item.providerConversionValue || 0;
        return acc;
      },
      {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalProviderConversions: 0,
        totalProviderConversionValue: 0,
        ctrPercentage: 0,
        cpcVnd: 0,
      },
    );

    summary.ctrPercentage =
      summary.totalImpressions > 0
        ? Number(
            ((summary.totalClicks / summary.totalImpressions) * 100).toFixed(2),
          )
        : 0;

    summary.cpcVnd =
      summary.totalClicks > 0
        ? Math.round(summary.totalSpend / summary.totalClicks)
        : 0;

    return { items, summary };
  }

  // Admin mapping from external campaign ID to internal campaign code (ADS-01)
  async mapCampaign(dto: MapAdCampaignDto): Promise<{ updatedCount: number }> {
    const res = await this.adsModel
      .updateMany(
        { campaignId: dto.campaignId },
        { $set: { internalCampaignCode: dto.internalCampaignCode } },
      )
      .exec();

    return { updatedCount: res.modifiedCount };
  }

  // Calculate Blended ROAS: Attributed Web Orders Revenue vs Ad Spend (ADS-01, TRK-02)
  async getBlendedRoas(campaignCode?: string): Promise<{
    campaignCode?: string;
    adSpendVnd: number;
    attributedRevenueVnd: number;
    attributedOrdersCount: number;
    blendedRoas: number;
  }> {
    const adFilter: any = { isArchived: false };
    if (campaignCode) {
      adFilter.internalCampaignCode = campaignCode;
    }

    const adRecords = await this.adsModel.find(adFilter).exec();
    const adSpendVnd = adRecords.reduce((sum, r) => sum + (r.spend || 0), 0);

    const orderFilter: any = {};
    if (campaignCode) {
      orderFilter['attribution.campaignCode'] = campaignCode;
    } else {
      orderFilter['attribution.campaignCode'] = { $exists: true, $ne: null };
    }

    const orders = await this.orderModel.find(orderFilter).exec();
    const attributedRevenueVnd = orders.reduce(
      (sum, o) => sum + (o.total || 0),
      0,
    );
    const attributedOrdersCount = orders.length;

    const blendedRoas =
      adSpendVnd > 0
        ? Number((attributedRevenueVnd / adSpendVnd).toFixed(2))
        : 0;

    return {
      campaignCode,
      adSpendVnd,
      attributedRevenueVnd,
      attributedOrdersCount,
      blendedRoas,
    };
  }
}
