# SEO Audit & Optimization — Trường Thành Bookstore

> Ngày audit: 2026-11-03 · Trạng thái: **AUDIT XONG MỘT PHẦN — CHƯA SỬA CODE**
> Phiên làm việc bị dừng vì hết token. Chưa có thay đổi nào trong source code. File này ghi lại những gì **đã xác minh** và **danh sách việc còn lại** để làm tiếp.

---

## 1. Executive SEO Summary

Storefront là **Vue 3 SPA render phía client (CSR)**, không có SSR/prerender. Google vẫn render được JS, nhưng HTML ban đầu chỉ có metadata tĩnh của trang chủ. Đã có nền móng SEO (`useSeoMeta`, `useStructuredData`, robots.txt, router đặt `noindex`), nhưng còn 5 nhóm vấn đề nghiêm trọng:

1. **Canonical sai hàng loạt (P0)**: `index.html` gắn cứng canonical/og:url về trang chủ cho mọi URL. Ngoài ra mọi trang danh mục, phân trang và tìm kiếm đều có canonical `/products`, nên danh mục không thể được index.
2. **Structured data sai hoặc bịa (P0/P1)**: `aggregateRating` có thể ra `reviewCount: 0`. Brand mặc định là "Trường Thành" khi không có dữ liệu. Giao diện còn hiển thị rating giả (5/5, ★4.8) khi sản phẩm chưa có đánh giá.
3. **Soft-404 (P1)**: URL không tồn tại, sản phẩm đã xóa hoặc ngừng bán (INACTIVE) vẫn trả 200 và để `index, follow`.
4. **Sitemap tĩnh (P1)**: chỉ có 3 URL, không có sản phẩm, danh mục hay landing page.
5. **Liên kết nội bộ khó crawl (P1)**: link sản phẩm dùng `_id` trong khi canonical dùng `slug`. Link danh mục và phân trang là `<button @click>`, nên crawler không đi theo được.

Không cam kết thứ hạng hay traffic: chưa có dữ liệu Search Console hoặc GA4.

---

## 2. Tech Stack & SEO Architecture (đã xác minh)

| Hạng mục | Thực tế | Ảnh hưởng SEO |
|---|---|---|
| Frontend | Vue 3 + Vite + vue-router (`createWebHistory`), CSR | Nội dung chỉ có sau khi chạy JS; bot mạng xã hội (Facebook, Zalo) chỉ thấy meta của trang chủ |
| Deploy | Vercel (`frontend/vercel.json` và `vercel.json` ở root giống hệt nhau): mọi path → `/index.html`, `/api/*` → Render | Mọi URL trả 200 → soft-404 |
| Docker | nginx `try_files … /index.html` | Như trên |
| Metadata | `index.html` tĩnh + `composables/useSeoMeta.ts` (DOM, onMounted/watch) + `router.afterEach` (title map + robots) | Có 2 nguồn title cạnh tranh nhau; canonical tĩnh xung đột với canonical do JS đặt |
| JSON-LD | `composables/useStructuredData.ts` (Organization, Product, Breadcrumb) | `useBreadcrumbSchema` chưa được dùng ở đâu |
| URL sản phẩm | `/products/:id`. Backend có `GET /products/slug/:slug` và `GET /products/:id` (nhận id hoặc slug) | Link dùng `_id`, canonical dùng `slug` |
| URL danh mục | `/products?category=<ObjectId>` | Canonical bị gộp về `/products` |
| Dữ liệu sản phẩm | Mongo: `slug, sku, isbn, author, publisher, brand, images, price, discountPrice, stock, rating, status, isDeleted, productType, updatedAt` | Đủ dữ liệu cho Product/Book schema và lastmod |
| Domain | Gắn cứng `https://truong-thanh-bookstore.vercel.app` ở 9+ chỗ, chưa có `VITE_SITE_URL` | Đổi domain sẽ làm hỏng canonical và JSON-LD |

---

## 3. Current SEO Status

**Đã có:** `html lang="vi"`, viewport, `robots.txt` chặn các trang riêng tư, route `meta.noIndex` cho cart/checkout/account/auth/admin, Product JSON-LD, Organization schema, H1 = tên sản phẩm, lazy-load route, component Breadcrumb hiển thị trên trang sản phẩm.

**Chưa có:** canonical đúng cho từng URL, sitemap động, Book schema, BreadcrumbList JSON-LD, metadata cho landing page `/t/:slug`, URL phân trang crawl được, GA4 và Search Console verification (chưa xác minh).

**Chưa thể xác minh:** Core Web Vitals thực tế, dữ liệu Search Console, search volume từ khóa.

---

## 4. Technical SEO Findings (đã xác minh, có phản biện)

| ID | Mức | Vấn đề | File chính |
|---|---|---|---|
| TECH-01 | **P0** | Canonical, og:url và twitter:url gắn cứng về trang chủ trong HTML của mọi route | `frontend/index.html` |
| TECH-02 | P1 | Bot mạng xã hội và bot không chạy JS chỉ thấy meta trang chủ cho mọi URL sản phẩm (cần prerender/SSR hoặc edge meta, **cần duyệt**) | kiến trúc |
| TECH-03 | P1 | `/products?category=…` và `/products?q=…` dùng chung title/description và cùng canonical `/products`; trang tìm kiếm vẫn `index, follow` | `useSeoMeta.ts`, `ProductList.vue` |
| TECH-04 | P1 | Soft-404: catch-all NotFound, sản phẩm không tồn tại và sản phẩm INACTIVE đều trả 200 + `index, follow` | `NotFound.vue`, `ProductDetail.vue`, `vercel.json` |
| TECH-05 | P2 | Landing page `/t/:slug`, Wishlist, OrderDetail và admin không tự đặt head, nên thừa hưởng canonical/og của trang trước (lỗi SPA) | `LandingPageDetail.vue`, … |
| TECH-06 | P2 | `og:image` mặc định là `/favicon.svg` (đường dẫn tương đối, định dạng SVG mà Facebook/Zalo không hỗ trợ) | `useSeoMeta.ts` |
| TECH-07 | P2 | Title trang chủ sau khi JS chạy chỉ còn tên thương hiệu (23 ký tự) | `Home.vue` |
| TECH-08 | P2 | Các tab `/info?tab=…` có title riêng nhưng canonical đều về `/info` | `Info.vue` |
| TECH-09 | P2 | Domain gắn cứng, chưa có `VITE_SITE_URL` (frontend) và `SITE_URL` (backend) | nhiều file |
| TECH-10 | P2 | `/products` và `/products/` cùng tự canonical về chính nó (trùng lặp do trailing slash) | `vercel.json`, nginx |
| TECH-11 | P3 | Hai hệ thống title (`—` và `\|`) khiến title đổi qua lại khi chỉ đổi query | `router/index.ts` |
| TECH-12 | P3 | Còn meta keywords và meta title lỗi thời; trang noindex dùng `nofollow` và vẫn tự canonical | `index.html`, router |
| TECH-13 | P3 | Nút chuyển EN đổi `lang` trên cùng URL trong khi nội dung vẫn tiếng Việt, không có hreflang | `index.html`, i18n |
| TECH-14 | P3 | Tên thương hiệu không thống nhất: "Bookstore" và "Stationery" | nhiều file |
| TECH-15 | P3 | `favicon.ico`/`.png` thực chất là file JPEG; apple-touch-icon và manifest chỉ có SVG | `public/` |
| TECH-16 | P3 | `robots.txt` Disallow các trang noindex (Google không đọc được thẻ noindex); host gắn cứng | `public/robots.txt` |
| TECH-17 | P3 | Có 2 file `vercel.json` giống nhau; file nào có hiệu lực phụ thuộc Root Directory trên Vercel | root + frontend |
| INFRA-01 | P1 | Rate limit toàn cục 100 req/phút theo `req.ip` nhưng không bật `trust proxy`. Sau proxy Vercel/Render, mọi người dùng **và Googlebot** có thể dùng chung một bucket (**cần duyệt**, ảnh hưởng bảo mật) | `backend/src/main.ts` |

---

## 5. E-commerce SEO Findings

| ID | Mức | Vấn đề | File chính |
|---|---|---|---|
| ECOM-01 | **P0** | JSON-LD có thể xuất `aggregateRating` với `reviewCount: 0`; `ratingValue` lấy từ `product.rating`, khác nguồn với rating hiển thị | `useStructuredData.ts`, `ProductDetail.vue` |
| ECOM-02 | P1 | Giao diện hiển thị **rating giả**: 5/5 khi chưa có review (trang sản phẩm), ★4.8 khi rating = 0 (ProductCard) | `ProductDetail.vue`, `ProductCard.vue` |
| ECOM-03 | P1 | JSON-LD brand mặc định "Trường Thành" khi trống, trong khi giao diện hiển thị "Khác" | `useStructuredData.ts` |
| ECOM-04 | P1 | Trên URL slug (canonical), review không tải và không gửi được vì `route.params.id` được dùng như ObjectId | `ProductDetail.vue` (~L1379, 1398, 1409, 1502) |
| ECOM-05 | P1 | Link nội bộ dùng `/products/{_id}`, còn canonical và JSON-LD dùng `/products/{slug}` | `ProductCard.vue:97,237`, `Home.vue:1025` |
| ECOM-06 | P1 | Sản phẩm INACTIVE vẫn render, được index và có Offer `InStock` (do `GET /products/:id` bỏ qua status) | backend `products.service.ts`, `ProductDetail.vue` |
| ECOM-07 | P1 | Ảnh upload trong admin lưu dạng base64 `data:` URI, rồi được đưa vào JSON-LD `image` và `og:image` (**cần duyệt**, phải đổi cơ chế upload) | admin upload |
| ECOM-08 | P1 | Không có title, H1 và description riêng cho danh mục; chưa dùng `Category.description` | `ProductList.vue` |
| ECOM-09 | P1 | Phân trang là state nội bộ + `<button>`, trang 2 trở đi không có URL | `ProductList.vue` |
| ECOM-10 | P1 | Link danh mục quan trọng là `<button @click router.push>` | Home, CustomerLayout, CategoryProductSection |
| ECOM-11 | P1 | Link "Văn phòng phẩm" trên Home trỏ sang danh mục Đồ lưu niệm + `q=bút`, dù danh mục `van-phong-pham` có tồn tại | `Home.vue` |
| ECOM-12 | P1 | Landing page `/t/:slug` không có meta riêng; trạng thái lỗi là soft-404 | `LandingPageDetail.vue` |
| ECOM-13 | P2 | Meta description và JSON-LD description dùng nguyên văn markdown, không lọc và không cắt độ dài | `ProductDetail.vue` |
| ECOM-14 | P2 | JSON-LD chỉ có 1 ảnh; thiếu `offers.url`, `itemCondition`; chưa có shipping/return policy | `useStructuredData.ts` |
| ECOM-15 | P2 | Sách chưa dùng schema Book: ISBN, tác giả, NXB, số trang, ngôn ngữ hiển thị trên trang nhưng chưa có trong structured data | `useStructuredData.ts` |
| ECOM-16 | P2 | Ảnh gallery, thumbnail và ProductCard thiếu alt; ảnh combo dùng alt tiếng Anh chung chung | `ProductDetail.vue`, `ProductCard.vue` |
| ECOM-17 | P2 | Link danh mục trên breadcrumb dùng `?category=<ObjectId>`; chưa có BreadcrumbList JSON-LD | `ProductDetail.vue`, `Breadcrumb.vue` |
| ECOM-18 | P2 | Điều hướng client-side tới sản phẩm lỗi vẫn giữ dữ liệu, canonical và JSON-LD của sản phẩm trước | `ProductDetail.vue` |
| ECOM-19 | P2 | Footer và mega menu link vào URL tìm kiếm thay vì danh mục | `CustomerLayout.vue` |
| ECOM-20 | P2 | Đổi danh mục từ menu không reset trang và bộ lọc, có thể ra trang rỗng | `ProductList.vue` |
| ECOM-21 | P2 | DealHot không lọc theo status; trùng ý định tìm kiếm với `/products?discounted=true` | `DealHot.vue` |
| ECOM-22 | P2 | Danh mục định danh bằng ObjectId thay vì slug (backend đã hỗ trợ `GET /categories/slug/:slug`) | ProductList, links |
| ECOM-23 | P3 | Combo, danh mục, tác giả, NXB, brand trên trang sản phẩm là text thường, chưa là link | `ProductDetail.vue` |
| ECOM-24 | P3 | ProductList bỏ qua `?sort=`; link "Bán chạy nhất" thực tế mở `/products` sắp theo "newest" | `ProductList.vue`, `Home.vue` |
| ECOM-25 | P3 | Route danh mục thân thiện (`/danh-muc/:slug`): **nên hoãn**, làm sau khi canonical và sitemap ổn định | router |

---

## 6. Content & Keyword Opportunities

> Agent audit nội dung/từ khóa bị dừng trước khi xong. Bảng dưới chỉ là **ý tưởng ban đầu**, chưa xác minh search volume hay độ cạnh tranh.

| Keyword | Search Intent | Target Page | Priority | Proposed Content | Data Source |
|---|---|---|---|---|---|
| mua sách online Ninh Bình | Nơi mua (local) | Trang chủ | P1 | Giới thiệu cửa hàng, địa chỉ, giao hàng | Ý tưởng — chưa xác minh search volume |
| văn phòng phẩm Ninh Bình | Nơi mua (local) | Danh mục Văn phòng phẩm | P1 | Mô tả danh mục, link danh mục con | Ý tưởng — chưa xác minh search volume |
| sách giáo khoa lớp [n] | Học tập | Danh mục SGK | P1 | Mô tả theo lớp, bộ sách | Ý tưởng — chưa xác minh search volume |
| [tên sách] | Tìm theo tên | Trang sản phẩm | P1 | Mô tả thật, ISBN, tác giả, NXB | Ý tưởng — chưa xác minh search volume |
| sách của [tác giả] | Theo tác giả | (chưa có trang tác giả) | P2 | Đề xuất trang tác giả | Ý tưởng — chưa xác minh search volume |
| sách NXB [tên NXB] | Theo NXB | (chưa có trang NXB) | P3 | Đề xuất trang NXB | Ý tưởng — chưa xác minh search volume |
| bút bi / vở học sinh / dụng cụ học tập | Loại sản phẩm | Danh mục tương ứng | P2 | Mô tả danh mục, hướng dẫn chọn | Ý tưởng — chưa xác minh search volume |

Rủi ro nội dung đã thấy: danh mục chưa có nội dung riêng (thin content); trang tìm kiếm có thể bị index và tạo trùng lặp.

---

## 7. Performance Findings

**NOT TESTED.** Agent đo hiệu năng (build, kích thước bundle, Lighthouse) bị dừng trước khi trả kết quả. Các điểm nghi vấn cần đo lại (chưa xác minh):

- `vite.config.ts` alias `vue` → `vue/dist/vue.esm-bundler.js`: kéo theo runtime compiler vào bundle.
- `AdminLayout` và `AuthLayout` được import eager trong router.
- Google Fonts Outfit 6 weight (có weight không chuẩn 750/850) chặn render.
- Ảnh banner trang chủ (LCP), lazy-load và width/height của ảnh ProductCard (CLS).
- `EntryAdPopup` và `ChatWidget` tải trên mọi trang.

---

## 8. SEO Bug Report (đã xác minh)

Nguồn: workflow audit có bước phản biện độc lập.

- Đã phản biện xong: Head metadata.
- Mới audit, chưa phản biện xong: Product detail, Listing/Category, Crawl infra.

| Bug | Mức | Mô tả ngắn |
|---|---|---|
| TECH-01 | P0 | Canonical gắn cứng về trang chủ |
| ECOM-01 | P0 | aggregateRating với reviewCount 0 |
| TECH-03 / ECOM-08 | P0–P1 | Canonical danh mục bị gộp, danh mục không có metadata riêng |
| ECOM-02 | P1 | Rating giả hiển thị cho khách |
| ECOM-04 | P1 | Review hỏng trên URL slug |
| TECH-04 / ECOM-06 | P1 | Soft-404 và sản phẩm INACTIVE vẫn được index |
| SITEMAP-01 | P1 | Sitemap tĩnh 3 URL |

---

## 9. Source Code Changes

**Chưa có thay đổi nào.** Lưu ý: working tree đang có sẵn thay đổi chưa commit của người dùng (`ProductDetail.vue`, `Home.vue`, `router/index.ts`, `ProductCard.vue`, …). Khi sửa phải chồng lên các thay đổi này, không được ghi đè.

---

## 10. Test Results

| Test | Trạng thái | Ghi chú |
|---|---|---|
| Frontend unit (baseline, trước khi sửa) | PASS | 26 file / 124 test |
| SEO-TEST-001 → 018 | NOT TESTED | Chưa sửa code nên chưa chạy test SEO |
| Backend test / lint / build | NOT TESTED | |
| Lighthouse trước/sau | NOT TESTED | |

---

## 11. Remaining Issues — VIỆC CÒN LẠI (làm theo thứ tự)

### Sửa an toàn, làm ngay được (P0/P1)

#### SEO-TASK-001 – Bỏ canonical/og:url gắn cứng trong index.html
**Type:** BUG · **Priority:** P0 · **Status:** TODO · **Test:** SEO-TEST-004
- **File:** `frontend/index.html`
- **Cách làm:** xóa `<link rel="canonical">`, `og:url` và `twitter:url` tĩnh, để `useSeoMeta` đặt theo từng route. Xóa thêm meta keywords và meta title.
- **Acceptance:** HTML ban đầu không có canonical trỏ về trang chủ; sau render, mỗi trang có canonical đúng của nó.

#### SEO-TASK-002 – Thêm `VITE_SITE_URL` và helper `absoluteUrl()`
**Type:** IMPROVEMENT · **Priority:** P1 · **Status:** TODO
- **File:** `useSeoMeta.ts`, `useStructuredData.ts`, `ProductDetail.vue`, `.env.example`
- **Cách làm:** đọc domain từ `import.meta.env.VITE_SITE_URL` (fallback là domain hiện tại). Đổi `og:image` mặc định sang ảnh PNG/JPG tuyệt đối, ví dụ `/logo.jpg`.

#### SEO-TASK-003 – Mở rộng `useSeoMeta`: robots, canonical có giữ query, reset khi đổi route
**Type:** IMPROVEMENT · **Priority:** P1 · **Status:** TODO · **Test:** SEO-TEST-005
- Thêm option `robots` và `canonicalQuery` (whitelist query được giữ lại, ví dụ `category`, `page`).
- Thống nhất một nguồn title (bỏ title map trong `router.afterEach` cho các trang đã gọi `useSeoMeta`).
- Trang noindex dùng `noindex, follow` và gỡ canonical.
- Viết unit test cho composable.

#### SEO-TASK-004 – Sửa JSON-LD Product: rating và brand thật, thêm Book schema
**Type:** BUG · **Priority:** P0 · **Status:** TODO · **Test:** SEO-TEST-007
- Chỉ xuất `aggregateRating` khi có ít nhất 1 review đã duyệt và đang hiển thị; `ratingValue` lấy cùng nguồn với rating hiển thị.
- Bỏ brand fallback.
- Thêm `image[]` (chỉ URL http(s), loại bỏ `data:`), `offers.url`, `itemCondition`, `gtin13`/`isbn`.
- Với `productType = BOOK`: thêm `@type: ["Product","Book"]`, `author`, `publisher`, `numberOfPages`, `inLanguage`.
- Không xuất JSON-LD khi sản phẩm INACTIVE hoặc chưa tải xong.

#### SEO-TASK-005 – Bỏ rating giả trên giao diện
**Type:** BUG · **Priority:** P1 · **Status:** TODO
- **File:** `ProductDetail.vue`, `ProductCard.vue`
- **Cách làm:** khi không có review, hiển thị "Chưa có đánh giá" thay cho 5/5 hoặc ★4.8.

#### SEO-TASK-006 – Link sản phẩm dùng slug, review/alert dùng `product._id`
**Type:** BUG · **Priority:** P1 · **Status:** TODO · **Test:** SEO-TEST-009
- Đổi `route.params.id` thành `product.value._id` ở mọi API review, stock alert và related. **Phải làm bước này trước.**
- Sau đó link đổi sang `/products/${slug || _id}` (URL `_id` cũ vẫn hoạt động).
- Test lại flow mua hàng: thêm giỏ hàng, review.

#### SEO-TASK-007 – Chống soft-404
**Type:** BUG · **Priority:** P1 · **Status:** TODO · **Test:** SEO-TEST-010
- NotFound, sản phẩm không tồn tại, sản phẩm INACTIVE và landing page lỗi → `noindex`, xóa canonical và JSON-LD cũ, reset `product` khi tải lỗi.
- Trang sản phẩm dùng endpoint có lọc status, hoặc kiểm tra `status === 'ACTIVE'` ở frontend chỉ để quyết định robots.

#### SEO-TASK-008 – Metadata cho danh mục, tìm kiếm, landing page, Info
**Type:** IMPROVEMENT · **Priority:** P1 · **Status:** TODO · **Test:** SEO-TEST-003
- Danh mục: title, H1, description lấy từ `Category.name/description`; canonical giữ `category` (và `page` từ trang 2 trở đi).
- Tìm kiếm `?q=`, sort, filter → `noindex, follow`.
- `/t/:slug`: meta từ dữ liệu landing page.
- `/info?tab=` canonical giữ `tab`.

#### SEO-TASK-009 – Liên kết crawl được
**Type:** IMPROVEMENT · **Priority:** P1 · **Status:** TODO
- Đổi `<button @click router.push>` của danh mục sang `<router-link>`.
- Phân trang có `?page=n` kèm `<a href>`.
- Sửa link "Văn phòng phẩm" và link "Bán chạy nhất" trên Home (đọc `?sort=`).

#### SEO-TASK-010 – Alt ảnh, BreadcrumbList JSON-LD
**Type:** IMPROVEMENT · **Priority:** P2 · **Status:** TODO · **Test:** SEO-TEST-008, SEO-TEST-012
- alt = tên sản phẩm (kèm "ảnh n").
- Gọi `useBreadcrumbSchema` trên trang sản phẩm với URL tuyệt đối.
- Lọc markdown và cắt description khoảng 155 ký tự.

### Cần làm có kế hoạch (thêm module mới, ảnh hưởng nhiều file)

#### SEO-TASK-011 – Sitemap động
**Type:** FEATURE · **Priority:** P1 · **Status:** TODO · **Test:** SEO-TEST-006
- Tạo module NestJS `SeoModule` với `GET /api/seo/sitemap.xml`, trả `application/xml`. Phải bypass interceptor envelope JSON bằng `@Res()`.
- Nội dung: sản phẩm `ACTIVE && !isDeleted` (slug, `lastmod = updatedAt`), danh mục active, landing page đã publish. Domain đọc từ `SITE_URL` qua ConfigService. Có cache header.
- Xóa `public/sitemap.xml` và thêm rewrite `/sitemap.xml` trên Vercel và nginx.
- Viết test Jest.

#### SEO-TASK-012 – Trust proxy cho rate limit
**Type:** BUG · **Priority:** P1 · **Status:** TODO
- Bật `app.set('trust proxy', …)` đúng số hop proxy để Googlebot và người dùng không chung một bucket.
- **Cần Security review trước khi làm.**

#### SEO-TASK-013 – Ảnh base64 → lưu file/CDN
**Type:** BUG · **Priority:** P1 · **Status:** TODO
- Đổi cơ chế upload trong admin, có migration dữ liệu. **Cần duyệt.**

#### SEO-TASK-014 – Prerender/SSR cho bot mạng xã hội và bot không chạy JS
**Type:** FEATURE · **Priority:** P2 · **Status:** TODO
- Phân tích chi phí: prerender tĩnh, Vercel Edge Middleware chèn meta, hoặc chuyển Nuxt.
- **Không tự chuyển framework. Cần duyệt.**

#### SEO-TASK-015 – Route danh mục thân thiện
**Type:** IMPROVEMENT · **Priority:** P3 · **Status:** TODO
- `/products?category=<slug>`, sau đó mới tính `/danh-muc/:slug` có redirect 301.

#### SEO-TASK-016 – Dọn dẹp nhỏ
**Type:** IMPROVEMENT · **Priority:** P3 · **Status:** TODO
- Trailing slash, robots.txt (thêm `/products?q=`), gộp 2 file `vercel.json`, sửa favicon/manifest, thống nhất tên thương hiệu, hreflang hoặc bỏ toggle EN khỏi trang công khai.

### Audit chưa làm xong

- **Performance / Core Web Vitals:** build, đo bundle, Lighthouse trước và sau (mục 7).
- **Content / Heading / Alt / A11y** toàn bộ các trang khách hàng, và bảng keyword đầy đủ.
- **Completeness critic:** GA4, Search Console, WebSite SearchAction, JSON-LD cũ còn sót khi điều hướng SPA.

---

## 12. SEO Improvement Backlog

- Trang tác giả và nhà xuất bản (dữ liệu `author`/`publisher` đã có index trong DB).
- Mô tả danh mục do admin nhập (cần field trong CMS nếu `Category.description` chưa được dùng).
- Merchant listing: shipping policy và return policy cho schema.
- Test SEO tự động bằng Playwright (`e2e/seo.spec.ts`) cho SEO-TEST-001 → 018.

## 13. SEO Roadmap

| Phase | Nội dung | Task |
|---|---|---|
| 1 – Technical Foundation | Canonical, robots, soft-404, domain config | 001, 002, 003, 007 |
| 2 – E-commerce SEO | JSON-LD, rating thật, slug links, danh mục, sitemap | 004, 005, 006, 008, 009, 010, 011 |
| 3 – Performance & Mobile | Đo baseline, tối ưu bundle/font/ảnh LCP | audit perf, 013 |
| 4 – Content & IA | Mô tả danh mục, trang tác giả/NXB, keyword | 015, backlog |
| 5 – Monitoring | GSC, GA4, Rich Results Test, Playwright SEO tests | 012, backlog |
| 6 – Continuous | Rà soát định kỳ theo dữ liệu GSC | — |

## 14. KPI & Measurement Plan

Chưa có quyền truy cập Search Console hay GA4, nên **chưa có baseline**. Sau khi triển khai cần theo dõi:

- **Google Search Console** (cần chủ domain xác minh): indexed pages, lỗi lập chỉ mục (đặc biệt Soft 404), clicks, impressions, CTR, vị trí trung bình, báo cáo Products/Merchant listings.
- **Rich Results Test:** trang sản phẩm sau SEO-TASK-004.
- **PageSpeed Insights / CrUX:** LCP ≤ 2,5s, INP ≤ 200ms, CLS ≤ 0,1 (p75).
- **GA4** (nếu triển khai): organic landing pages, conversion rate và doanh thu từ organic.

| KPI | Baseline | Sau tối ưu |
|---|---|---|
| Indexed pages | Chưa có dữ liệu | — |
| Organic clicks/impressions | Chưa có dữ liệu | — |
| Lighthouse SEO / Performance | NOT TESTED | — |
