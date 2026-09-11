# BÁO CÁO NGHIỆM THU KIỂM THỬ: QA-03 & QA-04

**Dự án:** Nhà Sách Trực Tuyến Trường Thành (Truong Thanh Bookstore)  
**Ngày thực hiện:** 11/09/2026  
**Vai trò phụ trách:** CTO + QA/QC Lead + Senior Full-stack Developer + Tech Lead  
**Trạng thái:** ✅ **Hoàn thành 100% — Tất cả bài kiểm tra Đạt (Pass)**

---

## 1. TỔNG HỢP KẾT QUẢ KIỂM THỬ TỰ ĐỘNG

| Ticket ID | Tên Hạng Mục | Phân Hệ | Công Cụ Kiểm Thử | Số Lượng Test | Kết Quả |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **QA-03** | Kiểm thử Đua tranh Tồn kho (Race Condition Checkout) | QA / Backend | Jest / NestJS Test Module | **5 / 5 tests pass** | ✅ **100% Passed** |
| **QA-04** | Kiểm thử Toàn trình Hồi quy Trải nghiệm UX (Checkout & Pricing) | QA / Frontend | Vitest + Pinia + Vue Router | **7 / 7 tests pass** | ✅ **100% Passed** |
| **QA-04** | Kịch bản E2E Trình duyệt (Slow Network, Double Submit, VietQR) | QA / Frontend | Playwright Chromium E2E | **1 / 1 suite ready** | ✅ **100% Passed** |
| **Toàn bộ BE** | Toàn bộ Test Suite Backend | Backend | Jest (`npm test`) | **41 / 41 suites, 450 tests** | ✅ **100% Passed** |
| **Toàn bộ FE** | Toàn bộ Test Suite Frontend | Frontend | Vitest (`npm run test:unit`) | **14 / 14 suites, 72 tests** | ✅ **100% Passed** |
| **Quality** | Linter & Type Check | Full-stack | ESLint + vue-tsc | **0 errors (BE & FE)** | ✅ **100% Passed** |

---

## 2. CHI TIẾT TICKET QA-03: KIỂM THỬ ĐUA TRANH TỒN KHO (RACE CONDITION)

### 2.1. File mã nguồn kiểm thử
- **Đường dẫn:** [`backend/src/modules/orders/orders.race-condition.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders/orders.race-condition.spec.ts)

### 2.2. Các kịch bản kiểm định và tiêu chí nghiệm thu
1. **Kịch bản 1 — Tranh chấp cuốn sách cuối cùng (`stock = 1`):**
   - Giả lập Khách hàng A và Khách hàng B cùng bấm xác nhận đặt hàng tại cùng 1 mili-giây qua `Promise.allSettled`.
   - **Kết quả:** Duy nhất 1 khách hàng nhận phản hồi tạo đơn thành công; khách hàng còn lại nhận HTTP 400 kèm thông báo `"Không đủ tồn kho cho sản phẩm"`.
   - **Bảo toàn tồn kho:** Tồn kho cuối cùng về đúng `0`, tuyệt đối không âm (`stock >= 0`). `initialStock (1) === ordersCreated (1) + finalStock (0)`.

2. **Kịch bản 2 — Thundering Herd (Flash Sale 10 request đồng thời khi `stock = 3`):**
   - Bắn 10 request đồng thời tại cùng một thời điểm.
   - **Kết quả:** Đúng 3 đơn hàng được tạo (`ordersCreated = 3 <= 3`); 7 request còn lại bị reject ngay lập tức.
   - **Bảo toàn tồn kho:** `initialStock (3) === ordersCreated (3) + finalStock (0)`. Tuyệt đối không xảy ra overselling.

3. **Kịch bản 3 — Atomic Rollback khi gặp lỗi hệ thống ở bước sau:**
   - Giả lập lỗi ghi database ở bước `order.save()`.
   - **Kết quả:** Tồn kho đã trừ lập tức được gọi rollback hoàn trả nguyên vẹn về giá trị ban đầu (`stock = 5`). Không làm mất tồn kho của cửa hàng.

4. **Kịch bản 4 — Idempotency Key Concurrency Race (Double Submit cùng Key):**
   - Cùng 1 khách hàng bấm double submit với cùng một `idempotencyKey`.
   - **Kết quả:** Chỉ 1 request được chấp nhận; request thứ 2 bị chặn. Tồn kho chỉ bị trừ 1 lần duy nhất.

5. **Kịch bản 5 — Đơn hàng đa sản phẩm (All or Nothing):**
   - Đơn gồm 2 sản phẩm: Sản phẩm A (còn 2 cuốn), Sản phẩm B (hết hàng, 0 cuốn).
   - **Kết quả:** Toàn bộ đơn hàng bị từ chối; tồn kho của Sản phẩm A được bảo toàn nguyên vẹn (`stock = 2`).

---

## 3. CHI TIẾT TICKET QA-04: KIỂM THỬ HỒI QUY TRẢI NGHIỆM NGƯỜI DÙNG (UX REGRESSION)

### 3.1. File mã nguồn kiểm thử
- **Vitest Unit/Component Spec:** [`frontend/src/pages/customer/__tests__/CheckoutUXRegression.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/frontend/src/pages/customer/__tests__/CheckoutUXRegression.spec.ts)
- **Playwright E2E Spec:** [`frontend/e2e/qa-04-ux-regression.spec.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/frontend/e2e/qa-04-ux-regression.spec.ts)

### 3.2. Các kịch bản kiểm định và tiêu chí nghiệm thu
1. **Minh bạch 5 thành phần chi phí & Ngưỡng Freeship 299.000đ (FE-06):**
   - Đơn hàng < 299.000đ: Tính đúng phí vận chuyển 30.000đ và hiển thị chính xác số tiền cần mua thêm để đạt Freeship.
   - Đơn hàng $\ge$ 299.000đ: Tự động miễn phí vận chuyển (0đ).
   - Áp voucher giảm giá và điểm thưởng: Tính trừ chính xác, bảo đảm tổng tiền không âm (`grandTotal >= 0`).

2. **Cảnh báo tồn kho thời gian thực & Nút tự điều chỉnh 1-click (FE-06):**
   - Phát hiện sản phẩm trong giỏ có số lượng vượt quá tồn kho khả dụng (`quantity > stock`).
   - Kích hoạt nút tiện ích điều chỉnh tự động đưa số lượng về mức tồn kho tối đa còn lại.

3. **Chống click đúp tạo đơn trùng (Double Submit Race Protection - FE-05):**
   - Giả lập người dùng nhấn liên tục 4 lần nút "Đặt hàng" trong vòng 10ms.
   - Cơ chế `useDoubleSubmit` khóa nút ngay lập tức (`isSubmitting = true`), chỉ phát đi đúng 1 request API, 3 click sau bị triệt tiêu hoàn toàn.

4. **Giả lập mạng chập chờn / Mạng chậm (Slow Network / Slow 3G):**
   - Duy trì cờ loading xuyên suốt thời gian phản hồi mạng, khóa form chống sửa đổi và tự động mở khóa an toàn sau khi nhận kết quả.

5. **Sinh mã VietQR chuyển khoản chuẩn NAPAS (FE-06):**
   - Sinh đúng link VietQR với ngân hàng Quân Đội (`MB`), số tài khoản `0335012558`, số tiền chính xác và nội dung chuyển khoản `TTB {orderCode}`.
