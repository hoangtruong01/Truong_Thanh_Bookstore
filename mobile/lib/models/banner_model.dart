import 'dart:typed_data';

/// Vị trí banner — khớp enum `BannerPosition` của backend
/// (`backend/src/modules/banners/schemas/banner.schema.ts`).
abstract final class BannerPositions {
  static const String mainSlider = 'main_slider';
  static const String sidebarLeft = 'sidebar_left';
  static const String sidebarRightTop = 'sidebar_right_top';
  static const String sidebarRightBottom = 'sidebar_right_bottom';
  static const String bottomRow = 'bottom_row';
}

/// Banner quảng cáo do admin quản lý (GET /banners/active).
class BannerModel {
  final String id;
  final String title;
  final String imageUrl;
  final String linkUrl;
  final String position;
  final int sortOrder;

  BannerModel({
    required this.id,
    required this.title,
    required this.imageUrl,
    this.linkUrl = '',
    this.position = BannerPositions.mainSlider,
    this.sortOrder = 0,
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    String text(List<String> keys) {
      for (final key in keys) {
        final value = json[key];
        if (value is String && value.trim().isNotEmpty) return value.trim();
      }
      return '';
    }

    final rawOrder = json['sortOrder'];
    return BannerModel(
      id: text(['_id', 'id']),
      title: text(['title']),
      // Schema dùng `imageUrl` / `linkUrl`; chấp nhận `image` / `link` cho dữ liệu cũ.
      imageUrl: text(['imageUrl', 'image']),
      linkUrl: text(['linkUrl', 'link']),
      position: text(['position']).isEmpty ? BannerPositions.mainSlider : text(['position']),
      sortOrder: rawOrder is num ? rawOrder.toInt() : int.tryParse('$rawOrder') ?? 0,
    );
  }

  /// Nguồn ảnh đã kiểm tra (null nếu URL rỗng / không hỗ trợ).
  late final BannerImageSource? imageSource = BannerImageSource.of(imageUrl);

  bool get hasImage => imageSource != null;

  late final BannerLink link = BannerLink.parse(linkUrl);
}

/// Ảnh banner có thể là URL http(s) (Cloudinary) hoặc data URI (backend lưu
/// nguyên data URI khi upload Cloudinary lỗi).
class BannerImageSource {
  final Uri? networkUri;
  final UriData? data;

  BannerImageSource._({this.networkUri, this.data});

  bool get isNetwork => networkUri != null;

  /// Byte ảnh của data URI, giải mã một lần.
  late final Uint8List? bytes = data?.contentAsBytes();

  static BannerImageSource? of(String raw) {
    final value = raw.trim();
    if (value.isEmpty) return null;
    final lower = value.toLowerCase();
    if (lower.startsWith('data:image/')) {
      try {
        return BannerImageSource._(data: UriData.parse(value));
      } on FormatException {
        return null;
      }
    }
    final uri = Uri.tryParse(value);
    if (uri != null && (uri.scheme == 'https' || uri.scheme == 'http') && uri.host.isNotEmpty) {
      return BannerImageSource._(networkUri: uri);
    }
    return null;
  }
}

enum BannerLinkType { none, product, category, productList, dealHot, external }

/// Đích đến khi chạm banner, suy ra từ `linkUrl` theo route của web
/// (`/products/:idOrSlug`, `/products?category=...&q=...`, `/deal-hot`).
/// Chỉ mở trình duyệt cho link http(s); mọi scheme khác bị bỏ qua.
class BannerLink {
  final BannerLinkType type;

  /// ID/slug sản phẩm hoặc danh mục.
  final String? value;

  /// Từ khóa tìm kiếm (`q`) cho danh sách sản phẩm.
  final String? query;

  /// URL ngoài (chỉ với [BannerLinkType.external]).
  final Uri? uri;

  const BannerLink._(this.type, {this.value, this.query, this.uri});

  static const BannerLink none = BannerLink._(BannerLinkType.none);

  bool get isNavigable => type != BannerLinkType.none;

  static BannerLink parse(String? raw) {
    final value = raw?.trim() ?? '';
    if (value.isEmpty) return none;

    if (value.startsWith('/') && !value.startsWith('//')) {
      final uri = Uri.tryParse(value);
      return uri == null ? none : _internal(uri);
    }

    final uri = Uri.tryParse(value);
    if (uri != null && (uri.scheme == 'https' || uri.scheme == 'http') && uri.host.isNotEmpty) {
      return BannerLink._(BannerLinkType.external, uri: uri);
    }
    // javascript:, data:, mailto:, tel:, đường dẫn tương đối... đều không mở.
    return none;
  }

  static BannerLink _internal(Uri uri) {
    final segments = uri.pathSegments.where((s) => s.isNotEmpty).toList();
    if (segments.isEmpty) return none;

    if (segments.first == 'products') {
      if (segments.length == 2) {
        return BannerLink._(BannerLinkType.product, value: segments[1]);
      }
      if (segments.length == 1) {
        final category = uri.queryParameters['category']?.trim() ?? '';
        final q = uri.queryParameters['q']?.trim() ?? '';
        if (category.isNotEmpty) {
          return BannerLink._(BannerLinkType.category, value: category, query: q.isEmpty ? null : q);
        }
        return BannerLink._(BannerLinkType.productList, query: q.isEmpty ? null : q);
      }
      return none;
    }

    if (segments.length == 1 && segments.first == 'deal-hot') {
      return const BannerLink._(BannerLinkType.dealHot);
    }
    return none;
  }
}
