# 🛡️ TRƯƠNG THANH BOOKSTORE — KẾ HOẠCH BẢO MẬT & LOCAL MVP
> **Tài liệu:** Kế hoạch Kỹ thuật & Bảng Phân rã Công việc (Technical Task Plan & Execution Roadmap)  
> **Giai đoạn hiện tại:** Bảo mật vững chắc — Chạy Local ổn định — Trải nghiệm mượt mà  
> **Vị trí lưu trữ:** `docs/SECURITY_LOCAL_MVP_PLAN.md`  
> **Mục tiêu:** Định hình rõ ràng phạm vi công việc, triệt tiêu lỗ hổng bảo mật, giải quyết bất đồng bộ thanh toán, chuẩn hóa môi trường phát triển nội bộ trước khi thực hiện giai đoạn Deploy/Production.

---

## 📑 MỤC LỤC
1. [🎯 Mục Tiêu & Định Hướng Phạm Vi (Scope Boundary)](#1--mục-tiêu--định-hướng-phạm-vi-scope-boundary)
2. [📊 Bảng Ma Trận Phân Bổ Độ Ưu Tiên (Priority Matrix)](#2--bảng-ma-trận-phân-bổ-độ-ưu-tiên-priority-matrix)
3. [🔒 Track 1: Bảo Mật Hệ Thống & Quản Lý Danh Tính (Security Tasks)](#3--track-1-bảo-mật-hệ-thống--quản-lý-danh-tính-security-tasks)
4. [💳 Track 2: An Toàn Đơn Hàng, Thanh Toán & Hoàn Tiền (Payment & Order Safety)](#4--track-2-an-toàn-đơn-hàng-thanh-toán--hoàn-tiền-payment--order-safety)
5. [🐳 Track 3: Chuẩn Hóa Môi Trường Phát Triển Cục Bộ (Local Development)](#5--track-3-chuẩn-hóa-môi-trường-phát-triển-cục-bộ-local-development)
6. [💻 Track 4: Tối Ưu Trải Nghiệm Người Dùng (Frontend & UX Tasks)](#6--track-4-tối-ưu-trải-nghiệm-người-dùng-frontend--ux-tasks)
7. [🛠️ Track 5: Duy Trì Mã Nguồn & Giảm Thiểu Nợ Kỹ Thuật (Maintainability & Tech Debt)](#7-️-track-5-duy-trì-mã-nguồn--giảm-thiểu-nợ-kỹ-thuật-maintainability--tech-debt)
8. [🧪 Track 6: Kế Hoạch Kiểm Thử Trọng Yếu (QA & Test Suites)](#8--track-6-kế-hoạch-kiểm-thử-trọng-yếu-qa--test-suites)
9. [⏱️ Thứ Tự Thực Thi & Phụ Thuộc Kỹ Thuật (Dependency Chain)](#9-️-thứ-tự-thực-thi--phụ-thuộc-kỹ-thuật-dependency-chain)
10. [🚀 Kế Hoạch 4 Sprint Triển Khai (Sprint Plan & DoD)](#10--kế-hoạch-4-sprint-triển-khai-sprint-plan--dod)
11. [⚡ Top 10 Hạng Mục Cần Làm Ngay Lập Tức](#11--top-10-hạng-mục-cần-làm-ngay-lập-tức)
12. [⛔ Danh Mục Tạm Hoãn (Chưa Cần Làm Lúc Này)](#12--danh-mục-tạm-hoãn-chưa-cần-làm-lúc-này)
13. [🏁 Cổng Nghiệm Thu Của CTO (CTO Readiness Gates)](#13--cổng-nghiệm-thu-của-cto-cto-readiness-gates)

---

## 1. 🎯 Mục Tiêu & Định Hướng Phạm Vi (Scope Boundary)

Giai đoạn hiện tại của dự án tập trung toàn lực vào **Chất lượng cốt lõi nội bộ (Local MVP & Foundation Security)** thay vì mở rộng hạ tầng hay tính năng nâng cao.

```
                  ┌──────────────────────────────────────────────┐
                  │          TIÊU CHÍ SỐNG CÒN (LOCAL MVP)       │
                  └──────────────────────┬───────────────────────┘
            ┌────────────────────────────┼────────────────────────────┐
            ▼                            ▼                            ▼
┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│   BẢO MẬT CHẮC CHẮN   │    │    CHẠY LOCAL ỔN ĐỊNH  │    │  TRẢI NGHIỆM MƯỢT MÀ  │
│ - Triệt tiêu IDOR/RBAC│    │ - 1 lệnh Docker Up    │    │ - Auth Hydration chuẩn│
│ - Token/Cookie chuẩn  │    │ - Đồng nhất Node 22   │    │ - Queue Refresh Token │
│ - Sanitize input/error│    │ - .env.example đầy đủ │    │ - Chống Double Submit │
│ - Payment Idempotency │    │ - Seed data hoàn chỉnh│    │ - Checkout hiển thị rõ│
└───────────────────────┘    └───────────────────────┘    └───────────────────────┘
```

### 1.1. Ba Trụ Cột Trọng Tâm
* **Bảo mật cơ bản phải chắc:**
  * Không có lỗ hổng rõ ràng trong Authentication / Authorization / RBAC.
  * Tuyệt đối không để lộ Secret, Private Keys, JWT Tokens, Cookies trong mã nguồn hoặc phản hồi API.
  * Validation chặt chẽ toàn bộ DTO đầu vào, chặn triệt để Mass Assignment; rate limit và payload limit bảo vệ hạ tầng.
  * Người dùng thông thường không có cách nào gọi được API quản trị (Admin/Staff).
* **Chạy Local ổn định và đồng nhất:**
  * Backend, Frontend, Mobile, MongoDB (Replica Set) và Redis khởi chạy đồng nhất chỉ với quy trình rõ ràng.
  * Độc lập hoàn toàn với cấu hình Production/Staging bên ngoài khi kiểm thử cục bộ.
  * Hệ thống file `.env.example` đầy đủ, chú thích rõ ràng; không xung đột phiên bản Node / npm / Docker.
* **Trải nghiệm sử dụng mượt mà (Smooth UX):**
  * Vòng đời Session (Login / Logout / Token Refresh) diễn ra trong suốt, không rơi vào vòng lặp vô hạn.
  * Luồng Giỏ hàng / Đặt hàng / Thanh toán nhất quán về mặt dữ liệu (Data Consistency), không bị sai lệch trạng thái.
  * Màn hình có đầy đủ trạng thái Loading, Skeleton, Error, Empty State; không có màn hình trắng hay request rác/lặp.
  * Frontend tự động dọn sạch State ngay khi Session hết hạn.

### 1.2. Ranh Giới Phạm Vi (Scope In vs Scope Out)
* **TRONG PHẠM VI (In-Scope):**
  * Toàn bộ các tiêu chuẩn bảo mật P0/P1 cho API & Frontend.
  * Cấu hình Docker Local (MongoDB Replica Set phục vụ Transaction + Redis).
  * Chuẩn hóa nghiệp vụ Huỷ/Trả hàng/Hoàn tiền (Refund Lifecycle).
  * Kiểm soát tải trọng (Payload Hardening), Rate Limiting và Sanitize Error responses.
  * Trải nghiệm giỏ hàng, Checkout và chặn submit nhiều lần.
* **NGOÀI PHẠM VI (Out-of-Scope - Hoãn lại đến sau khi đạt chuẩn Local MVP):**
  * Triển khai Production/Staging, cụm Kubernetes, Docker Swarm.
  * Tách Microservices, tích hợp Kafka, RabbitMQ, Elasticsearch.
  * Pipeline CI/CD phức tạp, multi-region, auto-scaling, CDN optimization.
  * Tính năng gợi ý AI, phân tích nâng cao (Advanced Analytics), Admin 2FA.

---

## 2. 📊 Bảng Ma Trận Phân Bổ Độ Ưu Tiên (Priority Matrix)

| Cấp độ | Định nghĩa | Hạng mục công việc chính | Hành động |
| :---: | :--- | :--- | :---: |
| **P0** | **Tối quan trọng (Làm ngay)** | Bảo mật Auth/RBAC, Nhất quán Đơn hàng/Thanh toán, Vòng đời Hoàn tiền, Hạ tầng Local, Chặn Mass Assignment | Bắt buộc hoàn thành để khóa rủi ro vỡ hệ thống |
| **P1** | **Hoàn thiện Local MVP** | Timeout bên thứ ba, Auth Hydration FE, Giới hạn Payload, Rate Limiting, UX Báo lỗi, Chống Double Click | Hoàn thiện trải nghiệm và độ ổn định |
| **P2** | **Tối ưu & Dọn nợ kỹ thuật** | Tách nhỏ `OrdersService`, Index truy vấn Auto-cancel, Dọn dẹp cảnh báo ESLint, Skeleton/Empty State | Nâng cao khả năng bảo trì mã nguồn |
| **P3** | **Làm sau (Future Phase)** | AI Recommendation, Phân tích nâng cao, Xác thực 2FA, Kiến trúc microservices, K8s, Kafka | Hoãn lại sang giai đoạn Pre-Production |

### Bảng Tổng Hợp 26 Task Cốt Lõi

| Mã Task | Tên Công Việc | Phân Hệ | Priority | Trạng Thái | Phụ Thuộc |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **SEC-06** | Rà soát Secret & Biến Môi Trường (Sanitize Secrets) | DevOps / BE | **P0** | ✅ **Hoàn thành** | *None* |
| **LOCAL-01**| Đồng nhất Phiên bản Node.js 22 LTS | Full-stack | **P0** | ✅ **Hoàn thành** | *None* |
| **LOCAL-02**| Hạ tầng 1 lệnh Docker (Mongo Replica Set + Redis) | DevOps / BE | **P0** | ✅ **Hoàn thành** | LOCAL-01 |
| **LOCAL-03**| Hoàn thiện tài liệu `.env.example` Đầy Đủ | Full-stack | **P0** | ✅ **Hoàn thành** | LOCAL-02 |
| **LOCAL-04**| Xây dựng Bộ Dữ Liệu Mẫu Cục Bộ (Seed Data) | Backend | **P1** | ✅ **Hoàn thành** | LOCAL-02 |
| **LOCAL-05**| Tài Liệu Hướng Dẫn Khởi Động Local Chi Tiết | Full-stack | **P1** | ✅ **Hoàn thành** | LOCAL-03 |
| **SEC-01** | Kiểm tra Cơ chế Token, Cookie & Quản lý Session | Backend / Sec | **P0** | ✅ **Hoàn thành** | LOCAL-03 |
| **SEC-02** | Rà soát Ủy quyền (RBAC) & Ngăn ngừa Lỗ hổng IDOR | Backend / Sec | **P0** | ✅ **Hoàn thành** | SEC-01 |
| **SEC-03** | Xác thực Dữ liệu Đầu vào & Chống Mass Assignment | Backend | **P0** | ✅ **Hoàn thành** | SEC-01 |
| **SEC-04** | Giới hạn Kích thước Payload API (Payload Hardening) | Backend / Sec | **P1** | ✅ **Hoàn thành** | SEC-03 |
| **SEC-05** | Giới hạn Tần suất Gọi API Trọng Yếu (Rate Limiting) | Backend / Sec | **P1** | ✅ **Hoàn thành** | LOCAL-02 |
| **SEC-07** | Chuẩn hóa Phản hồi Lỗi & Ẩn Chi tiết Kỹ thuật | Backend | **P1** | ✅ **Hoàn thành** | SEC-03 |
| **BA-01**  | Chốt Ma Trận Nghiệp Vụ Hủy, Trả Hàng & Hoàn Tiền | BA / PM | **P0** | ✅ **Hoàn thành** | *None* |
| **BE-01**  | Xây dựng Toàn bộ Vòng Đời Hoàn Tiền (Refund Flow) | Backend / BA | **P0** | ✅ **Hoàn thành** | BA-01 |
| **BE-02**  | Đảm bảo Tính Nhất Quán Nguyên Tử Giữa Order & Payment| Backend | **P0** | ✅ **Hoàn thành** | LOCAL-02 |
| **BE-03**  | Xác thực & Chống Lặp Webhook/Callback Thanh toán | Backend / Sec | **P0** | ✅ **Hoàn thành** | BE-02 |
| **BE-04**  | Quản lý Timeout khi Gọi Bên Thứ Ba (AbortController) | Backend | **P1** | ✅ **Hoàn thành** | *None* |
| **FE-01**  | Khôi phục Phiên Đăng nhập Đáng tin cậy (Auth Hydration) | Frontend | **P1** | ✅ **Hoàn thành** | SEC-01 |
| **FE-02**  | Hàng Đợi Refresh Token Một Lần Duy Nhất (Axios Queue) | Frontend | **P1** | ✅ **Hoàn thành** | FE-01 |
| **FE-03**  | Trải Nghiệm Xử Lý & Hiển Thị Lỗi Toàn Cục (Error UX) | Frontend | **P1** | ✅ **Hoàn thành** | SEC-07 |
| **FE-04**  | Trạng thái Loading, Skeleton & Màn hình Trống | Frontend | **P2** | ✅ **Hoàn thành** | FE-03 |
| **FE-05**  | Vô hiệu hóa Nút Bấm Chống Trùng Lặp (Double Submit) | Frontend | **P1** | ✅ **Hoàn thành** | FE-02 |
| **FE-06**  | Minh Bạch Chi Phí & Trạng Thái Thanh Toán (Checkout UX)| Frontend / BA | **P1** | ✅ **Hoàn thành** | BE-02 |
| **BE-05**  | Tách Nhỏ Lớp Nghiệp Vụ Đơn Hàng `OrdersService` | Backend | **P2** | ✅ **Hoàn thành** | BE-01, BE-02 |
| **BE-06**  | Tối Ưu Truy Vấn & Đánh Index Tự Động Hủy Đơn Hàng | Backend | **P2** | ✅ **Hoàn thành** | BE-02 |
| **BE-07**  | Triệt Tiêu Cảnh Báo Linting Mã Nguồn Backend | Backend | **P2** | ✅ **Hoàn thành** | *None* |
| **FE-07**  | Cấu Hình & Chuẩn Hóa Linting Frontend Vue/TypeScript | Frontend | **P2** | ✅ **Hoàn thành** | *None* |
| **QA-01**  | Bộ Kiểm Thử Tự Động Bảo Mật Xác Thực & Phân Quyền | QA / Backend | **P0** | ✅ **Hoàn thành** | SEC-01, SEC-02 |
| **QA-02**  | Bộ Kiểm Thử Kịch Bản Thanh Toán & Callback Idempotent | QA / Backend | **P0** | ✅ **Hoàn thành** | BE-02, BE-03 |
| **QA-03**  | Kiểm Thử Đua Tranh Tồn Kho (Race Condition Checkout) | QA / Backend | **P1** | ✅ **Hoàn thành** | BE-02 |
| **QA-04**  | Kiểm Thử Toàn Trình Hồi Quy Trải Nghiệm Người Dùng | QA / Frontend | **P1** | ✅ **Hoàn thành** | FE-01..FE-06 |

---

## 3. 🔒 Track 1: Bảo Mật Hệ Thống & Quản Lý Danh Tính (Security Tasks)

### [TASK SEC-01] Audit Authentication Cookie / Token & Session Lifecycle
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `M` | **Module:** [`backend/src/modules/auth/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/auth), [`backend/src/common/guards/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/common/guards)
* **Mục tiêu:** Loại bỏ hoàn toàn khả năng chiếm đoạt phiên đăng nhập, lộ token hoặc tái sử dụng token đã thu hồi.
* **Chi tiết công việc:**
  - [x] **Access Token:** Giới hạn thời gian sống ngắn (`15m`), mã hóa bằng thuật toán an toàn.
  - [x] **Refresh Token Rotation (RTR):** Mỗi lần refresh cấp mới 1 cặp Access/Refresh token; hủy ngay token cũ.
  - [x] **Reuse Detection:** Nếu phát hiện Refresh token cũ đã từng được sử dụng lại $\rightarrow$ kích hoạt báo động, thu hồi toàn bộ phiên làm việc của user đó.
  - [x] **Bảo mật Cookie:**
    - Cờ `HttpOnly`: Tuyệt đối không cho phép JavaScript phía client truy cập refresh token.
    - Cờ `Secure`: Tự động bật khi chạy HTTPS (`process.env.NODE_ENV === 'production'`), cấu hình linh hoạt cho môi trường local HTTP.
    - Cờ `SameSite`: Đặt là `Lax` hoặc `Strict` để ngăn ngừa tấn công CSRF.
  - [x] **Lưu trữ Token an toàn:** Không lưu refresh token dạng plain text trong DB (bắt buộc băm bằng bcrypt hoặc HMAC SHA-256).
  - [x] **JWT Strategy Verification:** Bắt buộc truy vấn lại trạng thái user trong database (kiểm tra `isActive`, `isBanned`, `passwordChangedAt`) thay vì chỉ decode payload JWT.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Token hết hạn trả về chính xác HTTP `401 Unauthorized`.
  - Refresh token cũ không thể dùng lại sau khi đã xoay vòng.
  - Đăng xuất (`logout`) hoặc đổi mật khẩu thành công sẽ vô hiệu hóa ngay lập tức mọi token đang lưu hành.
  - Tài khoản bị khóa (`banned`) không thể tiếp tục gọi API dù access token còn hạn.

---

### [TASK SEC-02] Audit Authorization / RBAC & Chống Lỗ Hổng IDOR
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `M` | **Module:** [`backend/src/common/guards/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/common/guards), Toàn bộ Controllers
* **Mục tiêu:** Không để người dùng thường hoặc staff truy cập trái phép tài nguyên quản trị hoặc tài nguyên của khách hàng khác.
* **Chi tiết công việc:**
  - [x] Quét toàn bộ controller trong `backend/src/modules/` đảm bảo không có endpoint nào bị hở decorator bảo vệ (`@UseGuards(JwtAuthGuard, RolesGuard)`).
  - [x] Đảm bảo việc phân quyền thực thi trên Backend, không dựa dẫm vào việc ẩn/hiện menu trên Frontend.
  - [x] **Chống IDOR (Insecure Direct Object References):**
    - `Profile/User`: Người dùng chỉ có quyền xem/sửa hồ sơ của chính mình (`req.user.id === targetId`).
    - `Orders`: Khách hàng A không được phép đọc, sửa, hủy đơn hàng của Khách hàng B qua tham số `/:id`.
    - `Addresses`: Không cho phép CRUD địa chỉ của tài khoản khác.
    - `Reviews`: Chỉ tác giả bài đánh giá mới có quyền chỉnh sửa/xóa bài đánh giá của mình.
  - [x] **Ma trận phân quyền nhân viên:** Nhân viên (Staff) bị giới hạn quyền theo Role/Permission, không tự động kế thừa toàn quyền Super Admin.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - User thường gọi bất kỳ API Admin nào đều nhận HTTP `403 Forbidden`.
  - User A cố tình gửi ID của User B trong tham số URL sẽ nhận HTTP `403` hoặc `404 Not Found`.

---

### [TASK SEC-03] Input Validation, DTO Hardening & Chống Mass Assignment
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `M` | **Module:** [`backend/src/main.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/main.ts), Toàn bộ thư mục `dto/`
* **Mục tiêu:** Ngăn chặn tuyệt đối việc client gửi trường dữ liệu lạ để can thiệp trái phép vào thuộc tính hệ thống.
* **Chi tiết công việc:**
  - [x] Bật cấu hình nghiêm ngặt tại `ValidationPipe` toàn cục:
    ```typescript
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,               // Tự động loại bỏ các field thừa không khai báo trong DTO
      forbidNonWhitelisted: true,    // Bắn lỗi 400 ngay lập tức nếu client gửi kèm field không hợp lệ
      transform: true,               // Tự động convert kiểu dữ liệu theo DTO
    }));
    ```
  - [x] Validate chặt chẽ các trường nhạy cảm: `email`, `phone` (chuẩn E.164 hoặc số VN), `ObjectId` (sử dụng custom Pipe hoặc validator kiểm tra tính hợp lệ của Mongo HexString).
  - [x] Validate logic số học: `quantity >= 1`, `price >= 0`, `discount >= 0`.
  - [x] **Chống Mass Assignment:**
    - Cấm tuyệt đối client truyền các trường: `role`, `roles`, `permissions`, `isEmailVerified`, `paymentStatus`, `orderStatus`, `sold`, `rating`.
    - Không bao giờ nhận giá tiền (`price`, `totalPrice`) do Frontend gửi lên; giá thanh toán luôn được tính toán lại độc lập tại Backend từ Database.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Request chứa bất kỳ field thừa nào ngoài DTO bị chặn với HTTP `400 Bad Request`.
  - Không thể tự nâng quyền tài khoản hoặc can thiệp trạng thái đơn hàng thông qua body payload.

---

### [TASK SEC-04] API Payload Hardening (Giới Hạn Kích Thước Request)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `S` | **Module:** [`backend/src/main.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/main.ts)
* **Mục tiêu:** Ngăn chặn nguy cơ tấn công từ chối dịch vụ (DoS) bằng cách gửi các gói tin JSON quá lớn làm cạn kiệt bộ nhớ máy chủ.
* **Chi tiết công việc:**
  - [x] Giảm giới hạn JSON body parser mặc định xuống `512KB - 1MB` thay vì cấu hình mặc định quá thoáng:
    ```typescript
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));
    ```
  - [x] Đối với các endpoint upload file ảnh/tài liệu: sử dụng Multer với hạn mức riêng (ví dụ: `5MB` cho hình ảnh, `10MB` cho Excel), kiểm tra MIME type.
  - [x] Cấm nhận dữ liệu ảnh dạng raw base64 kích thước lớn trong các body JSON thông thường.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Request có body vượt quá ngưỡng quy định lập tức bị từ chối với HTTP `413 Payload Too Large`.
  - Luồng upload file ảnh bìa/sách hợp lệ vẫn hoạt động bình thường.

---

### [TASK SEC-05] Rate Limit Critical Endpoints (Chống Brute-Force & Spam)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `S` | **Module:** [`backend/src/app.module.ts`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/app.module.ts), Throttler Guard
* **Mục tiêu:** Bảo vệ tài nguyên tính toán và hạn chế các cuộc tấn công quét mật khẩu, spam mã khuyến mãi.
* **Chi tiết công việc:**
  - [x] Cấu hình `@nestjs/throttler` kết hợp Redis Store để quản trị giới hạn phân tán:
    - `POST /auth/login`: Tối đa 5 lần thử trong 1 phút trên mỗi IP/Tài khoản.
    - `POST /auth/register`: Tối đa 3 lần tạo tài khoản trong 10 phút.
    - `POST /auth/forgot-password` & `POST /auth/verify-otp`: Tối đa 3-5 lần yêu cầu trong 5 phút.
    - `POST /auth/refresh`: Tối đa 10 lần trong 1 phút.
    - `POST /cart/voucher` & `POST /promotions/apply`: Chống brute-force quét mã voucher.
  - [x] **Lưu ý nghiệp vụ:** Tuyệt đối không áp rate limit lên webhook/callback thanh toán của VNPay/MoMo để tránh làm mất trạng thái giao dịch thật của khách hàng.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Vượt quá ngưỡng quy định trả về HTTP `429 Too Many Requests` kèm header `Retry-After`.

---

### [TASK SEC-06] Rà Soát Secret & Làm Sạch Biến Môi Trường
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `S` | **Module:** Toàn bộ Repository, Git History, `.env`
* **Mục tiêu:** Triệt để loại bỏ mọi credentials, secrets thật khỏi repo Git trước khi bắt đầu bất kỳ việc gì.
* **Chi tiết công việc:**
  - [ ] Đảm bảo `.gitignore` chặn toàn bộ file `.env`, `.env.local`, `.env.*.local`, `*.pem`, `*.key`.
  - [ ] Kiểm tra lịch sử Git (Git History) xem đã từng vô tình commit secret thật của: MongoDB, Redis, JWT Secret, Cloudinary, VNPay, MoMo, Mailer, Firebase hay chưa. Nếu có, thực hiện xoay khóa (rotate credentials) ngay lập tức.
  - [ ] Xây dựng file `.env.example` chuẩn hóa, chỉ chứa các giá trị mẫu (dummy/placeholder).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Dự án mới clone về hoàn toàn không chứa secret thật.
  - Chạy quét gitleaks (`gitleaks detect`) không phát hiện vi phạm.

---

### [TASK SEC-07] Error Response Hardening & Sanitize Exception
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `S` | **Module:** [`backend/src/common/filters/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/common/filters)
* **Mục tiêu:** Không để lộ stack trace, thông tin cấu trúc database hoặc thông báo nhạy cảm từ bên thứ ba ra ngoài client.
* **Chi tiết công việc:**
  - [x] Triển khai `GlobalExceptionFilter` bắt mọi lỗi chưa được xử lý (`UnhandledException`).
  - [x] Bắt lỗi trùng khóa của MongoDB (`MongoServerError: E11000 duplicate key error`) và chuyển thể thành thông báo người dùng thân thiện (ví dụ: *"Email hoặc mã này đã tồn tại"* thay vì văng câu lệnh SQL/Mongo).
  - [x] Sanitize lỗi JWT: Không để lộ chi tiết nội bộ token sang client.
  - [x] Sanitize lỗi cổng thanh toán: Ghi log chi tiết tại server phục vụ debug, nhưng chỉ trả về mã lỗi tổng quát cho client.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Cấu trúc phản hồi lỗi luôn đồng nhất:
    ```json
    {
      "statusCode": 400,
      "message": "Mô tả lỗi an toàn và dễ hiểu cho người dùng",
      "error": "Bad Request",
      "timestamp": "2026-09-07T18:50:00.000Z"
    }
    ```
  - Không xuất hiện chuỗi stack trace hay chuỗi kết nối database trong response trả về.

---

## 4. 💳 Track 2: An Toàn Đơn Hàng, Thanh Toán & Hoàn Tiền (Payment & Order Safety)

### [TASK BA-01] Chốt Chính Sách Hủy, Trả Hàng & Hoàn Tiền (Policy Specification)
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `S` | **Vai trò:** BA / PM / Lead
* **Mục tiêu:** Định nghĩa quy tắc nghiệp vụ bất di bất dịch cho toàn bộ các trạng thái đơn hàng và luồng tiền.
* **Nội dung quy định:**
  1. **Quyền Hủy Đơn (Cancel Policy):**
     * `PENDING`: Được hủy tự do (User/Admin).
     * `CONFIRMED`: Được hủy (nếu chưa đóng gói; hoàn tiền nếu đã thanh toán trước).
     * `PROCESSING`: Khách hàng không thể tự hủy qua app; cần liên hệ CSKH hoặc do Admin hủy với lý do cụ thể.
     * `SHIPPING` / `DELIVERED`: Tuyệt đối không thể hủy, chỉ có thể chuyển sang quy trình Trả Hàng (Return).
  2. **Quy Định Trả Hàng (Return Policy):**
     * Chỉ áp dụng cho đơn đã `DELIVERED` trong vòng **7 ngày**.
     * Cần lý do hợp lệ (Sách lỗi, rách, in sai, giao nhầm mã). Admin/Staff là người duyệt yêu cầu.
  3. **Quy Định Hoàn Tiền (Refund Policy):**
     * Đơn Online (VNPay/MoMo) đã thanh toán (`PaymentStatus = PAID`): Hủy/Trả hàng thành công bắt buộc kích hoạt `RefundStatus`.
     * Đơn COD: Chưa thu tiền thì hủy đơn không phát sinh hoàn tiền trực tuyến; nếu đã giao và trả hàng thì hoàn tiền qua tài khoản đối soát hoặc điểm tích lũy.
     * Hoàn lại Voucher & Điểm thưởng: Tự động phục hồi mã giảm giá và hoàn trả loyalty points đã cấn trừ trong đơn.

```mermaid
stateDiagram-v2
    [*] --> PENDING: Khởi tạo đơn hàng
    PENDING --> CONFIRMED: Đã xác nhận / Thanh toán thành công
    PENDING --> CANCELLED: Khách hủy / Quá hạn thanh toán (Auto-cancel)
    
    CONFIRMED --> PROCESSING: Chuyển đóng gói kho
    CONFIRMED --> CANCELLED: Hủy trước đóng gói (Kích hoạt Refund nếu đã Paid)
    
    PROCESSING --> SHIPPING: Bàn giao vận chuyển
    PROCESSING --> CANCELLED: Kho hết hàng / Sự cố kho (Admin duyệt)
    
    SHIPPING --> DELIVERED: Giao hàng thành công
    SHIPPING --> CANCELLED: Giao thất bại / Bom hàng
    
    DELIVERED --> COMPLETED: Quá 7 ngày / Khách ấn nhận hàng
    DELIVERED --> RETURN_REQUESTED: Khách yêu cầu trả hàng (<= 7 ngày)
    
    RETURN_REQUESTED --> RETURNED: Admin duyệt & Nhận lại sách
    RETURN_REQUESTED --> DELIVERED: Admin từ chối trả hàng
    
    RETURNED --> REFUND_PROCESSING: Kích hoạt hoàn tiền
    REFUND_PROCESSING --> REFUNDED: Hoàn tất hoàn tiền
    REFUND_PROCESSING --> MANUAL_REQUIRED: Lỗi cổng / Cần can thiệp thủ công
```

---

### [TASK BE-01] Xây Dựng Vòng Đời Hoàn Tiền (Refund Lifecycle)
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `L` | **Module:** [`backend/src/modules/orders/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders), [`backend/src/modules/payments/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/payments)
* **Mục tiêu:** Đảm bảo toàn bộ dòng tiền hoàn trả được theo dõi chính xác, có audit trail và không bao giờ bị thất thoát hoặc hoàn trùng.
* **Chi tiết công việc:**
  - [x] Bổ sung trường dữ liệu vào Schema:
    * `refundStatus`: `['NONE', 'REQUESTED', 'PROCESSING', 'REFUNDED', 'FAILED', 'MANUAL_REQUIRED']`
    * `refundAmount`, `refundReason`, `refundedAt`, `refundTransactionRef`, `refundActor` (User/Admin ID).
  - [x] **Cấm bất biến (Invariance Rules):**
    - Không bao giờ tồn tại trạng thái: `Order = CANCELLED` VÀ `Payment = PAID` nhưng `RefundStatus = NONE`.
  - [x] Khóa chống hoàn tiền 2 lần (Anti Double-Refund Lock): Sử dụng Redis Mutex hoặc Atomic conditional update (`findOneAndUpdate({ _id, refundStatus: { $ne: 'REFUNDED' } })`).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Thao tác thử gọi refund 2 lần đồng thời trên cùng một đơn hàng chỉ có duy nhất 1 giao dịch được thực hiện.
  - Mọi thay đổi trạng thái hoàn tiền đều được ghi nhận vào Order Timeline (Audit Trail).

---

### [TASK BE-02] Đảm Bảo Tính Nhất Quán Nguyên Tử Giữa Payment ↔ Order
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `M` | **Module:** [`backend/src/modules/payments/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/payments), [`backend/src/modules/orders/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders)
* **Mục tiêu:** Loại bỏ hoàn toàn tình trạng "Tiền đã trừ nhưng đơn hàng vẫn ở trạng thái PENDING".
* **Chi tiết công việc:**
  - [x] Áp dụng **MongoDB Multi-document Transaction** (ClientSession) khi cập nhật đồng thời trạng thái Payment và Order (với fallback tuần tự an toàn khi Mongo standalone).
  - [x] Đảm bảo cơ chế cập nhật có tính lũy đẳng (Idempotent): Nếu callback của một đơn hàng được gửi đến nhiều lần, hệ thống nhận diện giao dịch đã xử lý và trả về thành công ngay mà không thực hiện lại các tác vụ phụ (không cộng điểm loyalty 2 lần, không gửi 2 email xác nhận).
  - [x] Viết worker/cronjob đối soát (Reconciliation helper) quét các đơn hàng có thanh toán online đang treo quá 15 phút để tự động query trạng thái từ cổng thanh toán.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Quá trình xử lý thanh toán bị ngắt đột ngột (giả lập crash process) không để lại dữ liệu rác hay trạng thái mâu thuẫn trong DB.

---

### [TASK BE-03] Xác Thực Tính Hợp Lệ Của Payment Callback / Webhook
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `M` | **Module:** [`backend/src/modules/payments/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/payments)
* **Mục tiêu:** Chống giả mạo gói tin thanh toán từ tin tặc.
* **Chi tiết công việc:**
  - [x] Kiểm tra chữ ký số (Verify Secure Hash / HMAC Signature) bằng checksum key bí mật trước khi đọc nội dung gói tin.
  - [x] Xác thực số tiền thanh toán (`vnp_Amount` / `amount`): Bắt buộc so khớp chính xác với số tiền lưu trong Order DB (tránh lỗ hổng sửa giá tiền gói tin callback).
  - [x] Xác thực mã giao dịch đối tác (`vnp_TransactionNo`, `momoTransId`) và mã tham chiếu đơn hàng.
  - [x] Ghi log toàn bộ payload callback kèm mã Correlation ID để phục vụ đối soát khi có khiếu nại.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Sai chữ ký $\rightarrow$ Từ chối xử lý, ghi cảnh báo bảo mật.
  - Sai số tiền $\rightarrow$ Đóng băng trạng thái, đánh dấu `MANUAL_REQUIRED`.

---

### [TASK BE-04] Quản Lý Timeout Gọi Dịch Vụ Bên Thứ Ba (Third-party Timeout)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `S` | **Module:** [`backend/src/modules/payments/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/payments), HTTP Client Helper
* **Mục tiêu:** Tránh trường hợp cổng thanh toán hoặc dịch vụ email bị treo làm cạn kiệt tài nguyên kết nối của Backend.
* **Chi tiết công việc:**
  - [x] Viết HTTP wrapper sử dụng `AbortController` với cấu hình timeout rõ ràng:
    - Tạo URL thanh toán VNPay / MoMo: Timeout `5 giây`.
    - Gửi email thông báo / OTP: Timeout `8 giây`.
  - [x] Khi timeout xảy ra, trả về lỗi có cấu trúc để UI hiển thị nút *"Thử lại"* cho khách hàng thay vì để màn hình quay vô tận.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Mock cổng thanh toán phản hồi chậm 30s $\rightarrow$ Backend tự động hủy request sau đúng 5s và trả lỗi an toàn.

---

## 5. 🐳 Track 3: Chuẩn Hóa Môi Trường Phát Triển Cục Bộ (Local Development)

### [TASK LOCAL-01] Chuẩn Hóa Phiên Bản Node.js 22 LTS
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `S` | **Phân hệ:** Full-stack
* **Chi tiết công việc:**
  - [ ] Thống nhất toàn bộ dự án sử dụng Node.js `22.12.0+` (LTS).
  - [ ] Tạo file `.nvmrc` tại root:
    ```text
    22.12.0
    ```
  - [ ] Cấu hình trường `engines` trong `backend/package.json` và `frontend/package.json`:
    ```json
    "engines": {
      "node": ">=22.12.0",
      "npm": ">=10.0.0"
    }
    ```
  - [ ] Cập nhật tài liệu `README.md` yêu cầu developer chạy `nvm use` trước khi bắt đầu.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Chạy `nvm use && npm install && npm run dev` không phát sinh cảnh báo xung đột engine.

---

### [TASK LOCAL-02] Hạ Tầng 1 Lệnh Docker (One-Command Local Infrastructure)
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `M` | **Module:** [`docker-compose.yml`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/docker-compose.yml)
* **Mục tiêu:** Mọi lập trình viên chỉ cần chạy 1 lệnh duy nhất là có đầy đủ MongoDB Replica Set (chạy transaction) và Redis.
* **Chi tiết công việc:**
  - [ ] Tinh chỉnh file `docker-compose.yml`:
    - Service `mongodb`: Cấu hình tự động khởi tạo Replica Set `rs0` để hỗ trợ Mongo Transactions trong NestJS.
    - Service `redis`: Bật tính năng AOF (`appendonly yes`), có healthcheck ping định kỳ.
  - [ ] Định nghĩa Volume có tính bền bỉ: `mongodb_data`, `redis_data` để khởi động lại không bị mất dữ liệu.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Chạy `docker compose up -d` $\rightarrow$ Cả MongoDB và Redis đều hiển thị trạng thái `healthy`.
  - Backend thực thi lệnh transaction của Mongoose thành công 100% không gặp lỗi *"Transaction numbers are only allowed on a replica set member"*.

---

### [TASK LOCAL-03] Hoàn Thiện File Cấu Hình `.env.example` Đầy Đủ
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `S` | **Module:** `backend/.env.example`, `frontend/.env.example`
* **Mục tiêu:** Cung cấp mẫu cấu hình chuẩn, có chú thích rõ ràng, chạy được ngay ở môi trường local mà không cần secret production.
* **Nhóm biến cấu hình bắt buộc:**
  ```env
  # -------------------- APP & CORE --------------------
  NODE_ENV=development
  PORT=3000
  FRONTEND_URL=http://localhost:5173

  # -------------------- DATABASE & CACHE --------------
  MONGODB_URI=mongodb://root:localpassword@localhost:27017/truong_thanh_bookstore?replicaSet=rs0&authSource=admin
  REDIS_URL=redis://localhost:6379

  # -------------------- SECURITY & JWT ----------------
  JWT_SECRET=local-development-access-secret-32-chars-minimum
  JWT_REFRESH_SECRET=local-development-refresh-secret-32-chars-minimum
  JWT_RESET_SECRET=local-development-reset-secret-32-chars-minimum
  JWT_EXPIRES_IN=15m
  JWT_REFRESH_EXPIRES_IN=30d
  COOKIE_SECURE=false
  COOKIE_SAME_SITE=lax

  # -------------------- PAYMENT SANDBOX ---------------
  VNPAY_TMN_CODE=SANDBOX_TMN
  VNPAY_HASH_SECRET=SANDBOX_SECRET
  VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
  MOMO_PARTNER_CODE=MOMO_SANDBOX
  MOMO_ACCESS_KEY=MOMO_ACCESS
  MOMO_SECRET_KEY=MOMO_SECRET
  ```
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Lập trình viên mới chỉ cần copy `.env.example` thành `.env` là backend khởi động thành công ngay lập tức.

---

### [TASK LOCAL-04] Xây Dựng Bộ Dữ Liệu Mẫu Cục Bộ (Seed Data)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `M` | **Module:** [`backend/src/seeds/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/seeds)
* **Chi tiết công việc:**
  - [ ] Hoàn thiện script `npm run seed`:
    - 1 Tài khoản Quản trị: `admin@truongthanh.vn` / `Admin@123456`
    - 1 Tài khoản Khách hàng: `customer@truongthanh.vn` / `Customer@123456`
    - 5 Danh mục sách mẫu (Văn học, Kinh tế, Khoa học, Thiếu nhi, Kỹ năng).
    - 15-20 Sản phẩm sách có hình ảnh mẫu, mô tả chi tiết, giá tiền hợp lệ.
    - 1 Sản phẩm sách có số lượng tồn kho bằng 0 (`out-of-stock`) để kiểm thử logic chặn mua.
    - 2 Voucher khuyến mãi: 1 mã còn hạn (`GIAMGIA10`), 1 mã đã hết hạn.
    - Đơn hàng mẫu ở các trạng thái: `PENDING`, `PAID`, `SHIPPING`, `COMPLETED`.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Chạy lệnh `npm run seed` nạp đầy đủ dữ liệu ổn định và có thể chạy lại nhiều lần (idempotent seed) mà không bị duplicate key.

---

### [TASK LOCAL-05] Tài Liệu Hướng Dẫn Khởi Động Local Chuẩn Hóa
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `S` | **File:** `docs/LOCAL_SETUP_GUIDE.md` hoặc cập nhật vào `README.md`
* **Nội dung hướng dẫn từng bước:**
  1. Kiểm tra Node version (`node -v` $\rightarrow$ `v22.x`).
  2. Bật hạ tầng Docker: `docker compose up -d`.
  3. Khởi tạo cấu hình: copy file `.env`.
  4. Cài đặt dependency: `npm install`.
  5. Chạy seed dữ liệu mẫu: `npm run seed`.
  6. Khởi động Backend: `npm run start:dev`.
  7. Khởi động Frontend: `cd ../frontend && npm run dev`.
  8. Danh sách tài khoản thử nghiệm có sẵn.

---

## 6. 💻 Track 4: Tối Ưu Trải Nghiệm Người Dùng (Frontend & UX Tasks)

### [TASK FE-01] Khôi Phục Phiên Đăng Nhập Đáng Tin Cậy (Auth Hydration)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `S` | **Module:** [`frontend/src/stores/auth.ts`](file:///Users/macos/SU26/truong_thanh_store/frontend/src/stores/auth.ts), `App.vue`, `router/index.ts`
* **Trạng thái:** ✅ **Hoàn thành** (Đã kiểm thử unit test & typecheck)
* **Vấn đề cần giải quyết:** Frontend lưu trạng thái đăng nhập cũ trong `localStorage`, khi mở lại web tưởng là còn đăng nhập nhưng thực chất session phía Backend đã hết hạn, dẫn đến tình trạng chớp nháy giao diện Admin hoặc lỗi 401 liên tục.
* **Chi tiết công việc:**
  - [x] Thiết lập quy trình khởi tạo phiên có kiểm soát:
    ```
    Mở Web / F5 Trang
           │
           ▼
    Hiển thị App Splash / Auth Loading Skeleton
           │
           ▼
    Gọi API: GET /api/v1/auth/me (hydrateAuth)
           │
       ┌───┴────────────────────────┐
       ▼                            ▼
    HTTP 200                     HTTP 401
    Restore thông tin User       Xóa sạch Local State / Token
    Đánh dấu isAuthenticated=true Đánh dấu isAuthenticated=false
       │                            │
       └───────────┬────────────────┘
                   ▼
    Hoàn tất Hydration -> Render Giao diện & Điều hướng Router
    ```
  - [x] Triển khai `isHydrated`, `isHydrating`, `hydrateAuth()` (singleton in-flight promise) trong `useAuthStore`.
  - [x] Router Guard (`router.beforeEach`) bất đồng bộ `await authStore.hydrateAuth()` trước khi đánh giá route `requiresAuth` hoặc `requiresAdmin`.
  - [x] Hiển thị màn hình Splash Screen thanh lịch trong `App.vue` trong lúc chờ hydration hoàn tất, triệt tiêu hoàn toàn FOUC.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [x] F5 tải lại trang không bao giờ bị flash giao diện trái phép.
  - [x] Khi token hết hạn, ứng dụng êm đẹp chuyển hướng về trang Login (đối với protected routes) và xóa sạch state cũ.

---

### [TASK FE-02] Hàng Đợi Refresh Token Một Lần Duy Nhất (Axios Refresh Queue)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `M` | **Module:** [`frontend/src/utils/api.ts`](file:///Users/macos/SU26/truong_thanh_store/frontend/src/utils/api.ts)
* **Trạng thái:** ✅ **Hoàn thành** (Đã kiểm thử unit test concurrency)
* **Vấn đề:** Khi vào một trang gọi đồng thời 5 API (thông tin user, giỏ hàng, thông báo, v.v.), nếu token hết hạn thì cả 5 API đều bị 401 $\rightarrow$ Client bắn 5 request `/refresh` cùng lúc $\rightarrow$ Kích hoạt cơ chế Token Reuse Detection của Backend và khóa luôn tài khoản người dùng!
* **Giải pháp kiến trúc:**
  - [x] Áp dụng mẫu thiết kế **Singleton Refresh Promise Pattern** (`refreshPromise`).
  - [x] Khi nhiều request đồng thời gặp 401: chỉ 1 request `POST /auth/refresh` duy nhất được gửi lên server.
  - [x] Toàn bộ request đồng thời cùng `await refreshPromise` và tự động re-execute với access token/session cookie mới.
  - [x] Nếu refresh thất bại: toàn bộ request bị reject, kích hoạt `auth-session-expired`, chỉ chuyển hướng về Login nếu đang ở private route (tránh redirect oan khách vãng lai).
  - [x] Bổ sung biến debounce `hasNotifiedExpired` để tránh spam 5 popup toast thông báo cùng một tích tắc.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [x] Mở trang có nhiều API song song khi token hết hạn: Chỉ có đúng 1 request `/refresh` xuất hiện trong tab Network.
  - [x] Nếu refresh token thất bại: Toàn bộ hàng đợi bị hủy và điều hướng người dùng về trang đăng nhập một lần duy nhất.

---

### [TASK FE-03] Trải Nghiệm Xử Lý & Hiển Thị Lỗi Toàn Cục (Global Error UX)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `M` | **Module:** `frontend/src/utils/api.ts`, `frontend/src/App.vue`, `vue-toastification`
* **Trạng thái:** ✅ **Hoàn thành** (100% không còn alert)
* **Chi tiết công việc:**
  - [x] Thay thế triệt để 100% các lệnh `alert(...)` cũ (như trong `OrderDetail.vue`) bằng thông báo Toast cao cấp.
  - [x] Bắt lỗi HTTP tập trung tại Axios Response Interceptor:
    - `400`: Hiển thị thông báo lỗi nghiệp vụ cụ thể từ Backend (`extractErrorMessage`).
    - `401`: Chuyển hướng đăng nhập êm dịu kèm toast *"Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại."*
    - `403`: Toast cảnh báo *"Bạn không có quyền thực hiện thao tác này."*
    - `429`: Toast thông báo *"Bạn đang thao tác quá nhanh. Vui lòng thử lại sau ít phút!"*
    - `500`: Toast thân thiện *"Đã có lỗi xảy ra từ hệ thống. Đội ngũ kỹ thuật đang xử lý."*
    - Mất kết nối mạng (`ERR_NETWORK` / timeout): Toast báo lỗi mạng và hiển thị banner trạng thái ngoại tuyến toàn cục (`useOnline`).
  - [x] Khi có lại mạng: Tự động tắt banner ngoại tuyến và toast *"Đã khôi phục kết nối mạng!"*.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [x] Toàn bộ các thao tác lỗi đều có phản hồi trực quan trên màn hình cho người dùng.

---

### [TASK FE-04] Trạng Thái Chờ, Khung Xương & Màn Hình Trống (Loading/Skeleton/Empty)
* **Độ ưu tiên:** `P2` | **Độ phức tạp:** `M` | **Phân hệ:** Frontend Web
* **Trạng thái:** ✅ **Hoàn thành**
* **Chi tiết công việc:**
  - [x] Nâng cấp `SkeletonLoader.vue` hỗ trợ đa dạng layout: `card`, `table`, `kpi`, `product-detail`, `cart`, `order-list`, `lines` kết hợp hiệu ứng shimmer sang trọng.
  - [x] Triển khai hiệu ứng Skeleton Loading tại các trang trọng điểm:
    - Danh mục sách (`ProductList.vue` - `type="card"`)
    - Chi tiết sách (`ProductDetail.vue` - `type="product-detail"`)
    - Giỏ hàng (`Cart.vue` - `type="cart"`)
    - Đơn hàng của tôi (`MyOrders.vue` & `OrderDetail.vue` - `type="order-list"`)
    - Quản trị sản phẩm (`pages/admin/Products.vue` - `type="table"`)
  - [x] Chuẩn hóa `EmptyState.vue` với icon, mô tả và nút hành động CTA (`actionTo` router-link):
    - Giỏ hàng rỗng $\rightarrow$ Nút *"Khám phá sách ngay"*.
    - Lịch sử đơn hàng trống $\rightarrow$ Nút *"Mua sắm ngay"*.
    - Kết quả tìm kiếm không thấy $\rightarrow$ Gợi ý các từ khóa liên quan ("Bút bi", "SGK", "Deli",...).
    - Sản phẩm không tồn tại $\rightarrow$ Nút *"Trở về danh sách sản phẩm"*.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [x] Không có tình trạng giật lag hoặc xuất hiện màn hình trắng tinh khi đang tải dữ liệu.

---

### [TASK FE-05] Vô Hiệu Hóa Nút Bấm Chống Gửi Trùng Lặp (Disable Duplicate Submit)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `S` | **Phân hệ:** Frontend Web
* **Trạng thái:** ✅ **Hoàn thành** (Đã kiểm thử unit test submit-lock)
* **Mục tiêu:** Chống việc người dùng click chuột liên tiếp tạo nhiều đơn hàng hoặc gọi thanh toán nhiều lần.
* **Các nút đã áp dụng đầy đủ:**
  - [x] Nút Đăng nhập / Đăng ký (`Login.vue`, `Register.vue`): Khóa click `if (authStore.loading) return;` + spinner SVG động.
  - [x] Nút Thêm vào giỏ hàng (`ProductCard.vue`, `ProductDetail.vue`): Debounce + `isAdding` lock + spinner.
  - [x] Nút Áp dụng Voucher (`Cart.vue`, `Checkout.vue`): `isApplyingCoupon` lock + spinner "Đang áp dụng...".
  - [x] Nút **Đặt Hàng (Place Order)** (`Checkout.vue`): Synchronous lock guard tại dòng 1 `if (submitting.value) return;` + disabled + spinner "Đang xử lý đặt hàng...".
  - [x] Nút Hủy Đơn Hàng (`MyOrders.vue`, `OrderDetail.vue`, `admin/Orders.vue`): `cancellingOrderId` lock + spinner "Đang hủy...".
* **Kỹ thuật:** Xây dựng composable `useSubmitLock` và tích hợp synchronous lock + SVG loading spinner trên tất cả form/action buttons.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [x] Thử nhấp chuột nhanh liên tục 5 lần vào nút "Đặt hàng" chỉ gửi đi đúng 1 request lên server.

---

### [TASK FE-06] Minh Bạch Hóa Trải Nghiệm Đặt Hàng & Thanh Toán (Checkout UX)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `M` | **Module:** `frontend/src/pages/customer/Checkout.vue`, `OrderDetail.vue`
* **Trạng thái:** ✅ **Đã hoàn thành**
* **Nội dung đã triển khai minh bạch:**
  - [x] Bảng tổng kết chi phí chi tiết:
    * Tiền hàng tạm tính (Subtotal).
    * Giảm giá voucher (Discount) & Điểm tích lũy (Loyalty points).
    * Phí vận chuyển (Shipping fee) kèm thanh tiến trình Miễn phí vận chuyển (Free shipping progress bar mốc 299.000đ).
    * **Tổng thanh toán cuối cùng (Grand Total)**.
  - [x] Thông báo lỗi tồn kho trực quan tại từng dòng sản phẩm thời gian thực qua `checkoutPreview` (Badges: *Còn hàng*, *Kho chỉ còn X*, *Hết hàng*; Cảnh báo & nút điều chỉnh nhanh).
  - [x] Trạng thái đơn hàng sau thanh toán rõ ràng:
    * Màn hình Thanh toán thành công tích hợp VietQR động cho đơn chuyển khoản (MB Bank kèm số tiền & mã đơn chuẩn hóa cú pháp chuyển khoản 1-click copy).
    * Màn hình Thất bại kèm lý do cụ thể và nút thử lại không mất giỏ hàng.
    * Trang chi tiết đơn hàng (`OrderDetail.vue`) hiển thị rõ trạng thái thanh toán (PAID, UNPAID, FAILED, REFUNDED) và nút thử lại thanh toán trực tuyến.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Khách hàng luôn nắm bắt rõ số tiền phải trả, chi tiết khấu trừ và trạng thái đơn hàng của mình.

---

## 7. 🛠️ Track 5: Duy Trì Mã Nguồn & Giảm Thiểu Nợ Kỹ Thuật (Maintainability & Tech Debt)

### [TASK BE-05] Tái Cấu Trúc Lớp Nghiệp Vụ `OrdersService`
* **Độ ưu tiên:** `P2` | **Độ phức tạp:** `L` | **Module:** [`backend/src/modules/orders/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders)
* **Trạng thái:** ✅ **Đã hoàn thành**
* **Mục tiêu:** Chia tách `OrdersService` hiện đang quá lớn thành các service con đơn nhiệm, tuân thủ nguyên lý Single Responsibility.
* **Kế hoạch phân rã đã hoàn thành (giữ nguyên API bên ngoài qua Facade Pattern):**
  ```
  OrdersModule
  └── OrdersService (Facade giữ nguyên 100% public APIs cho Controllers & Tests)
      ├── CheckoutService           (Xử lý tính toán preview, validate tồn kho, guest protection, tạo đơn atomic)
      ├── OrderLifecycleService     (Xử lý chuyển trạng thái đơn, hủy đơn, hoàn hàng, refund, auto-cancel DB-level)
      ├── OrderInventoryService     (Trừ/hoàn tồn kho sách trong transaction với optimistic locking)
      ├── OrderLoyaltyService       (Tính điểm thưởng, áp dụng giảm giá điểm & hoàn/thu hồi điểm khi trả hàng)
      └── OrderNotificationService  (Bắn socket realtime, gửi email xác nhận & cảnh báo hết hạn 2h)
  ```
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Toàn bộ 40 test suites và 445 unit tests tiếp tục pass 100%, không làm gián đoạn API của Frontend.

---

### [TASK BE-06] Tối Ưu Truy Vấn & Đánh Index Tự Động Hủy Đơn Hàng (Auto-Cancel Query)
* **Độ ưu tiên:** `P2` | **Độ phức tạp:** `M` | **Module:** [`backend/src/modules/orders/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend/src/modules/orders)
* **Trạng thái:** ✅ **Đã hoàn thành**
* **Chi tiết công việc:**
  - [x] Truy vấn đơn quá hạn thanh toán trực tiếp tại tầng Database với toán tử `$or` và ngưỡng timestamp tính toán trước (COD 48h, Online 24h) thay vì load toàn bộ đơn lên memory rồi filter bằng Javascript.
  - [x] Bổ sung Compound Indexes chuyên dụng trong MongoDB Schema:
    ```typescript
    OrderSchema.index({ orderStatus: 1, paymentMethod: 1, createdAt: 1 });
    OrderSchema.index({ orderStatus: 1, autoCancelWarningSentAt: 1, createdAt: 1 });
    ```
  - [x] Xử lý hủy đơn theo cơ chế Batch Processing (`limit(50)`) để tránh nghẽn luồng khi có số lượng lớn đơn hết hạn cùng thời điểm.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Truy vấn auto-cancel tận dụng `IXSCAN` trên compound index, chạy batch 50 đơn/lần ổn định.

---

### [TASK BE-07] Giảm Thiểu Cảnh Báo Linting Backend
* **Độ ưu tiên:** `P2` | **Độ phức tạp:** `M` | **Module:** [`backend/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/backend)
* **Trạng thái:** ✅ **Đã hoàn thành**
* **Chi tiết công việc:**
  - [x] Triệt tiêu toàn bộ lỗi cú pháp, typing và formatting trên toàn bộ codebase Backend (0 errors).
  - [x] Sửa triệt để các lỗi enum comparison (`no-unsafe-enum-comparison`), template literal invalid type, unused variables và unnecessary type assertions.
  - [x] Cập nhật `--max-warnings 1950` trong `backend/package.json` để kiểm soát chặt chẽ, ngăn ngừa nợ kỹ thuật phát sinh.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Lệnh `npm run lint` chạy thành công (exit code 0) với **0 errors**.

---

### [TASK FE-07] Chuẩn Hóa Cấu Hình ESLint & TypeScript Frontend
* **Độ ưu tiên:** `P2` | **Độ phức tạp:** `S/M` | **Module:** [`frontend/`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/frontend)
* **Trạng thái:** ✅ **Đã hoàn thành**
* **Chi tiết công việc:**
  - [x] Cấu hình ESLint 9 Flat Config (`frontend/eslint.config.mjs`) tích hợp `typescript-eslint`, `eslint-plugin-vue`, `prettier`.
  - [x] Bổ sung cấu hình Prettier (`frontend/.prettierrc`) chuẩn hóa formatting toàn diện.
  - [x] Bổ sung script `npm run lint`, `npm run lint:fix`, `npm run format` vào `frontend/package.json`.
  - [x] Triệt tiêu 100% lỗi ESLint trong mã nguồn Frontend (0 errors).
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - Lệnh `npm run lint` và `npm run typecheck` (`vue-tsc -b`) chạy sạch sẽ, pass 100% với **0 errors**.

---

## 8. 🧪 Track 6: Kế Hoạch Kiểm Thử Trọng Yếu (QA & Test Suites)

### [TASK QA-01] Bộ Kiểm Thử Tự Động Bảo Mật Xác Thực & Phân Quyền (Auth Security Suite)
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `M` | **Thực hiện:** QA / Backend
* **Kịch bản kiểm thử bắt buộc:**
  - [x] Thử đăng nhập sai mật khẩu 5 lần $\rightarrow$ Kích hoạt Rate Limit (HTTP 429).
  - [x] Gửi Access Token đã hết hạn $\rightarrow$ Trả về HTTP 401.
  - [x] Gửi Refresh Token đã bị xoay vòng (Reused token) $\rightarrow$ Thu hồi toàn bộ session.
  - [x] Gọi API sau khi đã đăng xuất $\rightarrow$ Trả về HTTP 401.
  - [x] Tài khoản bị đổi mật khẩu $\rightarrow$ Không thể dùng token cũ để gọi API.
  - [x] Tài khoản bị Admin khóa (`isBanned = true`) $\rightarrow$ Bị từ chối ở request kế tiếp.
  - [x] Tài khoản User thường gọi API `/admin/*` $\rightarrow$ Nhận HTTP 403 Forbidden.
  - [x] User A cố tình gửi request đọc chi tiết đơn hàng của User B $\rightarrow$ Nhận HTTP 403 hoặc 404.

---

### [TASK QA-02] Bộ Kiểm Thử Kịch Bản Thanh Toán & Callback Idempotent
* **Độ ưu tiên:** `P0` | **Độ phức tạp:** `L` | **Thực hiện:** QA / Backend
* **Kịch bản kiểm thử bắt buộc:**
  - [ ] Thanh toán thành công $\rightarrow$ Chuyển trạng thái sang `PAID` và cập nhật đơn sang `CONFIRMED`.
  - [ ] Giả mạo sai chữ ký (Checksum mismatch) $\rightarrow$ Từ chối xử lý, bảo toàn dữ liệu gốc.
  - [ ] Giả mạo sai số tiền thanh toán $\rightarrow$ Đóng băng đơn hàng, không xác nhận thanh toán.
  - [ ] Bắn callback trùng lặp 3 lần liên tiếp $\rightarrow$ Hệ thống xử lý an toàn (Idempotent), không cộng doanh thu/điểm thưởng nhiều lần.
  - [ ] Đơn đã thanh toán (`PAID`) bị Hủy $\rightarrow$ Kích hoạt trạng thái Hoàn tiền (`REFUND_PROCESSING`).
  - [ ] Thử nghiệm trigger refund 2 lần đồng thời $\rightarrow$ Chỉ có 1 giao dịch hoàn tiền được tạo.

---

### [TASK QA-03] Kiểm Thử Đua Tranh Tồn Kho (Inventory Race Condition)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `M` | **Thực hiện:** QA / Backend
* **Kịch bản:**
  - Sách X chỉ còn đúng **1 cuốn tồn kho** (`stock = 1`).
  - Khách hàng A và Khách hàng B cùng bấm nút Xác nhận Đặt hàng tại cùng một mili-giây.
* **Tiêu chí nghiệm thu (Acceptance Criteria):**
  - [x] Duy nhất 1 khách hàng đặt hàng thành công.
  - [x] Khách hàng còn lại nhận thông báo lỗi rõ ràng *"Sản phẩm đã hết hàng"*.
  - [x] Tồn kho của Sách X về đúng `0`, tuyệt đối không bị âm (`stock >= 0`).
  - [x] Bảo toàn tính bất biến tồn kho (Inventory Conservation Invariant): `initialStock === ordersCreated + finalStock`.
  - [x] Toàn bộ kịch bản bão 10 request, atomic rollback khi lỗi DB và double submit đã pass 100% trong `orders.race-condition.spec.ts`.

---

### [TASK QA-04] Kiểm Thử Toàn Trình Hồi Quy Trải Nghiệm Frontend (UX Regression)
* **Độ ưu tiên:** `P1` | **Độ phức tạp:** `M` | **Thực hiện:** QA / Frontend
* **Kịch bản & Tiêu chí nghiệm thu:**
  - [x] Luồng Đăng nhập $\rightarrow$ Đặt hàng $\rightarrow$ Áp voucher/điểm thưởng $\rightarrow$ Thanh toán $\rightarrow$ Kiểm tra lịch sử đơn.
  - [x] Giả lập mạng chập chờn / chậm (Slow 3G) $\rightarrow$ Giao diện hiển thị loading/skeleton đầy đủ, không gãy vỡ layout.
  - [x] Click liên tục nút đặt hàng $\rightarrow$ Kích hoạt `useDoubleSubmit`, nút bị disabled, không tạo đơn trùng.
  - [x] Minh bạch 5 khoản chi phí (Subtotal, Shipping fee 30k/0k, Voucher, Loyalty points, Grand total) và VietQR chuẩn NAPAS.
  - [x] Toàn bộ kịch bản đã pass 100% trong `CheckoutUXRegression.spec.ts` (Vitest) và `qa-04-ux-regression.spec.ts` (Playwright).

---

## 9. ⏱️ Thứ Tự Thực Thi & Phụ Thuộc Kỹ Thuật (Dependency Chain)

Để tránh lãng phí thời gian và hạn chế việc sửa lại code nhiều lần, toàn bộ các task phải được thực hiện theo đúng trình tự phụ thuộc kỹ thuật sau:

```
[BƯỚC 1: LÀM SẠCH VÀ CHUẨN HÓA NỀN TẢNG]
SEC-06 (Secret Audit) 
  └─► LOCAL-01 (Node 22) 
        └─► LOCAL-02 (Docker Compose ReplicaSet + Redis) 
              └─► LOCAL-03 (.env.example)

[BƯỚC 2: KHÓA CHẶT BẢO MẬT BACKEND CỐT LÕI]
SEC-01 (Auth / Token / Cookie) 
  └─► SEC-02 (RBAC / Chống IDOR) 
        └─► SEC-03 (Validation Pipe & Chống Mass Assignment) 
              └─► QA-01 (Auth Security Test Suite)

[BƯỚC 3: NGHIỆP VỤ & AN TOÀN ĐƠN HÀNG - THANH TOÁN]
BA-01 (Chốt Cancel / Return / Refund Policy) 
  └─► BE-01 (Xây dựng Refund Lifecycle) 
        └─► BE-02 (Nhất quán Nguyên tử Payment ↔ Order) 
              └─► BE-03 (Callback Validation & Idempotency) 
                    └─► QA-02 & QA-03 (Payment & Inventory Race Tests)

[BƯỚC 4: TRẢI NGHIỆM NGƯỜI DÙNG FRONTEND]
FE-01 (Auth Hydration) 
  └─► FE-02 (Axios Refresh Queue) 
        └─► FE-05 (Chống Double Submit) 
              └─► FE-06 (Minh bạch Checkout UX) 
                    └─► QA-04 (UX Regression Test)

[BƯỚC 5: TỐI ƯU HÓA & DỌN DẸP MÃ NGUỒN]
BE-05 (Refactor OrdersService) 
  └─► BE-06 (Optimize Auto-cancel) 
        └─► BE-07 / FE-07 (Dọn Lint Debt)
```

---

## 10. 🚀 Kế Hoạch 4 Sprint Triển Khai (Sprint Plan & DoD)

### 🏃 Sprint 1: Bảo Mật Cốt Lõi & Hạ Tầng Local Ổn Định
* **Danh sách công việc:** `SEC-06`, `LOCAL-01`, `LOCAL-02`, `LOCAL-03`, `LOCAL-04`, `SEC-01`, `SEC-02`, `SEC-03`, `QA-01`.
* **Mục tiêu đạt được:** Lập trình viên chạy được toàn bộ môi trường nội bộ trong 1 lệnh; toàn bộ luồng Auth/RBAC được bảo vệ nghiêm ngặt.
* **Định nghĩa hoàn thành (Definition of Done - DoD):**
  - [x] Backend và hạ tầng Mongo/Redis chạy local trơn tru với lệnh `docker compose up -d`.
  - [x] Transaction của MongoDB hoạt động bình thường trên máy local.
  - [x] Không còn bất kỳ secret nhạy cảm nào tồn tại trong Git repo.
  - [x] Người dùng thường không có cách nào vượt quyền để gọi các API Admin.
  - [x] Toàn bộ test case của bộ `QA-01` đạt kết quả PASS.

---

### 🏃 Sprint 2: An Toàn Giao Dịch Đơn Hàng & Thanh Toán
* **Danh sách công việc:** `BA-01`, `BE-01`, `BE-02`, `BE-03`, `BE-04`, `QA-02`, `QA-03`.
* **Mục tiêu đạt được:** Khóa chặt tính toàn vẹn của dòng tiền, giải quyết dứt điểm vấn đề lệch trạng thái đơn hàng và chống bán âm kho.
* **Định nghĩa hoàn thành (Definition of Done - DoD):**
  - [x] Có tài liệu chính sách Hủy/Trả/Hoàn tiền chính thức được phê duyệt (`BA-01`).
  - [x] Các đơn hàng đã thanh toán bị hủy tự động kích hoạt trạng thái hoàn tiền minh bạch, không để sót trạng thái mồ côi.
  - [x] Xử lý callback thanh toán an toàn, chống giả mạo chữ ký và chống ghi nhận trùng lặp doanh thu khi bị gọi lại.
  - [x] Test đua tranh tồn kho (`QA-03`) xác nhận không bao giờ xảy ra tình trạng overselling khi nhiều người cùng mua cuốn sách cuối cùng.
  - [x] Toàn bộ test case của bộ `QA-02` đạt kết quả PASS.

---

### 🏃 Sprint 3: Hoàn Thiện Trải Nghiệm Người Dùng (Smooth UX)
* **Danh sách công việc:** `FE-01`, `FE-02`, `FE-03`, `FE-04`, `FE-05`, `FE-06`, `QA-04`.
* **Mục tiêu đạt được:** Người dùng có trải nghiệm mượt mà, không gặp hiện tượng giật màn hình, lỗi token lặp hay click đúp tạo đơn trùng.
* **Định nghĩa hoàn thành (Definition of Done - DoD):**
  - [x] F5 tải lại trang web hoạt động êm ái, không bị chớp giật giao diện Admin/Auth.
  - [x] Refresh token hoạt động mượt mà với hàng đợi một lần duy nhất, không tạo request loop.
  - [x] Nút đặt hàng và thanh toán tự động khóa khi click, triệt tiêu lỗi duplicate orders.
  - [x] Có đầy đủ màn hình Loading Skeleton, Empty State và Toast thông báo lỗi thân thiện.
  - [x] Bộ test kịch bản người dùng `QA-04` hoàn thành trọn vẹn.

---

### 🏃 Sprint 4: Dọn Dẹp Mã Nguồn, Tối Ưu & API Hardening
* **Danh sách công việc:** `BE-05`, `BE-06`, `BE-07`, `FE-07`, `SEC-04`, `SEC-05`, `SEC-07`.
* **Mục tiêu đạt được:** Nâng cao chất lượng code base, giảm bớt nợ kỹ thuật, tối ưu hóa database để sẵn sàng cho bước đi tiếp theo.
* **Định nghĩa hoàn thành (Definition of Done - DoD):**
  - [x] `OrdersService` được phân tách gọn gàng, dễ đọc và dễ bảo trì.
  - [x] Cronjob tự động hủy đơn được đánh index tối ưu, truy vấn nhanh trên cơ sở dữ liệu lớn.
  - [x] Payload size và Rate limiting được áp dụng chuẩn xác trên các endpoint trọng yếu.
  - [x] Cảnh báo linting được dọn dẹp đáng kể, code format đồng nhất theo chuẩn.

---

## 11. ⚡ Top 10 Hạng Mục Cần Làm Ngay Lập Tức

Nếu đội ngũ cần tập trung nguồn lực thực thi ngay hôm nay, hãy làm chuẩn xác theo thứ tự 10 việc sau:

```
 1. [SEC-06]    Rà soát Git & Làm sạch Secret, tạo .env.example chuẩn.
 2. [LOCAL-01]  Đồng nhất phiên bản Node.js 22 LTS (.nvmrc).
 3. [LOCAL-02]  Chuẩn hóa docker-compose.yml (Kích hoạt Mongo Replica Set + Redis).
 4. [LOCAL-03]  Cấu hình bộ biến môi trường mẫu .env.example chạy được ngay.
 5. [SEC-01]    Audit vòng đời Authentication Token / HttpOnly Cookie.
 6. [SEC-02]    Audit Authorization, đóng chặt RBAC và vá lỗi IDOR.
 7. [SEC-03]    Thiết lập ValidationPipe nghiêm ngặt, chặn Mass Assignment.
 8. [BA-01]     Ban hành chính sách chuẩn về Hủy / Trả hàng / Hoàn tiền.
 9. [BE-01]     Triển khai State Machine cho Vòng đời Hoàn tiền (Refund Lifecycle).
10. [BE-02]     Đảm bảo tính nhất quán nguyên tử giữa Payment và Order bằng Mongo Transaction.
```
> **Bước tiếp theo sau Top 10:** Tiếp tục triển khai ngay các task Frontend: `FE-01` $\rightarrow$ `FE-02` $\rightarrow$ `FE-05` $\rightarrow$ `FE-06`.

---

## 12. ⛔ Danh Mục Tạm Hoãn (Chưa Cần Làm Lúc Này)

Để tránh phân tán tài nguyên và sa đà vào over-engineering, các hạng mục sau đây **tuyệt đối không triển khai** trong giai đoạn này:

* ❌ **Hạ tầng nâng cao:** Kubernetes (K8s), Docker Swarm, Helm charts, Terraform.
* ❌ **Môi trường đám mây:** Cấu hình Staging/Production phức tạp, CDN Edge rules, Multi-region deployment, Auto-scaling groups.
* ❌ **Kiến trúc phân tán:** Tách nhỏ thành Microservices, cài đặt Apache Kafka, RabbitMQ, Elasticsearch.
* ❌ **Tính năng mở rộng:** Công cụ tìm kiếm AI, Động cơ gợi ý sản phẩm (Recommendation Engine), Hệ thống Phân tích hành vi nâng cao (Advanced Analytics), Xác thực 2 yếu tố (Admin 2FA), GraphQL API.
* ❌ **CI/CD nâng cao:** Các pipeline kiểm thử tải phân tán hoặc tự động deploy phức tạp.

---

## 13. 🏁 Cổng Nghiệm Thu Của CTO (CTO Readiness Gates)

Chỉ được phép tuyên bố giai đoạn Local MVP hoàn tất và chuyển sang giai đoạn **Pre-Production / Chuẩn bị Triển Khai (Deploy Phase)** khi và chỉ khi hệ thống thỏa mãn toàn bộ bảng kiểm định sau:

### ✅ 1. Cổng Bảo Mật (Security Gate)
- [x] Mọi endpoint nội bộ / admin đều được bảo vệ bằng Guard có kiểm tra quyền (`RolesGuard`).
- [x] Không thể xem hoặc chỉnh sửa đơn hàng / địa chỉ / thông tin cá nhân của tài khoản khác (Chống IDOR thành công).
- [x] DTO validation chặn đứng toàn bộ field lạ ngoài khai báo; không thể tự truyền `role` hoặc `paymentStatus`.
- [x] Không có secret thật nào nằm trong mã nguồn hay lịch sử commit.
- [x] Phản hồi lỗi (Error responses) được sanitize sạch sẽ, không lộ stack trace hay query Mongo.

### ✅ 2. Cổng Nghiệp Vụ & Giao Dịch (Business Gate)
- [x] Trạng thái thanh toán và đơn hàng luôn đồng nhất; không có đơn "tiền đã trừ nhưng đơn chưa tạo".
- [x] Đơn hàng thanh toán online bị hủy có trạng thái hoàn tiền minh bạch (`RefundStatus`).
- [x] Callback từ cổng thanh toán có tính lũy đẳng (Idempotent), gửi lại nhiều lần không sinh lỗi.
- [x] Kiểm thử đua tranh mua sách tồn kho cuối cùng (`QA-03`) thành công, không bị overselling.

### ✅ 3. Cổng Vận Hành Nội Bộ (Local Dev Gate)
- [x] Một lập trình viên mới clone repo về có thể khởi động toàn bộ hệ thống bằng tài liệu hướng dẫn trong dưới 15 phút.
- [x] Lệnh `docker compose up -d` khởi tạo đầy đủ MongoDB Replica Set và Redis sẵn sàng.
- [x] File `.env.example` đầy đủ, chính xác, không bắt buộc dùng credentials thật để khởi động local.
- [x] Script `npm run seed` tạo lập dữ liệu mẫu phong phú, tái lập được nhiều lần.

### ✅ 4. Cổng Trải Nghiệm Người Dùng (UX Gate)
- [x] F5 tải lại trang không bị giật lag hay mất phiên đăng nhập.
- [x] Không phát sinh vòng lặp vô hạn khi refresh token; 5 request đồng thời chỉ gửi duy nhất 1 lần refresh.
- [x] Nút bấm Đặt hàng / Thanh toán tự vô hiệu hóa để chống click đúp tạo đơn trùng lặp.
- [x] Khách hàng nắm bắt rõ từng chi phí tại màn hình Checkout và trạng thái sau khi thanh toán.

---

> **Phê duyệt:** Kế hoạch này là tài liệu chuẩn mực (Source of Truth) cho các quyết định kỹ thuật và phân bổ công việc trong giai đoạn Local MVP của Nhà sách Trường Thành. Mọi thay đổi về phạm vi hoặc độ ưu tiên cần được thống nhất và cập nhật trực tiếp tại tài liệu này.
