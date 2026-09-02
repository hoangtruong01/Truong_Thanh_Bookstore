<div align="center">

  <img src="frontend/src/assets/logo.jpg" alt="Trường Thành Logo" width="120" style="border-radius: 50%;" />

  # CÔNG TY TNHH GIÁO DỤC & PHÁT TRIỂN TRƯỜNG THÀNH
  ### 📚 TRƯỜNG THÀNH BOOKSTORE & STATIONERY

  *Hệ thống Thương Mại Điện Tử & Quản Lý Nhà Sách Trực Tuyến Đa Nền Tảng (Web Storefront, Admin Dashboard & Mobile App)*

  [![Backend CI](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/backend-ci.yml)
  [![Frontend CI](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/frontend-ci.yml)
  [![Mobile CI/CD](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/mobile-ci.yml)

</div>

---

## 📖 Giới Thiệu Dự Án

Dự án **Trường Thành Bookstore** được xây dựng nhằm chuyển đổi số cho **Công Ty TNHH Giáo Dục & Phát Triển Trường Thành**, cung cấp giải pháp mua sắm văn phòng phẩm, sách giáo khoa, dụng cụ học tập trực tuyến mượt mà cho khách hàng, đồng thời tối ưu hóa quy trình quản lý tồn kho và đơn hàng cho nhà quản trị.

---

## 🏗️ Cấu Trúc Đa Nền Tảng & Tech Stack

```text
Truong_Thanh_Bookstore/
├── backend/    # RESTful API Service (NestJS + MongoDB + JWT)
├── frontend/   # Web Storefront & Admin Dashboard (Vue 3 + TypeScript + Tailwind CSS)
├── mobile/     # Native Cross-Platform Mobile App (Flutter + Provider)
├── docs/       # Tài liệu dự án, đặc tả & AI Context
└── .github/    # Quy trình CI/CD Automation (GitHub Actions)
```

| Nền Tảng | Công Nghệ Chính | Môi Trường Deploy |
|:---|:---|:---|
| **Backend REST API** | NestJS, TypeScript, MongoDB, Mongoose, JWT Auth | Render |
| **Frontend Web & Admin** | Vue 3 (Composition API), TypeScript, Pinia, Tailwind CSS | Vercel |
| **Mobile Application** | Flutter (Dart), Provider, Material Design 3 | Android APK & iOS |
| **Hạ Tầng & CI/CD** | GitHub Actions, Docker, Jest (Unit & E2E Testing) | GitHub Cloud |

---

## ⚡ Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### 🐳 Cách 1: Khởi Chạy Toàn Bộ Bằng Docker Compose (Khuyến nghị)
```bash
# Tạo file .env ở thư mục gốc và đặt JWT_SECRET ngẫu nhiên >= 16 ký tự cho local.
docker compose up -d --build
```
- **Web Storefront & Admin CMS**: `http://localhost` (Port 80)
- **Backend API**: `http://localhost:3000/api`
- **Tài liệu Swagger OpenAPI**: `http://localhost:3000/api/docs`
- **Health Check Endpoint**: `http://localhost:3000/api/health`

Mongo Express không chạy mặc định. Khi cần dùng local, đặt
`ME_CONFIG_BASICAUTH_USERNAME`/`ME_CONFIG_BASICAUTH_PASSWORD`
và chạy `docker compose -f docker-compose.yml -f docker-compose.tools.yml --profile tools up -d mongo-express`.
Không có credential mặc định trong source.

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

## 🧪 Chạy Kiểm Thử Tự Động (Testing)

### 1. Kiểm thử Backend (NestJS + Jest)
```bash
cd backend

# Baseline audit 2026-09-02: 22 test suites / 252 tests
npm test

# Chạy test kiểm thử các ca sửa lỗi trọng yếu (Atomic rollback, Freeship 299K, Default Address, PDF)
npx jest --rootDir . test/all-fixes.spec.ts

# Chạy test luồng E2E tích hợp toàn diện (Auth -> Cart -> Order -> Review -> Notification)
npx jest --rootDir . test/e2e-flow.spec.ts
```

### 2. Kiểm thử Mobile (Flutter Tests)
```bash
cd mobile

# Chạy toàn bộ 16 unit, widget và E2E tests trên Mobile
flutter test
```

---

<div align="center">
  <sub>© 2026 CÔNG TY TNHH GIÁO DỤC & PHÁT TRIỂN TRƯỜNG THÀNH. All rights reserved.</sub>
</div>
