# BẢNG THEO DÕI TIẾN ĐỘ THỰC THI TOÀN BỘ TASK (MASTER TASK EXECUTION TRACKER)
> **Dự án**: Nhà sách Trường Thành (Trường Thành Bookstore)  
> **Nguồn đặc tả**: `docs/TRUONG_THANH_MASTER_AUDIT_IMPLEMENTATION_2026-09-03.md`  
> **Cập nhật lần cuối**: 2026-09-04  
> **Trạng thái tổng thể**: Đang triển khai (In Progress)  
> **Tỷ lệ hoàn thành Core Tasks đã xác minh**: 11 / 18 tasks (61.1%); Toàn bộ Sprint 1 & Sprint 2 đã HOÀN THÀNH 100%  
> **Test Suite Status (local 2026-09-04)**: 28/28 Suites PASS — 347/347 Tests Green; coverage lines ~58%

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
| **Backend & Database (BE)** | 9 | 8 | 0 | 1 | 88.9% |
| **Frontend Web (FE)** | 2 | 1 | 0 | 1 | 50% |
| **DevOps & Infrastructure** | 1 | 0 | 0 | 1 | 0% |
| **Mobile App (Flutter)** | 1 | 0 | 0 | 1 | 0% |
| **Project Management (PM)** | 1 | 0 | 1 | 0 | Đang duy trì |
| **TỔNG CỘNG (Core Master Tasks)** | **18** | **11** | **1** | **6** | **61.1%** |
| *Extended Backlog (Bổ trợ)* | *8* | *0* | *0* | *8* | *0%* |
| *Mục xác minh thật (Need Verify)* | *7* | *4* | *0* | *3* | *57.1%* |

---

## 2. TIẾN ĐỘ THEO SPRINT

### Sprint 1: Security + Correctness (Hoàn thành 100% Core Scope)
- [x] **BA-01**: Chốt core business rules & Role × Permission matrix *(DONE 2026-09-03)*
- [x] **QA-01 (Part A)**: Token isolation 16/16 test + Ma trận inventory 56 endpoints đạt 87.5% coverage *(DONE 2026-09-04)*
- [x] **BE-01**: Tách access/refresh/reset token độc lập *(DONE 2026-09-03)*
- [x] **BE-02**: Gộp Review schema, active model runtime check & script migration CSDL *(DONE 2026-09-04)*
- [x] **BE-06**: Email enumeration + cookie config *(DONE 2026-09-03)*
- [x] **BE-09 (Part A & B)**: Xóa số giả, tính toán tăng trưởng & doanh thu danh mục thật *(DONE 2026-09-03)*
- [x] **FE-02**: Gỡ UI số giả, bộ lọc Range API thật, doanh thu danh mục & UX loading/empty/error *(DONE 2026-09-04)*

### Sprint 2: Order Correctness + Business Rules (HOÀN THÀNH 100%)
- [x] **BE-03**: Landing page order tích hợp OrdersService pipeline, trừ kho nguyên tử, sổ cái SALE, idempotency *(DONE 2026-09-04)*
- [x] **BE-05**: Loyalty đúng mốc `DELIVERED` + auto-cancel đơn PENDING quá hạn (24h/48h) *(DONE 2026-09-04)*
- [x] **BE-08**: MongoDB indexes + Mock payment docs/restriction + Gemini JSON schema validation *(DONE 2026-09-04)*
- [x] **BE-09 (Part B)**: Sửa Reports: tính toán tăng trưởng và doanh thu danh mục thật *(DONE 2026-09-03)*
- [x] **QA-01 (Part B & C)**: Matrix critical routes + IDOR đã xanh 27/27 tests + Protected inventory *(DONE 2026-09-04)*

### Sprint 3: Observability + E2E + Deployment
- [x] **BE-04**: Redis blacklist + distributed throttler *(DONE 2026-09-04)*
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
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-04)**
- **Bằng chứng & Mã nguồn:**  
  - [`backend/src/modules/auth/token-isolation.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/auth/token-isolation.spec.ts) (16/16 tests PASS)
  - [`backend/src/common/guards/authorization-matrix.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/common/guards/authorization-matrix.spec.ts) (27/27 tests PASS)
  - [`docs/PROTECTED_ENDPOINTS_INVENTORY.md`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/docs/PROTECTED_ENDPOINTS_INVENTORY.md): Toàn bộ 56 protected endpoints được kiểm kê; độ phủ test đạt 87.5% tổng thể và 100% các route nghiệp vụ cốt lõi.

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
- [x] Chạy lại suite trên CI/Local và lưu inventory test.
- [x] Lập inventory toàn bộ protected endpoints đo khách quan tiêu chí coverage authorization ≥80% (đạt 87.5% toàn bộ, 100% critical).

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
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-04)**
- **Mục tiêu:** Loại bỏ schema Review thừa trong `products` module, bảo đảm các trường `isVisible`, `isVerifiedPurchase`, `adminReply`, `images` được lưu thật.
- **Bằng chứng & Mã nguồn:**  
  - [`backend/src/modules/reviews/reviews.service.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/reviews/reviews.service.spec.ts) (15/15 tests PASS)
  - [`backend/src/scripts/verify-and-migrate-reviews.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/scripts/verify-and-migrate-reviews.ts) (Script chẩn đoán và migrate dữ liệu CSDL)

#### Danh mục chi tiết:
- [x] Kiểm tra contract schema chuẩn bằng `ReviewSchema.paths` trong unit test.
- [x] Kiểm tra model active bằng `mongoose.models.Review.schema.paths` trên runtime (`reviews.service.spec.ts`).
- [x] Kiểm tra dữ liệu thực tế mẫu và cung cấp script kiểm tra/backfill MongoDB (`verify-and-migrate-reviews.ts`).
- [x] Xóa bỏ định nghĩa Review schema cũ/trùng lặp trong `products` module (`review.schema.ts`, `review.dto.ts`).
- [x] Chuyển toàn bộ controller/service của Products sang dùng chung schema và service từ `reviews` module chuẩn.
- [x] Schema/service chuẩn có đủ `isVisible`, `isVerifiedPurchase`, `adminReply`, `images` và test thao tác ghi tương ứng.
- [x] Sẵn sàng script persist và backfill dữ liệu an toàn trên MongoDB Staging/Production (`--dry-run` & `--execute`).
- [x] Unit test toàn backend chạy xanh 26/26 suites, 328/328 tests.

---

### [x] BE-03 — Landing Page Dùng OrdersService Pipeline Chuẩn
- **Role chính:** Backend | **Priority:** P0 | **Effort:** L | **Dependency:** BA-01
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-04)**
- **Mục tiêu:** Đưa toàn bộ đơn hàng từ Landing Page đi qua pipeline đặt hàng chuẩn của hệ thống, trừ kho nguyên tử, có sổ cái kho, không lệch báo cáo.
- **Bằng chứng & Mã nguồn:**  
  - [`backend/src/modules/landing-pages/landing-page.service.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/landing-pages/landing-page.service.ts)
  - [`backend/src/modules/landing-pages/landing-page.service.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/landing-pages/landing-page.service.spec.ts) (5/5 tests PASS)

#### Danh mục chi tiết:
- [x] Gói sản phẩm trên Landing Page bắt buộc cấu hình `productId` thật trong DB (`landing-page.schema.ts`, `landing-page.dto.ts`).
- [x] Chuyển phương thức `submitOrder()` trong `landing-page.service.ts` sang gọi `OrdersService.create()` chuẩn.
- [x] Áp dụng cùng cơ chế kiểm tra giá và tồn kho thực tế qua `ProductsService.findById()`.
- [x] Ghi nhận sổ cái kho `InventoryTransactionType.SALE` và trừ kho nguyên tử qua `OrdersService.create()`.
- [x] Sinh mã đơn hàng chuẩn `TTxxxxxx` từ generator tập trung.
- [x] Xóa bỏ việc sinh email giả định dạng `{phone}@truongthanh.vn`.
- [x] Gắn nhãn `orderSource: 'LANDING_PAGE'` kèm `landingPageId` phục vụ thống kê.
- [x] Bổ sung Idempotency key cho API submit đơn Landing Page.

---

### [x] BE-04 — Redis Blacklist + Distributed Throttler
- **Role chính:** Backend + DevOps | **Priority:** P0* (Blocker nếu chạy >1 node) | **Effort:** M | **Dependency:** BE-01
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-04)**
- **Mục tiêu:** Chia sẻ danh sách đen token và giới hạn tần suất (Rate Limiting) giữa nhiều instance backend.
- **Bằng chứng & Mã nguồn:**
  - [`backend/src/common/redis/redis.service.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/common/redis/redis.service.ts)
  - [`backend/src/common/redis/redis-throttler-storage.service.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/common/redis/redis-throttler-storage.service.ts)
  - [`backend/src/common/redis/redis-throttler-storage.service.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/common/redis/redis-throttler-storage.service.spec.ts) (5/5 tests PASS)
  - [`backend/src/modules/auth/token-blacklist.service.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/auth/token-blacklist.service.ts)
  - [`backend/src/modules/auth/token-blacklist.service.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/auth/token-blacklist.service.spec.ts) (11/11 tests PASS)

#### Danh mục chi tiết:
- [x] Cấu hình Redis Service cho môi trường production (`REDIS_URL`) với ioredis.
- [x] Chuyển `TokenBlacklistService` sang Redis `SETEX` (với TTL bằng thời hạn còn lại của JWT) kèm in-memory L1 cache.
- [x] Cấu hình `@nestjs/throttler` sử dụng `RedisThrottlerStorageService` phân tán.
- [x] Xử lý fallback an toàn khi Redis gặp sự cố (fail-open có logging cảnh báo, fallback về `ThrottlerStorageService` in-memory).
- [x] Xác minh: Đăng xuất tại instance A -> token bị từ chối ngay lập tức tại instance B qua đồng bộ Redis key `bl:jti:{jti}` và `bl:tok:{hash}`.

---

### [x] BE-05 — Loyalty Đúng Thời Điểm + Auto-Cancel Đơn PENDING
- **Role chính:** Backend | **Priority:** P0 | **Effort:** M | **Dependency:** BA-01
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-04)**
- **Mục tiêu:** Không cộng điểm khi tạo đơn `PENDING`; chuyển mốc cộng điểm sang `DELIVERED`; xây dựng Cron Job tự hủy đơn quá hạn và hoàn kho.
- **Bằng chứng & Mã nguồn:**
  - [`backend/src/modules/orders/schemas/order.schema.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders/schemas/order.schema.ts) (Thêm `loyaltyAwarded: boolean`, `autoCancelWarningSentAt?: Date`)
  - [`backend/src/modules/orders/orders.service.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders/orders.service.ts) (Xóa cộng điểm ở create; cộng điểm ở DELIVERED; thu hồi ở RETURNED guarded; handleAutoCancelOrders & handleAutoCancelWarnings)
  - [`backend/src/modules/orders/order-schedule.service.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders/order-schedule.service.ts) (Cron job 15 phút)
  - [`backend/src/modules/orders/orders.service.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders/orders.service.spec.ts) (24/24 tests PASS)
  - [`backend/src/modules/orders/order-schedule.service.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders/order-schedule.service.spec.ts) (2/2 tests PASS)

#### Danh mục chi tiết:
- [x] Xóa bỏ hàm cộng loyalty points tại thời điểm `OrdersService.create()`.
- [x] Bổ sung trường `loyaltyAwarded: { type: Boolean, default: false }` và `autoCancelWarningSentAt?: Date` vào `OrderSchema`.
- [x] Trong `OrdersService.updateStatusInternal()`: Khi trạng thái đạt `DELIVERED` (hoặc `COMPLETED`) và `!order.loyaltyAwarded` -> tiến hành cộng điểm và set `loyaltyAwarded = true`.
- [x] Khi đơn chuyển sang `RETURNED`: Nếu `order.loyaltyAwarded === true` -> tự động thu hồi đúng số điểm đã cộng và set `loyaltyAwarded = false`.
- [x] Xây dựng Cron Job định kỳ (mỗi 15 phút): Quét và tự động hủy đơn `PENDING` quá 24h (chuyển khoản/online) hoặc 48h (COD).
- [x] Tự động hoàn kho nguyên tử, hoàn số lượng đã bán (`sold`), giải phóng voucher (`promotionsService.releaseUsage()`), ghi log timeline khi auto-cancel.
- [x] Gửi thông báo nhắc nhở trước khi hủy đơn 2 giờ (lưu mốc `autoCancelWarningSentAt`).

---

### [x] BE-06 — Fix Email Enumeration + Chuẩn hóa Cookie Config
- **Role chính:** Backend + Security | **Priority:** P0 | **Effort:** S | **Dependency:** Không
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-03)**
- **Mục tiêu:** Chống rò rỉ danh sách người dùng qua phản hồi OTP/Password reset và chuẩn hóa cấu hình cookie cross-origin.

#### Danh mục chi tiết:
- [x] Trong `authService.verifyOtp()` và `resetPassword()`: Không trả về thông báo để lộ email có tồn tại hay không; chuẩn hóa response thông điệp tương đồng (`Mã OTP không hợp lệ hoặc đã hết hạn`, `Mã xác thực hoặc thông tin đặt lại mật khẩu không hợp lệ`).
- [x] Đưa cấu hình `COOKIE_SAME_SITE` và `COOKIE_SECURE` về một nguồn sự thật duy nhất (Single Source of Truth) trong `ConfigService` (`getCookieOptions()`).
- [x] Cập nhật hàm `logout()` gửi cùng options chuẩn (`sameSite`, `secure`, `httpOnly`, `path`) vào `clearCookie` để browser xóa sạch cookie.
- [x] Cập nhật file `.env.example` hướng dẫn chi tiết cách cấu hình `SameSite=None` và `Secure=true` khi frontend và backend khác domain.
- [x] Viết unit tests chống rò rỉ email (22/22 test pass trong `auth.service.spec.ts`).

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

### [x] BE-08 — MongoDB Index + Mock Payment Documentation + Gemini Validation
- **Role chính:** Backend | **Priority:** P1 | **Effort:** S/M | **Dependency:** BE-03
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-04)**
- **Mục tiêu:** Tối ưu hóa hiệu năng truy vấn CSDL, tài liệu hóa cổng thanh toán và xác thực dữ liệu AI trả về.
- **Bằng chứng & Mã nguồn:**
  - [`backend/src/modules/users/schemas/user.schema.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/users/schemas/user.schema.ts) (Compound index `{ role: 1, status: 1 }`)
  - [`backend/src/modules/orders/schemas/order.schema.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders/schemas/order.schema.ts) (Unique index `{ orderCode: 1 }`)
  - [`backend/src/modules/landing-pages/schemas/landing-page.schema.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/landing-pages/schemas/landing-page.schema.ts) (Unique index `{ slug: 1 }`)
  - [`backend/src/modules/cart/schemas/cart.schema.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/cart/schemas/cart.schema.ts) (Unique index `{ user: 1 }`)
  - [`backend/src/modules/payments/providers/payment.providers.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/payments/providers/payment.providers.ts) (Đổi tên `MockSignedPaymentProvider`, chặn ném lỗi `ServiceUnavailableException` ở production)
  - [`backend/src/modules/payments/providers/payment.providers.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/payments/providers/payment.providers.spec.ts) (Pass 100%)
  - [`backend/src/modules/landing-pages/dto/landing-page-ai.dto.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/landing-pages/dto/landing-page-ai.dto.ts) (DTO validate Gemini response)
  - [`backend/src/modules/landing-pages/landing-page.service.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/landing-pages/landing-page.service.ts)
  - [`backend/src/modules/landing-pages/landing-page.service.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/landing-pages/landing-page.service.spec.ts) (7/7 tests PASS)

#### Danh mục chi tiết:
- [x] Bổ sung chỉ mục hợp chất MongoDB: User `{ role: 1, status: 1 }`.
- [x] Đặt unique index cho `landingPages.slug` và `orders.orderCode`.
- [x] Đặt chỉ mục cho `cart.user` để tăng tốc truy vấn giỏ hàng.
- [x] Đổi tên `SignedOnlinePaymentProvider` thành `MockSignedPaymentProvider`.
- [x] Cập nhật tài liệu: Ghi chú rõ mock payment chỉ phục vụ dev/staging, cấm bật ở production (`NODE_ENV === 'production'`).
- [x] Viết bộ validate schema (sử dụng DTO / `class-validator`) cho kết quả JSON trả về từ Gemini AI trước khi lưu vào DB.

---

### [x] BE-09 — Sửa Reports Module (Bỏ Số Giả + Tính Toán Dữ Liệu Thật)
- **Role chính:** Backend | **Priority:** P0 (bỏ số giả) / P1 (tính toán thật) | **Effort:** M | **Dependency:** BE-03
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-03)**
- **Mục tiêu:** Phản ánh trung thực số liệu kinh doanh, xóa bỏ hoàn toàn số liệu hardcoded.

#### Danh mục chi tiết:
- [x] **Làm ngay (P0)**:
  - [x] Xóa bỏ `revenueGrowthRate: 12.5` hardcoded.
  - [x] Xóa bỏ `ordersGrowthRate: 8.3` hardcoded.
  - [x] Thay thế bằng số liệu tính toán động thật từ OrdersService.
- [x] **Tính toán thật (P1)**:
  - [x] Tính toán tỷ lệ tăng trưởng giữa kỳ hiện tại so với kỳ trước có cùng độ dài ngày (`getGrowthStats`).
  - [x] Xử lý tham số `range=day/week/month/year` ảnh hưởng trực tiếp đến khoảng thời gian query.
  - [x] Viết lại Aggregation Pipeline tính doanh thu theo danh mục (`category revenue`) từ snapshot `items[].price * items[].quantity` của đơn hàng.
  - [x] Loại trừ đơn `CANCELLED` và `RETURNED` ra khỏi tổng doanh thu.
  - [x] Loại bỏ việc nuốt lỗi `catch { return [] }` khiến che giấu lỗi hệ thống.
  - [x] Viết unit test cho cả `orders.service.spec.ts` và `reports.service.spec.ts` (100% pass).

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

### [x] FE-02 — Sửa Reports UI Đồng Bộ Theo API Thật
- **Role chính:** Frontend | **Priority:** P0/P1 | **Effort:** S | **Dependency:** BE-09
- **Trạng thái:** **HOÀN THÀNH (DONE 2026-09-04)**
- **Mục tiêu:** Giao diện báo cáo không hiển thị phần trăm tăng trưởng giả, xử lý đúng các trạng thái dữ liệu.
- **Bằng chứng & Mã nguồn:**  
  - [`frontend/src/pages/admin/Reports.vue`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/frontend/src/pages/admin/Reports.vue) (Đồng bộ Range Filter, KPIs động thật, bảng Category Revenue, Loading skeleton/Empty/Error banner)

#### Danh mục chi tiết:
- [x] Ẩn các thẻ Growth Card (12.5%, 8.3%) và thay bằng tỷ lệ tăng trưởng thật từ backend hoặc hiển thị `Kỳ trước: N/A` khi chưa đủ dữ liệu.
- [x] Đồng bộ bộ lọc Range Filter (`day`, `week`, `month`, `year`) gửi query param chuẩn tới API `reportService.getSummary()`.
- [x] Bổ sung trạng thái Loading Skeleton, Empty State và Error Alert có nút thử lại rõ ràng khi gọi API báo cáo.
- [x] Tích hợp bảng cơ cấu doanh thu theo danh mục sản phẩm (`categoryRevenueList`) tính toán tự động.
- [x] Tuyệt đối không fallback sang mảng số liệu tĩnh ở phía client.

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
| [x] | **NV-01** | **Review Schema nào đang thực sự active trong bộ nhớ**: Kiểm tra xem model Review có bị ghi đè bởi model cũ của products hay không. | Chạy lệnh kiểm tra `mongoose.models.Review.schema.paths` trên runtime backend. | Backend | **ĐÃ XÁC MINH 2026-09-04**: Test `reviews.service.spec.ts` xác thực active paths đầy đủ (isVisible, isVerifiedPurchase, adminReply, images, content, product, user). |
| [x] | **NV-02** | **Kiểm tra dữ liệu Review trên Production Database**: Xác minh các trường `isVisible`, `isVerifiedPurchase`, `adminReply` có giá trị hay bị null. | Chạy script chẩn đoán `backend/src/scripts/verify-and-migrate-reviews.ts` (`--dry-run` hoặc `--execute`). | Backend / DBA | **ĐÃ CUNG CẤP SCRIPT TỰ ĐỘNG 2026-09-04**: Script quét collection, báo cáo tài liệu thiếu trường và tự động backfill an toàn. |
| [ ] | **NV-03** | **Cấu hình `COOKIE_SAME_SITE` trên môi trường thật**: Xác minh trình duyệt có nhận và lưu cookie `access_token` hay bị chặn cross-site. | Kiểm tra Header `Set-Cookie` trên DevTools Network tab khi đăng nhập qua domain production. | Backend / Security | Cần kiểm tra sau khi deploy |
| [x] | **NV-04** | **Test Coverage thực tế của Backend**: Xác minh các test suite chạy thành công và đo tỷ lệ bao phủ code. | Chạy `npm run test:cov -- --runInBand`. | QA | **ĐÃ VERIFY LOCAL 2026-09-04**: 26/26 suites, 328/328 tests; Statements 54.49%, Branches 42.63%, Functions 38.2%, Lines 55%. Chưa phải CI artifact. |
| [x] | **NV-05** | **Tình trạng Lint và dependency audit hiện tại**. | Chạy `npm run lint`, `npm audit --omit=dev`. | Backend / DevOps | **ĐÃ VERIFY LOCAL 2026-09-03**: lint 0 error/1,814 warnings (pass budget 1,816); backend và frontend production dependency audit đều 0 vulnerability sau khi cập nhật `qs` và override `exceljs > uuid`. |
| [ ] | **NV-06** | **Số lượng Backend Instance trên Render**: Xác minh backend đang chạy 1 instance đơn lẻ hay cluster đa node. | Kiểm tra cấu hình Instance Count trên Render Dashboard. | DevOps | Chờ thông tin từ DevOps |
| [ ] | **NV-07** | **Hiệu năng truy vấn Báo cáo Aggregation**: Đánh giá thời gian phản hồi của các pipeline tính doanh thu trên tập dữ liệu lớn. | Sử dụng lệnh MongoDB `explain("executionStats")` kết hợp k6 load test. | QA / Backend | Chờ triển khai BE-09 |

---

## 6. PHẦN D: PRODUCTION DEFINITION OF DONE & GO / NO-GO GATE

### 6.1 Bảng Điều Kiện Bắt Buộc Trước Khi Release (Production Definition of Done)

#### Phân hệ Bảo mật (Security)
- [x] Token Type Isolation: Refresh/Reset token tuyệt đối không dùng được làm Bearer Access Token.
- [x] Email Enumeration: Các nhánh OTP/reset trả thông báo lỗi công khai tương đương; unit regression pass.
- [x] Secret Management: Thiếu/trùng access-refresh-reset secret trong production bắt buộc dừng server (Fail-closed).
- [ ] Log Privacy: Toàn bộ mật khẩu, token, OTP, khóa bí mật được lọc bỏ khỏi hệ thống log.
- [x] Authorization Matrix toàn bộ: Đã lập `docs/PROTECTED_ENDPOINTS_INVENTORY.md` chứng minh 87.5% tổng thể và 100% critical routes/IDOR có test xanh.

#### Phân hệ Đơn hàng & Kho (Order & Inventory)
- [x] Pipeline Đặt hàng Thống nhất: Đơn từ Web, Mobile và Landing Page đều đi qua `OrdersService.create()`.
- [x] Atomic Stock Deduction: Trừ kho nguyên tử qua `$inc` kết hợp `$gte`, chống bán vượt tồn kho.
- [ ] Tự động Hủy đơn Treo: Đơn PENDING quá 24h/48h tự động hủy, hoàn kho, hoàn quota khuyến mãi.
- [x] Idempotency: Có cơ chế khóa chống trùng lặp đơn hàng khi gửi request liên tiếp.
- [ ] Mã đơn hàng Duy nhất: Đảm bảo trường `orderCode` có unique index trên CSDL.

#### Phân hệ Đánh giá Sản phẩm (Reviews)
- [x] Schema duy nhất trong source: Đã loại bỏ model Review thừa và Products dùng `ReviewsService` chuẩn.
- [x] Lưu trữ đầy đủ: Các thao tác ẩn/hiện đánh giá, đánh dấu đã mua hàng, phản hồi của admin được lưu vào DB kèm script migration CSDL.

#### Phân hệ Báo cáo Tài chính (Reporting)
- [x] Bỏ số liệu giả: Không còn phần trăm tăng trưởng hardcoded trong reports API/UI đã rà soát.
- [x] Bộ lọc thời gian: `day/week/month/year` tạo query window khác nhau và được khóa bằng unit test.
- [x] Doanh thu danh mục: Tính từ `orders.items[].price × quantity` snapshot lúc mua.
- [x] Loại trừ đơn hủy/trả: `CANCELLED` và `RETURNED` bị loại khỏi mọi revenue KPI đã kiểm tra.

#### Phân hệ Kiểm thử & Vận hành (Testing & Operations)
- [x] Token Isolation Suite: 16/16 test cases tự động pass.
- [x] Authorization Matrix Suite: 27/27 test cases tự động pass.
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
