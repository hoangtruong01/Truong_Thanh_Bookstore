import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  MarketingEvent,
  MarketingEventDocument,
  MarketingEventType,
} from './schemas/marketing-event.schema';
import { CollectEventDto } from './dto/tracking-event.dto';

export interface ConversionFunnelMetrics {
  pageViews: number;
  productViews: number;
  addToCart: number;
  initiateCheckout: number;
  ordersPlaced: number;
  grossRevenuePlaced: number;
  ordersRealized: number;
  netRevenueRealized: number;
  visitorToOrderRate: number; // percentage
  checkoutToOrderRate: number; // percentage
  realizationRate: number; // percentage
}

export interface MarketingDashboardOverview {
  funnel: ConversionFunnelMetrics;
  trafficBySource: Array<{ source: string; visitors: number; percentage: number }>;
  campaigns: Array<{ campaign: string; orders: number; revenue: number }>;
  totalEvents: number;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(
    @InjectModel(MarketingEvent.name)
    private eventModel: Model<MarketingEventDocument>,
  ) {}

  private hashIp(ip?: string): string | undefined {
    if (!ip) return undefined;
    return crypto
      .createHash('sha256')
      .update(ip + '_truongthanh_salt')
      .digest('hex')
      .slice(0, 16);
  }

  async recordEvent(
    dto: CollectEventDto,
    userId?: string,
    clientIp?: string,
    userAgent?: string,
  ): Promise<MarketingEvent> {
    const event = new this.eventModel({
      ...dto,
      userId:
        userId && Types.ObjectId.isValid(userId)
          ? new Types.ObjectId(userId)
          : undefined,
      ipHash: this.hashIp(clientIp),
      userAgent: userAgent ? userAgent.slice(0, 255) : undefined,
      timestamp: new Date(),
    });

    return event.save();
  }

  /**
   * TRK-03: Ghi nhận sự kiện Đặt hàng thành công (Gross Placed Revenue)
   */
  async recordOrderPlaced(order: {
    orderCode: string;
    total: number;
    customerId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    sessionId?: string;
  }): Promise<MarketingEvent> {
    const event = new this.eventModel({
      eventType: MarketingEventType.ORDER_PLACED,
      entityType: 'ORDER',
      entityId: order.orderCode,
      utmSource: order.utmSource || 'direct',
      utmMedium: order.utmMedium,
      utmCampaign: order.utmCampaign,
      sessionId: order.sessionId,
      userId:
        order.customerId && Types.ObjectId.isValid(order.customerId)
          ? new Types.ObjectId(order.customerId)
          : undefined,
      eventData: {
        orderCode: order.orderCode,
        grossAmount: order.total,
        currency: 'VND',
      },
      timestamp: new Date(),
    });

    return event.save();
  }

  /**
   * TRK-03: Ghi nhận sự kiện Thực thu / Doanh thu thực nhận (Net Realized Revenue)
   * Kích hoạt khi đơn hàng đã thanh toán thành công và/hoặc giao thành công (sau hoàn/giảm)
   */
  async recordOrderRealized(order: {
    orderCode: string;
    netAmount: number;
    customerId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }): Promise<MarketingEvent> {
    const event = new this.eventModel({
      eventType: MarketingEventType.ORDER_REALIZED,
      entityType: 'ORDER',
      entityId: order.orderCode,
      utmSource: order.utmSource || 'direct',
      utmMedium: order.utmMedium,
      utmCampaign: order.utmCampaign,
      userId:
        order.customerId && Types.ObjectId.isValid(order.customerId)
          ? new Types.ObjectId(order.customerId)
          : undefined,
      eventData: {
        orderCode: order.orderCode,
        netAmount: order.netAmount,
        currency: 'VND',
      },
      timestamp: new Date(),
    });

    return event.save();
  }

  async getSummary(query?: {
    campaign?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    byType: Record<string, number>;
    totalEvents: number;
  }> {
    const filter: any = {};
    if (query?.campaign) {
      filter.utmCampaign = query.campaign;
    }
    if (query?.startDate || query?.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
    }

    const aggregated = await this.eventModel.aggregate([
      { $match: filter },
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
    ]);

    const byType: Record<string, number> = {};
    let totalEvents = 0;
    for (const item of aggregated) {
      byType[item._id] = item.count;
      totalEvents += item.count;
    }

    return { byType, totalEvents };
  }

  /**
   * TRK-03: Phễu chuyển đổi & Đối soát Doanh thu Đặt vs Thực thu
   */
  async getConversionFunnel(query?: {
    campaign?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ConversionFunnelMetrics> {
    const filter: any = {};
    if (query?.campaign) filter.utmCampaign = query.campaign;
    if (query?.startDate || query?.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
    }

    const aggregated = await this.eventModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          grossTotal: { $sum: { $ifNull: ['$eventData.grossAmount', 0] } },
          netTotal: { $sum: { $ifNull: ['$eventData.netAmount', 0] } },
        },
      },
    ]);

    const statsMap = new Map<string, { count: number; gross: number; net: number }>();
    for (const item of aggregated) {
      statsMap.set(item._id, {
        count: item.count,
        gross: item.grossTotal,
        net: item.netTotal,
      });
    }

    const pageViews = statsMap.get(MarketingEventType.PAGE_VIEW)?.count || 0;
    const productViews = statsMap.get(MarketingEventType.PRODUCT_VIEW)?.count || 0;
    const addToCart = statsMap.get(MarketingEventType.ADD_TO_CART)?.count || 0;
    const initiateCheckout = statsMap.get(MarketingEventType.INITIATE_CHECKOUT)?.count || 0;

    // Placed orders: support ORDER_PLACED or legacy PURCHASE
    const placedStat = statsMap.get(MarketingEventType.ORDER_PLACED) || statsMap.get(MarketingEventType.PURCHASE) || { count: 0, gross: 0, net: 0 };
    const realizedStat = statsMap.get(MarketingEventType.ORDER_REALIZED) || { count: 0, gross: 0, net: 0 };

    const ordersPlaced = placedStat.count;
    const grossRevenuePlaced = placedStat.gross;
    const ordersRealized = realizedStat.count;
    const netRevenueRealized = realizedStat.net;

    const visitorToOrderRate = pageViews > 0 ? (ordersPlaced / pageViews) * 100 : 0;
    const checkoutToOrderRate = initiateCheckout > 0 ? (ordersPlaced / initiateCheckout) * 100 : 0;
    const realizationRate = ordersPlaced > 0 ? (ordersRealized / ordersPlaced) * 100 : 0;

    return {
      pageViews,
      productViews,
      addToCart,
      initiateCheckout,
      ordersPlaced,
      grossRevenuePlaced,
      ordersRealized,
      netRevenueRealized,
      visitorToOrderRate: Math.round(visitorToOrderRate * 100) / 100,
      checkoutToOrderRate: Math.round(checkoutToOrderRate * 100) / 100,
      realizationRate: Math.round(realizationRate * 100) / 100,
    };
  }

  /**
   * MKT-03: Dashboard Báo Cáo Marketing Tổng Hợp
   */
  async getDashboardOverview(query?: {
    startDate?: string;
    endDate?: string;
  }): Promise<MarketingDashboardOverview> {
    const funnel = await this.getConversionFunnel(query);

    const filter: any = {};
    if (query?.startDate || query?.endDate) {
      filter.timestamp = {};
      if (query.startDate) filter.timestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.timestamp.$lte = new Date(query.endDate);
    }

    // 1. Phân bổ lưu lượng theo nguồn (Traffic by UTM Source)
    const trafficAgg = await this.eventModel.aggregate([
      { $match: { ...filter, utmSource: { $exists: true, $ne: '' } } },
      { $group: { _id: '$utmSource', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const totalTraffic = trafficAgg.reduce((sum, item) => sum + item.count, 0) || 1;
    const trafficBySource = trafficAgg.map((item) => ({
      source: item._id || 'direct',
      visitors: item.count,
      percentage: Math.round((item.count / totalTraffic) * 1000) / 10,
    }));

    // 2. Hiệu quả theo chiến dịch (Campaigns Conversion & Revenue)
    const campaignAgg = await this.eventModel.aggregate([
      {
        $match: {
          ...filter,
          utmCampaign: { $exists: true, $ne: '' },
          eventType: { $in: [MarketingEventType.ORDER_PLACED, MarketingEventType.PURCHASE] },
        },
      },
      {
        $group: {
          _id: '$utmCampaign',
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$eventData.grossAmount', 0] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    const campaigns = campaignAgg.map((item) => ({
      campaign: item._id,
      orders: item.orders,
      revenue: item.revenue,
    }));

    const totalEvents = await this.eventModel.countDocuments(filter);

    return {
      funnel,
      trafficBySource,
      campaigns,
      totalEvents,
    };
  }
}

