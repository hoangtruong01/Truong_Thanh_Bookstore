# Đồng bộ Web ↔ Mobile và tối ưu mã nguồn

> Nhánh: `refactor/web-mobile-sync` · Bắt đầu: 2026-11-03 · Cập nhật: 2026-11-10 22:45
> Tài liệu theo dõi tiến độ. Việc nào chưa xong nằm ở mục **Còn lại / Cần xử lý tiếp**.
> Kiến trúc và nghiệp vụ chung xem [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md); backlog chung xem [`PENDING_TASKS.md`](PENDING_TASKS.md).

## Quyết định đã chốt

- Mobile theo sát giao diện web: đỏ `#dc2626`, font Outfit, bảng màu slate, bỏ gradient đỏ–cam làm màu thương hiệu.
- Giữ hiệu ứng "kính" của thanh điều hướng dưới, bổ sung nhãn chữ và nhãn cho trình đọc màn hình.
- Backend là nguồn chân lý cho giá, phí ship, giảm giá, điểm thưởng. Web và mobile chỉ hiển thị số do server tính.
- Không thêm thư viện mới, không đổi kiến trúc.

## Tiến độ

| Giai đoạn | Nội dung | Trạng thái |
| :---: | :--- | :--- |
| 0 | Sửa 7 lỗi đã xác nhận | ✅ Xong. Đã commit trong `99b4309`. |
| 1 | Backend tính giá, web bỏ tự tính tiền, bảng trạng thái đơn dùng chung | ✅ Xong. Đã commit trong `99b4309`. |
| 2 | Nền móng mobile: ApiClient, tự làm mới token, theme Outfit/slate, gộp widget | ✅ Phần nền đã commit trong `99b4309`. Phần thay màu viết cứng làm cùng GĐ3. |
| 3 | Mobile đủ tính năng như web và thay hết màu viết cứng | 🔄 Đang chạy, chưa commit, chưa kiểm tra toàn bộ |
| 4 | Dọn code web: tách file lớn, gộp hàm trùng, lazy layout, bỏ `chart.js` | 🔄 Đang chạy, chưa commit, chưa kiểm tra toàn bộ |
| 5 | Tăng tốc backend: N+1 giỏ hàng, cây danh mục, `.lean()`, index | ✅ Code xong, test riêng đạt (133 test). Chưa commit. |
| 6 | Kiểm tra toàn bộ, CI/CD, commit | 🟡 Một phần (xem bên dưới) |

## Kết quả kiểm tra

### Trên commit `5d2c96f` (trước đợt làm hôm nay)

| Phân hệ | Kết quả |
| :--- | :--- |
| Backend | 81 bộ test, 1.027/1.027 test đạt. Build đạt. **Lint 1 lỗi** ở `landing-pages/landing-page.service.spec.ts:288` (`unbound-method`); file này do phiên bảo mật đang sửa. |
| Frontend | 29 file, 171/171 test đạt. Typecheck, lint, build đạt. |
| Mobile | `flutter analyze` 0 vấn đề, 96/96 test đạt. |

### Các bước CI chạy lại trên máy (22:40)

| Bước trong `ci.yml` | Kết quả |
| :--- | :--- |
| `npm audit --audit-level=high` (backend + frontend) | ✅ Đạt. Còn 30 moderate + 2 low ở backend; ở frontend là moderate, chủ yếu trong dev deps (`@vitest/mocker`, `glob`, `minimatch`). |
| `node --test scripts/load/load.test.js` | ✅ 8/8 |
| `node --test scripts/load/report-explain.test.cjs` | ✅ 1/1 |
| Gitleaks | ⚠️ Máy không cài `gitleaks`. Chỉ chạy trên GitHub Actions. |
| Backend E2E (`test:e2e`, MongoDB replica set qua Docker) | ⏳ Chưa chạy. Phiên QA đang dùng mongod local (DB `truong-thanh-qa-*`, cổng 3101–3107). |
| Playwright E2E | ⏳ Chưa chạy toàn bộ. GĐ4 có chạy `e2e/seo.spec.ts`. |

## Đã làm trong GĐ5 (backend, chưa commit)

- `cart/cart.service.ts`: `getCart` và `syncCart` gộp N+1 thành một truy vấn `$in`. Chuẩn hóa `stock` thiếu thành 0 cho bản ghi cũ, có test hồi quy.
- `categories/categories.service.ts`: hàm thuần `collectDescendantCategoryIds` đọc cây một lần trong bộ nhớ và chống vòng lặp. `products.service.ts` dùng lại hàm này.
- `products.service.ts`, `banners.service.ts`: `.lean()` cho các danh sách công khai, kèm `withLeanDefaults` (`Model.applyDefaults`) để JSON trả về giữ nguyên các trường mặc định.
- `products/schemas/stock-alert.schema.ts`: index `{product: 1, email: 1}`.

## Còn lại / Cần xử lý tiếp

### 1. Kiểm tra và commit GĐ3, GĐ4, GĐ5
- [ ] Khi workflow GĐ3 (mobile) và GĐ4 (web) xong:
  - chạy `cd mobile && flutter analyze && flutter test`;
  - chạy `cd frontend && npm run test:unit && npm run typecheck && npm run lint && npm run build && npx playwright test e2e/seo.spec.ts --project=chromium`.
- [ ] Chạy `cd backend && npm test && npm run lint && npm run build`. Lỗi lint ở `landing-page.service.spec.ts` là của phiên bảo mật; chờ họ sửa xong.
- [ ] Commit theo đường dẫn cụ thể, **không** `git add -A`. Có 5 phiên dùng chung working tree:
  - GĐ5: `backend/src/modules/{cart,categories,banners}/**`, `backend/src/modules/products/{products.service.ts,products.service.spec.ts,schemas/stock-alert.schema.ts}`.
    - ✅ Phần `cart`, `banners`, `categories.service`, `stock-alert` đã commit trong `dbb497d`.
    - ⚠️ `products.service.ts` và `products.service.spec.ts` **chưa commit**. Hai file này chứa cả phần `.lean()`/`withLeanDefaults`/`collectDescendantCategoryIds` của luồng này lẫn bản vá bảo mật của phiên `-62` (`stripPrivateProductFields`, `clampLimit`). Bản vá phụ thuộc `products.controller.ts`, `pagination.dto.ts` và `products.public-exposure.spec.ts`. Đã thống nhất: người dùng review rồi commit hai file này **cùng lúc** với bộ bản vá bảo mật (khoảng 40 file). Không commit riêng, vì commit riêng có thể làm build hoặc test đỏ.
  - GĐ3: `mobile/**`. Không gồm các file đăng ký plugin do Flutter tự sinh cho linux/macos/windows.
  - GĐ4: `frontend/src/{layouts/CustomerLayout.vue,pages/customer/*,components/customer/**,composables/useCountdown.ts,composables/useCoupon.ts,utils/helpers.ts,utils/category.ts,router/index.ts}`, `frontend/package.json` và `package-lock.json`.
    - Chú ý: phiên SEO `-44` cũng đã sửa nhiều file trong nhóm này (router, Home, ProductDetail, ProductList, Cart, CustomerLayout, ProductCard), và chưa commit.

### 2. GĐ3 — Mobile (đang chạy; kiểm tra lại khi xong)
- [ ] Giỏ hàng: lưu cục bộ cho khách vãng lai; đồng bộ `/cart/sync` và `/cart` khi đã đăng nhập.
- [ ] Giá tiền, phí ship, giảm giá, điểm thưởng lấy từ `POST /orders/checkout-preview`.
- [ ] Phương thức thanh toán lấy từ `/payments/methods`. Mở trang VNPay/MoMo. Chuyển khoản hiện hướng dẫn và VietQR.
- [ ] Trang chủ:
  - banner thật từ `/banners/active`;
  - danh mục lấy từ API;
  - chuông thông báo mở được màn thông báo và hiện số chưa đọc thật;
  - tách `home_screen.dart` thành các widget nhỏ.
- [ ] Danh sách sản phẩm: sắp xếp 8 kiểu như web, cuộn vô hạn, debounce 400ms khi tìm kiếm.
- [ ] Bỏ dữ liệu giả: đánh giá mặc định "4.8", đồng hồ đếm ngược tới nửa đêm, nút chia sẻ không làm gì, mô tả lấp chỗ, đoạn đọc `res['otp']`.
- [ ] Chi tiết đơn:
  - nhãn trạng thái thống nhất với web (`core/constants/order_status.dart`);
  - hiện trạng thái thanh toán;
  - link tra cứu GHN;
  - yêu cầu trả hàng.
- [ ] **Hóa đơn PDF trên mobile:** link hiện mở trình duyệt nhưng không kèm token nên bị từ chối. Không có package lưu/mở file nếu không thêm thư viện. Cần quyết định một trong hai:
  - thêm `path_provider` + `open_filex`;
  - backend cấp link ký có thời hạn.
- [ ] Hồ sơ: sửa thông tin, hiện điểm và hạng thành viên, chọn chế độ Theo hệ thống / Sáng / Tối, hotline bấm gọi được.

### 3. GĐ4 — Web (đang chạy; kiểm tra lại khi xong)
- [ ] Tách `CustomerLayout.vue` (2.016 dòng), `Home.vue` (1.639), `ProductDetail.vue` (1.680), `ProductList.vue` (860) và `Checkout.vue` (1.070) vào `components/customer/**`.
- [ ] Giá gạch chỉ hiện khi `discountPrice > 0 && discountPrice < price`. Bỏ dòng "Tiết kiệm 0 đ".
- [ ] Layout tải khi cần (lazy); bỏ `chart.js` và `vue-chartjs`; thêm `loading="lazy"` cho ảnh dưới màn hình đầu.
- [ ] Gộp các bản sao: hàm placeholder, đồng hồ đếm ngược (`useCountdown`), cây danh mục (`utils/category.ts`), xử lý mã giảm giá (`useCoupon`), hàm định dạng trong các trang admin.
- [ ] Thông báo: đánh dấu đã đọc qua API thay vì chỉ lưu localStorage.

### 4. Ngoài phạm vi luồng này (phiên khác phụ trách)
- **CD Deploy lỗi** trên Render sau commit `2bc840b`, nghi do `env.validation.ts`. Phiên audit đã sửa `deploy.yml` và smoke test, nhưng cần xác nhận trên GitHub Actions.
- Lỗi lint `landing-page.service.spec.ts:288` và test `orders/sales-return.spec.ts` (SALES-RET-T06) do phiên bảo mật `-62` đang sửa.
- Thanh toán sandbox VNPay/MoMo, GHN, ký số app: vẫn chờ tài khoản bên thứ ba (xem `PENDING_TASKS.md`).
- Lỗ hổng mức moderate trong dev dependencies: chạy `npm audit fix` trong một PR riêng, không dùng `--force`.
