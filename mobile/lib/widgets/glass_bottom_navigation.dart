import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/theme/app_theme.dart';

class GlassNavItemData {
  final IconData icon;
  final IconData activeIcon;
  final bool hasBadge;

  const GlassNavItemData({
    required this.icon,
    required this.activeIcon,
    this.hasBadge = false,
  });
}

class LiquidGlassBottomNav extends StatefulWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<GlassNavItemData> items;
  final int badgeCount;

  const LiquidGlassBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
    this.badgeCount = 0,
  });

  @override
  State<LiquidGlassBottomNav> createState() => _LiquidGlassBottomNavState();
}

class _LiquidGlassBottomNavState extends State<LiquidGlassBottomNav>
    with TickerProviderStateMixin {
  // Animation cho hiệu ứng quét sáng gương khi đổi tab
  late AnimationController _shineController;
  late Animation<double> _shineAnimation;

  // Animation snap thấu kính về vị trí tab gần nhất khi thả tay hoặc khi tap
  late AnimationController _snapController;
  late Animation<double> _snapAnimation;

  // Animation nâng nhẹ thấu kính (Lift effect 1.0 -> 1.035) khi đặt ngón tay vào
  late AnimationController _liftController;
  late Animation<double> _liftAnimation;

  // Trạng thái Drag & Vị trí liên tục của Lens
  bool _isDragging = false;
  double? _lensCenterX; // Vị trí tâm x của thấu kính
  double _lastTotalWidth = 0.0;
  int _activeDragIndex = 0; // Tab hiện tại đang được chọn

  // Dynamic optical response khi drag (độ giãn & độ nghiêng quang học)
  double _stretchX = 1.0;
  double _stretchY = 1.0;
  double _tiltAngle = 0.0;
  double _highlightShiftX = 0.0;

  @override
  void initState() {
    super.initState();
    _activeDragIndex = widget.currentIndex;

    // 1. Shine controller
    _shineController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _shineAnimation = Tween<double>(begin: -1.2, end: 1.8).animate(
      CurvedAnimation(
        parent: _shineController,
        curve: const Cubic(0.22, 1.0, 0.36, 1.0),
      ),
    );

    // 2. Snap controller (mềm mại, quán tính chất lỏng không bounce mạnh)
    _snapController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 240),
    );

    // 3. Lift controller (tạo cảm giác nhấc thấu kính lên để kéo)
    _liftController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 140),
    );
    _liftAnimation = Tween<double>(begin: 1.0, end: 1.035).animate(
      CurvedAnimation(parent: _liftController, curve: Curves.easeOutCubic),
    );
  }

  @override
  void didUpdateWidget(covariant LiquidGlassBottomNav oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentIndex != widget.currentIndex) {
      _activeDragIndex = widget.currentIndex;
      _shineController.forward(from: 0.0);
      if (!_isDragging && _lastTotalWidth > 0) {
        final itemWidth = _lastTotalWidth / widget.items.length;
        _animateLensToTab(widget.currentIndex, itemWidth);
      }
    }
  }

  @override
  void dispose() {
    _shineController.dispose();
    _snapController.dispose();
    _liftController.dispose();
    super.dispose();
  }

  void _animateLensToTab(int targetIndex, double itemWidth) {
    if (!mounted) return;
    _snapController.stop();
    final targetCenter = _getCenterOfTab(targetIndex, itemWidth);
    final startX = _lensCenterX ?? targetCenter;

    _snapAnimation = Tween<double>(begin: startX, end: targetCenter).animate(
      CurvedAnimation(
        parent: _snapController,
        curve: const Cubic(0.22, 1.0, 0.36, 1.0),
      ),
    )..addListener(() {
        setState(() {
          _lensCenterX = _snapAnimation.value;
        });
      });

    _snapController.forward(from: 0.0);
  }

  double _getCenterOfTab(int index, double itemWidth) {
    return (index * itemWidth) + (itemWidth / 2);
  }

  // ==========================================
  // DRAG-TO-SELECT INTERACTION LOGIC
  // ==========================================

  void _onDragStart(DragStartDetails details, double itemWidth, int itemCount) {
    _snapController.stop();
    _liftController.forward();

    setState(() {
      _isDragging = true;
      _lensCenterX ??= _getCenterOfTab(widget.currentIndex, itemWidth);
    });
  }

  void _onDragUpdate(DragUpdateDetails details, double itemWidth, int itemCount) {
    final fingerX = details.localPosition.dx;
    final minCenter = _getCenterOfTab(0, itemWidth);
    final maxCenter = _getCenterOfTab(itemCount - 1, itemWidth);

    // Tính toán vị trí tâm Lens có lực cản đàn hồi nhẹ khi vượt biên ngoài
    double newCenter;
    if (fingerX < minCenter) {
      newCenter = minCenter - (minCenter - fingerX) * 0.18;
    } else if (fingerX > maxCenter) {
      newCenter = maxCenter + (fingerX - maxCenter) * 0.18;
    } else {
      newCenter = fingerX;
    }

    // Dynamic optical response theo vận tốc drag
    final deltaX = details.primaryDelta ?? 0.0;
    final dynamicStretchX = (1.0 + (deltaX.abs() * 0.012)).clamp(1.0, 1.045);
    final dynamicStretchY = (1.0 - (deltaX.abs() * 0.006)).clamp(0.97, 1.0);
    final dynamicTilt = (deltaX * 0.008).clamp(-0.045, 0.045);
    final dynamicHighlightShift = (-deltaX * 0.3).clamp(-6.0, 6.0);

    // THRESHOLD & HYSTERESIS: Ngăn ngừa nhảy giật giữa 2 tab
    final candidateIndex = (newCenter / itemWidth).floor().clamp(0, itemCount - 1);
    if (candidateIndex != _activeDragIndex) {
      final currentCenter = _getCenterOfTab(_activeDragIndex, itemWidth);
      final targetCenter = _getCenterOfTab(candidateIndex, itemWidth);
      final midpoint = (currentCenter + targetCenter) / 2;
      final hysteresisBuffer = itemWidth * 0.08; // Vùng đệm 8% ~6px

      bool crossed = false;
      if (candidateIndex > _activeDragIndex && newCenter > midpoint + hysteresisBuffer) {
        crossed = true;
      } else if (candidateIndex < _activeDragIndex && newCenter < midpoint - hysteresisBuffer) {
        crossed = true;
      }

      if (crossed) {
        _activeDragIndex = candidateIndex;
        widget.onTap(_activeDragIndex);
        HapticFeedback.selectionClick(); // Rung phản hồi nhẹ khi chạm ngưỡng tab mới
      }
    }

    setState(() {
      _lensCenterX = newCenter;
      _stretchX = dynamicStretchX;
      _stretchY = dynamicStretchY;
      _tiltAngle = dynamicTilt;
      _highlightShiftX = dynamicHighlightShift;
    });
  }

  void _onDragEnd(DragEndDetails details, double itemWidth, int itemCount) {
    _liftController.reverse();

    // Xét vận tốc flick ngón tay
    final velocityX = details.primaryVelocity ?? 0.0;
    int snapTargetIndex = _activeDragIndex;

    if (velocityX > 380 && _activeDragIndex < itemCount - 1) {
      snapTargetIndex = _activeDragIndex + 1;
    } else if (velocityX < -380 && _activeDragIndex > 0) {
      snapTargetIndex = _activeDragIndex - 1;
    } else {
      // Snap về tab có tâm gần nhất với vị trí thả tay hiện tại
      final currentCenter = _lensCenterX ?? _getCenterOfTab(_activeDragIndex, itemWidth);
      snapTargetIndex = (currentCenter / itemWidth).floor().clamp(0, itemCount - 1);
    }

    if (snapTargetIndex != _activeDragIndex) {
      _activeDragIndex = snapTargetIndex;
      widget.onTap(_activeDragIndex);
      HapticFeedback.selectionClick();
    }

    final targetCenter = _getCenterOfTab(snapTargetIndex, itemWidth);
    final startCenter = _lensCenterX ?? targetCenter;

    _snapController.stop();
    _snapAnimation = Tween<double>(begin: startCenter, end: targetCenter).animate(
      CurvedAnimation(
        parent: _snapController,
        curve: const Cubic(0.22, 1.0, 0.36, 1.0),
      ),
    )..addListener(() {
        setState(() {
          _lensCenterX = _snapAnimation.value;
        });
      });

    setState(() {
      _isDragging = false;
      _stretchX = 1.0;
      _stretchY = 1.0;
      _tiltAngle = 0.0;
      _highlightShiftX = 0.0;
    });

    _snapController.forward(from: 0.0);
  }

  void _onDragCancel(double itemWidth) {
    _liftController.reverse();
    setState(() {
      _isDragging = false;
      _stretchX = 1.0;
      _stretchY = 1.0;
      _tiltAngle = 0.0;
      _highlightShiftX = 0.0;
    });
    _animateLensToTab(_activeDragIndex, itemWidth);
  }

  void _onTapTab(int tappedIndex, double itemWidth) {
    if (_activeDragIndex != tappedIndex) {
      _activeDragIndex = tappedIndex;
      widget.onTap(tappedIndex);
      HapticFeedback.selectionClick();
    }
    _animateLensToTab(tappedIndex, itemWidth);
  }

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: EdgeInsets.only(
        left: 14,
        right: 14,
        bottom: bottomPadding > 0 ? bottomPadding : 12,
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final totalWidth = constraints.maxWidth;
          final itemCount = widget.items.length;
          final itemWidth = totalWidth / itemCount;
          const navHeight = 68.0;
          const lensHeight = 56.0; // Chiều cao thấu kính lồi dày dặn
          final lensWidth = (itemWidth * 0.94).clamp(62.0, 78.0);

          // Tự động khởi tạo vị trí tâm lens an toàn tuyệt đối
          if (_lastTotalWidth != totalWidth || _lensCenterX == null) {
            _lastTotalWidth = totalWidth;
            _lensCenterX = _getCenterOfTab(_activeDragIndex, itemWidth);
          }
          final currentLensLeft = _lensCenterX! - (lensWidth / 2);

          return RepaintBoundary(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              // Tự động phân biệt cử chỉ ngang và dọc (Không cản trở scroll trang con)
              onHorizontalDragStart: (details) => _onDragStart(details, itemWidth, itemCount),
              onHorizontalDragUpdate: (details) => _onDragUpdate(details, itemWidth, itemCount),
              onHorizontalDragEnd: (details) => _onDragEnd(details, itemWidth, itemCount),
              onHorizontalDragCancel: () => _onDragCancel(itemWidth),
              onTapUp: (details) {
                final tappedIndex = (details.localPosition.dx / itemWidth).floor().clamp(0, itemCount - 1);
                _onTapTab(tappedIndex, itemWidth);
              },
              child: Container(
                height: navHeight,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(35),
                  // Đổ bóng nổi không gian mềm mại
                  boxShadow: [
                    BoxShadow(
                      color: isDark
                          ? Colors.black.withValues(alpha: 0.50)
                          : const Color(0xFF0F172A).withValues(alpha: 0.10),
                      blurRadius: 32,
                      spreadRadius: 0,
                      offset: const Offset(0, 10),
                    ),
                    BoxShadow(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.08)
                          : Colors.white.withValues(alpha: 0.25),
                      blurRadius: 6,
                      spreadRadius: 0,
                      offset: const Offset(0, -1),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(35),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                    child: Container(
                      decoration: BoxDecoration(
                        // LAYER 1: GLOBAL GLASS CAPSULE GRADIENT
                        // Trong Dark Mode: dùng lớp sương kính mờ phát sáng nhẹ (luminous frost), KHÔNG dùng đen đục
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: isDark
                              ? [
                                  Colors.white.withValues(alpha: 0.15),
                                  Colors.white.withValues(alpha: 0.06),
                                  Colors.white.withValues(alpha: 0.03),
                                ]
                              : [
                                  Colors.white.withValues(alpha: 0.20),
                                  Colors.white.withValues(alpha: 0.08),
                                  Colors.white.withValues(alpha: 0.04),
                                ],
                          stops: const [0.0, 0.6, 1.0],
                        ),
                        borderRadius: BorderRadius.circular(35),
                        border: Border.all(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.24)
                              : Colors.white.withValues(alpha: 0.28),
                          width: 1.0,
                        ),
                      ),
                      child: Stack(
                        clipBehavior: Clip.none,
                        alignment: Alignment.centerLeft,
                        children: [
                          // 1. Ánh sáng phản xạ mép trên (Top Specular Reflection Rim)
                          Positioned(
                            top: 0,
                            left: 20,
                            right: 20,
                            height: 1.5,
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.white.withValues(alpha: 0.0),
                                    Colors.white.withValues(alpha: isDark ? 0.75 : 0.65),
                                    Colors.white.withValues(alpha: 0.0),
                                  ],
                                ),
                              ),
                            ),
                          ),

                          // 2. Mirror Shine Sweep (Vệt quét sáng chéo khi chuyển tab)
                          // Sửa lỗi: Positioned.fill BẮT BUỘC phải là con trực tiếp của Stack
                          Positioned.fill(
                            child: AnimatedBuilder(
                              animation: _shineAnimation,
                              builder: (context, child) {
                                return FractionalTranslation(
                                  translation: Offset(_shineAnimation.value, 0.0),
                                  child: Transform.rotate(
                                    angle: 0.30,
                                    child: Container(
                                      width: 60,
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            Colors.white.withValues(alpha: 0.0),
                                            Colors.white.withValues(alpha: isDark ? 0.22 : 0.18),
                                            Colors.white.withValues(alpha: 0.0),
                                          ],
                                          stops: const [0.0, 0.5, 1.0],
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),

                          // 3. LAYER 2: MOVING REFRACTIVE LIQUID GLASS LENS (Thấu kính trượt realtime)
                          Positioned(
                            left: currentLensLeft,
                            top: (navHeight - lensHeight) / 2,
                            width: lensWidth,
                            height: lensHeight,
                            child: AnimatedBuilder(
                              animation: _liftAnimation,
                              builder: (context, child) {
                                return Transform(
                                  alignment: Alignment.center,
                                  transform: Matrix4.identity()
                                    ..scale(_stretchX * _liftAnimation.value, _stretchY * _liftAnimation.value)
                                    ..rotateZ(_tiltAngle),
                                  child: child,
                                );
                              },
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(28),
                                  // Hiệu ứng quang sai sắc viền (Chromatic Aberration Rim) rực rỡ và sang trọng trong Dark Mode
                                  boxShadow: [
                                    // Ánh xanh Cyan quang học ở sườn
                                    BoxShadow(
                                      color: const Color(0xFF38BDF8).withValues(alpha: isDark ? 0.40 : 0.18),
                                      blurRadius: 18,
                                      spreadRadius: 1,
                                      offset: const Offset(-2, 1),
                                    ),
                                    // Ánh vàng/hổ phách đối diện tạo cảm giác tán sắc lăng kính
                                    BoxShadow(
                                      color: const Color(0xFFFBBF24).withValues(alpha: isDark ? 0.28 : 0.10),
                                      blurRadius: 16,
                                      spreadRadius: 0,
                                      offset: const Offset(2, -1),
                                    ),
                                    // Glow phản quang màu đỏ thương hiệu
                                    BoxShadow(
                                      color: AppTheme.primaryRed.withValues(alpha: isDark ? 0.25 : 0.14),
                                      blurRadius: 16,
                                      offset: const Offset(0, 3),
                                    ),
                                    // Specular bounce light
                                    BoxShadow(
                                      color: Colors.white.withValues(alpha: isDark ? 0.55 : 0.45),
                                      blurRadius: 8,
                                      spreadRadius: 0,
                                      offset: const Offset(0, -1),
                                    ),
                                  ],
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(28),
                                  child: BackdropFilter(
                                    filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(28),
                                        // Center thấu kính trong suốt có độ khúc xạ kính lồi rõ ràng
                                        gradient: LinearGradient(
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                          colors: isDark
                                              ? [
                                                  Colors.white.withValues(alpha: 0.32),
                                                  Colors.white.withValues(alpha: 0.10),
                                                  Colors.white.withValues(alpha: 0.04),
                                                ]
                                              : [
                                                  Colors.white.withValues(alpha: 0.35),
                                                  Colors.white.withValues(alpha: 0.10),
                                                  Colors.white.withValues(alpha: 0.04),
                                                ],
                                          stops: const [0.0, 0.45, 1.0],
                                        ),
                                        // Viền kính khúc xạ lồi sáng rõ nổi bật
                                        border: Border.all(
                                          color: isDark
                                              ? Colors.white.withValues(alpha: 0.65)
                                              : Colors.white.withValues(alpha: 0.58),
                                          width: 1.2,
                                        ),
                                      ),
                                      child: Stack(
                                        children: [
                                          // Điểm sáng phản quang trên đỉnh thấu kính (Lens Specular Arc)
                                          Positioned(
                                            top: 2,
                                            left: 8 + _highlightShiftX,
                                            right: 8 - _highlightShiftX,
                                            height: 10,
                                            child: Container(
                                              decoration: BoxDecoration(
                                                borderRadius: BorderRadius.circular(10),
                                                gradient: LinearGradient(
                                                  begin: Alignment.topCenter,
                                                  end: Alignment.bottomCenter,
                                                  colors: [
                                                    Colors.white.withValues(alpha: isDark ? 0.85 : 0.70),
                                                    Colors.white.withValues(alpha: 0.0),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ),
                                          // Độ sâu mép dưới (Bottom Depth Rim)
                                          Positioned(
                                            bottom: 2,
                                            left: 12,
                                            right: 12,
                                            height: 4,
                                            child: Container(
                                              decoration: BoxDecoration(
                                                borderRadius: BorderRadius.circular(4),
                                                gradient: LinearGradient(
                                                  begin: Alignment.bottomCenter,
                                                  end: Alignment.topCenter,
                                                  colors: [
                                                    Colors.black.withValues(alpha: isDark ? 0.25 : 0.06),
                                                    Colors.transparent,
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),

                          // 4. LAYER 4: ICONS (Tương tác tap và phản hồi thị giác mượt mà)
                          Row(
                            children: List.generate(itemCount, (index) {
                              final item = widget.items[index];
                              final isSelected = _activeDragIndex == index;

                              return Expanded(
                                child: Container(
                                  height: navHeight,
                                  alignment: Alignment.center,
                                  child: _GlassNavIconItem(
                                    item: item,
                                    isSelected: isSelected,
                                    badgeCount: item.hasBadge ? widget.badgeCount : 0,
                                    isDark: isDark,
                                  ),
                                ),
                              );
                            }),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _GlassNavIconItem extends StatelessWidget {
  final GlassNavItemData item;
  final bool isSelected;
  final int badgeCount;
  final bool isDark;

  const _GlassNavIconItem({
    required this.item,
    required this.isSelected,
    required this.badgeCount,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    // Độ tương phản cao trong Dark mode giúp icon luôn sáng rõ tuyệt đối
    final inactiveColor = isDark
        ? const Color(0xFFF1F5F9).withValues(alpha: 0.85) // Màu bạc sáng ánh kim
        : const Color(0xFF64748B).withValues(alpha: 0.75);

    final activeColor = isDark
        ? const Color(0xFFFF4D4D) // Màu đỏ sáng nổi bật trong nền tối
        : AppTheme.primaryRed;

    return AnimatedScale(
      scale: isSelected ? 1.08 : 0.96,
      duration: const Duration(milliseconds: 240),
      curve: Curves.easeOutCubic,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            transitionBuilder: (child, anim) => FadeTransition(
              opacity: anim,
              child: ScaleTransition(scale: anim, child: child),
            ),
            child: Icon(
              isSelected ? item.activeIcon : item.icon,
              key: ValueKey('${item.icon.codePoint}_$isSelected'),
              size: isSelected ? 24 : 22,
              color: isSelected ? activeColor : inactiveColor,
            ),
          ),
          // Cart Badge giữ nguyên hoạt động thời gian thực
          if (badgeCount > 0)
            Positioned(
              right: -8,
              top: -6,
              child: AnimatedScale(
                scale: 1.0,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                  decoration: BoxDecoration(
                    gradient: AppTheme.primaryGradient,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isDark ? const Color(0xFF0F172A) : Colors.white,
                      width: 1.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryRed.withValues(alpha: 0.5),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    badgeCount > 99 ? '99+' : '$badgeCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8.5,
                      fontWeight: FontWeight.w900,
                      height: 1.1,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
