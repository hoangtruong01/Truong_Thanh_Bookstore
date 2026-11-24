import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  LivestreamSession,
  LivestreamSessionDocument,
  LivestreamStatus,
} from './schemas/livestream-session.schema';
import {
  CreateLivestreamDto,
  UpdateLivestreamDto,
  UpdateLivestreamStatusDto,
} from './dto/livestream.dto';

@Injectable()
export class LivestreamsService {
  constructor(
    @InjectModel(LivestreamSession.name)
    private liveModel: Model<LivestreamSessionDocument>,
  ) {}

  async create(dto: CreateLivestreamDto): Promise<LivestreamSession> {
    if (
      dto.startAt &&
      dto.endAt &&
      new Date(dto.startAt) >= new Date(dto.endAt)
    ) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    const session = new this.liveModel({
      ...dto,
      featuredProductIds: (dto.featuredProductIds || [])
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id)),
      campaignId:
        dto.campaignId && Types.ObjectId.isValid(dto.campaignId)
          ? new Types.ObjectId(dto.campaignId)
          : undefined,
      isArchived: false,
    });

    return session.save();
  }

  async findAll(filterDto?: {
    status?: LivestreamStatus;
  }): Promise<LivestreamSession[]> {
    const filter: any = { isArchived: false };
    if (filterDto?.status) {
      filter.status = filterDto.status;
    }
    return this.liveModel
      .find(filter)
      .sort({ startAt: -1, createdAt: -1 })
      .exec();
  }

  async findActiveLive(): Promise<LivestreamSession | null> {
    // Only return session with status LIVE (BA rule D09: manual verified or official status)
    return this.liveModel
      .findOne({ status: LivestreamStatus.LIVE, isArchived: false })
      .populate('featuredProductIds')
      .exec();
  }

  async findById(id: string): Promise<LivestreamSessionDocument> {
    const session = await this.liveModel
      .findById(id)
      .populate('featuredProductIds')
      .exec();
    if (!session || session.isArchived) {
      throw new NotFoundException(
        'Phiên livestream không tồn tại hoặc đã bị lưu trữ',
      );
    }
    return session;
  }

  async update(
    id: string,
    dto: UpdateLivestreamDto,
  ): Promise<LivestreamSession> {
    const session = await this.findById(id);

    if (
      dto.startAt &&
      dto.endAt &&
      new Date(dto.startAt) >= new Date(dto.endAt)
    ) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc',
      );
    }

    Object.assign(session, {
      ...dto,
      featuredProductIds: dto.featuredProductIds
        ? dto.featuredProductIds
            .filter((pid) => Types.ObjectId.isValid(pid))
            .map((pid) => new Types.ObjectId(pid))
        : session.featuredProductIds,
      campaignId:
        dto.campaignId && Types.ObjectId.isValid(dto.campaignId)
          ? new Types.ObjectId(dto.campaignId)
          : session.campaignId,
    });

    return session.save();
  }

  async updateStatus(
    id: string,
    dto: UpdateLivestreamStatusDto,
  ): Promise<LivestreamSession> {
    const session = await this.findById(id);
    session.status = dto.status;
    return session.save();
  }

  async delete(id: string): Promise<void> {
    const session = await this.findById(id);
    session.isArchived = true;
    session.status = LivestreamStatus.CANCELLED;
    await session.save();
  }
}
