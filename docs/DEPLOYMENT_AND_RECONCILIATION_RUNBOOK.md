# Runbook Triển khai, Diễn tập Khôi phục & Đối soát Số dư (T01 / T05)

**Dự án:** Trường Thành Bookstore  
**Phiên bản tài liệu:** 1.0  
**Ngày cập nhật:** 24/11/2026  
**Mã nghiệp vụ tham chiếu:** `T01` (Deployment Parity & Smoke Test), `T05` (Backup & Restore Drill with Financial/Inventory Reconciliation)  
**Tình trạng baseline:** Nhánh `main`, commit `adfb644`

---

## 1. Tình trạng triển khai thực tế (T01 — Ground Truth Audit)

Kiểm tra trực tiếp qua công cụ `scripts/verify-release-parity.mjs` trên hạ tầng cloud:

| Thành phần | Endpoint kiểm tra | Trạng thái live | Release SHA thực tế | So với Git `main` (`adfb644`) | Kết luận |
|---|---|---|---|---|---|
| **Git Repository** | `origin/main` | Active | `adfb644` (24/11/2026) | HEAD hiện tại | Đã tích hợp Giao việc 1 & Sidebar ERP |
| **Backend (Render)** | `https://truong-thanh-bookstore.onrender.com/api/health` | 200 OK (UP) | `2bc840ba63c4cec015890a0c2bd9b952b7f62559` (03/11/2026) | **Lệch > 15 commits** | Chưa deploy được code mới |
| **Frontend (Vercel)** | `https://truong-thanh-bookstore.vercel.app` | 200 OK | Build ngày 03/11/2026 (`99b4309`) | **Lệch > 15 commits** | Bị dừng do CD chờ Backend |

---

## 2. Nguyên nhân bước Smoke Test thất bại trên Render & Cơ chế chặn CD

### 2.1. Chuỗi sự kiện gây lỗi
1. **Validation môi trường nghiêm ngặt (Strict Production Validation):**
   Từ commit `231b1b4`, file `backend/src/config/env.validation.ts` bổ sung cơ chế kiểm soát an toàn môi trường production. Khi chạy trên Render (`process.env.RENDER === 'true'`), NestJS bắt buộc phải có:
   - `REDIS_URL` hợp lệ (`redis://` hoặc `rediss://`) HOẶC `ALLOW_IN_MEMORY_REDIS_FALLBACK=true` (cho single-instance deployment/Render, đã cấu hình mặc định trong Dockerfile).
   - `COOKIE_SECURE=true`.
   - `AUTO_SEED=false` và `RESET_DATABASE_ON_SEED=false`.
   - 3 secret JWT riêng biệt, tối thiểu 32 ký tự: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_RESET_SECRET`.
   - `FRONTEND_URL` bắt buộc có giao thức `https://`.
   - `TRUST_PROXY=1` (đúng số hop của proxy Render, cấm `true`).
2. **Container mới bị Crash lúc khởi động (Rollout Abort):**
   Do Render Dashboard thiếu các biến môi trường trên, mỗi khi có commit mới đẩy lên `main`, Render build thành công nhưng tiến trình NestJS exit ngay lập tức khi boot. Render cơ chế Zero-downtime nhận diện container lỗi nên rollback và giữ nguyên container cũ `2bc840b`.
3. **Smoke Test Timeout:**
   Workflow `.github/workflows/deploy.yml` chạy `scripts/smoke-test.sh` kiểm tra `/api/health`. Vì release trả về luôn là `2bc840b` (khác commit mong đợi), script đợi hết 60 lần x 10s = 600s rồi báo lỗi:
   `❌ SMOKE TEST FAILED: Service failed to report HEALTHY within 600s`
4. **Bảo vệ Frontend (TASK-004):**
   Job `deploy-frontend` có điều kiện `needs: deploy-backend`. Khi backend fail smoke test, frontend deploy lập tức bị hủy để tránh tình trạng frontend mới gọi các API backend chưa được cập nhật.

---

## 3. Diễn tập Sao lưu, Phục hồi DB & Đối soát Số dư (T05)

### 3.1. Nguyên tắc an toàn dữ liệu
- Tuân thủ quy định tại `AGENTS.md` (Mục 6.2) và `seed-safety.ts`: **Tuyệt đối không chạy lệnh khôi phục đè lên database production.**
- Tên database đích phục vụ diễn tập bắt buộc phải chứa một trong các từ khóa an toàn: `[test, demo, staging, drill]`.
- Mọi database chứa từ khóa `[production, truongthanh_prod, admin, config, cluster0]` sẽ bị chặn ngay ở mức runtime bởi hàm `isSafeTargetDatabase()`.

### 3.2. Công cụ diễn tập tự động
Hệ thống cung cấp script chuẩn hóa `scripts/backup-restore-drill.mjs` và bộ kiểm thử `scripts/backup-restore-drill.test.mjs`.

**Lệnh chạy kiểm tra:**
```bash
# Chạy toàn bộ test kiểm thử diễn tập sao lưu và đối soát
node --test scripts/backup-restore-drill.test.mjs

# Chạy diễn tập độc lập
node scripts/backup-restore-drill.mjs --target-db=truongthanh_restore_drill
```

### 3.3. Bốn tiêu chuẩn đối soát số dư và tính toàn vẹn (Reconciliation Audits)

1. **Đối soát số lượng bản ghi (Document Count Audit):**
   - Đảm bảo 100% collections (`users`, `products`, `orders`, `cash_accounts`, `cash_entries`, `inventories`) có số lượng bản ghi sau restore bằng chính xác số lượng trong snapshot sao lưu.
2. **Đối soát Quỹ tiền & Sổ quỹ (Cash Ledger Reconciliation):**
   - Công thức kiểm toán:
     $$\text{Calculated Balance} = \text{openingBalance} + \sum_{e \in \text{POSTED}, e.\text{direction}=\text{IN}} e.\text{amount} - \sum_{e \in \text{POSTED}, e.\text{direction}=\text{OUT}} e.\text{amount}$$
   - Số dư tính toán phải khớp hoàn toàn với `currentBalance` trong từng tài khoản tiền (`CashAccount`).
   - Các phiếu có trạng thái `DRAFT`, `CANCELLED`, hoặc `REVERSED` bị loại trừ khỏi luồng sổ quỹ đã ghi nhận.
   - Nếu $\Delta \neq 0$, hệ thống gắn cờ discrepancy và chỉ rõ mã tài khoản bị lệch.
3. **Đối soát Tồn kho (Inventory Stock Audit):**
   - `currentStock >= 0` cho mọi sản phẩm.
   - Phát hiện các sản phẩm có tồn âm hoặc lệch lịch sử xuất nhập kho.
4. **Đối soát Đơn hàng & Doanh thu (Orders & Revenue Audit):**
   - Kiểm tra `totalAmount >= 0`.
   - Kiểm tra công thức: $\text{totalAmount} = \max(0, \text{subtotal} + \text{shippingFee} - \text{discountAmount})$.
   - Đối soát riêng tổng doanh thu ghi nhận từ các đơn `PAID`.

---

## 4. Checklist hành động của Chủ tài khoản (Owner Action Checklist)

> [!IMPORTANT]
> Các mục dưới đây thuộc thẩm quyền độc quyền của Chủ tài khoản / DevOps quản trị hạ tầng. AI không được cấp quyền và không được phép can thiệp trực tiếp vào tài khoản bên ngoài.

### Bước 1: Đổi mật khẩu 4 tài khoản seed (TASK-001)
Thực hiện đăng nhập và đổi mật khẩu sang chuỗi ngẫu nhiên $\ge 16$ ký tự, lưu vào Password Manager:
1. `superadmin@truongthanh.vn`
2. `admin@truongthanh.vn`
3. `staff@truongthanh.vn` (hoặc khóa tài khoản nếu không dùng)
4. `customer@truongthanh.vn` (khóa tài khoản)

*Tiêu chí hoàn thành:* Đăng nhập bằng mật khẩu mặc định cũ `Admin@123456` bị từ chối 100%.

### Bước 2: Cấu hình biến môi trường trên Render Dashboard (TASK-002)
Truy cập **Render.com** $\rightarrow$ Chọn Service Backend $\rightarrow$ **Environment**:

| Biến môi trường | Giá trị yêu cầu | Ý nghĩa / Lý do bắt buộc |
|---|---|---|
| `NODE_ENV` | `production` | Bật chế độ production |
| `REDIS_URL` | `rediss://...` hoặc `redis://...` | Dùng cho distributed rate-limiting và thu hồi token (Upstash Redis hoặc Redis Cloud miễn phí). Nếu chưa có Redis, Dockerfile tự động bật `ALLOW_IN_MEMORY_REDIS_FALLBACK=true` để chạy fallback in-memory an toàn trên single-instance Render. |
| `ALLOW_IN_MEMORY_REDIS_FALLBACK` | `true` | Cho phép chạy in-memory rate-limiter mà không cần Redis ngoài (mặc định đã bật trong Dockerfile) |
| `COOKIE_SECURE` | `true` | Bắt buộc truyền cookie qua HTTPS |
| `AUTO_SEED` | `false` | Ngăn tự động seed dữ liệu mẫu đè lên DB thật |
| `RESET_DATABASE_ON_SEED` | `false` | Ngăn xóa trắng DB khi deploy |
| `JWT_SECRET` | Chuỗi ngẫu nhiên $\ge 32$ ký tự | Khóa mã hóa access token |
| `JWT_REFRESH_SECRET` | Chuỗi ngẫu nhiên $\ge 32$ ký tự (khác JWT_SECRET) | Khóa mã hóa refresh token |
| `JWT_RESET_SECRET` | Chuỗi ngẫu nhiên $\ge 32$ ký tự (khác 2 khóa trên) | Khóa mã hóa reset password |
| `FRONTEND_URL` | `https://truong-thanh-bookstore.vercel.app` | CORS whitelist (bắt buộc HTTPS) |
| `TRUST_PROXY` | `1` | Số hop proxy của Render (chống giả mạo IP) |

*Gợi ý tạo khóa bí mật an toàn trên terminal:*
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sau khi lưu biến môi trường, bấm **Manual Deploy $\rightarrow$ Deploy latest commit**.
Khi deploy hoàn tất, chạy lệnh kiểm tra:
```bash
node scripts/verify-release-parity.mjs
```
Khi kết quả báo `Backend In Parity?: ✅ YES`, Backend đã hoàn tất cập nhật.

### Bước 3: Thu hồi GitLab Token lộ trong Git Remote (TASK-003)
1. Đăng nhập vào tài khoản GitLab $\rightarrow$ **User Settings** $\rightarrow$ **Access Tokens**.
2. Tìm token cũ và bấm **Revoke**.
3. Cập nhật git remote local để không lưu token dạng plaintext:
   ```bash
   git remote set-url gitlab https://gitlab.com/hoangtruong01/truong-thanh-bookstore.git
   ```

### Bước 4: Cấu hình Vercel Secrets trên GitHub Actions (TASK-004)
Để GitHub Actions tự động deploy Frontend sau khi Backend pass smoke test:
1. Vào GitHub repo $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Thêm 3 secrets:
   - `VERCEL_TOKEN`: Token lấy từ Vercel Account Settings $\rightarrow$ Tokens.
   - `VERCEL_ORG_ID`: Lấy từ file `.vercel/project.json` hoặc project settings.
   - `VERCEL_PROJECT_ID`: Lấy từ Vercel project settings.
3. Trên dashboard Vercel, tắt tính năng **Automatic Git Deployments** cho nhánh `main` để Vercel chỉ nhận bản build khi Backend đã vượt qua smoke test.

### Bước 5: Kích hoạt GitHub Branch Protection Rule cho nhánh `main`
1. Vào GitHub repo $\rightarrow$ **Settings** $\rightarrow$ **Branches**.
2. Bật bảo vệ nhánh `main`:
   - Require a pull request before merging.
   - Require status checks to pass before merging (`CI Pipeline — Trường Thành Bookstore`).
