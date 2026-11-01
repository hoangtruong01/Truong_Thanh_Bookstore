/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
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
        expect.objectContaining({ _id: mockAcc._id }),
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

  describe('FIN-01: Atomic Transactions & Idempotency for AP/AR', () => {
    let mockSession: any;

    beforeEach(() => {
      mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      mockConnection.startSession = jest.fn().mockResolvedValue(mockSession);
    });

    it('FIN-01-T01: Trả NCC 2.000.000đ, payable còn 5.000.000đ -> Tạo 1 phiếu chi, AP còn 3.000.000đ, account giảm 2.000.000đ', async () => {
      const payableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();
      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        invoiceCode: 'GR261101-0001',
        totalAmount: 5000000,
        paidAmount: 0,
        remainingAmount: 5000000,
        status: SupplierPayableStatus.UNPAID,
        supplier: { name: 'NCC Sách Giáo Dục' },
        paymentHistory: [],
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
          name: 'Quỹ tiền mặt',
          status: CashAccountStatus.ACTIVE,
          currentBalance: 10000000,
        }),
      });

      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(accountId),
          currentBalance: 8000000,
        }),
      });

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.paySupplier(
        payableId,
        {
          accountId,
          amount: 2000000,
          idempotencyKey: 'idemp-fin01-t01',
        },
        new Types.ObjectId().toString(),
      );

      expect(res.cashEntry).toBeDefined();
      expect(res.cashEntry.amount).toBe(2000000);
      expect(res.payable.paidAmount).toBe(2000000);
      expect(res.payable.remainingAmount).toBe(3000000);
      expect(res.payable.status).toBe(SupplierPayableStatus.PARTIALLY_PAID);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('FIN-01-T02: Retry cùng key, cùng payload 5 lần -> Chỉ trả kết quả cũ, không tăng paidAmount', async () => {
      const payableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();
      const existingEntry: any = {
        _id: new Types.ObjectId(),
        entryCode: 'PC261101-0001',
        amount: 2000000,
        idempotencyKey: 'retry-key-fin01',
        payloadHash: service.computePayloadHash({
          payableId,
          accountId,
          amount: 2000000,
          type: 'SUPPLIER_PAYMENT',
        }),
      };

      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        invoiceCode: 'GR261101-0001',
        totalAmount: 5000000,
        paidAmount: 2000000,
        remainingAmount: 3000000,
        status: SupplierPayableStatus.PARTIALLY_PAID,
        paymentHistory: [{ amount: 2000000 }],
      };

      mockPayableModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayable),
        }),
      });

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingEntry),
      });

      // Gọi retry 5 lần
      for (let i = 0; i < 5; i++) {
        const res = await service.paySupplier(
          payableId,
          {
            accountId,
            amount: 2000000,
            idempotencyKey: 'retry-key-fin01',
          },
          new Types.ObjectId().toString(),
        );

        expect(res.cashEntry.entryCode).toBe('PC261101-0001');
        // Không thay đổi paidAmount lần thứ hai
        expect(res.payable.paidAmount).toBe(2000000);
        expect(res.payable.paymentHistory.length).toBe(1);
      }
      expect(mockSession.startTransaction).not.toHaveBeenCalled();
    });

    it('FIN-01-T03: Cùng key nhưng đổi amount -> Ném ConflictException (409)', async () => {
      const payableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();
      const existingEntry: any = {
        _id: new Types.ObjectId(),
        entryCode: 'PC261101-0001',
        amount: 2000000,
        idempotencyKey: 'conflict-key-01',
        payloadHash: service.computePayloadHash({
          payableId,
          accountId,
          amount: 2000000,
          type: 'SUPPLIER_PAYMENT',
        }),
      };

      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        totalAmount: 5000000,
        paidAmount: 2000000,
        remainingAmount: 3000000,
        status: SupplierPayableStatus.PARTIALLY_PAID,
      };

      mockPayableModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayable),
        }),
      });

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingEntry),
      });

      // Thử dùng lại key với amount = 3000000
      await expect(
        service.paySupplier(
          payableId,
          {
            accountId,
            amount: 3000000, // Đổi amount!
            idempotencyKey: 'conflict-key-01',
          },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('FIN-01-T04: Cùng key nhưng đổi cash account -> Ném ConflictException (409)', async () => {
      const payableId = new Types.ObjectId().toString();
      const accountIdA = new Types.ObjectId().toString();
      const accountIdB = new Types.ObjectId().toString();
      const existingEntry: any = {
        _id: new Types.ObjectId(),
        entryCode: 'PC261101-0001',
        amount: 2000000,
        idempotencyKey: 'conflict-key-02',
        payloadHash: service.computePayloadHash({
          payableId,
          accountId: accountIdA,
          amount: 2000000,
          type: 'SUPPLIER_PAYMENT',
        }),
      };

      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        totalAmount: 5000000,
        remainingAmount: 5000000,
        status: SupplierPayableStatus.UNPAID,
      };

      mockPayableModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayable),
        }),
      });

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingEntry),
      });

      // Thử dùng lại key với accountId khác
      await expect(
        service.paySupplier(
          payableId,
          {
            accountId: accountIdB,
            amount: 2000000,
            idempotencyKey: 'conflict-key-02',
          },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('FIN-01-T05: Amount lớn hơn remainingAmount -> Bị từ chối và không tạo CashEntry', async () => {
      const payableId = new Types.ObjectId().toString();
      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        totalAmount: 5000000,
        remainingAmount: 1000000,
        status: SupplierPayableStatus.PARTIALLY_PAID,
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
            amount: 2000000, // Lớn hơn remaining 1tr
          },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockSession.startTransaction).not.toHaveBeenCalled();
    });

    it('FIN-01-T06: Account không đủ tiền -> Bị từ chối và không thay đổi AP', async () => {
      const payableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();
      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        totalAmount: 5000000,
        remainingAmount: 3000000,
        status: SupplierPayableStatus.PARTIALLY_PAID,
      };

      mockPayableModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayable),
        }),
      });

      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(accountId),
          name: 'Quỹ tiền mặt',
          status: CashAccountStatus.ACTIVE,
          currentBalance: 500000, // Chỉ có 500k, không đủ chi 2tr
        }),
      });

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.paySupplier(
          payableId,
          {
            accountId,
            amount: 2000000,
          },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('FIN-01-T07: Giả lập lỗi khi lưu payable sau khi tạo CashEntry -> Transaction rollback', async () => {
      const payableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();
      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        invoiceCode: 'GR261101-FAIL',
        totalAmount: 5000000,
        remainingAmount: 5000000,
        status: SupplierPayableStatus.UNPAID,
        supplier: { name: 'NCC Thất Bại' },
        paymentHistory: [],
        save: jest
          .fn()
          .mockRejectedValue(new Error('Lỗi CSDL khi lưu payable')),
      };

      mockPayableModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPayable),
        }),
      });

      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(accountId),
          name: 'Quỹ tiền mặt',
          status: CashAccountStatus.ACTIVE,
          currentBalance: 10000000,
        }),
      });

      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ currentBalance: 8000000 }),
      });

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.paySupplier(
          payableId,
          {
            accountId,
            amount: 2000000,
          },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow('Lỗi CSDL khi lưu payable');

      // Xác nhận transaction rollback được gọi
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('FIN-01-T09: Thu nợ khách 1 triệu -> Tạo 1 phiếu thu, AR giảm đúng, account tăng đúng', async () => {
      const receivableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();
      const mockReceivable: any = {
        _id: new Types.ObjectId(receivableId),
        invoiceCode: 'HD261101-0001',
        customerName: 'Đại lý Kim Đồng',
        totalAmount: 5000000,
        paidAmount: 0,
        remainingAmount: 5000000,
        status: CustomerReceivableStatus.UNPAID,
        collectionHistory: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockReceivableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReceivable),
      });

      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(accountId),
          name: 'Tài khoản Ngân hàng',
          status: CashAccountStatus.ACTIVE,
          currentBalance: 50000000,
        }),
      });

      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          currentBalance: 51000000,
        }),
      });

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.collectCustomerPayment(
        receivableId,
        {
          accountId,
          amount: 1000000,
          idempotencyKey: 'idemp-collect-t09',
        },
        new Types.ObjectId().toString(),
      );

      expect(res.cashEntry).toBeDefined();
      expect(res.cashEntry.amount).toBe(1000000);
      expect(res.receivable.paidAmount).toBe(1000000);
      expect(res.receivable.remainingAmount).toBe(4000000);
      expect(res.receivable.status).toBe(
        CustomerReceivableStatus.PARTIALLY_PAID,
      );
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('FIN-01-T10: Retry thu nợ sau timeout với cùng key -> Không tăng collectedAmount lần hai', async () => {
      const receivableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();
      const existingEntry: any = {
        _id: new Types.ObjectId(),
        entryCode: 'PT261101-0001',
        amount: 1000000,
        idempotencyKey: 'idemp-collect-t10',
        payloadHash: service.computePayloadHash({
          receivableId,
          accountId,
          amount: 1000000,
          type: 'WHOLESALE_COLLECTION',
        }),
      };

      const mockReceivable: any = {
        _id: new Types.ObjectId(receivableId),
        invoiceCode: 'HD261101-0001',
        totalAmount: 5000000,
        paidAmount: 1000000,
        remainingAmount: 4000000,
        status: CustomerReceivableStatus.PARTIALLY_PAID,
        collectionHistory: [{ amount: 1000000 }],
      };

      mockReceivableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReceivable),
      });

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingEntry),
      });

      // Gọi retry 3 lần
      for (let i = 0; i < 3; i++) {
        const res = await service.collectCustomerPayment(
          receivableId,
          {
            accountId,
            amount: 1000000,
            idempotencyKey: 'idemp-collect-t10',
          },
          new Types.ObjectId().toString(),
        );

        expect(res.cashEntry.entryCode).toBe('PT261101-0001');
        expect(res.receivable.paidAmount).toBe(1000000);
        expect(res.receivable.collectionHistory.length).toBe(1);
      }
      expect(mockSession.startTransaction).not.toHaveBeenCalled();
    });

    it('FIN-01-T11: Hai request thu cùng một receivable vượt quá nợ -> Không thu vượt số còn nợ', async () => {
      const receivableId = new Types.ObjectId().toString();
      const mockReceivable: any = {
        _id: new Types.ObjectId(receivableId),
        totalAmount: 5000000,
        remainingAmount: 2000000,
        status: CustomerReceivableStatus.PARTIALLY_PAID,
      };

      mockReceivableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReceivable),
      });

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

    it('FIN-01-T08: Hai request cùng thanh toán khi AP không đủ số nợ -> Chỉ request đầu thành công, request sau bị từ chối', async () => {
      const payableId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId().toString();

      // Giả lập trạng thái ban đầu: nợ 5tr
      const mockPayable: any = {
        _id: new Types.ObjectId(payableId),
        invoiceCode: 'GR261101-CONCURR',
        totalAmount: 5000000,
        paidAmount: 0,
        remainingAmount: 5000000,
        status: SupplierPayableStatus.UNPAID,
        supplier: { name: 'NCC Giấy' },
        paymentHistory: [],
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
          name: 'Quỹ tiền mặt',
          status: CashAccountStatus.ACTIVE,
          currentBalance: 20000000,
        }),
      });

      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ currentBalance: 16000000 }),
      });

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Request 1: Trả 4tr -> thành công, nợ còn 1tr
      const res1 = await service.paySupplier(
        payableId,
        { accountId, amount: 4000000 },
        new Types.ObjectId().toString(),
      );
      expect(res1.payable.remainingAmount).toBe(1000000);

      // Request 2: Trả tiếp 4tr khi nợ chỉ còn 1tr -> bị từ chối
      await expect(
        service.paySupplier(
          payableId,
          { accountId, amount: 4000000 },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('FIN-01-T12: DTO Validation - Amount bằng 0, âm, số thập phân hoặc không hợp lệ -> Bị từ chối', async () => {
      const { validate } = await import('class-validator');
      const { plainToInstance } = await import('class-transformer');
      const { PaySupplierDto, CollectCustomerPaymentDto } =
        await import('./dto/finance.dto');

      // 1. Amount = 0
      const dtoZero = plainToInstance(PaySupplierDto, {
        accountId: new Types.ObjectId().toString(),
        amount: 0,
      });
      const errsZero = await validate(dtoZero);
      expect(errsZero.length).toBeGreaterThan(0);

      // 2. Amount âm
      const dtoNegative = plainToInstance(PaySupplierDto, {
        accountId: new Types.ObjectId().toString(),
        amount: -100000,
      });
      const errsNeg = await validate(dtoNegative);
      expect(errsNeg.length).toBeGreaterThan(0);

      // 3. Amount là số thập phân
      const dtoDecimal = plainToInstance(PaySupplierDto, {
        accountId: new Types.ObjectId().toString(),
        amount: 1000.5,
      });
      const errsDec = await validate(dtoDecimal);
      expect(errsDec.length).toBeGreaterThan(0);

      // 4. Collect customer payment amount = 0
      const dtoCollectZero = plainToInstance(CollectCustomerPaymentDto, {
        accountId: new Types.ObjectId().toString(),
        amount: 0,
      });
      const errsCollect = await validate(dtoCollectZero);
      expect(errsCollect.length).toBeGreaterThan(0);
    });
  });
});
