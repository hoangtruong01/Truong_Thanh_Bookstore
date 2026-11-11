/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
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

/**
 * Mô phỏng findOneAndUpdate nguyên tử của MongoDB trên "document hiện tại"
 * (lấy từ mock findOne): kiểm tra điều kiện lọc rồi áp $inc/$set/$push.
 * Trả null nếu điều kiện không thỏa (giống Mongo khi không match).
 */
function emulateAtomicUpdate(getCurrentDoc: () => any) {
  return (filter: any, update: any) => {
    const exec = async () => {
      const q = getCurrentDoc();
      let doc = q;
      if (q && typeof q.populate === 'function') {
        doc = await q.populate().exec();
      } else if (q && typeof q.exec === 'function') {
        doc = await q.exec();
      }
      if (!doc) return null;
      const cond = filter.remainingAmount;
      if (typeof cond === 'number' && doc.remainingAmount !== cond) return null;
      if (cond?.$gte !== undefined && doc.remainingAmount < cond.$gte) {
        return null;
      }
      if (filter.status?.$ne && doc.status === filter.status.$ne) return null;
      for (const [k, v] of Object.entries(update.$inc || {})) {
        doc[k] = (doc[k] || 0) + (v as number);
      }
      Object.assign(doc, update.$set || {});
      for (const [k, v] of Object.entries(update.$push || {})) {
        doc[k] = doc[k] || [];
        doc[k].push(v);
      }
      return doc;
    };
    const query: any = { exec };
    query.session = jest.fn().mockReturnValue(query);
    return query;
  };
}

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
    mockEntryModel.findById = jest.fn();
    mockEntryModel.findOneAndUpdate = jest.fn();
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
    mockPayableModel.findOneAndUpdate = jest
      .fn()
      .mockImplementation(
        emulateAtomicUpdate(() => mockPayableModel.findOne()),
      );

    mockReceivableModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockReceivableModel.find = jest.fn();
    mockReceivableModel.findOne = jest.fn();
    mockReceivableModel.countDocuments = jest.fn();
    mockReceivableModel.findOneAndUpdate = jest
      .fn()
      .mockImplementation(
        emulateAtomicUpdate(() => mockReceivableModel.findOne()),
      );

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
      const mockAcc = {
        _id: accountId,
        name: 'Quỹ tiền mặt',
        status: CashAccountStatus.ACTIVE,
        currentBalance: 5000000,
      };
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
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAcc),
      });
      mockEntryModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...originalEntry,
          status: CashEntryStatus.REVERSED,
        }),
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockAcc,
          currentBalance: 5500000,
        }),
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
        expect.objectContaining({ _id: accountId }),
        { $inc: { currentBalance: 500000 } }, // Hoàn lại số tiền vào quỹ
        { new: true },
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

      // SEC-009: cập nhật payable nay đi qua findOneAndUpdate nguyên tử (không còn save())
      mockPayableModel.findOneAndUpdate.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockRejectedValue(new Error('Lỗi CSDL khi lưu payable')),
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

  describe('SEC-009: Race condition khi thanh toán / thu nợ (không ghi đè doc stale)', () => {
    const accountId = new Types.ObjectId().toString();

    const setupAccountAndEntryMocks = () => {
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(accountId),
          name: 'Quỹ tiền mặt',
          status: CashAccountStatus.ACTIVE,
          currentBalance: 100000000,
        }),
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ currentBalance: 90000000 }),
      });
      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
    };

    it('SEC-009-T01: paySupplier - update có điều kiện không match (doc stale) -> ConflictException, KHÔNG gọi payable.save()', async () => {
      const payableId = new Types.ObjectId().toString();
      const save = jest.fn();
      const stalePayable: any = {
        _id: new Types.ObjectId(payableId),
        invoiceCode: 'PN-RACE-1',
        paidAmount: 0,
        remainingAmount: 5000000,
        status: SupplierPayableStatus.UNPAID,
        supplier: { name: 'NCC' },
        paymentHistory: [],
        save,
      };
      mockPayableModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(stalePayable),
        }),
      });
      setupAccountAndEntryMocks();
      // Request khác đã trả hết trước đó -> guard remainingAmount $gte không match
      mockPayableModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.paySupplier(
          payableId,
          { accountId, amount: 4000000 },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(ConflictException);

      expect(save).not.toHaveBeenCalled();
      expect(stalePayable.remainingAmount).toBe(5000000);
      expect(stalePayable.paymentHistory).toHaveLength(0);
    });

    it('SEC-009-T02: collectCustomerPayment - update có điều kiện không match (doc stale) -> ConflictException, KHÔNG gọi receivable.save()', async () => {
      const receivableId = new Types.ObjectId().toString();
      const save = jest.fn();
      const staleReceivable: any = {
        _id: new Types.ObjectId(receivableId),
        invoiceCode: 'HD-RACE-1',
        customerName: 'Đại lý',
        paidAmount: 0,
        remainingAmount: 5000000,
        status: CustomerReceivableStatus.UNPAID,
        collectionHistory: [],
        save,
      };
      mockReceivableModel.findOne.mockReturnValue(staleReceivable);
      setupAccountAndEntryMocks();
      mockReceivableModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.collectCustomerPayment(
          receivableId,
          { accountId, amount: 4000000 },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(ConflictException);

      expect(save).not.toHaveBeenCalled();
      expect(staleReceivable.remainingAmount).toBe(5000000);
      expect(staleReceivable.collectionHistory).toHaveLength(0);
    });

    it('SEC-009-T03: 2 request paySupplier đồng thời cùng snapshot cũ (3tr + 3tr / nợ 5tr) -> chỉ 1 thành công, không trả vượt nợ', async () => {
      const payableId = new Types.ObjectId().toString();
      // "DB" thật: trạng thái nguyên tử duy nhất
      const dbDoc: any = {
        _id: new Types.ObjectId(payableId),
        invoiceCode: 'PN-RACE-3',
        paidAmount: 0,
        remainingAmount: 5000000,
        status: SupplierPayableStatus.UNPAID,
        paymentHistory: [],
      };
      // Mỗi lần đọc trả snapshot riêng (cũ khi request kia ghi trước); save() ghi đè
      // dbDoc giống hành vi doc.save() cũ -> nếu còn fallback, test sẽ fail.
      mockPayableModel.findOne.mockImplementation(() => {
        const snap: any = {
          ...dbDoc,
          paymentHistory: [...dbDoc.paymentHistory],
          supplier: { name: 'NCC' },
        };
        snap.save = jest.fn().mockImplementation(() => {
          Object.assign(dbDoc, {
            paidAmount: snap.paidAmount,
            remainingAmount: snap.remainingAmount,
            status: snap.status,
            paymentHistory: snap.paymentHistory,
          });
          return Promise.resolve(snap);
        });
        return {
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(snap),
          }),
        };
      });
      mockPayableModel.findOneAndUpdate.mockImplementation(
        emulateAtomicUpdate(() => dbDoc),
      );
      setupAccountAndEntryMocks();

      const userId = new Types.ObjectId().toString();
      const results = await Promise.allSettled([
        service.paySupplier(payableId, { accountId, amount: 3000000 }, userId),
        service.paySupplier(payableId, { accountId, amount: 3000000 }, userId),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(ConflictException);
      expect(dbDoc.paidAmount).toBe(3000000);
      expect(dbDoc.remainingAmount).toBe(2000000);
      expect(dbDoc.paymentHistory).toHaveLength(1);
    });

    it('SEC-009-T04: 2 request thu nợ đồng thời tổng đúng bằng số nợ -> remaining = 0 và status được đồng bộ về PAID (không kẹt PARTIALLY_PAID)', async () => {
      const receivableId = new Types.ObjectId().toString();
      const dbDoc: any = {
        _id: new Types.ObjectId(receivableId),
        invoiceCode: 'HD-RACE-4',
        customerName: 'Đại lý',
        paidAmount: 0,
        remainingAmount: 5000000,
        status: CustomerReceivableStatus.UNPAID,
        collectionHistory: [],
      };
      mockReceivableModel.findOne.mockImplementation(() => ({
        ...dbDoc,
        collectionHistory: [...dbDoc.collectionHistory],
        save: jest.fn(),
      }));
      mockReceivableModel.findOneAndUpdate.mockImplementation(
        emulateAtomicUpdate(() => dbDoc),
      );
      setupAccountAndEntryMocks();

      const userId = new Types.ObjectId().toString();
      const results = await Promise.all([
        service.collectCustomerPayment(
          receivableId,
          { accountId, amount: 2500000 },
          userId,
        ),
        service.collectCustomerPayment(
          receivableId,
          { accountId, amount: 2500000 },
          userId,
        ),
      ]);

      expect(results).toHaveLength(2);
      expect(dbDoc.paidAmount).toBe(5000000);
      expect(dbDoc.remainingAmount).toBe(0);
      expect(dbDoc.status).toBe(CustomerReceivableStatus.PAID);
      expect(dbDoc.collectionHistory).toHaveLength(2);
    });
  });

  describe('SEC-014: Escape regex trong tìm kiếm (finance)', () => {
    it('SEC-014-T01: buildCashEntryFilter escape ký tự đặc biệt -> không hiểu input là pattern', () => {
      const filter = service.buildCashEntryFilter({ search: '(a+)+$.*' });
      const regex: RegExp = filter.$or[0].entryCode;
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex.source).toBe('\\(a\\+\\)\\+\\$\\.\\*');
      // Khớp theo nghĩa đen, không khớp "aaaa" như pattern (a+)+
      expect(regex.test('aaaa')).toBe(false);
      expect(regex.test('xx(a+)+$.*yy')).toBe(true);
    });

    it('SEC-014-T02: findAllPayables escape search', async () => {
      const chain: any = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };
      mockPayableModel.find.mockReturnValue(chain);
      mockPayableModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await service.findAllPayables({ search: '.*' });

      const filter = mockPayableModel.find.mock.calls[0][0];
      expect(filter.invoiceCode.source).toBe('\\.\\*');
    });
  });

  describe('FIN-02: Safe Reversal of Cash Entries (Hoàn đảo phiếu thu/chi an toàn)', () => {
    it('FIN-02-T01: Đảo phiếu chi 1 triệu -> Tạo phiếu thu đảo; balance tăng 1 triệu; gốc thành REVERSED', async () => {
      const entryId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId();
      const mockAcc = {
        _id: accountId,
        name: 'Quỹ tiền mặt',
        status: CashAccountStatus.ACTIVE,
        currentBalance: 5000000,
      };
      const originalEntry: any = {
        _id: new Types.ObjectId(entryId),
        entryCode: 'PC261030-0010',
        account: accountId,
        direction: CashEntryDirection.OUT,
        category: CashEntryCategory.OTHER_EXPENSE,
        amount: 1000000,
        status: CashEntryStatus.POSTED,
        note: 'Chi phí vận hành',
      };

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(originalEntry),
      });
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAcc),
      });
      mockEntryModel.findOneAndUpdate.mockImplementation((filter: any) => {
        if (filter.status === CashEntryStatus.POSTED) {
          return {
            exec: jest.fn().mockResolvedValue({
              ...originalEntry,
              status: CashEntryStatus.REVERSED,
            }),
          };
        }
        return {
          exec: jest.fn().mockResolvedValue({
            ...originalEntry,
            status: CashEntryStatus.REVERSED,
            note: `${originalEntry.note} (Đã hoàn đảo bởi PT...)`,
          }),
        };
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockAcc,
          currentBalance: 6000000,
        }),
      });

      const res = await service.reverseEntry(
        entryId,
        { reason: 'Sai lệch số tiền chi thực tế' },
        new Types.ObjectId().toString(),
      );

      expect(res.original.status).toBe(CashEntryStatus.REVERSED);
      expect(res.reversal.direction).toBe(CashEntryDirection.IN);
      expect(res.reversal.amount).toBe(1000000);
      expect(res.reversal.reversalOf).toEqual(originalEntry._id);
      expect(mockAccountModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ _id: accountId }),
        { $inc: { currentBalance: 1000000 } },
        { new: true },
      );
    });

    it('FIN-02-T02: Đảo phiếu thu khi account đủ tiền -> Tạo phiếu chi đảo; balance giảm 1 triệu', async () => {
      const entryId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId();
      const mockAcc = {
        _id: accountId,
        name: 'Tài khoản Techcombank',
        status: CashAccountStatus.ACTIVE,
        currentBalance: 10000000,
      };
      const originalEntry: any = {
        _id: new Types.ObjectId(entryId),
        entryCode: 'PT261030-0010',
        account: accountId,
        direction: CashEntryDirection.IN,
        category: CashEntryCategory.WHOLESALE_COLLECTION,
        amount: 2000000,
        status: CashEntryStatus.POSTED,
      };

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(originalEntry),
      });
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAcc),
      });
      mockEntryModel.findOneAndUpdate.mockImplementation((filter: any) => {
        if (filter.status === CashEntryStatus.POSTED) {
          return {
            exec: jest.fn().mockResolvedValue({
              ...originalEntry,
              status: CashEntryStatus.REVERSED,
            }),
          };
        }
        return {
          exec: jest.fn().mockResolvedValue({
            ...originalEntry,
            status: CashEntryStatus.REVERSED,
          }),
        };
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockAcc,
          currentBalance: 8000000,
        }),
      });

      const res = await service.reverseEntry(
        entryId,
        { reason: 'Khách hàng chuyển khoản nhầm' },
        new Types.ObjectId().toString(),
      );

      expect(res.original.status).toBe(CashEntryStatus.REVERSED);
      expect(res.reversal.direction).toBe(CashEntryDirection.OUT);
      expect(res.reversal.amount).toBe(2000000);
      expect(mockAccountModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: accountId,
          currentBalance: { $gte: 2000000 },
        }),
        { $inc: { currentBalance: -2000000 } },
        { new: true },
      );
    });

    it('FIN-02-T03: Đảo phiếu thu khi account không đủ tiền -> Bị từ chối (BadRequestException)', async () => {
      const entryId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId();
      const mockAcc = {
        _id: accountId,
        name: 'Quỹ tiền mặt',
        status: CashAccountStatus.ACTIVE,
        currentBalance: 500000, // Chỉ có 500k
      };
      const originalEntry: any = {
        _id: new Types.ObjectId(entryId),
        entryCode: 'PT261030-0015',
        account: accountId,
        direction: CashEntryDirection.IN,
        category: CashEntryCategory.WHOLESALE_COLLECTION,
        amount: 2000000, // Cần hoàn đảo 2 triệu
        status: CashEntryStatus.POSTED,
      };

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(originalEntry),
      });
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAcc),
      });

      await expect(
        service.reverseEntry(
          entryId,
          { reason: 'Hoàn đảo giao dịch thu' },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('FIN-02-T04: Gửi 10 request đảo đồng thời -> Chỉ 1 reversal được tạo, 9 request bị từ chối', async () => {
      const entryId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId();
      const mockAcc = {
        _id: accountId,
        name: 'Quỹ tiền mặt',
        status: CashAccountStatus.ACTIVE,
        currentBalance: 5000000,
      };
      const originalEntry: any = {
        _id: new Types.ObjectId(entryId),
        entryCode: 'PC261030-0020',
        account: accountId,
        direction: CashEntryDirection.OUT,
        category: CashEntryCategory.OTHER_EXPENSE,
        amount: 500000,
        status: CashEntryStatus.POSTED,
      };

      let executionCount = 0;
      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(originalEntry),
      });
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAcc),
      });
      mockEntryModel.findOneAndUpdate.mockImplementation((filter: any) => {
        if (filter.status === CashEntryStatus.POSTED) {
          executionCount++;
          // Chỉ request đầu tiên tìm thấy POSTED, các request sau nhận null do tài liệu đã chuyển sang REVERSED
          if (executionCount === 1) {
            return {
              exec: jest.fn().mockResolvedValue({
                ...originalEntry,
                status: CashEntryStatus.REVERSED,
              }),
            };
          }
          return { exec: jest.fn().mockResolvedValue(null) };
        }
        return {
          exec: jest.fn().mockResolvedValue({
            ...originalEntry,
            status: CashEntryStatus.REVERSED,
          }),
        };
      });
      mockAccountModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAcc),
      });

      const promises = Array.from({ length: 10 }).map(() =>
        service
          .reverseEntry(
            entryId,
            { reason: 'Concurrent reversal test' },
            new Types.ObjectId().toString(),
          )
          .then(() => 'SUCCESS')
          .catch((err) => err.message),
      );

      const results = await Promise.all(promises);
      const successes = results.filter((r) => r === 'SUCCESS');
      const failures = results.filter((r) => r !== 'SUCCESS');

      expect(successes.length).toBe(1);
      expect(failures.length).toBe(9);
    });

    it('FIN-02-T05: Retry cùng idempotency key -> Trả reversal cũ, không tạo thêm phiếu', async () => {
      const entryId = new Types.ObjectId().toString();
      const idempotencyKey = 'rev_key_test_001';
      const existingReversal: any = {
        _id: new Types.ObjectId(),
        entryCode: 'PT261030-0099',
        reversalOf: new Types.ObjectId(entryId),
        direction: CashEntryDirection.IN,
        amount: 1000000,
        idempotencyKey,
      };

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingReversal),
      });
      mockEntryModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(entryId),
          entryCode: 'PC261030-0010',
          status: CashEntryStatus.REVERSED,
        }),
      });

      const res = await service.reverseEntry(
        entryId,
        { reason: 'Thử lại cùng idempotency key', idempotencyKey },
        new Types.ObjectId().toString(),
      );

      expect(res.reversal).toBe(existingReversal);
      expect(res.reversal.entryCode).toBe('PT261030-0099');
      // Không gọi cập nhật balance lần 2
      expect(mockAccountModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('FIN-02-T06: Đảo phiếu đã REVERSED -> Bị từ chối (BadRequestException 400)', async () => {
      const entryId = new Types.ObjectId().toString();
      const alreadyReversedEntry: any = {
        _id: new Types.ObjectId(entryId),
        entryCode: 'PC261030-0030',
        direction: CashEntryDirection.OUT,
        status: CashEntryStatus.REVERSED,
      };

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(alreadyReversedEntry),
      });

      await expect(
        service.reverseEntry(
          entryId,
          { reason: 'Cố đảo phiếu đã REVERSED' },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('FIN-02-T07: Đảo phiếu DRAFT hoặc CANCELLED -> Bị từ chối (BadRequestException 400)', async () => {
      const entryId = new Types.ObjectId().toString();
      const cancelledEntry: any = {
        _id: new Types.ObjectId(entryId),
        entryCode: 'PC261030-0031',
        direction: CashEntryDirection.OUT,
        status: CashEntryStatus.CANCELLED,
      };

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(cancelledEntry),
      });

      await expect(
        service.reverseEntry(
          entryId,
          { reason: 'Cố đảo phiếu đã CANCELLED' },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('FIN-02-T08: Lỗi khi cập nhật account -> Transaction rollback toàn bộ', async () => {
      const entryId = new Types.ObjectId().toString();
      const accountId = new Types.ObjectId();
      const mockAcc = {
        _id: accountId,
        name: 'Quỹ tiền mặt',
        status: CashAccountStatus.ACTIVE,
        currentBalance: 5000000,
      };
      const originalEntry: any = {
        _id: new Types.ObjectId(entryId),
        entryCode: 'PC261030-0040',
        account: accountId,
        direction: CashEntryDirection.OUT,
        category: CashEntryCategory.OTHER_EXPENSE,
        amount: 500000,
        status: CashEntryStatus.POSTED,
      };

      const mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn().mockResolvedValue(undefined),
        endSession: jest.fn().mockResolvedValue(undefined),
      };

      mockConnection.startSession.mockResolvedValueOnce(mockSession);

      mockEntryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(originalEntry),
      });
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAcc),
      });
      mockEntryModel.findOneAndUpdate.mockReturnValue({
        session: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          ...originalEntry,
          status: CashEntryStatus.REVERSED,
        }),
      });

      // Giả lập lỗi khi cập nhật account
      mockAccountModel.findOneAndUpdate.mockImplementation(() => {
        throw new Error('Database write error on account update');
      });

      await expect(
        service.reverseEntry(
          entryId,
          { reason: 'Rollback test' },
          new Types.ObjectId().toString(),
        ),
      ).rejects.toThrow('Database write error on account update');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('FIN-02-T09: User không có quyền MANAGE_FINANCE -> PermissionsGuard từ chối (403 Forbidden)', async () => {
      const { Reflector } = await import('@nestjs/core');
      const { PermissionsGuard } =
        await import('../../common/guards/permissions.guard');
      const { FinanceController } = await import('./finance.controller');
      const { StaffPermission, UserRole } = await import('../../common/enums');
      const { ForbiddenException } = await import('@nestjs/common');

      const reflector = new Reflector();
      const guard = new PermissionsGuard(reflector);

      // 1. Kiểm tra metadata decorator trên controller handler
      const requiredPermissions = reflector.get<string[]>(
        'permissions',
        FinanceController.prototype.reverseEntry,
      );
      expect(requiredPermissions).toContain(StaffPermission.MANAGE_FINANCE);

      // 2. User role STAFF nhưng thiếu MANAGE_FINANCE -> Ném ForbiddenException (403)
      const mockContextStaffWithoutPerm: any = {
        getHandler: () => FinanceController.prototype.reverseEntry,
        getClass: () => FinanceController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: UserRole.STAFF,
              permissions: [StaffPermission.MANAGE_ORDERS], // Không có MANAGE_FINANCE
              status: true,
            },
          }),
        }),
      };

      expect(() => guard.canActivate(mockContextStaffWithoutPerm)).toThrow(
        ForbiddenException,
      );

      // 3. User có MANAGE_FINANCE -> Cho phép (true)
      const mockContextStaffWithPerm: any = {
        getHandler: () => FinanceController.prototype.reverseEntry,
        getClass: () => FinanceController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: UserRole.STAFF,
              permissions: [StaffPermission.MANAGE_FINANCE],
              status: true,
            },
          }),
        }),
      };

      expect(guard.canActivate(mockContextStaffWithPerm)).toBe(true);
    });
  });

  describe('TASK CASH-01: Export sổ quỹ chuẩn hóa bộ lọc và thống kê', () => {
    const mockEntriesQueryChain = (items: any[]) => {
      const exec = jest.fn().mockResolvedValue(items);
      const pop2 = jest.fn().mockReturnValue({ exec });
      const pop1 = jest.fn().mockReturnValue({ populate: pop2 });
      const sort = jest.fn().mockReturnValue({ populate: pop1 });
      mockEntryModel.find.mockReturnValue({ sort });
      return { exec, pop2, pop1, sort };
    };

    it('CASH-T01: Filter accountId -> Shared builder và export filter đúng account', async () => {
      const accountId = new Types.ObjectId().toString();
      const filter = service.buildCashEntryFilter({ accountId });
      expect(filter.account).toEqual(new Types.ObjectId(accountId));
      expect(filter.isDeleted).toBe(false);
    });

    it('CASH-T02: Filter direction OUT -> Shared builder và export filter chỉ lấy phiếu chi', () => {
      const filter = service.buildCashEntryFilter({
        direction: CashEntryDirection.OUT,
      });
      expect(filter.direction).toBe(CashEntryDirection.OUT);
    });

    it('CASH-T03: Filter date range -> Shared builder thiết lập $gte và $lte cho postedAt', () => {
      const filter = service.buildCashEntryFilter({
        startDate: '2026-05-01',
        endDate: '2026-05-31',
      });
      expect(filter.postedAt.$gte).toEqual(new Date('2026-05-01'));
      expect(filter.postedAt.$lte).toBeDefined();
    });

    it('CASH-T04: Search theo mã phiếu/đối tác -> Shared builder tạo $or search regex', () => {
      const filter = service.buildCashEntryFilter({ search: 'PT-2026' });
      expect(filter.$or).toBeDefined();
      expect(filter.$or.length).toBeGreaterThanOrEqual(3);
    });

    it('CASH-T05: Kết hợp nhiều filter -> Filter chứa đủ các tiêu chí lọc', () => {
      const accountId = new Types.ObjectId().toString();
      const filter = service.buildCashEntryFilter({
        accountId,
        direction: CashEntryDirection.IN,
        category: CashEntryCategory.WHOLESALE_COLLECTION,
        status: CashEntryStatus.POSTED,
        search: 'Khách sỉ ABC',
      });
      expect(filter.account).toEqual(new Types.ObjectId(accountId));
      expect(filter.direction).toBe(CashEntryDirection.IN);
      expect(filter.category).toBe(CashEntryCategory.WHOLESALE_COLLECTION);
      expect(filter.status).toBe(CashEntryStatus.POSTED);
      expect(filter.$or).toBeDefined();
    });

    it('CASH-T06: Có trên 5.000 record -> Không mất dữ liệu âm thầm, xuất đủ toàn bộ', async () => {
      const largeList = Array.from({ length: 5200 }, (_, i) => ({
        entryCode: `PT-${10000 + i}`,
        postedAt: new Date(),
        account: { name: 'Quỹ Tiền Mặt', code: 'CASH-01' },
        direction: CashEntryDirection.IN,
        category: CashEntryCategory.POS_REVENUE,
        amount: 100000,
        partnerName: `Khách hàng ${i}`,
        status: CashEntryStatus.POSTED,
        createdBy: { name: 'Thu ngân' },
        note: 'Bán lẻ',
      }));

      mockEntriesQueryChain(largeList);

      const buffer = await service.exportCashEntriesToExcel({});
      expect(buffer).toBeDefined();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('So_Quy_Thu_Chi');

      expect(sheet).toBeDefined();
      // 5 tiêu đề/metadata + 1 header + 5200 data rows + 1 total row = 5207 rows
      expect(sheet!.rowCount).toBeGreaterThanOrEqual(5206);
    });

    it('CASH-T07: Không có dữ liệu -> File hợp lệ và hiển thị thông báo không có record', async () => {
      mockEntriesQueryChain([]);

      const buffer = await service.exportCashEntriesToExcel({});
      expect(buffer).toBeDefined();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('So_Quy_Thu_Chi');

      expect(sheet).toBeDefined();
      const emptyRow = sheet!.getRow(7);
      expect(emptyRow.getCell(2).value).toContain(
        'Không có dữ liệu phiếu thu chi phù hợp',
      );
    });

    it('CASH-T08: User không có VIEW_REPORTS hoặc MANAGE_FINANCE -> 403 Forbidden', async () => {
      const { Reflector } = await import('@nestjs/core');
      const { PermissionsGuard } =
        await import('../../common/guards/permissions.guard');
      const { FinanceController } = await import('./finance.controller');
      const { StaffPermission, UserRole } = await import('../../common/enums');
      const { ForbiddenException } = await import('@nestjs/common');

      const reflector = new Reflector();
      const guard = new PermissionsGuard(reflector);

      const requiredPermissions = reflector.get<string[]>(
        'permissions',
        FinanceController.prototype.exportEntries,
      );
      expect(requiredPermissions).toContain(StaffPermission.MANAGE_FINANCE);
      expect(requiredPermissions).toContain(StaffPermission.VIEW_REPORTS);

      const mockContextStaffUnauthorized: any = {
        getHandler: () => FinanceController.prototype.exportEntries,
        getClass: () => FinanceController,
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              role: UserRole.STAFF,
              permissions: [StaffPermission.POS_ACCESS], // Không có MANAGE_FINANCE hay VIEW_REPORTS
              status: true,
            },
          }),
        }),
      };

      expect(() => guard.canActivate(mockContextStaffUnauthorized)).toThrow(
        ForbiddenException,
      );
    });

    it('CASH-T09: Tổng thu / chi trên Excel khớp chính xác tổng số liệu thực tế', async () => {
      const sampleItems = [
        {
          entryCode: 'PT-01',
          postedAt: new Date(),
          account: { name: 'Quỹ Tiền Mặt', code: 'CASH-01' },
          direction: CashEntryDirection.IN,
          category: CashEntryCategory.POS_REVENUE,
          amount: 500000,
          partnerName: 'Khách A',
          status: CashEntryStatus.POSTED,
          createdBy: { name: 'Admin' },
        },
        {
          entryCode: 'PC-01',
          postedAt: new Date(),
          account: { name: 'Quỹ Tiền Mặt', code: 'CASH-01' },
          direction: CashEntryDirection.OUT,
          category: CashEntryCategory.SUPPLIER_PAYMENT,
          amount: 200000,
          partnerName: 'NCC B',
          status: CashEntryStatus.POSTED,
          createdBy: { name: 'Admin' },
        },
      ];

      mockEntriesQueryChain(sampleItems);

      const buffer = await service.exportCashEntriesToExcel(
        {},
        { name: 'Kế toán viên' },
      );
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('So_Quy_Thu_Chi');

      expect(sheet).toBeDefined();
      expect(sheet!.getCell('D4').value).toContain('500.000'); // Tổng thu
      expect(sheet!.getCell('G4').value).toContain('200.000'); // Tổng chi
      expect(sheet!.getCell('J4').value).toContain('300.000'); // Chênh lệch (500k - 200k)
    });
  });
});
