<div align="center">

  <img src="frontend/src/assets/logo.jpg" alt="Trường Thành Logo" width="120" style="border-radius: 50%;" />

  # CÔNG TY TNHH GIÁO DỤC & PHÁT TRIỂN TRƯỜNG THÀNH
  ### 📚 TRƯỜNG THÀNH BOOKSTORE & STATIONERY

  *Hệ thống Thương Mại Điện Tử & Quản Lý Nhà Sách Trực Tuyến Đa Nền Tảng (Web Storefront, Admin Dashboard & Mobile App)*

  [![Backend CI](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/backend-ci.yml)
  [![Frontend CI](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/frontend-ci.yml)
  [![Mobile CI/CD](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/mobile-ci.yml)
  [![Test Suite](https://img.shields.io/badge/Tests-308%20Passed%20(100%25)-brightgreen.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore)
  [![Security Audit](https://img.shields.io/badge/Audit-Sprint%201%20Hardened-blue.svg)](docs/TASK_EXECUTION_TRACKER.md)

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
├── docs/       # Đặc tả nghiệp vụ, tài liệu kiểm toán hệ thống & Task Tracker
└── .github/    # Quy trình CI/CD Automation (GitHub Actions: test, lint, build)
```

| Nền Tảng | Công Nghệ Chính | Môi Trường Triển Khai |
|:---|:---|:---|
| **Backend REST API** | NestJS 11, TypeScript, MongoDB 7, Mongoose 9, JWT Auth, Passport, Socket.IO | Render (Containerized) |
| **Frontend Web & Admin** | Vue 3 (Composition API), TypeScript, Pinia, Tailwind CSS, Vite | Vercel |
| **Mobile Application** | Flutter (Dart), Provider Pattern, Material Design 3 | Android APK & iOS |
| **Cơ Sở Dữ Liệu & Cache** | MongoDB Replica Set, In-Memory Blacklist (chuẩn bị Redis) | Atlas / Managed Mongo |
| **Hạ Tầng & CI/CD** | GitHub Actions, Docker Compose, Jest (308 unit & integration tests) | GitHub Cloud |

---

## 🛡️ Điểm Nhấn Bảo Mật & Chuẩn Hóa Hệ Thống (Sprint 1 Audit)

Hệ thống đã trải qua đợt rà soát và khắc phục toàn diện theo tài liệu kiểm toán [TRUONG_THANH_MASTER_AUDIT_IMPLEMENTATION_2026-09-03.md](docs/TRUONG_THANH_MASTER_AUDIT_IMPLEMENTATION_2026-09-03.md):

1. **🔐 Tách biệt Secret Keys (BE-01):**
   - Cô lập độc lập 3 khóa bí mật: `JWT_SECRET` (Access Token), `JWT_REFRESH_SECRET` (Refresh Token) và `JWT_RESET_SECRET` (Password Reset Token).
   - Cơ chế **Fail-Closed** ở môi trường Production: Tự động dừng khởi động nếu thiếu bất kỳ secret nào hoặc nếu các secret bị trùng lặp.
   - Triệt tiêu hoàn toàn lỗ hổng Token Type Confusion tại cấp độ chữ ký mật mã học.

2. **⭐ Hợp nhất Review Schema (BE-02):**
   - Loại bỏ triệt để schema thừa trong `products` module, quy tụ về một model `Review` duy nhất trong `reviews` module.
   - Đảm bảo lưu trữ và phản hồi dữ liệu thật: `isVisible` (kiểm duyệt ẩn/hiện), `isVerifiedPurchase` (xác thực đã mua hàng), `adminReply` (phản hồi của quản trị viên), `images` (ảnh đính kèm).

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
# Tạo file .env và khởi chạy toàn bộ stack:
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

# Chạy toàn bộ 24 test suites / 308 unit & integration tests
npm test

# Kiểm tra chất lượng mã nguồn bằng ESLint (Ratchet budget limit)
npm run lint

# Kiểm tra build bundle NestJS
npm run build
```

### 2. Kiểm thử Mobile (Flutter Tests)
```bash
cd mobile

# Chạy toàn bộ 16 unit, widget và E2E tests trên Mobile
flutter test
```

---

## 📚 Kho Tài Liệu Dự Án (Documentation Hub)

Các tài liệu nghiệp vụ và đặc tả kiến trúc được lưu trữ tại thư mục `docs/`:

- 📜 [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md) — Tài liệu Quy tắc Nghiệp vụ v2.0 (9 chương, State Machines, Ma trận Phân quyền Role × Permission).
- 📋 [docs/TASK_EXECUTION_TRACKER.md](docs/TASK_EXECUTION_TRACKER.md) — Bảng theo dõi tiến độ chi tiết 18 Core Master Tasks và các Sprint.
- 🔍 [docs/TRUONG_THANH_MASTER_AUDIT_IMPLEMENTATION_2026-09-03.md](docs/TRUONG_THANH_MASTER_AUDIT_IMPLEMENTATION_2026-09-03.md) — Báo cáo Kiểm toán Kỹ thuật & Danh mục Lỗi Hệ thống Cần Khắc Phục.

---

<div align="center">
  <sub>© 2026 CÔNG TY TNHH GIÁO DỤC & PHÁT TRIỂN TRƯỜNG THÀNH. All rights reserved.</sub>
</div>
