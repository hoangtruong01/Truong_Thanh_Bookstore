/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { CustomerCreditService } from './customer-credit.service';
import {
  CustomerCreditProfile,
  CreditStatus,
} from '../schemas/customer-credit-profile.schema';
import { CustomerReceivable } from '../schemas/customer-receivable.schema';
import { User } from '../../users/schemas/user.schema';
import { StaffPermission, UserRole } from '../../../common/enums';

describe('CustomerCreditService (TASK AR-01)', () => {
  let service: CustomerCreditService;
  let mockCreditProfileModel: any;
  let mockReceivableModel: any;
  let mockUserModel: any;
  let mockConnection: any;

  beforeEach(async () => {
    mockCreditProfileModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockCreditProfileModel.findOne = jest.fn();
    mockCreditProfileModel.find = jest.fn();
    mockCreditProfileModel.findOneAndUpdate = jest.fn();
    mockCreditProfileModel.updateOne = jest.fn();
    mockCreditProfileModel.countDocuments = jest.fn();

    mockReceivableModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(), ...dto }),
    }));
    mockReceivableModel.findOne = jest.fn();
    mockReceivableModel.find = jest.fn();
    mockReceivableModel.findOneAndUpdate = jest.fn();
    mockReceivableModel.updateOne = jest.fn();

    mockUserModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
    };

    mockConnection = {
      startSession: jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerCreditService,
        {
          provide: getModelToken(CustomerCreditProfile.name),
          useValue: mockCreditProfileModel,
        },
        {
          provide: getModelToken(CustomerReceivable.name),
          useValue: mockReceivableModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<CustomerCreditService>(CustomerCreditService);
  });

  describe('AR-T01: Chặn bán nợ khi khách mới chưa được duyệt hạn mức', () => {
    it('Ném BadRequestException khi khách chưa có profile', async () => {
      mockCreditProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.checkCreditEligibility(
          new Types.ObjectId().toString(),
          1000000,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Ném BadRequestException khi hồ sơ đang ở trạng thái PENDING', async () => {
      mockCreditProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          creditStatus: CreditStatus.PENDING,
          creditLimit: 10000000,
        }),
      });

      await expect(
        service.checkCreditEligibility(
          new Types.ObjectId().toString(),
          1000000,
        ),
      ).rejects.toThrow('chưa được phê duyệt hồ sơ tín dụng');
    });
  });

  describe('AR-T02: Chặn bán nợ khi mua vượt hạn mức tín dụng', () => {
    it('Ném BadRequestException khi nợ hiện tại + số nợ mới > creditLimit', async () => {
      mockCreditProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          creditStatus: CreditStatus.APPROVED,
          creditLimit: 10000000,
          currentExposure: 8000000,
          paymentTermDays: 30,
        }),
      });
      mockReceivableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null), // không có nợ quá hạn
      });

      await expect(
        service.checkCreditEligibility(
          new Types.ObjectId().toString(),
          3000000,
        ),
      ).rejects.toThrow('Vượt quá hạn mức công nợ');
    });
  });

  describe('AR-T03: Duyệt bán nợ khi trong hạn mức tín dụng', () => {
    it('Cho phép bán nợ khi nợ hiện tại + số nợ mới <= creditLimit', async () => {
      const customerId = new Types.ObjectId().toString();
      const mockProfile = {
        creditStatus: CreditStatus.APPROVED,
        creditLimit: 10000000,
        currentExposure: 5000000,
        paymentTermDays: 30,
      };
      mockCreditProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProfile),
      });
      mockReceivableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.checkCreditEligibility(customerId, 4000000);
      expect(res.eligible).toBe(true);
      expect(res.profile).toBe(mockProfile);
      expect(res.dueDate).toBeDefined();
    });
  });

  describe('AR-T04: Chặn bán nợ khi hồ sơ khách hàng bị khóa (BLOCKED)', () => {
    it('Ném BadRequestException khi status là BLOCKED', async () => {
      mockCreditProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          creditStatus: CreditStatus.BLOCKED,
          creditLimit: 50000000,
          currentExposure: 0,
        }),
      });

      await expect(
        service.checkCreditEligibility(
          new Types.ObjectId().toString(),
          1000000,
        ),
      ).rejects.toThrow('đang bị khóa quyền mua nợ');
    });
  });

  describe('AR-T05: Chặn bán nợ khi khách hàng có khoản nợ quá hạn (Past due)', () => {
    it('Ném BadRequestException khi tồn tại khoản nợ quá hạn chưa trả', async () => {
      mockCreditProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          creditStatus: CreditStatus.APPROVED,
          creditLimit: 50000000,
          currentExposure: 1000000,
        }),
      });

      mockReceivableModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          invoiceCode: 'HD-OVERDUE-01',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 ngày trước
          remainingAmount: 1000000,
        }),
      });

      await expect(
        service.checkCreditEligibility(new Types.ObjectId().toString(), 500000),
      ).rejects.toThrow('có khoản nợ quá hạn chưa thanh toán');
    });
  });

  describe('AR-T06 & AR-T07: Khách thanh toán nợ -> Exposure giảm tương ứng', () => {
    it('releaseCreditExposureAtomic trừ đúng số tiền khỏi currentExposure', async () => {
      const customerId = new Types.ObjectId().toString();
      mockCreditProfileModel.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      await service.releaseCreditExposureAtomic(customerId, 2500000);

      expect(mockCreditProfileModel.updateOne).toHaveBeenCalledWith(
        { customer: new Types.ObjectId(customerId) },
        { $inc: { currentExposure: -2500000 } },
      );
    });
  });

  describe('AR-T08: Đặt trước hạn mức nguyên tử chống race condition', () => {
    it('Thành công khi conditional update khớp điều kiện currentExposure + req <= creditLimit', async () => {
      const customerId = new Types.ObjectId().toString();
      const updatedProfile = {
        _id: new Types.ObjectId(),
        customer: customerId,
        creditLimit: 20000000,
        currentExposure: 15000000,
      };

      mockCreditProfileModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedProfile),
      });

      const res = await service.reserveCreditExposureAtomic(
        customerId,
        5000000,
      );
      expect(res).toBe(updatedProfile);
      expect(mockCreditProfileModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          creditStatus: CreditStatus.APPROVED,
          $expr: {
            $lte: [{ $add: ['$currentExposure', 5000000] }, '$creditLimit'],
          },
        }),
        { $inc: { currentExposure: 5000000 } },
        { new: true },
      );
    });

    it('Ném BadRequestException khi 2 đơn đồng thời dẫn tới vượt hạn mức (findAndModify trả về null)', async () => {
      const customerId = new Types.ObjectId().toString();
      mockCreditProfileModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.reserveCreditExposureAtomic(customerId, 20000000),
      ).rejects.toThrow('Không thể cấp tín dụng bán chịu');
    });
  });

  describe('AR-T09: Đối soát nợ thực tế (reconcileExposure)', () => {
    it('Tính tổng remainingAmount từ các receivable chưa trả để đồng bộ currentExposure', async () => {
      const customerId = new Types.ObjectId().toString();
      mockReceivableModel.find.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue([
            { remainingAmount: 3000000 },
            { remainingAmount: 4500000 },
          ]),
      });

      mockCreditProfileModel.findOneAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          currentExposure: 7500000,
        }),
      });

      const res = await service.reconcileExposure(customerId);
      expect(res.reconciledExposure).toBe(7500000);
      expect(mockCreditProfileModel.findOneAndUpdate).toHaveBeenCalledWith(
        { customer: new Types.ObjectId(customerId) },
        { $set: { currentExposure: 7500000 } },
        { new: true },
      );
    });
  });

  describe('AR-T12 & AR-T13: Phân quyền & Audit trail thay đổi hạn mức', () => {
    it('AR-T12: Ném ForbiddenException khi người dùng không có quyền MANAGE_FINANCE hoặc ADMIN', async () => {
      const customerId = new Types.ObjectId().toString();
      const unauthorizedStaff = {
        _id: new Types.ObjectId().toString(),
        role: UserRole.STAFF,
        permissions: [StaffPermission.POS_ACCESS],
      };

      await expect(
        service.updateProfile(
          customerId,
          { creditLimit: 50000000, reason: 'Nâng hạn mức' },
          unauthorizedStaff,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('AR-T13: Ghi nhận auditHistory đầy đủ khi Quản lý tài chính điều chỉnh hạn mức', async () => {
      const customerId = new Types.ObjectId().toString();
      const manager = {
        _id: new Types.ObjectId().toString(),
        role: UserRole.STAFF,
        permissions: [StaffPermission.MANAGE_FINANCE],
        fullName: 'Kế toán trưởng',
      };

      const existingProfile: any = {
        creditLimit: 10000000,
        creditStatus: CreditStatus.PENDING,
        auditHistory: [],
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };

      mockCreditProfileModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingProfile),
      });

      const updated = await service.updateProfile(
        customerId,
        {
          creditLimit: 30000000,
          creditStatus: CreditStatus.APPROVED,
          reason: 'Khách hàng có lịch sử tín nhiệm tốt',
        },
        manager,
      );

      expect(updated.creditLimit).toBe(30000000);
      expect(updated.creditStatus).toBe(CreditStatus.APPROVED);
      expect(updated.auditHistory.length).toBe(1);
      expect(updated.auditHistory[0]).toMatchObject({
        oldCreditLimit: 10000000,
        newCreditLimit: 30000000,
        oldStatus: CreditStatus.PENDING,
        newStatus: CreditStatus.APPROVED,
        changedByName: 'Kế toán trưởng',
        reason: 'Khách hàng có lịch sử tín nhiệm tốt',
      });
    });
  });

  describe('AR-T14: Báo cáo tuổi nợ (Aging Report) và Export Excel', () => {
    it('Phân loại chính xác 5 bucket tuổi nợ: CURRENT, 1-30, 31-60, 61-90, >90', async () => {
      const asOf = new Date('2026-11-01T00:00:00.000Z');

      const mockReceivables = [
        {
          _id: new Types.ObjectId(),
          invoiceCode: 'HD-CURRENT',
          customer: new Types.ObjectId(),
          customerName: 'Khách A',
          totalAmount: 5000000,
          paidAmount: 0,
          remainingAmount: 5000000,
          dueDate: new Date('2026-11-10T00:00:00.000Z'), // Chưa đến hạn
        },
        {
          _id: new Types.ObjectId(),
          invoiceCode: 'HD-1-30',
          customer: new Types.ObjectId(),
          customerName: 'Khách B',
          totalAmount: 3000000,
          paidAmount: 0,
          remainingAmount: 3000000,
          dueDate: new Date('2026-10-20T00:00:00.000Z'), // Quá hạn 12 ngày
        },
        {
          _id: new Types.ObjectId(),
          invoiceCode: 'HD-31-60',
          customer: new Types.ObjectId(),
          customerName: 'Khách C',
          totalAmount: 2000000,
          paidAmount: 0,
          remainingAmount: 2000000,
          dueDate: new Date('2026-09-20T00:00:00.000Z'), // Quá hạn 42 ngày
        },
        {
          _id: new Types.ObjectId(),
          invoiceCode: 'HD-61-90',
          customer: new Types.ObjectId(),
          customerName: 'Khách D',
          totalAmount: 1500000,
          paidAmount: 0,
          remainingAmount: 1500000,
          dueDate: new Date('2026-08-15T00:00:00.000Z'), // Quá hạn 78 ngày
        },
        {
          _id: new Types.ObjectId(),
          invoiceCode: 'HD-OVER-90',
          customer: new Types.ObjectId(),
          customerName: 'Khách E',
          totalAmount: 4000000,
          paidAmount: 0,
          remainingAmount: 4000000,
          dueDate: new Date('2026-06-01T00:00:00.000Z'), // Quá hạn >90 ngày
        },
      ];

      mockReceivableModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockReceivables),
        }),
      });

      const report = await service.getAgingReport({
        asOfDate: asOf.toISOString(),
      });

      expect(report.summary.totalRemaining).toBe(15500000);
      expect(report.summary.current).toBe(5000000);
      expect(report.summary.overdue1to30).toBe(3000000);
      expect(report.summary.overdue31to60).toBe(2000000);
      expect(report.summary.overdue61to90).toBe(1500000);
      expect(report.summary.overdueOver90).toBe(4000000);
      expect(report.summary.totalOverdue).toBe(10500000);

      expect(report.items[0].bucket).toBe('CURRENT');
      expect(report.items[1].bucket).toBe('OVERDUE_1_30');
      expect(report.items[2].bucket).toBe('OVERDUE_31_60');
      expect(report.items[3].bucket).toBe('OVERDUE_61_90');
      expect(report.items[4].bucket).toBe('OVERDUE_OVER_90');
    });

    it('Xuất file Excel báo cáo tuổi nợ hợp lệ (đọc lại được qua ExcelJS Workbook)', async () => {
      mockReceivableModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId(),
              invoiceCode: 'HD-EXCEL-01',
              customer: new Types.ObjectId(),
              customerName: 'Công ty Giáo dục Alpha',
              customerPhone: '0901234567',
              totalAmount: 10000000,
              paidAmount: 2000000,
              remainingAmount: 8000000,
              dueDate: new Date('2026-10-15T00:00:00.000Z'),
            },
          ]),
        }),
      });

      const buffer = await service.exportAgingReportExcel({
        asOfDate: '2026-11-01',
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as any);
      const sheet = workbook.getWorksheet('BaoCaoTuoiNo');
      expect(sheet).toBeDefined();
      expect(sheet?.getCell('A1').value).toBe('Mã hóa đơn');
      expect(sheet?.getCell('B2').value).toBe('Công ty Giáo dục Alpha');
    });
  });
});
