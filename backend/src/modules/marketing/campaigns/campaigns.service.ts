import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MarketingCampaign,
  MarketingCampaignDocument,
  CampaignStatus,
} from './schemas/marketing-campaign.schema';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdateCampaignStatusDto,
  QueryCampaignDto,
} from './dto/campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(MarketingCampaign.name)
    private campaignModel: Model<MarketingCampaignDocument>,
  ) {}

  // Allowed state machine transitions (D03 & MKT-01)
  private readonly allowedTransitions: Record<
    CampaignStatus,
    CampaignStatus[]
  > = {
    [CampaignStatus.DRAFT]: [CampaignStatus.IN_REVIEW, CampaignStatus.ARCHIVED],
    [CampaignStatus.IN_REVIEW]: [
      CampaignStatus.APPROVED,
      CampaignStatus.DRAFT,
      CampaignStatus.ARCHIVED,
    ],
    [CampaignStatus.APPROVED]: [
      CampaignStatus.ACTIVE,
      CampaignStatus.PAUSED,
      CampaignStatus.ARCHIVED,
    ],
    [CampaignStatus.ACTIVE]: [
      CampaignStatus.PAUSED,
      CampaignStatus.EXPIRED,
      CampaignStatus.ARCHIVED,
    ],
    [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.ARCHIVED],
    [CampaignStatus.EXPIRED]: [CampaignStatus.ARCHIVED],
    [CampaignStatus.ARCHIVED]: [], // Terminal state
  };

  async create(
    dto: CreateCampaignDto,
    userId?: string,
  ): Promise<MarketingCampaign> {
    const existing = await this.campaignModel
      .findOne({ code: dto.code })
      .exec();
    if (existing) {
      throw new ConflictException(`Mã chiến dịch ${dto.code} đã tồn tại`);
    }

    if (
      dto.startAt &&
      dto.endAt &&
      new Date(dto.startAt) >= new Date(dto.endAt)
    ) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    const campaign = new this.campaignModel({
      ...dto,
      status: CampaignStatus.DRAFT,
      revision: 1,
      isArchived: false,
      ownerId:
        userId && Types.ObjectId.isValid(userId)
          ? new Types.ObjectId(userId)
          : undefined,
    });

    return campaign.save();
  }

  async findAll(query: QueryCampaignDto): Promise<{
    items: MarketingCampaign[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filter: any = { isArchived: false };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.objective) {
      filter.objective = query.objective;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex },
      ];
    }

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.campaignModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.campaignModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<MarketingCampaignDocument> {
    const campaign = await this.campaignModel.findById(id).exec();
    if (!campaign || campaign.isArchived) {
      throw new NotFoundException(
        `Chiến dịch không tồn tại hoặc đã bị lưu trữ`,
      );
    }
    return campaign;
  }

  async findByCode(code: string): Promise<MarketingCampaignDocument | null> {
    return this.campaignModel
      .findOne({ code: code.trim().toUpperCase(), isArchived: false })
      .exec();
  }

  async update(
    id: string,
    dto: UpdateCampaignDto,
    _userId?: string,
  ): Promise<MarketingCampaign> {
    const campaign = await this.findById(id);

    if (
      dto.startAt &&
      dto.endAt &&
      new Date(dto.startAt) >= new Date(dto.endAt)
    ) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    if (dto.revision !== undefined && dto.revision !== campaign.revision) {
      throw new ConflictException(
        'Dữ liệu đã được cập nhật bởi phiên khác, vui lòng tải lại',
      );
    }

    Object.assign(campaign, dto);
    campaign.revision = (campaign.revision || 1) + 1;

    // If campaign was approved or active and critical schedule changed, revert to draft (D03)
    if (
      (campaign.status === CampaignStatus.APPROVED ||
        campaign.status === CampaignStatus.ACTIVE) &&
      (dto.startAt || dto.endAt || dto.budgetPlan)
    ) {
      // Keep active but note audit
    }

    return campaign.save();
  }

  async updateStatus(
    id: string,
    dto: UpdateCampaignStatusDto,
    _userId?: string,
  ): Promise<MarketingCampaign> {
    const campaign = await this.findById(id);

    const allowed = this.allowedTransitions[campaign.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái chiến dịch từ ${campaign.status} sang ${dto.status}`,
      );
    }

    campaign.status = dto.status;
    campaign.revision = (campaign.revision || 1) + 1;

    if (dto.status === CampaignStatus.ARCHIVED) {
      campaign.isArchived = true;
    }

    return campaign.save();
  }

  async delete(id: string): Promise<void> {
    const campaign = await this.findById(id);
    campaign.isArchived = true;
    campaign.status = CampaignStatus.ARCHIVED;
    await campaign.save();
  }
}
