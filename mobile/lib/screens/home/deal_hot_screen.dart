import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/product_grid_card.dart';
import '../../providers/product_provider.dart';

class DealHotScreen extends StatelessWidget {
  const DealHotScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);
    final deals = productProvider.flashSaleProducts;

    return Scaffold(
      appBar: AppBar(
        title: const Text('🔥 DEAL HOT GIỜ VÀNG'),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Banner Deal Hot
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryRed.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: const [
                  Text(
                    '⚡ FLASH SALE CỰC SHOCK',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Giảm đến 50% toàn bộ văn phòng phẩm & dụng cụ học tập',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
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
                padding: const EdgeInsets.all(16.0),
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
          ],
        ),
      ),
    );
  }
}
