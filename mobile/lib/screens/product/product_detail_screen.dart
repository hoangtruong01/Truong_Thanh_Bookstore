import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/product_grid_card.dart';
import '../../models/product_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/product_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../checkout/checkout_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;
  int _currentImageIndex = 0;
  final PageController _pageController = PageController();

  final List<Map<String, dynamic>> _mockReviews = [
    {
      'user': 'Trần Văn Hoàng',
      'rating': 5,
      'date': '10/08/2026',
      'comment': 'Sản phẩm giao nhanh, đóng gói rất cẩn thận. Viết rất êm tay!',
    },
    {
      'user': 'Nguyễn Thị Mai',
      'rating': 5,
      'date': '08/08/2026',
      'comment': 'Chất lượng chính hãng Thiên Long, ủng hộ Trường Thành Store dài dài.',
    },
    {
      'user': 'Lê Quốc Bảo',
      'rating': 4,
      'date': '05/08/2026',
      'comment': 'Hàng đẹp đúng như hình mô tả. Phí ship rẻ.',
    },
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _addToCart({bool navigateToCheckout = false}) {
    final cart = Provider.of<CartProvider>(context, listen: false);
    cart.addToCart(widget.product, quantity: _quantity);

    if (navigateToCheckout) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const CheckoutScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Đã thêm $_quantity x "${widget.product.name}" vào giỏ hàng!'),
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showAddReviewDialog() {
    int selectedStars = 5;
    final textController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Viết đánh giá sản phẩm', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
        content: StatefulBuilder(
          builder: (context, setDialogState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final starNum = index + 1;
                  return IconButton(
                    icon: Icon(
                      starNum <= selectedStars ? Icons.star_rounded : Icons.star_border_rounded,
                      color: const Color(0xFFFFB703),
                      size: 32,
                    ),
                    onPressed: () {
                      setDialogState(() {
                        selectedStars = starNum;
                      });
                    },
                  );
                }),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: textController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Chia sẻ cảm nhận của bạn về sản phẩm này...',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              if (textController.text.isNotEmpty) {
                setState(() {
                  _mockReviews.insert(0, {
                    'user': 'Tôi (Khách hàng)',
                    'rating': selectedStars,
                    'date': 'Hôm nay',
                    'comment': textController.text,
                  });
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã gửi đánh giá thành công! Cảm ơn bạn.')),
                );
              }
            },
            child: const Text('Gửi đánh giá'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final discount = Formatters.getDiscountPercent(product.price, product.discountPrice);
    final productProvider = Provider.of<ProductProvider>(context);
    final wishlistProvider = Provider.of<WishlistProvider>(context);
    final isFav = wishlistProvider.isFavorite(product.id);

    final relatedProducts = productProvider.products
        .where((p) => p.id != product.id)
        .take(6)
        .toList();

    final hasDesc = product.description != null && product.description!.isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          product.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: Icon(
              isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              color: isFav ? AppTheme.primaryRed : AppTheme.darkSlate,
            ),
            onPressed: () {
              wishlistProvider.toggleFavorite(product);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(isFav ? 'Đã xóa khỏi Yêu thích' : 'Đã thêm vào Yêu thích ❤️'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.share_outlined),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đã sao chép liên kết sản phẩm')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Image Carousel
            Container(
              height: 320,
              width: double.infinity,
              color: Colors.white,
              child: Stack(
                children: [
                  if (product.images.isNotEmpty)
                    PageView.builder(
                      controller: _pageController,
                      onPageChanged: (index) {
                        setState(() => _currentImageIndex = index);
                      },
                      itemCount: product.images.length,
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: InteractiveViewer(
                            panEnabled: true,
                            minScale: 1.0,
                            maxScale: 4.0,
                            child: Image.network(
                              product.images[index],
                              fit: BoxFit.contain,
                              errorBuilder: (_, __, ___) => const Icon(
                                Icons.menu_book_rounded,
                                size: 80,
                                color: Colors.grey,
                              ),
                            ),
                          ),
                        );
                      },
                    )
                  else
                    const Center(
                      child: Icon(
                        Icons.menu_book_rounded,
                        size: 80,
                        color: Colors.grey,
                      ),
                    ),

                  if (discount > 0)
                    Positioned(
                      top: 16,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.primaryRed.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Text(
                          '-$discount%',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),

                  if (product.images.length > 1)
                    Positioned(
                      bottom: 16,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          product.images.length,
                          (idx) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: _currentImageIndex == idx ? 16 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: _currentImageIndex == idx ? AppTheme.primaryRed : const Color(0xFFCBD5E1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // 2. Product Info
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.darkSlate),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, size: 18, color: Color(0xFFFFB703)),
                      const SizedBox(width: 4),
                      Text(
                        product.rating > 0 ? product.rating.toStringAsFixed(1) : '4.8',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '| Đã bán ${product.sold}',
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: product.stock > 0 ? const Color(0xFFF0FDF4) : const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          product.stock > 0 ? 'Còn hàng (${product.stock})' : 'Hết hàng',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: product.stock > 0 ? const Color(0xFF166534) : const Color(0xFF991B1B),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
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
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Trust Policy Badges
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: Colors.white,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: const [
                  _PolicyBadge(icon: Icons.verified_outlined, label: '100% Chính hãng'),
                  _PolicyBadge(icon: Icons.local_shipping_outlined, label: 'Freeship đơn 299K'),
                  _PolicyBadge(icon: Icons.replay_outlined, label: 'Đổi trả 7 ngày'),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Product Details / Specs
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('THÔNG TIN SẢN PHẨM & THÔNG SỐ', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                  const SizedBox(height: 12),
                  if (product.author != null && product.author!.isNotEmpty) ...[
                    _SpecRow(label: 'Tác giả', value: product.author!),
                    const Divider(height: 16),
                  ],
                  if (product.publisher != null && product.publisher!.isNotEmpty) ...[
                    _SpecRow(label: 'Nhà xuất bản', value: product.publisher!),
                    const Divider(height: 16),
                  ],
                  if (product.publicationYear != null) ...[
                    _SpecRow(label: 'Năm xuất bản', value: product.publicationYear.toString()),
                    const Divider(height: 16),
                  ],
                  if (product.isbn != null && product.isbn!.isNotEmpty) ...[
                    _SpecRow(label: 'Mã ISBN', value: product.isbn!),
                    const Divider(height: 16),
                  ],
                  _SpecRow(label: 'Thương hiệu', value: product.brand != null && product.brand!.isNotEmpty ? product.brand! : 'Trường Thành Official'),
                  const Divider(height: 16),
                  _SpecRow(label: 'Mã SKU', value: product.sku.isNotEmpty ? product.sku : 'TT-BOOKSTORE'),
                  const Divider(height: 16),
                  _SpecRow(label: 'Tình trạng', value: product.stock > 0 ? 'Còn hàng (${product.stock})' : 'Tạm hết hàng'),
                  const SizedBox(height: 16),
                  const Text('MÔ TẢ SẢN PHẨM', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                  const SizedBox(height: 8),
                  Text(
                    hasDesc
                        ? product.description!
                        : 'Sản phẩm ${product.name} chính hãng chất lượng cao, độ bền tốt, sử dụng mượt mà, phục vụ nhu cầu học tập và công việc hàng ngày.',
                    style: const TextStyle(color: Color(0xFF334155), height: 1.5, fontSize: 13),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Ratings & Reviews Section
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('ĐÁNH GIÁ TỪ KHÁCH HÀNG ⭐', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                      TextButton(
                        onPressed: _showAddReviewDialog,
                        child: const Text('+ Viết đánh giá', style: TextStyle(color: AppTheme.primaryRed, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _mockReviews.length,
                    separatorBuilder: (_, __) => const Divider(height: 20),
                    itemBuilder: (context, index) {
                      final rev = _mockReviews[index];
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(rev['user'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                              Text(rev['date'], style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: List.generate(
                              5,
                              (i) => Icon(
                                i < (rev['rating'] as int) ? Icons.star_rounded : Icons.star_border_rounded,
                                size: 14,
                                color: const Color(0xFFFFB703),
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(rev['comment'], style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // Related Products
            if (relatedProducts.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                color: Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('SẢN PHẨM TƯƠNG TỰ', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                    const SizedBox(height: 16),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.64,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: relatedProducts.length,
                      itemBuilder: (context, index) {
                        return ProductGridCard(product: relatedProducts[index]);
                      },
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 100),
          ],
        ),
      ),

      // Fixed Action Bottom Sheet
      bottomSheet: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
          border: const Border(top: BorderSide(color: Color(0xFFF1F5F9))),
        ),
        child: Row(
          children: [
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove, size: 16),
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 36),
                    padding: EdgeInsets.zero,
                    onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                  ),
                  Text(
                    '$_quantity',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add, size: 16),
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 36),
                    padding: EdgeInsets.zero,
                    onPressed: () => setState(() => _quantity++),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),

            Expanded(
              child: SizedBox(
                height: 46,
                child: ElevatedButton(
                  onPressed: product.stock > 0 ? () => _addToCart(navigateToCheckout: false) : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFEDD5),
                    foregroundColor: const Color(0xFFC2410C),
                    elevation: 0,
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text(
                    '+ THÊM GIỎ',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),

            Expanded(
              child: SizedBox(
                height: 46,
                child: ElevatedButton(
                  onPressed: product.stock > 0 ? () => _addToCart(navigateToCheckout: true) : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryRed,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text(
                    'MUA NGAY',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PolicyBadge extends StatelessWidget {
  final IconData icon;
  final String label;

  const _PolicyBadge({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.primaryRed),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppTheme.darkSlate,
          ),
        ),
      ],
    );
  }
}

class _SpecRow extends StatelessWidget {
  final String label;
  final String value;

  const _SpecRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 12.5,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            color: AppTheme.darkSlate,
            fontSize: 12.5,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
