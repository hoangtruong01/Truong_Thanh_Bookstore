# 📘 HƯỚNG DẪN KHỞI ĐỘNG MÔI TRƯỜNG PHÁT TRIỂN CỤC BỘ (LOCAL SETUP GUIDE)
> **Dự án:** Nhà sách Trường Thành (Trường Thành Bookstore)  
> **Phiên bản tài liệu:** 1.0 (Chuẩn hóa cho Local MVP — Sprint 1)  
> **Áp dụng cho:** Toàn bộ thành viên phát triển Backend, Frontend, Full-stack, Mobile & QA.

---

## 📑 MỤC LỤC
1. [💻 Yêu Cầu Tiên Quyết (Prerequisites)](#1--yêu-cầu-tiên-quyết-prerequisites)
2. [⚙️ Thiết Lập Biến Môi Trường (.env)](#2-️-thiết-lập-biến-môi-trường-env)
3. [🐳 Khởi Động Hạ Tầng Bằng Docker (MongoDB & Redis)](#3--khởi-động-hạ-tầng-bằng-docker-mongodb--redis)
4. [🌱 Cài Đặt & Nạp Dữ Liệu Mẫu (Database Seeding)](#4--cài-đặt--nạp-dữ-liệu-mẫu-database-seeding)
5. [🚀 Khởi Động Ứng Dụng (Backend & Frontend)](#5--khởi-động-ứng-dụng-backend--frontend)
6. [🔑 Danh Sách Tài Khoản & Dữ Liệu Kiểm Thử](#6--danh-sách-tài-khoản--dữ-liệu-kiểm-thử)
7. [🛠️ Xử Lý Sự Cố Thường Gặp (Troubleshooting)](#7-️-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. 💻 Yêu Cầu Tiên Quyết (Prerequisites)

Trước khi bắt đầu, đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
* **Node.js:** Phiên bản **`22.12.0 LTS`** trở lên (Khuyến nghị dùng [nvm](https://github.com/nvm-sh/nvm) hoặc nvm-windows).
  ```bash
  # Kiểm tra phiên bản Node
  node -v   # Yêu cầu: >= v22.12.0
  npm -v    # Yêu cầu: >= 10.0.0

  # Nếu sử dụng nvm:
  nvm use   # Tự động đọc phiên bản từ file .nvmrc
  ```
* **Docker Desktop:** Đang chạy và hỗ trợ Docker Compose v2.
  ```bash
  docker --version
  docker compose version
  ```
* **Git:** Quản lý mã nguồn.

---

## 2. ⚙️ Thiết Lập Biến Môi Trường (.env)

Dự án đã chuẩn bị sẵn các tệp `.env.example` với các giá trị mặc định an toàn cho môi trường nội bộ. Bạn chỉ cần sao chép sang `.env`:

### Bước 2.1: Cấu hình thư mục gốc (Root) cho Docker Compose
```bash
# Trên macOS / Linux:
cp .env.example .env

# Trên Windows (PowerShell / CMD):
copy .env.example .env
```

### Bước 2.2: Cấu hình Backend
```bash
cd backend
copy .env.example .env
cd ..
```
> [!NOTE]
> File `backend/.env` mặc định đã trỏ tới MongoDB Replica Set `mongodb://admin:admin123456@127.0.0.1:27017/...` và Redis `redis://127.0.0.1:6379`. Bạn **không cần** đăng ký bất kỳ tài khoản đám mây hay dịch vụ trả phí nào để chạy local.

### Bước 2.3: Cấu hình Frontend
```bash
cd frontend
copy .env.example .env
cd ..
```

---

## 3. 🐳 Khởi Động Hạ Tầng Bằng Docker (MongoDB & Redis)

Hệ thống yêu cầu **MongoDB Replica Set** (phục vụ MongoDB Transactions) và **Redis** (phục vụ Rate Limiting & Throttler).

### Cách 1: Khởi động chỉ DB & Cache (Khuyến nghị cho lập trình viên Dev)
Chạy lệnh sau tại thư mục gốc:
```bash
docker compose up -d mongodb redis
```

Kiểm tra trạng thái container:
```bash
docker compose ps
```
Cả hai container `truongthanh-mongodb` và `truongthanh-redis` cần hiển thị trạng thái `healthy` hoặc `running`:
- **MongoDB Replica Set:** `127.0.0.1:27017` (Replica set: `rs0`)
- **Redis Server:** `127.0.0.1:6379`

### Cách 2: Khởi động toàn bộ hệ thống bằng Docker (Dành cho QA / Demo)
```bash
docker compose up -d
```
Lệnh này sẽ khởi động cả cụm: MongoDB, Redis, Backend (port 3000) và Frontend (port 80).

---

## 4. 🌱 Cài Đặt & Nạp Dữ Liệu Mẫu (Database Seeding)

Dự án cung cấp bộ công cụ CLI Seed độc lập, idempotent, cho phép tạo lập toàn bộ tập dữ liệu mẫu phục vụ kiểm thử ngay lập tức.

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các gói phụ thuộc (nếu chưa cài)
npm install

# Nạp dữ liệu mẫu an toàn (bảo toàn dữ liệu hiện có nếu đã có)
npm run seed

# HOẶC: Làm sạch toàn bộ database và nạp lại từ đầu (Fresh Reset)
npm run seed:reset
```

### Kết quả Seed bao gồm:
* 👥 **4 Tài khoản người dùng mẫu:** Super Admin, Admin, Staff, Customer.
* 📂 **7 Danh mục sách lớn:** Sách giáo khoa, Sách tham khảo, Truyện tranh, Văn phòng phẩm, Combo, Đồ chơi, Đồ lưu niệm.
* 📚 **Hơn 20 sản phẩm sách:** Bao gồm đầy đủ hình ảnh, giá tiền, thương hiệu.
* ⚠️ **1 Sản phẩm hết hàng mẫu (`stock: 0`):** *Vở Bài Tập Toán Lớp 1 - Bản Giới Hạn (Mẫu Hết Hàng)* — Dùng để kiểm thử chặn checkout hết hàng.
* 📦 **Bản ghi tồn kho Inventory** cho toàn bộ sản phẩm.
* 🎟️ **Mã giảm giá Khuyến mãi:**
  - `GIAM10K`: Giảm 10.000đ cho đơn từ 50.000đ.
  - `HE2026`: Giảm 10% cho đơn từ 100.000đ.
  - `TRUONGTHANH50`: Giảm 50.000đ cho đơn từ 300.000đ.
  - `EXPIRED2025`: Voucher đã hết hạn — Dùng để kiểm thử lỗi áp mã quá hạn.
* 🧾 **3 Đơn hàng mẫu:**
  - `ORD-TEST-PENDING`: Đơn COD đang chờ xác nhận (`PENDING`, `UNPAID`).
  - `ORD-TEST-PAID`: Đơn VNPay đã thanh toán (`CONFIRMED`, `PAID`).
  - `ORD-TEST-COMPLETED`: Đơn MoMo đã hoàn tất giao hàng (`COMPLETED`, `PAID`).

---

## 5. 🚀 Khởi Động Ứng Dụng (Backend & Frontend)

### 5.1. Khởi động Backend API (NestJS)
```bash
cd backend
npm run start:dev
```
* **REST API:** [http://localhost:3000/api](http://localhost:3000/api)
* **Swagger API Docs:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
* **Healthcheck API:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

### 5.2. Khởi động Frontend Web (Vue 3 + Vite)
Mở một cửa sổ Terminal mới:
```bash
cd frontend
npm install
npm run dev
```
* **Giao diện Cửa hàng:** [http://localhost:5173](http://localhost:5173)
* **Giao diện Quản trị Admin:** [http://localhost:5173/admin](http://localhost:5173/admin)

---

## 6. 🔑 Danh Sách Tài Khoản & Dữ Liệu Kiểm Thử

Hệ thống seed mặc định cung cấp 4 tài khoản theo từng vai trò:

| Vai Trò (Role) | Email Đăng Nhập | Mật Khẩu Mặc Định | Quyền Hạn Chính |
| :--- | :--- | :---: | :--- |
| **Super Admin** | `superadmin@truongthanh.vn` | `SuperAdmin@123456` | Toàn quyền hệ thống, quản lý tài khoản quản trị |
| **Admin** | `admin@truongthanh.vn` | `Admin@123456` | Quản lý sản phẩm, đơn hàng, danh mục, báo cáo |
| **Staff** | `staff@truongthanh.vn` | `Staff@123456` | Xử lý đơn hàng, xem báo cáo (hạn chế quyền xóa) |
| **Customer** | `customer@truongthanh.vn` | `Customer@123456` | Đặt hàng, giỏ hàng, đánh giá, lịch sử đơn |

---

## 7. 🛠️ Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### ❓ 1. Lỗi xung đột cổng `27017` hoặc `6379`
* **Nguyên nhân:** Máy tính của bạn đang chạy sẵn một instance MongoDB hoặc Redis cài đặt trực tiếp trên OS.
* **Cách khắc phục:** 
  - Tắt dịch vụ MongoDB/Redis local trên máy:
    - Windows Services: Tắt service `MongoDB` hoặc `Redis`.
  - Hoặc sửa port mapping trong `docker-compose.yml` (ví dụ: `"27018:27017"`).

### ❓ 2. Lỗi MongoDB Transaction: *"Transaction numbers are only allowed on a replica set member"*
* **Nguyên nhân:** Bạn đang kết nối tới MongoDB đơn lẻ (Standalone) thay vì Replica Set.
* **Cách khắc phục:** 
  - Chạy MongoDB thông qua Docker Compose: `docker compose up -d mongodb`. Container đã tích hợp sẵn script tự khởi tạo replica set `rs0`.
  - Đảm bảo chuỗi kết nối trong `backend/.env` có tham số: `?replicaSet=rs0&authSource=admin`.

### ❓ 3. Lỗi xác thực hoặc không kết nối được MongoDB
* Kiểm tra tài khoản root trong `docker-compose.yml` và `backend/.env`:
  - Username mặc định: `admin`
  - Password mặc định: `admin123456`
* Kiểm tra lệnh mongosh:
  ```bash
  docker exec -it truongthanh-mongodb mongosh -u admin -p admin123456 --authenticationDatabase admin
  ```

### ❓ 4. Muốn xóa sạch dữ liệu và làm lại từ đầu
```bash
# 1. Tắt container và xóa toàn bộ volumes cũ
docker compose down -v

# 2. Bật lại hạ tầng
docker compose up -d mongodb redis

# 3. Seed lại dữ liệu mới
cd backend
npm run seed:reset
```
