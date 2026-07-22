import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../models/product_model.dart';
import '../../providers/cart_provider.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final discount = Formatters.getDiscountPercent(product.price, product.discountPrice);

    return Scaffold(
      appBar: AppBar(
        title: Text(product.name),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Big Product Image Container
            Container(
              height: 300,
              width: double.infinity,
              color: Colors.white,
              child: Stack(
                children: [
                  Center(
                    child: product.images.isNotEmpty
                        ? Image.network(
                            product.images[0],
                            fit: BoxFit.contain,
                            errorBuilder: (_, __, ___) => const Icon(Icons.menu_book_rounded, size: 80, color: Colors.grey),
                          )
                        : const Icon(Icons.menu_book_rounded, size: 80, color: Colors.grey),
                  ),
                  if (discount > 0)
                    Positioned(
                      top: 16,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryRed,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '-$discount%',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Info Card
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.darkSlate),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      if (product.discountPrice > 0) ...[
                        Text(
                          Formatters.formatCurrency(product.discountPrice),
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.primaryRed),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          Formatters.formatCurrency(product.price),
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF94A3B8),
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ] else
                        Text(
                          Formatters.formatCurrency(product.price),
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppTheme.primaryRed),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, color: Colors.amber, size: 18),
                      const SizedBox(width: 4),
                      Text(
                        '${product.rating.toStringAsFixed(1)} ',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      Text(
                        '• Đã bán ${product.sold}',
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: product.stock > 0 ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          product.stock > 0 ? 'Còn hàng (${product.stock})' : 'Hết hàng',
                          style: TextStyle(
                            color: product.stock > 0 ? const Color(0xFF166534) : const Color(0xFF991B1B),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Description Box
            if (product.description != null && product.description!.isNotEmpty)
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(20),
                width: double.infinity,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'MÔ TẢ SẢN PHẨM',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.darkSlate),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      product.description!,
                      style: const TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.5),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 100),
          ],
        ),
      ),

      // Bottom Bar with Add to Cart / Quantity Modifier
      bottomSheet: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        ),
        child: Row(
          children: [
            // Quantity buttons
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove, size: 16),
                    onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                  ),
                  Text('$_quantity', style: const TextStyle(fontWeight: FontWeight.bold)),
                  IconButton(
                    icon: const Icon(Icons.add, size: 16),
                    onPressed: () => setState(() => _quantity++),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // Add button
            Expanded(
              child: ElevatedButton(
                onPressed: product.stock > 0
                    ? () {
                        Provider.of<CartProvider>(context, listen: false)
                            .addToCart(product, quantity: _quantity);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Đã thêm $_quantity x "${product.name}" vào giỏ hàng!'),
                            duration: const Duration(seconds: 2),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    : null,
                child: const Text('THÊM VÀO GIỎ HÀNG'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
