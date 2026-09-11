# 🛡️ TRƯƠNG THANH BOOKSTORE — KẾ HOẠCH BẢO MẬT & LOCAL MVP
> **Tài liệu:** Kế hoạch Kỹ thuật & Bảng Phân rã Công việc (Technical Task Plan & Execution Roadmap)  
> **Phiên bản:** 2.0 — Cập nhật 2026-09-12 (Tổng kết Phase 1 + Roadmap Phase 2)  
> **Vị trí lưu trữ:** `docs/SECURITY_LOCAL_MVP_PLAN.md`  
> **Mục tiêu:** Lưu trữ kết quả nghiệm thu Phase 1 (Local MVP) và định hình lộ trình Phase 2 (Pre-Production & Tích hợp Bên Thứ Ba).

---

## 📑 MỤC LỤC
1. [✅ Tổng Kết Phase 1: Local MVP Đã Hoàn Thành](#1--tổng-kết-phase-1-local-mvp-đã-hoàn-thành)
2. [🏁 Cổng Nghiệm Thu CTO — Đã Đạt 100%](#2--cổng-nghiệm-thu-cto--đã-đạt-100)
3. [🚀 Phase 2: Lộ Trình Pre-Production & Tích Hợp](#3--phase-2-lộ-trình-pre-production--tích-hợp)
4. [📋 Bảng Ma Trận Task Phase 2](#4--bảng-ma-trận-task-phase-2)
5. [📝 Chi Tiết Từng Task Phase 2](#5--chi-tiết-từng-task-phase-2)
6. [⏱️ Thứ Tự Thực Thi & Phụ Thuộc Kỹ Thuật Phase 2](#6-️-thứ-tự-thực-thi--phụ-thuộc-kỹ-thuật-phase-2)
7. [⛔ Danh Mục Tạm Hoãn (Phase 3+)](#7--danh-mục-tạm-hoãn-phase-3)

---

## 1. ✅ Tổng Kết Phase 1: Local MVP Đã Hoàn Thành

> **Ngày hoàn tất:** 2026-09-11  
> **Tổng cộng:** 26/26 task cốt lõi — **100% HOÀN THÀNH**

Phase 1 đã triệt tiêu toàn bộ lỗ hổng bảo mật cốt lõi, đảm bảo nhất quán dữ liệu đơn hàng/thanh toán và xây dựng trải nghiệm người dùng mượt mà trên cả Web và Mobile.

### Bảng Tóm Tắt 26 Task Đã Hoàn Thành

| Track | Mã Task | Tên Công Việc | Priority | Kết Quả |
| :---: | :---: | :--- | :---: | :---: |
| 🔒 Security | SEC-01 | Audit Token, Cookie & Session Lifecycle | P0 | ✅ |
| 🔒 Security | SEC-02 | Audit RBAC & Chống IDOR | P0 | ✅ |
| 🔒 Security | SEC-03 | Validation Pipe & Chống Mass Assignment | P0 | ✅ |
| 🔒 Security | SEC-04 | API Payload Hardening (Giới hạn kích thước) | P1 | ✅ |
| 🔒 Security | SEC-05 | Rate Limiting Endpoint Trọng Yếu | P1 | ✅ |
| 🔒 Security | SEC-06 | Rà soát Secret & Biến Môi Trường | P0 | ✅ |
| 🔒 Security | SEC-07 | Error Response Hardening & Sanitize | P1 | ✅ |
| 💳 Payment | BA-01 | Chốt Chính Sách Hủy/Trả/Hoàn Tiền | P0 | ✅ |
| 💳 Payment | BE-01 | Xây Dựng Vòng Đời Hoàn Tiền (Refund) | P0 | ✅ |
| 💳 Payment | BE-02 | Nhất Quán Nguyên Tử Payment ↔ Order | P0 | ✅ |
| 💳 Payment | BE-03 | Xác Thực Webhook/Callback Thanh toán | P0 | ✅ |
| 💳 Payment | BE-04 | Quản lý Timeout Bên Thứ Ba (AbortController) | P1 | ✅ |
| 🐳 Local | LOCAL-01 | Đồng nhất Node.js 22 LTS | P0 | ✅ |
| 🐳 Local | LOCAL-02 | Hạ tầng Docker (Mongo RS + Redis) | P0 | ✅ |
| 🐳 Local | LOCAL-03 | Hoàn thiện `.env.example` | P0 | ✅ |
| 🐳 Local | LOCAL-04 | Seed Data cục bộ | P1 | ✅ |
| 🐳 Local | LOCAL-05 | Tài liệu Hướng dẫn Khởi động Local | P1 | ✅ |
| 💻 Frontend | FE-01 | Auth Hydration (Khôi phục phiên tin cậy) | P1 | ✅ |
| 💻 Frontend | FE-02 | Axios Refresh Queue (Token 1 lần duy nhất) | P1 | ✅ |
| 💻 Frontend | FE-03 | Global Error UX (Toast thân thiện) | P1 | ✅ |
| 💻 Frontend | FE-04 | Skeleton Loading & Empty State | P2 | ✅ |
| 💻 Frontend | FE-05 | Chống Double Submit (Submit Lock) | P1 | ✅ |
| 💻 Frontend | FE-06 | Minh Bạch Checkout UX & VietQR | P1 | ✅ |
| 🛠️ Tech Debt | BE-05 | Tách nhỏ OrdersService (Facade Pattern) | P2 | ✅ |
| 🛠️ Tech Debt | BE-06 | Tối ưu Truy vấn & Index Auto-cancel | P2 | ✅ |
| 🛠️ Tech Debt | BE-07 | Triệt tiêu Linting Backend (0 errors) | P2 | ✅ |
| 🛠️ Tech Debt | FE-07 | Chuẩn hóa ESLint Frontend (0 errors) | P2 | ✅ |
| 🧪 QA | QA-01 | Test Suite Bảo mật Auth & RBAC | P0 | ✅ |
| 🧪 QA | QA-02 | Test Suite Thanh toán & Idempotent | P0 | ✅ |
| 🧪 QA | QA-03 | Test Đua tranh Tồn kho (Race Condition) | P1 | ✅ |
| 🧪 QA | QA-04 | Test Hồi quy UX Frontend | P1 | ✅ |

### Kết Quả Kiểm Thử Cuối Cùng Phase 1

| Phân hệ | Lệnh | Kết quả | Trạng thái |
| :--- | :--- | :---: | :---: |
| Backend Unit Tests | `npm test` | 41/41 suites, 450/450 tests | ✅ 100% Pass |
| Backend Linting | `npm run lint` | 0 errors (≤ 1950 warnings) | ✅ Pass |
| Backend Build | `npm run build` | Biên dịch thành công | ✅ Pass |
| Frontend Unit Tests | `npm run test:unit` | 14/14 suites, 72/72 tests | ✅ 100% Pass |
| Frontend TypeCheck | `npm run typecheck` | 0 errors (vue-tsc -b) | ✅ Pass |
| Frontend Linting | `npm run lint` | 0 errors | ✅ Pass |
| Frontend Build | `npm run build` | Biên dịch thành công | ✅ Pass |

> **Chi tiết kỹ thuật và changelog đầy đủ Phase 1:** Xem tại các tài liệu:
> - [`AUDIT_2026-09-11.md`](AUDIT_2026-09-11.md)
> - [`CHANGELOG_FE06_BE05_BE06_BE07_FE07.md`](CHANGELOG_FE06_BE05_BE06_BE07_FE07.md)
> - [`CHANGELOG_QA03_QA04.md`](CHANGELOG_QA03_QA04.md)

---

## 2. 🏁 Cổng Nghiệm Thu CTO — Đã Đạt 100%

### ✅ 1. Cổng Bảo Mật (Security Gate)
- [x] Mọi endpoint admin đều được bảo vệ bằng `RolesGuard` + `PermissionsGuard`.
- [x] Chống IDOR thành công — User A không thể đọc/sửa đơn hàng User B.
- [x] DTO validation chặn đứng field lạ (`whitelist: true`, `forbidNonWhitelisted: true`).
- [x] Không có secret thật nào trong mã nguồn hay lịch sử commit.
- [x] Error responses được sanitize — không lộ stack trace, query Mongo hay thông tin nội bộ.

### ✅ 2. Cổng Nghiệp Vụ & Giao Dịch (Business Gate)
- [x] Payment ↔ Order luôn đồng nhất qua MongoDB Transaction (có fallback standalone).
- [x] Đơn đã thanh toán bị hủy → tự động kích hoạt `RefundStatus`.
- [x] Callback cổng thanh toán có tính Idempotent, gửi lại không sinh lỗi.
- [x] Test đua tranh tồn kho `QA-03` pass — không overselling.

### ✅ 3. Cổng Vận Hành Nội Bộ (Local Dev Gate)
- [x] Dev mới clone repo → khởi động toàn bộ hệ thống trong dưới 15 phút.
- [x] `docker compose up -d` → MongoDB Replica Set + Redis sẵn sàng.
- [x] `.env.example` đầy đủ, chính xác, không cần credentials thật.
- [x] `npm run seed` tạo dữ liệu mẫu idempotent.

### ✅ 4. Cổng Trải Nghiệm Người Dùng (UX Gate)
- [x] F5 không giật lag, không mất phiên đăng nhập.
- [x] Refresh token queue 1 lần duy nhất — 5 request đồng thời chỉ gửi 1 lần refresh.
- [x] Nút Đặt hàng/Thanh toán tự disabled chống double submit.
- [x] Checkout minh bạch 5 khoản chi phí + VietQR động.

---

## 3. 🚀 Phase 2: Lộ Trình Pre-Production & Tích Hợp

Sau khi Phase 1 (Local MVP) đạt chuẩn 100%, Phase 2 tập trung vào:
- **Tích hợp đối tác bên thứ ba** (VNPay/MoMo sandbox, GHN vận đơn).
- **Kiểm thử trên thiết bị thật** (Mobile signing, Push notification thật).
- **Cải tiến giao diện Admin** (Tích hợp ImageUploader, Focus Trap modal).
- **Giảm nợ kỹ thuật** (ESLint warnings backend, Transactional Outbox).
- **Chuẩn bị phát hành** (Go/No-Go gate, cụm multi-instance).

---

## 4. 📋 Bảng Ma Trận Task Phase 2

| Mã Task | Tên Công Việc | Phân Hệ | Priority | Trạng Thái | Độ Khó | Blocker / Phụ Thuộc |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **PAY-01** | Xác thực Giao dịch Sandbox VNPay & MoMo | Backend / QA | **P1** | ⏳ Chờ Keys | Vừa | Cần tài khoản Merchant Sandbox |
| **SHIPPING-01** | Tích hợp Vận đơn Sandbox GHN | Backend / FE | **P2** | ⏳ Chờ Token | Vừa | Cần GHN Token & Shop ID |
| **MOBILE-01** | Ký AAB/IPA & Cấu hình Push FCM/APNs | Mobile / DevOps | **P1** | ⏳ Chờ Chứng chỉ | Khó | Apple Developer + Firebase Console |
| **MOBILE-02** | Kiểm thử E2E Mua hàng trên Thiết bị thật | Mobile / QA | **P2** | ⏳ Chờ Thiết bị | Vừa | MOBILE-01 |
| **FE-08** | Tích hợp `ImageUploader.vue` vào Admin CMS | Frontend | **P2** | ⏳ Chờ xử lý | **Dễ** | *None* |
| **FE-09** | Focus Trap & Phím tắt cho `FormModal.vue` | Frontend | **P3** | ⏳ Chờ xử lý | **Dễ** | *None* |
| **TECHDEBT-01** | Giảm 1.808 ESLint Warnings Backend | Backend | **P2** | ⏳ Chờ xử lý | **Dễ** | *None* |
| **RELIABILITY-01** | Transactional Outbox Pattern cho Thông báo | Backend | **P3** | ⏳ Chờ xử lý | Khó | *None* |
| **INFRA-01** | Kiểm thử Cụm Multi-instance + Redis | DevOps / BE | **P3** | ⏳ Chờ môi trường | Vừa | Cần môi trường cloud |
| **PM-01** | Quy trình Go/No-Go Gate Phát hành | PM / DevOps | **P0** | ⏳ Chờ Phase 2 | Vừa | PAY-01, MOBILE-01 |

---

## 5. 📝 Chi Tiết Từng Task Phase 2

### [TASK PAY-01] Xác Thực Giao Dịch Sandbox Cổng VNPay & MoMo
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `M` | **Module:** [`backend/src/modules/payments/`](../backend/src/modules/payments)
* **Vai trò:** Backend + QA
* **Blocker:** Cần tài khoản Test Merchant từ VNPay Sandbox và MoMo Developer Portal
* **Bối cảnh hiện tại:**
  - Mã nguồn trong `payment.providers.ts` đã triển khai đầy đủ thuật toán sinh chữ ký SHA-512 (VNPay 2.1.0) và HMAC-SHA256 (MoMo).
  - Test case kiểm tra chữ ký và format tham số đã pass 100% trong `payment.providers.spec.ts`.
* **Phần còn thiếu cần thực hiện:**
  1. Nhận thông tin Merchant Test: VNPay (`vnp_TmnCode`, `vnp_HashSecret`) và MoMo (`partnerCode`, `accessKey`, `secretKey`).
  2. Điền vào `backend/.env` các biến: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`.
  3. Tạo đơn hàng test → Thực hiện giao dịch sandbox bằng thẻ ATM/Visa test của VNPay và ví MoMo Sandbox.
  4. Kiểm tra endpoint Webhook/IPN (`/api/payments/vnpay-ipn`, `/api/payments/momo-ipn`) nhận kết quả, đối soát số tiền khớp đơn hàng và tự động chuyển trạng thái `CONFIRMED` + `paymentStatus: PAID`.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Thanh toán thành công trên cổng test → Đơn hàng cập nhật `PAID` và bắn thông báo tức thì.
  - [ ] Giả mạo chữ ký IPN hoặc sai số tiền → Backend từ chối HTTP 400 và không duyệt đơn.
  - [ ] Thanh toán thất bại trên cổng → Đơn giữ `UNPAID`, hiển thị nút thử lại trên UI.

---

### [TASK SHIPPING-01] Tích Hợp Vận Đơn Sandbox Giao Hàng Nhanh (GHN)
* **Độ ưu tiên:** `P2` | **Độ phức tạp:** `M` | **Module:** [`backend/src/modules/orders/`](../backend/src/modules/orders), Frontend
* **Vai trò:** Backend + Frontend
* **Blocker:** Cần đăng ký tài khoản GHN Sandbox (`https://dev-online-gateway.ghn.vn`) để lấy API Token và Shop ID
* **Bối cảnh hiện tại:**
  - Kiến trúc hệ thống đã có state `SHIPPING` và trường `trackingNumber` trong Order Schema.
  - DTO và Service skeleton đã sẵn sàng.
* **Phần còn thiếu cần thực hiện:**
  1. Đăng ký tài khoản GHN Sandbox → Lấy `GHN_TOKEN`, `GHN_SHOP_ID`.
  2. Thêm biến vào `.env` và `.env.example`:
     ```env
     GHN_TOKEN=your_ghn_sandbox_token
     GHN_SHOP_ID=your_ghn_shop_id
     GHN_API_URL=https://dev-online-gateway.ghn.vn
     ```
  3. Hoàn thiện Service gọi API tạo đơn giao hàng (`/shiip/public-api/v2/shipping-order/create`) khi Admin chuyển đơn sang `SHIPPING`.
  4. Lưu `trackingNumber` từ phản hồi GHN vào Order document.
  5. Frontend: Hiển thị mã vận đơn và liên kết theo dõi trên trang Chi tiết đơn hàng (Web + Mobile).
  6. Xử lý fallback khi GHN sandbox không phản hồi (timeout 5s, retry 1 lần).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Admin bấm "Giao Hàng Nhanh" → Hệ thống sinh mã vận đơn thật từ GHN (ví dụ: `ED1234567VN`).
  - [ ] Khách hàng bấm mã vận đơn → Mở trang tra cứu lộ trình GHN.
  - [ ] GHN timeout → Đơn giữ trạng thái `PROCESSING`, Admin nhận thông báo lỗi rõ ràng.

---

### [TASK MOBILE-01] Đóng Gói Ký Số & Kích Hoạt Push Notification Thiết Bị Thật
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `L` | **Module:** [`mobile/`](../mobile)
* **Vai trò:** Mobile + DevOps
* **Blocker:** Cần Apple Developer Account, Google Play Console, Firebase Console thật
* **Bối cảnh hiện tại:**
  - Flutter app đã vượt qua 42/42 tests và `flutter analyze` 0 issue.
  - Đã xử lý cách ly lỗi khởi tạo push khỏi luồng đăng nhập, hỗ trợ cold-start deeplink mở đơn hàng, kiểm tra `API_URL` HTTPS lúc khởi động.
  - Đã cấu hình `Runner.entitlements` cho iOS (APS Environment development/production).
* **Phần còn thiếu cần thực hiện:**
  1. **Android Keystore:**
     - Chạy script `mobile/scripts/generate-keystore.ps1` (Windows) hoặc `.sh` (macOS/Linux).
     - Cấu hình `mobile/android/key.properties` với đường dẫn keystore thật.
  2. **Apple Developer:**
     - Tạo App ID cho bundle `vn.truongthanh.bookstore`.
     - Tạo Provisioning Profile (Development + Distribution).
     - Cấu hình Push Notification Capability (APNs key).
  3. **Firebase:**
     - Tạo project Firebase → Thêm app Android + iOS.
     - Tải `google-services.json` → đặt vào `mobile/android/app/`.
     - Tải `GoogleService-Info.plist` → đặt vào `mobile/ios/Runner/`.
     - Cấu hình backend: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
  4. **Build Ký Chính Thức:**
     ```bash
     flutter build appbundle --release     # Android App Bundle
     flutter build ipa --release           # iOS Archive
     ```
  5. Cài đặt lên ít nhất 1 thiết bị Android thật + 1 iPhone thật.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Admin duyệt đơn trên Web CMS → Điện thoại nhận Push Notification trong ≤ 3 giây (cả background + lock screen).
  - [ ] Chạm vào notification lúc app tắt hoàn toàn (cold-start) → Mở thẳng màn hình Chi tiết Đơn hàng.
  - [ ] Build thành công file `.aab` và `.ipa` có chữ ký hợp lệ, sẵn sàng tải lên Play Console & TestFlight.

---

### [TASK MOBILE-02] Kiểm Thử Toàn Trình Mua Hàng Trên Thiết Bị Di Động Thật
* **Độ ưu tiên:** `P2` | **Độ phức tạp:** `M` | **Module:** [`mobile/`](../mobile)
* **Vai trò:** Mobile + QA
* **Phụ thuộc:** `MOBILE-01` (cần có build ký)
* **Bối cảnh hiện tại:**
  - Toàn bộ luồng contract API và state machine đã có mock tests trong `mobile/test/`.
* **Phần còn thiếu cần thực hiện:**
  1. Cài đặt ứng dụng trên thiết bị thật hoặc máy ảo kết nối Backend Staging/Local.
  2. **Kịch bản người dùng chính:**
     - Đăng ký tài khoản mới → Tìm kiếm sách → Thêm giỏ hàng → Chọn địa chỉ → Nhập điểm Loyalty / Áp Voucher → Chọn COD → Bấm Đặt hàng.
  3. **Kịch bản mất mạng:**
     - Bật Airplane mode trong lúc thanh toán → Kiểm tra app giữ đúng `Idempotency-Key` khi bấm thử lại.
  4. **Kịch bản hiển thị:**
     - Danh sách đơn hàng phân trang (Infinite scroll / Pull to refresh).
     - Dark mode / Light mode rendering.
     - Landscape orientation không vỡ layout.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Không crash hoặc freeze trên giao diện trong toàn bộ luồng.
  - [ ] Không tạo 2 đơn trùng lặp khi thử lại do mất mạng.
  - [ ] Dữ liệu giỏ hàng và đơn hàng đồng bộ hoàn hảo với Web Storefront.
  - [ ] Pull-to-refresh cập nhật danh sách đơn hàng mới nhất.

---

### [TASK FE-08] Tích Hợp `ImageUploader.vue` Vào Các Trang Admin CMS
* **Độ ưu tiên:** `P2` | **Độ phức tạp:** `S` | **Module:** [`frontend/src/pages/admin/`](../frontend/src/pages/admin)
* **Vai trò:** Frontend Developer / Intern
* **Phụ thuộc:** Không
* **Bối cảnh hiện tại:**
  - Component [`ImageUploader.vue`](../frontend/src/components/ImageUploader.vue) đã hoàn chỉnh với test tự động (`ImageUploader.spec.ts`). Hỗ trợ kéo thả ảnh, xem trước (preview grid), kiểm tra dung lượng tối đa, định dạng MIME và nhập link ảnh ngoài.
  - Một số trang Admin CMS cũ vẫn dùng `<input type="file">` đơn giản.
* **Phần cần thực hiện:**
  1. Mở trang quản trị sản phẩm: [`Products.vue`](../frontend/src/pages/admin/Products.vue).
     - Thay thế phần upload ảnh bằng:
       ```vue
       <ImageUploader v-model="form.images" :max-files="5" :max-size-m-b="5" />
       ```
  2. Tương tự cho trang quản trị Banner: [`Banners.vue`](../frontend/src/pages/admin/Banners.vue).
     - Thay thế upload ảnh bằng:
       ```vue
       <ImageUploader v-model="form.image" :max-files="1" :max-size-m-b="2" />
       ```
  3. Kiểm tra các trang Landing Page có upload ảnh nào chưa dùng component này.
  4. Chạy kiểm tra:
     ```bash
     cd frontend
     npm run test:unit
     npm run typecheck
     npm run build
     ```
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Giao diện tải ảnh trên trang Admin đồng bộ, kéo thả mượt mà, xem trước ảnh sắc nét.
  - [ ] Ảnh vượt quá `maxFiles` hoặc `maxSizeMB` → Hiển thị thông báo lỗi rõ ràng.
  - [ ] `npm run build` và `npm run test:unit` pass 0 lỗi.

---

### [TASK FE-09] Cải Thiện Trợ Năng Bàn Phím & Focus Trap Cho `FormModal.vue`
* **Độ ưu tiên:** `P3` | **Độ phức tạp:** `S` | **Module:** [`frontend/src/components/FormModal.vue`](../frontend/src/components/FormModal.vue)
* **Vai trò:** Frontend Developer / Intern
* **Phụ thuộc:** Không
* **Bối cảnh hiện tại:**
  - `FormModal.vue` dùng để hiển thị popup thêm/sửa dữ liệu trên toàn bộ trang Admin.
  - Hiện tại phím `Tab` có thể nhảy ra ngoài background, `Escape` đôi khi chưa đóng modal.
* **Phần cần thực hiện:**
  1. **Focus Trap:** Cài đặt cơ chế khóa con trỏ bàn phím chỉ luân chuyển bên trong modal:
     ```typescript
     // Lấy tất cả focusable elements bên trong modal
     const focusableElements = modal.querySelectorAll(
       'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
     );
     const firstFocusable = focusableElements[0];
     const lastFocusable = focusableElements[focusableElements.length - 1];
     
     // Khi Tab ở element cuối → quay về element đầu
     // Khi Shift+Tab ở element đầu → quay về element cuối
     ```
  2. **Phím Escape:** Thêm `@keydown.esc="closeModal"` trên container modal.
  3. **Auto-focus:** Tự động focus vào ô nhập liệu đầu tiên khi modal vừa mở (sử dụng `nextTick`).
  4. **Trả lại focus:** Khi đóng modal, focus trở về nút/element đã mở modal.
  5. Viết test:
     ```typescript
     // FormModal.spec.ts
     it('traps focus within modal when open', ...)
     it('closes on Escape key', ...)
     it('auto-focuses first input on open', ...)
     ```
  6. Chạy `npm run test:unit` để kiểm tra hồi quy.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Bấm `Tab` liên tục trên modal chỉ chạy vòng quanh các nút/ô nhập trong modal.
  - [ ] Bấm `Escape` đóng modal an toàn.
  - [ ] Modal mở → Tự động focus vào input đầu tiên.
  - [ ] Modal đóng → Focus trả về element gốc.

---

### [TASK TECHDEBT-01] Chuẩn Hóa Kiểu Dữ Liệu & Giảm Cảnh Báo ESLint Backend
* **Độ ưu tiên:** `P2` | **Độ phức tạp:** `S` (cần sự tỉ mỉ) | **Module:** [`backend/`](../backend)
* **Vai trò:** Backend Developer / Intern
* **Phụ thuộc:** Không
* **Bối cảnh hiện tại:**
  - Backend NestJS hiện đạt **0 errors** và **~1.808 warnings** (ngân sách giới hạn `--max-warnings 1950`).
  - Phần lớn warnings xuất phát từ `@typescript-eslint/no-explicit-any` trong các file mock test hoặc callback Mongoose/ExcelJS.
* **Phần cần thực hiện:**
  1. Chạy `cd backend && npm run lint` để xem danh sách warnings.
  2. **Ưu tiên sửa theo module nghiệp vụ (dễ → khó):**
     - `src/modules/categories/` (ít file, đơn giản)
     - `src/modules/banners/` (ít phụ thuộc)
     - `src/modules/promotions/` (logic rõ ràng)
     - `src/modules/reviews/` (ít type phức tạp)
     - `src/modules/products/` (nhiều file nhưng pattern lặp lại)
  3. **Kỹ thuật thay thế `any`:**
     ```typescript
     // ❌ Trước:
     const result: any = await this.model.find(query);
     
     // ✅ Sau:
     const result: FilterQuery<Product> = await this.model.find(query);
     // hoặc:
     const result: Record<string, unknown> = ...;
     // hoặc tạo interface cụ thể:
     interface ProductQueryResult { ... }
     ```
  4. Sau mỗi lần sửa 1 module, chạy:
     ```bash
     npm test           # Đảm bảo không hỏng code
     npm run lint       # Đếm số warnings còn lại
     ```
  5. **Mục tiêu:** Giảm warnings xuống dưới **1.500** (giảm ~300+).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Số lượng warnings giảm xuống dưới 1.500.
  - [ ] Toàn bộ unit tests vẫn **PASS 100%**.
  - [ ] Không thêm `// eslint-disable` mới — phải sửa đúng cách.

---

### [TASK RELIABILITY-01] Áp Dụng Transactional Outbox Pattern Cho Thông Báo
* **Độ ưu tiên:** `P3` | **Độ phức tạp:** `L` | **Module:** [`backend/src/modules/orders/`](../backend/src/modules/orders), [`backend/src/modules/notifications/`](../backend/src/modules/notifications)
* **Vai trò:** Backend Lead / Senior Developer
* **Phụ thuộc:** Không
* **Bối cảnh hiện tại:**
  - Trong `OrdersService`, sau khi Transaction MongoDB commit thành công, hệ thống bắn Socket.IO, gửi FCM push notification và đồng bộ Google Sheets.
  - Nếu app crash giữa commit DB và gửi thông báo, sự kiện thông báo bị thất lạc (best-effort).
* **Phần cần thực hiện:**
  1. **Tạo Schema `OutboxEvent`:**
     ```typescript
     @Schema({ timestamps: true })
     export class OutboxEvent {
       @Prop({ required: true, enum: ['ORDER_CREATED', 'ORDER_STATUS_UPDATED', 'STOCK_ALERT'] })
       eventType: string;
       
       @Prop({ type: Object, required: true })
       payload: Record<string, unknown>;
       
       @Prop({ default: 'PENDING', enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED'] })
       status: string;
       
       @Prop({ default: 0 })
       retryCount: number;
       
       @Prop({ default: 5 })
       maxRetries: number;
     }
     ```
  2. **Lưu Outbox Event cùng Transaction:** Thay vì bắn socket ngay, lưu bản ghi event vào `OutboxEvent` collection cùng session MongoDB Transaction.
  3. **Worker/Cron quét Outbox:**
     ```typescript
     @Cron(CronExpression.EVERY_10_SECONDS)
     async processOutbox() {
       const events = await this.outboxModel
         .find({ status: 'PENDING', retryCount: { $lt: '$maxRetries' } })
         .sort({ createdAt: 1 })
         .limit(20);
       
       for (const event of events) {
         try {
           await this.dispatchEvent(event);
           event.status = 'SENT';
         } catch {
           event.retryCount += 1;
           event.status = event.retryCount >= event.maxRetries ? 'FAILED' : 'PENDING';
         }
         await event.save();
       }
     }
     ```
  4. **Cleanup Job:** Cron hàng ngày xóa các event `SENT` cũ hơn 7 ngày.
  5. Viết test case: Mock crash sau commit → Kiểm tra event vẫn nằm trong Outbox → Worker pickup và gửi thành công.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Không bao giờ mất thông báo đơn hàng ngay cả khi server khởi động lại đột ngột.
  - [ ] Event `FAILED` sau max retries được đánh dấu rõ ràng để Admin review.
  - [ ] Toàn bộ unit tests vẫn PASS.

---

### [TASK INFRA-01] Kiểm Thử Cụm Đa Instance Backend với Redis Phân Tán
* **Độ ưu tiên:** `P3` | **Độ phức tạp:** `M` | **Module:** DevOps / Backend
* **Vai trò:** DevOps + Backend
* **Blocker:** Cần môi trường cloud hoặc nhiều container Docker
* **Phần cần thực hiện:**
  1. Triển khai 2–3 container Backend API cùng kết nối 1 Redis chung qua Docker Compose.
  2. **Kịch bản kiểm thử Token Blacklist phân tán:**
     - Đăng xuất ở Node A → Gửi request dùng token cũ tới Node B → Node B từ chối qua Redis key `bl:jti:{jti}`.
  3. **Kịch bản Rate Limiting phân tán:**
     - Gửi 5 request login sai mật khẩu phân bổ đều qua 3 node → Throttler Redis đếm tổng chung đúng ngưỡng → Node thứ 6 trả `429`.
  4. **Kịch bản WebSocket Notification:**
     - Khách hàng kết nối Socket.IO tới Node A, Admin duyệt đơn trên Node B → Khách hàng vẫn nhận notification qua Redis adapter.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Token bị blacklist ở node bất kỳ → tất cả các node đều từ chối ngay lập tức.
  - [ ] Rate limit đếm đúng ngưỡng trên toàn cụm, không bị reset khi request đổi node.
  - [ ] WebSocket notification hoạt động xuyên suốt giữa các node.

---

### [TASK PM-01] Hoàn Thiện Quy Trình Nghiệm Thu & Cổng Quyết Định Go/No-Go
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `M` | **Vai trò:** Project Manager
* **Phụ thuộc:** `PAY-01`, `MOBILE-01`
* **Nội dung:**
  1. Tổ chức rà soát lần cuối toàn bộ tiêu chí Production Definition of Done.
  2. Checklist Go/No-Go:
     - [ ] Bảo mật: Toàn bộ test QA-01 + QA-02 pass trên staging.
     - [ ] Thanh toán: Ít nhất 1 cổng online (VNPay hoặc MoMo) xác nhận hoạt động trên sandbox.
     - [ ] Mobile: Build ký chính thức tải được lên TestFlight / Internal Testing.
     - [ ] Database: MongoDB Replica Set kích hoạt Transaction trên staging.
     - [ ] Monitoring: Sentry DSN được cấu hình, ghi nhận lỗi 500 chính xác.
  3. Ban hành quyết định: Có thể phát hành Web Storefront hỗ trợ COD & VietQR trước, trong khi chờ Apple Developer Account và Merchant Keys online.
* **Nguyên tắc No-Go:**
  - Không release nếu bất kỳ test bảo mật nào fail.
  - Không release nếu database chưa kích hoạt replica set.
* **Tiêu chí nghiệm thu:**
  - [ ] Văn bản quyết định Go/No-Go được ban hành và lưu trữ.

---

## 6. ⏱️ Thứ Tự Thực Thi & Phụ Thuộc Kỹ Thuật Phase 2

```
[CÓ THỂ LÀM NGAY — Không phụ thuộc bên ngoài]
FE-08 (ImageUploader Admin)
FE-09 (Focus Trap Modal)
TECHDEBT-01 (Giảm ESLint Warnings)

[LÀM KHI CÓ TÀI KHOẢN SANDBOX]
PAY-01 (VNPay/MoMo Sandbox) ──── cần Merchant Keys
SHIPPING-01 (GHN Sandbox)  ──── cần GHN Token + Shop ID

[LÀM KHI CÓ CHỨNG CHỈ DEVELOPER]
MOBILE-01 (Ký AAB/IPA + FCM) ──── cần Apple Dev + Firebase
  └─► MOBILE-02 (E2E Thiết bị thật)

[ƯU TIÊN THẤP — Làm sau]
RELIABILITY-01 (Transactional Outbox) ── P3, khó
INFRA-01 (Multi-instance Redis)       ── P3, cần cloud

[CỔNG PHÁT HÀNH]
PM-01 (Go/No-Go Gate) ──── chờ PAY-01 + MOBILE-01
```

### Gợi Ý Thứ Tự Thực Hiện Tối Ưu

| Tuần | Task | Ghi chú |
| :---: | :--- | :--- |
| **Tuần 1** | `FE-08`, `FE-09`, `TECHDEBT-01` | Làm ngay, không chờ ai |
| **Tuần 2** | `PAY-01`, `SHIPPING-01` | Khi có merchant keys & GHN token |
| **Tuần 3** | `MOBILE-01`, `MOBILE-02` | Khi có Apple Dev + Firebase |
| **Tuần 4** | `RELIABILITY-01`, `INFRA-01`, `PM-01` | Sprint cuối trước Go-Live |

---

## 7. ⛔ Danh Mục Tạm Hoãn (Phase 3+)

Các hạng mục sau **KHÔNG triển khai** trong Phase 2:

* ❌ **Hạ tầng nâng cao:** Kubernetes, Docker Swarm, Helm charts, Terraform.
* ❌ **Môi trường đám mây phức tạp:** Multi-region, Auto-scaling, CDN Edge rules.
* ❌ **Kiến trúc phân tán:** Microservices, Apache Kafka, RabbitMQ, Elasticsearch.
* ❌ **Tính năng mở rộng:** AI Recommendation, Advanced Analytics, Admin 2FA, GraphQL API.
* ❌ **CI/CD nâng cao:** Pipeline kiểm thử tải phân tán, tự động deploy phức tạp.

---

> **Phê duyệt:** Tài liệu này là bản chuẩn mực (Source of Truth) cho lộ trình phát triển Nhà sách Trường Thành. Phase 1 đã đạt 100% — hệ thống sẵn sàng cho Phase 2 tích hợp đối tác bên thứ ba và chuẩn bị phát hành.
