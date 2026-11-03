import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_colors.dart';
import '../theme/app_tokens.dart';

/// Hiệu ứng shimmer dùng chung, lấy màu theo theme hiện tại (Sáng / Tối).
/// Màu của [child] chỉ đóng vai trò mặt nạ — shimmer sẽ tô đè lên.
class _ThemedShimmer extends StatelessWidget {
  final Widget child;

  const _ThemedShimmer({required this.child});

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Shimmer.fromColors(
      baseColor: palette.border,
      highlightColor: palette.background,
      child: child,
    );
  }
}

/// Khối skeleton đơn. Bỏ trống [width] / [height] để co giãn theo cha.
class ShimmerSkeleton extends StatelessWidget {
  final double? width;
  final double? height;
  final double borderRadius;

  const ShimmerSkeleton({
    super.key,
    this.width,
    this.height,
    this.borderRadius = AppRadii.sm,
  });

  @override
  Widget build(BuildContext context) {
    return _ThemedShimmer(
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

class ProductCardSkeleton extends StatelessWidget {
  const ProductCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return _ThemedShimmer(
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 130,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(height: 12, width: 100, color: Colors.white),
                  const SizedBox(height: 8),
                  Container(height: 10, width: 60, color: Colors.white),
                  const SizedBox(height: 12),
                  Container(height: 28, width: double.infinity, color: Colors.white),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProductListSkeleton extends StatelessWidget {
  final int count;
  const ProductListSkeleton({super.key, this.count = 6});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.65,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: count,
      itemBuilder: (context, index) => const ProductCardSkeleton(),
    );
  }
}

/// Khung thẻ (nền + viền theo theme) bọc các khối skeleton dạng danh sách.
class _SkeletonCard extends StatelessWidget {
  final EdgeInsetsGeometry margin;
  final EdgeInsetsGeometry padding;
  final Widget child;

  const _SkeletonCard({
    required this.margin,
    required this.padding,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final palette = context.palette;
    return Container(
      margin: margin,
      padding: padding,
      decoration: BoxDecoration(
        color: palette.surface,
        borderRadius: BorderRadius.circular(AppRadii.md),
        border: Border.all(color: palette.border),
      ),
      child: child,
    );
  }
}

class OrderItemSkeleton extends StatelessWidget {
  const OrderItemSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return _SkeletonCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              ShimmerSkeleton(width: 120, height: 16),
              ShimmerSkeleton(width: 80, height: 22, borderRadius: 12),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const ShimmerSkeleton(width: 50, height: 50, borderRadius: 8),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    ShimmerSkeleton(width: double.infinity, height: 14),
                    SizedBox(height: 6),
                    ShimmerSkeleton(width: 100, height: 12),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(color: context.palette.border),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              ShimmerSkeleton(width: 70, height: 14),
              ShimmerSkeleton(width: 100, height: 18),
            ],
          ),
        ],
      ),
    );
  }
}

class NotificationItemSkeleton extends StatelessWidget {
  const NotificationItemSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return _SkeletonCard(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ShimmerSkeleton(width: 40, height: 40, borderRadius: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                ShimmerSkeleton(width: 140, height: 16),
                SizedBox(height: 6),
                ShimmerSkeleton(width: double.infinity, height: 12),
                SizedBox(height: 4),
                ShimmerSkeleton(width: 80, height: 10),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
