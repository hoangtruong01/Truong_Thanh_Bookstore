# 📊 TIẾN ĐỘ SỬA LỖI & HOÀN THIỆN DỰ ÁN (AUDIT PROGRESS)
> **Cập nhật:** 2026-09-22  
> **Cam kết:** Bám sát mã nguồn thực tế, phân loại minh bạch, sửa từng nhóm nhỏ và kiểm thử 100%.

---

## 1. 📋 Bảng Phân Loại Hiện Trạng Lỗi & Kết Quả Xử Lý (P0 Scope)

| Mã Lỗi | Tên Lỗi & Phạm Vi | Phân Loại | Bằng Chứng Mã Nguồn & Thay Đổi Đã Thực Hiện | Trạng Thái Xử Lý |
| :---: | :--- | :---: | :--- | :---: |
| **BE-01** | **Callback thanh toán:** Chỉ dùng dữ liệu đã xác minh chữ ký; không verify 1 đằng ghi 1 nẻo; kiểm soát replay, transaction reuse & method enabled. | **CONFIRMED** | `payment.providers.ts` trả về `verifiedData`; `payments.service.ts` kiểm tra `ENABLED_PAYMENT_METHODS`, chặn transaction reuse đa đơn hàng, chỉ lấy amount/txn/ref từ kết quả verify. | ✅ **DONE** (Unit test: `payment-be01-be02.spec.ts`) |
| **BE-02** | **Trạng thái payment/order:** Ngăn cron/payment cũ ghi lùi trạng thái PAID; xử lý callback thành công sau hủy/hết hạn bằng MANUAL_REQUIRED; conditional updates. | **CONFIRMED** | Guard `{ paymentStatus: { $ne: PAID } }` trong `syncOrderPaymentStatus`; xử lý late callback vào quy trình đối soát `RefundStatus.MANUAL_REQUIRED`; conditional update trong `reconcilePendingPayments()`. | ✅ **DONE** (Unit test: `payment-be01-be02.spec.ts`) |
| **BE-03** | **Guest checkout & Idempotency:** Replay trả guest credential hợp lệ; phát hiện cùng key khác payload; không dùng key cũ cho giỏ mới. | **CONFIRMED** | Thêm HMAC deterministic token derivation `deriveGuestAccessToken`; lưu `idempotencyPayloadHash` và phát hiện sai lệch payload trả `ConflictException`. | ✅ **DONE** (Unit test: `checkout-be03.spec.ts`) |
| **BE-04** | **Tồn kho nhất quán:** Loại bỏ sửa `stock` trực tiếp qua `PATCH /products/:id`; mọi biến động qua `InventoryService` có actor/reason; không nuốt lỗi tạo inventory. | **CONFIRMED** | Gỡ bỏ `stock` khỏi `UpdateProductDto`; `ProductsService.update()` loại trừ trường `stock`; `ProductsService.create()` rollback xóa product và quăng `BadRequestException` nếu tạo inventory thất bại; `ProductForm.vue` khóa sửa tồn kho. | ✅ **DONE** (Unit test: `product-inventory-be04.spec.ts`) |
| **BE-05** | **Email & Dữ liệu nhạy cảm:** Không log OTP/token; không báo thành công khi SMTP lỗi; phân biệt dev simulation vs prod delivery. | **CONFIRMED** | `EmailService.sendMail` trả `false` khi SMTP throw error; chặn simulation và báo lỗi trong production khi thiếu SMTP; ẩn mã OTP 6 chữ số (`******`) trong log simulation dev. | ✅ **DONE** (Unit test: `email.service.spec.ts`) |
| **FS-01** | **Phương thức thanh toán:** UI chỉ hiển thị phương thức backend bật; bỏ tài khoản/QR/tiền hardcode; không hứa tự xác nhận chuyển khoản khi chưa có bot. | **CONFIRMED** | Backend cung cấp endpoint `GET /payments/methods`; Frontend `paymentService.getEnabledMethods()` lọc danh sách động; bỏ MB Bank `0345678999` hardcode và thay thông điệp đối soát thực tế. | ✅ **DONE** (Unit test: `CheckoutUXRegression.spec.ts`) |
| **FE-01** | **Checkout Web:** Sửa contract preview và create order; hiển thị giá, phí, discount từ server; xử lý thay đổi giá/kho giữa preview và create. | **CONFIRMED** | Bổ sung `loyaltyPointsUsed` vào `CheckoutPreviewDto`; `Checkout.vue` đồng bộ giá trị `serverPricing` hiển thị bảng chi phí và gán `lastSubmittedTotal` từ order server response. | ✅ **DONE** (Unit test: `CheckoutUXRegression.spec.ts`) |

---

## 2. 🧪 Báo Cáo Kiểm Thử & Nghiệm Thu Toàn Dự Án

### Backend (NestJS + TypeScript)
- **Unit & Integration Tests (`npm test`):**
  - **Test Suites:** 49 passed, 49 total (100% PASS)
  - **Tests:** 503 passed, 503 total (100% PASS)
  - Bao gồm các suite regression mới:
    - `src/modules/payments/payment-be01-be02.spec.ts` (5/5 tests)
    - `src/modules/orders/checkout-be03.spec.ts` (2/2 tests)
    - `src/modules/products/product-inventory-be04.spec.ts` (2/2 tests)
    - `src/modules/email/email.service.spec.ts` (4/4 tests)
    - `src/modules/orders/orders.race-condition.spec.ts` (5/5 tests)
- **Linting (`npm run lint`):** 0 errors, 1134 warnings (nằm trong hạn mức `--max-warnings 1200`)
- **Build (`npm run build`):** Compile thành công 100%.

### Frontend (Vue 3 + Vite)
- **Unit Tests (`npm run test:unit`):**
  - **Test Suites:** 14 passed, 14 total (100% PASS)
  - **Tests:** 83 passed, 83 total (100% PASS)
  - Bao gồm suite mở rộng:
    - `src/pages/customer/__tests__/CheckoutUXRegression.spec.ts` (10/10 tests)
- **Typecheck (`npm run typecheck`):** 0 errors (vue-tsc -b pass).
- **Linting (`npm run lint`):** 0 errors (ESLint pass).
- **Build (`npm run build`):** Vite production build hoàn tất thành công.

---

## 3. 🎯 Lộ Trình Kế Tiếp (P1 Backlog)
1. **BE-06:** Outbox Pattern ghi đồng thời cùng Transaction nghiệp vụ đơn hàng/thanh toán.
2. **BE-07 / FE-02:** Hoàn thiện luồng Return/Refund thủ công có quyền, chứng từ, timeline và audit.
3. **FE-03 / MOB-01:** Hoàn thiện Refresh Token đa thiết bị và gắn interceptor trên Flutter mobile HTTP client.
4. **FE-04:** Upload hình ảnh qua Cloudinary trực tiếp thay thế lưu base64 trong sản phẩm.
