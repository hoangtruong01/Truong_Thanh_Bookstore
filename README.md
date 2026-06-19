# TRƯỜNG THÀNH STATIONERY - HỆ THỐNG QUẢN LÝ VĂN PHÒNG PHẨM

Chào mừng đến với dự án **Trường Thanh Stationery** — Hệ thống bán hàng trực tuyến và bảng điều khiển (Admin Dashboard) quản lý văn phòng phẩm, dụng cụ học sinh chuyên nghiệp.

Dự án được xây dựng với cấu trúc Fullstack hiện đại, bảo mật và khả năng mở rộng cao.

---

## 🚀 Tính Năng Nổi Bật

### 1. Khách hàng (Storefront)
*   **Trang chủ (Home):** Banner giới thiệu, danh mục nổi bật, sản phẩm bán chạy, đang giảm giá & hàng mới về.
*   **Tìm kiếm & Lọc (Product Search):** Lọc theo danh mục cây, giá bán, từ khóa & sắp xếp đa dạng.
*   **Chi tiết sản phẩm (Product Detail):** Xem ảnh chi tiết, mô tả, kiểm tra tồn kho & xem các sản phẩm liên quan.
*   **Giỏ hàng (Cart):** Cập nhật số lượng động, áp dụng mã coupon & tính toán chi tiết phí giao hàng.
*   **Thanh toán (Checkout):** Chọn phương thức thanh toán (COD, Chuyển khoản, Ví điện tử) & đặt hàng trực tiếp.
*   **Đăng nhập & Đăng ký:** Hệ thống xác thực JWT an toàn.

### 2. Quản Trị Viên (Admin Dashboard)
*   **Tổng quan (Dashboard):** Thống kê doanh thu hôm nay, tổng số đơn, sản phẩm sắp hết hàng, biểu đồ và đơn hàng mới nhất.
*   **Quản lý sản phẩm (Products):** Tìm kiếm, lọc theo danh mục, thêm mới/sửa đổi thông tin chi tiết và xóa sản phẩm.
*   **Quản lý đơn hàng (Orders):** Danh sách đơn hàng chi tiết, trạng thái thanh toán & cập nhật trạng thái đơn (Chờ xử lý, Đã xác nhận, Đang giao, Hoàn thành, Hủy).
*   **Quản lý kho hàng (Inventory):** Quản lý mức tồn kho, lịch sử giao dịch và điều chỉnh nhập/xuất kho.
*   **Quản lý khách hàng (Customers):** Danh sách khách hàng, thống kê số lượng đơn hàng đã đặt và tổng chi tiêu thực tế.
*   **Mã khuyến mãi (Promotions):** Quản lý mã giảm giá theo phần trăm hoặc số tiền cố định, giới hạn lượt sử dụng và điều kiện đơn hàng tối thiểu.
*   **Báo cáo doanh thu (Reports):** Thống kê doanh số theo ngày tùy chọn khoảng thời gian chi tiết.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

### Frontend
*   **Framework:** Vue 3 (Vite) + TypeScript
*   **State Management:** Pinia
*   **Router:** Vue Router
*   **Styling:** Tailwind CSS v4
*   **Toast notification:** Vue Toastification
*   **HTTP Client:** Axios

### Backend
*   **Framework:** NestJS + TypeScript
*   **Database:** MongoDB
*   **ODM:** Mongoose
*   **Validation:** class-validator & class-transformer
*   **Security:** Passport JWT, Bcrypt
*   **Documentation:** Swagger API (/api/docs)

### DevOps & Deployment
*   **Containerization:** Docker & Docker Compose (local development)
*   **CI/CD:** GitHub Actions (lint, build & auto deployment)
*   **Deploy Backend:** Render
*   **Deploy Frontend:** Vercel

---

## 🔑 Tài Khoản Thử Nghiệm (Seed Data)

Khi khởi chạy ứng dụng lần đầu tiên, hệ thống sẽ tự động gieo mầm (Seed) dữ liệu mẫu bao gồm danh mục, sản phẩm mẫu và 2 tài khoản thử nghiệm:

1.  **Quản trị viên (Admin):**
    *   **Email:** `admin@truongthanh.vn`
    *   **Mật khẩu:** `Admin@123456`
2.  **Khách hàng thành viên (Customer):**
    *   **Email:** `customer@truongthanh.vn`
    *   **Mật khẩu:** `Customer@123456`

---

## 💻 Hướng Dẫn Cài Đặt và Chạy Dự Án

### 1. Khởi chạy bằng Docker Compose (Khuyên Dùng)

Bạn cần cài đặt sẵn Docker trên máy tính, chạy lệnh sau ở thư mục gốc:

```bash
docker-compose up --build
```

Ứng dụng sẽ tự động tải hình ảnh MongoDB, xây dựng backend API và khởi chạy:
*   **Backend API:** `http://localhost:3000`
*   **Swagger API Docs:** `http://localhost:3000/api/docs`
*   **MongoDB Local Port:** `27017`

### 2. Chạy thủ công trên Local

#### Cài đặt Backend:
1.  Truy cập thư mục `backend`:
    ```bash
    cd backend
    ```
2.  Tạo file `.env` từ `.env.example` và cấu hình cổng hoặc MongoDB URI:
    ```bash
    cp .env.example .env
    ```
3.  Cài đặt dependencies và chạy chế độ dev:
    ```bash
    npm install
    npm run start:dev
    ```

#### Cài đặt Frontend:
1.  Truy cập thư mục `frontend`:
    ```bash
    cd ../frontend
    ```
2.  Tạo file `.env` từ `.env.example` và thiết lập API URL:
    ```bash
    cp .env.example .env
    ```
3.  Cài đặt dependencies và chạy chế độ dev:
    ```bash
    npm install
    npm run dev
    ```
    *   **Cửa hàng:** `http://localhost:5173`

---

## 📦 CI/CD & Deploy

*   Mọi thay đổi trên nhánh `main` sẽ được GitHub Actions tự động kiểm tra cú pháp, đóng gói biên dịch lỗi và kích hoạt triển khai trực tiếp lên **Render** (cho API backend) và **Vercel** (cho giao diện frontend).
*   Xem chi tiết các tệp cấu hình trong thư mục `.github/workflows/`.
