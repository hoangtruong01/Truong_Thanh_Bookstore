import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Banner,
  BannerDocument,
  BannerPosition,
} from './schemas/banner.schema';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';
import { CloudinaryService } from '../users/cloudinary.service';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  private async processImageUrl(imageUrl: string): Promise<string> {
    if (!imageUrl) return imageUrl;
    if (
      imageUrl.startsWith('data:image/') &&
      this.cloudinaryService &&
      typeof this.cloudinaryService.isConfigured === 'function' &&
      this.cloudinaryService.isConfigured()
    ) {
      try {
        return await this.cloudinaryService.uploadImage(
          imageUrl,
          'truong_thanh_banners',
        );
      } catch (err: unknown) {
        console.warn(
          'Upload banner to Cloudinary failed, falling back to raw data URI:',
          (err as Error)?.message,
        );
        return imageUrl;
      }
    }
    return imageUrl;
  }

  private async deactivateOtherPopups(excludeId?: string): Promise<void> {
    const filter: Record<string, any> = {
      position: BannerPosition.ENTRY_POPUP,
      isActive: true,
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    await this.bannerModel.updateMany(filter, { isActive: false }).exec();
  }

  async findAll(): Promise<Banner[]> {
    return this.bannerModel
      .find()
      .sort({ position: 1, sortOrder: 1, createdAt: -1 })
      .exec();
  }

  async findActive(): Promise<Record<string, Banner[]>> {
    const banners = await this.bannerModel
      .find({
        isActive: true,
        position: { $ne: BannerPosition.ENTRY_POPUP },
      })
      .sort({ sortOrder: 1 })
      .exec();

    // Group banners by position
    const grouped: Record<string, Banner[]> = {};
    for (const banner of banners) {
      const pos = banner.position;
      if (!grouped[pos]) {
        grouped[pos] = [];
      }
      grouped[pos].push(banner);
    }
    return grouped;
  }

  async findActivePopup(): Promise<Banner | null> {
    const now = new Date();
    const popup = await this.bannerModel
      .findOne({
        position: BannerPosition.ENTRY_POPUP,
        isActive: true,
        $and: [
          {
            $or: [
              { startAt: null },
              { startAt: { $exists: false } },
              { startAt: { $lte: now } },
            ],
          },
          {
            $or: [
              { endAt: null },
              { endAt: { $exists: false } },
              { endAt: { $gte: now } },
            ],
          },
        ],
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .exec();

    return popup || null;
  }

  async create(dto: CreateBannerDto): Promise<Banner> {
    const bannerData = { ...dto };
    if (bannerData.imageUrl) {
      bannerData.imageUrl = await this.processImageUrl(bannerData.imageUrl);
    }

    if (
      bannerData.position === BannerPosition.ENTRY_POPUP &&
      bannerData.isActive !== false
    ) {
      await this.deactivateOtherPopups();
    }

    const banner = new this.bannerModel(bannerData);
    return banner.save();
  }

  async update(id: string, dto: UpdateBannerDto): Promise<Banner> {
    const existing = await this.bannerModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Banner not found');
    }

    const updateData = { ...dto };
    if (updateData.imageUrl) {
      updateData.imageUrl = await this.processImageUrl(updateData.imageUrl);
    }

    const targetPosition = updateData.position ?? existing.position;
    const targetIsActive = updateData.isActive ?? existing.isActive;

    if (
      targetPosition === BannerPosition.ENTRY_POPUP &&
      targetIsActive === true
    ) {
      await this.deactivateOtherPopups(id);
    }

    const banner = await this.bannerModel
      .findByIdAndUpdate(id, updateData, { returnDocument: 'after' })
      .exec();
    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return banner;
  }

  async delete(id: string): Promise<void> {
    const result = await this.bannerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Banner not found');
    }
  }
}
