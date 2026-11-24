import { Injectable, Logger, Optional } from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { ProductsService } from '../../products/products.service';
import { InventoryService } from '../../inventory/inventory.service';
import { InventoryTransactionType } from '../../../common/enums';

export interface RestoreOrderItem {
  product: any;
  quantity: number;
  isDefective?: boolean;
  condition?: string;
}

@Injectable()
export class OrderInventoryService {
  private readonly logger = new Logger(OrderInventoryService.name);

  constructor(
    private readonly productsService: ProductsService,
    @Optional() private readonly inventoryService?: InventoryService,
  ) {}

  /**
   * Trừ tồn kho và cập nhật số lượng đã bán cho danh sách sản phẩm trong đơn hàng.
   * T02: Bảo vệ bất biến giữa hai dòng hàng — nếu dòng sau lỗi và không có mongo session,
   * tự động bồi hoàn (compensation rollback) toàn bộ các dòng đã trừ trước đó.
   */
  async deductOrderStock(
    items: Array<{ product: string; quantity: number }>,
    session?: ClientSession,
    orderCode?: string,
  ): Promise<Array<{ product: string; quantity: number }>> {
    const deductedItems: Array<{ product: string; quantity: number }> = [];

    try {
      for (const item of items) {
        if (session) {
          await this.productsService.deductStock(
            item.product,
            item.quantity,
            session,
          );
          await this.productsService.incrementSold(
            item.product,
            item.quantity,
            session,
          );
        } else {
          await this.productsService.deductStock(item.product, item.quantity);
          await this.productsService.incrementSold(item.product, item.quantity);
        }
        deductedItems.push({
          product: item.product,
          quantity: item.quantity,
        });

        if (this.inventoryService && orderCode) {
          await this.inventoryService.recordExternalMovement(
            item.product,
            InventoryTransactionType.SALE,
            item.quantity,
            orderCode,
            undefined,
            session,
          );
        }
      }
      return deductedItems;
    } catch (err) {
      if (!session && deductedItems.length > 0) {
        this.logger.warn(
          `Deduct order stock failed on a subsequent line item for order ${orderCode || 'N/A'}. Initiating compensation rollback for ${deductedItems.length} items.`,
        );
        await this.rollbackStock(deductedItems, orderCode).catch((rbErr) =>
          this.logger.error(
            'Failed to rollback partial stock deduction',
            rbErr,
          ),
        );
      }
      throw err;
    }
  }

  /**
   * Rollback lại số lượng tồn kho nếu quá trình tạo đơn hàng gặp lỗi và không có mongo session.
   * INV-01: Also cleans up orphan SALE InventoryTransactions.
   */
  async rollbackStock(
    deductedItems: Array<{ product: string; quantity: number }>,
    orderCode?: string,
  ): Promise<void> {
    for (const deducted of [...deductedItems].reverse()) {
      await this.productsService
        .updateStock(deducted.product, deducted.quantity)
        .catch((rollbackError) =>
          this.logger.error('Stock rollback failed', rollbackError),
        );
      await this.productsService
        .incrementSold(deducted.product, -deducted.quantity)
        .catch((rollbackError) =>
          this.logger.error('Sold counter rollback failed', rollbackError),
        );
    }
    // INV-01: Remove orphan SALE inventory transactions created during checkout
    if (
      this.inventoryService &&
      typeof (this.inventoryService as any).deleteTransactionsByReference ===
        'function' &&
      orderCode
    ) {
      await this.inventoryService
        .deleteTransactionsByReference(orderCode)
        .catch((err) =>
          this.logger.error(
            'Failed to clean orphan inventory transactions',
            err,
          ),
        );
    }
  }

  /**
   * Hoàn lại tồn kho khi đơn hàng bị hủy hoặc hoàn trả.
   * T03: Hàng lỗi/hỏng (isDefective hoặc condition === DAMAGED) chuyển vào kho cách ly
   * (InventoryTransactionType.DAMAGE), TUYỆT ĐỐI KHÔNG cộng vào tồn bán khả dụng (updateStock).
   */
  async restoreOrderStock(
    items: Array<RestoreOrderItem>,
    reference: string,
    orderId?: string,
    session?: ClientSession,
  ): Promise<void> {
    for (const item of items) {
      const productId =
        typeof item.product === 'object' && item.product?._id
          ? item.product._id.toString()
          : item.product.toString();

      const isDamaged =
        Boolean(item.isDefective) ||
        item.condition === 'DAMAGED' ||
        item.condition === 'DEFECTIVE';

      if (!isDamaged) {
        // Hàng nguyên vẹn: khôi phục tồn bán khả dụng
        if (session) {
          await this.productsService.updateStock(
            productId,
            item.quantity,
            session,
          );
          await this.productsService.incrementSold(
            productId,
            -item.quantity,
            session,
          );
        } else {
          await this.productsService.updateStock(productId, item.quantity);
          await this.productsService.incrementSold(productId, -item.quantity);
        }

        if (this.inventoryService) {
          await this.inventoryService.recordExternalMovement(
            productId,
            InventoryTransactionType.RETURN,
            item.quantity,
            reference,
            orderId && Types.ObjectId.isValid(orderId) ? orderId : undefined,
            session,
          );
        }
      } else {
        // T03: Hàng lỗi/chờ kiểm không góp vào tồn bán
        this.logger.log(
          `Sản phẩm ${productId} hoàn trả trong tình trạng lỗi/hỏng. Nhập kho cách ly (DAMAGE), không tăng tồn bán khả dụng.`,
        );
        if (session) {
          await this.productsService.incrementSold(
            productId,
            -item.quantity,
            session,
          );
        } else {
          await this.productsService.incrementSold(productId, -item.quantity);
        }

        if (this.inventoryService) {
          await this.inventoryService.recordExternalMovement(
            productId,
            InventoryTransactionType.DAMAGE,
            item.quantity,
            `${reference}:QUARANTINE`,
            orderId && Types.ObjectId.isValid(orderId) ? orderId : undefined,
            session,
          );
        }
      }
    }
  }
}
