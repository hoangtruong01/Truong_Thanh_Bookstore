import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/notification_provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/shimmer_loading.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_retry_widget.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNotifications();
    });
  }

  Future<void> _loadNotifications() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isAuthenticated) {
      await Provider.of<NotificationProvider>(context, listen: false)
          .fetchNotifications(auth.token);
    }
  }

  IconData _getNotificationIcon(String type) {
    switch (type.toUpperCase()) {
      case 'ORDER':
        return Icons.local_shipping_outlined;
      case 'PROMOTION':
        return Icons.local_offer_outlined;
      case 'INVENTORY':
        return Icons.inventory_2_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _getNotificationColor(String type) {
    switch (type.toUpperCase()) {
      case 'ORDER':
        return Colors.blue;
      case 'PROMOTION':
        return AppTheme.primaryColor;
      case 'INVENTORY':
        return Colors.amber.shade800;
      default:
        return Colors.grey.shade700;
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Thông báo'),
          backgroundColor: Colors.white,
          foregroundColor: AppTheme.textPrimary,
          elevation: 0.5,
        ),
        body: EmptyStateWidget(
          icon: Icons.notifications_off_outlined,
          title: 'Chưa đăng nhập',
          message: 'Vui lòng đăng nhập tài khoản để nhận thông báo đơn hàng và ưu đãi!',
          buttonText: 'Đăng nhập ngay',
          onButtonPressed: () => Navigator.pop(context),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
        backgroundColor: Colors.white,
        foregroundColor: AppTheme.textPrimary,
        elevation: 0.5,
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, notif, _) {
              if (notif.unreadCount > 0) {
                return TextButton(
                  onPressed: () async {
                    await notif.markAllAsRead(auth.token);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Đã đánh dấu tất cả là đã đọc')),
                      );
                    }
                  },
                  child: const Text('Đọc tất cả'),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, notif, _) {
          if (notif.isLoading && notif.notifications.isEmpty) {
            return ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 12),
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
            return EmptyStateWidget(
              icon: Icons.notifications_none_rounded,
              title: 'Không có thông báo mới',
              message: 'Bạn sẽ nhận được thông báo khi có cập nhật về đơn hàng hoặc các chương trình khuyến mãi hấp dẫn.',
            );
          }

          return RefreshIndicator(
            onRefresh: _loadNotifications,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: notif.notifications.length,
              separatorBuilder: (context, index) => const Divider(height: 1, indent: 70),
              itemBuilder: (context, index) {
                final item = notif.notifications[index];
                final icon = _getNotificationIcon(item.type);
                final color = _getNotificationColor(item.type);

                return Container(
                  color: item.isRead ? Colors.transparent : AppTheme.primaryColor.withOpacity(0.04),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    leading: CircleAvatar(
                      backgroundColor: color.withOpacity(0.12),
                      child: Icon(icon, color: color, size: 22),
                    ),
                    title: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            item.title,
                            style: TextStyle(
                              fontWeight: item.isRead ? FontWeight.w500 : FontWeight.bold,
                              fontSize: 14,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                        ),
                        if (!item.isRead)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppTheme.primaryColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text(
                          item.message,
                          style: TextStyle(
                            fontSize: 13,
                            color: item.isRead ? AppTheme.textSecondary : AppTheme.textPrimary,
                            height: 1.3,
                          ),
                        ),
                        if (item.createdAt != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            dateFormat.format(item.createdAt!),
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ],
                    ),
                    onTap: () {
                      if (!item.isRead) {
                        notif.markAsRead(item.id, auth.token);
                      }
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
