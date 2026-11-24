import { Types } from 'mongoose';
import { ReportsService } from './reports.service';
import { PosService } from '../pos/pos.service';
import { StockAuditsService } from '../stock-audits/stock-audits.service';
import { CustomerCreditService } from '../finance/services/customer-credit.service';
import { PaymentMethod, PaymentStatus } from '../../common/enums';
import { POSOrderStatus } from '../pos/schemas/pos-order.schema';
import { POSShift } from '../pos/dto/pos.dto';
import { StockAuditStatus } from '../stock-audits/schemas/stock-audit.schema';
import { CreditStatus } from '../finance/schemas/customer-credit-profile.schema';
import { CustomerReceivableStatus } from '../finance/schemas/customer-receivable.schema';

describe('T06–T08: Chốt ca, kiểm kê, công nợ và đối soát tài chính Fixture Ngày 10 - Ngày 12', () => {
  describe('T06: Kiểm kê kho - Tách chưa đếm / đã đếm & Lập biên bản kiểm kê', () => {
    let stockAuditsService: StockAuditsService;
    let mockAuditModel: any;
    let mockProductModel: any;
    let mockInventoryModel: any;
    let mockInventoryService: any;

    beforeEach(() => {
      mockAuditModel = jest.fn().mockImplementation((dto) => ({
        ...dto,
        save: jest
          .fn()
          .mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
      }));
      mockAuditModel.db = {
        collection: jest.fn().mockReturnValue({
          findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
        }),
      };
      mockAuditModel.findOne = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      mockProductModel = {
        find: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId('60c72b2f9b1d8b0015b6d111'),
              name: 'Bút bi Thiên Long',
              sku: 'BUT-TL01',
              unit: 'cây',
            },
            {
              _id: new Types.ObjectId('60c72b2f9b1d8b0015b6d222'),
              name: 'Tập vở 96 trang',
              sku: 'VO-96T',
              unit: 'cuốn',
            },
          ]),
        }),
      };

      mockInventoryModel = {
        find: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              product: new Types.ObjectId('60c72b2f9b1d8b0015b6d111'),
              currentStock: 100,
              costPrice: 3000,
            },
            {
              product: new Types.ObjectId('60c72b2f9b1d8b0015b6d222'),
              currentStock: 50,
              costPrice: 7000,
            },
          ]),
        }),
      };

      mockInventoryService = {};

      stockAuditsService = new StockAuditsService(
        mockAuditModel,
        mockProductModel,
        mockInventoryModel,
        mockInventoryService,
      );
    });

    it('T06-01: Tạo đợt kiểm kê mới phải khởi tạo isCounted = false, tách uncountedItemsCount = 2, countedItemsCount = 0', async () => {
      const audit = await stockAuditsService.create(
        { title: 'Kiểm kê định kỳ tháng 11', note: 'Kho văn phòng phẩm' },
        new Types.ObjectId().toString(),
      );

      expect(audit.totalItemsCount).toBe(2);
      expect(audit.countedItemsCount).toBe(0);
      expect(audit.uncountedItemsCount).toBe(2);
      expect(audit.items[0].isCounted).toBe(false);
      expect(audit.items[1].isCounted).toBe(false);
    });

    it('T06-02: Nhập số lượng thực đếm cho 1 SKU phải cập nhật isCounted = true, countedItemsCount = 1, uncountedItemsCount = 1', async () => {
      const prodId1 = '60c72b2f9b1d8b0015b6d111';
      const prodId2 = '60c72b2f9b1d8b0015b6d222';
      const mockAuditDoc: any = {
        _id: new Types.ObjectId(),
        auditCode: 'AUD261124-0001',
        title: 'Kiểm kê',
        status: StockAuditStatus.DRAFT,
        items: [
          {
            product: new Types.ObjectId(prodId1),
            productName: 'Bút bi Thiên Long',
            sku: 'BUT-TL01',
            unit: 'cây',
            systemStock: 100,
            actualStock: 100,
            discrepancy: 0,
            costPrice: 3000,
            discrepancyValue: 0,
            isCounted: false,
          },
          {
            product: new Types.ObjectId(prodId2),
            productName: 'Tập vở 96 trang',
            sku: 'VO-96T',
            unit: 'cuốn',
            systemStock: 50,
            actualStock: 50,
            discrepancy: 0,
            costPrice: 7000,
            discrepancyValue: 0,
            isCounted: false,
          },
        ],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      jest
        .spyOn(stockAuditsService, 'findById')
        .mockResolvedValue(mockAuditDoc);

      const userId = new Types.ObjectId().toString();
      const updated = await stockAuditsService.submitCount(
        mockAuditDoc._id.toString(),
        {
          items: [
            { product: prodId1, actualStock: 98, reason: 'Thất thoát 2 cây' },
          ],
        },
        userId,
      );

      expect(updated.countedItemsCount).toBe(1);
      expect(updated.uncountedItemsCount).toBe(1);
      expect(updated.items[0].isCounted).toBe(true);
      expect(updated.items[0].actualStock).toBe(98);
      expect(updated.items[0].discrepancy).toBe(-2);
      expect(updated.items[1].isCounted).toBe(false);
    });

    it('T06-03: Lập biên bản kiểm kê (generateAuditMinutes) phân tách rõ danh sách đã đếm và chưa đếm kèm tỷ lệ hoàn thành', async () => {
      const prodId1 = '60c72b2f9b1d8b0015b6d111';
      const prodId2 = '60c72b2f9b1d8b0015b6d222';
      const mockAuditDoc: any = {
        _id: new Types.ObjectId(),
        auditCode: 'AUD261124-0001',
        title: 'Biên bản kiểm kê kho',
        status: StockAuditStatus.PENDING_APPROVAL,
        createdBy: new Types.ObjectId(),
        totalDiscrepancyQty: 2,
        totalDiscrepancyValue: -6000,
        items: [
          {
            product: new Types.ObjectId(prodId1),
            productName: 'Bút bi Thiên Long',
            sku: 'BUT-TL01',
            unit: 'cây',
            systemStock: 100,
            actualStock: 98,
            discrepancy: -2,
            costPrice: 3000,
            discrepancyValue: -6000,
            isCounted: true,
            countedAt: new Date(),
          },
          {
            product: new Types.ObjectId(prodId2),
            productName: 'Tập vở 96 trang',
            sku: 'VO-96T',
            unit: 'cuốn',
            systemStock: 50,
            actualStock: 50,
            discrepancy: 0,
            costPrice: 7000,
            discrepancyValue: 0,
            isCounted: false,
          },
        ],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      jest
        .spyOn(stockAuditsService, 'findById')
        .mockResolvedValue(mockAuditDoc);

      const userId = new Types.ObjectId().toString();
      const minutes = await stockAuditsService.generateAuditMinutes(
        mockAuditDoc._id.toString(),
        userId,
        'Biên bản chốt số liệu đợt 1',
      );

      expect(minutes.minutesCode).toBe('BBKK-AUD261124-0001');
      expect(minutes.totalItemsCount).toBe(2);
      expect(minutes.countedItemsCount).toBe(1);
      expect(minutes.uncountedItemsCount).toBe(1);
      expect(minutes.completionRate).toBe(50);
      expect(minutes.countedItems).toHaveLength(1);
      expect(minutes.countedItems[0].sku).toBe('BUT-TL01');
      expect(minutes.uncountedItems).toHaveLength(1);
      expect(minutes.uncountedItems[0].sku).toBe('VO-96T');
      expect(mockAuditDoc.auditMinutes).toBeDefined();
    });
  });

  describe('T06: Chốt ca POS - Biên bản chốt ca thu ngân (POS Shift Closing)', () => {
    let posService: PosService;
    let mockShiftClosingModel: any;

    beforeEach(() => {
      mockShiftClosingModel = jest.fn().mockImplementation((dto) => ({
        ...dto,
        save: jest
          .fn()
          .mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
      }));
      mockShiftClosingModel.db = {
        collection: jest.fn().mockReturnValue({
          findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 5 }),
        }),
      };

      posService = new PosService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockShiftClosingModel,
      );
    });

    it('T06-04: closeShift tính toán chính xác tiền dự kiến, tiền thực đếm, chênh lệch và lưu biên bản có mã CA-xxxx', async () => {
      // Giả lập getSessionReport
      jest.spyOn(posService, 'getSessionReport').mockResolvedValue({
        date: '2026-11-24',
        shift: POSShift.MORNING,
        startTime: '2026-11-24T06:00:00.000Z',
        endTime: '2026-11-24T12:00:00.000Z',
        totalOrders: 15,
        totalRevenue: 2500000,
        cashTotal: 2000000,
        transferTotal: 500000,
        creditTotal: 0,
        refundedOrdersCount: 1,
        totalRefundedAmount: 50000,
        itemsSoldCount: 30,
        openingCash: 1000000,
        expectedCash: 3000000, // opening 1tr + cash 2tr
        actualCash: 3000000,
        variance: 0,
      });

      const cashier = {
        _id: new Types.ObjectId().toString(),
        fullName: 'Nguyễn Văn Thu Ngân',
      };

      const result = await posService.closeShift(
        {
          date: '2026-11-24',
          shift: POSShift.MORNING,
          openingCash: 1000000,
          actualCash: 3050000, // thực tế kiểm đếm thừa 50.000 đ
          notes: 'Thừa 50k do khách không lấy tiền lẻ',
        },
        cashier,
      );

      expect(result.closingCode).toMatch(/^CA\d{6}-0005$/);
      expect(result.openingCash).toBe(1000000);
      expect(result.cashSales).toBe(2000000);
      expect(result.expectedCash).toBe(3000000);
      expect(result.actualCash).toBe(3050000);
      expect(result.variance).toBe(50000); // Thừa 50.000 đ
      expect(result.status).toBe('CONFIRMED');
      expect(result.cashierName).toBe('Nguyễn Văn Thu Ngân');
    });
  });

  describe('T07: Công nợ khách sỉ B2B & Hạn mức tín dụng', () => {
    let creditService: CustomerCreditService;
    let mockCreditProfileModel: any;
    let mockReceivableModel: any;

    beforeEach(() => {
      mockCreditProfileModel = {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
      };
      mockReceivableModel = {
        findOne: jest.fn(),
        find: jest.fn(),
      };

      creditService = new CustomerCreditService(
        mockCreditProfileModel,
        mockReceivableModel,
        {} as any,
        {} as any,
      );
    });

    it('T07-01: Chặn bán chịu nếu khách hàng có khoản nợ quá hạn (AR-T05)', async () => {
      const customerId = new Types.ObjectId().toString();
      mockCreditProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          creditStatus: CreditStatus.APPROVED,
          creditLimit: 20000000,
          currentExposure: 5000000,
        }),
      });

      // Có khoản nợ quá hạn
      mockReceivableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          invoiceCode: 'HD-OVERDUE-01',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          remainingAmount: 2000000,
        }),
      });

      await expect(
        creditService.checkCreditEligibility(customerId, 1000000),
      ).rejects.toThrow('nợ quá hạn chưa thanh toán');
    });

    it('T07-02: Chặn bán chịu nếu yêu cầu vượt hạn mức tín dụng được cấp (AR-T02)', async () => {
      const customerId = new Types.ObjectId().toString();
      mockCreditProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          creditStatus: CreditStatus.APPROVED,
          creditLimit: 10000000,
          currentExposure: 8000000,
        }),
      });
      mockReceivableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Yêu cầu nợ 3 triệu trong khi hạn mức chỉ còn 2 triệu
      await expect(
        creditService.checkCreditEligibility(customerId, 3000000),
      ).rejects.toThrow('Vượt quá hạn mức công nợ');
    });

    it('T07-03: Đối soát dư nợ thực tế reconcileExposure khớp đúng tổng nợ còn lại', async () => {
      const customerId = new Types.ObjectId().toString();
      mockReceivableModel.find.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue([
            { remainingAmount: 2000000 },
            { remainingAmount: 3500000 },
          ]),
      });

      const profileDoc = {
        customer: new Types.ObjectId(customerId),
        currentExposure: 5500000,
        save: jest.fn().mockResolvedValue(true),
      };
      mockCreditProfileModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(profileDoc),
      });

      const recon = await creditService.reconcileExposure(customerId);
      expect(recon.reconciledExposure).toBe(5500000);
      expect(recon.profile?.currentExposure).toBe(5500000);
    });
  });

  describe('T08: Fixture Bán 100.000 đ Ngày 10, Hoàn 20.000 đ Ngày 12 (Reconciliation)', () => {
    let reportsService: ReportsService;
    let mockPosOrderModel: any;
    let mockOrderModel: any;
    let mockEntryModel: any;

    beforeEach(() => {
      // Dữ liệu mô phỏng theo đúng Fixture của kiểm toán:
      // Ngày 10: Bán đơn POS 100.000 đ
      // Ngày 12: Khách trả hàng hoàn 20.000 đ
      const day10Order = {
        _id: new Types.ObjectId('60c72b2f9b1d8b0015b6d010'),
        invoiceCode: 'HD261110-0001',
        createdAt: new Date('2026-11-10T09:00:00.000+07:00'),
        status: POSOrderStatus.PARTIALLY_RETURNED,
        paymentMethod: PaymentMethod.CASH,
        subtotal: 100000,
        finalAmount: 100000,
        totalRefundedAmount: 20000,
        refundHistory: [
          {
            refundId: 'RF-261112-0001',
            refundedAt: new Date('2026-11-12T14:30:00.000+07:00'),
            totalRefundAmount: 20000,
            reason: 'Khách đổi ý trả 1 cuốn sách',
          },
        ],
      };

      // Giả lập CashEntries sổ quỹ:
      // Ngày 10: Thu 100.000 đ
      // Ngày 12: Chi hoàn 20.000 đ
      const cashEntries = [
        {
          _id: new Types.ObjectId(),
          entryCode: 'PT261110-0001',
          direction: 'IN',
          amount: 100000,
          postedAt: new Date('2026-11-10T09:00:00.000+07:00'),
          createdAt: new Date('2026-11-10T09:00:00.000+07:00'),
          referenceType: 'POS_ORDER',
          referenceId: 'HD261110-0001',
          status: 'POSTED',
          isDeleted: false,
        },
        {
          _id: new Types.ObjectId(),
          entryCode: 'PC261112-0001',
          direction: 'OUT',
          amount: 20000,
          postedAt: new Date('2026-11-12T14:30:00.000+07:00'),
          createdAt: new Date('2026-11-12T14:30:00.000+07:00'),
          referenceType: 'POS_ORDER',
          referenceId: 'HD261110-0001',
          status: 'POSTED',
          isDeleted: false,
        },
      ];

      mockPosOrderModel = {
        find: jest.fn().mockImplementation((query) => {
          return {
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockImplementation(async () => {
                // Nếu query theo createdAt (lấy đơn tạo trong khoảng)
                if (query.createdAt) {
                  return [day10Order];
                }
                // Nếu query theo refundHistory.refundedAt (lấy hoàn tiền phát sinh trong khoảng)
                if (query['refundHistory.refundedAt']) {
                  return [day10Order];
                }
                return [day10Order];
              }),
            }),
          };
        }),
      };

      mockOrderModel = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      };

      mockEntryModel = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(cashEntries),
          }),
        }),
      };

      reportsService = new ReportsService(
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        mockPosOrderModel,
        mockOrderModel,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockEntryModel,
      );
    });

    it('T08-01: Đối chiếu Ngày 10 và Ngày 12 phân biệt rõ Doanh thu theo đơn và Tiền thực thu/chi theo ngày', async () => {
      const recon = await reportsService.getFinancialReconciliation(
        '2026-11-10',
        '2026-11-12',
      );

      expect(recon.dailyBreakdown).toHaveLength(2);

      const day10 = recon.dailyBreakdown.find((d) => d.date === '2026-11-10');
      const day12 = recon.dailyBreakdown.find((d) => d.date === '2026-11-12');

      expect(day10).toBeDefined();
      expect(day12).toBeDefined();

      // Ngày 10:
      // - Doanh thu theo đơn: 100k gross, net 80k
      // - Dòng tiền thực tế: Thu 100k, Chi 0k -> Net Cash = +100k
      expect(day10?.orderBasis.grossRevenue).toBe(100000);
      expect(day10?.orderBasis.netRevenue).toBe(80000);
      expect(day10?.cashBasis.salesCashInflow).toBe(100000);
      expect(day10?.cashBasis.refundCashOutflow).toBe(0);
      expect(day10?.cashBasis.netCashFlow).toBe(100000);
      expect(day10?.timingDifference).toBe(-20000); // 80k - 100k

      // Ngày 12:
      // - Doanh thu mới: 0k, net = 0k
      // - Dòng tiền thực tế: Thu 0k, Chi hoàn tiền 20k -> Net Cash = -20k
      expect(day12?.orderBasis.grossRevenue).toBe(0);
      expect(day12?.orderBasis.netRevenue).toBe(0);
      expect(day12?.cashBasis.salesCashInflow).toBe(0);
      expect(day12?.cashBasis.refundCashOutflow).toBe(20000);
      expect(day12?.cashBasis.netCashFlow).toBe(-20000);
      expect(day12?.timingDifference).toBe(20000); // 0k - (-20k)
    });

    it('T08-02: Toàn kỳ Ngày 10 -> Ngày 12 đối chiếu CÂN BẰNG 100% giữa Doanh thu thuần và Dòng tiền thuần', async () => {
      const recon = await reportsService.getFinancialReconciliation(
        '2026-11-10',
        '2026-11-12',
      );

      const summary = recon.cumulativeSummary;

      // Tổng đơn gộp = 100.000 đ
      expect(summary.totalGrossRevenue).toBe(100000);
      // Tổng giảm trừ hoàn tiền = 20.000 đ
      expect(summary.totalRefundDeductions).toBe(20000);
      // Doanh thu thuần = 80.000 đ
      expect(summary.totalNetRevenue).toBe(80000);

      // Tổng tiền thực thu = 100.000 đ
      expect(summary.totalCashInflow).toBe(100000);
      // Tổng tiền thực chi hoàn = 20.000 đ
      expect(summary.totalCashOutflow).toBe(20000);
      // Dòng tiền thực tế thuần = 80.000 đ
      expect(summary.totalNetCashFlow).toBe(80000);

      // Chênh lệch đối chiếu = 0 đ (CÂN BẰNG HOÀN TOÀN)
      expect(summary.cumulativeDifference).toBe(0);
      expect(summary.isBalanced).toBe(true);
      expect(recon.reconciliationAuditNotes).toContain(
        'Đối chiếu cân bằng 100%',
      );
    });
  });
});
