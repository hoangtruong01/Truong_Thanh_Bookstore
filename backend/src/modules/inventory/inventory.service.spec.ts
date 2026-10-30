/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { InventoryService } from './inventory.service';
import { InventoryTransactionType } from '../../common/enums';
import { BadRequestException, ConflictException } from '@nestjs/common';

const query = (value: any) => ({
  session: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(value),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
});

describe('InventoryService — Comprehensive Ledger & Consistency Tests', () => {
  function createService(stockAfter: number, stockBefore?: number) {
    let findOneCount = 0;
    const inventoryBefore = {
      product: '507f1f77bcf86cd799439011',
      currentStock: stockBefore !== undefined ? stockBefore : stockAfter,
      minStock: 10,
    };
    const inventoryAfter = {
      product: '507f1f77bcf86cd799439011',
      currentStock: stockAfter,
      minStock: 10,
    };
    const inventoryModel: any = {
      findOne: jest.fn().mockImplementation(() => {
        findOneCount++;
        const inv =
          stockBefore !== undefined && findOneCount === 1
            ? inventoryBefore
            : inventoryAfter;
        return query(inv);
      }),
      find: jest.fn().mockReturnValue(query([inventoryAfter])),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(1) }),
      db: {
        model: jest.fn().mockReturnValue({
          find: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([
                  {
                    _id: '507f1f77bcf86cd799439011',
                    name: 'Bút Bi',
                    sku: 'BUT-01',
                    stock: 10,
                  },
                ]),
              }),
            }),
          }),
        }),
      },
    };
    const transactionModel: any = {
      findOne: jest.fn().mockReturnValue(query(null)),
      find: jest.fn().mockReturnValue(query([])),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
      create: jest.fn().mockResolvedValue({}),
    };
    const products: any = {
      deductStock: jest.fn().mockResolvedValue(undefined),
      updateStock: jest.fn().mockResolvedValue(undefined),
    };
    return {
      service: new InventoryService(inventoryModel, transactionModel, products),
      inventoryModel,
      transactionModel,
      products,
    };
  }

  describe('Legacy Ledger Movements', () => {
    it('records IMPORT with before/after balances', async () => {
      const { service, transactionModel, products } = createService(15);
      await service.importStock({
        product: '507f1f77bcf86cd799439011',
        quantity: 5,
      });
      expect(products.updateStock).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        5,
        undefined,
      );
      expect(transactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: InventoryTransactionType.IMPORT,
          change: 5,
          stockBefore: 10,
          stockAfter: 15,
        }),
      );
    });

    it.each([
      [InventoryTransactionType.SALE, 'exportStock'],
      [InventoryTransactionType.DAMAGE, 'damageStock'],
    ] as const)(
      'prevents negative stock through atomic deduction for %s',
      async (type, method) => {
        const { service, transactionModel, products } = createService(7);
        await (service[method] as any).call(service, {
          product: '507f1f77bcf86cd799439011',
          quantity: 3,
        });
        expect(products.deductStock).toHaveBeenCalledWith(
          '507f1f77bcf86cd799439011',
          3,
          undefined,
        );
        expect(transactionModel.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type,
            change: -3,
            stockBefore: 10,
            stockAfter: 7,
          }),
        );
      },
    );

    it('supports signed ADJUSTMENT and RETURN movements', async () => {
      const adjustment = createService(8);
      await adjustment.service.adjustStock({
        product: '507f1f77bcf86cd799439011',
        quantity: -2,
      });
      expect(adjustment.transactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: InventoryTransactionType.ADJUSTMENT,
          change: -2,
        }),
      );

      const returned = createService(12);
      await returned.service.returnStock({
        product: '507f1f77bcf86cd799439011',
        quantity: 2,
      });
      expect(returned.transactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: InventoryTransactionType.RETURN,
          change: 2,
        }),
      );
    });
  });

  describe('TT-001: Physical Stock Count Adjustment (newStock)', () => {
    it('Tồn 10, kiểm kê nhập 15 -> tăng tồn thành 15, phát sinh biến động +5', async () => {
      const { service, transactionModel, products } = createService(15, 10);
      const res = await service.adjustStock({
        product: '507f1f77bcf86cd799439011',
        newStock: 15,
        note: 'Kiểm kê định kỳ tháng 10',
      });

      expect(products.updateStock).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        5,
        undefined,
      );
      expect(transactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: InventoryTransactionType.ADJUSTMENT,
          quantity: 5,
          change: 5,
          stockBefore: 10,
          stockAfter: 15,
          note: 'Kiểm kê định kỳ tháng 10',
        }),
      );
      expect(res.currentStock).toBe(15);
    });

    it('Tồn 10, kiểm kê nhập 7 -> giảm tồn thành 7, phát sinh biến động -3', async () => {
      const { service, transactionModel, products } = createService(7, 10);
      const res = await service.adjustStock({
        product: '507f1f77bcf86cd799439011',
        newStock: 7,
        note: 'Kiểm kê phát hiện hao hụt',
      });

      expect(products.deductStock).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        3,
        undefined,
      );
      expect(transactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: InventoryTransactionType.ADJUSTMENT,
          quantity: 3,
          change: -3,
          stockBefore: 10,
          stockAfter: 7,
          note: 'Kiểm kê phát hiện hao hụt',
        }),
      );
      expect(res.currentStock).toBe(7);
    });

    it('Tồn 10, kiểm kê nhập 10 -> không phát sinh biến động, không ghi transaction', async () => {
      const { service, transactionModel, products } = createService(10, 10);
      const res = await service.adjustStock({
        product: '507f1f77bcf86cd799439011',
        newStock: 10,
        note: 'Kiểm kê khớp 100%',
      });

      expect(products.updateStock).not.toHaveBeenCalled();
      expect(products.deductStock).not.toHaveBeenCalled();
      expect(transactionModel.create).not.toHaveBeenCalled();
      expect(res.currentStock).toBe(10);
    });

    it('Từ chối điều chỉnh tồn kho thành số âm', async () => {
      const { service } = createService(10);
      await expect(
        service.adjustStock({
          product: '507f1f77bcf86cd799439011',
          newStock: -5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('Optimistic Lock: Từ chối nếu tồn kho đã thay đổi trong lúc nhân viên mở form kiểm kê', async () => {
      const { service } = createService(10, 10);
      await expect(
        service.adjustStock({
          product: '507f1f77bcf86cd799439011',
          newStock: 12,
          expectedCurrentStock: 8,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('TT-005: Idempotency Protection', () => {
    it('Cùng idempotencyKey và cùng payload -> trả về kết quả cũ an toàn (không cộng trừ 2 lần)', async () => {
      const { service, transactionModel, products } = createService(15);

      transactionModel.findOne.mockReturnValue(
        query({
          reference: 'req_123',
          product: '507f1f77bcf86cd799439011',
          type: InventoryTransactionType.IMPORT,
          change: 5,
        }),
      );

      const res = await service.importStock({
        product: '507f1f77bcf86cd799439011',
        quantity: 5,
        reference: 'req_123',
      });

      expect(products.updateStock).not.toHaveBeenCalled();
      expect(transactionModel.create).not.toHaveBeenCalled();
      expect(res.currentStock).toBe(15);
    });

    it('Cùng idempotencyKey nhưng payload khác -> ném ConflictException 409', async () => {
      const { service, transactionModel } = createService(10);

      // Giao dịch đã tồn tại là IMPORT 5
      transactionModel.findOne.mockReturnValue(
        query({
          reference: 'req_123',
          product: '507f1f77bcf86cd799439011',
          type: InventoryTransactionType.IMPORT,
          change: 5,
        }),
      );

      // Gửi lại cùng key req_123 nhưng yêu cầu IMPORT 10
      await expect(
        service.importStock({
          product: '507f1f77bcf86cd799439011',
          quantity: 10,
          reference: 'req_123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('TT-002: Reconciliation Tool', () => {
    it('Phát hiện chính xác chênh lệch giữa Product.stock và Inventory.currentStock', async () => {
      const inventoryModel: any = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              { product: '507f1f77bcf86cd799439011', currentStock: 10 },
              { product: '507f1f77bcf86cd799439022', currentStock: 25 }, // Lệch
            ]),
          }),
        }),
        db: {
          model: jest.fn().mockReturnValue({
            find: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue([
                    {
                      _id: '507f1f77bcf86cd799439011',
                      name: 'Bút Bi',
                      sku: 'BUT-01',
                      stock: 10,
                    },
                    {
                      _id: '507f1f77bcf86cd799439022',
                      name: 'Vở Kẻ Ngang',
                      sku: 'VO-01',
                      stock: 30,
                    }, // Khác 25
                  ]),
                }),
              }),
            }),
          }),
        },
      };

      const service = new InventoryService(
        inventoryModel,
        {} as any,
        {} as any,
      );
      const report = await service.reconcile();

      expect(report.totalChecked).toBe(2);
      expect(report.matchedCount).toBe(1);
      expect(report.mismatchedCount).toBe(1);
      expect(report.discrepancies[0]).toEqual(
        expect.objectContaining({
          sku: 'VO-01',
          productStock: 30,
          inventoryStock: 25,
          difference: 5,
          reason: 'Lệch số lượng tồn (Stock mismatch)',
        }),
      );
    });

    it('Phát hiện sản phẩm thiếu bản ghi kho và bản ghi kho mồ côi', async () => {
      const inventoryModel: any = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              { product: '507f1f77bcf86cd799439099', currentStock: 5 }, // Mồ côi (product không có trong DB)
            ]),
          }),
        }),
        db: {
          model: jest.fn().mockReturnValue({
            find: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue([
                    {
                      _id: '507f1f77bcf86cd799439011',
                      name: 'Bút Bi',
                      sku: 'BUT-01',
                      stock: 10,
                    }, // Không có inventory
                  ]),
                }),
              }),
            }),
          }),
        },
      };

      const service = new InventoryService(
        inventoryModel,
        {} as any,
        {} as any,
      );
      const report = await service.reconcile();

      expect(report.discrepancies.length).toBe(2);
      expect(report.discrepancies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            productId: '507f1f77bcf86cd799439011',
            reason: 'Thiếu bản ghi kho (Missing inventory record)',
          }),
          expect.objectContaining({
            productId: '507f1f77bcf86cd799439099',
            reason: 'Bản ghi kho mồ côi (Orphan inventory record)',
          }),
        ]),
      );
    });
  });
});
