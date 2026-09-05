import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderStatus, PaymentMethod } from '../../common/enums';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrdersService } from '../orders/orders.service';
import { CreateGhnShipmentDto } from './dto/shipping.dto';

export function mapGhnStatus(status: string): OrderStatus | undefined {
  const normalized = status.trim().toLowerCase();
  if (
    ['ready_to_pick', 'picking', 'money_collect_picking'].includes(normalized)
  ) {
    return OrderStatus.PROCESSING;
  }
  if (
    [
      'picked',
      'storing',
      'transporting',
      'sorting',
      'delivering',
      'money_collect_delivering',
      'delivery_fail',
      'waiting_to_return',
      'return_transporting',
      'return_sorting',
      'returning',
    ].includes(normalized)
  ) {
    return OrderStatus.SHIPPING;
  }
  if (normalized === 'delivered') return OrderStatus.DELIVERED;
  if (['return', 'returned'].includes(normalized)) return OrderStatus.RETURNED;
  if (normalized === 'cancel') return OrderStatus.CANCELLED;
  return undefined;
}

@Injectable()
export class GhnShippingService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  async createShipment(orderId: string, dto: CreateGhnShipmentDto) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.trackingCode) return order;
    if (
      ![OrderStatus.CONFIRMED, OrderStatus.PROCESSING].includes(
        order.orderStatus,
      )
    ) {
      throw new BadRequestException('Chỉ tạo vận đơn cho đơn đã xác nhận');
    }

    const data = await this.call('/shiip/public-api/v2/shipping-order/create', {
      payment_type_id: 1,
      required_note: 'CHOXEMHANGKHONGTHU',
      client_order_code: order.orderCode,
      to_name: order.customerName || 'Khách hàng',
      to_phone: order.phone,
      to_address: order.shippingAddress,
      to_ward_code: dto.toWardCode,
      to_district_id: dto.toDistrictId,
      cod_amount:
        order.paymentMethod === PaymentMethod.COD ? Math.round(order.total) : 0,
      insurance_value: Math.min(Math.round(order.total), 5_000_000),
      weight: dto.weight,
      length: dto.length,
      width: dto.width,
      height: dto.height,
      service_type_id: 2,
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: Math.round(item.price),
        weight: Math.max(1, Math.round(dto.weight / order.items.length)),
      })),
    });
    if (!data.order_code) {
      throw new ServiceUnavailableException('GHN không trả về mã vận đơn');
    }
    order.shippingProvider = 'GHN';
    order.trackingCode = String(data.order_code);
    order.shippingStatus = String(data.status || 'ready_to_pick');
    order.shippingSyncedAt = new Date();
    await order.save();
    if (order.orderStatus === OrderStatus.CONFIRMED) {
      await this.ordersService.updateStatus(orderId, {
        orderStatus: OrderStatus.PROCESSING,
        note: `Đã tạo vận đơn GHN ${order.trackingCode}`,
      });
    }
    return this.orderModel.findById(orderId).exec();
  }

  async syncTracking(orderId: string) {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (!order.trackingCode)
      throw new BadRequestException('Đơn chưa có mã vận đơn');
    const data = await this.call('/shiip/public-api/v2/shipping-order/detail', {
      order_code: order.trackingCode,
    });
    const shippingStatus = String(data.status || 'unknown');
    await this.orderModel.updateOne(
      { _id: order._id },
      { $set: { shippingStatus, shippingSyncedAt: new Date() } },
    );
    await this.advanceOrder(order, mapGhnStatus(shippingStatus));
    return this.orderModel.findById(orderId).exec();
  }

  private async advanceOrder(order: OrderDocument, target?: OrderStatus) {
    if (!target || target === order.orderStatus) return;
    const path: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.PROCESSING]: [OrderStatus.PROCESSING],
      [OrderStatus.SHIPPING]: [OrderStatus.PROCESSING, OrderStatus.SHIPPING],
      [OrderStatus.DELIVERED]: [
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPING,
        OrderStatus.DELIVERED,
      ],
    };
    if (target === OrderStatus.CANCELLED) {
      if (
        [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PROCESSING,
        ].includes(order.orderStatus)
      ) {
        await this.ordersService.updateStatus(order._id.toString(), {
          orderStatus: target,
          note: `GHN cập nhật trạng thái ${order.shippingStatus}`,
        });
      }
      return;
    }
    if (target === OrderStatus.RETURNED) {
      if (
        [OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(
          order.orderStatus,
        )
      ) {
        await this.ordersService.updateStatus(order._id.toString(), {
          orderStatus: target,
          note: `GHN cập nhật trạng thái ${order.shippingStatus}`,
        });
      }
      return;
    }
    const ordered = path[target] || [];
    const rank = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPING,
      OrderStatus.DELIVERED,
    ];
    let current = order.orderStatus;
    for (const next of ordered) {
      if (rank.indexOf(next) <= rank.indexOf(current)) continue;
      await this.ordersService.updateStatus(order._id.toString(), {
        orderStatus: next,
        note: `Đồng bộ trạng thái vận chuyển GHN: ${order.shippingStatus}`,
      });
      current = next;
    }
  }

  private async call(path: string, body: object): Promise<Record<string, any>> {
    const base =
      this.configService.get<string>('GHN_API_URL') ||
      'https://dev-online-gateway.ghn.vn';
    const token = this.configService.get<string>('GHN_TOKEN');
    const shopId = this.configService.get<string>('GHN_SHOP_ID');
    if (!token || !shopId) {
      throw new ServiceUnavailableException(
        'Thiếu cấu hình GHN_TOKEN/GHN_SHOP_ID',
      );
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${base.replace(/\/$/, '')}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Token: token,
          ShopId: shopId,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const result = (await response.json()) as {
        code?: number;
        message?: string;
        data?: Record<string, any>;
      };
      if (!response.ok || result.code !== 200 || !result.data) {
        throw new ServiceUnavailableException(
          `GHN API lỗi: ${result.message || response.status}`,
        );
      }
      return result.data;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('Không thể kết nối GHN');
    } finally {
      clearTimeout(timer);
    }
  }
}
