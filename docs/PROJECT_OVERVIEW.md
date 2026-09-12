# 📚 TRƯỜNG THÀNH BOOKSTORE — TÀI LIỆU TỔNG QUAN & CẨM NANG DỰ ÁN TOÀN DIỆN
> **Phiên bản tài liệu:** 4.0 — Cập nhật 2026-09-12  
> **Đối tượng:** Thực tập sinh (Intern), Lập trình viên mới (New Developer), Quản lý dự án (PM) & Trợ lý AI (AI Agents).  
> **Mục tiêu:** Cung cấp tài liệu tra cứu duy nhất (Single Source of Truth) giúp bất kỳ ai đọc hiểu 100% kiến trúc, cấu hình môi trường, quy tắc nghiệp vụ, trạng thái hiện tại của dự án và tiếp tục phát triển/bảo trì hệ thống ngay lập tức mà không gặp rào cản.

> **📌 Hướng dẫn đọc tài liệu:**
> - **File này (`PROJECT_OVERVIEW.md`)**: Hiểu toàn bộ dự án — kiến trúc, cấu hình, nghiệp vụ, trạng thái hiện tại.
> - **[`PENDING_TASKS.md`](PENDING_TASKS.md)**: Xem danh sách task chưa làm — chia theo mức độ, chi tiết nghiệp vụ từng task.
> - **`docs/archive/`**: Lưu trữ các changelog, audit report, đặc tả tính năng đã hoàn thành (tham khảo khi cần).

---

## 📑 MỤC LỤC
1. [🌟 Giới thiệu Tổng quan Dự án (Executive Summary)](#1--giới-thiệu-tổng-quan-dự-án-executive-summary)
2. [🏗️ Kiến trúc Hệ thống & Ngăn xếp Công nghệ (Architecture & Tech Stack)](#2-️-kiến-trúc-hệ-thống--ngăn-xếp-công-nghệ-architecture--tech-stack)
3. [📁 Sơ đồ Cấu trúc Mã nguồn (Project Structure & Modules Map)](#3--sơ-đồ-cấu-trúc-mã-nguồn-project-structure--modules-map)
4. [⚙️ Hướng dẫn Cài đặt & Cấu hình Môi trường (Setup & Environment Guide)](#4-️-hướng-dẫn-cài-đặt--cấu-hình-môi-trường-setup--environment-guide)
5. [🔐 Bảo mật, Xác thực & Phiên làm việc (Authentication & Token Security)](#5--bảo-mật-xác-thực--phiên-làm-việc-authentication--token-security)
6. [🛡️ Ma trận Phân quyền & Endpoint Bảo vệ (RBAC & Protected Endpoints)](#6-️-ma-trận-phân-quyền--endpoint-bảo-vệ-rbac--protected-endpoints)
7. [🛍️ Quy tắc Nghiệp vụ Cốt lõi (Core Commerce Business Rules)](#7-️-quy-tắc-nghiệp-vụ-cốt-lõi-core-commerce-business-rules)
8. [📡 Chuẩn Giao tiếp API & Thời gian thực (API Envelope & WebSocket)](#8--chuẩn-giao-tiếp-api--thời-gian-thực-api-envelope--websocket)
9. [🧪 Kiểm thử Tự động & Quy trình CI/CD (Testing & Deployment Pipelines)](#9--kiểm-thử-tự-động--quy-trình-cicd-testing--deployment-pipelines)
10. [📘 Cẩm nang Dành cho Intern & Lập trình viên Mới](#10--cẩm-nang-dành-cho-intern--lập-trình-viên-mới)
11. [📊 Trạng Thái Hiện Tại Dự Án (Current Project Status)](#11--trạng-thái-hiện-tại-dự-án-current-project-status)

---

## 1. 🌟 Giới thiệu Tổng quan Dự án (Executive Summary)

### 1.1. Dự án là gì?
**Trường Thành Bookstore** là giải pháp nền tảng thương mại điện tử đa kênh (**Omni-channel E-commerce**) phục vụ chuyển đổi số cho **Công Ty TNHH Giáo Dục & Phát Triển Trường Thành**. Hệ thống chuyên kinh doanh:
- **Sách:** Sách giáo khoa, sách tham khảo, truyện tranh thiếu nhi, văn học, kỹ năng sống, sách ngoại ngữ.
- **Văn phòng phẩm & Dụng cụ học tập:** Bút viết, vở ô ly, thước kẻ, máy tính bỏ túi, dụng cụ vẽ mỹ thuật, cặp sách, bìa hồ sơ.
- **Đồ chơi giáo dục & Quà tặng:** Đồ chơi phát triển trí tuệ, mô hình lắp ráp LEGO/gỗ, quà lưu niệm văn hóa.

### 1.2. Các kênh tương tác (Touchpoints)
1. **Web Khách hàng (Storefront):** Khách hàng tìm kiếm sản phẩm theo từ khóa tiếng Việt không dấu, lọc theo giá/danh mục/nhà xuất bản, thêm giỏ hàng, áp mã giảm giá, tiêu điểm thưởng Loyalty, đặt hàng (hỗ trợ cả tài khoản và khách vãng lai), theo dõi vận đơn và gửi đánh giá sản phẩm.
2. **Web Quản trị (Admin CMS Dashboard):** Dành cho Admin và Staff quản lý danh mục sản phẩm, biến thể tồn kho, phiếu nhập/xuất/điều chỉnh kho, xử lý đơn hàng, mã khuyến mãi, duyệt đánh giá, quản trị khách hàng, banner quảng cáo, báo cáo doanh thu tài chính và xuất/nhập danh mục sản phẩm bằng Excel.
3. **Ứng dụng Di động (Mobile App - Flutter):** Trải nghiệm mua sắm mượt mà trên Android và iOS, đồng bộ giỏ hàng với Web, nhận thông báo đẩy tức thì (FCM / APNs) khi đơn đổi trạng thái và đặt hàng nhanh COD.

---

## 2. 🏗️ Kiến trúc Hệ thống & Ngăn xếp Công nghệ (Architecture & Tech Stack)

### 2.1. Sơ đồ Kiến trúc Tổng thể (System Architecture Diagram)

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT APPLICATIONS LAYER                            │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│       🌐 WEB FRONTEND (Vue 3 + Vite)   │     📱 MOBILE APP (Flutter + Dart)      │
│   - Khách hàng (Storefront & Checkout) │   - Mua sắm, giỏ hàng, thông báo push   │
│   - Quản trị (Admin CMS Dashboard)     │   - Hỗ trợ đa nền tảng Android & iOS    │
└───────────────────┬────────────────────┴────────────────────┬────────────────────┘
                    │ HTTP REST (JSON)                        │ HTTP REST (JSON)
                    │ WebSocket (Socket.IO /notifications)    │
                    ▼                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API LAYER (NestJS v11)                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│ - Global: ValidationPipe (DTOs), HttpExceptionFilter, TransformInterceptor       │
│ - Security: Helmet, CORS Whitelist, Distributed Throttler (Redis), Redaction     │
│ - Auth Engine: Passport JWT, Refresh Rotation, Token Blacklist, OTP SHA-256      │
│ - 16 Business Modules: Auth, Users, Products, Categories, Cart, Orders, Payments,│
│   Inventory, Reviews, Promotions, Notifications, Reports, Customers, Banners...  │
│ - Realtime Gateway: Socket.IO WebSocket Server (Namespace /notifications)        │
└───────────────────┬─────────────────────────────────────────┬────────────────────┘
                    │                                         │
                    ▼                                         ▼
┌───────────────────────────────────────┐ ┌────────────────────────────────────────┐
│     🗄️ DATABASE & DISTRIBUTED CACHE   │ │       ☁️ THIRD-PARTY CLOUD SERVICES    │
├───────────────────────────────────────┤ ├────────────────────────────────────────┤
│ • MongoDB 7.0 (Single-Node ReplicaSet)│ │ • Cloudinary: Lưu trữ hình ảnh         │
│   - Mongoose 9 Schemas & Indexes      │ │ • Nodemailer: Gửi email OTP & Hóa đơn  │
│   - Transactions nguyên tử cho Orders │ │ • Firebase Cloud Messaging (FCM HTTP v1│
│ • Redis 7 (In-Memory Distributed):    │ │ • Google Sheets Sync (Tự động đồng bộ) │
│   - Token Blacklist phân tán          │ │ • Cổng thanh toán: COD, VietQR,        │
│   - Distributed Throttler storage     │ │   VNPay 2.1.0, MoMo IPN               │
│   - Fallback bộ nhớ cục bộ an toàn    │ │ • Sentry: Giám sát ngoại lệ thời gian  │
└───────────────────────────────────────┘ └────────────────────────────────────────┘
```

### 2.2. Bảng Ngăn xếp Công nghệ (Tech Stack Breakdown)

| Phân hệ | Công nghệ lõi | Thư viện & Công cụ chính |
| :--- | :--- | :--- |
| **Backend API** | NestJS v11 (Node.js 20+, TypeScript) | `@nestjs/mongoose`, `mongoose v9`, `@nestjs/jwt`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `helmet`, `@nestjs/throttler`, `ioredis`, `pdfkit` (xuất PDF), `exceljs` (Excel Import/Export), `socket.io`, `@nestjs/swagger`, `winston`, `@sentry/node` |
| **Frontend Web** | Vue 3 (Composition API, `<script setup>`), Vite 8, TypeScript | `pinia` (State), `vue-router v4`, `tailwindcss v4`, `axios`, `chart.js` + `vue-chartjs`, `vue-toastification`, `vue-i18n`, `lucide-vue-next` |
| **Mobile App** | Flutter SDK (^3.11), Dart | `provider` (State), `http`, `flutter_secure_storage`, `firebase_core`, `firebase_messaging`, `cached_network_image`, `shimmer`, `intl` |
| **Database** | MongoDB 7.0 (Replica Set mode) | Hỗ trợ MongoDB Multi-document Transactions, Compound Indexes, Unique Indexes, Text Indexes không dấu |
| **Cache & Throttler** | Redis 7 | Quản lý Token Blacklist phân tán, Rate-limiting chống DDoS nhiều node instance |
| **DevOps / CI** | Docker, Docker Compose, GitHub Actions | Multi-stage Dockerfile, ReplicaSet keyfile authentication, Gitleaks, Playwright E2E |

---

## 3. 📁 Sơ đồ Cấu trúc Mã nguồn (Project Structure & Modules Map)

### 3.1. Cấu trúc Thư mục Toàn bộ Repository

```text
Truong_Thanh_Bookstore/
├── .github/
│   └── workflows/              # Kịch bản CI/CD GitHub Actions
│       ├── ci.yml              # CI tổng hợp: Gitleaks, Backend, Frontend, Playwright
│       └── deploy.yml          # Kịch bản tự động triển khai Vercel & Render
├── backend/                    # 🚀 MÃ NGUỒN BACKEND (NestJS v11)
│   ├── src/
│   │   ├── main.ts             # Điểm khởi chạy (CORS, Helmet, Rate Limit, Redaction, Swagger)
│   │   ├── app.module.ts       # Module gốc cấu hình DB, Config, Throttler, Sentry
│   │   ├── common/             # Thành phần dùng chung toàn hệ thống
│   │   │   ├── audit/          # SecurityAuditService ghi nhận hành vi bảo mật
│   │   │   ├── decorators/     # @GetUser, @Roles, @Permissions, @Public, @IdempotencyKey
│   │   │   ├── dto/            # PaginationDto, StandardResponse, DateRangeDto
│   │   │   ├── enums/          # ErrorCode, UserRole, StaffPermission, OrderStatus, PaymentMethod
│   │   │   ├── exceptions/     # AppException, BusinessException, ResourceNotFoundException
│   │   │   ├── filters/        # HttpExceptionFilter (Chuẩn hóa response lỗi toàn cục)
│   │   │   ├── guards/         # JwtAuthGuard, RolesGuard, PermissionsGuard, OptionalJwtGuard
│   │   │   ├── interceptors/   # LoggingInterceptor, TransformInterceptor, RedactionFilter
│   │   │   ├── logger/         # StructuredLoggerService (JSON logs 1 dòng có Correlation ID)
│   │   │   ├── redis/          # RedisService & RedisThrottlerStorageService
│   │   │   └── sentry/         # SentryService tích hợp error tracking
│   │   ├── config/             # Quản lý & Xác thực biến môi trường (env.validation.ts)
│   │   ├── modules/            # 16 Modules nghiệp vụ độc lập (Xem mục 3.2)
│   │   └── scripts/            # Scripts bảo trì (verify-and-migrate-reviews, load harness)
│   ├── test/                   # Jest E2E & Integration Test Suites
│   ├── Dockerfile              # Multi-stage production build
│   └── package.json
├── frontend/                   # 🌐 MÃ NGUỒN FRONTEND WEB (Vue 3 + Vite)
│   ├── src/
│   │   ├── main.ts             # Khởi chạy Vue app, nạp Pinia, Router, Toast, i18n
│   │   ├── App.vue             # Root layout component
│   │   ├── components/         # Shared UI: DataTable, FilterBar, FormModal, StatusBadge, ImageUploader
│   │   ├── composables/        # Vue composables (useDebounce, useCurrency, useAuth)
│   │   ├── layouts/            # CustomerLayout.vue, AdminLayout.vue
│   │   ├── pages/              # Giao diện Khách hàng & Admin CMS
│   │   ├── router/             # Vue Router & Route Navigation Guards
│   │   ├── services/           # Lớp Axios HTTP Service kết nối API
│   │   ├── stores/             # Pinia Stores (auth, cart, product, category, notification...)
│   │   ├── types/              # TypeScript Interfaces & Types
│   │   └── utils/              # api.ts (Axios Interceptors), formatters, helpers
│   ├── e2e/                    # Playwright E2E browser tests (5 core user flows)
│   └── package.json
├── mobile/                     # 📱 MÃ NGUỒN MOBILE APP (Flutter)
│   ├── lib/
│   │   ├── main.dart           # Khởi chạy Flutter, Firebase FCM & Deep-link routing
│   │   ├── core/               # App constants, API client, Secure storage, App theme
│   │   ├── models/             # Data Models (User, Product, Order, CartItem...)
│   │   ├── providers/          # State Providers (AuthProvider, CartProvider, OrdersProvider...)
│   │   ├── screens/            # Màn hình (Home, Product Detail, Cart, Checkout, Order Detail...)
│   │   ├── services/           # FcmNotificationService
│   │   └── widgets/            # Reusable UI Widgets
│   ├── android/                # Cấu hình Android native & Keystore signing
│   ├── ios/                    # Cấu hình iOS native, Entitlements & APNs
│   └── pubspec.yaml
├── docs/                       # 📖 TÀI LIỆU DỰ ÁN
│   ├── PROJECT_OVERVIEW.md     # Tài liệu tổng quan dự án (file này)
│   ├── PENDING_TASKS.md        # Danh mục task chưa làm, chia theo mức độ ưu tiên
│   └── archive/                # Lưu trữ changelog, audit report, đặc tả tính năng đã xong
├── docker-compose.yml          # Core Stack: MongoDB ReplicaSet + Redis + Backend + Frontend
└── docker-compose.tools.yml    # Mongo Express (Chỉ dùng khi debug cục bộ)
```

### 3.2. Bản đồ 16 Module Nghiệp vụ Backend

| STT | Module | Trách nhiệm chính (Responsibilities) |
| :---: | :--- | :--- |
| 1 | **auth** | Đăng ký, đăng nhập, quên/đặt lại mật khẩu (OTP SHA-256), phát hành/quay vòng JWT (Token Rotation), Token Blacklist Redis, thu hồi phiên theo `tokenVersion`. |
| 2 | **users** | Hồ sơ cá nhân, đổi mật khẩu, quản lý Sổ địa chỉ (`addresses`), danh sách yêu thích (`wishlist`), quản lý điểm tích lũy và hoàn điểm thưởng. |
| 3 | **products** | CRUD sản phẩm, tìm kiếm không dấu (diacritic regex), lọc đa tiêu chí, quản lý biến thể/SKU, xuất/nhập file Excel 14 cột với `exceljs`. |
| 4 | **categories** | Cây danh mục đa cấp (Cha - Con), tạo slug tự động, kiểm tra ràng buộc không cho xóa danh mục còn sản phẩm. |
| 5 | **cart** | Quản lý giỏ hàng phía server, kiểm tra tồn kho thời gian thực, tính tạm tính (subtotal), áp dụng ngưỡng miễn phí vận chuyển. |
| 6 | **orders** | Tạo đơn hàng nguyên tử (Guest & Auth), kiểm tra trùng lặp (`idempotencyKey`), tính giá server-side, trừ kho nguyên tử, xuất hóa đơn PDF (`pdfkit`), chuyển đổi trạng thái đơn hàng. |
| 7 | **payments** | Lớp xử lý cổng thanh toán: COD, Chuyển khoản VietQR, VNPay 2.1.0 (HMAC-SHA512), MoMo (HMAC-SHA256), khóa chặn mock ở production. |
| 8 | **inventory** | Quản lý tồn kho & sổ cái giao dịch với 5 loại (`IMPORT`, `SALE`, `RETURN`, `ADJUSTMENT`, `DAMAGE`), cảnh báo sản phẩm sắp hết hàng (`stockAlert`). |
| 9 | **promotions** | Hệ thống mã giảm giá (Voucher % hoặc cố định), kiểm tra trần giảm giá, đơn tối thiểu, số lượt dùng tối đa, chống dùng lặp. |
| 10 | **reviews** | Đánh giá sao & bình luận sản phẩm, kiểm tra đã mua hàng (`isVerifiedPurchase`), kiểm duyệt hiển thị (`isVisible`), phản hồi của Admin (`adminReply`). |
| 11 | **notifications** | WebSocket Gateway (Socket.IO `/notifications`) đẩy thông báo tức thì (đơn mới, thay đổi trạng thái, cảnh báo kho), lưu trữ thông báo vào DB, đồng bộ FCM. |
| 12 | **reports** | Báo cáo doanh thu thuần (loại trừ đơn hủy/trả), tỷ lệ tăng trưởng kỳ trước, cơ cấu doanh thu theo danh mục, giá trị đơn trung bình (AOV). |
| 13 | **customers** | Quản trị danh sách khách hàng, thống kê tổng chi tiêu, tổng số đơn mua dành cho Admin CMS. |
| 14 | **banners** | Quản lý banner tiếp thị đa vị trí (slider, sidebar, bottom row) & Quảng cáo mở website (Entry Popup Ad / Interstitial Modal) với tần suất hiển thị (Every visit, Session, Daily), lập lịch (startAt, endAt), tự động lưu trữ Cloudinary và quy tắc kích hoạt duy nhất (Single Active Popup). |
| 15 | **landing-pages**| Quản lý trang đích Flash Sale động, tích hợp trọn vẹn vào `OrdersService.create()` với sản phẩm thật trong DB. |
| 16 | **email** | Gửi email giao dịch qua SMTP Nodemailer: Gửi mã OTP xác thực và gửi email xác nhận đặt hàng thành công. |

---

## 4. ⚙️ Hướng dẫn Cài đặt & Cấu hình Môi trường (Setup & Environment Guide)

### 4.1. Yêu cầu Tiền đề (Prerequisites)
- **Node.js:** Phiên bản `>= 20.x` LTS.
- **npm:** Đi kèm Node.js.
- **MongoDB:** Phiên bản `>= 7.0` (Khuyến nghị chạy Replica Set để hỗ trợ Transaction).
- **Redis:** Phiên bản `>= 7.0` (Dùng cho Rate-limiting & Token Blacklist).
- **Docker & Docker Compose:** Dành cho triển khai container hóa.
- **Flutter SDK:** Phiên bản `>= 3.11.x` (Nếu lập trình Mobile).

---

### 4.2. Cấu hình Chi tiết Biến Môi trường (.env)

#### 🔹 Backend: File `backend/.env` (Tạo từ `backend/.env.example`)

```env
# ==============================================================================
# 1. SERVER CONFIGURATION
# ==============================================================================
NODE_ENV=development                       # 'development' | 'production' | 'test'
PORT=3000
FRONTEND_URL=http://localhost:5173,http://localhost:80 # Danh sách domain CORS cho phép

# ==============================================================================
# 2. DATABASE CONFIGURATION (MONGODB REPLICA SET)
# ==============================================================================
# Bắt buộc kết nối tới Replica Set để hỗ trợ Transaction khi tạo đơn & trừ kho
MONGODB_URI=mongodb://127.0.0.1:27017/truong_thanh_bookstore?replicaSet=rs0

# ==============================================================================
# 3. REDIS DISTRIBUTED CACHE & THROTTLER
# ==============================================================================
REDIS_URL=redis://localhost:6379           # Quản lý Token Blacklist và Rate-limit

# ==============================================================================
# 4. SECURITY & JWT (BẮT BUỘC RIÊNG BIỆT - FAIL-CLOSED Ở PRODUCTION)
# ==============================================================================
# 3 secret keys này PHẢI HOÀN TOÀN KHÁC NHAU, tối thiểu 32 ký tự ngẫu nhiên
JWT_SECRET=ThayTheBangChuoiBiMatAccessNgauNhienItNhat32KyTu!2026
JWT_REFRESH_SECRET=ThayTheBangChuoiRefreshNgauNhienItNhat32KyTu!2026
JWT_RESET_SECRET=ThayTheBangChuoiResetNgauNhienItNhat32KyTu!2026
JWT_EXPIRES_IN=15m                         # Thời hạn Access Token
JWT_REFRESH_EXPIRES_IN=30d                 # Thời hạn Refresh Token

# ==============================================================================
# 5. COOKIE SECURITY
# ==============================================================================
COOKIE_SAME_SITE=lax                       # 'lax' cho local | 'none' nếu FE/BE khác domain
COOKIE_SECURE=false                        # 'false' cho http://localhost | 'true' cho HTTPS

# ==============================================================================
# 6. SEEDING & KHỞI TẠO DỮ LIỆU AN TOÀN
# ==============================================================================
AUTO_SEED=false                            # Mặc định TẮT. Chỉ bật khi dev cần seed mẫu
RESET_DATABASE_ON_SEED=false               # CẤM bật ở production (Sẽ ném Exception dừng app)
SEED_SUPER_ADMIN_PASSWORD=MatKhauSuperAdminManh123!
SEED_ADMIN_PASSWORD=MatKhauAdminManh123!
SEED_STAFF_PASSWORD=MatKhauStaffManh123!
SEED_CUSTOMER_PASSWORD=MatKhauCustomerManh123!

# ==============================================================================
# 7. CỔNG THANH TOÁN (PAYMENTS)
# ==============================================================================
ENABLED_PAYMENT_METHODS=COD,BANK_TRANSFER  # Cấu hình cổng: COD, BANK_TRANSFER, VNPAY, MOMO
BANK_NAME=MB Bank
BANK_ACCOUNT_NUMBER=0123456789
BANK_ACCOUNT_NAME=CONG TY TNHH TRUONG THANH

# Cổng VNPay (Tùy chọn)
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/checkout/payment-result

# Cổng MoMo (Tùy chọn)
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create

# ==============================================================================
# 8. TÍCH HỢP BÊN THỨ 3 (OPTIONAL)
# ==============================================================================
# Cloudinary (Lưu trữ ảnh bìa sách & banner)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# SMTP Email (Gửi mã OTP & Email hóa đơn)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM="Trường Thành Bookstore" <no-reply@truongthanh.vn>

# Firebase Admin SDK (Gửi Push Notification)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Sentry (Giám sát lỗi 500)
SENTRY_DSN=
```

#### 🔹 Frontend: File `frontend/.env` (Tạo từ `frontend/.env.example`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME="Trường Thành Bookstore"
```

---

### 4.3. Cách Khởi Chạy Dự Án Cục Bộ (Local Development)

#### 🚀 Cách 1: Chạy trực tiếp từng phân hệ (Khuyến nghị khi lập trình)

```bash
# -------------------------------------------------------------
# Bước 1: Khởi động cơ sở dữ liệu MongoDB ReplicaSet & Redis qua Docker
# -------------------------------------------------------------
docker compose up -d mongodb redis

# -------------------------------------------------------------
# Bước 2: Khởi chạy Backend API (Terminal 1)
# -------------------------------------------------------------
cd backend
npm install
npm run start:dev
# API hoạt động tại: http://localhost:3000/api
# Tài liệu Swagger: http://localhost:3000/api/docs (Chỉ hiển thị ở development)

# -------------------------------------------------------------
# Bước 3: Khởi chạy Web Frontend (Terminal 2)
# -------------------------------------------------------------
cd frontend
npm install
npm run dev
# Giao diện Web mở tại: http://localhost:5173

# -------------------------------------------------------------
# Bước 4: Khởi chạy Mobile App (Terminal 3 - Tùy chọn)
# -------------------------------------------------------------
cd mobile
flutter pub get
flutter run
```

#### 🐳 Cách 2: Khởi chạy toàn bộ hệ thống bằng Docker Compose

```bash
# Tại thư mục gốc:
docker compose up -d --build

# Các dịch vụ được khởi chạy:
# - Frontend Web:    http://localhost:80
# - Backend REST API: http://localhost:3000/api
# - Swagger Docs:     http://localhost:3000/api/docs
```

---

## 5. 🔐 Bảo mật, Xác thực & Phiên làm việc (Authentication & Token Security)

### 5.1. Cơ chế Đăng nhập Lai (Hybrid Authentication)
Hệ thống giải quyết triệt để rủi ro bảo mật trên từng nền tảng khách hàng:
1. **Web Browser Clients:**
   - `access_token` được lưu trong cookie `HttpOnly, Secure, SameSite=Lax`, thời hạn 15 phút.
   - `refresh_token` được lưu trong cookie `HttpOnly, Secure, SameSite=Lax`, giới hạn path `/api/auth`, thời hạn 30 ngày.
   - JavaScript trên trình duyệt **hoàn toàn không thể đọc cookie**, triệt tiêu nguy cơ bị đánh cắp token qua lỗ hổng XSS.
   - Các mutation requests gửi kèm header `x-requested-with` / CSRF check.
2. **Mobile Native Clients (Flutter):**
   - Ứng dụng gửi header `x-client-platform: mobile`.
   - Backend phản hồi token trực tiếp trong response body (`data.accessToken`, `data.refreshToken`) để lưu trữ vào **Secure Keystore** (Android) hoặc **Keychain** (iOS).

### 5.2. Nguyên tắc Cô lập Loại Token (Token Type Isolation)
Nhằm chống lại tấn công nhầm lẫn token (Token Type Confusion):
- **Access Token:** Payload có `type: 'access'`. Chỉ được chấp nhận để xác thực các API nghiệp vụ thông thường.
- **Refresh Token:** Payload có `type: 'refresh'`. Ký bằng secret độc lập `JWT_REFRESH_SECRET`. Chỉ được chấp nhận tại endpoint `/api/auth/refresh`. Nếu gửi vào endpoint nghiệp vụ sẽ bị chặn với lỗi `401 Unauthorized` (`ERR_INVALID_TOKEN`).
- **Reset Password Token:** Payload có `type: 'RESET_PASSWORD'`. Ký bằng `JWT_RESET_SECRET`. Chỉ được chấp nhận tại `/api/auth/reset-password`.

### 5.3. Xoay vòng Token & Phát hiện Đánh cắp Phiên (Token Rotation & Reuse Detection)
- Khi gọi `/api/auth/refresh`, Refresh Token cũ sẽ bị hủy ngay lập tức và cấp phát cặp token mới.
- Hash SHA-256 của refresh token hợp lệ được lưu trong `user.refreshTokenHash`.
- **Phát hiện tái sử dụng (Reuse Attack):** Nếu một refresh token đã từng được sử dụng trước đó bị gửi lại:
  1. Hệ thống nhận diện phiên đăng nhập bị tấn công đánh cắp.
  2. Lập tức xóa `refreshTokenHash` và tăng `user.tokenVersion = user.tokenVersion + 1`.
  3. Toàn bộ phiên đăng nhập của tài khoản trên mọi thiết bị bị vô hiệu hóa tức thì.
  4. Trả về mã lỗi `401 Unauthorized` (`ERR_REFRESH_TOKEN_REUSE`).

### 5.4. Thu hồi Phiên & Token Blacklist Phân tán
- **Khi Đăng xuất (Logout):** JTI của Access token được lưu vào Redis Blacklist (`SETEX bl:jti:{jti}`) với thời gian sống (TTL) bằng thời hạn còn lại của token.
- **Khi Đổi mật khẩu:** Trường `tokenVersion` trong User được tăng lên (+1). Mọi token cũ có `payload.tokenVersion < user.tokenVersion` đều bị từ chối ngay lập tức (`ERR_TOKEN_REVOKED`).

---

## 6. 🛡️ Ma trận Phân quyền & Endpoint Bảo vệ (RBAC & Protected Endpoints)

Hệ thống quản lý truy cập theo mô hình **Role-Based Access Control (RBAC)** kết hợp **Staff Permissions**.

### 6.1. 4 Vai trò Người dùng (`UserRole`)
1. `SUPER_ADMIN`: Toàn quyền tối cao, quản trị các tài khoản quản trị viên khác và thay đổi role.
2. `ADMIN`: Quản trị toàn bộ nghiệp vụ (sản phẩm, đơn hàng, kho, khuyến mãi, báo cáo doanh thu).
3. `STAFF`: Nhân viên vận hành, được phân quyền chi tiết theo 8 quyền năng (`StaffPermission`):
   - `MANAGE_ORDERS`: Xem, duyệt, cập nhật trạng thái đơn, in hóa đơn PDF.
   - `MANAGE_PRODUCTS`: Tạo, sửa sản phẩm, danh mục, kiểm duyệt đánh giá.
   - `MANAGE_INVENTORY`: Tạo phiếu nhập kho, xuất kho, điều chỉnh kho.
   - `VIEW_REPORTS`: Xem báo cáo doanh thu, sản phẩm bán chạy, khách hàng tiềm năng.
   - `MANAGE_CUSTOMERS`: Quản trị danh sách khách hàng, cập nhật điểm loyalty.
   - `MANAGE_PROMOTIONS`: Tạo, sửa, đóng/mở mã giảm giá.
   - `MANAGE_BANNERS`: Đăng banner tiếp thị trên trang chủ.
   - `MANAGE_LANDING_PAGES`: Quản trị nội dung các trang landing page Flash Sale.
4. `CUSTOMER`: Khách hàng thành viên, quản lý giỏ hàng, đặt hàng, sổ địa chỉ cá nhân, lịch sử đơn của mình, đánh giá sản phẩm.

### 6.2. Ma trận Quyền hạn Chi tiết

| Module API | Hành động / Endpoint | Phân quyền yêu cầu | Mã lỗi khi vi phạm |
|---|---|---|:---:|
| **Auth** | Đăng ký, Đăng nhập, Quên mật khẩu | Công khai (Public) | - |
| | Lấy thông tin cá nhân (`GET /auth/me`) | Mọi user đã đăng nhập | 401 |
| **Users** | Xem danh sách người dùng (`GET /users`) | `ADMIN`, `SUPER_ADMIN` hoặc Staff có `MANAGE_CUSTOMERS` | 401 / 403 |
| | Cập nhật Vai trò người dùng (`PATCH /users/:id/role`) | Duy nhất `SUPER_ADMIN` | 403 |
| | Khóa / Mở tài khoản (`PATCH /users/:id/status`) | `ADMIN`, `SUPER_ADMIN` | 403 |
| **Products** | Xem danh sách / Chi tiết sản phẩm active | Công khai (Public) | - |
| | Tạo mới, Sửa, Xóa sản phẩm | `ADMIN`, `SUPER_ADMIN` hoặc Staff có `MANAGE_PRODUCTS` | 401 / 403 |
| | Xuất file Excel danh mục sản phẩm | `ADMIN`, `SUPER_ADMIN` hoặc Staff có `MANAGE_PRODUCTS` | 401 / 403 |
| **Orders** | Tạo đơn hàng (Guest & Auth) | Công khai / Khách hàng thành viên | 400 nếu sai giá/kho |
| | Xem toàn bộ đơn hàng hệ thống (`GET /orders`) | `ADMIN`, `SUPER_ADMIN` hoặc Staff có `MANAGE_ORDERS` | 401 / 403 |
| | Xem đơn của chính mình (`GET /orders/my-orders`) | Khách hàng đăng nhập | 401 |
| | Xem chi tiết 1 đơn hàng (`GET /orders/:id`) | Staff `MANAGE_ORDERS` / Khách sở hữu đơn (IDOR Guard) | 401 / 403 |
| | Cập nhật trạng thái đơn (`PATCH /orders/:id/status`) | Staff có `MANAGE_ORDERS` / `ADMIN` | 401 / 403 |
| | Tải Hóa đơn PDF (`GET /orders/:id/invoice`) | Staff `MANAGE_ORDERS` / Khách sở hữu đơn | 401 / 403 |
| **Inventory** | Xem sổ cái giao dịch, tạo phiếu nhập/xuất | Staff có `MANAGE_INVENTORY` / `ADMIN` | 401 / 403 |
| **Reports** | Xem báo cáo tài chính & dashboard (`/reports/*`)| Staff có `VIEW_REPORTS` / `ADMIN` | 401 / 403 |
| **Promotions**| Tạo / Sửa mã khuyến mãi | Staff có `MANAGE_PROMOTIONS` / `ADMIN` | 401 / 403 |
| | Áp dụng mã giảm giá khi checkout | Mọi khách hàng (Public / Customer) | - |
| **Banners** | Xem banner đang chạy & popup mở trang (`GET /banners/active`, `GET /banners/active-popup`) | Công khai (Public) | - |
| | Quản trị Banner & Popup (`GET /banners`, `POST`, `PATCH`, `DELETE`) | Staff có `MANAGE_BANNERS` / `ADMIN` | 401 / 403 |

---

## 7. 🛍️ Quy tắc Nghiệp vụ Cốt lõi (Core Commerce Business Rules)

### 7.1. Giỏ hàng & Miễn phí Vận chuyển
- **Ngưỡng Miễn phí Vận chuyển:** `299.000 VNĐ`.
  - Nếu `Subtotal >= 299.000đ` ➔ Phí vận chuyển = `0đ` (Freeship).
  - Nếu `Subtotal < 299.000đ` ➔ Phí vận chuyển = `30.000đ`.
- **Khóa giá từ Máy chủ (Server-side Pricing):** Giá bán và giá khuyến mãi luôn được truy vấn và tính toán trực tiếp từ CSDL. Backend **tuyệt đối không tin tưởng giá tiền từ Client** để chống gian lận chỉnh sửa giá trên trình duyệt.

---

### 7.2. Máy Trạng thái Đơn hàng (Order State Machine & Refund Flow)

Vòng đời đơn hàng và hoàn tiền tuân thủ nghiêm ngặt theo đồ thị trạng thái:

```text
       ┌──────────┐
       │ PENDING  │ (Chờ xác nhận đơn)
       └────┬─────┘
            │
            ├──────────────────────────────┐
            ▼                              ▼
     ┌───────────┐                  ┌───────────┐
     │ CONFIRMED │ (Đã duyệt đơn)   │ CANCELLED │ ➔ [ Hoàn kho, hoàn điểm, voucher & kích hoạt Refund nếu PAID ]
     └─────┬─────┘                  └───────────┘
           │                               ▲
           ▼                               │
    ┌────────────┐                         │
    │ PROCESSING │ (Đang đóng gói) ────────┘ (Chỉ Admin/Staff được hủy kèm lý do; Khách không tự hủy qua app)
    └──────┬─────┘
           │
           ▼
     ┌──────────┐
     │ SHIPPING │ (Đang giao hàng)
     └─────┬────┘
           │
           ├──────────────────────────────┐
           ▼                              ▼
    ┌───────────┐                  ┌──────────┐
    │ DELIVERED │ (Giao thành công)│ RETURNED │ ➔ [ Thu hồi điểm, hoàn kho & kích hoạt Refund nếu PAID ]
    └─────┬─────┘                  └──────────┘
           │                              ▲
           ├──────────────┐               │
           ▼              ▼               │
    ┌───────────┐  ┌──────────────────┐   │
    │ COMPLETED │  │ RETURN_REQUESTED │───┘ (Admin duyệt ➔ RETURNED; Admin từ chối ➔ DELIVERED)
    └───────────┘  └──────────────────┘     (Khách yêu cầu trong vòng 7 ngày kể từ DELIVERED)
```

**Bảng Chuyển trạng thái Hợp lệ:**
- `PENDING` ➔ `CONFIRMED`, `CANCELLED`
- `CONFIRMED` ➔ `PROCESSING`, `CANCELLED`
- `PROCESSING` ➔ `SHIPPING`, `CANCELLED` (Chỉ Admin/Staff được hủy kèm lý do; Khách hàng không thể tự hủy)
- `SHIPPING` ➔ `DELIVERED`
- `DELIVERED` ➔ `COMPLETED`, `RETURN_REQUESTED`, `RETURNED`
- `RETURN_REQUESTED` ➔ `RETURNED` (Admin duyệt), `DELIVERED` (Admin từ chối)
- `COMPLETED` ➔ `RETURN_REQUESTED`, `RETURNED` (Trong thời hạn 7 ngày đổi trả)
- `CANCELLED`, `RETURNED` ➔ *(Trạng thái kết thúc - Không chuyển tiếp)*

> Mọi thao tác chuyển đổi sai quy tắc (ví dụ: `SHIPPING` nhảy sang `CANCELLED`, hoặc khách hàng tự hủy khi `PROCESSING`) đều bị từ chối với lỗi `400 Bad Request`.

---

### 7.3. Vòng Đời Hoàn Tiền & An Toàn Thanh Toán (Refund Flow & Payment Safety)
- **Vòng đời `RefundStatus`:** `NONE` ➔ `REQUESTED` ➔ `PROCESSING` ➔ `REFUNDED` / `FAILED` / `MANUAL_REQUIRED`.
- **Quy tắc bất biến (Invariance Rule):** Tuyệt đối không bao giờ tồn tại trạng thái `orderStatus = CANCELLED | RETURNED` và `paymentStatus = PAID` nhưng `refundStatus = NONE`. Hệ thống tự động gán `refundStatus = REQUESTED` và `refundAmount = order.total`.
- **Khóa chống hoàn tiền 2 lần (Anti Double-Refund Lock):** Áp dụng conditional atomic update `findOneAndUpdate({ _id, refundStatus: { $in: [NONE, REQUESTED, FAILED, MANUAL_REQUIRED] } }, { $set: { refundStatus: PROCESSING } })`. Nếu có 2 request đồng thời, chỉ có 1 request được thực hiện, request còn lại bị từ chối với `409 ConflictException`.
- **Tính nhất quán nguyên tử (Atomic Consistency):** Cập nhật trạng thái `Payment` và `Order` trong một MongoDB Multi-document Transaction (`ClientSession`), có fallback tuần tự an toàn khi Mongo standalone.
- **Chống giả mạo Webhook & Sai lệch số tiền (Amount Tampering):** So khớp số tiền callback với đơn hàng; nếu sai lệch sẽ đóng băng Payment thành `FAILED`, chuyển Order thành `MANUAL_REQUIRED` và ném `BadRequestException`. Hỗ trợ Idempotent Replay chống xử lý lặp IPN.
- **Timeout bên thứ ba (`AbortController`):** HTTP wrapper tự động ngắt kết nối sau 5s với cổng thanh toán (VNPay, MoMo) và 8s với email SMTP, trả lỗi chuẩn `503 ServiceUnavailableException`.

---

### 7.3. Khấu trừ Tồn kho Nguyên tử & Sổ cái Giao dịch Kho
- **Khấu trừ nguyên tử:** Tồn kho được trừ ngay lúc tạo đơn bằng truy vấn MongoDB nguyên tử:
  ```typescript
  await this.productModel.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity, sold: quantity } }
  );
  ```
  Nếu có bất kỳ sản phẩm nào không đủ tồn kho, transaction sẽ rollback 100%, không xảy ra tình trạng bán vượt tồn kho (overselling).
- **Hoàn trả kho khi Hủy / Trả hàng:** Khi đơn chuyển sang `CANCELLED` hoặc `RETURNED`, hệ thống tự động cộng lại tồn kho (`$inc: +quantity`) và giảm bộ đếm `sold`.
- **Sổ cái kho (`InventoryTransaction`):** Mọi biến động đều được lưu vết với 5 loại: `IMPORT` (Nhập hàng), `SALE` (Xuất bán), `RETURN` (Hoàn trả), `ADJUSTMENT` (Kiểm kê điều chỉnh), `DAMAGE` (Hư hỏng xuất hủy).

---

### 7.4. Tự động Hủy Đơn Treo (Auto-Cancel Timeout)
Hệ thống chạy Cron Job định kỳ 15 phút để tự động hủy đơn `PENDING` quá hạn giữ kho:
- **Đơn thanh toán online / Chuyển khoản:** Hủy sau **24 giờ** kể từ lúc tạo đơn.
- **Đơn COD chưa liên lạc được:** Hủy sau **48 giờ** kể từ lúc tạo đơn.
- **Thông báo nhắc trước:** Hệ thống tự động gửi Push Notification và Email trước thời điểm hủy **2 giờ** (ở mốc 22h hoặc 46h).

---

### 7.5. Điểm thưởng Loyalty & Hạng Thành viên
- **Mốc cộng điểm:** Điểm thưởng được cộng cho khách **chính xác tại thời điểm đơn hàng đạt `DELIVERED`** (hoặc `COMPLETED`). Đơn chuyển khoản/online phải có `paymentStatus = PAID`. Tuyệt đối không cộng điểm lúc tạo đơn `PENDING`.
- **Idempotency:** Cờ `loyaltyAwarded: true` bảo đảm không bị cộng điểm lặp lần hai.
- **Tỷ lệ Tích điểm:** 1.000 VNĐ tiền hàng thực trả = 1 điểm: `floor((subtotal - discount - loyaltyDiscount) / 1000)`.
- **Tỷ lệ Tiêu điểm:** 1 điểm = 100 VNĐ giảm trực tiếp tại Checkout.
  - Ngưỡng tối thiểu tiêu điểm: **1.000 điểm** (= 100.000 VNĐ).
  - Trần tối đa: **Không quá 20% Subtotal** đơn hàng.
  - Trừ điểm nguyên tử `$gte` tại `OrdersService.create()`.
  - Tự động hoàn trả điểm đầy đủ vào tài khoản khách khi đơn bị `CANCELLED` hoặc `RETURNED`.

---

### 7.6. Đơn hàng Landing Page
- Các gói sản phẩm trên Landing Page **bắt buộc cấu hình Product ID thật** trong CSDL.
- Luồng gửi đơn gọi qua pipeline chuẩn `OrdersService.create()`, trừ kho thật, ghi sổ cái `SALE`, hỗ trợ `Idempotency-Key` và không sinh email giả mạo.

---

### 7.7. Báo cáo Doanh thu Thuần (Realized Net Revenue)
- **Doanh thu được ghi nhận:** Chỉ tính các đơn đã thanh toán (`PAID`) hoặc đã giao thành công (`DELIVERED`, `COMPLETED`).
- **Loại trừ tuyệt đối:** Đơn hủy (`CANCELLED`), đơn hoàn trả (`RETURNED`), đơn treo (`PENDING`).
- Doanh thu theo danh mục được tính toán từ snapshot giá tại thời điểm đặt hàng: `items[].price * items[].quantity`.

---

### 7.8. Quảng cáo Mở Trang & Quản trị Banner Tiếp thị (Entry Popup Ad & Banners)
- **Vị trí `ENTRY_POPUP` (`entry_popup`):** Banner dạng cửa sổ nổi phủ toàn màn hình (interstitial modal) với lớp nền tối mờ (`bg-black/65 backdrop-blur-xs`), hiển thị tự động khi khách hàng truy cập bất kỳ trang nào thuộc Storefront.
- **Quy tắc Single Active Popup:** Tại một thời điểm, hệ thống chỉ cho phép tối đa 1 quảng cáo mở trang ở trạng thái hoạt động (`isActive = true`). Khi Admin kích hoạt một popup mới, hệ thống tự động vô hiệu hóa (`isActive = false`) các popup quảng cáo đang chạy khác.
- **Cách ly Banner Trang chủ:** API công khai `GET /banners/active` luôn loại trừ `ENTRY_POPUP`, đảm bảo các slider, carousel và banner sidebar trang chủ không bị ảnh hưởng.
- **Tần suất Hiển thị (Display Frequency):**
  - `EVERY_VISIT` (Mặc định): Hiển thị mỗi khi tải/mở lại trang web.
  - `ONCE_PER_SESSION`: Chỉ hiển thị 1 lần duy nhất trong phiên duyệt web (lưu khóa `sessionStorage` kèm `_id` và `updatedAt`). Khi Admin đổi nội dung popup, khóa đổi mới giúp khách hàng thấy ngay nội dung mới.
  - `ONCE_PER_DAY`: Chỉ hiển thị 1 lần trong ngày (lưu khóa `localStorage` kèm ngày `YYYY-MM-DD`).
- **Lập lịch Thời gian Thực (Schedule Start/End):** Backend kiểm tra thời gian hiện tại so với `startAt` và `endAt`. Quảng cáo hết hạn hoặc chưa tới giờ bắt đầu sẽ tự động không được trả về `GET /banners/active-popup`.
- **Tự động Lưu trữ Cloudinary & Fallback:** Ảnh tải lên qua Admin CMS được tự động đẩy lên thư mục `truong_thanh_banners` của Cloudinary và lưu URL bảo mật vào database. Nếu môi trường thử nghiệm chưa khai báo thông tin Cloudinary, hệ thống sẽ tự động chuyển sang cơ chế lưu trữ an toàn mà không gây crash hoặc lỗi.
- **An toàn Đường dẫn (URL Sanitization):** Hệ thống lọc và từ chối toàn bộ các đường link chứa mã script độc hại (`javascript:`, `data:`, `vbscript:`), chỉ chấp nhận các đường dẫn web hợp lệ (`http://`, `https://`) hoặc đường dẫn tương đối nội bộ (`/path`).

---

## 8. 📡 Chuẩn Giao tiếp API & Thời gian thực (API Envelope & WebSocket)

### 8.1. Cấu trúc Phản hồi API Đồng nhất

#### ✅ Phản hồi Thành Công (HTTP 200 / 201):
```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### ❌ Phản hồi Thất Bại (HTTP 400 / 401 / 403 / 404 / 500):
```json
{
  "success": false,
  "message": "Dữ liệu yêu cầu không hợp lệ",
  "errorCode": "ERR_VALIDATION",
  "details": [
    { "field": "email", "errors": ["Email không đúng định dạng"] }
  ]
}
```

### 8.2. Giao tiếp WebSocket Thời gian thực
- **Namespace:** `/notifications`
- **Sự kiện Server phát ra:**
  - `new_order`: Bắn tới Admin CMS khi có khách hàng vừa tạo đơn mới.
  - `order_status_updated`: Bắn tới Web/Mobile của khách hàng khi trạng thái đơn thay đổi.
  - `stock_alert`: Cảnh báo Admin khi tồn kho một sản phẩm giảm xuống dưới 10.

---

## 9. 🧪 Kiểm thử Tự động & Quy trình CI/CD (Testing & Deployment Pipelines)

### 9.1. Lệnh Chạy Kiểm thử Cục bộ

```bash
# -------------------------------------------------------------
# 1. Kiểm thử Backend (NestJS + Jest)
# -------------------------------------------------------------
cd backend
npm test -- --runInBand        # Chạy toàn bộ 41 suites / 450 unit tests
npm run test:e2e -- --runInBand # Chạy bộ test E2E với MongoDB ReplicaSet
npm run lint                   # Kiểm tra chất lượng mã nguồn bằng ESLint
npm run build                  # Biên dịch NestJS production bundle

# -------------------------------------------------------------
# 2. Kiểm thử Frontend Web (Vue 3 + Vitest + Playwright)
# -------------------------------------------------------------
cd frontend
npm run test:unit              # Chạy Vitest cho stores và components
npm run build                  # Typecheck bằng vue-tsc và build Vite
npm run test:e2e               # Chạy 5 kịch bản Playwright E2E trình duyệt

# -------------------------------------------------------------
# 3. Kiểm thử Mobile App (Flutter)
# -------------------------------------------------------------
cd mobile
flutter analyze                # Phân tích tĩnh cú pháp Dart
flutter test                   # Chạy toàn bộ 42 unit & widget tests
```

### 9.2. Quy trình CI/CD Tự động hóa
Mọi commit push lên nhánh `main` hoặc Pull Request đều tự động kích hoạt workflow `.github/workflows/ci.yml`:
1. **Security Scan:** Quét rò rỉ secret bằng `gitleaks`.
2. **Backend Job:** Chạy Jest unit tests, linting, build bundle.
3. **Frontend Job:** Chạy `vue-tsc` typecheck, build Vite bundle, Vitest.
4. **Playwright E2E Job:** Khởi động backend & frontend và chạy kiểm thử tự động trên trình duyệt Chromium.
5. **Deploy Gate:** Kịch bản `deploy.yml` chỉ kích hoạt sau khi CI xanh 100%.

---

## 10. 📘 Cẩm nang Dành cho Intern & Lập trình viên Mới

### 10.1. Những Nguyên Tắc Bất Biến (Golden Rules)
1. **Không Hardcode Secrets:** Tuyệt đối không viết trực tiếp URL database, mật khẩu, JWT key vào source code. Luôn đọc từ `ConfigService` (Backend) hoặc `import.meta.env` (Frontend).
2. **Phân tách Đúng Trách nhiệm:**
   - `Controller`: Chỉ validate DTO qua pipe, điều hướng tới service và trả kết quả. Không viết logic tính toán tại controller.
   - `Service`: Nơi chứa 100% logic nghiệp vụ, giao dịch MongoDB Session, gửi mail, bắn thông báo.
   - `DTO`: Khai báo decorator validation chi tiết (`@IsNotEmpty`, `@IsNumber`, `@Min`, `@Max`).
3. **Không Sử Dụng Kiểu `any` Bừa Bãi:** Luôn định nghĩa Interface/Type rõ ràng ở cả Backend DTO và Frontend `src/types/`.
4. **Viết Test Kèm Theo Feature:** Mọi chỉnh sửa liên quan đến giá tiền, tồn kho, phân quyền đều bắt buộc phải có Unit Test đi kèm.

---

### 10.2. Hướng dẫn Từng Bước: Cách Thêm Một Tính Năng Mới

#### Bước 1: Backend API
1. Tạo thư mục module mới: `backend/src/modules/<feature-name>/`.
2. Định nghĩa Schema Mongoose trong `schemas/<feature-name>.schema.ts`.
3. Định nghĩa Request DTO trong `dto/` kèm class-validator decorators.
4. Viết Business Logic trong `<feature-name>.service.ts`.
5. Tạo endpoint REST trong `<feature-name>.controller.ts` kèm Guard phân quyền (`@UseGuards(JwtAuthGuard, RolesGuard)`).
6. Đăng ký Module vào `backend/src/app.module.ts`.
7. Viết unit test trong `<feature-name>.service.spec.ts` và chạy `npm test`.

#### Bước 2: Frontend Web
1. Khai báo TypeScript Interface trong `frontend/src/types/index.ts`.
2. Viết hàm gọi API trong `frontend/src/services/<feature-name>.service.ts`.
3. Tạo Pinia Store trong `frontend/src/stores/<feature-name>.ts` (nếu cần chia sẻ state).
4. Tạo Component/Trang giao diện trong `frontend/src/pages/admin/` hoặc `frontend/src/pages/customer/`.
5. Đăng ký route trong `frontend/src/router/index.ts` kèm `meta.requiresAuth` hoặc `meta.roles`.

---

### 10.3. Checklist Kiểm Tra Trước Khi Mở Pull Request (PR Checklist)
- [ ] Đã chạy `npm test` ở backend và toàn bộ unit tests đều **PASS**.
- [ ] Đã chạy `npm run lint` ở backend và không phát sinh thêm error mới.
- [ ] Đã chạy `npm run build` ở frontend và không có lỗi kiểu dữ liệu TypeScript.
- [ ] Đã kiểm tra `git status` đảm bảo không commit file `.env` thật hoặc private keys.
- [ ] Không có `console.log` chứa mật khẩu, token hoặc thông tin khách hàng nhạy cảm.

---

## 11. 📊 Trạng Thái Hiện Tại Dự Án (Current Project Status)

> **Cập nhật lần cuối:** 2026-09-12

### 11.1. Phase 1: Local MVP — ✅ HOÀN THÀNH 100%

Phase 1 đã triệt tiêu toàn bộ lỗ hổng bảo mật cốt lõi, đảm bảo nhất quán dữ liệu đơn hàng/thanh toán và xây dựng trải nghiệm người dùng mượt mà trên cả Web và Mobile. Tổng cộng **26/26 task** đã hoàn thành.

| Track | Nội dung đã hoàn thành |
| :--- | :--- |
| 🔒 **Bảo mật** (7 task) | Audit Auth/Token/Cookie, RBAC & Chống IDOR, Validation & Chống Mass Assignment, Payload Hardening, Rate Limiting, Secret Scan, Error Sanitize |
| 💳 **Thanh toán** (5 task) | Chính sách Hủy/Trả/Hoàn tiền, Refund Lifecycle, Atomic Payment↔Order, Webhook Validation, Timeout bên thứ ba |
| 🐳 **Hạ tầng Local** (5 task) | Node.js 22 LTS, Docker Compose (Mongo RS + Redis), `.env.example`, Seed Data, Hướng dẫn Local |
| 💻 **Frontend UX** (7 task) | Auth Hydration, Refresh Token Queue, Global Error Toast, Skeleton/Empty State, Double Submit Lock, Checkout UX & VietQR, ESLint Config |
| 🛠️ **Tech Debt** (2 task) | Tách OrdersService (Facade Pattern), Tối ưu Index Auto-cancel |
| 🧪 **QA** (4 task) | Auth Security Suite, Payment Idempotent Suite, Race Condition Test, UX Regression Test |

### 11.2. Kết Quả Kiểm Thử Hiện Tại

| Phân hệ | Lệnh | Kết quả |
| :--- | :--- | :---: |
| Backend Unit Tests | `cd backend && npm test` | **43/43 suites, 479/479 tests PASS** |
| Backend Linting | `cd backend && npm run lint` | **0 errors** (1.415 warnings, trần ≤ 1.450 warnings) |
| Backend Build | `cd backend && npm run build` | **Biên dịch thành công** |
| Frontend Unit Tests | `cd frontend && npm run test:unit` | **14/14 suites, 80/80 tests PASS** |
| Frontend TypeCheck | `cd frontend && npm run typecheck` | **0 errors** (vue-tsc -b) |
| Frontend Linting | `cd frontend && npm run lint` | **0 errors** |
| Frontend Build | `cd frontend && npm run build` | **Biên dịch thành công** |
| Mobile Tests | `cd mobile && flutter test` | **42/42 tests PASS** |
| Mobile Analyze | `cd mobile && flutter analyze` | **0 issues** |

### 11.3. Cổng Nghiệm Thu CTO — Đã Đạt 4/4

| Cổng | Trạng thái | Nội dung |
| :--- | :---: | :--- |
| **Bảo mật** | ✅ | Endpoint admin bảo vệ RolesGuard, chống IDOR, DTO validation chặn field lạ, không secret trong repo, error sanitize |
| **Nghiệp vụ** | ✅ | Payment↔Order đồng nhất qua Transaction, RefundStatus minh bạch, Idempotent callback, không overselling |
| **Vận hành** | ✅ | Dev mới clone → khởi động < 15 phút, Docker 1 lệnh, `.env.example` đầy đủ, Seed idempotent |
| **Trải nghiệm** | ✅ | F5 không giật, refresh queue 1 lần, double submit lock, checkout 5 khoản chi phí + VietQR |

### 11.4. Phase 2: Pre-Production — Đang Triển Khai

Chi tiết task Phase 2 xem tại: 👉 [`PENDING_TASKS.md`](PENDING_TASKS.md)

Trọng tâm Phase 2:
- Tích hợp cổng thanh toán VNPay/MoMo sandbox
- Tích hợp vận đơn GHN
- Ký số mobile app & Push notification thật
- Cải thiện Admin UI (ImageUploader, Focus Trap)
- Giảm nợ kỹ thuật (ESLint warnings)

### 11.5. Tài Liệu Lưu Trữ (Archive)

Các tài liệu changelog, audit report và đặc tả tính năng đã hoàn thành được lưu tại `docs/archive/`:
- `SECURITY_LOCAL_MVP_PLAN.md` — Kế hoạch bảo mật & roadmap Phase 1 (26 task đã xong)
- `AUDIT_2026-09-11.md` — Báo cáo audit toàn hệ thống
- `CHANGELOG_FE06_BE05_BE06_BE07_FE07.md` — Changelog 5 tickets FE/BE
- `CHANGELOG_QA03_QA04.md` — Changelog kiểm thử QA
- `ENTRY_POPUP_ADVERTISEMENT.md` — Đặc tả tính năng Entry Popup
- `LOCAL_SETUP_GUIDE.md` — Hướng dẫn khởi động local chi tiết

---
*Tài liệu này được duy trì chính thức cho dự án Nhà sách Trường Thành.*  
*Để xem các công việc cần làm tiếp theo, xem:* 👉 [`docs/PENDING_TASKS.md`](PENDING_TASKS.md)
