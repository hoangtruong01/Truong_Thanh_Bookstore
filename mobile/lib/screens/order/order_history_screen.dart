import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../providers/order_provider.dart';
import 'order_detail_screen.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.isAuthenticated && auth.token != null) {
        Provider.of<OrderProvider>(context, listen: false).fetchMyOrders(auth.token!);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final orderProv = Provider.of<OrderProvider>(context);

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('ĐƠN HÀNG CỦA TÔI')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.lock_outline_rounded, size: 70, color: Color(0xFF94A3B8)),
                SizedBox(height: 16),
                Text('Đăng nhập để xem lịch sử đơn hàng', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                SizedBox(height: 8),
                Text('Quản lý đơn hàng, theo dõi giao nhận và mã giảm giá.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('ĐƠN HÀNG CỦA TÔI'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          if (auth.token != null) {
            await orderProv.fetchMyOrders(auth.token!);
          }
        },
        child: orderProv.isLoading
            ? const Center(child: CircularProgressIndicator())
            : orderProv.myOrders.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.receipt_long_outlined, size: 70, color: Color(0xFFCBD5E1)),
                        SizedBox(height: 16),
                        Text('Bạn chưa có đơn hàng nào', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: orderProv.myOrders.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final order = orderProv.myOrders[index];
                      return Container(
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
                                  '#${order.orderCode}',
                                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, fontFamily: 'monospace'),
                                ),
                                _StatusBadge(status: order.orderStatus),
                              ],
                            ),
                            const Divider(height: 20),
                            Text(
                              'Ngày đặt: ${Formatters.formatDate(order.createdAt)}',
                              style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Sản phẩm: ${order.items.length} món',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  Formatters.formatCurrency(order.total),
                                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppTheme.primaryRed),
                                ),
                                OutlinedButton(
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => OrderDetailScreen(order: order),
                                      ),
                                    );
                                  },
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  child: const Text('Xem chi tiết', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg = const Color(0xFFF1F5F9);
    Color fg = const Color(0xFF475569);
    String label = status;

    switch (status) {
      case 'PENDING':
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        label = 'Chờ xác nhận';
        break;
      case 'CONFIRMED':
        bg = const Color(0xFFDBEAFE);
        fg = const Color(0xFF1E40AF);
        label = 'Đã xác nhận';
        break;
      case 'SHIPPING':
        bg = const Color(0xFFF3E8FF);
        fg = const Color(0xFF6B21A8);
        label = 'Đang giao hàng';
        break;
      case 'COMPLETED':
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF166534);
        label = 'Hoàn thành';
        break;
      case 'CANCELLED':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        label = 'Đã hủy';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Text(label, style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }
}
