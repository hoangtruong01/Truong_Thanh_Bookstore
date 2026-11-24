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
| **R2 — Social & Measurement**| 9 | 9 (`SOC-01`..`05`, `ADS-01`..`03`, `QA-02`) | 0 | 0 | 0 |
| **R3 — Channel Pilot** | 5 | 5 (`CHN-01`..`04`, `QA-03`) | 0 | 0 | 0 |
| **R4 — Optimization** | 2 | 0 | 0 | 0 | 2 |
| **Tổng cộng** | **41** | **29** | **9** | **1** | **2** |

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
| `SOC-01` | Quản lý kết nối & Capabilities MXH | R2 | P2 | **DONE** | `social-account.schema.ts`, mã hóa AES-256 token, safe disconnect | Không | Hoàn tất |
| `SOC-02` | Trợ lý nội dung AI từ sản phẩm | R2 | P2 | **DONE** | `social.service.ts:generateContentFromProduct`, canonical link, UTM | Không | Hoàn tất |
| `SOC-03` | Duyệt, lên lịch, đăng bài & Rule D03 | R2 | P2 | **DONE** | State machine, auto-revert DRAFT khi sửa bài duyệt, `recordManualPost` | Không | Hoàn tất |
| `SOC-04` | Đo lường hiệu quả bài viết MXH | R2 | P2 | **DONE** | Schema `SocialPost` metrics, CTR, impression, clicks | Không | Hoàn tất |
| `SOC-05` | Kịch bản video ngắn TikTok 30s | R2 | P2 | **DONE** | Hook, body points, CTA checklist, TikTok script template | Không | Hoàn tất |
| `ADS-01` | Đo lường Meta Ads read-only & ROAS | R2 | P2 | **DONE** | `AdsPerformance` schema, compound index dedup, `getBlendedRoas` | Không | Hoàn tất |
| `ADS-02` | GA4 / Meta Pixel & CAPI Consent | R2 | P2 | **DONE** | `pixelConsent.ts`, consent mode gating, dedup `event_id` | Không | Hoàn tất |
| `ADS-03` | TikTok Pixel / Events API | R2 | P2 | **DONE** | `pixelConsent.ts:dispatchPixelEvent`, safe non-essential drops | Không | Hoàn tất |
| `QA-02` | Quality gate & Sandbox verification | R2 | P2 | **DONE** | 102 backend test suites PASS (1269 tests), 67 frontend suites PASS (471 tests) | Không | Hoàn tất |
| `CHN-01` | Channel account model & credentials | R3 | P3 | **DONE** | `ChannelAccount` schema, AES-256 encrypted app secrets, unique `{provider, shopId}` index | Không | Hoàn tất |
| `CHN-02` | SKU mapping & inventory sync | R3 | P3 | **DONE** | `ChannelSkuMapping` schema, packMultiplier, `Math.floor(stock/packMultiplier)`, outbox push | Không | Hoàn tất |
| `CHN-03` | Webhook inbox & order import | R3 | P3 | **DONE** | `ChannelWebhookInbox` schema, HMAC-SHA256 verification, deduplication, `OrderSource.TIKTOK_SHOP`, quarantine queue | Không | Hoàn tất |
| `CHN-04` | Settlement reconciliation | R3 | P3 | **DONE** | `ChannelSettlement` schema, gross/fee/net vs internal orders, discrepancy detection | Không | Hoàn tất |
| `QA-03` | Omnichannel test suite & simulator | R3 | P3 | **DONE** | `sales-channels.service.spec.ts` (9 tests), `SalesChannelsContract.spec.ts` (4 tests), 103 backend / 68 frontend suites PASS | Không | Hoàn tất |
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


---

## 5. KẾT QUẢ TRIỂN KHAI RELEASE R2 — SOCIAL & MEASUREMENT

> **Hoàn tất triển khai ngày:** 24/11/2026  
> **Phạm vi hoàn tất:** `SOC-01` đến `SOC-05`, `ADS-01` đến `ADS-03`, và `QA-02`.

### 5.1. Backend Module Marketing Social (`SOC-01`..`SOC-05`)
- **Tài khoản mạng xã hội (`SocialAccount`):**
  - Quản lý trạng thái (`NOT_CONNECTED`, `CONNECTED`, `NEEDS_REAUTH`, `DISCONNECTED`).
  - Access token được mã hóa bảo mật AES-256 (khóa 256-bit + IV độc lập); không bao giờ log hoặc trả về client.
- **Quy trình bài viết & Trạng thái (`SocialPost` + Rule D03):**
  - State machine: `DRAFT` $\rightarrow$ `PENDING_APPROVAL` $\rightarrow$ `APPROVED` $\rightarrow$ `SCHEDULED` $\rightarrow$ `PUBLISHED` / `MANUAL_RECORDED`.
  - **Rule D03:** Nếu bài viết đã ở trạng thái `APPROVED` nhưng nội dung bị chỉnh sửa, hệ thống tự động đưa về `DRAFT` để kiểm duyệt lại, bảo vệ uy tín thương hiệu.
  - Quy trình `MANUAL_RECORDED`: Hỗ trợ nhân viên đăng trực tiếp bằng ứng dụng chính thức của Meta/TikTok và ghi nhận permalink thực tế vào hệ thống.
- **Trợ lý nội dung AI (`SOC-02`, `SOC-05`):**
  - Trích xuất dữ liệu sản phẩm thật từ kho (tên, mã SKU, giá bán thực tế, khuyến mãi, ảnh sản phẩm).
  - Tự động sinh nội dung Facebook chuẩn và kịch bản video ngắn TikTok 30s với Hook, 3 điểm nhấn chính và CTA.
  - Tự động tạo Canonical URL kèm UTM tags (`utm_source`, `utm_medium`, `utm_campaign`).

### 5.2. Backend Module Ads & Đo lường (`ADS-01`, `ADS-02`, `ADS-03`)
- **Đo lường hiệu quả quảng cáo (`AdsPerformance`):**
  - Compound unique index `{ platform: 1, adAccountId: 1, campaignId: 1, date: 1 }` đảm bảo tính lũy tích, chống trùng lặp dữ liệu khi đồng bộ hàng ngày.
  - Tự động tính toán các chỉ số tổng hợp: Tổng chi tiêu, Lượt hiển thị, Lượt click, CTR trung bình, CPC trung bình.
  - Hỗ trợ gán mã chiến dịch ngoài (External Campaign ID) với mã chiến dịch nội bộ (`internalCampaignCode`).
- **Tính toán Blended ROAS:**
  - Đối chiếu doanh thu đơn hàng thực tế chốt qua UTM (`Order.attribution.campaignCode`) với chi phí quảng cáo để tính toán Blended ROAS chính xác.

### 5.3. Frontend & Pixel Consent Management
- **Quản lý Consent (`frontend/src/utils/pixelConsent.ts`):**
  - Kiểm soát sự đồng ý (Consent Mode) cho GA4, Meta Pixel và TikTok Pixel; không kích hoạt tracking khi khách hàng chưa đồng ý.
  - Hàm `generateEventId()` sinh ID sự kiện duy nhất để deduplication giữa browser pixel và server-side CAPI / Outbox.
- **Admin Social & Measurement Center (`SocialPosts.vue` tại `/admin/marketing/social`):**
  - 4 Tab chức năng: Bài viết & Kịch bản, Trợ lý AI từ sản phẩm, Kênh kết nối & Quyền, Hiệu quả Quảng cáo & ROAS.
  - Tích hợp vào `AdminLayout.vue` và router hệ thống.

### 5.4. Kết quả Quality Gate (QA-02)
- **Backend Test Suite:** 102/102 test suites PASS (1,269 tests passed).
- **Backend Lint & Build:** 0 lỗi, compilation NestJS thành công.
- **Frontend Test Suite:** 67/67 test suites PASS (471 tests passed).
- **Frontend Lint & Build:** 0 lỗi, TypeScript typecheck và Vite build thành công.

---

## 6. KẾT QUẢ TRIỂN KHAI RELEASE R3 — CHANNEL PILOT: TIKTOK SHOP & OMNICHANNEL COMMERCE

> **Hoàn tất triển khai ngày:** 24/11/2026  
> **Phạm vi hoàn tất:** `CHN-01` đến `CHN-04` và `QA-03`.

### 6.1. Backend Module Sales Channels (`CHN-01`..`CHN-04`)
- **Mô hình tài khoản Kênh bán (`ChannelAccount` - CHN-01):**
  - Quản lý kết nối kênh ngoài (`TIKTOK_SHOP`, `SHOPEE`, `LAZADA`).
  - Index duy nhất compound `{ provider: 1, shopId: 1 }` đảm bảo tính toàn vẹn.
  - Secret và Access Token được mã hóa AES-256 an toàn bằng thuật toán mã hóa đối xứng; cấu hình kho hàng liên kết (`warehouseId`).
- **Ánh xạ SKU & Tỷ lệ đóng gói quy đổi (`ChannelSkuMapping` - CHN-02):**
  - Index duy nhất `{ provider: 1, shopId: 1, externalSkuId: 1 }`.
  - Hỗ trợ tỷ lệ đóng gói `packMultiplier`: Tồn kho sàn khả dụng = `Math.floor(internalStock / packMultiplier)`.
  - Cơ chế đồng bộ tồn kho nguyên tử tự động ghi sự kiện Outbox `INVENTORY_SYNC_PUSHED`.
- **Hộp thư Webhook & Tiếp nhận đơn hàng sàn (`ChannelWebhookInbox` - CHN-03):**
  - Xác thực chữ ký HMAC-SHA256 (`x-tts-signature`) trước khi xử lý webhook.
  - Deduplication chặt chẽ theo compound unique index `{ provider: 1, eventId: 1 }`: Webhook trùng lặp được phát hiện ngay lập tức trước khi ACK để đảm bảo tính Idempotent.
  - Tự động tạo đơn hàng lõi với `orderSource: OrderSource.TIKTOK_SHOP`, liên kết `externalOrderId` và trừ kho nội bộ theo `packMultiplier`.
  - Cơ chế cách ly lỗi (`ChannelException`): Nếu đơn sàn chứa SKU chưa ánh xạ (`UNKNOWN_SKU`) hoặc không đủ tồn kho (`INSUFFICIENT_STOCK`), hệ thống tự động cách ly vào hàng đợi ngoại lệ mà không làm crash luồng đơn.
  - Tuân thủ bảo mật PII: Không ghi log thông tin khách hàng nhạy cảm (SĐT, địa chỉ chi tiết) ra file log.
- **Đối soát Doanh thu & Bảng kê thanh toán Sàn (`ChannelSettlement` - CHN-04):**
  - Quản lý kỳ đối soát: Doanh số sàn báo (Gross Sales), Phí sàn (Platform/Commission/Shipping Fees), Thực nhận ngân hàng (Net Settlement).
  - Tự động đối chiếu với tổng doanh thu đơn hàng sàn nội bộ trong cùng kỳ.
  - Tự động phát hiện sai lệch và gắn cờ `RECONCILED` (nếu chênh lệch bằng 0) hoặc `DISCREPANCY` (nếu lệch số liệu) để kế toán xử lý.

### 6.2. Frontend Admin Sales Channels Management Center
- **Giao diện Quản lý Kênh Bán Hàng (`SalesChannels.vue` tại `/admin/sales-channels`):**
  - 4 Tab chức năng:
    1. *Ánh xạ SKU & Tồn kho*: Quản lý danh sách SKU, xem tỷ lệ đóng gói, tồn khả dụng, kích hoạt đồng bộ tức thì.
    2. *Hộp thư Webhook & Đơn hàng sàn*: Hàng đợi đơn hàng cách ly (`Quarantined Exceptions`) kèm nút xử lý xong, tích hợp Sandbox Simulator mô phỏng webhook `ORDER_CREATED` và `ORDER_CANCELLED`.
    3. *Đối soát doanh thu sàn*: Bảng đối soát số liệu Gross/Fee/Net vs Đơn nội bộ kèm trạng thái so khớp.
    4. *Cấu hình Kênh bán*: Quản lý tài khoản kết nối, trạng thái và kho hàng liên kết.
  - Đã đăng ký route `/admin/sales-channels` và menu navigation trong `AdminLayout.vue`.

### 6.3. Kết quả Quality Gate (QA-03)
- **Backend Test Suite:** 103/103 test suites PASS (1,278 tests passed bao gồm 9 tests cho `sales-channels.service.spec.ts`).
- **Backend Lint & Build:** 0 lỗi, compilation NestJS thành công.
- **Frontend Test Suite:** 68/68 test suites PASS (475 tests passed bao gồm 4 tests cho `SalesChannelsContract.spec.ts`).
- **Frontend Lint & Build:** 0 lỗi, TypeScript typecheck (`vue-tsc`) và Vite build thành công.

