# Đồng bộ Web ↔ Mobile và tối ưu mã nguồn

> Nhánh: `refactor/web-mobile-sync` · Bắt đầu: 2026-11-03
> Tài liệu theo dõi tiến độ. Việc nào chưa xong nằm ở mục **Còn lại**.
> Kiến trúc và nghiệp vụ chung xem [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md); backlog chung xem [`PENDING_TASKS.md`](PENDING_TASKS.md).

## Quyết định đã chốt

- Mobile theo sát giao diện web: đỏ `#dc2626`, font Outfit, bảng màu slate, bỏ gradient đỏ–cam làm màu thương hiệu.
- Giữ hiệu ứng "kính" của thanh điều hướng dưới, bổ sung nhãn chữ và nhãn cho trình đọc màn hình.
- Backend là nguồn chân lý cho giá, phí ship, giảm giá, điểm thưởng. Web và mobile chỉ hiển thị số do server tính.
- Không thêm thư viện mới, không đổi kiến trúc.

## Kết quả gốc trước khi sửa

| Phân hệ | Test | Lint / Analyze | Build |
| :--- | :--- | :--- | :--- |
| Backend | 75 bộ test, 885 test đạt | 0 lỗi, 2.573 cảnh báo (trần 2.650) | Đạt |
| Frontend | 22 file, 109 test đạt | 0 lỗi, typecheck 0 lỗi | Đạt |
| Mobile | 47 test đạt | 0 vấn đề | — |

## Tiến độ

| Giai đoạn | Nội dung | Trạng thái |
| :---: | :--- | :---: |
| 0 | Sửa 7 lỗi đã xác nhận | ✅ Xong, toàn bộ kiểm tra đạt |
| 1 | Backend tính giá cho cả web và mobile, web bỏ tự tính tiền, thống nhất nhãn trạng thái đơn | ⏸️ Dừng giữa chừng (hết token) |
| 2 | Nền móng mobile: ApiClient dùng chung, tự làm mới token, màu và font theo web, chế độ tối, gộp widget trùng | ⏸️ Dừng giữa chừng (hết token) |

> ⚠️ **Trạng thái khi dừng (2026-11-03):**
> - GĐ1 và GĐ2 đã sửa một phần file nhưng **chưa được kiểm tra**. Các file `backend/src/modules/{orders,cart,promotions,auth}`, `frontend/src/{stores/cart.ts,pages/customer/*}` và `mobile/lib/**` có thể đang ở trạng thái dở dang.
> - **Chưa commit gì cả.** Thay đổi của GĐ0 nằm chung trong các file này, nên chưa tách commit riêng được.
> - **Khi làm tiếp:**
>   1. Chạy `git status` và `git diff`.
>   2. Chạy lại bộ kiểm tra ở mục Giai đoạn 6.
>   3. Sửa lỗi, hoặc làm lại GĐ1/GĐ2 theo checklist bên dưới.
> - Trong cùng phiên Claude Code này, có thể chạy tiếp workflow bằng `resumeFromRunId` `wf_b812c340-8b9` (GĐ1) và `wf_01d064db-f1f` (GĐ2). Các agent đã chạy xong sẽ dùng lại kết quả, không chạy lại.
> - Các file của phiên làm việc song song (guard, seed, config, users, reports, ProductCard, AdminLayout, deploy.yml…) **không thuộc luồng này**. Khi commit, phải loại các file đó ra.
| 3 | Mobile đủ tính năng như web | ⏳ Chờ GĐ1 + GĐ2 |
| 4 | Dọn code web: tách file lớn, gộp hàm trùng, giảm dung lượng tải | ⏳ Chờ GĐ1 |
| 5 | Tăng tốc backend: giỏ hàng N+1, cây danh mục, `.lean()`, index | ⏳ Chờ GĐ1 |
| 6 | Chạy toàn bộ kiểm tra, kiểm tra CI/CD, commit | ⏳ |

### Giai đoạn 0 — Đã sửa

1. Checkout web: `watch` chạy trước khi biến được khai báo, khiến trang lỗi khi tải. Có test hồi quy `CheckoutPreviewWatch.spec.ts`.
2. Deal Hot web đọc sai dạng dữ liệu trả về, danh sách luôn trống (`DealHot.spec.ts`).
3. Link ở trang chủ dùng `?search=`, trong khi trang sản phẩm đọc `?q=`.
4. Hủy đơn khách vãng lai gọi nhầm API của tài khoản đăng nhập (`OrderDetailGuestCancel.spec.ts`).
5. Mobile: bấm tim không lưu lên server, lần đồng bộ sau ghi đè mất mục đã thích. Đồng bộ danh sách yêu thích trước đây chưa bao giờ chạy.
6. Mobile: đặt hàng gửi cả món không được chọn. Sau khi đặt, chỉ xóa đúng các món đã đặt.
7. OTP: xác nhận backend không bao giờ trả mã OTP thô (có test khóa). Banner "OTP dev" trên web và mobile chỉ hiện ở bản dev.

## Còn lại

### Giai đoạn 1 — Giá do server tính
- [ ] `checkout-preview` chạy được khi chưa có địa chỉ và số điện thoại, trả thêm thông tin điểm thưởng (điểm hiện có, tối đa được dùng, tối thiểu).
- [ ] Web (`stores/cart.ts`, `Cart.vue`, `Checkout.vue`) bỏ tự tính phí ship, giảm giá, tổng tiền, quy tắc điểm.
- [ ] Bỏ địa chỉ giả `'Hà Nội'` và số `'0900000000'` gửi khi xem trước giá.
- [ ] Bảng nhãn và màu trạng thái đơn duy nhất ở `utils/helpers.ts`, dùng chung cho `StatusBadge`, `MyOrders`, `OrderDetail`.
- [ ] Ẩn nút "Yêu cầu hoàn trả" với đơn khách vãng lai (API yêu cầu đăng nhập).
- [ ] Bỏ chuỗi pepper OTP viết cứng (`auth.service.ts`). Thứ tự lấy giữ nguyên: `OTP_PEPPER`, nếu không có thì `JWT_RESET_SECRET`.

### Giai đoạn 2 — Nền móng mobile
- [ ] `core/network/api_client.dart`: gắn header chung, mở envelope `{success,data,meta}`, timeout, gặp 401 thì làm mới token một lần rồi gọi lại, chỉ đăng xuất khi gặp 401/403.
- [ ] Chuyển khoảng 35 lời gọi `http.*` rải rác sang ApiClient.
- [ ] `AppTheme` và `AppPalette` (sáng/tối) theo token web; font Outfit; theo chế độ sáng/tối của hệ thống.
- [ ] Thay khoảng 194 mã màu và 173 `Colors.xxx` viết cứng bằng token; sửa chế độ tối.
- [ ] Gộp 2 file `shimmer_loading.dart`; gom `lib/widgets/` vào `lib/core/widgets/`.
- [ ] Thanh điều hướng: nhãn chữ, `Semantics`, vùng chạm tối thiểu 48dp.

### Giai đoạn 3 — Mobile đủ tính năng như web
- [ ] Giỏ hàng đồng bộ server (`/cart/sync`, `/cart`); không mất giỏ khi tắt app.
- [ ] Checkout dùng `checkout-preview`; phương thức thanh toán lấy từ `/payments/methods`; điểm thưởng.
- [ ] Mở trang VNPay/MoMo; hiển thị VietQR cho chuyển khoản.
- [ ] Chi tiết đơn: nhãn trạng thái chuẩn, trạng thái thanh toán, yêu cầu trả hàng, link tra cứu GHN, tải hóa đơn có xác thực.
- [ ] Trang chủ: banner `/banners/active` và danh mục thật thay cho nội dung viết cứng; tách `home_screen.dart` (1.197 dòng) thành các widget.
- [ ] Danh sách sản phẩm: sắp xếp, phân trang, debounce khi tìm kiếm.
- [ ] Mở được màn thông báo từ chuông; số chưa đọc thật.
- [ ] Hồ sơ: sửa thông tin, hiển thị điểm và hạng thành viên.
- [ ] Gỡ giao diện giả: đánh giá mặc định "4.8", nút chia sẻ, mô tả lấp chỗ, hotline không bấm được, code đọc `res['otp']` còn sót.

### Giai đoạn 4 — Dọn code web
- [ ] Tách `CustomerLayout.vue` (2.016 dòng), `Home.vue`, `ProductDetail.vue`, `Checkout.vue`, `ProductList.vue`.
- [ ] Hiện giá gạch chỉ khi `discountPrice > 0 && discountPrice < price` (`ProductDetail.vue`, `Home.vue`); bỏ dòng "Tiết kiệm 0 đ".
- [ ] Tải sau layout Admin; tách vendor chunk (bundle chính hiện khoảng 524KB); bỏ `chart.js` / `vue-chartjs` không dùng; `loading="lazy"` cho ảnh.
- [ ] Gộp hàm trùng: placeholder ảnh, đồng hồ đếm ngược, đường dẫn danh mục, xử lý mã giảm giá.
- [ ] Thông báo: đánh dấu đã đọc qua API thay vì chỉ lưu localStorage.

### Giai đoạn 5 — Backend
- [ ] `cart.service.ts`: thay N+1 `findById` bằng một truy vấn `$in`.
- [ ] Tìm danh mục con: dùng chung một hàm, đọc cây một lần trong bộ nhớ.
- [ ] `.lean()` cho các danh sách sản phẩm và banner công khai (kiểm tra cách serialize trước khi đổi).
- [ ] Index cho `stock-alert` (`product`, `product+email`).

### Giai đoạn 6 — Hoàn tất
- [ ] Toàn bộ test, lint, typecheck, build và `flutter analyze` / `flutter test` đạt.
- [ ] Chạy tại máy các bước trong `.github/workflows/ci.yml`.
- [ ] Commit theo giai đoạn, chỉ gồm file của luồng này.

## Ngoài phạm vi luồng này

Do phiên làm việc song song phụ trách: guard phân quyền, seed, cấu hình môi trường, trang Admin, `ProductCard.vue`, `deploy.yml` và smoke test.

- **CD Deploy đang lỗi** trên các commit sau `2bc840b`, nghi do `env.validation.ts` khi chạy trên Render. Phiên làm việc song song đang xử lý.
- Thanh toán sandbox VNPay/MoMo, GHN, ký số app: vẫn chờ tài khoản bên thứ ba (xem `PENDING_TASKS.md`).
