<div align="center">

  <img src="frontend/src/assets/logo.jpg" alt="Trường Thành Logo" width="120" style="border-radius: 50%;" />

  # CÔNG TY TNHH GIÁO DỤC & PHÁT TRIỂN TRƯỜNG THÀNH
  ### 📚 TRƯỜNG THÀNH BOOKSTORE & STATIONERY

  *Hệ thống Thương Mại Điện Tử & Quản Lý Nhà Sách Trực Tuyến Đa Nền Tảng (Web Storefront, Admin Dashboard & Mobile App)*

  [![CI Pipeline](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/ci.yml/badge.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/ci.yml)
  [![CD Deploy](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/deploy.yml/badge.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/deploy.yml)
  [![Test Suite](https://img.shields.io/badge/Tests-681%20Passed%20(100%25)-brightgreen.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore)
  [![Security Audit](https://img.shields.io/badge/Audit-P0%2FP1%20Hardened-blue.svg)](docs/PROJECT_OVERVIEW.md)

</div>

---

## 📖 Giới Thiệu Dự Án

Dự án **Trường Thành Bookstore** được xây dựng nhằm chuyển đổi số toàn diện cho **Công Ty TNHH Giáo Dục & Phát Triển Trường Thành**, cung cấp giải pháp mua sắm văn phòng phẩm, sách giáo khoa, dụng cụ học tập trực tuyến cho khách hàng, đồng thời tối ưu hóa quy trình quản lý kho hàng, đơn hàng và báo cáo doanh thu minh bạch cho nhà quản trị.

---

## 🏗️ Cấu Trúc Đa Nền Tảng & Tech Stack

```text
Truong_Thanh_Bookstore/
├── backend/    # RESTful API Service (NestJS 11 + MongoDB Mongoose 9 + JWT)
├── frontend/   # Web Storefront & Admin CMS (Vue 3 Composition API + Pinia + Tailwind CSS + Vite)
├── mobile/     # Native Cross-Platform Mobile App (Flutter 3.x + Provider + Material 3)
├── docs/       # Tài liệu tổng quan kiến trúc, cấu hình & Backlog công việc
└── .github/    # Quy trình CI/CD Automation (GitHub Actions: test, lint, build)
```

| Nền Tảng | Công Nghệ Chính | Môi Trường Triển Khai |
|:---|:---|:---|
| **Backend REST API** | NestJS 11, TypeScript, MongoDB 7, Mongoose 9, JWT Auth, Passport, Socket.IO | Render (Containerized) |
| **Frontend Web & Admin** | Vue 3 (Composition API), TypeScript, Pinia, Tailwind CSS, Vite | Vercel |
| **Mobile Application** | Flutter (Dart), Provider Pattern, Material Design 3 | Android APK & iOS |
| **Cơ Sở Dữ Liệu & Cache** | MongoDB Replica Set, In-Memory Blacklist (chuẩn bị Redis) | Atlas / Managed Mongo |
| **Hạ Tầng & CI/CD** | GitHub Actions, Docker Compose, Jest (322 tests local, 25 suites — 2026-09-03) | GitHub Cloud |

---

## 🛡️ Điểm Nhấn Bảo Mật & Chuẩn Hóa Hệ Thống (Sprint 1 Audit)

Hệ thống đã trải qua đợt rà soát và khắc phục toàn diện theo tài liệu đặc tả [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md):

1. **🔐 Tách biệt Secret Keys (BE-01):**
   - Cô lập độc lập 3 khóa bí mật: `JWT_SECRET` (Access Token), `JWT_REFRESH_SECRET` (Refresh Token) và `JWT_RESET_SECRET` (Password Reset Token).
   - Cơ chế **Fail-Closed** ở môi trường Production: Tự động dừng khởi động nếu thiếu bất kỳ secret nào hoặc nếu các secret bị trùng lặp.
   - Triệt tiêu hoàn toàn lỗ hổng Token Type Confusion tại cấp độ chữ ký mật mã học.

2. **⭐ Hợp nhất Review Schema (BE-02):**
   - Loại bỏ triệt để schema thừa trong `products` module, quy tụ về một model `Review` duy nhất trong `reviews` module.
   - Schema/service chuẩn hỗ trợ `isVisible`, `isVerifiedPurchase`, `adminReply`, `images` và đã có unit regression; việc xác minh/backfill dữ liệu Production vẫn là mục Need Verify.

3. **🛡️ Chống Rò Rỉ Email & Chuẩn hóa Cookie (BE-06):**
   - Loại bỏ lỗ hổng dò quét email người dùng (Anti-Email Enumeration) tại các luồng `forgotPassword`, `verifyOtp` và `resetPassword` bằng cách trả về thông báo bảo mật thống nhất.
   - Chuẩn hóa cấu hình Cookie (`COOKIE_SAME_SITE`, `COOKIE_SECURE`) qua `ConfigService`. Hỗ trợ cross-origin mượt mà khi Frontend (Vercel) và Backend (Render) khác domain.
   - Lệnh `logout` gửi đúng thuộc tính để trình duyệt xóa hoàn toàn cookie phiên làm việc.

4. **📊 Báo Cáo Doanh Thu & Tăng Trưởng Thật (BE-09):**
   - Xóa bỏ vĩnh viễn các số liệu giả lập hardcoded (`revenueGrowthRate: 12.5`, `ordersGrowthRate: 8.3`).
   - Hiện thực hóa tính toán tăng trưởng động (`getGrowthStats`) theo kỳ linh hoạt: `day`, `week`, `month`, `year`.
   - Xây dựng Aggregation Pipeline tính doanh thu theo danh mục từ dữ liệu đơn hàng thực tế (snapshot `items[].price * items[].quantity`), loại trừ hoàn toàn các đơn `CANCELLED` và `RETURNED`.

5. **👮 Ma Trận Phân Quyền & Chống IDOR (QA-01 & BA-01):**
   - Phân cấp 4 tầng: `SUPER_ADMIN` > `ADMIN` > `STAFF` (theo Permission) > `CUSTOMER`.
   - Chặn đứng lỗ hổng IDOR: Khách hàng không thể xem/hủy đơn của người khác, không tải được hóa đơn PDF hoặc truy cập thông tin thanh toán của tài khoản khác.

---

## ⚙️ Biến Môi Trường Cần Thiết (.env)

Tạo file `backend/.env` dựa trên `backend/.env.example`:

| Biến Môi Trường | Mô Tả | Yêu Cầu / Giá Trị Mẫu |
|:---|:---|:---|
| `NODE_ENV` | Môi trường thực thi | `development` / `production` / `test` |
| `PORT` | Cổng dịch vụ API | `3000` |
| `MONGODB_URI` | Chuỗi kết nối MongoDB | `mongodb://localhost:27017/truong_thanh` |
| `JWT_SECRET` | Secret ký Access Token | Tối thiểu 16 ký tự ở dev, $\ge 32$ ký tự ở prod |
| `JWT_REFRESH_SECRET` | Secret ký Refresh Token | Bắt buộc ở prod, **không được trùng JWT_SECRET** |
| `JWT_RESET_SECRET` | Secret ký Reset Token | Bắt buộc ở prod, **không được trùng các key trên** |
| `JWT_EXPIRES_IN` | Thời hạn Access Token | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Thời hạn Refresh Token | `30d` |
| `FRONTEND_URL` | Danh sách URL Frontend được phép CORS | `http://localhost:5173` |
| `COOKIE_SAME_SITE` | Chính sách SameSite của cookie | `lax` (cùng domain) / `none` (khác domain) |
| `COOKIE_SECURE` | Cờ Secure HTTPS cho cookie | `false` (dev) / `true` (prod hoặc khi `none`) |

---

## ⚡ Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### 🐳 Cách 1: Khởi Chạy Toàn Bộ Bằng Docker Compose (Khuyến nghị)
```bash
# Tạo file .env ở thư mục gốc (khác backend/.env) với ba secret riêng biệt:
# JWT_SECRET=... (>=32 ký tự)
# JWT_REFRESH_SECRET=... (>=32 ký tự, khác JWT_SECRET)
# JWT_RESET_SECRET=... (>=32 ký tự, khác hai key trên)
docker compose up -d --build
```
- **Web Storefront & Admin CMS**: `http://localhost` (Port 80)
- **Backend API**: `http://localhost:3000/api`
- **Tài liệu Swagger OpenAPI**: `http://localhost:3000/api/docs`
- **Health Check Endpoint**: `http://localhost:3000/api/health`

---

### 💻 Cách 2: Khởi Chạy Thủ Công Từng Phân Hệ

#### 1. Khởi Chạy Backend (NestJS API)
```bash
cd backend
npm install
npm run start:dev
# API Server: http://localhost:3000/api
# Swagger Docs: http://localhost:3000/api/docs
```

#### 2. Khởi Chạy Frontend Web (Vue 3 Storefront & Admin)
```bash
cd frontend
npm install
npm run dev
# Web app: http://localhost:5173
```

#### 3. Khởi Chạy Mobile App (Flutter)
```bash
cd mobile
flutter pub get
flutter run
```

---

## 🧪 Chạy Kiểm Thử Tự Động (Testing & Quality Assurance)

### 1. Kiểm thử Backend (NestJS + Jest)
```bash
cd backend

# Chạy toàn bộ 53 test suites / 551 unit, integration & concurrency tests
npm test

# Kiểm tra chất lượng mã nguồn bằng ESLint (Ratchet budget limit <= 1280 warnings)
npm run lint

# Kiểm tra build bundle NestJS
npm run build
```

### 2. Kiểm thử Frontend Web (Vitest + Vue-TSC + ESLint + Playwright)
```bash
cd frontend

# Chạy toàn bộ 14 test suites / 83 unit & composable tests
npm run test:unit

# Kiểm tra kiểu TypeScript (0 errors)
npm run typecheck

# Kiểm tra ESLint 9 Flat Config (0 errors)
npm run lint

# Kiểm tra production build Vite
npm run build

# Chạy E2E Tests đa thiết bị (Desktop Chrome, Mobile, Tablet & Barcode Scanner)
npx playwright test
```

### 3. Kiểm thử Mobile (Flutter Tests & Analysis)
```bash
cd mobile

# Kiểm tra phân tích tĩnh Dart (0 issues)
flutter analyze

# Chạy toàn bộ 47 unit, widget và contract tests trên Mobile
flutter test
```

---

## 🔒 Quy Tắc Bảo Vệ Nhánh (Branch Protection & Quality Gates)

Để đảm bảo tính toàn vẹn và độ tin cậy của mã nguồn trên Production (`main` branch):

1. **Pull Request Bắt Buộc:** Mọi thay đổi đều phải thông qua Pull Request, không được commit hoặc force push trực tiếp lên `main`.
2. **Quality Gate CI Pipeline:** Tất cả các luồng kiểm thử (`test:unit`, `lint`, `typecheck`, `build` của cả Backend, Frontend và Mobile) phải đạt **PASS 100% (0 errors)** trên GitHub Actions trước khi merge.
3. **Chống Replay & Concurrency Test:** Mọi nghiệp vụ liên quan đến trừ kho, phiếu bán hàng POS và thanh toán phải có concurrency unit test chứng minh không phát sinh race condition hoặc số lượng tồn kho âm.
4. **Không Hardcode Secrets:** Mọi secret, token và credentials phải được cấu hình qua GitHub Repository Secrets và biến môi trường.

---

## 📚 Kho Tài Liệu Dự Án (Documentation Hub)

Các tài liệu nghiệp vụ, kiến trúc và quản lý công việc được lưu trữ tại thư mục `docs/`:

- 📘 [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) — Tài liệu Tổng Quan Dự Án & Cẩm Nang Toàn Diện (Kiến trúc hệ thống, chi tiết cấu hình biến môi trường, cơ chế bảo mật JWT/RBAC, 16 modules, phân hệ POS bán tại quầy, quy tắc nghiệp vụ mua hàng/tồn kho/loyalty và hướng dẫn phát triển).
- 📋 [docs/PENDING_TASKS.md](docs/PENDING_TASKS.md) — Danh Mục Công Việc & Kế Hoạch Triển Khai Chi Tiết.

---

<div align="center">
  <sub>© 2026 CÔNG TY TNHH GIÁO DỤC & PHÁT TRIỂN TRƯỜNG THÀNH. All rights reserved.</sub>
</div>
