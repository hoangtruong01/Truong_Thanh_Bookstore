/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import { FinanceService } from './finance.service';
import {
  CashAccount,
  CashAccountType,
  CashAccountStatus,
} from './schemas/cash-account.schema';
import {
  CashEntry,
  CashEntryDirection,
  CashEntryCategory,
  CashEntryStatus,
} from './schemas/cash-entry.schema';
import {
  SupplierPayable,
  SupplierPayableStatus,
} from './schemas/supplier-payable.schema';
import {
  CustomerReceivable,
  CustomerReceivableStatus,
} from './schemas/customer-receivable.schema';

describe('FinanceService', () => {
  let service: FinanceService;
  let mockAccountModel: any;
  let mockEntryModel: any;
  let mockPayableModel: any;
  let mockReceivableModel: any;
  let mockConnection: any;

  beforeEach(async () => {
    mockAccountModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockAccountModel.find = jest.fn();
    mockAccountModel.findOne = jest.fn();
    mockAccountModel.findOneAndUpdate = jest.fn();

    mockEntryModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockEntryModel.find = jest.fn();
    mockEntryModel.findOne = jest.fn();
    mockEntryModel.countDocuments = jest.fn();
    mockEntryModel.db = {
      collection: jest.fn().mockReturnValue({
        findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }),
      }),
    };

    mockPayableModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockPayableModel.find = jest.fn();
    mockPayableModel.findOne = jest.fn();
    mockPayableModel.countDocuments = jest.fn();

    mockReceivableModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockReceivableModel.find = jest.fn();
    mockReceivableModel.findOne = jest.fn();
    mockReceivableModel.countDocuments = jest.fn();

    mockConnection = {
      startSession: jest
        .fn()
        .mockRejectedValue(new Error('No replica set in mock')),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
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
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  describe('FIN-01: Cash Accounts', () => {
    it('Tạo sổ quỹ mới với số dư ban đầu', async () => {
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.createAccount({
        code: 'QUY-TM',
        name: 'Quỹ tiền mặt tại quầy',
        type: CashAccountType.CASH_DRAWER,
        openingBalance: 10000000,
      });

      expect(res.code).toBe('QUY-TM');
      expect(res.currentBalance).toBe(10000000);
    });

    it('Báo lỗi trùng mã sổ quỹ', async () => {
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ code: 'QUY-TM' }),
      });

      await expect(
        service.createAccount({
          code: 'QUY-TM',
          name: 'Quỹ tiền mặt trùng',
          type: CashAccountType.CASH_DRAWER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('FIN-02: Cash Entries (Phiếu thu / chi)', () => {
    it('FIN02-T01: Chi tiền hợp lệ -> Lưu phiếu chi và trừ số dư quỹ', async () => {
      const accountId = new Types.ObjectId().toString();
      const mockAcc = {
        _id: new Types.ObjectId(accountId),
        name: 'Quỹ tiền mặt',
        status: CashAccountStatus.ACTIVE,
        currentBalance: 5000000,
      };

      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAcc),
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockAcc, currentBalance: 4000000 }),
      });

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.createEntry(
        {
          account: accountId,
          direction: CashEntryDirection.OUT,
          category: CashEntryCategory.UTILITY_EXPENSE,
          amount: 1000000,
          note: 'Tiền điện tháng 10',
        },
        new Types.ObjectId().toString(),
      );

      expect(res.amount).toBe(1000000);
      expect(res.direction).toBe(CashEntryDirection.OUT);
      expect(res.status).toBe(CashEntryStatus.POSTED);
      expect(mockAccountModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockAcc._id },
        { $inc: { currentBalance: -1000000 } },
        { new: true },
      );
    });

    it('FIN02-T02: Chi tiền vượt quá số dư sổ quỹ -> Throw BadRequestException', async () => {
      const accountId = new Types.ObjectId().toString();
      const mockAcc = {
        _id: new Types.ObjectId(accountId),
        name: 'Quỹ tiền mặt',
        status: CashAccountStatus.ACTIVE,
        currentBalance: 500000,
      };

      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAcc),
      });
      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.createEntry(
          {
            account: accountId,
            direction: CashEntryDirection.OUT,
            category: CashEntryCategory.OTHER_EXPENSE,
            amount: 1000000, // Vượt 500k
          },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('FIN02-T03: Chống tạo trùng với idempotencyKey', async () => {
      const existingEntry = {
        entryCode: 'PC261030-0001',
        amount: 2000000,
        idempotencyKey: 'idem_key_123',
      };

      mockEntryModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(existingEntry),
          }),
        }),
      });

      const res = await service.createEntry(
        {
          account: new Types.ObjectId().toString(),
          direction: CashEntryDirection.OUT,
          category: CashEntryCategory.OTHER_EXPENSE,
          amount: 2000000,
          idempotencyKey: 'idem_key_123',
        },
        new Types.ObjectId().toString(),
      );

      expect(res.entryCode).toBe('PC261030-0001');
    });

    it('FIN02-T04: Hoàn đảo phiếu (Reversal) -> Đổi trạng thái phiếu gốc thành REVERSED và tạo phiếu đảo', async () => {
      const entryId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId();
      const originalEntry: any = {
        _id: new Types.ObjectId(entryId),
        entryCode: 'PC261030-0005',
        account: accountId,
        direction: CashEntryDirection.OUT,
        category: CashEntryCategory.OTHER_EXPENSE,
        amount: 500000,
        status: CashEntryStatus.POSTED,
        save: jest.fn().mockResolvedValue(true),
      };

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(originalEntry),
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });

      const res = await service.reverseEntry(
        entryId,
        { reason: 'Nhầm lẫn số tiền chi' },
        new Types.ObjectId().toString(),
      );

      expect(res.original.status).toBe(CashEntryStatus.REVERSED);
      expect(res.reversal.direction).toBe(CashEntryDirection.IN);
      expect(res.reversal.amount).toBe(500000);
      expect(mockAccountModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: accountId },
        { $inc: { currentBalance: 500000 } }, // Hoàn lại số tiền vào quỹ
      );
    });
  });

  describe('FIN-03: Supplier Payables (Công nợ NCC)', () => {
    it('FIN03-T01: Tự động ghi nhận công nợ khi có phiếu nhận hàng Goods Receipt', async () => {
      mockPayableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const supplierId = new Types.ObjectId();
      const receiptId = new Types.ObjectId();
      const poId = new Types.ObjectId();

      const res = await service.createPayableFromGoodsReceipt(
        supplierId,
        receiptId,
        poId,
        'GR261030-0001',
        15000000,
      );

      expect(res).not.toBeNull();
      expect(res?.totalAmount).toBe(15000000);
      expect(res?.remainingAmount).toBe(15000000);
      expect(res?.paidAmount).toBe(0);
      expect(res?.status).toBe(SupplierPayableStatus.UNPAID);
    });

    it('FIN03-T02: Thanh toán công nợ NCC -> Tạo phiếu chi, giảm remainingAmount', async () => {
      const payableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();

      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        invoiceCode: 'GR261030-0001',
        totalAmount: 10000000,
        paidAmount: 0,
        remainingAmount: 10000000,
        status: SupplierPayableStatus.UNPAID,
        paymentHistory: [],
        supplier: { name: 'Nhà xuất bản Kim Đồng', code: 'NCC-0001' },
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockPayableModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayable),
        }),
      });

      // Mock account for createEntry
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(accountId),
          name: 'Quỹ tiền mặt',
          status: CashAccountStatus.ACTIVE,
          currentBalance: 20000000,
        }),
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });
      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.paySupplier(
        payableId,
        {
          accountId,
          amount: 6000000,
          note: 'Trả đợt 1',
        },
        new Types.ObjectId().toString(),
      );

      expect(res.payable.paidAmount).toBe(6000000);
      expect(res.payable.remainingAmount).toBe(4000000);
      expect(res.payable.status).toBe(SupplierPayableStatus.PARTIALLY_PAID);
      expect(res.payable.paymentHistory.length).toBe(1);
    });

    it('FIN03-T03: Thanh toán vượt quá số nợ còn lại -> Báo lỗi', async () => {
      const payableId = new Types.ObjectId().toString();
      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        invoiceCode: 'GR261030-0002',
        totalAmount: 5000000,
        paidAmount: 2000000,
        remainingAmount: 3000000,
        status: SupplierPayableStatus.PARTIALLY_PAID,
        supplier: { name: 'NCC ABC' },
      };

      mockPayableModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayable),
        }),
      });

      await expect(
        service.paySupplier(
          payableId,
          {
            accountId: new Types.ObjectId().toString(),
            amount: 4000000, // Vượt quá remainingAmount 3tr
          },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('FIN-04: Customer Receivables', () => {
    it('Tạo khoản công nợ khách sỉ thành công', async () => {
      mockReceivableModel.findOne.mockReturnValue(null);

      const res = await service.createReceivable({
        customerId: new Types.ObjectId().toString(),
        customerName: 'Đại lý Sách Miền Nam',
        invoiceCode: 'HD261030-0001',
        totalAmount: 15000000,
        dueDate: '2026-11-30',
        creditLimit: 30000000,
      });

      expect(res.customerName).toBe('Đại lý Sách Miền Nam');
      expect(res.remainingAmount).toBe(15000000);
      expect(res.paidAmount).toBe(0);
      expect(res.status).toBe(CustomerReceivableStatus.UNPAID);
    });

    it('Thu tiền công nợ khách sỉ thành công -> Giảm nợ, tăng quỹ', async () => {
      const receivableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();
      const mockReceivable: any = {
        _id: new Types.ObjectId(receivableId),
        customerName: 'Đại lý Sách Miền Nam',
        invoiceCode: 'HD261030-0001',
        totalAmount: 15000000,
        paidAmount: 0,
        remainingAmount: 15000000,
        status: CustomerReceivableStatus.UNPAID,
        collectionHistory: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockReceivableModel.findOne.mockReturnValue(mockReceivable);
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(accountId),
          currentBalance: 5000000,
          status: CashAccountStatus.ACTIVE,
        }),
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(true),
      });
      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.collectCustomerPayment(
        receivableId,
        {
          accountId,
          amount: 5000000,
          note: 'Thu đợt 1',
        },
        new Types.ObjectId().toString(),
      );

      expect(res.receivable.paidAmount).toBe(5000000);
      expect(res.receivable.remainingAmount).toBe(10000000);
      expect(res.receivable.status).toBe(
        CustomerReceivableStatus.PARTIALLY_PAID,
      );
      expect(res.receivable.collectionHistory.length).toBe(1);
    });

    it('Thu vượt quá số nợ còn lại -> Báo lỗi', async () => {
      const receivableId = new Types.ObjectId().toString();
      const mockReceivable: any = {
        _id: new Types.ObjectId(receivableId),
        invoiceCode: 'HD261030-0001',
        totalAmount: 10000000,
        paidAmount: 8000000,
        remainingAmount: 2000000,
        status: CustomerReceivableStatus.PARTIALLY_PAID,
      };

      mockReceivableModel.findOne.mockReturnValue(mockReceivable);

      await expect(
        service.collectCustomerPayment(
          receivableId,
          {
            accountId: new Types.ObjectId().toString(),
            amount: 3000000, // Vượt 2tr
          },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Kiểm tra hạn mức nợ khách sỉ (Credit Limit Check)', async () => {
      const customerId = new Types.ObjectId().toString();
      mockReceivableModel.find.mockReturnValue([
        { remainingAmount: 15000000, creditLimit: 20000000 },
      ]);

      // Nợ 15tr, limit 20tr, mua thêm 4tr -> tổng 19tr <= 20tr -> allowed
      const check1 = await service.checkCustomerCreditLimit(
        customerId,
        4000000,
      );
      expect(check1.allowed).toBe(true);
      expect(check1.excessAmount).toBe(0);

      // Mua thêm 6tr -> tổng 21tr > 20tr -> not allowed
      const check2 = await service.checkCustomerCreditLimit(
        customerId,
        6000000,
      );
      expect(check2.allowed).toBe(false);
      expect(check2.excessAmount).toBe(1000000);
    });
  });
});
