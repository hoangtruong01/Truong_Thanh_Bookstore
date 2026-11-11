# SEO Audit & Optimization — Trường Thành Bookstore

> Audit: 2026-11-03 · Triển khai & kiểm thử: 2026-11-10
> **Trạng thái:** đã sửa và kiểm thử SEO-TASK-001 → 010 và **SEO-TASK-011 (sitemap động)**. Việc còn lại liệt kê ở mục 11.
> Thay đổi **chưa được commit** (chờ người dùng review).

---

## 1. Executive SEO Summary

Storefront là **Vue 3 SPA render phía client (CSR)**. Đợt này đã sửa toàn bộ lỗi P0 trong phạm vi an toàn:

| Vấn đề | Trước | Sau | Kiểm chứng |
|---|---|---|---|
| Canonical | `index.html` gắn cứng canonical/og:url về trang chủ cho **mọi URL** | Mỗi trang có canonical riêng; HTML tĩnh không còn canonical sai | e2e SEO-TEST-004/017 |
| Danh mục | Mọi `/products?category=…` có canonical `/products`, không có H1/title riêng | Canonical giữ `category`, có H1/title/description lấy từ dữ liệu danh mục | e2e SEO-TEST-003 |
| Tìm kiếm nội bộ | `index, follow` | `noindex, follow`, không có canonical | e2e SEO-TEST-018 |
| JSON-LD Product | Rating có thể ra `reviewCount: 0`; brand bịa "Trường Thành"; 1 ảnh; description còn markdown | Rating = đúng con số hiển thị (trung bình review thật); không bịa brand; ảnh tuyệt đối; schema Book (ISBN, tác giả, NXB); thêm `offers.url`, `itemCondition` | unit + e2e SEO-TEST-007 |
| Soft-404 | 404, sản phẩm không tồn tại hoặc INACTIVE vẫn `index, follow` | `noindex`, gỡ canonical và Product schema | e2e SEO-TEST-010/016 |
| Review trên URL slug | Hỏng (dùng slug như ObjectId) | Dùng `product._id` | e2e (kiểm tra request) |
| Link nội bộ | `/products/{_id}` trong khi canonical là slug | `/products/{slug}` (URL `_id` cũ vẫn chạy) | e2e + regression |
| Thẻ cũ khi điều hướng SPA | Trang sau thừa hưởng canonical, mô tả, JSON-LD của trang trước | Router reset head mỗi lần đổi route | e2e SEO-TEST-004 |
| H1 | Màn splash lúc xác thực có thêm một `<h1>`; ProductList không có H1 | Mỗi trang 1 H1 | e2e SEO-TEST-013 |

| Sitemap | File tĩnh 3 URL | Sitemap động từ DB: 153 URL thật trên dữ liệu local (121 sản phẩm, 27 danh mục, 1 landing page) | Jest + gọi endpoint thật |

**Chưa làm (cần duyệt):** prerender/SSR cho bot mạng xã hội, trust proxy cho rate limit, ảnh base64, URL phân trang. Xem mục 11.

Không cam kết thứ hạng hay traffic: chưa có dữ liệu Search Console hoặc GA4.

---

## 2. Tech Stack & SEO Architecture

| Hạng mục | Thực tế | Ảnh hưởng SEO |
|---|---|---|
| Frontend | Vue 3 + Vite + vue-router (`createWebHistory`), CSR | Googlebot render được JS; bot mạng xã hội (Facebook, Zalo) chỉ thấy meta tĩnh trong `index.html` |
| Deploy | Vercel: mọi path → `/index.html`, `/api/*` → Render; Docker dùng nginx `try_files` | Mọi URL trả HTTP 200 → giảm thiểu soft-404 bằng `noindex` |
| Metadata | `utils/seo.ts` (mới) + `composables/useSeoMeta.ts` + `router.afterEach` → `resetSeoForRoute` | Một nguồn thống nhất; trang nào gọi `useSeoMeta` thì ghi đè lên mặc định |
| JSON-LD | `composables/useStructuredData.ts`: Organization, WebSite, Product/Book, BreadcrumbList | Hàm `build*Schema` thuần, có unit test |
| Domain | `VITE_SITE_URL` (fallback `https://truong-thanh-bookstore.vercel.app`) | Đổi domain chỉ cần đổi biến môi trường; còn sót trong `index.html` và `robots.txt` (xem TASK-016) |
| URL sản phẩm | `/products/:id`, backend nhận cả `_id` lẫn `slug` | Link nội bộ và canonical cùng dùng slug |
| URL danh mục | `/products?category=<ObjectId>` | Đã có canonical riêng; route thân thiện để sau (TASK-015) |

---

## 3. Current SEO Status

**Đã có (sau đợt này):**
- Title, description, canonical, robots riêng cho từng loại trang.
- Open Graph và Twitter dùng ảnh JPG tuyệt đối; JSON-LD Product/Book/Breadcrumb/Organization/WebSite đúng dữ liệu thật.
- `noindex` cho 404, sản phẩm lỗi/INACTIVE, tìm kiếm, trang riêng tư.
- 1 H1 mỗi trang; alt ảnh sản phẩm.
- Test tự động: unit + Playwright.

**Chưa có:** URL phân trang crawl được, prerender cho bot mạng xã hội, GA4 và Search Console verification, trang tác giả/NXB.

**Chưa xác minh được:** Core Web Vitals thực tế (CrUX), dữ liệu Search Console, search volume từ khóa.

---

## 4. Technical SEO Findings

| ID | Mức | Vấn đề | Trạng thái |
|---|---|---|---|
| TECH-01 | P0 | Canonical/og:url/twitter:url gắn cứng về trang chủ | ✅ FIXED – VERIFIED |
| TECH-02 | P1 | Bot không chạy JS chỉ thấy meta trang chủ cho mọi URL | ⏳ TODO (TASK-014, cần duyệt) |
| TECH-03 | P1 | Danh mục/tìm kiếm gộp canonical về `/products`; tìm kiếm vẫn index | ✅ FIXED – VERIFIED |
| TECH-04 | P1 | Soft-404 (NotFound, sản phẩm lỗi, sản phẩm INACTIVE) | ✅ FIXED – VERIFIED (noindex; HTTP vẫn 200 do kiến trúc SPA) |
| TECH-05 | P2 | Landing page, Wishlist, OrderDetail, admin thừa hưởng head của trang trước | ✅ FIXED – VERIFIED |
| TECH-06 | P2 | og:image mặc định là SVG, đường dẫn tương đối | ✅ FIXED – VERIFIED (`/logo.jpg` tuyệt đối) |
| TECH-07 | P2 | Title trang chủ chỉ có tên thương hiệu | ✅ FIXED – VERIFIED |
| TECH-08 | P2 | Các tab `/info?tab=` canonical về `/info` | ✅ FIXED (chưa có e2e riêng) |
| TECH-09 | P2 | Domain gắn cứng | ✅ FIXED trong JS (`VITE_SITE_URL`); còn trong `index.html`, `robots.txt` |
| TECH-10 | P2 | Trùng lặp `/products` và `/products/` | ✅ FIXED ở canonical (bỏ `/` cuối); chưa có redirect 301 |
| TECH-11 | P3 | Hai hệ thống title làm title đổi qua lại | ✅ FIXED (router không ghi đè khi chỉ đổi query/param) |
| TECH-12 | P3 | Meta keywords và meta title lỗi thời | ✅ FIXED (đã gỡ) |
| TECH-13 | P3 | Nút EN đổi `lang` trên cùng URL, không có hreflang | ⏳ TODO |
| TECH-14 | P3 | Tên thương hiệu lẫn "Bookstore" và "Stationery" | ⏳ TODO (cần chốt tên với chủ shop) |
| TECH-15 | P3 | `favicon.ico`/`.png` thực chất là JPEG; manifest chỉ có SVG | ✅ FIXED: thêm `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (PNG thật, nén palette) vào manifest/index.html. `favicon.ico` vẫn là JPEG (trình duyệt vẫn đọc được) |
| TECH-16 | P3 | `robots.txt` Disallow các trang noindex; host gắn cứng | ⏳ TODO (ảnh hưởng thấp) |
| TECH-17 | P3 | Hai file `vercel.json` giống nhau | ⏳ TODO |
| INFRA-01 | P1 | Rate limit theo `req.ip`, không trust proxy | ✅ Đã sửa ở commit `99b4309` (BUG-011, `applyTrustProxy` + env `TRUST_PROXY`), sau thời điểm audit. **Cần xác minh khi deploy:** nếu trình duyệt gọi API qua rewrite `/api` của Vercel thì có 2 proxy (Vercel → Render), nên tin đúng 1 hop có thể khiến `req.ip` là IP của Vercel. Kiểm tra log `req.ip` trên production và chỉnh `TRUST_PROXY` nếu cần |

---

## 5. E-commerce SEO Findings

| ID | Mức | Vấn đề | Trạng thái |
|---|---|---|---|
| ECOM-01 | P0 | `aggregateRating` với `reviewCount: 0`, khác nguồn rating hiển thị | ✅ FIXED – VERIFIED |
| ECOM-02 | P1 | Rating giả trên giao diện | ✅ Đã được sửa trong commit `2d98b7b` (trước đợt này); đã xác minh lại |
| ECOM-03 | P1 | Brand bịa "Trường Thành" | ✅ FIXED – VERIFIED |
| ECOM-04 | P1 | Review hỏng trên URL slug | ✅ FIXED – VERIFIED |
| ECOM-05 | P1 | Link `_id` lệch với canonical slug | ✅ FIXED – VERIFIED (ProductCard, Cart, gợi ý tìm kiếm, Home, breadcrumb) |
| ECOM-06 | P1 | Sản phẩm INACTIVE vẫn index, có Offer InStock | ✅ FIXED – VERIFIED (frontend `noindex`; backend vẫn trả dữ liệu để khách xem) |
| ECOM-07 | P1 | Ảnh base64 trong `product.images` | ⚠️ Giảm thiểu: JSON-LD và og:image bỏ `data:` URI. Gốc rễ TODO (TASK-013) |
| ECOM-08 | P1 | Danh mục không có title/H1/description riêng | ✅ FIXED – VERIFIED |
| ECOM-09 | P1 | Phân trang không có URL | ⏳ TODO (TASK-009b) |
| ECOM-10 | P1 | Link danh mục là `<button @click>` | ⏳ TODO (TASK-009b; phiên refactor đang tách component các file này) |
| ECOM-11 | P1 | Link "Văn phòng phẩm" trên Home trỏ sai danh mục | ⏳ TODO (cần xác nhận danh mục đích với chủ shop) |
| ECOM-12 | P1 | Landing page không có meta | ✅ FIXED (title, description, og:image từ dữ liệu; lỗi → noindex) |
| ECOM-13 | P2 | Description markdown thô | ✅ FIXED – VERIFIED (`toMetaDescription`) |
| ECOM-14 | P2 | JSON-LD thiếu ảnh/offers.url/itemCondition | ✅ FIXED – VERIFIED (chưa có shipping/return policy: TASK-017) |
| ECOM-15 | P2 | Chưa có schema Book | ✅ FIXED – VERIFIED |
| ECOM-16 | P2 | Ảnh thiếu alt | ✅ FIXED – VERIFIED (gallery, thumbnail, lightbox, combo, ProductCard; ảnh nền mờ `alt=""` + `aria-hidden`) |
| ECOM-17 | P2 | Chưa có BreadcrumbList JSON-LD | ✅ FIXED – VERIFIED (link danh mục vẫn là `?category=<id>`) |
| ECOM-18 | P2 | Tải lỗi vẫn giữ sản phẩm trước | ✅ FIXED – VERIFIED |
| ECOM-19 | P2 | Footer/menu link vào URL tìm kiếm | ⏳ TODO |
| ECOM-20 | P2 | Đổi danh mục không reset trang | ✅ FIXED (reset `currentPage` khi query đổi) |
| ECOM-21 | P2 | DealHot không lọc status | ⏳ TODO |
| ECOM-22 | P2 | Danh mục dùng ObjectId trong URL | ⏳ TODO (TASK-015) |
| ECOM-23 | P3 | Tác giả/NXB/brand là text, không phải link | ⏳ TODO (cần trang tác giả/NXB) |
| ECOM-24 | P3 | ProductList bỏ qua `?sort=` | ⏳ TODO |

---

## 6. Content & Keyword Opportunities

> Ý tưởng ban đầu, **chưa xác minh search volume hay độ cạnh tranh** (chưa có quyền truy cập công cụ từ khóa; Ahrefs connector chưa được xác thực).

| Keyword | Search Intent | Target Page | Priority | Proposed Content | Data Source |
|---|---|---|---|---|---|
| mua sách online Ninh Bình | Nơi mua (local) | Trang chủ | P1 | Giới thiệu cửa hàng, địa chỉ, giao hàng | Ý tưởng — chưa xác minh search volume |
| văn phòng phẩm Ninh Bình | Nơi mua (local) | Danh mục Văn phòng phẩm | P1 | `Category.description` thật, link danh mục con | Ý tưởng — chưa xác minh search volume |
| sách giáo khoa lớp [n] | Học tập | Danh mục SGK | P1 | Mô tả theo lớp, bộ sách | Ý tưởng — chưa xác minh search volume |
| [tên sách] | Tìm theo tên | Trang sản phẩm | P1 | Mô tả thật, ISBN, tác giả, NXB (đã có schema Book) | Ý tưởng — chưa xác minh search volume |
| sách của [tác giả] | Theo tác giả | (chưa có trang) | P2 | Trang tác giả | Ý tưởng — chưa xác minh search volume |
| sách NXB [tên] | Theo NXB | (chưa có trang) | P3 | Trang NXB | Ý tưởng — chưa xác minh search volume |
| bút bi / vở học sinh / dụng cụ học tập | Loại sản phẩm | Danh mục tương ứng | P2 | Mô tả danh mục, hướng dẫn chọn | Ý tưởng — chưa xác minh search volume |

**Việc nội dung cần chủ shop làm:** điền `description` cho từng danh mục trong Admin (giờ đã hiển thị dưới H1 và dùng làm meta description) và viết mô tả thật cho sản phẩm. Không dùng AI sinh hàng loạt.

---

## 7. Performance Findings

**Lab đo được (build production, 2026-11-10):**

| Chunk | Raw | Gzip |
|---|---|---|
| `vendor-vue` | 289.93 kB | 102.43 kB |
| `index` (entry) | 213.20 kB | 60.40 kB |
| `ProductDetail` | 67.44 kB | 17.19 kB |

- Ảnh chính trang sản phẩm đã có `fetchpriority="high"`, `width`/`height`; ảnh phụ lazy (có từ trước).
- **Lighthouse / Core Web Vitals: NOT TESTED** (chưa chạy trong điều kiện có backend và dữ liệu thật). Cần đo trước/sau trên staging.
- Nghi vấn cần đo (chưa xác minh):
  - Alias `vue` → `vue.esm-bundler.js` (kéo runtime compiler vào bundle).
  - Google Fonts Outfit 6 weight chặn render.
  - `EntryAdPopup`/`ChatWidget` tải trên mọi trang.

---

## 8. SEO Bug Report (đã xác minh)

Tất cả bug P0/P1 trong mục 4–5 có trạng thái ✅ đều có test tự động đi kèm (mục 10). Bug mới phát hiện khi chạy test:

| Bug | Mức | Mô tả | Trạng thái |
|---|---|---|---|
| NEW-01 | P2 | Màn splash xác thực (`App.vue`) có `<h1>`, fade-out chồng lên nội dung nên trang có 2 H1 | ✅ FIXED – VERIFIED (đổi sang `<div>`, giữ nguyên style) |
| NEW-02 | P3 | Gỡ markdown `_nghiêng_` để lại khoảng trắng trước dấu câu trong meta description | ✅ FIXED – VERIFIED |

---

## 9. Source Code Changes

| File | Thay đổi | Task |
|---|---|---|
| `frontend/src/utils/seo.ts` (mới) | `SITE_URL` từ env, `absoluteUrl`, `buildCanonicalUrl` (whitelist query, bỏ `/` cuối), `toMetaDescription`, `isNoIndex` | 002 |
| `frontend/src/composables/useSeoMeta.ts` | Thêm `robots`, `canonicalQuery`; noindex thì gỡ canonical/og:url; og:image tuyệt đối dạng JPG; bỏ meta title; export `applySeoMeta`, `resetSeoForRoute` | 001, 003 |
| `frontend/src/composables/useStructuredData.ts` | `buildProductSchema` (rating thật, không bịa brand, Book, ảnh tuyệt đối, bỏ base64, `offers.url`, `itemCondition`, bỏ qua INACTIVE), `buildBreadcrumbSchema`, WebSite schema, escape `<` trong JSON-LD | 004, 010 |
| `frontend/src/router/index.ts` | `afterEach` reset head khi đổi route (bỏ qua khi chỉ đổi query/param); thêm title cho DealHot/Info/Landing/GuestOrder; NotFound `noIndex` | 003, 007 |
| `frontend/index.html` | Gỡ canonical, og:url, twitter:url, meta keywords, meta title tĩnh; og:image → `logo.jpg` | 001 |
| `frontend/src/App.vue` | `<h1>` splash → `<div>` | NEW-01 |
| `frontend/src/pages/customer/ProductDetail.vue` | SEO động (description sạch, canonical slug, noindex khi lỗi/INACTIVE); Product + Breadcrumb JSON-LD; review dùng `product._id`; reset dữ liệu khi tải lỗi; alt ảnh | 003, 004, 006, 007, 010 |
| `frontend/src/pages/customer/ProductList.vue` | H1 + mô tả danh mục; title/description/canonical theo danh mục; noindex cho tìm kiếm và lọc khuyến mãi; reset trang khi đổi query | 008 |
| `frontend/src/pages/customer/{Home,Info,LandingPageDetail}.vue`, `pages/NotFound.vue` | Title trang chủ; canonical theo tab; meta landing page; 404 noindex | 003, 007, 008 |
| `frontend/src/components/ProductCard.vue`, `pages/customer/Cart.vue`, `layouts/CustomerLayout.vue` | Link sản phẩm dùng slug; alt ảnh ProductCard | 006, 010 |
| `frontend/.env.example` | Thêm `VITE_SITE_URL` | 002 |
| `backend/src/modules/seo/{seo.module,seo.controller,seo.service,seo.service.spec}.ts` (mới), `backend/src/app.module.ts` | `GET /api/seo/sitemap.xml` công khai, chỉ đọc: trả XML thô qua `@Res()` (không qua envelope JSON), `Cache-Control` 1 giờ. Chỉ gồm trang chủ, `/products`, `/deal-hot`, `/info`, danh mục `status=true`, sản phẩm `ACTIVE`/`OUT_OF_STOCK` chưa xóa (URL slug = canonical, `lastmod = updatedAt`), landing page `status=true`. Escape XML, bỏ trùng, giới hạn 50.000 URL. Domain lấy từ `SITE_URL`, rồi `FRONTEND_URL` (bỏ localhost), rồi mặc định | 011 |
| `vercel.json`, `frontend/vercel.json`, `frontend/nginx.conf`; xóa `frontend/public/sitemap.xml`; `backend/.env.example` | Rewrite/proxy `/sitemap.xml` → backend; xóa file tĩnh (Vercel ưu tiên file tĩnh hơn rewrite); thêm `SITE_URL` | 011 |
| Test mới | `src/utils/__tests__/seo.spec.ts`, `src/composables/__tests__/useSeoMeta.spec.ts`, `src/composables/__tests__/useStructuredData.spec.ts`, `e2e/seo.spec.ts` | — |

Không đổi business logic (giá, đơn hàng, thanh toán, phân quyền), không đổi route. Backend chỉ thêm 1 module đọc dữ liệu công khai.

---

## 10. Test Results (2026-11-10)

| Kiểm tra | Kết quả |
|---|---|
| Frontend unit (`vitest run`) | ✅ 34 file / 215 test PASS (trước: 26 / 124; tăng thêm do test mới của đợt này và của các phiên khác) |
| Typecheck (`vue-tsc -b`) | ✅ 0 lỗi |
| Lint (`eslint`) | ✅ 0 lỗi |
| Build (`vite build`) | ✅ Thành công (chỉ có cảnh báo `@vueuse` từ thư viện, có từ trước) |
| E2E toàn bộ (Chromium) | ✅ 17/17 PASS: auth, add-to-cart → COD checkout, landing order, admin, responsive, SEO |
| E2E SEO trên 4 trình duyệt | ✅ 32/32 PASS: Chromium, Mobile Chrome, WebKit, Mobile Safari |
| E2E Firefox | ⛔ BLOCKED: Firefox của Playwright chưa được cài trên máy (`npx playwright install firefox`) |
| Backend: test module sitemap | ✅ 4/4 PASS |
| Backend: lint (module seo + app.module) | ✅ 0 lỗi (còn cảnh báo `no-unsafe-*` cùng loại với code hiện có) |
| Backend: build (`nest build`) | ✅ Thành công |
| Backend: gọi thật `GET /api/seo/sitemap.xml` (MongoDB local) | ✅ 200, `application/xml`, 153 URL, không có URL admin/giỏ hàng/checkout |
| Backend: toàn bộ `npm test` | ✅ 91 suite / 1187 test PASS |

| Test ID | Trang / loại | Expected | Kết quả |
|---|---|---|---|
| SEO-TEST-001 | Trang chủ | Title mô tả ngành hàng, canonical `/`, Organization + WebSite JSON-LD | PASS |
| SEO-TEST-002 | Sản phẩm (slug) | Title = tên SP, description sạch markdown, og:image = ảnh SP | PASS |
| SEO-TEST-003 | Danh mục | H1/title/description từ danh mục; canonical giữ `category`, bỏ `sort`/`utm` | PASS |
| SEO-TEST-004 | Canonical | Canonical slug; điều hướng SPA sang `/deal-hot` không còn canonical/JSON-LD cũ | PASS |
| SEO-TEST-005 | Robots | Trang hợp lệ `index, follow`; tìm kiếm/404/lỗi `noindex` | PASS |
| SEO-TEST-006 | Sitemap | XML hợp lệ, chỉ URL canonical công khai, có `lastmod`, không trùng | PASS (unit + gọi endpoint thật). Chưa test qua rewrite Vercel/nginx (cần deploy) |
| SEO-TEST-007 | Product JSON-LD | Product+Book, giá = giá hiển thị (40.000), rating 4.5/2 review (không phải `product.rating` = 5), không có brand bịa | PASS |
| SEO-TEST-008 | Breadcrumb JSON-LD | ≥ 3 mục, URL tuyệt đối, mục cuối là canonical | PASS |
| SEO-TEST-009 | Internal links | Link sản phẩm dùng slug; review gọi API bằng `_id` | PASS |
| SEO-TEST-010 | Soft-404 | SP không tồn tại / INACTIVE → noindex, không canonical, không Product schema | PASS |
| SEO-TEST-011 | Mobile | SEO e2e PASS trên Mobile Chrome + Mobile Safari; e2e responsive có sẵn PASS | PASS |
| SEO-TEST-012 | Alt ảnh | Ảnh chính chứa tên SP | PASS |
| SEO-TEST-013 | Heading | Đúng 1 H1 trên trang SP và danh mục | PASS (sau khi sửa NEW-01) |
| SEO-TEST-014 | Trùng title/description | Danh mục/SP có title riêng | PASS một phần (chưa quét toàn site với dữ liệu thật) |
| SEO-TEST-015 | Performance baseline | Lighthouse trước/sau | NOT TESTED |
| SEO-TEST-016 | Trang riêng tư / 404 | noindex | PASS |
| SEO-TEST-017 | HTML ban đầu | Không còn canonical/og:url trang chủ, og:image không phải SVG, `lang="vi"` | PASS |
| SEO-TEST-018 | Tìm kiếm / lọc | `?q=` → noindex, không canonical | PASS (phân trang URL: chưa có) |

Chạy lại: `cd frontend && npx vitest run && npx playwright test e2e/seo.spec.ts --project=chromium`

---

## 11. Remaining Issues — việc còn lại

### SEO-TASK-009b – Phân trang và link danh mục crawl được
**Type:** IMPROVEMENT · **Priority:** P1 · **Status:** TODO · **Test:** SEO-TEST-018 · **Dependencies:** phiên refactor đang tách component ProductList/Home/CustomerLayout, nên làm sau khi phiên đó xong
- `?page=n` đồng bộ với `currentPage`; nút phân trang thành `<router-link>`; canonical thêm `page` (helper đã hỗ trợ `page>1`).
- Đổi `<button @click router.push>` của danh mục sang `<router-link>`.
- Sửa link "Văn phòng phẩm" và "Bán chạy nhất" trên Home (đọc `?sort=`). **Cần chủ shop xác nhận danh mục đích.**

### SEO-TASK-011 – Sitemap động
**Type:** FEATURE · **Priority:** P1 · **Status:** ✅ FIXED – VERIFIED local · **Test:** SEO-TEST-006

Việc còn lại khi deploy:
1. Đặt `SITE_URL` trên Render.
2. Deploy backend **trước**, rồi mới deploy frontend: rewrite `/sitemap.xml` trỏ vào endpoint mới, nên deploy ngược thứ tự sẽ tạm thời trả lỗi.
3. Mở `https://<domain>/sitemap.xml` kiểm tra; gửi sitemap trong Search Console.
4. Khi làm SEO-TASK-015 (danh mục dùng slug), nhớ cập nhật URL danh mục trong `seo.service.ts` cho khớp canonical mới.

### SEO-TASK-012 – Trust proxy cho rate limit
**Type:** BUG · **Priority:** P1 · **Status:** ✅ Đã có trong commit `99b4309`. Chỉ còn bước xác minh số proxy hop trên production (xem INFRA-01)

### SEO-TASK-013 – Ảnh base64 → lưu file/CDN
**Type:** BUG · **Priority:** P1 · **Status:** TODO (cần duyệt, có migration dữ liệu)

### SEO-TASK-014 – Prerender/SSR cho bot mạng xã hội và bot không chạy JS
**Type:** FEATURE · **Priority:** P2 · **Status:** TODO (cần duyệt)
- So sánh 3 phương án: Vercel Edge Middleware chèn meta cho UA bot, prerender tĩnh, hoặc chuyển Nuxt (rủi ro cao).

### SEO-TASK-015 – Danh mục theo slug
**Type:** IMPROVEMENT · **Priority:** P3 · **Status:** TODO
- `?category=<slug>`: ProductList đã nhận cả id lẫn slug khi tính SEO, nhưng API lọc sản phẩm cần kiểm tra lại.
- Sau đó mới tính `/danh-muc/:slug` kèm redirect.

### SEO-TASK-016 – Dọn dẹp nhỏ
**Type:** IMPROVEMENT · **Priority:** P3 · **Status:** TODO
- Redirect 301 trailing slash: **chưa làm**. `trailingSlash` của Vercel áp dụng cả `/api`, cần thử trên preview deploy. Canonical đã tự bỏ `/` cuối nên rủi ro thấp.
- `robots.txt`: host lấy theo môi trường.
- Gộp 2 file `vercel.json` (cần biết Root Directory đang cấu hình trên Vercel). ~~favicon/manifest~~ ✅ đã xong.
- Thống nhất tên thương hiệu "Bookstore"/"Stationery".
- hreflang, hoặc bỏ nút chuyển EN khỏi trang công khai.
- DealHot lọc theo status; footer/menu link vào danh mục thay vì URL tìm kiếm.

### SEO-TASK-017 – Merchant listing đầy đủ
**Type:** IMPROVEMENT · **Priority:** P2 · **Status:** TODO
- `shippingDetails` và `hasMerchantReturnPolicy` trong Offer. **Cần dữ liệu chính sách thật** (phí ship, số ngày đổi trả), không tự đặt.

### Audit chưa làm
- Lighthouse/CWV trước và sau trên staging có dữ liệu thật.
- Rà soát nội dung/heading của các trang còn lại (Cart, Checkout, account) với dữ liệu thật.
- Rich Results Test trên URL thật sau khi deploy.

### Ghi chú ngoài SEO (phát hiện khi đọc code)
- `LandingPageDetail.vue` có bộ đếm ngược "Fake Scarcity Timer" (reset 30 phút mỗi lần tải trang). Không ảnh hưởng SEO nhưng là rủi ro uy tín và chính sách quảng cáo. Đề nghị chủ shop xem lại.

---

## 12. SEO Improvement Backlog

- Trang tác giả và nhà xuất bản (DB đã có index cho `author`/`publisher`), liên kết từ trang sản phẩm.
- Ô nhập mô tả danh mục trong Admin (field `description` đã có, cần hướng dẫn nhập).
- Tạo `e2e/seo.spec.ts` thành CI gate.
- GA4 và Search Console verification (cần chủ domain cấp quyền).

## 13. SEO Roadmap

| Phase | Nội dung | Task | Trạng thái |
|---|---|---|---|
| 1 – Technical Foundation | Canonical, robots, soft-404, domain config, title | 001, 002, 003, 007 | ✅ Xong |
| 2 – E-commerce SEO | JSON-LD, slug links, danh mục, breadcrumb, alt | 004, 005, 006, 008, 010 | ✅ Xong |
| 2b – Crawl coverage | Sitemap động ✅; phân trang, link danh mục ⏳ | 011, 009b | Sitemap xong; 009b chờ phiên refactor |
| 3 – Performance & Mobile | Đo Lighthouse/CWV, tối ưu bundle/font | audit perf, 013 | ⏳ |
| 4 – Content & IA | Mô tả danh mục, trang tác giả/NXB, slug danh mục | 015, backlog | ⏳ |
| 5 – Monitoring | GSC, GA4, Rich Results, SEO e2e trong CI | 012, backlog | ⏳ |
| 6 – Continuous | Rà soát hàng tháng theo dữ liệu GSC | — | ⏳ |

## 14. KPI & Measurement Plan

Chưa có quyền Search Console hay GA4, nên **chưa có baseline số liệu thật**.

**Sau khi deploy:**
1. Xác minh domain trên Search Console và gửi sitemap (sau TASK-011).
2. Kiểm tra vài URL sản phẩm bằng URL Inspection và Rich Results Test.
3. Ghi lại baseline tuần đầu.

| KPI | Nguồn | Baseline | Mục tiêu theo dõi |
|---|---|---|---|
| Số trang được index / lỗi index (Soft 404, Duplicate canonical) | GSC → Pages | Chưa có dữ liệu | Lỗi canonical và soft-404 giảm dần sau deploy |
| Organic clicks, impressions, CTR, vị trí TB | GSC → Performance | Chưa có dữ liệu | So sánh theo tuần/tháng |
| Product snippets / Merchant listings hợp lệ | GSC → Enhancements | Chưa có dữ liệu | 0 lỗi nghiêm trọng |
| LCP / INP / CLS (p75) | PageSpeed Insights / CrUX | NOT TESTED | ≤ 2,5s / ≤ 200ms / ≤ 0,1 |
| Organic landing pages, conversion, doanh thu | GA4 (nếu triển khai) | Chưa có | Đối chiếu traffic organic với đơn hàng thật, không chỉ nhìn click |
