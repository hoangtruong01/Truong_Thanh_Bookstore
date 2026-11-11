import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../../../models/banner_model.dart';
import '../../../providers/banner_provider.dart';
import 'carousel_autoplay.dart';
import 'home_navigation.dart';

const double _heroHeight = 165;

/// Nền gradient cố định cho slide dự phòng (ảnh minh họa luôn tối, chữ trắng
/// ở cả Sáng / Tối nên dùng token gốc thay vì palette theo theme).
enum HeroTone { slate, brand, accent }

List<Color> _toneColors(HeroTone tone) {
  switch (tone) {
    case HeroTone.slate:
      return const [AppColors.slate900, AppColors.slate800];
    case HeroTone.brand:
      return const [AppColors.primary, AppColors.red800];
    case HeroTone.accent:
      return const [AppColors.accentOrange, AppColors.red800];
  }
}

/// Slide tĩnh — CHỈ hiển thị khi server không có banner `main_slider` nào.
/// Nội dung không hứa mức giảm giá / mã khuyến mãi cụ thể.
class HeroFallbackSlide {
  final String tag;
  final String title;
  final String subtitle;
  final String cta;
  final String image;
  final String link;
  final HeroTone tone;

  const HeroFallbackSlide({
    required this.tag,
    required this.title,
    required this.subtitle,
    required this.cta,
    required this.image,
    required this.link,
    required this.tone,
  });
}

const List<HeroFallbackSlide> heroFallbackSlides = [
  HeroFallbackSlide(
    tag: 'Mùa tựu trường',
    title: 'Sách và dụng cụ học tập',
    subtitle: 'Sách giáo khoa, sách tham khảo và văn phòng phẩm chính hãng',
    cta: 'Mua ngay',
    image: 'assets/hero_stationery.png',
    link: '/products',
    tone: HeroTone.slate,
  ),
  HeroFallbackSlide(
    tag: 'Deal hot',
    title: 'Sản phẩm đang giảm giá',
    subtitle: 'Xem các sản phẩm đang có giá ưu đãi trong cửa hàng',
    cta: 'Xem deal',
    image: 'assets/combo-bg.png',
    link: '/deal-hot',
    tone: HeroTone.brand,
  ),
  HeroFallbackSlide(
    tag: 'Văn phòng phẩm',
    title: 'Đủ món cho bàn học',
    subtitle: 'Bút, sổ tay, dụng cụ văn phòng cho học sinh và người đi làm',
    cta: 'Khám phá',
    image: 'assets/hero.png',
    link: '/products',
    tone: HeroTone.accent,
  ),
];

/// Carousel banner đầu trang: banner thật từ GET /banners/active (vị trí
/// `main_slider`), skeleton khi đang tải lần đầu, slide tĩnh khi server không
/// có banner nào.
class HeroBannerCarousel extends StatefulWidget {
  const HeroBannerCarousel({super.key, this.autoPlayInterval = const Duration(seconds: 4)});

  final Duration autoPlayInterval;

  @override
  State<HeroBannerCarousel> createState() => _HeroBannerCarouselState();
}

class _HeroBannerCarouselState extends State<HeroBannerCarousel> {
  final PageController _controller = PageController();
  late final CarouselAutoplay _autoplay;
  int _index = 0;
  int _slideCount = 0;

  @override
  void initState() {
    super.initState();
    _autoplay = CarouselAutoplay(interval: widget.autoPlayInterval, onTick: _advance)..start();
  }

  void _advance() {
    if (!mounted || _slideCount < 2 || !_controller.hasClients) return;
    if (!carouselAutoplayAllowed(context)) return;
    _controller.animateToPage(
      (_index + 1) % _slideCount,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
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
    final provider = context.watch<BannerProvider>();
    final banners = provider.mainSlider;

    if (banners.isEmpty && !provider.hasLoaded) {
      _slideCount = 0;
      return const Padding(
        padding: EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        child: ShimmerSkeleton(
          width: double.infinity,
          height: _heroHeight,
          borderRadius: AppRadii.xl,
        ),
      );
    }

    final useFallback = banners.isEmpty;
    _slideCount = useFallback ? heroFallbackSlides.length : banners.length;
    if (_index >= _slideCount) _index = 0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        children: [
          SizedBox(
            height: _heroHeight,
            child: NotificationListener<ScrollNotification>(
              onNotification: _autoplay.handleScroll,
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (idx) => setState(() => _index = idx),
                itemCount: _slideCount,
                itemBuilder: (context, index) {
                  if (useFallback) {
                    final slide = heroFallbackSlides[index];
                    return _FallbackSlide(
                      slide: slide,
                      onTap: () => openBannerLink(context, BannerLink.parse(slide.link)),
                    );
                  }
                  final banner = banners[index];
                  return _ApiBannerSlide(
                    banner: banner,
                    onTap: banner.link.isNavigable ? () => openBannerLink(context, banner.link) : null,
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 10),
          _Dots(count: _slideCount, index: _index),
        ],
      ),
    );
  }
}

class _Dots extends StatelessWidget {
  final int count;
  final int index;

  const _Dots({required this.count, required this.index});

  @override
  Widget build(BuildContext context) {
    if (count < 2) return const SizedBox(height: 6);
    final palette = context.palette;
    return ExcludeSemantics(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          count,
          (i) => AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: index == i ? 22 : 6,
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

class _ApiBannerSlide extends StatelessWidget {
  final BannerModel banner;
  final VoidCallback? onTap;

  const _ApiBannerSlide({required this.banner, this.onTap});

  @override
  Widget build(BuildContext context) {
    final source = banner.imageSource;
    Widget image;
    if (source == null) {
      image = _BannerImageError(title: banner.title);
    } else if (source.isNetwork) {
      image = CachedNetworkImage(
        imageUrl: source.networkUri.toString(),
        fit: BoxFit.cover,
        placeholder: (context, url) => const ShimmerSkeleton(borderRadius: 0),
        errorWidget: (context, url, error) => _BannerImageError(title: banner.title),
      );
    } else {
      image = Image.memory(
        source.bytes!,
        fit: BoxFit.cover,
        gaplessPlayback: true,
        errorBuilder: (context, error, stackTrace) => _BannerImageError(title: banner.title),
      );
    }

    return Semantics(
      label: banner.title.isEmpty ? 'Banner khuyến mãi' : banner.title,
      button: onTap != null,
      image: onTap == null,
      child: ClipRRect(
        borderRadius: AppRadii.panel,
        child: Material(
          color: context.palette.surfaceMuted,
          child: InkWell(
            onTap: onTap,
            child: SizedBox.expand(child: ExcludeSemantics(child: image)),
          ),
        ),
      ),
    );
  }
}

class _BannerImageError extends StatelessWidget {
  final String title;

  const _BannerImageError({required this.title});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return ColoredBox(
      color: palette.surfaceMuted,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.image_not_supported_outlined, color: palette.textMuted, size: 28),
              if (title.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.sm),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _FallbackSlide extends StatelessWidget {
  final HeroFallbackSlide slide;
  final VoidCallback onTap;

  const _FallbackSlide({required this.slide, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final colors = _toneColors(slide.tone);
    final onArt = palette.onPrimary;

    return Semantics(
      button: true,
      label: '${slide.title}. ${slide.subtitle}',
      child: ClipRRect(
        borderRadius: AppRadii.panel,
        child: Material(
          color: colors.first,
          child: InkWell(
            onTap: onTap,
            child: Ink(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: colors,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: ExcludeSemantics(
                child: Stack(
                  children: [
                    Positioned(
                      right: -10,
                      bottom: -10,
                      top: -10,
                      width: 160,
                      child: Opacity(
                        opacity: 0.85,
                        child: Image.asset(
                          slide.image,
                          fit: BoxFit.cover,
                          errorBuilder: (ctx, err, stack) => const SizedBox(),
                        ),
                      ),
                    ),
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              colors.first.withValues(alpha: 0.98),
                              colors.first.withValues(alpha: 0.85),
                              Colors.transparent,
                            ],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                            stops: const [0.0, 0.6, 1.0],
                          ),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: onArt.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(AppRadii.pill),
                              border: Border.all(color: onArt.withValues(alpha: 0.3)),
                            ),
                            child: Text(
                              slide.tag,
                              style: textTheme.labelSmall?.copyWith(color: onArt, fontWeight: FontWeight.w800),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          SizedBox(
                            width: 220,
                            child: Text(
                              slide.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: textTheme.titleMedium?.copyWith(
                                color: onArt,
                                fontWeight: FontWeight.w900,
                                height: 1.15,
                              ),
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xs),
                          SizedBox(
                            width: 220,
                            child: Text(
                              slide.subtitle,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: textTheme.labelSmall?.copyWith(
                                color: onArt.withValues(alpha: 0.8),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 5),
                            decoration: BoxDecoration(
                              color: onArt,
                              borderRadius: BorderRadius.circular(AppRadii.pill),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  slide.cta,
                                  style: textTheme.labelSmall?.copyWith(
                                    color: colors.first,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(width: 2),
                                Icon(Icons.arrow_forward_rounded, size: 12, color: colors.first),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
