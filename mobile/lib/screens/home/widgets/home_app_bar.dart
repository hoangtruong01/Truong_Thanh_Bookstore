import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/notification_provider.dart';
import '../../auth/login_screen.dart';
import '../../notification/notifications_screen.dart';
import '../../profile/wishlist_screen.dart';

/// Thanh trên cùng của trang chủ: logo, Yêu thích, chuông thông báo.
class HomeAppBar extends StatelessWidget implements PreferredSizeWidget {
  const HomeAppBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      titleSpacing: AppSpacing.lg,
      title: const _BrandMark(),
      actions: [
        IconButton(
          tooltip: 'Yêu thích',
          icon: const Icon(Icons.favorite_border_rounded, size: 22),
          onPressed: () {
            Navigator.push(context, MaterialPageRoute(builder: (_) => const WishlistScreen()));
          },
        ),
        const HomeNotificationBell(),
        const SizedBox(width: 6),
      ],
    );
  }
}

class _BrandMark extends StatelessWidget {
  const _BrandMark();

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return Row(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: palette.border, width: 1.5),
          ),
          child: ClipOval(
            child: Image.asset(
              'assets/logo.jpg',
              width: 38,
              height: 38,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => ColoredBox(
                color: palette.primary,
                child: Center(
                  child: Text(
                    'TT',
                    style: textTheme.labelLarge?.copyWith(
                      color: palette.onPrimary,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'TRƯỜNG THÀNH',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: textTheme.titleMedium?.copyWith(
                  color: palette.primaryText,
                  fontWeight: FontWeight.w900,
                  height: 1.1,
                ),
              ),
              Text(
                'STATIONERY',
                style: textTheme.labelSmall?.copyWith(
                  color: palette.textSecondary,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.5,
                  height: 1.1,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Nhãn số thông báo chưa đọc: ẩn khi 0, tối đa "99+".
String? unreadBadgeLabel(int count) {
  if (count <= 0) return null;
  return count > 99 ? '99+' : '$count';
}

/// Chuông thông báo: số chưa đọc thật từ [NotificationProvider] (chỉ khi đã
/// đăng nhập). Khách chạm → mời đăng nhập.
class HomeNotificationBell extends StatefulWidget {
  const HomeNotificationBell({super.key});

  @override
  State<HomeNotificationBell> createState() => _HomeNotificationBellState();
}

class _HomeNotificationBellState extends State<HomeNotificationBell> {
  String? _lastToken;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = Provider.of<AuthProvider>(context);
    final token = auth.isAuthenticated ? auth.token : null;
    if (_initialized && token == _lastToken) return;
    final hadSession = _lastToken != null;
    _initialized = true;
    _lastToken = token;
    // Đăng nhập → tải số chưa đọc; đăng xuất → reset về 0.
    if (token != null || hadSession) {
      final notifications = Provider.of<NotificationProvider>(context, listen: false);
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) notifications.fetchUnreadCount(token);
      });
    }
  }

  Future<void> _onTap() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (!auth.isAuthenticated) {
      await _promptLogin();
      return;
    }
    final notifications = Provider.of<NotificationProvider>(context, listen: false);
    await Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
    if (!mounted) return;
    // Có thể đã đánh dấu đã đọc trong màn thông báo.
    final current = Provider.of<AuthProvider>(context, listen: false);
    if (current.isAuthenticated) await notifications.fetchUnreadCount(current.token);
  }

  Future<void> _promptLogin() async {
    final goLogin = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Đăng nhập để xem thông báo'),
        content: const Text('Thông báo về đơn hàng và khuyến mãi được lưu theo tài khoản của bạn.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Để sau'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Đăng nhập'),
          ),
        ],
      ),
    );
    if (goLogin == true && mounted) {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final isAuthenticated = context.select<AuthProvider, bool>((a) => a.isAuthenticated);
    final unread = context.select<NotificationProvider, int>((n) => n.unreadCount);
    final label = isAuthenticated ? unreadBadgeLabel(unread) : null;

    return IconButton(
      tooltip: label == null ? 'Thông báo' : 'Thông báo, $label chưa đọc',
      onPressed: _onTap,
      icon: Badge(
        isLabelVisible: label != null,
        label: Text(label ?? ''),
        backgroundColor: palette.primary,
        textColor: palette.onPrimary,
        child: const Icon(Icons.notifications_none_rounded, size: 22),
      ),
    );
  }
}
