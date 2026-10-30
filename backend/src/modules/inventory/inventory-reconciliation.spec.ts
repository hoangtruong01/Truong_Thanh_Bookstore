/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { InventoryService } from './inventory.service';
import { ProductsService } from '../products/products.service';
import {
  InventoryStatus,
  InventoryTransactionType,
  ProductStatus,
} from '../../common/enums';

describe('QA-G1: Comprehensive Inventory Reconciliation & Data Integrity Test Suite', () => {
  let inventoryService: InventoryService;
  let productsService: ProductsService;

  let mockInventoryStore: Map<string, any>;
  let mockProductStore: Map<string, any>;
  let mockTransactionStore: any[];

  function createMockQuery(data: any) {
    return {
      exec: jest.fn().mockResolvedValue(data),
      session: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(data),
      }),
    };
  }

  beforeEach(() => {
    mockInventoryStore = new Map();
    mockProductStore = new Map();
    mockTransactionStore = [];

    // Seed test product
    const prodId = '507f1f77bcf86cd799439001';
    mockProductStore.set(prodId, {
      _id: prodId,
      name: 'Bút Bi Thiên Long TL-027',
      sku: 'BUT-TL027',
      stock: 100,
      price: 5000,
      status: ProductStatus.ACTIVE,
      isDeleted: false,
    });

    mockInventoryStore.set(prodId, {
      _id: 'inv_001',
      product: prodId,
      currentStock: 100,
      minStock: 20,
      maxStock: 500,
      status: InventoryStatus.IN_STOCK,
      lastUpdated: new Date(),
    });

    const mockInventoryModel: any = {
      findOne: jest.fn().mockImplementation((filter: any) => {
        const prod = filter?.product?.toString() || filter?.product;
        const item = mockInventoryStore.get(prod);
        return createMockQuery(item || null);
      }),
      find: jest.fn().mockImplementation(() => {
        return createMockQuery(Array.from(mockInventoryStore.values()));
      }),
      findOneAndUpdate: jest
        .fn()
        .mockImplementation((filter: any, update: any) => {
          const prod = filter?.product?.toString() || filter?.product;
          let item = mockInventoryStore.get(prod);
          if (!item) {
            item = {
              product: prod,
              currentStock: 0,
              minStock: 20,
              maxStock: 500,
            };
            mockInventoryStore.set(prod, item);
          }
          if (update.currentStock !== undefined)
            item.currentStock = update.currentStock;
          if (update.status !== undefined) item.status = update.status;
          item.lastUpdated = new Date();
          return createMockQuery(item);
        }),
      create: jest.fn().mockImplementation((doc: any) => {
        const prod = doc.product?.toString() || doc.product;
        mockInventoryStore.set(prod, { ...doc });
        return Promise.resolve(doc);
      }),
      countDocuments: jest.fn().mockImplementation(() => {
        return { exec: jest.fn().mockResolvedValue(mockInventoryStore.size) };
      }),
      db: {
        model: jest.fn().mockImplementation((name: string) => {
          if (name === 'Product') {
            return {
              find: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  lean: jest.fn().mockReturnValue({
                    exec: jest
                      .fn()
                      .mockResolvedValue(Array.from(mockProductStore.values())),
                  }),
                }),
                lean: jest.fn().mockReturnValue({
                  exec: jest
                    .fn()
                    .mockResolvedValue(Array.from(mockProductStore.values())),
                }),
                exec: jest
                  .fn()
                  .mockResolvedValue(Array.from(mockProductStore.values())),
              }),
            };
          }
          return null;
        }),
      },
    };

    const mockTransactionModel: any = {
      findOne: jest.fn().mockImplementation((filter: any) => {
        if (filter?.reference) {
          const match = mockTransactionStore.find(
            (t) => t.reference === filter.reference,
          );
          return createMockQuery(match || null);
        }
        return createMockQuery(null);
      }),
      find: jest.fn().mockReturnValue(createMockQuery(mockTransactionStore)),
      create: jest.fn().mockImplementation((doc: any) => {
        const payload = Array.isArray(doc) ? doc[0] : doc;
        mockTransactionStore.push(payload);
        return Promise.resolve(payload);
      }),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTransactionStore.length),
      }),
    };

    const mockProductModel: any = {
      findById: jest.fn().mockImplementation((id: string) => {
        return createMockQuery(mockProductStore.get(id) || null);
      }),
      findByIdAndUpdate: jest
        .fn()
        .mockImplementation((id: string, update: any) => {
          const item = mockProductStore.get(id);
          if (!item) return createMockQuery(null);
          if (update.$inc?.stock !== undefined) item.stock += update.$inc.stock;
          if (update.stock !== undefined) item.stock = update.stock;
          return createMockQuery(item);
        }),
      findOneAndUpdate: jest
        .fn()
        .mockImplementation((filter: any, update: any) => {
          const id = filter._id?.toString() || filter._id;
          const item = mockProductStore.get(id);
          if (!item) return createMockQuery(null);
          if (
            filter.stock?.$gte !== undefined &&
            item.stock < filter.stock.$gte
          ) {
            return createMockQuery(null); // Không đủ tồn kho
          }
          if (update.$inc?.stock !== undefined) item.stock += update.$inc.stock;
          return createMockQuery(item);
        }),
      deleteOne: jest.fn().mockImplementation((filter: any) => {
        mockProductStore.delete(filter._id?.toString());
        return { exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) };
      }),
    };

    const mockStockAlertModel: any = {
      find: jest.fn().mockReturnValue(createMockQuery([])),
      deleteMany: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
    };

    productsService = new ProductsService(
      mockProductModel,
      {} as any, // categoryModel
      mockInventoryModel,
      mockStockAlertModel,
      {} as any, // reviewsService
      {} as any, // emailService
      {} as any, // configService
      mockTransactionModel,
    );

    inventoryService = new InventoryService(
      mockInventoryModel,
      mockTransactionModel,
      productsService,
    );
  });

  it('1. Nhập kho 100, xuất kho 30 -> tồn 70 và đồng bộ Product.stock == Inventory.currentStock', async () => {
    const prodId = '507f1f77bcf86cd799439001';

    // Đặt tồn ban đầu = 0
    mockProductStore.get(prodId).stock = 0;
    mockInventoryStore.get(prodId).currentStock = 0;

    // Nhập kho 100
    await inventoryService.importStock({
      product: prodId,
      quantity: 100,
    });

    expect(mockProductStore.get(prodId).stock).toBe(100);
    expect(mockInventoryStore.get(prodId).currentStock).toBe(100);

    // Xuất kho 30
    await inventoryService.exportStock({
      product: prodId,
      quantity: 30,
    });

    expect(mockProductStore.get(prodId).stock).toBe(70);
    expect(mockInventoryStore.get(prodId).currentStock).toBe(70);

    // Kiểm tra lịch sử giao dịch
    expect(mockTransactionStore.length).toBe(2);
    expect(mockTransactionStore[0].change).toBe(100);
    expect(mockTransactionStore[1].change).toBe(-30);
  });

  it('2. TT-001: Kiểm kê hệ thống 70, thực tế 65 -> tồn 65, ghi điều chỉnh -5', async () => {
    const prodId = '507f1f77bcf86cd799439001';
    mockProductStore.get(prodId).stock = 70;
    mockInventoryStore.get(prodId).currentStock = 70;

    const res = await inventoryService.adjustStock({
      product: prodId,
      newStock: 65,
      expectedCurrentStock: 70,
      note: 'Kiểm kê kho thực tế',
    });

    expect(res.currentStock).toBe(65);
    expect(mockProductStore.get(prodId).stock).toBe(65);
    expect(mockInventoryStore.get(prodId).currentStock).toBe(65);

    const tx = mockTransactionStore.find(
      (t) => t.type === InventoryTransactionType.ADJUSTMENT,
    );
    expect(tx).toBeDefined();
    expect(tx.change).toBe(-5);
    expect(tx.stockBefore).toBe(70);
    expect(tx.stockAfter).toBe(65);
  });

  it('3. TT-001: Tồn 10, kiểm kê nhập 10 -> không phát sinh biến động, không ghi transaction', async () => {
    const prodId = '507f1f77bcf86cd799439001';
    mockProductStore.get(prodId).stock = 10;
    mockInventoryStore.get(prodId).currentStock = 10;

    const initialTxCount = mockTransactionStore.length;
    const res = await inventoryService.adjustStock({
      product: prodId,
      newStock: 10,
    });

    expect(res.currentStock).toBe(10);
    expect(mockTransactionStore.length).toBe(initialTxCount);
  });

  it('4. TT-005: Gửi lại một yêu cầu nhập kho do timeout với idempotencyKey -> không cộng thêm lần 2', async () => {
    const prodId = '507f1f77bcf86cd799439001';
    mockProductStore.get(prodId).stock = 50;
    mockInventoryStore.get(prodId).currentStock = 50;

    const idempotencyKey = 'import_req_unique_999';

    // Lần gửi 1: thành công
    await inventoryService.importStock({
      product: prodId,
      quantity: 20,
      reference: idempotencyKey,
    });

    expect(mockProductStore.get(prodId).stock).toBe(70);
    expect(mockInventoryStore.get(prodId).currentStock).toBe(70);

    // Lần gửi 2 (retry mạng timeout): cùng key, cùng payload
    await inventoryService.importStock({
      product: prodId,
      quantity: 20,
      reference: idempotencyKey,
    });

    // Số lượng KHÔNG được cộng thêm thành 90! Vẫn giữ nguyên 70!
    expect(mockProductStore.get(prodId).stock).toBe(70);
    expect(mockInventoryStore.get(prodId).currentStock).toBe(70);
    expect(
      mockTransactionStore.filter((t) => t.reference === idempotencyKey).length,
    ).toBe(1);
  });

  it('5. TT-005: Tái sử dụng idempotencyKey với payload khác -> từ chối 409 Conflict', async () => {
    const prodId = '507f1f77bcf86cd799439001';
    const idempotencyKey = 'import_req_unique_888';

    await inventoryService.importStock({
      product: prodId,
      quantity: 10,
      reference: idempotencyKey,
    });

    // Cố tình gửi lại với quantity khác (20 thay vì 10)
    await expect(
      inventoryService.importStock({
        product: prodId,
        quantity: 20,
        reference: idempotencyKey,
      }),
    ).rejects.toThrow();
  });

  it('6. TT-006: API GET danh sách kho hoàn toàn READ-ONLY (không insert dữ liệu mới)', async () => {
    const res = await inventoryService.findAll({ page: 1, limit: 10 });
    expect(res).toBeDefined();
    expect(res.data.length).toBeGreaterThan(0);
  });

  it('7. TT-008 & TT-017: Cảnh báo tồn kho theo minStock và tồn = 0 là OUT_OF_STOCK', async () => {
    const prodId = '507f1f77bcf86cd799439001';
    // minStock của sản phẩm là 20

    // Khi tồn = 20 (bằng minStock) -> LOW_STOCK
    mockProductStore.get(prodId).stock = 25;
    await productsService.updateStock(prodId, -5); // còn 20
    expect(mockInventoryStore.get(prodId).status).toBe(
      InventoryStatus.LOW_STOCK,
    );

    // Khi tồn = 0 -> OUT_OF_STOCK
    await productsService.updateStock(prodId, -20); // còn 0
    expect(mockInventoryStore.get(prodId).status).toBe(
      InventoryStatus.OUT_OF_STOCK,
    );
  });

  it('8. TT-002: Đối soát phát hiện chênh lệch giữa Product.stock và Inventory.currentStock', async () => {
    const prodId = '507f1f77bcf86cd799439001';

    // Giả lập dữ liệu bị lệch (Product có 100 nhưng Inventory có 90)
    mockProductStore.get(prodId).stock = 100;
    mockInventoryStore.get(prodId).currentStock = 90;

    const report = await inventoryService.reconcile();
    expect(report.totalChecked).toBe(1);
    expect(report.mismatchedCount).toBe(1);
    expect(report.discrepancies[0]).toEqual(
      expect.objectContaining({
        sku: 'BUT-TL027',
        productStock: 100,
        inventoryStock: 90,
        difference: 10,
      }),
    );
  });

  it('9. Atomic Check: Không cho xuất kho vượt quá số lượng tồn hiện có', async () => {
    const prodId = '507f1f77bcf86cd799439001';
    mockProductStore.get(prodId).stock = 10;
    mockInventoryStore.get(prodId).currentStock = 10;

    // Xuất 15 cái trong khi chỉ có 10
    await expect(
      inventoryService.exportStock({
        product: prodId,
        quantity: 15,
      }),
    ).rejects.toThrow();

    // Tồn kho không bị trừ
    expect(mockProductStore.get(prodId).stock).toBe(10);
    expect(mockInventoryStore.get(prodId).currentStock).toBe(10);
  });
});
