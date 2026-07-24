# BẢN TẢ KIẾN TRÚC & ĐẶC TẢ HỆ THỐNG TRƯỜNG THÀNH BOOKSTORE
*(Dành cho Trợ lý AI và Lập trình viên đọc hiểu toàn bộ dự án lập tức)*

Dự án **Trường Thành Bookstore** là hệ thống thương mại điện tử phân phối văn phòng phẩm và dụng cụ học tập bao gồm 3 phân hệ chính:
1. **Backend (NestJS + MongoDB):** Cung cấp RESTful API, WebSocket real-time, xuất hóa đơn PDF và đồng bộ Google Sheets.
2. **Frontend Web (Vue 3 + Pinia + Tailwind CSS):** Giao diện quản trị Admin & Cửa hàng cho khách hàng.
3. **Mobile App (Flutter + Provider):** Ứng dụng di động dành cho khách hàng trên Android và iOS.

---

## I. CẤU TRÚC THƯ MỤC CHÍNH (DIRECTORY TREE)

```text
Truong_Thanh_Bookstore/
├── backend/                              # NestJS Backend Application
│   ├── src/
│   │   ├── common/                       # Các middleware, guard, decorator và enum dùng chung
│   │   │   ├── decorators/               # @Roles, @Public...
│   │   │   ├── guards/                   # JwtAuthGuard, RolesGuard...
│   │   │   ├── filters/                  # HttpExceptionFilter...
│   │   │   └── enums/                    # order-status.enum.ts, payment-status.enum.ts...
│   │   ├── modules/                      # Các mô đun nghiệp vụ chính
│   │   │   ├── auth/                     # Mô đun Xác thực người dùng
│   │   │   │   ├── auth.controller.ts    # API Đăng nhập, Đăng ký, Quên mật khẩu, Xác nhận OTP
│   │   │   │   ├── auth.service.ts       # Logic sinh mã OTP, băm bcrypt mật khẩu, cấp Token JWT
│   │   │   │   └── dto/auth.dto.ts       # Định nghĩa đầu vào (LoginDto, RegisterDto, OTP Dtos)
│   │   │   ├── users/                    # Mô đun người dùng & Địa chỉ
│   │   │   │   ├── addresses.controller.ts  # REST API quản lý Sổ địa chỉ (Address book CRUD)
│   │   │   │   ├── addresses.service.ts     # Logic đặt địa chỉ mặc định, đếm số lượng địa chỉ
│   │   │   │   └── schemas/                 # address.schema.ts, user.schema.ts
│   │   │   ├── products/                 # Mô đun quản lý Sản phẩm & Tìm kiếm
│   │   │   │   ├── products.service.ts   # Tìm kiếm nâng cao (lọc theo khoảng giá, số sao, brand, tồn kho)
│   │   │   │   └── dto/product.dto.ts    # ProductQueryDto mở rộng (minPrice, maxPrice, brand, minRating, inStock)
│   │   │   ├── orders/                   # Mô đun đơn hàng
│   │   │   │   ├── orders.controller.ts  # API Đặt hàng, Hủy đơn, Xuất hóa đơn PDF (:id/invoice)
│   │   │   │   ├── orders.service.ts     # Xử lý Trừ tồn kho & Rollback nguyên tử, xuất PDF bằng pdfkit
│   │   │   │   └── schemas/order.schema.ts  # Cấu trúc OrderItem, Order và OrderTimelineItem
│   │   │   ├── notifications/            # Mô đun thông báo WebSocket Real-time
│   │   │   │   ├── notifications.gateway.ts # WebSocket Gateway namespace '/notifications' quản lý kết nối
│   │   │   │   └── notifications.service.ts # Đẩy thông báo tức thời qua Socket & Lưu DB
│   │   │   └── reports/                  # Mô đun báo cáo thống kê dành cho Admin
│   │   │       ├── reports.controller.ts # API /reports/dashboard/advanced
│   │   │       └── reports.service.ts    # Tổng hợp dữ liệu AOV, Voucher, Phân bố đơn hàng
│   │   ├── main.ts                       # Khởi chạy NestJS App, cấu hình CORS, ValidationPipe
│   │   └── app.module.ts                 # Mô đun gốc liên kết MongooseModule và SocketGateway
│   └── test/                             # Thư mục kiểm thử tự động
│       └── all-fixes.spec.ts             # File test Jest xác thực 9 test cases nghiệp vụ lõi
│
├── frontend/                             # Vue 3 Web Store & Dashboard Admin
│   ├── src/
│   │   ├── components/                   # Component dùng chung (ProductCard, Breadcrumb, Loading...)
│   │   ├── layouts/                      # Layout khung định hình
│   │   │   ├── CustomerLayout.vue        # Layout khách hàng (Header có giỏ hàng, Socket-toasts)
│   │   │   └── AdminLayout.vue           # Layout Admin (Sidebar điều hướng, thống kê)
│   │   ├── pages/                        # Các trang màn hình chính
│   │   │   ├── admin/
│   │   │   │   └── Dashboard.vue         # Báo cáo Admin nâng cao (AOV, Voucher table, Status charts)
│   │   │   └── customer/
│   │   │       ├── Addresses.vue         # Giao diện quản trị sổ địa chỉ cá nhân
│   │   │       ├── ForgotPassword.vue    # Quên mật khẩu & Đặt lại qua mã OTP 6 số
│   │   │       ├── OrderDetail.vue       # Chi tiết đơn hàng, Stepper hành trình đơn, nút tải hóa đơn PDF
│   │   │       ├── ProductList.vue       # Sidebar lọc theo Brand, Rating, Price, Stock
│   │   │       └── Checkout.vue          # Chọn nhanh địa chỉ từ Sổ địa chỉ, tính ship tự động
│   │   ├── services/                     # Quản lý kết nối HTTP API Axios
│   │   │   ├── order.service.ts          # Gọi API đặt hàng, lấy chi tiết, hủy đơn
│   │   │   └── auth.service.ts           # Gọi API đăng nhập, quên mật khẩu, reset
│   │   ├── stores/                       # Quản lý State bằng Pinia
│   │   │   ├── auth.ts                   # Token mã hóa XOR-Base64, quyền hạn người dùng
│   │   │   └── cart.ts                   # Giỏ hàng, phí ship local, áp voucher
│   │   ├── router/
│   │   │   └── index.ts                  # Định tuyến Route Guard yêu cầu đăng nhập/quyền Admin
│   │   ├── App.vue                       # Điểm kết nối Socket.IO client tới gateway backend
│   │   └── main.ts                       # Khởi tạo Vue App, Pinia, Toastification
│   └── vite.config.ts                    # Cấu hình Vite build
│
└── mobile/                               # Flutter Mobile Application
    ├── lib/
    │   ├── core/
    │   │   ├── constants/api_constants.dart # Lưu trữ toàn bộ Endpoint và baseUrl động
    │   │   └── theme/app_theme.dart      # Hệ màu và font chữ thương hiệu Trường Thành
    │   ├── models/                       # Chuyển đổi dữ liệu JSON sang Object
    │   │   ├── product_model.dart        # Chứa ProductModel và CategoryModel
    │   │   └── order_model.dart          # Chứa OrderModel và OrderTimelineModel
    │   ├── providers/                    # Quản lý trạng thái bằng Provider
    │   │   ├── product_provider.dart     # Áp dụng bộ lọc nâng cao gửi lên Backend
    │   │   ├── cart_provider.dart        # Giỏ hàng di động, áp mã voucher, ship local
    │   │   └── auth_provider.dart        # Đăng nhập, đăng ký, quên mật khẩu
    │   └── screens/                      # Giao diện màn hình ứng dụng di động
    │       ├── auth/
    │       │   └── forgot_password_screen.dart # Giao diện Quên mật khẩu nhập OTP 6 số trên Mobile
    │       ├── product/
    │       │   ├── product_list_screen.dart # Danh sách sản phẩm tích hợp Drawer bộ lọc nâng cao
    │       │   └── product_detail_screen.dart # Chi tiết sản phẩm tích hợp Pinch-to-zoom InteractiveViewer
    │       ├── order/
    │       │   └── order_detail_screen.dart # Chi tiết đơn hàng, Stepper hành trình, nút tải PDF
    │       └── profile/
    │           └── address_book_screen.dart # Sổ địa chỉ cá nhân CRUD & Đặt địa chỉ mặc định
    └── test/                             # Thư mục kiểm thử tự động
        └── app_e2e_test.dart             # E2E test tích hợp trên mobile, test tab bar bằng Finder Icon
```

---

## II. ĐẶC TẢ BACKEND (NESTJS) & CƠ SỞ DỮ LIỆU (MONGODB)

### 1. Cơ sở dữ liệu (Schemas & Indexing)
Hệ thống sử dụng MongoDB với các Schema chính được cấu hình Index tối ưu truy vấn:
* **User (`user.schema.ts`):** 
  - Lưu thông tin tài khoản, mật khẩu băm `bcrypt`, vai trò (`ADMIN`, `STAFF`, `CUSTOMER`).
  - Hỗ trợ `resetOtp` (chuỗi 6 số) và `resetOtpExpiry` phục vụ tính năng Quên mật khẩu.
* **Address (`address.schema.ts`):** 
  - Lưu sổ địa chỉ của User. Mỗi bản ghi liên kết tới `User` qua `Types.ObjectId`.
  - Có các trường: `label` (Nhà riêng, Văn phòng), `recipientName`, `phone`, `province`, `district`, `ward`, `detail`, `isDefault`, `isDeleted`.
  - **Index:** `{ user: 1, isDeleted: 1 }` giúp tối ưu hóa tải danh sách địa chỉ của người dùng.
* **Product (`product.schema.ts`):** 
  - Thông tin sản phẩm, giá gốc `price`, giá khuyến mãi `discountPrice`, tồn kho `stock`, số lượng bán `sold`, thương hiệu `brand`, xếp hạng đánh giá `rating`.
  - **Index:** Hỗ trợ tìm kiếm văn bản và lọc danh mục.
* **Order (`order.schema.ts`):** 
  - Lưu mã đơn hàng `orderCode` (Sinh ngẫu nhiên dạng: `TT[YY][MM][DD][RANDOM]`).
  - Liên kết khách hàng, mảng sản phẩm mua (`items`), tổng tiền hàng (`subtotal`), phí ship (`shippingFee`), giảm giá (`discount`), tổng thanh toán (`total`).
  - Mảng hành trình đơn hàng **`timeline`** (`OrderTimelineItem`): Lưu danh sách các sự kiện trạng thái đơn hàng (`status`, `note`, `createdAt`).
  - **Index:** `{ customer: 1, createdAt: -1 }`, `{ orderStatus: 1 }`, `{ createdAt: -1 }`.

### 2. Các luồng xử lý cốt lõi (Core Mechanisms)

#### A. Luồng Quên mật khẩu & OTP
1. Khách gửi yêu cầu forgot password kèm Email. Backend tạo mã OTP 6 chữ số ngẫu nhiên, lưu vào DB kèm thời hạn 10 phút.
2. *Lưu ý môi trường phát triển (Dev):* API `/api/auth/forgot-password` trả về trực tiếp mã OTP trong phản hồi HTTP để dễ dàng xác thực/kiểm thử.
3. Khách hàng gửi OTP qua `/api/auth/verify-otp`. Nếu hợp lệ, hệ thống trả về mã Token tạm thời để người dùng Reset mật khẩu mới thông qua `/api/auth/reset-password`.

#### B. Trừ kho an toàn & Cơ chế rollback (Atomic Stock Deduction)
Khi tạo đơn hàng, hệ thống tuân thủ quy tắc trừ kho nghiêm ngặt để tránh thất thoát hoặc tạo đơn ảo:
1. Duyệt qua mảng sản phẩm. Kiểm tra tồn kho thực tế trong DB.
2. Thực hiện trừ kho từng sản phẩm thông qua `deductStock` (sử dụng MongoDB atomic update `{ stock: { $gte: quantity } }`).
3. Nếu có **bất kỳ** sản phẩm nào không đủ tồn kho, hệ thống ném ra lỗi `BadRequestException`.
4. Khối `catch` sẽ thực thi **Rollback**: Tự động cộng lại số lượng tồn kho cho các sản phẩm đã bị trừ trước đó trong vòng lặp. Chỉ khi trừ kho thành công toàn bộ, bản ghi `Order` mới được lưu vào DB.

#### C. Tính phí vận chuyển (Free Shipping Rule)
- Ngưỡng miễn phí vận chuyển cố định: **299.000đ** (`FREE_SHIPPING_THRESHOLD`).
- Nếu tổng tiền sản phẩm (`subtotal`) < 299.000đ: Phí vận chuyển mặc định là **30.000đ** (`SHIPPING_FEE`).
- Nếu `subtotal` >= 299.000đ: Miễn phí vận chuyển (0đ).
- *Lưu ý:* Phí vận chuyển được tính toán hoàn toàn độc lập ở phía Server để đảm bảo tính an toàn, không tin cậy dữ liệu truyền lên từ Client.

#### D. WebSocket Real-time Notifications
- Hoạt động trên namespace `/notifications`.
- Khi người dùng kết nối, Client truyền `userId` qua query parameters. Gateway lưu liên kết vào `Map<string, Socket>`.
- Khi có sự kiện (Đặt hàng thành công, Thay đổi trạng thái đơn hàng, Hệ thống có mã giảm giá mới):
  - Backend lưu thông báo vào DB thông qua `NotificationsService`.
  - Đồng thời gửi sự kiện `notification_received` trực tiếp qua Socket đến riêng client đó (hoặc broadcast toàn bộ nếu là thông báo chung).

#### E. Xuất hóa đơn bán hàng PDF (Invoice Export)
- Route: `GET /api/orders/:id/invoice` (Yêu cầu đặt **trước** route catch-all `:id` để tránh xung đột định tuyến trong NestJS).
- Gói thư viện sử dụng: `pdfkit`.
- **Xử lý Font chữ Tiếng Việt:** Hệ thống tự động kiểm tra sự tồn tại của tệp font Arial hệ thống trên Windows (`C:\Windows\Fonts\Arial.ttf`). Nếu có, sẽ dùng font Arial để hiển thị tiếng Việt hoàn hảo; nếu không (chạy trên Linux/Docker), hệ thống sẽ tự động fallback về font mặc định `Helvetica` để tránh crash server.

---

## III. ĐẶC TẢ FRONTEND WEB (VUE 3)

### 1. Quản lý trạng thái (Pinia Stores)
- **`auth.ts`:** Lưu trữ thông tin Token JWT, thông tin cá nhân của người dùng đã đăng nhập. Hỗ trợ mã hóa che giấu thông tin token cục bộ bằng XOR-Base64 tránh đọc trộm dữ liệu nhạy cảm.
- **`cart.ts`:** Quản lý giỏ hàng tạm thời, lưu LocalStorage. Tự động tính toán tổng số tiền hàng, phí ship dựa theo quy tắc 299K để hiển thị đồng bộ với server.

### 2. Các trang màn hình đặc biệt
- **`ForgotPassword.vue`:** Giao diện 3 bước (Nhập Email lấy OTP -> Điền OTP xác nhận -> Đặt lại mật khẩu mới) cực kỳ mượt mà.
- **`Addresses.vue`:** Danh sách sổ địa chỉ dạng thẻ sang trọng, cho phép thêm mới, chỉnh sửa, xóa và thiết lập mặc định địa chỉ giao hàng.
- **`OrderDetail.vue`:** Giao diện chi tiết hóa đơn tích hợp:
  - Nút **"Tải hóa đơn PDF"** kích hoạt tải xuống file hóa đơn chính thống từ API backend.
  - Stepper hành trình đơn hàng trực quan (Được vẽ bằng CSS), hiển thị lật ngược danh sách lịch sử trạng thái mới nhất lên đầu.
- **`Dashboard.vue` (Admin):**
  - Tải dữ liệu tổng hợp nâng cao từ `/reports/dashboard/advanced`.
  - Hiển thị tỷ lệ trạng thái đơn hàng dạng biểu đồ thanh ngang CSS.
  - Thống kê hiệu quả sử dụng mã voucher (Lượt dùng, tổng tiền tiết kiệm được cho khách hàng) trực quan bằng bảng biểu.

---

## IV. ĐẶC TẢ MOBILE APPLICATION (FLUTTER)

Ứng dụng Flutter sử dụng kiến trúc phân tách rõ ràng giữa UI (Screens) và Logic (Providers).

### 1. State Management (Providers)
- **`ProductProvider`:** Tải danh sách sản phẩm, quản lý bộ lọc tìm kiếm nâng cao: `minPrice`, `maxPrice`, `brand`, `minRating`, `onlyInStock`.
- **`CartProvider`:** Xử lý thêm vào giỏ, cập nhật số lượng, áp dụng voucher khuyến mãi và tính toán phí vận chuyển tại local.
- **`OrderProvider`:** Tải danh sách đơn hàng của tôi, gửi yêu cầu hủy đơn hàng (Chỉ cho phép hủy khi trạng thái là `PENDING`).

### 2. Các Widget & Tính năng nâng cấp trên Mobile

#### A. Bộ lọc nâng cao (Filter Drawer) trên Product List
- Tích hợp một biểu tượng bộ lọc bên cạnh thanh tìm kiếm. Khi click, một Drawer (hoặc BottomSheet) trượt ra từ bên phải gồm:
  - Chọn Thương hiệu (ChoiceChip): Thiên Long, Bến Nghé, Hồng Hà, Deli, Casio...
  - Đánh giá tối thiểu (ChoiceChip): 3 sao, 4 sao, 5 sao.
  - Nhập Khoảng giá (Min/Max Price) trực tiếp bằng bàn phím số.
  - Switch Toggle "Chỉ hiển thị sản phẩm còn hàng".
  - Nút "Áp dụng" gọi `productProvider.applyFilters` và "Xóa bộ lọc" gọi `clearFilters`.

#### B. Phóng to ảnh (Pinch-to-zoom) trên Product Detail
- Bọc widget ảnh sản phẩm trong `InteractiveViewer` cho phép phóng to, thu nhỏ và kéo di chuyển ảnh bằng 2 ngón tay cực kỳ mượt mà trên thiết bị di động mà không cần thư viện bên thứ ba.

#### C. Màn hình chi tiết đơn hàng (Order Detail Timeline)
- Sử dụng mô hình **Vertical Timeline Stepper** bằng cách kết hợp `IntrinsicHeight` và đường nét `Container` vẽ dọc.
- Các trạng thái đơn hàng được dịch sang tiếng Việt thân thiện, hiển thị kèm mốc thời gian và ghi chú chuyển trạng thái chi tiết.

---

## V. HƯỚNG DẪN CHẠY KIỂM THỬ (TESTING & VERIFICATION)

### 1. Kiểm thử Backend (Jest)
Bộ test case nâng cao nằm ở [all-fixes.spec.ts](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/test/all-fixes.spec.ts). Chạy lệnh sau tại thư mục `backend` để kiểm tra:
```bash
npx jest --rootDir . test/all-fixes.spec.ts
```
*Các kịch bản được test bao gồm:*
- Kiểm thử cơ chế trừ kho nguyên tử (atomic) và khôi phục khi có lỗi.
- Kiểm thử cách tính phí vận chuyển theo ngưỡng giá trị đơn hàng.
- Kiểm thử sự hiện diện của các trường nghiệp vụ mới như `timeline` trên Order, các index trên Address book.
- Kiểm thử tạo hóa đơn PDF không lỗi.

### 2. Kiểm thử Mobile (Flutter Widget / E2E Tests)
Các test case tích hợp di động nằm ở `mobile/test/app_e2e_test.dart`. Chạy lệnh sau tại thư mục `mobile` để chạy:
```bash
flutter test
```
*Lưu ý kiến trúc test:* Vì thanh điều hướng phía dưới (`bottomNavigationBar`) chỉ hiển thị Text Label của tab đang active, nên bộ test được viết để tìm các tab inactive thông qua `find.byIcon(...)` thay vì tìm theo Text, đảm bảo kiểm thử E2E-01 và E2E-04 luôn vượt qua tuyệt đối.
