# 🤖 AI CONTEXT & CONTINUOUS UPDATE REGISTRY (`AI_CONTEXT.md`)
*(Hồ sơ ngữ cảnh hệ thống — AI đọc file này để nắm bắt toàn bộ dự án trong 5 giây và cập nhật sau mỗi task)*

---

## ⚡ 1. FAST PROJECT SNAPSHOT

| Hạng mục | Giá trị | Ghi chú |
| :--- | :--- | :--- |
| **Tên dự án** | Trường Thành Bookstore | Thương mại điện tử sách & văn phòng phẩm |
| **Backend** | NestJS v11 (TypeScript, Node.js) | Port: `3000`, Prefix: `/api`, Docs: `/api/docs` |
| **Database** | MongoDB + Mongoose 9 | MongoDB URI trong `.env` |
| **Frontend** | Vue 3 (Composition API) + Vite 8 + Tailwind 4 | Port: `5173`, State: Pinia, Route: Vue Router |
| **Mobile** | Flutter SDK (^3.11) + Dart | State: Provider, Đa nền tảng Android/iOS |
| **Realtime** | WebSocket Socket.IO | Namespace: `/notifications` |
| **Storage & Mail**| Cloudinary + Nodemailer SMTP | Ảnh & Email giao dịch |

---

## 🗺️ 2. BACKEND MODULES MAP & RESPONSIBILITIES

```text
backend/src/modules/
├── auth/            -> Login, Register, Logout, RefreshToken, ForgotPassword (OTP 6 số), ResetPassword
├── users/           -> Profile, Addresses (sổ địa chỉ CRUD), Wishlist
├── products/        -> Quản lý sách/VPP, SKU, ISBN, Lọc nâng cao, Excel Import/Export
├── categories/      -> Cây danh mục phân cấp (Parent/Child), Slug
├── cart/            -> [NEW] Quản lý giỏ hàng backend, kiểm tra tồn kho realtime, tạm tính giá
├── orders/          -> Tạo đơn hàng, trừ kho nguyên tử (Atomic rollback), xuất hóa đơn PDF
├── payments/        -> [NEW] Lớp trừu tượng cổng thanh toán (COD, Bank Transfer, VNPay, MoMo)
├── inventory/       -> Giao dịch kho (IMPORT, SALE, RETURN, ADJUSTMENT, DAMAGE), cảnh báo hết hàng
├── reviews/         -> [NEW] Đánh giá & xếp hạng sản phẩm (chỉ khách đã mua mới được đánh giá)
├── promotions/      -> Mã giảm giá (Coupon), kiểm tra điều kiện áp dụng & số lượt sử dụng
├── notifications/   -> WebSocket Gateway & Lưu trữ thông báo trong DB
├── reports/         -> Báo cáo thống kê doanh thu, AOV, phân bố đơn hàng cho Admin
├── customers/       -> Quản lý danh sách khách hàng và lịch sử mua sắm cho Admin
├── banners/         -> Quản lý banner quảng cáo hiển thị trên Web/App
├── landing-pages/   -> Quản lý trang sự kiện flash sale/khuyến mãi động
└── email/           -> Gửi mail OTP, xác nhận đơn hàng, cảnh báo tồn kho
```

---

## 📋 3. BẢNG TIẾN ĐỘ 30 TASKS (ROADMAP STATUS MATRIX)

| Mã Task | Tên Task & Mục tiêu | Phase | Độ ưu tiên | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TASK 01** | Chuẩn hóa cấu trúc Backend (Controller/Service/DTO/Module) | Phase 1 | P0 | 🟢 **DONE** |
| **TASK 02** | Chuẩn hóa API Response (`{ success, message, data, meta }`) | Phase 1 | P0 | 🟢 **DONE** |
| **TASK 03** | Global Error Handling & Error Codes (`{ errorCode }`) | Phase 1 | P0 | 🟢 **DONE** |
| **TASK 04** | Global DTO Validation & Whitelist cấm unknown fields | Phase 1 | P0 | 🟢 **DONE** |
| **TASK 05** | Quản lý biến môi trường `.env` & bảo mật Secret | Phase 1 | P0 | ⚪ PENDING |
| **TASK 06** | Authentication toàn diện & băm mật khẩu bcrypt | Phase 2 | P0 | ⚪ PENDING |
| **TASK 07** | Phân quyền RBAC (Customer/Staff/Admin) & Role Guards | Phase 2 | P0 | ⚪ PENDING |
| **TASK 08** | Bảo mật JWT, Refresh Token & Thu hồi Token khi Logout | Phase 2 | P0 | ⚪ PENDING |
| **TASK 09** | Bảo mật API (Helmet, CORS, Rate Limit, Sanitization) | Phase 2 | P1 | ⚪ PENDING |
| **TASK 10** | Quản lý sản phẩm Admin & Excel Import/Export | Phase 3 | P1 | ⚪ PENDING |
| **TASK 11** | Quản lý danh mục, Slug & Cây danh mục đa cấp | Phase 3 | P1 | ⚪ PENDING |
| **TASK 12** | Tìm kiếm Full-text & Lọc đa tiêu chí phân trang | Phase 3 | P1 | ⚪ PENDING |
| **TASK 13** | Chi tiết sản phẩm, Gallery, Thông số & Đánh giá | Phase 3 | P1 | ⚪ PENDING |
| **TASK 14** | Module Giỏ hàng Backend & Kiểm kho thời gian thực | Phase 4 | P0 | ⚪ PENDING |
| **TASK 15** | Luồng Checkout an toàn & Kiểm tra nguyên tử | Phase 4 | P0 | ⚪ PENDING |
| **TASK 16** | Quản lý Sổ địa chỉ giao hàng người dùng | Phase 4 | P1 | ⚪ PENDING |
| **TASK 17** | Quản lý Đơn hàng, Vòng đời trạng thái & Hóa đơn PDF | Phase 4 | P0 | ⚪ PENDING |
| **TASK 18** | Kiến trúc Thanh toán Provider Abstraction (VNPay, MoMo, COD) | Phase 5 | P0 | ⚪ PENDING |
| **TASK 19** | Hệ thống Mã khuyến mãi (Voucher) | Phase 5 | P1 | ⚪ PENDING |
| **TASK 20** | Quản lý Tồn kho & 5 loại Inventory Transaction | Phase 5 | P0 | ⚪ PENDING |
| **TASK 21** | Đánh giá & Xếp hạng sản phẩm (Verified Purchase) | Phase 5 | P1 | ⚪ PENDING |
| **TASK 22** | Danh sách Yêu thích (Wishlist) | Phase 5 | P2 | ⚪ PENDING |
| **TASK 23** | Hệ thống Thông báo WebSocket Real-time & DB | Phase 5 | P1 | ⚪ PENDING |
| **TASK 24** | Bảng điều khiển Quản trị (Admin Analytics Dashboard) | Phase 6 | P1 | ⚪ PENDING |
| **TASK 25** | Tối ưu trải nghiệm Quản trị (Admin UX/Feedback States) | Phase 6 | P1 | ⚪ PENDING |
| **TASK 26** | Đồng bộ & Tích hợp API ứng dụng Mobile Flutter | Phase 6 | P0 | ⚪ PENDING |
| **TASK 27** | Nâng cấp trải nghiệm Mobile (UX/Offline/Shimmer) | Phase 6 | P1 | ⚪ PENDING |
| **TASK 28** | Kiểm thử tự động (Unit Tests & E2E Test Flow) | Phase 7 | P0 | ⚪ PENDING |
| **TASK 29** | Thiết lập Quy trình CI/CD Pipeline | Phase 7 | P1 | ⚪ PENDING |
| **TASK 30** | Production Readiness, Swagger OpenAPI & Docker | Phase 7 | P0 | ⚪ PENDING |

---

## 📌 4. CÁC QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)

1. **Quy tắc Miễn phí vận chuyển (Free Shipping)**:
   - Ngưỡng: `299.000đ` (`FREE_SHIPPING_THRESHOLD`).
   - Nếu `subtotal` < 299.000đ ➔ Phí ship = `30.000đ`.
   - Nếu `subtotal` >= 299.000đ ➔ Phí ship = `0đ`.
   - Phí vận chuyển phải được tính toán trên Server, không tin cậy Client gửi lên.
2. **Quy tắc Trừ kho nguyên tử (Atomic Stock Deduction)**:
   - Khi tạo đơn: Lặp qua từng item và trừ kho trong DB bằng `{ stock: { $gte: quantity } }`.
   - Nếu có bất kỳ item nào hết hàng ➔ Ném `BadRequestException` và thực hiện **Rollback** cộng lại tồn kho cho các item đã trừ trước đó.
3. **Quy tắc Quên mật khẩu & OTP**:
   - OTP gồm 6 chữ số ngẫu nhiên, lưu trong DB có thời hạn hết hạn 10 phút.
   - Nhập đúng OTP mới sinh token tạm cho phép đặt lại mật khẩu mới.
4. **Quy tắc Vòng đời Đơn hàng (Order Status Flow)**:
   - Các trạng thái: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPING` -> `DELIVERED`.
   - Hủy đơn (`CANCELLED`) phải kích hoạt hoàn lại tồn kho đúng số lượng.

---

## 📡 5. CHUẨN ĐỊNH DẠNG API (API CONTRACTS)

### Phản hồi Thành công (Success Response):
```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Phản hồi Lỗi (Error Response):
```json
{
  "success": false,
  "message": "Thông điệp lỗi thân thiện",
  "errorCode": "ERR_INSUFFICIENT_STOCK",
  "details": {}
}
```

---

## 📝 6. NHẬT KÝ CẬP NHẬT CỦA AI (AI CHANGELOG & TASK AUDIT LOG)

### [2026-08-24] — Hoàn thành TASK 04: Global DTO Validation & Whitelist cấm unknown fields
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Nâng cấp toàn bộ hệ thống DTO và cấu hình ValidationPipe toàn cục cấm unknown fields (`whitelist: true, forbidNonWhitelisted: true`), validate chặt chẽ email, phone VN, password độ phức tạp cao, giá tiền/số lượng, ObjectId MongoDB và Enum.
- **Thực hiện**:
  - Tạo mới bộ Custom Validators (`backend/src/common/validators/custom-validators.ts`):
    - `IsMongoObjectId`: Kiểm tra định dạng 24 ký tự hex MongoDB ObjectId hợp lệ.
    - `IsPhoneNumberVN`: Kiểm tra số điện thoại Việt Nam chuẩn 10 chữ số (đầu 03, 05, 07, 08, 09 hoặc +84).
  - Chuẩn hóa và thắt chặt toàn bộ DTOs:
    - `auth.dto.ts`: Trim email/họ tên, kiểm tra mật khẩu mạnh (chữ hoa, chữ thường, số, >= 8 ký tự), OTP 6 số, SĐT VN.
    - `address.dto.ts`: Trim chuỗi, kiểm tra SĐT VN cho cả tạo và sửa địa chỉ.
    - `product.dto.ts`: Kiểm tra Category ObjectId, giá >= 0, tồn kho >= 0, number/boolean casting cho `ProductQueryDto`.
    - `cart.dto.ts`: `productId` là ObjectId, số lượng nguyên >= 1.
    - `order.dto.ts`: `OrderItemDto.product` là ObjectId, số lượng nguyên >= 1, SĐT người nhận VN, format idempotencyKey.
    - `category.dto.ts`: `parentId` và `products` là ObjectId.
    - `inventory.dto.ts`: `product` là ObjectId, số lượng nguyên, enum `InventoryTransactionType`.
    - `payment.dto.ts`: `orderId` là ObjectId, `amount` >= 0, enum `PaymentMethod`.
    - `review.dto.ts`: `rating` nguyên 1-5 sao, độ dài `content`.
    - `promotion.dto.ts`: Regex format mã `code`, ngày ISO Date, số lượng/giảm giá >= 0.
    - `banner.dto.ts` & `landing-page.dto.ts`: Thứ tự `sortOrder` nguyên, SĐT VN, LandingPageId ObjectId.
  - Cấu hình `ValidationPipe` toàn cục:
    - `whitelist: true`: Tự động loại bỏ các trường không khai báo.
    - `forbidNonWhitelisted: true`: Báo lỗi ngay khi có trường lạ.
    - `transform: true`: Tự động chuyển đổi kiểu dữ liệu tương ứng.
    - `exceptionFactory`: Sinh lỗi validation chi tiết từng field kèm `ErrorCode.ERR_VALIDATION`.
  - Viết bộ unit tests chuyên biệt `dto-validation.spec.ts` kiểm thử toàn diện các DTOs và custom validators (PASS 100%).
- **Kết quả kiểm thử**:
  - `npm run build` (Backend): PASS.
  - `npm test` (Backend): 6 test suites, 50 tests PASS 100%.
  - `npm run build` (Frontend): PASS.
  - `flutter test` (Mobile): 6 tests PASS 100%.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 05 — Environment Configuration & Secrets Management.

---

### [2026-08-24] — Hoàn thành TASK 03: Global Error Handling & Error Codes
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Hoàn thiện hệ thống Global Exception Filter, gán mã lỗi `errorCode`, che giấu stack trace và credentials ở production, ghi log chi tiết có phân loại và chống rò rỉ dữ liệu nhạy cảm.
- **Thực hiện**:
  - Tạo mới `ErrorCode` Enum (`backend/src/common/enums/error-code.enum.ts`) với đầy đủ các mã lỗi hệ thống và nghiệp vụ (System, Auth, DB, Products, Cart, Orders, Payments, Inventory, Promotions, Reviews).
  - Tạo mới bộ Custom Domain Exceptions (`backend/src/common/exceptions/app.exception.ts`): `AppException`, `BusinessException`, `ResourceNotFoundException`, `UnauthorizedActionException`, `ForbiddenActionException`, `ValidationException`, `ConflictResourceException`, `InsufficientStockException`.
  - Nâng cấp `HttpExceptionFilter` (`backend/src/common/filters/http-exception.filter.ts`):
    - Tự động map exception thành mã lỗi chuẩn (`errorCode`).
    - Bắt và xử lý chuyên sâu: `HttpException`, `AppException`, Mongoose errors (`CastError` -> `ERR_INVALID_ID`, `ValidationError` -> `ERR_DB_VALIDATION`, Duplicate Key `11000` -> `ERR_DUPLICATE_KEY`), Payload Too Large (`ERR_PAYLOAD_TOO_LARGE`), JWT errors (`JsonWebTokenError` -> `ERR_INVALID_TOKEN`, `TokenExpiredError` -> `ERR_TOKEN_EXPIRED`), JSON SyntaxError.
    - Che giấu stack trace và internal details ở production (`NODE_ENV === 'production'`).
    - Tích hợp hàm `sanitizeForLogging` tự động ẩn `password`, `token`, `otp`, `secret`, `authorization`, `creditCard`, `cookie` trước khi ghi log.
    - Phân loại logging: `logger.warn` cho 4xx client errors, `logger.error` kèm stack và context an toàn cho 5xx server errors.
    - Chuẩn hóa response trả về có thêm `path` và `timestamp`.
  - Nâng cấp `ValidationPipe` trong `main.ts` với `exceptionFactory` tạo structured field-level validation errors và mã `ERR_VALIDATION`.
  - Viết bộ unit tests chuyên biệt toàn diện cho `HttpExceptionFilter` và `AppException` (100% pass).
- **Kết quả kiểm thử**:
  - `npm run build` (Backend): PASS.
  - `npm test` (Backend): 5 test suites, 34 tests PASS 100%.
  - `npm run build` (Frontend): PASS.
  - `flutter test` (Mobile): 6 tests PASS 100%.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 04 — Global DTO Validation.

---

### [2026-08-23] — Hoàn thành TASK 02: Chuẩn hóa API Response
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Chuẩn hóa toàn bộ định dạng phản hồi API (Success: `{ success, message, data, meta }`, Error: `{ success, message, errorCode, details }`).
- **Thực hiện**:
  - Nâng cấp `TransformInterceptor` tự động chuẩn hóa data payload, trích xuất pagination meta (`total`, `page`, `limit`, `totalPages`) và gán timestamp.
  - Nâng cấp `HttpExceptionFilter` trả về format lỗi chuẩn kèm `errorCode`, `details`, `statusCode`.
  - Cập nhật các view và service trên Frontend (`ProductList.vue`, `Products.vue`, `ProductDetail.vue`, `Home.vue`, `Orders.vue`, `Customers.vue`, `Combos.vue`) để xử lý format mới nhất quán và an toàn.
  - Đồng bộ test E2E mobile trong `mobile/test/app_e2e_test.dart`.
  - Viết unit tests chuyên biệt cho `TransformInterceptor` và `HttpExceptionFilter`.
- **Kết quả kiểm thử**:
  - `npm run build` (Backend): PASS.
  - `npm run test` (Backend): 4 test suites, 14 tests PASS 100%.
  - `npm run build` (Frontend): PASS.
  - `flutter test` (Mobile): 6 tests PASS 100%.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 03 — Global Error Handling.

---

### [2026-08-23] — Hoàn thành TASK 01: Chuẩn hóa cấu trúc Backend
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Chuẩn hóa toàn bộ cấu trúc module Backend, controller chỉ xử lý HTTP, business logic nằm trong service, DTO & Model riêng.
- **Thực hiện**:
  - Tạo mới `CartModule` (`cart.controller.ts`, `cart.service.ts`, `cart.module.ts`, `dto/cart.dto.ts`, `schemas/cart.schema.ts`, `cart.service.spec.ts`).
  - Tạo mới `ReviewsModule` (`reviews.controller.ts`, `reviews.service.ts`, `reviews.module.ts`, `dto/review.dto.ts`, `schemas/review.schema.ts`).
  - Tạo mới `PaymentsModule` (`payments.controller.ts`, `payments.service.ts`, `payments.module.ts`, `dto/payment.dto.ts`, `schemas/payment.schema.ts`).
  - Mở rộng `common/enums` (`PaymentMethod`, `PaymentStatus`, `InventoryTransactionType`).
  - Đăng ký `CartModule`, `PaymentsModule`, `ReviewsModule` vào `AppModule`.
  - Cập nhật Swagger tags trong `main.ts`.
- **Kết quả kiểm thử**:
  - `npm run build` (Backend): PASS.
  - `npm run test` (Backend): 2 test suites, 9 tests PASS 100%.
  - `npm run build` (Frontend): PASS.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 02 — API Response Standardization.

---

### [2026-08-23] — Khởi tạo Hồ sơ Dự án & Chuẩn bị Task 01
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Thiết lập tài liệu `PROJECT_DOCUMENTATION.md` và `AI_CONTEXT.md`.
- **Trạng thái**: Đã phân tích toàn bộ repository, xác nhận backend/frontend build thành công, xác định lộ trình 30 tasks chi tiết.

---

*(Ghi chú cho AI tiếp theo: Khi nhận lệnh mới, hãy đọc file này trước tiên để biết ngay ngữ cảnh và trạng thái hiện tại của dự án).*
