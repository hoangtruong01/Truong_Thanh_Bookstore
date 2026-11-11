import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/formatters.dart';
import '../../models/product_model.dart';
import '../../providers/wishlist_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/widgets/empty_state_widget.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../main_navigation_screen.dart';
import '../product/product_detail_screen.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.isAuthenticated) {
        Provider.of<WishlistProvider>(context, listen: false).syncWithServer(auth.token);
      }
    });
  }

  /// Về màn chính và mở tab Sản phẩm; nếu không có màn chính thì chỉ quay lại.
  void _exploreProducts() {
    final navigator = Navigator.of(context);
    if (MainNavigationScreen.switchToTab(MainNavigationScreen.productsTab)) {
      navigator.popUntil((route) => route.isFirst);
    } else {
      navigator.maybePop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Danh sách yêu thích'),
      ),
      body: Consumer<WishlistProvider>(
        builder: (context, wishlist, child) {
          if (wishlist.wishlistItems.isEmpty) {
            if (wishlist.isLoading) {
              return ListView.builder(
                padding: const EdgeInsets.all(AppSpacing.lg),
                itemCount: 4,
                itemBuilder: (_, __) => const Padding(
                  padding: EdgeInsets.only(bottom: AppSpacing.md),
                  child: ShimmerSkeleton(height: 104, borderRadius: AppRadii.md),
                ),
              );
            }
            return EmptyStateWidget(
              icon: Icons.favorite_border_rounded,
              title: 'Chưa có sản phẩm yêu thích',
              message: 'Thả tim những cuốn sách và dụng cụ học tập bạn thích để dễ dàng tìm lại sau.',
              buttonText: 'Khám phá ngay',
              onButtonPressed: _exploreProducts,
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              final auth = Provider.of<AuthProvider>(context, listen: false);
              await wishlist.syncWithServer(auth.token);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.lg),
              itemCount: wishlist.wishlistItems.length,
              separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.md),
              itemBuilder: (context, index) => _WishlistTile(
                product: wishlist.wishlistItems[index],
                wishlist: wishlist,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _WishlistTile extends StatelessWidget {
  final ProductModel product;
  final WishlistProvider wishlist;

  const _WishlistTile({required this.product, required this.wishlist});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return Dismissible(
      key: Key(product.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: AppSpacing.xl),
        decoration: BoxDecoration(
          color: palette.primary,
          borderRadius: BorderRadius.circular(AppRadii.md),
        ),
        child: Icon(Icons.delete_outline, color: palette.onPrimary, size: 28),
      ),
      onDismissed: (_) {
        final auth = Provider.of<AuthProvider>(context, listen: false);
        wishlist.toggleFavorite(product, auth.token);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Đã xóa "${product.name}" khỏi danh sách yêu thích'),
            duration: const Duration(seconds: 2),
          ),
        );
      },
      child: Material(
        color: palette.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          side: BorderSide(color: palette.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product)),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadii.sm),
                  child: CachedNetworkImage(
                    imageUrl: product.images.isNotEmpty ? product.images.first : '',
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const ShimmerSkeleton(width: 80, height: 80),
                    errorWidget: (context, url, error) => Container(
                      width: 80,
                      height: 80,
                      color: palette.surfaceMuted,
                      child: Icon(Icons.menu_book_outlined, color: palette.textMuted),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        crossAxisAlignment: WrapCrossAlignment.center,
                        spacing: AppSpacing.sm,
                        children: [
                          Text(
                            Formatters.formatCurrency(product.displayPrice),
                            style: textTheme.titleSmall?.copyWith(color: palette.primaryText),
                          ),
                          if (product.hasDiscount)
                            Text(
                              Formatters.formatCurrency(product.price),
                              style: textTheme.bodySmall?.copyWith(
                                decoration: TextDecoration.lineThrough,
                                color: palette.textMuted,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  children: [
                    IconButton(
                      icon: Icon(Icons.shopping_cart_outlined, color: palette.primaryText),
                      tooltip: 'Chuyển vào giỏ',
                      onPressed: () async {
                        final cart = Provider.of<CartProvider>(context, listen: false);
                        final auth = Provider.of<AuthProvider>(context, listen: false);
                        final messenger = ScaffoldMessenger.of(context);
                        cart.addToCart(product);
                        await wishlist.moveToCart(product.id, auth.token);
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text('Đã thêm "${product.name}" vào giỏ hàng'),
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                    ),
                    IconButton(
                      icon: Icon(Icons.favorite, color: palette.primaryText),
                      tooltip: 'Bỏ thích',
                      onPressed: () {
                        final auth = Provider.of<AuthProvider>(context, listen: false);
                        wishlist.toggleFavorite(product, auth.token);
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
