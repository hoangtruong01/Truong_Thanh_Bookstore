import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Promotion, PromotionDocument } from './schemas/promotion.schema';
import { CreatePromotionDto, ApplyPromotionDto } from './dto/promotion.dto';
import { DiscountType } from '../../common/enums';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectModel(Promotion.name)
    private promotionModel: Model<PromotionDocument>,
  ) {}

  async create(dto: CreatePromotionDto): Promise<PromotionDocument> {
    const promotion = new this.promotionModel(dto);
    return promotion.save();
  }

  async findAll(): Promise<PromotionDocument[]> {
    return this.promotionModel.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<PromotionDocument> {
    const promo = await this.promotionModel.findById(id).exec();
    if (!promo) throw new NotFoundException('Promotion not found');
    return promo;
  }

  async update(
    id: string,
    dto: Partial<CreatePromotionDto>,
  ): Promise<PromotionDocument> {
    const promo = await this.promotionModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!promo) throw new NotFoundException('Promotion not found');
    return promo;
  }

  async delete(id: string): Promise<void> {
    const result = await this.promotionModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Promotion not found');
  }

  async apply(
    dto: ApplyPromotionDto,
    incrementUsage = false,
  ): Promise<{ discount: number; code: string }> {
    const promo = await this.promotionModel
      .findOne({
        code: dto.code.toUpperCase(),
        status: true,
      })
      .exec();

    if (!promo) throw new NotFoundException('Promotion code not found');

    const now = new Date();
    if (now < promo.startDate || now > promo.endDate) {
      throw new BadRequestException('Promotion has expired');
    }

    if (promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Promotion usage limit reached');
    }

    if (dto.orderTotal < promo.minOrderValue) {
      throw new BadRequestException(
        `Order total must be at least ${promo.minOrderValue.toLocaleString('vi-VN')}đ`,
      );
    }

    let discount = 0;
    if (promo.discountType === DiscountType.PERCENT) {
      discount = Math.floor((dto.orderTotal * promo.discountValue) / 100);
    } else {
      discount = promo.discountValue;
    }

    if (incrementUsage) {
      // Increment usage
      promo.usedCount += 1;
      await promo.save();
    }

    return { discount, code: promo.code };
  }
}
