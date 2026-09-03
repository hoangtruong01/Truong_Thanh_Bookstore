# Truong Thanh Bookstore — Technical Audit Fix Tasks

> Repository: `hoangtruong01/Truong_Thanh_Bookstore`  
> Purpose: Backlog sửa lỗi và hardening dự án sau technical audit.  
> Scope: Backend, Frontend, Database, Security, QA, DevOps, Performance, Business Logic.
>
> Priority:
>
> - **P0** — Làm ngay: security, data integrity, deployment safety, lỗi có thể gây mất dữ liệu hoặc compromise hệ thống.
> - **P1** — Cần cho MVP ổn định: core flow, authorization, regression testing.
> - **P2** — Nên cải thiện: maintainability, performance, typing, observability.
> - **P3** — Có thể làm sau: nâng cấp vận hành hoặc tính năng nâng cao.
>
> Severity:
>
> - **Critical** — Có nguy cơ compromise hệ thống / dữ liệu.
> - **High** — Có thể gây lỗi production nghiêm trọng hoặc sai business logic.
> - **Medium** — Ảnh hưởng maintainability, security posture, UX hoặc performance.
> - **Low** — Không block release nhưng nên xử lý.
>
> Những mục chưa đủ dữ liệu runtime để kết luận tuyệt đối được đánh dấu **NEED VERIFY**.

---

# 0. Thứ tự ưu tiên tổng thể

Nên triển khai theo thứ tự:

```text
SEC-01 Remove & Rotate Exposed Secrets
        ↓
DEVOPS-01 Gate Deployment By CI
        ↓
SEC-02 Secure Web Token Storage
        ↓
DEVOPS-02 Lock MongoDB / Mongo Express
        ↓
BE-01 Atomic Checkout & Inventory
        ↓
BE-02 Order Status State Machine
        ↓
SEC-03 Authorization Matrix Audit
        ↓
QA-01 Critical Commerce E2E
        ↓
FE-01 Frontend Test Foundation
        ↓
SEC-04 Production CORS / CSP / Swagger Hardening
        ↓
BE-03 / BE-04 Service Refactor
        ↓
PERF-01 Query Optimization
        ↓
OBS-01 Monitoring / Logging
```

---

# P0 — PHẢI LÀM NGAY

---

## TASK ID: SEC-01

### Tên task
Remove & Rotate Exposed Secrets

**Role:** DevOps + Backend  
**Priority:** P0  
**Severity:** Critical  
**Effort:** S

### Vấn đề

Một số secret/credential đang được hard-code trực tiếp trong source control.

Ví dụ đã phát hiện trong:

```text
docker-compose.yml
```

Có JWT secret và credential Mongo Express dạng plaintext.

### Ảnh hưởng

Nếu các giá trị này từng được dùng ở production hoặc staging:

- Người đọc repository có thể biết JWT secret.
- Có nguy cơ forge JWT nếu secret production giống giá trị commit.
- Credential Mongo Express có thể bị lộ.
- Việc chỉ sửa secret trong commit mới **không đủ**, vì secret cũ vẫn còn trong Git history.
- Token đã ký bằng secret cũ vẫn có thể còn hiệu lực cho tới khi hết hạn hoặc bị rotate.

### Cần fix

- [x] Xóa toàn bộ JWT secret hard-code khỏi `docker-compose.yml`.
- [x] Xóa username/password Mongo Express hard-code khỏi source.
- [x] Chuyển sang environment variables và fail-closed khi thiếu.
- [ ] Tạo secret mới cho production.
- [ ] Rotate JWT secret đang sử dụng.
- [ ] Rotate Mongo Express password nếu credential này từng được deploy.
- [ ] Kiểm tra GitHub Actions / Render / Vercel / server config có secret hard-code khác không.
- [ ] Kiểm tra repository bằng secret scanning.
- [ ] Không commit `.env` thật.
- [ ] Chỉ commit `.env.example`.

### Cách sửa đề xuất

Thay vì:

```yaml
environment:
  JWT_SECRET: hard-coded-secret
```

Dùng:

```yaml
environment:
  JWT_SECRET: ${JWT_SECRET}
```

Mongo Express:

```yaml
environment:
  ME_CONFIG_BASICAUTH_USERNAME: ${MONGO_EXPRESS_USERNAME}
  ME_CONFIG_BASICAUTH_PASSWORD: ${MONGO_EXPRESS_PASSWORD}
```

### File/module liên quan

```text
docker-compose.yml
.github/workflows/*
backend/src/config/*
.env*
deployment configuration
```

### Acceptance Criteria

- [ ] `git grep` không tìm thấy production JWT secret.
- [ ] `git grep` không tìm thấy Mongo Express production password.
- [ ] Production backend vẫn start thành công bằng environment variables.
- [ ] Token được ký bằng secret cũ không còn được chấp nhận sau rotation.
- [ ] `.env` thật không nằm trong Git.
- [ ] `.env.example` chỉ chứa placeholder.

### Dependency

None.

---

## TASK ID: DEVOPS-01

### Tên task
Block Production Deployment When CI Fails

**Role:** DevOps  
**Priority:** P0  
**Severity:** High  
**Effort:** S

### Vấn đề

Deployment workflow hiện được trigger trực tiếp khi push vào `main`.

File:

```text
.github/workflows/deploy.yml
```

Deploy workflow đang độc lập với test workflow.

Điều này tạo khả năng:

```text
Push main
├── CI chạy → FAIL
└── Deploy workflow vẫn chạy
```

### Ảnh hưởng

Code fail unit test hoặc E2E vẫn có thể được deploy production.

Đây là lỗi release process nghiêm trọng.

### Cần fix

- [x] Chỉ deploy sau khi CI thành công.
- [x] Backend CI phải pass.
- [x] Frontend build/test phải pass.
- [ ] Nếu mobile liên quan release thì mobile CI cũng phải pass.
- [ ] Enable branch protection cho `main`.
- [ ] Không cho merge PR nếu required checks fail.
- [ ] Hạn chế direct push vào `main`.

### Cách sửa đề xuất

Có thể dùng một trong hai cách:

#### Option A — Một pipeline

```text
install
↓
lint
↓
unit test
↓
E2E
↓
build
↓
deploy
```

#### Option B — `workflow_run`

Deployment chỉ trigger khi workflow CI có:

```text
conclusion == success
```

### File/module liên quan

```text
.github/workflows/backend-ci.yml
.github/workflows/frontend-ci.yml
.github/workflows/mobile-ci.yml
.github/workflows/deploy.yml
```

### Acceptance Criteria

- [ ] Tạo một test fail cố ý.
- [ ] Push/PR không thể deploy.
- [ ] Khi CI pass, deployment mới được chạy.
- [ ] `main` có required status checks.

### Dependency

None.

---

## TASK ID: SEC-02

### Tên task
Remove Refresh Token From Browser LocalStorage

**Role:** Full-stack  
**Priority:** P0  
**Severity:** High  
**Effort:** M

### Vấn đề

Frontend đang lưu authentication token trong browser storage.

Các file liên quan:

```text
frontend/src/stores/auth.ts
frontend/src/utils/api.ts
```

Refresh token JS-readable tạo rủi ro lớn khi xảy ra XSS.

Backend hiện đã có logic JWT/refresh token tương đối tốt, nhưng frontend storage model làm giảm đáng kể lợi ích security đó.

### Ảnh hưởng

Nếu attacker inject JavaScript:

```js
localStorage.getItem('refreshToken')
```

họ có thể lấy refresh token và hijack session trong thời gian dài.

### Cần fix

- [x] Không lưu refresh token trong `localStorage`.
- [x] Backend set refresh token bằng HttpOnly cookie.
- [x] Cookie production phải có `Secure`.
- [ ] Chọn `SameSite` phù hợp deployment.
- [x] Frontend dùng `withCredentials`.
- [x] Refresh endpoint đọc refresh token từ cookie.
- [ ] Logout phải clear cookie.
- [ ] Login/register phải không trả refresh token cho JS nếu không cần.
- [ ] Kiểm tra CSRF model sau khi chuyển sang cookie.
- [ ] Mobile auth không dùng browser cookie flow nếu architecture mobile khác.
- [ ] Mobile nên lưu token bằng secure storage phù hợp nền tảng.

### File/module liên quan

```text
frontend/src/stores/auth.ts
frontend/src/utils/api.ts

backend/src/modules/auth/auth.controller.ts
backend/src/modules/auth/auth.service.ts
backend/src/modules/auth/strategies/*
```

### Acceptance Criteria

- [ ] Sau login, `localStorage` không có refresh token.
- [ ] Refresh session vẫn hoạt động.
- [ ] Logout làm refresh token cũ không sử dụng lại được.
- [ ] Refresh token không đọc được bằng JavaScript.
- [ ] Access unauthorized sau logout.
- [ ] Existing refresh-token rotation/reuse detection vẫn hoạt động.

### Dependency

SEC-01.

---

## TASK ID: DEVOPS-02

### Tên task
Lock MongoDB and Mongo Express Exposure

**Role:** DevOps + Security  
**Priority:** P0  
**Severity:** High  
**Effort:** S

### Vấn đề

`docker-compose.yml` publish:

```text
MongoDB: 27017
Mongo Express: 8081
```

MongoDB compose hiện cần được xem như environment development, không nên dùng nguyên trạng cho production.

### Ảnh hưởng

Nếu server firewall/network configuration mở:

- MongoDB có thể bị truy cập từ Internet.
- Mongo Express trở thành admin panel public.
- Tăng attack surface rất lớn.

### Cần fix

- [x] Production MongoDB không expose `27017` ra Internet.
- [x] Backend kết nối Mongo qua private/internal network.
- [x] Mongo Express không chạy production nếu không thực sự cần.
- [x] Nếu buộc dùng Mongo Express, chỉ bind localhost/VPN/private network.
- [ ] Bật database authentication nếu self-host Mongo.
- [ ] Nếu dùng Mongo Atlas, restrict network access.
- [ ] Verify firewall/security group.

### File/module liên quan

```text
docker-compose.yml
production infrastructure configuration
MongoDB Atlas/network configuration
```

### Acceptance Criteria

- [ ] Không thể connect MongoDB từ public Internet.
- [ ] Port 8081 không public production.
- [ ] Backend production vẫn kết nối DB bình thường.
- [ ] DB credentials không nằm trong source.

### Dependency

SEC-01.

---

## TASK ID: BE-01

### Tên task
Guarantee Atomic Checkout, Inventory and Promotion Usage

**Role:** Backend  
**Priority:** P0  
**Severity:** High  
**Effort:** L

### Vấn đề

Order creation có logic transaction/rollback nhưng transaction behavior phụ thuộc Mongo deployment.

File chính:

```text
backend/src/modules/orders/orders.service.ts
```

Local Docker Mongo hiện có dấu hiệu chạy standalone.

MongoDB multi-document transaction yêu cầu deployment hỗ trợ transaction, thường là replica set.

Code có fallback/compensation logic khi transaction không supported.

### Ảnh hưởng

Trong tình huống concurrent request hoặc process crash giữa các bước:

```text
check stock
↓
deduct stock
↓
consume promotion
↓
create order
```

có thể xảy ra:

- stock bị trừ nhưng order không tạo.
- promotion usage bị tăng nhưng order fail.
- overselling.
- race condition.
- inventory/sold count không đồng nhất.

### Cần fix

- [ ] Xác nhận production Mongo hỗ trợ transaction.
- [ ] Production phải chạy replica set hoặc Mongo Atlas transaction-compatible.
- [x] Gom order creation + stock update + promotion usage vào transaction phù hợp.
- [x] Dùng atomic stock condition:

```text
stock >= requestedQuantity
```

- [ ] Không dùng pattern read stock rồi update không điều kiện nếu có thể race.
- [ ] Test 10–50 concurrent checkout cùng SKU.
- [ ] Test promotion quantity limit concurrent.
- [ ] Test idempotency concurrent.
- [ ] Test rollback khi order save fail.
- [ ] Test rollback khi promotion fail.
- [ ] Test crash/error giữa inventory và order creation.

### File/module liên quan

```text
backend/src/modules/orders/orders.service.ts
backend/src/modules/orders/schemas/order.schema.ts
backend/src/modules/products/products.service.ts
backend/src/modules/products/schemas/product.schema.ts
backend/src/modules/promotions/*
backend/src/modules/inventory/*
```

### Acceptance Criteria

- [ ] Stock không bao giờ âm.
- [ ] 10 concurrent requests mua 1 sản phẩm stock=1 chỉ tạo tối đa 1 successful reservation/order.
- [ ] Duplicate idempotency key không tạo 2 orders.
- [ ] Failed transaction không làm thay đổi stock.
- [ ] Failed transaction không consume promotion.
- [ ] Order và inventory luôn cùng trạng thái hợp lệ.

### Dependency

Production MongoDB configuration.

---

# P1 — CẦN CHO MVP ỔN ĐỊNH

---

## TASK ID: BE-02

### Tên task
Implement Explicit Order Status State Machine

**Role:** Backend + BA  
**Priority:** P1  
**Severity:** High  
**Effort:** M

### Vấn đề

Order có nhiều trạng thái:

```text
PENDING
CONFIRMED
PROCESSING
SHIPPING
DELIVERED
COMPLETED
RETURNED
CANCELLED
```

Cần bảo đảm mọi status transition được validate ở backend.

Hiện cần **NEED VERIFY** tất cả branch update status.

### Ảnh hưởng

Nếu API cho phép transition tùy ý:

```text
CANCELLED → SHIPPING
DELIVERED → PENDING
RETURNED → PROCESSING
```

thì sẽ làm sai:

- inventory
- revenue/reporting
- customer status
- notification
- refund/payment
- loyalty point.

### Cần fix

- [x] BA define transition matrix chính thức.
- [x] Backend implement centralized transition validator.
- [ ] Không duplicate transition logic ở nhiều controller/service.
- [ ] Terminal states không được quay ngược nếu business không cho phép.
- [ ] Cancel phải check payment/status.
- [ ] Return phải check delivered/completed rule.
- [ ] Inventory restore chỉ chạy đúng một lần.
- [ ] Side effects chạy theo transition hợp lệ.

### Transition matrix gợi ý

```text
PENDING
  ├── CONFIRMED
  └── CANCELLED

CONFIRMED
  ├── PROCESSING
  └── CANCELLED

PROCESSING
  ├── SHIPPING
  └── CANCELLED (nếu business cho phép)

SHIPPING
  └── DELIVERED

DELIVERED
  ├── COMPLETED
  └── RETURNED

COMPLETED
  └── RETURNED (nếu policy cho phép)

RETURNED
  └── terminal

CANCELLED
  └── terminal
```

> Matrix cuối cùng phải theo business thật, không mặc định copy nguyên gợi ý này.

### File/module liên quan

```text
backend/src/modules/orders/orders.service.ts
backend/src/modules/orders/*
```

### Acceptance Criteria

- [ ] Valid transitions pass.
- [ ] Invalid transitions return HTTP 400/409.
- [ ] `CANCELLED -> SHIPPING` bị reject.
- [ ] Restore inventory không chạy hai lần.
- [ ] Có unit/E2E test cho transition matrix.

### Dependency

BE-01 preferred.

---

## TASK ID: SEC-03

### Tên task
Audit Authorization For Every Protected API

**Role:** Backend + Security + QA  
**Priority:** P1  
**Severity:** High  
**Effort:** M

### Vấn đề

Frontend có route/permission guard nhưng frontend guard **không phải security boundary**.

Backend có role guard, nhưng cần audit toàn bộ controller endpoint để bảo đảm:

- endpoint admin luôn protected.
- endpoint staff đúng permission.
- user không đọc/sửa resource người khác.
- guest access chỉ hoạt động trong phạm vi cho phép.

### Ảnh hưởng

Một endpoint thiếu guard có thể cho user gọi trực tiếp qua Postman/cURL dù frontend không hiển thị UI.

### Cần fix

- [ ] Lập bảng tất cả API endpoint.
- [ ] Gắn required role/permission.
- [ ] Audit GET/POST/PATCH/DELETE.
- [ ] Audit order ownership.
- [ ] Audit address ownership.
- [ ] Audit review ownership.
- [ ] Audit customer management.
- [ ] Audit inventory endpoints.
- [ ] Audit report endpoints.
- [ ] Audit banner/landing page endpoints.
- [ ] Audit promotion management.
- [ ] Negative authorization E2E tests.

### Authorization matrix mẫu

| API | Guest | Customer | Staff | Admin | Super Admin |
|---|---:|---:|---:|---:|---:|
| GET products | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST products | ❌ | ❌ | NEED VERIFY | ✅ | ✅ |
| GET own orders | ❌ | ✅ | NEED VERIFY | ✅ | ✅ |
| GET all orders | ❌ | ❌ | ✅/NEED VERIFY | ✅ | ✅ |
| Update inventory | ❌ | ❌ | ✅/NEED VERIFY | ✅ | ✅ |
| Reports | ❌ | ❌ | NEED VERIFY | ✅ | ✅ |

### File/module liên quan

```text
backend/src/modules/**/**.controller.ts
backend/src/common/guards/roles.guard.ts
backend/src/common/decorators/*
```

### Acceptance Criteria

- [ ] Không có admin mutation endpoint public.
- [ ] Customer không gọi được admin API.
- [ ] User A không đọc/sửa resource riêng của User B.
- [ ] Negative authorization tests chạy trong CI.

### Dependency

None.

---

## TASK ID: QA-01

### Tên task
Critical Commerce End-to-End Regression Suite

**Role:** QA + Backend  
**Priority:** P1  
**Severity:** High  
**Effort:** M

### Vấn đề

Backend đã có Jest/Supertest và nhiều E2E file, đây là điểm tốt.

Tuy nhiên cần bảo đảm core business flow được test như một release gate.

### Cần fix

Bổ sung hoặc verify test cho:

#### Authentication

- [ ] register.
- [ ] login.
- [ ] invalid password.
- [ ] refresh token.
- [ ] refresh token reuse.
- [ ] logout.
- [ ] reset password.
- [ ] old session invalidated sau reset/change password.

#### Product

- [ ] product unavailable.
- [ ] insufficient stock.
- [ ] invalid product ID.
- [ ] server ignores client-manipulated price.

#### Cart / Checkout

- [ ] calculate subtotal.
- [ ] shipping.
- [ ] promotion.
- [ ] expired promotion.
- [ ] promotion limit.
- [ ] zero/negative quantity reject.

#### Orders

- [ ] create order.
- [ ] duplicate idempotency.
- [ ] cancel.
- [ ] inventory restore.
- [ ] invalid state transition.
- [ ] guest order access.

#### Authorization

- [ ] customer cannot access admin endpoints.
- [ ] staff permission restrictions.
- [ ] cross-user resource access blocked.

### File/module liên quan

```text
backend/test/*
```

### Acceptance Criteria

- [x] Core E2E suite pass trong CI.
- [x] Test failure block deploy.
- [ ] Có ít nhất một concurrent inventory test.
- [ ] Có negative authorization coverage.

### Dependency

BE-01, BE-02, SEC-03.

---

## TASK ID: FE-01

### Tên task
Add Frontend Unit and Integration Test Baseline

**Role:** Frontend + QA  
**Priority:** P1  
**Severity:** Medium  
**Effort:** M

### Vấn đề

Frontend CI hiện chủ yếu build.

Chưa thấy test/lint gate tương xứng với backend.

### Ảnh hưởng

Các lỗi sau dễ lọt production:

- login state regression.
- refresh-token loop.
- cart calculation sai.
- route permission sai.
- checkout request format sai.
- API interceptor race condition.

### Cần fix

- [x] Thêm test runner phù hợp Vue 3.
- [x] Test auth store.
- [ ] Test axios refresh interceptor.
- [x] Test cart calculation.
- [ ] Test checkout request.
- [ ] Test admin route guard.
- [x] Test logout cleanup.
- [ ] Add test command vào CI.
- [ ] Add lint/type-check nếu chưa có.

### File/module liên quan

```text
frontend/package.json
frontend/src/stores/auth.ts
frontend/src/utils/api.ts
frontend/src/router/index.ts
frontend/src/services/*
.github/workflows/frontend-ci.yml
```

### Acceptance Criteria

- [ ] `npm test` chạy được.
- [ ] CI chạy test frontend.
- [ ] Test fail sẽ fail workflow.
- [ ] Core auth/cart/checkout có test.

### Dependency

SEC-02 preferred.

---

## TASK ID: SEC-04

### Tên task
Harden CORS Configuration

**Role:** Backend + Security  
**Priority:** P1  
**Severity:** Medium  
**Effort:** S

### Vấn đề

CORS logic có dấu hiệu allow rộng các domain dạng:

```text
*.vercel.app
*.onrender.com
```

kết hợp với:

```text
credentials: true
```

### Ảnh hưởng

Origin whitelist rộng hơn cần thiết.

Với credentialed requests, production nên chỉ trust đúng application origins.

### Cần fix

- [ ] Production dùng exact allowed origins.
- [ ] Preview deployment nếu cần phải có pattern theo project cụ thể.
- [ ] Không allow mọi Vercel/Render domain.
- [ ] Development origins tách khỏi production.
- [ ] Add CORS automated test.

### File/module liên quan

```text
backend/src/main.ts
backend/src/config/*
```

### Acceptance Criteria

- [ ] Approved frontend origin hoạt động.
- [ ] Random `*.vercel.app` origin bị reject.
- [ ] Random `*.onrender.com` origin bị reject.
- [ ] Localhost chỉ được allow trong development.

### Dependency

None.

---

## TASK ID: SEC-05

### Tên task
Restrict Swagger in Production

**Role:** Backend + DevOps  
**Priority:** P1  
**Severity:** Low / Medium  
**Effort:** S

### Vấn đề

Swagger endpoint đang được setup ở application bootstrap.

Nếu production không cần public API docs thì không nên expose mặc định.

### Ảnh hưởng

Không phải vulnerability trực tiếp, nhưng:

- làm API enumeration dễ hơn.
- expose schema/DTO/endpoint không cần thiết.

### Cần fix

- [ ] Chỉ enable Swagger khi:
  - development, hoặc
  - `ENABLE_SWAGGER=true`.
- [ ] Nếu production cần Swagger nội bộ, đặt behind auth/private network.

### File/module liên quan

```text
backend/src/main.ts
```

### Acceptance Criteria

- [ ] Production mặc định `/api/docs` trả 404 hoặc unavailable.
- [ ] Development vẫn dùng Swagger bình thường.

### Dependency

None.

---

## TASK ID: SEC-06

### Tên task
Tighten Content Security Policy

**Role:** Backend + Security  
**Priority:** P1  
**Severity:** Medium  
**Effort:** S/M

### Vấn đề

Helmet CSP hiện có rule rộng như:

```text
unsafe-inline
unsafe-eval
connect-src *
```

### Ảnh hưởng

CSP mất nhiều khả năng giảm thiểu XSS/data exfiltration.

### Cần fix

- [ ] Xác định CSP thực sự cần cho backend API.
- [ ] Tách Swagger/dev CSP khỏi production.
- [ ] Remove `unsafe-eval` production nếu không cần.
- [ ] Hạn chế `connect-src`.
- [ ] Không dùng wildcard nếu không cần.
- [ ] Verify frontend assets/API vẫn hoạt động.

### File/module liên quan

```text
backend/src/main.ts
```

### Acceptance Criteria

- [ ] Production không có `connect-src *`.
- [ ] `unsafe-eval` bị loại bỏ nếu app không phụ thuộc.
- [ ] Swagger dev vẫn hoạt động nếu cần.

### Dependency

SEC-05 preferred.

---

## TASK ID: DEVOPS-03

### Tên task
Add Dependency and Secret Scanning To CI

**Role:** DevOps + Security  
**Priority:** P1  
**Severity:** Medium  
**Effort:** S/M

### Vấn đề

Chưa thấy release gate rõ ràng cho:

- dependency vulnerabilities.
- accidentally committed secrets.

### Cần fix

- [ ] Scan backend dependencies.
- [ ] Scan frontend dependencies.
- [ ] Scan Flutter dependencies nếu phù hợp.
- [ ] Secret scan source.
- [ ] Fail build với vulnerability mức Critical/High theo policy.
- [ ] Không blindly auto-fix breaking dependency versions.

### File/module liên quan

```text
.github/workflows/*
backend/package*.json
frontend/package*.json
mobile/pubspec.*
```

### Acceptance Criteria

- [ ] CI có dependency security check.
- [ ] Dummy secret test bị detect.
- [ ] Critical vulnerability có thể block merge/release theo policy.

### Dependency

DEVOPS-01.

---

# P2 — NÊN CẢI THIỆN

---

## TASK ID: BE-03

### Tên task
Split ProductService Responsibilities

**Role:** Backend  
**Priority:** P2  
**Severity:** Medium  
**Effort:** M

### Vấn đề

File:

```text
backend/src/modules/products/products.service.ts
```

đang rất lớn và chứa nhiều responsibility.

Hiện service xử lý nhiều nhóm logic:

- CRUD product.
- search/filter.
- inventory/stock-related behavior.
- Excel import.
- Excel export.
- template generation.
- category processing trong import.

### Ảnh hưởng

- khó đọc.
- khó test unit.
- merge conflict.
- sửa import/export có thể ảnh hưởng product core.
- onboarding developer mới khó.

### Cần fix

Refactor incremental, **không rewrite**.

Gợi ý:

```text
products.service.ts
product-query.service.ts
product-import-export.service.ts
product-stock.service.ts
```

Không bắt buộc tạo quá nhiều abstraction nếu chưa cần.

### File/module liên quan

```text
backend/src/modules/products/products.service.ts
backend/src/modules/products/products.module.ts
```

### Acceptance Criteria

- [ ] Existing public API behavior không thay đổi.
- [ ] Existing tests pass.
- [ ] Import/export logic không còn nằm chung toàn bộ với product CRUD.
- [ ] Main ProductService nhỏ hơn và rõ responsibility hơn.

### Dependency

QA-01 preferred.

---

## TASK ID: BE-04

### Tên task
Split OrderService Responsibilities

**Role:** Backend  
**Priority:** P2  
**Severity:** Medium  
**Effort:** L

### Vấn đề

File:

```text
backend/src/modules/orders/orders.service.ts
```

đang xử lý quá nhiều trách nhiệm:

- checkout preview.
- order creation.
- stock update.
- promotion.
- order status.
- Google Sheet.
- notifications.
- email.
- loyalty.
- business side effects.

### Ảnh hưởng

OrderService dần trở thành God Service.

Khó:

- unit test.
- isolate bug.
- sửa transaction.
- maintain integration.

### Cần fix

Refactor theo domain responsibility.

Gợi ý:

```text
orders.service.ts
checkout.service.ts
order-inventory.service.ts
order-status.service.ts
order-notification.service.ts
```

Không cần chuyển microservices.

### File/module liên quan

```text
backend/src/modules/orders/orders.service.ts
backend/src/modules/orders/orders.module.ts
```

### Acceptance Criteria

- [ ] Không thay đổi API contract.
- [ ] Transaction boundary vẫn rõ ràng.
- [ ] Existing E2E pass.
- [ ] External notification/integration logic được tách khỏi core order creation.

### Dependency

BE-01, BE-02, QA-01.

---

## TASK ID: PERF-01

### Tên task
Remove N+1 Product Query During Checkout

**Role:** Backend  
**Priority:** P2  
**Severity:** Medium  
**Effort:** S/M

### Vấn đề

Checkout/order creation có pattern load từng product theo từng cart item.

Ví dụ logic dạng:

```text
for each item:
    find product by id
```

### Ảnh hưởng

Cart 20 sản phẩm có thể tạo ~20 DB queries thay vì 1 query batch.

### Cần fix

- [ ] Lấy danh sách unique product IDs.
- [ ] Query Mongo với `$in`.
- [ ] Map result theo `_id`.
- [ ] Validate missing products.
- [ ] Giữ nguyên server-side pricing.
- [ ] Benchmark before/after.

### File/module liên quan

```text
backend/src/modules/orders/orders.service.ts
backend/src/modules/products/products.service.ts
```

### Acceptance Criteria

- [ ] Checkout 20 products không thực hiện 20 independent product queries.
- [ ] Business result giống trước.
- [ ] Existing checkout tests pass.

### Dependency

BE-01 preferred.

---

## TASK ID: FE-02

### Tên task
Replace Core API `any` Types With Explicit Contracts

**Role:** Frontend  
**Priority:** P2  
**Severity:** Medium  
**Effort:** M

### Vấn đề

Một số frontend service method dùng:

```ts
data: any
params?: any
```

Ví dụ các service order/API.

### Ảnh hưởng

TypeScript không bắt được:

- request field sai.
- missing fields.
- response shape sai.
- refactor backend contract gây lỗi runtime.

### Cần fix

Ưu tiên core flow trước:

```text
Auth
Product
Cart
Checkout
Order
Promotion
```

Tạo types/interfaces:

```ts
CreateOrderRequest
CheckoutPreviewRequest
OrderResponse
PaginatedResponse<T>
ApiErrorResponse
```

### File/module liên quan

```text
frontend/src/services/*
frontend/src/types/*
```

### Acceptance Criteria

- [ ] Không còn `any` trong core checkout/order API contract.
- [ ] `vue-tsc`/type-check pass.
- [ ] Existing UI behavior không đổi.

### Dependency

None.

---

## TASK ID: OBS-01

### Tên task
Add Request Correlation and Production Observability

**Role:** Backend + DevOps  
**Priority:** P2  
**Severity:** Medium  
**Effort:** M

### Vấn đề

Project đã có centralized error handling và logging foundation tốt.

Tuy nhiên production debugging cần thêm request correlation/metrics.

### Ảnh hưởng

Khi customer báo:

> Thanh toán/order bị lỗi

team khó trace toàn bộ request qua:

```text
API
Order
Payment
Notification
External integration
```

### Cần fix

- [ ] Generate/request correlation ID.
- [ ] Return request ID trong response header.
- [ ] Log:
  - route.
  - method.
  - status.
  - duration.
  - request ID.
  - authenticated user ID nếu có.
- [ ] Không log password/token/secret.
- [ ] Add 5xx monitoring.
- [ ] Add latency monitoring.
- [ ] Add alert policy cơ bản.

### File/module liên quan

```text
backend/src/main.ts
backend/src/common/filters/http-exception.filter.ts
backend/src/common/interceptors/*
deployment monitoring
```

### Acceptance Criteria

- [ ] Mỗi request có correlation ID.
- [ ] Error log có request ID.
- [ ] Sensitive data không xuất hiện trong log.
- [ ] Có thể tìm request end-to-end bằng một ID.

### Dependency

None.

---

## TASK ID: DB-01

### Tên task
Review MongoDB Index Usage

**Role:** Backend / Database  
**Priority:** P2  
**Severity:** Low  
**Effort:** S/M  
**Status:** NEED VERIFY

### Vấn đề

Product schema có khá nhiều text/compound indexes.

Index có lợi cho read nhưng tăng:

- write cost.
- import cost.
- disk/memory usage.

Chưa đủ dữ liệu production để kết luận index nào redundant.

### Cần làm

- [ ] Check `$indexStats`.
- [ ] Check slow queries.
- [ ] Run `explain("executionStats")` cho các query chính.
- [ ] Không xóa index chỉ vì thấy nhiều.
- [ ] Remove only indexes có evidence không dùng/redundant.

### File/module liên quan

```text
backend/src/modules/products/schemas/product.schema.ts
backend/src/modules/orders/schemas/order.schema.ts
```

### Acceptance Criteria

- [ ] Có report index usage.
- [ ] Mọi index bị xóa phải có evidence.
- [ ] Search/filter/order query không regression.

### Dependency

Production/staging dataset representative.

---

## TASK ID: BE-05

### Tên task
Decouple External Side Effects From Core Order Flow

**Role:** Backend  
**Priority:** P2  
**Severity:** Medium  
**Effort:** M

### Vấn đề

Order service gọi nhiều side effect external:

- Google Sheet.
- email.
- notification.
- possibly third-party integrations.

### Ảnh hưởng

Nếu integration external chậm/fail:

- request order có thể chậm.
- logic core bị coupling.
- khó test.

### Cần fix

Không cần queue ngay nếu project nhỏ.

- [ ] Tách integration code thành service riêng.
- [ ] Core order transaction không phụ thuộc email/Google Sheet thành công.
- [ ] External side effect failure được log.
- [ ] Không rollback successful order chỉ vì email fail.
- [ ] Nếu cần retry, implement simple controlled retry trước khi nghĩ đến queue system.

### File/module liên quan

```text
backend/src/modules/orders/orders.service.ts
backend/src/modules/email/*
backend/src/modules/notifications/*
Google Sheet integration module
```

### Acceptance Criteria

- [ ] Email fail nhưng valid order vẫn tồn tại đúng.
- [ ] Google Sheet fail không corrupt order.
- [ ] Error được log rõ.
- [ ] Integration có unit test/mock.

### Dependency

BE-04 preferred.

---

## TASK ID: SEC-07

### Tên task
Review Token Blacklist Strategy

**Role:** Backend + Security  
**Priority:** P2  
**Severity:** Medium  
**Effort:** S/M  
**Status:** NEED VERIFY production topology

### Vấn đề

Token blacklist hiện dùng in-memory `Map`.

File:

```text
backend/src/modules/auth/token-blacklist.service.ts
```

### Ảnh hưởng

Nếu backend restart:

```text
blacklist memory mất
```

Nếu chạy nhiều backend instances:

```text
Instance A blacklist token
Instance B không biết
```

### Cần fix

Nếu MVP chỉ chạy 1 instance:

- Có thể chấp nhận ngắn hạn nếu access token TTL ngắn và tokenVersion được check đúng.

Nếu multi-instance:

- [ ] Dùng shared/persistent revocation strategy, hoặc
- [ ] thiết kế auth dựa vào short-lived access token + persisted session/token version.

Không bắt buộc thêm Redis nếu chưa cần.

### File/module liên quan

```text
backend/src/modules/auth/token-blacklist.service.ts
backend/src/modules/auth/auth.service.ts
JWT strategy
```

### Acceptance Criteria

- [ ] Document rõ security behavior sau restart.
- [ ] Multi-instance deployment không có inconsistent revocation.
- [ ] Logout/change-password behavior được test.

### Dependency

Need verify deployment topology.

---

# P3 — CÓ THỂ LÀM SAU

---

## TASK ID: DEVOPS-04

### Tên task
Pin Deployment Tool Versions

**Role:** DevOps  
**Priority:** P3  
**Severity:** Low  
**Effort:** S

### Vấn đề

Deploy workflow có cài tool dạng:

```text
vercel@latest
```

### Ảnh hưởng

Một major release mới có thể làm pipeline thay đổi ngoài ý muốn.

### Cần fix

- [ ] Pin Vercel CLI version.
- [ ] Upgrade chủ động qua PR.

### File/module liên quan

```text
.github/workflows/deploy.yml
```

### Acceptance Criteria

- [ ] Deployment tool version deterministic.

### Dependency

None.

---

## TASK ID: DEVOPS-05

### Tên task
Add Backup and Restore Runbook

**Role:** DevOps  
**Priority:** P3 / P1 nếu launch thật  
**Severity:** High nếu production data thật  
**Effort:** M

### Vấn đề

Chưa xác minh được quy trình backup/restore production.

**NEED VERIFY**

### Cần làm

- [ ] Define automatic database backup.
- [ ] Define retention.
- [ ] Define restore procedure.
- [ ] Test restore trên staging.
- [ ] Document recovery steps.
- [ ] Store backup credentials securely.

### Acceptance Criteria

- [ ] Restore test thành công.
- [ ] Team có runbook.
- [ ] Biết RPO/RTO mục tiêu.

### Dependency

Production DB architecture.

---

## TASK ID: PAY-01

### Tên task
Audit Payment Callback and Reconciliation

**Role:** Backend + QA + Security  
**Priority:** P3 / nâng lên P0-P1 nếu launch payment online  
**Severity:** High  
**Effort:** M/L  
**Status:** NEED VERIFY

### Vấn đề

Project có payment module và configuration cho payment providers, nhưng cần audit sâu callback/webhook trước production.

### Cần verify

- [ ] Signature verification.
- [ ] Callback replay protection.
- [ ] Amount verification.
- [ ] Order ownership/reference verification.
- [ ] Idempotent payment update.
- [ ] Double callback.
- [ ] Failed payment.
- [ ] Timeout.
- [ ] Payment success nhưng response client fail.
- [ ] Reconciliation job/report.

### File/module liên quan

```text
backend/src/modules/payments/*
backend/src/modules/orders/*
```

### Acceptance Criteria

- [ ] Forged callback bị reject.
- [ ] Duplicate callback không double-update.
- [ ] Amount mismatch bị reject.
- [ ] Payment status và order status đồng bộ theo business rule.

### Dependency

Nếu online payment được launch, phải ưu tiên trước release.

---

# BUSINESS / BA TASKS

---

## TASK ID: BA-01

### Tên task
Document Core Commerce Business Rules

**Role:** BA + Backend + QA  
**Priority:** P1  
**Effort:** M

### Vấn đề

Business logic đã có khá nhiều trong code, nhưng cần tài liệu chính thức để backend/QA/frontend không hiểu khác nhau.

### Cần document

#### Order

- [x] Khi nào được cancel? (Khách hủy khi PENDING; sau đó CSKH/Admin hủy).
- [x] Khi nào inventory restore? (Khi CANCELLED hoặc RETURNED).
- [x] Khi nào sold count tăng/giảm? (Tăng khi create order, giảm khi cancel/return).
- [x] Khi nào order `COMPLETED`? (Sau khi DELIVERED và khách nhận/hết 7 ngày đổi trả).
- [x] Return policy (Đổi trả trong 7 ngày đối với sách lỗi/hư hỏng, hoàn điểm loyalty nếu đã cộng).
- [x] Guest order access rule (Bắt buộc kèm x-guest-order-token, timingSafeEqual băm SHA-256).

#### Promotion

- [x] Usage limit (Kiểm tra quota usageLimit toàn sàn).
- [x] Per-user limit (Mặc định tối đa 1 lượt/khách hàng).
- [x] Min order (Kiểm tra subtotal >= minOrderValue).
- [x] Product/category exclusions (Giới hạn theo danh sách sản phẩm/danh mục).
- [x] Stack promotion hay không (Không stack voucher nếu quy định exclusive).
- [x] Promotion usage restore nếu cancel hay không (Tự động releaseUsage khi đơn CANCELLED).

#### Payment

- [x] COD flow (Chuyển PAID khi DELIVERED/COMPLETED).
- [x] bank transfer (Cú pháp VietQR TTxxxxxx, đối soát chuyển PAID).
- [x] online payment (VNPay/MoMo qua webhook IPN ký số HMAC-SHA256).
- [x] paid order cancellation/refund (Chỉ Admin/Staff hủy, hoàn tiền thủ công/cổng).

#### Inventory

- [x] Stock reserve khi nào? (Không giữ chỗ ảo; trừ trực tiếp khi tạo đơn).
- [x] Deduct khi create order hay confirmed? (Deduct nguyên tử ngay tại create order qua $inc gte).
- [x] Cancel restore khi nào? (Hoàn kho nguyên tử ngay khi CANCELLED).
- [x] Return restore hay không? (Có, ghi sổ kho InventoryTransactionType.RETURN).

### Acceptance Criteria

- [x] Có một business rules document (`docs/BUSINESS_RULES.md` chuẩn hóa).
- [x] QA test cases map theo rule (`src/common/guards/authorization-matrix.spec.ts`).
- [x] Backend transition validator map theo rule (`OrdersService.allowedTransitions`).

### Dependency

None.

---

# QA RELEASE CHECKLIST

Trước khi gọi production-ready, QA cần verify ít nhất:

## Authentication

- [ ] Login success.
- [ ] Invalid password.
- [ ] Refresh.
- [ ] Refresh reuse detection.
- [ ] Logout.
- [ ] Change/reset password invalidates old session.
- [ ] Customer cannot impersonate admin.

## Product

- [ ] Search.
- [ ] Filter.
- [ ] Pagination.
- [ ] Out-of-stock.
- [ ] Product deleted/disabled.
- [ ] Price manipulated from client is ignored.

## Cart / Checkout

- [ ] Add/remove/update quantity.
- [ ] Out-of-stock between cart and checkout.
- [ ] Promotion valid.
- [ ] Promotion expired.
- [ ] Promotion over limit.
- [ ] Shipping calculation.
- [ ] Guest checkout if supported.

## Order

- [ ] Successful create.
- [ ] Duplicate request.
- [ ] Concurrent stock.
- [ ] Cancel.
- [ ] Inventory restore.
- [ ] Status transition.
- [ ] Guest lookup.
- [ ] Wrong guest token blocked.

## Authorization

- [ ] Customer → admin API = forbidden.
- [ ] User A → User B order/address = forbidden.
- [ ] Staff permissions correct.
- [ ] Admin permissions correct.

## Security

- [ ] Refresh token not in localStorage.
- [ ] CORS denied for random origin.
- [ ] Swagger unavailable production unless explicitly enabled.
- [ ] Mongo port not public.
- [ ] Mongo Express not public.
- [ ] Secrets not in repo.

## Deployment

- [ ] Failing test blocks deployment.
- [ ] Production config validated.
- [ ] Health check works.
- [ ] Rollback procedure exists.

---

# SPRINT PLAN

## Sprint 1 — Security & Data Integrity

### Goal

Không để hệ thống bị compromise và không để sai stock/order.

### Tasks

- [ ] SEC-01 — Remove & Rotate Exposed Secrets
- [ ] DEVOPS-01 — Gate Deployment By CI
- [ ] SEC-02 — Secure Web Token Storage
- [ ] DEVOPS-02 — Lock MongoDB / Mongo Express
- [ ] BE-01 — Atomic Checkout & Inventory

### Exit Criteria

- [ ] No leaked production secrets.
- [ ] Refresh token không nằm localStorage.
- [ ] Mongo không public.
- [ ] CI fail không deploy.
- [ ] Concurrent checkout không oversell.

---

## Sprint 2 — Business Integrity & Authorization

### Tasks

- [x] BA-01 — Business Rules (Completed 2026-09-03)
- [ ] BE-02 — Order State Machine
- [ ] SEC-03 — Authorization Matrix Audit
- [x] QA-01 — Critical Commerce E2E (Token Isolation + Authorization Matrix Spec)
- [ ] SEC-04 — CORS Hardening
- [ ] SEC-05 — Swagger Restriction
- [ ] SEC-06 — CSP Hardening

### Exit Criteria

- [ ] Invalid order transitions bị block.
- [ ] Customer không gọi admin API.
- [ ] Core E2E green.
- [ ] Production origin whitelist rõ ràng.

---

## Sprint 3 — Maintainability & Performance

### Tasks

- [ ] FE-01 — Frontend Test Foundation
- [ ] FE-02 — Strong API Typing
- [ ] PERF-01 — Batch Product Query
- [ ] BE-03 — ProductService Refactor
- [ ] BE-04 — OrderService Refactor
- [ ] BE-05 — External Side-effect Decoupling
- [ ] OBS-01 — Request Correlation & Monitoring

### Exit Criteria

- [ ] Frontend core flow có automated tests.
- [ ] Order/Product service giảm coupling.
- [ ] Checkout query count giảm.
- [ ] Production errors trace được bằng request ID.

---

## Sprint 4 — Release Hardening

Nếu còn thời gian hoặc chuẩn bị launch thật:

- [ ] DEVOPS-03 — Dependency/Secret scanning
- [ ] DEVOPS-05 — Backup/Restore
- [ ] PAY-01 — Payment audit
- [ ] DB-01 — Index review
- [ ] SEC-07 — Token revocation topology
- [ ] Load test
- [ ] Smoke test
- [ ] Rollback test

---

# 5 TASK CTO NÊN GIAO ĐẦU TIÊN

Nếu team chỉ còn vài tuần, làm đúng 5 task đầu này:

## 1. SEC-01 — Rotate secrets

Lý do:

> Credential đã commit public thì phải xem như đã compromise.

---

## 2. DEVOPS-01 — CI phải chặn deploy

Lý do:

> Test có mà deploy vẫn chạy khi test fail thì test mất nhiều giá trị.

---

## 3. SEC-02 — Remove refresh token khỏi localStorage

Lý do:

> Đây là điểm yếu lớn nhất của authentication flow phía web hiện tại.

---

## 4. BE-01 — Atomic checkout / stock / promotion

Lý do:

> Sai stock và sai order là lỗi trực tiếp gây thiệt hại business.

---

## 5. SEC-03 + QA-01 — Authorization và critical E2E

Lý do:

> Sau khi security/data integrity được harden, cần bảo đảm regression không quay lại.

---

# NHỮNG THỨ KHÔNG NÊN LÀM LÚC NÀY

Không over-engineering.

Hiện tại **không nên ưu tiên**:

- Microservices.
- Kafka.
- Kubernetes.
- Event sourcing.
- CQRS.
- GraphQL migration.
- Đổi MongoDB sang PostgreSQL chỉ vì muốn "enterprise".
- Thêm Redis nếu chưa có nhu cầu thật.
- Elasticsearch nếu Mongo search hiện tại đáp ứng.
- Rewrite backend.
- Rewrite frontend.
- Recommendation AI.
- Advanced CRM.
- Complex BI.

Hệ thống hiện tại nên được **harden + refactor incremental**, không đập đi làm lại.

---

# DEFINITION OF DONE CHO MỖI TASK

Một task chỉ được đóng khi:

- [ ] Code đã merge.
- [ ] Không làm fail test hiện tại.
- [ ] Có test cho bug/rule mới nếu phù hợp.
- [ ] Type check/build pass.
- [ ] Không commit secret.
- [ ] Không thêm `any` mới vào core code nếu không cần.
- [ ] Error path đã được test.
- [ ] QA verify acceptance criteria.
- [ ] Nếu thay đổi business rule, docs được cập nhật.
- [ ] Nếu thay đổi environment/deployment, `.env.example` hoặc deployment docs được cập nhật.

---

# RELEASE GATE

Không nên gọi dự án **Production Ready** cho tới khi tối thiểu các điều kiện sau đạt:

- [ ] SEC-01 complete.
- [ ] SEC-02 complete.
- [ ] DEVOPS-01 complete.
- [ ] DEVOPS-02 complete.
- [ ] BE-01 complete.
- [ ] BE-02 complete.
- [ ] SEC-03 complete.
- [ ] QA-01 complete.
- [ ] FE-01 có baseline.
- [ ] Production Mongo transaction behavior verified.
- [ ] Backup/restore verified nếu có dữ liệu thật.
- [ ] Payment callback/reconciliation verified nếu bật payment online.
- [ ] No Critical security findings unresolved.

---

# CURRENT CTO VERDICT

Hiện trạng dự án:

```text
Prototype        ❌
MVP              ✅
Gần Production   ✅
Production Ready ❌
```

Điểm mạnh:

- Backend business flow khá đầy đủ.
- Validation tốt.
- Error handling có structure.
- JWT refresh rotation/reuse detection tốt.
- Server-side checkout recalculation đúng hướng.
- Có idempotency.
- Có inventory/order logic.
- Có CI backend/mobile.
- Architecture hiện tại phù hợp quy mô.

Điểm yếu lớn nhất:

```text
Security/deployment hardening
+
transaction/data integrity verification
+
frontend regression testing
+
large service maintainability
```

Hướng xử lý đúng:

```text
HARDEN
↓
TEST
↓
VERIFY BUSINESS RULE
↓
REFACTOR INCREMENTAL
↓
DEPLOY
```

Không rewrite và không thêm công nghệ mới nếu chưa có nhu cầu thực tế.
