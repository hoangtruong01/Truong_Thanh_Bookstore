import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../models/banner_model.dart';
import '../../../models/category_model.dart';
import '../../../providers/banner_provider.dart';
import '../../../providers/product_provider.dart';
import '../../product/product_detail_screen.dart';
import '../../product/product_list_screen.dart';
import '../deal_hot_screen.dart';

/// Mở trình duyệt ngoài; tách ra để test thay thế được.
typedef ExternalUrlLauncher = Future<bool> Function(Uri uri);

Future<bool> _launchExternal(Uri uri) => launchUrl(uri, mode: LaunchMode.externalApplication);

/// Danh mục khớp theo ID hoặc slug. Trả về null nếu không có — KHÔNG lấy
/// danh mục đầu tiên thay thế.
CategoryModel? findCategoryByIdOrSlug(List<CategoryModel> categories, String idOrSlug) {
  final key = idOrSlug.trim();
  if (key.isEmpty) return null;
  for (final c in categories) {
    if (c.id == key || c.slug == key) return c;
  }
  return null;
}

void openProductList(BuildContext context, {String? categoryId, String? query}) {
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (_) => ProductListScreen(initialCategoryId: categoryId, initialSearchQuery: query),
    ),
  );
}

void openDealHot(BuildContext context) {
  Navigator.push(context, MaterialPageRoute(builder: (_) => const DealHotScreen()));
}

/// Điều hướng theo link banner: route nội bộ của web → màn hình app,
/// link http(s) → trình duyệt ngoài, còn lại bỏ qua.
Future<void> openBannerLink(
  BuildContext context,
  BannerLink link, {
  ExternalUrlLauncher launcher = _launchExternal,
}) async {
  final messenger = ScaffoldMessenger.maybeOf(context);
  switch (link.type) {
    case BannerLinkType.none:
      return;
    case BannerLinkType.dealHot:
      openDealHot(context);
      return;
    case BannerLinkType.productList:
      openProductList(context, query: link.query);
      return;
    case BannerLinkType.category:
      final categories = Provider.of<ProductProvider>(context, listen: false).categories;
      final match = findCategoryByIdOrSlug(categories, link.value ?? '');
      // Backend nhận cả ID lẫn slug cho bộ lọc `category`.
      openProductList(context, categoryId: match?.id ?? link.value, query: link.query);
      return;
    case BannerLinkType.product:
      final navigator = Navigator.of(context);
      final product = await Provider.of<BannerProvider>(context, listen: false)
          .fetchProductByLink(link.value ?? '');
      if (product == null) {
        messenger?.showSnackBar(const SnackBar(content: Text('Không tìm thấy sản phẩm của banner này')));
        return;
      }
      navigator.push(MaterialPageRoute(builder: (_) => ProductDetailScreen(product: product)));
      return;
    case BannerLinkType.external:
      final uri = link.uri;
      if (uri == null) return;
      var opened = false;
      try {
        opened = await launcher(uri);
      } catch (_) {
        opened = false;
      }
      if (!opened) {
        messenger?.showSnackBar(const SnackBar(content: Text('Không thể mở liên kết')));
      }
      return;
  }
}
