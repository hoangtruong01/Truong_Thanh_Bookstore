# 📱 TRƯỜNG THÀNH BOOKSTORE — MOBILE APPLICATION

Ứng dụng di động mua sắm sách và văn phòng phẩm chính hãng đa nền tảng (Android & iOS) thuộc hệ sinh thái **Trường Thành Bookstore**.

---

## 🛠️ Tech Stack & Kiến Trúc

- **Framework:** Flutter 3.x (Dart 3.x)
- **State Management:** Provider Pattern
- **UI Design System:** Material Design 3, Google Fonts, Shimmer Loading, CachedNetworkImage
- **Local Storage:** `flutter_secure_storage` cho lưu trữ Auth Tokens an toàn và SharedPreferences cho giỏ hàng offline / cache
- **Push Notifications:** Firebase Cloud Messaging (FCM) & APNs
- **Kiến trúc:** Clean Layered Architecture (`screens/` → `widgets/` → `providers/` → `services/` → `models/`)

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu Cầu Môi Trường
- Flutter SDK $\ge 3.22.0$
- Dart SDK $\ge 3.4.0$
- Android Studio / Xcode

### Các Bước Thực Hiện
```bash
cd mobile

# 1. Tải dependencies
flutter pub get

# 2. Phân tích tĩnh mã nguồn (yêu cầu 0 issues)
flutter analyze

# 3. Chạy toàn bộ test suites (47 tests)
flutter test

# 4. Khởi chạy ứng dụng trên Simulator / Thiết bị thật
flutter run
```

---

## 🧪 Kiểm Thử Tự Động (Testing)

Suite kiểm thử di động gồm 47 tests bao quát:
- **Contract Tests:** Xác thực tính nhất quán giữa API Backend DTO và Models Flutter.
- **Provider Tests:** Logic giỏ hàng, tính phí ship, ngưỡng miễn phí vận chuyển 299.000₫, Wishlist, Authentication session token renewal.
- **E2E & Widget Tests:** Điều hướng Home, BottomNavigationBar, chi tiết sản phẩm và xử lý Push Notification an toàn.

```bash
flutter test --coverage
```
