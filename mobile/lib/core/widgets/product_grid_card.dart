import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../../models/product_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../screens/product/product_detail_screen.dart';

import 'package:cached_network_image/cached_network_image.dart';
import 'shimmer_loading.dart';

class ProductGridCard extends StatelessWidget {
  final ProductModel product;

  const ProductGridCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final discount = Formatters.getDiscountPercent(product.price, product.discountPrice);
    final wishlistProvider = Provider.of<WishlistProvider>(context);
    final isFav = wishlistProvider.isFavorite(product.id);

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ProductDetailScreen(product: product),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Stack
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  child: AspectRatio(
                    aspectRatio: 1.25,
                    child: Container(
                      width: double.infinity,
                      color: const Color(0xFFF8FAFC),
                      child: product.images.isNotEmpty
                          ? CachedNetworkImage(
                              imageUrl: product.images[0],
                              fit: BoxFit.cover,
                              placeholder: (context, url) => const ShimmerSkeleton(
                                width: double.infinity,
                                height: double.infinity,
                                borderRadius: 0,
                              ),
                              errorWidget: (_, __, ___) => const Icon(Icons.menu_book_rounded, size: 48, color: Color(0xFFCBD5E1)),
                            )
                          : const Icon(Icons.menu_book_rounded, size: 48, color: Color(0xFFCBD5E1)),
                    ),
                  ),
                ),

                // Discount Badge (Top Left)
                if (discount > 0)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        gradient: AppTheme.primaryGradient,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '-$discount%',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),

                // Heart Button (Top Right)
                Positioned(
                  top: 6,
                  right: 6,
                  child: GestureDetector(
                    onTap: () {
                      wishlistProvider.toggleFavorite(product);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(isFav ? 'Đã xóa khỏi Yêu thích' : 'Đã thêm vào Yêu thích ❤️'),
                          duration: const Duration(seconds: 1),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Icon(
                        isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                        size: 16,
                        color: isFav ? AppTheme.primaryRed : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Content Area
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Rating & Sold Count
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, size: 13, color: Color(0xFFFFB703)),
                            const SizedBox(width: 2),
                            Text(
                              product.rating > 0 ? product.rating.toStringAsFixed(1) : '4.8',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.darkSlate),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '| Đã bán ${product.sold}',
                              style: const TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        // Product Name
                        Text(
                          product.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.darkSlate, height: 1.25),
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
                              if (product.discountPrice > 0) ...[
                                Text(
                                  Formatters.formatCurrency(product.price),
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: Color(0xFF94A3B8),
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                                Text(
                                  Formatters.formatCurrency(product.discountPrice),
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: AppTheme.primaryRed),
                                ),
                              ] else
                                Text(
                                  Formatters.formatCurrency(product.price),
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: AppTheme.primaryRed),
                                ),
                            ],
                          ),
                        ),

                        // Quick Add Button (+)
                        GestureDetector(
                          onTap: () {
                            Provider.of<CartProvider>(context, listen: false).addToCart(product);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Đã thêm "${product.name}" vào giỏ hàng!'),
                                duration: const Duration(seconds: 1),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          },
                          child: Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              gradient: AppTheme.primaryGradient,
                              borderRadius: BorderRadius.circular(10),
                              boxShadow: [
                                BoxShadow(
                                  color: AppTheme.primaryRed.withOpacity(0.3),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
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
