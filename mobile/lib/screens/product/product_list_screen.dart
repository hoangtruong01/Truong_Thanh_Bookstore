import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/product_provider.dart';
import '../home/home_screen.dart';

class ProductListScreen extends StatefulWidget {
  const ProductListScreen({super.key});

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('DANH SÁCH SẢN PHẨM'),
      ),
      body: Column(
        children: [
          // Search Input
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              onChanged: (val) {
                productProvider.setSearchQuery(val);
              },
              decoration: InputDecoration(
                hintText: 'Tìm kiếm bút, sổ tay, giấy A4, kẹp giấy...',
                prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          productProvider.setSearchQuery('');
                        },
                      )
                    : null,
              ),
            ),
          ),

          // Categories Filter Chips
          if (productProvider.categories.isNotEmpty)
            SizedBox(
              height: 38,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: productProvider.categories.length + 1,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    final isSelected = productProvider.selectedCategory == null;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: const Text('Tất cả'),
                        selected: isSelected,
                        onSelected: (_) => productProvider.selectCategory(null),
                        selectedColor: AppTheme.primaryRed,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppTheme.darkSlate,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    );
                  }
                  final cat = productProvider.categories[index - 1];
                  final isSelected = productProvider.selectedCategory == cat.id;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text(cat.name),
                      selected: isSelected,
                      onSelected: (_) => productProvider.selectCategory(cat.id),
                      selectedColor: AppTheme.primaryRed,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : AppTheme.darkSlate,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  );
                },
              ),
            ),
          const SizedBox(height: 12),

          // Grid View
          Expanded(
            child: productProvider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : productProvider.products.isEmpty
                    ? const Center(
                        child: Text(
                          'Không tìm thấy sản phẩm phù hợp',
                          style: TextStyle(color: Color(0xFF94A3B8), fontWeight: FontWeight.bold),
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.66,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: productProvider.products.length,
                        itemBuilder: (context, index) {
                          final product = productProvider.products[index];
                          return ProductGridCard(product: product);
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
