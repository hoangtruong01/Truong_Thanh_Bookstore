# 🤖 AI CONTEXT & CONTINUOUS UPDATE REGISTRY (`AI_CONTEXT.md`)
*(Hồ sơ ngữ cảnh hệ thống — AI đọc file này để nắm bắt toàn bộ dự án trong 5 giây và cập nhật sau mỗi task)*

---

## ⚡ 1. FAST PROJECT SNAPSHOT

| Hạng mục | Giá trị | Ghi chú |
| :--- | :--- | :--- |
| **Tên dự án** | Trường Thành Bookstore | Thương mại điện tử sách & văn phòng phẩm |
| **Backend** | NestJS v11 (TypeScript, Node.js) | Port: `3000`, Prefix: `/api`, Docs: `/api/docs` |
| **Database** | MongoDB + Mongoose 9 | MongoDB URI trong `.env` |
| **Frontend** | Vue 3 (Composition API) + Vite 8 + Tailwind 4 | Port: `5173`, State: Pinia, Route: Vue Router |
| **Mobile** | Flutter SDK (^3.11) + Dart | State: Provider, Đa nền tảng Android/iOS |
| **Realtime** | WebSocket Socket.IO | Namespace: `/notifications` |
| **Storage & Mail**| Cloudinary + Nodemailer SMTP | Ảnh & Email giao dịch |

---

## 🗺️ 2. BACKEND MODULES MAP & RESPONSIBILITIES

```text
backend/src/modules/
├── auth/            -> Login, Register, Logout, RefreshToken, ForgotPassword (OTP 6 số), ResetPassword
├── users/           -> Profile, Addresses (sổ địa chỉ CRUD), Wishlist
├── products/        -> Quản lý sách/VPP, SKU, ISBN, Lọc nâng cao, Excel Import/Export
├── categories/      -> Cây danh mục phân cấp (Parent/Child), Slug
├── cart/            -> [NEW] Quản lý giỏ hàng backend, kiểm tra tồn kho realtime, tạm tính giá
├── orders/          -> Tạo đơn hàng, trừ kho nguyên tử (Atomic rollback), xuất hóa đơn PDF
├── payments/        -> [NEW] Lớp trừu tượng cổng thanh toán (COD, Bank Transfer, VNPay, MoMo)
├── inventory/       -> Giao dịch kho (IMPORT, SALE, RETURN, ADJUSTMENT, DAMAGE), cảnh báo hết hàng
├── reviews/         -> [NEW] Đánh giá & xếp hạng sản phẩm (chỉ khách đã mua mới được đánh giá)
├── promotions/      -> Mã giảm giá (Coupon), kiểm tra điều kiện áp dụng & số lượt sử dụng
├── notifications/   -> WebSocket Gateway & Lưu trữ thông báo trong DB
├── reports/         -> Báo cáo thống kê doanh thu, AOV, phân bố đơn hàng cho Admin
├── customers/       -> Quản lý danh sách khách hàng và lịch sử mua sắm cho Admin
├── banners/         -> Quản lý banner quảng cáo hiển thị trên Web/App
├── landing-pages/   -> Quản lý trang sự kiện flash sale/khuyến mãi động
└── email/           -> Gửi mail OTP, xác nhận đơn hàng, cảnh báo tồn kho
```

---

## 📋 3. BẢNG TIẾN ĐỘ 30 TASKS (ROADMAP STATUS MATRIX)

| Mã Task | Tên Task & Mục tiêu | Phase | Độ ưu tiên | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| **TASK 01** | Chuẩn hóa cấu trúc Backend (Controller/Service/DTO/Module) | Phase 1 | P0 | 🟡 **IN_PROGRESS** |
| **TASK 02** | Chuẩn hóa API Response (`{ success, message, data, meta }`) | Phase 1 | P0 | ⚪ PENDING |
| **TASK 03** | Global Error Handling & Error Codes (`{ errorCode }`) | Phase 1 | P0 | ⚪ PENDING |
| **TASK 04** | Global DTO Validation & Whitelist cấm unknown fields | Phase 1 | P0 | ⚪ PENDING |
| **TASK 05** | Quản lý biến môi trường `.env` & bảo mật Secret | Phase 1 | P0 | ⚪ PENDING |
| **TASK 06** | Authentication toàn diện & băm mật khẩu bcrypt | Phase 2 | P0 | ⚪ PENDING |
| **TASK 07** | Phân quyền RBAC (Customer/Staff/Admin) & Role Guards | Phase 2 | P0 | ⚪ PENDING |
| **TASK 08** | Bảo mật JWT, Refresh Token & Thu hồi Token khi Logout | Phase 2 | P0 | ⚪ PENDING |
| **TASK 09** | Bảo mật API (Helmet, CORS, Rate Limit, Sanitization) | Phase 2 | P1 | ⚪ PENDING |
| **TASK 10** | Quản lý sản phẩm Admin & Excel Import/Export | Phase 3 | P1 | ⚪ PENDING |
| **TASK 11** | Quản lý danh mục, Slug & Cây danh mục đa cấp | Phase 3 | P1 | ⚪ PENDING |
| **TASK 12** | Tìm kiếm Full-text & Lọc đa tiêu chí phân trang | Phase 3 | P1 | ⚪ PENDING |
| **TASK 13** | Chi tiết sản phẩm, Gallery, Thông số & Đánh giá | Phase 3 | P1 | ⚪ PENDING |
| **TASK 14** | Module Giỏ hàng Backend & Kiểm kho thời gian thực | Phase 4 | P0 | ⚪ PENDING |
| **TASK 15** | Luồng Checkout an toàn & Kiểm tra nguyên tử | Phase 4 | P0 | ⚪ PENDING |
| **TASK 16** | Quản lý Sổ địa chỉ giao hàng người dùng | Phase 4 | P1 | ⚪ PENDING |
| **TASK 17** | Quản lý Đơn hàng, Vòng đời trạng thái & Hóa đơn PDF | Phase 4 | P0 | ⚪ PENDING |
| **TASK 18** | Kiến trúc Thanh toán Provider Abstraction (VNPay, MoMo, COD) | Phase 5 | P0 | ⚪ PENDING |
| **TASK 19** | Hệ thống Mã khuyến mãi (Voucher) | Phase 5 | P1 | ⚪ PENDING |
| **TASK 20** | Quản lý Tồn kho & 5 loại Inventory Transaction | Phase 5 | P0 | ⚪ PENDING |
| **TASK 21** | Đánh giá & Xếp hạng sản phẩm (Verified Purchase) | Phase 5 | P1 | ⚪ PENDING |
| **TASK 22** | Danh sách Yêu thích (Wishlist) | Phase 5 | P2 | ⚪ PENDING |
| **TASK 23** | Hệ thống Thông báo WebSocket Real-time & DB | Phase 5 | P1 | ⚪ PENDING |
| **TASK 24** | Bảng điều khiển Quản trị (Admin Analytics Dashboard) | Phase 6 | P1 | ⚪ PENDING |
| **TASK 25** | Tối ưu trải nghiệm Quản trị (Admin UX/Feedback States) | Phase 6 | P1 | ⚪ PENDING |
| **TASK 26** | Đồng bộ & Tích hợp API ứng dụng Mobile Flutter | Phase 6 | P0 | ⚪ PENDING |
| **TASK 27** | Nâng cấp trải nghiệm Mobile (UX/Offline/Shimmer) | Phase 6 | P1 | ⚪ PENDING |
| **TASK 28** | Kiểm thử tự động (Unit Tests & E2E Test Flow) | Phase 7 | P0 | ⚪ PENDING |
| **TASK 29** | Thiết lập Quy trình CI/CD Pipeline | Phase 7 | P1 | ⚪ PENDING |
| **TASK 30** | Production Readiness, Swagger OpenAPI & Docker | Phase 7 | P0 | ⚪ PENDING |

---

## 📌 4. CÁC QUY TẮC NGHIỆP VỤ CỐT LÕI (CORE BUSINESS RULES)

1. **Quy tắc Miễn phí vận chuyển (Free Shipping)**:
   - Ngưỡng: `299.000đ` (`FREE_SHIPPING_THRESHOLD`).
   - Nếu `subtotal` < 299.000đ ➔ Phí ship = `30.000đ`.
   - Nếu `subtotal` >= 299.000đ ➔ Phí ship = `0đ`.
   - Phí vận chuyển phải được tính toán trên Server, không tin cậy Client gửi lên.
2. **Quy tắc Trừ kho nguyên tử (Atomic Stock Deduction)**:
   - Khi tạo đơn: Lặp qua từng item và trừ kho trong DB bằng `{ stock: { $gte: quantity } }`.
   - Nếu có bất kỳ item nào hết hàng ➔ Ném `BadRequestException` và thực hiện **Rollback** cộng lại tồn kho cho các item đã trừ trước đó.
3. **Quy tắc Quên mật khẩu & OTP**:
   - OTP gồm 6 chữ số ngẫu nhiên, lưu trong DB có thời hạn hết hạn 10 phút.
   - Nhập đúng OTP mới sinh token tạm cho phép đặt lại mật khẩu mới.
4. **Quy tắc Vòng đời Đơn hàng (Order Status Flow)**:
   - Các trạng thái: `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPING` -> `DELIVERED`.
   - Hủy đơn (`CANCELLED`) phải kích hoạt hoàn lại tồn kho đúng số lượng.

---

## 📡 5. CHUẨN ĐỊNH DẠNG API (API CONTRACTS)

### Phản hồi Thành công (Success Response):
```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Phản hồi Lỗi (Error Response):
```json
{
  "success": false,
  "message": "Thông điệp lỗi thân thiện",
  "errorCode": "ERR_INSUFFICIENT_STOCK",
  "details": {}
}
```

---

## 📝 6. NHẬT KÝ CẬP NHẬT CỦA AI (AI CHANGELOG & TASK AUDIT LOG)

*(Mỗi khi hoàn thành 1 task, AI cập nhật bản ghi vào phần này)*

### [2026-08-23] — Khởi tạo Hồ sơ Dự án & Chuẩn bị Task 01
- **Người cập nhật**: Antigravity AI
- **Mục tiêu**: Thiết lập tài liệu `PROJECT_DOCUMENTATION.md` và `AI_CONTEXT.md`.
- **Trạng thái**: Đã phân tích toàn bộ repository, xác nhận backend/frontend build thành công, xác định lộ trình 30 tasks chi tiết.
- **Tiếp theo**: Bắt đầu thực thi **TASK 01: Chuẩn hóa cấu trúc Backend**.

---

*(Ghi chú cho AI tiếp theo: Khi nhận lệnh mới, hãy đọc file này trước tiên để biết ngay ngữ cảnh và trạng thái hiện tại của dự án).*
