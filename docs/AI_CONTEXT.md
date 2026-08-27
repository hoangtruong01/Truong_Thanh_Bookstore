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
| **TASK 12** | Tìm kiếm Full-text & Lọc đa tiêu chí phân trang                 | Phase 3 | P1         | ⚪ PENDING  |
| **TASK 13** | Chi tiết sản phẩm, Gallery, Thông số & Đánh giá                 | Phase 3 | P1         | ⚪ PENDING  |
| **TASK 14** | Module Giỏ hàng Backend & Kiểm kho thời gian thực               | Phase 4 | P0         | ⚪ PENDING  |
| **TASK 15** | Luồng Checkout an toàn & Kiểm tra nguyên tử                     | Phase 4 | P0         | ⚪ PENDING  |
| **TASK 16** | Quản lý Sổ địa chỉ giao hàng người dùng                         | Phase 4 | P1         | ⚪ PENDING  |
| **TASK 17** | Quản lý Đơn hàng, Vòng đời trạng thái & Hóa đơn PDF             | Phase 4 | P0         | ⚪ PENDING  |
| **TASK 18** | Kiến trúc Thanh toán Provider Abstraction (VNPay, MoMo, COD)    | Phase 5 | P0         | ⚪ PENDING  |
| **TASK 19** | Hệ thống Mã khuyến mãi (Voucher)                                | Phase 5 | P1         | ⚪ PENDING  |
| **TASK 20** | Quản lý Tồn kho & 5 loại Inventory Transaction                  | Phase 5 | P0         | ⚪ PENDING  |
| **TASK 21** | Đánh giá & Xếp hạng sản phẩm (Verified Purchase)                | Phase 5 | P1         | ⚪ PENDING  |
| **TASK 22** | Danh sách Yêu thích (Wishlist)                                  | Phase 5 | P2         | ⚪ PENDING  |
| **TASK 23** | Hệ thống Thông báo WebSocket Real-time & DB                     | Phase 5 | P1         | ⚪ PENDING  |
| **TASK 24** | Bảng điều khiển Quản trị (Admin Analytics Dashboard)            | Phase 6 | P1         | ⚪ PENDING  |
| **TASK 25** | Tối ưu trải nghiệm Quản trị (Admin UX/Feedback States)          | Phase 6 | P1         | ⚪ PENDING  |
| **TASK 26** | Đồng bộ & Tích hợp API ứng dụng Mobile Flutter                  | Phase 6 | P0         | ⚪ PENDING  |
| **TASK 27** | Nâng cấp trải nghiệm Mobile (UX/Offline/Shimmer)                | Phase 6 | P1         | ⚪ PENDING  |
| **TASK 28** | Kiểm thử tự động (Unit Tests & E2E Test Flow)                   | Phase 7 | P0         | ⚪ PENDING  |
| **TASK 29** | Thiết lập Quy trình CI/CD Pipeline                              | Phase 7 | P1         | ⚪ PENDING  |
| **TASK 30** | Production Readiness, Swagger OpenAPI & Docker                  | Phase 7 | P0         | ⚪ PENDING  |

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
