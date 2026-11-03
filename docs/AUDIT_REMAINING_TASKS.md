# Việc còn lại sau audit — Trường Thành Bookstore

> **Cập nhật:** 03/11/2026 · **Nguồn:** `PROJECT_AUDIT_AND_OPTIMIZATION.md` (audit 03/11/2026) + kiểm thử production cùng ngày
> **Nhánh làm việc:** `refactor/web-mobile-sync` (chưa commit, chưa deploy)
> Mã `TASK-xxx`, `BUG-xxx`, `FEAT-xxx` giữ nguyên theo tài liệu audit.

---

## 1. Tình trạng hiện tại (đã kiểm chứng trên production 03/11)

| Hạng mục | Kết quả |
|---|---|
| Backend production | Vẫn chạy commit cũ `2bc840b`. CD Deploy fail ở cả 4 commit sau đó (bước smoke test backend) |
| BUG-002 `/documents` | **Còn mở trên production:** tài khoản khách gọi `GET /api/documents` nhận 200. Hiện 0 chứng từ nên chưa lộ dữ liệu |
| BUG-003 mật khẩu mặc định | **Còn mở:** `admin@truongthanh.vn` đăng nhập được bằng mật khẩu công khai trong repo |
| Dấu hiệu bị xâm nhập | Chưa thấy: chỉ 5 tài khoản (đều do seed tạo 10/09), không có admin lạ, 0 chứng từ |
| Đơn hàng thật | 0 (chỉ 3 đơn mẫu) — khớp với việc Checkout đang crash |
| Tài khoản kiểm thử đã tạo | `qa-audit-20261103@example.com` (CUSTOMER) — xóa khi không cần nữa |

---

## 2. ✅ Đã làm trong code (chờ commit + deploy)

| Mã | Nội dung | Test |
|---|---|---|
| TASK-003 / BUG-001 | Checkout không còn crash (khối `watch` dời xuống sau các khai báo) | `CheckoutPreviewWatch.spec.ts` (phiên refactor web↔mobile) |
| TASK-005 | `PermissionsGuard`/`RolesGuard` chặn mặc định: thiếu `@Permissions`/`@Roles` ⇒ chỉ ADMIN/SUPER_ADMIN. Test quét mọi controller bằng metadata thật (0 vi phạm) | `rbac.guard.spec.ts`, `route-coverage.spec.ts` |
| TASK-006 | Seed demo / `--reset` chỉ chạy trên DB local hoặc DB có tên chứa từ `staging`/`e2e`/`demo`/`test` (so theo từ, DB tên đúng `test` bị từ chối). Mật khẩu mặc định chỉ cho DB local. Không in mật khẩu. `AUTO_SEED` trên DB thật ⇒ ghi log và bỏ qua, không crash app | `seed-safety.spec.ts`, `seed.service.spec.ts` |
| TASK-004 (một phần) | CD: frontend chỉ deploy khi backend pass smoke test; smoke test chấp nhận commit mới nhất hoặc commit gần nhất có đổi `backend/` | `scripts/smoke-test.test.mjs` |
| BUG-012 | Báo cáo doanh thu lọc kênh WEB/MOBILE ra số liệu riêng (sửa trong `reports/`) | `reports.service.spec.ts` |
| BUG-011 | _Đang hoàn thiện_ — xem mục 6 | |
| FEAT-001 (backend) | _Đang hoàn thiện_ — xem mục 6 | |
| BUG-020 | Không gạch giá khi `discountPrice == price` ở `ProductCard` | `ProductCardPrice.spec.ts` |
| BUG-023 | Sửa chính tả "Trường Thanh" → "Trường Thành" (`ProductDetail.vue`) | — |
| BUG-024 | Bổ sung 9 tiêu đề tab trang Admin | — |
| BUG-027 | Sửa nhãn vai trò bị đảo (`AdminLayout`, `ProfileModal`) | `ProfileModal.spec.ts` |

**Lưu ý:** các bản sửa backend (đặc biệt TASK-005) **chưa có tác dụng trên production** cho tới khi deploy được (mục 3, việc #2).

---

## 3. 🔴 Việc chủ dự án phải làm ngay (AI không có quyền)

| # | Việc | Cách làm | Hoàn thành khi |
|---|---|---|---|
| 1 | **Đổi mật khẩu 4 tài khoản seed** (TASK-001) | Đổi mật khẩu `superadmin@`, `admin@`, `staff@`, `customer@` `truongthanh.vn` (≥16 ký tự, lưu trình quản lý mật khẩu). Khóa `staff@`/`customer@` nếu chỉ là tài khoản demo | Đăng nhập bằng mật khẩu cũ thất bại |
| 2 | **Sửa Render để deploy được backend `main`** (TASK-002) | Vào Render → Logs của lần deploy lỗi gần nhất. Từ commit `231b1b4`, app tự bật kiểm tra production khi chạy trên Render; thiếu một điều kiện là app dừng khi khởi động. Tìm một trong các thông báo: `REDIS_URL is required` · `COOKIE_SECURE=true is required` · `AUTO_SEED ... must be false` · lỗi JWT secret (cần 3 secret khác nhau, ≥32 ký tự) · `FRONTEND_URL ... HTTPS`. Sửa biến môi trường tương ứng rồi deploy lại | `/api/health` trả `release` = commit mới nhất của `main` và khách gọi `/api/documents` nhận 403 |
| 3 | **Thu hồi GitLab access token** | Remote `gitlab` trên máy dev chứa token dạng rõ trong URL. Thu hồi token ở GitLab → Settings → Access Tokens, đặt lại remote không kèm token | Token cũ bị revoke |
| 4 | Rà log truy cập | Xem log Render/Atlas 30 ngày gần nhất cho đăng nhập Admin từ IP lạ (production không có API nhật ký đăng nhập) | Có kết luận |
| 5 | Chặn Vercel tự deploy trước backend (hoàn tất TASK-004) | Thêm `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` vào GitHub Secrets, rồi tắt auto-deploy nhánh `main` của Vercel. **Không** tắt trước khi có secret (frontend sẽ ngừng deploy) | Frontend chỉ lên production qua GitHub Actions |
| 6 | Bật branch protection cho `main` | PR + CI xanh + 1 review | Không push thẳng `main` được |
| 7 | Đặt `TRUST_PROXY=1` trên Render (sau khi BUG-011 được merge) | Không bao giờ đặt `true` | Đăng nhập sai nhiều lần ở máy A không khóa máy B |

---

## 4. 🟡 Cần chủ cửa hàng quyết định

| # | Câu hỏi | Ảnh hưởng | Đề xuất |
|---|---|---|---|
| D-1 | Cửa hàng có thật sự nhiều kho? | BUG-006 / TASK-016 | Nếu chỉ 1 kho: ẩn module đa kho bằng cờ cấu hình (đã có kế hoạch chi tiết, ~5 file). Hiện tồn theo kho luôn rỗng, chuyển kho không thực hiện được |
| D-2 | Có giữ bán combo trên website? | BUG-004 / TASK-014, 015 | Nếu ít bán: ẩn combo, bán theo khuyến mãi "mua kèm" |
| D-3 | Định nghĩa doanh thu (BUG-021 / TASK-017) | Dashboard, báo cáo | Cần chốt: (1) "Tổng đơn" có tính đơn hủy/trả không, theo kỳ hay từ trước tới nay; (2) ghi nhận doanh thu theo ngày tạo, ngày thanh toán hay ngày giao; (3) có tính phí ship không; (4) hoàn một phần trừ vào ngày nào; (5) đơn landing page thuộc kênh nào; (6) giá vốn online có nhân hệ số quy đổi; (7) tăng trưởng có tính POS, theo giờ VN; (8) báo cáo nhập-xuất-tồn có dùng chung định nghĩa |
| D-4 | Duyệt mockup màn hình "Nhân viên & Phân quyền" (FEAT-001 / TASK-034) | Quản lý nhiều nhân viên | Mockup ở mục 7 |
| D-5 | Có key Cloudinary chưa? | BUG-007 / TASK-019 (upload ảnh sản phẩm) | Cần key trước khi làm |
| D-6 | Cấp môi trường staging (TASK-008) | Toàn bộ kiểm thử Admin/Staff có ghi dữ liệu | Atlas DB tên `truongthanh_staging` + Render service thứ 2 |

---

## 5. ⬜ Việc dev còn lại (chưa làm)

### P0–P1 — trước khi mở bán

| Mã | Việc | Phụ thuộc | Ghi chú |
|---|---|---|---|
| TASK-007 | E2E thao tác UI thật trong CI (bấm nút đặt hàng, assert không có ErrorBoundary) | — | Bộ e2e cũ gọi API bằng `fetch` nên không bắt được lỗi Checkout |
| TASK-008 | Môi trường staging | D-6 | |
| TASK-009 | Backup Atlas + diễn tập khôi phục, runbook | — | |
| TASK-010 | Sentry FE/BE + ErrorBoundary thân thiện (hotline/Zalo, không hiện lỗi kỹ thuật) | — | |
| TASK-012 | Làm sạch dữ liệu demo trên production: 121/121 SP có sao ảo, "Đã bán" ngẫu nhiên, 32 ảnh dùng chung cho 121 SP, danh mục sai, slug mất chữ "đ" | Backup (TASK-009), TASK-021 | Chạy migration có backup, idempotent |
| TASK-013 | Ẩn sao/"Đã bán" khi chưa có đánh giá thật | — | |
| TASK-014 | Ẩn khối combo sai thành phần ("-92%") | — | |
| TASK-015 | Combo trừ kho thành phần | D-2 | |
| TASK-016 | Đa kho: ẩn (A) hoặc làm thật (B) | D-1 | |
| TASK-017 | Một định nghĩa + một hàm tính KPI doanh thu | D-3 | BUG-012 đã sửa tạm trong `reports/`; logic "doanh thu đã ghi nhận" đang trùng giữa `reports` và `orders`, cần gộp |
| TASK-019 | Upload ảnh lên Cloudinary thay base64 (endpoint `POST /uploads/images` kiểm magic bytes, `ImageUploader`, `ProductForm`, `Banners`, DTO `@IsUrl`) | D-5 | Thứ tự an toàn: endpoint → frontend → migration ảnh cũ → siết DTO |
| TASK-027 | Giao diện mobile 390px (header tràn, nút "+" giỏ hàng bị đẩy ra ngoài) | — | Thuộc phiên refactor web↔mobile |
| TASK-034 | Màn hình Nhân viên & Phân quyền | D-4 | **Bắt buộc thêm** kiểm tra `meta.roles` ở router và menu, nếu không STAFF sẽ thấy trang toàn lỗi 403 |
| TASK-039, 040, 041, 042 | Ma trận RBAC tự động, test đồng thời, e2e Admin trên staging, smoke production sau deploy | TASK-008 | |

### P2–P3 — sau khi mở bán

| Mã | Việc |
|---|---|
| BUG-020 (phần còn lại) | Giá gạch ngang ở `ProductDetail.vue:180,215`, `Home.vue:586` — phiên refactor nhận làm (GĐ4) |
| BUG-010, BUG-013 / TASK-020 | Countdown khuyến mãi giả; ngưỡng free-ship mâu thuẫn (200k vs 299k) → cài đặt cửa hàng tập trung |
| BUG-016, BUG-018 / TASK-022 | `limit=1000` trả cả catalog (207 KB), `/categories` 170 KB; gọi API trùng |
| BUG-022 / TASK-018 | Bỏ lối tắt DELIVERED→RETURNED; hàng hoàn vào khu chờ kiểm |
| BUG-026 / TASK-024 | Cookie phiên bên thứ ba (Safari/iOS) |
| TASK-021 | Hàm slug dùng chung + framework migration |
| TASK-023 | Chống ghi đè khi 2 người sửa cùng sản phẩm |
| TASK-025 | `npm audit fix` backend (13 lỗ hổng moderate/low), ngân sách lint |
| TASK-026, 033 | Tách service/component quá lớn |
| TASK-028, 029 (phần còn lại) | BUG-017 gợi ý tìm kiếm bị cắt, BUG-025 splash screen; test cho nhãn vai trò `AdminLayout` |
| TASK-030, 031, 032 | Thao tác đơn hàng loạt, sắp xếp lại sidebar, dashboard "Việc cần làm" |
| TASK-035–038, 043 | Trang danh mục, nhật ký thao tác, gợi ý nhập hàng, duyệt thao tác nhạy cảm, đo hiệu năng |
| Gia cố API nhân viên (P3) | Xóa user là xóa cứng, không có trong UI — nên dùng "Khóa"; mở khóa tài khoản không thu hồi phiên cũ (ghi vào tài liệu) |
| Mobile | Dọn code hiển thị OTP dev trong `forgot_password_screen.dart` — phiên refactor nhận làm (GĐ3) |

---

## 6. Đợt sửa đang hoàn thiện

⚠️ **Bị dừng giữa chừng (hết token) — code đã có trong working tree nhưng CHƯA rà soát, CHƯA chạy full test. Phải kiểm tra trước khi commit.**

| Việc | File đã bị sửa | Cần làm tiếp |
|---|---|---|
| BUG-011 trust proxy (`TRUST_PROXY`, mặc định 1 trên Render, cấm `true`; log dùng `req.ip` thay header `x-forwarded-for`) | `backend/src/main.ts`, `config/env.validation.ts` (+spec), `config/trust-proxy.ts` (+spec, mới), `.env.example`, `common/interceptors/logging.interceptor.ts`, `common/filters/http-exception.filter.ts` (+spec) | Đọc diff, chạy `npx jest src/config src/common`, sửa nếu đỏ |
| Gia cố API nhân viên (ghi nhật ký khi đổi quyền/tạo/xóa user, `@Throttle` cho permissions/delete, `@MaxLength(72)` mật khẩu, kiểm tra ép kiểu `status: "false"`) | `backend/src/modules/users/{users.service.ts,users.controller.ts,dto/user.dto.ts,dto/user.dto.spec.ts}`, `common/audit/security-audit.service.ts` | Đọc diff, chạy `npx jest src/modules/users src/common/audit src/common/guards` |

Sau đó chạy đủ bộ kiểm tra AGENTS.md: backend `npm test`, `npm run lint`, `npm run build`; frontend `npm run test:unit`, `typecheck`, `lint`, `build`. Phiên refactor web↔mobile cũng dừng dở (xem `docs/WEB_MOBILE_SYNC_PLAN.md`), nên test đỏ ở `orders/cart/promotions/auth`, `pages/customer`, `mobile` là phần dở của phiên đó.

Lần kiểm tra full gần nhất (trước đợt này): backend 913/913 test, lint 0 lỗi, build OK; frontend 124/124 test, typecheck/lint/build sạch.

---

## 7. Mockup FEAT-001 — Nhân viên & Phân quyền (chờ duyệt)

```
+-------------------------------------------------------------------------+
| Nhân viên & Phân quyền                              [+ Tạo tài khoản]   |
| [Tìm tên/email/SĐT.......] [Vai trò: Tất cả v] [Trạng thái: Tất cả v]   |
+-------------------------------------------------------------------------+
| Họ tên          | Email             | Vai trò    | Quyền     | TT  | ... |
|-----------------|-------------------|------------|-----------|-----|-----|
| Nguyễn Văn A    | a@truongthanh.vn  | Nhân viên  | 3 quyền   | (o) | [v] |
| Trần Thị B      | b@truongthanh.vn  | Quản trị   | Toàn quyền| (o) | [v] |
| Lê C (bạn)      | c@truongthanh.vn  | Super Admin| Toàn quyền| (o) |  -  |
+-------------------------------------------------------------------------+
 [v] menu: Đổi vai trò | Phân quyền (chỉ Nhân viên) | Khóa / Mở khóa

 Modal "Phân quyền - Nguyễn Văn A"
 +-----------------------------------------------+
 | Bán hàng   [x] Đơn hàng  [ ] Khách hàng       |
 | POS        [x] Truy cập  [ ] Hoàn tiền [ ] Hủy |
 | Kho        [x] Quản lý kho                    |
 | Tài chính  [ ] Sổ quỹ    [ ] Báo cáo          |
 | Marketing  [ ] KM  [ ] Banner  [ ] Landing     |
 |                          [Hủy]  [Lưu quyền]   |
 +-----------------------------------------------+
```

- Dùng lại API có sẵn: `GET/POST /users`, `GET /users/:id`, `PATCH /users/:id/role|permissions|status`. Không đưa nút xóa vào UI.
- Chỉ Super Admin thấy lựa chọn vai trò Quản trị/Super Admin; ẩn thao tác trên dòng của chính mình và dòng Super Admin.
- Mặc định lọc vai trò Nhân viên/Quản trị (danh sách `/users` gồm cả khách hàng).

---

## 8. Phối hợp

Hai phiên AI đang sửa song song trên nhánh `refactor/web-mobile-sync`:
- **Phiên audit (tài liệu này):** `backend/src/common/**`, `seeds/**`, `config/**`, các module backend nghiệp vụ còn lại (users, reports, inventory, warehouses, finance, pos…), `frontend/src/pages/admin/**`, `AdminLayout.vue`, `ProductCard.vue`, `.github/workflows/deploy.yml`, `scripts/smoke-test.*`.
- **Phiên refactor web↔mobile:** `mobile/**`, `frontend/src/pages/customer/**`, `CustomerLayout.vue`, `router/index.ts`, backend `auth`, `cart`, `products`, `categories`, `banners`, `orders`, `promotions`, `payments`.
- Commit chỉ theo đường dẫn file cụ thể; không `git add -A`, không stash/reset trên working tree chung.
