import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../models/notification_model.dart';
import '../../providers/notification_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../core/widgets/empty_state_widget.dart';
import '../../core/widgets/error_retry_widget.dart';
import '../auth/login_screen.dart';
import '../order/order_detail_screen.dart';
import '../order/order_history_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
  bool _markingAll = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNotifications();
    });
  }

  Future<void> _loadNotifications() async {
    if (!mounted) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isAuthenticated) {
      await Provider.of<NotificationProvider>(context, listen: false)
          .fetchNotifications(auth.token);
    }
  }

  Future<void> _openLogin() async {
    await Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
    // LoginScreen pops back here after a successful sign-in.
    await _loadNotifications();
  }

  Future<void> _markAllAsRead(NotificationProvider notif, String? token) async {
    if (_markingAll) return;
    setState(() => _markingAll = true);
    final ok = await notif.markAllAsRead(token);
    if (!mounted) return;
    setState(() => _markingAll = false);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(ok
            ? 'Đã đánh dấu tất cả là đã đọc'
            : 'Không thể cập nhật thông báo. Vui lòng thử lại.'),
      ));
  }

  void _openNotification(NotificationModel item, NotificationProvider notif, String? token) {
    if (!item.isRead) {
      notif.markAsRead(item.id, token);
    }
    final orderId = item.orderId;
    if (orderId != null) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: orderId)),
      );
    } else if (item.type.toLowerCase() == 'order') {
      // Order notification without an id: fall back to the order list.
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const OrderHistoryScreen()),
      );
    }
  }

  /// Backend types: order, promotion, loyalty, tier, review, system.
  static IconData _iconFor(String type) {
    switch (type.toLowerCase()) {
      case 'order':
        return Icons.local_shipping_outlined;
      case 'promotion':
        return Icons.local_offer_outlined;
      case 'loyalty':
      case 'tier':
        return Icons.workspace_premium_outlined;
      case 'review':
        return Icons.rate_review_outlined;
      case 'stock':
      case 'inventory':
        return Icons.inventory_2_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  static StatusTone _toneFor(AppPalette p, String type) {
    switch (type.toLowerCase()) {
      case 'order':
        return p.statusConfirmed;
      case 'promotion':
        return StatusTone(background: p.primarySoft, foreground: p.primaryText);
      case 'loyalty':
      case 'tier':
        return p.statusPending;
      case 'review':
        return p.statusShipping;
      case 'stock':
      case 'inventory':
        return p.statusProcessing;
      default:
        return p.statusNeutral;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Thông báo')),
        body: EmptyStateWidget(
          icon: Icons.notifications_off_outlined,
          title: 'Chưa đăng nhập',
          message: 'Đăng nhập để nhận thông báo về đơn hàng và ưu đãi.',
          buttonText: 'Đăng nhập ngay',
          onButtonPressed: _openLogin,
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, notif, _) {
              if (!notif.hasUnread) return const SizedBox.shrink();
              return TextButton(
                onPressed: _markingAll ? null : () => _markAllAsRead(notif, auth.token),
                child: const Text('Đọc tất cả'),
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, notif, _) {
          if (notif.isLoading && notif.notifications.isEmpty) {
            return ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              itemCount: 6,
              itemBuilder: (context, index) => const NotificationItemSkeleton(),
            );
          }

          if (notif.errorMessage != null && notif.notifications.isEmpty) {
            return ErrorRetryWidget(
              message: notif.errorMessage!,
              onRetry: _loadNotifications,
            );
          }

          if (notif.notifications.isEmpty) {
            return RefreshIndicator(
              onRefresh: _loadNotifications,
              child: LayoutBuilder(
                builder: (context, constraints) => SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: constraints.maxHeight),
                    child: const EmptyStateWidget(
                      icon: Icons.notifications_none_rounded,
                      title: 'Không có thông báo mới',
                      message: 'Bạn sẽ nhận được thông báo khi đơn hàng được cập nhật hoặc có chương trình ưu đãi.',
                    ),
                  ),
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadNotifications,
            child: ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              itemCount: notif.notifications.length,
              separatorBuilder: (context, index) => const Divider(height: 1, indent: 72),
              itemBuilder: (context, index) => _NotificationTile(
                item: notif.notifications[index],
                icon: _iconFor(notif.notifications[index].type),
                tone: _toneFor(context.palette, notif.notifications[index].type),
                dateFormat: dateFormat,
                onTap: () => _openNotification(notif.notifications[index], notif, auth.token),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationModel item;
  final IconData icon;
  final StatusTone tone;
  final DateFormat dateFormat;
  final VoidCallback onTap;

  const _NotificationTile({
    required this.item,
    required this.icon,
    required this.tone,
    required this.dateFormat,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final text = Theme.of(context).textTheme;
    return Material(
      color: item.isRead ? Colors.transparent : palette.primarySoft.withValues(alpha: 0.5),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
        leading: CircleAvatar(
          backgroundColor: tone.background,
          child: Icon(icon, color: tone.foreground, size: 22),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                item.title,
                style: text.bodyLarge?.copyWith(
                  fontWeight: item.isRead ? FontWeight.w500 : FontWeight.w700,
                ),
              ),
            ),
            if (!item.isRead)
              Semantics(
                label: 'Chưa đọc',
                child: Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(left: AppSpacing.sm),
                  decoration: BoxDecoration(color: palette.primary, shape: BoxShape.circle),
                ),
              ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: AppSpacing.xs),
            Text(
              item.message,
              style: text.bodyMedium?.copyWith(
                color: item.isRead ? palette.textSecondary : palette.textPrimary,
              ),
            ),
            if (item.createdAt != null) ...[
              const SizedBox(height: AppSpacing.xs + 2),
              Text(dateFormat.format(item.createdAt!.toLocal()), style: text.labelSmall),
            ],
          ],
        ),
        onTap: onTap,
      ),
    );
  }
}
