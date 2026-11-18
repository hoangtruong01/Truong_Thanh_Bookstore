import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import 'store_contact.dart';

class StorePoliciesScreen extends StatelessWidget {
  const StorePoliciesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Thông tin & Chính sách'),
          bottom: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: palette.primaryText,
            unselectedLabelColor: palette.textSecondary,
            indicatorColor: palette.primary,
            labelStyle: textTheme.labelLarge,
            unselectedLabelStyle: textTheme.bodyLarge,
            tabs: const [
              Tab(text: 'Đổi trả & Giao hàng'),
              Tab(text: 'Thanh toán'),
              Tab(text: 'Bảo mật'),
              Tab(text: 'Giới thiệu'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _ShippingReturnTab(palette: palette, textTheme: textTheme),
            _PaymentTab(palette: palette, textTheme: textTheme),
            _PrivacyTab(palette: palette, textTheme: textTheme),
            _AboutTab(palette: palette, textTheme: textTheme),
          ],
        ),
      ),
    );
  }
}

class _PolicyCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color? iconColor;

  const _PolicyCard({
    required this.title,
    required this.description,
    required this.icon,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: const BorderRadius.all(Radius.circular(AppRadii.lg)),
        border: Border.all(color: palette.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.sm),
            decoration: BoxDecoration(
              color: (iconColor ?? palette.primary).withOpacity(0.1),
              borderRadius: const BorderRadius.all(Radius.circular(AppRadii.md)),
            ),
            child: Icon(icon, size: 20, color: iconColor ?? palette.primary),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: textTheme.titleSmall),
                const SizedBox(height: AppSpacing.xs),
                Text(description, style: textTheme.bodySmall?.copyWith(height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ShippingReturnTab extends StatelessWidget {
  final AppPalette palette;
  final TextTheme textTheme;

  const _ShippingReturnTab({required this.palette, required this.textTheme});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Text('Chính sách giao nhận hàng', style: textTheme.titleMedium),
        const SizedBox(height: AppSpacing.md),
        const _PolicyCard(
          icon: Icons.local_shipping_outlined,
          title: 'Phí giao hàng & Freeship',
          description:
              'Phí giao hàng toàn quốc chỉ 30.000đ. Đơn hàng từ 299.000đ trở lên được Miễn phí giao hàng hoàn toàn.',
        ),
        const _PolicyCard(
          icon: Icons.speed_outlined,
          title: 'Thời gian giao hàng toàn quốc',
          description:
              'Nội thành Hà Nội: 1 - 2 ngày làm việc.\nCác tỉnh thành khác: 2 - 4 ngày làm việc qua đối tác GHN / GHTK.',
        ),
        const SizedBox(height: AppSpacing.lg),
        Text('Chính sách đổi trả trong 7 ngày', style: textTheme.titleMedium),
        const SizedBox(height: AppSpacing.md),
        const _PolicyCard(
          icon: Icons.assignment_return_outlined,
          iconColor: Colors.amber,
          title: 'Điều kiện đổi trả sản phẩm',
          description:
              'Khách hàng được quyền gửi yêu cầu đổi/trả hàng trong vòng 7 ngày kể từ khi đơn hàng giao thành công nếu sách bị rách trang, lỗi in ấn, hoặc hàng bị hư hỏng trong quá trình vận chuyển.',
        ),
        const _PolicyCard(
          icon: Icons.verified_outlined,
          iconColor: Color(0xFF10B981),
          title: 'Quy trình hoàn tiền an toàn',
          description:
              'Khi cửa hàng nhận lại kiện hàng hoàn trả, tồn kho sẽ được tự động hoàn lại và tiền thanh toán sẽ được hoàn về cho khách theo đúng quy trình giao dịch.',
        ),
      ],
    );
  }
}

class _PaymentTab extends StatelessWidget {
  final AppPalette palette;
  final TextTheme textTheme;

  const _PaymentTab({required this.palette, required this.textTheme});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Text('Phương thức thanh toán hỗ trợ', style: textTheme.titleMedium),
        const SizedBox(height: AppSpacing.md),
        const _PolicyCard(
          icon: Icons.payments_outlined,
          title: 'Thanh toán khi nhận hàng (COD)',
          description:
              'Thanh toán tiền mặt trực tiếp cho nhân viên giao hàng khi nhận và kiểm tra gói hàng.',
        ),
        const _PolicyCard(
          icon: Icons.qr_code_scanner_outlined,
          title: 'Chuyển khoản VietQR & Ngân hàng',
          description:
              'Quét mã QR chuyển khoản nhanh 24/7 với nội dung chuyển khoản tự động gắn mã đơn hàng.',
        ),
        const _PolicyCard(
          icon: Icons.account_balance_wallet_outlined,
          title: 'Ví điện tử & Cổng trực tuyến',
          description:
              'Hỗ trợ thanh toán qua VNPay, MoMo bảo mật cao với mã hóa SSL/TLS chuẩn quốc tế.',
        ),
      ],
    );
  }
}

class _PrivacyTab extends StatelessWidget {
  final AppPalette palette;
  final TextTheme textTheme;

  const _PrivacyTab({required this.palette, required this.textTheme});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Text('Chính sách bảo mật thông tin', style: textTheme.titleMedium),
        const SizedBox(height: AppSpacing.md),
        const _PolicyCard(
          icon: Icons.security_outlined,
          title: 'Bảo mật thông tin cá nhân',
          description:
              'Trường Thành cam kết không chia sẻ hoặc bán thông tin cá nhân của quý khách cho bất kỳ bên thứ ba nào ngoại trừ đơn vị vận chuyển phục vụ giao nhận.',
        ),
        const _PolicyCard(
          icon: Icons.lock_outline,
          title: 'Mã hóa mật khẩu & Phiên đăng nhập',
          description:
              'Mật khẩu tài khoản được băm một chiều an toàn bằng bcrypt. Phiên đăng nhập di động được lưu trữ trong Secure Storage của thiết bị.',
        ),
      ],
    );
  }
}

class _AboutTab extends StatelessWidget {
  final AppPalette palette;
  final TextTheme textTheme;

  const _AboutTab({required this.palette, required this.textTheme});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Container(
          padding: const EdgeInsets.all(AppSpacing.xl),
          decoration: BoxDecoration(
            color: palette.surface,
            borderRadius: const BorderRadius.all(Radius.circular(AppRadii.xl)),
            border: Border.all(color: palette.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: palette.primary,
                      borderRadius: const BorderRadius.all(Radius.circular(AppRadii.lg)),
                    ),
                    child: const Center(
                      child: Text('TT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18)),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('NHÀ SÁCH TRƯỜNG THÀNH', style: textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
                        const SizedBox(height: AppSpacing.xxs),
                        Text('Dụng cụ học tập & Văn phòng phẩm chính hãng', style: textTheme.labelSmall),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: AppSpacing.xxl),
              Text(
                'Nhà sách & Văn phòng phẩm Trường Thành tự hào là địa chỉ cung cấp sách giáo khoa, sách tham khảo, truyện tranh thiếu nhi và thiết bị văn phòng phẩm uy tín hàng đầu. Chúng tôi luôn cam kết đem lại sản phẩm chất lượng tốt nhất cùng dịch vụ tận tâm.',
                style: textTheme.bodySmall?.copyWith(height: 1.6),
              ),
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Icon(Icons.phone_in_talk_outlined, size: 18, color: palette.primary),
                  const SizedBox(width: AppSpacing.sm),
                  Text('Hotline: ${StoreContact.hotlineDisplay}', style: textTheme.labelMedium),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Row(
                children: [
                  Icon(Icons.email_outlined, size: 18, color: palette.primary),
                  const SizedBox(width: AppSpacing.sm),
                  Text('Email: support@truongthanh.vn', style: textTheme.labelMedium),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.storefront_outlined, size: 18, color: palette.primary),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Text('Địa chỉ: Số 123 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội', style: textTheme.labelMedium),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
