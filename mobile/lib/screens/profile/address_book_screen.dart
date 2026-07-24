import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import '../../core/theme/app_theme.dart';
import '../../core/constants/api_constants.dart';
import '../../providers/auth_provider.dart';

class AddressBookScreen extends StatefulWidget {
  const AddressBookScreen({super.key});

  @override
  State<AddressBookScreen> createState() => _AddressBookScreenState();
}

class _AddressBookScreenState extends State<AddressBookScreen> {
  List<dynamic> _addresses = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchAddresses();
  }

  Future<void> _fetchAddresses() async {
    setState(() => _isLoading = true);
    final auth = Provider.of<AuthProvider>(context, listen: false);

    try {
      final res = await http.get(
        Uri.parse(ApiConstants.addresses),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${auth.token}',
        },
      );

      final body = jsonDecode(res.body);
      if (res.statusCode == 200) {
        setState(() {
          _addresses = body['data'] ?? body;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải danh sách địa chỉ: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteAddress(String id) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    try {
      final res = await http.delete(
        Uri.parse('${ApiConstants.addresses}/$id'),
        headers: {
          'Authorization': 'Bearer ${auth.token}',
        },
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đã xóa địa chỉ thành công')),
          );
        }
        _fetchAddresses();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e')),
        );
      }
    }
  }

  Future<void> _setDefaultAddress(String id) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    try {
      final res = await http.put(
        Uri.parse('${ApiConstants.addresses}/$id/default'),
        headers: {
          'Authorization': 'Bearer ${auth.token}',
        },
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        _fetchAddresses();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e')),
        );
      }
    }
  }

  void _showAddressForm({Map<String, dynamic>? address}) {
    final labelCtrl = TextEditingController(text: address?['label'] ?? '');
    final nameCtrl = TextEditingController(text: address?['recipientName'] ?? '');
    final phoneCtrl = TextEditingController(text: address?['phone'] ?? '');
    final provinceCtrl = TextEditingController(text: address?['province'] ?? '');
    final districtCtrl = TextEditingController(text: address?['district'] ?? '');
    final wardCtrl = TextEditingController(text: address?['ward'] ?? '');
    final detailCtrl = TextEditingController(text: address?['detail'] ?? '');
    bool isDefault = address?['isDefault'] ?? false;

    final formKey = GlobalKey<FormState>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(context).viewInsets.bottom + 20),
              child: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        address == null ? 'THÊM ĐỊA CHỈ MỚI' : 'SỬA ĐỊA CHỈ',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: nameCtrl,
                        decoration: const InputDecoration(labelText: 'Tên người nhận'),
                        validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng nhập tên' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: phoneCtrl,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(labelText: 'Số điện thoại'),
                        validator: (v) => (v == null || v.length < 10) ? 'Số điện thoại không hợp lệ' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: labelCtrl,
                        decoration: const InputDecoration(labelText: 'Nhãn địa chỉ (ví dụ: Nhà riêng)'),
                        validator: (v) => (v == null || v.isEmpty) ? 'Vui lòng nhập nhãn' : null,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: provinceCtrl,
                              decoration: const InputDecoration(labelText: 'Tỉnh/Thành phố'),
                              validator: (v) => (v == null || v.isEmpty) ? 'Bắt buộc' : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: districtCtrl,
                              decoration: const InputDecoration(labelText: 'Quận/Huyện'),
                              validator: (v) => (v == null || v.isEmpty) ? 'Bắt buộc' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: wardCtrl,
                              decoration: const InputDecoration(labelText: 'Phường/Xã'),
                              validator: (v) => (v == null || v.isEmpty) ? 'Bắt buộc' : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: detailCtrl,
                              decoration: const InputDecoration(labelText: 'Số nhà, tên đường'),
                              validator: (v) => (v == null || v.isEmpty) ? 'Bắt buộc' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      CheckboxListTile(
                        title: const Text('Đặt làm mặc định', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        value: isDefault,
                        contentPadding: EdgeInsets.zero,
                        activeColor: AppTheme.primaryRed,
                        onChanged: (val) {
                          setModalState(() {
                            isDefault = val ?? false;
                          });
                        },
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          onPressed: () async {
                            if (!formKey.currentState!.validate()) return;
                            final auth = Provider.of<AuthProvider>(context, listen: false);

                            final payload = {
                              'label': labelCtrl.text.trim(),
                              'recipientName': nameCtrl.text.trim(),
                              'phone': phoneCtrl.text.trim(),
                              'province': provinceCtrl.text.trim(),
                              'district': districtCtrl.text.trim(),
                              'ward': wardCtrl.text.trim(),
                              'detail': detailCtrl.text.trim(),
                              'isDefault': isDefault,
                            };

                            final messenger = ScaffoldMessenger.of(context);
                            final navigator = Navigator.of(ctx);

                            try {
                              http.Response response;
                              if (address == null) {
                                response = await http.post(
                                  Uri.parse(ApiConstants.addresses),
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ${auth.token}',
                                  },
                                  body: jsonEncode(payload),
                                );
                              } else {
                                response = await http.put(
                                  Uri.parse('${ApiConstants.addresses}/${address['_id']}'),
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ${auth.token}',
                                  },
                                  body: jsonEncode(payload),
                                );
                              }

                              if (response.statusCode == 200 || response.statusCode == 201) {
                                navigator.pop();
                                _fetchAddresses();
                              }
                            } catch (e) {
                              messenger.showSnackBar(
                                SnackBar(content: Text('Lỗi lưu địa chỉ: $e')),
                              );
                            }
                          },
                          child: const Text('LƯU ĐỊA CHỈ'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SỔ ĐỊA CHỈ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showAddressForm(),
          ),
        ],
      ),
      body: _isLoading && _addresses.isEmpty
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryRed))
          : _addresses.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.location_off_outlined, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text('Chưa có địa chỉ nào', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: () => _showAddressForm(),
                        child: const Text('THÊM ĐỊA CHỈ MỚI'),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _addresses.length,
                  itemBuilder: (context, index) {
                    final addr = _addresses[index];
                    final isDefault = addr['isDefault'] ?? false;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: BorderSide(
                          color: isDefault ? AppTheme.primaryRed.withOpacity(0.3) : const Color(0xFFE2E8F0),
                          width: isDefault ? 1.5 : 1,
                        ),
                      ),
                      elevation: 0,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    addr['label'] ?? 'Địa chỉ',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: Color(0xFF334155)),
                                  ),
                                ),
                                if (isDefault) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryRed.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text(
                                      'MẶC ĐỊNH',
                                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10, color: AppTheme.primaryRed),
                                    ),
                                  ),
                                ],
                                const Spacer(),
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 20, color: Colors.blue),
                                  onPressed: () => _showAddressForm(address: addr),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline_rounded, size: 20, color: Colors.red),
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (ctx) => AlertDialog(
                                        title: const Text('Xóa địa chỉ'),
                                        content: const Text('Bạn có chắc chắn muốn xóa địa chỉ này?'),
                                        actions: [
                                          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(ctx);
                                              _deleteAddress(addr['_id']);
                                            },
                                            child: const Text('Xóa', style: TextStyle(color: Colors.red)),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '${addr['recipientName']}  |  ${addr['phone']}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${addr['detail']}, ${addr['ward']}, ${addr['district']}, ${addr['province']}',
                              style: const TextStyle(color: Color(0xFF475569), fontSize: 12.5),
                            ),
                            if (!isDefault) ...[
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: () => _setDefaultAddress(addr['_id']),
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: const Text('Đặt làm mặc định', style: TextStyle(color: AppTheme.primaryRed, fontSize: 12)),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
