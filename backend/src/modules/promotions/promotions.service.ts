import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { createHash } from 'crypto';
import {
  Promotion,
  PromotionDocument,
  PromotionUsage,
  PromotionUsageDocument,
} from './schemas/promotion.schema';
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
    @InjectModel(PromotionUsage.name)
    private promotionUsageModel: Model<PromotionUsageDocument>,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    private notificationsService: NotificationsService,
  ) {}

  private getIdentityHash(
    userId?: string,
    guestEmail?: string,
    guestPhone?: string,
  ): string | undefined {
    const identity = userId
      ? `user:${userId}`
      : guestEmail?.trim()
        ? `email:${guestEmail.trim().toLowerCase()}`
        : guestPhone?.trim()
          ? `phone:${guestPhone.trim()}`
          : undefined;
    return identity
      ? createHash('sha256').update(identity).digest('hex')
      : undefined;
  }

  async create(dto: CreatePromotionDto): Promise<PromotionDocument> {
    const promotion = new this.promotionModel(dto);
    const savedPromo = await promotion.save();

    if (savedPromo.status) {
      this.notificationsService
        .createGlobalPromo(
          savedPromo.code,
          savedPromo.name,
          savedPromo.description || '',
        )
        .catch((err: any) =>
          this.logger.error('Failed to create global promo notification', err),
        );
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
      this.notificationsService
        .createGlobalPromo(promo.code, promo.name, promo.description || '')
        .catch((err: any) =>
          this.logger.error(
            'Failed to create global promo notification on update',
            err,
          ),
        );
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

    // Enforce a configurable per-customer limit
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

    const identityHash = this.getIdentityHash(userId, guestEmail, guestPhone);
    let historicalUsage = 0;
    if (matchConditions.length > 0) {
      const usedQuery = this.orderModel.countDocuments({
        $or: matchConditions,
        promotionCode: promo.code,
        orderStatus: { $ne: OrderStatus.CANCELLED },
      });
      if (session) usedQuery.session(session);
      historicalUsage = await usedQuery.exec();
    }

    let trackedUsage = 0;
    if (identityHash) {
      const usageQuery = this.promotionUsageModel.findOne({
        promotion: promo._id,
        identityHash,
      });
      if (session) usageQuery.session(session);
      trackedUsage = (await usageQuery.exec())?.count || 0;
    }
    if (Math.max(historicalUsage, trackedUsage) >= (promo.perUserLimit || 1)) {
      throw new BadRequestException(
        `Mỗi khách hàng chỉ được sử dụng mã này tối đa ${promo.perUserLimit || 1} lần.`,
      );
    }

    let discount = 0;
    if (promo.discountType === DiscountType.PERCENT) {
      discount = Math.floor((dto.orderTotal * promo.discountValue) / 100);
      if (promo.maxDiscount && promo.maxDiscount > 0) {
        discount = Math.min(discount, promo.maxDiscount);
      }
    } else {
      discount = promo.discountValue;
    }

    if (incrementUsage) {
      const consumed = await this.promotionModel
        .findOneAndUpdate(
          {
            _id: promo._id,
            status: true,
            usedCount: { $lt: promo.usageLimit },
          },
          { $inc: { usedCount: 1 } },
          { returnDocument: 'after', ...(session ? { session } : {}) },
        )
        .exec();
      if (!consumed) {
        throw new BadRequestException('Promotion usage limit reached');
      }
      promo = consumed;

      if (identityHash) {
        try {
          const usage = await this.promotionUsageModel
            .findOneAndUpdate(
              {
                promotion: promo._id,
                identityHash,
                count: { $lt: promo.perUserLimit || 1 },
              },
              {
                $inc: { count: 1 },
                $setOnInsert: { promotion: promo._id, identityHash },
              },
              {
                upsert: true,
                returnDocument: 'after',
                ...(session ? { session } : {}),
              },
            )
            .exec();
          if (!usage) throw new Error('PROMOTION_PER_USER_LIMIT');
        } catch {
          if (!session) {
            await this.promotionModel
              .updateOne(
                { _id: promo._id, usedCount: { $gt: 0 } },
                { $inc: { usedCount: -1 } },
              )
              .exec();
          }
          throw new BadRequestException(
            `Mỗi khách hàng chỉ được sử dụng mã này tối đa ${promo.perUserLimit || 1} lần.`,
          );
        }
      }
    }

    return { discount, code: promo.code, promotion: promo };
  }

  async releaseUsage(
    code: string,
    userId?: string,
    guestEmail?: string,
    guestPhone?: string,
    session?: ClientSession,
  ): Promise<void> {
    const promoQuery = this.promotionModel.findOne({
      code: code.toUpperCase(),
    });
    if (session) promoQuery.session(session);
    const promo = await promoQuery.exec();
    if (!promo) return;

    await this.promotionModel
      .updateOne(
        { code: code.toUpperCase(), usedCount: { $gt: 0 } },
        { $inc: { usedCount: -1 } },
        session ? { session } : undefined,
      )
      .exec();

    const identityHash = this.getIdentityHash(userId, guestEmail, guestPhone);
    if (identityHash) {
      await this.promotionUsageModel
        .updateOne(
          { promotion: promo._id, identityHash, count: { $gt: 0 } },
          { $inc: { count: -1 } },
          session ? { session } : undefined,
        )
        .exec();
    }
  }
}
