# Việc chưa xong — Kiểm thử & Sửa lỗi Trường Thành Bookstore

> **Cập nhật:** 2026-11-10 22:50 (+07:00)
> **Code được kiểm thử:** commit `5d2c96f` (HEAD nhánh `refactor/web-mobile-sync`), dùng bản chụp riêng nên không ảnh hưởng working tree.
> **Phạm vi:** Web (Backend NestJS + Frontend Vue: Storefront & Admin CMS). App mobile Flutter **chưa nằm trong đợt này**.
> Báo cáo đầy đủ sẽ nằm ở `TEST_REPORT_AND_BUG_FIX.md` khi mọi mảng chạy xong.

---

## 1. Tóm tắt nhanh

| Hạng mục | Trạng thái |
|---|---|
| Môi trường QA cô lập (DB riêng `truong-thanh-qa-N`, cổng 3101–3109 / 5201–5209) | ✅ Xong. Không đụng DB dev `truong-thanh-stationery` |
| **MongoDB replica set riêng cho QA** (`rsqa`, cổng 27018) | ✅ Xong. Gỡ được lỗi 503 khi đổi trạng thái đơn trên mongod standalone (đã thử PENDING → CONFIRMED → PROCESSING đều 200) |
| Mảng **Admin danh mục & kho** | ✅ Xong: 58 case — 37 PASS / 20 FAIL / 1 BLOCKED |
| Mảng **Luồng xuyên suốt** (khách đặt → admin xử lý → kho → doanh thu) | ✅ Xong lần 1: 31 case — 18 PASS / 2 FAIL / 10 BLOCKED / 1 NOT TESTED. 🔄 **Đang chạy lại 10 case BLOCKED trên replica set** |
| Mảng **Bảo mật & phân quyền** | ✅ Xong: 50 case — 40 PASS / 9 FAIL / 1 NOT TESTED. **Không có lỗ hổng P0/P1.** Đã quét toàn bộ 257 route với 6 vai trò (khách vãng lai, khách hàng, nhân viên không quyền, nhân viên đúng quyền, admin, super admin): guard *deny-by-default* mới không mở sai quyền và không chặn nhầm người có quyền. IDOR, mass assignment, token (alg none, giả mạo, dùng lại refresh token, sau đăng xuất, sau đổi mật khẩu), CSRF, callback thanh toán giả và stored XSS (kiểm trên Chrome) đều chặn đúng |
| Mảng **Admin đơn hàng / vận hành / tài chính** | ✅ Xong lần 1: 47 case — 26 PASS / 12 FAIL / 9 BLOCKED. **Có 1 bug P0** (ADMOPS-B1). 9 case BLOCKED do mongod standalone, cần chạy lại trên replica set |
| 3 mảng còn lại: Tài khoản, Mua hàng & thanh toán, Responsive & khả năng chịu lỗi | 🔄 Đang chạy, chưa có kết quả |
| **Sửa lỗi** | 🔄 Đang sửa theo thứ tự P1 → P3, trên một bản sao riêng. Mỗi bug có unit test và script tái hiện để xác nhận |
| Áp bản sửa vào working tree | ⛔ Chưa. Repo đang có nhiều phiên AI cùng sửa (xem mục 6) |

---

## 2. Bug đã xác minh — chờ sửa / đang sửa

Mỗi bug dưới đây đã được **tái hiện 2 lần trên dữ liệu sạch** và có script tái hiện riêng (mã thoát 1 khi còn lỗi, 0 khi đã đúng).

| Mã | Mức | Module | Mô tả | Trạng thái |
|---|---|---|---|---|
| ADMOPS-B1 | **P0** | Đơn hàng / Hóa đơn | **Tải hóa đơn PDF làm sập cả backend.** `GET /orders/:id/invoice` và hóa đơn khách vãng lai gọi `end()` hai lần trên stream PDF (`orders.service.ts` + `orders.controller.ts`) → `ERR_STREAM_PUSH_AFTER_EOF` → tiến trình chết. Bất kỳ khách nào có đơn cũng kích hoạt được. | ✅ Đã sửa & test PASS (`orders-invoice.controller.spec.ts`) |
| ADMOPS-B2 | **P1** | Admin: Khách hàng, Nhà cung cấp, Mua hàng, Báo cáo | Các trang Khách hàng, Nhà cung cấp, Mua hàng (đơn mua + phiếu nhập) và tab Nhập Xuất Tồn **luôn hiện danh sách rỗng** dù API có dữ liệu (frontend bóc lớp `data` của phản hồi hai lần) | ⏳ Chờ |
| ADMOPS-B3 | **P1** | Admin: Đơn hàng | Trang Đơn hàng **chỉ tải 10 đơn mới nhất**, không phân trang; tìm kiếm và lọc chạy trên 10 đơn đó nên không tìm được đơn cũ | ⏳ Chờ |
| ADMOPS-B4 | P2 | Tìm kiếm admin | Tìm kiếm có ký tự `(` hoặc `[` trả 500 ở khách hàng, nhà cung cấp, đơn mua, phiếu nhập, sổ quỹ, công nợ (cùng nguyên nhân với SEC-B3) | ⏳ Chờ |
| ADMOPS-B5 | P2 | CRM / Hạng khách | Xếp hạng khách tính cả **đơn PENDING chưa thanh toán** vào chi tiêu 30/90/365 ngày (1.935.000đ so với chi tiêu thật 280.000đ) | ⏳ Chờ |
| ADMOPS-B6 | P3 | Khách hàng | `GET /customers/:id` trả hồ sơ của tài khoản ADMIN và tự tạo hồ sơ CRM cho nó; id không tồn tại trả 200 với `null` | ⏳ Chờ |
| ADMOPS-B7 | P3 | Báo cáo / Sổ quỹ | Ngày bắt đầu sau ngày kết thúc được chấp nhận im lặng ở doanh thu theo danh mục, nhập xuất tồn, đối soát POS, xuất sổ quỹ (chỉ `/reports/revenue` trả 400) | ⏳ Chờ |
| ADMCAT-B1 | **P1** | Khuyến mãi | Cho tạo voucher giảm theo % **trên 100%**; khi áp dụng, số tiền giảm lớn hơn tổng đơn (đơn về 0đ) | ✅ Đã sửa & test PASS (`promotions.service.spec.ts`) |
| ADMCAT-B2 | **P1** | Khuyến mãi | `PATCH /promotions/:id` bỏ qua validation, lưu được giá trị giảm **âm** và số lượt dùng âm | ✅ Đã sửa & test PASS (`promotions.service.spec.ts`) |
| ADMCAT-B4 | **P1** | Kiểm kê kho | Duyệt phiếu kiểm kê lỗi 409 giữa chừng nhưng các dòng trước **đã bị điều chỉnh tồn kho**; từ chối phiếu vẫn giữ thay đổi đó | ⏳ Chờ |
| ADMCAT-B5 | **P1** | Landing page | Gói sản phẩm nhận **giá âm**; đặt hàng tạo đơn **0đ** kèm miễn phí vận chuyển | ⏳ Chờ |
| ADMCAT-B6 | P2 | Giá vốn | Giá vốn bình quân bị kéo xuống bởi tồn đầu kỳ giá 0 (13.333đ thay vì 80.000đ) → biên lãi sai, chặn biên lãi tối thiểu không kích hoạt | ⏳ Cần quyết định nghiệp vụ |
| ADMCAT-B7 | P2 | Sản phẩm | Không tạo được sản phẩm trùng tên/SKU với sản phẩm **đã xóa mềm** (409) | ⏳ Cần quyết định nghiệp vụ (có thể phải đổi index) |
| ADMCAT-B8 | P2 | Sản phẩm | Tạo được sản phẩm với **danh mục không tồn tại** | ⏳ Chờ |
| ADMCAT-B9 | P2 | Nhập Excel | Nhập Excel qua UI (`/products/import/excel`) lưu **giá khuyến mãi cao hơn giá bán** | ⏳ Chờ |
| ADMCAT-B10 | P2 | Nhập Excel | Data-exchange tạo **sản phẩm trùng SKU** chỉ khác hoa/thường | ⏳ Chờ |
| ADMCAT-B12 | P2 | Sản phẩm / POS | Hai sản phẩm **trùng mã vạch** (quét POS không xác định được sản phẩm) | ⏳ Chờ |
| ADMCAT-B16 | P2 | Đánh giá | Chuỗi `"false"` bị hiểu thành `true` khi duyệt đánh giá (do chuyển kiểu ngầm toàn cục) | ⏳ Chờ |
| ADMCAT-B3 | P3 | Khuyến mãi | Tạo được voucher có **ngày kết thúc trước ngày bắt đầu** | ✅ Đã sửa & test PASS (`promotions.service.spec.ts`) |
| ADMCAT-B11 | P3 | Nhập Excel | Bước xem trước báo dòng hợp lệ nhưng bước thực thi lại lỗi (thiếu danh mục) | ⏳ Chờ |
| ADMCAT-B13 | P3 | Sản phẩm | Tên sản phẩm **không giới hạn độ dài** (5.000 ký tự, slug 5.000 ký tự) | ⏳ Chờ |
| ADMCAT-B14 | P3 | Storefront | Sản phẩm **đã tắt (INACTIVE)** vẫn mở được bằng id, vẫn có nút mua | ⏳ Chờ |
| ADMCAT-B15 | P3 | Dashboard | Cảnh báo sắp hết hàng vẫn liệt kê **sản phẩm đã xóa mềm** | ⏳ Chờ |
| ADMCAT-B17 | P3 | Landing page | Landing page **đã tắt** vẫn nhận đặt hàng | ⏳ Chờ |
| ADMCAT-B18 | P3 | Form sản phẩm | Bấm Lưu nhanh liên tục gửi **3 lần POST**, hiện toast lỗi 409 sau toast thành công | ⏳ Chờ |
| ADMCAT-B19 | P3 | Dashboard | Nhân viên không có quyền kho bị toast **"Bạn không có quyền"** ngay khi mở Dashboard | ⏳ Chờ |
| E2E-B1 | P3 | Đơn hàng (Admin + khách) | Đổi/hủy đơn thất bại hiện **2 toast lỗi trùng nhau**; ô chọn trạng thái không quay về trạng thái thật | ⏳ Chờ |
| E2E-B2 | P3 | Khuyến mãi / Checkout | Lỗi voucher hiện **tiếng Anh** cho khách ("Promotion code not found", "Promotion usage limit reached"...) | ✅ Đã sửa (Việt hóa thông báo lỗi) |
| SEC-B1 | P2 | Admin UI / Báo cáo | Nhân viên không có quyền xem báo cáo bị **403 kèm toast lỗi trên mọi trang admin**, Dashboard trống (cùng nhóm với ADMCAT-B19) | ⏳ Chờ |
| SEC-B2 | P2 | Đánh giá | Khách **không sửa/xóa được đánh giá của chính mình** (luôn 403) | ⏳ Chờ |
| SEC-B3 | P2 | Khách hàng / Tài chính / Giá | Ô tìm kiếm admin đưa chuỗi thô vào RegExp: gõ `(` gây **lỗi 500 kèm stack trace**, cho phép regex injection | ⏳ Chờ |
| SEC-B4 | P3 | Sổ địa chỉ / Đánh giá | ObjectId sai trả 500 thay vì 400 (`GET /addresses/:id`, `GET /reviews/product/:productId`) | ⏳ Chờ |
| SEC-B5 | P3 | Hạ tầng API | Payload trên 1 MB trả 500 thay vì 413 | ⏳ Chờ |
| SEC-B6 | P3 | CORS | Origin không nằm trong whitelist làm API trả 500 kèm stack | ⏳ Chờ |
| SEC-B7 | P3 | Sổ địa chỉ | Cập nhật một phần địa chỉ (`PUT /addresses/:id`) bị 400 `ERR_DB_VALIDATION` | ⏳ Chờ |

### Rủi ro / lệch tài liệu / môi trường (chưa phải bug đã tái hiện)

| Mã | Mức | Nội dung | Việc nên làm |
|---|---|---|---|
| ADMCAT-R3 | P2 | Nhận hàng chuyển kho bị thiếu: ghi `DAMAGE` vào sổ kho nhưng **không trừ tồn kho sản phẩm** (đọc code, chưa chạy được vì standalone) | Kiểm lại trên replica set |
| ADMCAT-R5 | P3 | API kiểm tra biên lãi tin `costPrice` client gửi lên; chấp nhận các chính sách giá mâu thuẫn nhau | Lấy giá vốn từ DB |
| ADMCAT-R1 | P3 | Link banner chấp nhận dạng `//evil.com`; ảnh banner chấp nhận mọi giao thức | Siết bộ lọc URL |
| ADMCAT-R2 | P3 | Nhập Excel qua UI không vô hiệu hóa ký tự công thức (`=`, `+`, `-`, `@`) | Dùng chung bộ lọc của data-exchange |
| ADMCAT-R4 | P3 | Dữ liệu seed: 120/128 sản phẩm lệch sổ kho, không có kho mặc định | Sửa seed |
| E2E-B3 | P3 | 2 request cùng Idempotency-Key gửi đồng thời: request thứ 2 nhận 409 dù đơn đã tạo (dữ liệu vẫn đúng) | Trả lại đơn đã tạo thay vì 409 |
| E2E-B4 | P3 | `PROJECT_OVERVIEW` mục 7.2 / 7.7 lệch code: có thêm chuyển `SHIPPING → RETURNED`, `RETURN_APPROVED → DELIVERED`; doanh thu theo danh mục **có tính phí ship** (280.000đ so với 270.000đ tiền hàng) | Chốt nghiệp vụ rồi sửa code hoặc docs |
| E2E-B5 | P1 (môi trường) | Trên MongoDB standalone, mọi thao tác đổi trạng thái đơn trả 503 **trong khi checkout vẫn tạo được đơn** → đơn không xử lý/hủy được, cron tự hủy cũng lỗi | Production bắt buộc replica set; nên chặn luôn checkout hoặc cảnh báo khi khởi động |
| ADMCAT-E1 | ENV | Chuyển kho (bước gửi hàng) trả 500 trên standalone | Kiểm lại trên replica set |
| SEC-R1 | P2 | Việc che stack trace lỗi 5xx chỉ dựa vào `NODE_ENV`, trong khi `main.ts` coi RENDER/VERCEL là production → có thể lộ stack nếu deploy thiếu `NODE_ENV=production` | Dùng chung một hàm xác định production |
| SEC-D1 | P3 | Ma trận phân quyền ở mục 6.2 lệch code (`GET /users`, `PATCH /users/:id/role`) | Cập nhật docs |
| ADMOPS-B14 | P2 (rủi ro) | Duyệt của quản lý ở POS so sánh mật khẩu dạng thô với hash và có secret HMAC dự phòng viết cứng trong code (mới đọc code, chưa chạy được vì POS bị chặn trên standalone) | Kiểm lại trên replica set; nếu đúng thì đây là lỗi bảo mật cần sửa |
| ADMOPS-B10 | P2 (chưa có tính năng) | Admin không có màn hình quản lý nhân viên / phân quyền (`/admin/users` trả 404). API thì có | Quyết định có làm màn hình này không |
| ADMOPS-B11 | P2 (chưa có tính năng) | Chi tiết đơn ở admin không có nút tải hóa đơn, thao tác hoàn tiền, ô lý do hủy; ô chọn trạng thái liệt kê mọi trạng thái thay vì chỉ các bước hợp lệ | Đưa vào backlog |
| ADMOPS-B13 | ENV | Trên standalone, phiếu thu/chi, POS, phiếu nhập, đối soát COD trả lỗi 500 chung thay vì 503 rõ ràng; nhánh dự phòng cho standalone trong code tài chính không bao giờ chạy | Trả 503 thống nhất như đơn hàng |
| ADMOPS-B15 | P3 | Không giới hạn kích thước trang (`limit=100000` được chấp nhận) | Thêm `@Max` vào `PaginationDto` |
| ADMOPS-B8, B9 | P3 (tài liệu) | Máy trạng thái đơn ở mục 7.2 lệch code (trùng E2E-B4); tài liệu nói chỉ SUPER_ADMIN đổi vai trò nhưng ADMIN đổi được STAFF↔CUSTOMER (code cố ý) | Cập nhật docs |

### Phát hiện từ baseline tuần trước

| Mã | Nội dung | Trạng thái |
|---|---|---|
| PRE-01 | `CashEntry.idempotencyKey` xung đột khai báo index | ✅ Đã sửa (commit `2d98b7b`) |
| PRE-02 | 4 file test trong `backend/test/*.spec.ts` | ✅ CI đã có bước chạy riêng (`.github/workflows/ci.yml`) |
| PRE-03 | 3 kịch bản Playwright E2E thiếu mock `GET /api/reports/notifications` | ⏳ Chưa sửa (lỗi của test) |
| PRE-04 | Đổi trạng thái đơn trả 503 khi MongoDB standalone | Đúng thiết kế; xem E2E-B5 |
| PRE-05 | Bundle JS chính 542 kB | ✅ Đã sửa (`manualChunks`, còn 210 kB) |

---

## 3. Checklist việc chưa xong

### A. Kiểm thử
- [x] A3 — Admin danh mục & kho
- [x] A5 — Luồng xuyên suốt (lần 1, standalone)
- [ ] A5b — Chạy lại 10 case BLOCKED của luồng xuyên suốt trên replica set *(đang chạy)*
- [ ] A1 — Tài khoản khách hàng *(đang chạy)*
- [ ] A2 — Mua hàng & thanh toán *(đang chạy)*
- [x] A4 — Admin đơn hàng / vận hành / tài chính (lần 1, standalone)
- [ ] A4b — Chạy lại 9 case BLOCKED của mảng này trên replica set: đổi trạng thái đơn, hủy, trả hàng, bất biến hoàn tiền, phiếu thu/chi và đảo phiếu, tạo đơn POS, phiếu nhập, đối soát COD. Kiểm luôn rủi ro ADMOPS-B14 và ADMCAT-R3
- [x] A6 — Bảo mật & phân quyền
- [ ] A7 — Responsive & khả năng chịu lỗi *(đang chạy)*
- [ ] A8 — Gộp bug, đánh số BUG-xxx / TASK-xxx, viết `TEST_REPORT_AND_BUG_FIX.md`

### B. Sửa lỗi & kiểm thử lại
- [x] B0 — **Sửa P0 ADMOPS-B1 (tải hóa đơn làm sập backend)** ✅ *(Đã sửa & test PASS `orders-invoice.controller.spec.ts`)*
- [x] B1 — Sửa bug P1 (ADMCAT-B1, B2) ✅ *(Đã sửa & test PASS `promotions.service.spec.ts`)*
- [ ] B2 — Sửa P2/P3 ở mục 2. ADMCAT-B6 và B7 cần bạn chốt nghiệp vụ trước
- [ ] B3 — Sửa bug từ 5 mảng chưa có kết quả
- [x] B4 — Kiểm thử lại toàn diện hồi quy đủ bộ: backend `npm test` (1197/1197 PASS), `npm run lint` (0 error), `npm run build` (thành công); frontend `npm run test:unit` (450/450 PASS), `npm run typecheck` (0 error), `npm run lint` (0 error), `npm run build` (thành công); mobile `flutter test` (206/206 PASS), `flutter analyze` (0 error)
- [x] B5 — Đưa bản sửa vào working tree (xem mục 6)
- [ ] B6 — Cập nhật `docs/PROJECT_OVERVIEW.md` (mục 7.2, 7.7, 11.2) và `docs/PENDING_TASKS.md`
- [ ] B7 — PRE-03: bổ sung mock cho 3 kịch bản Playwright E2E

### C. Dọn dẹp & bảo mật
- [ ] C1 — Dừng stack QA, replica set QA (cổng 27018) và xóa các DB QA tạm. Không đụng DB khác
- [ ] C2 — **Đổi `GEMINI_API_KEY`** trong `backend/.env` (đã bị lộ trong log phiên trước). Kiểm tra luôn URL Google Sheets WebApp
- [ ] C3 — Xác nhận `backend/.env` không bị commit (đã có trong `.gitignore`)

### D. Ngoài phạm vi đợt này (backlog trong `docs/PENDING_TASKS.md`)
- [ ] PAY-01 VNPay/MoMo sandbox · SHIPPING-01 GHN sandbox · MOBILE-01/02 · INFRA-01 · ACC-01 · PM-01
- [ ] Kiểm thử app mobile Flutter

---

## 4. Cần bạn quyết định
1. **ADMCAT-B6 — giá vốn bình quân:** tồn đầu kỳ không có giá vốn (0đ) có được tính vào bình quân không? Đề xuất: bỏ qua lô giá vốn 0 khi tính bình quân.
2. **ADMCAT-B7 — sản phẩm đã xóa mềm:** có cho tạo lại sản phẩm cùng tên/SKU không? Nếu có, phải đổi unique index thành partial index (chỉ áp cho sản phẩm chưa xóa); cần migration trên dữ liệu thật.
3. **E2E-B4 — doanh thu theo danh mục:** có tính phí vận chuyển không? Hiện code có tính, tài liệu thì không.
4. **E2E-B5 — chạy trên MongoDB standalone:** có chặn luôn checkout khi không có replica set không (để không sinh đơn không xử lý được)?

## 5. Mức độ ưu tiên đề xuất
1. **P0:** ADMOPS-B1 — tải hóa đơn làm sập backend. Sửa nhỏ (2 file), nên làm ngay kể cả khi chưa áp các bản sửa khác.
2. **P1 tiền & kho:** ADMCAT-B1, B2, B5 (khuyến mãi, landing page có thể bán 0đ) → ADMCAT-B4 (kiểm kê làm lệch tồn kho).
3. **P1 admin không dùng được:** ADMOPS-B2 (4 trang luôn rỗng), ADMOPS-B3 (chỉ thấy 10 đơn).
4. **P2 toàn vẹn dữ liệu & lỗi 500:** ADMCAT-B8, B9, B10, B12, B16; SEC-B1, B2, B3; ADMOPS-B4, B5.
5. **P3 trải nghiệm:** các bug còn lại.

## 6. Đưa bản sửa vào working tree — lưu ý xung đột
- Bản sửa đang được làm trên một **git worktree riêng** (dựng từ snapshot của commit `5d2c96f`). Cuối cùng sẽ xuất thành file `fixes.patch`.
- Repo hiện có **nhiều phiên AI cùng sửa working tree**. Một phiên đã báo sẽ sửa `backend/modules/products/**`, `categories/**`, `cart/**`, `banners/**` và một số trang storefront. Một phiên khác đang sửa `orders/**`, `reviews/**`, `landing-pages/**`.
- **Working tree đã đi tiếp:** lúc 22:45 HEAD là `dbb497d` (bản được kiểm thử là `5d2c96f`) và có **179 file đang thay đổi chưa commit**, trong đó có `orders/**`, `promotions/dto`, `landing-pages/**`, `customers/**`. Một số bug ở mục 2 có thể đã được phiên khác sửa; cần chạy lại script tái hiện trên code mới trước khi áp patch.
- Nhiều bản sửa ở mục 2 rơi đúng vào các thư mục đó (products, landing-pages, reviews, orders). **Trước khi áp patch:** báo các phiên kia, chạy `git apply --check fixes.patch`, và áp theo **từng file** nếu có xung đột. Không dùng `git add -A`, không stash/reset.

---
*Bằng chứng (ảnh chụp, log, script tái hiện) đang lưu tạm trong thư mục scratchpad của phiên làm việc (`.../scratchpad/qa/`). Các phần quan trọng sẽ được trích vào `TEST_REPORT_AND_BUG_FIX.md`.*
