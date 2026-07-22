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

### 1. Khởi Chạy Backend (NestJS API)
```bash
cd backend
npm install
npm run start:dev
# API Server chạy tại: http://localhost:3000/api
```

### 2. Khởi Chạy Frontend Web (Vue 3 Storefront & Admin)
```bash
cd frontend
npm install
npm run dev
# Web app chạy tại: http://localhost:5173
```

### 3. Khởi Chạy Mobile App (Flutter)
```bash
cd mobile
flutter pub get
flutter run
```

---

## 🧪 Chạy Kiểm Thử (Testing)

```bash
cd backend

# Chạy Unit Test
npm test

# Chạy End-to-End (E2E) Test Suite
npx jest --config test/jest-e2e.json
```

---

<div align="center">
  <sub>© 2026 CÔNG TY TNHH GIÁO DỤC & PHÁT TRIỂN TRƯỜNG THÀNH. All rights reserved.</sub>
</div>
