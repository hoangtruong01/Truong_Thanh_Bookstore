import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_tokens.dart';
import '../../providers/auth_provider.dart';
import '../../providers/banner_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/notification_provider.dart';
import '../../providers/product_provider.dart';
import 'widgets/featured_categories_section.dart';
import 'widgets/flash_sale_section.dart';
import 'widgets/hero_banner_carousel.dart';
import 'widgets/home_app_bar.dart';
import 'widgets/home_search_pill.dart';
import 'widgets/home_trust_bar.dart';
import 'widgets/new_products_section.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final products = Provider.of<ProductProvider>(context, listen: false);
      products.fetchProducts();
      products.fetchCategories();
      Provider.of<BannerProvider>(context, listen: false).fetchActiveBanners();
      Provider.of<CartProvider>(context, listen: false).fetchActivePromotions();
    });
  }

  Future<void> _refresh() async {
    final products = Provider.of<ProductProvider>(context, listen: false);
    final banners = Provider.of<BannerProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final notifications = Provider.of<NotificationProvider>(context, listen: false);
    await Future.wait([
      products.fetchProducts(),
      products.fetchCategories(),
      banners.fetchActiveBanners(),
      if (auth.isAuthenticated) notifications.fetchUnreadCount(auth.token),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);
    final deals = dealProducts(productProvider.flashSaleProducts);

    return Scaffold(
      appBar: const HomeAppBar(),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const HomeSearchPill(),
              const HeroBannerCarousel(),
              const SizedBox(height: 18),
              const HomeTrustBar(),
              if (deals.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.xl),
                // Hạn flash sale: ProductModel chưa có `flashSaleExpiry` nên chưa
                // truyền `endsAt` → đồng hồ đếm ngược được ẩn.
                FlashSaleSection(products: deals),
              ],
              const SizedBox(height: 22),
              FeaturedCategoriesSection(
                categories: productProvider.categories,
                isLoading: productProvider.isLoading,
                onRetry: productProvider.fetchCategories,
              ),
              const SizedBox(height: 22),
              NewProductsSection(
                products: productProvider.products,
                isLoading: productProvider.isLoading,
                onRetry: () => productProvider.fetchProducts(),
              ),
              const SizedBox(height: 96),
            ],
          ),
        ),
      ),
    );
  }
}
