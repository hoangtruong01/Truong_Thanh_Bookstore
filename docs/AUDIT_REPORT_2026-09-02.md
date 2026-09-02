# Báo cáo audit kỹ thuật — 2026-09-02

## Kết luận

**Overall health: 68/100 — NOT READY cho production.** Core backend/frontend/mobile đã build và các test hiện có đều pass; Docker smoke test thật cũng pass. Tuy nhiên release vẫn phải bị chặn bởi lint debt, cấu hình ký mobile, hardening database/backup và xác minh payment/E2E trên môi trường production-like.

## Phạm vi đã đối chiếu

- Toàn bộ cấu trúc repo, README và ba tài liệu trong `docs/`.
- Backend NestJS/Mongoose, web Vue/Vite, mobile Flutter, schemas/API contracts, Docker/CI/CD, test và SEO assets.
- Business rules đối chiếu: giá do server quyết định; miễn phí vận chuyển từ 299.000đ; guest/auth checkout; order state machine; promotion usage; atomic inventory.
- Không có framework migration riêng trong repo; MongoDB dùng schema/index của Mongoose.

## Phân loại kết quả

### ✅ DONE

- Auto-seed mặc định tắt; không còn tự suy đoán dữ liệu “sai” rồi xóa toàn DB. Reset cần cờ rõ ràng và bị cấm ở production.
- Seed password không còn hard-code; production config fail-closed khi JWT secret yếu/thiếu.
- Browser auth dùng HttpOnly cookies, access token mặc định 15 phút; mobile tiếp tục dùng bearer pair.
- Cookie mutations có CSRF header check; CORS production chỉ dùng exact allow-list; Swagger tắt mặc định ở production.
- WebSocket kiểm tra blacklist và `tokenVersion`, đồng bộ với HTTP JWT strategy.
- Order status + inventory/promotion/loyalty side effects chạy trong Mongo transaction; Compose chạy single-node replica set.
- MongoDB không publish host port; Mongo Express thuộc profile tùy chọn, bind localhost và bắt buộc credentials.
- Mobile có Android INTERNET permission, token chuyển sang secure storage, checkout có idempotency key, release không dùng debug signing.
- Frontend test runner/script khớp CI; test cart/auth đã khớp store contract thật.
- Private/cart/checkout routes có `noindex`; sitemap bỏ cart; socket URL có cấu hình riêng.
- Deploy workflow checkout đúng commit đã pass CI; các `|| true` ở lint/test/analyze đã bỏ.

### ⚠️ PARTIAL / ❌ MISSING / 🐛 BUG

- **P0 vận hành:** chưa thể rotate production secrets, bật DB authentication, backup/restore drill, firewall/Atlas allow-list hoặc GitHub branch protection từ source repo.
- **P1 payment:** provider online hiện là integration generic; chỉ nên bật COD cho tới khi sandbox contract/callback của từng cổng được chứng nhận.
- **P1 mobile release:** cần keystore thật và `android/key.properties`; build release hiện cố ý fail-closed nếu thiếu.
- **P2 CI/lint:** backend legacy lint còn hàng nghìn lỗi (full baseline: 3.686 problems). CI nay sẽ chặn deploy đúng thiết kế cho tới khi xử lý debt.
- **P2 test missing:** chưa có browser E2E thật và chưa có integration concurrency test chạy với Mongo thật; Flutter “E2E” hiện chủ yếu là widget/provider test, không gọi production-like API.
- **P2 dependency:** backend còn 2 moderate advisories từ `exceljs -> uuid`; auto-fix yêu cầu breaking downgrade nên không ép. Frontend audit = 0 nhưng hai dev transitive package cảnh báo engine Node 20.
- **P2 database:** Mongo Compose smoke test chưa bật authentication; production bắt buộc dùng authenticated URI.
- **P2 auth scale-out:** access-token blacklist đang ở memory từng process; triển khai nhiều instance cần Redis/shared revocation store.
- **P3 performance:** nhiều ảnh landing gần 0,9–1 MB; main JS gzip khoảng 164 KB. Cần image pipeline/WebP-AVIF và tiếp tục split bundle.
- **P3 SEO:** Vue SPA chưa SSR/prerender nên SEO product/landing vẫn kém crawler không chạy JavaScript.
- **P4 code quality:** còn `any` và mojibake tiếng Việt ở nhiều file legacy.

## Test và verification đã chạy thật

| Lệnh/kiểm tra | Kết quả |
| --- | --- |
| Backend `npm test -- --runInBand` | PASS — 22 suites, 253 tests |
| Backend CI suites `all-fixes`, `e2e-flow`, `critical-commerce-regression` | PASS — 3 suites, 20 tests; `--detectOpenHandles` sạch |
| Backend `npm run build` | PASS |
| Frontend `npm run test:unit` | PASS — 2 files, 6 tests |
| Frontend `npm run build` (gồm vue-tsc) | PASS |
| Flutter `flutter analyze` | PASS — no issues |
| Flutter `flutter test` | PASS — 16 tests |
| Flutter `flutter build apk --debug` | PASS |
| `docker compose config --quiet` với secrets kiểm thử | PASS |
| Docker build backend + frontend | PASS |
| Docker replica set/backend/frontend smoke | PASS; health/API/frontend = 200; production Swagger = 404 |
| npm audit sau fix | Frontend: 0; backend: 2 moderate, 0 high |
| Backend ESLint | FAIL — legacy lint debt; deploy phải tiếp tục bị chặn |
| Migration | N/A — repo không có migration runner |

## File/thành phần thay đổi chính

- Security/config: `backend/src/main.ts`, auth controller/module, sanitizer middleware/tests, notification gateway, `.env.example`.
- Data integrity: seed service/tests, order service/tests, product/user service, `docker-compose.yml`.
- Web: auth API/store, frontend unit tests/config/scripts, router/SEO/robots/sitemap/socket config.
- Mobile: auth/order providers, secure-storage dependency, Android manifest/signing config và generated registrants.
- DevOps/docs: CI/deploy/mobile/release workflows, README, `PROJECT_OVERVIEW.md`, `AUDIT_FIX_TASKS.md`, báo cáo này.

## Release gate đề xuất

Chỉ đổi sang **READY WITH MINOR ISSUES** sau khi: backend lint pass; test concurrency dùng Mongo thật pass; browser checkout/auth E2E pass; production secrets/DB auth/backup/branch protection được xác nhận; mobile release ký bằng key thật; payment provider bật nào thì sandbox contract của provider đó phải pass.
