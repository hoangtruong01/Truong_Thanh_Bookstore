# 📋 DANH MỤC TASK CHƯA LÀM — TRƯỜNG THÀNH BOOKSTORE
> **Cập nhật:** 2026-09-12  
> **Mục đích:** Tổng hợp tất cả task chưa hoàn thành, chia theo mức độ ưu tiên, mô tả chi tiết nghiệp vụ và kỹ thuật để bất kỳ developer/AI nào cũng nhận việc được ngay.  
> **Tham khảo:** Kiến trúc và nghiệp vụ dự án xem tại [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md)

---

## 📊 Tổng Quan Nhanh

| Mã | Tên Task | Phân Hệ | Priority | Trạng Thái | Độ Khó |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **FE-08** | Tích hợp ImageUploader vào Admin CMS | Frontend | P2 | ✅ Đã hoàn thành | Dễ |
| **FE-09** | Focus Trap & Phím tắt FormModal | Frontend | P3 | ✅ Đã hoàn thành | Dễ |
| **TECHDEBT-01** | Giảm ESLint Warnings Backend (1.415 warnings) | Backend | P2 | ✅ Đã hoàn thành | Dễ |
| **PAY-01** | Xác thực Sandbox VNPay & MoMo | Backend / QA | P1 | 🟡 Chờ Keys | Vừa |
| **SHIPPING-01** | Tích hợp Vận đơn GHN Sandbox | Backend / FE | P2 | 🟡 Chờ Token | Vừa |
| **MOBILE-01** | Ký số App & Push Notification thật | Mobile | P1 | 🔴 Chờ Chứng chỉ | Khó |
| **MOBILE-02** | E2E Mua hàng Thiết bị thật | Mobile / QA | P2 | 🔴 Chờ MOBILE-01 | Vừa |
| **RELIABILITY-01** | Transactional Outbox Pattern | Backend | P3 | 🔵 Backlog | Khó |
| **INFRA-01** | Multi-instance + Redis phân tán | DevOps | P3 | 🔵 Cần cloud | Vừa |
| **PM-01** | Go/No-Go Gate Phát hành | PM | P0 | 🔴 Chờ Phase 2 | Vừa |

> **Chú thích:** ✅ Đã hoàn thành | 🟡 Chờ tài khoản bên thứ ba | 🔴 Chờ chứng chỉ/thiết bị | 🔵 Ưu tiên thấp

---

## 🟢 TASK LÀM NGAY — Không Phụ Thuộc Bên Ngoài

---

### FE-08: Tích Hợp `ImageUploader.vue` Vào Admin CMS

**Priority:** P2 | **Độ khó:** Dễ | **Phân hệ:** Frontend | **Phù hợp Intern:** ⭐⭐⭐

#### Nghiệp vụ
Hệ thống Admin CMS hiện có một component upload ảnh tái sử dụng cao cấp [`ImageUploader.vue`](../frontend/src/components/ImageUploader.vue) (đã có test tự động). Component hỗ trợ kéo thả ảnh, xem trước preview grid, kiểm tra dung lượng tối đa, định dạng MIME và nhập link ảnh ngoài. Tuy nhiên, một số trang Admin cũ vẫn dùng `<input type="file">` đơn giản, gây ra trải nghiệm không đồng nhất cho người quản trị.

#### Yêu cầu kỹ thuật
1. **Trang quản trị sản phẩm** [`Products.vue`](../frontend/src/pages/admin/Products.vue):
   - Tìm phần upload ảnh sản phẩm → Thay bằng:
     ```vue
     <ImageUploader v-model="form.images" :max-files="5" :max-size-m-b="5" />
     ```
   - Đảm bảo `form.images` là mảng URL string tương thích với API backend `POST /products`.

2. **Trang quản trị banner** [`Banners.vue`](../frontend/src/pages/admin/Banners.vue):
   - Thay upload ảnh banner bằng:
     ```vue
     <ImageUploader v-model="form.image" :max-files="1" :max-size-m-b="2" />
     ```

3. Kiểm tra trang Landing Pages xem có upload ảnh nào chưa dùng component này không.

#### Kiểm tra sau khi làm
```bash
cd frontend
npm run test:unit     # Tất cả test phải PASS
npm run typecheck     # 0 errors
npm run build         # Build thành công
```

#### Tiêu chí nghiệm thu
- [x] Upload ảnh đồng nhất trên mọi trang Admin (kéo thả, preview, thông báo lỗi rõ ràng).
- [x] Ảnh vượt `maxFiles` hoặc `maxSizeMB` → Hiển thị thông báo lỗi.
- [x] Build và test pass 100%.

---

### FE-09: Focus Trap & Phím Tắt Bàn Phím Cho `FormModal.vue`

**Priority:** P3 | **Độ khó:** Dễ | **Phân hệ:** Frontend | **Phù hợp Intern:** ⭐⭐⭐ | **Trạng thái:** ✅ Đã hoàn thành

#### Nghiệp vụ
[`FormModal.vue`](../frontend/src/components/FormModal.vue) là component popup dùng cho tất cả form thêm/sửa dữ liệu trong Admin CMS (sản phẩm, danh mục, voucher, banner...). Hiện tại có 2 vấn đề trợ năng:
- Phím `Tab` có thể nhảy ra ngoài modal, focus vào các element phía sau (overlay).
- Phím `Escape` đôi khi chưa đóng modal nhanh chóng.

Người dùng quản trị nhập liệu nhiều bằng bàn phím sẽ bị phiền khi Tab nhảy ra ngoài, hoặc không thể đóng modal bằng Escape.

#### Yêu cầu kỹ thuật
1. **Focus Trap** — Khóa phím Tab/Shift+Tab xoay vòng bên trong modal:
   ```typescript
   function handleTabKey(e: KeyboardEvent) {
     const focusable = modal.value?.querySelectorAll(
       'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
     );
     if (!focusable?.length) return;
     const first = focusable[0] as HTMLElement;
     const last = focusable[focusable.length - 1] as HTMLElement;
     if (e.shiftKey && document.activeElement === first) {
       e.preventDefault(); last.focus();
     } else if (!e.shiftKey && document.activeElement === last) {
       e.preventDefault(); first.focus();
     }
   }
   ```

2. **Phím Escape** — `@keydown.esc="closeModal"` trên container modal.

3. **Auto-focus** — Dùng `nextTick(() => firstInput.focus())` khi modal mở.

4. **Trả lại focus** — Lưu `document.activeElement` trước khi mở modal, restore khi đóng.

5. **Viết test:**
   ```typescript
   it('traps focus within modal when open')
   it('closes on Escape key')
   it('auto-focuses first input on open')
   it('restores focus to trigger element on close')
   ```

#### Kiểm tra sau khi làm
```bash
cd frontend && npm run test:unit
```

#### Tiêu chí nghiệm thu
- [x] Tab chỉ xoay vòng bên trong modal (không nhảy ra ngoài).
- [x] Escape đóng modal an toàn.
- [x] Modal mở → auto-focus input đầu tiên.
- [x] Modal đóng → focus trả về element gốc.

---

### TECHDEBT-01: Giảm Cảnh Báo ESLint Backend (1.808 Warnings → < 1.500)

**Priority:** P2 | **Độ khó:** Dễ (tỉ mỉ) | **Phân hệ:** Backend | **Phù hợp Intern:** ⭐⭐⭐ | **Trạng thái:** ✅ Đã hoàn thành (1.415 warnings)

#### Nghiệp vụ
Backend NestJS hiện đạt **0 errors** nhưng có **~1.808 warnings** (ngân sách giới hạn `--max-warnings 1950`). Phần lớn warnings là `@typescript-eslint/no-explicit-any` — sử dụng kiểu `any` thay vì kiểu dữ liệu cụ thể. Điều này làm giảm khả năng phát hiện lỗi tại compile-time và tăng rủi ro runtime errors.

**Mục tiêu:** Giảm xuống dưới **1.500 warnings** bằng cách thay thế `any` bằng kiểu dữ liệu chính xác.

#### Yêu cầu kỹ thuật
1. Chạy `cd backend && npm run lint` → Quan sát danh sách warnings.

2. **Sửa theo thứ tự module (dễ → khó):**

   | STT | Module | Ước tính warnings | Ghi chú |
   |:---:|:---|:---:|:---|
   | 1 | `src/modules/categories/` | ~20 | Ít file, đơn giản nhất |
   | 2 | `src/modules/banners/` | ~30 | Ít phụ thuộc |
   | 3 | `src/modules/promotions/` | ~40 | Logic rõ ràng |
   | 4 | `src/modules/reviews/` | ~30 | Ít type phức tạp |
   | 5 | `src/modules/products/` | ~80 | Nhiều file nhưng pattern lặp |

3. **Kỹ thuật thay thế `any`:**
   ```typescript
   // ❌ Trước:
   const data: any = await this.model.find(filter);
   
   // ✅ Sau (chọn 1 trong các cách):
   const data = await this.model.find(filter);                    // để TS tự suy luận
   const data: Record<string, unknown> = ...;                    // khi không rõ shape
   const data: FilterQuery<Product> = ...;                       // khi biết rõ type
   ```

4. **Quy tắc:** KHÔNG thêm `// eslint-disable` mới. Phải sửa đúng cách.

5. Sau mỗi module, chạy:
   ```bash
   npm test           # Không hỏng code
   npm run lint       # Đếm warnings còn lại
   ```

#### Tiêu chí nghiệm thu
- [x] Warnings < 1.500 (Thực tế đạt 1.415 warnings, trần --max-warnings 1450).
- [x] Toàn bộ unit tests PASS 100% (43 suites, 479 tests).
- [x] Không thêm `// eslint-disable` mới.

---

## 🟡 TASK CHỜ TÀI KHOẢN SANDBOX BÊN THỨ BA

---

### PAY-01: Xác Thực Giao Dịch Sandbox VNPay & MoMo

**Priority:** P1 | **Độ khó:** Vừa | **Phân hệ:** Backend / QA  
**Blocker:** Cần tài khoản Test Merchant từ VNPay Sandbox và MoMo Developer Portal

#### Nghiệp vụ
Hệ thống hiện hỗ trợ thanh toán COD và Chuyển khoản VietQR. Để mở thêm thanh toán trực tuyến (thẻ ATM/Visa qua VNPay, ví điện tử MoMo), cần xác thực giao dịch thật trên môi trường sandbox của từng cổng.

**Code đã sẵn sàng:**
- [`payment.providers.ts`](../backend/src/modules/payments/providers/payment.providers.ts): Thuật toán chữ ký SHA-512 (VNPay 2.1.0) và HMAC-SHA256 (MoMo) đã triển khai đầy đủ.
- [`payment.providers.spec.ts`](../backend/src/modules/payments/providers/payment.providers.spec.ts): Test chữ ký và format tham số pass 100%.

#### Khi có Merchant Keys, thực hiện:
1. Điền vào `backend/.env`:
   ```env
   VNPAY_TMN_CODE=your_vnpay_tmn_code
   VNPAY_HASH_SECRET=your_vnpay_hash_secret
   MOMO_PARTNER_CODE=your_momo_partner_code
   MOMO_ACCESS_KEY=your_momo_access_key
   MOMO_SECRET_KEY=your_momo_secret_key
   ENABLED_PAYMENT_METHODS=COD,BANK_TRANSFER,VNPAY,MOMO
   ```
2. Tạo đơn hàng test → Chọn thanh toán VNPay/MoMo → Hoàn tất giao dịch trên cổng sandbox.
3. Kiểm tra endpoint Webhook/IPN:
   - `POST /api/payments/vnpay-ipn` — VNPay gọi khi giao dịch hoàn tất.
   - `POST /api/payments/momo-ipn` — MoMo gọi khi giao dịch hoàn tất.
4. Xác nhận: Đơn hàng chuyển `paymentStatus: PAID`, `orderStatus: CONFIRMED`, thông báo bắn tới khách.

#### Tiêu chí nghiệm thu
- [ ] Thanh toán sandbox thành công → Đơn `PAID` + notification realtime.
- [ ] Giả mạo chữ ký IPN → HTTP 400, không duyệt đơn.
- [ ] Sai số tiền IPN → Đơn đóng băng `MANUAL_REQUIRED`.
- [ ] Gọi IPN trùng 3 lần → Xử lý idempotent, không cộng doanh thu/điểm nhiều lần.

---

### SHIPPING-01: Tích Hợp Vận Đơn Sandbox Giao Hàng Nhanh (GHN)

**Priority:** P2 | **Độ khó:** Vừa | **Phân hệ:** Backend / Frontend  
**Blocker:** Cần đăng ký tài khoản GHN Sandbox (`https://dev-online-gateway.ghn.vn`)

#### Nghiệp vụ
Khi Admin duyệt đơn hàng và chuyển trạng thái sang `SHIPPING`, hệ thống cần tự động tạo vận đơn trên GHN để:
- Admin nhận mã vận đơn (ví dụ: `ED1234567VN`) lưu vào Order.
- Khách hàng xem được mã vận đơn và link tra cứu lộ trình giao hàng trên trang Chi tiết đơn.

**Code đã sẵn sàng:**
- Order Schema đã có trường `trackingNumber`.
- State machine đã hỗ trợ `PROCESSING → SHIPPING`.

#### Khi có GHN Token, thực hiện:
1. Điền vào `backend/.env`:
   ```env
   GHN_TOKEN=your_ghn_sandbox_token
   GHN_SHOP_ID=your_ghn_shop_id
   GHN_API_URL=https://dev-online-gateway.ghn.vn
   ```
2. Tạo/hoàn thiện `ShippingService` gọi API GHN:
   - Endpoint: `POST /shiip/public-api/v2/shipping-order/create`
   - Payload: Tên/SĐT/Địa chỉ người nhận, danh sách sản phẩm, trọng lượng ước tính.
3. Hook vào `OrderLifecycleService.updateStatus()`: Khi chuyển `SHIPPING`, gọi `ShippingService.createOrder()` → Lưu `trackingNumber` vào Order.
4. Frontend [`OrderDetail.vue`](../frontend/src/pages/customer/OrderDetail.vue): Hiển thị mã vận đơn + link `https://tracking.ghn.vn?order_code={trackingNumber}`.
5. Xử lý timeout: Nếu GHN không phản hồi trong 5 giây → retry 1 lần → nếu vẫn fail, giữ đơn ở `PROCESSING` và báo lỗi cho Admin.

#### Tiêu chí nghiệm thu
- [ ] Admin bấm "Giao hàng" → Sinh mã vận đơn GHN thật.
- [ ] Khách bấm mã vận đơn → Mở trang GHN tra cứu lộ trình.
- [ ] GHN timeout → Đơn giữ `PROCESSING`, Admin nhận thông báo lỗi.

---

## 🔴 TASK CHỜ CHỨNG CHỈ DEVELOPER & THIẾT BỊ THẬT

---

### MOBILE-01: Đóng Gói Ký Số & Push Notification Thiết Bị Thật

**Priority:** P1 | **Độ khó:** Khó | **Phân hệ:** Mobile / DevOps  
**Blocker:** Apple Developer Account, Google Play Console, Firebase Console thật

#### Nghiệp vụ
Ứng dụng di động Flutter cần được đóng gói ký số chính thức để:
- Cài đặt lên thiết bị thật (Android + iPhone).
- Nhận Push Notification khi đơn hàng đổi trạng thái (FCM cho Android, APNs cho iOS).
- Sẵn sàng tải lên Google Play Store và Apple TestFlight.

**Code đã sẵn sàng:** Flutter app 42/42 tests pass, `flutter analyze` 0 issue, đã xử lý cách ly lỗi push, cold-start deeplink, APS entitlements.

#### Khi có chứng chỉ, thực hiện:
1. **Android:** Chạy `mobile/scripts/generate-keystore.ps1` → Cấu hình `mobile/android/key.properties`.
2. **iOS:** Tạo App ID `vn.truongthanh.bookstore` + Provisioning Profile + APNs key trên Apple Developer.
3. **Firebase:** Tạo project → Tải `google-services.json` (Android) + `GoogleService-Info.plist` (iOS).
4. **Backend:** Cấu hình `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` trong `.env`.
5. **Build:**
   ```bash
   flutter build appbundle --release     # Android
   flutter build ipa --release           # iOS
   ```

#### Tiêu chí nghiệm thu
- [ ] Push notification nhận trong ≤ 3 giây (background + lock screen).
- [ ] Chạm notification lúc app tắt (cold-start) → Mở Chi tiết đơn hàng.
- [ ] `.aab` + `.ipa` chữ ký hợp lệ, tải được lên Play Console / TestFlight.

---

### MOBILE-02: Kiểm Thử E2E Luồng Mua Hàng Trên Thiết Bị Thật

**Priority:** P2 | **Độ khó:** Vừa | **Phân hệ:** Mobile / QA  
**Phụ thuộc:** MOBILE-01

#### Nghiệp vụ
Sau khi có build ký, cần kiểm thử toàn bộ luồng mua hàng thực tế trên thiết bị thật để đảm bảo:
- Trải nghiệm không crash/freeze.
- Idempotency key hoạt động khi mất mạng giữa chừng.
- Dữ liệu đồng bộ chính xác giữa Web và Mobile.

#### Kịch bản kiểm thử:
1. **Luồng chính:** Đăng ký → Tìm sách → Thêm giỏ hàng → Chọn địa chỉ → Áp Voucher/Điểm → COD → Đặt hàng.
2. **Mất mạng:** Bật Airplane mode lúc thanh toán → Bật lại mạng → Bấm thử lại → Kiểm tra không tạo đơn trùng.
3. **Hiển thị:** Infinite scroll danh sách đơn, pull-to-refresh, dark/light mode, landscape.

#### Tiêu chí nghiệm thu
- [ ] Không crash/freeze trong toàn bộ luồng.
- [ ] Không tạo đơn trùng khi retry mất mạng.
- [ ] Giỏ hàng + đơn hàng đồng bộ Web ↔ Mobile.
- [ ] Pull-to-refresh cập nhật danh sách mới nhất.

---

## 🔵 TASK BACKLOG — ƯU TIÊN THẤP (P3)

---

### RELIABILITY-01: Transactional Outbox Pattern Cho Thông Báo

**Priority:** P3 | **Độ khó:** Khó | **Phân hệ:** Backend  
**Phù hợp:** Senior Backend Developer

#### Nghiệp vụ
Hiện tại sau khi MongoDB Transaction commit thành công (tạo đơn/đổi trạng thái), hệ thống bắn Socket.IO + FCM notification + Google Sheets sync theo kiểu **best-effort**. Nếu server crash ngay sau commit nhưng trước khi gửi notification → **thông báo bị mất** và không được retry.

Mẫu Outbox Pattern giải quyết bằng cách lưu sự kiện cần gửi vào cùng Transaction với dữ liệu nghiệp vụ, sau đó Worker/Cron quét và gửi.

#### Yêu cầu kỹ thuật
1. **Schema `OutboxEvent`:**
   ```typescript
   eventType: 'ORDER_CREATED' | 'ORDER_STATUS_UPDATED' | 'STOCK_ALERT'
   payload: Record<string, unknown>
   status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED'
   retryCount: number (default 0)
   maxRetries: number (default 5)
   ```
2. **Lưu Outbox cùng Transaction:** Thay vì bắn socket ngay → Tạo OutboxEvent document cùng `session` MongoDB.
3. **Worker quét Outbox:** Cron 10 giây → Tìm `{ status: PENDING, retryCount < maxRetries }` → Dispatch → Cập nhật `SENT`/`FAILED`.
4. **Cleanup:** Cron hàng ngày xóa `SENT` cũ > 7 ngày.

#### Tiêu chí nghiệm thu
- [ ] Server restart → notification vẫn được gửi (Worker pickup từ Outbox).
- [ ] Event FAILED sau max retries → đánh dấu cho Admin review.
- [ ] Toàn bộ unit tests PASS.

---

### INFRA-01: Kiểm Thử Cụm Đa Instance Backend + Redis Phân Tán

**Priority:** P3 | **Độ khó:** Vừa | **Phân hệ:** DevOps / Backend  
**Cần:** Môi trường cloud hoặc nhiều container Docker

#### Nghiệp vụ
Khi deploy production với nhiều instance backend (load balancing), cần đảm bảo:
- Token blacklist (logout/đổi mật khẩu) có hiệu lực trên tất cả node.
- Rate limiting đếm đúng ngưỡng toàn cụm (không reset khi request đổi node).
- WebSocket notification hoạt động xuyên node qua Redis adapter.

#### Kịch bản kiểm thử
1. Deploy 2–3 container Backend API + 1 Redis chung (Docker Compose).
2. **Token Blacklist:** Logout ở Node A → Gửi token cũ tới Node B → Node B từ chối (`bl:jti:{jti}`).
3. **Rate Limiting:** 5 request login sai phân bổ đều 3 node → Request thứ 6 bị `429`.
4. **WebSocket:** Khách kết nối Node A, Admin duyệt đơn ở Node B → Khách vẫn nhận notification.

#### Tiêu chí nghiệm thu
- [ ] Token blacklist hoạt động xuyên node.
- [ ] Rate limit đúng ngưỡng toàn cụm.
- [ ] WebSocket notification xuyên node.

---

### PM-01: Go/No-Go Gate Phát Hành Chính Thức

**Priority:** P0 (khi Phase 2 hoàn tất) | **Phân hệ:** PM / DevOps  
**Phụ thuộc:** PAY-01 + MOBILE-01

#### Nghiệp vụ
Đây là cổng quyết định cuối cùng trước khi phát hành sản phẩm ra công chúng.

#### Checklist Go/No-Go
- [ ] **Bảo mật:** Toàn bộ test QA-01 + QA-02 pass trên staging.
- [ ] **Thanh toán:** ≥ 1 cổng online (VNPay hoặc MoMo) xác nhận sandbox OK.
- [ ] **Mobile:** Build ký tải lên TestFlight / Internal Testing thành công.
- [ ] **Database:** MongoDB Replica Set + Transaction hoạt động trên staging.
- [ ] **Monitoring:** Sentry DSN được cấu hình, ghi nhận lỗi 500 chính xác.
- [ ] **Performance:** p95 latency < 300ms cho endpoint đọc sản phẩm trên staging.

#### Nguyên tắc No-Go
- ❌ Không release nếu bất kỳ test bảo mật nào fail.
- ❌ Không release nếu database chưa kích hoạt replica set.

---

## 📘 Hướng Dẫn Cho Intern / Developer Mới

### Nên bắt đầu với task nào?

| Tuần | Task | Lý do |
| :---: | :--- | :--- |
| **Tuần 1** | `FE-08` (ImageUploader) | Làm quen Vue 3 Composition API, component tái sử dụng |
| **Tuần 1** | `FE-09` (Focus Trap) | Hiểu DOM manipulation + keyboard events |
| **Tuần 1** | `TECHDEBT-01` (ESLint) | Hiểu DTO & Mongoose Schema, sửa 30-50 warnings/ngày |
| **Tuần 2** | `PAY-01` (nếu có keys) | Kiểm thử giao dịch thật, viết tài liệu kết nối |
| **Tuần 2** | `MOBILE-02` (nếu có build) | Chạy app trên máy ảo, sửa lỗi UI nhỏ |

### Quy trình Git khi nhận task

```bash
# 1. Tạo nhánh mới từ dev
git checkout dev && git pull origin dev
git checkout -b feature/FE-08-image-uploader-admin

# 2. Code & Test
cd frontend && npm run test:unit && npm run build   # FE tasks
cd backend && npm test && npm run lint              # BE tasks

# 3. Commit theo chuẩn Conventional Commits
git commit -m "feat(admin): integrate ImageUploader into Products and Banners pages"

# 4. Push & tạo Pull Request
git push origin feature/FE-08-image-uploader-admin
# → Đính kèm screenshot/video → Tag Lead review
```

---

*Tài liệu này cập nhật theo tiến độ dự án. Khi hoàn thành task, đánh dấu ✅ tại đây.*
