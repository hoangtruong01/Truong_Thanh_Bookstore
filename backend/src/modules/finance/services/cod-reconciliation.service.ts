import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  CodReconciliationStatus,
} from '../../../common/enums';
import { Order, OrderDocument } from '../../orders/schemas/order.schema';
import {
  CashAccount,
  CashAccountDocument,
} from '../schemas/cash-account.schema';
import {
  CashEntry,
  CashEntryDocument,
  CashEntryDirection,
  CashEntryCategory,
  CashEntryStatus,
} from '../schemas/cash-entry.schema';
import {
  CodReconciliationBatch,
  CodReconciliationBatchDocument,
} from '../schemas/cod-reconciliation-batch.schema';
import { ReconcileCodStatementDto } from '../dto/cod-reconciliation.dto';

@Injectable()
export class CodReconciliationService {
  private readonly logger = new Logger(CodReconciliationService.name);

  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(CashAccount.name)
    private readonly cashAccountModel: Model<CashAccountDocument>,
    @InjectModel(CashEntry.name)
    private readonly cashEntryModel: Model<CashEntryDocument>,
    @InjectModel(CodReconciliationBatch.name)
    private readonly batchModel: Model<CodReconciliationBatchDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async processStatement(dto: ReconcileCodStatementDto, userId: string) {
    const existing = await this.batchModel
      .findOne({ statementId: dto.statementId.trim() })
      .exec();
    if (existing) {
      throw new ConflictException(
        `Bảng kê đối soát "${dto.statementId}" đã được xử lý trước đó (FIN-COD-T06).`,
      );
    }

    const bankAccount = await this.cashAccountModel
      .findById(dto.bankAccountId)
      .exec();
    if (!bankAccount) {
      throw new NotFoundException(
        `Không tìm thấy sổ quỹ ngân hàng với ID: ${dto.bankAccountId}`,
      );
    }

    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      let totalCod = 0;
      let totalShipping = 0;
      let matchedOrdersCount = 0;
      const discrepancies: Array<{ trackingCode: string; reason: string }> = [];

      for (const item of dto.items) {
        const order = await this.orderModel
          .findOne({ trackingCode: item.trackingCode.trim() })
          .session(session)
          .exec();

        if (!order) {
          discrepancies.push({
            trackingCode: item.trackingCode,
            reason: 'Mã vận đơn không tồn tại trên hệ thống (FIN-COD-T02)',
          });
          continue;
        }

        if (order.paymentMethod !== PaymentMethod.COD) {
          discrepancies.push({
            trackingCode: item.trackingCode,
            reason: `Đơn hàng không sử dụng hình thức thanh toán COD (${order.paymentMethod})`,
          });
          continue;
        }

        if (order.codStatus === CodReconciliationStatus.RECONCILED) {
          discrepancies.push({
            trackingCode: item.trackingCode,
            reason: `Vận đơn đã được đối soát trong bảng kê ${order.codReconciledBatch || 'trước'} (FIN-COD-T07)`,
          });
          continue;
        }

        if (order.orderStatus === OrderStatus.DELIVERED) {
          if (Math.round(item.codAmount) !== Math.round(order.total)) {
            order.codStatus = CodReconciliationStatus.DISCREPANCY;
            order.codDiscrepancyReason = `Lệch tiền COD: Bảng kê (${item.codAmount}đ) != Đơn hàng (${order.total}đ) (FIN-COD-T04)`;
            await order.save({ session });
            discrepancies.push({
              trackingCode: item.trackingCode,
              reason: order.codDiscrepancyReason,
            });
            continue;
          }

          order.codStatus = CodReconciliationStatus.RECONCILED;
          order.paymentStatus = PaymentStatus.PAID;
          order.codReconciledAt = new Date();
          order.codReconciledBatch = dto.statementId;
          order.timeline.push({
            status: order.orderStatus,
            note: `Đối soát COD thành công từ bảng kê ${dto.statementId}. Thu hộ: ${item.codAmount.toLocaleString('vi-VN')}đ, Cước phí: ${item.shippingFee.toLocaleString('vi-VN')}đ`,
            createdAt: new Date(),
          });

          await order.save({ session });
          totalCod += item.codAmount;
          totalShipping += item.shippingFee;
          matchedOrdersCount++;
        } else if (order.orderStatus === OrderStatus.RETURNED) {
          // FIN-COD-T05: Đơn hoàn trả chuyển hoàn ghi nhận cước hoàn, COD thu = 0
          const returnFee = item.returnFee || item.shippingFee || 0;
          order.codStatus = CodReconciliationStatus.RECONCILED;
          order.codReconciledAt = new Date();
          order.codReconciledBatch = dto.statementId;
          order.timeline.push({
            status: order.orderStatus,
            note: `Đối soát đơn hoàn trả từ bảng kê ${dto.statementId}. Cước chuyển hoàn: ${returnFee.toLocaleString('vi-VN')}đ`,
            createdAt: new Date(),
          });

          await order.save({ session });
          totalShipping += returnFee;
          matchedOrdersCount++;
        } else {
          discrepancies.push({
            trackingCode: item.trackingCode,
            reason: `Đơn hàng đang ở trạng thái "${order.orderStatus}", chưa giao thành công hoặc chuyển hoàn (FIN-COD-T03)`,
          });
        }
      }

      const netPayout = totalCod - totalShipping;
      let cashEntryId: Types.ObjectId | undefined;

      if (netPayout > 0) {
        const cashAccountInSession = await this.cashAccountModel
          .findById(bankAccount._id)
          .session(session)
          .exec();

        if (cashAccountInSession) {
          cashAccountInSession.currentBalance += netPayout;
          await cashAccountInSession.save({ session });

          const cashEntry = new this.cashEntryModel({
            entryCode: `PT-COD-${Date.now()}`,
            account: cashAccountInSession._id,
            direction: CashEntryDirection.IN,
            category: CashEntryCategory.ONLINE_REVENUE,
            amount: netPayout,
            partnerName: dto.carrier || 'GHN',
            note: `Thu tiền ròng đối soát COD bảng kê ${dto.statementId} (Thu COD: ${totalCod.toLocaleString('vi-VN')}đ - Cước phí: ${totalShipping.toLocaleString('vi-VN')}đ)`,
            status: CashEntryStatus.POSTED,
            postedAt: new Date(),
            createdBy: new Types.ObjectId(userId),
          });
          await cashEntry.save({ session });
          cashEntryId = cashEntry._id;
        }
      }

      const batch = new this.batchModel({
        statementId: dto.statementId.trim(),
        carrier: dto.carrier || 'GHN',
        bankAccount: bankAccount._id,
        totalCod,
        totalShipping,
        netPayout,
        matchedOrdersCount,
        discrepanciesCount: discrepancies.length,
        discrepancies,
        cashEntry: cashEntryId,
        note: dto.note,
        reconciledBy: new Types.ObjectId(userId),
      });
      await batch.save({ session });

      await session.commitTransaction();

      return {
        batch,
        totalCod,
        totalShipping,
        netPayout,
        matchedOrdersCount,
        discrepanciesCount: discrepancies.length,
        discrepancies,
      };
    } catch (err) {
      await session.abortTransaction();
      this.logger.error(
        `Reconciliation transaction failed for statement ${dto.statementId}:`,
        err,
      );
      throw err;
    } finally {
      await session.endSession();
    }
  }

  async getBatches() {
    return this.batchModel
      .find()
      .populate('bankAccount', 'code name')
      .populate('reconciledBy', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPendingCodOrders() {
    return this.orderModel
      .find({
        paymentMethod: PaymentMethod.COD,
        orderStatus: OrderStatus.DELIVERED,
        codStatus: { $ne: CodReconciliationStatus.RECONCILED },
      })
      .select(
        'orderCode customerName phone shippingAddress total trackingCode shippingStatus deliveredAt codStatus codDiscrepancyReason',
      )
      .sort({ deliveredAt: -1 })
      .exec();
  }
}
