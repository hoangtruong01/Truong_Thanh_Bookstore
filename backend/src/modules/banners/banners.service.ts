import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from './schemas/banner.schema';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
  ) {}

  async findAll(): Promise<Banner[]> {
    return this.bannerModel.find().sort({ position: 1, sortOrder: 1 }).exec();
  }

  async findActive(): Promise<Record<string, Banner[]>> {
    const banners = await this.bannerModel
      .find({ isActive: true })
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

  async create(dto: CreateBannerDto): Promise<Banner> {
    const banner = new this.bannerModel(dto);
    return banner.save();
  }

  async update(id: string, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.bannerModel
      .findByIdAndUpdate(id, dto, { new: true })
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
