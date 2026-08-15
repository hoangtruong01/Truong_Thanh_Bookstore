import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/product_grid_card.dart';
import '../../providers/product_provider.dart';

class DealHotScreen extends StatefulWidget {
  const DealHotScreen({super.key});

  @override
  State<DealHotScreen> createState() => _DealHotScreenState();
}

class _DealHotScreenState extends State<DealHotScreen> {
  Timer? _timer;
  String _hours = "00";
  String _minutes = "00";
  String _seconds = "00";

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _updateTime();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        _updateTime();
      }
    });
  }

  void _updateTime() {
    final now = DateTime.now();
    final midnight = DateTime(now.year, now.month, now.day, 24, 0, 0);
    final diff = midnight.difference(now);
    if (diff.isNegative) return;

    setState(() {
      _hours = diff.inHours.toString().padLeft(2, '0');
      _minutes = (diff.inMinutes % 60).toString().padLeft(2, '0');
      _seconds = (diff.inSeconds % 60).toString().padLeft(2, '0');
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);
    final deals = productProvider.flashSaleProducts;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '🔥 DEAL HOT GIỜ VÀNG',
          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Banner Deal Hot matching Web with flash-sale-bg.png
            Container(
              width: double.infinity,
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryRed.withOpacity(0.2),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
                image: const DecorationImage(
                  image: AssetImage('assets/flash-sale-bg.png'),
                  fit: BoxFit.cover,
                ),
              ),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  gradient: LinearGradient(
                    colors: [
                      Colors.white.withOpacity(0.92),
                      Colors.white.withOpacity(0.85),
                      const Color(0xFFFFF1F2).withOpacity(0.95),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryRed.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppTheme.primaryRed.withOpacity(0.3)),
                      ),
                      child: const Text(
                        '🔥 ĐỪNG BỎ LỠ HÔM NAY!',
                        style: TextStyle(
                          color: AppTheme.primaryRed,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFEF4444), Color(0xFFEA580C)],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.local_fire_department_rounded, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'DEAL SỐC GIỜ VÀNG',
                                style: TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              Text(
                                'Giảm giá lên đến 30% cho dụng cụ học tập',
                                style: TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Countdown Timer Box
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFED7AA)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.timer_outlined, size: 16, color: AppTheme.primaryRed),
                              SizedBox(width: 6),
                              Text(
                                'KẾT THÚC SAU:',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF475569),
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              _TimerBlock(value: _hours, label: 'Giờ'),
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 4),
                                child: Text(':', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                              ),
                              _TimerBlock(value: _minutes, label: 'Phút'),
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 4),
                                child: Text(':', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                              ),
                              _TimerBlock(value: _seconds, label: 'Giây'),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            if (deals.isEmpty)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(
                  child: Text('Chưa có sản phẩm khuyến mãi nào trong đợt này.'),
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.64,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: deals.length,
                  itemBuilder: (context, index) {
                    return ProductGridCard(product: deals[index]);
                  },
                ),
              ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _TimerBlock extends StatelessWidget {
  final String value;
  final String label;

  const _TimerBlock({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        value,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
          fontSize: 13,
          fontFamily: 'monospace',
        ),
      ),
    );
  }
}
