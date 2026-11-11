import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../providers/auth_provider.dart';
import '../auth/auth_validators.dart';

/// Hộp thoại đổi mật khẩu (PUT /auth/change-password). Trả về true khi đổi
/// thành công — lúc đó mọi phiên đã bị Backend thu hồi và thiết bị đã đăng xuất.
class ChangePasswordDialog extends StatefulWidget {
  const ChangePasswordDialog({super.key});

  @override
  State<ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends State<ChangePasswordDialog> {
  final _formKey = GlobalKey<FormState>();
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_saving || !_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    final navigator = Navigator.of(context);
    try {
      await Provider.of<AuthProvider>(context, listen: false)
          .changePassword(_currentCtrl.text, _newCtrl.text);
      navigator.pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = e is ApiNetworkException
            ? 'Không có kết nối mạng. Vui lòng thử lại.'
            : e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return AlertDialog(
      title: const Text('Đổi mật khẩu'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _currentCtrl,
                obscureText: true,
                validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng nhập mật khẩu hiện tại' : null,
                decoration: const InputDecoration(labelText: 'Mật khẩu hiện tại'),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _newCtrl,
                obscureText: true,
                validator: AuthValidators.newPassword,
                decoration: const InputDecoration(
                  labelText: 'Mật khẩu mới',
                  helperText: AuthValidators.passwordHint,
                  helperMaxLines: 2,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _confirmCtrl,
                obscureText: true,
                validator: (v) => AuthValidators.confirmPassword(v, _newCtrl.text),
                decoration: const InputDecoration(labelText: 'Nhập lại mật khẩu mới'),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Sau khi đổi mật khẩu, mọi phiên đăng nhập (kể cả thiết bị này) sẽ bị đăng xuất.',
                style: textTheme.bodySmall,
              ),
              if (_error != null) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(_error!, style: textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.error)),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _saving ? null : () => Navigator.pop(context, false),
          child: const Text('Hủy'),
        ),
        ElevatedButton(
          onPressed: _saving ? null : _submit,
          child: _saving
              ? SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(color: palette.onPrimary, strokeWidth: 2),
                )
              : const Text('Lưu thay đổi'),
        ),
      ],
    );
  }
}
