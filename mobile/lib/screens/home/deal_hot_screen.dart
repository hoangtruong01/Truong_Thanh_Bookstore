import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/widgets/empty_state_widget.dart';
import '../../core/widgets/product_grid_card.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../providers/product_provider.dart';
import 'widgets/flash_sale_section.dart';
import 'widgets/home_navigation.dart';

/// Danh sách đầy đủ sản phẩm đang giảm giá (giá do server trả về).
class DealHotScreen extends StatelessWidget {
  const DealHotScreen({super.key});

  static const _gridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    childAspectRatio: 0.64,
    crossAxisSpacing: AppSpacing.md,
    mainAxisSpacing: AppSpacing.md,
  );

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);
    final deals = dealProducts(productProvider.flashSaleProducts);

    Widget body;
    if (productProvider.isLoading && deals.isEmpty) {
      body = GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: _gridDelegate,
        itemCount: 4,
        itemBuilder: (context, index) => const ProductCardSkeleton(),
      );
    } else if (deals.isEmpty) {
      body = EmptyStateWidget(
        icon: Icons.local_offer_outlined,
        title: 'Chưa có deal nào',
        message: 'Hiện chưa có sản phẩm nào đang giảm giá. Bạn quay lại sau nhé.',
        buttonText: 'Xem sản phẩm khác',
        onButtonPressed: () => openProductList(context),
      );
    } else {
      body = GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: _gridDelegate,
        itemCount: deals.length,
        itemBuilder: (context, index) => ProductGridCard(product: deals[index]),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Deal hot giờ vàng')),
      body: RefreshIndicator(
        onRefresh: () => productProvider.fetchProducts(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            children: [
              DealPanel(
                margin: const EdgeInsets.all(AppSpacing.lg),
                padding: const EdgeInsets.all(AppSpacing.xl),
                // Hạn flash sale chưa có trong ProductModel → không truyền endsAt
                // (đồng hồ bị ẩn thay vì đếm giả tới nửa đêm).
                child: DealHeader(maxPercent: maxDiscountPercent(deals)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
                child: body,
              ),
              const SizedBox(height: AppSpacing.xxl),
            ],
          ),
        ),
      ),
    );
  }
}
