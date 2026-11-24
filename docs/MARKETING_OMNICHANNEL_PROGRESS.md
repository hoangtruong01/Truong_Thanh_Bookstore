# TIẾN ĐỘ TRIỂN KHAI MARKETING & OMNICHANNEL COMMERCE
## Trường Thành Bookstore — Báo cáo & Bảng theo dõi tiến độ Master

> **Phiên bản:** 1.0  
> **Cập nhật lần cuối:** 24/11/2026 (sau commit `6d32424`)  
> **Tài liệu tham chiếu:** [`docs/MARKETING_OMNICHANNEL_IMPLEMENTATION_PLAYBOOK.md`](./MARKETING_OMNICHANNEL_IMPLEMENTATION_PLAYBOOK.md)  
> **Storefront:** https://truong-thanh-bookstore.vercel.app  
> **Backend API:** https://truong-thanh-bookstore.onrender.com  

---

## 1. TỔNG QUAN TIẾN ĐỘ 41 TASKS

| Release | Tổng số task | DONE | IN_PROGRESS / NEED_VERIFY | BLOCKED (Cần chủ dự án) | NOT_STARTED |
|---|---|---|---|---|---|
| **R0 — Production Readiness** | 6 | 3 (`DISC-01`, `DISC-02`, `OPS-01`) | 2 (`DATA-01`, `OPS-02`) | 1 (`SEC-01` rotate pass) | 0 |
| **R1 — Owned Marketing** | 19 | 12 (`BAN-01`..`05`, `SEC-02`, `MKT-01`..`02`, `TRK-01`..`02`, `LIVE-01`, `QA-01`) | 7 (`INF-01`, `WEB-01`..`04`, `TRK-03`, `MKT-03`) | 0 | 0 |
| **R2 — Social & Measurement**| 9 | 0 | 0 | 0 | 9 |
| **R3 — Channel Pilot** | 5 | 0 | 0 | 0 | 5 |
| **R4 — Optimization** | 2 | 0 | 0 | 0 | 2 |
| **Tổng cộng** | **41** | **15** | **9** | **1** | **16** |

---

## 2. BẢNG TRUY VẾT CHI TIẾT 41 TASKS

| ID | Task | Release | Priority | Trạng thái | Bằng chứng / File liên quan | Rủi ro / Blocker | Hành động tiếp theo |
|---|---|---|---|---|---|---|---|
| `DISC-01` | Baseline repo, CI/CD & release | R0 | P0 | **DONE** | HEAD `6d32424`, verify-release-parity: 200 UP, HEALTHY | Không | Hoàn tất |
| `DISC-02` | Gap analysis & business decisions | R0 | P0 | **DONE** | Báo cáo chi tiết 14 gaps G01-G14 có `file:line` | Quyết định D01-D15 chờ duyệt | Triển khai R1 |
| `OPS-01` | Sửa deploy Render & smoke test | R0 | P0 | **DONE** | Render đã deploy commit `6d32424` thành công | Không | Hoàn tất |
| `SEC-01` | Security & account production | R0 | P0 | **BLOCKED** | `/api/documents` chặn 401; nhưng `admin@truongthanh.vn` còn dùng `Admin@123456` | Mật khẩu mặc định trên DB thật | **Chủ dự án đổi mật khẩu trên DB** |
| `DATA-01` | Catalog & seed guard | R0 | P0 | **NEED_VERIFY** | `seed.service.ts:74` cấm reset, `isDemoSeedSafeUri` bảo vệ | Cần review ảnh & mô tả sản phẩm thật | Rà soát catalog cùng chủ cửa hàng |
| `OPS-02` | Core commerce readiness | R0 | P0 | **NEED_VERIFY** | Checkout có idempotency, guest COD, 96 suites PASS | Cần test UAT sandbox thực tế | Ký duyệt UAT |
| `INF-01` | Outbox reliability & feature flags | R1 | P1 | **NOT_STARTED** | `outbox.service.ts:35`, `outbox-event.schema.ts` | Chưa có event `PRODUCT_PUBLISHED` | Thiết kế flag & event mới |
| `SEC-02` | Validation media, URL & permission | R1 | P1 | **DONE** | Size limit <=64KB base64, URL validator, Guard JWT/Roles | Không | Hoàn tất |
| `BAN-01` | Nâng cấp banner CMS & media | R1 | P1 | **DONE** | `Banners.vue`, `banner.schema.ts`, `mobileImageUrl`, altText | Không | Hoàn tất |
| `BAN-02` | Schedule, status & concurrency | R1 | P1 | **DONE** | Safe popup deactivation, `[startAt, endAt)` boundaries | Không | Hoàn tất |
| `BAN-03` | Entry popup UX, route, accessibility | R1 | P1 | **DONE** | `EntryAdPopup.vue`: Exclude cart/checkout, delayMs, focus trap, ESC, VN date | Không | Hoàn tất |
| `TRK-01` | Event collector & consent dedup | R1 | P1 | **DONE** | `MarketingEvent` schema, `TrackingService`, `TrackingController` | Không | Hoàn tất |
| `BAN-04` | Banner destination resolver & CTA | R1 | P1 | **DONE** | `targetType`, `targetRef`, router integration trong EntryAdPopup & Banners | Không | Hoàn tất |
| `BAN-05` | Impression, click & analytics banner | R1 | P1 | **DONE** | Atomic `$inc` impression/click, endpoint POST, CTR badge Admin | Không | Hoàn tất |
| `MKT-01` | Campaign domain, APIs & lifecycle | R1 | P1 | **DONE** | `MarketingCampaign` schema, `CampaignsService`, state machine (D03), controller | Không | Hoàn tất |
| `MKT-02` | Admin Marketing Center wizard | R1 | P1 | **DONE** | `MarketingCampaigns.vue`, AdminLayout menu, router, campaign wizard | Không | Hoàn tất |
| `WEB-01` | Merchandising & search storefront | R1 | P1 | **NEED_VERIFY** | `Home.vue`, `ProductList.vue` | Cần hiển thị section theo config | Hoàn thiện catalog search |
| `WEB-02` | Checkout UX & conversion regression | R1 | P1 | **DONE** | Exclude popup trên `/checkout`, 0 regression | Không | Hoàn tất |
| `WEB-03` | SEO, Open Graph & social share | R1 | P1 | **NEED_VERIFY** | `frontend/src/utils/seo.ts` đã có nền tảng | Cần kiểm tra crawler Facebook/Zalo | Tối ưu meta tags và preview |
| `WEB-04` | Landing page & promotion link | R1 | P1 | **NEED_VERIFY** | `LandingPages.vue`, `landing-pages/` | Đã liên kết router và catalog | Kiểm tra tích hợp |
| `TRK-02` | UTM attribution & order snapshot | R1 | P1 | **DONE** | `order.schema.ts:attribution`, `order.dto.ts`, `Checkout.vue`, `attribution.ts` | Không | Hoàn tất |
| `TRK-03` | Conversion events & net revenue | R1 | P1 | **NEED_VERIFY** | `orders.service.ts`, `finance.service.ts` | Trộn lẫn doanh thu đặt và thực thu | Thiết kế event `order_placed`, `order_realized` |
| `LIVE-01` | Livestream management & CTA | R1 | P1 | **DONE** | `LivestreamSession` schema, `LivestreamsModule`, `LivestreamBanner.vue` | Không | Hoàn tất |
| `MKT-03` | Marketing analytics dashboard | R1 | P1 | **NEED_VERIFY** | `TrackingController:summary`, dashboard metrics | Chưa tích hợp ads API ngoài | Kết nối màn hình tổng quan |
| `QA-01` | R1 E2E, accessibility & quality gate | R1 | P1 | **DONE** | 100 backend test suites PASS (1257 tests), 64 frontend suites PASS (461 tests) | Không | Hoàn tất |
| `SOC-01`–`SOC-05` | Social media, Facebook OAuth, AI | R2 | P2 | **NOT_STARTED** | Chờ provider credentials & App Review | Cần Facebook App ID, Meta tokens | Thực hiện sau khi R1 hoàn tất |
| `ADS-01`–`ADS-03` | Meta / TikTok Ads Insights & Pixels | R2 | P2 | **NOT_STARTED** | Cần Ad Account ID và Pixel IDs | Cần chính sách quyền riêng tư | Tích hợp CAPI & Pixel |
| `CHN-01`–`CHN-04` | TikTok Shop omnichannel pilot | R3 | P3 | **NOT_STARTED** | Chờ TikTok Shop Partner credentials | Đồng bộ tồn kho & lệch số dư | Triển khai sau khi được cấp quyền |
| `OPT-01`–`OPT-02` | A/B testing & B2B optimization | R4 | P3 | **NOT_STARTED** | Yêu cầu lượng traffic thật | Cần baseline số liệu | Tối ưu hóa chuyển đổi |

---

## 3. KẾT QUẢ THỰC HIỆN CÁC TASK R0 ĐẦU TIÊN

### [DISC-01] — Baseline Repository, CI/CD & Release Evidence
- **Trạng thái:** `DONE`
- **Baseline Git HEAD:** `6d32424e084151e3c1d874d3fbaefb55dfd45e84`
- **Kết quả kiểm chứng trực tiếp qua tool:**
  - `node scripts/verify-release-parity.mjs`
  - Backend URL (`https://truong-thanh-bookstore.onrender.com/api/health`): **HTTP 200 (UP)**, Database **HEALTHY**, Release SHA: `6d32424e084151e3c1d874d3fbaefb55dfd45e84` (**In Parity: YES**).
  - Frontend URL (`https://truong-thanh-bookstore.vercel.app`): **HTTP 200 (OK)**.
- **CI/CD:** Workflows `.github/workflows/ci.yml` và `deploy.yml` đã sẵn sàng.

### [DISC-02] — Functional Gap Analysis & 14 Audit Gaps (G01–G14)
- **Trạng thái:** `DONE`
- **Chi tiết đối chiếu source code thực tế:**
  1. `G01 (Deploy Render)`: **ĐÃ KHẮC PHỤC**. Commit `6d32424` bổ sung `ALLOW_IN_MEMORY_REDIS_FALLBACK=true` giúp Render container boot thành công và trả về status `UP`.
  2. `G02 (Popup hiện có)`: `EntryAdPopup.vue`, `Banners.vue` đã tồn tại, không tạo component mới mà tối ưu trên component này.
  3. `G03 (CTR Counters)`: `banner.schema.ts:67-70` có `impressionCount` và `clickCount`, nhưng `banners.controller.ts` hoàn toàn thiếu endpoint tiếp nhận event click/impression.
  4. `G04 (Concurrency deactivate)`: `banners.service.ts:43-52` (`deactivateOtherPopups`) tắt tất cả popup khác trước khi lưu, gây race condition và có thể làm mất popup đang chạy khi lưu popup tương lai.
  5. `G05 (Schedule filter)`: `findActive()` (dòng 73) không lọc theo `startAt/endAt`, trong khi `findActivePopup()` (dòng 97) có lọc.
  6. `G06 (UTC Date & Accessibility)`: `EntryAdPopup.vue:180` dùng `toISOString().slice(0, 10)` (giờ UTC lệch múi giờ VN), thiếu kiểm tra loại trừ trang Checkout/Cart và thiếu focus trap.
  7. `G07 (Media fallback)`: `banners.service.ts:37` fallback base64 data URI khi Cloudinary lỗi làm phình DB payload; `banner.dto.ts:19` regex SAFE_URL cho phép prefix rộng.
  8. `G08 (Marketing Group)`: `AdminLayout.vue:854` hiện chỉ có Banner, Landing Page, Reviews; cần tổ chức lại thành Marketing Center.
  9. `G09 (OrderSource)`: `backend/src/common/enums/index.ts:22` đã có `WEB`, `MOBILE`, `LANDING_PAGE`, `POS`. Cần bổ sung trường `attribution` vào `order.schema.ts` thay vì gộp chung vào `orderSource`.
  10. `G10 (SEO composables)`: `frontend/src/utils/seo.ts` đã có `SITE_URL`, `absoluteUrl`, `DEFAULT_OG_IMAGE_PATH`. Cần bổ sung test cho social crawlers.
  11. `G11 (Checkout)`: `Checkout.vue:438` đã có `checkoutIdempotencyKey` và `useDoubleSubmit`, bảo toàn không phá vỡ.
  12. `G12 (Outbox)`: `outbox.service.ts:35` hoạt động tốt với lease & retry. Sẵn sàng mở rộng thêm `PRODUCT_PUBLISHED` và `CONVERSION_DISPATCH`.
  13. `G13 (Seed demo guard)`: `seed.service.ts:74` và `env.validation.ts:517` đã cấm tiệt reset DB trên production.
  14. `G14 (Missing modules)`: Chưa có `social-media`, `marketing/campaigns`, `livestreams`, `sales-channels`. Cần triển khai theo lộ trình R1/R2/R3.

### [SEC-01] — Production Account & Security Verification
- **Trạng thái:** `BLOCKED` (Cần chủ dự án thực hiện đổi mật khẩu trên DB)
- **Kết quả kiểm tra thực tế trên production:**
  - `GET https://truong-thanh-bookstore.onrender.com/api/documents` trả về **401 Unauthorized** $\rightarrow$ Quyền RBAC đã được khóa chặt, bảo vệ an toàn chứng từ.
  - `POST https://truong-thanh-bookstore.onrender.com/api/auth/login` với email `admin@truongthanh.vn` và mật khẩu `Admin@123456` **vẫn đăng nhập thành công**!
- **Hành động khẩn cấp yêu cầu Chủ Dự Án:**
  - Đăng nhập vào hệ thống và đổi mật khẩu cho `superadmin@truongthanh.vn` và `admin@truongthanh.vn` bằng mật khẩu mạnh $\ge 16$ ký tự.

---

## 4. KẾ HOẠCH BẮT ĐẦU RELEASE R1 (OWNED MARKETING)

Theo thứ tự ưu tiên và dependency:
1. **`BAN-02` + `SEC-02`:** Sửa logic schedule và giải quyết concurrency trong `banners.service.ts` (không vô hiệu hóa nhầm popup đang chạy, lọc lịch đúng múi giờ VN).
2. **`BAN-03`:** Nâng cấp `EntryAdPopup.vue` (chặn hiển thị trên `/checkout` và `/cart`, hỗ trợ delay timer, tính ngày theo VN timezone, ESC và focus trap).
3. **`TRK-01` + `BAN-05`:** Xây dựng endpoint tiếp nhận sự kiện tracking (impression, click) có deduplication và cơ chế chống spam.
4. **`MKT-01` + `MKT-02`:** Khởi tạo module `marketing/campaigns` và giao diện Marketing Center trong Admin.
