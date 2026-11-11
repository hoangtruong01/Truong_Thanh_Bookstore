import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/widgets/empty_state_widget.dart';
import '../../core/widgets/error_retry_widget.dart';
import '../../core/widgets/product_grid_card.dart';
import '../../core/widgets/shimmer_loading.dart';
import '../../providers/product_provider.dart';

const _gridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
  crossAxisCount: 2,
  childAspectRatio: 0.64,
  crossAxisSpacing: AppSpacing.md,
  mainAxisSpacing: AppSpacing.md,
);

/// Khoảng trống cuối danh sách để không bị thanh điều hướng nổi che mất.
const _bottomInset = 96.0;

class ProductListScreen extends StatefulWidget {
  final String? initialCategoryId;
  final String? initialSearchQuery;

  const ProductListScreen({
    super.key,
    this.initialCategoryId,
    this.initialSearchQuery,
  });

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late final ProductCatalog _catalog;

  @override
  void initState() {
    super.initState();
    final products = Provider.of<ProductProvider>(context, listen: false);
    _catalog = products.createCatalog();
    final initialQuery = widget.initialSearchQuery?.trim() ?? '';
    if (initialQuery.isNotEmpty) _searchController.text = initialQuery;
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _catalog.load(
        categoryId: widget.initialCategoryId,
        query: initialQuery.isEmpty ? null : initialQuery,
      );
      if (products.categories.isEmpty) products.fetchCategories();
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchController.dispose();
    _catalog.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.extentAfter < 600 && _catalog.loadMoreError == null) {
      _catalog.loadMore();
    }
  }

  void _clearSearch() {
    _searchController.clear();
    _catalog.searchNow('');
  }

  Future<void> _openSortSheet() async {
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => _SortSheet(current: _catalog.sortBy),
    );
    if (selected != null && selected != _catalog.sortBy) {
      _catalog.setSortBy(selected);
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final productProvider = Provider.of<ProductProvider>(context);

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: const Text('Danh sách sản phẩm'),
        actions: [
          IconButton(
            tooltip: 'Bộ lọc nâng cao',
            icon: const Icon(Icons.filter_list),
            onPressed: () => _scaffoldKey.currentState?.openEndDrawer(),
          ),
        ],
      ),
      endDrawer: _FilterDrawer(catalog: _catalog),
      body: ListenableBuilder(
        listenable: _catalog,
        builder: (context, _) {
          final catalog = _catalog;
          return Column(
            children: [
              // Search input & filter shortcut
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.md),
                child: Row(
                  children: [
                    Expanded(
                      child: ValueListenableBuilder<TextEditingValue>(
                        valueListenable: _searchController,
                        builder: (context, value, _) => TextField(
                          controller: _searchController,
                          textInputAction: TextInputAction.search,
                          onChanged: catalog.setSearchQuery,
                          onSubmitted: catalog.searchNow,
                          decoration: InputDecoration(
                            hintText: 'Tìm sách, bút, sổ tay, giấy A4...',
                            prefixIcon: const Icon(Icons.search),
                            suffixIcon: value.text.isNotEmpty
                                ? IconButton(
                                    tooltip: 'Xóa từ khóa',
                                    icon: const Icon(Icons.clear),
                                    onPressed: _clearSearch,
                                  )
                                : null,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Badge(
                      isLabelVisible: catalog.hasActiveFilters,
                      smallSize: 10,
                      backgroundColor: palette.primary,
                      child: Material(
                        color: palette.surfaceMuted,
                        shape: RoundedRectangleBorder(
                          borderRadius: AppRadii.button,
                          side: BorderSide(color: palette.border),
                        ),
                        child: InkWell(
                          borderRadius: AppRadii.button,
                          onTap: () => _scaffoldKey.currentState?.openEndDrawer(),
                          child: SizedBox(
                            height: 48,
                            width: 48,
                            child: Icon(Icons.tune, color: palette.primaryText, size: 20),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Categories filter chips
              if (productProvider.categories.isNotEmpty)
                SizedBox(
                  height: 40,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                    itemCount: productProvider.categories.length + 1,
                    separatorBuilder: (context, index) => const SizedBox(width: AppSpacing.sm),
                    itemBuilder: (context, index) {
                      if (index == 0) {
                        return ChoiceChip(
                          label: const Text('Tất cả'),
                          selected: catalog.selectedCategory == null,
                          onSelected: (_) => catalog.selectCategory(null),
                        );
                      }
                      final cat = productProvider.categories[index - 1];
                      return ChoiceChip(
                        label: Text(cat.name),
                        selected: catalog.selectedCategory == cat.id,
                        onSelected: (_) => catalog.selectCategory(cat.id),
                      );
                    },
                  ),
                ),

              // Result count + sort control
              Padding(
                padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.sm, 0),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        catalog.hasLoaded && catalog.errorMessage == null
                            ? '${catalog.total} sản phẩm'
                            : '',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    TextButton.icon(
                      onPressed: _openSortSheet,
                      icon: const Icon(Icons.swap_vert_rounded, size: 18),
                      label: Text(
                        productSortOptions
                            .firstWhere((o) => o.value == catalog.sortBy,
                                orElse: () => productSortOptions.first)
                            .label,
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: palette.primaryText,
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                    ),
                  ],
                ),
              ),

              Expanded(child: _buildResults(catalog)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildResults(ProductCatalog catalog) {
    if (catalog.isLoading || !catalog.hasLoaded) {
      return GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, _bottomInset),
        gridDelegate: _gridDelegate,
        itemCount: 6,
        itemBuilder: (context, index) => const ProductCardSkeleton(),
      );
    }

    if (catalog.errorMessage != null) {
      return SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: _bottomInset),
        child: ErrorRetryWidget(
          message: catalog.errorMessage!,
          onRetry: catalog.refresh,
        ),
      );
    }

    if (catalog.items.isEmpty) {
      final canReset = catalog.searchQuery.isNotEmpty || catalog.hasActiveFilters ||
          catalog.selectedCategory != null;
      return SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: _bottomInset),
        child: EmptyStateWidget(
          icon: Icons.search_off_rounded,
          title: 'Không tìm thấy sản phẩm phù hợp',
          message: 'Thử từ khóa khác hoặc bỏ bớt bộ lọc để xem thêm sản phẩm.',
          buttonText: canReset ? 'Xóa tìm kiếm và bộ lọc' : null,
          onButtonPressed: canReset
              ? () {
                  _searchController.clear();
                  catalog.resetAll();
                }
              : null,
        ),
      );
    }

    final items = catalog.items;
    return RefreshIndicator(
      onRefresh: catalog.refresh,
      child: CustomScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, 0),
            sliver: SliverGrid(
              gridDelegate: _gridDelegate,
              delegate: SliverChildBuilderDelegate(
                (context, index) => ProductGridCard(product: items[index]),
                childCount: items.length,
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, _bottomInset),
            sliver: SliverToBoxAdapter(child: _ListFooter(catalog: catalog)),
          ),
        ],
      ),
    );
  }
}

class _ListFooter extends StatelessWidget {
  final ProductCatalog catalog;

  const _ListFooter({required this.catalog});

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    if (catalog.isLoadingMore) {
      return const Center(
        child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.5)),
      );
    }
    if (catalog.loadMoreError != null) {
      return Column(
        children: [
          Text(catalog.loadMoreError!, textAlign: TextAlign.center, style: textTheme.bodySmall),
          TextButton.icon(
            onPressed: catalog.loadMore,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Thử lại'),
          ),
        ],
      );
    }
    if (catalog.hasMore) {
      // Màn hình chưa đủ dài để cuộn: cho phép tải tiếp bằng tay.
      return Center(
        child: TextButton(
          onPressed: catalog.loadMore,
          child: const Text('Xem thêm sản phẩm'),
        ),
      );
    }
    return Center(
      child: Text('Đã hiển thị tất cả sản phẩm', style: textTheme.bodySmall),
    );
  }
}

class _SortSheet extends StatelessWidget {
  final String current;

  const _SortSheet({required this.current});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.xl, 0, AppSpacing.xl, AppSpacing.sm),
            child: Text('Sắp xếp theo', style: textTheme.titleMedium),
          ),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: [
                for (final option in productSortOptions)
                  ListTile(
                    title: Text(
                      option.label,
                      style: textTheme.bodyLarge?.copyWith(
                        color: option.value == current ? palette.primaryText : palette.textPrimary,
                        fontWeight: option.value == current ? FontWeight.w700 : FontWeight.w500,
                      ),
                    ),
                    trailing: option.value == current
                        ? Icon(Icons.check_rounded, color: palette.primaryText)
                        : null,
                    onTap: () => Navigator.pop(context, option.value),
                  ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
        ],
      ),
    );
  }
}

/// Bộ lọc nâng cao (thương hiệu, đánh giá, khoảng giá, còn hàng).
/// Giá trị nháp chỉ áp dụng khi bấm "Áp dụng".
class _FilterDrawer extends StatefulWidget {
  final ProductCatalog catalog;

  const _FilterDrawer({required this.catalog});

  @override
  State<_FilterDrawer> createState() => _FilterDrawerState();
}

class _FilterDrawerState extends State<_FilterDrawer> {
  static const _brands = ['Thiên Long', 'Bến Nghé', 'Hồng Hà', 'Deli', 'Casio', 'Pentel'];
  static const _ratings = [5.0, 4.0, 3.0];

  late final TextEditingController _minPriceController;
  late final TextEditingController _maxPriceController;
  String? _selectedBrand;
  double? _minRating;
  bool _onlyInStock = false;

  @override
  void initState() {
    super.initState();
    final c = widget.catalog;
    _minPriceController = TextEditingController(text: _priceText(c.minPrice));
    _maxPriceController = TextEditingController(text: _priceText(c.maxPrice));
    _selectedBrand = c.selectedBrand;
    _minRating = c.minRating;
    _onlyInStock = c.onlyInStock;
  }

  static String _priceText(double? value) => value == null ? '' : value.toInt().toString();

  @override
  void dispose() {
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final sectionStyle = textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700);

    return Drawer(
      backgroundColor: palette.surface,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Bộ lọc nâng cao', style: textTheme.titleMedium),
                  IconButton(
                    tooltip: 'Đóng',
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(),
              Expanded(
                child: ListView(
                  children: [
                    const SizedBox(height: AppSpacing.md),
                    Text('Thương hiệu', style: sectionStyle),
                    const SizedBox(height: AppSpacing.sm),
                    Wrap(
                      spacing: AppSpacing.sm,
                      runSpacing: AppSpacing.xs,
                      children: [
                        for (final brand in _brands)
                          ChoiceChip(
                            label: Text(brand),
                            selected: _selectedBrand == brand,
                            onSelected: (val) => setState(() => _selectedBrand = val ? brand : null),
                          ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xl),

                    Text('Đánh giá tối thiểu', style: sectionStyle),
                    const SizedBox(height: AppSpacing.sm),
                    Wrap(
                      spacing: AppSpacing.sm,
                      children: [
                        for (final rating in _ratings)
                          ChoiceChip(
                            avatar: Icon(Icons.star_rounded, size: 14, color: palette.star),
                            label: Text('${rating.toInt()} sao'),
                            selected: _minRating == rating,
                            onSelected: (val) => setState(() => _minRating = val ? rating : null),
                          ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.xl),

                    Text('Khoảng giá (VND)', style: sectionStyle),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _minPriceController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                            decoration: const InputDecoration(hintText: 'Tối thiểu'),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: TextField(
                            controller: _maxPriceController,
                            keyboardType: TextInputType.number,
                            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                            decoration: const InputDecoration(hintText: 'Tối đa'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.lg),

                    CheckboxListTile(
                      title: Text('Chỉ hiển thị sản phẩm còn hàng', style: textTheme.bodyMedium),
                      value: _onlyInStock,
                      onChanged: (val) => setState(() => _onlyInStock = val ?? false),
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        _minPriceController.clear();
                        _maxPriceController.clear();
                        setState(() {
                          _selectedBrand = null;
                          _minRating = null;
                          _onlyInStock = false;
                        });
                        widget.catalog.clearFilters();
                        Navigator.pop(context);
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                      ),
                      child: const Text('Xóa bộ lọc'),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        widget.catalog.applyFilters(
                          minPrice: double.tryParse(_minPriceController.text),
                          maxPrice: double.tryParse(_maxPriceController.text),
                          brand: _selectedBrand,
                          minRating: _minRating,
                          onlyInStock: _onlyInStock,
                        );
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                      ),
                      child: const Text('Áp dụng'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
