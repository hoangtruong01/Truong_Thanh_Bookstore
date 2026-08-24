# HỆ THỐNG TRƯỜNG THÀNH BOOKSTORE — TÀI LIỆU DỰ ÁN & LỘ TRÌNH CHUẨN HÓA (DOC.md)

## 1. TỔNG QUAN KIẾN TRÚC HIỆN TẠI (CURRENT ARCHITECTURE)

Hệ thống **Trường Thành Bookstore** là nền tảng thương mại điện tử chuyên cung cấp sách, văn phòng phẩm và dụng cụ học tập đa kênh (Omni-channel) gồm 3 phân hệ chính:

```
                                  ┌───────────────────────────────┐
                                  │      CLIENT APPLICATIONS      │
                                  ├──────────────┬────────────────┤
                                  │ Vue 3 SPA    │ Flutter App    │
                                  │ (Web Store & │ (Mobile iOS &  │
                                  │  Admin CMS)  │  Android)      │
                                  └──────┬───────┴────────┬───────┘
                                         │ HTTP REST      │ HTTP REST
                                         │ WebSocket      │
                                         ▼                ▼
                                  ┌───────────────────────────────┐
                                  │     BACKEND API (NestJS)      │
                                  ├───────────────────────────────┤
                                  │ - Modules: Auth, Users,       │
                                  │   Products, Categories,       │
                                  │   Orders, Inventory, Promo... │
                                  │ - Global Pipes, Filters,      │
                                  │   Interceptors, Guards        │
                                  │ - WebSocket Gateway (Socketio)│
                                  └──────────────┬────────────────┘
                                                 │
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │      DATABASE & STORAGE       │
                                  ├───────────────────────────────┤
                                  │ - MongoDB (Mongoose ODM)      │
                                  │ - Cloudinary (Image storage)  │
                                  │ - SMTP Nodemailer (Emails)    │
                                  └───────────────────────────────┘
```

---

## 2. TECHNOLOGY STACK

| Phân hệ | Công nghệ chính | Thư viện & Công cụ chính |
| :--- | :--- | :--- |
| **Backend** | NestJS v11, Node.js (TypeScript) | Mongoose 9, JWT/Passport, Throttler, Class-Validator, PDFKit, ExcelJS, Socket.IO, Swagger OpenAPI |
| **Frontend** | Vue 3 (Composition API), Vite 8 | Pinia (State), Vue Router 4, Tailwind CSS 4, Axios, Chart.js, Vue-Toastification, Vue-i18n |
| **Mobile** | Flutter SDK (^3.11), Dart | Provider (State), Http, Shared Preferences, Shimmer, Cached Network Image, Google Fonts, Intl |
| **Database** | MongoDB (Cloud / Local) | Mongoose Schemas with Compound & Text Indexes |
| **Testing** | Jest, Supertest, Flutter Test | Unit tests, Integration E2E test suites |

---

## 3. CÁC TÍNH NĂNG ĐÃ TRIỂN KHAI (CURRENT FEATURES)

1. **Authentication & Authorization:** Đăng ký, đăng nhập, quên mật khẩu qua OTP 6 số, mã hóa mật khẩu bằng bcrypt, phân quyền Roles (`CUSTOMER`, `STAFF`, `ADMIN`, `SUPER_ADMIN`) và granular Staff Permissions.
2. **Product Catalog:** Quản lý sản phẩm, SKU, giá, giảm giá, tồn kho, thương hiệu, danh mục cha-con, lọc đa tiêu chí, tìm kiếm text, đánh giá (review), thông báo có hàng lại.
3. **Cart & Checkout:** Giỏ hàng tính subtotal, áp dụng voucher khuyến mãi, ngưỡng miễn phí vận chuyển tự động (299.000đ), quản lý sổ địa chỉ giao hàng.
4. **Order Management:** Đặt hàng (Guest & Authenticated), sinh mã đơn chuẩn hóa `TT[YY][MM][DD]...`, trừ kho nguyên tử (Atomic deduction + rollback), cập nhật trạng thái đơn, xuất hóa đơn PDF.
5. **Inventory & Warehouse:** Quản lý tồn kho, cảnh báo sắp hết hàng, ghi nhận phiếu nhập/xuất/điều chỉnh kho.
6. **Promotion System:** Khuyến mãi theo mã code, phần trăm hoặc số tiền cố định, giới hạn giá trị đơn tối thiểu, số lượt sử dụng.
7. **Reports & Real-time Notifications:** Báo cáo doanh thu nâng cao (AOV, phân bố đơn, voucher, top sản phẩm), thông báo đẩy thời gian thực qua WebSocket Gateway.
8. **Multi-platform Client:** Web Store & Admin Dashboard bằng Vue 3, Mobile App bằng Flutter.

---

## 4. NỢ KỸ THUẬT & CÁC VẤN ĐỀ CẦN CHUẨN HÓA (TECHNICAL DEBT)

1. **Kiến trúc Module Backend:**
   - Một số controller vẫn trực tiếp xử lý định dạng hoặc gom nhiều nghiệp vụ (ví dụ: review nằm lẫn trong product controller; chưa tách module Cart và Payment riêng biệt trên backend).
2. **Chuẩn hóa API Response & Error Handling:**
   - Format response chưa đồng nhất chuẩn `{ success, message, data, meta }` cho tất cả endpoints; pagination meta chưa thống nhất giữa các controller.
   - Global exception filter chưa có mã lỗi hệ thống (`errorCode`) tường minh, format response lỗi chưa theo đúng chuẩn `{ success: false, message, errorCode, details }`.
3. **Validation & DTOs:**
   - Một số query params và DTOs chưa cấu hình `forbidNonWhitelisted` triệt để ở từng endpoint hoặc thiếu custom validator cho MongoDB ObjectId, số điện thoại VN.
4. **Payment Architecture:**
   - Phương thức thanh toán (COD, Banking, VNPay, MoMo) đang gắn trực tiếp vào enum của Orders, chưa thiết kế pattern Provider Abstraction (`PaymentService`, `PaymentProvider`).
5. **Inventory Transaction:**
   - Cần mô hình `InventoryTransaction` chặt chẽ với đủ 5 loại: `IMPORT`, `SALE`, `RETURN`, `ADJUSTMENT`, `DAMAGE`, đảm bảo mọi biến động kho đều có transaction log và không thể âm kho.
6. **Mobile App:**
   - Có một số cảnh báo `deprecated_member_use` (`withOpacity`), test E2E mobile bị lệch chuỗi text tiêu đề cần đồng bộ.

---

## 5. LỘ TRÌNH 30 TASKS (ROADMAP)

### PHASE 1 — FOUNDATION
- **TASK 01 [P0] — Backend Structure [DONE]**: Đã chuẩn hóa toàn bộ cấu trúc module: Tạo mới CartModule, ReviewsModule, PaymentsModule độc lập. Bóc tách triệt để Controller chỉ xử lý HTTP, Service chứa Business Logic, DTO và Model/Schema riêng biệt. Unit tests & Build PASS.
- **TASK 02 [P0] — API Response Standardization [DONE]**: Đã chuẩn hóa toàn bộ định dạng phản hồi API theo chuẩn thống nhất (Success: `{ success, message, data, meta }`, Error: `{ success, message, errorCode, details }`). Đồng bộ TransformInterceptor, HttpExceptionFilter, cập nhật frontend client và unit tests PASS 100%.
- **TASK 03 [P0] — Global Error Handling [DONE]**: Đã hoàn thiện toàn diện Global Exception Filter, gán mã lỗi chuẩn hóa `ErrorCode` enum và Custom Exceptions (`AppException`, `BusinessException`...), che giấu stack trace và credentials ở production, tự động làm sạch logging (redact sensitive data), structured logging và unit tests PASS 100%.
- **TASK 04 [P0] — DTO Validation [DONE]**: Đã thiết lập ValidationPipe toàn cục cấm unknown fields (`whitelist: true, forbidNonWhitelisted: true`), tích hợp custom validators (`IsMongoObjectId`, `IsPhoneNumberVN`), validate chặt chẽ email, phone, strong password, price, quantity, ObjectId, enum và unit tests PASS 100%.
- **TASK 05 [P0] — Environment Configuration [DONE]**: Xây dựng hệ thống quản lý biến môi trường tập trung với Strict Schema Validation (`env.validation.ts`), loại bỏ triệt để hardcoded secrets, bảo vệ JWT secret ở production, chuẩn hóa `.env.example` và hỗ trợ đa môi trường cho Backend, Frontend và Mobile. Unit tests & Builds PASS 100%.

### PHASE 2 — SECURITY
- **TASK 06 [P0] — Authentication [DONE]**: Đã hoàn thiện toàn diện luồng Auth (Register, Login, Logout, Refresh Token, Forgot/Reset password qua OTP SHA-256 + resetToken), băm mật khẩu bcrypt 10 rounds, làm sạch dữ liệu không rò rỉ password hash, unit tests & builds PASS 100%.
- **TASK 07 [P0] — RBAC (Role-Based Access Control)**: Thiết lập phân quyền chuẩn hóa 4 vai trò (`CUSTOMER`, `STAFF`, `ADMIN`, `SUPER_ADMIN`), Role Guard, Permission Guard, bảo vệ triệt để các routes quản trị.
- **TASK 08 [P0] — JWT Security**: Triển khai cơ chế Access Token & Refresh Token, token rotation, thu hồi token khi đăng xuất (blacklist/token revocation), xử lý invalid token an toàn.
- **TASK 09 [P1] — API Security**: Bổ sung Helmet security headers, CORS chặt chẽ theo whitelist, Rate limiting (Throttler) chuyên sâu cho login/register/payment/admin, input sanitization chống XSS/NoSQL Injection.

### PHASE 3 — PRODUCT
- **TASK 10 [P1] — Product Management**: Hoàn thiện tính năng quản trị sản phẩm Admin (CRUD, ẩn/hiện, upload ảnh, SKU, ISBN, tác giả, nhà xuất bản, giá bán, giá khuyến mãi, tồn kho).
- **TASK 11 [P1] — Category & Attributes**: Quản lý danh mục đa cấp, sinh Slug tự động, cây danh mục (Category Tree), liên kết sản phẩm - danh mục.
- **TASK 12 [P1] — Search & Filter**: Nâng cấp bộ tìm kiếm Full-text (tên sách, SKU, ISBN, tác giả, NXB) kết hợp bộ lọc (danh mục, khoảng giá, số sao, tồn kho, khuyến mãi) và sắp xếp kèm phân trang chuẩn.
- **TASK 13 [P1] — Product Detail**: API chi tiết sản phẩm toàn diện (Gallery ảnh, giá & chiết khấu, thông số kỹ thuật, đánh giá, sản phẩm tương tự/liên quan).

### PHASE 4 — SHOPPING
- **TASK 14 [P0] — Cart**: Xây dựng module Cart hoàn chỉnh trên backend (thêm, sửa số lượng, xóa, làm trống), kiểm tra tồn kho thời gian thực, tính subtotal, áp dụng voucher, tính phí ship. Xử lý sản phẩm bị xóa, đổi giá hoặc hết hàng.
- **TASK 15 [P0] — Checkout**: Luồng checkout an toàn đa bước (Cart -> Address -> Shipping -> Promotion -> Payment -> Confirm -> Order) với validation nguyên tử trước khi tạo đơn.
- **TASK 16 [P1] — Address**: Quản lý sổ địa chỉ người dùng (thêm, sửa, xóa, đặt mặc định) với đầy đủ thông tin: tên, SĐT, tỉnh/thành, quận/huyện, phường/xã, địa chỉ chi tiết.
- **TASK 17 [P0] — Order**: Quản lý vòng đời đơn hàng qua các trạng thái: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPING`, `DELIVERED`, `CANCELLED`, `RETURNED`. Cấm chuyển đổi trạng thái bất hợp lệ, kiểm tra quyền sở hữu đơn.

### PHASE 5 — BUSINESS
- **TASK 18 [P0] — Payment Architecture**: Thiết kế kiến trúc Payment Provider Abstraction (`PaymentService`, `PaymentProvider`) hỗ trợ mở rộng COD, Chuyển khoản, VNPay, MoMo; xử lý callback, duplicate callback, timeout an toàn.
- **TASK 19 [P1] — Promotion**: Hệ thống mã giảm giá (Coupon theo %, số tiền cố định, đơn tối thiểu, mức giảm tối đa, thời hạn, giới hạn số lượt sử dụng tổng và theo từng user).
- **TASK 20 [P0] — Inventory**: Quản lý kho hàng chuyên sâu với `InventoryTransaction` cho 5 loại biến động (`IMPORT`, `SALE`, `RETURN`, `ADJUSTMENT`, `DAMAGE`). Không để tồn kho âm, tự động hoàn kho khi hủy đơn.
- **TASK 21 [P1] — Review & Rating**: Đánh giá & xếp hạng sản phẩm (chỉ khách đã mua và nhận hàng thành công mới được đánh giá), quản trị viên có quyền kiểm duyệt/ẩn/xóa review vi phạm.
- **TASK 22 [P2] — Wishlist**: Danh sách yêu thích của người dùng (thêm, xóa, liệt kê, chuyển nhanh vào giỏ hàng).
- **TASK 23 [P1] — Notification**: Hệ thống thông báo đa loại (đơn hàng mới, thanh toán thành công, đang giao hàng, khuyến mãi, hàng về lại kho) đẩy qua WebSocket & lưu DB.

### PHASE 6 — ADMIN & MOBILE
- **TASK 24 [P1] — Dashboard**: Bảng điều khiển quản trị thống kê doanh thu, đơn hàng, khách hàng, sản phẩm bán chạy, danh mục nổi bật kèm biểu đồ trực quan.
- **TASK 25 [P1] — Admin UX**: Tối ưu trải nghiệm giao diện quản trị (Sidebar điều hướng, Breadcrumb, Modal xác nhận, Toast, Skeleton loading, Empty state, Error state).
- **TASK 26 [P0] — Mobile API Integration**: Kiểm tra và đồng bộ ứng dụng Flutter Mobile kết nối trơn tru với toàn bộ API Backend chuẩn hóa mới.
- **TASK 27 [P1] — Mobile UX**: Cải thiện trải nghiệm Mobile (Splash, xử lý offline, slow network, loading shimmer, error retry).

### PHASE 7 — QUALITY & DEPLOYMENT
- **TASK 28 [P0] — Testing**: Viết và chạy bộ kiểm thử toàn diện: Unit test cho các service trọng yếu (Auth, Product, Cart, Order, Payment, Inventory, Promotion) và E2E Flow test.
- **TASK 29 [P1] — CI/CD**: Thiết lập quy trình CI/CD tự động (Lint -> Type Check -> Unit Test -> Build -> Deploy) cho các môi trường.
- **TASK 30 [P0] — Production Readiness**: Hoàn thiện tài liệu Swagger/OpenAPI, README hướng dẫn triển khai, cấu hình Docker Compose, tối ưu bảo mật và hiệu năng trước khi đưa vào vận hành thực tế.

---

## 6. TIÊU CHÍ CHẤP NHẬN CHUNG (ACCEPTANCE CRITERIA)
- Code sạch, tuân thủ SOLID và Clean Architecture.
- Tất cả controller chỉ điều phối HTTP và ủy quyền xử lý nghiệp vụ cho service.
- Định dạng API Success và Error chuẩn hóa 100%.
- Không có lỗ hổng bảo mật nghiêm trọng (không lộ secret, password băm bcrypt, JWT có thời hạn và xác thực an toàn).
- Tất cả unit tests và E2E tests vượt qua (PASS 100%).
- Frontend và Mobile App tích hợp hoàn hảo với backend mà không phát sinh lỗi tương thích ngược.
