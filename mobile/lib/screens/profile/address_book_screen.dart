import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/widgets/empty_state_widget.dart';
import '../../core/widgets/error_retry_widget.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../models/address_model.dart';
import '../../providers/address_book_provider.dart';
import '../../providers/auth_provider.dart';
import 'address_form_sheet.dart';

class AddressBookScreen extends StatelessWidget {
  const AddressBookScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (ctx) => AddressBookProvider(apiClient: Provider.of<ApiClient>(ctx, listen: false)),
      child: const _AddressBookView(),
    );
  }
}

class _AddressBookView extends StatefulWidget {
  const _AddressBookView();

  @override
  State<_AddressBookView> createState() => _AddressBookViewState();
}

class _AddressBookViewState extends State<_AddressBookView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _reload();
    });
  }

  String? get _token => Provider.of<AuthProvider>(context, listen: false).token;
  AddressBookProvider get _book => Provider.of<AddressBookProvider>(context, listen: false);

  Future<void> _reload() => _book.fetch(_token);

  void _toast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _openForm([AddressModel? address]) async {
    final book = _book;
    final token = _token;
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => AddressFormSheet(
        address: address,
        onSubmit: (input) => book.save(input, token, id: address?.id),
      ),
    );
    if (saved == true && mounted) {
      _toast(address == null ? 'Đã thêm địa chỉ' : 'Đã cập nhật địa chỉ');
    }
  }

  Future<void> _confirmDelete(AddressModel address) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Xóa địa chỉ'),
        content: const Text('Bạn có chắc chắn muốn xóa địa chỉ này?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Theme.of(ctx).colorScheme.error),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await _book.delete(address.id, _token);
      if (mounted) _toast('Đã xóa địa chỉ');
    } catch (e) {
      if (mounted) _toast(addressErrorText(e));
    }
  }

  Future<void> _setDefault(AddressModel address) async {
    try {
      await _book.setDefault(address.id, _token);
      if (mounted) _toast('Đã đặt làm địa chỉ mặc định');
    } catch (e) {
      if (mounted) _toast(addressErrorText(e));
    }
  }

  @override
  Widget build(BuildContext context) {
    final book = context.watch<AddressBookProvider>();

    Widget body;
    if (!book.hasLoaded && book.error == null) {
      body = ListView.builder(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: 3,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(bottom: AppSpacing.lg),
          child: ShimmerSkeleton(height: 132, borderRadius: AppRadii.lg),
        ),
      );
    } else if (!book.hasLoaded && book.error != null) {
      body = ErrorRetryWidget(message: book.error!, onRetry: _reload);
    } else if (book.addresses.isEmpty) {
      body = EmptyStateWidget(
        icon: Icons.location_off_outlined,
        title: 'Chưa có địa chỉ nào',
        message: 'Thêm địa chỉ giao hàng để đặt hàng nhanh hơn.',
        buttonText: 'Thêm địa chỉ mới',
        onButtonPressed: () => _openForm(),
      );
    } else {
      body = RefreshIndicator(
        onRefresh: _reload,
        child: ListView.builder(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, 96),
          itemCount: book.addresses.length,
          itemBuilder: (context, index) {
            final address = book.addresses[index];
            return _AddressCard(
              address: address,
              onEdit: () => _openForm(address),
              onDelete: () => _confirmDelete(address),
              onSetDefault: () => _setDefault(address),
            );
          },
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sổ địa chỉ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Thêm địa chỉ',
            onPressed: () => _openForm(),
          ),
        ],
      ),
      body: Column(
        children: [
          if (book.isLoading && book.hasLoaded) const LinearProgressIndicator(minHeight: 2),
          if (book.hasLoaded && book.error != null)
            MaterialBanner(
              content: Text(book.error!),
              actions: [TextButton(onPressed: _reload, child: const Text('Thử lại'))],
            ),
          Expanded(child: body),
        ],
      ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  final AddressModel address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onSetDefault;

  const _AddressCard({
    required this.address,
    required this.onEdit,
    required this.onDelete,
    required this.onSetDefault,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    Widget badge(String text, Color background, Color foreground) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: AppSpacing.xs),
          decoration: BoxDecoration(color: background, borderRadius: AppRadii.badge),
          child: Text(text, style: textTheme.labelSmall?.copyWith(color: foreground)),
        );

    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      shape: RoundedRectangleBorder(
        borderRadius: AppRadii.card,
        side: BorderSide(
          color: address.isDefault ? palette.primaryText.withValues(alpha: 0.5) : palette.border,
          width: address.isDefault ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Flexible(child: badge(address.label, palette.statusNeutral.background, palette.statusNeutral.foreground)),
                if (address.isDefault) ...[
                  const SizedBox(width: AppSpacing.sm),
                  badge('Mặc định', palette.primarySoft, palette.primaryText),
                ],
                const Spacer(),
                IconButton(
                  icon: Icon(Icons.edit_outlined, size: 20, color: palette.textSecondary),
                  tooltip: 'Sửa địa chỉ',
                  onPressed: onEdit,
                ),
                IconButton(
                  icon: Icon(Icons.delete_outline_rounded, size: 20, color: palette.danger),
                  tooltip: 'Xóa địa chỉ',
                  onPressed: onDelete,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text('${address.recipientName}  |  ${address.phone}', style: textTheme.titleSmall),
            const SizedBox(height: AppSpacing.xs),
            Text(address.fullAddress, style: textTheme.bodySmall),
            if (!address.isDefault) ...[
              const SizedBox(height: AppSpacing.sm),
              TextButton(
                onPressed: onSetDefault,
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(0, 36),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Đặt làm mặc định',
                  style: textTheme.labelMedium?.copyWith(color: palette.primaryText),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
