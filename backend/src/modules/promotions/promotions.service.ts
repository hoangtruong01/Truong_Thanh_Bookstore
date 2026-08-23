import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Promotion, PromotionDocument } from './schemas/promotion.schema';
import { CreatePromotionDto, ApplyPromotionDto } from './dto/promotion.dto';
import { DiscountType, OrderStatus } from '../../common/enums';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    @InjectModel(Promotion.name)
    private promotionModel: Model<PromotionDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async create(dto: CreatePromotionDto): Promise<PromotionDocument> {
    const promotion = new this.promotionModel(dto);
    const savedPromo = await promotion.save();
    
    if (savedPromo.status) {
      this.notificationsService.createGlobalPromo(
        savedPromo.code,
        savedPromo.name,
        savedPromo.description,
      ).catch((err) => this.logger.error('Failed to create global promo notification', err));
    }
    
    return savedPromo;
  }

  async findAll(): Promise<PromotionDocument[]> {
    return this.promotionModel.find().sort({ createdAt: -1 }).exec();
  }

  async findActive(): Promise<PromotionDocument[]> {
    const now = new Date();
    return this.promotionModel
      .find({
        status: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $expr: { $lt: ['$usedCount', '$usageLimit'] },
      })
      .sort({ minOrderValue: 1 })
      .exec();
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
    const oldPromo = await this.promotionModel.findById(id).exec();
    if (!oldPromo) throw new NotFoundException('Promotion not found');

    const promo = await this.promotionModel
      .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
      .exec();
    if (!promo) throw new NotFoundException('Promotion not found');

    // Trigger notification if promotion was disabled and is now enabled
    if (promo.status && !oldPromo.status) {
      this.notificationsService.createGlobalPromo(
        promo.code,
        promo.name,
        promo.description,
      ).catch((err) => this.logger.error('Failed to create global promo notification on update', err));
    }

    return promo;
  }

  async delete(id: string): Promise<void> {
    const result = await this.promotionModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Promotion not found');
  }

  async apply(
    dto: ApplyPromotionDto,
    userId?: string,
    incrementUsage = false,
    guestEmail?: string,
    guestPhone?: string,
    session?: ClientSession,
  ): Promise<{ discount: number; code: string; promotion: PromotionDocument }> {
    const promoQuery = this.promotionModel.findOne({
      code: dto.code.toUpperCase(),
      status: true,
    });
    if (session) promoQuery.session(session);
    let promo = await promoQuery.exec();

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

    // Prevent duplicate promotion usage per user or guest email/phone
    const matchConditions: any[] = [];
    if (userId) {
      matchConditions.push({ customer: userId as any });
    }
    if (guestEmail && guestEmail.trim()) {
      matchConditions.push({ customerEmail: guestEmail.trim().toLowerCase() });
    }
    if (guestPhone && guestPhone.trim()) {
      matchConditions.push({ phone: guestPhone.trim() });
    }

    if (matchConditions.length > 0) {
      const usedQuery = this.orderModel.findOne({
          $or: matchConditions,
          promotionCode: promo.code,
          orderStatus: { $ne: OrderStatus.CANCELLED as any },
        } as any);
      if (session) usedQuery.session(session);
      const alreadyUsed = await usedQuery.exec();
      if (alreadyUsed) {
        throw new BadRequestException('Bạn hoặc thông tin đặt hàng này đã sử dụng mã giảm giá này cho một đơn hàng trước đó.');
      }
    }

    let discount = 0;
    if (promo.discountType === DiscountType.PERCENT) {
      discount = Math.floor((dto.orderTotal * promo.discountValue) / 100);
      // FIX-H02: Limit percentage discount based on maxDiscount
      if (promo.maxDiscount && promo.maxDiscount > 0) {
        discount = Math.min(discount, promo.maxDiscount);
      }
    } else {
      discount = promo.discountValue;
    }

    if (incrementUsage) {
      const consumed = await this.promotionModel.findOneAndUpdate(
        {
          _id: promo._id,
          status: true,
          usedCount: { $lt: promo.usageLimit },
        },
        { $inc: { usedCount: 1 } },
        { returnDocument: 'after', ...(session ? { session } : {}) },
      ).exec();
      if (!consumed) {
        throw new BadRequestException('Promotion usage limit reached');
      }
      promo = consumed;
    }

    return { discount, code: promo.code, promotion: promo };
  }

  async releaseUsage(code: string): Promise<void> {
    await this.promotionModel.updateOne(
      { code: code.toUpperCase(), usedCount: { $gt: 0 } },
      { $inc: { usedCount: -1 } },
    ).exec();
  }
}
