import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrderInventoryService } from './order-inventory.service';
import { ProductsService } from '../../products/products.service';
import { InventoryService } from '../../inventory/inventory.service';
import { InventoryTransactionType } from '../../../common/enums';

describe('OrderInventoryService — Multi-line Invariants & Defective Quarantine (T02/T03)', () => {
  let service: OrderInventoryService;
  let mockProductsService: any;
  let mockInventoryService: any;

  beforeEach(async () => {
    mockProductsService = {
      deductStock: jest.fn(),
      incrementSold: jest.fn(),
      updateStock: jest.fn(),
    };

    mockInventoryService = {
      recordExternalMovement: jest.fn().mockResolvedValue(undefined),
      deleteTransactionsByReference: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderInventoryService,
        { provide: ProductsService, useValue: mockProductsService },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<OrderInventoryService>(OrderInventoryService);
  });

  describe('T02 Invariant: Lỗi giữa hai dòng không làm lệch đơn/tồn/ledger', () => {
    it('successfully deducts stock for all items when all lines have sufficient stock', async () => {
      mockProductsService.deductStock.mockResolvedValue(undefined);
      mockProductsService.incrementSold.mockResolvedValue(undefined);

      const items = [
        { product: 'prod_1', quantity: 2 },
        { product: 'prod_2', quantity: 3 },
      ];

      const deducted = await service.deductOrderStock(items, undefined, 'ORD-001');

      expect(deducted).toHaveLength(2);
      expect(mockProductsService.deductStock).toHaveBeenCalledTimes(2);
      expect(mockProductsService.deductStock).toHaveBeenNthCalledWith(1, 'prod_1', 2);
      expect(mockProductsService.deductStock).toHaveBeenNthCalledWith(2, 'prod_2', 3);
    });

    it('automatically rolls back line 1 if line 2 fails when running without session (compensation rollback)', async () => {
      // Line 1 succeeds
      mockProductsService.deductStock
        .mockResolvedValueOnce(undefined)
        // Line 2 throws insufficient stock
        .mockRejectedValueOnce(new BadRequestException('Không đủ tồn kho cho sản phẩm (ID: prod_2)'));

      mockProductsService.updateStock.mockResolvedValue(undefined);
      mockProductsService.incrementSold.mockResolvedValue(undefined);

      const items = [
        { product: 'prod_1', quantity: 2 },
        { product: 'prod_2', quantity: 5 },
      ];

      await expect(
        service.deductOrderStock(items, undefined, 'ORD-002'),
      ).rejects.toThrow(BadRequestException);

      // Verify that line 1's deduction was compensated and rolled back!
      expect(mockProductsService.updateStock).toHaveBeenCalledWith('prod_1', 2);
      expect(mockProductsService.incrementSold).toHaveBeenCalledWith('prod_1', -2);
      expect(mockInventoryService.deleteTransactionsByReference).toHaveBeenCalledWith('ORD-002');
    });
  });

  describe('T03 Invariant: Hàng lỗi/chờ kiểm không góp vào tồn bán', () => {
    const validOrderId1 = '507f1f77bcf86cd799439011';
    const validOrderId2 = '507f1f77bcf86cd799439022';

    it('restores sellable stock when returned item is in GOOD condition', async () => {
      mockProductsService.updateStock.mockResolvedValue(undefined);
      mockProductsService.incrementSold.mockResolvedValue(undefined);

      const items = [
        { product: 'prod_1', quantity: 1, isDefective: false, condition: 'GOOD' },
      ];

      await service.restoreOrderStock(items, 'RETURN:ORD-003', validOrderId1);

      // Sellable stock is updated
      expect(mockProductsService.updateStock).toHaveBeenCalledWith('prod_1', 1);
      expect(mockProductsService.incrementSold).toHaveBeenCalledWith('prod_1', -1);
      expect(mockInventoryService.recordExternalMovement).toHaveBeenCalledWith(
        'prod_1',
        InventoryTransactionType.RETURN,
        1,
        'RETURN:ORD-003',
        validOrderId1,
        undefined,
      );
    });

    it('does NOT increase sellable stock when returned item is DAMAGED/DEFECTIVE (sent to quarantine)', async () => {
      mockProductsService.updateStock.mockResolvedValue(undefined);
      mockProductsService.incrementSold.mockResolvedValue(undefined);

      const items = [
        { product: 'prod_damaged_1', quantity: 3, isDefective: true, condition: 'DAMAGED' },
      ];

      await service.restoreOrderStock(items, 'RETURN:ORD-004', validOrderId2);

      // Sellable stock must NEVER be increased!
      expect(mockProductsService.updateStock).not.toHaveBeenCalled();
      // Sold count is adjusted
      expect(mockProductsService.incrementSold).toHaveBeenCalledWith('prod_damaged_1', -3);
      // Quarantine damage movement recorded
      expect(mockInventoryService.recordExternalMovement).toHaveBeenCalledWith(
        'prod_damaged_1',
        InventoryTransactionType.DAMAGE,
        3,
        'RETURN:ORD-004:QUARANTINE',
        validOrderId2,
        undefined,
      );
    });
  });
});
