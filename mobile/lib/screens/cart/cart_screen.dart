import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/empty_state_widget.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../models/cart_item_model.dart';
import '../../models/checkout_preview_model.dart';
import '../../providers/cart_provider.dart';
import '../checkout/checkout_screen.dart';
import 'widgets/cart_summary_widgets.dart';
import 'widgets/commerce_widgets.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  bool _validating = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final cart = context.read<CartProvider>();
      // An empty context: the cart prices goods + voucher only (no checkout inputs).
      cart.refreshPricing(context: const PricingContext(), immediate: true);
      cart.loadPricingPolicy();
      if (cart.activePromotions.isEmpty && !cart.promotionsLoading) cart.fetchActivePromotions();
    });
  }

  void _snack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _confirmAndRun(String title, String message, VoidCallback action) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Xóa')),
        ],
      ),
    );
    if (ok == true && mounted) action();
  }

  Future<void> _proceedToCheckout() async {
    final cart = context.read<CartProvider>();
    if (!cart.hasSelection) {
      _snack('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
      return;
    }
    setState(() => _validating = true);
    final result = await cart.validateCartBeforeCheckout();
    if (!mounted) return;
    setState(() => _validating = false);
    if (result.error != null) {
      _snack(result.error!);
      return;
    }
    if (!result.isValidForCheckout) {
      _snack(result.warnings.isNotEmpty
          ? result.warnings.first
          : 'Một số sản phẩm đã thay đổi tồn kho hoặc giá. Vui lòng kiểm tra lại.');
      return;
    }
    Navigator.push(context, MaterialPageRoute(builder: (_) => const CheckoutScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final textTheme = Theme.of(context).textTheme;

    Widget body;
    if (cart.items.isEmpty && cart.serverSyncing) {
      body = ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: List.generate(
          3,
          (_) => const Padding(
            padding: EdgeInsets.only(bottom: AppSpacing.md),
            child: ShimmerSkeleton(height: 96, borderRadius: AppRadii.lg),
          ),
        ),
      );
    } else if (cart.items.isEmpty) {
      body = const EmptyStateWidget(
        icon: Icons.shopping_bag_outlined,
        title: 'Giỏ hàng đang trống',
        message: 'Khám phá sách và văn phòng phẩm tại Trường Thành rồi thêm vào giỏ nhé.',
      );
    } else {
      body = ListView(
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, 96),
        children: [
          if (cart.warnings.isNotEmpty) ...[
            NoticeBanner(
              tone: NoticeTone.warning,
              title: 'Giỏ hàng vừa được cập nhật',
              messages: cart.warnings,
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          _SelectAllBar(
            cart: cart,
            onRemoveSelected: () => _confirmAndRun(
              'Xóa sản phẩm đã chọn',
              'Bạn có chắc muốn xóa các sản phẩm đã chọn khỏi giỏ hàng?',
              cart.removeSelectedItems,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          for (final item in cart.items) ...[
            _CartItemCard(item: item, cart: cart),
            const SizedBox(height: AppSpacing.md),
          ],
          const SizedBox(height: AppSpacing.sm),
          _FreeShippingCard(cart: cart),
          const SizedBox(height: AppSpacing.lg),
          const VoucherCard(),
          const SizedBox(height: AppSpacing.lg),
          CommerceCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CommerceSectionTitle('Tóm tắt đơn hàng'),
                const SizedBox(height: AppSpacing.sm),
                const CartPricingSummary(totalLabel: 'Tổng tiền'),
                const SizedBox(height: AppSpacing.lg),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: cart.hasSelection && !_validating && !cart.pricingLoading
                        ? _proceedToCheckout
                        : null,
                    child: _validating
                        ? Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: context.palette.onPrimary),
                              ),
                              const SizedBox(width: AppSpacing.sm),
                              const Text('Đang kiểm tra giỏ hàng...'),
                            ],
                          )
                        : const Text('Tiến hành thanh toán'),
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Giỏ hàng của bạn'),
        actions: [
          if (cart.items.isNotEmpty)
            TextButton(
              onPressed: () => _confirmAndRun(
                'Xóa toàn bộ giỏ hàng',
                'Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?',
                cart.clearCart,
              ),
              child: Text('Xóa tất cả', style: textTheme.labelMedium?.copyWith(color: context.palette.primaryText)),
            ),
        ],
      ),
      body: body,
    );
  }
}

class _SelectAllBar extends StatelessWidget {
  final CartProvider cart;
  final VoidCallback onRemoveSelected;

  const _SelectAllBar({required this.cart, required this.onRemoveSelected});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return CommerceCard(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
      child: Row(
        children: [
          Checkbox(
            value: cart.isAllSelected,
            activeColor: palette.primary,
            onChanged: (value) => cart.toggleAllSelection(value ?? false),
          ),
          Expanded(
            child: Text('Chọn tất cả (${cart.items.length} sản phẩm)',
                style: Theme.of(context).textTheme.labelLarge),
          ),
          if (cart.hasSelection)
            TextButton.icon(
              onPressed: onRemoveSelected,
              icon: const Icon(Icons.delete_outline_rounded, size: 18),
              label: const Text('Xóa đã chọn'),
            ),
        ],
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  final CartItemModel item;
  final CartProvider cart;

  const _CartItemCard({required this.item, required this.cart});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final product = item.product;
    final unit = cart.unitPrice(item);
    final unavailable = cart.pricing?.unavailableFor(product.id);
    final atStockLimit = product.stock > 0 && item.quantity >= product.stock;

    return CommerceCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Checkbox(
            value: item.selected,
            activeColor: palette.primary,
            onChanged: (_) => cart.toggleItemSelection(product.id),
          ),
          ClipRRect(
            borderRadius: AppRadii.button,
            child: Container(
              width: 64,
              height: 64,
              color: palette.surfaceMuted,
              child: product.images.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: product.images.first,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => const ShimmerSkeleton(),
                      errorWidget: (_, __, ___) => Icon(Icons.menu_book_rounded, color: palette.textMuted),
                    )
                  : Icon(Icons.menu_book_rounded, color: palette.textMuted),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        product.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Xóa khỏi giỏ',
                      icon: Icon(Icons.close_rounded, size: 18, color: palette.textMuted),
                      onPressed: () => cart.removeItem(product.id),
                    ),
                  ],
                ),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: AppSpacing.xs + 2,
                  children: [
                    Text(
                      Formatters.formatCurrency(unit.price),
                      style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800, color: palette.primaryText),
                    ),
                    if (unit.originalPrice > unit.price)
                      Text(
                        Formatters.formatCurrency(unit.originalPrice),
                        style: textTheme.labelSmall?.copyWith(
                            color: palette.textMuted, decoration: TextDecoration.lineThrough),
                      ),
                    if (!unit.fromServer && item.selected)
                      Text('Giá tạm tính', style: textTheme.labelSmall?.copyWith(color: palette.textMuted)),
                  ],
                ),
                if (unavailable != null)
                  Padding(
                    padding: const EdgeInsets.only(top: AppSpacing.xs),
                    child: Text(
                      unavailable.reason == 'OUT_OF_STOCK' ? 'Sản phẩm đã hết hàng' : 'Sản phẩm hiện không khả dụng',
                      style: textTheme.labelSmall?.copyWith(color: palette.danger),
                    ),
                  ),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  children: [
                    _QtyButton(
                      icon: Icons.remove_rounded,
                      tooltip: 'Giảm số lượng',
                      onTap: () => cart.updateQuantity(product.id, -1),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
                      child: Text('${item.quantity}', style: textTheme.labelLarge),
                    ),
                    _QtyButton(
                      icon: Icons.add_rounded,
                      tooltip: 'Tăng số lượng',
                      onTap: atStockLimit ? null : () => cart.updateQuantity(product.id, 1),
                    ),
                    if (atStockLimit) ...[
                      const SizedBox(width: AppSpacing.sm),
                      Flexible(
                        child: Text('Tối đa ${product.stock}', style: textTheme.labelSmall),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback? onTap;

  const _QtyButton({required this.icon, required this.tooltip, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    // 36x36 visual, 48x48 hit area (padded tap target).
    return IconButton(
      tooltip: tooltip,
      onPressed: onTap,
      iconSize: 18,
      padding: EdgeInsets.zero,
      constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
      style: IconButton.styleFrom(
        tapTargetSize: MaterialTapTargetSize.padded,
        minimumSize: const Size(36, 36),
        backgroundColor: palette.surfaceMuted,
        disabledBackgroundColor: palette.surfaceMuted,
        foregroundColor: palette.textPrimary,
        disabledForegroundColor: palette.textMuted,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(AppRadii.sm))),
      ),
      icon: Icon(icon),
    );
  }
}

class _FreeShippingCard extends StatelessWidget {
  final CartProvider cart;

  const _FreeShippingCard({required this.cart});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final threshold = cart.freeShippingThreshold;
    final hasPricing = cart.pricing != null;
    final free = cart.isFreeShipping;

    final String message;
    if (hasPricing && free) {
      message = 'Đơn hàng của bạn đã được miễn phí vận chuyển.';
    } else if (hasPricing && cart.subtotal > 0) {
      message = 'Mua thêm ${Formatters.formatCurrency(cart.amountNeededForFreeShipping)} để được miễn phí vận chuyển.';
    } else if (threshold != null) {
      message = 'Đơn hàng từ ${Formatters.formatCurrency(threshold)} được miễn phí vận chuyển toàn quốc.';
    } else {
      message = 'Chọn sản phẩm để xem ưu đãi miễn phí vận chuyển.';
    }

    return CommerceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.local_shipping_outlined, size: 20, color: free ? palette.success : palette.primaryText),
              const SizedBox(width: AppSpacing.sm),
              Expanded(child: Text('Miễn phí vận chuyển', style: textTheme.titleSmall)),
              if (threshold != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xxs),
                  decoration: BoxDecoration(
                    color: palette.primarySoft,
                    borderRadius: const BorderRadius.all(Radius.circular(AppRadii.pill)),
                  ),
                  child: Text('Đơn từ ${Formatters.formatCurrency(threshold)}',
                      style: textTheme.labelSmall?.copyWith(color: palette.primaryText)),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ClipRRect(
            borderRadius: const BorderRadius.all(Radius.circular(AppRadii.pill)),
            child: LinearProgressIndicator(
              value: cart.freeShippingProgress,
              minHeight: 8,
              backgroundColor: palette.surfaceMuted,
              valueColor: AlwaysStoppedAnimation<Color>(free ? palette.success : palette.primary),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            message,
            style: textTheme.bodySmall?.copyWith(
              color: free ? palette.statusCompleted.foreground : palette.textSecondary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
