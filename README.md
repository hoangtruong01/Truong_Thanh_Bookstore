# 📚 TRƯỜNG THÀNH BOOKSTORE — HỆ THỐNG QUẢN LÝ NHÀ SÁCH TRỰC TUYẾN

Chào mừng đến với dự án **Trường Thành Bookstore** — Hệ thống bán hàng trực tuyến và bảng điều khiển quản trị (Admin Dashboard) dành cho nhà sách & văn phòng phẩm chuyên nghiệp.

Dự án được xây dựng với cấu trúc **Fullstack hiện đại**, bảo mật cao và khả năng mở rộng tốt, phục vụ cả khách hàng mua sắm lẫn quản trị viên vận hành.

---

## 🚀 Tính Năng Nổi Bật

### 🛒 Phía Khách Hàng (Storefront)

| Tính năng | Mô tả |
|-----------|-------|
| **Trang chủ (Home)** | Banner giới thiệu, danh mục nổi bật, sản phẩm bán chạy, đang giảm giá & hàng mới về |
| **Tìm kiếm & Lọc sản phẩm** | Lọc theo danh mục phân cấp (cha – con), giá bán, từ khóa & sắp xếp đa dạng |
| **Chi tiết sản phẩm** | Xem ảnh chi tiết, mô tả, kiểm tra tồn kho, đánh giá sản phẩm & sản phẩm liên quan |
| **Giỏ hàng (Cart)** | Cập nhật số lượng động, áp dụng mã coupon & tính toán chi tiết phí giao hàng |
| **Thanh toán (Checkout)** | Chọn phương thức thanh toán (COD, Chuyển khoản, Ví điện tử) & đặt hàng trực tiếp |
| **Lịch sử đơn hàng** | Xem danh sách đơn hàng đã đặt, chi tiết đơn & hủy đơn hàng |
| **Deal Hot** | Trang tổng hợp các sản phẩm đang có chương trình khuyến mãi nổi bật |
| **Landing Page khuyến mãi** | Trang đích chiến dịch khuyến mãi được tạo bởi AI (Gemini) |
| **Đăng nhập & Đăng ký** | Hệ thống xác thực JWT an toàn với mã hóa localStorage |
| **Cập nhật hồ sơ** | Chỉnh sửa tên, số điện thoại & ảnh đại diện (upload Cloudinary) |

### 🛡 Phía Quản Trị Viên (Admin Dashboard)

| Tính năng | Mô tả |
|-----------|-------|
| **Tổng quan (Dashboard)** | Thống kê doanh thu, tổng đơn hàng, sản phẩm sắp hết hàng, biểu đồ doanh thu & đơn hàng mới nhất |
| **Quản lý sản phẩm** | Tìm kiếm, lọc theo danh mục, thêm/sửa/xóa sản phẩm với form chi tiết |
| **Quản lý đơn hàng** | Danh sách đơn hàng, trạng thái thanh toán & cập nhật trạng thái (Chờ xử lý → Xác nhận → Đang giao → Hoàn thành / Hủy) |
| **Quản lý kho hàng** | Quản lý mức tồn kho, lịch sử giao dịch nhập/xuất/điều chỉnh kho |
| **Quản lý khách hàng** | Danh sách khách hàng, thống kê số đơn đã đặt & tổng chi tiêu |
| **Mã khuyến mãi (Promotions)** | Quản lý mã giảm giá theo phần trăm hoặc số tiền cố định, giới hạn lượt sử dụng & đơn tối thiểu |
| **Combo sản phẩm** | Tạo và quản lý các combo sản phẩm đi kèm |
| **Trang Landing Page** | Tạo trang chiến dịch khuyến mãi động bằng AI (Gemini) |
| **Báo cáo doanh thu** | Thống kê doanh số theo khoảng thời gian tùy chọn |

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

### Frontend

| Công nghệ | Phiên bản | Mô tả |
|------------|-----------|-------|
| **Vue 3** | `^3.5` | Framework SFC + Composition API |
| **Vite** | `^8.0` | Bundler siêu nhanh cho development |
| **TypeScript** | `~6.0` | Kiểu dữ liệu tĩnh |
| **Pinia** | `^3.0` | State Management |
| **Vue Router** | `^4.6` | Định tuyến SPA |
| **Tailwind CSS** | `^4.3` | Utility-first CSS framework |
| **Axios** | `^1.18` | HTTP Client |
| **Chart.js / vue-chartjs** | `^4.5 / ^5.3` | Thư viện vẽ biểu đồ |
| **Vue Toastification** | `^2.0-rc.5` | Thông báo toast UI |
| **VueUse** | `^14.3` | Composables tiện ích |

### Backend

| Công nghệ | Phiên bản | Mô tả |
|------------|-----------|-------|
| **NestJS** | `^11.0` | Framework Node.js có kiến trúc module |
| **TypeScript** | `^5.7` | Kiểu dữ liệu tĩnh |
| **MongoDB** | — | Cơ sở dữ liệu NoSQL |
| **Mongoose** | `^9.7` | ODM cho MongoDB |
| **Passport JWT** | `^4.0` | Xác thực JWT |
| **Bcrypt** | `^6.0` | Mã hóa mật khẩu |
| **class-validator & class-transformer** | `^0.15 / ^0.5` | Validation DTO |
| **@nestjs/throttler** | `^6.5` | Rate Limiting chống brute-force |
| **@nestjs/swagger** | `^11.4` | Tự sinh tài liệu API (Swagger UI) |
| **Cloudinary** | `^2.10` | Upload & quản lý ảnh đại diện |

### DevOps & Deployment

| Công nghệ | Mô tả |
|------------|-------|
| **Docker & Docker Compose** | Containerization cho môi trường local (MongoDB + Backend) |
| **GitHub Actions** | CI/CD: `backend-ci.yml` (build backend), `frontend-ci.yml` (build frontend), `deploy.yml` (auto deploy) |
| **Render** | Deploy Backend API (Web Service) |
| **Vercel** | Deploy Frontend SPA |

---

## 📂 Cấu Trúc Dự Án

```
truong_thanh_store/
├── .github/workflows/          # CI/CD pipelines
│   ├── backend-ci.yml          # Build & kiểm tra backend khi có thay đổi
│   ├── frontend-ci.yml         # Build & kiểm tra frontend khi có thay đổi
│   └── deploy.yml              # Auto deploy lên Render & Vercel khi push main
├── backend/                    # NestJS Backend API
│   └── src/
│       ├── main.ts             # Entry point — CORS, Pipes, Filters, Swagger
│       ├── app.module.ts       # Root Module — Mongoose, Config, Throttler
│       ├── app.controller.ts   # Health check endpoint
│       ├── common/             # Tiện ích dùng chung
│       │   ├── decorators/     # @GetUser — lấy user từ JWT
│       │   ├── dto/            # PaginationDto dùng chung
│       │   ├── enums/          # UserRole, OrderStatus, DiscountType,...
│       │   ├── filters/        # HttpExceptionFilter chuẩn hóa lỗi
│       │   ├── guards/         # OptionalJwtGuard
│       │   └── interceptors/   # TransformInterceptor { statusCode, message, data }
│       ├── modules/
│       │   ├── auth/           # Đăng ký, đăng nhập, JWT, bcrypt, profile
│       │   ├── users/          # Quản lý tài khoản người dùng
│       │   ├── categories/     # Danh mục sản phẩm (phân cấp cha — con)
│       │   ├── products/       # Quản lý sản phẩm & đánh giá (reviews)
│       │   ├── orders/         # Xử lý đơn hàng, khóa giá, kiểm kho nguyên tử
│       │   ├── inventory/      # Nhập/xuất/điều chỉnh kho, log giao dịch
│       │   ├── customers/      # Thông tin khách hàng (Admin view)
│       │   ├── promotions/     # Mã giảm giá, chặn dùng trùng, giới hạn tối đa
│       │   ├── reports/        # Thống kê doanh thu, báo cáo Dashboard
│       │   ├── landing-pages/  # Trang đích khuyến mãi (AI-generated)
│       │   └── notifications/  # Hệ thống thông báo
│       └── seeds/              # Seed data — tạo tài khoản mẫu & dữ liệu khởi tạo
├── frontend/                   # Vue 3 Frontend SPA
│   └── src/
│       ├── main.ts             # Entry point — nạp Router, Pinia, Toast
│       ├── App.vue             # Root Component với <router-view />
│       ├── style.css           # Tailwind CSS & custom styles
│       ├── assets/             # Tài nguyên tĩnh (ảnh, logo, background)
│       ├── components/         # Component tái sử dụng (ProductCard, ProfileModal)
│       ├── composables/        # Composition API dùng chung (useScrollReveal)
│       ├── layouts/            # AdminLayout, CustomerLayout
│       ├── pages/
│       │   ├── NotFound.vue    # Trang lỗi 404
│       │   ├── customer/       # Home, ProductList, ProductDetail, Cart,
│       │   │                   # Checkout, Login, Register, MyOrders,
│       │   │                   # DealHot, LandingPageDetail
│       │   └── admin/          # Dashboard, Products, ProductForm, Orders,
│       │                       # Inventory, Customers, Promotions, Combos,
│       │                       # LandingPages, Reports
│       ├── router/             # Vue Router — Lazy Loading & Navigation Guards
│       ├── services/           # Axios services cho từng module API
│       ├── stores/             # Pinia Stores (auth.ts, cart.ts)
│       ├── types/              # TypeScript interfaces (Product, Order, User,...)
│       └── utils/              # Helpers (formatCurrency, encryptToken, api.ts)
├── docker-compose.yml          # Docker Compose — MongoDB + Backend
└── project_overview.md         # Tài liệu kỹ thuật chi tiết dự án
```

---

## 🔑 Tài Khoản Thử Nghiệm (Seed Data)

Khi khởi chạy ứng dụng lần đầu tiên, hệ thống sẽ tự động gieo mầm (Seed) dữ liệu mẫu bao gồm danh mục, sản phẩm mẫu và các tài khoản thử nghiệm:

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| 🔐 **Quản trị viên (Admin)** | `admin@truongthanh.vn` | `Admin@123456` |
| 👤 **Khách hàng (Customer)** | `customer@truongthanh.vn` | `Customer@123456` |

---

## 💻 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Hệ Thống

- **Node.js** >= 20
- **npm** >= 9
- **MongoDB** (local hoặc MongoDB Atlas)
- **Docker** (tùy chọn, cho cách chạy nhanh)

### Cách 1: Khởi chạy bằng Docker Compose (Khuyên Dùng)

```bash
# Clone dự án và chạy Docker Compose tại thư mục gốc
docker-compose up --build
```

Ứng dụng sẽ tự động khởi tạo:

| Dịch vụ | URL |
|---------|-----|
| **Backend API** | `http://localhost:3000` |
| **Swagger API Docs** | `http://localhost:3000/api/docs` |
| **MongoDB** | `localhost:27017` |

### Cách 2: Chạy thủ công trên Local

#### 🔧 Cài đặt Backend

```bash
cd backend

# Tạo file .env từ mẫu
cp .env.example .env

# Cài đặt dependencies
npm install

# Chạy server ở chế độ dev (tự động restart khi thay đổi code)
npm run start:dev
```

**Cấu hình `.env` Backend:**

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/truong-thanh-stationery
JWT_SECRET=TruongThanhSuperSecretKey2026!
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173

# Tùy chọn
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_SHEET_WEBAPP_URL=https://script.google.com/macros/s/xxxx/exec
```

#### 🎨 Cài đặt Frontend

```bash
cd frontend

# Tạo file .env từ mẫu
cp .env.example .env

# Cài đặt dependencies
npm install

# Chạy client ở chế độ dev
npm run dev
```

**Cấu hình `.env` Frontend:**

```env
VITE_API_URL=http://localhost:3000/api
```

| Dịch vụ | URL |
|---------|-----|
| **Cửa hàng (Frontend)** | `http://localhost:5173` |

---

## 🔒 Bảo Mật & Tối Ưu

| Biện pháp | Chi tiết |
|-----------|----------|
| **Rate Limiting** | `@nestjs/throttler` bảo vệ API Auth chống brute-force (100 req/phút) |
| **CORS Security** | Cấu hình đa domain động qua biến `FRONTEND_URL` (phân tách bằng dấu phẩy) |
| **Input Validation** | Mọi API bắt buộc qua ValidationPipe + class DTO, chống NoSQL Injection |
| **JWT Expiration** | Token hết hạn sau 7 ngày, tránh token tồn tại mãi mãi |
| **localStorage Encryption** | Mã hóa token & profile lưu trên trình duyệt |
| **Password Protection** | Hash bcrypt & loại bỏ trường password khỏi response API |
| **ReDoS Prevention** | Giới hạn chuỗi tìm kiếm tối đa 100 ký tự trước khi chạy Regex |
| **Atomic Stock Check** | MongoDB atomic update ngăn chặn race condition gây âm kho |
| **Lazy Loading** | Toàn bộ routes Frontend được tải chậm, giảm bundle tải về ban đầu |

---

## 📦 CI/CD & Deployment

### GitHub Actions Workflows

| Workflow | Trigger | Mô tả |
|----------|---------|-------|
| `backend-ci.yml` | Push/PR thay đổi `backend/**` | Checkout → Setup Node 20 → `npm ci` → `npm run build` |
| `frontend-ci.yml` | Push/PR thay đổi `frontend/**` | Checkout → Setup Node 20 → `npm ci` → `npm run build` |
| `deploy.yml` | Push lên `main` | Auto deploy Backend lên **Render** (Deploy Hook) & Frontend lên **Vercel** (Vercel CLI) |

### Deploy Backend lên Render

1. Đăng ký **MongoDB Atlas** và thêm IP `0.0.0.0/0` vào Access List.
2. Tạo **Web Service** trên Render:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start:prod`
3. Thêm **Environment Variables** trên Render Dashboard: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `CLOUDINARY_*`.
4. *(Khuyến nghị)* Thiết lập **Cron-job** (cron-job.org / UptimeRobot) ping đến `https://<BACKEND_URL>/api/health` mỗi **10–14 phút** để giữ Render Free Tier không bị ngủ.

### Deploy Frontend lên Vercel

1. Kết nối Vercel với kho mã nguồn GitHub.
2. Cấu hình:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Thêm biến `VITE_API_URL` trỏ về địa chỉ Render Backend.
4. File `frontend/vercel.json` đã cấu hình tự động URL rewrites, tránh lỗi 404 khi reload trang con.

---

## 📡 API Endpoints Chính

| Nhóm | Phương thức | Endpoint | Quyền | Mô tả |
|------|-------------|----------|-------|-------|
| **Auth** | `POST` | `/api/auth/register` | Public | Đăng ký tài khoản |
| | `POST` | `/api/auth/login` | Public | Đăng nhập (rate limit) |
| | `GET` | `/api/auth/me` | Auth | Lấy thông tin cá nhân |
| | `PUT` | `/api/auth/profile` | Auth | Cập nhật hồ sơ & avatar |
| **Products** | `GET` | `/api/products` | Public | Tìm kiếm, phân trang, lọc |
| | `GET` | `/api/products/:id` | Public | Chi tiết sản phẩm |
| | `POST` | `/api/products` | Admin/Staff | Tạo sản phẩm mới |
| | `PUT` | `/api/products/:id` | Admin/Staff | Cập nhật sản phẩm |
| | `DELETE` | `/api/products/:id` | Admin/Staff | Soft-delete sản phẩm |
| | `GET` | `/api/products/:id/reviews` | Public | Xem đánh giá sản phẩm |
| | `POST` | `/api/products/:id/reviews` | Auth | Thêm đánh giá mới |
| **Orders** | `POST` | `/api/orders` | Public/Guest | Tạo đơn hàng (tính giá server-side) |
| | `GET` | `/api/orders/my-orders` | Auth | Lịch sử đơn hàng cá nhân |
| | `GET` | `/api/orders/:id` | Auth | Chi tiết đơn hàng |
| | `POST` | `/api/orders/:id/cancel` | Auth | Hủy đơn (kiểm tra sở hữu) |
| | `GET` | `/api/orders` | Admin/Staff | Quản trị toàn bộ đơn hàng |
| | `PUT` | `/api/orders/:id/status` | Admin/Staff | Cập nhật trạng thái đơn |
| **Inventory** | `GET` | `/api/inventory` | Admin/Staff | Toàn bộ kho hàng |
| | `GET` | `/api/inventory/low` | Admin/Staff | Hàng sắp hết / hết sạch |
| | `POST` | `/api/inventory/import` | Admin/Staff | Nhập kho |
| | `POST` | `/api/inventory/export` | Admin/Staff | Xuất kho |
| **Promotions** | `POST` | `/api/promotions/apply` | Public/Guest | Áp dụng & tính voucher |
| | `GET` | `/api/promotions/active` | Public | Danh sách coupon hoạt động |
| **Reports** | `GET` | `/api/reports/dashboard` | Admin/Staff | Tổng quan Dashboard |
| | `GET` | `/api/reports/revenue` | Admin/Staff | Doanh thu theo dải ngày |
| **Health** | `GET` | `/api/health` | Public | Kiểm tra sức khỏe server |

> 📖 Xem tài liệu API đầy đủ tại **Swagger UI**: `http://localhost:3000/api/docs`

---

## 📜 Giấy Phép

Dự án này thuộc quyền sở hữu riêng tư (**UNLICENSED**).
