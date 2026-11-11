import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_tokens.dart';
import '../utils/formatters.dart';
import '../../models/product_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../screens/product/product_detail_screen.dart';
import 'shimmer_loading.dart';

class ProductGridCard extends StatelessWidget {
  final ProductModel product;

  const ProductGridCard({super.key, required this.product});

  /// Số lượng sản phẩm [productId] đang có trong giỏ.
  static int quantityInCart(CartProvider cart, String productId) => cart.items
      .where((item) => item.product.id == productId)
      .fold<int>(0, (sum, item) => sum + item.quantity);

  void _quickAdd(BuildContext context) {
    final cart = Provider.of<CartProvider>(context, listen: false);
    final messenger = ScaffoldMessenger.of(context);
    final addable = product.addableQuantity(
      inCart: quantityInCart(cart, product.id),
      requested: 1,
    );
    messenger.hideCurrentSnackBar();
    if (addable <= 0) {
      messenger.showSnackBar(SnackBar(
        content: Text(product.isInStock
            ? 'Giỏ hàng đã có tối đa số lượng còn trong kho (${product.stock}).'
            : 'Sản phẩm đã hết hàng.'),
        duration: const Duration(seconds: 2),
      ));
      return;
    }
    cart.addToCart(product, quantity: addable);
    messenger.showSnackBar(SnackBar(
      content: Text('Đã thêm "${product.name}" vào giỏ hàng'),
      duration: const Duration(seconds: 1),
    ));
  }

  Future<void> _toggleFavorite(BuildContext context, WishlistProvider wishlist, bool isFav) async {
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    final messenger = ScaffoldMessenger.of(context);
    final ok = await wishlist.toggleFavorite(product, token);
    // Tap ignored while the previous request is in flight: not a failure.
    if (ok == null) return;
    messenger.showSnackBar(
      SnackBar(
        content: Text(!ok
            ? 'Không thể cập nhật Yêu thích, vui lòng thử lại'
            : isFav ? 'Đã xóa khỏi Yêu thích' : 'Đã thêm vào Yêu thích'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final scheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    final discount = Formatters.getDiscountPercent(product.price, product.discountPrice);
    final wishlistProvider = Provider.of<WishlistProvider>(context);
    final isFav = wishlistProvider.isFavorite(product.id);
    final inStock = product.isInStock;

    Widget imagePlaceholder() => Center(
          child: Icon(Icons.menu_book_rounded, size: 48, color: palette.textMuted),
        );

    return Material(
      color: palette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadii.card,
        side: BorderSide(color: palette.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ProductDetailScreen(product: product),
            ),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Stack
            Stack(
              children: [
                AspectRatio(
                  aspectRatio: 1.25,
                  child: Container(
                    width: double.infinity,
                    color: palette.surfaceMuted,
                    child: product.images.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: product.images.first,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => const ShimmerSkeleton(
                              width: double.infinity,
                              height: double.infinity,
                              borderRadius: 0,
                            ),
                            errorWidget: (context, url, error) => imagePlaceholder(),
                          )
                        : imagePlaceholder(),
                  ),
                ),

                // Out-of-stock veil
                if (!inStock)
                  Positioned.fill(
                    child: Container(
                      color: palette.surface.withValues(alpha: 0.55),
                      alignment: Alignment.center,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
                        decoration: BoxDecoration(
                          color: scheme.inverseSurface,
                          borderRadius: const BorderRadius.all(Radius.circular(AppRadii.pill)),
                        ),
                        child: Text(
                          'Hết hàng',
                          style: textTheme.labelMedium?.copyWith(
                            color: scheme.onInverseSurface,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  ),

                // Discount Badge (Top Left)
                if (discount > 0)
                  Positioned(
                    top: AppSpacing.sm,
                    left: AppSpacing.sm,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: palette.primary,
                        borderRadius: AppRadii.badge,
                      ),
                      child: Text(
                        '-$discount%',
                        style: textTheme.labelSmall?.copyWith(
                          color: palette.onPrimary,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),

                // Heart Button (Top Right): ~30px visual, 48x48 hit area (padded tap target).
                Positioned(
                  top: 0,
                  right: 0,
                  child: Semantics(
                    button: true,
                    label: isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích',
                    excludeSemantics: true,
                    child: IconButton(
                      key: ValueKey('wishlist-toggle-${product.id}'),
                      onPressed: () => _toggleFavorite(context, wishlistProvider, isFav),
                      iconSize: 16,
                      padding: const EdgeInsets.all(6),
                      constraints: const BoxConstraints(minWidth: 30, minHeight: 30),
                      style: IconButton.styleFrom(
                        tapTargetSize: MaterialTapTargetSize.padded,
                        backgroundColor: palette.surface.withValues(alpha: 0.9),
                        side: BorderSide(color: palette.border),
                        minimumSize: const Size(30, 30),
                      ),
                      icon: Icon(
                        isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        color: isFav ? palette.primaryText : palette.textSecondary,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Content Area
            Expanded(
              child: Padding(
                // Small bottom/right padding: the quick-add hit area (44x44) uses that space.
                padding: const EdgeInsets.fromLTRB(10, AppSpacing.sm, 5, AppSpacing.xxs),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ProductRatingSummary(product: product),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          product.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700, height: 1.25),
                        ),
                      ],
                    ),

                    // Price & Action Button Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (product.hasDiscount)
                                Text(
                                  Formatters.formatCurrency(product.price),
                                  maxLines: 1,
                                  style: textTheme.labelSmall?.copyWith(
                                    color: palette.textMuted,
                                    fontWeight: FontWeight.w500,
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                              Text(
                                Formatters.formatCurrency(product.effectivePrice),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: textTheme.titleSmall?.copyWith(
                                  color: palette.primaryText,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Quick Add Button (+)
                        Semantics(
                          button: true,
                          enabled: inStock,
                          label: inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng',
                          // Hết hàng: nút bị vô hiệu nhưng vẫn "nuốt" chạm để không mở trang chi tiết ngoài ý muốn.
                          child: GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: inStock ? null : () {},
                            // 44x44 hit area around a 34x34 visual button.
                            child: SizedBox(
                              width: 44,
                              height: 44,
                              child: InkWell(
                                onTap: inStock ? () => _quickAdd(context) : null,
                                customBorder: const RoundedRectangleBorder(borderRadius: AppRadii.button),
                                child: Center(
                                  child: Container(
                                    width: 34,
                                    height: 34,
                                    decoration: BoxDecoration(
                                      color: inStock ? palette.primary : palette.surfaceMuted,
                                      borderRadius: AppRadii.button,
                                      border: inStock ? null : Border.all(color: palette.border),
                                    ),
                                    child: Icon(
                                      inStock ? Icons.add_rounded : Icons.remove_shopping_cart_outlined,
                                      color: inStock ? palette.onPrimary : palette.textMuted,
                                      size: inStock ? 20 : 16,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Điểm đánh giá + đã bán. Không có đánh giá thật thì ghi "Chưa có đánh giá"
/// (giống ProductCard.vue trên web, không hiển thị điểm giả).
class ProductRatingSummary extends StatelessWidget {
  final ProductModel product;

  const ProductRatingSummary({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final style = Theme.of(context).textTheme.labelSmall;
    return Row(
      children: [
        if (product.hasRating) ...[
          Icon(Icons.star_rounded, size: 13, color: palette.star),
          const SizedBox(width: AppSpacing.xxs),
          Text(
            product.rating.toStringAsFixed(1),
            style: style?.copyWith(color: palette.textPrimary, fontWeight: FontWeight.w700),
          ),
        ] else
          Flexible(
            child: Text(
              'Chưa có đánh giá',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: style?.copyWith(color: palette.textMuted, fontWeight: FontWeight.w500),
            ),
          ),
        const SizedBox(width: AppSpacing.xs),
        Text(
          '· Đã bán ${product.sold}',
          maxLines: 1,
          style: style?.copyWith(fontWeight: FontWeight.w500),
        ),
      ],
    );
  }
}
