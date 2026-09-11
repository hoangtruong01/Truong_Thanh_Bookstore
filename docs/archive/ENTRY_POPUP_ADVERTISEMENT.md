# 🚀 QUẢNG CÁO MỞ TRANG (ENTRY POPUP ADVERTISEMENT / WEBSITE OPENING AD)
> **Hệ thống:** TRƯỜNG THÀNH BOOKSTORE & STATIONERY  
> **Phiên bản:** 1.0  
> **Phân hệ:** Full-stack (Backend NestJS + Frontend Vue 3 + Admin CMS)  
> **Trạng thái:** ✅ Đã hoàn thành (100% Tests Pass, 0 Lint Errors, Build Clean)  

---

## 1. 🌟 Tổng quan Tính năng (Overview)

Tính năng **Quảng cáo Mở Trang (Entry Popup Advertisement)** cho phép Quản trị viên (Admin / Staff có quyền `MANAGE_BANNERS`) dễ dàng tải lên một ảnh áp phích quảng cáo tiếp thị, cấu hình đường link chuyển hướng và tần suất hiển thị.

Khi khách hàng truy cập vào bất kỳ trang nào của website Nhà sách Trường Thành, một cửa sổ nổi (Interstitial Modal) sẽ xuất hiện phủ trên nền tối mờ với ảnh nguyên tỉ lệ, nút đóng trực quan và nút bấm kêu gọi hành động (CTA) màu đỏ đặc trưng của thương hiệu Trường Thành (`#dc2626`).

---

## 2. 🏗️ Kiến trúc & Thiết kế Kỹ thuật (Technical Design)

Hệ thống được mở rộng trực tiếp từ module `Banners` sẵn có, giữ nguyên vẹn tính ổn định của hệ thống và tương thích ngược 100%:

```text
                        ┌───────────────────────────────┐
                        │      Admin CMS (Banners.vue)   │
                        │  - Chọn "Popup khi mở website" │
                        │  - Upload ảnh (không ép crop)  │
                        │  - Cấu hình tần suất, CTA, hẹn │
                        └───────────────┬───────────────┘
                                        │ POST / PATCH (JWT + MANAGE_BANNERS)
                                        ▼
                        ┌───────────────────────────────┐
                        │     Backend NestJS API         │
                        │  - Validate DTO & Sanitize URL│
                        │  - Tải ảnh lên Cloudinary     │
                        │  - Single Active Popup Rule   │
                        └───────────────┬───────────────┘
                                        │
                                        ▼
                        ┌───────────────────────────────┐
                        │       MongoDB Collection      │
                        │   `banners` (position: popup) │
                        └───────────────┬───────────────┘
                                        │ GET /banners/active-popup (Public)
                                        ▼
                        ┌───────────────────────────────┐
                        │ Storefront: CustomerLayout    │
                        │       <EntryAdPopup />        │
                        │  - Kiểm tra tần suất (storage)│
                        │  - Overlay mờ & Dialog chuẩn  │
                        │  - ESC / Click / Link an toàn │
                        └───────────────────────────────┘
```

---

## 3. 🗄️ Mô hình Dữ liệu (Data Model)

Cập nhật Schema `Banner` (`backend/src/modules/banners/schemas/banner.schema.ts`):

```typescript
export enum BannerPosition {
  MAIN_SLIDER = 'main_slider',
  SIDEBAR_LEFT = 'sidebar_left',
  SIDEBAR_RIGHT_TOP = 'sidebar_right_top',
  SIDEBAR_RIGHT_BOTTOM = 'sidebar_right_bottom',
  BOTTOM_ROW = 'bottom_row',
  ENTRY_POPUP = 'entry_popup', // <-- Mới bổ sung
}

export enum BannerFrequency {
  EVERY_VISIT = 'EVERY_VISIT',         // Mỗi lần tải trang (mặc định)
  ONCE_PER_SESSION = 'ONCE_PER_SESSION', // 1 lần mỗi phiên làm việc
  ONCE_PER_DAY = 'ONCE_PER_DAY',         // 1 lần mỗi ngày
}

// Các trường tùy chọn dành riêng cho Entry Popup:
@Prop({ type: String, enum: BannerFrequency, default: BannerFrequency.EVERY_VISIT })
frequency?: BannerFrequency;

@Prop({ type: Date, default: null })
startAt?: Date;

@Prop({ type: Date, default: null })
endAt?: Date;

@Prop({ type: String, default: 'Mở' })
ctaLabel?: string;

@Prop({ type: Boolean, default: true })
closeable?: boolean;

@Prop({ type: Number, default: 0 })
impressionCount?: number;

@Prop({ type: Number, default: 0 })
clickCount?: number;
```

---

## 4. 📡 Danh sách API Endpoints

| Method | Endpoint | Quyền hạn | Mô tả |
|---|---|---|---|
| `GET` | `/banners/active-popup` | **Public** | Lấy thông tin popup quảng cáo đang kích hoạt và còn hiệu lực. Trả về `null` nếu không có popup nào thỏa mãn. |
| `GET` | `/banners/active` | **Public** | Lấy danh sách banner trang chủ (tự động loại trừ `ENTRY_POPUP`). |
| `GET` | `/banners` | Staff `MANAGE_BANNERS` / `ADMIN` | Lấy toàn bộ banner phục vụ màn hình quản trị. |
| `POST` | `/banners` | Staff `MANAGE_BANNERS` / `ADMIN` | Tạo banner mới hoặc tạo Entry Popup. |
| `PATCH` | `/banners/:id` | Staff `MANAGE_BANNERS` / `ADMIN` | Cập nhật thông tin banner / popup. |
| `DELETE` | `/banners/:id` | Staff `MANAGE_BANNERS` / `ADMIN` | Xóa banner. |

---

## 5. ⚖️ Quy tắc Nghiệp vụ Cốt lõi (Business Rules)

1. **Single Active Popup Rule:**
   - Khi Admin kích hoạt (`isActive = true`) một popup có vị trí `entry_popup`, hệ thống tự động chạy truy vấn `updateMany` vô hiệu hóa (`isActive = false`) tất cả các popup khác.
   - Nhờ đó, Admin không bao giờ phải thực hiện thao tác thủ công tìm và tắt popup cũ.

2. **Khóa Lọc Theo Thời Gian (Schedule Filter):**
   - Server chỉ trả về popup nếu `startAt == null || startAt <= now` VÀ `endAt == null || endAt >= now`.
   - Popup chưa tới giờ hoặc đã hết hạn sẽ biến mất ngay lập tức mà không cần can thiệp mã nguồn.

3. **Cách ly Banner Trang Chủ:**
   - Truy vấn `findActive()` có điều kiện `{ position: { $ne: 'entry_popup' } }` để banner popup không bao giờ xuất hiện sai vị trí trong slider hay danh sách sản phẩm.

4. **Quản lý Tần suất Hiển thị (Display Frequency):**
   - `EVERY_VISIT`: Popup xuất hiện mỗi khi người dùng truy cập.
   - `ONCE_PER_SESSION`: Lưu vào `sessionStorage` khóa dạng: `entry_ad_seen_${bannerId}_${updatedAt}`.
     *(Nếu Admin cập nhật lại nội dung quảng cáo, `updatedAt` thay đổi sẽ tự động kích hoạt hiển thị lại cho người dùng).*
   - `ONCE_PER_DAY`: Lưu vào `localStorage` khóa dạng: `entry_ad_seen_${bannerId}_${YYYY-MM-DD}`.

5. **Lưu trữ Hình ảnh Cloudinary & Graceful Fallback:**
   - Nếu môi trường có `CLOUDINARY_CLOUD_NAME`, ảnh base64 sẽ tự động tải lên Cloudinary folder `truong_thanh_banners` và chỉ lưu URL bảo mật vào database.
   - Nếu chưa cấu hình Cloudinary (ở môi trường phát triển offline), hệ thống fallback lưu an toàn mà không quăng lỗi, không làm gián đoạn trải nghiệm người dùng.

6. **Bảo mật Đường dẫn (URL Sanitization):**
   - Cả Backend (DTO regex) và Frontend (`isSafeUrl`) đều chủ động từ chối các URL chứa mã độc hại: `javascript:`, `data:`, `vbscript:`.
   - Chỉ chấp nhận đường dẫn tương đối `/products/xyz` (dùng Vue Router) hoặc đường dẫn tuyệt đối an toàn `http://`, `https://` (mở tab mới với `noopener,noreferrer`).

---

## 6. 🖥️ Hướng dẫn Vận hành Quản trị (Admin Guide)

1. Đăng nhập vào trang Quản trị (`/admin`).
2. Vào menu **Quản lý Banner** (`/admin/banners`).
3. Nhấp nút **"Thêm Banner"**.
4. Tại ô **"Vị trí hiển thị"**, chọn: **"Quảng cáo khi mở website (Popup)"**.
5. Nhập các thông tin:
   - **Tên quảng cáo:** Ví dụ "Đại tiệc Hội Sách Mùa Hè 2026".
   - **Tải ảnh:** Chọn hoặc kéo thả ảnh áp phích (hệ thống giữ nguyên tỉ lệ gốc của ảnh).
   - **Đường dẫn khi click:** (Tùy chọn) Ví dụ `/promotions` hoặc link bài viết.
   - **Nhãn nút CTA:** Mặc định "Mở" hoặc "XEM NGAY".
   - **Tần suất:** Chọn 1 trong 3 mức (*Mỗi lần truy cập*, *Một lần / phiên*, *Một lần / ngày*).
   - **Thời gian bắt đầu / kết thúc:** Đặt lịch phát hành chiến dịch tiếp thị.
   - **Cho phép đóng:** Bật nếu muốn khách hàng tự đóng quảng cáo.
   - **Kích hoạt:** Bật để phát hành ngay.
6. Nhấp **"Lưu"**.
7. Admin có thể bấm vào biểu tượng con mắt **"Xem trước"** trên card quảng cáo để xem mô phỏng cửa sổ nổi giống hệt như khách hàng nhìn thấy.

---

## 7. 🧪 Báo cáo Kiểm thử Tự động (Automated Test Results)

- **Backend NestJS:**
  - `banners.service.spec.ts`: 11 tests kiểm tra CRUD, Cloudinary upload, quy tắc Single Active Popup, loại trừ banner trang chủ, lọc lịch hẹn thời gian thực.
  - `banners.controller.spec.ts`: 3 tests kiểm tra ủy quyền endpoint `getActivePopup()`.
  - `banner.dto.spec.ts`: 6 tests kiểm tra validation DTO và chặn URL chứa script độc hại.
  - **Tổng kết Backend:** 40/40 test suites pass, 445/445 unit tests pass, 0 ESLint errors.
- **Frontend Vue 3:**
  - `EntryAdPopup.spec.ts`: 11 tests kiểm tra render modal, đóng qua nút ✕, đóng qua phím `ESC`, xử lý tần suất `EVERY_VISIT`, `ONCE_PER_SESSION`, `ONCE_PER_DAY`, điều hướng an toàn và xử lý khi API trả `null`.
  - **Tổng kết Frontend:** 13/13 test files pass, 65/65 unit tests pass, `vue-tsc` & `vite build` 100% pass.
