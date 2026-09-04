import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrdersService } from './orders.service';

@Injectable()
export class OrderScheduleService {
  private readonly logger = new Logger(OrderScheduleService.name);

  constructor(private readonly ordersService: OrdersService) {}

  /**
   * BE-05: Cron Job runs every 15 minutes to auto-cancel expired PENDING orders
   * (24h for online/bank transfer, 48h for COD) and send advance 2-hour warnings.
   */
  @Cron('*/15 * * * *')
  async handleOrderExpirationCron() {
    this.logger.log(
      'Đang chạy cron job kiểm tra đơn hàng quá hạn & cảnh báo...',
    );
    try {
      const warningsCount = await this.ordersService.handleAutoCancelWarnings();
      const cancelledCount = await this.ordersService.handleAutoCancelOrders();
      this.logger.log(
        `Cron hoàn tất: Đã gửi ${warningsCount} cảnh báo 2h, tự động hủy ${cancelledCount} đơn quá hạn.`,
      );
    } catch (error: any) {
      this.logger.error(
        'Lỗi khi thực thi cron job hủy đơn hàng quá hạn:',
        error,
      );
    }
  }
}
