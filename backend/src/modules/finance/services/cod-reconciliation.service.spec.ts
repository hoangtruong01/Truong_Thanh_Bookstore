import { ConflictException } from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CodReconciliationStatus,
} from '../../../common/enums';
import { CodReconciliationService } from './cod-reconciliation.service';

describe('FIN-COD-01: Carrier COD & Logistics Reconciliation Service', () => {
  let service: CodReconciliationService;

  const mockOrderModel: any = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockCashAccountModel: any = {
    findById: jest.fn(),
  };

  const mockCashEntryModel: any = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'cash_entry_cod_01',
    save: jest.fn().mockResolvedValue(data),
  }));

  const mockBatchModel: any = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'batch_01',
    save: jest.fn().mockResolvedValue(data),
  }));
  mockBatchModel.findOne = jest.fn();
  mockBatchModel.find = jest.fn();

  const mockSession: any = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  const mockConnection: any = {
    startSession: jest.fn().mockResolvedValue(mockSession),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CodReconciliationService(
      mockOrderModel,
      mockCashAccountModel,
      mockCashEntryModel,
      mockBatchModel,
      mockConnection,
    );
  });

  const sampleBankId = '666666666666666666666666';
  const sampleUserId = '777777777777777777777777';

  describe('FIN-COD-T01: Full Match Reconciliation', () => {
    it('successfully reconciles delivered COD orders, creates CashEntry IN, and updates bank balance', async () => {
      mockBatchModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null), // statementId not used yet
      });

      const bankAccount: any = {
        _id: sampleBankId,
        currentBalance: 10_000_000,
        save: jest.fn().mockResolvedValue(this),
      };
      mockCashAccountModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bankAccount),
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(bankAccount),
        }),
      });

      const order1: any = {
        _id: 'ord_1',
        trackingCode: 'GHN_TRACK_01',
        paymentMethod: PaymentMethod.COD,
        orderStatus: OrderStatus.DELIVERED,
        total: 500_000,
        timeline: [],
        save: jest.fn().mockResolvedValue(this),
      };

      const order2: any = {
        _id: 'ord_2',
        trackingCode: 'GHN_TRACK_02',
        paymentMethod: PaymentMethod.COD,
        orderStatus: OrderStatus.DELIVERED,
        total: 300_000,
        timeline: [],
        save: jest.fn().mockResolvedValue(this),
      };

      mockOrderModel.findOne.mockImplementation(({ trackingCode }: any) => ({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockImplementation(() => {
            if (trackingCode === 'GHN_TRACK_01') return Promise.resolve(order1);
            if (trackingCode === 'GHN_TRACK_02') return Promise.resolve(order2);
            return Promise.resolve(null);
          }),
        }),
      }));

      const result = await service.processStatement(
        {
          statementId: 'STMT-001',
          carrier: 'GHN',
          bankAccountId: sampleBankId,
          items: [
            {
              trackingCode: 'GHN_TRACK_01',
              codAmount: 500_000,
              shippingFee: 35_000,
            },
            {
              trackingCode: 'GHN_TRACK_02',
              codAmount: 300_000,
              shippingFee: 25_000,
            },
          ],
        },
        sampleUserId,
      );

      expect(result.totalCod).toBe(800_000);
      expect(result.totalShipping).toBe(60_000);
      expect(result.netPayout).toBe(740_000);
      expect(result.matchedOrdersCount).toBe(2);
      expect(result.discrepanciesCount).toBe(0);

      // Verify orders transitioned
      expect(order1.codStatus).toBe(CodReconciliationStatus.RECONCILED);
      expect(order1.paymentStatus).toBe(PaymentStatus.PAID);
      expect(order2.codStatus).toBe(CodReconciliationStatus.RECONCILED);
      expect(order2.paymentStatus).toBe(PaymentStatus.PAID);

      // Verify bank account updated
      expect(bankAccount.currentBalance).toBe(10_740_000);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });
  });

  describe('FIN-COD-T02 & T03 & T04: Discrepancy & Unknown Tracking Handlers', () => {
    it('FIN-COD-T02: records unknown tracking codes into discrepancies without failing other items', async () => {
      mockBatchModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const bankAccount: any = {
        _id: sampleBankId,
        currentBalance: 0,
        save: jest.fn(),
      };
      mockCashAccountModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bankAccount),
        session: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(bankAccount) }),
      });

      mockOrderModel.findOne.mockReturnValue({
        session: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      });

      const result = await service.processStatement(
        {
          statementId: 'STMT-002',
          bankAccountId: sampleBankId,
          items: [
            {
              trackingCode: 'UNKNOWN_999',
              codAmount: 200_000,
              shippingFee: 20_000,
            },
          ],
        },
        sampleUserId,
      );

      expect(result.discrepanciesCount).toBe(1);
      expect(result.discrepancies[0].trackingCode).toBe('UNKNOWN_999');
      expect(result.matchedOrdersCount).toBe(0);
      expect(result.netPayout).toBe(0);
    });

    it('FIN-COD-T04: marks order as DISCREPANCY when COD amount in statement does not match order total', async () => {
      mockBatchModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const bankAccount: any = {
        _id: sampleBankId,
        currentBalance: 0,
        save: jest.fn(),
      };
      mockCashAccountModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bankAccount),
        session: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(bankAccount) }),
      });

      const order: any = {
        _id: 'ord_mismatch',
        trackingCode: 'GHN_MISMATCH',
        paymentMethod: PaymentMethod.COD,
        orderStatus: OrderStatus.DELIVERED,
        total: 500_000, // Expected 500k
        save: jest.fn().mockResolvedValue(this),
      };

      mockOrderModel.findOne.mockReturnValue({
        session: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(order) }),
      });

      const result = await service.processStatement(
        {
          statementId: 'STMT-003',
          bankAccountId: sampleBankId,
          items: [
            {
              trackingCode: 'GHN_MISMATCH',
              codAmount: 400_000,
              shippingFee: 20_000,
            },
          ], // Carrier says 400k
        },
        sampleUserId,
      );

      expect(result.discrepanciesCount).toBe(1);
      expect(order.codStatus).toBe(CodReconciliationStatus.DISCREPANCY);
      expect(order.codDiscrepancyReason).toContain('Lệch tiền COD');
    });

    it('FIN-COD-T05: handles RETURNED orders by counting return fee and 0 COD revenue', async () => {
      mockBatchModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const bankAccount: any = {
        _id: sampleBankId,
        currentBalance: 1_000_000,
        save: jest.fn(),
      };
      mockCashAccountModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bankAccount),
        session: jest
          .fn()
          .mockReturnValue({ exec: jest.fn().mockResolvedValue(bankAccount) }),
      });

      const returnedOrder: any = {
        _id: 'ord_returned',
        trackingCode: 'GHN_RETURNED',
        paymentMethod: PaymentMethod.COD,
        orderStatus: OrderStatus.RETURNED,
        total: 450_000,
        timeline: [],
        save: jest.fn().mockResolvedValue(this),
      };

      mockOrderModel.findOne.mockReturnValue({
        session: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(returnedOrder),
        }),
      });

      const result = await service.processStatement(
        {
          statementId: 'STMT-004',
          bankAccountId: sampleBankId,
          items: [
            {
              trackingCode: 'GHN_RETURNED',
              codAmount: 0,
              shippingFee: 25_000,
              returnFee: 15_000,
            },
          ],
        },
        sampleUserId,
      );

      expect(result.totalCod).toBe(0);
      expect(result.totalShipping).toBe(15_000);
      expect(result.matchedOrdersCount).toBe(1);
      expect(returnedOrder.codStatus).toBe(CodReconciliationStatus.RECONCILED);
    });
  });

  describe('FIN-COD-T06 & T08: Idempotency & Rollback Safety', () => {
    it('FIN-COD-T06: rejects re-submitting identical statementId with ConflictException', async () => {
      mockBatchModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: 'batch_existing',
          statementId: 'STMT-DUP',
        }),
      });

      await expect(
        service.processStatement(
          {
            statementId: 'STMT-DUP',
            bankAccountId: sampleBankId,
            items: [
              {
                trackingCode: 'GHN_01',
                codAmount: 100_000,
                shippingFee: 10_000,
              },
            ],
          },
          sampleUserId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('FIN-COD-T08: rolls back MongoDB session when an unexpected database error occurs', async () => {
      mockBatchModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const bankAccount: any = { _id: sampleBankId, currentBalance: 0 };
      mockCashAccountModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(bankAccount),
      });

      // Cause DB error in session
      mockOrderModel.findOne.mockReturnValue({
        session: jest.fn().mockReturnValue({
          exec: jest
            .fn()
            .mockRejectedValue(new Error('MongoDB replica connection lost')),
        }),
      });

      await expect(
        service.processStatement(
          {
            statementId: 'STMT-ERR',
            bankAccountId: sampleBankId,
            items: [
              {
                trackingCode: 'GHN_ERR',
                codAmount: 100_000,
                shippingFee: 10_000,
              },
            ],
          },
          sampleUserId,
        ),
      ).rejects.toThrow('MongoDB replica connection lost');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });
  });
});
