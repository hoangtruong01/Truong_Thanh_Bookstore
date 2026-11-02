import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { SupplierQuotationsService } from './supplier-quotations.service';
import { SupplierQuotation } from './schemas/supplier-quotation.schema';
import { PurchaseOrder } from './schemas/purchase-order.schema';
import { Supplier } from '../suppliers/schemas/supplier.schema';
import { Product } from '../products/schemas/product.schema';
import { PurchaseOrdersService } from './purchase-orders.service';
import { QuotationStatus } from '../../common/enums';

describe('SupplierQuotationsService (PUR-02)', () => {
  let service: SupplierQuotationsService;
  let quotationModelMock: any;
  let poModelMock: any;
  let supplierModelMock: any;
  let productModelMock: any;
  let poServiceMock: any;

  const mockUserId = new Types.ObjectId().toString();
  const mockSupplierId = new Types.ObjectId().toString();
  const mockProductId = new Types.ObjectId().toString();

  beforeEach(async () => {
    // Model Mock constructor
    quotationModelMock = jest.fn().mockImplementation(function (data) {
      Object.assign(this, data);
      this._id = this._id || new Types.ObjectId();
      this.save = jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      });
    });

    quotationModelMock.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
      session: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
    });
    quotationModelMock.find = jest.fn();
    quotationModelMock.db = {
      collection: jest.fn().mockReturnValue({
        findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 42 }),
      }),
    };

    poModelMock = {
      findOne: jest.fn(),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }),
    };

    supplierModelMock = {
      findOne: jest.fn(),
    };

    productModelMock = {
      findOne: jest.fn(),
    };

    poServiceMock = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierQuotationsService,
        {
          provide: getModelToken(SupplierQuotation.name),
          useValue: quotationModelMock,
        },
        {
          provide: getModelToken(PurchaseOrder.name),
          useValue: poModelMock,
        },
        {
          provide: getModelToken(Supplier.name),
          useValue: supplierModelMock,
        },
        {
          provide: getModelToken(Product.name),
          useValue: productModelMock,
        },
        {
          provide: PurchaseOrdersService,
          useValue: poServiceMock,
        },
      ],
    }).compile();

    service = module.get<SupplierQuotationsService>(SupplierQuotationsService);
  });

  describe('create (PUR-02-T01, PUR-02-T02)', () => {
    it('PUR-02-T01: tạo báo giá thành công với đầy đủ MOQ, lead time và bậc giá', async () => {
      supplierModelMock.findOne.mockResolvedValue({
        _id: new Types.ObjectId(mockSupplierId),
        name: 'Công ty Văn phòng phẩm Ánh Dương',
        isDeleted: false,
      });

      productModelMock.findOne.mockResolvedValue({
        _id: new Types.ObjectId(mockProductId),
        name: 'Bút bi Thiên Long TL-027',
        sku: 'SKU-TL-027',
        unit: 'cây',
        isDeleted: false,
      });

      const dto = {
        supplier: mockSupplierId,
        validFrom: '2026-11-01',
        validUntil: '2026-12-31',
        paymentTerms: 'NET30',
        defectRate: 0.01,
        onTimeDeliveryRate: 0.98,
        notes: 'Báo giá quý 4/2026',
        items: [
          {
            product: mockProductId,
            productName: 'Bút bi Thiên Long TL-027',
            sku: 'SKU-TL-027',
            unit: 'cây',
            moq: 50,
            leadTimeDays: 2,
            baseUnitPrice: 45000,
            priceTiers: [
              { minQuantity: 100, unitPrice: 42000 },
              { minQuantity: 500, unitPrice: 39000 },
            ],
          },
        ],
      };

      const result = await service.create(dto, mockUserId);

      expect(result).toBeDefined();
      expect(result.supplier.toString()).toBe(mockSupplierId);
      expect(result.status).toBe(QuotationStatus.DRAFT);
      expect(result.items[0].priceTiers).toHaveLength(2);
      expect(result.items[0].priceTiers[0].unitPrice).toBe(42000);
      expect(result.quotationCode).toMatch(/^QUO\d{6}-0042$/);
    });

    it('PUR-02-T02: từ chối nếu ngày kết thúc hiệu lực nhỏ hơn ngày bắt đầu', async () => {
      supplierModelMock.findOne.mockResolvedValue({
        _id: new Types.ObjectId(mockSupplierId),
        isDeleted: false,
      });

      const dto = {
        supplier: mockSupplierId,
        validFrom: '2026-12-31',
        validUntil: '2026-11-01',
        items: [],
      };

      await expect(service.create(dto as any, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('PUR-02-T02b: từ chối nếu nhà cung cấp không tồn tại', async () => {
      supplierModelMock.findOne.mockResolvedValue(null);

      const dto = {
        supplier: mockSupplierId,
        validFrom: '2026-11-01',
        validUntil: '2026-12-31',
        items: [],
      };

      await expect(service.create(dto as any, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('approve & reject (PUR-02-T03, PUR-02-T04)', () => {
    it('PUR-02-T03: duyệt báo giá thành công khi còn hạn hiệu lực', async () => {
      const mockQuotation = {
        _id: new Types.ObjectId(),
        status: QuotationStatus.DRAFT,
        validUntil: new Date('2028-12-31'),
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      quotationModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockQuotation),
      });

      const res = await service.approve(
        mockQuotation._id.toString(),
        mockUserId,
      );

      expect(res.status).toBe(QuotationStatus.APPROVED);
      expect(res.approvedBy).toBeDefined();
    });

    it('PUR-02-T04: từ chối duyệt báo giá đã hết hạn hiệu lực', async () => {
      const mockQuotation = {
        _id: new Types.ObjectId(),
        status: QuotationStatus.DRAFT,
        validUntil: new Date('2020-01-01'), // Đã quá hạn
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      quotationModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockQuotation),
      });

      await expect(
        service.approve(mockQuotation._id.toString(), mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('PUR-02-T13: từ chối báo giá (reject) cập nhật lý do từ chối vào notes', async () => {
      const mockQuotation = {
        _id: new Types.ObjectId(),
        status: QuotationStatus.DRAFT,
        notes: 'Ghi chú ban đầu',
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      quotationModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockQuotation),
      });

      const res = await service.reject(
        mockQuotation._id.toString(),
        mockUserId,
        'Giá quá cao so với mặt bằng chung',
      );

      expect(res.status).toBe(QuotationStatus.REJECTED);
      expect(res.notes).toContain('Lý do từ chối: Giá quá cao');
    });
  });

  describe('getPriceHistory (PUR-02-T05)', () => {
    it('PUR-02-T05: truy xuất lịch sử giá từ báo giá và đơn đặt mua PO thực tế', async () => {
      productModelMock.findOne.mockResolvedValue({
        _id: new Types.ObjectId(mockProductId),
        name: 'Bút bi Thiên Long TL-027',
        sku: 'SKU-TL-027',
        costPrice: 42000,
        isDeleted: false,
      });

      quotationModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: new Types.ObjectId(),
                quotationCode: 'QUO-261102-0001',
                supplier: { name: 'Ánh Dương' },
                status: QuotationStatus.APPROVED,
                validFrom: new Date('2026-11-01'),
                validUntil: new Date('2026-12-31'),
                items: [
                  {
                    product: new Types.ObjectId(mockProductId),
                    baseUnitPrice: 45000,
                    moq: 50,
                  },
                ],
              },
            ]),
          }),
        }),
      });

      poModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([
                {
                  _id: new Types.ObjectId(),
                  poCode: 'PO261101-0005',
                  supplier: { name: 'Ánh Dương' },
                  status: 'FULLY_RECEIVED',
                  items: [
                    {
                      product: new Types.ObjectId(mockProductId),
                      orderedQuantity: 200,
                      expectedUnitPrice: 42000,
                      lineTotal: 8400000,
                    },
                  ],
                },
              ]),
            }),
          }),
        }),
      });

      const history = await service.getPriceHistory(mockProductId);

      expect(history.product.sku).toBe('SKU-TL-027');
      expect(history.quotationHistory).toHaveLength(1);
      expect(history.quotationHistory[0].baseUnitPrice).toBe(45000);
      expect(history.purchaseHistory).toHaveLength(1);
      expect(history.purchaseHistory[0].actualUnitPrice).toBe(42000);
    });
  });

  describe('compareSuppliers (PUR-02-T06 -> PUR-02-T09)', () => {
    it('PUR-02-T06: so sánh 3 NCC cùng SKU và xếp hạng đề xuất tối ưu', async () => {
      productModelMock.findOne.mockResolvedValue({
        _id: new Types.ObjectId(mockProductId),
        name: 'Giấy A4 Double A 70gsm',
        sku: 'SKU-A4-70',
        isDeleted: false,
      });

      // Mock 3 báo giá từ 3 NCC khác nhau
      const supplierA = {
        _id: new Types.ObjectId(),
        name: 'NCC A - Giá siêu rẻ nhưng lead time dài',
      };
      const supplierB = {
        _id: new Types.ObjectId(),
        name: 'NCC B - Giao siêu tốc, chất lượng cao',
      };
      const supplierC = {
        _id: new Types.ObjectId(),
        name: 'NCC C - MOQ lớn 200 ram',
      };

      const mockQuotations = [
        {
          _id: new Types.ObjectId(),
          quotationCode: 'QUO-A',
          supplier: supplierA,
          status: QuotationStatus.APPROVED,
          defectRate: 0.02,
          onTimeDeliveryRate: 0.92,
          items: [
            {
              product: new Types.ObjectId(mockProductId),
              moq: 10,
              leadTimeDays: 10, // Dài
              baseUnitPrice: 65000,
              priceTiers: [{ minQuantity: 100, unitPrice: 60000 }],
            },
          ],
        },
        {
          _id: new Types.ObjectId(),
          quotationCode: 'QUO-B',
          supplier: supplierB,
          status: QuotationStatus.APPROVED,
          defectRate: 0.005, // Siêu ít lỗi
          onTimeDeliveryRate: 0.99, // Rất đúng hẹn
          items: [
            {
              product: new Types.ObjectId(mockProductId),
              moq: 10,
              leadTimeDays: 1, // Siêu nhanh
              baseUnitPrice: 66000,
              priceTiers: [{ minQuantity: 100, unitPrice: 62000 }],
            },
          ],
        },
        {
          _id: new Types.ObjectId(),
          quotationCode: 'QUO-C',
          supplier: supplierC,
          status: QuotationStatus.APPROVED,
          defectRate: 0.08, // Tỷ lệ lỗi cao > 5%
          onTimeDeliveryRate: 0.85,
          items: [
            {
              product: new Types.ObjectId(mockProductId),
              moq: 200, // MOQ lớn hơn số lượng 120
              leadTimeDays: 4,
              baseUnitPrice: 58000,
              priceTiers: [{ minQuantity: 100, unitPrice: 55000 }],
            },
          ],
        },
      ];

      quotationModelMock.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockQuotations),
        }),
      });

      // So sánh với số lượng đặt mua = 120
      const comparison = await service.compareSuppliers({
        productId: mockProductId,
        quantity: 120,
      });

      expect(comparison.totalSuppliersCompared).toBe(3);
      expect(comparison.suppliers).toHaveLength(3);

      // PUR-02-T07: NCC A có cảnh báo lead time dài (10 ngày)
      const evalA = comparison.suppliers.find(
        (s) => s.quotationCode === 'QUO-A',
      );
      expect(
        evalA.warnings.some((w: string) =>
          w.includes('Thời gian giao hàng dài'),
        ),
      ).toBe(true);

      // PUR-02-T08: NCC C bị cảnh báo vi phạm MOQ (120 < 200)
      const evalC = comparison.suppliers.find(
        (s) => s.quotationCode === 'QUO-C',
      );
      expect(evalC.isMoqSatisfied).toBe(false);
      expect(
        evalC.warnings.some((w: string) => w.includes('thấp hơn MOQ')),
      ).toBe(true);

      // PUR-02-T09: NCC C có cảnh báo tỷ lệ hàng lỗi cao (8%)
      expect(
        evalC.warnings.some((w: string) => w.includes('Tỷ lệ hàng lỗi cao')),
      ).toBe(true);

      // Danh hiệu giao hàng nhanh nhất & chất lượng cao nhất thuộc về NCC B
      expect(comparison.recommendations.fastestDelivery?.quotationCode).toBe(
        'QUO-B',
      );
      expect(comparison.recommendations.highestQuality?.quotationCode).toBe(
        'QUO-B',
      );

      // Danh hiệu giá tốt nhất (trong số NCC đạt MOQ) thuộc về NCC A (60.000 vs 62.000)
      expect(comparison.recommendations.bestPrice?.quotationCode).toBe('QUO-A');
    });
  });

  describe('createPOFromQuotation (PUR-02-T10 -> PUR-02-T12, PUR-02-T15, PUR-02-T16)', () => {
    it('PUR-02-T15: từ chối tạo PO nếu báo giá chưa được DUYỆT (vẫn là DRAFT)', async () => {
      const draftQuotation = {
        _id: new Types.ObjectId(),
        status: QuotationStatus.DRAFT,
        validUntil: new Date('2028-12-31'),
        save: jest.fn().mockResolvedValue(this),
      };

      quotationModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(draftQuotation),
      });

      await expect(
        service.createPOFromQuotation(
          {
            quotationId: draftQuotation._id.toString(),
            items: [{ product: mockProductId, orderedQuantity: 50 }],
          },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('PUR-02-T16: từ chối tạo PO nếu số lượng đặt mua thấp hơn MOQ của sản phẩm', async () => {
      const approvedQuotation = {
        _id: new Types.ObjectId(),
        quotationCode: 'QUO-MOQ-CHECK',
        supplier: { _id: new Types.ObjectId(mockSupplierId) },
        status: QuotationStatus.APPROVED,
        validUntil: new Date('2028-12-31'),
        items: [
          {
            product: new Types.ObjectId(mockProductId),
            productName: 'Bút dạ quang TL-HL03',
            moq: 100, // MOQ = 100
            baseUnitPrice: 12000,
          },
        ],
        save: jest.fn().mockResolvedValue(this),
      };

      quotationModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(approvedQuotation),
      });

      await expect(
        service.createPOFromQuotation(
          {
            quotationId: approvedQuotation._id.toString(),
            items: [{ product: mockProductId, orderedQuantity: 20 }], // Đặt 20 < 100
          },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('PUR-02-T10: ném BadRequestException nếu báo giá đã hết hạn', async () => {
      const expiredQuotation = {
        _id: new Types.ObjectId(),
        status: QuotationStatus.APPROVED,
        validUntil: new Date('2020-01-01'), // Hết hạn
        save: jest.fn().mockResolvedValue(this),
      };

      quotationModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(expiredQuotation),
      });

      await expect(
        service.createPOFromQuotation(
          {
            quotationId: expiredQuotation._id.toString(),
            items: [{ product: mockProductId, orderedQuantity: 50 }],
          },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('PUR-02-T11: tạo PO thành công với snapshot đơn giá chính xác theo bậc', async () => {
      const activeQuotation = {
        _id: new Types.ObjectId(),
        quotationCode: 'QUO-261102-0001',
        supplier: {
          _id: new Types.ObjectId(mockSupplierId),
          name: 'Ánh Dương',
        },
        status: QuotationStatus.APPROVED,
        validUntil: new Date('2028-12-31'),
        items: [
          {
            product: new Types.ObjectId(mockProductId),
            productName: 'Bút bi Thiên Long TL-027',
            unit: 'cây',
            moq: 20,
            baseUnitPrice: 45000,
            priceTiers: [
              { minQuantity: 50, unitPrice: 42000 },
              { minQuantity: 100, unitPrice: 38000 },
            ],
          },
        ],
        save: jest.fn().mockResolvedValue(this),
      };

      quotationModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(activeQuotation),
      });

      const mockCreatedPO = {
        _id: new Types.ObjectId(),
        poCode: 'PO261102-0001',
        items: [
          {
            product: mockProductId,
            orderedQuantity: 120,
            expectedUnitPrice: 38000, // Đã áp dụng bậc 100+
          },
        ],
      };

      poServiceMock.create.mockResolvedValue(mockCreatedPO);

      const result = await service.createPOFromQuotation(
        {
          quotationId: activeQuotation._id.toString(),
          items: [{ product: mockProductId, orderedQuantity: 120 }],
        },
        mockUserId,
      );

      expect(poServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          supplier: mockSupplierId,
          items: [
            expect.objectContaining({
              product: mockProductId,
              orderedQuantity: 120,
              expectedUnitPrice: 38000, // Snapshot bậc giá 38.000
            }),
          ],
        }),
        mockUserId,
        undefined,
      );

      expect(result).toBeDefined();
    });

    it('PUR-02-T12: kiểm tra tính bất biến — thay đổi giá báo giá sau này không ảnh hưởng đến PO đã tạo', async () => {
      const activeQuotation = {
        _id: new Types.ObjectId(),
        quotationCode: 'QUO-IMMUTABLE-01',
        supplier: {
          _id: new Types.ObjectId(mockSupplierId),
        },
        status: QuotationStatus.APPROVED,
        validUntil: new Date('2028-12-31'),
        items: [
          {
            product: new Types.ObjectId(mockProductId),
            productName: 'Vở kẻ ngang 200 trang',
            unit: 'quyển',
            moq: 10,
            baseUnitPrice: 15000,
            priceTiers: [],
          },
        ],
        save: jest.fn().mockResolvedValue(this),
      };

      quotationModelMock.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(activeQuotation),
      });

      const originalExpectedUnitPrice = 15000;
      const createdPO = {
        _id: new Types.ObjectId(),
        poCode: 'PO261102-0099',
        items: [
          {
            product: mockProductId,
            orderedQuantity: 50,
            expectedUnitPrice: originalExpectedUnitPrice,
            lineTotal: originalExpectedUnitPrice * 50,
          },
        ],
      };

      poServiceMock.create.mockResolvedValue(createdPO);

      const po = await service.createPOFromQuotation(
        {
          quotationId: activeQuotation._id.toString(),
          items: [{ product: mockProductId, orderedQuantity: 50 }],
        },
        mockUserId,
      );

      // Giả lập sau đó nhà cung cấp sửa báo giá tăng lên 20.000
      activeQuotation.items[0].baseUnitPrice = 20000;

      // PO snapshot vẫn giữ nguyên giá 15.000 lúc tạo
      expect(po.items[0].expectedUnitPrice).toBe(15000);
      expect(po.items[0].expectedUnitPrice).not.toBe(
        activeQuotation.items[0].baseUnitPrice,
      );
    });
  });
});
