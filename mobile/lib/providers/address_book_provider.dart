import 'package:flutter/foundation.dart';
import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/address_model.dart';

/// Dữ liệu nhập của form địa chỉ (các trường CreateAddressDto / UpdateAddressDto).
@immutable
class AddressInput {
  final String label;
  final String recipientName;
  final String phone;
  final String province;
  final String district;
  final String ward;
  final String detail;
  final bool isDefault;

  const AddressInput({
    required this.label,
    required this.recipientName,
    required this.phone,
    required this.province,
    required this.district,
    required this.ward,
    required this.detail,
    this.isDefault = false,
  });

  Map<String, dynamic> toJson() => {
        'label': label.trim(),
        'recipientName': recipientName.trim(),
        'phone': phone.trim(),
        'province': province.trim(),
        'district': district.trim(),
        'ward': ward.trim(),
        'detail': detail.trim(),
        'isDefault': isDefault,
      };
}

/// Sổ địa chỉ của người dùng đăng nhập: /addresses (CRUD + đặt mặc định).
/// Danh sách luôn tải lại từ server sau mỗi thay đổi vì Backend tự bỏ cờ
/// mặc định ở các địa chỉ khác.
class AddressBookProvider with ChangeNotifier {
  AddressBookProvider({required ApiClient apiClient}) : _api = apiClient;

  final ApiClient _api;

  List<AddressModel> _addresses = const [];
  bool _isLoading = false;
  bool _hasLoaded = false;
  String? _error;

  List<AddressModel> get addresses => _addresses;
  bool get isLoading => _isLoading;
  bool get hasLoaded => _hasLoaded;

  /// Lỗi của lần tải danh sách gần nhất (null khi thành công).
  String? get error => _error;

  Future<void> fetch(String? token) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _api.get(ApiConstants.addresses, token: token, authenticated: true);
      if (res.isSuccess) {
        _addresses = res
            .listData()
            .whereType<Map>()
            .map((e) => AddressModel.fromJson(Map<String, dynamic>.from(e)))
            .where((a) => !a.isDeleted)
            .toList(growable: false);
        _hasLoaded = true;
      } else {
        _error = res.message ?? 'Không tải được sổ địa chỉ';
      }
    } on ApiNetworkException {
      _error = 'Không có kết nối mạng. Vui lòng thử lại.';
    } catch (_) {
      _error = 'Không tải được sổ địa chỉ';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Tạo mới khi [id] null, ngược lại cập nhật. Ném Exception kèm thông báo
  /// của Backend khi thất bại.
  Future<void> save(AddressInput input, String? token, {String? id}) async {
    final res = id == null
        ? await _api.post(ApiConstants.addresses, token: token, authenticated: true, body: input.toJson())
        : await _api.put(ApiConstants.address(id), token: token, authenticated: true, body: input.toJson());
    _ensureSuccess(res, 'Không lưu được địa chỉ');
    await fetch(token);
  }

  Future<void> delete(String id, String? token) async {
    final res = await _api.delete(ApiConstants.address(id), token: token, authenticated: true);
    _ensureSuccess(res, 'Không xóa được địa chỉ');
    await fetch(token);
  }

  Future<void> setDefault(String id, String? token) async {
    final res = await _api.put(ApiConstants.setDefaultAddress(id), token: token, authenticated: true);
    _ensureSuccess(res, 'Không đặt được địa chỉ mặc định');
    await fetch(token);
  }

  static void _ensureSuccess(ApiResponse res, String fallback) {
    if (!res.isSuccess) throw Exception(res.message ?? fallback);
  }
}
