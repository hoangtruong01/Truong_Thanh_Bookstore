import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../models/cart_item_model.dart';
import '../../models/checkout_preview_model.dart';
import '../../models/payment_methods_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/notification_provider.dart';
import '../../providers/order_provider.dart';
import '../auth/auth_validators.dart';
import '../auth/login_screen.dart';
import '../cart/widgets/cart_summary_widgets.dart';
import '../cart/widgets/commerce_widgets.dart';
import 'order_success_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  static final RegExp _emailLooksComplete = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$');

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _noteController = TextEditingController();
  final _loyaltyController = TextEditingController();

  String _paymentMethod = PaymentMethodsConfig.methodCod;
  List<dynamic> _addresses = [];
  String? _selectedAddressId;
  bool _submitting = false;
  PricingContext? _lastRequestedContext;
  late final CartProvider _cart;

  @override
  void initState() {
    super.initState();
    _cart = context.read<CartProvider>();
    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated && auth.user != null) {
      _nameController.text = auth.user!.fullName;
      // +84 numbers (accepted by the backend) are shown in the 10-digit 0… form.
      _phoneController.text = Formatters.normalizePhone(auth.user!.phone);
      _emailController.text = auth.user!.email;
    }
    for (final controller in [_phoneController, _emailController, _addressController, _loyaltyController]) {
      controller.addListener(_onPricingInputChanged);
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _requestPricing(immediate: true);
      _loadPaymentMethods();
      if (auth.isAuthenticated) _fetchUserAddresses();
    });
  }

  @override
  void dispose() {
    for (final controller in [
      _nameController,
      _phoneController,
      _emailController,
      _addressController,
      _noteController,
      _loyaltyController,
    ]) {
      controller.dispose();
    }
    // Back on the cart, prices are goods + voucher only (no loyalty / checkout inputs).
    final cart = _cart;
    scheduleMicrotask(() => cart.refreshPricing(context: const PricingContext()));
    super.dispose();
  }

  bool get _isAuthenticated => Provider.of<AuthProvider>(context, listen: false).isAuthenticated;

  // ---------------------------------------------------------------------------
  // Pricing inputs (checkout-preview). Phone/email are sent only once complete.
  // ---------------------------------------------------------------------------
  bool get _loyaltyInputInvalid {
    final raw = _loyaltyController.text.trim();
    if (raw.isEmpty) return false;
    final value = int.tryParse(raw);
    return value == null || value < 0;
  }

  int get _loyaltyPointsRequested {
    if (!_isAuthenticated || _loyaltyInputInvalid) return 0;
    final loyalty = _cart.loyalty;
    if (loyalty != null && !loyalty.canRedeem) return 0;
    return int.tryParse(_loyaltyController.text.trim()) ?? 0;
  }

  String? get _loyaltyError {
    if (_loyaltyInputInvalid) return 'Số điểm phải là số nguyên dương';
    if (_loyaltyPointsRequested <= 0) return null;
    return _cart.loyalty?.error;
  }

  PricingContext _buildPricingContext() {
    final phone = _phoneController.text.trim();
    final email = _emailController.text.trim();
    final points = _loyaltyPointsRequested;
    return PricingContext(
      loyaltyPointsUsed: points > 0 ? points : null,
      phone: Formatters.isValidPhone(phone) ? phone : null,
      customerEmail: _emailLooksComplete.hasMatch(email) ? email : null,
      shippingAddress: _addressController.text,
      paymentMethod: _paymentMethod,
    );
  }

  Future<CheckoutPreview?> _requestPricing({bool immediate = false}) {
    final pricingContext = _buildPricingContext();
    _lastRequestedContext = pricingContext;
    return _cart.refreshPricing(context: pricingContext, immediate: immediate);
  }

  void _onPricingInputChanged() {
    if (!mounted) return;
    final next = _buildPricingContext();
    if (next != _lastRequestedContext) _requestPricing();
    setState(() {}); // loyalty validation text
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  Future<void> _loadPaymentMethods() async {
    final orders = context.read<OrderProvider>();
    await orders.fetchPaymentMethods();
    if (!mounted) return;
    final available = orders.paymentMethods.availableFor(isAuthenticated: _isAuthenticated);
    if (!available.contains(_paymentMethod)) {
      setState(() => _paymentMethod = available.isNotEmpty ? available.first : PaymentMethodsConfig.methodCod);
      _onPricingInputChanged();
    }
  }

  Future<void> _fetchUserAddresses() async {
    final auth = context.read<AuthProvider>();
    final api = context.read<ApiClient>();
    if (!auth.isAuthenticated || auth.token == null) return;
    try {
      final res = await api.get(ApiConstants.addresses, token: auth.token);
      if (res.statusCode == 200 && mounted) {
        final list = res.listData().whereType<Map>().toList();
        _addresses = list;
        if (_addresses.isNotEmpty) {
          final defaultAddr = _addresses.firstWhere((a) => a['isDefault'] == true, orElse: () => _addresses.first);
          _selectedAddressId = defaultAddr['_id'];
          _applyAddress(defaultAddr);
        }
        setState(() {});
      }
    } catch (_) {
      // Address book is optional; the form stays editable.
    }
  }

  void _applyAddress(Map<dynamic, dynamic> addr) {
    _nameController.text = '${addr['recipientName'] ?? ''}';
    _phoneController.text = Formatters.normalizePhone('${addr['phone'] ?? ''}');
    _addressController.text = '${addr['detail']}, ${addr['ward']}, ${addr['district']}, ${addr['province']}';
  }

  // ---------------------------------------------------------------------------
  // Stock checks from the server preview
  // ---------------------------------------------------------------------------
  int? _availableStock(CartItemModel item) {
    final line = _cart.previewItem(item.product.id);
    if (line != null) return line.stock;
    final missing = _cart.pricing?.unavailableFor(item.product.id);
    if (missing != null) return missing.reason == 'OUT_OF_STOCK' ? missing.stock : 0;
    return null;
  }

  bool _hasStockIssue(CartItemModel item) {
    if (_cart.pricing?.unavailableFor(item.product.id) != null) return true;
    final stock = _availableStock(item);
    return stock != null && (stock <= 0 || stock < item.quantity);
  }

  void _adjustItem(CartItemModel item) {
    final max = _availableStock(item) ?? 0;
    if (max <= 0) {
      _cart.removeItem(item.product.id);
      _snack('Đã xóa sản phẩm hết hàng khỏi giỏ hàng.');
    } else {
      _cart.setQuantity(item.product.id, max);
      _snack('Đã điều chỉnh số lượng về $max theo tồn kho.');
    }
  }

  void _snack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  Future<void> _submitOrder() async {
    if (_submitting) return;
    final cart = _cart;
    final checkoutItems = cart.selectedItems;
    if (checkoutItems.any(_hasStockIssue)) {
      _snack('Vui lòng điều chỉnh số lượng hoặc bỏ chọn sản phẩm hết hàng trước khi đặt.');
      return;
    }
    final loyaltyError = _loyaltyError;
    if (loyaltyError != null) {
      _snack(loyaltyError);
      return;
    }
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final orderProv = context.read<OrderProvider>();
    setState(() => _submitting = true);
    try {
      // Re-price right now and stop if anything changed or is invalid.
      final totalShown = cart.total;
      final fresh = await _requestPricing(immediate: true);
      if (!mounted) return;
      if (fresh == null) {
        _snack(cart.pricingError ?? 'Không thể cập nhật giá. Vui lòng thử lại.');
        return;
      }
      if (!fresh.isValidForCheckout) {
        _snack(fresh.warnings.isNotEmpty ? fresh.warnings.join(' | ') : 'Đơn hàng chưa hợp lệ, vui lòng kiểm tra lại.');
        return;
      }
      if (fresh.total != totalShown) {
        _snack('Tổng thanh toán vừa được cập nhật. Vui lòng kiểm tra lại trước khi đặt hàng.');
        return;
      }

      final points = _loyaltyPointsRequested;
      final createdOrder = await orderProv.placeOrder(
        items: cart.items,
        fullName: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        email: _emailController.text.trim(),
        address: _addressController.text.trim(),
        note: _noteController.text.trim(),
        paymentMethod: _paymentMethod,
        promotionCode: cart.appliedPromotion?.code,
        loyaltyPointsUsed: points > 0 ? points : null,
        token: auth.token,
      );
      if (createdOrder == null || !mounted) return;

      if (auth.isAuthenticated) {
        // Redeemed points and the order notification are server-side changes: refresh both.
        unawaited(auth.refreshProfile());
        unawaited(context.read<NotificationProvider>().fetchUnreadCount(auth.token));
      }

      final action = orderProv.lastPaymentAction;
      final redirectUrl = action?['redirectUrl'] is String ? action!['redirectUrl'] as String : null;
      final instructions = action?['instructions'] is String ? action!['instructions'] as String : null;
      if (PaymentMethodsConfig.isOnlineGateway(_paymentMethod) && redirectUrl != null) {
        final uri = Uri.tryParse(redirectUrl);
        if (uri != null) {
          try {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          } catch (_) {
            // The success screen offers a button to reopen the payment page.
          }
        }
      }
      if (!mounted) return;

      final data = OrderSuccessData(
        orderId: createdOrder.id,
        orderCode: createdOrder.orderCode,
        total: createdOrder.total > 0 ? createdOrder.total : fresh.total,
        recipientName: _nameController.text.trim(),
        recipientPhone: _phoneController.text.trim(),
        address: _addressController.text.trim(),
        paymentMethod: _paymentMethod,
        bankTransfer: orderProv.paymentMethods.bankTransfer,
        paymentRedirectUrl: redirectUrl,
        paymentInstructions: instructions,
        paymentError: orderProv.lastPaymentError,
      );
      // Only selected items were ordered; unselected ones stay in the cart.
      cart.removeOrderedItems();
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => OrderSuccessScreen(data: data)));
    } catch (e) {
      if (mounted) _snack(e.toString().replaceAll('Exception: ', '').replaceAll('Bad state: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final orderProv = context.watch<OrderProvider>();
    final auth = context.watch<AuthProvider>();
    final checkoutItems = cart.selectedItems;
    final hasStockIssues = checkoutItems.any(_hasStockIssue);
    final busy = _submitting || orderProv.isLoading;
    final phone = _phoneController.text.trim();
    final phoneInvalid = phone.isNotEmpty && !Formatters.isValidPhone(phone);
    final paymentAvailable = orderProv.paymentMethods
        .availableFor(isAuthenticated: auth.isAuthenticated)
        .contains(_paymentMethod);

    final String ctaLabel;
    if (hasStockIssues) {
      ctaLabel = 'Vui lòng xử lý tồn kho';
    } else if (!orderProv.paymentMethodsLoading && !paymentAvailable) {
      ctaLabel = 'Chưa có phương thức thanh toán phù hợp';
    } else if (busy) {
      ctaLabel = 'Đang xử lý đặt hàng...';
    } else if (cart.pricingError != null) {
      ctaLabel = 'Không thể cập nhật giá';
    } else if (checkoutItems.isNotEmpty && !cart.isPricingReady) {
      ctaLabel = 'Đang cập nhật giá...';
    } else {
      ctaLabel = 'Xác nhận đặt hàng';
    }
    final canSubmit = !busy &&
        checkoutItems.isNotEmpty &&
        !hasStockIssues &&
        cart.isPricingReady &&
        !phoneInvalid &&
        paymentAvailable &&
        !orderProv.paymentMethodsLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('Thanh toán đơn hàng')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            _buildShippingCard(context),
            const SizedBox(height: AppSpacing.lg),
            _buildPaymentCard(context, orderProv, auth.isAuthenticated),
            const SizedBox(height: AppSpacing.lg),
            _buildItemsCard(context, cart, checkoutItems),
            const SizedBox(height: AppSpacing.lg),
            const VoucherCard(),
            if (auth.isAuthenticated && cart.loyalty != null && cart.loyalty!.availablePoints > 0) ...[
              const SizedBox(height: AppSpacing.lg),
              _buildLoyaltyCard(context, cart.loyalty!),
            ],
            const SizedBox(height: AppSpacing.lg),
            CommerceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const CommerceSectionTitle('Chi phí đơn hàng'),
                  const SizedBox(height: AppSpacing.sm),
                  if (cart.warnings.isNotEmpty) ...[
                    NoticeBanner(
                      tone: NoticeTone.warning,
                      title: 'Thông báo cập nhật từ hệ thống',
                      messages: cart.warnings,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                  ],
                  CartPricingSummary(
                    totalLabel: 'Tổng thanh toán',
                    showLoyalty: true,
                    onRetry: () => _requestPricing(immediate: true),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            SizedBox(
              height: 52,
              child: ElevatedButton(
                key: const ValueKey('checkout-submit'),
                onPressed: canSubmit ? _submitOrder : null,
                child: busy
                    ? Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(color: context.palette.onPrimary, strokeWidth: 2),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Text(ctaLabel),
                        ],
                      )
                    : Text(ctaLabel),
              ),
            ),
            const SizedBox(height: AppSpacing.xxxl),
          ],
        ),
      ),
    );
  }

  Widget _buildShippingCard(BuildContext context) {
    final palette = context.palette;
    return CommerceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CommerceSectionTitle('Thông tin giao nhận'),
          const SizedBox(height: AppSpacing.md),
          if (_addresses.isNotEmpty) ...[
            DropdownButtonFormField<String>(
              initialValue: _selectedAddressId,
              isExpanded: true,
              decoration: InputDecoration(
                labelText: 'Chọn nhanh từ sổ địa chỉ',
                prefixIcon: Icon(Icons.bookmark_outline, color: palette.primaryText),
              ),
              items: _addresses.map<DropdownMenuItem<String>>((addr) {
                final label = addr['label'] ?? 'Địa chỉ';
                final isDef = addr['isDefault'] == true ? ' (mặc định)' : '';
                final name = addr['recipientName'] ?? '';
                return DropdownMenuItem<String>(
                  value: addr['_id'],
                  child: Text('$label$isDef - $name (${addr['phone']})',
                      overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodyMedium),
                );
              }).toList(),
              onChanged: (val) {
                _selectedAddressId = val;
                final selected = _addresses.firstWhere((a) => a['_id'] == val, orElse: () => null);
                // Setting the fields notifies the pricing listeners; rebuild afterwards.
                if (selected is Map) _applyAddress(selected);
                setState(() {});
              },
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          TextFormField(
            controller: _nameController,
            textInputAction: TextInputAction.next,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập họ và tên' : null,
            decoration: const InputDecoration(labelText: 'Họ và tên người nhận', prefixIcon: Icon(Icons.person_outline)),
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
            validator: AuthValidators.requiredPhone,
            decoration: const InputDecoration(labelText: 'Số điện thoại', prefixIcon: Icon(Icons.phone_outlined)),
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Vui lòng nhập email';
              if (!_emailLooksComplete.hasMatch(v.trim())) return 'Email không hợp lệ';
              return null;
            },
            decoration: const InputDecoration(labelText: 'Địa chỉ email', prefixIcon: Icon(Icons.email_outlined)),
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _addressController,
            maxLength: 255,
            validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập địa chỉ giao hàng' : null,
            decoration: const InputDecoration(
              labelText: 'Địa chỉ nhận hàng chi tiết',
              prefixIcon: Icon(Icons.location_on_outlined),
              counterText: '',
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          TextFormField(
            controller: _noteController,
            maxLines: 2,
            maxLength: 500,
            decoration: const InputDecoration(
              labelText: 'Ghi chú đơn hàng (không bắt buộc)',
              prefixIcon: Icon(Icons.note_alt_outlined),
              counterText: '',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentCard(BuildContext context, OrderProvider orderProv, bool isAuthenticated) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final config = orderProv.paymentMethods;
    final available = config.availableFor(isAuthenticated: isAuthenticated);
    final hiddenOnline = !isAuthenticated && config.methods.any((m) => m != PaymentMethodsConfig.methodCod);

    return CommerceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const CommerceSectionTitle('Phương thức thanh toán'),
          const SizedBox(height: AppSpacing.sm),
          if (orderProv.paymentMethodsLoading)
            const Column(
              children: [
                ShimmerSkeleton(height: 56, borderRadius: AppRadii.md),
                SizedBox(height: AppSpacing.sm),
                ShimmerSkeleton(height: 56, borderRadius: AppRadii.md),
              ],
            )
          else if (available.isEmpty)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isAuthenticated
                      ? 'Hiện chưa có phương thức thanh toán khả dụng. Vui lòng thử lại sau.'
                      : 'Phương thức thanh toán hiện chỉ dành cho tài khoản đã đăng nhập.',
                  style: textTheme.bodySmall,
                ),
                if (!isAuthenticated) ...[
                  const SizedBox(height: AppSpacing.sm),
                  OutlinedButton.icon(
                    key: const ValueKey('checkout-login'),
                    onPressed: () => Navigator.of(context)
                        .push(MaterialPageRoute(builder: (_) => const LoginScreen()))
                        .then((_) => _loadPaymentMethods()),
                    icon: const Icon(Icons.login_rounded, size: 18),
                    label: const Text('Đăng nhập để thanh toán'),
                  ),
                ],
              ],
            )
          else
            RadioGroup<String>(
              groupValue: _paymentMethod,
              onChanged: (val) {
                if (val == null || busyLocked) return;
                setState(() => _paymentMethod = val);
                _onPricingInputChanged();
              },
              child: Column(
                children: [
                  for (final method in available)
                    RadioListTile<String>(
                      value: method,
                      contentPadding: EdgeInsets.zero,
                      activeColor: palette.primary,
                      title: Text(paymentMethodLabel(method),
                          style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700)),
                      subtitle: Text(paymentMethodCopy[method]?.description ?? '', style: textTheme.bodySmall),
                    ),
                ],
              ),
            ),
          if (hiddenOnline) ...[
            const SizedBox(height: AppSpacing.xs),
            Text('Đăng nhập để thanh toán trực tuyến (chuyển khoản, VNPay, MoMo).', style: textTheme.labelSmall),
          ],
        ],
      ),
    );
  }

  bool get busyLocked => _submitting;

  Widget _buildItemsCard(BuildContext context, CartProvider cart, List<CartItemModel> checkoutItems) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    return CommerceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CommerceSectionTitle('Sản phẩm (${checkoutItems.length})'),
          const SizedBox(height: AppSpacing.sm),
          if (checkoutItems.isEmpty)
            Text('Chưa có sản phẩm nào được chọn.', style: textTheme.bodySmall),
          for (final item in checkoutItems)
            Builder(builder: (context) {
              final unit = cart.unitPrice(item);
              final line = cart.previewItem(item.product.id);
              final issue = _hasStockIssue(item);
              final stock = _availableStock(item);
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs + 2),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text('${item.product.name} x${item.quantity}',
                              maxLines: 2, overflow: TextOverflow.ellipsis, style: textTheme.bodyMedium),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        if (line != null)
                          Text(Formatters.formatCurrency(line.subtotal),
                              style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700))
                        else if (cart.pricingLoading)
                          const ShimmerSkeleton(width: 64, height: 14)
                        else
                          Text(Formatters.formatCurrency(unit.price),
                              style: textTheme.bodySmall?.copyWith(color: palette.textMuted)),
                      ],
                    ),
                    if (issue)
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              stock == null || stock <= 0
                                  ? 'Sản phẩm đã hết hàng hoặc ngừng kinh doanh'
                                  : 'Chỉ còn $stock sản phẩm trong kho',
                              style: textTheme.labelSmall?.copyWith(color: palette.danger),
                            ),
                          ),
                          TextButton(
                            onPressed: () => _adjustItem(item),
                            child: Text(stock == null || stock <= 0 ? 'Xóa khỏi giỏ' : 'Điều chỉnh'),
                          ),
                        ],
                      ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildLoyaltyCard(BuildContext context, CheckoutPreviewLoyalty loyalty) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final tone = palette.statusPending;
    final error = _loyaltyError;

    Widget content;
    if (loyalty.availablePoints < loyalty.minRedeemPoints) {
      content = Text(
        'Bạn cần tối thiểu ${loyalty.minRedeemPoints} điểm để quy đổi (hiện có ${loyalty.availablePoints} điểm).',
        style: textTheme.bodySmall,
      );
    } else if (!loyalty.canRedeem) {
      content = Text(
        'Đơn hàng từ ${Formatters.formatCurrency(loyalty.minSubtotalToRedeem)} mới có thể dùng điểm '
        '(tối đa ${loyalty.maxRedeemPercent}% giá trị đơn).',
        style: textTheme.bodySmall,
      );
    } else {
      content = Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextField(
                  key: const ValueKey('loyalty-points-input'),
                  controller: _loyaltyController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: InputDecoration(
                    isDense: true,
                    hintText: 'Số điểm muốn dùng (tối thiểu ${loyalty.minRedeemPoints})',
                    errorText: error,
                    errorMaxLines: 2,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              OutlinedButton(
                onPressed: () {
                  if (loyalty.canRedeem && loyalty.maxRedeemablePoints > 0) {
                    _loyaltyController.text = '${loyalty.maxRedeemablePoints}';
                  } else {
                    _snack('Đơn hàng hoặc số dư điểm chưa đủ điều kiện quy đổi');
                  }
                },
                child: const Text('Tối đa'),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '1 điểm = ${Formatters.formatCurrency(loyalty.pointValue)}. Tối đa ${loyalty.maxRedeemPercent}% giá trị đơn '
            '(tối đa ${loyalty.maxRedeemablePoints} điểm = '
            '${Formatters.formatCurrency(loyalty.maxRedeemablePoints * loyalty.pointValue)}).',
            style: textTheme.labelSmall,
          ),
        ],
      );
    }

    return CommerceCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CommerceSectionTitle(
            'Điểm thưởng tích lũy',
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xxs),
              decoration: BoxDecoration(
                color: tone.background,
                borderRadius: const BorderRadius.all(Radius.circular(AppRadii.pill)),
              ),
              child: Text('Có ${loyalty.availablePoints} điểm',
                  style: textTheme.labelSmall?.copyWith(color: tone.foreground, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          content,
        ],
      ),
    );
  }
}
