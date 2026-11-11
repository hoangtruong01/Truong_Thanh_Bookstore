import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';

/// Lý do chính — giống form trả hàng trên web (OrderDetail.vue).
const List<String> returnReasonCategories = [
  'Sản phẩm bị rách, ố vàng, lỗi in ấn do nhà sản xuất',
  'Giao sai tựa sách hoặc thiếu sản phẩm so với đơn',
  'Sản phẩm bị móp méo, hỏng hóc trong quá trình vận chuyển',
  'Khác',
];

/// Backend RequestReturnDto: `reason` bắt buộc, tối đa 500 ký tự.
const int returnReasonMaxLength = 500;
const int returnDetailMaxLength = 400;

/// Ghép lý do gửi Backend: `lý do chính: mô tả` (giống web), cắt ở 500 ký tự.
String buildReturnReason(String category, String detail) {
  final reason = '${category.trim()}: ${detail.trim()}';
  return reason.length > returnReasonMaxLength
      ? reason.substring(0, returnReasonMaxLength)
      : reason;
}

/// Mở form yêu cầu trả hàng. [onSubmit] ném lỗi (thông điệp từ Backend) khi
/// thất bại. Trả về true khi gửi thành công.
Future<bool> showReturnRequestSheet(
  BuildContext context, {
  required String orderCode,
  required Future<void> Function(String reason) onSubmit,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (_) => ReturnRequestSheet(orderCode: orderCode, onSubmit: onSubmit),
  );
  return result == true;
}

class ReturnRequestSheet extends StatefulWidget {
  final String orderCode;
  final Future<void> Function(String reason) onSubmit;

  const ReturnRequestSheet({super.key, required this.orderCode, required this.onSubmit});

  @override
  State<ReturnRequestSheet> createState() => _ReturnRequestSheetState();
}

class _ReturnRequestSheetState extends State<ReturnRequestSheet> {
  final _detailController = TextEditingController();
  String _category = returnReasonCategories.first;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _detailController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _detailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_submitting || _detailController.text.trim().isEmpty) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await widget.onSubmit(buildReturnReason(_category, _detailController.text));
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final text = Theme.of(context).textTheme;
    final canSubmit = !_submitting && _detailController.text.trim().isNotEmpty;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.xl, 0, AppSpacing.xl, AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Yêu cầu đổi/trả hàng', style: text.titleLarge),
            const SizedBox(height: AppSpacing.xs),
            Text('Đơn hàng #${widget.orderCode}', style: text.bodySmall),
            const SizedBox(height: AppSpacing.lg),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: palette.statusPending.background,
                borderRadius: AppRadii.button,
              ),
              child: Text(
                'Áp dụng đổi/trả trong vòng 7 ngày kể từ khi nhận hàng cho sản phẩm còn '
                'nguyên trạng hoặc bị lỗi in ấn, nhòe mực, rách từ nhà sản xuất/vận chuyển.',
                style: text.bodySmall?.copyWith(color: palette.statusPending.foreground),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Lý do chính', style: text.labelLarge),
            const SizedBox(height: AppSpacing.xs),
            RadioGroup<String>(
              groupValue: _category,
              onChanged: (value) {
                if (_submitting || value == null) return;
                setState(() => _category = value);
              },
              child: Column(
                children: [
                  for (final category in returnReasonCategories)
                    RadioListTile<String>(
                      value: category,
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      title: Text(category == 'Khác' ? 'Lý do khác' : category, style: text.bodyMedium),
                    ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              key: const ValueKey('return-detail-field'),
              controller: _detailController,
              enabled: !_submitting,
              maxLines: 3,
              maxLength: returnDetailMaxLength,
              textInputAction: TextInputAction.newline,
              decoration: const InputDecoration(
                labelText: 'Mô tả chi tiết tình trạng',
                hintText: 'VD: Sách tập 2 bị rách 3 trang ở giữa và nhòe mực',
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(_error!, style: text.bodySmall?.copyWith(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: AppSpacing.lg),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: canSubmit ? _submit : null,
                child: _submitting
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: palette.onPrimary),
                      )
                    : const Text('Gửi yêu cầu trả hàng'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
