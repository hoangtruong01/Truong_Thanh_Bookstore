# TRƯỜNG THÀNH BOOKSTORE — MASTER AUDIT, RISK REGISTER & IMPLEMENTATION PLAN

> **Bản hợp nhất:** 03/09/2026  
> **Nguồn:** `BOOKSTORE-AUDIT-2026-09-02.md` + `taskgpt_truongthanh.md`  
> **Repo được audit:** `hoangtruong01/Truong_Thanh_Bookstore`, nhánh `main` tại thời điểm 02/09/2026  
> **Phạm vi:** Backend NestJS, Frontend Vue 3, Mobile Flutter, MongoDB, CI/CD, Security, QA, Business Logic, Product/Operations  
> **Trạng thái tổng hợp:** **MVP — chưa Production Ready**  
> **Điểm tổng hợp:** **6.0/10**


## Mục lục nhanh

1. Mục đích & giới hạn bằng chứng
2. Tổng quan & kiến trúc
3. Scorecard
4. Điểm mạnh đã kiểm chứng
5. Unified Risk Register
6. Audit tính năng
7. Business flow
8. Không over-engineer
9. Master Task Board
10. Task Details + Extended Backlog
11. Phân task theo role
12. Dependency order
13. Sprint plan
14. Production Definition of Done
15. NEED VERIFY
16. Go / No-Go
17. Kế hoạch 3 tuần
18. Kết luận CTO
19. Đối chiếu vòng audit cũ
20–21. Decision Summary & Kết luận cuối

---

# 1. Mục đích và nguyên tắc của tài liệu

Tài liệu này là **single source of truth** sau khi hợp nhất hai vòng tài liệu: một bản audit đọc code sâu và một bản đã chuyển kết quả audit thành kế hoạch task. Mục tiêu không phải nối hai file theo kiểu cơ học, mà là:

1. Giữ lại các phát hiện có bằng chứng cụ thể từ code.
2. Loại bỏ phần trùng lặp giữa hai tài liệu.
3. Chuẩn hóa mức độ rủi ro, Priority, Dependency, Effort và Acceptance Criteria.
4. Tách rõ **bug/correctness**, **security**, **business rule**, **maintainability**, **feature gap** và **nice-to-have**.
5. Chỉ ra mục nào là **Production Blocker**, mục nào có thể **defer có điều kiện**.
6. Tạo thứ tự triển khai để Backend/Frontend/Mobile/QA/DevOps không sửa chồng hoặc làm lại.
7. Giữ riêng danh sách **NEED VERIFY** vì audit code ban đầu không chạy được toàn bộ test/build/lint/audit trong môi trường thực tế.

## 1.1 Giới hạn bằng chứng

Bản audit code gốc đã đọc toàn repo nhưng môi trường audit **không cài Node/npm và bị chặn registry**, nên không chạy được `npm test`, `npm run lint`, `npm audit`, `npm run build`. Vì vậy:

- Các kết luận về code path, schema, flow và cấu hình dựa trên **đọc code trực tiếp**.
- Các kết luận cần runtime/production DB/CI thật được giữ trong mục **NEED VERIFY**.
- Không được xem một mục `NEED VERIFY` là “đã pass” chỉ vì code nhìn hợp lý.

---

# 2. Tổng quan dự án và kiến trúc

## 2.1 Bài toán

Trường Thành Bookstore là hệ thống TMĐT bán sách và văn phòng phẩm, gồm:

- Web khách hàng.
- Admin CMS.
- Mobile Flutter.
- Backend dùng chung.
- Landing page bán hàng riêng.

Luồng lõi:

`Catalog → Cart → Checkout → Payment → Order → Inventory → Promotion → Review → Reporting`

## 2.2 Tech stack xác nhận từ code

### Backend

- NestJS 11
- Mongoose 9 + MongoDB
- JWT + Passport
- `class-validator` / `class-transformer`
- Socket.IO
- Helmet
- `@nestjs/throttler`
- Swagger
- Cloudinary
- Nodemailer
- PDFKit / ExcelJS / QRCode

### Frontend

- Vue 3
- Vite
- Pinia
- Axios

### Mobile

- Flutter
- Provider pattern

### Infrastructure

- Docker Compose
- MongoDB replica set single-node
- GitHub Actions
- Render Backend
- Vercel Frontend

## 2.3 Architecture hiện tại

```text
Web (Vercel) ──┐
Mobile Flutter ┼──► NestJS API (Render, /api)
Admin CMS ─────┘        │
                        ├─ Helmet / CORS / cookie parser
                        ├─ Correlation ID
                        ├─ SecuritySanitizerMiddleware
                        ├─ ThrottlerGuard
                        ├─ ValidationPipe
                        └─ HttpExceptionFilter / TransformInterceptor
                              │
                              ▼
                     Modular Monolith NestJS
        auth · users · products · categories · cart · orders
        payments · inventory · reviews · promotions · reports
        notifications · banners · landing-pages · email · seeds
                              │
                              ▼
                           MongoDB
```

### Kết luận kiến trúc

Kiến trúc tổng thể **không đi sai hướng**. Modular monolith + REST + MongoDB phù hợp quy mô một cửa hàng và ba client. Điểm trừ lớn nhất không phải framework, mà là **vi phạm ranh giới module** ở landing page và **thiếu integration test tại các điểm giao nhau**.

---

# 3. Scorecard hợp nhất

| Hạng mục | Điểm | Nhận định ngắn |
|---|---:|---|
| Architecture | 7.5/10 | Modular monolith đúng quy mô; landing-page phá ranh giới Orders |
| Code Quality | 6.5/10 | Cấu trúc khá sạch; lint debt, `any`, page lớn, duplicate Review schema |
| Backend | 6.5/10 | Checkout/voucher mạnh; auth token, reports, payment stub còn rủi ro |
| Frontend | 5.5/10 | Lazy route/i18n/SEO cơ bản tốt; component reuse và test còn mỏng |
| Database | 6.5/10 | Transaction, atomic ops, index chính tốt; duplicate model và index cục bộ thiếu |
| API | 7.0/10 | Swagger/validation/response format ổn; một số contract chưa đúng hành vi thật |
| Security | 5.5/10 | CSRF/RBAC/env validation tốt; JWT type confusion là auth bypass trực tiếp |
| Testing | 5.5/10 | Backend service test tốt; thiếu controller matrix, browser E2E, mobile API test |
| Performance | 5.5/10 | Tránh N+1 ở checkout; chưa có load baseline/cache/image optimization |
| Maintainability | 5.5/10 | Module dễ đọc; Vue monolith và warning budget gây nợ kỹ thuật |
| Product / Business Logic | 5.5/10 | State machine/voucher tốt; loyalty, landing orders, reports sai logic |
| **Tổng hợp** | **6.0/10** | **MVP — chưa Production Ready** |

## 3.1 Cách hiểu đúng mức 6.0/10

- **Hạ tầng/quy trình:** gần Production hơn phần còn lại.
- **Auth security:** chưa đạt vì có lỗ hổng token type confusion.
- **Business correctness:** checkout chính tốt nhưng có đường vòng landing page và report chưa đáng tin.
- **Không nên tăng điểm bằng cách thêm feature mới** trước khi P0 correctness/security hoàn tất.

---

# 4. Những điểm làm tốt đã kiểm chứng

Các phần dưới đây nên **giữ nguyên hoặc chỉ refactor có regression test**, không được “dọn cho đẹp” rồi làm mất cơ chế an toàn:

1. **Checkout server-side pricing:** không tin giá client gửi lên.
2. **Atomic stock deduction:** dùng điều kiện tồn kho trong `findOneAndUpdate` để chống oversell ở pipeline chính.
3. **Mongo transaction + compensating fallback:** hữu ích khi môi trường không hỗ trợ transaction.
4. **Voucher race-condition protection:** usage limit/per-user limit có atomic update và rollback.
5. **Idempotency chống double-submit** ở checkout chính.
6. **Refresh token reuse detection:** reuse → tăng `tokenVersion`, revoke session.
7. **RBAC đổi role tương đối chặt:** chặn tự sửa role, giới hạn quyền ADMIN/SUPER_ADMIN.
8. **Env validation fail-closed:** production bắt buộc secret/cookie/HTTPS hợp lệ.
9. **CSRF protection có nhiều lớp:** `X-Requested-With` + preflight + CORS allowlist.
10. **Cart ownership sạch:** cart dùng `req.user._id`, không nhận `userId` tùy ý.
11. **Markdown rendering đã escape trước khi tạo HTML** ở luồng được audit.
12. **Payment callback logic có các lớp kiểm tra amount/idempotency/signature** dù provider VNPay/MoMo hiện chưa phải protocol thật.
13. **CI dựng Mongo replica set thật** cho test thay vì mock DB.
14. **Seed password không hardcode** và có kiểm tra độ dài.
15. **0 `TODO`/`FIXME`/`HACK` ở source được audit, 0 `console.log` frontend** tại thời điểm audit.

> **Quan trọng:** không bỏ nhánh compensating fallback chỉ vì code dài. Đây là lớp bảo vệ dữ liệu khi chạy Mongo không có transaction.

---

# 5. Unified Risk Register — vấn đề theo mức độ

## 5.1 CRITICAL

| ID | Vấn đề | Evidence chính | Ảnh hưởng | Hướng xử lý | Task |
|---|---|---|---|---|---|
| CRITICAL-01 | JWT token type confusion | `jwt.strategy.ts`, `auth.service.ts` | Refresh/reset token có thể thành Bearer access token | Thêm `type:'access'`, strategy chỉ nhận access, tách secret | QA-01 + BE-01 |
| CRITICAL-02 | Hai `Review` schema trùng model/collection | `products/schemas/review.schema.ts` và `reviews/schemas/review.schema.ts` | `isVisible`, verified, admin reply, images có nguy cơ không persist | Một domain một schema + backfill nếu cần | BE-02 |
| CRITICAL-03 | Landing page tạo Order ngoài OrdersService | `landing-page.service.ts` | Không check/trừ stock, không ledger, không idempotency/transaction, report lệch | Mọi order đi qua pipeline chuẩn | BA-01 + BE-03 |

### CRITICAL-01 — JWT token type confusion

**Điểm cốt lõi:** refresh token và reset token được ký cùng secret với access token, trong khi `JwtStrategy.validate()` không kiểm tra đúng loại token. Refresh flow có kiểm `type`, nhưng protected API không làm kiểm tra chiều ngược lại.

**Production blocker:** **Có.**

### CRITICAL-02 — Duplicate Review schema

Hai schema cùng model name `Review`, cùng collection `reviews` nhưng field khác nhau. Mongoose cache model theo tên trên connection, nên hành vi runtime phải verify; dù model nào thắng thì kiến trúc hiện tại vẫn là bug.

**Production blocker:** **Có**, ít nhất phải verify và sửa persistence trước khi cho review moderation là tính năng thật.

### CRITICAL-03 — Landing page bypass order pipeline

Landing page tạo `Order` trực tiếp, item có thể không liên kết Product, orderCode riêng, email giả và không dùng inventory pipeline chuẩn.

**Production blocker:** **Có nếu landing page được mở nhận đơn thật.** Nếu chưa sửa thì phải tắt chức năng đặt hàng landing page.

---

## 5.2 HIGH

| ID | Vấn đề | Ảnh hưởng | Quyết định ưu tiên |
|---|---|---|---|
| HIGH-01 | Blacklist + rate-limit in-memory | Logout/rate limit sai khi multi-instance/restart | P0* nếu scale >1; có thể defer có điều kiện ở 1 instance |
| HIGH-02 | Loyalty cộng điểm ngay khi `PENDING` | Khách nhận điểm dù chưa giao hàng | P0 business correctness |
| HIGH-03 | VNPay/MoMo là stub | UI/Swagger có vẻ xong nhưng protocol thực tế không chạy | Block nếu bật online payment; không block nếu COD-only và mock bị vô hiệu |
| HIGH-04 | Dashboard growth hardcode | Chủ shop ra quyết định trên số giả | P0 xoá ngay; P1 tính thật |
| HIGH-05 | Lint debt + `any` ở luồng quan trọng | Giảm type safety/maintainability | P2, giảm dần; ưu tiên Orders/Payments |
| HIGH-06 | Vue page quá lớn, component reuse thấp | Khó test, sửa UI phải lặp nhiều nơi | P2 sau khi core E2E có baseline |
| HIGH-07 | Không structured logging/APM | Production issue khó trace | P1 trước mở bán thật |

### Quy tắc cho payment

- Nếu mục tiêu gần nhất là **COD-only**, VNPay/MoMo thật có thể hoãn.
- Production **không được bật** phương thức online nếu provider vẫn là mock/stub.
- Phải đổi tên/document rõ để tránh hiểu nhầm “đã tích hợp”.

---

## 5.3 MEDIUM

| ID | Vấn đề | Fix đề xuất | Mapping |
|---|---|---|---|
| MED-01 | `range=day/week/month/year` không ảnh hưởng report | Truyền range vào query hoặc ẩn filter | BE-09 + FE-02 |
| MED-02 | Category revenue tính `sold × giá hiện tại` | Aggregate từ `orders.items[].price × quantity` | BE-09 |
| MED-03 | Guest checkout có thể bị abuse | Pending limit/SĐT, CAPTCHA/Turnstile khi cần, auto-cancel | BE-05 + Extended Backlog |
| MED-04 | Thiếu index cục bộ | users role/status, landing slug, cart user, unique orderCode | BE-08 |
| MED-05 | `COOKIE_SAME_SITE` có hai nguồn default | Một nguồn từ env validation | BE-06 |
| MED-06 | Email enumeration ở OTP/reset | Response tương đương cho user tồn tại/không tồn tại | BE-06 |
| MED-07 | Regex XSS blacklist cho HTML | Dùng allowlist sanitizer cho trường HTML | Extended Backlog |
| MED-08 | Không controller authorization matrix / browser E2E | Integration + Playwright | QA-01 + QA-02 |

---

## 5.4 LOW / HARDENING

| ID | Vấn đề | Xử lý |
|---|---|---|
| LOW-01 | Chưa unique `orderCode` | Thêm unique index cùng BE-03/BE-08 |
| LOW-02 | Gemini JSON parse nhưng chưa validate schema | DTO/schema validation trước save |
| LOW-03 | `GEMINI_API_KEY` dễ làm người đọc tưởng ChatWidget dùng AI | Comment/rename rõ phạm vi |
| LOW-04 | Hai workflow backend CI chồng nhau | Xoá `backend-ci.yml`, giữ pipeline đầy đủ hơn |

---

# 6. Audit tính năng hợp nhất

## 6.1 Đã có và tương đối ổn

- Catalog: search/filter/pagination/wishlist/category tree.
- Cart.
- Guest + authenticated checkout ở pipeline chính.
- Order state machine có ràng buộc chuyển trạng thái.
- Hoàn kho khi huỷ/trả ở luồng chuẩn.
- Voucher percent/fixed, min order, max discount, usage/per-user limit.
- User/role/permission.
- Address book.
- Auth login/register/refresh rotation/OTP reset/change password.
- Inventory ledger.
- Realtime notification WebSocket có auth.
- Banner.
- Invoice PDF / Excel export.
- SEO cơ bản + sitemap + structured data.
- i18n vi/en.

## 6.2 Đã có nhưng chưa hoàn thiện

| Tính năng | Thiếu / sai hiện tại |
|---|---|
| Thanh toán online | VNPay/MoMo chưa phải integration thật |
| Review | Duplicate schema có thể làm moderation/verified/admin reply không persist |
| Reports | Growth hardcode, range chết, category revenue sai |
| Landing page | Order bypass stock/report; Gemini output chưa schema-validated |
| Loyalty | Cộng sai thời điểm; chưa có luồng dùng điểm giảm giá |
| Mobile | Có nhiều screen nhưng chưa API integration test thật; release readiness còn thiếu |
| Notification | Realtime web có, mobile push FCM chưa có |

## 6.3 Thiếu và nên bổ sung theo giá trị nghiệp vụ

1. Token isolation — bắt buộc, không phải feature mới.
2. Job tự huỷ đơn PENDING quá hạn + hoàn kho.
3. Cơ chế dùng loyalty point nếu BA xác định loyalty là feature MVP.
4. Mã vận đơn / tracking / tích hợp GHN-GHTK hoặc provider tương đương nếu scope yêu cầu.
5. Structured logging + Sentry.
6. Redis khi scale >1 instance.
7. Push notification mobile nếu app chuẩn bị public release.

## 6.4 Nice-to-have

- Quy trình đổi/trả hàng chi tiết hơn.
- So sánh sản phẩm.
- Gợi ý sản phẩm liên quan.
- Affiliate/CTV.
- Review có ảnh hoàn thiện UX.
- Live chat thật thay FAQ bot.
- SSR/prerender SEO.
- WebP/AVIF và image pipeline.

---

# 7. Business flow — đánh giá correctness

## 7.1 Phần đúng hướng

Luồng checkout chính có maturity tốt: giá server-side, atomic stock, idempotency, transaction/fallback và state machine. Đây là phần nên dùng làm **pipeline chuẩn duy nhất**.

## 7.2 Bốn chỗ sai logic cần sửa trước khi tin dữ liệu

1. **Landing page là một đường bán hàng song song** nhưng không dùng cùng invariant của Orders/Inventory.
2. **Dashboard có số giả** và filter không hoạt động, khiến reporting không đủ tin cậy để ra quyết định.
3. **Loyalty gắn với PENDING** thay vì giao hàng thành công.
4. **Guest order có thể giữ kho lâu** nếu không có cleanup/limit.

## 7.3 Nguyên tắc kiến trúc rút ra

- `OrdersService` phải là **single write path** cho order thương mại.
- Reporting chỉ tính từ **immutable/snapshot transaction data**, không lấy giá hiện tại để suy ngược lịch sử.
- Mọi metric hiển thị phải có test với dataset expected biết trước.
- Security test phải test **token semantics**, không chỉ guard/permission.

---

# 8. Những việc KHÔNG nên làm hiện tại

Không over-engineer để “nâng cấp công nghệ” trong khi correctness chưa xong:

- Không tách microservices.
- Không đổi MongoDB sang PostgreSQL chỉ vì audit.
- Không chuyển GraphQL.
- Không Kubernetes.
- Không Elasticsearch ở giai đoạn này.
- Không refactor lớn `createAtomic` nếu chưa có regression test bao phủ.

Ưu tiên sửa **invariant, security boundary, business correctness và test** trước.

---

# 9. MASTER TASK BOARD

## 9.1 Tổng hợp task

| Task ID | Task | Role chính | Priority | Effort | Dependency | Status |
|---|---|---|---|---|---|:---:|
| BA-01 | Chốt business rules loyalty / pending / landing / payment | BA | P0 | S | - | **DONE** |
| QA-01 | Token isolation + authorization matrix | QA + Security | P0/P1 | L | BE-01 để xanh test | **DONE** |
| BE-01 | Tách access/refresh/reset token | Backend + Security | P0 | M | QA-01 viết test trước | **DONE** |
| BE-02 | Gộp Review schema | Backend | P0 | M/L | - | **DONE** |
| BE-03 | Landing page vào OrdersService pipeline | Backend | P0 | L | BA-01 |
| BE-04 | Redis blacklist + distributed throttler | Backend + DevOps | P0* | M | BE-01 |
| BE-05 | Loyalty đúng thời điểm + auto-cancel pending | Backend | P0 | M | BA-01 |
| BE-06 | Fix email enumeration + cookie config | Backend + Security | P0 | S | - | **DONE** |
| BE-07 | Structured logging + Sentry | Backend + DevOps | P1 | M | - |
| BE-08 | Index + payment mock docs + Gemini validation | Backend | P1 | S/M | BE-03 |
| BE-09 | Sửa Reports: bỏ số giả + tính thật | Backend | P0/P1 | M | BE-03 cho category revenue đầy đủ | **DONE** |
| FE-01 | Refactor component dùng chung | Frontend | P2 | L | QA-02 nên có trước |
| FE-02 | Sửa Reports UI theo API thật | Frontend | P0/P1 | S | BE-09 |
| QA-02 | Playwright E2E | QA | P2 | M | BE-01, BE-03, BE-05 |
| QA-03 | Load test + report accuracy regression | QA | P2 | M | BE-09 |
| DEVOPS-01 | Dọn CI + Mongo auth + smoke test + gitleaks | DevOps | P2 | M | - |
| MOBILE-01 | Release keystore + push notification | Mobile | P3 | L | Backend notification API |
| PM-01 | Quản lý dependency, staging, UAT, production gate | PM | P0 | Continuous | tất cả |

> `BE-04` có thể hoãn nếu production chỉ chạy đúng **1 backend instance**, nhưng phải giảm access token TTL và hiểu rõ rủi ro khi process restart.

---

# 10. TASK DETAILS

## BA-01 — Chốt business rules
> **Trạng thái:** HOÀN THÀNH (DONE) — Ngày 2026-09-03  
> **Chi tiết:** Đã chuẩn hóa toàn bộ tài liệu `docs/BUSINESS_RULES.md` bao gồm: mốc cộng điểm `DELIVERED` (kèm flag `loyaltyAwarded`), quy đổi điểm 1:1000 và tiêu 1pt=100đ (cap 20%), timeout auto-cancel PENDING 24h/48h (báo trước 2h), landing page bắt buộc binding product thật, cổng thanh toán production tắt mock, và ma trận Role × Permission chi tiết.

**Role:** BA  
**Priority:** P0  
**Effort:** S

### Cần làm

- [x] Chốt mốc cộng loyalty: `DELIVERED` (kèm flag `loyaltyAwarded: true`, hoàn điểm khi `RETURNED`).
- [x] Chốt tỷ lệ quy đổi và khả năng dùng điểm giảm giá (tích 1:1000đ, tiêu 1pt=100đ, tối đa 20% subtotal).
- [x] Chốt thời gian auto-cancel đơn PENDING: 24h (online/chuyển khoản) và 48h (COD).
- [x] Chốt có gửi notification trước auto-cancel: Có (trước 2h qua in-app + email).
- [x] Chốt landing page bán Product tồn kho hay package độc lập: Bắt buộc Product ID thật, gọi `OrdersService.create()`, ghi sổ kho `SALE`.
- [x] Chốt cổng thanh toán nào cần production: COD, Chuyển khoản VietQR, VNPAY, MoMo (tắt mock ở production).
- [x] Cập nhật `docs/BUSINESS_RULES.md`.
- [x] Tạo ma trận role × permission cho QA.

### Acceptance Criteria

- [x] BE-03 và BE-05 có thể triển khai mà không phải hỏi lại nghiệp vụ.
- [x] QA-01 có permission matrix để test.

---

## QA-01 — Token isolation + authorization matrix
> **Trạng thái:** HOÀN THÀNH (DONE) — Ngày 2026-09-03  
> **Chi tiết:** Đã xây dựng 2 test suite tự động chuyên biệt:  
> - `src/modules/auth/token-isolation.spec.ts` (10/10 test cases PASS)  
> - `src/common/guards/authorization-matrix.spec.ts` (25/25 test cases PASS)  
> Toàn bộ 24 test suites backend chạy XANH (294/294 tests passed).

**Role:** QA + Security  
**Priority:** P0/P1  
**Effort:** L

### Phần A — làm trước BE-01

- [x] Access token dùng đúng endpoint → pass (`validate()` trả về user payload hợp lệ).
- [x] Refresh token dùng làm Bearer → 401 Unauthorized (`ERR_INVALID_TOKEN`).
- [x] Reset token dùng làm Bearer → 401 Unauthorized (`ERR_INVALID_TOKEN`).
- [x] Access token dùng ở refresh flow sai cách → fail 401 Unauthorized (`ERR_INVALID_TOKEN`).
- [x] Token hết hạn → 401 Unauthorized (`ERR_REFRESH_TOKEN_EXPIRED` / `ERR_TOKEN_EXPIRED`).
- [x] Token sai secret → 401 Unauthorized (`ERR_INVALID_TOKEN`).
- [x] TokenVersion cũ → 401 Unauthorized (`ERR_TOKEN_REVOKED`).
- [x] Blacklisted JTI → 401 Unauthorized (`ERR_TOKEN_REVOKED`).
- [x] Refresh reuse → revoke sessions, tăng tokenVersion, xóa hash, trả về 401 (`ERR_REFRESH_TOKEN_REUSE`).

### Phần B — Authorization matrix

Test các module:

- Orders (SUPER_ADMIN, ADMIN, STAFF có permission, STAFF không permission, CUSTOMER, Anonymous)
- Users (Admin, Staff, Customer, Anonymous)
- Payments (Admin, Staff có permission, Staff không permission, Customer)
- Reports (Admin, Staff có `VIEW_REPORTS`, Staff không quyền, Customer)

Với các role:

- SUPER_ADMIN: Toàn quyền truy cập mọi tài nguyên.
- ADMIN: Toàn quyền quản trị và phân quyền.
- STAFF có permission: Cho phép thực hiện các hành động trong phạm vi quyền được cấp.
- STAFF không permission: Bị chặn 403 Forbidden.
- CUSTOMER: Chỉ xem và thao tác trên tài nguyên của chính mình; bị cấm vào route quản trị (403 Forbidden).
- Anonymous: Bị chặn 401 Unauthorized.

### Security regression

- [x] IDOR customer A không được xem order customer B (403 Forbidden).
- [x] IDOR customer A không được hủy order customer B (403 Forbidden).
- [x] IDOR payment/order invoice bị chặn.
- [x] Guest order token sai / thiếu → 403 Forbidden.

### Acceptance Criteria

- [x] Token isolation suite xanh (100% pass).
- [x] ≥80% protected endpoint quan trọng có authorization test.
- [x] CI test suite pass toàn diện (294/294 tests).

---

## BE-01 — Tách access / refresh / reset token

**Role:** Backend + Security  
**Priority:** P0  
**Effort:** M

### Cần làm

- [x] Access payload có `type: 'access'`.
- [x] `JwtStrategy.validate()` bắt buộc `type === 'access'`.
- [x] Thêm `JWT_REFRESH_SECRET`.
- [x] Thêm `JWT_RESET_SECRET`.
- [x] Production thiếu secret hoặc trùng nhau → fail startup.
- [x] Refresh flow dùng refresh secret.
- [x] Reset flow dùng reset secret.
- [x] Xử lý migration token cũ / bắt user login lại.

### Acceptance Criteria

- [x] Refresh token làm Bearer → 401.
- [x] Reset token làm Bearer → 401.
- [x] Access token hoạt động bình thường.
- [x] Refresh password/reset password flow vẫn pass.
- [x] Test QA-01 phần token isolation xanh (13/13 tests).

---

## BE-02 — Gộp Review schema

**Role:** Backend  
**Priority:** P0  
**Effort:** M, có thể lên L nếu cần backfill production  
**Trạng thái:** **DONE (2026-09-03)**

### Cần làm

- [x] Verify schema hiện tại bằng `mongoose.models.Review.schema.paths`.
- [x] Inspect dữ liệu production mẫu.
- [x] Xóa schema Review cũ trong products module (`review.schema.ts`, `review.dto.ts`).
- [x] Products dùng schema/service chuẩn từ reviews (`ReviewsModule`, `ReviewsService`).
- [x] Bảo đảm đầy đủ `isVisible`, `isVerifiedPurchase`, `adminReply`, `images`.
- [x] Rà soát model duplicate khác.

### Acceptance Criteria

- [x] Hide review persist thật.
- [x] Verified purchase persist thật.
- [x] Admin reply persist thật.
- [x] Images persist thật.
- [x] Integration / Unit test pass (302/302 tests).

---

## BE-03 — Landing page dùng OrdersService pipeline

**Role:** Backend  
**Priority:** P0  
**Effort:** L

### Cần làm

- [ ] Package landing page tham chiếu Product ID thật.
- [ ] `submitOrder()` gọi `OrdersService.create/createAtomic()`.
- [ ] Dùng cùng validation price/stock.
- [ ] Dùng cùng transaction.
- [ ] Dùng cùng inventory ledger.
- [ ] Dùng cùng order code generator.
- [ ] Bỏ fake email `{phone}@truongthanh.vn`.
- [ ] Thêm throttle riêng.
- [ ] Có `orderSource: LANDING_PAGE` nếu cần analytics.
- [ ] Idempotency cho submit-order.

### Acceptance Criteria

- [ ] Landing order trừ kho đúng.
- [ ] Inventory ledger có entry.
- [ ] Hết hàng → không tạo order.
- [ ] Best-selling/report nhìn thấy order landing page.
- [ ] Duplicate request không tạo 2 đơn.

---

## BE-04 — Redis blacklist + throttler

**Role:** Backend + DevOps  
**Priority:** P0*  
**Effort:** M

> Có thể defer nếu production chỉ chạy đúng 1 backend instance và team chấp nhận rủi ro restart làm mất blacklist.

### Cần làm

- [ ] Redis service production.
- [ ] Token blacklist → Redis `SETEX`.
- [ ] Throttler → Redis storage.
- [ ] Logout tăng `tokenVersion`.
- [ ] Có chiến lược khi Redis down.
- [ ] `REDIS_URL` validation.

### Acceptance Criteria

- [ ] Logout instance A → token bị reject instance B.
- [ ] Restart backend → blacklist vẫn còn.
- [ ] Rate limit đếm chung multi-instance.

---

## BE-05 — Loyalty + auto-cancel pending

**Role:** Backend  
**Priority:** P0  
**Effort:** M

### Cần làm

- [ ] Chuyển cộng điểm sang status BA đã chốt.
- [ ] Thêm `loyaltyAwarded`.
- [ ] Không cộng lặp.
- [ ] RETURNED trừ điểm nếu đã cộng.
- [ ] Cron job auto-cancel PENDING quá hạn.
- [ ] Hoàn kho đúng khi auto-cancel.
- [ ] Notification + timeline note.

### Acceptance Criteria

- [ ] Tạo order chưa được cộng điểm.
- [ ] Giao thành công → cộng đúng.
- [ ] COMPLETED không cộng lần 2.
- [ ] RETURNED hoàn điểm đúng.
- [ ] Pending quá hạn tự hủy và hoàn kho.

---

## BE-06 — Email enumeration + cookie config

**Role:** Backend + Security  
**Priority:** P0  
**Effort:** S  
**Trạng thái:** **DONE (2026-09-03)**

### Cần làm

- [x] `verifyOtp` không tiết lộ email tồn tại.
- [x] `resetPassword` không tiết lộ email tồn tại.
- [x] Một nguồn sự thật cho `COOKIE_SAME_SITE` và `COOKIE_SECURE` (`getCookieOptions()`).
- [x] `.env.example` giải thích cross-site cookie.

### Acceptance Criteria

- [x] Email tồn tại + OTP sai và email không tồn tại trả response tương đương.
- [x] Production cookie config đúng env validation.

---

## BE-07 — Structured logging + Sentry

**Role:** Backend + DevOps  
**Priority:** P1  
**Effort:** M

### Cần làm

- [ ] `nestjs-pino` hoặc logging JSON tương đương.
- [ ] Correlation ID xuyên request.
- [ ] Redact password/token/OTP.
- [ ] Sentry backend.
- [ ] Sentry frontend.
- [ ] Security event logging.

### Acceptance Criteria

- [ ] Log có correlationId, method, path, status, duration.
- [ ] Search correlation ID ra được full request lifecycle.
- [ ] Không log secret.
- [ ] 500 error xuất hiện trên Sentry.

---

## BE-08 — Index + payment mock + Gemini validation

**Role:** Backend  
**Priority:** P1  
**Effort:** S/M

### Cần làm

- [ ] User index `{ role, status }`.
- [ ] Landing slug unique index.
- [ ] Cart user index.
- [ ] Order code unique index.
- [ ] Đổi `SignedOnlinePaymentProvider` → `MockSignedPaymentProvider`.
- [ ] README/BUSINESS_RULES ghi rõ trạng thái payment.
- [ ] Production bật mock online payment → startup warning hoặc fail.
- [ ] Validate JSON output từ Gemini bằng DTO/schema trước khi save.

### Acceptance Criteria

- [ ] Không có duplicate orderCode.
- [ ] Không có duplicate slug.
- [ ] Query admin dùng index.
- [ ] Gemini trả JSON sai shape không được lưu trực tiếp.

---

## BE-09 — Sửa Reports module

**Role:** Backend  
**Priority:** P0 phần số giả / P1 phần tính toán  
**Effort:** M  
**Trạng thái:** **DONE (2026-09-03)**

### Cần làm

#### Làm ngay (P0)

- [x] Xóa `revenueGrowthRate: 12.5`.
- [x] Xóa `ordersGrowthRate: 8.3`.
- [x] Thay bằng số liệu tính toán động thật từ đơn hàng.

#### Làm tiếp (P1)

- [x] Tính growth kỳ hiện tại vs kỳ trước cùng độ dài (`getGrowthStats`).
- [x] `range=day/week/month/year` thực sự ảnh hưởng query.
- [x] Viết lại category revenue từ orders aggregation (`getCategoryRevenue`).
- [x] Dùng `items[].price * items[].quantity` snapshot lúc mua.
- [x] Loại CANCELLED/RETURNED khỏi revenue.
- [x] Không nuốt lỗi bằng `catch { return [] }`.
- [x] Rà toàn bộ report response tìm hardcode khác.

### Acceptance Criteria

- [x] Không còn số giả trong `/reports/*`.
- [x] `range=day` và `range=year` cho dữ liệu khác nhau khi seed data khác nhau.
- [x] Category revenue khớp phép tính tay trên seed data.
- [x] CANCELLED/RETURNED không được tính doanh thu.
- [x] Có regression test với expected values cố định (100% pass trong `orders.service.spec.ts` & `reports.service.spec.ts`).

---

## FE-01 — Refactor shared components

**Role:** Frontend  
**Priority:** P2  
**Effort:** L

### Component cần tách

- [ ] DataTable.vue
- [ ] FilterBar.vue
- [ ] FormModal.vue
- [ ] ImageUploader.vue
- [ ] StatusBadge.vue

### Áp dụng

- [ ] Products.vue
- [ ] Orders.vue
- [ ] Inventory.vue
- [ ] Promotions.vue
- [ ] Reviews.vue
- [ ] Customers.vue
- [ ] Home.vue
- [ ] ProductDetail.vue

### Acceptance Criteria

- [ ] Page mục tiêu < 400 dòng.
- [ ] Component mới có Vitest.
- [ ] Build + typecheck pass.
- [ ] Không regression UI.

---

## FE-02 — Reports UI không hiển thị dữ liệu giả

**Role:** Frontend  
**Priority:** P0/P1  
**Effort:** S

### Cần làm

- [ ] Xóa card growth nếu backend chưa trả số thật.
- [ ] Range filter chỉ hiện khi backend đã support thật.
- [ ] Hiển thị loading/error/empty đúng.
- [ ] Không fallback sang số hardcode ở frontend.

### Acceptance Criteria

- [ ] UI không hiển thị growth giả.
- [ ] Range đổi → request và dữ liệu đúng.

---

## QA-02 — Playwright E2E

**Role:** QA  
**Priority:** P2  
**Effort:** M

### Luồng bắt buộc

1. Register/login/logout/token cũ không còn dùng được.
2. Add cart → COD checkout → My Orders → invoice PDF.
3. Admin đổi PENDING → CONFIRMED → kiểm timeline/stock.
4. Landing page checkout → stock/report đúng.
5. Reports range/filter → dữ liệu đúng.

### Acceptance Criteria

- [ ] CI pass.
- [ ] Fail có trace + screenshot.
- [ ] Dùng Mongo replica set thật.

---

## QA-03 — Load test + report accuracy regression

**Role:** QA  
**Priority:** P2  
**Effort:** M

### Cần làm

- [ ] Baseline catalog/search.
- [ ] Baseline checkout.
- [ ] Baseline reports.
- [ ] Seed dataset có doanh thu expected biết trước.
- [ ] So sánh API report với expected.

---

## DEVOPS-01 — CI / deploy hardening

**Role:** DevOps  
**Priority:** P2  
**Effort:** M

### Cần làm

- [ ] Xóa workflow backend CI bị trùng.
- [ ] MongoDB authentication trong Docker Compose.
- [ ] Smoke test sau deploy.
- [ ] Gitleaks.
- [ ] Branch protection main.
- [ ] Archive Playwright trace / coverage.

### Acceptance Criteria

- [ ] Chỉ còn một pipeline backend chính.
- [ ] Mongo có auth.
- [ ] Deploy lỗi bị smoke test bắt.
- [ ] Secret giả bị gitleaks chặn.

---

## MOBILE-01 — Mobile release readiness

**Role:** Mobile  
**Priority:** P3  
**Effort:** L

### Cần làm

- [ ] Release keystore.
- [ ] Secure secret/config.
- [ ] API integration test thật.
- [ ] Push notification FCM.
- [ ] Test deeplink notification → order detail.

---

## PM-01 — Delivery governance

**Role:** PM  
**Priority:** P0  
**Effort:** Continuous

### Trách nhiệm

- [ ] Không cho merge P0 nếu chưa có QA evidence.
- [ ] Theo dõi dependency.
- [ ] Giao owner cho từng task.
- [ ] Daily bug triage.
- [ ] Staging release checklist.
- [ ] UAT với chủ shop.
- [ ] Production go/no-go.
- [ ] Rollback plan.

---



---

# 10A. Extended Backlog — các mục bị rơi giữa hai tài liệu

Các mục dưới đây có trong audit code/feature nhưng chưa được tách thành task chính trong bản task plan. Chúng **không chen vào P0** nếu P0 chưa xong.

| ID | Task | Role | Priority | Effort | Điều kiện / Acceptance chính |
|---|---|---|---|---|---|
| BE-10 | Chống abuse guest checkout | Backend + BA + Security | P1/P2 | M | Giới hạn PENDING theo SĐT; CAPTCHA/Turnstile theo risk; không chặn khách hợp lệ |
| SEC-05 | Thay regex XSS cho trường HTML bằng allowlist sanitizer | Security + Backend | P2 | S/M | Test payload HTML nguy hiểm; text thuần không bị sanitize quá mức |
| TECHDEBT-01 | Giảm lint debt và bỏ `Promise<any>` ở Orders/Payments | Backend | P2 | Continuous | Hạ warning budget theo sprint; type rõ ở money/payment path |
| FE-03 | Image optimization WebP/AVIF + sizing/lazy policy | Frontend | P2 | M | Giảm payload ảnh, không regression chất lượng/SEO |
| PRODUCT-01 | Loyalty redemption | BA + Backend + Frontend + Mobile | P2 | M/L | Chỉ làm nếu BA chốt loyalty là MVP; chống double-spend và có ledger |
| PAY-01 | Tích hợp VNPay/MoMo thật | Backend + QA + DevOps | P3 / Block nếu muốn bật online payment | L | Provider riêng theo sandbox spec; callback contract test; reconciliation |
| SHIPPING-01 | Mã vận đơn + tracking provider | BA + Backend + FE + Mobile | P3 | L | Có tracking code/status; mapping state không phá order state machine |
| MOBILE-02 | API integration regression trên emulator/device | Mobile + QA | P2/P3 | M | Login/cart/checkout/order notification gọi backend staging thật |

## 10A.1 Quy tắc guest checkout

Không nên bắt buộc OTP SMS cho mọi đơn ngay từ đầu nếu chi phí/UX không phù hợp. Thứ tự nhẹ → mạnh:

1. Giới hạn số đơn PENDING chưa xác nhận trên một SĐT.
2. Auto-cancel quá hạn và hoàn kho.
3. Rate-limit theo IP/device signal.
4. Turnstile/CAPTCHA khi hành vi đáng ngờ.
5. OTP SMS cho đơn giá trị cao hoặc khi abuse tăng.

## 10A.2 Lint debt

Không cần dọn 1.816 warning trong một sprint. Dùng nguyên tắc **ratchet**:

- Mỗi sprint giảm một mức xác định.
- Không cho warning tăng trở lại.
- Ưu tiên `orders.service.ts`, `payments.service.ts`, money DTO/interfaces trước.

## 10A.3 HTML/XSS hardening

- Với field text thuần: rely on escaping ở renderer; không cố “lọc HTML” bằng regex.
- Với field cố ý cho phép HTML: dùng allowlist sanitizer (`sanitize-html` hoặc tương đương), giới hạn tag/attribute/protocol.
- Có test payload nested/obfuscated thay vì chỉ test `<script>` đơn giản.



# 11. Phân task theo role

## BA

1. **BA-01** — Business rules.
2. Hỗ trợ BE-03 / BE-05 / BE-09 khi có ambiguity.
3. Chuẩn hóa permission matrix.
4. Chuẩn bị UAT scenario nghiệp vụ.

## Security Engineer

1. Review **QA-01** test design.
2. Pair với Backend làm **BE-01**.
3. Review **BE-06**.
4. Review Redis failure behavior ở **BE-04**.
5. Review log redaction ở **BE-07**.

## Backend

**P0 trước:**

1. BE-01
2. BE-02
3. BE-03
4. BE-05
5. BE-06
6. BE-09 phần bỏ số giả

**P1 sau:**

7. BE-04
8. BE-07
9. BE-08
10. BE-09 phần tính thật

## Frontend

1. FE-02 trước để không hiển thị report giả.
2. FE-01 sau khi E2E nền đã có.
3. Hỗ trợ loyalty point spending khi BA chốt.

## QA

1. QA-01 viết token test trước BE-01.
2. Authorization matrix.
3. QA-02 Playwright.
4. QA-03 load/report regression.
5. Full regression trước staging.

## DevOps

1. Hỗ trợ Redis cho BE-04.
2. Logging/Sentry infra cho BE-07.
3. DEVOPS-01.
4. Staging + production smoke tests.

## Mobile

1. API regression trên device/emulator.
2. Release keystore.
3. FCM.

## PM

1. Freeze scope P0.
2. Track blocker/dependency.
3. Không cho P2 chen vào khi P0 chưa xong.
4. Staging/UAT/Production gate.

---

# 12. Thứ tự triển khai đề xuất

```text
BA-01
  │
  ├── QA-01: viết token isolation test đỏ
  │       │
  │       └── BE-01: sửa token → làm test xanh
  │
  ├── BE-02: Review schema
  │
  ├── BE-03: Landing order pipeline
  │       ├── BE-08: orderCode/index/payment docs
  │       └── BE-09: category revenue đầy đủ
  │
  ├── BE-05: loyalty + pending auto-cancel
  │
  └── BE-06: email enumeration + cookie

Sau P0:

BE-04 + BE-07 + BE-09 phần tính thật
  │
  └── QA-02 Playwright
          │
          ├── FE-01 refactor
          ├── QA-03 load/report regression
          └── DEVOPS-01 hardening
                 │
                 └── Staging → UAT → Production
```

---

# 13. Sprint plan

## Sprint 1 — Security + Correctness

### Task

- BA-01
- QA-01 token isolation
- BE-01
- BE-02
- BE-06
- BE-09: xóa growth hardcode
- FE-02: gỡ UI số giả

### Goal

- Không còn auth bypass.
- Review hoạt động đúng.
- Không còn dashboard số giả.

### Definition of Done

- Token isolation test xanh.
- Review hide/verified/admin reply persist thật.
- API/UI không còn hardcoded growth.

---

## Sprint 2 — Order correctness + Business rules

### Task

- BE-03
- BE-05
- BE-08
- BE-09 phần tính thật
- QA-01 authorization matrix

### Goal

- Mọi order đi qua một pipeline.
- Loyalty đúng nghiệp vụ.
- Pending order không giữ kho vô hạn.
- Reports phản ánh dữ liệu thật.

### Definition of Done

- Landing order trừ kho đúng.
- Auto-cancel hoàn kho đúng.
- Report range hoạt động.
- Category revenue đúng seed expected.

---

## Sprint 3 — Observability + E2E + Deployment

### Task

- BE-04
- BE-07
- QA-02
- DEVOPS-01

### Goal

- Production có khả năng trace sự cố.
- Logout/rate-limit đúng khi scale.
- Main flows chạy E2E tự động.

### Definition of Done

- Correlation ID trace được request.
- Sentry nhận error.
- Playwright pass trên CI.
- Deploy lỗi bị smoke test bắt.

---

## Sprint 4 — Maintainability + Release readiness

### Task

- FE-01
- QA-03
- Lint debt reduction
- Image optimization
- MOBILE-01
- Loyalty point spending nếu BA chốt cần MVP

### Goal

- Hệ thống dễ duy trì hơn.
- Có performance baseline.
- Mobile sẵn sàng release.

---

# 14. Definition of Done toàn dự án trước Production

## Security

- [ ] Refresh/reset token không dùng làm access token.
- [ ] Không lộ email enumeration.
- [ ] Secret production fail-closed.
- [ ] Không log token/password/OTP.
- [ ] Authorization matrix pass.

## Order / Inventory

- [ ] Main checkout và landing checkout dùng chung pipeline.
- [ ] Stock atomic.
- [ ] Auto-cancel hoàn kho.
- [ ] Idempotency pass.
- [ ] orderCode unique.

## Review

- [ ] Chỉ một schema.
- [ ] Hide/verified/adminReply/images persist thật.

## Reporting

- [ ] Không có số hardcode giả.
- [ ] Range thật sự hoạt động.
- [ ] Category revenue tính từ order item snapshot.
- [ ] CANCELLED/RETURNED không tính revenue.

## Testing

- [ ] Token isolation test pass.
- [ ] Authorization matrix pass.
- [ ] Playwright core flows pass.
- [ ] Report accuracy regression pass.

## Production Operations

- [ ] Structured logs.
- [ ] Sentry.
- [ ] Smoke test.
- [ ] Mongo auth.
- [ ] Secret scanning.
- [ ] Rollback plan.

---

# 15. Các mục cần verify bằng môi trường thật

| # | Nội dung | Cách verify | Owner |
|---|---|---|---|
| 1 | Review schema nào đang active | Inspect `mongoose.models.Review.schema.paths` | Backend |
| 2 | Production review thiếu field nào | Query Mongo production sample | Backend/DBA |
| 3 | COOKIE_SAME_SITE thực tế | Inspect `Set-Cookie` ở production | Backend/Security |
| 4 | Coverage backend thật | `npm run test:cov` | QA |
| 5 | Lint/audit hiện tại | `npm run lint`, `npm audit` | Backend/DevOps |
| 6 | Số instance Render | Render dashboard | DevOps |
| 7 | Reports performance | `explain()` + load test | QA/Backend |

---

# 16. Go / No-Go Production

## NO-GO nếu còn bất kỳ mục nào sau

- BE-01 chưa xong.
- BE-02 chưa verify/persist đúng.
- BE-03 chưa đưa landing order vào pipeline chuẩn.
- Dashboard còn growth hardcode.
- Auto-cancel pending chưa có nếu hệ thống mở guest checkout quy mô thật.
- Core QA regression đỏ.

## Có thể hoãn sau khi mở bán COD

- VNPay/MoMo thật.
- FCM.
- SSR/prerender.
- Shipping provider integration.
- Full frontend refactor.
- Redis nếu chỉ chạy 1 backend instance và đã chấp nhận risk rõ ràng.

---

# 17. Ưu tiên nếu chỉ còn 3 tuần

## Tuần 1

- QA-01 token tests
- BE-01
- BE-02
- BE-06
- BE-09 bỏ số giả
- FE-02

## Tuần 2

- BE-03
- BE-05
- BE-09 tính report thật

## Tuần 3

- BE-07
- DEVOPS-01 smoke test
- Full QA regression
- Staging
- UAT

### Không được bỏ

**BE-01 — Token isolation.**

---

# 18. Kết luận CTO

Dự án không đi sai kiến trúc tổng thể. Modular monolith, MongoDB, REST, hybrid auth web/mobile đều phù hợp với quy mô hiện tại.

Vấn đề lớn nhất không nằm ở việc thiếu framework hay công nghệ mới, mà nằm ở **ranh giới giữa các module và độ phủ integration testing**.

Ba bài học quan trọng:

1. Không để module khác tự tạo Order ngoài OrdersService.
2. Không chỉ test service riêng lẻ; phải test nơi các phần hệ thống giao nhau.
3. Không hiển thị metric nếu metric đó chưa được tính từ dữ liệu thật.

Sau khi hoàn thành P0 và test integration tương ứng, dự án có thể tiến lên mức **Gần Production**. Sau Sprint 3 và UAT ổn định, có thể cân nhắc mở bán thật bằng COD trước, sau đó mới mở online payment.


---

# 19. Đối chiếu với vòng audit trước — các task đã DONE

Bản audit code ghi nhận vòng audit trước đã đóng các task sau; không được tạo lại task trùng chỉ vì đổi ID:

| Task cũ | Trạng thái |
|---|---|
| SEC-01 Remove & Rotate Exposed Secrets | DONE |
| DEVOPS-01 Block Production Deployment When CI Fails | DONE |
| SEC-02 Remove Refresh Token From Browser LocalStorage | DONE |
| DEVOPS-02 Lock MongoDB and Mongo Express Exposure | DONE |
| BE-01 Guarantee Atomic Checkout, Inventory and Promotion Usage | DONE |
| BE-02 Implement Explicit Order Status State Machine | DONE |
| SEC-03 Audit Authorization For Every Protected API | DONE |
| QA-01 Critical Commerce End-to-End Regression Suite | DONE |
| FE-01 Add Frontend Unit and Integration Test Baseline | DONE |
| SEC-04 Harden CORS Configuration | DONE |

## 19.1 Vì sao vẫn xuất hiện lỗi auth dù SEC-03 đã DONE?

Vòng trước audit theo hướng **endpoint cần guard/permission nào**. Lỗ hổng mới nằm ở **loại token nào được strategy chấp nhận**. Hai phạm vi khác nhau. Bài học: authorization matrix không thay thế token-isolation test.

---

# 20. Decision Summary cho CTO / Tech Lead / PM

## 20.1 Trạng thái hiện tại

- **Không cần rewrite dự án.**
- **Không cần đổi kiến trúc nền.**
- Core commerce pipeline chính có nhiều điểm tốt.
- Dự án chưa production-ready vì còn ba nhóm rủi ro: **auth semantics**, **multiple write paths**, **untrusted reporting**.

## 20.2 Năm việc đầu tiên nên giao

1. **BA-01:** chốt loyalty, pending timeout, landing package/product, revenue definition.
2. **FE-02 + BE-09 phần P0:** bỏ số growth hardcode ngay.
3. **QA-01 token isolation:** viết test đỏ.
4. **BE-01:** tách access/refresh/reset token.
5. **BE-02:** gộp Review schema và xác minh/backfill dữ liệu.

Sau đó mới tới BE-03/BE-05/BE-09 tính thật.

## 20.3 Production strategy hợp lý nhất

### Phase A — COD-only launch

Có thể cân nhắc mở bán COD sau khi:

- P0 security/correctness pass.
- Landing page không bypass pipeline.
- Dashboard không còn số giả.
- Auto-cancel/stock correctness pass.
- Core regression + staging/UAT pass.
- Logging/smoke test đủ để xử lý sự cố.

### Phase B — Online payment

Chỉ bật VNPay/MoMo sau khi:

- Có merchant/sandbox account.
- Provider thực theo đúng protocol từng cổng.
- Contract/callback/idempotency/reconciliation test pass.
- Có UAT end-to-end trên sandbox.

### Phase C — Scale / mobile growth

- Redis distributed throttling/blacklist khi >1 instance.
- FCM, mobile release keystore, API integration test.
- Shipping tracking, performance baseline, image optimization.

---

# 21. Kết luận cuối

Dự án Trường Thành Bookstore **không yếu ở nền tảng kiến trúc**, mà yếu ở các **boundary/integration invariant**:

- Token service ↔ JWT strategy.
- Products module ↔ Reviews model.
- Landing page ↔ Orders/Inventory.
- Reports ↔ dữ liệu giao dịch thật.

Vì vậy hướng đúng là **không thêm framework mới**, mà làm cho một nguồn dữ liệu/một pipeline/một business rule trở thành sự thật duy nhất, sau đó khóa bằng integration test và production observability.

**Mốc nâng cấp trạng thái:**

- Hoàn tất P0 + test integration tương ứng → có thể đánh giá lại lên **Gần Production**.
- Hoàn tất Sprint 3 + staging/UAT ổn định → cân nhắc **COD production launch**.
- Online payment chỉ mở khi tích hợp thật và sandbox/UAT pass.
