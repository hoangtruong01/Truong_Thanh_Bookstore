import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/order_provider.dart';

class OrderDetailScreen extends StatelessWidget {
  final OrderModel order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('ĐƠN HÀNG #${order.orderCode}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Status Header Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Mã đơn: #${order.orderCode}',
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, fontFamily: 'monospace'),
                      ),
                      Text(
                        order.orderStatus,
                        style: const TextStyle(color: AppTheme.primaryRed, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Ngày đặt: ${Formatters.formatDate(order.createdAt)}',
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 36,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        final url = '${ApiConstants.baseUrl}/orders/${order.id}/invoice';
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Hóa đơn PDF khả dụng tại: $url'),
                            action: SnackBarAction(
                              label: 'Đóng',
                              onPressed: () {},
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.picture_as_pdf, size: 16, color: AppTheme.primaryRed),
                      label: const Text('Tải hóa đơn PDF', style: TextStyle(fontSize: 11, color: AppTheme.primaryRed)),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.primaryRed),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Receiver Info Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('THÔNG TIN GIAO NHẬN', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                  const SizedBox(height: 10),
                  Text('Họ tên: ${order.customerName ?? 'N/A'}', style: const TextStyle(fontSize: 12)),
                  const SizedBox(height: 4),
                  Text('Số điện thoại: ${order.phone}', style: const TextStyle(fontSize: 12)),
                  const SizedBox(height: 4),
                  Text('Địa chỉ: ${order.shippingAddress}', style: const TextStyle(fontSize: 12)),
                  if (order.note != null && order.note!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text('Ghi chú: ${order.note}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Order Tracking Timeline Card
            if (order.timeline.isNotEmpty) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('HÀNH TRÌNH ĐƠN HÀNG', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                    const SizedBox(height: 16),
                    ...List.generate(order.timeline.length, (index) {
                      final reversedList = order.timeline.reversed.toList();
                      final time = reversedList[index];
                      final isLast = index == reversedList.length - 1;
                      final isFirst = index == 0;

                      return IntrinsicHeight(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Column(
                              children: [
                                Container(
                                  width: 12,
                                  height: 12,
                                  decoration: BoxDecoration(
                                    color: isFirst ? AppTheme.primaryRed : Colors.grey.shade300,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: isFirst ? AppTheme.primaryRed.withOpacity(0.2) : Colors.transparent,
                                      width: isFirst ? 4 : 0,
                                    ),
                                  ),
                                ),
                                if (!isLast)
                                  Expanded(
                                    child: Container(
                                      width: 2,
                                      color: Colors.grey.shade200,
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(bottom: 16.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      time.status == 'PENDING' ? 'Chờ xử lý' :
                                      time.status == 'CONFIRMED' ? 'Đã xác nhận' :
                                      time.status == 'SHIPPING' ? 'Đang giao' :
                                      time.status == 'COMPLETED' ? 'Hoàn thành' :
                                      time.status == 'CANCELLED' ? 'Đã hủy' : time.status,
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                        color: isFirst ? AppTheme.primaryRed : AppTheme.darkSlate,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      Formatters.formatDate(time.createdAt),
                                      style: TextStyle(color: Colors.grey.shade400, fontSize: 9.5),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      time.note,
                                      style: const TextStyle(color: Color(0xFF475569), fontSize: 11.5),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Order Items Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('DANH SÁCH SẢN PHẨM (${order.items.length})', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                  const SizedBox(height: 12),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: order.items.length,
                    separatorBuilder: (_, __) => const Divider(height: 16),
                    itemBuilder: (context, index) {
                      final item = order.items[index];
                      return Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              width: 48,
                              height: 48,
                              color: const Color(0xFFF8FAFC),
                              child: item.image != null && item.image!.isNotEmpty
                                  ? Image.network(item.image!, fit: BoxFit.cover)
                                  : const Icon(Icons.menu_book_rounded, size: 24, color: Colors.grey),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                Text(
                                  '${Formatters.formatCurrency(item.price)} x ${item.quantity}',
                                  style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            Formatters.formatCurrency(item.price * item.quantity),
                            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Cost Summary
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _DetailRow(label: 'Tạm tính', value: Formatters.formatCurrency(order.subtotal)),
                  const SizedBox(height: 6),
                  _DetailRow(label: 'Phí vận chuyển', value: order.shippingFee == 0 ? 'Miễn phí' : Formatters.formatCurrency(order.shippingFee)),
                  if (order.discount > 0) ...[
                    const SizedBox(height: 6),
                    _DetailRow(label: 'Giảm giá', value: '-${Formatters.formatCurrency(order.discount)}', isRed: true),
                  ],
                  const Divider(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('TỔNG CỘNG', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                      Text(
                        Formatters.formatCurrency(order.total),
                        style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.primaryRed),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Cancel Order Button (Only for PENDING status)
            if (order.orderStatus == 'PENDING')
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () async {
                    final auth = Provider.of<AuthProvider>(context, listen: false);
                    if (auth.token == null) return;

                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        title: const Text('Xác nhận hủy đơn hàng'),
                        content: const Text('Bạn có chắc chắn muốn hủy đơn hàng này không?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
                          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Đồng ý', style: TextStyle(color: Colors.red))),
                        ],
                      ),
                    );

                    if (confirm == true && context.mounted) {
                      final success = await Provider.of<OrderProvider>(context, listen: false)
                          .cancelOrder(order.id, auth.token!);
                      if (success && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Hủy đơn hàng thành công')),
                        );
                        Navigator.pop(context);
                      }
                    }
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primaryRed,
                    side: const BorderSide(color: AppTheme.primaryRed),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('HỦY ĐƠN HÀNG NÀY'),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isRed;

  const _DetailRow({required this.label, required this.value, this.isRed = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
        Text(
          value,
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: isRed ? AppTheme.primaryRed : AppTheme.darkSlate),
        ),
      ],
    );
  }
}
