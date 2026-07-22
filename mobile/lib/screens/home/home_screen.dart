import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../models/product_model.dart';
import '../../providers/product_provider.dart';
import '../../providers/cart_provider.dart';
import '../product/product_detail_screen.dart';

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
      final provider = Provider.of<ProductProvider>(context, listen: false);
      provider.fetchProducts();
      provider.fetchCategories();
      Provider.of<CartProvider>(context, listen: false).fetchActivePromotions();
    });
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppTheme.primaryGradient,
              ),
              child: const Center(
                child: Text(
                  'TT',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: const [
                Text(
                  'TRƯỜNG THÀNH',
                  style: TextStyle(color: AppTheme.primaryRed, fontWeight: FontWeight.w900, fontSize: 16),
                ),
                Text(
                  'VĂN PHÒNG PHẨM & DỤNG CỤ HỌC TẬP',
                  style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold, fontSize: 8),
                ),
              ],
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await productProvider.fetchProducts();
          await productProvider.fetchCategories();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Banner Card
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFEDD5),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          '✨ SIÊU ƯU ĐÃI MÙA TỰU TRƯỜNG',
                          style: TextStyle(color: Color(0xFFC2410C), fontSize: 10, fontWeight: FontWeight.w900),
                        ),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'KHỞI NGUỒN SỰ SÁNG TẠO',
                        style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Dụng cụ học tập & Văn phòng phẩm Trường Thành chính hãng vượt trội.',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ),

              // Trust Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: const [
                      _TrustItem(icon: '✨', title: '100% Chính Hãng'),
                      _TrustItem(icon: '🚀', title: 'Giao Nhanh Toàn Quốc'),
                      _TrustItem(icon: '🛡️', title: 'Đổi Trả 7 Ngày'),
                    ],
                  ),
                ),
              ),

              // Categories Header & Scroll
              if (productProvider.categories.isNotEmpty) ...[
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                  child: Text(
                    'DANH MỤC SẢN PHẨM',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.darkSlate),
                  ),
                ),
                SizedBox(
                  height: 40,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: productProvider.categories.length + 1,
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        final isSelected = productProvider.selectedCategory == null;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: ChoiceChip(
                            label: const Text('Tất cả'),
                            selected: isSelected,
                            onSelected: (_) => productProvider.selectCategory(null),
                            selectedColor: AppTheme.primaryRed,
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.white : AppTheme.darkSlate,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        );
                      }
                      final cat = productProvider.categories[index - 1];
                      final isSelected = productProvider.selectedCategory == cat.id;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: ChoiceChip(
                          label: Text(cat.name),
                          selected: isSelected,
                          onSelected: (_) => productProvider.selectCategory(cat.id),
                          selectedColor: AppTheme.primaryRed,
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : AppTheme.darkSlate,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],

              // Product Catalog Section
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                child: Text(
                  'SẢN PHẨM MỚI NHẤT',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.darkSlate),
                ),
              ),

              if (productProvider.isLoading)
                const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator()))
              else if (productProvider.products.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.0),
                    child: Text('Chưa có sản phẩm nào.', style: TextStyle(color: Colors.grey)),
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.66,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: productProvider.products.length,
                    itemBuilder: (context, index) {
                      final product = productProvider.products[index];
                      return ProductGridCard(product: product);
                    },
                  ),
                ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _TrustItem extends StatelessWidget {
  final String icon;
  final String title;

  const _TrustItem({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(icon, style: const TextStyle(fontSize: 14)),
        const SizedBox(width: 4),
        Text(
          title,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.darkSlate),
        ),
      ],
    );
  }
}

class ProductGridCard extends StatelessWidget {
  final ProductModel product;

  const ProductGridCard({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final discount = Formatters.getDiscountPercent(product.price, product.discountPrice);

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
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image with Discount Badge
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  child: Container(
                    height: 140,
                    width: double.infinity,
                    color: const Color(0xFFF8FAFC),
                    child: product.images.isNotEmpty
                        ? Image.network(
                            product.images[0],
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(Icons.menu_book_rounded, size: 48, color: Colors.grey),
                          )
                        : const Icon(Icons.menu_book_rounded, size: 48, color: Colors.grey),
                  ),
                ),
                if (discount > 0)
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryRed,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '-$discount%',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
              ],
            ),

            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.darkSlate),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
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
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: () {
                              Provider.of<CartProvider>(context, listen: false).addToCart(product);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Đã thêm "${product.name}" vào giỏ hàng!'),
                                  duration: const Duration(seconds: 1),
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFFEDD5),
                              foregroundColor: const Color(0xFFC2410C),
                              padding: const EdgeInsets.symmetric(vertical: 6),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('+ Thêm', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
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
