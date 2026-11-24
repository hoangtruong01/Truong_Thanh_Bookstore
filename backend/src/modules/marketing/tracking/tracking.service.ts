import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  MarketingEvent,
  MarketingEventDocument,
} from './schemas/marketing-event.schema';
import { CollectEventDto } from './dto/tracking-event.dto';

@Injectable()
export class TrackingService {
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
}
