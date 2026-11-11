import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/product_grid_card.dart';
import '../../../models/product_model.dart';
import 'carousel_autoplay.dart';
import 'home_navigation.dart';

/// Sản phẩm thực sự đang giảm giá (giá KM do server trả về, 0 < KM < giá gốc).
List<ProductModel> dealProducts(Iterable<ProductModel> products) =>
    products.where((p) => p.hasDiscount).toList();

/// % giảm lớn nhất tính từ giá server trả về — dùng để hiển thị, không tự đặt số.
int maxDiscountPercent(Iterable<ProductModel> products) {
  var best = 0;
  for (final p in products) {
    final percent = Formatters.getDiscountPercent(p.price, p.discountPrice);
    if (percent > best) best = percent;
  }
  return best;
}

String dealSubtitle(int maxPercent) => maxPercent > 0
    ? 'Giảm đến $maxPercent% cho sản phẩm đang khuyến mãi'
    : 'Sản phẩm đang có giá ưu đãi';

/// Giờ / phút / giây còn lại tới [endsAt]; null khi không có hạn hoặc đã hết hạn.
({String hours, String minutes, String seconds})? countdownParts(DateTime? endsAt, DateTime now) {
  if (endsAt == null) return null;
  final diff = endsAt.difference(now);
  if (diff.inSeconds <= 0) return null;
  String two(int v) => v.toString().padLeft(2, '0');
  return (
    hours: two(diff.inHours),
    minutes: two(diff.inMinutes % 60),
    seconds: two(diff.inSeconds % 60),
  );
}

/// Đồng hồ đếm ngược tới hạn flash sale do server cấp (`flashSaleExpiry`).
/// Không có hạn → không hiển thị gì (không tự đếm tới nửa đêm).
class FlashSaleCountdown extends StatefulWidget {
  final DateTime? endsAt;

  const FlashSaleCountdown({super.key, required this.endsAt});

  @override
  State<FlashSaleCountdown> createState() => _FlashSaleCountdownState();
}

class _FlashSaleCountdownState extends State<FlashSaleCountdown> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _sync();
  }

  @override
  void didUpdateWidget(covariant FlashSaleCountdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.endsAt != widget.endsAt) _sync();
  }

  void _sync() {
    _timer?.cancel();
    _timer = null;
    if (countdownParts(widget.endsAt, DateTime.now()) == null) return;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {});
      if (countdownParts(widget.endsAt, DateTime.now()) == null) _timer?.cancel();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final parts = countdownParts(widget.endsAt, DateTime.now());
    if (parts == null) return const SizedBox.shrink();

    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final separator = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 3),
      child: Text(':', style: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w900)),
    );

    return Semantics(
      label: 'Kết thúc sau ${parts.hours} giờ ${parts.minutes} phút ${parts.seconds} giây',
      child: ExcludeSemantics(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
          decoration: BoxDecoration(
            color: palette.surface.withValues(alpha: 0.9),
            borderRadius: AppRadii.button,
            border: Border.all(color: palette.accentBorder),
          ),
          child: Row(
            children: [
              Icon(Icons.timer_outlined, size: 15, color: palette.primaryText),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  'Kết thúc sau',
                  style: textTheme.labelSmall?.copyWith(
                    color: palette.textSecondary,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              _TimerBlock(value: parts.hours),
              separator,
              _TimerBlock(value: parts.minutes),
              separator,
              _TimerBlock(value: parts.seconds),
            ],
          ),
        ),
      ),
    );
  }
}

class _TimerBlock extends StatelessWidget {
  final String value;

  const _TimerBlock({required this.value});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(color: scheme.inverseSurface, borderRadius: AppRadii.badge),
      child: Text(
        value,
        style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: scheme.onInverseSurface,
              fontWeight: FontWeight.w900,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
      ),
    );
  }
}

/// Khung nền khối ưu đãi (ảnh nền + lớp phủ theo theme).
class DealPanel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry margin;
  final EdgeInsetsGeometry padding;

  const DealPanel({
    super.key,
    required this.child,
    this.margin = const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
    this.padding = const EdgeInsets.all(AppSpacing.lg),
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Container(
      width: double.infinity,
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: AppRadii.panel,
        border: Border.all(color: palette.border),
        image: const DecorationImage(
          image: AssetImage('assets/flash-sale-bg.png'),
          fit: BoxFit.cover,
        ),
      ),
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          borderRadius: AppRadii.panel,
          gradient: LinearGradient(
            colors: [
              palette.surface.withValues(alpha: 0.95),
              palette.surface.withValues(alpha: 0.88),
              palette.primarySoft.withValues(alpha: 0.96),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: child,
      ),
    );
  }
}

/// Tiêu đề khối deal: nhãn, tiêu đề, mô tả % giảm thật và đồng hồ (nếu có hạn).
class DealHeader extends StatelessWidget {
  final int maxPercent;
  final DateTime? endsAt;
  final VoidCallback? onSeeAll;

  const DealHeader({super.key, required this.maxPercent, this.endsAt, this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                color: palette.primarySoft,
                borderRadius: BorderRadius.circular(AppRadii.pill),
                border: Border.all(color: palette.primaryText.withValues(alpha: 0.3)),
              ),
              child: Text(
                'Đang giảm giá',
                style: textTheme.labelSmall?.copyWith(
                  color: palette.primaryText,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const Spacer(),
            if (onSeeAll != null)
              OutlinedButton(
                onPressed: onSeeAll,
                style: OutlinedButton.styleFrom(
                  foregroundColor: palette.primaryText,
                  backgroundColor: palette.surface,
                  side: BorderSide(color: palette.primaryText.withValues(alpha: 0.4)),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  minimumSize: const Size(48, 32),
                  tapTargetSize: MaterialTapTargetSize.padded,
                  shape: const StadiumBorder(),
                  textStyle: textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w800),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Xem tất cả'),
                    SizedBox(width: 2),
                    Icon(Icons.chevron_right_rounded, size: 14),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(color: palette.primary, borderRadius: AppRadii.button),
              child: Icon(Icons.bolt_rounded, color: palette.onPrimary, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Semantics(
                    header: true,
                    child: Text(
                      // Chỉ dùng lời lẽ "giờ vàng" khi server cấp hạn thật (endsAt).
                      endsAt != null ? 'Giờ vàng giá sốc' : 'Ưu đãi đang diễn ra',
                      style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w900),
                    ),
                  ),
                  Text(
                    dealSubtitle(maxPercent),
                    style: textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (countdownParts(endsAt, DateTime.now()) != null) ...[
          const SizedBox(height: 14),
          FlashSaleCountdown(endsAt: endsAt),
        ],
      ],
    );
  }
}

/// Chấm chỉ vị trí trang của khối ưu đãi (trang trí: trình đọc màn hình bỏ qua).
class _PageDots extends StatelessWidget {
  final int count;
  final int index;

  const _PageDots({required this.count, required this.index});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return ExcludeSemantics(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          count,
          (i) => AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: index == i ? 18 : 6,
            height: 6,
            decoration: BoxDecoration(
              color: index == i ? palette.primary : palette.border,
              borderRadius: BorderRadius.circular(AppRadii.pill),
            ),
          ),
        ),
      ),
    );
  }
}

/// Khối flash sale trên trang chủ: tối đa 6 sản phẩm đang giảm giá, mỗi trang 2 thẻ,
/// tự trượt. Ẩn hẳn khi không có sản phẩm nào đang giảm.
class FlashSaleSection extends StatefulWidget {
  final List<ProductModel> products;

  /// Hạn flash sale do server cấp; null → ẩn đồng hồ đếm ngược.
  final DateTime? endsAt;

  const FlashSaleSection({super.key, required this.products, this.endsAt});

  @override
  State<FlashSaleSection> createState() => _FlashSaleSectionState();
}

class _FlashSaleSectionState extends State<FlashSaleSection> {
  static const int _maxItems = 6;
  static const double _gap = 10;
  final PageController _controller = PageController();
  late final CarouselAutoplay _autoplay;
  int _page = 0;

  List<ProductModel> get _items => widget.products.take(_maxItems).toList();
  int get _pageCount => (_items.length / 2).ceil();

  @override
  void initState() {
    super.initState();
    _autoplay = CarouselAutoplay(interval: const Duration(seconds: 4), onTick: _advance)..start();
  }

  void _advance() {
    if (!mounted || _pageCount < 2 || !_controller.hasClients) return;
    if (!carouselAutoplayAllowed(context)) return;
    _controller.animateToPage(
      (_page + 1) % _pageCount,
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOutCubic,
    );
  }

  @override
  void dispose() {
    _autoplay.stop();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    if (items.isEmpty) return const SizedBox.shrink();
    if (_page >= _pageCount) _page = 0;

    return DealPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DealHeader(
            maxPercent: maxDiscountPercent(widget.products),
            endsAt: widget.endsAt,
            onSeeAll: () => openDealHot(context),
          ),
          const SizedBox(height: 14),
          LayoutBuilder(
            builder: (context, constraints) {
              // Cùng tỉ lệ thẻ (0.64) với lưới sản phẩm để không tràn trên màn rộng.
              final cardWidth = (constraints.maxWidth - _gap) / 2;
              return SizedBox(
                height: cardWidth / 0.64,
                child: NotificationListener<ScrollNotification>(
                  onNotification: _autoplay.handleScroll,
                  child: PageView.builder(
                    controller: _controller,
                    onPageChanged: (idx) => setState(() => _page = idx),
                    itemCount: _pageCount,
                    itemBuilder: (context, pageIndex) {
                      final first = pageIndex * 2;
                      final second = first + 1;
                      return Row(
                        children: [
                          Expanded(child: ProductGridCard(product: items[first])),
                          const SizedBox(width: _gap),
                          Expanded(
                            child: second < items.length
                                ? ProductGridCard(product: items[second])
                                : const SizedBox(),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              );
            },
          ),
          if (_pageCount > 1) ...[
            const SizedBox(height: AppSpacing.md),
            _PageDots(count: _pageCount, index: _page),
          ],
        ],
      ),
    );
  }
}
