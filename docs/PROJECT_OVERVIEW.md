# 📚 TRƯỜNG THÀNH BOOKSTORE — TÀI LIỆU TỔNG QUAN & HƯỚNG DẪN DỰ ÁN TOÀN DIỆN
> **Phiên bản tài liệu:** 2.0 (Cập nhật sau Technical Audit)  
> **Đối tượng:** Developer mới, Thực tập sinh (Intern), Quản lý dự án & Trợ lý AI (AI Agents).  
> **Mục tiêu:** Giúp bất kỳ ai (người hoặc AI) có thể đọc hiểu 100% kiến trúc, cấu hình môi trường, quy tắc nghiệp vụ, luồng dữ liệu và tiếp tục phát triển/bảo trì dự án mà không gặp rào cản.

---

## 📑 MỤC LỤC
1. [🌟 Giới thiệu Tổng quan Dự án (Executive Summary)](#1--giới-thiệu-tổng-quan-dự-án-executive-summary)
2. [🏗️ Kiến trúc Hệ thống & Công nghệ (Architecture & Tech Stack)](#2-️-kiến-trúc-hệ-thống--công-nghệ-architecture--tech-stack)
3. [📁 Sơ đồ Cấu trúc Mã nguồn (Project Structure & Modules Map)](#3--sơ-đồ-cấu-trúc-mã-nguồn-project-structure--modules-map)
4. [⚙️ Hướng dẫn Cài đặt & Cấu hình Môi trường (Setup & Environment Guide)](#4-️-hướng-dẫn-cài-đặt--cấu-hình-môi-trường-setup--environment-guide)
5. [🔐 Xác thực, Phân quyền & Bảo mật (Auth & Security Architecture)](#5--xác-thực-phân-quyền--bảo-mật-auth--security-architecture)
6. [🛍️ Quy tắc Nghiệp vụ Cốt lõi (Core Commerce Business Logic)](#6-️-quy-tắc-nghiệp-vụ-cốt-lõi-core-commerce-business-logic)
7. [📡 Đặc tả API & Giao tiếp Thời gian thực (API & Realtime WebSocket)](#7--đặc-tả-api--giao-tiếp-thời-gian-thực-api--realtime-websocket)
8. [🧪 Kiểm thử & Quy trình CI/CD (Testing & Deployment Pipelines)](#8--kiểm-thử--quy-trình-cicd-testing--deployment-pipelines)
9. [🔍 Kế hoạch Xử lý Nợ Kỹ thuật & Hardening (Audit Backlog)](#9--kế-hoạch-xử-lý-nợ-kỹ-thuật--hardening-audit-backlog)
10. [📘 Cẩm nang Dành cho Intern / Developer Mới & Trợ lý AI](#10--cẩm-nang-dành-cho-intern--developer-mới--trợ-lý-ai)

---

## 1. 🌟 Giới thiệu Tổng quan Dự án (Executive Summary)

### 1.1. Dự án là gì?
**Trường Thành Bookstore** là nền tảng thương mại điện tử đa kênh (**Omni-channel E-commerce**) chuyên cung cấp:
- **Sách:** Sách giáo khoa, sách tham khảo, truyện tranh thiếu nhi, văn học, kỹ năng sống, sách ngoại ngữ.
- **Văn phòng phẩm & Dụng cụ học tập:** Bút, vở, thước kẻ, máy tính cầm tay, dụng cụ vẽ, màu vẽ, cặp sách, bìa hồ sơ.
- **Đồ chơi giáo dục & Quà tặng:** Đồ chơi phát triển trí tuệ, mô hình lắp ráp, đồ lưu niệm.

### 1.2. Các kênh tương tác (Touchpoints)
1. **Web Khách hàng (Storefront):** Khách hàng tìm kiếm sản phẩm, lọc theo giá/danh mục/thương hiệu, thêm giỏ hàng, áp mã khuyến mãi, đặt hàng (hỗ trợ cả tài khoản thành viên và khách vãng lai), theo dõi đơn hàng và đánh giá sản phẩm.
2. **Web Quản trị (Admin Dashboard CMS):** Dành cho quản trị viên (Admin) quản lý sản phẩm, cây danh mục, kho hàng (phiếu nhập/xuất/điều chỉnh), đơn hàng, khuyến mãi, khách hàng, banner quảng cáo, báo cáo doanh thu tài chính và xuất/nhập danh sách sản phẩm bằng Excel.
3. **Ứng dụng Di động (Mobile App - iOS & Android):** Trải nghiệm mua sắm nhanh, nhận thông báo đẩy tức thì (thông báo đơn hàng, flash sale), đồng bộ giỏ hàng và danh sách yêu thích với Web.

---

## 2. 🏗️ Kiến trúc Hệ thống & Công nghệ (Architecture & Tech Stack)

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
                    │ WebSocket (Socket.IO notifications)     │
                    ▼                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API LAYER (NestJS v11)                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│ - Global: ValidationPipe (DTOs), HttpExceptionFilter, TransformInterceptor       │
│ - Security: Helmet, CORS Whitelist, Throttler Rate Limiting, Input Sanitization  │
│ - Auth Engine: Passport JWT, Refresh Token Rotation, Token Blacklist, OTP SHA256 │
│ - Business Modules (16 modules): Auth, Users, Products, Categories, Cart, Orders,│
│   Payments, Inventory, Reviews, Promotions, Notifications, Reports, Banners...   │
│ - Realtime Gateway: Socket.IO WebSocket Server (Namespace /notifications)       │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                       DATABASE & THIRD-PARTY SERVICES LAYER                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 🗄️ MongoDB (v7.0)           : Cơ sở dữ liệu chính (Mongoose ODM, Compound Index) │
│ ☁️ Cloudinary Storage        : Lưu trữ ảnh sản phẩm, ảnh danh mục, avatar       │
│ 📧 Nodemailer (SMTP/Gmail)  : Gửi email OTP đặt lại mật khẩu, hóa đơn đơn hàng  │
│ 📊 Google Apps Script Sync  : Tự động đồng bộ đơn hàng sang Google Sheets (Ops) │
│ 💳 Cổng Thanh toán          : COD, Chuyển khoản QR, VNPay, MoMo Gateway          │
│ 🤖 Google Gemini AI (Ops)   : Hỗ trợ sinh nội dung banner & landing page (tùy chọn)│
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2. Bảng Công nghệ (Tech Stack Breakdown)

| Phân hệ | Công nghệ lõi | Thư viện & Công cụ chính |
| :--- | :--- | :--- |
| **Backend** | NestJS v11 (Node.js 20+, TypeScript) | `@nestjs/mongoose`, `mongoose v9`, `@nestjs/jwt`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `helmet`, `@nestjs/throttler`, `pdfkit` (xuất PDF), `exceljs` (Excel Import/Export), `socket.io`, `@nestjs/swagger` |
| **Frontend** | Vue 3 (Composition API, `<script setup>`), Vite 8, TypeScript | `pinia` (State Management), `vue-router v4`, `tailwindcss v4`, `axios`, `chart.js` + `vue-chartjs`, `vue-toastification`, `vue-i18n`, `lucide-vue-next` |
| **Mobile** | Flutter SDK (^3.11), Dart | `provider` (State), `http`, `shared_preferences`, `cached_network_image`, `shimmer`, `intl`, `google_fonts` |
| **Database** | MongoDB 7.0 (Mongoose Schemas) | Compound Indexes, Text Indexes diacritic-insensitive, Timestamps |
| **DevOps / CI** | Docker, Docker Compose, GitHub Actions | GitHub Actions CI (Backend, Frontend, Mobile), Vercel (FE Deploy), Render (BE Deploy) |

---

## 3. 📁 Sơ đồ Cấu trúc Mã nguồn (Project Structure & Modules Map)

### 3.1. Cấu trúc Thư mục Toàn bộ Repository

```text
Truong_Thanh_Bookstore/
├── .github/
│   └── workflows/              # Các kịch bản CI/CD GitHub Actions
│       ├── backend-ci.yml      # CI kiểm thử & build NestJS backend
│       ├── frontend-ci.yml     # CI type-check & build Vue 3 frontend
│       ├── mobile-ci.yml       # CI analyze & test Flutter mobile app
│       └── deploy.yml          # Kịch bản triển khai Vercel & Render
├── backend/                    # 🚀 MÃ NGUỒN BACKEND (NestJS)
│   ├── src/
│   │   ├── main.ts             # Điểm khởi chạy API (CORS, Helmet, Pipes, Swagger)
│   │   ├── app.module.ts       # Module gốc cấu hình DB, Config, Throttler
│   │   ├── common/             # Middleware & Tiện ích dùng chung
│   │   │   ├── decorators/     # @GetUser, @Roles, @Public...
│   │   │   ├── dto/            # DTO dùng chung (PaginationDto, StandardResponse)
│   │   │   ├── enums/          # Enum tập trung (ErrorCode, UserRole, OrderStatus...)
│   │   │   ├── exceptions/     # AppException, BusinessException, ResourceNotFoundException...
│   │   │   ├── filters/        # HttpExceptionFilter (Chuẩn hóa response lỗi toàn cục)
│   │   │   ├── guards/         # JwtAuthGuard, RolesGuard, OptionalJwtGuard
│   │   │   ├── interceptors/   # TransformInterceptor (Đóng gói { success, message, data, meta })
│   │   │   └── validators/     # Custom validators (IsMongoObjectId, IsPhoneNumberVN)
│   │   ├── config/             # Quản lý & Xác thực biến môi trường (.env)
│   │   │   ├── configuration.ts
│   │   │   └── env.validation.ts
│   │   ├── modules/            # 16 Modules nghiệp vụ độc lập (Xem chi tiết mục 3.2)
│   │   └── seeds/              # Script khởi tạo dữ liệu mẫu (Admin, Sản phẩm, Danh mục)
│   ├── test/                   # Jest E2E & Integration Test Suites
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # 🌐 MÃ NGUỒN FRONTEND WEB (Vue 3 + Vite)
│   ├── src/
│   │   ├── main.ts             # Khởi chạy Vue app, nạp Pinia, Router, Toast, i18n
│   │   ├── App.vue             # Root layout component
│   │   ├── assets/             # Hình ảnh, icon, font tĩnh
│   │   ├── components/         # Components giao diện dùng chung (ProductCard, Breadcrumb...)
│   │   ├── composables/        # Vue composables (useDebounce, useFormatCurrency...)
│   │   ├── layouts/            # Layouts mẫu: CustomerLayout.vue, AdminLayout.vue
│   │   ├── pages/              # Các trang giao diện (Khách hàng & Admin CMS)
│   │   ├── router/             # Vue Router cấu hình Route Guards phân quyền
│   │   ├── services/           # Lớp kết nối HTTP Axios tới Backend API
│   │   ├── stores/             # Pinia Stores (auth, cart, product, category, notification...)
│   │   ├── types/              # Định nghĩa kiểu dữ liệu TypeScript Interfaces
│   │   └── utils/              # Tiện ích (api.ts axios interceptor, helpers, formatters)
│   ├── nginx.conf              # Cấu hình Nginx cho Docker frontend production
│   ├── Dockerfile
│   └── package.json
├── mobile/                     # 📱 MÃ NGUỒN MOBILE APP (Flutter)
│   ├── lib/
│   │   ├── main.dart           # Điểm khởi chạy Flutter app
│   │   ├── core/               # Constants, API endpoints, App Theme, Network client
│   │   ├── models/             # Data Models (User, Product, Order, CartItem...)
│   │   ├── providers/          # State Providers (AuthProvider, CartProvider, ProductProvider...)
│   │   ├── screens/            # Màn hình (Home, Product Detail, Cart, Checkout, Profile, Orders...)
│   │   └── widgets/            # Widgets tái sử dụng (ProductGridItem, CustomButton, ShimmerLoading...)
│   └── pubspec.yaml
├── docs/                       # 📖 TÀI LIỆU DỰ ÁN & AUDIT BACKLOG
│   ├── PROJECT_OVERVIEW.md     # Tài liệu tổng quan này (Master Documentation)
│   └── AUDIT_FIX_TASKS.md      # Danh sách backlog sửa lỗi & hardening kỹ thuật
└── docker-compose.yml          # Docker Compose chạy toàn bộ hệ thống (DB, BE, FE, Mongo Express)
```

### 3.2. Bản đồ 16 Module Nghiệp vụ Backend

| STT | Module | Trách nhiệm chính (Responsibilities) |
| :---: | :--- | :--- |
| 1 | **auth** | Đăng ký, đăng nhập, quên/đặt lại mật khẩu (OTP 6 số SHA-256), băm mật khẩu bcrypt, phát hành & quay vòng JWT (Token Rotation), danh sách đen thu hồi token (`TokenBlacklistService`), kiểm soát phiên (`tokenVersion`). |
| 2 | **users** | Quản lý hồ sơ cá nhân, đổi mật khẩu, quản lý Sổ địa chỉ giao hàng (`addresses`), đồng bộ danh sách sản phẩm yêu thích (`wishlist`). |
| 3 | **products** | CRUD sản phẩm, tìm kiếm không dấu (diacritic regex), lọc đa tiêu chí, quản lý biến thể/ảnh/SKU/ISBN, xuất file Excel 14 cột, nhập dữ liệu hàng loạt từ Excel. |
| 4 | **categories** | Cây danh mục đa cấp (Danh mục cha - con), tạo slug tự động, kiểm tra ràng buộc khi xóa danh mục có sản phẩm liên quan. |
| 5 | **cart** | Quản lý giỏ hàng phía server, kiểm tra tồn kho theo thời gian thực, tính tạm tính (subtotal), ngưỡng miễn phí vận chuyển. |
| 6 | **orders** | Tạo đơn hàng (Guest & Auth), kiểm tra trùng lặp (`idempotencyKey`), tính giá server-side, trừ kho nguyên tử, xuất hóa đơn PDF (`pdfkit`), chuyển đổi trạng thái đơn. |
| 7 | **payments** | Lớp trừu tượng xử lý cổng thanh toán: COD, Chuyển khoản QR ngân hàng, Webhook/IPN xác thực chữ ký (VNPay, MoMo). |
| 8 | **inventory** | Quản lý tồn kho & nhật ký giao dịch kho với 5 loại (`IMPORT`, `SALE`, `RETURN`, `ADJUSTMENT`, `DAMAGE`), cảnh báo sản phẩm sắp hết hàng (`stockAlert`). |
| 9 | **promotions** | Hệ thống mã giảm giá (Voucher), giảm theo % hoặc số tiền cố định, kiểm tra điều kiện đơn tối thiểu, số lượt dùng tối đa, chống dùng lặp. |
| 10 | **reviews** | Đánh giá sao & bình luận sản phẩm, kiểm tra đã mua hàng (`Verified Purchase`), kiểm duyệt nội dung (Moderate) và phản hồi của Admin. |
| 11 | **notifications** | WebSocket Gateway (Socket.IO `/notifications`) đẩy thông báo tức thì (đơn mới, thay đổi trạng thái, khuyến mãi), lưu trữ thông báo vào DB. |
| 12 | **reports** | Báo cáo doanh thu theo khoảng thời gian/múi giờ địa phương, tỷ lệ đơn hàng, giá trị trung bình đơn (AOV), top sản phẩm bán chạy. |
| 13 | **customers** | Quản trị danh sách khách hàng, thống kê tổng chi tiêu, số lượng đơn đã mua dành cho Admin CMS. |
| 14 | **banners** | Quản lý danh sách banner quảng cáo, banner trượt (slider), vị trí hiển thị trên Web và Mobile. |
| 15 | **landing-pages**| Quản lý và tùy biến nội dung các trang sự kiện khuyến mãi / Flash Sale động. |
| 16 | **email** | Gửi email giao dịch qua SMTP (Nodemailer): Gửi mã OTP xác thực, gửi email xác nhận đặt hàng thành công. |

---

## 4. ⚙️ Hướng dẫn Cài đặt & Cấu hình Môi trường (Setup & Environment Guide)

### 4.1. Yêu cầu Tiền đề (Prerequisites)
- **Node.js:** Phiên bản `>= 20.x` (khuyến nghị LTS).
- **Package Manager:** `npm` (đi kèm Node.js).
- **MongoDB:** Phiên bản `>= 7.0` (Chạy cục bộ hoặc dùng MongoDB Atlas).
- **Docker & Docker Compose:** Nếu muốn chạy toàn bộ qua container.
- **Flutter SDK:** Phiên bản `>= 3.11.x` (nếu phát triển Mobile).

---

### 4.2. Cấu hình Biến Môi trường (.env)

#### 🔹 Backend: Tạo file `backend/.env` từ `backend/.env.example`

```env
# 1. Server Environment
NODE_ENV=development
PORT=3000

# 2. Database Connection (MongoDB)
MONGODB_URI=mongodb://127.0.0.1:27017/truong_thanh_bookstore

# 3. Security & JWT (BẮT BUỘC: Thay đổi chuỗi bí mật ngẫu nhiên >= 32 ký tự ở Production)
JWT_SECRET=ThayTheBangChuoiBiMatNgauNhienItNhat32KyTu!2026
JWT_EXPIRES_IN=7d

# 4. CORS Whitelist
FRONTEND_URL=http://localhost:5173,http://localhost:80

# 5. Cookie Security
COOKIE_SAME_SITE=lax
COOKIE_SECURE=false

# 6. Cloudinary Storage (Tùy chọn - lưu ảnh sản phẩm)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 7. SMTP Email (Tùy chọn - gửi mail OTP & đơn hàng)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="Trường Thành Bookstore" <no-reply@truongthanh.vn>

# 8. Cổng Thanh toán (Enabled Methods)
ENABLED_PAYMENT_METHODS=COD,BANK_TRANSFER
BANK_NAME=MB Bank
BANK_ACCOUNT_NUMBER=0123456789
PAYMENT_WEBHOOK_SECRET=your_random_webhook_secret
```

#### 🔹 Frontend: Tạo file `frontend/.env` từ `frontend/.env.example`

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME="Trường Thành Bookstore"
```

---

### 4.3. Cách Chạy Dự án Cục bộ (Local Development)

#### 🚀 Cách 1: Chạy trực tiếp từng phân hệ (Khuyến nghị cho Dev)

```bash
# -------------------------------------------------------------
# 1. Khởi động Database MongoDB (nếu chạy Docker MongoDB)
# -------------------------------------------------------------
docker compose up -d mongodb

# -------------------------------------------------------------
# 2. Khởi chạy Backend (Terminal 1)
# -------------------------------------------------------------
cd backend
npm install
# Seed mặc định tắt. Chỉ bật AUTO_SEED=true và khai báo đủ SEED_*_PASSWORD
# trong môi trường development khi chủ động cần dữ liệu mẫu.
npm run start:dev  # API chạy tại: http://localhost:3000 | Swagger: http://localhost:3000/api/docs

# -------------------------------------------------------------
# 3. Khởi chạy Frontend Web (Terminal 2)
# -------------------------------------------------------------
cd frontend
npm install
npm run dev        # Giao diện Web chạy tại: http://localhost:5173

# -------------------------------------------------------------
# 4. Khởi chạy Mobile App (Terminal 3 - Tùy chọn)
# -------------------------------------------------------------
cd mobile
flutter pub get
flutter run
```

#### 🐳 Cách 2: Chạy Toàn bộ bằng Docker Compose

```bash
# Tại thư mục gốc của dự án:
# Cần khai báo JWT_SECRET; Mongo Express còn yêu cầu ME_CONFIG_BASICAUTH_*
docker compose up -d --build

# Các dịch vụ được khởi chạy:
# - Frontend:     http://localhost:80
# - Backend API:  http://localhost:3000/api
# - Swagger Docs: http://localhost:3000/api/docs
# - Mongo Express: chỉ chạy khi thêm --profile tools và cung cấp credentials
```

#### 🔑 Seed dữ liệu an toàn

Không có mật khẩu seed mặc định trong source. Khi `AUTO_SEED=true`, phải cung cấp bốn biến
`SEED_SUPER_ADMIN_PASSWORD`, `SEED_ADMIN_PASSWORD`, `SEED_STAFF_PASSWORD` và
`SEED_CUSTOMER_PASSWORD` (tối thiểu 12 ký tự). `RESET_DATABASE_ON_SEED=true` bị cấm ở production.

---

## 5. 🔐 Xác thực, Phân quyền & Bảo mật (Auth & Security Architecture)

### 5.1. Cơ chế Quản lý Token & Bảo mật Phiên (JWT Security)
1. **Mã hóa Mật khẩu:** 100% mật khẩu người dùng được băm qua thuật toán `bcrypt` với Salt rounds = 10.
2. **Access Token & Refresh Token:** Khi đăng nhập thành công, hệ thống cấp cặp `accessToken` (thời hạn ngắn) và `refreshToken` (thời hạn dài).
3. **Token Rotation:** Mỗi lần gọi endpoint `/api/auth/refresh`, Refresh Token cũ sẽ bị hủy và một cặp Token hoàn toàn mới được cấp phát.
4. **Token Reuse Detection:** Nếu một Refresh Token cũ (đã từng dùng) bị gửi lại, hệ thống nhận diện đây là hành vi đánh cắp phiên và lập tức hủy bỏ toàn bộ phiên hoạt động của người dùng đó.
5. **Token Blacklist Service:** Khi người dùng bấm Đăng xuất (Logout), JTI (JWT ID) và chuỗi băm của token được đưa vào `TokenBlacklistService` để vô hiệu hóa ngay lập tức.
6. **Phiên đăng nhập toàn cục (`tokenVersion`):** Khi người dùng Đổi mật khẩu hoặc Đặt lại mật khẩu qua OTP, trường `tokenVersion` trên `UserSchema` tự động tăng lên (+1), làm vô hiệu hóa tức thì toàn bộ JWT cũ đang lưu trên mọi thiết bị khác.

### 5.2. Mô hình Vai trò & Quyền hạn (Role-Based Access Control)

Code hiện tại triển khai 4 vai trò (`UserRole`):

```text
┌─────────────────┐
│   SUPER_ADMIN   │  (Toàn quyền và quản trị tài khoản đặc quyền)
├─────────────────┤
│      ADMIN      │  (Quản trị nghiệp vụ)
├─────────────────┤
│      STAFF      │  (Quyền chi tiết theo permissions được cấp)
└─────────────────┘

┌─────────────────┐
│    CUSTOMER     │  (Mua hàng, quản lý sổ địa chỉ, xem lịch sử đơn, đánh giá)
└─────────────────┘
```

| Vai trò (`UserRole`) | Phạm vi quyền hạn | Mô tả chi tiết |
| :--- | :--- | :--- |
| **SUPER_ADMIN** | Toàn quyền | Quản trị tài khoản đặc quyền và toàn bộ nghiệp vụ. |
| **ADMIN** | Toàn quyền hệ thống, quản lý | Quản trị toàn bộ sản phẩm, danh mục, kho hàng, đơn hàng, mã giảm giá/khuyến mãi, khách hàng, banner quảng cáo, báo cáo doanh thu tài chính. |
| **STAFF** | Theo quyền được cấp | Thao tác theo `StaffPermission`; backend vẫn là nơi thực thi authorization cuối cùng. |
| **CUSTOMER** | Mua sắm & Cá nhân hóa | Mua hàng, quản lý giỏ hàng, đặt hàng, quản lý sổ địa chỉ nhận hàng, xem lịch sử đơn hàng và gửi đánh giá sản phẩm. |

---

## 6. 🛍️ Quy tắc Nghiệp vụ Cốt lõi (Core Commerce Business Logic)

### 6.1. Quy tắc Giỏ hàng & Tính toán Phí vận chuyển
- **Ngưỡng Miễn phí Vận chuyển:** `299.000 VNĐ`
  - Nếu `Tổng tiền hàng (Subtotal) >= 299.000đ` ➔ Phí ship = `0đ` (Miễn phí).
  - Nếu `Tổng tiền hàng (Subtotal) < 299.000đ` ➔ Phí ship = `30.000đ`.
- **Khóa giá từ Máy chủ (Server-side Pricing):** Giá bán và giá khuyến mãi luôn được truy vấn và tính toán trực tiếp từ cơ sở dữ liệu trên backend. Hệ thống **tuyệt đối không tin tưởng** giá tiền được gửi lên từ phía Client (chống gian lận sửa giá trên trình duyệt).

---

### 6.2. Luồng Vòng đời Đơn hàng (Order State Machine)

```text
       ┌──────────┐
       │ PENDING  │ (Chờ xác nhận đơn)
       └────┬─────┘
            │
            ├──────────────────────────────┐
            ▼                              ▼
     ┌───────────┐                  ┌───────────┐
     │ CONFIRMED │ (Đã duyệt)       │ CANCELLED │ ➔ [ Hoàn lại tồn kho ]
     └─────┬─────┘                  └───────────┘
           │
           ▼
    ┌────────────┐
    │ PROCESSING │ (Đang đóng gói)
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
    │ DELIVERED │ (Giao thành công)│ RETURNED │ ➔ [ Hoàn kho & ghi log ]
    └─────┬─────┘                  └──────────┘
           │
           ▼
    ┌───────────┐
    │ COMPLETED │ (Hoàn tất giao dịch)
    └───────────┘
```

**Nguyên tắc Trừ kho Nguyên tử & Hoàn kho (Atomic Inventory):**
1. Khi khách hàng bấm Đặt hàng thành công ➔ Tồn kho của từng sản phẩm trong đơn được trừ ngay lập tức (`stock - quantity`, `soldCount + quantity`).
2. Nếu đơn hàng bị chuyển sang trạng thái `CANCELLED` (Hủy đơn) ➔ Hệ thống tự động kích hoạt tiến trình phục hồi tồn kho: hoàn trả đúng số lượng sản phẩm vào kho và giảm số lượng đã bán (`soldCount`).
3. Cơ chế Idempotency (`idempotencyKey`) ngăn chặn hoàn toàn việc khách bấm Đặt hàng 2 lần liên tiếp do mạng lag bị tạo 2 đơn trùng lặp.

---

### 6.3. Quy tắc Khuyến mãi (Promotions / Vouchers)
- **Hình thức giảm giá:** Giảm theo phần trăm (`PERCENTAGE`, có kèm trần giảm tối đa `maxDiscount`) hoặc Giảm theo số tiền cố định (`FIXED_AMOUNT`).
- **Ràng buộc:** Kiểm tra thời hạn hiệu lực (`startDate` -> `endDate`), giá trị đơn hàng tối thiểu (`minOrderValue`), tổng số lượt sử dụng tối đa (`usageLimit`), và giới hạn 1 lượt/1 khách hàng.

---

## 7. 📡 Đặc tả API & Giao tiếp Thời gian thực (API & Realtime WebSocket)

### 7.1. Định dạng Phản hồi API Chuẩn hóa (Standard Response Envelope)

Tất cả các endpoint REST API đều tuân theo cấu trúc phản hồi đồng nhất:

#### ✅ Khi Thành Công (HTTP 200 / 201):
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

#### ❌ Khi Xảy Ra Lỗi (HTTP 400 / 401 / 403 / 404 / 500):
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

---

### 7.2. Danh mục Các Nhóm API Chính (API Endpoints Summary)

| Prefix | Mô tả nhóm chức năng | Các API tiêu biểu |
| :--- | :--- | :--- |
| `/api/auth` | Xác thực & Phiên đăng nhập | `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `POST /forgot-password`, `POST /reset-password` |
| `/api/users` | Thông tin người dùng & Sổ địa chỉ | `GET /profile`, `PATCH /profile`, `GET /addresses`, `POST /addresses`, `POST /wishlist/:id` |
| `/api/products` | Danh mục sản phẩm & Tìm kiếm | `GET /`, `GET /:id`, `POST /` (Admin), `PATCH /:id`, `GET /export/excel`, `POST /import/excel` |
| `/api/categories` | Cây danh mục sản phẩm | `GET /`, `GET /tree`, `POST /` (Admin), `PATCH /:id`, `DELETE /:id` |
| `/api/cart` | Giỏ hàng & Tạm tính | `GET /`, `POST /items`, `PATCH /items/:id`, `DELETE /items/:id`, `POST /sync` |
| `/api/orders` | Đơn hàng & Checkout | `POST /checkout-preview`, `POST /`, `GET /my-orders`, `GET /:id`, `PATCH /:id/status`, `GET /:id/invoice` |
| `/api/inventory` | Quản lý kho hàng | `GET /`, `POST /import`, `POST /export`, `POST /adjust`, `GET /transactions`, `GET /alerts` |
| `/api/promotions` | Mã giảm giá | `GET /`, `POST /apply`, `POST /` (Admin), `PATCH /:id` |
| `/api/reviews` | Đánh giá sản phẩm | `GET /product/:productId`, `POST /`, `PATCH /:id/reply` (Admin) |
| `/api/notifications`| Thông báo người dùng | `GET /`, `PATCH /:id/read`, `PATCH /read-all` |
| `/api/reports` | Báo cáo tài chính Admin | `GET /overview`, `GET /revenue-chart`, `GET /top-products`, `GET /order-status-stats` |

*Chi tiết toàn bộ schema Request/Response có thể xem trực tiếp tại Swagger UI:* `http://localhost:3000/api/docs`.

---

### 7.3. Giao tiếp Thời gian thực (WebSocket Events)
- **Namespace:** `/notifications`
- **Events phát từ Server:**
  - `new_order`: Bắn thông báo tới Admin CMS khi có khách hàng vừa đặt đơn mới.
  - `order_status_updated`: Bắn thông báo tới Web/Mobile của khách hàng khi đơn hàng được duyệt/giao.
  - `stock_alert`: Báo động tới Admin khi tồn kho một sản phẩm giảm xuống dưới mức an toàn.

---

## 8. 🧪 Kiểm thử & Quy trình CI/CD (Testing & Deployment Pipelines)

### 8.1. Kiểm thử Tự động (Automated Testing)

```bash
# -------------------------------------------------------------
# 1. Chạy Unit & Integration Tests cho Backend (Jest)
# -------------------------------------------------------------
cd backend
npm test                # Chạy toàn bộ test suites
npm run test:cov        # Xuất báo cáo độ phủ mã nguồn (Coverage report)

# -------------------------------------------------------------
# 2. Kiểm tra lỗi Types & Build Frontend (Vue-TSC + Vite)
# -------------------------------------------------------------
cd frontend
npm run build           # Chạy type-check vue-tsc và biên dịch dist/

# -------------------------------------------------------------
# 3. Kiểm tra Mã nguồn Mobile App (Flutter)
# -------------------------------------------------------------
cd mobile
flutter analyze         # Phân tích tĩnh cú pháp Dart
flutter test            # Chạy bộ test widget & provider
```

---

### 8.2. Kịch bản CI/CD (GitHub Actions)

Mọi Pull Request hoặc thao tác Push vào nhánh `main` đều được kiểm soát bởi 4 workflows trong `.github/workflows/`:
1. `backend-ci.yml`: Cài đặt dependencies, chạy linter, chạy bộ test Jest và build NestJS.
2. `frontend-ci.yml`: Cài đặt dependencies, chạy `vue-tsc` kiểm tra kiểu dữ liệu và build Vite bundle.
3. `mobile-ci.yml`: Chạy `flutter analyze` và `flutter test`.
4. `deploy.yml`: Tự động trigger deploy lên **Vercel** (Frontend) và **Render** (Backend API).

---

## 9. 🔍 Kế hoạch Xử lý Nợ Kỹ thuật & Hardening (Audit Backlog)

Dự án đã trải qua đợt đánh giá kỹ thuật toàn diện (**Technical Audit**). Tất cả 24 vấn đề phát hiện và kế hoạch nâng cấp đã được lập bảng chi tiết trong tệp:  
👉 [`docs/AUDIT_FIX_TASKS.md`](file:///d:/Truong_Thanh_app/Truong_thanh_store/Truong_Thanh_Bookstore/docs/AUDIT_FIX_TASKS.md)

### 📌 Trạng thái hardening sau audit ngày 2026-09-02

1. **[P0 - DATA] Auto-seed:** ✅ mặc định tắt; reset chỉ bằng cờ tường minh và bị cấm ở production.
2. **[P0 - SEC] Secrets & token web:** ⚠️ source đã fail-closed và web dùng HttpOnly cookie + CSRF header; rotation secret production vẫn là việc vận hành bắt buộc.
3. **[P0 - DEVOPS] Deploy gate:** ✅ deploy chỉ chạy sau CI thành công; branch protection phải cấu hình trên GitHub.
4. **[P0 - DB] Network/transaction:** ⚠️ Compose bind DB vào localhost và dùng replica set; production vẫn phải bật DB authentication, backup và kiểm chứng topology thực tế.
5. **[P1/P2 - ORDER] Integrity:** ✅ tạo đơn và cập nhật trạng thái/tồn kho dùng transaction khi có Mongo replica set; môi trường standalone bị fail-closed cho chuyển trạng thái có side effect.

---

## 10. 📘 Cẩm nang Dành cho Intern / Developer Mới & Trợ lý AI

### 10.1. Nguyên tắc Bất biến khi Viết Code (Golden Rules)
1. **Không Hardcode Secrets:** Tuyệt đối không viết trực tiếp URL database, mật khẩu, JWT key vào code. Luôn lấy thông qua `ConfigService` (Backend) hoặc `import.meta.env` (Frontend).
2. **Phân tách Rõ ràng Trách nhiệm:**
   - `Controller`: Chỉ nhận request, validate DTO qua pipe, gọi service và trả về kết quả. Không viết logic tính toán tại controller.
   - `Service`: Nơi chứa 100% logic nghiệp vụ, giao dịch cơ sở dữ liệu, gửi mail, bắn socket.
   - `DTO`: Định nghĩa rõ ràng kiểu dữ liệu và decorator validate (`@IsNotEmpty`, `@IsNumber`...).
3. **Không Sử Dụng Kiểu `any` Tùy Tiện:** Luôn khai báo kiểu dữ liệu rõ ràng (Interface / Type) ở cả Backend DTO và Frontend `src/types/`.
4. **Mọi Thay đổi Nghiệp vụ Cốt lõi Phải Đi Kèm Unit Test:** Khi sửa logic tính tiền, trừ kho, áp voucher... phải chạy `npm test` để đảm bảo không gây lỗi hồi quy (regression).

---

### 10.2. Hướng dẫn Từng bước: Cách Thêm Một Tính Năng Mới

#### Bước 1: Thêm API Mới ở Backend
1. Tạo thư mục module mới trong `backend/src/modules/<feature-name>/`.
2. Định nghĩa Schema Mongoose trong thư mục `schemas/`.
3. Định nghĩa Request DTO trong thư mục `dto/` kèm class-validator decorators.
4. Viết Business Logic trong `<feature-name>.service.ts`.
5. Tạo endpoint REST trong `<feature-name>.controller.ts` kèm Swagger decorators (`@ApiTags`, `@ApiOperation`).
6. Đăng ký Module vào `backend/src/app.module.ts`.

#### Bước 2: Thêm Giao diện Mới ở Frontend
1. Định nghĩa Type/Interface trong `frontend/src/types/index.ts`.
2. Viết hàm gọi API trong `frontend/src/services/<feature-name>.service.ts`.
3. Tạo Component hoặc Trang trong `frontend/src/pages/`.
4. Đăng ký đường dẫn mới trong `frontend/src/router/index.ts` (gắn kèm `meta.requiresAuth` hoặc `meta.roles` nếu cần bảo vệ).

---

### 10.3. Checklist Kiểm tra Trước khi Tạo Pull Request (PR Checklist)
- [ ] Backend: Chạy `npm test` và toàn bộ unit tests đều **PASS**.
- [ ] Backend: Đã thêm DTO validation đầy đủ, không để lọt trường lạ.
- [ ] Frontend: Chạy `npm run build` không bị lỗi kiểu dữ liệu TypeScript.
- [ ] Không có file `.env` thật nào bị thêm vào Git staging (`git status`).
- [ ] Không xuất hiện `console.log` chứa mật khẩu, token hoặc thông tin nhạy cảm.
