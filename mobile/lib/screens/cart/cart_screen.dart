import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../providers/cart_provider.dart';
import '../checkout/checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final TextEditingController _couponController = TextEditingController();

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('GIỎ HÀNG CỦA BẠN'),
        actions: [
          if (cart.items.isNotEmpty)
            TextButton(
              onPressed: () => cart.clearCart(),
              child: const Text('Xóa tất cả', style: TextStyle(color: AppTheme.primaryRed, fontSize: 12)),
            ),
        ],
      ),
      body: cart.items.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.shopping_bag_outlined, size: 80, color: Color(0xFFCBD5E1)),
                  SizedBox(height: 16),
                  Text('Giỏ hàng của bạn đang trống', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  SizedBox(height: 8),
                  Text('Khám phá hàng ngàn sản phẩm tại Trường Thành!', style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Item list
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = cart.items[index];
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                width: 64,
                                height: 64,
                                color: const Color(0xFFF8FAFC),
                                child: item.product.images.isNotEmpty
                                    ? Image.network(item.product.images[0], fit: BoxFit.cover)
                                    : const Icon(Icons.menu_book_rounded, color: Colors.grey),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product.name,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    Formatters.formatCurrency(item.product.effectivePrice),
                                    style: const TextStyle(fontWeight: FontWeight.w900, color: AppTheme.primaryRed, fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.close, size: 18, color: Colors.grey),
                                  onPressed: () => cart.removeItem(item.product.id),
                                ),
                                Row(
                                  children: [
                                    GestureDetector(
                                      onTap: () => cart.updateQuantity(item.product.id, -1),
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Icon(Icons.remove, size: 14),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 8.0),
                                      child: Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                    ),
                                    GestureDetector(
                                      onTap: () => cart.updateQuantity(item.product.id, 1),
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: const Icon(Icons.add, size: 14),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 24),

                  // Voucher Box
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
                        const Text('MÃ GIẢM GIÁ (VOUCHER)', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                        const SizedBox(height: 10),
                        if (cart.appliedPromotion != null)
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0FDF4),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFBBF7D0)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Đã áp dụng: ${cart.appliedPromotion!.code}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF166534), fontSize: 12),
                                    ),
                                    Text(
                                      'Giảm ${Formatters.formatCurrency(cart.discountAmount)}',
                                      style: const TextStyle(color: Color(0xFF15803D), fontSize: 11),
                                    ),
                                  ],
                                ),
                                TextButton(
                                  onPressed: () => cart.removeCoupon(),
                                  child: const Text('Gỡ mã', style: TextStyle(color: AppTheme.primaryRed, fontSize: 11, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          )
                        else
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _couponController,
                                  textCapitalization: TextCapitalization.characters,
                                  decoration: const InputDecoration(
                                    hintText: 'Nhập mã voucher...',
                                    contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              ElevatedButton(
                                onPressed: () {
                                  if (_couponController.text.isNotEmpty) {
                                    final success = cart.applyCoupon(_couponController.text);
                                    if (success) {
                                      _couponController.clear();
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Áp dụng mã giảm giá thành công!')),
                                      );
                                    } else {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text(cart.promoError ?? 'Mã không hợp lệ')),
                                      );
                                    }
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.darkSlate,
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                ),
                                child: const Text('Áp dụng', style: TextStyle(fontSize: 12)),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Pricing Summary Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        _SummaryRow(label: 'Tạm tính', value: Formatters.formatCurrency(cart.subtotal)),
                        const SizedBox(height: 8),
                        _SummaryRow(
                          label: 'Phí vận chuyển',
                          value: cart.shippingFee == 0 ? 'Miễn phí' : Formatters.formatCurrency(cart.shippingFee),
                          subtitle: cart.shippingFee == 0 ? 'Đơn hàng từ 299K' : null,
                        ),
                        if (cart.discountAmount > 0) ...[
                          const SizedBox(height: 8),
                          _SummaryRow(
                            label: 'Giảm giá',
                            value: '-${Formatters.formatCurrency(cart.discountAmount)}',
                            isRed: true,
                          ),
                        ],
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Tổng thanh toán', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                            Text(
                              Formatters.formatCurrency(cart.total),
                              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppTheme.primaryRed),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Checkout Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const CheckoutScreen()),
                        );
                      },
                      child: const Text('TIẾN HÀNH THANH TOÁN', style: TextStyle(letterSpacing: 0.5)),
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final String? subtitle;
  final bool isRed;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.subtitle,
    this.isRed = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600)),
            if (subtitle != null)
              Text(subtitle!, style: const TextStyle(color: Color(0xFF166534), fontSize: 9, fontWeight: FontWeight.bold)),
          ],
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: isRed ? AppTheme.primaryRed : AppTheme.darkSlate,
          ),
        ),
      ],
    );
  }
}
