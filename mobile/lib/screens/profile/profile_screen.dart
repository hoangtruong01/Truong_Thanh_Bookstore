import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import '../auth/login_screen.dart';
import '../notification/notifications_screen.dart';
import 'address_book_screen.dart';
import 'change_password_dialog.dart';
import 'edit_profile_screen.dart';
import 'store_contact.dart';
import 'theme_mode_selector.dart';
import 'wishlist_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String? _syncedUserId;
  bool _profileSyncFailed = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Đồng bộ hồ sơ (điểm, hạng) một lần cho mỗi tài khoản đăng nhập.
    final auth = Provider.of<AuthProvider>(context);
    final userId = auth.isAuthenticated ? auth.user?.id : null;
    if (userId != null && userId != _syncedUserId) {
      _syncedUserId = userId;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _refreshProfile();
      });
    } else if (userId == null) {
      _syncedUserId = null;
      _profileSyncFailed = false;
    }
  }

  Future<void> _refreshProfile() async {
    final ok = await Provider.of<AuthProvider>(context, listen: false).refreshProfile();
    if (mounted) setState(() => _profileSyncFailed = !ok);
  }

  void _toast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  void _push(Widget screen) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
  }

  Future<void> _changePassword() async {
    final changed = await showDialog<bool>(
      context: context,
      builder: (_) => const ChangePasswordDialog(),
    );
    if (changed == true && mounted) {
      _toast('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
    }
  }

  Future<void> _callHotline() async {
    final opened = await StoreContact.callHotline();
    if (opened || !mounted) return;
    await Clipboard.setData(const ClipboardData(text: StoreContact.hotline));
    if (mounted) _toast('Không mở được trình gọi điện. Đã sao chép số hotline.');
  }

  Future<void> _confirmLogout(AuthProvider auth) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Đăng xuất')),
        ],
      ),
    );
    if (ok == true) await auth.logout();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user;

    if (!auth.isAuthenticated || user == null) {
      return _GuestView(onLogin: () => _push(const LoginScreen()), onCallHotline: _callHotline);
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Thông tin tài khoản')),
      body: RefreshIndicator(
        onRefresh: _refreshProfile,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, 96),
          children: [
            _ProfileHeader(user: user, onEdit: () => _push(const EditProfileScreen())),
            if (user.isCustomer) ...[
              const SizedBox(height: AppSpacing.lg),
              _LoyaltyCard(
                user: user,
                isLoading: auth.isRefreshingProfile,
                syncFailed: _profileSyncFailed && !auth.isRefreshingProfile,
                onRetry: _refreshProfile,
              ),
            ],
            const SizedBox(height: AppSpacing.xl),
            _SectionCard(
              children: [
                _MenuTile(
                  icon: Icons.notifications_none_rounded,
                  title: 'Thông báo',
                  trailingBadge: context.select<NotificationProvider, int>((n) => n.unreadCount),
                  onTap: () => _push(const NotificationsScreen()),
                ),
                _MenuTile(
                  icon: Icons.favorite_outline_rounded,
                  title: 'Sản phẩm yêu thích',
                  onTap: () => _push(const WishlistScreen()),
                ),
                _MenuTile(
                  icon: Icons.location_on_outlined,
                  title: 'Sổ địa chỉ',
                  onTap: () => _push(const AddressBookScreen()),
                ),
                _MenuTile(
                  icon: Icons.key_outlined,
                  title: 'Đổi mật khẩu',
                  onTap: _changePassword,
                ),
                _MenuTile(
                  icon: Icons.support_agent_outlined,
                  title: 'Hỗ trợ khách hàng',
                  subtitle: 'Hotline: ${StoreContact.hotlineDisplay}',
                  trailingIcon: Icons.call_outlined,
                  onTap: _callHotline,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            const _SectionCard(children: [ThemeModeSelector()]),
            const SizedBox(height: AppSpacing.xxl),
            OutlinedButton(
              onPressed: () => _confirmLogout(auth),
              style: OutlinedButton.styleFrom(
                foregroundColor: context.palette.primaryText,
                side: BorderSide(color: context.palette.primaryText),
              ),
              child: const Text('Đăng xuất'),
            ),
          ],
        ),
      ),
    );
  }
}

class _GuestView extends StatelessWidget {
  final VoidCallback onLogin;
  final VoidCallback onCallHotline;

  const _GuestView({required this.onLogin, required this.onCallHotline});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Tài khoản')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xxl, AppSpacing.lg, 96),
        children: [
          Icon(Icons.account_circle_outlined, size: 80, color: palette.textMuted),
          const SizedBox(height: AppSpacing.lg),
          Text(
            'Chào mừng bạn đến với Trường Thành',
            style: textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Đăng nhập để quản lý tài khoản và xem điểm tích lũy từ các đơn hàng hoàn tất.',
            style: textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.xxl),
          Center(
            child: ElevatedButton(onPressed: onLogin, child: const Text('Đăng nhập ngay')),
          ),
          const SizedBox(height: AppSpacing.xxxl),
          _SectionCard(
            children: [
              _MenuTile(
                icon: Icons.support_agent_outlined,
                title: 'Hỗ trợ khách hàng',
                subtitle: 'Hotline: ${StoreContact.hotlineDisplay}',
                trailingIcon: Icons.call_outlined,
                onTap: onCallHotline,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          const _SectionCard(children: [ThemeModeSelector()]),
        ],
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final UserModel user;
  final VoidCallback onEdit;

  const _ProfileHeader({required this.user, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final avatar = user.avatar ?? '';
    final hasAvatar = avatar.startsWith('http');
    final initial = user.fullName.trim().isNotEmpty ? user.fullName.trim()[0].toUpperCase() : 'U';

    return _SectionCard(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 30,
              backgroundColor: palette.primary,
              foregroundImage: hasAvatar ? CachedNetworkImageProvider(avatar) : null,
              child: Text(
                initial,
                style: textTheme.headlineSmall?.copyWith(color: palette.onPrimary),
              ),
            ),
            const SizedBox(width: AppSpacing.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(user.fullName, style: textTheme.titleMedium),
                  const SizedBox(height: AppSpacing.xs),
                  Text(user.email, style: textTheme.bodySmall),
                  if (user.phone != null && user.phone!.isNotEmpty) ...[
                    const SizedBox(height: AppSpacing.xxs),
                    Text('SĐT: ${user.phone}', style: textTheme.bodySmall),
                  ],
                ],
              ),
            ),
            IconButton(
              icon: Icon(Icons.edit_outlined, color: palette.textSecondary),
              tooltip: 'Sửa thông tin',
              onPressed: onEdit,
            ),
          ],
        ),
      ],
    );
  }
}

class _LoyaltyCard extends StatelessWidget {
  final UserModel user;
  final bool isLoading;
  final bool syncFailed;
  final VoidCallback onRetry;

  const _LoyaltyCard({
    required this.user,
    required this.isLoading,
    required this.syncFailed,
    required this.onRetry,
  });

  StatusTone _tierTone(AppPalette palette) {
    switch (user.loyaltyTier) {
      case 'DIAMOND':
        return palette.statusConfirmed;
      case 'GOLD':
        return palette.statusPending;
      case 'SILVER':
        return palette.statusNeutral;
      default:
        return palette.statusProcessing;
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final tone = _tierTone(palette);
    final points = NumberFormat.decimalPattern('vi_VN').format(user.loyaltyPoints);

    return _SectionCard(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Row(
          children: [
            Text('Hạng thành viên', style: textTheme.bodySmall),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: AppSpacing.xs),
              decoration: BoxDecoration(
                color: tone.background,
                borderRadius: const BorderRadius.all(Radius.circular(AppRadii.pill)),
              ),
              child: Text(
                user.loyaltyTierLabel,
                style: textTheme.labelMedium?.copyWith(color: tone.foreground, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('Điểm tích lũy', style: textTheme.bodyMedium),
            const Spacer(),
            if (isLoading)
              const ShimmerSkeleton(width: 72, height: 22)
            else
              Text.rich(
                TextSpan(
                  text: points,
                  style: textTheme.headlineSmall?.copyWith(color: palette.accent),
                  children: [TextSpan(text: ' điểm', style: textTheme.labelSmall)],
                ),
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Text('Điểm được cộng khi đơn hàng hoàn tất.', style: textTheme.labelSmall),
        if (syncFailed) ...[
          const SizedBox(height: AppSpacing.sm),
          Row(
            children: [
              Icon(Icons.cloud_off_outlined, size: 16, color: palette.textSecondary),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text('Chưa cập nhật được số điểm mới nhất', style: textTheme.labelSmall),
              ),
              TextButton(onPressed: onRetry, child: const Text('Thử lại')),
            ],
          ),
        ],
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  final EdgeInsetsGeometry padding;

  const _SectionCard({required this.children, this.padding = EdgeInsets.zero});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final items = <Widget>[];
    for (var i = 0; i < children.length; i++) {
      if (i > 0 && children[i] is _MenuTile) {
        items.add(Divider(height: 1, indent: AppSpacing.lg, endIndent: AppSpacing.lg, color: palette.border));
      }
      items.add(children[i]);
    }
    return Material(
      color: palette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadii.card,
        side: BorderSide(color: palette.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: padding,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: items),
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final IconData trailingIcon;
  final int trailingBadge;
  final VoidCallback onTap;

  const _MenuTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.subtitle,
    this.trailingIcon = Icons.chevron_right,
    this.trailingBadge = 0,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return ListTile(
      leading: Icon(icon, color: palette.textPrimary),
      title: Text(title, style: textTheme.titleSmall),
      subtitle: subtitle == null ? null : Text(subtitle!, style: textTheme.bodySmall),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (trailingBadge > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: AppSpacing.xxs),
              decoration: BoxDecoration(
                color: palette.primary,
                borderRadius: const BorderRadius.all(Radius.circular(AppRadii.pill)),
              ),
              child: Text(
                trailingBadge > 99 ? '99+' : '$trailingBadge',
                style: textTheme.labelSmall?.copyWith(color: palette.onPrimary),
              ),
            ),
          const SizedBox(width: AppSpacing.xs),
          Icon(trailingIcon, size: 20, color: palette.textMuted),
        ],
      ),
      onTap: onTap,
    );
  }
}
