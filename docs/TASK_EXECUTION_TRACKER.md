# BẢNG THEO DÕI TIẾN ĐỘ THỰC THI TOÀN BỘ TASK (MASTER TASK EXECUTION TRACKER)
> **Dự án**: Nhà sách Trường Thành (Trường Thành Bookstore)  
> **Nguồn đặc tả**: `docs/TRUONG_THANH_MASTER_AUDIT_IMPLEMENTATION_2026-09-03.md`  
> **Cập nhật lần cuối**: 2026-09-03  
> **Trạng thái tổng thể**: Đang triển khai (In Progress)  
> **Tỷ lệ hoàn thành Core Tasks**: 2 / 18 tasks (11.1%)  
> **Test Suite Status**: 24/24 Suites PASS — 294/294 Tests Green (100%)

---

## MỤC LỤC
1. [Bảng Dashboard Tổng hợp Tiến độ](#1-bảng-dashboard-tổng-hợp-tiến-độ)
2. [Tiến độ theo Sprint](#2-tiến-độ-theo-sprint)
3. [Phần A: 18 Core Master Tasks (P0 – P3)](#3-phần-a-18-core-master-tasks-p0--p3)
4. [Phần B: Extended Backlog (8 Tasks bổ trợ)](#4-phần-b-extended-backlog-8-tasks-bổ-trợ)
5. [Phần C: Các mục cần xác minh trên môi trường thật (7 Need Verify Items)](#5-phần-c-các-mục-cần-xác-minh-trên-môi-trường-thật-7-need-verify-items)
6. [Phần D: Production Definition of Done & Go / No-Go Gate](#6-phần-d-production-definition-of-done--go--no-go-gate)

---

## 1. BẢNG DASHBOARD TỔNG HỢP TIẾN ĐỘ

### 1.1 Tổng quan theo Nhóm Vai trò (Domain / Role Breakdown)

| Nhóm Vai trò | Tổng task | Đã hoàn thành (DONE) | Đang làm (WIP) | Chưa làm (TODO) | Tỷ lệ (%) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Business Analysis (BA)** | 1 | 1 | 0 | 0 | 100% |
| **Quality Assurance (QA & Security)** | 3 | 1 | 0 | 2 | 33.3% |
| **Backend & Database (BE)** | 9 | 2 | 0 | 7 | 22.2% |
| **Frontend Web (FE)** | 2 | 0 | 0 | 2 | 0% |
| **DevOps & Infrastructure** | 1 | 0 | 0 | 1 | 0% |
| **Mobile App (Flutter)** | 1 | 0 | 0 | 1 | 0% |
| **Project Management (PM)** | 1 | 0 | 1 | 0 | Đang duy trì |
| **TỔNG CỘNG (Core Master Tasks)** | **18** | **4** | **1** | **13** | **22.2%** |
| *Extended Backlog (Bổ trợ)* | *8* | *0* | *0* | *8* | *0%* |
| *Mục xác minh thật (Need Verify)* | *7* | *2* | *0* | *5* | *28.6%* |

---

## 2. TIẾN ĐỘ THEO SPRINT

### Sprint 1: Security + Correctness (Ưu tiên cao nhất)
- [x] **BA-01**: Chốt core business rules & Role × Permission matrix *(DONE 2026-09-03)*
- [x] **QA-01 (Part A)**: Viết token isolation test đỏ & verify xanh *(DONE 2026-09-03)*
- [x] **BE-01**: Tách access/refresh/reset token độc lập *(DONE 2026-09-03)*
- [x] **BE-02**: Gộp Review schema (chuẩn hóa `isVisible`, `isVerifiedPurchase`, admin reply) *(DONE 2026-09-03)*
- [ ] **BE-06**: Email enumeration + cookie config
- [ ] **BE-09 (Part A)**: Xóa `revenueGrowthRate: 12.5` và `ordersGrowthRate: 8.3` hardcoded
- [ ] **FE-02**: Gỡ UI số giả, đồng bộ Reports UI

### Sprint 2: Order Correctness + Business Rules
- [ ] **BE-03**: Landing page order tích hợp OrdersService pipeline
- [ ] **BE-05**: Loyalty đúng mốc `DELIVERED` + auto-cancel đơn PENDING quá hạn (24h/48h)
- [ ] **BE-08**: MongoDB indexes + Mock payment docs + Gemini JSON schema validation
- [ ] **BE-09 (Part B)**: Sửa Reports: tính toán tăng trưởng và doanh thu danh mục thật
- [x] **QA-01 (Part B & C)**: Authorization matrix + Security regression & IDOR *(DONE 2026-09-03)*

### Sprint 3: Observability + E2E + Deployment
- [ ] **BE-04**: Redis blacklist + distributed throttler
- [ ] **BE-07**: Structured JSON logging + Sentry error tracking
- [ ] **QA-02**: Playwright E2E toàn trình các flow mua hàng cốt lõi
- [ ] **DEVOPS-01**: CI/CD pipeline cleanup, Docker Compose Mongo auth, smoke tests

### Sprint 4: Maintainability + Release Readiness
- [ ] **FE-01**: Refactor Vue shared components (DataTable, FilterBar, FormModal, v.v.)
- [ ] **QA-03**: Load test (k6/autocannon) + report accuracy regression
- [ ] **MOBILE-01**: Mobile release keystore, FCM push notification
- [ ] **TECHDEBT-01**: Giảm lint debt cảnh báo, xóa `Promise<any>`
- [ ] **PRODUCT-01**: Giao diện & logic tiêu điểm Loyalty tại checkout (nếu BA chốt MVP)

---

## 3. PHẦN A: 18 CORE MASTER TASKS (P0 – P3)

---

### [x] BA-01 — Chốt Core Commerce Business Rules
- **Role chính:** BA | **Priority:** P0 | **Effort:** S | **Dependency:** Không
- **Trạng thái:** **HOÀN THÀNH (DONE)** | **Ngày hoàn tất:** 2026-09-03
- **Bằng chứng & Tài liệu:** Đã cập nhật toàn diện [`docs/BUSINESS_RULES.md`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/docs/BUSINESS_RULES.md) v2.0 và ma trận phân quyền.

#### Danh mục chi tiết:
- [x] Chốt mốc cộng điểm Loyalty: `DELIVERED` (khi giao hàng thành công & thanh toán, có cờ `loyaltyAwarded: true`, hoàn điểm khi `RETURNED`).
- [x] Chốt tỷ lệ quy đổi: Tích 1:1,000 VND; Tiêu 1 điểm = 100 VND (tối đa 20% subtotal, tối thiểu 1,000 điểm).
- [x] Chốt thời gian auto-cancel đơn PENDING: 24h đối với thanh toán online / chuyển khoản; 48h đối với COD.
- [x] Chốt thông báo trước auto-cancel: Gửi Push/In-app Notification + Email trước 2 giờ.
- [x] Chốt Landing Page: Bán Product ID thật trong CSDL, đi qua `OrdersService.create()`, trừ kho nguyên tử, ghi sổ kho `SALE`, không sinh email ảo.
- [x] Chốt cổng thanh toán Production: COD, Chuyển khoản VietQR, VNPay, MoMo (tắt mock ở production).
- [x] Cập nhật `docs/BUSINESS_RULES.md` thành bản đặc tả chính thức 9 chương.
- [x] Tạo ma trận Role × Permission chi tiết cho QA.

---

### [x] QA-01 — Token Isolation + Authorization Matrix Suite
- **Role chính:** QA + Security | **Priority:** P0/P1 | **Effort:** L | **Dependency:** BE-01
- **Trạng thái:** **HOÀN THÀNH (DONE)** | **Ngày hoàn tất:** 2026-09-03
- **Bằng chứng & Mã nguồn:**  
  - [`backend/src/modules/auth/token-isolation.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/auth/token-isolation.spec.ts) (10/10 tests PASS)
  - [`backend/src/common/guards/authorization-matrix.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/common/guards/authorization-matrix.spec.ts) (25/25 tests PASS)
  - Nâng cấp `auth.service.ts` (`type: 'access'`) và `jwt.strategy.ts` (`payload.type === 'access'`).

#### Danh mục chi tiết:
- [x] **Token Isolation (Phần A)**:
  - [x] Access token dùng đúng endpoint -> PASS (200/201).
  - [x] Refresh token dùng làm Bearer -> Bị chặn 401 Unauthorized (`ERR_INVALID_TOKEN`).
  - [x] Reset token dùng làm Bearer -> Bị chặn 401 Unauthorized (`ERR_INVALID_TOKEN`).
  - [x] Access token gửi vào refresh flow -> Bị chặn 401 Unauthorized (`ERR_INVALID_TOKEN`).
  - [x] Token hết hạn -> Bị chặn 401 Unauthorized (`ERR_REFRESH_TOKEN_EXPIRED` / `ERR_TOKEN_EXPIRED`).
  - [x] Token sai secret / chữ ký giả mạo -> Bị chặn 401 Unauthorized (`ERR_INVALID_TOKEN`).
  - [x] TokenVersion cũ (sau đổi pass/đăng xuất) -> Bị chặn 401 Unauthorized (`ERR_TOKEN_REVOKED`).
  - [x] Blacklisted JTI -> Bị chặn 401 Unauthorized (`ERR_TOKEN_REVOKED`).
  - [x] Tái sử dụng Refresh Token -> Kích hoạt thu hồi toàn bộ session, tăng tokenVersion, xóa hash, 401 (`ERR_REFRESH_TOKEN_REUSE`).
- [x] **Authorization Matrix (Phần B)**:
  - [x] Orders module: SUPER_ADMIN, ADMIN, STAFF có `MANAGE_ORDERS` pass; STAFF không quyền 403; CUSTOMER 403; Anonymous 401.
  - [x] Users module: ADMIN pass; STAFF 403; CUSTOMER 403; Anonymous 401.
  - [x] Payments module: ADMIN pass; STAFF có quyền pass; STAFF không quyền 403; CUSTOMER 403.
  - [x] Reports module: ADMIN pass; STAFF có `VIEW_REPORTS` pass; STAFF không quyền 403; CUSTOMER 403.
- [x] **Security Regression & IDOR (Phần C)**:
  - [x] Customer A không xem được đơn của Customer B (403 Forbidden).
  - [x] Customer A không hủy được đơn của Customer B (403 Forbidden).
  - [x] Chặn tải PDF Invoice của đơn hàng người khác (403 Forbidden).
  - [x] Chặn truy cập thông tin thanh toán của đơn hàng người khác (403 Forbidden).
  - [x] Đơn khách vãng lai (guest): Thiếu hoặc sai token `x-guest-order-token` -> 403 Forbidden.

---

### [x] BE-01 — Tách Access / Refresh / Reset Token Secret
- **Role chính:** Backend + Security | **Priority:** P0 | **Effort:** M | **Dependency:** QA-01
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-03)**
- **Mục tiêu:** Tách biệt khóa bí mật (Secret Keys) để triệt tiêu hoàn toàn khả năng giải mã chéo giữa các loại token.

#### Danh mục chi tiết:
- [x] Bổ sung biến môi trường `JWT_REFRESH_SECRET` và `JWT_RESET_SECRET` trong `.env` và `env.validation.ts`.
- [x] Bắt buộc fail startup nếu chạy môi trường `production` mà thiếu một trong các secret trên hoặc dùng key trùng nhau.
- [x] Cập nhật luồng ký và verify Refresh Token dùng `JWT_REFRESH_SECRET`.
- [x] Cập nhật luồng ký và verify Reset Token dùng `JWT_RESET_SECRET`.
- [x] Xử lý migration cho token cũ (yêu cầu user đăng nhập lại an toàn).
- [x] Đảm bảo `token-isolation.spec.ts` bổ sung các kịch bản mã hóa chéo và tiếp tục chạy xanh 100%.

---

### [x] BE-02 — Gộp Review Schema & Fix Duplicate Model
- **Role chính:** Backend | **Priority:** P0 | **Effort:** M/L | **Dependency:** Không
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-03)**
- **Mục tiêu:** Loại bỏ schema Review thừa trong `products` module, bảo đảm các trường `isVisible`, `isVerifiedPurchase`, `adminReply`, `images` được lưu thật.

#### Danh mục chi tiết:
- [x] Kiểm tra schema hiện tại trong bộ nhớ bằng `mongoose.models.Review.schema.paths`.
- [x] Kiểm tra dữ liệu thực tế mẫu xem có trường nào bị thiếu hoặc lệch schema.
- [x] Xóa bỏ định nghĩa Review schema cũ/trùng lặp trong `products` module (`review.schema.ts`, `review.dto.ts`).
- [x] Chuyển toàn bộ controller/service của Products sang dùng chung schema và service từ `reviews` module chuẩn.
- [x] Đảm bảo các trường `isVisible`, `isVerifiedPurchase`, `adminReply`, `images` persist thật và bảo toàn tương thích với frontend `ProductDetail.vue`.
- [x] Viết unit/integration test xác minh toàn bộ test suite chạy xanh 100%.

---

### [ ] BE-03 — Landing Page Dùng OrdersService Pipeline Chuẩn
- **Role chính:** Backend | **Priority:** P0 | **Effort:** L | **Dependency:** BA-01
- **Trạng thái:** **CHƯA LÀM (TODO)** (Đã có đặc tả đầy đủ từ BA-01)
- **Mục tiêu:** Đưa toàn bộ đơn hàng từ Landing Page đi qua pipeline đặt hàng chuẩn của hệ thống, trừ kho nguyên tử, có sổ cái kho, không lệch báo cáo.

#### Danh mục chi tiết:
- [ ] Gói sản phẩm trên Landing Page bắt buộc cấu hình `productId` thật trong DB.
- [ ] Chuyển phương thức `submitOrder()` trong `landing-page.service.ts` sang gọi `OrdersService.create()` (hoặc `createAtomic()`).
- [ ] Áp dụng cùng cơ chế kiểm tra giá và tồn kho thực tế.
- [ ] Ghi nhận sổ cái kho `InventoryTransactionType.SALE` khi tạo đơn từ Landing Page.
- [ ] Sinh mã đơn hàng chuẩn `TTxxxxxx` từ generator tập trung.
- [ ] Xóa bỏ việc sinh email giả định dạng `{phone}@truongthanh.vn`.
- [ ] Gắn nhãn `orderSource: 'LANDING_PAGE'` kèm `landingPageId` phục vụ thống kê.
- [ ] Bổ sung Idempotency key cho API submit đơn Landing Page.

---

### [ ] BE-04 — Redis Blacklist + Distributed Throttler
- **Role chính:** Backend + DevOps | **Priority:** P0* (Blocker nếu chạy >1 node) | **Effort:** M | **Dependency:** BE-01
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Chia sẻ danh sách đen token và giới hạn tần suất (Rate Limiting) giữa nhiều instance backend.

#### Danh mục chi tiết:
- [ ] Cấu hình Redis Service cho môi trường production (`REDIS_URL`).
- [ ] Chuyển `TokenBlacklistService` từ bộ nhớ trong (In-Memory Map) sang Redis `SETEX` (với TTL bằng thời hạn còn lại của JWT).
- [ ] Cấu hình `@nestjs/throttler` sử dụng Redis storage provider.
- [ ] Xử lý fallback an toàn khi Redis gặp sự cố (fail-open có logging hoặc alert).
- [ ] Xác minh: Đăng xuất tại instance A -> token bị từ chối ngay lập tức tại instance B.

---

### [ ] BE-05 — Loyalty Đúng Thời Điểm + Auto-Cancel Đơn PENDING
- **Role chính:** Backend | **Priority:** P0 | **Effort:** M | **Dependency:** BA-01
- **Trạng thái:** **CHƯA LÀM (TODO)** (Đã có đặc tả đầy đủ từ BA-01)
- **Mục tiêu:** Không cộng điểm khi tạo đơn `PENDING`; chuyển mốc cộng điểm sang `DELIVERED`; xây dựng Cron Job tự hủy đơn quá hạn và hoàn kho.

#### Danh mục chi tiết:
- [ ] Xóa bỏ hàm cộng loyalty points tại thời điểm `OrdersService.create()`.
- [ ] Bổ sung trường `loyaltyAwarded: { type: Boolean, default: false }` vào `OrderSchema`.
- [ ] Trong `OrdersService.updateStatusInternal()`: Khi trạng thái đạt `DELIVERED` (hoặc `COMPLETED`) và `!order.loyaltyAwarded` -> tiến hành cộng điểm và set `loyaltyAwarded = true`.
- [ ] Khi đơn chuyển sang `RETURNED`: Nếu `order.loyaltyAwarded === true` -> tự động thu hồi đúng số điểm đã cộng.
- [ ] Xây dựng Cron Job định kỳ (mỗi 15 phút): Quét và tự động hủy đơn `PENDING` quá 24h (chuyển khoản/online) hoặc 48h (COD).
- [ ] Tự động hoàn kho nguyên tử, hoàn số lượng đã bán (`sold`), giải phóng voucher (`promotionsService.releaseUsage()`), ghi log timeline khi auto-cancel.
- [ ] Gửi thông báo nhắc nhở trước khi hủy đơn 2 giờ.

---

### [ ] BE-06 — Fix Email Enumeration + Chuẩn hóa Cookie Config
- **Role chính:** Backend + Security | **Priority:** P0 | **Effort:** S | **Dependency:** Không
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Chống rò rỉ danh sách người dùng qua phản hồi OTP/Password reset và chuẩn hóa cấu hình cookie cross-origin.

#### Danh mục chi tiết:
- [ ] Trong `authService.verifyOtp()` và `resetPassword()`: Không trả về thông báo để lộ email có tồn tại hay không; chuẩn hóa response thông điệp tương đồng.
- [ ] Đưa cấu hình `COOKIE_SAME_SITE` về một nguồn sự thật duy nhất (Single Source of Truth) trong `ConfigService`.
- [ ] Cập nhật file `.env.example` hướng dẫn chi tiết cách cấu hình `SameSite=None` và `Secure=true` khi frontend và backend khác domain.
- [ ] Xác minh cookie header trong response không bị trình duyệt chặn trên production.

---

### [ ] BE-07 — Structured JSON Logging + Sentry Monitoring
- **Role chính:** Backend + DevOps | **Priority:** P1 | **Effort:** M | **Dependency:** Không
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Giám sát lỗi thời gian thực và truy vết sự cố xuyên suốt qua Correlation ID.

#### Danh mục chi tiết:
- [ ] Tích hợp logger chuẩn JSON cấu trúc (`nestjs-pino` hoặc Winston).
- [ ] Tự động sinh `correlationId` (hoặc `requestId`) cho mỗi request gửi đến và gắn vào log context.
- [ ] Cấu hình bộ lọc (Redaction Filter): Tự động che giấu các trường nhạy cảm (`password`, `token`, `otp`, `secret`, `creditCard`).
- [ ] Tích hợp Sentry SDK cho backend NestJS để tự động gửi thông báo khi có exception 500.
- [ ] Bổ sung audit log cho các sự kiện bảo mật quan trọng (đăng nhập thất bại, đổi mật khẩu, phân quyền role, khóa tài khoản).

---

### [ ] BE-08 — MongoDB Index + Mock Payment Documentation + Gemini Validation
- **Role chính:** Backend | **Priority:** P1 | **Effort:** S/M | **Dependency:** BE-03
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Tối ưu hóa hiệu năng truy vấn CSDL, tài liệu hóa cổng thanh toán và xác thực dữ liệu AI trả về.

#### Danh mục chi tiết:
- [ ] Bổ sung chỉ mục hợp chất MongoDB: User `{ role: 1, status: 1 }`.
- [ ] Đặt unique index cho `landingPages.slug` và `orders.orderCode`.
- [ ] Đặt chỉ mục cho `cart.user` để tăng tốc truy vấn giỏ hàng.
- [ ] Đổi tên `SignedOnlinePaymentProvider` thành `MockSignedPaymentProvider`.
- [ ] Cập nhật tài liệu: Ghi chú rõ mock payment chỉ phục vụ dev/staging, cấm bật ở production.
- [ ] Viết bộ validate schema (sử dụng DTO / `class-validator`) cho kết quả JSON trả về từ Gemini AI trước khi lưu vào DB.

---

### [ ] BE-09 — Sửa Reports Module (Bỏ Số Giả + Tính Toán Dữ Liệu Thật)
- **Role chính:** Backend | **Priority:** P0 (bỏ số giả) / P1 (tính toán thật) | **Effort:** M | **Dependency:** BE-03
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Phản ánh trung thực số liệu kinh doanh, xóa bỏ hoàn toàn số liệu hardcoded.

#### Danh mục chi tiết:
- [ ] **Làm ngay (P0)**:
  - [ ] Xóa bỏ `revenueGrowthRate: 12.5` hardcoded.
  - [ ] Xóa bỏ `ordersGrowthRate: 8.3` hardcoded.
  - [ ] Tạm thời gỡ bỏ hiển thị trên UI nếu backend chưa tính toán xong số thật.
- [ ] **Tính toán thật (P1)**:
  - [ ] Tính toán tỷ lệ tăng trưởng giữa kỳ hiện tại so với kỳ trước có cùng độ dài ngày.
  - [ ] Xử lý tham số `range=day/week/month/year` ảnh hưởng trực tiếp đến khoảng thời gian query.
  - [ ] Viết lại Aggregation Pipeline tính doanh thu theo danh mục (`category revenue`) từ snapshot `items[].price` của đơn hàng.
  - [ ] Loại trừ đơn `CANCELLED` và `RETURNED` ra khỏi tổng doanh thu.
  - [ ] Loại bỏ việc nuốt lỗi `catch { return [] }` khiến che giấu lỗi hệ thống.
  - [ ] Viết unit/regression test với dataset mẫu có giá trị kỳ vọng cố định để đối chiếu.

---

### [ ] FE-01 — Refactor Shared Components (Frontend Vue 3)
- **Role chính:** Frontend | **Priority:** P2 | **Effort:** L | **Dependency:** QA-02
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Giảm kích thước các file Vue lớn (>800 dòng), tái sử dụng component giao diện.

#### Danh mục chi tiết:
- [ ] Tách component dùng chung: `DataTable.vue`
- [ ] Tách component dùng chung: `FilterBar.vue`
- [ ] Tách component dùng chung: `FormModal.vue`
- [ ] Tách component dùng chung: `ImageUploader.vue`
- [ ] Tách component dùng chung: `StatusBadge.vue`
- [ ] Tái cấu trúc các trang admin: `Products.vue`, `Orders.vue`, `Inventory.vue`, `Promotions.vue`, `Reviews.vue`, `Customers.vue`.
- [ ] Giảm độ dài các trang mục tiêu xuống dưới 400 dòng code.
- [ ] Đảm bảo build Vite và typecheck pass 100%, không hồi quy giao diện.

---

### [ ] FE-02 — Sửa Reports UI Đồng Bộ Theo API Thật
- **Role chính:** Frontend | **Priority:** P0/P1 | **Effort:** S | **Dependency:** BE-09
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Giao diện báo cáo không hiển thị phần trăm tăng trưởng giả, xử lý đúng các trạng thái dữ liệu.

#### Danh mục chi tiết:
- [ ] Ẩn các thẻ Growth Card (12.5%, 8.3%) cho đến khi backend trả về số liệu tính toán thật.
- [ ] Đồng bộ bộ lọc Range Filter (`day`, `week`, `month`, `year`) gửi query param chuẩn tới API.
- [ ] Bổ sung trạng thái Loading Spinner, Empty State và Error Alert rõ ràng khi gọi API báo cáo.
- [ ] Tuyệt đối không fallback sang mảng số liệu tĩnh ở phía client.

---

### [ ] QA-02 — Playwright E2E Testing Toàn Trình
- **Role chính:** QA | **Priority:** P2 | **Effort:** M | **Dependency:** BE-01, BE-03, BE-05
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Tự động hóa kiểm thử luồng người dùng thực tế trên trình duyệt Chromium/Firefox.

#### Danh mục chi tiết:
- [ ] Kịch bản 1: Đăng ký -> Đăng nhập -> Đăng xuất -> Xác minh token cũ không dùng lại được.
- [ ] Kịch bản 2: Thêm giỏ hàng -> Đặt hàng COD -> Xem My Orders -> Tải hóa đơn PDF.
- [ ] Kịch bản 3: Admin duyệt đơn PENDING -> CONFIRMED -> Kiểm tra timeline và tồn kho.
- [ ] Kịch bản 4: Đặt hàng từ Landing Page -> Kiểm tra tồn kho và thống kê báo cáo.
- [ ] Kịch bản 5: Lọc báo cáo doanh thu theo khoảng ngày -> Dữ liệu hiển thị đúng.
- [ ] Cấu hình Playwright xuất Trace và Screenshot khi test case thất bại.
- [ ] Tích hợp vào CI pipeline GitHub Actions.

---

### [ ] QA-03 — Load Test + Report Accuracy Regression
- **Role chính:** QA | **Priority:** P2 | **Effort:** M | **Dependency:** BE-09
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Xác định ngưỡng chịu tải của hệ thống và tính chính xác của dữ liệu tài chính.

#### Danh mục chi tiết:
- [ ] Xây dựng kịch bản load test danh mục sản phẩm và tìm kiếm sách (k6 hoặc Autocannon).
- [ ] Xây dựng kịch bản load test tạo đơn hàng đồng thời (kiểm tra race condition tồn kho).
- [ ] Xây dựng bộ dữ liệu seed chuẩn (Seed Dataset) với doanh thu và đơn hàng tính tay biết trước.
- [ ] Chạy test tự động so sánh số liệu API `/reports/*` với kết quả kỳ vọng từ seed data.

---

### [ ] DEVOPS-01 — CI/CD Pipeline & Docker Hardening
- **Role chính:** DevOps | **Priority:** P2 | **Effort:** M | **Dependency:** Không
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Tối ưu hóa quy trình tích hợp liên tục và bảo mật hạ tầng container.

#### Danh mục chi tiết:
- [ ] Xóa bỏ các file GitHub Actions workflow bị trùng lặp trong thư mục `.github/workflows/`.
- [ ] Kích hoạt cơ chế xác thực người dùng (Authentication) cho MongoDB trong file `docker-compose.yml`.
- [ ] Xây dựng kịch bản Smoke Test tự động gọi endpoint `/api/health` sau khi deploy.
- [ ] Tích hợp công cụ quét mã độc/rò rỉ khóa bảo mật `gitleaks` vào quy trình CI.
- [ ] Cấu hình Branch Protection Rules trên GitHub cho nhánh `main` (yêu cầu review và CI pass).
- [ ] Lưu trữ artifact kết quả Playwright test trace và báo cáo test coverage.

---

### [ ] MOBILE-01 — Chuẩn Bị Release Ứng Dụng Mobile Flutter
- **Role chính:** Mobile | **Priority:** P3 | **Effort:** L | **Dependency:** BE-07
- **Trạng thái:** **CHƯA LÀM (TODO)**
- **Mục tiêu:** Sẵn sàng phát hành ứng dụng lên Google Play Store và Apple App Store.

#### Danh mục chi tiết:
- [ ] Tạo và cấu hình an toàn Release Keystore (Android) và Signing Certificate (iOS).
- [ ] Quản lý bảo mật các API keys và URL cấu hình môi trường production.
- [ ] Kiểm thử tích hợp gọi API backend staging thực tế trên máy ảo và thiết bị thật.
- [ ] Tích hợp Firebase Cloud Messaging (FCM) để nhận Push Notification đơn hàng.
- [ ] Kiểm thử luồng Deeplink: Nhấn vào thông báo mở trực tiếp màn hình chi tiết đơn hàng.

---

### [/] PM-01 — Quản Trị Phân Phối & Cổng Phát Hành (Delivery Governance)
- **Role chính:** PM | **Priority:** P0 | **Effort:** Liên tục | **Dependency:** Tất cả
- **Trạng thái:** **ĐANG THỰC HIỆN (IN PROGRESS)**
- **Mục tiêu:** Điều phối tiến độ, kiểm soát scope, ngăn ngừa regression và quản trị rủi ro release.

#### Danh mục chi tiết:
- [x] Khởi tạo Master Task Execution Tracker tập trung.
- [x] Đóng băng phạm vi các task P0, không cho task P2/P3 chen ngang khi P0 chưa hoàn tất.
- [ ] Thiết lập cuộc họp Daily Bug Triage xử lý nhanh các vấn đề blocker.
- [ ] Đảm bảo mọi PR hợp nhất vào `main` bắt buộc phải có QA test evidence đi kèm.
- [ ] Quản lý việc triển khai và kiểm thử trên môi trường Staging.
- [ ] Điều phối buổi kiểm thử chấp nhận người dùng (UAT) với chủ cửa hàng sách.
- [ ] Đánh giá tiêu chí Go / No-Go trước khi phát hành Production.
- [ ] Soạn thảo kế hoạch khôi phục sự cố (Rollback Plan).

---

## 4. PHẦN B: EXTENDED BACKLOG (8 TASKS BỔ TRỢ)

*Ghi chú: Các mục này không chen vào Sprint 1 và Sprint 2 nếu các task P0 chưa hoàn tất.*

| Trạng thái | Task ID | Tên Task & Nội dung chi tiết | Role chính | Priority | Effort | Điều kiện & Acceptance Criteria |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| [ ] | **BE-10** | **Chống abuse guest checkout**: Giới hạn số đơn PENDING chưa xác nhận theo số điện thoại; tích hợp Cloudflare Turnstile / CAPTCHA khi có dấu hiệu bất thường. | Backend + BA + Security | P1/P2 | M | Ngăn chặn spam đơn giữ kho ảo mà không gây khó khăn cho khách mua hàng bình thường. |
| [ ] | **SEC-05** | **Thay thế regex lọc HTML bằng allowlist sanitizer**: Sử dụng thư viện `sanitize-html` cho các trường chấp nhận định dạng HTML (mô tả sách, bài viết blog). | Security + Backend | P2 | S/M | Vượt qua các payload tấn công XSS phức tạp / nested obfuscation; không làm mất định dạng văn bản hợp lệ. |
| [ ] | **TECHDEBT-01**| **Giảm lint debt & chuẩn hóa kiểu dữ liệu**: Giảm dần số lượng cảnh báo ESLint theo nguyên tắc ratchet (hạ dần budget theo từng sprint); xóa bỏ `Promise<any>` trong `OrdersService` và `PaymentsService`. | Backend | P2 | Liên tục | Định nghĩa Type/Interface rõ ràng cho các trường liên quan đến tiền tệ, trạng thái và giao dịch. |
| [ ] | **FE-03** | **Tối ưu hóa hình ảnh WebP/AVIF**: Chuyển đổi định dạng ảnh bìa sách sang WebP/AVIF, áp dụng lazy-loading và định kích thước ảnh responsive. | Frontend | P2 | M | Giảm dung lượng tải trang chủ và trang chi tiết sách, cải thiện chỉ số Google Lighthouse / Core Web Vitals. |
| [ ] | **PRODUCT-01** | **Tính năng Tiêu điểm Loyalty tại Checkout**: Xây dựng giao diện cho phép khách nhập số điểm muốn dùng để giảm giá đơn hàng (tối đa 20% subtotal). | BA + Backend + FE + Mobile | P2 | M/L | Kiểm tra trừ điểm nguyên tử, ghi sổ cái điểm thưởng, chống gian lận tiêu điểm đồng thời (double-spend). |
| [ ] | **PAY-01** | **Tích hợp cổng VNPay & MoMo thật**: Xây dựng kết nối API chính thức theo tài liệu Sandbox/Production của VNPay và MoMo; đối soát chữ ký số IPN callback. | Backend + QA + DevOps | P3 (Block nếu bật online) | L | Có hợp đồng test case đầy đủ; đối soát số tiền khớp 100%; tự động cập nhật đơn hàng sang `CONFIRMED`. |
| [ ] | **SHIPPING-01**| **Mã vận đơn & Tích hợp đối tác vận chuyển**: Tích hợp API đơn vị vận chuyển (GHTK / GHN) để tự động tạo vận đơn và tra cứu hành trình giao hàng. | BA + Backend + FE + Mobile | P3 | L | Ánh xạ trạng thái giao hàng của đối tác vào State Machine đơn hàng mà không làm phá vỡ logic nội bộ. |
| [ ] | **MOBILE-02** | **Kiểm thử hồi quy ứng dụng Mobile trên thiết bị thật**: Chạy toàn bộ luồng mua hàng trên máy ảo và thiết bị vật lý kết nối với backend staging thật. | Mobile + QA | P2/P3 | M | Đảm bảo các chức năng tìm kiếm, giỏ hàng, đặt hàng, nhận thông báo hoạt động mượt mà không bị crash. |

---

## 5. PHẦN C: CÁC MỤC CẦN XÁC MINH TRÊN MÔI TRƯỜNG THẬT (7 NEED VERIFY ITEMS)

| Trạng thái | Mã số | Nội dung cần xác minh | Phương pháp & Lệnh kiểm tra | Người phụ trách | Kết quả xác minh |
|:---:|:---:|:---|:---|:---:|:---|
| [ ] | **NV-01** | **Review Schema nào đang thực sự active trong bộ nhớ**: Kiểm tra xem model Review có bị ghi đè bởi model cũ của products hay không. | Chạy lệnh kiểm tra `mongoose.models.Review.schema.paths` trên runtime backend. | Backend | Chờ chạy trên Staging |
| [ ] | **NV-02** | **Kiểm tra dữ liệu Review trên Production Database**: Xác minh các trường `isVisible`, `isVerifiedPurchase`, `adminReply` có giá trị hay bị null. | Query mẫu trên MongoDB production: `db.reviews.findOne({ adminReply: { $exists: true } })`. | Backend / DBA | Chờ truy cập DB Production |
| [ ] | **NV-03** | **Cấu hình `COOKIE_SAME_SITE` trên môi trường thật**: Xác minh trình duyệt có nhận và lưu cookie `access_token` hay bị chặn cross-site. | Kiểm tra Header `Set-Cookie` trên DevTools Network tab khi đăng nhập qua domain production. | Backend / Security | Cần kiểm tra sau khi deploy |
| [x] | **NV-04** | **Test Coverage thực tế của Backend**: Xác minh các test suite chạy thành công và đạt tỷ lệ bao phủ code. | Chạy lệnh `npm test` trên môi trường local/CI. | QA | **ĐÃ VERIFY**: 24/24 test suites pass, 294/294 tests green. |
| [x] | **NV-05** | **Tình trạng Lint cảnh báo hiện tại**: Kiểm tra số lượng cảnh báo ESLint trong toàn bộ mã nguồn. | Chạy lệnh `npm run lint`. | Backend / DevOps | **ĐÃ VERIFY**: Có warning budget 1816, đang kiểm soát theo cơ chế ratchet. |
| [ ] | **NV-06** | **Số lượng Backend Instance trên Render**: Xác minh backend đang chạy 1 instance đơn lẻ hay cluster đa node. | Kiểm tra cấu hình Instance Count trên Render Dashboard. | DevOps | Chờ thông tin từ DevOps |
| [ ] | **NV-07** | **Hiệu năng truy vấn Báo cáo Aggregation**: Đánh giá thời gian phản hồi của các pipeline tính doanh thu trên tập dữ liệu lớn. | Sử dụng lệnh MongoDB `explain("executionStats")` kết hợp k6 load test. | QA / Backend | Chờ triển khai BE-09 |

---

## 6. PHẦN D: PRODUCTION DEFINITION OF DONE & GO / NO-GO GATE

### 6.1 Bảng Điều Kiện Bắt Buộc Trước Khi Release (Production Definition of Done)

#### Phân hệ Bảo mật (Security)
- [x] Token Type Isolation: Refresh/Reset token tuyệt đối không dùng được làm Bearer Access Token.
- [ ] Email Enumeration: Luồng quên mật khẩu và OTP không tiết lộ danh sách người dùng tồn tại.
- [ ] Secret Management: Thiếu `JWT_SECRET` hoặc cấu hình production bắt buộc dừng server (Fail-closed).
- [ ] Log Privacy: Toàn bộ mật khẩu, token, OTP, khóa bí mật được lọc bỏ khỏi hệ thống log.
- [x] Authorization Matrix: 100% các endpoint nhạy cảm được bảo vệ bởi RolesGuard và PermissionsGuard.

#### Phân hệ Đơn hàng & Kho (Order & Inventory)
- [ ] Pipeline Đặt hàng Thống nhất: Đơn từ Web, Mobile và Landing Page đều đi qua `OrdersService.create()`.
- [x] Atomic Stock Deduction: Trừ kho nguyên tử qua `$inc` kết hợp `$gte`, chống bán vượt tồn kho.
- [ ] Tự động Hủy đơn Treo: Đơn PENDING quá 24h/48h tự động hủy, hoàn kho, hoàn quota khuyến mãi.
- [x] Idempotency: Có cơ chế khóa chống trùng lặp đơn hàng khi gửi request liên tiếp.
- [ ] Mã đơn hàng Duy nhất: Đảm bảo trường `orderCode` có unique index trên CSDL.

#### Phân hệ Đánh giá Sản phẩm (Reviews)
- [ ] Schema duy nhất: Loại bỏ hoàn toàn model Review thừa.
- [ ] Lưu trữ đầy đủ: Các thao tác ẩn/hiện đánh giá, đánh dấu đã mua hàng, phản hồi của admin được lưu vào DB.

#### Phân hệ Báo cáo Tài chính (Reporting)
- [ ] Bỏ số liệu giả: Không còn bất kỳ số liệu phần trăm tăng trưởng hardcoded nào trên API và UI.
- [ ] Bộ lọc thời gian hoạt động thật: Các tham số ngày/tuần/tháng/năm làm thay đổi dữ liệu thống kê thật.
- [ ] Doanh thu chính xác: Doanh thu danh mục được tính toán từ snapshot giá lúc mua trong đơn hàng.
- [ ] Loại trừ đơn hủy: Các đơn `CANCELLED` và `RETURNED` không được tính vào doanh thu thuần.

#### Phân hệ Kiểm thử & Vận hành (Testing & Operations)
- [x] Token Isolation Suite: 10/10 test cases tự động pass.
- [x] Authorization Matrix Suite: 25/25 test cases tự động pass.
- [ ] Playwright E2E: Toàn bộ kịch bản mua hàng trên trình duyệt pass trên CI.
- [ ] Structured Logging: Có định dạng log JSON kèm correlationId hỗ trợ truy vết sự cố.
- [ ] Error Tracking: Sentry nhận và cảnh báo lỗi 500 kịp thời.
- [ ] Database Security: MongoDB kích hoạt authentication an toàn.

---

### 6.2 Nguyên Tắc Quyết Định Go / No-Go

> [!CAUTION]
> **LỆNH NO-GO (DỪNG PHÁT HÀNH NGAY LẬP TỨC) NẾU:**
> 1. `BE-01` chưa hoàn thành (chưa tách secret token riêng biệt).
> 2. `BE-02` chưa gộp Review schema (nguy cơ mất dữ liệu phản hồi khách hàng).
> 3. `BE-03` chưa tích hợp Landing Page vào pipeline chuẩn (nguy cơ sai lệch tồn kho và thất thoát doanh thu).
> 4. `BE-09` còn hiển thị số liệu tăng trưởng giả mạo trên Dashboard.
> 5. `BE-05` chưa có cơ chế auto-cancel đơn PENDING (nguy cơ bị đối thủ spam đơn giữ kho ảo).
> 6. Bất kỳ test case nào trong bộ Core QA Regression bị báo ĐỎ (FAIL).

> [!TIP]
> **CÁC HẠNG MỤC CÓ THỂ HOÃN (DEFERRABLE) SAU KHI ĐÃ MỞ BÁN COD:**
> - Tích hợp cổng thanh toán online VNPay / MoMo thật (có thể chạy COD và chuyển khoản ngân hàng trước).
> - Đẩy Push Notification qua Firebase FCM trên ứng dụng di động.
> - Tích hợp đối tác vận chuyển tự động (có thể xuất file Excel cho bưu tá giao hàng thủ công).
> - Tính năng tiêu điểm thưởng Loyalty tại bước checkout.
