import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/shimmer_loading.dart';
import '../../../models/category_model.dart';
import 'home_navigation.dart';
import 'home_section_header.dart';

/// Ảnh minh họa cục bộ theo slug danh mục (chỉ để trang trí, không quyết định
/// danh mục nào được hiển thị). Thứ tự khóa = thứ tự ưu tiên như trang chủ web.
const Map<String, String> featuredCategoryArt = {
  'sach-giao-khoa': 'assets/sgk-bg.jpg',
  'sach-tham-khao': 'assets/sach-tham-khao-bg.png',
  'truyen-tranh': 'assets/truyen-tranh-bg.png',
  'van-phong-pham': 'assets/do-luu-niem-bg.jpg',
  'do-choi': 'assets/do-choi-bg.png',
  'do-luu-niem': 'assets/do-luu-niem-bg.jpg',
  'combo': 'assets/combo-bg.png',
};

class FeaturedCategoryItem {
  final CategoryModel category;
  final String? assetImage;

  const FeaturedCategoryItem({required this.category, this.assetImage});
}

/// Danh mục nổi bật dựng từ danh mục thật của API: chỉ danh mục gốc (không có
/// cha), các slug quen thuộc lên trước theo thứ tự web, còn lại giữ thứ tự server.
List<FeaturedCategoryItem> buildFeaturedCategories(
  List<CategoryModel> categories, {
  int maxItems = 8,
}) {
  final roots = categories
      .where((c) => c.id.isNotEmpty && c.name.trim().isNotEmpty && (c.parentId == null || c.parentId!.isEmpty))
      .toList();
  final priority = featuredCategoryArt.keys.toList();
  int rank(CategoryModel c) {
    final i = priority.indexOf(c.slug);
    return i == -1 ? priority.length : i;
  }

  final indexed = [for (var i = 0; i < roots.length; i++) (i, roots[i])];
  indexed.sort((a, b) {
    final byRank = rank(a.$2).compareTo(rank(b.$2));
    return byRank != 0 ? byRank : a.$1.compareTo(b.$1);
  });

  return indexed
      .take(maxItems)
      .map((e) => FeaturedCategoryItem(category: e.$2, assetImage: featuredCategoryArt[e.$2.slug]))
      .toList();
}

/// Lưới "Danh mục nổi bật" (2 cột).
class FeaturedCategoriesSection extends StatelessWidget {
  final List<CategoryModel> categories;
  final bool isLoading;
  final VoidCallback onRetry;

  /// Load error from the provider; null with an empty list means "no categories yet".
  final String? errorMessage;

  const FeaturedCategoriesSection({
    super.key,
    required this.categories,
    required this.isLoading,
    required this.onRetry,
    this.errorMessage,
  });

  static const _gridDelegate = SliverGridDelegateWithFixedCrossAxisCount(
    crossAxisCount: 2,
    mainAxisExtent: 85,
    mainAxisSpacing: 10,
    crossAxisSpacing: 10,
  );

  @override
  Widget build(BuildContext context) {
    final items = buildFeaturedCategories(categories);

    Widget body;
    if (items.isEmpty && isLoading) {
      body = GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: _gridDelegate,
        itemCount: 4,
        itemBuilder: (context, index) => const ShimmerSkeleton(borderRadius: AppRadii.lg),
      );
    } else if (items.isEmpty) {
      body = _CategoriesUnavailable(onRetry: onRetry, failed: errorMessage != null);
    } else {
      body = GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: _gridDelegate,
        itemCount: items.length,
        itemBuilder: (context, index) => _CategoryCard(item: items[index]),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        HomeSectionHeader(
          icon: Icons.grid_view_rounded,
          title: 'Danh mục nổi bật',
          onSeeAll: () => openProductList(context),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: body,
        ),
      ],
    );
  }
}

class _CategoriesUnavailable extends StatelessWidget {
  final VoidCallback onRetry;
  final bool failed;

  const _CategoriesUnavailable({required this.onRetry, required this.failed});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: AppRadii.card,
        border: Border.all(color: palette.border),
      ),
      child: Row(
        children: [
          Icon(Icons.category_outlined, color: palette.textMuted),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              failed ? 'Chưa tải được danh mục sản phẩm' : 'Cửa hàng chưa có danh mục nào',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: palette.textSecondary),
            ),
          ),
          TextButton(onPressed: onRetry, child: Text(failed ? 'Thử lại' : 'Tải lại')),
        ],
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  final FeaturedCategoryItem item;

  const _CategoryCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    final textTheme = Theme.of(context).textTheme;
    final category = item.category;
    final description = category.description?.trim() ?? '';
    final networkImage = category.image?.trim() ?? '';

    Widget? art;
    if (item.assetImage != null) {
      art = Image.asset(
        item.assetImage!,
        fit: BoxFit.cover,
        alignment: Alignment.centerRight,
        errorBuilder: (ctx, err, stack) => const SizedBox(),
      );
    } else if (networkImage.startsWith('http')) {
      art = CachedNetworkImage(
        imageUrl: networkImage,
        fit: BoxFit.cover,
        errorWidget: (ctx, url, err) => const SizedBox(),
      );
    }

    return Semantics(
      button: true,
      label: 'Danh mục ${category.name}',
      child: Material(
        color: palette.surface,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadii.card,
          side: BorderSide(color: palette.border),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => openProductList(context, categoryId: category.id),
          child: ExcludeSemantics(
            child: Stack(
              children: [
                if (art != null)
                  Positioned(right: -5, top: -5, bottom: -5, width: 90, child: art),
                if (art != null)
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            palette.surface.withValues(alpha: 0.98),
                            palette.surface.withValues(alpha: 0.92),
                            palette.surface.withValues(alpha: 0.2),
                          ],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                          stops: const [0.0, 0.55, 1.0],
                        ),
                      ),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              category.name,
                              maxLines: description.isEmpty ? 2 : 1,
                              overflow: TextOverflow.ellipsis,
                              style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
                            ),
                            if (description.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                description,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: textTheme.labelSmall,
                              ),
                            ],
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right_rounded, color: palette.textMuted, size: 16),
                    ],
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
