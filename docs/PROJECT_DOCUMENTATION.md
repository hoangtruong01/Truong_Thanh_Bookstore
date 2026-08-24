# 📚 TÀI LIỆU TOÀN DIỆN DỰ ÁN TRƯỜNG THÀNH BOOKSTORE
*(Dành cho Khách hàng, Quản lý, Lập trình viên mới & Intern đọc hiểu 100% dự án)*

---

## 🌟 1. GIỚI THIỆU TỔNG QUAN (EXECUTIVE SUMMARY)

### 1.1. Dự án là gì?
**Trường Thành Bookstore** là hệ thống thương mại điện tử đa kênh (**Omni-channel E-commerce**) chuyên phân phối:
- **Sách giáo khoa, sách tham khảo, truyện tranh, văn học.**
- **Văn phòng phẩm cao cấp, dụng cụ học tập** (bút, vở, thước, dụng cụ vẽ, màu vẽ, cặp sách).
- **Đồ chơi giáo dục, quà tặng & đồ lưu niệm.**

### 1.2. Mục tiêu kinh doanh & Giá trị cốt lõi
- **Trải nghiệm mua sắm mượt mà**: Khách hàng có thể mua sắm trên cả **Website (Vue 3)** và **Ứng dụng di động (Flutter iOS & Android)** với dữ liệu đồng bộ thời gian thực.
- **Tự động hóa vận hành**: Hệ thống tự động tính phí giao hàng theo khoảng giá, áp dụng mã giảm giá, kiểm kho nguyên tử (tránh bán quá tồn), gửi email xác nhận và hóa đơn điện tử dạng PDF.
- **Bảng điều khiển quản trị tập trung (Admin Dashboard)**: Giúp chủ cửa hàng và nhân viên theo dõi doanh số, quản lý hàng tồn, duyệt đơn hàng, xuất/nhập danh sách sản phẩm bằng Excel.

---

## 🏢 2. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống được thiết kế theo mô hình **3 tầng (3-Tier Architecture)** hiện đại, độc lập và dễ mở rộng:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      TẦNG 1: GIAO DIỆN NGƯỜI DÙNG                       │
├────────────────────────────────────┬────────────────────────────────────┤
│   🌐 FRONTEND WEB (Vue 3 + Vite)   │    📱 MOBILE APP (Flutter + Dart)  │
│   - Cửa hàng trực tuyến (Store)    │    - Ứng dụng di động iOS/Android  │
│   - Bảng quản trị Admin CMS        │    - Mua sắm, giỏ hàng, thông báo  │
└──────────────────┬─────────────────┴──────────────────┬─────────────────┘
                   │ HTTP REST (JSON)                   │ HTTP REST (JSON)
                   │ WebSocket (Realtime Socket.IO)     │
                   ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     TẦNG 2: MÁY CHỦ ỨNG DỤNG (NESTJS)                   │
├─────────────────────────────────────────────────────────────────────────┤
│ - Controllers: Tiếp nhận và xác thực HTTP Requests                      │
│ - Services: Chứa 100% Business Logic (Trừ kho, tính voucher, bảo mật)   │
│ - Guards & Interceptors: Xác thực JWT, phân quyền Role, chuẩn hóa API   │
│ - WebSocket Gateway: Đẩy thông báo tức thì (đơn hàng mới, khuyến mãi)   │
│ - Tích hợp bên ngoài: PDFKit (xuất hóa đơn), ExcelJS (nhập/xuất file)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     TẦNG 3: LƯU TRỮ VÀ DỮ LIỆU                          │
├─────────────────────────────────────────────────────────────────────────┤
│ - MongoDB: Cơ sở dữ liệu chính (Lưu User, Product, Order, Inventory...) │
│ - Cloudinary: Lưu trữ hình ảnh sản phẩm, banner tốc độ cao             │
│ - Nodemailer (SMTP): Gửi email OTP, thông báo đơn hàng cho khách       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 3. CÁC TÁC NHÂN & PHÂN QUYỀN (ROLES & ACTORS)

Hệ thống quản lý 4 nhóm người dùng chính:
1. **Khách hàng vãng lai (Guest)**: Xem sản phẩm, tìm kiếm, đặt hàng nhanh không cần tạo tài khoản.
2. **Khách hàng thành viên (Customer)**: Có tài khoản, lưu sổ địa chỉ nhận hàng, xem lịch sử đơn, tích lũy điểm thưởng, danh sách yêu thích (Wishlist), đánh giá sản phẩm.
3. **Nhân viên (Staff)**: Được cấp các quyền quản trị giới hạn (quản lý sản phẩm, xác nhận đơn hàng, nhập/xuất kho, chăm sóc khách hàng).
4. **Quản trị viên (Admin / Super Admin)**: Toàn quyền cấu hình hệ thống, xem báo cáo doanh thu tài chính, quản lý tài khoản nhân viên, cấu hình khuyến mãi & banner.

---

## 🛍️ 4. LUỒNG NGHIỆP VỤ CHÍNH (KEY BUSINESS WORKFLOWS)

### 4.1. Luồng mua hàng & Thanh toán (Checkout Journey)
```
[ Khách hàng lướt xem sản phẩm ]
            │
            ▼
[ Thêm vào giỏ hàng (Cart) ] ── (Kiểm tra tồn kho thời gian thực)
            │
            ▼
[ Trang Đặt hàng (Checkout) ]
   ├── 1. Chọn/Nhập sổ địa chỉ nhận hàng (Tên, SĐT, Tỉnh/Huyện/Xã)
   ├── 2. Tự động tính phí vận chuyển:
   │      - Tổng tiền hàng < 299.000đ  => Phí ship = 30.000đ
   │      - Tổng tiền hàng >= 299.000đ => Miễn phí vận chuyển (0đ)
   ├── 3. Nhập mã giảm giá Voucher (Kiểm tra hạn sử dụng, điều kiện đơn)
   └── 4. Chọn phương thức thanh toán (COD, Chuyển khoản, VNPay, MoMo)
            │
            ▼
[ Xác nhận đặt đơn (Confirm Order) ]
   ├── Trừ tồn kho nguyên tử (Atomic deduction) trong MongoDB
   ├── Lưu đơn hàng với mã định danh chuẩn TT[Năm][Tháng][Ngày][Random]
   ├── Gửi thông báo WebSocket tới điện thoại/web của khách & Admin
   └── Gửi email thông báo đơn hàng kèm chi tiết sản phẩm
```

### 4.2. Luồng Vòng đời Đơn hàng (Order Lifecycle)
Đơn hàng di chuyển qua các trạng thái nghiêm ngặt, không cho phép nhảy cóc sai quy trình:
- `PENDING` (Chờ xác nhận) ➔ `CONFIRMED` (Đã xác nhận) ➔ `PROCESSING` (Đang đóng gói) ➔ `SHIPPING` (Đang giao hàng) ➔ `DELIVERED` (Giao thành công).
- **Hủy đơn (`CANCELLED`)**: Nếu khách hàng hoặc nhân viên hủy đơn hợp lệ, hệ thống **tự động hoàn lại đúng số lượng tồn kho (Rollback stock)** và cập nhật lịch sử.

### 4.3. Luồng Quên mật khẩu qua mã OTP
1. Người dùng nhập Email tài khoản.
2. Máy chủ sinh mã xác thực **OTP 6 chữ số ngẫu nhiên**, có hiệu lực trong 10 phút.
3. Người dùng nhập mã OTP để xác minh và nhận mã Token cấp phép đặt lại mật khẩu mới.
4. Mật khẩu mới được mã hóa an toàn bằng thuật toán **bcrypt (Salt rounds = 10)** trước khi lưu vào CSDL.

---

## 📂 5. HƯỚNG DẪN CẤU TRÚC MÃ NGUỒN DÀNH CHO DEVELOPER / INTERN

### 5.1. Backend (`/backend`) — NestJS TypeScript
- `src/main.ts`: Khởi động ứng dụng, nạp CORS, Swagger `/api/docs`, Global ValidationPipe và Global Exception Filter.
- `src/app.module.ts`: Root module kết nối MongoDB, cấu hình biến môi trường `.env` và nạp các module nghiệp vụ.
- `src/common/`:
  - `decorators/`: Các decorator `@Roles()`, `@Permissions()`, `@Public()`.
  - `guards/`: `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard` bảo vệ API.
  - `filters/`: `HttpExceptionFilter` chuẩn hóa định dạng lỗi toàn cục (`errorCode`, che giấu sensitive data & stack trace ở production, structured logging).
  - `exceptions/`: `AppException`, `BusinessException`, `ResourceNotFoundException`, `InsufficientStockException`...
  - `validators/`: `IsMongoObjectId`, `IsPhoneNumberVN`...
  - `interceptors/`: `TransformInterceptor` chuẩn hóa response định dạng `{ success, message, data, meta }`.
  - `enums/`: `error-code.enum.ts`, `order-status.enum.ts`, `payment-status.enum.ts`...
- `src/modules/`: Mỗi thư mục con là một nghiệp vụ độc lập:
  - `auth/`: Đăng ký, đăng nhập, cấp phát JWT, OTP.
  - `users/`: Thông tin cá nhân, sổ địa chỉ (`addresses`), danh sách yêu thích (`wishlist`).
  - `products/`: Quản lý sách & văn phòng phẩm, upload ảnh, xuất/nhập Excel.
  - `categories/`: Cây danh mục phân cấp.
  - `cart/`: Xử lý giỏ hàng và kiểm kho tạm tính.
  - `orders/`: Tạo đơn, tính tiền, xuất hóa đơn PDF.
  - `payments/`: Lớp trừu tượng thanh toán (COD, Bank Transfer, VNPay, MoMo).
  - `inventory/`: Nhật ký biến động kho (`IMPORT`, `SALE`, `RETURN`, `ADJUSTMENT`, `DAMAGE`).
  - `promotions/`: Quản lý voucher mã giảm giá.
  - `reviews/`: Đánh giá & chấm điểm sản phẩm.
  - `notifications/`: Socket.IO Gateway gửi thông báo real-time.
  - `reports/`: Thống kê doanh thu, đơn hàng, khách hàng VIP.

### 5.2. Frontend (`/frontend`) — Vue 3 + Tailwind CSS
- `src/main.ts`: Khởi tạo Vue app, nạp Pinia, Vue Router, Toastification, i18n.
- `src/pages/customer/`: Các trang bán hàng (Home, ProductDetail, Cart, Checkout, MyOrders, Addresses...).
- `src/pages/admin/`: Các trang quản trị (Dashboard, Products, Orders, Inventory, Promotions, Customers, Banners...).
- `src/stores/`: Quản lý trạng thái bằng Pinia (`auth.ts` lưu user token, `cart.ts` lưu giỏ hàng).
- `src/services/`: Các hàm Axios gọi API Backend theo từng module.

### 5.3. Mobile App (`/mobile`) — Flutter & Dart
- `lib/main.dart`: Khởi chạy ứng dụng Flutter, bọc MultiProvider.
- `lib/providers/`: Quản lý trạng thái bằng Provider (`auth_provider.dart`, `cart_provider.dart`, `product_provider.dart`, `order_provider.dart`).
- `lib/screens/`: Màn hình giao diện khách hàng chia theo thư mục rõ ràng.
- `lib/core/constants/api_constants.dart`: Lưu trữ IP/Domain Backend động cho các môi trường.

---

## 🚀 6. HƯỚNG DẪN KHỞI CHẠY DỰ ÁN CHO NGƯỜI MỚI (GETTING STARTED)

### Yêu cầu môi trường:
- **Node.js**: Phiên bản 18 trở lên (Khuyến nghị Node.js 20+ LTS).
- **MongoDB**: Chạy cục bộ (port 27017) hoặc MongoDB Atlas Cloud.
- **Flutter SDK**: Phiên bản 3.11 trở lên (nếu phát triển Mobile).

### Bước 1: Khởi chạy Backend
```powershell
cd backend
npm install
# Tạo file .env từ file mẫu
cp .env.example .env
# Chạy ứng dụng chế độ phát triển
npm run start:dev
```
- API chạy tại: `http://localhost:3000/api`
- Tài liệu tương tác Swagger: `http://localhost:3000/api/docs`

### Bước 2: Khởi chạy Frontend
```powershell
cd frontend
npm install
npm run dev
```
- Truy cập trình duyệt: `http://localhost:5173`

### Bước 3: Khởi chạy Mobile App
```powershell
cd mobile
flutter pub get
flutter run
```

---

## 🛡️ 7. QUY TẮC PHÁT TRIỂN & CHUẨN MỰC BẮT BUỘC (CODING STANDARDS)

1. **Controller siêu mỏng**: Controller chỉ đóng vai trò nhận request HTTP và trả về response. Toàn bộ logic kiểm tra dữ liệu, tính toán tiền bạc, trừ kho **bắt buộc** phải nằm trong Service.
2. **Không bao giờ làm lộ thông tin nhạy cảm**: Tuyệt đối không commit file `.env`, mật khẩu hoặc token bí mật lên Git. Password người dùng luôn phải băm bcrypt.
3. **Đảm bảo tính tương thích**: Khi cập nhật API Backend, luôn đảm bảo Frontend và Mobile App không bị lỗi tương thích ngược.
4. **Kiểm thử trước khi đóng Task**: Mọi thay đổi nghiệp vụ quan trọng đều phải chạy test tự động (`npm run test`, `npm run build`, `flutter test`) đạt kết quả PASS trước khi chuyển giao.
