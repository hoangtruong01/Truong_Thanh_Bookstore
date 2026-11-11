import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/formatters.dart';
import '../../providers/auth_provider.dart';
import '../auth/auth_validators.dart';

/// Sửa họ tên và số điện thoại (PUT /auth/profile). Email chỉ hiển thị.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _emailCtrl;

  @override
  void initState() {
    super.initState();
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    _nameCtrl = TextEditingController(text: user?.fullName ?? '');
    _phoneCtrl = TextEditingController(text: Formatters.normalizePhone(user?.phone));
    _emailCtrl = TextEditingController(text: user?.email ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    try {
      await auth.updateProfile(fullName: _nameCtrl.text, phone: _phoneCtrl.text);
      messenger.showSnackBar(const SnackBar(content: Text('Đã cập nhật thông tin tài khoản')));
      navigator.pop(true);
    } catch (e) {
      final message = e is ApiNetworkException
          ? 'Không có kết nối mạng. Vui lòng thử lại.'
          : e.toString().replaceFirst('Exception: ', '');
      messenger.showSnackBar(SnackBar(content: Text(message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final saving = context.select<AuthProvider, bool>((a) => a.isSavingProfile);
    final palette = context.palette;

    return Scaffold(
      appBar: AppBar(title: const Text('Hồ sơ cá nhân')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameCtrl,
                textCapitalization: TextCapitalization.words,
                textInputAction: TextInputAction.next,
                validator: AuthValidators.fullName,
                decoration: const InputDecoration(
                  labelText: 'Họ và tên',
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              TextFormField(
                controller: _emailCtrl,
                readOnly: true,
                enabled: false,
                decoration: const InputDecoration(
                  labelText: 'Địa chỉ email',
                  helperText: 'Email dùng để đăng nhập, không thể thay đổi',
                  prefixIcon: Icon(Icons.email_outlined),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              TextFormField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                maxLength: 10,
                validator: AuthValidators.optionalPhone,
                onFieldSubmitted: (_) => saving ? null : _save(),
                decoration: const InputDecoration(
                  labelText: 'Số điện thoại',
                  prefixIcon: Icon(Icons.phone_outlined),
                  counterText: '',
                ),
              ),
              const SizedBox(height: AppSpacing.xxl),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: saving ? null : _save,
                  child: saving
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: palette.onPrimary, strokeWidth: 2),
                        )
                      : const Text('Lưu thông tin'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
