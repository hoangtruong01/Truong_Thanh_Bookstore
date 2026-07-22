import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/order_provider.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _noteController = TextEditingController();

  String _paymentMethod = 'COD';

  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isAuthenticated && auth.user != null) {
      _nameController.text = auth.user!.fullName;
      _phoneController.text = auth.user!.phone ?? '';
      _emailController.text = auth.user!.email;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _submitOrder() async {
    if (!_formKey.currentState!.validate()) return;

    final cart = Provider.of<CartProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final orderProv = Provider.of<OrderProvider>(context, listen: false);

    try {
      final createdOrder = await orderProv.placeOrder(
        items: cart.items,
        fullName: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        email: _emailController.text.trim(),
        address: _addressController.text.trim(),
        note: _noteController.text.trim(),
        paymentMethod: _paymentMethod,
        promotionCode: cart.appliedPromotion?.code,
        token: auth.token,
      );

      if (createdOrder != null && mounted) {
        cart.clearCart();
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Column(
              children: const [
                Icon(Icons.check_circle_rounded, color: Colors.green, size: 54),
                SizedBox(height: 12),
                Text('ĐẶT HÀNG THÀNH CÔNG!', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
              ],
            ),
            content: Text(
              'Mã đơn hàng của bạn là #${createdOrder.orderCode}. Cảm ơn bạn đã mua sắm tại Trường Thành Bookstore!',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                child: const Text('Về Trang Chủ', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryRed)),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: ${e.toString().replaceAll('Exception: ', '')}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = Provider.of<CartProvider>(context);
    final orderProv = Provider.of<OrderProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('THANH TOÁN ĐƠN HÀNG'),
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Shipping Form Box
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
                    const SizedBox(height: 14),

                    // FullName
                    TextFormField(
                      controller: _nameController,
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập họ và tên' : null,
                      decoration: const InputDecoration(
                        labelText: 'Họ và tên người nhận',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Phone
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Vui lòng nhập số điện thoại';
                        if (!Formatters.isValidPhone(v)) return 'Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0';
                        return null;
                      },
                      decoration: const InputDecoration(
                        labelText: 'Số điện thoại',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Email
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Vui lòng nhập email';
                        if (!v.contains('@')) return 'Email không hợp lệ';
                        return null;
                      },
                      decoration: const InputDecoration(
                        labelText: 'Địa chỉ Email',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Address
                    TextFormField(
                      controller: _addressController,
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập địa chỉ giao hàng' : null,
                      decoration: const InputDecoration(
                        labelText: 'Địa chỉ nhận hàng chi tiết',
                        prefixIcon: Icon(Icons.location_on_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Note
                    TextFormField(
                      controller: _noteController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Ghi chú đơn hàng (Tùy chọn)',
                        prefixIcon: Icon(Icons.note_alt_outlined),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Payment Method Box
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
                    const Text('PHƯƠNG THỨC THANH TOÁN', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                    const SizedBox(height: 8),

                    RadioListTile<String>(
                      value: 'COD',
                      groupValue: _paymentMethod,
                      activeColor: AppTheme.primaryRed,
                      title: const Text('Thanh toán khi nhận hàng (COD)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      subtitle: const Text('Thanh toán bằng tiền mặt khi shipper giao hàng', style: TextStyle(fontSize: 11)),
                      onChanged: (val) => setState(() => _paymentMethod = val!),
                    ),
                    RadioListTile<String>(
                      value: 'BANK_TRANSFER',
                      groupValue: _paymentMethod,
                      activeColor: AppTheme.primaryRed,
                      title: const Text('Chuyển khoản ngân hàng', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      subtitle: const Text('Chuyển khoản qua số tài khoản ngân hàng', style: TextStyle(fontSize: 11)),
                      onChanged: (val) => setState(() => _paymentMethod = val!),
                    ),
                    RadioListTile<String>(
                      value: 'EWALLET',
                      groupValue: _paymentMethod,
                      activeColor: AppTheme.primaryRed,
                      title: const Text('Ví điện tử (MoMo / ZaloPay)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      subtitle: const Text('Thanh toán quét mã QR ví điện tử', style: TextStyle(fontSize: 11)),
                      onChanged: (val) => setState(() => _paymentMethod = val!),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Final Total summary
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('TỔNG THANH TOÁN:', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                    Text(
                      Formatters.formatCurrency(cart.total),
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppTheme.primaryRed),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: orderProv.isLoading ? null : _submitOrder,
                  child: orderProv.isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text('XÁC NHẬN ĐẶT HÀNG NOW', style: TextStyle(letterSpacing: 0.5)),
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}
