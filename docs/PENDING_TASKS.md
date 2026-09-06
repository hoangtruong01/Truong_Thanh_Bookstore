# 📋 DANH MỤC CÔNG VIỆC CHƯA XONG & KẾ HOẠCH PHÁT TRIỂN (PENDING TASKS & ROADMAP)
> **Dự án:** Nhà sách Trường Thành (Trường Thành Bookstore)  
> **Phiên bản tài liệu:** 1.0 (Tổng hợp toàn bộ nợ kỹ thuật, cổng nghiệm thu môi trường thật & backlog sau Sprint 4)  
> **Đối tượng:** Quản lý dự án (PM), Lập trình viên Backend / Frontend / Mobile & Thực tập sinh (Intern).  
> **Mục tiêu:** Liệt kê minh bạch, chính xác toàn bộ các hạng mục công việc chưa hoàn thành, kèm theo độ ưu tiên, người phụ trách, tiêu chí nghiệm thu (Acceptance Criteria) và hướng dẫn chi tiết để bất kỳ thành viên nào cũng có thể nhận việc và làm tiếp ngay.

---

## 📑 MỤC LỤC
1. [📊 Bảng Dashboard Tổng hợp Công việc Chưa Hoàn thành](#1--bảng-dashboard-tổng-hợp-công-việc-chưa-hoàn-thành)
2. [🚪 Nhóm 1: Các Cổng Nghiệm thu Môi trường Thật (Production Release Gates)](#2--nhóm-1-các-cổng-nghiệm-thu-môi-trường-thật-production-release-gates)
3. [💳 Nhóm 2: Tích hợp Đối tác Bên Thứ Ba (Cần Tài khoản Sandbox)](#3--nhóm-2-tích-hợp-đối-tác-bên-thứ-ba-cần-tài-khoản-sandbox)
4. [🛠️ Nhóm 3: Nợ Kỹ thuật & Cải tiến Mã nguồn (Technical Debt - Thích hợp cho Intern)](#4-️-nhóm-3-nợ-kỹ-thuật--cải-tiến-mã-nguồn-technical-debt---thích-hợp-cho-intern)
5. [📘 Hướng dẫn Dành cho Intern / Lập trình viên Mới Nhận Việc](#5--hướng-dẫn-dành-cho-intern--lập-trình-viên-mới-nhận-việc)

---

## 1. 📊 Bảng Dashboard Tổng hợp Công việc Chưa Hoàn thành

| Mã Task | Tên Công Việc | Phân Hệ | Priority | Trạng thái Hiện tại | Độ khó | Thích hợp cho Intern? |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **QA-03** | Benchmark tải & Truy vấn Aggregation trên Staging | QA / Backend | **P1** | Đã có harness test; Cần chạy Staging thật | Vừa | ❌ (Cần môi trường) |
| **MOBILE-01** | Ký AAB/IPA & Cấu hình Push FCM/APNs trên máy thật | Mobile / DevOps | **P1** | Mã nguồn đã pass test; Cần chứng chỉ thật | Khó | ❌ (Cần Account Store) |
| **MOBILE-02** | Kiểm thử Toàn trình E2E luồng mua hàng trên Thiết bị thật | Mobile / QA | **P2** | 42 unit/widget test PASS; Cần máy thật | Vừa | ⚠️ (Cần điện thoại/máy ảo) |
| **PM-01** | Quy trình Duyệt Phát hành Chính thức (Go/No-Go Gate) | PM / DevOps | **P0** | Chờ hoàn tất các Gate kỹ thuật | Vừa | ❌ (Dành cho PM/Lead) |
| **PAY-01** | Xác thực Giao dịch Sandbox Cổng VNPay & MoMo | Backend / QA | **P2** | Mã nguồn xử lý chữ ký đã xong; Chờ keys | Dễ/Vừa | ✅ (Khi có merchant test) |
| **SHIPPING-01**| Tích hợp Vận đơn Sandbox Giao Hàng Nhanh (GHN) | Backend / FE | **P2** | DTO/Service đã viết; Chờ GHN Token/Shop ID | Dễ/Vừa | ✅ (Khi có shop test) |
| **FE-04** | Tích hợp `ImageUploader.vue` vào các trang Admin CMS | Frontend Web | **P2** | Component đã hoàn chỉnh; Các trang cần gắn | **Dễ** | ⭐⭐⭐ **(Rất thích hợp)** |
| **A11Y-01** | Bổ sung Focus Trap & Phím tắt bàn phím cho Modal | Frontend Web | **P3** | Cần xử lý trải nghiệm trợ năng bàn phím | **Dễ** | ⭐⭐⭐ **(Rất thích hợp)** |
| **TECHDEBT-02**| Xử lý 1.811 ESLint Warnings & Chuẩn hóa Types Backend| Backend | **P2** | 0 errors nhưng còn nợ type-safety | **Dễ** | ⭐⭐⭐ **(Rất thích hợp)** |
| **RELIABILITY-01**| Transactional Outbox Pattern cho sự kiện sau commit | Backend | **P3** | Hiện tại là best-effort bắn socket sau commit | Khó | ⚠️ (Cần kinh nghiệm BE) |
| **INFRA-01** | Kiểm thử Cụm Multi-instance Backend chia sẻ Redis | DevOps / BE | **P3** | Mã nguồn đã dùng Redis; Cần test tải cụm | Vừa | ❌ (Cần môi trường cloud) |

---

## 2. 🚪 Nhóm 1: Các Cổng Nghiệm thu Môi trường Thật (Production Release Gates)

---

### Task: QA-03 — Benchmark Chịu Tải & Đo Đạc Truy Vấn Aggregation Staging
- **Vai trò chính:** QA + Backend
- **Độ ưu tiên:** P1 | **Mức độ:** Cần cho Release Production
- **Bối cảnh hiện tại:**
  - Bộ kịch bản load test (`scripts/load/catalog-search.load.js` và `concurrent-orders.load.js`) đã được xây dựng và pass trên loopback cục bộ.
  - Công cụ trích xuất pipeline OrdersService (`scripts/load/report-explain.cjs`) đã hoàn thành.
  - Đã có test kiểm tra tính chính xác doanh thu thuần (`reports.accuracy.spec.ts` 6/6 pass).
- **Phần còn thiếu cần thực hiện:**
  1. Triển khai backend lên môi trường Staging có cấu hình phần cứng tương đương Production.
  2. Nạp tập dữ liệu mẫu đủ lớn (ít nhất 10.000 sản phẩm, 50.000 đơn hàng lịch sử).
  3. Chạy script load test với 50–100 người dùng đồng thời trong 15 phút.
  4. Thu thập báo cáo `explain("executionStats")` của MongoDB cho các pipeline tính doanh thu `/reports/overview` và `/reports/revenue-chart`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Latency p95 của các endpoint đọc danh mục và tìm kiếm sách duy trì `< 300ms`.
  - [ ] Không có truy vấn aggregation nào quét toàn bộ bảng (`COLLSCAN`) mà không dùng index trên tập dữ liệu lớn.
  - [ ] Không phát sinh lỗi bán vượt tồn kho (overselling) khi chạy checkout đồng thời trên sản phẩm có số lượng tồn ít.

---

### Task: MOBILE-01 — Đóng Gói Ký Số & Kích Hoạt Push Notification Máy Thật
- **Vai trò chính:** Mobile + DevOps
- **Độ ưu tiên:** P1 | **Mức độ:** Cần cho Mobile Release
- **Bối cảnh hiện tại:**
  - Ứng dụng Flutter đã vượt qua 42/42 tests và `flutter analyze` 0 issue.
  - Đã xử lý cách ly lỗi khởi tạo push khỏi luồng đăng nhập, hỗ trợ cold-start từ notification deeplink mở đơn hàng, kiểm tra `API_URL` HTTPS hợp lệ lúc khởi động.
  - Đã cấu hình `Runner.entitlements` cho iOS (hỗ trợ APS Environment development/production).
- **Phần còn thiếu cần thực hiện:**
  1. Cấu hình file `mobile/android/key.properties` thật từ script `mobile/scripts/generate-keystore.ps1` (hoặc `.sh`).
  2. Tạo chứng chỉ Apple Developer và Provisioning Profile cho bundle identifier `vn.truongthanh.bookstore`.
  3. Cung cấp file `google-services.json` (Android) và `GoogleService-Info.plist` (iOS) thật từ Google Firebase Console của dự án.
  4. Đóng gói bản ký chính thức: Android App Bundle (`flutter build appbundle --release`) và iOS Archive (`flutter build ipa --release`).
  5. Cài đặt file build lên ít nhất 1 thiết bị Android thật và 1 thiết bị iPhone thật.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Khi Admin duyệt đơn hoặc chuyển trạng thái trên Web CMS, điện thoại nhận được Push Notification trong vòng 3 giây khi app đang ở background hoặc khóa màn hình.
  - [ ] Khi chạm vào thông báo lúc app đang tắt hoàn toàn (cold-start), ứng dụng mở thẳng vào màn hình Chi tiết đơn hàng (`OrderDetailScreen`) sau khi xác thực session.
  - [ ] Build thành công file `.aab` và `.ipa` có chữ ký hợp lệ sẵn sàng tải lên Google Play Console & TestFlight.

---

### Task: MOBILE-02 — Kiểm Thử Toàn Trình Mua Hàng Trên Thiết Bị Di Động Thật
- **Vai trò chính:** Mobile + QA
- **Độ ưu tiên:** P2
- **Bối cảnh hiện tại:** Toàn bộ luồng contract API và state machine đã có mock tests trong `mobile/test/`.
- **Phần còn thiếu cần thực hiện:**
  1. Cài đặt ứng dụng trên thiết bị di động thật (hoặc máy ảo Android Emulator / iOS Simulator) kết nối tới Backend Staging/Local.
  2. Thực hiện kịch bản người dùng thực tế:
     - Đăng ký tài khoản mới ➔ Tìm kiếm sách ➔ Thêm vào giỏ hàng ➔ Chọn địa chỉ ➔ Nhập điểm Loyalty / Áp Voucher ➔ Chọn thanh toán COD ➔ Bấm Đặt hàng.
  3. Thử nghiệm tình huống mất mạng (bật Airplane mode) trong lúc thanh toán: kiểm tra ứng dụng có giữ đúng `Idempotency-Key` khi bấm thử lại hay không.
  4. Kiểm tra hiển thị danh sách đơn hàng có phân trang (Infinite scroll / Pull to refresh).
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Không có hiện tượng crash hoặc đứng hình (freeze) trên giao diện.
  - [ ] Không tạo 2 đơn hàng trùng lặp khi thử lại do mất mạng.
  - [ ] Dữ liệu giỏ hàng và đơn hàng đồng bộ hoàn hảo với Web Storefront.

---

### Task: PM-01 — Hoàn Thiện Quy Trình Nghiệm Thu & Cổng Quyết Định Go / No-Go
- **Vai trò chính:** Project Manager (PM)
- **Độ ưu tiên:** P0 (Điều phối phát hành)
- **Nội dung:**
  - Tổ chức rà soát lần cuối toàn bộ các tiêu chí Production Definition of Done.
  - Ban hành quyết định chính thức: Có thể phát hành trước bản Web Storefront hỗ trợ COD & Chuyển khoản VietQR, trong khi chờ cấp tài khoản Apple Developer và Merchant Keys online.
- **Nguyên tắc No-Go:** Không cho phép release nếu bất kỳ kiểm thử bảo mật nào bị fail hoặc database chưa kích hoạt cơ chế transaction replica set an toàn.

---

## 3. 💳 Nhóm 2: Tích hợp Đối tác Bên Thứ Ba (Cần Tài khoản Sandbox)

---

### Task: PAY-01 — Xác Thực Giao Dịch Thật Cổng Thanh Toán VNPay & MoMo
- **Vai trò chính:** Backend + QA
- **Độ ưu tiên:** P2 (Blocker nếu muốn mở tính năng thanh toán thẻ online)
- **Bối cảnh hiện tại:**
  - Mã nguồn trong `backend/src/modules/payments/providers/payment.providers.ts` đã triển khai đầy đủ thuật toán sinh chữ ký SHA-512 cho VNPay 2.1.0 và HMAC-SHA256 cho MoMo.
  - Các test case kiểm tra chữ ký và format tham số đã pass 100% trong `payment.providers.spec.ts`.
- **Phần còn thiếu cần thực hiện:**
  1. Nhận thông tin tài khoản Test Merchant từ VNPay Sandbox (`vnp_TmnCode`, `vnp_HashSecret`) và MoMo Developer Portal (`partnerCode`, `accessKey`, `secretKey`).
  2. Điền thông tin vào `backend/.env`.
  3. Tạo đơn hàng và thực hiện giao dịch thử bằng thẻ test ATM/Visa của VNPay và ứng dụng ví MoMo Sandbox.
  4. Kiểm tra endpoint Webhook / IPN (`/api/payments/vnpay-ipn` và `/api/payments/momo-ipn`) nhận kết quả, đối soát số tiền khớp với đơn hàng và tự động chuyển trạng thái đơn sang `CONFIRMED` + `paymentStatus: PAID`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Thanh toán thành công trên cổng test ➔ Đơn hàng cập nhật `PAID` và bắn thông báo tức thì tới khách hàng.
  - [ ] Giả mạo chữ ký IPN hoặc sai số tiền ➔ Backend từ chối với HTTP 400 và không duyệt đơn.

---

### Task: SHIPPING-01 — Tích Hợp Đồng Bộ Vận Đơn Giao Hàng Nhanh (GHN)
- **Vai trò chính:** Backend + Frontend
- **Độ ưu tiên:** P2
- **Bối cảnh hiện tại:** Kiến trúc hệ thống đã có state `SHIPPING` và trường lưu mã vận đơn `trackingNumber`.
- **Phần còn thiếu cần thực hiện:**
  1. Đăng ký tài khoản trên cổng thử nghiệm GHN Sandbox (`https://dev-online-gateway.ghn.vn`).
  2. Lấy API Token và Shop ID điền vào `.env`.
  3. Hoàn thiện Service gọi API tạo đơn giao hàng (`/shiip/public-api/v2/shipping-order/create`) khi Admin chuyển đơn sang `SHIPPING`.
  4. Hiển thị mã tra cứu vận đơn và liên kết theo dõi bưu tá trên giao diện chi tiết đơn hàng của Web và Mobile.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Khi Admin bấm "Giao Hàng Nhanh", hệ thống tự động sinh mã vận đơn thật từ GHN (ví dụ: `ED1234567VN`).
  - [ ] Khách hàng bấm vào mã vận đơn có thể mở trang tra cứu lộ trình của GHN.

---

## 4. 🛠️ Nhóm 3: Nợ Kỹ thuật & Cải tiến Mã nguồn (Technical Debt - Thích hợp cho Intern)

---

### Task: FE-04 — Tích Hợp `ImageUploader.vue` Vào Các Trang Quản Trị Admin CMS
- **Vai trò chính:** Frontend Developer / Intern
- **Độ ưu tiên:** P2 | **Độ khó:** Dễ
- **Bối cảnh hiện tại:**
  - Component tái sử dụng cao cấp [`frontend/src/components/ImageUploader.vue`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/frontend/src/components/ImageUploader.vue) đã được xây dựng hoàn chỉnh và có bộ test tự động riêng (`ImageUploader.spec.ts`). Hỗ trợ kéo thả ảnh, xem trước (preview grid), kiểm tra dung lượng tối đa, định dạng MIME và nhập link ảnh ngoài.
  - Tuy nhiên, một số trang Admin CMS cũ vẫn đang dùng thẻ `<input type="file">` đơn giản hoặc chưa dùng chung component này.
- **Công việc cần làm:**
  1. Mở trang quản trị sản phẩm: `frontend/src/pages/admin/Products.vue`.
  2. Thay thế phần upload ảnh sản phẩm bằng component `<ImageUploader v-model="form.images" :max-files="5" :max-size-m-b="5" />`.
  3. Tương tự, kiểm tra và tích hợp vào trang quản trị Banner (`frontend/src/pages/admin/Banners.vue`).
  4. Chạy kiểm tra build: `npm run build` và test: `npm run test:unit`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Giao diện tải ảnh trên trang Admin đồng bộ, kéo thả mượt mà, xem trước ảnh sắc nét.
  - [ ] `npm run build` ở frontend pass 0 lỗi.

---

### Task: A11Y-01 — Cải Thiện Trợ Năng Bàn Phím & Focus Trap Cho `FormModal.vue`
- **Vai trò chính:** Frontend Developer / Intern
- **Độ ưu tiên:** P3 | **Độ khó:** Dễ
- **Bối cảnh hiện tại:**
  - Component [`frontend/src/components/FormModal.vue`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/frontend/src/components/FormModal.vue) dùng để hiển thị popup thêm/sửa dữ liệu trên toàn bộ trang Admin.
  - Hiện tại, khi mở modal, phím `Tab` vẫn có thể nhảy ra ngoài các phần tử phía sau nền (background), và bấm phím `Escape` đôi khi chưa đóng modal nhanh.
- **Công việc cần làm:**
  1. Thêm xử lý phím `Escape` (`@keydown.esc="closeModal"`).
  2. Cài đặt cơ chế Focus Trap (khóa con trỏ bàn phím chỉ luân chuyển giữa các input bên trong modal khi modal đang mở).
  3. Tự động focus vào ô nhập liệu đầu tiên khi modal vừa xuất hiện.
  4. Chạy `npm run test:unit` để kiểm tra không bị lỗi hồi quy.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Bấm phím `Tab` liên tục trên modal chỉ chạy vòng quanh các nút/ô nhập trong modal.
  - [ ] Bấm phím `Escape` đóng modal an toàn.

---

### Task: TECHDEBT-02 — Chuẩn Hóa Kiểu Dữ Liệu & Giảm Cảnh Báo ESLint Backend
- **Vai trò chính:** Backend Developer / Intern
- **Độ ưu tiên:** P2 | **Độ khó:** Dễ (Cần sự tỉ mỉ)
- **Bối cảnh hiện tại:**
  - Backend NestJS hiện tại đạt **0 errors** nhưng còn **1.811 warnings** (ngân sách giới hạn là 1.816).
  - Phần lớn warnings xuất phát từ việc dùng kiểu `any` trong các file mock test hoặc các tham số callback Mongoose/ExcelJS.
- **Công việc cần làm:**
  1. Chạy lệnh: `npm run lint` để quan sát danh sách các cảnh báo `@typescript-eslint/no-explicit-any`.
  2. Chọn các module nghiệp vụ cụ thể (ví dụ: `src/modules/categories/`, `src/modules/banners/`, `src/modules/promotions/`).
  3. Thay thế kiểu `any` bằng interface hoặc generic type cụ thể (ví dụ: `Record<string, unknown>`, `FilterQuery<Product>`, DTO classes).
  4. Đảm bảo số lượng warnings giảm dần mà không làm hỏng code (chạy `npm test` sau mỗi lần sửa).
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Số lượng warnings giảm xuống dưới 1.500 (hoặc thấp hơn).
  - [ ] Toàn bộ 397 unit tests vẫn **PASS 100%**.

---

### Task: RELIABILITY-01 — Áp Dụng Transactional Outbox Pattern Cho Thông Báo
- **Vai trò chính:** Backend Lead / Senior Developer
- **Độ ưu tiên:** P3 | **Độ khó:** Nâng cao
- **Bối cảnh hiện tại:**
  - Trong `OrdersService`, sau khi Transaction MongoDB commit thành công, hệ thống gọi bắn Socket.IO, gửi FCM push notification và đồng bộ Google Sheets.
  - Nếu ứng dụng bị mất điện hoặc crash đúng vào tích tắc giữa commit DB và gửi thông báo, sự kiện thông báo có thể bị thất lạc mà không được thử lại (best-effort).
- **Công việc cần làm:**
  1. Tạo collection `OutboxEvents` trong MongoDB.
  2. Lưu bản ghi sự kiện cùng session với Transaction đặt hàng.
  3. Xây dựng Worker/Cron quét các event ở trạng thái `PENDING` trong Outbox và phát đi. Khi gửi thành công thì chuyển `SENT`.
- **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [ ] Không bao giờ bị mất thông báo đơn hàng ngay cả khi server khởi động lại đột ngột.

---

### Task: INFRA-01 — Kiểm Thử Cụm Đa Instance Backend với Redis Phân Tán
- **Vai trò chính:** DevOps / Backend
- **Độ ưu tiên:** P3
- **Nội dung:**
  - Triển khai 2–3 container Backend API cùng kết nối vào 1 container Redis chung qua Docker Compose.
  - Gửi request đăng xuất ở Node A ➔ Gửi tiếp request dùng token cũ tới Node B ➔ Kiểm tra Node B từ chối ngay lập tức qua Redis key `bl:jti:{jti}`.
  - Kiểm tra Rate Limiting giới hạn chung đúng ngưỡng trên toàn cụm.

---

## 5. 📘 Hướng dẫn Dành cho Intern / Lập trình viên Mới Nhận Việc

Nếu bạn là Thực tập sinh hoặc Lập trình viên mới tham gia dự án, đây là lộ trình khuyến nghị để bạn bắt đầu mà không bị ngợp:

### 🌟 Bước 1: Khởi động với các Task Nhẹ nhàng (Tuần đầu tiên)
- **Nên chọn ngay:**
  1. 👉 **Task FE-04:** Tích hợp `ImageUploader.vue` vào các trang Admin CMS. (Giúp bạn làm quen với cấu trúc Vue 3, Pinia và Component tái sử dụng).
  2. 👉 **Task A11Y-01:** Cải thiện phím tắt và Focus Trap cho `FormModal.vue`.
  3. 👉 **Task TECHDEBT-02:** Rà soát và sửa 30–50 cảnh báo `any` trong các module backend đơn giản như `categories` hoặc `banners`. (Giúp bạn hiểu sâu cấu trúc DTO và Schema Mongoose).

### 🚀 Bước 2: Nâng cao với Logic Nghiệp vụ (Tuần thứ hai)
- **Nên chọn:**
  1. 👉 **Task MOBILE-02:** Chạy thử ứng dụng Flutter trên máy ảo/điện thoại thật, trải nghiệm và sửa các lỗi hiển thị giao diện nhỏ nếu có.
  2. 👉 **Task PAY-01 / SHIPPING-01:** Xin tài khoản Sandbox từ Lead để kiểm thử giao dịch thật và viết tài liệu kết nối.

### 📋 Quy trình Nộp Mã Nguồn (Git Workflow)
1. **Tạo nhánh mới từ `main`:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/FE-04-integrate-image-uploader
   ```
2. **Lập trình & Chạy kiểm thử cục bộ:**
   - Nếu làm Frontend: Chạy `npm run test:unit` và `npm run build`.
   - Nếu làm Backend: Chạy `npm test` và `npm run lint`.
3. **Commit code rõ ràng theo chuẩn Conventional Commits:**
   ```bash
   git commit -m "feat(admin): integrate ImageUploader component into Products and Banners pages"
   ```
4. **Đẩy nhánh lên GitHub và tạo Pull Request (PR):**
   - Đính kèm hình ảnh / video minh chứng kết quả hoạt động trên máy bạn.
   - Tag Mentor hoặc Lead vào review code.

---
*Tài liệu này được cập nhật định kỳ theo tiến độ dự án. Khi hoàn thành một task, hãy cập nhật trạng thái tương ứng tại tài liệu này.*
