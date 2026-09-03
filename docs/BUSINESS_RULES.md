# TÀI LIỆU QUY TẮC NGHIỆP VỤ & RÀNG BUỘC HỆ THỐNG (BUSINESS RULES SPECIFICATION)
> **Dự án**: Nhà sách Trường Thành (Trường Thành Bookstore)  
> **Phiên bản tài liệu**: 2.0 (Chuẩn hóa toàn diện theo Audit 2026-09-03 - Task BA-01)  
> **Trạng thái**: Đã phê duyệt chính thức (Official Standard)

---

## MỤC LỤC
1. [Xác thực & Bảo mật Token (Authentication & Token Isolation)](#1-xác-thực--bảo-mật-token)
2. [Ma trận Phân quyền Hệ thống (Role-Based Access Control - RBAC Matrix)](#2-ma-trận-phân-quyền-hệ-thống-rbac-matrix)
3. [Vòng đời & Trạng thái Đơn hàng (Orders & State Machine)](#3-vòng-đời--trạng-thái-đơn-hàng)
4. [Thanh toán & Hủy đơn tự động (Payment & Auto-Cancel Rules)](#4-thanh-toán--hủy-đơn-tự-động)
5. [Quản lý Tồn kho & Sổ cái Giao dịch (Inventory & Stock Ledger)](#5-quản-lý-tồn-kho--sổ-cái-giao-dịch)
6. [Chương trình Khuyến mãi & Mã giảm giá (Promotions & Coupons)](#6-chương-trình-khuyến-mãi--mã-giảm-giá)
7. [Điểm thưởng & Hạng thành viên (Loyalty Points & Tier System)](#7-điểm-thưởng--hạng-thành-viên)
8. [Quy tắc Bán hàng qua Trang Đích (Landing Page Orders)](#8-quy-tắc-bán-hàng-qua-trang-đích)
9. [Báo cáo Doanh thu & Toàn vẹn Dữ liệu Tài chính (Reports & Financial Integrity)](#9-báo-cáo-doanh-thu--toàn-vẹn-dữ-liệu-tài-chính)

---

## 1. XÁC THỰC & BẢO MẬT TOKEN

### 1.1 Cơ chế Đăng nhập Lai (Hybrid Authentication)
- **Web Browser Clients**:
  - `access_token`: Lưu trong `HttpOnly, Secure, SameSite=Lax` cookie (hoặc `SameSite=None` trên production nếu frontend và backend khác domain), thời hạn 15 phút.
  - `refresh_token`: Lưu trong `HttpOnly, Secure, SameSite=Lax` cookie, path giới hạn tại `/api/auth`, thời hạn 30 ngày.
  - Mã JavaScript trên trình duyệt **tuyệt đối không** đọc được access/refresh token qua cookie, loại trừ nguy cơ rò rỉ khi bị tấn công XSS.
- **Mobile Native Clients**:
  - Client gửi header `x-client-platform: mobile`.
  - Backend trả token trực tiếp trong response body (`data.accessToken`, `data.refreshToken`) để lưu vào Secure Keystore / Keychain.

### 1.2 Nguyên tắc Cô lập Loại Token (Token Type Isolation - Chống Token Type Confusion)
- **Access Token**:
  - Payload bắt buộc chứa `type: 'access'`.
  - Được dùng để xác thực các request API thông thường qua Header `Authorization: Bearer <token>` hoặc cookie `access_token`.
  - Chiến lược `JwtStrategy` kiểm tra nghiêm ngặt `payload.type === 'access'`. Mọi token khác (`refresh`, `RESET_PASSWORD`) gửi vào đều bị từ chối với mã lỗi `401 Unauthorized` (`ERR_INVALID_TOKEN`).
- **Refresh Token**:
  - Payload chứa `type: 'refresh'`.
  - Chỉ được chấp nhận tại duy nhất endpoint `/api/auth/refresh`.
  - Không thể sử dụng làm Bearer Access Token để gọi các endpoint nghiệp vụ.
- **Password Reset Token**:
  - Payload chứa `type: 'RESET_PASSWORD'`.
  - Chỉ được chấp nhận tại duy nhất endpoint `/api/auth/reset-password`.
  - Không thể sử dụng làm Bearer Access Token hoặc Refresh Token.

### 1.3 Cơ chế Xoay vòng & Phát hiện Tái sử dụng (Token Rotation & Reuse Detection)
- Khi gọi `/api/auth/refresh`, backend thu hồi refresh token hiện tại, cấp mới một cặp token hoàn toàn mới (`accessToken` + `refreshToken`).
- Mã băm SHA-256 của refresh token hợp lệ được lưu trong `user.refreshTokenHash`.
- **Phát hiện tái sử dụng (Token Reuse Attack)**: Nếu hệ thống nhận được một refresh token hợp lệ về mặt chữ ký nhưng mã hash khác với giá trị đang lưu trong CSDL, hệ thống phát hiện đây là cuộc tấn công đánh cắp phiên. Ngay lập tức:
  1. Hủy bỏ `refreshTokenHash` trong CSDL.
  2. Tăng `user.tokenVersion = user.tokenVersion + 1` để vô hiệu hóa toàn bộ access token còn hạn của người dùng.
  3. Từ chối request với mã lỗi `401 Unauthorized` (`ERR_REFRESH_TOKEN_REUSE`).

### 1.4 Thu hồi Phiên đăng nhập (Session Revocation)
- **Đăng xuất (Logout)**: JTI (JWT ID) của access token được đưa vào danh sách đen (`TokenBlacklistService`), cookie bị xóa, `refreshTokenHash` bị xóa.
- **Đổi mật khẩu / Đăng xuất tất cả thiết bị**: Tăng `user.tokenVersion`. Mọi token có `payload.tokenVersion < user.tokenVersion` lập tức bị `JwtStrategy` từ chối (`ERR_TOKEN_REVOKED`).

---

## 2. MA TRẬN PHÂN QUYỀN HỆ THỐNG (RBAC MATRIX)

Hệ thống có 4 vai trò (Roles): `SUPER_ADMIN`, `ADMIN`, `STAFF`, `CUSTOMER` và đối tượng `ANONYMOUS / GUEST`.  
Nhân viên (`STAFF`) được phân quyền chi tiết theo danh sách `StaffPermission`:
- `MANAGE_ORDERS`: Quản lý đơn hàng (xem toàn bộ, cập nhật trạng thái, in hóa đơn).
- `MANAGE_PRODUCTS`: Quản lý sách, văn phòng phẩm, danh mục, kiểm duyệt đánh giá.
- `MANAGE_INVENTORY`: Nhập hàng, kiểm kho, điều chỉnh kho.
- `VIEW_REPORTS`: Xem báo cáo doanh thu, sản phẩm bán chạy, khách hàng tiềm năng.
- `MANAGE_CUSTOMERS`: Quản lý danh sách khách hàng, cập nhật điểm loyalty.
- `MANAGE_PROMOTIONS`: Tạo, sửa, đóng/mở mã khuyến mãi.
- `MANAGE_BANNERS`: Cập nhật banner tiếp thị trên trang chủ.
- `MANAGE_LANDING_PAGES`: Quản trị nội dung và sản phẩm các trang đích.

### 2.1 Ma trận Phân quyền Chi tiết (Role × Resource × Action)

| Phân hệ (Resource) | Hành động (Endpoint / Action) | SUPER_ADMIN | ADMIN | STAFF (Có quyền tương ứng) | STAFF (Không có quyền) | CUSTOMER | ANONYMOUS / GUEST |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Auth** | Đăng ký / Đăng nhập / Quên mật khẩu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Lấy thông tin cá nhân (`/auth/me`, `/auth/profile`) | ✅ | ✅ | ✅ | ✅ | ✅ (Cá nhân) | ❌ (401) |
| **Users** | Xem danh sách người dùng (`GET /users`) | ✅ | ✅ | ✅ (Nếu có `MANAGE_CUSTOMERS`) | ❌ (403) | ❌ (403) | ❌ (401) |
| | Cập nhật Role / Phân quyền (`PATCH /users/:id/role`) | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (401) |
| | Khóa / Kích hoạt tài khoản người dùng | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ (403) | ❌ (401) |
| **Products** | Xem danh sách / Chi tiết sản phẩm active | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| | Tạo mới / Sửa / Xóa sản phẩm | ✅ | ✅ | ✅ (`MANAGE_PRODUCTS`) | ❌ (403) | ❌ (403) | ❌ (401) |
| **Orders** | Xem toàn bộ đơn hàng hệ thống (`GET /orders`) | ✅ | ✅ | ✅ (`MANAGE_ORDERS`) | ❌ (403) | ❌ (403) | ❌ (401) |
| | Xem đơn hàng của chính mình (`GET /orders/my-orders`) | ✅ | ✅ | ✅ | ✅ | ✅ (Chính mình) | ❌ (401) |
| | Xem chi tiết 1 đơn hàng (`GET /orders/:id`) | ✅ | ✅ | ✅ (`MANAGE_ORDERS`) | ❌ (403) | ✅ (Chỉ đơn của mình) | ❌ (Chỉ xem qua guest token) |
| | Đặt hàng với tài khoản (`POST /orders/authenticated`) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (401) |
| | Đặt hàng khách vãng lai (`POST /orders/guest`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Nhận guest token) |
| | Cập nhật trạng thái đơn (`PATCH /orders/:id/status`) | ✅ | ✅ | ✅ (`MANAGE_ORDERS`) | ❌ (403) | ❌ (403) | ❌ (401) |
| | Khách tự hủy đơn PENDING (`PATCH /orders/:id/cancel`) | ✅ | ✅ | ✅ (`MANAGE_ORDERS`) | ❌ (403) | ✅ (Chỉ đơn PENDING của mình)| ❌ (401) |
| | Tải Hóa đơn PDF (`GET /orders/:id/invoice`) | ✅ | ✅ | ✅ (`MANAGE_ORDERS`) | ❌ (403) | ✅ (Chỉ đơn của mình) | ❌ (401) |
| **Payments** | Xem danh sách giao dịch (`GET /payments`) | ✅ | ✅ | ✅ (`MANAGE_ORDERS`) | ❌ (403) | ❌ (403) | ❌ (401) |
| | Tạo yêu cầu thanh toán online (VNPay/MoMo) | ✅ | ✅ | ✅ | ✅ | ✅ (Đơn của mình) | ✅ (Đơn guest hợp lệ) |
| | Webhook xử lý thanh toán từ cổng IPN | ✅ (Signature) | ✅ (Signature)| ✅ (Signature) | ✅ (Signature) | ✅ (Signature) | ✅ (Signature) |
| **Reports** | Xem báo cáo doanh thu & dashboard (`/reports/*`)| ✅ | ✅ | ✅ (`VIEW_REPORTS`) | ❌ (403) | ❌ (403) | ❌ (401) |
| **Promotions**| Tạo / Sửa mã khuyến mãi | ✅ | ✅ | ✅ (`MANAGE_PROMOTIONS`)| ❌ (403) | ❌ (403) | ❌ (401) |
| | Áp dụng mã giảm giá khi checkout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 3. VÒNG ĐỜI & TRẠNG THÁI ĐƠN HÀNG

### 3.1 Máy trạng thái Đơn hàng (Order State Machine)
Hệ thống quản lý trạng thái đơn hàng theo sơ đồ chuyển đổi hữu hạn và chặt chẽ:

```
[ PENDING ] ────────┬────────> [ CANCELLED ] (Khách tự hủy hoặc Auto-cancel timeout)
     │              │
     ▼              │
[ CONFIRMED ] ──────┼────────> [ CANCELLED ] (CSKH hủy sau khi thỏa thuận với khách)
     │              │
     ▼              │
[ PROCESSING ] ─────┴────────> [ CANCELLED ] (Hủy khi chưa giao shipper, khôi phục kho)
     │
     ▼
[ SHIPPING ]
     │
     ▼
[ DELIVERED ] ──────┬────────> [ COMPLETED ] (Đơn hàng hoàn tất, khóa chỉnh sửa)
     │              │
     │              └────────> [ RETURNED ]  (Khách trả hàng trong 7 ngày)
     ▼
[ RETURNED ] (Nhận hàng hoàn về kho)
```

**Bảng Chuyển trạng thái Hợp lệ (Allowed Transitions)**:
| Trạng thái hiện tại | Được phép chuyển sang |
|---|---|
| `PENDING` | `CONFIRMED`, `CANCELLED` |
| `CONFIRMED` | `PROCESSING`, `CANCELLED` |
| `PROCESSING` | `SHIPPING`, `CANCELLED` |
| `SHIPPING` | `DELIVERED` |
| `DELIVERED` | `COMPLETED`, `RETURNED` |
| `COMPLETED` | `RETURNED` (Trong thời hạn đổi trả quy định) |
| `RETURNED` | *(Trạng thái kết thúc - Không chuyển tiếp)* |
| `CANCELLED` | *(Trạng thái kết thúc - Không chuyển tiếp)* |

Mọi nỗ lực chuyển đổi sai quy tắc (ví dụ: `SHIPPING` -> `CANCELLED`, hoặc `CANCELLED` -> `CONFIRMED`) đều bị ném lỗi `400 Bad Request`.

### 3.2 Quy tắc Hủy đơn hàng (Order Cancellation)
- **Khách hàng tự hủy**: Khách hàng chỉ có thể tự hủy đơn hàng khi trạng thái là `PENDING`. Sau khi đơn đã chuyển sang `CONFIRMED` hoặc `PROCESSING`, khách phải liên hệ CSKH để nhân viên có quyền `MANAGE_ORDERS` xử lý.
- **Hoàn trả kho khi Hủy**:
  - Khi đơn chuyển sang `CANCELLED`, hệ thống tự động hoàn lại tồn kho nguyên tử (`$inc: +quantity`) và trừ ngược số lượng đã bán (`sold = sold - quantity`).
  - Hệ thống ghi một bản ghi sổ cái kho `InventoryTransactionType.RETURN` có đối chiếu mã đơn.
- **Hoàn trả Lượt Khuyến mãi**:
  - Nếu đơn hàng có sử dụng `promotionCode`, hệ thống giải phóng số lượt sử dụng của mã (`promotionsService.releaseUsage()`), cho phép khách sử dụng lại.

---

## 4. THANH TOÁN & HỦY ĐƠN TỰ ĐỘNG

### 4.1 Phương thức Thanh toán Hỗ trợ trên Production
1. **COD (Cash On Delivery - Thanh toán tiền mặt khi nhận hàng)**:
   - Trạng thái thanh toán ban đầu: `UNPAID`.
   - Tự động chuyển thành `PAID` khi trạng thái đơn hàng đạt `DELIVERED` hoặc `COMPLETED`.
2. **Chuyển khoản Ngân hàng Trực tiếp (Bank Transfer / VietQR)**:
   - Hệ thống hiển thị mã QR kèm cú pháp thanh toán chuẩn: `TT<Mã_đơn_hàng>`.
   - Trạng thái ban đầu: `UNPAID`.
   - Nhân viên thu ngân/kế toán đối soát qua sao kê hoặc webhook tự động để cập nhật `PAID`.
3. **Cổng thanh toán VNPay**:
   - Trả lời xác nhận qua IPN webhook có chữ ký số SHA-256 / HMAC.
   - Khi giao dịch thành công: Cập nhật `paymentStatus: PAID`, đơn chuyển `CONFIRMED`.
4. **Cổng thanh toán MoMo**:
   - Tích hợp IPN signature HMAC-SHA256.
5. **Cấm Mock Payment trên Production**:
   - Mọi cơ chế giả lập thanh toán (Mock Gateway) bị vô hiệu hóa hoàn toàn khi `NODE_ENV === 'production'`. Thiếu cấu hình secret key thật sẽ khiến module thanh toán từ chối khởi chạy.

### 4.2 Cơ chế Tự động Hủy Đơn Treo (Auto-Cancel Pending Orders)
Để tránh tình trạng giữ kho ảo làm ảnh hưởng tới khách hàng khác, hệ thống áp dụng cơ chế tự động hủy đơn hết hạn (chạy qua Cron Job định kỳ mỗi 15 phút):

| Hình thức thanh toán | Thời gian chờ tối đa (Timeout) | Thời điểm gửi thông báo nhắc nhở | Hành động khi hết hạn |
|---|---|---|---|
| **Chuyển khoản / VNPay / MoMo** | **24 giờ** kể từ lúc tạo đơn | **2 giờ trước khi hủy** (Tại giờ thứ 22) | Tự động chuyển sang `CANCELLED`, hoàn kho, hoàn voucher, ghi log timeline |
| **COD (Chưa xác nhận)** | **48 giờ** kể từ lúc tạo đơn | **2 giờ trước khi hủy** (Tại giờ thứ 46) | Tự động chuyển sang `CANCELLED` nếu CSKH không liên lạc được |

- **Thông báo nhắc thanh toán**: Gửi qua Push Notification (nếu dùng app mobile) + Thông báo trong tài khoản (In-app) + Email nhắc nhở, đính kèm link thanh toán ngay.

---

## 5. QUẢN LÝ TỒN KHO & SỔ CÁI GIAO DỊCH

### 5.1 Khấu trừ Tồn kho Nguyên tử (Atomic Stock Deduction)
- Tồn kho được khấu trừ ngay tại thời điểm **tạo đơn hàng thành công (`OrdersService.create / createAtomic`)**.
- Thao tác trừ kho sử dụng truy vấn nguyên tử MongoDB:
  ```typescript
  await this.productModel.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity, sold: quantity } }
  );
  ```
- Tuyệt đối không đọc `product.stock` ra bộ nhớ rồi mới so sánh bằng Javascript, nhằm ngăn chặn hoàn toàn hiện tượng Race Condition (Over-selling) khi có nhiều lượt mua đồng thời.
- Nếu một sản phẩm trong giỏ không đủ tồn kho, toàn bộ giao dịch tạo đơn bị hủy bỏ, các sản phẩm đã trừ trước đó trong phiên được hoàn trả ngay lập tức.

### 5.2 Ngưỡng Trạng thái Tồn kho (Stock Status Thresholds)
- `stock > 10`: Trạng thái `IN_STOCK` (Còn hàng).
- `1 <= stock <= 10`: Trạng thái `LOW_STOCK` (Sắp hết hàng - Kích hoạt cảnh báo tới ban quản trị).
- `stock <= 0`: Trạng thái `OUT_OF_STOCK` (Hết hàng - Khóa nút Đặt hàng trên giao diện).

### 5.3 Sổ cái Giao dịch Kho (Inventory Ledger)
Mọi biến động kho bắt buộc phải sinh ra một bản ghi trong bộ sưu tập `InventoryTransaction`:
- `IMPORT`: Nhập hàng từ nhà cung cấp / nhà xuất bản.
- `SALE`: Xuất bán theo đơn hàng (ghi nhận kèm `orderCode`).
- `RETURN`: Nhận hàng hoàn trả do hủy đơn hoặc khách trả hàng.
- `ADJUSTMENT`: Điều chỉnh sau khi kiểm kê định kỳ thực tế.
- `DAMAGE`: Xuất hủy sách lỗi, rách, ướt, hư hỏng.

---

## 6. CHƯƠNG TRÌNH KHUYẾN MÃI & MÃ GIẢM GIÁ

### 6.1 Điều kiện Hợp lệ của Mã Khuyến mãi
Một mã khuyến mãi (`promotionCode`) chỉ được áp dụng khi thỏa mãn toàn bộ các điều kiện:
1. Trạng thái `isActive: true`.
2. Thời gian hiện tại nằm trong khoảng `[startDate, endDate]`.
3. Tổng số lượt đã dùng < `usageLimit` (nếu có cấu hình giới hạn).
4. Số lượt đã dùng của user/email/phone hiện tại < `perUserLimit` (mặc định tối đa 1 lượt/khách hàng).
5. Giá trị tiền hàng (`subtotal`) >= `minOrderValue`.
6. Giỏ hàng có chứa ít nhất 1 sản phẩm nằm trong danh sách áp dụng (hoặc áp dụng toàn sàn nếu không chỉ định).

### 6.2 Tính toán Mức giảm & Chống Gian lận
- **Giảm theo phần trăm (`PERCENT`)**: `discount = subtotal * (discountValue / 100)`. Nếu có cấu hình `maxDiscountAmount`, mức giảm thực tế không vượt quá giá trị này.
- **Giảm cố định (`FIXED`)**: `discount = discountValue`.
- **Tổng tiền thanh toán**: `total = Math.max(0, subtotal + shippingFee - discount)`. Giá trị đơn hàng không bao giờ âm.
- Giá và số tiền giảm giá luôn được **tính toán lại hoàn toàn tại Backend**, bỏ qua bất kỳ giá trị tính toán nào do Frontend gửi lên.

---

## 7. ĐIỂM THƯỞNG & HẠNG THÀNH VIÊN

### 7.1 Mốc Tích lũy Điểm (Chốt chính thức theo BA-01)
- **Mốc cộng điểm**: Điểm thưởng Loyalty được cộng cho tài khoản khách hàng **chính xác tại thời điểm đơn hàng chuyển sang `DELIVERED`** (Đã giao hàng và thanh toán thành công).
- **Tuyệt đối không cộng điểm tại thời điểm tạo đơn `PENDING`** để chống tình trạng tạo đơn ảo để trục lợi điểm thưởng.
- **Idempotency**: Đơn hàng có cờ `loyaltyAwarded: boolean`. Nếu đơn hàng đã từng được cộng điểm một lần, việc cập nhật trạng thái tiếp theo sang `COMPLETED` sẽ **không cộng điểm lần 2**.
- **Thu hồi điểm khi Trả hàng (`RETURNED`)**: Nếu đơn hàng bị trả về và chuyển sang `RETURNED`, hệ thống tự động kiểm tra `if (order.loyaltyAwarded)` và thực hiện trừ thu hồi đúng số điểm đã thưởng.

### 7.2 Tỷ lệ Tích điểm & Tiêu điểm
- **Tỷ lệ Tích điểm (Earning Rate)**:
  - Mỗi **1,000 VND** chi tiêu thực tế (không tính phí vận chuyển và giảm giá) = **1 điểm thưởng (Loyalty Point)**.
  - Ví dụ: Đơn hàng thanh toán 250,000 VND -> Tích được 250 điểm.
- **Tỷ lệ Tiêu điểm (Redemption Rate)**:
  - **1 điểm thưởng = 100 VND** giảm trừ trực tiếp vào đơn hàng tại bước Checkout.
  - Ví dụ: Dùng 500 điểm = Giảm 50,000 VND.
- **Hạn mức Tiêu điểm Bảo vệ Biên lợi nhuận**:
  - Ngưỡng tối thiểu để bắt đầu tiêu điểm: **1,000 điểm** (= tương đương 100,000 VND).
  - Mức giảm giá tối đa từ điểm thưởng: **Không vượt quá 20% tổng giá trị tiền hàng (subtotal)** của đơn hàng.

### 7.3 Hạng Thành viên (Loyalty Tiers)
Hệ thống tự động nâng hạng thành viên dựa trên tổng điểm tích lũy lũy kế (`loyaltyPoints`):
- **BRONZE (Đồng)**: 0 – 999 điểm.
- **SILVER (Bạc)**: 1,000 – 4,999 điểm (Ưu đãi: Giảm thêm 2% trên mọi đơn sách).
- **GOLD (Vàng)**: 5,000 – 19,999 điểm (Ưu đãi: Giảm thêm 5% trên mọi đơn sách, miễn phí vận chuyển cho đơn từ 150,000đ).
- **DIAMOND (Kim cương)**: Từ 20,000 điểm trở lên (Ưu đãi: Giảm thêm 10%, quà tặng sinh nhật, hỗ trợ CSKH VIP).

---

## 8. QUY TẮC BÁN HÀNG QUA TRANG ĐÍCH (LANDING PAGE ORDERS)

### 8.1 Ràng buộc Sản phẩm Thực (Real Inventory Binding)
- Mọi gói sản phẩm (Package / Offer) hiển thị trên Landing Page **bắt buộc phải tham chiếu đến Product ID thật** trong cơ sở dữ liệu `products`.
- Không cho phép bán sản phẩm ảo hoặc gói độc lập không có đối ứng trong kho.

### 8.2 Tích hợp Trọn vẹn vào OrdersService Pipeline
- Khi khách hàng gửi đơn đặt hàng từ Landing Page, Backend bắt buộc gọi qua phương thức tập trung `OrdersService.create()` (hoặc `OrdersService.createAtomic()`):
  1. Kiểm tra tồn kho thực tế của từng sản phẩm trong gói.
  2. Khấu trừ tồn kho nguyên tử và tăng bộ đếm sản phẩm bán chạy `sold`.
  3. Ghi nhận giao dịch xuất kho vào sổ cái `InventoryTransaction` với type `SALE`.
  4. Sinh mã đơn hàng chuẩn thống nhất `TTxxxxxx` từ hàm sinh mã tập trung.
  5. Đánh dấu nguồn đơn hàng: `orderSource: 'LANDING_PAGE'` kèm `landingPageId`.
  6. **Không sinh email giả**: Nếu khách không cung cấp email, lưu `customerEmail: null` hoặc xử lý theo luồng Guest Order chuẩn, không sinh chuỗi ảo `{phone}@truongthanh.vn`.
  7. **Chống trùng lặp (Idempotency)**: Hỗ trợ Header `Idempotency-Key` để ngăn chặn việc khách hàng nhấn gửi nhiều lần liên tiếp tạo ra nhiều đơn trùng lặp.

---

## 9. BÁO CÁO DOANH THU & TOÀN VẸN DỮ LIỆU TÀI CHÍNH

### 9.1 Định nghĩa Doanh thu Thực tế (Net Realized Revenue)
Doanh thu báo cáo phải phản ánh chính xác dòng tiền kinh doanh thực:
- **Đơn hàng được tính vào Doanh thu**: Chỉ bao gồm các đơn hàng đã thanh toán thành công (`paymentStatus === 'PAID'`) HOẶC các đơn hàng có trạng thái `DELIVERED`, `COMPLETED`.
- **Đơn hàng bị loại trừ khỏi Doanh thu**:
  - Đơn hàng bị hủy (`CANCELLED`).
  - Đơn hàng trả hàng / hoàn tiền (`RETURNED` / `REFUNDED`).
  - Đơn hàng chưa thanh toán đang ở trạng thái `PENDING`.
- **Doanh thu thuần (Net Revenue)**:
  $$\text{Net Revenue} = \sum (\text{Subtotal}) - \sum (\text{Discounts}) + \sum (\text{Shipping Fee})$$
- Tuyệt đối không dùng mảng số liệu mẫu (Mock data) trong môi trường sản xuất. Mọi báo cáo của `ReportsService` phải tính toán dựa trên dữ liệu thực tế từ cơ sở dữ liệu MongoDB thông qua Aggregation Pipeline.

---
*Tài liệu này là căn cứ chính thức để đội ngũ Backend (BE), Frontend (FE) và Đảm bảo chất lượng (QA) thiết kế, triển khai và kiểm thử toàn diện hệ thống.*
