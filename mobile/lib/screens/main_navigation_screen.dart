import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../widgets/glass_bottom_navigation.dart';
import 'home/home_screen.dart';
import 'product/product_list_screen.dart';
import 'cart/cart_screen.dart';
import 'order/order_history_screen.dart';
import 'profile/profile_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  bool _isNavVisible = true;

  final List<Widget> _screens = const [
    HomeScreen(),
    ProductListScreen(),
    CartScreen(),
    OrderHistoryScreen(),
    ProfileScreen(),
  ];

  // 5 Tab items tối giản chỉ gồm Icon theo đúng Option A & Style Ảnh 2, 3
  final List<GlassNavItemData> _navItems = const [
    GlassNavItemData(
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
    ),
    GlassNavItemData(
      icon: Icons.grid_view_outlined,
      activeIcon: Icons.grid_view_rounded,
    ),
    GlassNavItemData(
      icon: Icons.shopping_bag_outlined,
      activeIcon: Icons.shopping_bag_rounded,
      hasBadge: true,
    ),
    GlassNavItemData(
      icon: Icons.receipt_long_outlined,
      activeIcon: Icons.receipt_long_rounded,
    ),
    GlassNavItemData(
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
    ),
  ];

  void _onUserScroll(UserScrollNotification notification) {
    if (notification.direction == ScrollDirection.reverse) {
      // Người dùng cuộn ngón tay lên (xem tiếp nội dung bên dưới) -> Ẩn thanh điều hướng
      if (_isNavVisible) {
        setState(() {
          _isNavVisible = false;
        });
      }
    } else if (notification.direction == ScrollDirection.forward) {
      // Người dùng cuộn ngón tay xuống (kéo về phía trên) -> Hiện lại thanh điều hướng
      if (!_isNavVisible) {
        setState(() {
          _isNavVisible = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final cartCount = cartProvider.totalItemCount;

    return Scaffold(
      // extendBody: true giúp nội dung Page Content kéo dài xuống tận đáy màn hình phía sau glass nav bar
      extendBody: true,
      resizeToAvoidBottomInset: false,
      // Bắt sự kiện cuộn từ mọi trang con để tự động ẩn/hiện thanh điều hướng
      body: NotificationListener<UserScrollNotification>(
        onNotification: (notification) {
          _onUserScroll(notification);
          return false;
        },
        child: SubtleAnimatedIndexedStack(
          index: _currentIndex,
          children: _screens,
        ),
      ),
      // Hiệu ứng trượt lên/xuống mượt mà khi người dùng cuộn trang
      bottomNavigationBar: AnimatedSlide(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeInOutCubic,
        offset: _isNavVisible ? Offset.zero : const Offset(0, 1.8),
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 260),
          opacity: _isNavVisible ? 1.0 : 0.0,
          child: LiquidGlassBottomNav(
            currentIndex: _currentIndex,
            onTap: (index) {
              setState(() {
                _currentIndex = index;
                _isNavVisible = true; // Luôn hiển thị lại thanh nav khi đổi tab
              });
            },
            items: _navItems,
            badgeCount: cartCount,
          ),
        ),
      ),
    );
  }
}

/// Widget chuyển đổi trang vi mô (Subtle Micro-transition):
/// - Chuyển đổi Opacity (0.96 -> 1.0) và TranslateX (10px) đồng bộ với Liquid Lens
/// - Sử dụng Stack + IgnorePointer giúp giữ nguyên 100% state, scroll position của từng tab
class SubtleAnimatedIndexedStack extends StatefulWidget {
  final int index;
  final List<Widget> children;

  const SubtleAnimatedIndexedStack({
    super.key,
    required this.index,
    required this.children,
  });

  @override
  State<SubtleAnimatedIndexedStack> createState() => _SubtleAnimatedIndexedStackState();
}

class _SubtleAnimatedIndexedStackState extends State<SubtleAnimatedIndexedStack> {
  late int _currentIndex;
  int _previousIndex = 0;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.index;
    _previousIndex = widget.index;
  }

  @override
  void didUpdateWidget(covariant SubtleAnimatedIndexedStack oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.index != _currentIndex) {
      setState(() {
        _previousIndex = _currentIndex;
        _currentIndex = widget.index;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMovingRight = _currentIndex >= _previousIndex;

    return Stack(
      fit: StackFit.expand,
      children: List.generate(widget.children.length, (i) {
        final isSelected = i == _currentIndex;

        return IgnorePointer(
          ignoring: !isSelected,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 240),
            curve: Curves.easeOutCubic,
            opacity: isSelected ? 1.0 : 0.0,
            child: AnimatedSlide(
              duration: const Duration(milliseconds: 240),
              curve: Curves.easeOutCubic,
              offset: isSelected
                  ? Offset.zero
                  : Offset(isMovingRight ? -0.025 : 0.025, 0.0),
              child: widget.children[i],
            ),
          ),
        );
      }),
    );
  }
}
