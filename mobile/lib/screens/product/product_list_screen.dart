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
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _minPriceController = TextEditingController();
  final TextEditingController _maxPriceController = TextEditingController();
  
  String? _selectedBrand;
  double? _minRating;
  bool _onlyInStock = false;

  @override
  void dispose() {
    _searchController.dispose();
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productProvider = Provider.of<ProductProvider>(context);

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: const Text('DANH SÁCH SẢN PHẨM'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              _scaffoldKey.currentState?.openEndDrawer();
            },
          ),
        ],
      ),
      endDrawer: Drawer(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('BỘ LỌC NÂNG CAO', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const Divider(),
                const SizedBox(height: 12),
                
                // Brand Selection
                const Text('THƯƠNG HIỆU', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF64748B))),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: ['Thiên Long', 'Bến Nghé', 'Hồng Hà', 'Deli', 'Casio', 'Pentel'].map((brand) {
                    final isSelected = _selectedBrand == brand;
                    return ChoiceChip(
                      label: Text(brand, style: const TextStyle(fontSize: 10.5)),
                      selected: isSelected,
                      onSelected: (val) {
                        setState(() {
                          _selectedBrand = val ? brand : null;
                        });
                      },
                      selectedColor: AppTheme.primaryRed,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : AppTheme.darkSlate,
                        fontWeight: FontWeight.bold,
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Rating Selection
                const Text('ĐÁNH GIÁ TỐI THIỂU', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF64748B))),
                const SizedBox(height: 8),
                Row(
                  children: [5.0, 4.0, 3.0].map((rating) {
                    final isSelected = _minRating == rating;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.star, size: 12, color: Colors.amber),
                            const SizedBox(width: 4),
                            Text('${rating.toInt()} sao', style: const TextStyle(fontSize: 10.5)),
                          ],
                        ),
                        selected: isSelected,
                        onSelected: (val) {
                          setState(() {
                            _minRating = val ? rating : null;
                          });
                        },
                        selectedColor: AppTheme.primaryRed,
                        labelStyle: TextStyle(
                          color: isSelected ? Colors.white : AppTheme.darkSlate,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 20),

                // Price Range
                const Text('KHOẢNG GIÁ (VND)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF64748B))),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _minPriceController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          hintText: 'Tối thiểu',
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(),
                        ),
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _maxPriceController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          hintText: 'Tối đa',
                          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          border: OutlineInputBorder(),
                        ),
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Stock Checkbox
                CheckboxListTile(
                  title: const Text('Chỉ hiển thị sản phẩm còn hàng', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                  value: _onlyInStock,
                  onChanged: (val) {
                    setState(() {
                      _onlyInStock = val ?? false;
                    });
                  },
                  activeColor: AppTheme.primaryRed,
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                ),
                
                const Spacer(),
                
                // Actions
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
                          productProvider.clearFilters();
                          Navigator.pop(context);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.grey.shade600,
                          side: BorderSide(color: Colors.grey.shade300),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('Xóa bộ lọc', style: TextStyle(fontSize: 12)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          final minP = double.tryParse(_minPriceController.text);
                          final maxP = double.tryParse(_maxPriceController.text);
                          productProvider.applyFilters(
                            minPrice: minP,
                            maxPrice: maxP,
                            brand: _selectedBrand,
                            minRating: _minRating,
                            onlyInStock: _onlyInStock,
                          );
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryRed,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('Áp dụng', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      body: Column(
        children: [
          // Search Input & Filter trigger shortcut button
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
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
                const SizedBox(width: 8),
                InkWell(
                  onTap: () {
                    _scaffoldKey.currentState?.openEndDrawer();
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    height: 48,
                    width: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: const Icon(Icons.tune, color: AppTheme.primaryRed, size: 20),
                  ),
                ),
              ],
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
