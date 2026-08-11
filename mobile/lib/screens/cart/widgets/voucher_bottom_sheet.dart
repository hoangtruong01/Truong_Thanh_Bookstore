import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../providers/cart_provider.dart';

class VoucherBottomSheet extends StatelessWidget {
  const VoucherBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final promotions = cartProvider.activePromotions;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '🎟️ Chọn Mã Giảm Giá',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.darkSlate),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (promotions.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text('Hiện không có mã giảm giá nào sẵn có.', style: TextStyle(color: Colors.grey)),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: promotions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final promo = promotions[index];
                final code = promo.code;
                final isApplied = cartProvider.appliedPromotion?.code == code;

                return ClipPath(
                  clipper: TicketClipper(separatorX: 80.0, cutoutRadius: 7.0),
                  child: Container(
                    height: 94,
                    decoration: BoxDecoration(
                      color: isApplied ? const Color(0xFFFFEDD5) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isApplied ? AppTheme.primaryRed : const Color(0xFFE2E8F0),
                        width: isApplied ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        // Left Voucher Icon Box
                        Container(
                          width: 80,
                          height: double.infinity,
                          decoration: BoxDecoration(
                            gradient: isApplied
                                ? const LinearGradient(
                                    colors: [Color(0xFFFB5607), Color(0xFFDC2626)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  )
                                : const LinearGradient(
                                    colors: [Color(0xFF64748B), Color(0xFF475569)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.confirmation_number_rounded, color: Colors.white, size: 26),
                              SizedBox(height: 4),
                              Text(
                                'VOUCHER',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Dashed Separator Line
                        CustomPaint(
                          size: const Size(1, double.infinity),
                          painter: DashedLinePainter(
                            color: isApplied ? AppTheme.primaryRed.withOpacity(0.4) : const Color(0xFFCBD5E1),
                          ),
                        ),
                        // Right Voucher Info & Button
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        code,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 14,
                                          color: AppTheme.darkSlate,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        promo.description ?? 'Giảm giá cực ưu đãi',
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontSize: 11,
                                          color: Color(0xFF475569),
                                          fontWeight: FontWeight.w600,
                                          height: 1.15,
                                        ),
                                      ),
                                      if (promo.minOrderValue > 0) ...[
                                        const SizedBox(height: 3),
                                        Text(
                                          'Đơn tối thiểu ${Formatters.formatCurrency(promo.minOrderValue)}',
                                          style: const TextStyle(
                                            fontSize: 9.5,
                                            color: AppTheme.primaryRed,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                                ElevatedButton(
                                  onPressed: () {
                                    if (isApplied) {
                                      cartProvider.removeCoupon();
                                    } else {
                                      cartProvider.applyCoupon(code);
                                    }
                                    Navigator.pop(context);
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: isApplied ? const Color(0xFF64748B) : AppTheme.primaryRed,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    minimumSize: Size.zero,
                                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  child: Text(
                                    isApplied ? 'Bỏ chọn' : 'Áp dụng',
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

class TicketClipper extends CustomClipper<Path> {
  final double separatorX;
  final double cutoutRadius;

  TicketClipper({this.separatorX = 80.0, this.cutoutRadius = 7.0});

  @override
  Path getClip(Size size) {
    final path = Path();
    path.moveTo(0, 0);

    // Top edge to cutout
    path.lineTo(separatorX - cutoutRadius, 0);
    path.arcToPoint(
      Offset(separatorX + cutoutRadius, 0),
      radius: Radius.circular(cutoutRadius),
      clockwise: false,
    );
    path.lineTo(size.width, 0);

    // Right edge
    path.lineTo(size.width, size.height);

    // Bottom edge to cutout
    path.lineTo(separatorX + cutoutRadius, size.height);
    path.arcToPoint(
      Offset(separatorX - cutoutRadius, size.height),
      radius: Radius.circular(cutoutRadius),
      clockwise: false,
    );
    path.lineTo(0, size.height);

    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant TicketClipper oldClipper) =>
      oldClipper.separatorX != separatorX || oldClipper.cutoutRadius != cutoutRadius;
}

class DashedLinePainter extends CustomPainter {
  final Color color;
  final double dashHeight;
  final double dashSpace;

  DashedLinePainter({
    required this.color,
    this.dashHeight = 4.0,
    this.dashSpace = 3.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    double startY = 4.0;
    final paint = Paint()
      ..color = color
      ..strokeWidth = size.width
      ..style = PaintingStyle.stroke;

    while (startY < size.height - 4.0) {
      canvas.drawLine(
        Offset(0, startY),
        Offset(0, startY + dashHeight),
        paint,
      );
      startY += dashHeight + dashSpace;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

