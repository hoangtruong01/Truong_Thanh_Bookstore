<div align="center">

  <img src="frontend/src/assets/logo.jpg" alt="Trường Thành Logo" width="120" style="border-radius: 50%;" />

  # CÔNG TY TNHH GIÁO DỤC & PHÁT TRIỂN TRƯỜNG THÀNH
  ### 📚 TRƯỜNG THÀNH BOOKSTORE & STATIONERY

  *Hệ thống Thương Mại Điện Tử & Quản Lý Nhà Sách Đa Kênh (Omnichannel: Web Storefront, POS Quầy, Admin CMS & Mobile App)*

  [![CI Pipeline](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/ci.yml/badge.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/ci.yml)
  [![CD Deploy](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/deploy.yml/badge.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore/actions/workflows/deploy.yml)
  [![Test Suite](https://img.shields.io/badge/Tests-1%2C800%2B%20Passed%20(100%25)-brightgreen.svg)](https://github.com/hoangtruong01/Truong_Thanh_Bookstore)
  [![Tech Stack](https://img.shields.io/badge/Stack-NestJS%2011%20%7C%20Vue%203%20%7C%20Flutter-blue.svg)](docs/PROJECT_OVERVIEW.md)
  [![Database](https://img.shields.io/badge/DB-MongoDB%207%20ReplicaSet%20%7C%20Redis-green.svg)](docs/PROJECT_OVERVIEW.md)

</div>

---

## 📖 Giới Thiệu Dự Án

Dự án **Trường Thành Bookstore** là nền tảng thương mại điện tử và quản lý bán hàng đa kênh (**Omnichannel E-commerce & Retail ERP**) phục vụ chuyển đổi số toàn diện cho **Công Ty TNHH Giáo Dục & Phát Triển Trường Thành**.

Hệ thống kết nối liền mạch giữa:
- **Khách hàng trực tuyến (Online Customers):** Web Storefront và Mobile App (iOS / Android) với trải nghiệm mua sắm mượt mà, giỏ hàng đồng bộ, theo dõi vận đơn và tích điểm Loyalty.
- **Bán hàng tại quầy (POS - Point of Sale):** Giao diện POS phản hồi nhanh, hỗ trợ máy quét mã vạch (Barcode Scanner), phím tắt bán hàng, quản lý nhiều tab giỏ hàng đồng thời và in hóa đơn nhiệt.
- **Kênh bán sàn thương mại điện tử (Omnichannel Channels):** Kết nối đồng bộ tồn kho, đơn hàng và đối soát thanh toán với TikTok Shop và các đối tác bán lẻ.
- **Quản trị vận hành & kho (Admin CMS & ERP):** Quản lý chuỗi kho hàng, phiếu nhập/xuất/kiểm kê kho, chiến dịch Marketing/Livestream, báo cáo doanh thu tài chính thực tế và đồng bộ dữ liệu hai chiều với Google Sheets.

---

## 🏗️ Cấu Trúc Đa Nền Tảng & Ngăn Xếp Công Nghệ (Tech Stack)

```text
Truong_Thanh_Bookstore/
├── backend/    # RESTful API Service (NestJS 11 + MongoDB Mongoose 9 + Redis 7 + Socket.IO)
├── frontend/   # Web Storefront, POS & Admin CMS (Vue 3 Composition API + Vite 8 + Pinia + Tailwind CSS v4)
├── mobile/     # Ứng dụng Di động Cross-Platform (Flutter 3.x + Provider + Material Design 3)
├── docs/       # Kho tài liệu kiến trúc, cẩm nang triển khai, bảo mật & backlog nghiệp vụ
├── scripts/    # Các script hỗ trợ: replica mongo, load test, benchmark, seed dữ liệu
└── .github/    # Quy trình CI/CD Automation (GitHub Actions: test, lint, build, e2e, deploy)
```

| Phân hệ | Công nghệ lõi | Thư viện & Công cụ chính | Môi trường triển khai |
| :--- | :--- | :--- | :--- |
| **Backend REST API** | NestJS 11, TypeScript, Node.js 22 | Mongoose 9, Passport JWT, Socket.IO, `@nestjs/throttler`, `ioredis`, `pdfkit`, `exceljs`, Sentry | Docker Container / Cloud |
| **Frontend Web & Admin** | Vue 3 (Composition API), TypeScript, Vite 8 | Pinia, Tailwind CSS v4, Vue Router 4, Vue-Toastification, Vue-i18n, Lucide Vue Next | Vercel / Nginx Container |
| **Mobile Application** | Flutter SDK (^3.11), Dart | Provider Pattern, `flutter_secure_storage`, `firebase_messaging`, Cached Network Image | Android (APK) & iOS |
| **Cơ Sở Dữ Liệu & Cache** | MongoDB 7.0 (Replica Set), Redis 7.2 | MongoDB Multi-Document Transactions, Compound & Text Indexes, Redis Token Blacklist | Atlas / Managed Mongo & Redis |
| **Kiểm Thử & Đảm Bảo Chất Lượng** | Jest, Vitest, Playwright, Flutter Test | Unit tests, Integration tests, Concurrency tests, Playwright E2E đa thiết bị | GitHub Actions CI Runner |

---

## 🧩 Các Phân Hệ & Module Nghiệp Vụ Cốt Lõi (18 Modules)

1. **Auth & Identity:** Xác thực JWT phân quyền 4 cấp (`SUPER_ADMIN`, `ADMIN`, `STAFF`, `CUSTOMER`), Refresh Token Rotation, chống brute-force và cơ chế Fail-Closed 3 secret keys độc lập.
2. **Products & Catalog:** Quản lý danh mục đa cấp, biến thể sản phẩm, tìm kiếm tiếng Việt không dấu, SEO meta và JSON-LD schema chuẩn hóa.
3. **Cart & POS Counter:** Hỗ trợ giỏ hàng khách lẻ, giỏ hàng khách vãng lai và phân hệ POS bán tại quầy (quét mã vạch tự động thêm sản phẩm, chuyển đổi nhanh tab đơn hàng).
4. **Orders & Checkout:** Đặt hàng đa bước, kiểm tra tồn kho thời gian thực, khóa đơn chống gửi trùng (`useSubmitLock`), tính phí giao hàng và xuất hóa đơn PDF.
5. **Sales Channels (Omnichannel):** Quản lý kênh bán hàng ngoài (TikTok Shop), mapping mã SKU, Webhook Inbox xử lý sự kiện đơn hàng và đối soát thanh toán.
6. **Marketing & Campaigns:** Động cơ chiến dịch marketing, banner quảng cáo, quản lý livestream bán sách, tạo kịch bản video TikTok tự động và đo lường chuyển đổi Attribution / Pixel Consent.
7. **Inventory & Warehouses:** Quản lý đa kho hàng, phiếu nhập kho, phiếu xuất kho, phiếu kiểm kê cân bằng kho và báo giá nhà cung cấp.
8. **Payments & Cashbook:** Tích hợp COD, VietQR động, VNPay 2.1.0, MoMo IPN; quản lý sổ quỹ thu chi (Cashbook) đối soát dòng tiền.
9. **Promotions & Flash Sale:** Mã giảm giá theo phần trăm/tiền mặt, điều kiện đơn tối thiểu, đếm ngược Flash Sale và quản lý hạn mức sử dụng.
10. **Data Exchange:** Nhập/xuất dữ liệu sản phẩm qua file Excel (`exceljs`), tự động đồng bộ hai chiều với Google Sheets.
11. **Reviews & Rating:** Đánh giá sản phẩm đã mua có xác thực (`isVerifiedPurchase`), tải ảnh thực tế và phản hồi từ quản trị viên.
12. **Notifications & Alerts:** Thông báo đẩy đa kênh (In-app, WebSocket Socket.IO thời gian thực và Firebase Cloud Messaging).
13. **Reports & Analytics:** Báo cáo doanh thu tài chính thực tế bằng MongoDB Aggregation Pipeline, biểu đồ tăng trưởng theo ngày/tuần/tháng/năm.
14. **Landing Pages:** Trình tạo và xuất bản trang bán hàng đơn combo/sách lẻ với Idempotency Key chống tạo đơn trùng lặp.

---

## 🛡️ Tiêu Chuẩn Bảo Mật & Kiến Trúc (Architecture Guardrails)

- **🔐 3 Khóa Bí Mật Độc Lập (Fail-Closed):** Phân tách tuyệt đối giữa `JWT_SECRET`, `JWT_REFRESH_SECRET` và `JWT_RESET_SECRET`. Nếu bất kỳ khóa nào thiếu hoặc bị trùng nhau, backend sẽ lập tức dừng khởi động ở môi trường Production.
- **🍪 Cookie Bảo Mật HttpOnly:** Auth tokens được lưu trữ an toàn trong HttpOnly Cookies; JavaScript trên trình duyệt không thể truy cập trực tiếp, triệt tiêu nguy cơ XSS đánh cắp phiên.
- **🛡️ Chống Dò Quét & IDOR:** Cơ chế Anti-Email Enumeration trả về thông báo bảo mật thống nhất cho luồng quên mật khẩu; kiểm soát quyền sở hữu tài nguyên nghiêm ngặt, ngăn chặn khách hàng xem hoặc thao tác trên đơn hàng của người khác.
- **⚡ Giao Dịch Nguyên Tử (Atomic Transactions):** Nghiệp vụ chốt đơn hàng và trừ kho sử dụng MongoDB Session Transaction trên Replica Set, đảm bảo không bao giờ xảy ra tình trạng bán vượt tồn kho (overselling) hoặc lệch số liệu.

---

## ⚙️ Biến Môi Trường Cần Thiết (.env)

Tạo file `backend/.env` từ file mẫu `backend/.env.example`:

| Biến Môi Trường | Mô Tả | Giá Trị Mẫu / Yêu Cầu |
| :--- | :--- | :--- |
| `NODE_ENV` | Môi trường thực thi | `development` / `production` / `test` |
| `PORT` | Cổng dịch vụ API Backend | `3000` |
| `MONGODB_URI` | Chuỗi kết nối MongoDB Replica Set | `mongodb://localhost:27017/truong_thanh_bookstore?replicaSet=rs0` |
| `REDIS_URL` | Địa chỉ kết nối Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Khóa bí mật ký Access Token | Tối thiểu 32 ký tự, không trùng với refresh/reset secret |
| `JWT_REFRESH_SECRET` | Khóa bí mật ký Refresh Token | Tối thiểu 32 ký tự, không trùng với access/reset secret |
| `JWT_RESET_SECRET` | Khóa bí mật ký Reset Password Token | Tối thiểu 32 ký tự, không trùng với access/refresh secret |
| `JWT_EXPIRES_IN` | Thời gian sống của Access Token | `15m` |
| `JWT_REFRESH_EXPIRES_IN`| Thời gian sống của Refresh Token | `30d` |
| `FRONTEND_URL` | Danh sách URL Frontend cho phép CORS | `http://localhost:5173` |
| `COOKIE_SAME_SITE` | Cấu hình SameSite cho cookie | `lax` (cùng domain) / `none` (khác domain) |
| `COOKIE_SECURE` | Cờ Secure HTTPS cho cookie | `false` (dev local) / `true` (prod hoặc khi `none`) |

---

## ⚡ Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### 🐳 Cách 1: Khởi chạy toàn bộ hệ thống bằng Docker Compose (Khuyến nghị)

```bash
# 1. Khởi chạy toàn bộ stack: MongoDB ReplicaSet, Redis, Backend và Frontend
docker compose up -d --build

# 2. Kiểm tra trạng thái các container đang chạy
docker compose ps
```

Các địa chỉ truy cập cục bộ:
- **Web Storefront & Admin CMS:** [http://localhost](http://localhost) (Port 80)
- **Backend RESTful API:** [http://localhost:3000/api](http://localhost:3000/api)
- **Tài liệu Swagger OpenAPI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Health Check Endpoint:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

### 💻 Cách 2: Khởi chạy thủ công từng phân hệ

#### 1. Khởi chạy Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
# API Server: http://localhost:3000/api
# Swagger Docs: http://localhost:3000/api/docs
```

#### 2. Khởi chạy Frontend Web (Vue 3 Storefront, POS & Admin)
```bash
cd frontend
npm install
npm run dev
# Web App: http://localhost:5173
```

#### 3. Khởi chạy Mobile App (Flutter)
```bash
cd mobile
flutter pub get
flutter run
```

---

## 🧪 Kiểm Thử Tự Động & Đảm Bảo Chất Lượng (Quality Assurance)

Hệ thống sở hữu bộ kiểm thử tự động toàn diện với **hơn 1,800+ automated tests (PASS 100%)**:

### 1. Kiểm thử Backend (NestJS + Jest)
```bash
cd backend

# Chạy toàn bộ 107 test suites / 1,180+ tests (Unit, Integration, Concurrency, Security P0/P1/P2)
npm test

# Kiểm tra chất lượng mã nguồn bằng ESLint
npm run lint

# Kiểm tra biên dịch production bundle
npm run build
```

### 2. Kiểm thử Frontend (Vitest + Vue-TSC + ESLint + Playwright E2E)
```bash
cd frontend

# Chạy toàn bộ 68 test suites / 475 unit & composable tests bằng Vitest
npm run test:unit

# Kiểm tra phân tích kiểu TypeScript (0 errors)
npm run typecheck

# Kiểm tra lint mã nguồn Vue 3 & TypeScript
npm run lint

# Kiểm tra build bundle Vite production
npm run build

# Chạy toàn bộ 17 kịch bản E2E Tests bằng Playwright (Desktop Chrome, Mobile Viewport, Barcode Scanner, Auth Lifecycle)
npm run test:e2e
```

### 3. Kiểm thử Mobile (Flutter Analyze & Tests)
```bash
cd mobile

# Kiểm tra phân tích tĩnh mã nguồn Dart (0 warnings / 0 issues)
flutter analyze

# Chạy 22 test suites / 141 tests (Unit, Widget, API Contract Parity)
flutter test
```

---

## 🔒 Quy Tắc Phát Triển & Bảo Vệ Nhánh (Git Hygiene & Quality Gates)

Để đảm bảo tính toàn vẹn và độ tin cậy của mã nguồn trên nhánh `main`:

1. **Tuân thủ quy tắc Agent:** Thực hiện theo các tiêu chuẩn kỹ thuật quy định trong [AGENTS.md](AGENTS.md).
2. **Quality Gate CI Pipeline:** Tất cả các kiểm tra tự động (`test:unit`, `lint`, `typecheck`, `build`, `test:e2e`) trên GitHub Actions phải đạt trạng thái **PASS 100% (0 errors)**.
3. **Chống Replay & Race Condition:** Mọi thay đổi nghiệp vụ liên quan đến kho hàng, POS và thanh toán bắt buộc phải có unit/integration test chứng minh an toàn dữ liệu và tính nguyên tử.
4. **Không Hardcode Thông Tin Nhạy Cảm:** Nghiêm cấm commit mật khẩu, private key, JWT secret hoặc thông tin thanh toán thật vào repository.

---

## 📚 Kho Tài Liệu Dự Án (Documentation Hub)

Các tài liệu nghiệp vụ, kiến trúc và sổ tay vận hành chi tiết được lưu trữ tại thư mục `docs/`:

- 📋 [AGENTS.md](AGENTS.md) — Quy tắc làm việc tiêu chuẩn dành cho AI Engineering Agent (Cursor, Codex, Claude Code, Antigravity).
- 📘 [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) — Cẩm nang toàn diện: Kiến trúc hệ thống, 18 modules, sơ đồ dữ liệu, bảo mật và nghiệp vụ thương mại điện tử.
- 📝 [docs/PENDING_TASKS.md](docs/PENDING_TASKS.md) — Danh mục công việc & kế hoạch triển khai chi tiết theo từng sprint.
- 📱 [docs/MARKETING_OMNICHANNEL_IMPLEMENTATION_PLAYBOOK.md](docs/MARKETING_OMNICHANNEL_IMPLEMENTATION_PLAYBOOK.md) — Playbook kiến trúc & quy trình triển khai phân hệ Bán hàng đa kênh (Omnichannel) & Marketing.
- 🚀 [docs/DEPLOYMENT_AND_RECONCILIATION_RUNBOOK.md](docs/DEPLOYMENT_AND_RECONCILIATION_RUNBOOK.md) — Sổ tay triển khai hạ tầng, quy trình vận hành và đối soát thanh toán.

---

<div align="center">
  <sub>© 2026 CÔNG TY TNHH GIÁO DỤC & PHÁT TRIỂN TRƯỜNG THÀNH. All rights reserved.</sub>
</div>
