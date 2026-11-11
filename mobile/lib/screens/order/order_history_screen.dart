import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/order_status.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/utils/formatters.dart';
import '../../core/widgets/empty_state_widget.dart';
import '../../core/widgets/error_retry_widget.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../models/order_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/order_provider.dart';
import '../auth/login_screen.dart';
import 'order_detail_screen.dart';
import 'widgets/order_widgets.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  /// Below this many matching orders we keep paging so a filter tab is not empty
  /// just because its orders sit on a later page (backend ignores `status`).
  static const int _minVisibleBeforeAutoLoad = 6;

  final _scrollController = ScrollController();
  OrderStatusFilter _filter = OrderStatusFilter.all;
  bool? _loadedAsAuthenticated;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!mounted) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final orderProv = Provider.of<OrderProvider>(context, listen: false);
    final token = auth.token;
    if (auth.isAuthenticated && token != null && token.isNotEmpty) {
      await orderProv.fetchMyOrders(token);
    } else {
      await orderProv.fetchGuestOrders();
    }
  }

  void _loadMore() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final token = auth.token;
    if (!auth.isAuthenticated || token == null || token.isEmpty) return;
    Provider.of<OrderProvider>(context, listen: false).loadMoreMyOrders(token);
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 300) _loadMore();
  }

  void _openLogin() {
    Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final orderProv = Provider.of<OrderProvider>(context);
    final isAuth = auth.isAuthenticated;

    // First build and every login/logout: (re)load the matching list.
    if (_loadedAsAuthenticated != isAuth) {
      _loadedAsAuthenticated = isAuth;
      WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    }

    final all = isAuth ? orderProv.myOrders : orderProv.guestOrders;
    final orders = all.where((o) => _filter.matches(o.orderStatus)).toList();
    final hasMore = isAuth && orderProv.myOrdersHasMore;

    if (isAuth &&
        hasMore &&
        orders.length < _minVisibleBeforeAutoLoad &&
        !orderProv.isLoading &&
        !orderProv.isLoadingMoreMyOrders &&
        orderProv.loadMoreMyOrdersError == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _loadMore();
      });
    }

    return DefaultTabController(
      length: OrderStatusFilter.values.length,
      initialIndex: _filter.index,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Đơn hàng của tôi'),
          actions: [
            IconButton(
              tooltip: 'Tải lại đơn hàng',
              icon: const Icon(Icons.refresh),
              onPressed: orderProv.isLoading ? null : _load,
            ),
          ],
          bottom: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: context.palette.primaryText,
            unselectedLabelColor: context.palette.textSecondary,
            indicatorColor: context.palette.primary,
            labelStyle: Theme.of(context).textTheme.labelLarge,
            unselectedLabelStyle: Theme.of(context).textTheme.bodyLarge,
            onTap: (index) => setState(() => _filter = OrderStatusFilter.values[index]),
            tabs: [for (final f in OrderStatusFilter.values) Tab(text: f.label)],
          ),
        ),
        body: RefreshIndicator(
          onRefresh: _load,
          child: _buildBody(context, orderProv, isAuth, all, orders, hasMore),
        ),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    OrderProvider orderProv,
    bool isAuth,
    List<OrderModel> all,
    List<OrderModel> orders,
    bool hasMore,
  ) {
    if (orderProv.isLoading && all.isEmpty) {
      return ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        itemCount: 4,
        itemBuilder: (context, index) => const OrderItemSkeleton(),
      );
    }

    final error = isAuth ? orderProv.myOrdersError : orderProv.guestOrdersError;
    if (error != null && all.isEmpty) {
      return _Scrollable(child: ErrorRetryWidget(message: error, onRetry: _load));
    }

    if (orders.isEmpty) {
      if (hasMore || orderProv.isLoadingMoreMyOrders) {
        return const _Scrollable(child: Center(child: CircularProgressIndicator()));
      }
      if (!isAuth && all.isEmpty) {
        return _Scrollable(
          child: EmptyStateWidget(
            icon: Icons.receipt_long_outlined,
            title: 'Chưa có đơn hàng trên thiết bị này',
            message: 'Đăng nhập để xem toàn bộ đơn hàng đã đặt bằng tài khoản của bạn.',
            buttonText: 'Đăng nhập ngay',
            onButtonPressed: _openLogin,
          ),
        );
      }
      return _Scrollable(
        child: EmptyStateWidget(
          icon: Icons.receipt_long_outlined,
          title: _filter == OrderStatusFilter.all
              ? 'Bạn chưa có đơn hàng nào'
              : 'Không có đơn hàng ${_filter.label.toLowerCase()}',
          message: _filter == OrderStatusFilter.all
              ? 'Khám phá sách và văn phòng phẩm tại Trường Thành Bookstore.'
              : 'Các đơn hàng phù hợp sẽ hiển thị tại đây.',
        ),
      );
    }

    final footer = _buildFooter(context, orderProv, isAuth, hasMore, error);
    return ListView.separated(
      controller: _scrollController,
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, 96),
      itemCount: orders.length + (footer == null ? 0 : 1),
      separatorBuilder: (context, index) => const SizedBox(height: AppSpacing.md),
      itemBuilder: (context, index) {
        if (index >= orders.length) return footer!;
        final order = orders[index];
        return _OrderCard(
          order: order,
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => OrderDetailScreen(order: order)),
          ),
        );
      },
    );
  }

  Widget? _buildFooter(BuildContext context, OrderProvider orderProv, bool isAuth, bool hasMore, String? error) {
    final text = Theme.of(context).textTheme;
    if (!isAuth && error != null) {
      return Text(error, textAlign: TextAlign.center, style: text.bodySmall);
    }
    if (!isAuth) return null;
    if (orderProv.isLoadingMoreMyOrders) {
      return const Padding(
        padding: EdgeInsets.all(AppSpacing.lg),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    final loadMoreError = orderProv.loadMoreMyOrdersError ?? error;
    if (loadMoreError != null) {
      return Column(
        children: [
          Text(loadMoreError, textAlign: TextAlign.center, style: text.bodySmall),
          TextButton(
            onPressed: hasMore ? _loadMore : _load,
            child: const Text('Thử lại'),
          ),
        ],
      );
    }
    if (!hasMore) return null;
    return Center(
      child: TextButton(onPressed: _loadMore, child: const Text('Xem thêm đơn hàng')),
    );
  }
}

/// Cho phép kéo để tải lại cả khi màn đang trống / lỗi.
class _Scrollable extends StatelessWidget {
  final Widget child;

  const _Scrollable({required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: child,
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final OrderModel order;
  final VoidCallback onTap;

  const _OrderCard({required this.order, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final text = Theme.of(context).textTheme;
    final first = order.items.isNotEmpty ? order.items.first : null;
    final more = order.items.length - 1;

    return Material(
      color: palette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: AppRadii.card,
        side: BorderSide(color: palette.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '#${order.orderCode}',
                      style: text.titleSmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  OrderStatusBadge(
                    label: OrderStatusMeta.orderLabel(order.orderStatus),
                    tone: OrderStatusMeta.orderTone(palette, order.orderStatus),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xs),
              Text('Ngày đặt: ${Formatters.formatDate(order.createdAt)}', style: text.labelSmall),
              if (first != null) ...[
                const Divider(height: AppSpacing.xxl),
                Row(
                  children: [
                    OrderItemThumbnail(imageUrl: first.image),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(first.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: text.labelMedium),
                          const SizedBox(height: AppSpacing.xxs),
                          Text(
                            more > 0 ? 'x${first.quantity} · và $more sản phẩm khác' : 'x${first.quantity}',
                            style: text.labelSmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
              const Divider(height: AppSpacing.xxl),
              Text(
                '${OrderStatusMeta.paymentMethodLabel(order.paymentMethod)} · '
                '${OrderStatusMeta.paymentLabel(order.paymentStatus)}',
                style: text.labelSmall,
              ),
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Expanded(
                    child: Text.rich(
                      TextSpan(children: [
                        TextSpan(text: 'Tổng tiền: ', style: text.bodySmall),
                        TextSpan(
                          text: Formatters.formatCurrency(order.total),
                          style: text.titleMedium?.copyWith(
                            color: palette.primaryText,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ]),
                    ),
                  ),
                  Text('Xem chi tiết', style: text.labelMedium?.copyWith(color: palette.primaryText)),
                  Icon(Icons.chevron_right_rounded, size: 18, color: palette.primaryText),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
