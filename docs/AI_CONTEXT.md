# 🤖 AI CONTEXT & CONTINUOUS UPDATE REGISTRY (`AI_CONTEXT.md`)

_(Hồ sơ ngữ cảnh hệ thống — AI đọc file này để nắm bắt toàn bộ dự án trong 5 giây và cập nhật sau mỗi task)_

---

## ⚡ 1. FAST PROJECT SNAPSHOT

| Hạng mục           | Giá trị                                       | Ghi chú                                         |
| :----------------- | :-------------------------------------------- | :---------------------------------------------- |
| **Tên dự án**      | Trường Thành Bookstore                        | Thương mại điện tử sách & văn phòng phẩm        |
| **Backend**        | NestJS v11 (TypeScript, Node.js)              | Port: `3000`, Prefix: `/api`, Docs: `/api/docs` |
| **Database**       | MongoDB + Mongoose 9                          | MongoDB URI trong `.env`                        |
| **Frontend**       | Vue 3 (Composition API) + Vite 8 + Tailwind 4 | Port: `5173`, State: Pinia, Route: Vue Router   |
| **Mobile**         | Flutter SDK (^3.11) + Dart                    | State: Provider, Đa nền tảng Android/iOS        |
| **Realtime**       | WebSocket Socket.IO                           | Namespace: `/notifications`                     |
| **Storage & Mail** | Cloudinary + Nodemailer SMTP                  | Ảnh & Email giao dịch                           |
| **Tiến độ Task**   | **30 / 30 tasks (100%)**                     | Toàn bộ 30 tasks hoàn thành 100%               |

---

## 🗺️ 2. BACKEND MODULES MAP & RESPONSIBILITIES

```text
backend/src/modules/
├── auth/            -> Login, Register, Logout, RefreshToken, ForgotPassword (OTP 6 số), ResetPassword
├── users/           -> Profile, Addresses (sổ địa chỉ CRUD), Wishlist (Multi-platform sync)
├── products/        -> Quản lý sách/VPP, SKU, ISBN, Lọc nâng cao, Excel Import/Export
├── categories/      -> Cây danh mục phân cấp (Parent/Child), Slug
├── cart/            -> Quản lý giỏ hàng backend, kiểm tra tồn kho realtime, tạm tính giá
├── orders/          -> Tạo đơn hàng, trừ kho nguyên tử (Atomic rollback), xuất hóa đơn PDF
├── payments/        -> Lớp trừu tượng cổng thanh toán (COD, Bank Transfer, VNPay, MoMo)
├── inventory/       -> Giao dịch kho (IMPORT, SALE, RETURN, ADJUSTMENT, DAMAGE), cảnh báo hết hàng
├── reviews/         -> Đánh giá & xếp hạng sản phẩm (Verified Purchase check, Admin Reply, Moderate)
├── promotions/      -> Mã giảm giá (Coupon), kiểm tra điều kiện áp dụng & số lượt sử dụng
├── notifications/   -> WebSocket Gateway & Lưu trữ thông báo DB, Unread count, Admin alerts
├── reports/         -> Báo cáo thống kê doanh thu, AOV, KPI Dashboard cho Admin
├── customers/       -> Quản lý danh sách khách hàng và lịch sử mua sắm cho Admin
├── banners/         -> Quản lý banner quảng cáo hiển thị trên Web/App
├── landing-pages/   -> Quản lý trang sự kiện flash sale/khuyến mãi động
└── email/           -> Gửi mail OTP, xác nhận đơn hàng, cảnh báo tồn kho
```

---

## 📋 3. BẢNG TIẾN ĐỘ 30 TASKS (ROADMAP STATUS MATRIX)

| Mã Task     | Tên Task & Mục tiêu                                             | Phase   | Độ ưu tiên | Trạng thái  |
| :---------- | :-------------------------------------------------------------- | :------ | :--------- | :---------- |
| **TASK 01** | Chuẩn hóa cấu trúc Backend (Controller/Service/DTO/Module)      | Phase 1 | P0         | 🟢 **DONE** |
| **TASK 02** | Chuẩn hóa API Response (`{ success, message, data, meta }`)     | Phase 1 | P0         | 🟢 **DONE** |
| **TASK 03** | Global Error Handling & Error Codes (`{ errorCode }`)           | Phase 1 | P0         | 🟢 **DONE** |
| **TASK 04** | Global DTO Validation & Whitelist cấm unknown fields            | Phase 1 | P0         | 🟢 **DONE** |
| **TASK 05** | Quản lý biến môi trường `.env` & bảo mật Secret                 | Phase 1 | P0         | 🟢 **DONE** |
| **TASK 06** | Authentication toàn diện & băm mật khẩu bcrypt                  | Phase 2 | P0         | 🟢 **DONE** |
| **TASK 07** | Phân quyền RBAC (Customer/Staff/Admin/SuperAdmin) & Role Guards | Phase 2 | P0         | 🟢 **DONE** |
| **TASK 08** | Bảo mật JWT, Refresh Token & Thu hồi Token khi Logout           | Phase 2 | P0         | 🟢 **DONE** |
| **TASK 09** | Bảo mật API (Helmet, CORS, Rate Limit, Sanitization)            | Phase 2 | P1         | 🟢 **DONE** |
| **TASK 10** | Quản lý sản phẩm Admin & Excel Import/Export                    | Phase 3 | P1         | 🟢 **DONE** |
| **TASK 11** | Quản lý danh mục, Slug & Cây danh mục đa cấp                    | Phase 3 | P1         | 🟢 **DONE** |
| **TASK 12** | Tìm kiếm Full-text & Lọc đa tiêu chí phân trang                 | Phase 3 | P1         | 🟢 **DONE** |
| **TASK 13** | Chi tiết sản phẩm, Gallery, Thông số & Đánh giá                 | Phase 3 | P1         | 🟢 **DONE** |
| **TASK 14** | Module Giỏ hàng Backend & Kiểm kho thời gian thực               | Phase 4 | P0         | 🟢 **DONE** |
| **TASK 15** | Luồng Checkout an toàn & Kiểm tra nguyên tử                     | Phase 4 | P0         | 🟢 **DONE** |
| **TASK 16** | Quản lý Sổ địa chỉ giao hàng người dùng                         | Phase 4 | P1         | 🟢 **DONE** |
| **TASK 17** | Quản lý Đơn hàng, Vòng đời trạng thái & Hóa đơn PDF             | Phase 4 | P0         | 🟢 **DONE** |
| **TASK 18** | Kiến trúc Thanh toán Provider Abstraction (VNPay, MoMo, COD)    | Phase 5 | P0         | 🟢 **DONE** |
| **TASK 19** | Hệ thống Mã khuyến mãi (Voucher)                                | Phase 5 | P1         | 🟢 **DONE** |
| **TASK 20** | Quản lý Tồn kho & 5 loại Inventory Transaction                  | Phase 5 | P0         | 🟢 **DONE** |
| **TASK 21** | Đánh giá & Xếp hạng sản phẩm (Verified Purchase & Moderation)   | Phase 5 | P1         | 🟢 **DONE** |
| **TASK 22** | Danh sách Yêu thích (Wishlist Multi-Platform Sync & MoveCart)   | Phase 5 | P2         | 🟢 **DONE** |
| **TASK 23** | Hệ thống Thông báo WebSocket Real-time & DB Alerts              | Phase 5 | P1         | 🟢 **DONE** |
| **TASK 24** | Bảng điều khiển Quản trị (Admin Analytics Dashboard & KPIs)     | Phase 6 | P1         | 🟢 **DONE** |
| **TASK 25** | Tối ưu trải nghiệm Quản trị (Admin UX/Feedback States/Modals)   | Phase 6 | P1         | 🟢 **DONE** |
| **TASK 26** | Đồng bộ & Tích hợp API ứng dụng Mobile Flutter                  | Phase 6 | P0         | 🟢 **DONE** |
| **TASK 27** | Nâng cấp trải nghiệm Mobile (UX/Offline/Shimmer)                | Phase 6 | P1         | 🟢 **DONE** |
| **TASK 28** | Kiểm thử tự động (Unit Tests & E2E Test Flow)                   | Phase 7 | P0         | 🟢 **DONE** |
| **TASK 29** | Thiết lập Quy trình CI/CD Pipeline                              | Phase 7 | P1         | 🟢 **DONE** |
| **TASK 30** | Production Readiness, Swagger OpenAPI & Docker                  | Phase 7 | P0         | 🟢 **DONE** |

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
5. **Quy tắc Sổ địa chỉ & Địa chỉ mặc định (Address Invariants)**:
   - Khi người dùng tạo địa chỉ đầu tiên, địa chỉ này tự động được gán `isDefault: true`.
   - Khi đặt hoặc cập nhật một địa chỉ thành `isDefault: true`, toàn bộ địa chỉ khác của người dùng tự động được cập nhật `isDefault: false`.
   - Khi xóa mềm (soft delete) một địa chỉ đang là mặc định, hệ thống tự động thăng cấp địa chỉ hợp lệ gần nhất thành mặc định mới, đảm bảo khách hàng luôn có 1 địa chỉ chính để thanh toán thuận tiện.

---

## 📡 5. CHUẨN ĐỊNG DẠNG API (API CONTRACTS)

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

### [2026-09-01] — Hoàn thành TASK 26 đến TASK 30: Mobile Integration, Mobile UX, Comprehensive Tests, CI/CD Pipeline & Production Readiness (100% DONE)

- **Người cập nhật**: Antigravity AI (Multi-role Senior Team)
- **Mục tiêu**: Hoàn thiện trọn vẹn 5 tasks cuối cùng, đưa toàn bộ 30/30 tasks của dự án Trường Thành Bookstore về đích 100%:
  - **TASK 26 (Mobile API Integration)**: Đồng bộ toàn diện ứng dụng Flutter Mobile với hệ thống API Backend NestJS: Xây dựng `AddressModel`, `ReviewModel`, `NotificationModel`, `NotificationProvider`, `ReviewProvider`, và nâng cấp `WishlistProvider` hỗ trợ đồng bộ Server và Local Storage.
  - **TASK 27 (Mobile UX & Resilience)**: Nâng cấp trải nghiệm Mobile chuyên nghiệp: Bộ widgets Shimmer Skeleton Loading (`ProductCardSkeleton`, `ProductListSkeleton`, `OrderItemSkeleton`, `NotificationItemSkeleton`), `EmptyStateWidget` với call-to-action buttons, `ErrorRetryWidget` xử lý mất mạng/lỗi mạng mượt mà, màn hình `WishlistScreen` và `NotificationsScreen` hỗ trợ Pull-to-Refresh và dismiss actions.
  - **TASK 28 (Automated Testing Suite)**: Thiết lập mạng lưới kiểm thử tự động toàn diện:
    - Backend: 21 unit test suites (246/246 tests PASS), `test/all-fixes.spec.ts` (11/11 tests PASS), `test/e2e-flow.spec.ts` (7/7 tests PASS).
    - Mobile: 16/16 tests PASS (`app_e2e_test.dart`, `unit_providers_test.dart`, `ux_components_test.dart`, `widget_test.dart`).
    - Build: `npm run build` Backend & Frontend PASS 100% (0 errors).
  - **TASK 29 (CI/CD Pipeline)**: Xây dựng bộ quy trình GitHub Actions tự động hóa: `.github/workflows/ci.yml` (multi-job Backend, Frontend, Mobile), `.github/workflows/docker-build.yml` (kiểm tra build container), `.github/workflows/release.yml` (tự động phát hành phiên bản và changelog).
  - **TASK 30 (Production Readiness, Swagger & Docker)**:
    - Nâng cấp endpoint Health Check `GET /api/health` trả về trạng thái chi tiết CSDL MongoDB, Uptime, Memory RSS/Heap.
    - Kích hoạt Graceful Shutdown (`app.enableShutdownHooks()`).
    - Hoàn thiện tài liệu Swagger OpenAPI tại `/api/docs`.
    - Thiết lập Dockerization toàn diện: `backend/Dockerfile` đa tầng an toàn với non-root user `node` và font PDF, `frontend/Dockerfile` đa tầng với Nginx Alpine nén Gzip và proxy `/api`, file cấu hình Nginx `frontend/nginx.conf`, file điều phối `docker-compose.yml` (MongoDB + Backend + Frontend + Mongo Express).
    - Cập nhật 100% hồ sơ tài liệu dự án (`AI_CONTEXT.md`, `PROJECT_DOCUMENTATION.md`, `DOC.md`, `PROJECT_SPECIFICATION.md`, `project_overview.md`, `README.md`).
- **Kết quả kiểm thử**:
  - `npm test` Backend: 21 suites, 246/246 tests PASS 100%.
  - `npx jest --rootDir . test/all-fixes.spec.ts`: 11/11 tests PASS 100%.
  - `npx jest --rootDir . test/e2e-flow.spec.ts`: 7/7 tests PASS 100%.
  - `npm run build` Backend: PASS (0 errors).
  - `npm run build` Frontend: PASS (0 errors).
  - `flutter test` Mobile: 16/16 tests PASS 100%.
- **Trạng thái**: 🟢 **DỰ ÁN HOÀN THÀNH 100% (30 / 30 TASKS DONE)**.

---

### [2026-08-30] — Hoàn thành TASK 21 đến TASK 25: Verified Reviews, Wishlist Sync, WebSocket Notifications, Admin Analytics & UX Polish

- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Triển khai trọn vẹn 5 tasks cốt lõi nâng cao chất lượng hệ thống thương mại điện tử sách & VPP:
  - **TASK 21**: Đánh giá & Xếp hạng sản phẩm (chỉ khách đã mua hàng giao thành công mới được đánh giá, kiểm duyệt hiển thị, phản hồi từ Admin, bảng phân bổ sao 1★-5★).
  - **TASK 22**: Danh sách Yêu thích (Wishlist đa nền tảng, tự động làm sạch tham chiếu sản phẩm đã xóa, chuyển thẳng sang giỏ hàng `move-to-cart`, sửa triệt để xung đột thứ tự route Express).
  - **TASK 23**: Hệ thống Thông báo WebSocket Real-time & DB (Socket.IO namespace `notifications`, rooms `user:${userId}` & `admin`, unread count, đánh dấu đã đọc/tất cả, cảnh báo tồn kho & đơn hàng mới).
  - **TASK 24**: Bảng điều khiển Quản trị (Admin Analytics Dashboard KPIs, phân bổ doanh thu theo danh mục, tỷ lệ trạng thái đơn hàng, biểu đồ tăng trưởng khách hàng).
  - **TASK 25**: Tối ưu trải nghiệm Quản trị (bộ components `ConfirmModal.vue`, `SkeletonLoader.vue`, `EmptyState.vue`, trang quản trị đánh giá `Reviews.vue`, feedback toasts nhất quán).
- **Thực hiện Backend**:
  - `ReviewsModule`: Thêm `isVerifiedPurchase`, `adminReply`, `adminReplyAt`, compound indexes, API `breakdown`, `can-review`, `admin reply`, và unit tests `reviews.service.spec.ts` (13/13 tests PASS).
  - `UsersModule`: Khắc phục thứ tự routes `@Get('wishlist')` trước `@Get(':id')`, thêm `moveToCart`, `removeFromWishlist`, `getWishlist` kèm unit tests `users.service.spec.ts` (20/20 tests PASS).
  - `NotificationsModule`: Schema với `isRead`, `readBy`, WebSocket gateway phòng admin/user, auto triggers khi có đơn hàng/cảnh báo tồn kho, unit tests `notifications.service.spec.ts` (7/7 tests PASS).
  - `ReportsModule`: Phương thức `getSummary`, `getOrderStatusStats`, `getCategoryRevenue`, unit tests `reports.service.spec.ts` (4/4 tests PASS).
- **Thực hiện Frontend & Mobile**:
  - `frontend/src/services/`: Cập nhật `review.service.ts`, `user.service.ts`, `notification.service.ts`, `report.service.ts`.
  - `frontend/src/components/`: Xây dựng mới `ConfirmModal.vue`, `SkeletonLoader.vue`, `EmptyState.vue`.
  - `frontend/src/pages/admin/Reviews.vue`: Trang kiểm duyệt và phản hồi đánh giá sản phẩm.
  - `frontend/src/pages/customer/Wishlist.vue`: Nâng cấp giao diện với nút chuyển vào giỏ hàng và xóa tức thì.
  - `frontend/src/pages/customer/ProductDetail.vue`: Hiển thị huy hiệu "Đã mua hàng" và phản hồi chính thức từ cửa hàng.
  - `mobile/lib/core/constants/api_constants.dart`: Bổ sung toàn bộ endpoint wishlist, reviews, notifications.
- **Kết quả kiểm thử**:
  - `npm test` (Backend): 21 test suites, 246/246 tests PASS 100%.
  - `npm run build` (Backend): PASS (0 errors).
  - `npm run build` (Frontend): PASS (0 errors).
  - `flutter test` (Mobile): PASS.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 26 — Đồng bộ & Tích hợp API ứng dụng Mobile Flutter.

---

### [2026-08-30] — Hoàn thành TASK 17–20: Order Lifecycle, Payment Providers, Voucher & Inventory Ledger
- **Người cập nhật**: Codex
- **Mục tiêu**: Hoàn thiện liên thông bốn phân hệ nghiệp vụ trọng yếu sau checkout trên Backend NestJS, Frontend Vue 3 và Mobile Flutter; bảo vệ vòng đời đơn hàng, thanh toán trực tuyến, giới hạn voucher và mọi biến động kho bằng quy tắc server-side cùng audit log.
- **TASK 17 — Order Lifecycle & Invoice**:
  - Chuẩn hóa luồng `PENDING -> CONFIRMED -> PROCESSING -> SHIPPING -> DELIVERED`, hỗ trợ `CANCELLED`, `RETURNED` và tương thích dữ liệu lịch sử `COMPLETED`.
  - Cấm nhảy cóc trạng thái bằng ma trận chuyển đổi; hỗ trợ ghi chú audit timeline; COD tự chuyển `PAID` khi giao thành công.
  - Hủy/hoàn trả chỉ hoàn kho một lần, hoàn lại số lượng đã bán và phát sinh transaction `RETURN`; kiểm tra owner/staff/admin cho chi tiết, hủy và hóa đơn PDF.
- **TASK 18 — Payment Provider Abstraction**:
  - Xây dựng `PaymentProvider` + registry cho `COD`, `BANK_TRANSFER`, `VNPAY`, `MOMO`; loại bỏ `EWALLET` mơ hồ khỏi luồng tạo thanh toán mới nhưng giữ tương thích đơn cũ.
  - Số tiền, mã đơn, quyền sở hữu và phương thức được đối chiếu trực tiếp từ Order trong DB; không tin dữ liệu client.
  - Callback có HMAC signature, so khớp amount, idempotency chống callback trùng/xung đột, timeout 15 phút cho online gateway và tự đồng bộ `Order.paymentStatus`.
  - Bổ sung cấu hình fail-fast `ENABLED_PAYMENT_METHODS` và secret/URL cho từng gateway trong `.env.example`.
- **TASK 19 — Voucher System**:
  - Bổ sung `perUserLimit`, collection `PromotionUsage` lưu identity SHA-256 không chứa PII và unique compound index.
  - Giới hạn tổng + theo khách được reserve nguyên tử; rollback bộ đếm khi checkout lỗi/hủy đơn; vẫn đối chiếu lịch sử đơn cũ để tương thích dữ liệu.
  - Đồng bộ form quản trị Web cho giới hạn lượt dùng theo khách.
- **TASK 20 — Inventory Ledger**:
  - Chuẩn hóa đúng 5 loại `IMPORT`, `SALE`, `RETURN`, `ADJUSTMENT`, `DAMAGE`; mỗi log lưu `change`, `stockBefore`, `stockAfter`, `reference`, `order` và người thao tác.
  - Các nghiệp vụ giảm kho dùng atomic deduction nên không thể âm; hỗ trợ idempotent reference và transaction MongoDB/fallback bù trừ.
  - Đơn mới tự ghi `SALE`; hủy/hoàn trả tự ghi `RETURN`; giao diện Admin hiển thị số dư trước/sau và đủ 5 loại biến động.
- **Đồng bộ đa nền tảng**:
  - Web cập nhật types, trạng thái, Dashboard, Checkout/payment action, quản trị Order/Promotion/Inventory.
  - Mobile cập nhật trạng thái hành trình, VNPay/MoMo, khởi tạo payment action và nội dung hướng dẫn sau đặt hàng.
- **Kết quả kiểm thử**:
  - Test chuyên biệt Task 17–20: **4/4 suites, 21/21 tests PASS**.
  - `npm test` Backend toàn bộ: **18/18 suites, 218/218 tests PASS**.
  - `npm run build` Backend: **PASS**.
  - `npm run build` Frontend: **PASS**.
  - `flutter test` Mobile: **6/6 tests PASS**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 21 — Đánh giá & Xếp hạng sản phẩm (Verified Purchase).

---

### [2026-08-29] — Hoàn thành TASK 16: Quản lý Sổ địa chỉ giao hàng người dùng
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Nâng cấp toàn diện phân hệ Sổ địa chỉ nhận hàng (Address Book Management) của Trường Thành Bookstore trên cả 3 nền tảng Backend NestJS, Frontend Web Vue 3 và Mobile App Flutter: Đảm bảo tính bất biến của địa chỉ mặc định (Default Address Invariant), compound indexing `{ user: 1, isDefault: 1, isDeleted: 1 }`, endpoint chuyên biệt `GET /addresses/default`, tự động chuyển đổi địa chỉ mặc định khi xóa/tạo/cập nhật, xác thực số điện thoại 10 số chuẩn VN, đồng bộ dịch vụ `addressService` trên Web Vue 3 & Mobile Flutter và bảo vệ 100% unit tests.
- **Thực hiện**:
  - **Backend NestJS**:
    - `backend/src/modules/users/schemas/address.schema.ts`: Bổ sung Compound Index tối ưu `{ user: 1, isDefault: 1, isDeleted: 1 }`.
    - `backend/src/modules/users/addresses.service.ts`:
      - `create`: Tự động gán `isDefault: true` nếu là địa chỉ đầu tiên, un-default các địa chỉ khác nếu tạo với `isDefault: true`.
      - `update`: Đảm bảo un-default an toàn các địa chỉ khác khi đổi sang mặc định.
      - `softDelete`: Khi xóa địa chỉ đang là mặc định, tự động truy vấn địa chỉ hợp lệ kế tiếp (`{ user, isDeleted: false }`) và thăng cấp thành `isDefault: true`.
      - `getDefault`: Truy vấn nhanh địa chỉ mặc định phục vụ luồng checkout.
      - `setDefault`: Chuyển đổi địa chỉ mặc định tức thì.
    - `backend/src/modules/users/addresses.controller.ts`: Sử dụng `@CurrentUser('_id')`, bổ sung rate-limiting `@Throttle`, tài liệu hóa Swagger và khai báo `GET /addresses/default` trước `:id` chống lỗi routing.
    - `backend/src/modules/users/addresses.service.spec.ts`: Tạo 13 unit tests bao phủ 100% kịch bản CRUD, default address invariant, auto-promotion và soft delete.
  - **Frontend Web Vue 3**:
    - `frontend/src/types/index.ts`: Bổ sung `Address`, `CreateAddressPayload`, `UpdateAddressPayload`.
    - `frontend/src/services/address.service.ts`: Xây dựng đầy đủ `getAll`, `getById`, `getDefault`, `create`, `update`, `delete`, `setDefault`.
    - `frontend/src/pages/customer/Addresses.vue`: Giao diện hiện đại tông đỏ thương hiệu (`#dc2626`), preset nhãn địa chỉ nhanh (Nhà riêng, Văn phòng...), kiểm tra SĐT 10 số VN, hiệu ứng thẻ địa chỉ mặc định, modal/card tương tác mượt mà và SEO Meta tags.
    - `frontend/src/pages/customer/Checkout.vue`: Tích hợp `addressService`, tải nhanh danh sách sổ địa chỉ và tự động điền địa chỉ mặc định khi vào trang thanh toán.
  - **Mobile App Flutter**:
    - `mobile/lib/screens/profile/address_book_screen.dart`: Giao diện sổ địa chỉ với nhãn mặc định, form tạo/sửa đầy đủ trường và validation SĐT.
    - `mobile/lib/screens/checkout/checkout_screen.dart`: Tích hợp tự động tải sổ địa chỉ người dùng và dropdown chọn nhanh địa chỉ giao hàng.
- **Kết quả kiểm thử**:
  - `npm test` (Backend): **15/15 test suites passed, 207/207 tests PASS 100%**.
  - `npm run build` (Backend): **PASS 100% (0 lỗi)**.
  - `npm run build` (Frontend): **PASS 100% (0 lỗi)**.
  - `flutter test` (Mobile): **6/6 tests PASS 100%**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 17 — Quản lý Đơn hàng, Vòng đời trạng thái & Hóa đơn PDF.

---

### [2026-08-28] — Hoàn thành TASK 15: Luồng Checkout an toàn & Kiểm tra nguyên tử

- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Chuẩn hóa và bảo vệ toàn diện luồng Đặt hàng & Thanh toán (Safe Checkout Journey) của Trường Thành Bookstore trên cả 3 nền tảng Backend NestJS, Frontend Web Vue 3 và Mobile App Flutter: Quy trình đa bước an toàn (`Cart -> Address -> Shipping -> Promotion -> Payment -> Confirm -> Order`), endpoint xem trước và kiểm tra nguyên tử `POST /orders/checkout-preview`, trừ kho nguyên tử với rollback bù trừ, chống duplicate order bằng `idempotencyKey`, tự động làm sạch giỏ hàng trên backend (`CartService.clearCart`) khi đặt hàng thành công và bảo vệ 100% unit tests.
- **Thực hiện**:
  - **Backend NestJS**:
    - `backend/src/modules/orders/dto/order.dto.ts`: Bổ sung `CheckoutPreviewDto` hỗ trợ tính toán trước chi phí và kiểm tra tính toàn vẹn của giỏ hàng, địa chỉ, voucher.
    - `backend/src/modules/orders/orders.module.ts`: Import `CartModule` vào `OrdersModule`.
    - `backend/src/modules/orders/orders.service.ts`:
      - `checkoutPreview`: Xác thực dữ liệu sản phẩm thời gian thực (tồn tại, không bị xóa, active), tự động điều chỉnh/cảnh báo nếu vượt tồn kho, xác thực voucher, tính toán chuẩn xác `subtotal`, `shippingFee` (ngưỡng Freeship 299K), `discount`, `total`, `isEligibleForFreeShipping`, `amountNeededForFreeShipping`, `warnings`, `isValidForCheckout`.
      - `createAtomic`: Bảo toàn cơ chế `idempotencyKey`, trừ kho nguyên tử có rollback, tích hợp `CartService.clearCart(userId)` làm sạch giỏ hàng ngay khi đơn hàng được tạo thành công.
    - `backend/src/modules/orders/orders.controller.ts`: Bổ sung `POST /orders/checkout-preview` có Throttle bảo vệ.
    - `backend/src/modules/orders/orders.service.spec.ts`: Bổ sung 4 unit tests bao phủ `checkoutPreview`, tính toán Freeship 299K, điều chỉnh tồn kho và áp mã voucher.
  - **Frontend Web Vue 3**:
    - `frontend/src/services/order.service.ts`: Bổ sung API client `checkoutPreview`.
    - `frontend/src/pages/customer/Checkout.vue`: Tích hợp `checkoutPreview` tự động trước khi gửi đơn hàng, validate thông tin nhận hàng/SĐT chuẩn VN, tạo và quản lý mã chống trùng lặp `idempotencyKey` trong `sessionStorage`, xóa giỏ hàng local sau khi đặt hàng thành công.
  - **Mobile App Flutter**:
    - `mobile/lib/screens/checkout/checkout_screen.dart`: Đồng bộ kiểm tra thông tin giao hàng, áp dụng voucher và làm sạch giỏ hàng khi đặt hàng thành công.
- **Kết quả kiểm thử**:
  - `npm test` (Backend): **14/14 test suites passed, 194/194 tests PASS 100%**.
  - `npx jest test/all-fixes.spec.ts` (Backend QA): **11/11 tests PASS 100%**.
  - `npm run build` (Backend): **PASS 100% (0 lỗi)**.
  - `npm run build` (Frontend): **PASS 100% (0 lỗi)**.
  - `flutter test` (Mobile): **6/6 tests PASS 100%**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 16 — Quản lý Sổ địa chỉ giao hàng người dùng.

### [2026-08-28] — Hoàn thành TASK 14: Module Giỏ hàng Backend & Kiểm kho thời gian thực
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Xây dựng và chuẩn hóa toàn diện phân hệ Giỏ hàng (Cart Module) của Trường Thành Bookstore trên cả 3 nền tảng Backend NestJS, Frontend Web Vue 3 và Mobile App Flutter: Kiểm tra và làm sạch giỏ hàng theo tồn kho thời gian thực (Real-time Inventory Validation), phát hiện thay đổi giá/khuyến mãi, tính toán phí ship và ngưỡng Freeship 299.000đ chuẩn server-side, hệ thống áp dụng/hủy mã giảm giá voucher (`POST /cart/voucher`, `DELETE /cart/voucher`), đồng bộ giỏ hàng offline của khách vào tài khoản khi đăng nhập (`POST /cart/sync`), endpoint xác thực tính hợp lệ trước checkout (`GET /cart/validate`) và bảo vệ 100% unit tests.
- **Thực hiện**:
  - **Backend NestJS**:
    - `backend/src/modules/cart/schemas/cart.schema.ts`: Mở rộng `CartSchema` với `AppliedVoucherSchema` (code, discountType, discountValue, discountAmount, minOrderValue, maxDiscount), `shippingFee`, `discountAmount`, `totalPrice`.
    - `backend/src/modules/cart/dto/cart.dto.ts`: Bổ sung `ApplyVoucherDto`.
    - `backend/src/modules/cart/cart.module.ts`: Đăng ký `PromotionSchema` trong `MongooseModule.forFeature`.
    - `backend/src/modules/cart/cart.service.ts`:
      - `calculateCartTotals`: Tính toán tự động `subtotal`, `shippingFee` (ngưỡng 299K), `discountAmount` (voucher % có trần hoặc fixed), `totalPrice`.
      - `getCart`: Tự động làm sạch sản phẩm bị xóa, ngừng kinh doanh, tự động điều chỉnh số lượng (cap) theo tồn kho thực tế, cập nhật giá mới nhất.
      - `validateCart`: Trả về `CartValidationResult` với `warnings`, `freeShippingThreshold: 299000`, `amountNeededForFreeShipping`, `isEligibleForFreeShipping`, `isValidForCheckout`.
      - `addToCart`, `updateItemQuantity`, `removeItem`, `clearCart`: Quản lý giỏ hàng an toàn, kiểm kho tức thì.
      - `syncCart`: Hợp nhất giỏ hàng offline vào tài khoản.
      - `applyVoucher` & `removeVoucher`: Kiểm tra hạn sử dụng, lượt dùng, đơn tối thiểu `minOrderValue` và tính giảm giá.
    - `backend/src/modules/cart/cart.controller.ts`: Bổ sung `GET /cart/validate`, `POST /cart/voucher`, `DELETE /cart/voucher`.
    - `backend/src/modules/cart/cart.service.spec.ts`: Bổ sung 13 unit tests bao phủ 100% các kịch bản tính toán, freeship 299K, kiểm kho, voucher.
  - **Frontend Web Vue 3**:
    - `frontend/src/services/cart.service.ts`: API client kết nối đầy đủ các endpoints giỏ hàng.
    - `frontend/src/stores/cart.ts`: Mở rộng `useCartStore` với `freeShippingThreshold` (299K), `freeShippingProgress`, `amountNeededForFreeShipping`, `isFreeShipping`, `syncWithServer`, `validateCartBeforeCheckout`.
    - `frontend/src/pages/customer/Cart.vue`: Hiển thị thanh tiến trình Freeship 299K, cảnh báo cập nhật giỏ hàng/giá, đồng bộ giỏ hàng khi tải trang và kiểm tra trước khi chuyển sang Checkout.
  - **Mobile App Flutter**:
    - `mobile/lib/providers/cart_provider.dart`: Cập nhật `freeShippingThreshold` (299K), `freeShippingProgress`, `amountNeededForFreeShipping`, `isFreeShipping`, tự động giới hạn số lượng theo `product.stock`.
- **Kết quả kiểm thử**:
  - `npm test` (Backend): **14/14 test suites passed, 190/190 tests PASS 100%**.
  - `npx jest test/all-fixes.spec.ts` (Backend QA): **11/11 tests PASS 100%**.
  - `npm run build` (Backend): **PASS 100% (0 lỗi)**.
  - `npm run build` (Frontend): **PASS 100% (0 lỗi)**.
  - `flutter test` (Mobile): **6/6 tests PASS 100%**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 15 — Luồng Checkout an toàn & Kiểm tra nguyên tử.

### [2026-08-28] — Hoàn thành TASK 13: Chi tiết sản phẩm, Gallery, Thông số & Đánh giá
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Nâng cấp toàn diện phân hệ Chi tiết sản phẩm (Product Detail View & APIs) của Trường Thành Bookstore thành một trải nghiệm thương mại điện tử chuyên sâu, chuẩn SEO, hỗ trợ đầy đủ thông số sách & văn phòng phẩm, thư viện ảnh tương tác cao với Lightbox Zoom, hệ thống phân bổ đánh giá 5 sao kèm bộ lọc sao & huy hiệu Đã mua hàng, thuật toán gợi ý sản phẩm liên quan thông minh và đồng bộ 100% trên cả Backend NestJS, Frontend Web Vue 3 và Mobile Flutter.
- **Thực hiện**:
  - **Backend NestJS**:
    - `backend/src/modules/products/products.service.ts`:
      - Nâng cấp `findById(id)`: Tự động phân biệt và hỗ trợ tìm kiếm bằng MongoDB ObjectId hoặc SEO Slug, tự động populate danh mục liên kết và loại trừ sản phẩm bị xóa (`isDeleted: false`).
      - Thêm mới `findBySlug(slug)`: Tra cứu sản phẩm bằng đường dẫn thân thiện SEO.
      - Thêm mới `getRelated(id, limit)`: Thuật toán gợi ý thông minh ưu tiên sản phẩm cùng danh mục, cùng tác giả, nhà xuất bản hoặc thương hiệu; tự động loại trừ sản phẩm hiện tại (`_id: { $ne: currentId }`), sắp xếp theo rating và số lượng bán; hỗ trợ fallback mượt mà khi không đủ số lượng.
    - `backend/src/modules/products/products.controller.ts`:
      - Thêm route `GET /products/slug/:slug` (Swagger documented).
      - Thêm route `GET /products/:id/related` (Swagger documented).
    - `backend/src/modules/products/products.service.spec.ts`:
      - Bổ sung test suite chi tiết kiểm thử `findById`, `findBySlug`, `getRelated` và các kịch bản fallback.
  - **Frontend Web Vue 3**:
    - `frontend/src/services/product.service.ts`: Bổ sung `getBySlug` và `getRelated`.
    - `frontend/src/types/index.ts`: Cập nhật `Product` interface hỗ trợ `author`, `publisher`, `publicationYear`, `isbn`.
    - `frontend/src/pages/customer/ProductDetail.vue`:
      - **Thông số kỹ thuật đa năng**: Hiển thị linh hoạt tác giả, nhà xuất bản, năm xuất bản, ISBN, thương hiệu, mã SKU, danh mục, đơn vị tính, tình trạng kho, xuất xứ, nhà phân phối.
      - **Thư viện ảnh Gallery & Lightbox**: Hỗ trợ nhấp xem ảnh phóng to Modal Lightbox toàn màn hình, chuyển ảnh Prev/Next, phím tắt bàn phím (ESC, Mũi tên trái/phải), thanh thumbnails trượt.
      - **Hệ thống đánh giá đa chiều**: Bảng phân bổ 5 mức sao (1★ - 5★) kèm thanh tiến trình phần trăm, bộ lọc đánh giá theo số sao (Tất cả, 5 sao, 4 sao, 3 sao, 2 sao, 1 sao), huy hiệu *✓ Đã mua hàng*, form gửi & chỉnh sửa đánh giá trực tiếp.
      - **Sản phẩm liên quan & Gợi ý**: Kết nối API `getRelated` hiển thị danh sách sản phẩm cùng loại.
  - **Mobile App Flutter**:
    - `mobile/lib/models/product_model.dart`: Bổ sung trường `publicationYear` vào model (constructor, fromJson, toJson).
    - `mobile/lib/screens/product/product_detail_screen.dart`: Cập nhật bảng thông số sản phẩm hiển thị đầy đủ thông tin sách (Tác giả, NXB, Năm XB, ISBN, Thương hiệu, SKU, Tình trạng).
- **Kết quả kiểm thử**:
  - `npm test` (Backend): **14/14 test suites passed, 180/180 tests PASS 100%**.
  - `npx jest test/all-fixes.spec.ts` (Backend QA): **11/11 tests PASS 100%**.
  - `npm run build` (Backend): **PASS 100% (0 lỗi)**.
  - `npm run build` (Frontend): **PASS 100% (0 lỗi)**.
  - `flutter test` (Mobile): **6/6 tests PASS 100%**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 14 — Module Giỏ hàng Backend & Kiểm kho thời gian thực.

### [2026-08-28] — Hoàn thành TASK 12: Tìm kiếm Full-text & Lọc đa tiêu chí phân trang
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Nâng cấp toàn diện bộ máy tìm kiếm & khám phá sản phẩm (Discovery Engine) của Trường Thành Bookstore thành hệ thống thông minh, tốc độ cao và an toàn: Tìm kiếm Full-text & Diacritic-insensitive Tiếng Việt không phân biệt dấu/hoa thường (Tên, SKU, ISBN, Tác giả, NXB, Thương hiệu, Mô tả), chống tấn công ReDoS, API gợi ý tìm kiếm tức thì Autocomplete Suggestions (`GET /products/suggestions`), bộ lọc đa diện lồng nhau (Cây danh mục đệ quy cha-con, Khoảng giá, Sao, Tồn kho, Khuyến mãi, Flash Sale, Đa thương hiệu/Tác giả/NXB), bộ sắp xếp 8 chế độ, phân trang chuẩn hóa và đồng bộ 100% lên Frontend Web Vue 3 và Mobile App Flutter.
- **Thực hiện**:
  - **Schema & Indexes (ProductSchema)**:
    - Bổ sung các trường siêu dữ liệu sách: `author?: string`, `publisher?: string`, `isbn?: string`, `publicationYear?: number`.
    - Thiết lập MongoDB Full-text Index: `{ name: 'text', description: 'text', author: 'text', publisher: 'text', sku: 'text', isbn: 'text', brand: 'text' }`.
    - Thiết lập Compound Indexes kết hợp cho các tiêu chí lọc: `{ category: 1, isDeleted: 1, status: 1 }`, `{ price: 1, isDeleted: 1 }`, `{ discountPrice: 1, isDeleted: 1 }`, `{ sold: -1, isDeleted: 1 }`, `{ rating: -1, isDeleted: 1 }`, `{ author: 1, isDeleted: 1 }`, `{ publisher: 1, isDeleted: 1 }`, `{ brand: 1, isDeleted: 1 }`, `{ sku: 1, isDeleted: 1 }`, `{ isbn: 1, isDeleted: 1 }`.
  - **DTO Enhancements (ProductQueryDto & Create/Update DTOs)**:
    - `CreateProductDto` & `UpdateProductDto`: Hỗ trợ `author`, `publisher`, `isbn`, `publicationYear`.
    - `ProductQueryDto`: Mở rộng hỗ trợ `author`, `publisher`, `isbn`, `subOption`, `sortBy` / `sort`, `minPrice`, `maxPrice`, `minRating`, `inStock`, `discounted`, `isFlashSale`.
  - **Dịch vụ Tìm kiếm & Lọc Chuyên sâu (ProductsService)**:
    - `makeDiacriticRegex`: Tối ưu hàm chuyển đổi ký tự tiếng Việt không dấu thành biểu thức chính quy (Regex) toàn diện hỗ trợ mọi nguyên âm/phụ âm và bảo vệ ký tự đặc biệt.
    - `findAll`: Lọc đa tiêu chí kết hợp, lọc đệ quy theo cây danh mục cha/con, lọc đa thương hiệu/tác giả/NXB phân tách dấu phẩy, lọc khoảng giá thực tế, sắp xếp 8 chế độ (`newest`, `price_asc`, `price_desc`, `best_selling`, `rating`, `name_asc`, `name_desc`, `discount_desc`), giới hạn an toàn 100 ký tự chống ReDoS.
    - `getSuggestions(q, limit)`: API autocomplete hiệu năng cao trả về mảng từ khóa (`keywords`), danh mục khớp (`categories`) và top 4-6 sản phẩm xem nhanh (`products`) kèm ảnh, giá và nhãn giảm giá.
    - `search`: Hỗ trợ tìm kiếm theo SKU, ISBN, Tác giả, NXB, Thương hiệu, Tên và Mô tả.
  - **Controller & Endpoints (ProductsController)**:
    - Bổ sung endpoint `GET /products/suggestions` tài liệu Swagger đầy đủ.
  - **Đồng bộ Frontend Web (Vue 3)**:
    - `frontend/src/services/product.service.ts`: Bổ sung API `getSuggestions(q, limit)`.
    - `frontend/src/layouts/CustomerLayout.vue`: Tích hợp Live Autocomplete Suggestions dropdown (Debounced 250ms), hiển thị danh mục liên quan và top sản phẩm xem nhanh kèm giá.
    - `frontend/src/pages/customer/ProductList.vue`: Nâng cấp giao diện Sidebar lọc đa tiêu chí (Cây danh mục, Lọc giá nhanh kèm presets, Tác giả, NXB, Thương hiệu, Đánh giá sao, Tồn kho, Khuyến mãi), thanh Toolbar sắp xếp 8 chế độ, thanh Tags bộ lọc đang chọn kèm nút "Xóa tất cả", phân trang số chuẩn hóa.
  - **Đồng bộ Mobile App (Flutter)**:
    - `mobile/lib/models/product_model.dart`: Thêm parsing `author`, `publisher`, `isbn`.
    - `mobile/lib/providers/product_provider.dart`: Cập nhật `fetchProducts` gửi đầy đủ `author`, `publisher`, `sort`, bổ sung `setSortBy`.
  - **Kiểm thử tự động (Unit Testing)**:
    - Bổ sung test suite trong `backend/src/modules/products/products.service.spec.ts` kiểm thử toàn diện: Tìm kiếm tiếng Việt có/không dấu, SKU/ISBN/Tác giả/NXB, Lọc đa tiêu chí, Cây danh mục đệ quy, 8 kiểu sắp xếp, API Autocomplete Suggestions, ReDoS sanitize.
- **Kết quả kiểm thử**:
  - `npm test` (Backend): **14/14 test suites passed, 173/173 tests PASS 100%**.
  - `npx jest test/all-fixes.spec.ts` (Backend QA): **11/11 tests PASS 100%**.
  - `npm run build` (Backend): **PASS 100%**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 13 — Chi tiết sản phẩm, Gallery, Thông số & Đánh giá.

### [2026-08-27] — Hoàn thành TASK 11: Quản lý danh mục, Slug & Cây danh mục đa cấp
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Hoàn thiện toàn diện phân hệ Quản lý Danh mục (Categories), triển khai thuật toán Cây danh mục đa cấp đệ quy lồng nhau (`Category Tree`), bộ sinh Slug tiếng Việt tự động kèm cơ chế chống trùng lặp trong CSDL, cơ chế bảo vệ toàn vẹn phân cấp ngăn chặn vòng lặp cha-con (Circular Parent Reference), cơ chế xóa an toàn tự động chuyển con về cha cấp trên (tránh mồ côi dữ liệu), gắn Rate Limiting và xây dựng 100% unit tests coverage cho `CategoriesService`.
- **Thực hiện**:
  - **Schema & DTO Enhancements**:
    - `backend/src/modules/categories/schemas/category.schema.ts`: Bổ sung trường `sortOrder: number` (mặc định 0), đánh compound indexes `{ parentId: 1, status: 1, sortOrder: 1 }`, `{ slug: 1 }` (unique) và `{ status: 1, sortOrder: 1 }`.
    - `backend/src/modules/categories/dto/category.dto.ts`: Bổ sung `sortOrder?: number` cho `CreateCategoryDto` và `UpdateCategoryDto`.
  - **Dịch vụ Quản lý Danh mục Chuyên sâu (CategoriesService)**:
    - `generateUniqueSlug`: Sinh slug tiếng Việt chuẩn (chuyển đổi `đ`/`Đ` -> `d`, loại bỏ dấu thanh, ký tự đặc biệt) và tự động đối chiếu trong CSDL để gắn hậu tố đếm (`-1`, `-2`, ...) đảm bảo tính duy nhất tuyệt đối.
    - `getCategoryTree(includeInactive)`: Xây dựng cây danh mục đa cấp đa tầng (Cha -> Con -> Cháu) đệ quy, tự động tổng hợp số lượng sản phẩm (`productCount`) của từng danh mục.
    - `checkCircularReference(categoryId, targetParentId)`: Thuật toán duyệt ngược cây ngăn chặn triệt để tình trạng một danh mục tự nhận chính nó làm cha, hoặc chọn một danh mục con/cháu trong nhánh của mình làm cha.
    - `update`: Hỗ trợ đổi tên tự sinh lại slug, kiểm tra vòng lặp phân cấp khi đổi `parentId`.
    - `delete`: Xóa danh mục an toàn, tự động re-parent các danh mục con trực thuộc về `parentId` của danh mục cha bị xóa (hoặc `null`) để bảo toàn dữ liệu.
    - `findBySlug`: Tìm kiếm danh mục theo slug kèm thông tin cha và sản phẩm liên kết.
    - `toggleStatus`: Kích hoạt/Vô hiệu hóa nhanh trạng thái hoạt động của danh mục.
  - **Bảo mật & Rate Limiting (CategoriesController)**:
    - Bổ sung endpoint `GET /categories/tree` (lấy cây danh mục phân cấp) và `GET /categories/slug/:slug` (tìm theo slug).
    - Phân quyền `@Permissions(StaffPermission.MANAGE_PRODUCTS)` cho các thao tác quản trị.
    - Gắn `@Throttle(...)` (20 req/60s) cho các thao tác `create`, `update`, `toggleStatus`, `delete`.
  - **Đồng bộ Frontend**:
    - `frontend/src/services/category.service.ts`: Bổ sung các phương thức `getTree()`, `getBySlug(slug)`, `toggleStatus(id)`.
  - **Kiểm thử tự động (Unit Testing)**:
    - Tạo mới `backend/src/modules/categories/categories.service.spec.ts` kiểm thử toàn diện: Sinh slug & xử lý va chạm, Xây dựng cây danh mục 3 tầng kèm `productCount`, Ngăn chặn Circular Reference (A -> B -> A), CRUD, Xóa an toàn và Toggle Status.
- **Kết quả kiểm thử**:
  - `npm test` (Backend): **14/14 test suites passed, 163/163 tests PASS 100%**.
  - `npx jest test/all-fixes.spec.ts` (Backend QA): **11/11 tests PASS 100%**.
  - `npm run build` (Backend): **PASS 100%**.
  - `npm run build` (Frontend): **PASS 100%**.
  - `flutter test` (Mobile): **6/6 tests PASS 100%**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 12 — Tìm kiếm Full-text & Lọc đa tiêu chí phân trang.

### [2026-08-27] — Hoàn thành TASK 10: Quản lý sản phẩm Admin & Excel Import/Export
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Hoàn thiện và chuẩn hóa toàn bộ phân hệ Quản lý sản phẩm Admin và xử lý file Excel (Xuất Excel, Nhập Excel hàng loạt, Tải mẫu Excel chuẩn đa sheet). Đảm bảo tự động đồng bộ tồn kho sang `InventoryModule`, xác thực dữ liệu chặt chẽ (SKU, Giá, Danh mục, Trạng thái), gắn Rate Limiting chuyên sâu cho các thao tác upload/export nặng, và xây dựng 100% unit test coverage cho `ProductsService`.
- **Thực hiện**:
  - **Quản trị Sản phẩm Toàn diện (Admin Product Management)**:
    - `backend/src/modules/products/products.service.ts`:
      - `create`: Tạo sản phẩm mới, tự động sinh slug ngẫu nhiên chống trùng lặp, tự động tạo bản ghi tồn kho tương ứng trong `inventories` collection với trạng thái (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`).
      - `update`: Cập nhật chi tiết sản phẩm và đồng bộ số lượng tồn kho tự động.
      - `softDelete`: Đánh dấu `isDeleted: true` an toàn mà không làm mất dữ liệu lịch sử đơn hàng.
      - `findAll`: Hỗ trợ lọc đa tiêu chí (danh mục phân cấp cha/con, thương hiệu, khoảng giá, số sao, chỉ còn hàng, deal khuyến mãi), phân trang chuẩn `PaginatedResult` và sắp xếp đa dạng.
  - **Tính năng Excel Nâng cao (ExcelJS Engine)**:
    - `generateImportTemplate`: Tạo file mẫu Excel `.xlsx` 2 sheet chuyên nghiệp (Sheet 1: Form nhập liệu có định dạng Segoe UI, màu thương hiệu đỏ Trường Thành, định dạng số tiền `#,,##0`; Sheet 2: Danh sách danh mục thực tế tra cứu kèm hướng dẫn chi tiết).
    - `exportToExcel`: Xuất toàn bộ danh sách sản phẩm ra file `.xlsx` đầy đủ 14 cột nghiệp vụ, phân trang màu so le cho hàng chẵn/lẻ, định dạng tiền tệ và tự động căn chỉnh độ rộng cột.
    - `importFromExcel`: Nhập sản phẩm hàng loạt từ buffer file Excel:
      - Kiểm tra tính toàn vẹn của file (chặn file rỗng, file hỏng, sai cấu trúc).
      - Xác thực các trường bắt buộc (Tên, SKU, Danh mục, Giá bán >= 0).
      - Đối chiếu SKU chống trùng lặp trong file và trong DB; tự động liên kết hoặc tạo danh mục nếu chưa có.
      - Tự động tạo bản ghi kho `Inventory` cho từng sản phẩm nhập thành công.
      - Trả về báo cáo thống kê chi tiết (`totalRows`, `createdCount`, `updatedCount`, `skippedCount`, `errorCount`, `details`).
  - **Bảo mật & Rate Limiting (Controller Layer)**:
    - `backend/src/modules/products/products.controller.ts`:
      - Phân quyền nghiêm ngặt `@Permissions(StaffPermission.MANAGE_PRODUCTS)` cho các endpoints quản trị.
      - Gắn `@Throttle(...)` cho `downloadTemplate` (10/60s), `exportExcel` (10/60s), `importExcel` (5/60s), `create` (20/60s), `update` (20/60s), `delete` (20/60s).
      - Ràng buộc giới hạn file upload tối đa 10MB và chỉ chấp nhận `.xlsx`/`.xls`.
  - **Đồng bộ Frontend Quản trị**:
    - `frontend/src/pages/admin/Products.vue`: Giao diện Admin quản trị danh sách sản phẩm, tích hợp Modal kéo thả file Excel, hiển thị kết quả phân tích theo tab (Thành công, Bỏ qua, Lỗi), nút tải file mẫu và xuất Excel trực tiếp.
  - **Kiểm thử tự động (Unit Testing)**:
    - Tạo mới `backend/src/modules/products/products.service.spec.ts` kiểm thử toàn diện 100% các kịch bản: Product CRUD, Validation, Template Generation, Excel Export, Excel Import lỗi và Excel Import thành công.
- **Kết quả kiểm thử**:
  - `npm test` (Backend): **13/13 test suites passed, 150/150 tests PASS 100%**.
  - `npx jest test/all-fixes.spec.ts` (Backend QA): **11/11 tests PASS 100%**.
  - `npm run build` (Backend): **PASS 100%**.
  - `npm run build` (Frontend): **PASS 100%**.
  - `flutter test` (Mobile): **6/6 tests PASS 100%**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 11 — Quản lý danh mục, Slug & Cây danh mục đa cấp.

### [2026-08-27] — Hoàn thành TASK 09: Bảo mật API (Helmet, CORS, Rate Limit, Sanitization)
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Thiết lập và hoàn thiện toàn diện tầng phòng thủ bảo mật API cho hệ thống Trường Thành Bookstore, bao gồm: HTTP Security Headers với Helmet (CSP tương thích Swagger UI & Cloudinary, HSTS, X-Frame-Options...), cấu hình CORS Whitelist nghiêm ngặt có preflight cache, chính sách Rate Limiting (Throttler) chuyên sâu cho các endpoints nhạy cảm (Auth, Orders, Payments, Promotions, Reviews, Admin actions), bộ tiện ích và Middleware làm sạch đầu vào (Sanitization) ngăn chặn NoSQL Injection, Prototype Pollution và Stored XSS mà vẫn bảo toàn tính toàn vẹn của mật khẩu và chuỗi tiếng Việt; viết 100% unit tests bảo vệ toàn diện.
- **Thực hiện**:
  - **Tầng Tiện ích Bảo mật & Làm sạch Dữ liệu (Security Sanitizer Layer)**:
    - Tạo mới `backend/src/common/security/security.sanitizer.ts`:
      - `isForbiddenKey()`: Phát hiện các MongoDB Query Operators bắt đầu bằng `$` (`$gt`, `$ne`, `$where`, `$regex`, `$expr`...), các khóa dot notation injection (`user.role`), và các khóa Prototype Pollution (`__proto__`, `prototype`, `constructor`).
      - `sanitizeXss()`: Làm sạch các thẻ mã độc hại (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<applet>`), pseudo-protocols `javascript:`, data URIs nguy hiểm và inline event handlers (`onerror=`, `onload=`, `onclick=`). Bảo toàn hoàn toàn chuỗi tiếng Việt có dấu và URL hợp lệ.
      - `sanitizePayload()`: Đệ quy làm sạch object, mảng và chuỗi; hỗ trợ danh sách `skipFields` (như `password`, `token`, `otp`, `signature`) để không biến dạng ký tự đặc biệt của mật khẩu trước khi băm bcrypt.
  - **Middleware Bảo mật Toàn cục (Security Sanitizer Middleware)**:
    - Tạo mới `backend/src/common/middleware/security-sanitizer.middleware.ts`:
      - Tự động chặn và làm sạch toàn bộ `req.body`, `req.query`, `req.params` trước khi đi vào Controllers/Pipes.
    - Đăng ký middleware trong `AppModule.configure(consumer)` áp dụng cho mọi routes (`forRoutes('*')`).
  - **Cấu hình Helmet & Ẩn Header Nhạy cảm**:
    - Cài đặt thư viện `helmet` vào backend dependencies.
    - Trong `backend/src/main.ts`: Cấu hình Helmet với Content Security Policy (CSP) linh hoạt, cho phép tài nguyên của Swagger UI (`/api/docs`), font Google, và ảnh Cloudinary (`res.cloudinary.com`) hoạt động trơn tru; ẩn header `X-Powered-By`.
  - **Thắt chặt Chính sách CORS**:
    - Cấu hình CORS Whitelist phân tích chuỗi `FRONTEND_URL` (hỗ trợ nhiều domain phân tách bởi dấu phẩy), hỗ trợ mobile apps (`!origin`), các phương thức `['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS']`, headers tùy chỉnh (`x-client-platform`, `authorization`, `content-type`...), `credentials: true` và preflight cache `maxAge: 86400` (24h).
  - **Chính sách Giới hạn Tần suất (Rate Limiting / Throttler)**:
    - Cấu hình toàn cục trong `AppModule`: 100 requests / phút.
    - Gắn `@Throttle(...)` cho các endpoints nhạy cảm:
      - `AuthController`: `register` (5/60s), `login` (5/60s), `forgotPassword` (3/60s), `verifyOtp` (5/60s), `resetPassword` (5/60s), `refreshToken` (10/60s), `logout` (10/60s), `changePassword` (5/60s).
      - `OrdersController`: `create` và `createAuthenticated` (10/60s - chống spam đơn hàng và giữ hàng ảo).
      - `PaymentsController`: `create` (10/60s) và `handleCallback` (20/60s).
      - `PromotionsController`: `apply` (15/60s - chống brute-force mã giảm giá).
      - `ReviewsController`: `create` và `update` (10/60s - chống spam đánh giá).
      - `UsersController`: `createStaff`, `updateRole`, `updateStatus` (10/60s).
  - **Chuẩn hóa Thông điệp Lỗi Rate Limit**:
    - `backend/src/common/filters/http-exception.filter.ts`: Tự động map HTTP 429 (`HttpStatus.TOO_MANY_REQUESTS`) thành mã lỗi `ErrorCode.ERR_RATE_LIMIT_EXCEEDED` và thông điệp tiếng Việt thân thiện: `"Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít phút!"`.
  - **Kiểm thử tự động (Unit Testing)**:
    - Tạo `backend/src/common/security/security.sanitizer.spec.ts` kiểm thử toàn diện 100% các kịch bản: NoSQL injection, prototype pollution, XSS tags & event handlers, password preservation, middleware execution và rate limit exception response format.
- **Kết quả kiểm thử**:
  - `npm test` (Backend): **12/12 test suites passed, 140/140 tests PASS 100%**.
  - `npx jest test/all-fixes.spec.ts` (Backend QA): **11/11 tests PASS 100%**.
  - `npm run build` (Backend): **PASS 100%**.
  - `npm run build` (Frontend): **PASS 100%**.
  - `flutter test` (Mobile): **6/6 tests PASS 100%**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 10 — Quản lý sản phẩm Admin & Excel Import/Export.

### [2026-08-25] — Hoàn thành TASK 08: Bảo mật JWT, Refresh Token & Thu hồi Token khi Logout
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Chuẩn hóa và hoàn thiện toàn diện kiến trúc bảo mật Token JWT, cơ chế xoay vòng Refresh Token (Token Rotation), phát hiện xâm phạm/tái sử dụng token cũ (Token Reuse Detection), quản lý danh sách đen và thu hồi token tức thì khi Logout (`TokenBlacklistService`), cơ chế vô hiệu hóa toàn bộ phiên trên mọi thiết bị khi đổi mật khẩu (`tokenVersion`), và đồng bộ hóa tầng Client (Frontend Vue 3 Silent Auto-Refresh Queue & Flutter Mobile Token Persistence); viết 100% unit tests đạt chuẩn.
- **Thực hiện**:
  - **Mã lỗi & Exception Handling**:
    - `backend/src/common/enums/error-code.enum.ts`: Bổ sung các mã lỗi bảo mật JWT: `ERR_TOKEN_REVOKED`, `ERR_REFRESH_TOKEN_EXPIRED`, `ERR_REFRESH_TOKEN_REUSE`.
    - `backend/src/common/filters/http-exception.filter.ts`: Bổ sung bắt và xử lý `NotBeforeError` ('Mã xác thực chưa có hiệu lực sử dụng') và map các lỗi token chuyên biệt.
  - **Cơ sở dữ liệu & User Schema**:
    - `backend/src/modules/users/schemas/user.schema.ts`: Bổ sung trường `@Prop({ default: 0 }) tokenVersion: number;` để kiểm soát phiên đăng nhập toàn hệ thống.
  - **Dịch vụ Thu hồi Token (Token Blacklist & Revocation Service)**:
    - Tạo mới `backend/src/modules/auth/token-blacklist.service.ts`:
      - Quản lý danh sách đen theo mã định danh duy nhất `jti` và băm SHA-256 của chuỗi token.
      - Cơ chế tự động dọn dẹp (TTL Garbage Collection) định kỳ mỗi 10 phút và dọn dẹp khi ứng dụng shutdown (`OnModuleDestroy`).
      - Cung cấp các phương thức kiểm tra siêu nhanh: `isJtiBlacklisted()`, `isTokenBlacklisted()`, `blacklistJti()`, `blacklistToken()`.
  - **Nâng cấp JwtStrategy**:
    - `backend/src/modules/auth/strategies/jwt.strategy.ts`:
      - Kiểm tra `jti` và raw token trong `TokenBlacklistService` ➔ ném `ERR_TOKEN_REVOKED` nếu token đã bị thu hồi do đăng xuất.
      - Kiểm tra `tokenVersion` trong payload so với DB ➔ ném `ERR_TOKEN_REVOKED` nếu phiên bị vô hiệu hóa do đổi mật khẩu.
      - Kiểm tra tài khoản bị khóa (`!user.status`).
  - **Nâng cấp AuthService**:
    - `backend/src/modules/auth/auth.service.ts`:
      - `generateTokens`: Cấp `accessToken` và `refreshToken` đều có `jti` ngẫu nhiên (UUID) và `tokenVersion`.
      - `refreshToken`: Xác thực chữ ký và loại token, kiểm tra `tokenVersion`, triển khai **Token Reuse Detection** (nếu Refresh Token gửi lên không khớp với mã hash trong DB ➔ lập tức hủy toàn bộ phiên của người dùng bằng cách tăng `tokenVersion`, xóa hash và ghi log cảnh báo bảo mật nghiêm trọng). Cấp cặp token mới và đưa access token cũ vào Blacklist.
      - `logout`: Trích xuất token từ Header/Cookie/Body, đưa Access Token vào Blacklist (kèm TTL) và xóa `refreshTokenHash` trong DB.
      - `changePassword` & `resetPassword`: Tăng `tokenVersion` và xóa `refreshTokenHash` để vô hiệu hóa toàn bộ token trên mọi thiết bị của người dùng, đưa token hiện tại vào Blacklist.
  - **Nâng cấp AuthController & Module**:
    - `backend/src/modules/auth/auth.controller.ts`: Nâng cấp trích xuất token an toàn từ Headers, Cookies và Body cho các endpoints `refresh`, `logout`, `change-password`.
    - `backend/src/modules/auth/auth.module.ts`: Đăng ký và export `TokenBlacklistService`.
  - **Đồng bộ Frontend Vue 3**:
    - `frontend/src/utils/api.ts`: Triển khai **Silent Token Refresh Queue** trong Axios interceptor. Khi gặp lỗi 401, tự động gọi ngầm `/api/auth/refresh`, lưu giữ hàng đợi và retry lại tất cả request đang chờ; chỉ điều hướng về Login khi Refresh Token thực sự hết hạn hoặc bị hủy.
    - `frontend/src/services/auth.service.ts`: Bổ sung phương thức `refreshToken()`, `changePassword()`.
    - `frontend/src/stores/auth.ts`: Bổ sung action `refreshSession()`.
  - **Đồng bộ Mobile Flutter**:
    - `mobile/lib/core/constants/api_constants.dart`: Bổ sung `refreshToken` và `logout` endpoints.
    - `mobile/lib/providers/auth_provider.dart`: Lưu trữ an toàn `refreshToken` vào `SharedPreferences`, bổ sung hàm `refreshAuthToken()` tự động làm mới phiên, nâng cấp hàm `logout()` gửi yêu cầu thu hồi token lên máy chủ.
  - **Kiểm thử tự động (Unit Testing)**:
    - Tạo `backend/src/modules/auth/token-blacklist.service.spec.ts` kiểm thử toàn diện 100% chức năng Blacklist.
    - Nâng cấp `backend/src/modules/auth/auth.service.spec.ts` kiểm thử toàn diện Token Rotation, Token Reuse Detection, Session Revocation, TokenVersion Mismatch và Blacklist.
- **Kết quả kiểm thử**:
  - `npm test` (Backend): **11/11 test suites passed, 122/122 tests PASS 100%**.
  - `npm run build` (Backend): **PASS 100%**.
  - `npm run build` (Frontend): **PASS 100%**.
  - `flutter test` (Mobile): **6/6 tests PASS 100%**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 09 — Bảo mật API (Helmet, CORS, Rate Limit, Sanitization).

### [2026-08-25] — Hoàn thành TASK 07: Phân quyền RBAC (Customer/Staff/Admin/SuperAdmin) & Role Guards

- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Thiết lập phân quyền đa cấp toàn diện (Role-Based Access Control) cho 4 vai trò (`SUPER_ADMIN`, `ADMIN`, `STAFF`, `CUSTOMER`) theo mô hình phân cấp (Hierarchy); bảo vệ tài khoản bị khóa (`status === false`); xây dựng các bộ Guard & Decorator nâng cao (`RolesGuard`, `PermissionsGuard`, `@Roles()`, `@Permissions()`, `@CurrentUser()`); hoàn thiện module quản trị người dùng & phân quyền; đồng bộ hóa Frontend (Pinia store, route guards, AdminLayout) và Mobile Flutter; viết 100% unit tests bảo phủ toàn bộ luồng.
- **Thực hiện**:
  - **Cốt lõi Backend & Enums**:
    - `backend/src/common/enums/index.ts`: Bổ sung `SUPER_ADMIN = 'SUPER_ADMIN'` vào enum `UserRole`.
    - `backend/src/seeds/seed.service.ts`: Khởi tạo tài khoản `superadmin@truongthanh.vn` (`SuperAdmin@123456`) với vai trò `UserRole.SUPER_ADMIN`.
  - **Guards & Decorators**:
    - `backend/src/common/decorators/roles.decorator.ts`: Hỗ trợ gán nhiều vai trò `(UserRole | string)[]`.
    - `backend/src/common/decorators/permissions.decorator.ts`: Hỗ trợ gán danh sách quyền `(StaffPermission | string)[]`.
    - `backend/src/common/decorators/current-user.decorator.ts`: Tạo mới `@CurrentUser()` / `@GetUser()` parameter decorator.
    - `backend/src/common/guards/roles.guard.ts`: Triển khai Role Hierarchy: `SUPER_ADMIN` có toàn quyền, `ADMIN` thỏa mãn yêu cầu `ADMIN` và `STAFF`. Ném `UnauthorizedException` khi chưa đăng nhập và `ForbiddenException` khi tài khoản bị khóa (`!user.status`).
    - `backend/src/common/guards/permissions.guard.ts`: Tự động cho phép `SUPER_ADMIN` và `ADMIN` thực hiện mọi thao tác, kiểm tra quyền cụ thể của `STAFF`, chặn tài khoản bị khóa và từ chối `CUSTOMER`.
  - **Module Quản trị Người dùng & Phân quyền (RBAC)**:
    - `backend/src/modules/users/dto/user.dto.ts`: Tạo mới các DTOs validate chặt chẽ: `CreateStaffUserDto`, `UpdateUserRoleDto`, `UpdateUserPermissionsDto`, `UpdateUserStatusDto`, `UserQueryDto`.
    - `backend/src/modules/users/users.service.ts`: Xây dựng đầy đủ các nghiệp vụ RBAC:
      - `findAllUsers`: Lấy danh sách người dùng phân trang, lọc theo vai trò (`role`), trạng thái (`status`), tìm kiếm từ khóa.
      - `createStaffOrAdmin`: Tạo tài khoản Staff hoặc Admin (băm mật khẩu `bcrypt`, chỉ `SUPER_ADMIN` mới được tạo Admin/SuperAdmin).
      - `updateRole`: Cập nhật vai trò có kiểm tra phân cấp bảo vệ SuperAdmin và ngăn chặn tự đổi vai trò của bản thân.
      - `updatePermissions`: Cập nhật danh sách quyền cho tài khoản `STAFF`.
      - `updateStatus`: Khóa/mở khóa tài khoản (ngăn tự khóa tài khoản của chính mình và bảo vệ tài khoản SuperAdmin).
      - `deleteUser`: Xóa tài khoản có phân cấp (ngăn tự xóa bản thân, cấm xóa SuperAdmin, cấm Admin xóa Admin).
    - `backend/src/modules/users/users.controller.ts`: Mở các endpoints quản trị RESTful (`GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id/role`, `PATCH /users/:id/permissions`, `PATCH /users/:id/status`, `DELETE /users/:id`), bảo vệ bằng `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)`.
  - **Chuẩn hóa Role & Permission trên toàn bộ Controllers**:
    - Đồng bộ `PromotionsController`, `BannersController`, `CategoriesController`, `LandingPageController`, `ProductsController`, `OrdersController`, `ReviewsController`, `InventoryController`, `CustomersController`, `ReportsController` sử dụng `PermissionsGuard` và `StaffPermission` tương ứng, đồng thời hỗ trợ `SUPER_ADMIN` trong các luồng kiểm tra quyền sở hữu đơn hàng/hóa đơn.
  - **Đồng bộ Frontend & Mobile**:
    - `frontend/src/types/index.ts`: Cập nhật kiểu `User.role` thành `'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER'`.
    - `frontend/src/stores/auth.ts`: Thêm getter `isSuperAdmin`, cập nhật `isAdmin` và `isStaff`.
    - `frontend/src/router/index.ts`: Cho phép `SUPER_ADMIN` truy cập không giới hạn mọi route admin.
    - `frontend/src/layouts/AdminLayout.vue`: Hiển thị trọn vẹn danh mục quản trị cho `SUPER_ADMIN`.
    - `mobile/lib/models/user_model.dart`: Bổ sung các getters `isSuperAdmin`, `isAdmin`, `isStaff`, `isCustomer`.
  - **Kiểm thử tự động (Unit Testing)**:
    - Tạo `backend/src/common/guards/rbac.guard.spec.ts` bao phủ 100% kịch bản của `RolesGuard` và `PermissionsGuard`.
    - Tạo `backend/src/modules/users/users.service.spec.ts` kiểm thử toàn diện toàn bộ nghiệp vụ RBAC.
- **Kết quả kiểm thử**:
  - `npm test` (Backend): **10/10 test suites passed, 113/113 tests PASS 100%**.
  - `npm run build` (Backend): **PASS 100%**.
  - `npm run build` (Frontend): **PASS 100%**.
  - `flutter test` (Mobile): **6/6 tests PASS 100%**.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 08 — Bảo mật JWT, Refresh Token & Thu hồi Token khi Logout.
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Hoàn thiện và chuẩn hóa toàn bộ hệ thống Xác thực (Authentication) đa nền tảng (Web & Mobile); băm mật khẩu an toàn bằng `bcrypt` (10 salt rounds); triển khai cơ chế Refresh Token & Token Rotation; bảo vệ luồng Quên mật khẩu qua OTP 6 số (SHA-256 hash, rate limit, max 5 attempts, temporary reset token); tuyệt đối không để rò rỉ password hash và mã bí mật trong API response; viết bộ unit tests chuyên biệt đạt 100% độ bao phủ.
- **Thực hiện**:
  - Nâng cấp `UserSchema` (`backend/src/modules/users/schemas/user.schema.ts`):
    - Bổ sung trường `refreshTokenHash` lưu trữ mã băm SHA-256 của Refresh Token nhằm hỗ trợ kiểm soát phiên, thu hồi token và token rotation.
  - Chuẩn hóa DTOs (`backend/src/modules/auth/dto/auth.dto.ts`):
    - Tạo mới `RefreshTokenDto`.
    - Nâng cấp `ResetPasswordDto` hỗ trợ linh hoạt xác thực bằng `resetToken` tạm thời hoặc mã `otp`.
    - Ràng buộc mật khẩu mạnh (chữ hoa, chữ thường, số, >= 8 ký tự) cho `RegisterDto`, `ChangePasswordDto`, `ResetPasswordDto`.
  - Nâng cấp toàn diện `AuthService` (`backend/src/modules/auth/auth.service.ts`):
    - Phương thức sinh cặp token `generateTokens`: Cấp phát `accessToken` (7 ngày) và `refreshToken` (30 ngày), băm SHA-256 lưu DB.
    - Phương thức `refreshToken`: Xác thực JWT, đối chiếu hash bằng `timingSafeEqual`, xoay vòng token (rotation) an toàn.
    - Phương thức `logout`: Thu hồi `refreshTokenHash` trong DB và xóa cookie trình duyệt.
    - Phương thức `verifyOtp`: Kiểm tra OTP băm SHA-256, giới hạn tối đa 5 lần thử sai (hủy OTP nếu quá 5 lần), sinh `resetToken` có thời hạn 15 phút.
    - Phương thức `resetPassword`: Băm mật khẩu mới bằng `bcrypt` (10 rounds), hủy toàn bộ dữ liệu OTP và vô hiệu hóa phiên cũ (`refreshTokenHash`).
    - Làm sạch dữ liệu (`sanitizeUser`): Loại bỏ hoàn toàn `password`, `resetOtp`, `resetOtpExpiry`, `resetOtpAttempts`, `refreshTokenHash` khỏi mọi API responses.
  - Nâng cấp `AuthController` (`backend/src/modules/auth/auth.controller.ts`):
    - Bổ sung endpoint `POST /api/auth/refresh` hỗ trợ cả Header, Body và HTTP-only Cookie.
    - Nâng cấp cookie helper `setAuthCookies` tự động cấp cả `access_token` và `refresh_token` an toàn.
  - Viết bộ unit tests chuyên biệt `auth.service.spec.ts` kiểm thử toàn diện 17/17 test cases (PASS 100%).
- **Kết quả kiểm thử**:
  - `npm run build` (Backend): PASS.
  - `npm test` (Backend): 8 test suites, 80 tests PASS 100%.
  - `npm run build` (Frontend): PASS.
  - `flutter test` (Mobile): 6 tests PASS 100%.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 07 — Phân quyền RBAC (Customer/Staff/Admin) & Role Guards.

### [2026-08-24] — Hoàn thành TASK 05: Quản lý biến môi trường `.env` & bảo mật Secret

- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Xây dựng hệ thống quản lý cấu hình và biến môi trường tập trung, an toàn, được kiểm tra hợp lệ nghiêm ngặt (Strict Schema Validation) ngay khi khởi động ứng dụng; loại bỏ hoàn toàn các secret mặc định bị hardcode trong mã nguồn; chuẩn hóa tài liệu `.env.example` và hỗ trợ đa môi trường (Development, Test, Production) trên cả Backend, Frontend và Mobile.
- **Thực hiện**:
  - Tạo mới module xác thực cấu hình môi trường (`backend/src/config/env.validation.ts`):
    - Định nghĩa class `EnvironmentVariables` với đầy đủ ràng buộc `class-validator` (`@IsEnum`, `@IsString`, `@IsNumber`, `@Min`, `@Max`, `@IsNotEmpty`, `@MinLength`...).
    - Viết hàm `validateEnv` thực hiện transform kiểu dữ liệu (chuyển string port sang number, boolean), alias mapping (`MONGO_URI` -> `MONGODB_URI`, `JWT_EXPIRATION` -> `JWT_EXPIRES_IN`).
    - Triển khai nguyên tắc **Fail-Fast**: Dừng khởi động và in log chi tiết từng trường vi phạm nếu thiếu biến bắt buộc (`MONGODB_URI`, `JWT_SECRET`, `PORT`, `FRONTEND_URL`).
    - Kiểm tra bảo mật nghiêm ngặt ở **Production**: Chặn hoàn toàn các secret mặc định yếu (`secret`, `123456`, `TruongThanhDevDefaultSecretKey2026!`...) và yêu cầu `JWT_SECRET` phải có độ dài tối thiểu >= 32 ký tự.
  - Tạo module cấu hình phân cấp (`backend/src/config/configuration.ts`) cho NestJS ConfigService.
  - Tích hợp `validateEnv` vào `ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv })` trong `app.module.ts`.
  - Loại bỏ triệt để hardcoded fallback secret trong `jwt.strategy.ts` và `auth.module.ts`, sử dụng `configService.getOrThrow('JWT_SECRET')`.
  - Thay thế toàn bộ truy cập trực tiếp `process.env` rải rác trong `main.ts`, `auth.controller.ts`, `notifications.gateway.ts` bằng `ConfigService` an toàn.
  - Chuẩn hóa tài liệu mẫu `.env.example` cho cả Backend và Frontend, tạo mới `.env.test` phục vụ kiểm thử.
  - Nâng cấp `mobile/lib/core/constants/api_constants.dart` hỗ trợ `String.fromEnvironment('API_URL')` cho Flutter dynamic build flavors.
  - Viết bộ unit tests chuyên biệt `env.validation.spec.ts` kiểm thử 13/13 test cases (PASS 100%).
- **Kết quả kiểm thử**:
  - `npm run build` (Backend): PASS.
  - `npm test` (Backend): 7 test suites, 63 tests PASS 100%.
  - `npm run build` (Frontend): PASS.
  - `flutter test` (Mobile): 6 tests PASS 100%.
- **Trạng thái**: 🟢 DONE.
- **Tiếp theo**: TASK 06 — Authentication toàn diện & băm mật khẩu bcrypt.

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

_(Ghi chú cho AI tiếp theo: Khi nhận lệnh mới, hãy đọc file này trước tiên để biết ngay ngữ cảnh và trạng thái hiện tại của dự án)._
