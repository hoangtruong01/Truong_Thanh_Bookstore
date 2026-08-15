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

  // Countdown timer state for Deal Hot
  Timer? _countdownTimer;
  String _hoursStr = "00";
  String _minutesStr = "00";
  String _secondsStr = "00";

  final List<Map<String, String>> _banners = [
    {
      'tag': '✨ SIÊU ƯU ĐÃI MÙA TỰU TRƯỜNG',
      'title': 'KHỞI NGUỒN SỰ SÁNG TẠO',
      'subtitle': 'Giảm giá lên tới 40% dụng cụ học tập chính hãng',
      'cta': 'MUA NGAY →',
      'image': 'assets/hero_stationery.png',
      'bgColor1': '0xFF0F172A',
      'bgColor2': '0xFF1E293B',
    },
    {
      'tag': '🔥 DEAL HOT VĂN PHÒNG PHẨM',
      'title': 'TRỌN BỘ COMBO TIẾT KIỆM',
      'subtitle': 'Miễn phí vận chuyển cho đơn từ 299.000đ toàn quốc',
      'cta': 'KHÁM PHÁ →',
      'image': 'assets/combo-bg.png',
      'bgColor1': '0xFFDC2626',
      'bgColor2': '0xFF991B1B',
    },
    {
      'tag': '🎁 VOUCHER ĐẶC BIỆT 50K',
      'title': 'MÃ: TRUONGTHANH50',
      'subtitle': 'Áp dụng cho mọi khách hàng mua sắm qua App',
      'cta': 'LẤY MÃ NGAY →',
      'image': 'assets/hero.png',
      'bgColor1': '0xFFFB5607',
      'bgColor2': '0xFFC2410C',
    },
  ];

  // Featured Categories list matching Web
  final List<Map<String, dynamic>> _featuredCategories = [
    {
      'name': 'Sách giáo khoa',
      'desc': 'Đầy đủ cấp 1, 2, 3',
      'image': 'assets/sgk-bg.jpg',
      'slug': 'sach-giao-khoa',
      'borderColor': const Color(0xFFFFEDD5),
      'badgeColor': const Color(0xFFEA580C),
    },
    {
      'name': 'Sách tham khảo',
      'desc': 'Ôn luyện thi nâng cao',
      'image': 'assets/sach-tham-khao-bg.png',
      'slug': 'sach-tham-khao',
      'borderColor': const Color(0xFFFCE7F3),
      'badgeColor': const Color(0xFFDB2777),
    },
    {
      'name': 'Truyện tranh',
      'desc': 'Manga, anime nổi bật',
      'image': 'assets/truyen-tranh-bg.png',
      'slug': 'truyen-tranh',
      'borderColor': const Color(0xFFFFE4E6),
      'badgeColor': const Color(0xFFE11D48),
    },
    {
      'name': 'Văn phòng phẩm',
      'desc': 'Bút, sổ tay, file hồ sơ',
      'image': 'assets/do-luu-niem-bg.jpg',
      'slug': 'van-phong-pham',
      'borderColor': const Color(0xFFDBEAFE),
      'badgeColor': const Color(0xFF2563EB),
    },
    {
      'name': 'Đồ chơi',
      'desc': 'Lego, Rubik trí tuệ',
      'image': 'assets/do-choi-bg.png',
      'slug': 'do-choi',
      'borderColor': const Color(0xFFE0E7FF),
      'badgeColor': const Color(0xFF4F46E5),
    },
    {
      'name': 'Đồ lưu niệm',
      'desc': 'Quà tặng, phụ kiện',
      'image': 'assets/do-luu-niem-bg.jpg',
      'slug': 'do-luu-niem',
      'borderColor': const Color(0xFFF3E8FF),
      'badgeColor': const Color(0xFF9333EA),
    },
    {
      'name': 'Combo ưu đãi',
      'desc': 'Trọn bộ học tập giá sốc',
      'image': 'assets/combo-bg.png',
      'slug': 'combo',
      'borderColor': const Color(0xFFCCFBF1),
      'badgeColor': const Color(0xFF0D9488),
    },
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

    _startCountdownTimer();
  }

  void _startCountdownTimer() {
    _updateTimer();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        _updateTimer();
      }
    });
  }

  void _updateTimer() {
    final now = DateTime.now();
    final midnight = DateTime(now.year, now.month, now.day, 24, 0, 0);
    final diff = midnight.difference(now);
    if (diff.isNegative) return;

    setState(() {
      _hoursStr = diff.inHours.toString().padLeft(2, '0');
      _minutesStr = (diff.inMinutes % 60).toString().padLeft(2, '0');
      _secondsStr = (diff.inSeconds % 60).toString().padLeft(2, '0');
    });
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    _countdownTimer?.cancel();
    _bannerController.dispose();
    super.dispose();
  }

  void _navigateToCategory(ProductProvider provider, String slug, String fallbackName) {
    String? matchedCatId;
    final cat = provider.categories.firstWhere(
      (c) => c.slug == slug || c.name.toLowerCase().contains(fallbackName.toLowerCase()),
      orElse: () => provider.categories.firstWhere(
        (c) => c.name.isNotEmpty,
        orElse: () => provider.categories.first,
      ),
    );
    if (cat.id.isNotEmpty) {
      matchedCatId = cat.id;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProductListScreen(initialCategoryId: matchedCatId),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            // Brand Logo
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(19),
                child: Image.asset(
                  'assets/logo.jpg',
                  width: 38,
                  height: 38,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: AppTheme.primaryRed,
                      child: const Center(
                        child: Text(
                          'TT',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
                        ),
                      ),
                    );
                  },
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
                  style: TextStyle(
                    color: AppTheme.primaryRed,
                    fontWeight: FontWeight.w900,
                    fontSize: 16.5,
                    letterSpacing: -0.3,
                  ),
                ),
                Text(
                  'STATIONERY',
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w800,
                    fontSize: 9,
                    letterSpacing: 1.5,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          // Wishlist Icon
          IconButton(
            icon: const Icon(Icons.favorite_border_rounded, color: AppTheme.darkSlate, size: 22),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const WishlistScreen()),
              );
            },
          ),
          // Notification Bell Icon with Badge
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none_rounded, color: AppTheme.darkSlate, size: 22),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Không có thông báo mới nào.'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
              ),
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppTheme.primaryRed,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 6),
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
              // 1. Search Bar Pill with Filter Badge
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProductListScreen()),
                    );
                  },
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.search_rounded, color: AppTheme.primaryRed, size: 22),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Tìm kiếm bút viết, sổ tập, máy tính...',
                            style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.w500),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Icon(Icons.tune_rounded, color: Color(0xFF64748B), size: 18),
                      ],
                    ),
                  ),
                ),
              ),

              // 2. Premium Hero Banner Carousel with Product Illustrations & CTAs
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Column(
                  children: [
                    SizedBox(
                      height: 165,
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
                          final imgPath = banner['image']!;

                          return GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const ProductListScreen()),
                              );
                            },
                            child: Container(
                              margin: const EdgeInsets.only(right: 2),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [c1, c2],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: c1.withOpacity(0.25),
                                    blurRadius: 12,
                                    offset: const Offset(0, 5),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(24),
                                child: Stack(
                                  children: [
                                    // Background Image Accent (Right side)
                                    Positioned(
                                      right: -10,
                                      bottom: -10,
                                      top: -10,
                                      width: 160,
                                      child: Opacity(
                                        opacity: 0.85,
                                        child: Image.asset(
                                          imgPath,
                                          fit: BoxFit.cover,
                                          errorBuilder: (ctx, err, stack) => const SizedBox(),
                                        ),
                                      ),
                                    ),
                                    // Gradient overlay for smooth readability
                                    Positioned.fill(
                                      child: Container(
                                        decoration: BoxDecoration(
                                          gradient: LinearGradient(
                                            colors: [
                                              c1.withOpacity(0.98),
                                              c1.withOpacity(0.85),
                                              Colors.transparent,
                                            ],
                                            begin: Alignment.centerLeft,
                                            end: Alignment.centerRight,
                                            stops: const [0.0, 0.6, 1.0],
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Content
                                    Padding(
                                      padding: const EdgeInsets.all(18),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: Colors.white.withOpacity(0.2),
                                              borderRadius: BorderRadius.circular(16),
                                              border: Border.all(color: Colors.white.withOpacity(0.3)),
                                            ),
                                            child: Text(
                                              banner['tag']!,
                                              style: const TextStyle(color: Colors.white, fontSize: 9.5, fontWeight: FontWeight.w900),
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            banner['title']!,
                                            style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w900, height: 1.1),
                                          ),
                                          const SizedBox(height: 4),
                                          SizedBox(
                                            width: 220,
                                            child: Text(
                                              banner['subtitle']!,
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(color: Colors.white70, fontSize: 10.5, height: 1.2),
                                            ),
                                          ),
                                          const SizedBox(height: 10),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(14),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: Colors.black.withOpacity(0.1),
                                                  blurRadius: 4,
                                                  offset: const Offset(0, 2),
                                                ),
                                              ],
                                            ),
                                            child: Text(
                                              banner['cta']!,
                                              style: TextStyle(
                                                color: c1,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w900,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Indicator Dots
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        _banners.length,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          width: _currentBannerIndex == index ? 22 : 6,
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

              const SizedBox(height: 18),

              // 3. Professional Trust Bar (Replacing raw emojis with styled Material Icon Badges)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: const [
                      _TrustItem(
                        icon: Icons.verified_user_rounded,
                        iconColor: Color(0xFF16A34A),
                        bgColor: Color(0xFFDCFCE7),
                        title: '100% Chính Hãng',
                      ),
                      _TrustItem(
                        icon: Icons.local_shipping_rounded,
                        iconColor: Color(0xFF2563EB),
                        bgColor: Color(0xFFDBEAFE),
                        title: 'Giao Nhanh 2H',
                      ),
                      _TrustItem(
                        icon: Icons.autorenew_rounded,
                        iconColor: Color(0xFFEA580C),
                        bgColor: Color(0xFFFFEDD5),
                        title: 'Đổi Trả 7 Ngày',
                      ),
                    ],
                  ),
                ),
              ),

              // 4. DEAL SỐC GIỜ VÀNG Section (Flash Sale)
              if (productProvider.flashSaleProducts.isNotEmpty) ...[
                const SizedBox(height: 20),
                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryRed.withOpacity(0.18),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                    image: const DecorationImage(
                      image: AssetImage('assets/flash-sale-bg.png'),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      gradient: LinearGradient(
                        colors: [
                          Colors.white.withOpacity(0.95),
                          Colors.white.withOpacity(0.88),
                          const Color(0xFFFFF1F2).withOpacity(0.96),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header Top Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryRed.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: AppTheme.primaryRed.withOpacity(0.3)),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text('🔥 ', style: TextStyle(fontSize: 10)),
                                  Text(
                                    'ĐỪNG BỎ LỠ HÔM NAY!',
                                    style: TextStyle(
                                      color: AppTheme.primaryRed,
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const DealHotScreen()),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppTheme.primaryRed.withOpacity(0.4)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.04),
                                      blurRadius: 4,
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: const [
                                    Text(
                                      'Xem tất cả',
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.primaryRed,
                                      ),
                                    ),
                                    SizedBox(width: 2),
                                    Icon(Icons.chevron_right_rounded, size: 14, color: AppTheme.primaryRed),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),

                        // Title & Subtitle + Icon Accent
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFFEF4444), Color(0xFFEA580C)],
                                ),
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFFEF4444).withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 20),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  Text(
                                    'DEAL SỐC GIỜ VÀNG',
                                    style: TextStyle(
                                      color: Color(0xFF0F172A),
                                      fontSize: 17,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  Text(
                                    'Giảm giá đến 30% cho dụng cụ học tập & VPP',
                                    style: TextStyle(
                                      color: Color(0xFF64748B),
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // Countdown Timer Bar
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFFED7AA)),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Row(
                                children: [
                                  Icon(Icons.timer_outlined, size: 15, color: AppTheme.primaryRed),
                                  SizedBox(width: 5),
                                  Text(
                                    'KẾT THÚC SAU:',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF475569),
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                              Row(
                                children: [
                                  _HomeTimerBlock(value: _hoursStr),
                                  const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 3),
                                    child: Text(':', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  ),
                                  _HomeTimerBlock(value: _minutesStr),
                                  const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 3),
                                    child: Text(':', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                  ),
                                  _HomeTimerBlock(value: _secondsStr),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),

                        // Products horizontal list with card width 175px
                        SizedBox(
                          height: 260,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: productProvider.flashSaleProducts.length,
                            itemBuilder: (context, index) {
                              final product = productProvider.flashSaleProducts[index];
                              return Container(
                                width: 175,
                                margin: const EdgeInsets.only(right: 12),
                                child: ProductGridCard(product: product),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],

              // 5. DANH MỤC NỔI BẬT Section (Structured 2-Column Vertical Grid)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 22, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.grid_view_rounded, size: 18, color: AppTheme.primaryRed),
                        SizedBox(width: 6),
                        Text(
                          'DANH MỤC NỔI BẬT',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.darkSlate,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ProductListScreen()),
                        );
                      },
                      child: const Text(
                        'Xem tất cả >',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                      ),
                    ),
                  ],
                ),
              ),

              // Featured Categories Cards Grid (2 Columns, Vertical Layout)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisExtent: 85,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                  ),
                  itemCount: _featuredCategories.length,
                  itemBuilder: (context, index) {
                    final item = _featuredCategories[index];
                    final String name = item['name'];
                    final String desc = item['desc'];
                    final String imagePath = item['image'];
                    final String slug = item['slug'];
                    final Color borderColor = item['borderColor'];

                    return GestureDetector(
                      onTap: () => _navigateToCategory(productProvider, slug, name),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: borderColor, width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(18),
                          child: Stack(
                            children: [
                              // Background Image on the right side
                              Positioned(
                                right: -5,
                                top: -5,
                                bottom: -5,
                                width: 90,
                                child: Image.asset(
                                  imagePath,
                                  fit: BoxFit.cover,
                                  alignment: Alignment.centerRight,
                                  errorBuilder: (ctx, err, stack) => const SizedBox(),
                                ),
                              ),
                              // Soft white gradient overlay for high contrast text on left
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Colors.white.withOpacity(0.98),
                                        Colors.white.withOpacity(0.92),
                                        Colors.white.withOpacity(0.20),
                                      ],
                                      begin: Alignment.centerLeft,
                                      end: Alignment.centerRight,
                                      stops: const [0.0, 0.55, 1.0],
                                    ),
                                  ),
                                ),
                              ),
                              // Card Content Text
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            name,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w900,
                                              color: Color(0xFF0F172A),
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            desc,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 9.5,
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFF64748B),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Icon(
                                      Icons.chevron_right_rounded,
                                      color: Color(0xFF94A3B8),
                                      size: 16,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 22),

              // 6. Editorial Inspiration Banner matching Web ("Nâng tầm góc làm việc & học tập")
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.amber.withOpacity(0.15),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                    image: const DecorationImage(
                      image: AssetImage('assets/inspiration-bg.png'),
                      fit: BoxFit.cover,
                      alignment: Alignment.centerRight,
                    ),
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(24),
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFFFFFBEB).withOpacity(0.96),
                          const Color(0xFFFEF3C7).withOpacity(0.88),
                          Colors.white.withOpacity(0.40),
                        ],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFB45309).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFB45309).withOpacity(0.3)),
                          ),
                          child: const Text(
                            '✨ KHÔNG GIAN CẢM HỨNG',
                            style: TextStyle(
                              color: Color(0xFFB45309),
                              fontSize: 9.5,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'NÂNG TẦM GÓC LÀM VIỆC & HỌC TẬP',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF78350F),
                            height: 1.25,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Góc làm việc gọn gàng, dụng cụ chất lượng là chiếc chìa khóa vạn năng khơi dậy động lực sáng tạo mỗi ngày.',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF92400E),
                            height: 1.35,
                          ),
                        ),
                        const SizedBox(height: 14),
                        GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const ProductListScreen()),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFFD97706), Color(0xFFB45309)],
                              ),
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFFD97706).withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Text(
                                  'Tìm cảm hứng sáng tạo',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 22),

              // 7. Product Catalog Section Header
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.local_fire_department_rounded, size: 18, color: AppTheme.primaryRed),
                        SizedBox(width: 6),
                        Text(
                          'SẢN PHẨM MỚI NHẤT',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.darkSlate,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ],
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ProductListScreen()),
                        );
                      },
                      child: const Text(
                        'Xem tất cả >',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                      ),
                    ),
                  ],
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
                    itemBuilder: (context, index) => const ProductCardSkeleton(),
                  ),
                )
              else if (productProvider.products.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.0),
                    child: Text('Chưa có sản phẩm nào.', style: TextStyle(color: Colors.grey)),
                  ),
                )
              else ...[
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
                    // Show initial 8 products for clean home view
                    itemCount: productProvider.products.length > 8 ? 8 : productProvider.products.length,
                    itemBuilder: (context, index) {
                      final product = productProvider.products[index];
                      return ProductGridCard(product: product);
                    },
                  ),
                ),
                const SizedBox(height: 16),
                // "See All Products" Bottom CTA Button
                Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                        side: const BorderSide(color: AppTheme.primaryRed, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ProductListScreen()),
                        );
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Text(
                            'Xem Tất Cả Sản Phẩm',
                            style: TextStyle(
                              color: AppTheme.primaryRed,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                          SizedBox(width: 6),
                          Icon(Icons.arrow_forward_rounded, color: AppTheme.primaryRed, size: 16),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 28),
            ],
          ),
        ),
      ),
    );
  }
}

class _HomeTimerBlock extends StatelessWidget {
  final String value;

  const _HomeTimerBlock({required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        value,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
          fontSize: 11.5,
          fontFamily: 'monospace',
        ),
      ),
    );
  }
}

class _TrustItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String title;

  const _TrustItem({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.title,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: bgColor,
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 14, color: iconColor),
        ),
        const SizedBox(width: 6),
        Text(
          title,
          style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: AppTheme.darkSlate),
        ),
      ],
    );
  }
}
