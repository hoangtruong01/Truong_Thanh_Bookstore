import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ClientSession } from 'mongoose';
import { UsersService } from '../../users/users.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class OrderLoyaltyService {
  private readonly logger = new Logger(OrderLoyaltyService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Xác thực và trừ điểm thưởng của user tại thời điểm checkout.
   */
  async validateAndSpendPoints(
    userId: string | undefined,
    pointsUsed: number | undefined,
    subtotal: number,
    session?: ClientSession,
  ): Promise<{ pointsSpent: number; discountAmount: number }> {
    if (!pointsUsed || pointsUsed <= 0) {
      return { pointsSpent: 0, discountAmount: 0 };
    }

    if (!userId) {
      throw new BadRequestException(
        'Chỉ khách hàng có tài khoản mới có thể sử dụng điểm thưởng Loyalty',
      );
    }

    if (pointsUsed < 1000) {
      throw new BadRequestException(
        'Mức tiêu điểm tối thiểu là 1.000 điểm (tương đương 100.000 VNĐ)',
      );
    }

    const maxAllowedLoyaltyDiscount = Math.floor(subtotal * 0.2);
    const loyaltyDiscount = pointsUsed * 100;

    if (loyaltyDiscount > maxAllowedLoyaltyDiscount) {
      throw new BadRequestException(
        'Số điểm thưởng sử dụng vượt quá hạn mức tối đa cho phép (20% giá trị đơn hàng)',
      );
    }

    const updatedUser = await this.usersService.spendLoyaltyPoints(
      userId,
      pointsUsed,
      session,
    );

    if (!updatedUser) {
      throw new BadRequestException(
        'Số điểm thưởng trong tài khoản không đủ để thực hiện giao dịch',
      );
    }

    return {
      pointsSpent: pointsUsed,
      discountAmount: loyaltyDiscount,
    };
  }

  /**
   * Hoàn điểm thưởng cho user khi đơn hàng hủy hoặc rollback.
   */
  async refundLoyaltyPoints(
    userId: string,
    points: number,
    session?: ClientSession,
  ): Promise<void> {
    if (!points || points <= 0) return;
    try {
      await this.usersService.refundLoyaltyPoints(userId, points, session);
    } catch (err) {
      this.logger.error(
        `Hoàn điểm thưởng thất bại cho user ${userId}:`,
        err instanceof Error ? err.message : err,
      );
      if (session) throw err;
    }
  }

  /**
   * Thu hồi điểm thưởng đã cộng khi đơn hàng bị trả (RETURNED).
   */
  async deductAwardedPoints(
    userId: string,
    points: number,
    session?: ClientSession,
  ): Promise<void> {
    if (!points || points <= 0) return;
    await this.usersService.deductLoyaltyPoints(userId, points, session);
  }

  /**
   * Cộng điểm thưởng khi đơn hàng hoàn tất (DELIVERED / COMPLETED).
   */
  async awardOrderLoyalty(
    order: any,
    session?: ClientSession,
    afterCommit?: Array<() => Promise<void>>,
  ): Promise<number> {
    if (!order.customer || order.loyaltyAwarded) {
      return 0;
    }

    const merchandiseAmount =
      order.subtotal ?? order.total - (order.shippingFee || 0);
    const points = Math.floor(
      Math.max(
        0,
        merchandiseAmount -
          (order.discount || 0) -
          (order.loyaltyDiscount || 0),
      ) / 1000,
    );

    if (points <= 0) {
      return 0;
    }

    const customerId = order.customer.toString();
    try {
      const res = await this.usersService.addLoyaltyPoints(
        customerId,
        points,
        session,
      );
      order.loyaltyAwarded = true;
      order.loyaltyPointsAwarded = points;

      if (res) {
        const notifyLoyalty = async () => {
          const totalUserPoints = res.user?.loyaltyPoints ?? points;
          await this.notificationsService
            .create({
              userId: customerId,
              title: '🪙 Tích điểm thành công',
              message: `Bạn được cộng +${points.toLocaleString('vi-VN')} điểm từ đơn hàng #${order.orderCode}. Tổng tích lũy: ${totalUserPoints} điểm.`,
              type: 'loyalty',
              meta: {
                points,
                totalPoints: totalUserPoints,
                orderCode: order.orderCode,
              },
            })
            .catch((err) =>
              this.logger.error('Failed to create loyalty notification', err),
            );

          if (res.tierUpgraded) {
            const tierNameMap: Record<string, string> = {
              BRONZE: 'ĐỒNG',
              SILVER: 'BẠC',
              GOLD: 'VÀNG',
              DIAMOND: 'KIM CƯƠNG',
            };
            const tierVN = tierNameMap[res.newTier] || res.newTier;
            await this.notificationsService
              .create({
                userId: customerId,
                title: `🏆 Chúc mừng nâng hạng ${tierVN}`,
                message: `Chúc mừng bạn đã thăng hạng thành viên ${tierVN}! Mở khóa thêm nhiều quyền lợi và ưu đãi độc quyền.`,
                type: 'tier',
                meta: { newTier: res.newTier, oldTier: res.oldTier },
              })
              .catch((err) =>
                this.logger.error('Failed to create tier notification', err),
              );
          }
        };

        if (afterCommit) {
          afterCommit.push(notifyLoyalty);
        } else {
          await notifyLoyalty();
        }
      }
      return points;
    } catch (error) {
      if (session) throw error;
      this.logger.error(
        `Failed to award loyalty points for user ${customerId}`,
        error,
      );
      return 0;
    }
  }
}
