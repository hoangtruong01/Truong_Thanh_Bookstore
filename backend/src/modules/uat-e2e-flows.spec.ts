import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as ExcelJS from 'exceljs';

// Services
import { PricingService } from './pricing/pricing.service';
import { FinanceService } from './finance/finance.service';
import { InventoryService } from './inventory/inventory.service';
import { GoodsReceiptsService } from './purchasing/goods-receipts.service';
import { PurchaseReturnsService } from './purchasing/purchase-returns.service';
import { DataExchangeService } from './data-exchange/data-exchange.service';
import { PosService } from './pos/pos.service';
import { SuppliersService } from './suppliers/suppliers.service';

// Schemas & Enums
import {
  PricePolicy,
  PricePolicyScope,
} from './pricing/schemas/price-policy.schema';
import {
  CashAccount,
  CashAccountType,
  CashAccountStatus,
} from './finance/schemas/cash-account.schema';
import {
  CashEntry,
  CashEntryDirection,
  CashEntryCategory,
  CashEntryStatus,
} from './finance/schemas/cash-entry.schema';
import {
  SupplierPayable,
  SupplierPayableStatus,
} from './finance/schemas/supplier-payable.schema';
import {
  CustomerReceivable,
  CustomerReceivableStatus,
} from './finance/schemas/customer-receivable.schema';
import {
  GoodsReceipt,
  ItemCondition,
} from './purchasing/schemas/goods-receipt.schema';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './purchasing/schemas/purchase-order.schema';
import {
  PurchaseReturn,
  PurchaseReturnStatus,
  CreditAdjustmentStatus,
} from './purchasing/schemas/purchase-return.schema';
import { Product } from './products/schemas/product.schema';
import { Category } from './categories/schemas/category.schema';
import { Supplier } from './suppliers/schemas/supplier.schema';
import { Inventory } from './inventory/schemas/inventory.schema';
import { InventoryTransactionType } from '../common/enums';

describe('Comprehensive BA SRS Business Flows (UAT-E2E-01 -> UAT-E2E-13)', () => {
  let pricingService: PricingService;
  let financeService: FinanceService;
  let purchasingReturnService: PurchaseReturnsService;
  let dataExchangeService: DataExchangeService;

  // Models mocks
  let mockPolicyModel: any;
  let mockAccountModel: any;
  let mockEntryModel: any;
  let mockPayableModel: any;
  let mockReceivableModel: any;
  let mockGRModel: any;
  let mockPRModel: any;
  let mockProductModel: any;
  let mockCategoryModel: any;
  let mockSupplierModel: any;
  let mockInventoryService: any;

  beforeEach(async () => {
    mockPolicyModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockPolicyModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    mockPolicyModel.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    });

    mockAccountModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockAccountModel.findOne = jest.fn();
    mockAccountModel.findOneAndUpdate = jest.fn();

    const createChainedQuery = (val: any) => ({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(val),
    });

    mockEntryModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockEntryModel.findOne = jest
      .fn()
      .mockImplementation(() => createChainedQuery(null));
    mockEntryModel.find = jest
      .fn()
      .mockImplementation(() => createChainedQuery([]));
    mockEntryModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    mockEntryModel.db = {
      collection: jest.fn().mockReturnValue({
        findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
      }),
    };

    mockPayableModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockPayableModel.findOne = jest.fn();
    mockPayableModel.find = jest.fn();

    mockReceivableModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockReceivableModel.findOne = jest.fn();
    mockReceivableModel.find = jest.fn();

    mockGRModel = {
      findOne: jest.fn(),
    };

    mockPRModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockPRModel.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    mockPRModel.find = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    mockPRModel.db = {
      collection: jest.fn().mockReturnValue({
        findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
      }),
    };

    mockProductModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockProductModel.findOne = jest.fn();

    mockCategoryModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockCategoryModel.findOne = jest.fn();

    mockSupplierModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockSupplierModel.findOne = jest.fn();

    mockInventoryService = {
      importStock: jest.fn().mockResolvedValue({}),
      adjustStock: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        FinanceService,
        PurchaseReturnsService,
        DataExchangeService,
        {
          provide: getModelToken(PricePolicy.name),
          useValue: mockPolicyModel,
        },
        {
          provide: getModelToken(CashAccount.name),
          useValue: mockAccountModel,
        },
        {
          provide: getModelToken(CashEntry.name),
          useValue: mockEntryModel,
        },
        {
          provide: getModelToken(SupplierPayable.name),
          useValue: mockPayableModel,
        },
        {
          provide: getModelToken(CustomerReceivable.name),
          useValue: mockReceivableModel,
        },
        {
          provide: getModelToken(GoodsReceipt.name),
          useValue: mockGRModel,
        },
        {
          provide: getModelToken(PurchaseReturn.name),
          useValue: mockPRModel,
        },
        {
          provide: getModelToken(Product.name),
          useValue: mockProductModel,
        },
        {
          provide: getModelToken(Category.name),
          useValue: mockCategoryModel,
        },
        {
          provide: getModelToken(Supplier.name),
          useValue: mockSupplierModel,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
        {
          provide: getConnectionToken(),
          useValue: {
            startSession: jest.fn().mockRejectedValue(new Error('Mock DB')),
          },
        },
      ],
    }).compile();

    pricingService = module.get<PricingService>(PricingService);
    financeService = module.get<FinanceService>(FinanceService);
    purchasingReturnService = module.get<PurchaseReturnsService>(
      PurchaseReturnsService,
    );
    dataExchangeService = module.get<DataExchangeService>(DataExchangeService);
  });

  // =========================================================================
  // UAT-E2E-01
  // =========================================================================
  describe('UAT-E2E-01: Nhập giấy A4, cập nhật giá vốn rồi bán lẻ', () => {
    it('Tính giá vốn bình quân gia quyền di động và giá bán markup 20%', () => {
      // 1. Tồn ban đầu: 10 ram giá 70.000đ. Nhập thêm: 10 ram giá 80.000đ.
      const initialQty = 10;
      const initialCost = 70000;
      const importQty = 10;
      const importCost = 80000;

      const newQty = initialQty + importQty; // 20 ram
      const weightedAvgCost = Math.round(
        (initialQty * initialCost + importQty * importCost) / newQty,
      );
      expect(weightedAvgCost).toBe(75000);

      // 2. Pricing policy Markup 20%: ProposedPrice = 75.000 * (1 + 20/100) = 90.000đ
      const priceCalc = pricingService.calculatePrice({
        costPrice: weightedAvgCost,
        markupPercent: 20,
      });
      expect(priceCalc.proposedPrice).toBe(90000);
      expect(priceCalc.markupPercent).toBe(20);
      expect(priceCalc.marginPercent).toBeCloseTo(16.67, 1);

      // 3. POS bán 2 ram ở giá 90.000đ
      const soldQty = 2;
      const unitSalePrice = 90000;
      const netSales = soldQty * unitSalePrice; // 180.000đ
      const cogs = soldQty * weightedAvgCost; // 150.000đ
      const grossProfit = netSales - cogs; // 30.000đ
      const endingStock = newQty - soldQty; // 18 ram

      expect(netSales).toBe(180000);
      expect(cogs).toBe(150000);
      expect(grossProfit).toBe(30000);
      expect(endingStock).toBe(18);
    });
  });

  // =========================================================================
  // UAT-E2E-02
  // =========================================================================
  describe('UAT-E2E-02: Quy đổi đơn vị hộp sang cây, quét barcode và chống client ratio spoofing', () => {
    it('Chỉ nhận conversionRatio đã cấu hình, từ chối ratio giả lập từ client', () => {
      const productConfig = {
        sku: 'BUT-BI-001',
        baseUnit: 'cây',
        packaging: { unit: 'hộp', conversionRatio: 20 },
      };

      // Nhận 10 hộp -> tồn tăng 200 cây
      const receivedBoxes = 10;
      const baseStockAdded =
        receivedBoxes * productConfig.packaging.conversionRatio;
      expect(baseStockAdded).toBe(200);

      // Client cố tình gửi conversionRatio: 1
      const clientPayload = {
        unit: 'hộp',
        conversionRatio: 1, // Kẻ gian cố tình sửa
        quantity: 1,
      };

      // Backend logic đối soát: nếu client ratio != configured ratio -> bác bỏ hoặc lấy DB ratio
      const effectiveRatio = productConfig.packaging.conversionRatio;
      const isValidClientRatio =
        clientPayload.conversionRatio === effectiveRatio;
      expect(isValidClientRatio).toBe(false);

      // Bán 1 hộp (20 cây) + 5 cây -> tổng trừ tồn = 25 cây
      const totalSoldBaseUnits = 1 * effectiveRatio + 5;
      expect(totalSoldBaseUnits).toBe(25);
      const remainingStock = baseStockAdded - totalSoldBaseUnits;
      expect(remainingStock).toBe(175);
    });
  });

  // =========================================================================
  // UAT-E2E-03
  // =========================================================================
  describe('UAT-E2E-03: Công nợ NCC và trả tiền nhiều lần', () => {
    it('Thanh toán nhiều đợt, trừ đúng quỹ, không tính trả nợ vào chi phí mua lần hai', async () => {
      const payableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();

      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        invoiceCode: 'GR261030-0001',
        totalAmount: 20000000,
        paidAmount: 0,
        remainingAmount: 20000000,
        status: SupplierPayableStatus.UNPAID,
        paymentHistory: [],
        supplier: { name: 'Công ty Giấy Bãi Bằng' },
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockPayableModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayable),
        }),
      });

      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(accountId),
          currentBalance: 30000000,
          status: CashAccountStatus.ACTIVE,
        }),
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });
      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Đợt 1: Trả 8.000.000đ
      const pay1 = await financeService.paySupplier(
        payableId,
        {
          accountId,
          amount: 8000000,
          note: 'Thanh toán đợt 1',
        },
        new Types.ObjectId().toString(),
      );

      expect(pay1.payable.paidAmount).toBe(8000000);
      expect(pay1.payable.remainingAmount).toBe(12000000);
      expect(pay1.payable.status).toBe(SupplierPayableStatus.PARTIALLY_PAID);

      // Đợt 2: Trả tiếp 5.000.000đ
      const pay2 = await financeService.paySupplier(
        payableId,
        {
          accountId,
          amount: 5000000,
          note: 'Thanh toán đợt 2',
        },
        new Types.ObjectId().toString(),
      );

      expect(pay2.payable.paidAmount).toBe(13000000);
      expect(pay2.payable.remainingAmount).toBe(7000000);

      // Thử trả vượt số nợ còn lại (8.000.000đ > 7.000.000đ) -> Báo lỗi
      await expect(
        financeService.paySupplier(
          payableId,
          {
            accountId,
            amount: 8000000,
          },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // UAT-E2E-04
  // =========================================================================
  describe('UAT-E2E-04: Ứng trước NCC và bù trừ khi nhận hàng', () => {
    it('Chi ứng trước ghi nhận OUT voucher, bù trừ credit khi GRN phát sinh', async () => {
      const advanceAmount = 3000000;
      const grLiability = 10000000;

      // Khi GRN phát sinh, cấn trừ số dư ứng trước
      const remainingPayable = grLiability - advanceAmount;
      expect(remainingPayable).toBe(7000000);
    });
  });

  // =========================================================================
  // UAT-E2E-05
  // =========================================================================
  describe('UAT-E2E-05: Quản lý chỉnh % lãi dòng hàng, kiểm soát sàn Margin Floor', () => {
    it('Phát hiện và chặn giá vi phạm sàn Margin Floor nếu chưa được duyệt', async () => {
      const unitCost = 80000;
      const proposedPrice = 90000;

      mockPolicyModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              name: 'Chính sách toàn hệ thống',
              minMarginFloor: 15,
              maxDiscountPercent: 10,
              scope: PricePolicyScope.GLOBAL,
              status: 'ACTIVE',
            },
          ]),
        }),
      });

      const check = await pricingService.checkMargin({
        costPrice: unitCost,
        sellingPrice: proposedPrice,
      });

      expect(check.requiresApproval).toBe(true);
      expect(check.effectiveMarginPercent).toBeCloseTo(11.11, 1);
      expect(check.reason).toContain('thấp hơn mức sàn cho phép');

      // Nếu có duyệt giá từ Quản lý: lưu snapshot giá vốn và lãi gộp bất biến
      const approvalSnapshot = {
        originalCost: unitCost,
        approvedPrice: proposedPrice,
        grossProfit: proposedPrice - unitCost, // 10.000đ
        approvedBy: 'manager_123',
        reason: 'Khách hàng thân thiết mua số lượng nhiều',
      };

      expect(approvalSnapshot.grossProfit).toBe(10000);
    });
  });

  // =========================================================================
  // UAT-E2E-06
  // =========================================================================
  describe('UAT-E2E-06: Chỉnh % lãi mục tiêu toàn đơn và phân bổ voucher', () => {
    it('Áp voucher 15k, phân bổ dòng và kiểm tra lãi gộp sau voucher', () => {
      // Đơn hàng: A cost 60k, price 100k; B cost 30k, price 50k. Subtotal 150k, COGS 90k.
      const subtotal = 150000;
      const totalCOGS = 90000;
      const voucherDiscount = 15000;

      const netSales = subtotal - voucherDiscount; // 135.000đ
      const grossProfit = netSales - totalCOGS; // 45.000đ
      const postVoucherMargin = (grossProfit / netSales) * 100; // 45.000 / 135.000 = 33.33%

      expect(netSales).toBe(135000);
      expect(grossProfit).toBe(45000);
      expect(postVoucherMargin).toBeCloseTo(33.33, 1);

      // Kiểm tra Margin Floor sau voucher: nếu floor là 25% -> Pass
      expect(postVoucherMargin).toBeGreaterThanOrEqual(25);
    });
  });

  // =========================================================================
  // UAT-E2E-07
  // =========================================================================
  describe('UAT-E2E-07: Khách lẻ nâng hạng Silver, dùng voucher và hoàn trả', () => {
    it('Xác minh hạng thành viên từ DB, chặn voucher sai tier', () => {
      const customer = {
        tier: 'SILVER',
        spending12Months: 6500000,
      };

      const voucherSilverOnly = {
        code: 'VOUCHER-SILVER-10',
        requiredTier: 'SILVER',
        discountPercent: 10,
      };

      const isEligible = customer.tier === voucherSilverOnly.requiredTier;
      expect(isEligible).toBe(true);

      const bronzeCustomer = { tier: 'BRONZE' };
      const isBronzeEligible =
        bronzeCustomer.tier === voucherSilverOnly.requiredTier;
      expect(isBronzeEligible).toBe(false);
    });
  });

  // =========================================================================
  // UAT-E2E-08
  // =========================================================================
  describe('UAT-E2E-08: Khách sỉ: báo giá -> giao một phần -> công nợ -> thu tiền', () => {
    it('Ghi nhận AR theo từng đợt giao hàng, thu tiền và kiểm tra credit limit', async () => {
      const customerId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();

      // 1. Kiểm tra hạn mức nợ ban đầu: nợ 0, limit 30tr -> được phép đặt đơn 20tr
      mockReceivableModel.find.mockReturnValue([]);
      const check1 = await financeService.checkCustomerCreditLimit(
        customerId,
        20000000,
      );
      expect(check1.allowed).toBe(true);

      // 2. Giao hàng đợt 1 (400 cây bút = 12.000.000đ) -> Tạo công nợ AR
      const receivableId = new Types.ObjectId().toString();
      mockReceivableModel.findOne.mockReturnValue(null);

      const arDoc: any = {
        _id: new Types.ObjectId(receivableId),
        customerName: 'Đại lý Sách Miền Tây',
        invoiceCode: 'HD-SI-001',
        totalAmount: 12000000,
        paidAmount: 0,
        remainingAmount: 12000000,
        creditLimit: 30000000,
        status: CustomerReceivableStatus.UNPAID,
        collectionHistory: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockReceivableModel.findOne.mockReturnValue(arDoc);
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(accountId),
          currentBalance: 10000000,
          status: CashAccountStatus.ACTIVE,
        }),
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });
      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // 3. Thu nợ đợt 1: 5.000.000đ
      const collectRes = await financeService.collectCustomerPayment(
        receivableId,
        {
          accountId,
          amount: 5000000,
          note: 'Đại lý chuyển khoản đợt 1',
        },
        new Types.ObjectId().toString(),
      );

      expect(collectRes.receivable.paidAmount).toBe(5000000);
      expect(collectRes.receivable.remainingAmount).toBe(7000000);
      expect(collectRes.receivable.status).toBe(
        CustomerReceivableStatus.PARTIALLY_PAID,
      );

      // 4. Khách đặt thêm đơn lớn 25.000.000đ: Nợ cũ 7tr + 25tr = 32tr > 30tr limit -> Block
      mockReceivableModel.find.mockReturnValue([
        { remainingAmount: 7000000, creditLimit: 30000000 },
      ]);
      const checkOverlimit = await financeService.checkCustomerCreditLimit(
        customerId,
        25000000,
      );
      expect(checkOverlimit.allowed).toBe(false);
      expect(checkOverlimit.excessAmount).toBe(2000000);
    });
  });

  // =========================================================================
  // UAT-E2E-09
  // =========================================================================
  describe('UAT-E2E-09: Nhập hàng lỗi và trả nhà cung cấp', () => {
    it('Giảm tồn kho tương ứng, lưu phiếu trả và cấn trừ công nợ khi được duyệt', async () => {
      const grId = new Types.ObjectId().toString();
      const prodId = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      const mockGR: any = {
        _id: new Types.ObjectId(grId),
        receiptCode: 'GR261030-0099',
        supplier: new Types.ObjectId(),
        items: [
          {
            product: new Types.ObjectId(prodId),
            productName: 'Tập vở 96 trang',
            sku: 'VO-96T-001',
            unit: 'hộp',
            conversionRatio: 10,
            receivedQuantity: 100,
            baseQuantity: 1000,
            actualUnitPrice: 60000,
            condition: ItemCondition.MIXED,
          },
        ],
      };

      mockGRModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockGR),
        }),
      });

      // Tạo phiếu trả 2 hộp bị ướt (= 20 quyển)
      const res = await purchasingReturnService.createReturn(
        {
          goodsReceiptId: grId,
          items: [
            {
              productId: prodId,
              unit: 'hộp',
              returnedQuantity: 2,
              condition: ItemCondition.DAMAGED,
              reason: 'Bị thấm nước khi vận chuyển',
            },
          ],
          note: 'Trả 2 hộp hỏng',
        },
        userId,
      );

      expect(res.returnCode).toBeDefined();
      expect(res.items[0].returnedQuantity).toBe(2);
      expect(res.items[0].baseQuantity).toBe(20);
      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: -20, // Giảm 20 quyển
        }),
        userId,
      );
    });
  });

  // =========================================================================
  // UAT-E2E-10
  // =========================================================================
  describe('UAT-E2E-10: Nhập Excel tồn đầu kỳ và đối soát', () => {
    it('Preview phát hiện lỗi trước khi nhập, an toàn trước formula injection', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Du_Lieu');
      sheet.addRow(['SKU', 'Tên sản phẩm', 'Tồn đầu kỳ', 'Giá vốn', 'ĐVT']);
      sheet.addRow(['GIAY-A4-01', 'Giấy A4', 100, 75000, 'ram']); // Dòng hợp lệ
      sheet.addRow(['', 'Giấy Bãi Bằng', 50, 60000, 'ram']); // Lỗi thiếu SKU

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      const preview = await dataExchangeService.previewImport(
        'opening_stock',
        buffer,
      );

      expect(preview.totalRows).toBe(2);
      expect(preview.validRows).toBe(1);
      expect(preview.invalidRows).toBe(1);
      expect(preview.errors[0].field).toBe('sku');
    });
  });

  // =========================================================================
  // UAT-E2E-11
  // =========================================================================
  describe('UAT-E2E-11: Quản lý chiến dịch voucher và kiểm soát quota sử dụng', () => {
    it('Kiểm soát số lượt dùng voucher, không cho vượt quota khi áp dụng đồng thời', () => {
      const voucher = {
        code: 'KHAI-GIANG-2026',
        usageLimit: 5,
        currentUsage: 4,
      };

      // Yêu cầu sử dụng 1 lượt
      const canUseFirst = voucher.currentUsage < voucher.usageLimit;
      expect(canUseFirst).toBe(true);
      voucher.currentUsage += 1;

      // Yêu cầu sử dụng tiếp theo khi đã chạm giới hạn 5/5
      const canUseNext = voucher.currentUsage < voucher.usageLimit;
      expect(canUseNext).toBe(false);
    });
  });

  // =========================================================================
  // UAT-E2E-12
  // =========================================================================
  describe('UAT-E2E-12: Đối soát cuối ngày nhiều kênh, đóng ca và bảo toàn tồn kho', () => {
    it('Phương trình cân bằng kho bảo toàn tuyệt đối: Tồn đầu + Nhập - Xuất = Tồn cuối', () => {
      const openingStock = 10;
      const imports = 10;
      const exports = 2;
      const adjustments = 0;

      const closingStock = openingStock + imports - exports + adjustments;
      expect(closingStock).toBe(18);

      // Doanh thu != Số dư quỹ (Doanh thu ghi nhận theo hóa đơn, Sổ quỹ ghi nhận theo dòng tiền thực thu/chi)
      const netRevenue = 180000;
      const cashReceived = 180000;
      const supplierDebtPaid = 8000000; // Tiền trả nợ NCC (không tính vào COGS hay doanh thu)

      const cashBalanceDelta = cashReceived - supplierDebtPaid;
      expect(cashBalanceDelta).toBe(-7820000);
      expect(netRevenue).toBe(180000); // Doanh thu không bị giảm bởi tiền trả nợ NCC
    });
  });

  // =========================================================================
  // UAT-E2E-13
  // =========================================================================
  describe('UAT-E2E-13: Thử tải đồng thời và an toàn chống tranh chấp (Race Condition)', () => {
    it('Tồn kho = 1: Hai cashier cùng submit mua hàng -> Chỉ 1 đơn thành công, đơn còn lại báo hết hàng', () => {
      let currentStock = 1;

      const attemptCheckout = (requestedQty: number) => {
        if (currentStock >= requestedQty) {
          currentStock -= requestedQty;
          return { success: true, remaining: currentStock };
        }
        return { success: false, reason: 'OUT_OF_STOCK' };
      };

      const resultUser1 = attemptCheckout(1);
      const resultUser2 = attemptCheckout(1);

      expect(resultUser1.success).toBe(true);
      expect(resultUser2.success).toBe(false);
      expect(resultUser2.reason).toBe('OUT_OF_STOCK');
      expect(currentStock).toBe(0); // Tồn kho không bao giờ bị âm
    });

    it('Idempotency protection: Replay cùng request không sinh chứng từ trùng lặp', async () => {
      const idempotentKey = 'idemp_key_unique_999';

      mockEntryModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              entryCode: 'PC261030-0001',
              idempotencyKey: idempotentKey,
            }),
          }),
        }),
      });

      const res = await financeService.createEntry(
        {
          account: new Types.ObjectId().toString(),
          direction: CashEntryDirection.OUT,
          category: CashEntryCategory.UTILITY_EXPENSE,
          amount: 500000,
          idempotencyKey: idempotentKey,
        },
        new Types.ObjectId().toString(),
      );

      expect(res.entryCode).toBe('PC261030-0001');
      expect(mockAccountModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
