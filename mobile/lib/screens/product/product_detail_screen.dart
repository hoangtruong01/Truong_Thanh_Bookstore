import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/config/app_config.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/product_grid_card.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../models/product_model.dart';
import '../../models/review_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/product_provider.dart';
import '../../providers/wishlist_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/review_provider.dart';
import '../checkout/checkout_screen.dart';

const String kNoDescriptionText = 'Chưa có mô tả cho sản phẩm này.';

/// Mô tả hiển thị dạng chữ thường: bỏ thẻ HTML / ký hiệu Markdown cơ bản
/// (web render Markdown). Không có mô tả thì trả về [kNoDescriptionText].
String productDescriptionText(String? description) {
  final raw = description?.trim() ?? '';
  if (raw.isEmpty) return kNoDescriptionText;
  final text = raw
      .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'</p>', caseSensitive: false), '\n')
      .replaceAll(RegExp(r'<[^>]+>'), '')
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAllMapped(RegExp(r'^\s{0,3}#{1,6}\s*', multiLine: true), (_) => '')
      .replaceAllMapped(RegExp(r'^\s*[-*+]\s+', multiLine: true), (_) => '• ')
      .replaceAll(RegExp(r'(\*\*|__)'), '')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .trim();
  return text.isEmpty ? kNoDescriptionText : text;
}

/// Các dòng thông số có dữ liệu thật (không chèn giá trị giả).
List<MapEntry<String, String>> productSpecRows(ProductModel product) {
  final rows = <MapEntry<String, String>>[];
  void add(String label, String? value) {
    final v = value?.trim() ?? '';
    if (v.isNotEmpty) rows.add(MapEntry(label, v));
  }

  add('Tác giả', product.author);
  add('Nhà xuất bản', product.publisher);
  add('Năm xuất bản', product.publicationYear?.toString());
  add('Mã ISBN', product.isbn);
  add('Thương hiệu', product.brand);
  add('Mã SKU', product.sku);
  rows.add(MapEntry('Tình trạng', product.isInStock ? 'Còn hàng (${product.stock})' : 'Tạm hết hàng'));
  return rows;
}

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
  bool _submittingReview = false;
  late Future<List<ProductModel>> _relatedFuture;

  ProductModel get product => widget.product;

  @override
  void initState() {
    super.initState();
    _relatedFuture = _loadRelated();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<ReviewProvider>().fetchReviews(product.id);
      // Free-shipping threshold for the policy badge (server rule, cached by the cart).
      context.read<CartProvider>().loadPricingPolicy();
    });
  }

  Future<List<ProductModel>> _loadRelated() =>
      context.read<ProductProvider>().fetchRelatedProducts(product.id);

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _showSnack(String message, {Duration duration = const Duration(seconds: 2)}) {
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(SnackBar(content: Text(message), duration: duration));
  }

  void _addToCart({bool navigateToCheckout = false}) {
    final cart = Provider.of<CartProvider>(context, listen: false);
    final inCart = ProductGridCard.quantityInCart(cart, product.id);
    final addable = product.addableQuantity(inCart: inCart, requested: _quantity);

    if (addable > 0) cart.addToCart(product, quantity: addable);

    if (navigateToCheckout) {
      if (addable <= 0 && inCart <= 0) {
        _showSnack('Sản phẩm đã hết hàng.');
        return;
      }
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const CheckoutScreen()),
      );
      return;
    }

    if (addable <= 0) {
      _showSnack('Giỏ hàng đã có tối đa số lượng còn trong kho (${product.stock}).');
    } else if (addable < _quantity) {
      _showSnack('Chỉ thêm được $addable sản phẩm do giới hạn tồn kho.');
    } else {
      _showSnack('Đã thêm $addable x "${product.name}" vào giỏ hàng');
    }
  }

  Future<void> _copyShareLink() async {
    final url = AppConfig.productUrl(product.urlKey);
    await Clipboard.setData(ClipboardData(text: url));
    if (!mounted) return;
    _showSnack('Đã sao chép liên kết sản phẩm');
  }

  Future<void> _toggleFavorite(WishlistProvider wishlist, bool isFav) async {
    final token = context.read<AuthProvider>().token;
    final messenger = ScaffoldMessenger.of(context);
    final ok = await wishlist.toggleFavorite(product, token);
    // Tap ignored while the previous request is in flight: not a failure.
    if (ok == null) return;
    messenger.showSnackBar(
      SnackBar(
        content: Text(!ok
            ? 'Không thể cập nhật Yêu thích, vui lòng thử lại'
            : isFav ? 'Đã xóa khỏi Yêu thích' : 'Đã thêm vào Yêu thích'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  Future<void> _showAddReviewDialog() async {
    if (_submittingReview) return;
    setState(() => _submittingReview = true);
    final reviewProvider = context.read<ReviewProvider>();
    final token = context.read<AuthProvider>().token;
    await reviewProvider.checkCanReview(product.id, token);
    if (!mounted) return;
    if (!reviewProvider.canUserReview) {
      setState(() => _submittingReview = false);
      _showSnack(reviewProvider.canReviewReason ?? 'Bạn cần mua sản phẩm trước khi đánh giá.');
      return;
    }
    int selectedStars = 5;
    String reviewContent = '';

    final shouldSubmit = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        final palette = ctx.palette;
        return AlertDialog(
          title: const Text('Viết đánh giá sản phẩm'),
          content: StatefulBuilder(
            builder: (context, setDialogState) => Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final starNum = index + 1;
                    return IconButton(
                      tooltip: '$starNum sao',
                      icon: Icon(
                        starNum <= selectedStars ? Icons.star_rounded : Icons.star_border_rounded,
                        color: palette.star,
                        size: 32,
                      ),
                      onPressed: () => setDialogState(() => selectedStars = starNum),
                    );
                  }),
                ),
                const SizedBox(height: AppSpacing.md),
                TextField(
                  onChanged: (value) => reviewContent = value,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    hintText: 'Chia sẻ cảm nhận của bạn về sản phẩm này...',
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
                if (reviewContent.trim().length >= 2) {
                  Navigator.pop(ctx, true);
                }
              },
              child: const Text('Gửi đánh giá'),
            ),
          ],
        );
      },
    );
    if (!mounted) return;
    if (shouldSubmit != true) {
      setState(() => _submittingReview = false);
      return;
    }
    final saved = await reviewProvider.submitReview(
      productId: product.id,
      rating: selectedStars,
      content: reviewContent.trim(),
      token: token,
    );
    if (!mounted) return;
    setState(() => _submittingReview = false);
    _showSnack(saved
        ? 'Đã gửi đánh giá thành công. Cảm ơn bạn!'
        : reviewProvider.errorMessage ?? 'Không thể gửi đánh giá. Vui lòng thử lại.');
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final discount = Formatters.getDiscountPercent(product.price, product.discountPrice);
    final wishlistProvider = Provider.of<WishlistProvider>(context);
    final isFav = wishlistProvider.isFavorite(product.id);
    final reviewState = context.watch<ReviewProvider>().stateFor(product.id);
    final breakdown = reviewState.breakdown;
    final hasDesc = product.description != null && product.description!.trim().isNotEmpty;
    final sectionTitle = textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800);
    final freeShipThreshold = context.select<CartProvider, num?>((c) => c.pricingPolicy?.freeShippingThreshold);

    Widget imagePlaceholder() => Center(
          child: Icon(Icons.menu_book_rounded, size: 80, color: palette.textMuted),
        );

    return Scaffold(
      backgroundColor: palette.background,
      appBar: AppBar(
        title: Text(
          product.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            tooltip: isFav ? 'Bỏ yêu thích' : 'Thêm vào yêu thích',
            icon: Icon(
              isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
              color: isFav ? palette.primaryText : null,
            ),
            onPressed: () => _toggleFavorite(wishlistProvider, isFav),
          ),
          IconButton(
            tooltip: 'Sao chép liên kết',
            icon: const Icon(Icons.link_rounded),
            onPressed: _copyShareLink,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Image carousel
            Container(
              height: 320,
              width: double.infinity,
              color: palette.surface,
              child: Stack(
                children: [
                  if (product.images.isNotEmpty)
                    PageView.builder(
                      controller: _pageController,
                      onPageChanged: (index) => setState(() => _currentImageIndex = index),
                      itemCount: product.images.length,
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.all(AppSpacing.lg),
                          child: InteractiveViewer(
                            minScale: 1.0,
                            maxScale: 4.0,
                            child: CachedNetworkImage(
                              imageUrl: product.images[index],
                              fit: BoxFit.contain,
                              placeholder: (context, url) => const ShimmerSkeleton(
                                width: double.infinity,
                                height: double.infinity,
                                borderRadius: AppRadii.lg,
                              ),
                              errorWidget: (context, url, error) => imagePlaceholder(),
                            ),
                          ),
                        );
                      },
                    )
                  else
                    imagePlaceholder(),

                  if (discount > 0)
                    Positioned(
                      top: AppSpacing.lg,
                      left: AppSpacing.lg,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: palette.primary,
                          borderRadius: AppRadii.badge,
                        ),
                        child: Text(
                          '-$discount%',
                          style: textTheme.labelMedium?.copyWith(
                            color: palette.onPrimary,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),

                  if (product.images.length > 1)
                    Positioned(
                      bottom: AppSpacing.lg,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          product.images.length,
                          (idx) => AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: const EdgeInsets.symmetric(horizontal: 3),
                            width: _currentImageIndex == idx ? 16 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: _currentImageIndex == idx ? palette.primary : palette.border,
                              borderRadius: const BorderRadius.all(Radius.circular(AppRadii.pill)),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // 2. Product info
            _Section(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(product.name, style: textTheme.titleLarge),
                  const SizedBox(height: AppSpacing.sm),
                  Row(
                    children: [
                      Expanded(child: _RatingLine(product: product, breakdown: breakdown)),
                      const SizedBox(width: AppSpacing.sm),
                      _StockBadge(product: product),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.end,
                    spacing: 10,
                    children: [
                      Text(
                        Formatters.formatCurrency(product.effectivePrice),
                        style: textTheme.headlineSmall?.copyWith(
                          color: palette.primaryText,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      if (product.hasDiscount)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 3),
                          child: Text(
                            Formatters.formatCurrency(product.price),
                            style: textTheme.bodyLarge?.copyWith(
                              color: palette.textMuted,
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            // Trust policy badges
            _Section(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
              child: Wrap(
                alignment: WrapAlignment.spaceAround,
                spacing: AppSpacing.md,
                runSpacing: AppSpacing.sm,
                children: [
                  const _PolicyBadge(icon: Icons.verified_outlined, label: '100% chính hãng'),
                  // Threshold from the server pricing policy; hidden until it is known.
                  if (freeShipThreshold != null && freeShipThreshold > 0)
                    _PolicyBadge(
                      icon: Icons.local_shipping_outlined,
                      label: 'Miễn phí giao hàng từ ${Formatters.formatCurrency(freeShipThreshold)}',
                    ),
                  const _PolicyBadge(icon: Icons.replay_outlined, label: 'Đổi trả 7 ngày'),
                ],
              ),
            ),

            // Product details / specs
            _Section(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Thông tin sản phẩm', style: sectionTitle),
                  const SizedBox(height: AppSpacing.md),
                  for (final (index, row) in productSpecRows(product).indexed) ...[
                    if (index > 0) const Divider(height: AppSpacing.lg),
                    _SpecRow(label: row.key, value: row.value),
                  ],
                  const SizedBox(height: AppSpacing.xl),
                  Text('Mô tả sản phẩm', style: sectionTitle),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    productDescriptionText(product.description),
                    style: hasDesc
                        ? textTheme.bodyMedium?.copyWith(height: 1.55)
                        : textTheme.bodyMedium?.copyWith(
                            color: palette.textMuted,
                            fontStyle: FontStyle.italic,
                          ),
                  ),
                ],
              ),
            ),

            // Ratings & reviews
            _Section(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text('Đánh giá từ khách hàng', style: sectionTitle)),
                      TextButton.icon(
                        onPressed: _submittingReview ? null : _showAddReviewDialog,
                        icon: const Icon(Icons.rate_review_outlined, size: 18),
                        label: const Text('Viết đánh giá'),
                      ),
                    ],
                  ),
                  if (_submittingReview) ...[
                    const SizedBox(height: AppSpacing.xs),
                    const LinearProgressIndicator(),
                  ],
                  const SizedBox(height: AppSpacing.md),
                  if (breakdown != null && breakdown.total > 0) ...[
                    RatingBreakdownView(breakdown: breakdown),
                    const Divider(height: AppSpacing.xxxl),
                  ],
                  _ReviewsBody(
                    state: reviewState,
                    onRetry: () => context.read<ReviewProvider>().fetchReviews(product.id),
                  ),
                ],
              ),
            ),

            // Related products (GET /products/:id/related)
            FutureBuilder<List<ProductModel>>(
              future: _relatedFuture,
              builder: (context, snapshot) {
                final waiting = snapshot.connectionState != ConnectionState.done;
                if (!waiting && !snapshot.hasError && (snapshot.data?.isEmpty ?? true)) {
                  return const SizedBox.shrink();
                }
                final related = (snapshot.data ?? const <ProductModel>[]).take(6).toList();
                return _Section(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Sản phẩm tương tự', style: sectionTitle),
                      const SizedBox(height: AppSpacing.lg),
                      if (snapshot.hasError)
                        _InlineError(
                          message: 'Không thể tải sản phẩm tương tự.',
                          onRetry: () => setState(() => _relatedFuture = _loadRelated()),
                        )
                      else
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.64,
                            crossAxisSpacing: AppSpacing.md,
                            mainAxisSpacing: AppSpacing.md,
                          ),
                          itemCount: waiting ? 2 : related.length,
                          itemBuilder: (context, index) => waiting
                              ? const ProductCardSkeleton()
                              : ProductGridCard(product: related[index]),
                        ),
                    ],
                  ),
                );
              },
            ),

            const SizedBox(height: AppSpacing.xxl),
          ],
        ),
      ),

      // Fixed action bar
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: palette.surface,
          border: Border(top: BorderSide(color: palette.border)),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
            child: Row(
              children: [
                _QuantityStepper(
                  quantity: _quantity,
                  max: product.stock,
                  onChanged: (value) => setState(() => _quantity = value),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: SizedBox(
                    height: 46,
                    child: OutlinedButton(
                      onPressed: product.isInStock ? () => _addToCart() : null,
                      style: OutlinedButton.styleFrom(
                        backgroundColor: palette.accentSoft,
                        foregroundColor: palette.accent,
                        side: BorderSide(color: palette.accentBorder),
                        padding: EdgeInsets.zero,
                      ),
                      child: const Text('Thêm vào giỏ', maxLines: 1),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: SizedBox(
                    height: 46,
                    child: ElevatedButton(
                      onPressed: product.isInStock ? () => _addToCart(navigateToCheckout: true) : null,
                      style: ElevatedButton.styleFrom(padding: EdgeInsets.zero),
                      child: Text(product.isInStock ? 'Mua ngay' : 'Hết hàng', maxLines: 1),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Khối nền trắng (surface) ngăn cách bằng khoảng nền giữa các phần.
class _Section extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const _Section({required this.child, this.padding = const EdgeInsets.all(AppSpacing.lg)});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 10),
      padding: padding,
      color: context.palette.surface,
      child: child,
    );
  }
}

class _RatingLine extends StatelessWidget {
  final ProductModel product;
  final RatingBreakdownModel? breakdown;

  const _RatingLine({required this.product, required this.breakdown});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final b = breakdown;
    final hasBreakdown = b != null && b.total > 0;
    final average = hasBreakdown ? b.average : product.rating.toDouble();
    final hasRating = hasBreakdown || product.hasRating;

    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: AppSpacing.xs,
      children: [
        if (hasRating) ...[
          Icon(Icons.star_rounded, size: 18, color: palette.star),
          Text(average.toStringAsFixed(1), style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700)),
          if (hasBreakdown) Text('(${b.total} đánh giá)', style: textTheme.bodySmall),
        ] else
          Text('Chưa có đánh giá', style: textTheme.bodySmall?.copyWith(color: palette.textMuted)),
        Text('· Đã bán ${product.sold}', style: textTheme.bodySmall),
      ],
    );
  }
}

class _StockBadge extends StatelessWidget {
  final ProductModel product;

  const _StockBadge({required this.product});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final tone = product.isInStock ? palette.statusCompleted : palette.statusCancelled;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
      decoration: BoxDecoration(color: tone.background, borderRadius: const BorderRadius.all(Radius.circular(AppRadii.sm))),
      child: Text(
        product.isInStock ? 'Còn hàng (${product.stock})' : 'Hết hàng',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: tone.foreground,
              fontWeight: FontWeight.w700,
            ),
      ),
    );
  }
}

/// Tổng quan điểm đánh giá: điểm trung bình + tỉ lệ từng mức sao (từ Backend).
class RatingBreakdownView extends StatelessWidget {
  final RatingBreakdownModel breakdown;

  const RatingBreakdownView({super.key, required this.breakdown});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SizedBox(
          width: 96,
          child: Column(
            children: [
              Text(
                breakdown.average.toStringAsFixed(1),
                style: textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: AppSpacing.xxs),
              _Stars(rating: breakdown.average, size: 14),
              const SizedBox(height: AppSpacing.xs),
              Text('${breakdown.total} đánh giá', style: textTheme.bodySmall),
            ],
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            children: [
              for (var star = 5; star >= 1; star--)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 28,
                        child: Text('$star', style: textTheme.labelSmall, textAlign: TextAlign.end),
                      ),
                      const SizedBox(width: 2),
                      Icon(Icons.star_rounded, size: 12, color: palette.star),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: const BorderRadius.all(Radius.circular(AppRadii.pill)),
                          child: LinearProgressIndicator(
                            value: _ratio(star),
                            minHeight: 6,
                            color: palette.star,
                            backgroundColor: palette.surfaceMuted,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      SizedBox(
                        width: 28,
                        child: Text('${breakdown.counts[star] ?? 0}', style: textTheme.labelSmall),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  double _ratio(int star) {
    final percent = breakdown.percentages[star];
    if (percent != null && percent > 0) return (percent / 100).clamp(0.0, 1.0);
    if (breakdown.total <= 0) return 0;
    return ((breakdown.counts[star] ?? 0) / breakdown.total).clamp(0.0, 1.0);
  }
}

class _Stars extends StatelessWidget {
  final num rating;
  final double size;

  const _Stars({required this.rating, this.size = 14});

  @override
  Widget build(BuildContext context) {
    final color = context.palette.star;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final IconData icon;
        if (rating >= i + 1) {
          icon = Icons.star_rounded;
        } else if (rating > i + 0.25) {
          icon = Icons.star_half_rounded;
        } else {
          icon = Icons.star_border_rounded;
        }
        return Icon(icon, size: size, color: color);
      }),
    );
  }
}

class _ReviewsBody extends StatelessWidget {
  final ProductReviewState state;
  final VoidCallback onRetry;

  const _ReviewsBody({required this.state, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;

    if (state.isLoading && state.reviews.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          ShimmerSkeleton(width: 140, height: 14),
          SizedBox(height: AppSpacing.sm),
          ShimmerSkeleton(width: double.infinity, height: 12),
          SizedBox(height: AppSpacing.lg),
          ShimmerSkeleton(width: 120, height: 14),
          SizedBox(height: AppSpacing.sm),
          ShimmerSkeleton(width: double.infinity, height: 12),
        ],
      );
    }
    if (state.errorMessage != null && state.reviews.isEmpty) {
      return _InlineError(message: state.errorMessage!, onRetry: onRetry);
    }
    if (state.reviews.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        child: Row(
          children: [
            Icon(Icons.chat_bubble_outline_rounded, size: 18, color: palette.textMuted),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Text(
                'Chưa có đánh giá cho sản phẩm này. Hãy là người đầu tiên chia sẻ cảm nhận.',
                style: textTheme.bodySmall,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: state.reviews.length,
      separatorBuilder: (context, index) => const Divider(height: AppSpacing.xl),
      itemBuilder: (context, index) => _ReviewTile(review: state.reviews[index]),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final ReviewModel review;

  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                review.user.fullName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
            ),
            Text(
              Formatters.formatDate(review.createdAt?.toIso8601String()),
              style: textTheme.labelSmall?.copyWith(color: palette.textMuted, fontWeight: FontWeight.w500),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        Row(
          children: [
            _Stars(rating: review.rating),
            if (review.isVerifiedPurchase) ...[
              const SizedBox(width: AppSpacing.sm),
              Icon(Icons.verified_rounded, size: 14, color: palette.success),
              const SizedBox(width: AppSpacing.xxs),
              Text(
                'Đã mua hàng',
                style: textTheme.labelSmall?.copyWith(color: palette.statusCompleted.foreground),
              ),
            ],
          ],
        ),
        const SizedBox(height: 6),
        Text(review.content, style: textTheme.bodyMedium?.copyWith(color: palette.textSecondary)),
        if (review.adminReply != null && review.adminReply!.trim().isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sm),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: palette.surfaceMuted,
              borderRadius: const BorderRadius.all(Radius.circular(AppRadii.sm)),
              border: Border(left: BorderSide(color: palette.primary, width: 3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Phản hồi từ Trường Thành',
                  style: textTheme.labelSmall?.copyWith(color: palette.primaryText, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(review.adminReply!.trim(), style: textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _InlineError extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _InlineError({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Row(
      children: [
        Icon(Icons.error_outline_rounded, size: 18, color: palette.danger),
        const SizedBox(width: AppSpacing.sm),
        Expanded(child: Text(message, style: Theme.of(context).textTheme.bodySmall)),
        TextButton(onPressed: onRetry, child: const Text('Thử lại')),
      ],
    );
  }
}

class _QuantityStepper extends StatelessWidget {
  final int quantity;
  final int max;
  final ValueChanged<int> onChanged;

  const _QuantityStepper({required this.quantity, required this.max, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final enabled = max > 0;
    final canDecrease = enabled && quantity > 1;
    final canIncrease = enabled && quantity < max;
    return Container(
      decoration: BoxDecoration(
        color: palette.surfaceMuted,
        borderRadius: AppRadii.button,
        border: Border.all(color: palette.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: 'Giảm số lượng',
            icon: const Icon(Icons.remove, size: 16),
            constraints: const BoxConstraints(minWidth: 36, minHeight: 40),
            padding: EdgeInsets.zero,
            onPressed: canDecrease ? () => onChanged(quantity - 1) : null,
          ),
          ConstrainedBox(
            constraints: const BoxConstraints(minWidth: 20),
            child: Text(
              enabled ? '$quantity' : '0',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          IconButton(
            tooltip: canIncrease || !enabled ? 'Tăng số lượng' : 'Đã đạt số lượng tồn kho',
            icon: const Icon(Icons.add, size: 16),
            constraints: const BoxConstraints(minWidth: 36, minHeight: 40),
            padding: EdgeInsets.zero,
            onPressed: canIncrease ? () => onChanged(quantity + 1) : null,
          ),
        ],
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
    final palette = context.palette;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: palette.primaryText),
        const SizedBox(width: AppSpacing.xs),
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: palette.textPrimary,
                fontWeight: FontWeight.w700,
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
    final textTheme = Theme.of(context).textTheme;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(label, style: textTheme.bodySmall),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          flex: 3,
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    );
  }
}
