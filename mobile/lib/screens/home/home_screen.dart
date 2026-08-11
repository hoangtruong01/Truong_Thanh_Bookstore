import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/product_grid_card.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../providers/product_provider.dart';
import '../../providers/cart_provider.dart';
import '../profile/wishlist_screen.dart';
import '../product/product_list_screen.dart';
import 'deal_hot_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final PageController _bannerController = PageController();
  int _currentBannerIndex = 0;
  Timer? _bannerTimer;

  final List<Map<String, String>> _banners = [
    {
      'tag': '✨ SIÊU ƯU ĐÃI MÙA TỰU TRƯỜNG',
      'title': 'KHỞI NGUỒN SỰ SÁNG TẠO',
      'subtitle': 'Giảm giá lên tới 40% toàn bộ dụng cụ học tập & bút viết chính hãng',
      'bgColor1': '0xFF0F172A',
      'bgColor2': '0xFF1E293B',
    },
    {
      'tag': '🔥 DEAL HOT VĂN PHÒNG PHẨM',
      'title': 'TRỌN BỘ COMBO TIẾT KIỆM',
      'subtitle': 'Miễn phí vận chuyển cho mọi đơn hàng từ 299.000đ toàn quốc',
      'bgColor1': '0xFFDC2626',
      'bgColor2': '0xFF991B1B',
    },
    {
      'tag': '🎁 VOUCHER ĐẶC BIỆT 50K',
      'title': 'NHẬP MÃ: TRUONGTHANH50',
      'subtitle': 'Áp dụng cho khách hàng mua sắm qua ứng dụng di động',
      'bgColor1': '0xFFFB5607',
      'bgColor2': '0xFFC2410C',
    },
  ];

  final List<Map<String, String>> _categoryIcons = [
    {'name': 'Bút viết', 'icon': '✒️', 'color': '0xFFEFF6FF'},
    {'name': 'Sổ & Vở', 'icon': '📓', 'color': '0xFFF0FDF4'},
    {'name': 'Dụng cụ vẽ', 'icon': '🎨', 'color': '0xFFFFF7ED'},
    {'name': 'Balo & Cặp', 'icon': '🎒', 'color': '0xFFFAF5FF'},
    {'name': 'Máy tính', 'icon': '🧮', 'color': '0xFFFEF2F2'},
    {'name': 'Băng dính', 'icon': '✂️', 'color': '0xFFECFDF5'},
    {'name': 'Hồ dán', 'icon': '🧴', 'color': '0xFFFDF4FF'},
    {'name': 'Giấy in', 'icon': '📄', 'color': '0xFFF1F5F9'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<ProductProvider>(context, listen: false);
      provider.fetchProducts();
      provider.fetchCategories();
      Provider.of<CartProvider>(context, listen: false).fetchActivePromotions();
    });

    _bannerTimer = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (_bannerController.hasClients) {
        _currentBannerIndex = (_currentBannerIndex + 1) % _banners.length;
        _bannerController.animateToPage(
          _currentBannerIndex,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _bannerController.dispose();
    super.dispose();
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
              width: 36,
              height: 36,
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
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_border_rounded, color: AppTheme.darkSlate),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const WishlistScreen()),
              );
            },
          ),
          const SizedBox(width: 4),
        ],
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
              // Search Bar Pill
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProductListScreen()),
                    );
                  },
                  child: Container(
                    height: 46,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 22),
                        SizedBox(width: 10),
                        Text(
                          'Tìm kiếm bút viết, sổ tập, máy tính...',
                          style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Hero Banner PageView Carousel
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Column(
                  children: [
                    SizedBox(
                      height: 145,
                      child: PageView.builder(
                        controller: _bannerController,
                        onPageChanged: (idx) {
                          setState(() {
                            _currentBannerIndex = idx;
                          });
                        },
                        itemCount: _banners.length,
                        itemBuilder: (context, index) {
                          final banner = _banners[index];
                          final c1 = Color(int.parse(banner['bgColor1']!));
                          final c2 = Color(int.parse(banner['bgColor2']!));

                          return Container(
                            margin: const EdgeInsets.only(right: 2),
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [c1, c2],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [
                                BoxShadow(
                                  color: c1.withOpacity(0.2),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Text(
                                    banner['tag']!,
                                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  banner['title']!,
                                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  banner['subtitle']!,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 8),
                    // Indicator Dots
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _banners.length,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: _currentBannerIndex == index ? 20 : 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: _currentBannerIndex == index ? AppTheme.primaryRed : const Color(0xFFCBD5E1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

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
                      _TrustItem(icon: '🚀', title: 'Giao Nhanh 2H'),
                      _TrustItem(icon: '🛡️', title: 'Đổi Trả 7 Ngày'),
                    ],
                  ),
                ),
              ),

              // Category Grid Icons (Visual categories)
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 20, 16, 12),
                child: Text(
                  'DANH MỤC NỔI BẬT',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.darkSlate),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 4,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.85,
                  ),
                  itemCount: _categoryIcons.length,
                  itemBuilder: (context, index) {
                    final item = _categoryIcons[index];
                    final bg = Color(int.parse(item['color']!));
                    return GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ProductListScreen()),
                        );
                      },
                      child: Column(
                        children: [
                          Container(
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: bg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Center(
                              child: Text(item['icon']!, style: const TextStyle(fontSize: 24)),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            item['name']!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.darkSlate),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Hot Deals Section
              if (productProvider.flashSaleProducts.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('🔥 DEAL HOT GIỜ VÀNG', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.primaryRed)),
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const DealHotScreen()),
                          );
                        },
                        child: const Text('Xem tất cả >', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.primaryRed)),
                      ),
                    ],
                  ),
                ),
                SizedBox(
                  height: 255,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: productProvider.flashSaleProducts.length,
                    itemBuilder: (context, index) {
                      final product = productProvider.flashSaleProducts[index];
                      return Container(
                        width: 160,
                        margin: const EdgeInsets.only(right: 12),
                        child: ProductGridCard(product: product),
                      );
                    },
                  ),
                ),
              ],

              // Product Catalog Section Header
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 24, 16, 12),
                child: Text(
                  'SẢN PHẨM MỚI NHẤT',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.darkSlate),
                ),
              ),

              if (productProvider.isLoading)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.64,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: 4,
                    itemBuilder: (_, __) => const ProductCardSkeleton(),
                  ),
                )
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
                      childAspectRatio: 0.64,
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
