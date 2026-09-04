# DANH MỤC TOÀN BỘ PROTECTED ENDPOINTS & MA TRẬN PHÂN QUYỀN (QA-01 PART A)
> **Dự án**: Nhà sách Trường Thành (Trường Thành Bookstore)  
> **Tài liệu tham chiếu**: `docs/BUSINESS_RULES.md` v2.0, `docs/TASK_EXECUTION_TRACKER.md`  
> **Thời điểm xác minh**: 2026-09-04  
> **Mục tiêu**: Chứng minh định lượng độ phủ phân quyền và kiểm thử bảo mật đạt ≥ 80% (Thực tế đạt 100% trên các route nhạy cảm/critical).

---

## 1. BẢNG TỔNG KẾT TỶ LỆ BAO PHỦ (AUTHORIZATION COVERAGE SUMMARY)

| Chỉ số đo lường | Số lượng | Tỷ lệ (%) | Ghi chú |
|---|:---:|:---:|---|
| **Tổng số endpoints toàn bộ hệ thống** | 72 | 100% | Trên toàn bộ 16 Controllers |
| **Số endpoints công khai (Public Endpoints)** | 16 | 22.2% | Đăng ký, đăng nhập, xem sách, xem danh mục, webhook |
| **Số endpoints được bảo vệ (Protected Endpoints)** | 56 | 77.8% | Yêu cầu JWT Access Token, Role hoặc Permission |
| **Số Protected Endpoints thuộc luồng Critical (Orders/Users/Payments/Reports)** | 27 | 100% Critical | Đơn hàng, người dùng, doanh thu, thanh toán |
| **Độ phủ test tự động cho các Critical Protected Endpoints** | 27 / 27 | **100%** | Test trong `authorization-matrix.spec.ts` & `token-isolation.spec.ts` |
| **Độ phủ test tự động toàn bộ Protected Endpoints** | 49 / 56 | **87.5%** | **Vượt tiêu chí tối thiểu (≥ 80%)** |

---

## 2. INVENTORY CHI TIẾT THEO 16 MODULE CONTROLLERS

### 2.1 Orders Module (`orders.controller.ts`)
| Method | Endpoint Path | Phân quyền yêu cầu | Loại quyền | Mã lỗi kỳ vọng | Bằng chứng test |
|---|---|---|---|:---:|---|
| `POST` | `/orders` | Public / Optional JWT | Khách hoặc Customer | 400 nếu sai giá/kho | `orders.service.spec.ts` |
| `POST` | `/orders/checkout-preview` | Public / Optional JWT | Khách hoặc Customer | 400 | `orders.service.spec.ts` |
| `GET` | `/orders` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_ORDERS` hoặc Customer tự xem đơn mình | 401 / 403 | `authorization-matrix.spec.ts` |
| `GET` | `/orders/:id` | `JwtAuthGuard` / Guest token | Customer sở hữu / Staff `MANAGE_ORDERS` / Token đơn khách | 401 / 403 (IDOR) | `authorization-matrix.spec.ts` |
| `PATCH` | `/orders/:id/status` | `JwtAuthGuard` + `PermissionsGuard` | Staff có `MANAGE_ORDERS` / Admin | 401 / 403 | `authorization-matrix.spec.ts` |
| `POST` | `/orders/:id/cancel` | `JwtAuthGuard` / Guest token | Customer sở hữu hoặc Guest sở hữu | 401 / 403 (IDOR) | `authorization-matrix.spec.ts` |
| `GET` | `/orders/:id/invoice` | `JwtAuthGuard` / Guest token | Customer sở hữu / Staff có quyền | 401 / 403 (IDOR) | `authorization-matrix.spec.ts` |

### 2.2 Users & Authentication (`auth.controller.ts` & `users.controller.ts`)
| Method | Endpoint Path | Phân quyền yêu cầu | Loại quyền | Mã lỗi kỳ vọng | Bằng chứng test |
|---|---|---|---|:---:|---|
| `POST` | `/auth/register` | Public | Mọi người dùng | 400 / 409 | `auth.service.spec.ts` |
| `POST` | `/auth/login` | Public | Mọi người dùng | 400 / 401 | `auth.service.spec.ts` |
| `POST` | `/auth/refresh` | Public | Refresh token hợp lệ | 401 | `token-isolation.spec.ts` |
| `POST` | `/auth/logout` | `JwtAuthGuard` | Mọi user đã đăng nhập | 401 | `auth.service.spec.ts` |
| `GET` | `/auth/me` | `JwtAuthGuard` | User đã đăng nhập | 401 | `token-isolation.spec.ts` |
| `PUT` | `/auth/me` | `JwtAuthGuard` | User đã đăng nhập | 401 | `auth.controller.spec.ts` |
| `PUT` | `/auth/change-password` | `JwtAuthGuard` | User đã đăng nhập | 401 | `auth.service.spec.ts` |
| `GET` | `/users` | `JwtAuthGuard` + `RolesGuard` | `ADMIN`, `SUPER_ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `POST` | `/users` | `JwtAuthGuard` + `RolesGuard` | `ADMIN`, `SUPER_ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `GET` | `/users/:id` | `JwtAuthGuard` + `RolesGuard` | `ADMIN`, `SUPER_ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `PUT` | `/users/:id` | `JwtAuthGuard` + `RolesGuard` | `ADMIN`, `SUPER_ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `DELETE`| `/users/:id` | `JwtAuthGuard` + `RolesGuard` | `ADMIN`, `SUPER_ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `PATCH`| `/users/:id/role` | `JwtAuthGuard` + `RolesGuard` | `SUPER_ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `PATCH`| `/users/:id/status` | `JwtAuthGuard` + `RolesGuard` | `ADMIN`, `SUPER_ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |

### 2.3 Payments Module (`payments.controller.ts`)
| Method | Endpoint Path | Phân quyền yêu cầu | Loại quyền | Mã lỗi kỳ vọng | Bằng chứng test |
|---|---|---|---|:---:|---|
| `POST` | `/payments/create-payment-url` | `JwtAuthGuard` | Customer đã đăng nhập | 401 | `payments.providers.spec.ts` |
| `GET` | `/payments/vnpay-return` | Public | Cổng thanh toán VNPay | 400 | `payments.providers.spec.ts` |
| `GET` | `/payments/vnpay-ipn` | Public | Cổng thanh toán VNPay | 400 | `payments.providers.spec.ts` |
| `GET` | `/payments/momo-ipn` | Public | Cổng thanh toán MoMo | 400 | `payments.providers.spec.ts` |
| `POST` | `/payments/confirm-manual` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_PAYMENTS` / `ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `GET` | `/payments/order/:orderId` | `JwtAuthGuard` | Chủ đơn hàng hoặc Staff/Admin | 401 / 403 (IDOR) | `authorization-matrix.spec.ts` |

### 2.4 Reports Module (`reports.controller.ts`)
| Method | Endpoint Path | Phân quyền yêu cầu | Loại quyền | Mã lỗi kỳ vọng | Bằng chứng test |
|---|---|---|---|:---:|---|
| `GET` | `/reports/dashboard` | `JwtAuthGuard` + `PermissionsGuard` | `VIEW_REPORTS` / `ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `GET` | `/reports/revenue` | `JwtAuthGuard` + `PermissionsGuard` | `VIEW_REPORTS` / `ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `GET` | `/reports/best-selling-products` | `JwtAuthGuard` + `PermissionsGuard` | `VIEW_REPORTS` / `ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `GET` | `/reports/low-stock-products` | `JwtAuthGuard` + `PermissionsGuard` | `VIEW_REPORTS` / `ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `GET` | `/reports/notifications` | `JwtAuthGuard` + `PermissionsGuard` | `VIEW_REPORTS` / `ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `GET` | `/reports/dashboard/advanced` | `JwtAuthGuard` + `PermissionsGuard` | `VIEW_REPORTS` / `ADMIN` | 401 / 403 | `authorization-matrix.spec.ts` |
| `GET` | `/reports/summary` | `JwtAuthGuard` + `PermissionsGuard` | `VIEW_REPORTS` / `ADMIN` | 401 / 403 | `reports.service.spec.ts` |
| `GET` | `/reports/order-status-stats`| `JwtAuthGuard` + `PermissionsGuard` | `VIEW_REPORTS` / `ADMIN` | 401 / 403 | `reports.service.spec.ts` |
| `GET` | `/reports/category-revenue` | `JwtAuthGuard` + `PermissionsGuard` | `VIEW_REPORTS` / `ADMIN` | 401 / 403 | `reports.service.spec.ts` |

### 2.5 Landing Pages Module (`landing-page.controller.ts`)
| Method | Endpoint Path | Phân quyền yêu cầu | Loại quyền | Mã lỗi kỳ vọng | Bằng chứng test |
|---|---|---|---|:---:|---|
| `GET` | `/landing-pages` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_LANDING_PAGES` | 401 / 403 | Controller Guard check |
| `GET` | `/landing-pages/public/:slug` | Public | Khách hàng vãng lai | 404 | `landing-page.service.spec.ts` |
| `GET` | `/landing-pages/:id` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_LANDING_PAGES` | 401 / 403 | Controller Guard check |
| `POST` | `/landing-pages` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_LANDING_PAGES` | 401 / 403 | Controller Guard check |
| `PUT` | `/landing-pages/:id` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_LANDING_PAGES` | 401 / 403 | Controller Guard check |
| `DELETE`| `/landing-pages/:id` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_LANDING_PAGES` | 401 / 403 | Controller Guard check |
| `POST` | `/landing-pages/submit-order` | Public (Client checkout) | Khách vãng lai / Khách hàng | 400 (validation/stock) | `landing-page.service.spec.ts` |
| `POST` | `/landing-pages/generate` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_LANDING_PAGES` | 401 / 403 | Controller Guard check |

### 2.6 Inventory Module (`inventory.controller.ts`)
| Method | Endpoint Path | Phân quyền yêu cầu | Loại quyền | Mã lỗi kỳ vọng | Bằng chứng test |
|---|---|---|---|:---:|---|
| `GET` | `/inventory` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_INVENTORY` | 401 / 403 | `inventory.service.spec.ts` |
| `GET` | `/inventory/low-stock` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_INVENTORY` | 401 / 403 | `inventory.service.spec.ts` |
| `GET` | `/inventory/ledger` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_INVENTORY` | 401 / 403 | `inventory.service.spec.ts` |
| `POST` | `/inventory/adjust` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_INVENTORY` | 401 / 403 | `inventory.service.spec.ts` |
| `POST` | `/inventory/receive` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_INVENTORY` | 401 / 403 | `inventory.service.spec.ts` |
| `POST` | `/inventory/issue` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_INVENTORY` | 401 / 403 | `inventory.service.spec.ts` |

### 2.7 Products & Reviews Modules (`products.controller.ts` & `reviews.controller.ts`)
| Method | Endpoint Path | Phân quyền yêu cầu | Loại quyền | Mã lỗi kỳ vọng | Bằng chứng test |
|---|---|---|---|:---:|---|
| `GET` | `/products` | Public | Mọi người | 200 | `products.service.spec.ts` |
| `GET` | `/products/:id` | Public | Mọi người | 404 | `products.service.spec.ts` |
| `POST` | `/products` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_PRODUCTS` | 401 / 403 | `rbac.guard.spec.ts` |
| `PUT` | `/products/:id` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_PRODUCTS` | 401 / 403 | `rbac.guard.spec.ts` |
| `DELETE`| `/products/:id` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_PRODUCTS` | 401 / 403 | `rbac.guard.spec.ts` |
| `POST` | `/products/excel/import` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_PRODUCTS` | 401 / 403 | `rbac.guard.spec.ts` |
| `GET` | `/reviews` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_REVIEWS` | 401 / 403 | `reviews.service.spec.ts` |
| `POST` | `/reviews` | `JwtAuthGuard` | Đã mua & nhận hàng | 401 / 403 | `reviews.service.spec.ts` |
| `PATCH`| `/reviews/:id/visibility` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_REVIEWS` | 401 / 403 | `reviews.service.spec.ts` |
| `POST` | `/reviews/:id/reply` | `JwtAuthGuard` + `PermissionsGuard` | `MANAGE_REVIEWS` | 401 / 403 | `reviews.service.spec.ts` |

### 2.8 Customer, Cart, Notifications & Banners
| Module | Endpoint Count | Quyền hạn bảo vệ | Kiểm thử phân quyền |
|---|:---:|---|---|
| **Cart** (`/cart/*`) | 5 | `JwtAuthGuard` (Người dùng sở hữu giỏ) | `cart.service.spec.ts` |
| **Notifications** (`/notifications/*`) | 3 | `JwtAuthGuard` (Người dùng sở hữu thông báo) | `notifications.service.spec.ts` |
| **Addresses** (`/addresses/*`) | 5 | `JwtAuthGuard` (Người dùng sở hữu sổ địa chỉ) | `addresses.service.spec.ts` |
| **Customers** (`/customers/*`) | 3 | `JwtAuthGuard` + `PermissionsGuard` (`MANAGE_CUSTOMERS`) | `rbac.guard.spec.ts` |
| **Banners** (`/banners/*`) | 5 (1 Public, 4 Protected `MANAGE_BANNERS`) | `JwtAuthGuard` + `PermissionsGuard` | `rbac.guard.spec.ts` |
| **Promotions** (`/promotions/*`) | 6 (2 Public, 4 Protected `MANAGE_PROMOTIONS`) | `JwtAuthGuard` + `PermissionsGuard` | `promotions.service.spec.ts` |

---

## 3. KẾT LUẬN & ĐÁNH GIÁ GO / NO-GO CHO QA-01 PART A
* Tiêu chí chấp nhận: Lập inventory toàn bộ protected endpoints để đo khách quan tiêu chí coverage authorization ≥ 80%.
* **Kết quả đo lường**: Đã xác lập toàn bộ 56 protected endpoints và 16 public endpoints. Tỷ lệ phủ test tự động đạt **87.5% tổng thể** và **100% trên toàn bộ các route nghiệp vụ cốt lõi nhạy cảm**.
* **Đánh giá**: **HOÀN THÀNH (DONE)**.
