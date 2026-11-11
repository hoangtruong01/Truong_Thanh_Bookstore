import 'package:flutter/material.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/formatters.dart';
import '../../models/address_model.dart';
import '../../providers/address_book_provider.dart';
import '../auth/auth_validators.dart';

/// Chuyển lỗi thành câu thông báo thân thiện cho người dùng.
String addressErrorText(Object error) {
  if (error is ApiNetworkException) return 'Không có kết nối mạng. Vui lòng thử lại.';
  return error.toString().replaceFirst('Exception: ', '');
}

/// Bottom sheet thêm / sửa địa chỉ. [onSubmit] gửi dữ liệu lên Backend và
/// ném lỗi nếu thất bại; sheet tự đóng khi lưu thành công.
class AddressFormSheet extends StatefulWidget {
  final AddressModel? address;
  final Future<void> Function(AddressInput input) onSubmit;

  const AddressFormSheet({super.key, this.address, required this.onSubmit});

  @override
  State<AddressFormSheet> createState() => _AddressFormSheetState();
}

class _AddressFormSheetState extends State<AddressFormSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _labelCtrl;
  late final TextEditingController _nameCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _provinceCtrl;
  late final TextEditingController _districtCtrl;
  late final TextEditingController _wardCtrl;
  late final TextEditingController _detailCtrl;
  late bool _isDefault;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final a = widget.address;
    _labelCtrl = TextEditingController(text: a?.label ?? '');
    _nameCtrl = TextEditingController(text: a?.recipientName ?? '');
    _phoneCtrl = TextEditingController(text: Formatters.normalizePhone(a?.phone));
    _provinceCtrl = TextEditingController(text: a?.province ?? '');
    _districtCtrl = TextEditingController(text: a?.district ?? '');
    _wardCtrl = TextEditingController(text: a?.ward ?? '');
    _detailCtrl = TextEditingController(text: a?.detail ?? '');
    _isDefault = a?.isDefault ?? false;
  }

  @override
  void dispose() {
    _labelCtrl.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _provinceCtrl.dispose();
    _districtCtrl.dispose();
    _wardCtrl.dispose();
    _detailCtrl.dispose();
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
      await widget.onSubmit(AddressInput(
        label: _labelCtrl.text,
        recipientName: _nameCtrl.text,
        phone: _phoneCtrl.text,
        province: _provinceCtrl.text,
        district: _districtCtrl.text,
        ward: _wardCtrl.text,
        detail: _detailCtrl.text,
        isDefault: _isDefault,
      ));
      if (mounted) navigator.pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = addressErrorText(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _field(
    TextEditingController controller,
    String label,
    String? Function(String?) validator, {
    TextInputType? keyboardType,
    int? maxLength,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLength: maxLength,
      textInputAction: TextInputAction.next,
      validator: validator,
      decoration: InputDecoration(labelText: label, counterText: ''),
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final isEdit = widget.address != null;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.xl,
        AppSpacing.xl,
        MediaQuery.of(context).viewInsets.bottom + AppSpacing.xl,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(isEdit ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới', style: textTheme.titleMedium),
              const SizedBox(height: AppSpacing.lg),
              _field(_nameCtrl, 'Tên người nhận',
                  (v) => AuthValidators.required(v, 'Vui lòng nhập tên người nhận')),
              const SizedBox(height: AppSpacing.md),
              _field(_phoneCtrl, 'Số điện thoại', AuthValidators.requiredPhone,
                  keyboardType: TextInputType.phone, maxLength: 10),
              const SizedBox(height: AppSpacing.md),
              _field(_labelCtrl, 'Nhãn địa chỉ (ví dụ: Nhà riêng)',
                  (v) => AuthValidators.required(v, 'Vui lòng nhập nhãn địa chỉ')),
              const SizedBox(height: AppSpacing.md),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _field(_provinceCtrl, 'Tỉnh/Thành phố',
                        (v) => AuthValidators.required(v, 'Bắt buộc')),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _field(_districtCtrl, 'Quận/Huyện',
                        (v) => AuthValidators.required(v, 'Bắt buộc')),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _field(_wardCtrl, 'Phường/Xã',
                        (v) => AuthValidators.required(v, 'Bắt buộc')),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: _field(_detailCtrl, 'Số nhà, tên đường',
                        (v) => AuthValidators.required(v, 'Bắt buộc')),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              CheckboxListTile(
                title: Text('Đặt làm mặc định', style: textTheme.bodyMedium),
                value: _isDefault,
                contentPadding: EdgeInsets.zero,
                activeColor: palette.primary,
                checkColor: palette.onPrimary,
                onChanged: _saving ? null : (val) => setState(() => _isDefault = val ?? false),
              ),
              if (_error != null) ...[
                Text(
                  _error!,
                  style: textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.error),
                ),
                const SizedBox(height: AppSpacing.sm),
              ],
              const SizedBox(height: AppSpacing.sm),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _saving ? null : _submit,
                  child: _saving
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: palette.onPrimary, strokeWidth: 2),
                        )
                      : const Text('Lưu địa chỉ'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
