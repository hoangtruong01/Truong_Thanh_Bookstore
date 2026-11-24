import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
        if (imageUrl.length > 65536) {
          throw new BadRequestException(
            'Dung lượng ảnh banner quá lớn (vượt quá 64KB) và chưa tải được lên Cloudinary. Vui lòng cung cấp URL ảnh trực tiếp.',
          );
        }
        console.warn(
          'Upload banner to Cloudinary failed, falling back to raw data URI:',
          (err as Error)?.message,
        );
        return imageUrl;
      }
    }
    if (imageUrl.startsWith('data:image/') && imageUrl.length > 65536) {
      throw new BadRequestException(
        'Dung lượng ảnh banner dạng data URI quá lớn (>64KB). Vui lòng cung cấp URL ảnh trực tiếp.',
      );
    }
    return imageUrl;
  }

  private isPopupCurrentlyActive(
    banner: { isActive?: boolean; startAt?: Date | null; endAt?: Date | null },
    now = new Date(),
  ): boolean {
    if (banner.isActive === false) return false;
    if (banner.startAt && new Date(banner.startAt).getTime() > now.getTime()) {
      return false;
    }
    if (banner.endAt && new Date(banner.endAt).getTime() <= now.getTime()) {
      return false;
    }
    return true;
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

  /**
   * Truy vấn đọc dùng `.lean()` (bỏ chi phí hydrate). Banner không có virtual/transform,
   * nhưng lean không áp default schema cho bản ghi cũ thiếu trường popup (frequency,
   * ctaLabel, closeable, startAt...) — áp lại để JSON trả về giữ nguyên shape.
   */
  private withLeanDefaults<T extends object>(banner: T): T {
    this.bannerModel.applyDefaults(banner);
    return banner;
  }

  async findAll(): Promise<Banner[]> {
    const banners = await this.bannerModel
      .find()
      .sort({ position: 1, sortOrder: 1, createdAt: -1 })
      .lean<Banner[]>()
      .exec();
    return banners.map((banner) => this.withLeanDefaults(banner));
  }

  async findActive(): Promise<Record<string, Banner[]>> {
    const now = new Date();
    const banners = (
      await this.bannerModel
        .find({
          isActive: true,
          position: { $ne: BannerPosition.ENTRY_POPUP },
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
                { endAt: { $gt: now } },
              ],
            },
          ],
        })
        .sort({ sortOrder: 1 })
        .lean<Banner[]>()
        .exec()
    ).map((banner) => this.withLeanDefaults(banner));

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
      .lean<Banner>()
      .exec();

    return popup ? this.withLeanDefaults(popup) : null;
  }

  async create(dto: CreateBannerDto): Promise<Banner> {
    const bannerData = { ...dto };
    if (bannerData.imageUrl) {
      bannerData.imageUrl = await this.processImageUrl(bannerData.imageUrl);
    }
    if (bannerData.mobileImageUrl) {
      bannerData.mobileImageUrl = await this.processImageUrl(
        bannerData.mobileImageUrl,
      );
    }

    if (
      bannerData.position === BannerPosition.ENTRY_POPUP &&
      this.isPopupCurrentlyActive(bannerData)
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
    if (updateData.mobileImageUrl) {
      updateData.mobileImageUrl = await this.processImageUrl(
        updateData.mobileImageUrl,
      );
    }

    const targetPosition = updateData.position ?? existing.position;
    const mergedBanner = {
      isActive: updateData.isActive ?? existing.isActive,
      startAt: updateData.startAt ?? existing.startAt,
      endAt: updateData.endAt ?? existing.endAt,
    };

    if (
      targetPosition === BannerPosition.ENTRY_POPUP &&
      this.isPopupCurrentlyActive(mergedBanner)
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

  async recordImpression(id: string): Promise<void> {
    await this.bannerModel
      .findByIdAndUpdate(id, { $inc: { impressionCount: 1 } })
      .exec();
  }

  async recordClick(id: string): Promise<void> {
    await this.bannerModel
      .findByIdAndUpdate(id, { $inc: { clickCount: 1 } })
      .exec();
  }

  async delete(id: string): Promise<void> {
    const result = await this.bannerModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Banner not found');
    }
  }
}
