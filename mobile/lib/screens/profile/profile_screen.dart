import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  void _showChangePasswordDialog(BuildContext context) {
    final oldPassCtrl = TextEditingController();
    final newPassCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('ĐỔI MẬT KHẨU', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: oldPassCtrl,
                obscureText: true,
                validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng nhập mật khẩu hiện tại' : null,
                decoration: const InputDecoration(labelText: 'Mật khẩu hiện tại'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: newPassCtrl,
                obscureText: true,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Vui lòng nhập mật khẩu mới';
                  if (v.length < 6) return 'Mật khẩu mới phải ít nhất 6 ký tự';
                  return null;
                },
                decoration: const InputDecoration(labelText: 'Mật khẩu mới'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
          ElevatedButton(
            onPressed: () async {
              if (formKey.currentState!.validate()) {
                try {
                  await Provider.of<AuthProvider>(context, listen: false)
                      .changePassword(oldPassCtrl.text.trim(), newPassCtrl.text.trim());
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Đổi mật khẩu thành công!')),
                    );
                  }
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Lỗi: ${e.toString().replaceAll('Exception: ', '')}')),
                    );
                  }
                }
              }
            },
            child: const Text('Lưu thay đổi'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    if (!auth.isAuthenticated || auth.user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('TÀI KHOẢN')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.account_circle_outlined, size: 80, color: Color(0xFF94A3B8)),
                const SizedBox(height: 16),
                const Text('Chào mừng bạn đến với Trường Thành!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                const Text('Đăng nhập để xem thông tin cá nhân và tích điểm.', style: TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                  child: const Text('ĐĂNG NHẬP NGAY'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final user = auth.user!;

    return Scaffold(
      appBar: AppBar(
        title: const Text('THÔNG TIN TÀI KHOẢN'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // User Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: AppTheme.primaryRed,
                    child: Text(
                      user.fullName.isNotEmpty ? user.fullName[0].toUpperCase() : 'U',
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user.fullName, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text(user.email, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                        if (user.phone != null && user.phone!.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text('SĐT: ${user.phone}', style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Options List
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.key_outlined, color: AppTheme.darkSlate),
                    title: const Text('Đổi mật khẩu', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    trailing: const Icon(Icons.chevron_right, size: 20),
                    onTap: () => _showChangePasswordDialog(context),
                  ),
                  const Divider(height: 1, indent: 16, endIndent: 16),
                  ListTile(
                    leading: const Icon(Icons.support_agent_outlined, color: AppTheme.darkSlate),
                    title: const Text('Hỗ trợ khách hàng', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    subtitle: const Text('Hotline: 0901234567', style: TextStyle(fontSize: 11)),
                    trailing: const Icon(Icons.chevron_right, size: 20),
                    onTap: () {},
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => auth.logout(),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primaryRed,
                  side: const BorderSide(color: AppTheme.primaryRed),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('ĐĂNG XUẤT TÀI KHOẢN', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
