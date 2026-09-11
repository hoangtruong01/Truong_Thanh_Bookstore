import { Injectable, Logger, Optional } from '@nestjs/common';
import { ClientSession, Types } from 'mongoose';
import { ProductsService } from '../../products/products.service';
import { InventoryService } from '../../inventory/inventory.service';
import { InventoryTransactionType } from '../../../common/enums';

@Injectable()
export class OrderInventoryService {
  private readonly logger = new Logger(OrderInventoryService.name);

  constructor(
    private readonly productsService: ProductsService,
    @Optional() private readonly inventoryService?: InventoryService,
  ) {}

  /**
   * Trừ tồn kho và cập nhật số lượng đã bán cho danh sách sản phẩm trong đơn hàng.
   */
  async deductOrderStock(
    items: Array<{ product: string; quantity: number }>,
    session?: ClientSession,
    orderCode?: string,
  ): Promise<Array<{ product: string; quantity: number }>> {
    const deductedItems: Array<{ product: string; quantity: number }> = [];

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
  }

  /**
   * Rollback lại số lượng tồn kho nếu quá trình tạo đơn hàng gặp lỗi và không có mongo session.
   */
  async rollbackStock(
    deductedItems: Array<{ product: string; quantity: number }>,
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
  }

  /**
   * Hoàn lại tồn kho khi đơn hàng bị hủy hoặc hoàn trả.
   */
  async restoreOrderStock(
    items: Array<{ product: any; quantity: number }>,
    reference: string,
    orderId?: string,
    session?: ClientSession,
  ): Promise<void> {
    for (const item of items) {
      const productId =
        typeof item.product === 'object' && item.product?._id
          ? item.product._id.toString()
          : item.product.toString();

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
    }
  }
}
