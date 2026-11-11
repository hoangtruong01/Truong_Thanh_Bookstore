import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/empty_state_widget.dart';
import '../../../core/widgets/error_retry_widget.dart';
import '../../../core/widgets/product_grid_card.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../../../models/product_model.dart';
import 'home_navigation.dart';
import 'home_section_header.dart';

/// Lưới "Sản phẩm mới nhất" (tối đa [maxItems]) kèm nút xem tất cả.
class NewProductsSection extends StatelessWidget {
  final List<ProductModel> products;
  final bool isLoading;
  final VoidCallback onRetry;
  final int maxItems;

  /// Load error from the provider: shown instead of the "empty store" state.
  final String? errorMessage;

  const NewProductsSection({
    super.key,
    required this.products,
    required this.isLoading,
    required this.onRetry,
    this.maxItems = 8,
    this.errorMessage,
  });

  static const _gridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    childAspectRatio: 0.64,
    crossAxisSpacing: AppSpacing.md,
    mainAxisSpacing: AppSpacing.md,
  );

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final visible = products.take(maxItems).toList();

    Widget body;
    if (isLoading && visible.isEmpty) {
      body = Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: _gridDelegate,
          itemCount: 4,
          itemBuilder: (context, index) => const ProductCardSkeleton(),
        ),
      );
    } else if (visible.isEmpty && errorMessage != null) {
      body = ErrorRetryWidget(message: errorMessage!, onRetry: onRetry);
    } else if (visible.isEmpty) {
      body = EmptyStateWidget(
        icon: Icons.inventory_2_outlined,
        title: 'Chưa có sản phẩm',
        message: 'Cửa hàng chưa có sản phẩm nào. Bạn quay lại sau nhé.',
        buttonText: 'Tải lại',
        onButtonPressed: onRetry,
      );
    } else {
      body = Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: _gridDelegate,
              itemCount: visible.length,
              itemBuilder: (context, index) => ProductGridCard(product: visible[index]),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          OutlinedButton(
            onPressed: () => openProductList(context),
            style: OutlinedButton.styleFrom(
              foregroundColor: palette.primaryText,
              side: BorderSide(color: palette.primaryText, width: 1.5),
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xxxl, vertical: AppSpacing.md),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Xem tất cả sản phẩm'),
                SizedBox(width: 6),
                Icon(Icons.arrow_forward_rounded, size: 16),
              ],
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        HomeSectionHeader(
          icon: Icons.local_fire_department_rounded,
          title: 'Sản phẩm mới nhất',
          onSeeAll: () => openProductList(context),
        ),
        body,
      ],
    );
  }
}
