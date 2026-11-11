import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../providers/auth_provider.dart';
import 'auth_validators.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmController = TextEditingController();

  int _step = 1;
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _handleRequestOtp() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      await Provider.of<AuthProvider>(context, listen: false)
          .forgotPassword(_emailController.text.trim());
      if (mounted) {
        _showMessage('Nếu email đã đăng ký, mã OTP sẽ được gửi tới hộp thư của bạn');
        setState(() => _step = 2);
      }
    } catch (e) {
      if (mounted) _showMessage(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final success = await Provider.of<AuthProvider>(context, listen: false).resetPassword(
        _emailController.text.trim(),
        _otpController.text.trim(),
        _newPasswordController.text,
      );

      if (success && mounted) {
        _showMessage('Đặt lại mật khẩu thành công. Hãy đăng nhập lại.');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) _showMessage(e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Widget _submitButton({required String label, required VoidCallback onPressed}) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: _isLoading ? null : onPressed,
        child: _isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(color: context.palette.onPrimary, strokeWidth: 2),
              )
            : Text(label),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quên mật khẩu'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: AppSpacing.xl),
              Center(
                child: Column(
                  children: [
                    Icon(Icons.lock_reset, size: 64, color: palette.primaryText),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      _step == 1 ? 'Nhập email để nhận mã OTP' : 'Xác thực OTP và đặt mật khẩu mới',
                      style: textTheme.titleMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      _step == 1
                          ? 'Chúng tôi sẽ gửi mã OTP gồm 6 chữ số qua email'
                          : 'Nhập mã OTP trong email và mật khẩu mới',
                      style: textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xxxl),

              if (_step == 1) ...[
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  validator: AuthValidators.email,
                  decoration: const InputDecoration(
                    labelText: 'Địa chỉ email',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                ),
                const SizedBox(height: AppSpacing.xxl),
                _submitButton(label: 'Gửi mã OTP', onPressed: _handleRequestOtp),
              ] else ...[
                TextFormField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  validator: AuthValidators.otp,
                  decoration: const InputDecoration(
                    labelText: 'Mã xác thực OTP',
                    prefixIcon: Icon(Icons.security),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                TextFormField(
                  controller: _newPasswordController,
                  obscureText: _obscurePassword,
                  validator: AuthValidators.newPassword,
                  decoration: InputDecoration(
                    labelText: 'Mật khẩu mới',
                    helperText: AuthValidators.passwordHint,
                    helperMaxLines: 2,
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility),
                      tooltip: _obscurePassword ? 'Hiện mật khẩu' : 'Ẩn mật khẩu',
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                TextFormField(
                  controller: _confirmController,
                  obscureText: _obscurePassword,
                  validator: (v) => AuthValidators.confirmPassword(v, _newPasswordController.text),
                  decoration: const InputDecoration(
                    labelText: 'Nhập lại mật khẩu mới',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                ),
                const SizedBox(height: AppSpacing.xxl),
                _submitButton(label: 'Đổi mật khẩu', onPressed: _handleResetPassword),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: OutlinedButton(
                    onPressed: _isLoading ? null : () => setState(() => _step = 1),
                    child: const Text('Quay lại'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
