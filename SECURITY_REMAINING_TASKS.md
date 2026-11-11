# Việc bảo mật còn lại (SECURITY_REMAINING_TASKS)

Nguồn: `SECURITY_AUDIT_AND_FIX_REPORT.md` (audit ngày 2026-11-10, nhánh `refactor/web-mobile-sync`). Tài liệu này liệt kê **mọi việc chưa xong**: OPEN, PARTIAL, BLOCKED, việc phụ của các mục đã sửa, việc cần quyết định nghiệp vụ, nâng cấp dependency, hạ tầng.

**Quy ước chung cho người nhận việc (AI hoặc người)**

- Trước khi sửa: đọc lại file thật, xác minh lỗi còn tái hiện trong code hiện tại (có thể đã đổi). Nếu không tái hiện, ghi "SKIPPED (not reproducible)" kèm lý do.
- Mỗi bản sửa cần regression test fail khi bỏ bản sửa; chỉ chạy test nhắm mục tiêu rồi chạy bộ đầy đủ ở bước cuối (`cd backend && npm test && npm run lint && npm run build`; `cd frontend && npm run test:unit && npm run typecheck && npm run lint && npm run build`).
- Không hardcode secret; không commit file `.env`; không đưa giá trị bí mật vào chat hay tài liệu.
- Các bản vá hiện có đều **chưa commit** trong working tree; cần review rồi commit trước khi xếp thêm việc lên trên (R-025).
- Ưu tiên: P0 làm ngay, P1 trong tuần, P2 trong sprint, P3 khi tiện.

## Tóm tắt

Tổng 72 việc còn lại: P0: 2; P1: 10; P2: 30; P3: 30.

| Task | SEC | Priority | Việc | Status |
|---|---|---|---|---|
| R-001 | SEC-003 | P0 | Xoay credential MongoDB Atlas và Gemini/Google API key đã lộ trong lịch sử git | BLOCKED (chủ sở hữu) |
| R-002 | SEC-056 | P0 | Thu hồi GitLab Personal Access Token đang nằm trong URL remote của .git/config | BLOCKED (chủ sở hữu) |
| R-003 | SEC-001 | P1 | Đóng hẳn giá landing page: method trusted và bỏ qua item.price/orderSource=LANDING_PAGE ở POST /orders công khai | OPEN |
| R-007 | SEC-042 | P1 | CSP Vercel: thêm frame-src cho Google Maps, bỏ unsafe-inline, thu hẹp connect-src | OPEN |
| R-024 | TẤT CẢ | P1 | Chạy lại dynamic test TEST-SEC-001..010 và e2e trên bản build đã vá | OPEN |
| R-025 | SEC-034 | P1 | Review và commit các thay đổi bảo mật đang nằm trong working tree | OPEN |
| R-031 | SEC-044 | P1 | Throttler/khóa tạm theo tài khoản cho login, forgot-password, verify-otp, reset-password và xác minh số hop TRUST_PROXY | OPEN |
| R-046 | SEC-051 | P1 | Khắc phục: docker-compose chạy image production với NODE_ENV mặc định development, mật khẩu mặc định và Redis không mật… | OPEN |
| R-052 | SEC-058 | P1 | Khắc phục: Thu hồi điểm loyalty khi trả hàng bị chặn ở 0: khách tiêu điểm trước rồi trả hàng thì giữ lại lợi ích | OPEN |
| R-053 | SEC-059 | P1 | Khắc phục: Giới hạn mã giảm giá theo người (perUserLimit) không áp dụng được với khách vãng lai | OPEN |
| R-059 | SEC-065 | P1 | Khắc phục: Khách vãng lai giữ (trừ) tồn kho hàng loạt bằng đơn COD PENDING (giữ 48h) | OPEN |
| R-066 | SEC-072 | P1 | Khắc phục: Thiếu phân tách nhiệm vụ (maker-checker) trên PO, báo giá NCC, chứng từ điện tử, phiếu thu/chi | OPEN |
| R-004 | SEC-013 | P2 | Batch lookup sản phẩm cho checkoutPreview và đồng bộ trần giỏ hàng | OPEN |
| R-005 | SEC-021 | P2 | Landing page: cửa sổ ngày hiệu lực (startAt/endAt) và giới hạn ghi chú đơn | OPEN |
| R-006 | SEC-029 | P2 | Mobile: xóa đoạn đọc OTP từ response trong forgot_password_screen.dart | OPEN |
| R-008 | SEC-027 | P2 | Xác nhận nginx.conf (nginx -t, kiểm tra header) và sửa location ảnh che mất /api/uploads | OPEN |
| R-010 | SEC-084 | P2 | Ẩn ô nhập mã đặc cách trả hàng ở storefront OrderDetail.vue | OPEN |
| R-011 | SEC-080 | P2 | Phần còn lại lộ dữ liệu công khai: OptionalJwtAuthGuard, giỏ hàng lộ wholesalePrice, categories ẩn | OPEN |
| R-012 | SEC-081 | P2 | Escape HTML trong email "có hàng trở lại" của products.service.ts | OPEN |
| R-013 | SEC-082 | P2 | Biên lợi nhuận POS: tính chiết khấu cấp đơn và conversionRatio cho costPrice | OPEN |
| R-014 | SEC-083 | P2 | Promotions: kiểm tra chéo giá trị và đồng bộ tên trường frontend/DTO | OPEN |
| R-015 | SEC-006 | P2 | POS: đưa bộ đếm sai phê duyệt sang Redis và so sánh approvalToken constant-time | OPEN |
| R-021 | SEC-022 | P2 | Đảm bảo production luôn chạy MongoDB replica set (transaction) và cảnh báo khi không có | OPEN |
| R-022 | SEC-020 | P2 | Checklist triển khai: FRONTEND_URL phải liệt kê đủ origin cho CORS và WebSocket | OPEN |
| R-026 | SEC-078 | P2 | Sửa filter lỗi: 413 cho body quá lớn, CORS bị từ chối không trả 500, che stack theo cờ production/cloud | OPEN |
| R-030 | SEC-002 | P2 | Dọn dữ liệu đánh giá cũ chứa URL ảnh không an toàn trong DB | OPEN |
| R-034 | SEC-037 | P2 | Khắc phục: Guest order access token lưu vĩnh viễn trong localStorage | OPEN |
| R-039 | SEC-043 | P2 | Khắc phục: Header X-Client-Platform: mobile biến phiên cookie HttpOnly thành token đọc được trong response | OPEN |
| R-040 | SEC-045 | P2 | Khắc phục: Mỗi user chỉ lưu một refreshTokenHash, đăng nhập thiết bị thứ hai hoặc refresh song song làm hỏng phiên | OPEN |
| R-041 | SEC-046 | P2 | Khắc phục: Lộ sự tồn tại tài khoản qua thông báo đăng ký, thông báo khóa và chênh lệch thời gian | OPEN |
| R-042 | SEC-047 | P2 | Khắc phục: Blacklist token fail-open khi Redis lỗi; trạng thái thu hồi nằm trong bộ nhớ từng instance | OPEN |
| R-043 | SEC-048 | P2 | Khắc phục: Môi trường không phải production bỏ qua kiểm tra secret; danh sách chặn secret yếu chỉ so khớp chính xác | OPEN |
| R-051 | SEC-057 | P2 | Khắc phục: IPN báo thanh toán thành công cho đơn đã HỦY không tạo yêu cầu hoàn tiền | OPEN |
| R-054 | SEC-060 | P2 | Khắc phục: Trả hàng NCC: kiểm tra số lượng còn được trả nằm ngoài transaction | OPEN |
| R-055 | SEC-061 | P2 | Khắc phục: Combo landing page bán với quantity=1: khách trả giá combo nhiều cuốn nhưng kho chỉ trừ 1 | OPEN |
| R-056 | SEC-062 | P2 | Khắc phục: Đối soát COD không xử lý đơn COMPLETED; COD đánh dấu PAID ngay khi DELIVERED | OPEN |
| R-060 | SEC-066 | P2 | Khắc phục: Lộ thông báo lỗi bên thứ ba (Cloudinary) và 500 khi ObjectId không hợp lệ ở route công khai | OPEN |
| R-063 | SEC-069 | P2 | Khắc phục: Nhân viên chỉ có MANAGE_PRODUCTS tạo được phiếu trả hàng NCC (trừ kho, bù trừ công nợ) | OPEN |
| R-064 | SEC-070 | P2 | Khắc phục: Kiểm kê kho: cờ requiresApproval không được thực thi, người nộp tự duyệt | OPEN |
| R-067 | SEC-073 | P2 | Khắc phục: Phân quyền entity trong data-exchange lệch với module gốc (MANAGE_PRODUCTS ghi đè dữ liệu suppliers) | OPEN |
| R-068 | SEC-074 | P2 | Khắc phục: Máy trạng thái chứng từ điện tử không chặt: xóa được file đính kèm của chứng từ đã REVERSED/đã chốt | OPEN |
| R-069 | SEC-075 | P2 | Khắc phục: STAFF có MANAGE_ORDERS tạo được công nợ phải thu tùy ý, không đối chiếu đơn hàng | OPEN |
| R-009 | SEC-005 | P3 | Dùng verifyTokenForRevocation cho refreshToken() và changePassword() | OPEN |
| R-016 | SEC-009 | P3 | Finance: xử lý trường hợp chạy không có replica set (session=null) | OPEN |
| R-017 | SEC-025 | P3 | Import Excel: chặn zip bomb (kích thước giải nén, đọc theo luồng) | OPEN |
| R-018 | SEC-028 | P3 | Tăng bcrypt cost (đề xuất 12) và rà giới hạn body với avatar data URL | OPEN |
| R-019 | SEC-017 | P3 | Customers: trả 404 khi không tìm thấy và xử lý id sai định dạng không gây 500 | OPEN |
| R-020 | SEC-012 | P3 | Chuyển Combos.vue sang tải phân trang rồi hạ trần limit xuống 100 | OPEN |
| R-023 | — | P3 | Đồng bộ tài liệu dự án với thực tế | OPEN |
| R-027 | SEC-079 | P3 | Không trả tokenVersion trong response người dùng | OPEN |
| R-028 | SEC-014 | P3 | Gom escapeRegex thành util dùng chung | OPEN |
| R-029 | SEC-019 | P3 | Thay nhánh dự phòng không nguyên tử của reserveOtpAttempt bằng UsersService.reserveOtpAttempt | OPEN |
| R-032 | SEC-035 | P3 | Khắc phục: Seed-safety coi host localhost/mongodb là an toàn: stack docker-compose tự host có thể bị xóa DB demo | OPEN |
| R-033 | SEC-036 | P3 | Khắc phục: Deny-by-default và route-coverage.spec chỉ bảo vệ route đã gắn PermissionsGuard/RolesGuard | OPEN |
| R-035 | SEC-038 | P3 | Khắc phục: Hồ sơ người dùng (PII, role, permissions) lưu plaintext ở localStorage/SharedPreferences; Android không tắt… | OPEN |
| R-036 | SEC-039 | P3 | Khắc phục: Socket.IO fallback về http://localhost:3000 khi build production thiếu VITE_SOCKET_URL | OPEN |
| R-037 | SEC-040 | P3 | Khắc phục: Gửi URL đơn hàng và thông tin chuyển khoản tới dịch vụ bên thứ ba qua thẻ img (QR) | OPEN |
| R-038 | SEC-041 | P3 | Khắc phục: Vite alias ép dùng bản Vue đầy đủ có runtime template compiler | OPEN |
| R-044 | SEC-049 | P3 | Khắc phục: Secret dự phòng hardcode (OTP pepper, POS approval token, guest token) và dùng lại JWT_SECRET | OPEN |
| R-045 | SEC-050 | P3 | Khắc phục: JWT chưa pin thuật toán, payload chứa email/permissions, user bị xóa nhận 404 thay vì 401 | OPEN |
| R-047 | SEC-052 | P3 | Khắc phục: Dependency production có advisory: sanitize-html, nodemailer và các gói gián tiếp (exceljs, @nestjs...) | OPEN |
| R-048 | SEC-053 | P3 | Khắc phục: Dependency dev có nhiều lỗ hổng moderate; cổng supply chain CI còn mỏng (audit chỉ chặn từ high, thiếu… | OPEN |
| R-049 | SEC-054 | P3 | Khắc phục: GitHub Actions pin theo tag (chưa pin SHA) và Docker base image không pin digest | OPEN |
| R-050 | SEC-055 | P3 | Khắc phục: Log chứa PII và URL đầy đủ; IP lấy từ X-Forwarded-For mà client có thể giả mạo | OPEN |
| R-057 | SEC-063 | P3 | Khắc phục: Checkout chuyển sang chế độ không transaction (compensated) cả trong production | OPEN |
| R-058 | SEC-064 | P3 | Khắc phục: Hoàn tiền đơn online không bao giờ hoàn tất; hoàn đảo phiếu thu POS/COD không ràng buộc chặt | OPEN |
| R-061 | SEC-067 | P3 | Khắc phục: Đăng ký nhận thông báo có hàng không xác minh email: dùng hệ thống gửi mail tới địa chỉ bất kỳ | OPEN |
| R-062 | SEC-068 | P3 | Khắc phục: Bỏ qua bước phê duyệt chuyển kho: xuất kho trực tiếp từ phiếu DRAFT rồi người tạo tự nhận | OPEN |
| R-065 | SEC-071 | P3 | Khắc phục: Endpoint kho thủ công cho nhập giá vốn tùy ý và ghi bán/hủy/điều chỉnh tồn ngoài chứng từ | OPEN |
| R-070 | SEC-076 | P3 | Khắc phục: Quyền VIEW_REPORTS và MANAGE_ORDERS quá rộng với dữ liệu tài chính (giá vốn, lãi gộp, sổ quỹ, danh sách… | OPEN |
| R-071 | SEC-077 | P3 | Khắc phục: ADMIN đổi được vai trò STAFF/CUSTOMER; tài liệu RBAC (PROJECT_OVERVIEW mục 6) lệch với code | OPEN |
| R-072 | SEC-085 | P3 | Khắc phục: Thiếu giới hạn độ dài/định dạng cho nhiều trường DTO người dùng nhập (ghi chú đơn, đánh giá, landing page...) | OPEN |

---

## Chi tiết từng việc

### [ ] R-001 — SEC-003 — Xoay credential MongoDB Atlas và Gemini/Google API key đã lộ trong lịch sử git

- **Priority:** P0  |  **Status:** BLOCKED (chủ sở hữu)  |  **Cần quyết định nghiệp vụ:** CÓ  |  **Người thực hiện:** Chủ sở hữu repo, quản trị MongoDB Atlas và Google Cloud/AI Studio
- **Severity / Category:** High / Confirmed Vulnerability
- **Cần làm:** Xoay (rotate) toàn bộ thông tin đăng nhập đã lộ trong lịch sử git (chuỗi kết nối MongoDB Atlas có mật khẩu, một Gemini/Google API key). AI không được và không thể thực hiện bước này.
- **Cách làm gợi ý:** 1) Atlas: đổi mật khẩu database user (hoặc tạo user mới rồi xóa user cũ), thu hẹp Network Access/IP allowlist, xem Activity Feed/access log từ thời điểm commit để tìm truy cập bất thường. 2) Google AI Studio/Cloud: vô hiệu hóa key đã lộ, tạo key mới có hạn chế API và IP/referrer, xem usage. 3) Đưa secret mới vào biến môi trường production (Render/Vercel) và `backend/.env` cục bộ, không commit. 4) Tùy chọn: xóa các file scratch (`backend/scratch_check_db.js`, `scratch_test_gemini.js`, `scratch_test_vertex.js`) khỏi lịch sử bằng git filter-repo hoặc BFG rồi force-push GitHub và GitLab; mọi thành viên phải clone lại. Lưu ý xóa lịch sử không thu hồi được bản đã bị sao chép nên bước 1 và 2 là bắt buộc, bước 4 là tùy chọn. 5) Thêm rule tùy chỉnh vào `.gitleaks.toml` cho `mongodb+srv://` và key Google, bật secret scanning/push protection trên GitHub và GitLab.
- **File:** `.gitleaks.toml`, `(lịch sử git) backend/scratch_*.js`, `(Atlas) database user và IP allowlist`, `(Google) API key`
- **Dependencies:** —
- **Acceptance criteria:** Credential cũ không còn đăng nhập hoặc gọi API được; secret mới chỉ nằm trong biến môi trường; gitleaks quét toàn bộ lịch sử không còn phát hiện chưa được xử lý; có rule bắt được định dạng mongodb+srv và key Google.
- **Regression test gợi ý:** Thử kết nối bằng credential cũ phải thất bại (do chủ sở hữu kiểm tra).

### [ ] R-002 — SEC-056 — Thu hồi GitLab Personal Access Token đang nằm trong URL remote của .git/config

- **Priority:** P0  |  **Status:** BLOCKED (chủ sở hữu)  |  **Người thực hiện:** Chủ tài khoản GitLab và người dùng máy dev
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Thu hồi (revoke) token cá nhân GitLab đang nhúng trong URL remote `gitlab` ở `.git/config` trên máy dev, tạo token mới có phạm vi tối thiểu nếu cần.
- **Cách làm gợi ý:** Revoke token trên GitLab (Preferences, Access Tokens). Đổi remote bằng `git remote set-url gitlab <URL không chứa thông tin đăng nhập>`, dùng credential helper của hệ điều hành hoặc SSH key. Kiểm tra các máy/CI khác đang dùng cùng token và log lệnh git. Không dán giá trị token vào chat hay tài liệu.
- **File:** `.git/config (không được track)`
- **Dependencies:** —
- **Acceptance criteria:** Token cũ bị thu hồi; `git remote -v` không còn chứa username:token; push/pull vẫn hoạt động qua credential helper hoặc SSH.
- **Regression test gợi ý:** Không áp dụng (cấu hình máy dev).

### [ ] R-003 — SEC-001 — Đóng hẳn giá landing page: method trusted và bỏ qua item.price/orderSource=LANDING_PAGE ở POST /orders công khai

- **Priority:** P1  |  **Status:** OPEN
- **Severity / Category:** High / Confirmed Vulnerability
- **Cần làm:** Thêm method trusted (ví dụ `createFromLandingPage`) trong `OrdersService`/`CheckoutService`; đổi `landing-page.service.ts` `submitOrder` sang gọi method này; để `POST /orders` công khai bỏ qua hoàn toàn `item.price` và từ chối `orderSource=LANDING_PAGE`.
- **Cách làm gợi ý:** Giữ `resolveLandingPrice` hiện có cho đường trusted (giá lấy từ gói/trang đang bật). Đường công khai không còn đọc `item.price`. Cập nhật `landing-page-order-pricing.spec.ts` và các test `checkout.service.spec.ts` liên quan.
- **File:** `backend/src/modules/orders/orders.service.ts`, `backend/src/modules/orders/services/checkout.service.ts`, `backend/src/modules/landing-pages/landing-page.service.ts`, `backend/src/modules/orders/services/checkout.service.spec.ts`, `backend/src/modules/orders/landing-page-order-pricing.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** Client không thể mua giá landing page qua POST /orders công khai (kể cả khi biết giá gói); submit-order vẫn tạo đơn đúng giá cấu hình.
- **Regression test gợi ý:** Test: POST /orders với item.price khớp giá gói và orderSource=LANDING_PAGE bị bỏ qua giá/nguồn; submit-order tạo đơn với giá gói.

### [ ] R-007 — SEC-042 — CSP Vercel: thêm frame-src cho Google Maps, bỏ unsafe-inline, thu hẹp connect-src

- **Priority:** P1  |  **Status:** OPEN
- **Severity / Category:** Low / Misconfiguration
- **Cần làm:** Cập nhật CSP trong `vercel.json` (gốc và `frontend/vercel.json`): (1) thêm `frame-src https://maps.google.com https://www.google.com` để iframe Google Maps ở footer `CustomerLayout.vue` không bị chặn (nginx.conf đã sửa, vercel.json chưa); (2) bỏ `unsafe-inline` khỏi `script-src` bằng nonce/hash hoặc chuyển script inline ra file; (3) thu hẹp `connect-src https: wss:` về domain API và socket cụ thể.
- **Cách làm gợi ý:** Đồng bộ CSP giữa `vercel.json`, `frontend/vercel.json` và `frontend/nginx.conf`. Kiểm tra trên staging bằng console CSP report.
- **File:** `vercel.json`, `frontend/vercel.json`, `frontend/index.html`, `frontend/nginx.conf`
- **Dependencies:** —
- **Acceptance criteria:** Trang không báo vi phạm CSP; iframe bản đồ hiển thị; `script-src` không còn `unsafe-inline`; `connect-src` chỉ gồm domain cần thiết.
- **Regression test gợi ý:** Kiểm tra thủ công trên staging và kiểm tra header bằng curl.

### [ ] R-024 — TẤT CẢ — Chạy lại dynamic test TEST-SEC-001..010 và e2e trên bản build đã vá

- **Priority:** P1  |  **Status:** OPEN
- **Cần làm:** Dynamic test được chạy trước bản vá. Sau khi commit, build lại và chạy lại 10 test (MongoDB replica set tạm, secret ngẫu nhiên, không dùng `.env` thật), đồng thời chạy backend `test:e2e`, Playwright e2e của frontend và `flutter test`/`flutter analyze` cho mobile. Bổ sung test kiểm tra thủ công cho cấu hình hạ tầng (nginx, vercel, compose).
- **File:** `backend/test/*`, `frontend/e2e/*`
- **Dependencies:** —
- **Acceptance criteria:** TEST-SEC-005 chuyển từ FAIL sang PASS; không test nào hồi quy; báo cáo cập nhật phần 11 và 16.
- **Regression test gợi ý:** Chính là bộ test này.

### [ ] R-025 — SEC-034 — Review và commit các thay đổi bảo mật đang nằm trong working tree

- **Priority:** P1  |  **Status:** OPEN  |  **Người thực hiện:** Developer
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Toàn bộ bản vá (kể cả deny-by-default của guard, seed-safety, chặn OTP trong response) chưa được commit. Developer cần review diff, tách commit theo cụm (C1 đến C11 trong báo cáo), chạy lại bộ kiểm tra đầy đủ rồi commit và mở PR. AI không commit/push.
- **File:** `(toàn bộ working tree)`
- **Dependencies:** —
- **Acceptance criteria:** Các commit nằm trên nhánh, CI xanh (gitleaks, test, lint, build), PR được review.
- **Regression test gợi ý:** CI.

### [ ] R-031 — SEC-044 — Throttler/khóa tạm theo tài khoản cho login, forgot-password, verify-otp, reset-password và xác minh số hop TRUST_PROXY

- **Priority:** P1  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Medium / Misconfiguration
- **Cần làm:** Thêm bộ đếm lần sai theo email đã chuẩn hóa (Redis, ví dụ khóa tạm 15 phút sau 10 lần sai, backoff tăng dần, thông điệp chung không lộ tài khoản) hoặc override getTracker theo route. Xác minh giá trị TRUST_PROXY (số hop) trên Render/Vercel thật: hai client khác IP phải có bucket riêng. Cân nhắc CAPTCHA sau N lần sai.
- **File:** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/auth/auth.controller.ts`, `backend/src/app.module.ts`, `backend/src/config/trust-proxy.ts`
- **Dependencies:** Quyết định nghiệp vụ về ngưỡng khóa; liên quan SEC-051 (cổng 3000 publish)
- **Acceptance criteria:** Hai client khác IP sau proxy có bucket riêng; 10 lần sai cho cùng một email từ nhiều IP thì bị chặn tạm thời; thông điệp lỗi chung.
- **Regression test gợi ý:** Unit: đếm lần sai theo email và trả 429 hoặc 401 chung; E2E: X-Forwarded-For từ proxy tin cậy tách bucket.

### [ ] R-046 — SEC-051 — Khắc phục: docker-compose chạy image production với NODE_ENV mặc định development, mật khẩu mặc định và Redis không mật khẩu

- **Priority:** P1  |  **Status:** OPEN
- **Severity / Category:** Low / Misconfiguration
- **Cần làm:** Đổi các secret sang cú pháp bắt buộc `${JWT_SECRET:?JWT_SECRET is required}` (tương tự cho Mongo password, REFRESH, RESET), hoặc tách `docker-compose.override.yml` riêng cho dev. Đặt `NODE_ENV: ${NODE_ENV:-production}` để khớp với image. Bỏ publish cổng 3000 vì nginx đã proxy `/api`, hoặc bind `127.0.0.1:3000:3000`. Đồng bộ HttpExceptionFilter để dùng cùng điều kiện isProduction (gồm cả cloud) như main.ts.
- **File:** `docker-compose.yml`, `docker-compose.tools.yml`, `backend/src/common/filters/http-exception.filter.ts`, `.env.example`
- **Dependencies:** —
- **Acceptance criteria:** `docker compose config` báo lỗi khi thiếu JWT_SECRET hoặc MONGO_INITDB_ROOT_PASSWORD. Backend không lắng nghe trên 0.0.0.0:3000 của host. Lỗi 5xx trong container compose không trả stack.
- **Regression test gợi ý:** Script CI chạy `docker compose config` với env rỗng và mong đợi exit code khác 0. Thêm unit test cho HttpExceptionFilter với RENDER=1 và NODE_ENV=development, kỳ vọng không có stack.

### [ ] R-052 — SEC-058 — Khắc phục: Thu hồi điểm loyalty khi trả hàng bị chặn ở 0: khách tiêu điểm trước rồi trả hàng thì giữ lại lợi ích

- **Priority:** P1  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Medium / Confirmed Vulnerability
- **Cần làm:** Chọn 1 trong các cách (cần quyết định nghiệp vụ): (a) chỉ cộng điểm khi COMPLETED hoặc sau hết hạn trả hàng (pending points); (b) khi thu hồi thiếu thì khấu trừ phần thiếu × 100đ vào refundAmount, hoặc cho phép số dư điểm âm. Đồng thời chuyển deductLoyaltyPoints sang `$inc` nguyên tử.
- **File:** `backend/src/modules/users/users.service.ts`, `backend/src/modules/orders/services/order-lifecycle.service.ts`, `backend/src/modules/orders/services/order-loyalty.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Trả đơn đã cộng điểm khi số dư điểm không đủ thì phần thiếu được khấu trừ hoặc ghi nhận rõ ràng, không bị bỏ qua lặng lẽ.
- **Regression test gợi ý:** Spec: award 1500 điểm, spend 1000, RETURNED thì kỳ vọng thiếu hụt 1000 điểm được xử lý (refundAmount giảm 100.000đ hoặc loyaltyPoints âm, tùy quyết định).

### [ ] R-053 — SEC-059 — Khắc phục: Giới hạn mã giảm giá theo người (perUserLimit) không áp dụng được với khách vãng lai

- **Priority:** P1  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Medium / Confirmed Vulnerability
- **Cần làm:** Chuẩn hóa phone (dùng normalizeGuestPhone như checkout), luôn băm theo phone đã chuẩn hóa thay vì ưu tiên email, và đếm historicalUsage theo guestPhoneKey. Về nghiệp vụ: cân nhắc yêu cầu đăng nhập hoặc OTP cho mã có perUserLimit, hoặc thêm cờ `requiresLogin` trên Promotion. Preview không nên tiết lộ lý do per-user cho danh tính chưa xác thực.
- **File:** `backend/src/modules/promotions/promotions.service.ts`, `backend/src/modules/orders/services/checkout.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Hai đơn guest cùng phone (dạng 0xxx và +84xxx), email khác nhau thì đơn thứ 2 bị từ chối khi perUserLimit=1.
- **Regression test gợi ý:** promotions.service.spec.ts: apply(commit) với phone '+84901234567' sau khi đã dùng '0901234567' thì kỳ vọng BadRequest.

### [ ] R-059 — SEC-065 — Khắc phục: Khách vãng lai giữ (trừ) tồn kho hàng loạt bằng đơn COD PENDING (giữ 48h)

- **Priority:** P1  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Medium / Potential Risk
- **Cần làm:** 1) Thêm @Throttle({default:{limit:10,ttl:60000}}) cho submit-order và truyền req.ip. 2) Thêm @Max cho quantity, cấu hình được theo nghiệp vụ, ví dụ 50 cho khách. 3) Giới hạn tổng số lượng đang giữ theo IP hoặc thiết bị, hoặc bắt buộc Turnstile ngay từ đơn đầu tiên khi số lượng lớn. 4) Cân nhắc rút thời gian giữ hàng cho đơn khách chưa xác nhận.
- **File:** `backend/src/modules/landing-pages/landing-page.controller.ts`, `backend/src/modules/landing-pages/landing-page.service.ts`, `backend/src/modules/orders/dto/order.dto.ts`, `backend/src/modules/orders/services/checkout.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** submit-order bị chặn sau 10 request/phút. Quantity vượt ngưỡng trả 400.
- **Regression test gợi ý:** Jest: quantity vượt @Max bị từ chối. Test metadata throttle cho submit-order.

### [ ] R-066 — SEC-072 — Khắc phục: Thiếu phân tách nhiệm vụ (maker-checker) trên PO, báo giá NCC, chứng từ điện tử, phiếu thu/chi

- **Priority:** P1  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Medium / Potential Risk
- **Cần làm:** 1) Thêm các permission duyệt riêng (ví dụ APPROVE_PURCHASE_ORDERS, APPROVE_FINANCE_ENTRIES, POST_DOCUMENTS), hoặc giới hạn approve/post/reverse cho ADMIN. 2) Từ chối khi approver trùng createdBy. 3) Đặt ngưỡng giá trị (ví dụ PO hoặc phiếu chi trên X đồng thì bắt buộc ADMIN). 4) Ghi audit log có actor cho mọi hành động duyệt.
- **File:** `backend/src/common/enums/index.ts`, `backend/src/modules/purchasing/purchase-orders.service.ts`, `backend/src/modules/purchasing/purchase-orders.controller.ts`, `backend/src/modules/purchasing/supplier-quotations.service.ts`, `backend/src/modules/documents/documents.service.ts`, `backend/src/modules/finance/finance.service.ts`, `backend/src/modules/finance/finance.controller.ts`
- **Dependencies:** —
- **Acceptance criteria:** Người tạo PO, báo giá, chứng từ hoặc phiếu chi không tự approve/post được (403). Hành động trên ngưỡng yêu cầu ADMIN.
- **Regression test gợi ý:** Spec cho từng service: approve với userId === createdBy thì Forbidden. Approve bởi người khác có quyền duyệt thì OK.

### [ ] R-004 — SEC-013 — Batch lookup sản phẩm cho checkoutPreview và đồng bộ trần giỏ hàng

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Medium / Confirmed Vulnerability
- **Cần làm:** Chuyển `checkoutPreview` sang `findByIds` ($in) để bỏ truy vấn tuần tự; giữ hành vi NotFound với sản phẩm bị xóa (findByIds bỏ qua sản phẩm xóa nên cần xử lý riêng). Quyết định nâng `ORDER_MAX_ITEMS` hoặc đồng bộ với trần giỏ hàng 200 dòng của `CartSyncDto`.
- **File:** `backend/src/modules/orders/services/checkout.service.ts`, `backend/src/modules/orders/dto/order.dto.ts`, `backend/src/modules/orders/orders.service.spec.ts`, `backend/src/modules/cart/dto/*`
- **Dependencies:** Phối hợp chủ sở hữu orders.service.spec.ts (khoảng 15 test mock productsService.findById từng item)
- **Acceptance criteria:** Preview 50 dòng chỉ tốn 1 truy vấn sản phẩm; giỏ hàng hợp lệ không bị chặn oan khi checkout; test cũ cập nhật theo mock mới.
- **Regression test gợi ý:** Test đếm số lần gọi findByIds/findById; test sản phẩm bị xóa trả NotFound; test giỏ vượt trần.

### [ ] R-005 — SEC-021 — Landing page: cửa sổ ngày hiệu lực (startAt/endAt) và giới hạn ghi chú đơn

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Thêm `startAt`/`endAt` vào schema LandingPage và CreateLandingPageDto, kiểm tra trong `submitOrder` và `getBySlug`; thêm `@MaxLength` cho `SubmitOrderDto.note` và các trường văn bản khác. Cần chủ sở hữu quyết định có áp dụng cửa sổ ngày hay không.
- **File:** `backend/src/modules/landing-pages/schemas/landing-page.schema.ts`, `backend/src/modules/landing-pages/dto/*`, `backend/src/modules/landing-pages/landing-page.service.ts`, `backend/src/modules/landing-pages/landing-page.service.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** Đơn gửi ngoài cửa sổ hiệu lực bị 404; note quá dài bị 400.
- **Regression test gợi ý:** Service test với trang hết hạn/chưa bắt đầu; DTO test note > giới hạn.

### [ ] R-006 — SEC-029 — Mobile: xóa đoạn đọc OTP từ response trong forgot_password_screen.dart

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Xóa đoạn đọc `res["otp"]` (trong `kDebugMode`) vì backend không còn trả OTP.
- **File:** `mobile/lib/screens/auth/forgot_password_screen.dart`
- **Dependencies:** —
- **Acceptance criteria:** Không còn mã hiển thị/đọc OTP từ API ở mobile; `flutter analyze` 0 issue; `flutter test` pass.
- **Regression test gợi ý:** Widget test: màn hình không hiển thị OTP dù mock API trả `otp`.

### [ ] R-008 — SEC-027 — Xác nhận nginx.conf (nginx -t, kiểm tra header) và sửa location ảnh che mất /api/uploads

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Misconfiguration
- **Cần làm:** Chạy `nginx -t` trong image/Docker; kiểm tra header thực tế bằng curl ở staging. Sửa vấn đề có từ trước: location regex ảnh (.png/.jpg...) có độ ưu tiên cao hơn prefix `/api/`, nên ảnh dạng `/api/uploads/x.jpg` không được proxy tới backend.
- **File:** `frontend/nginx.conf`
- **Dependencies:** —
- **Acceptance criteria:** `nginx -t` OK; các header CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy xuất hiện ở cả location tĩnh lẫn `/`, `/api/`, `/socket.io/`; ảnh `/api/uploads/*` được proxy đúng.
- **Regression test gợi ý:** curl -I vào vài đường dẫn; test tự động bằng container nginx trong CI nếu có thể.

### [ ] R-010 — SEC-084 — Ẩn ô nhập mã đặc cách trả hàng ở storefront OrderDetail.vue

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Ẩn ô nhập khi người dùng không phải admin/staff (hoặc bỏ hẳn ở storefront).
- **File:** `frontend/src/pages/customer/OrderDetail.vue`
- **Dependencies:** —
- **Acceptance criteria:** Khách không còn thấy/gửi returnOverrideToken.
- **Regression test gợi ý:** Vitest: khách không thấy ô nhập mã đặc cách.

### [ ] R-011 — SEC-080 — Phần còn lại lộ dữ liệu công khai: OptionalJwtAuthGuard, giỏ hàng lộ wholesalePrice, categories ẩn

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** 1) optional-jwt.guard.ts: ném 401 khi request có token nhưng token không hợp lệ/hết hạn (frontend sẽ tự refresh). 2) cart.service.ts: populate với select loại wholesalePrice/costPrice. 3) categories: lọc hidden cho khách ở getById/getBySlug. 4) Xác nhận chính sách OUT_OF_STOCK và quyền xem giá sỉ của STAFF (quyết định nghiệp vụ).
- **File:** `backend/src/common/guards/optional-jwt.guard.ts`, `backend/src/modules/cart/cart.service.ts`, `backend/src/modules/categories/categories.controller.ts`, `backend/src/modules/categories/categories.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Admin hết hạn token nhận 401 rồi tự refresh; giỏ hàng không có giá sỉ; khách không xem được danh mục ẩn bằng id/slug.
- **Regression test gợi ý:** Unit guard: token hết hạn ném 401; cart: response không chứa wholesalePrice; categories: khách nhận 404 với danh mục ẩn.

### [ ] R-012 — SEC-081 — Escape HTML trong email "có hàng trở lại" của products.service.ts

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Import escapeHtml từ email.service và áp dụng cho product.name (và mọi giá trị khác) trong template.
- **File:** `backend/src/modules/products/products.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Email không chứa thẻ HTML thô từ dữ liệu sản phẩm.
- **Regression test gợi ý:** Unit: tên sản phẩm chứa <script> hoặc <a href> bị escape trong HTML email.

### [ ] R-013 — SEC-082 — Biên lợi nhuận POS: tính chiết khấu cấp đơn và conversionRatio cho costPrice

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Chốt chính sách (tính biên trên giá sau chiết khấu phân bổ); nhân costPrice với conversionRatio; thêm test cho cả hai trường hợp.
- **File:** `backend/src/modules/pos/pos.service.ts`, `backend/src/modules/pricing/pricing.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Biên được tính đúng trong cả hai trường hợp và đơn dưới sàn bị yêu cầu phê duyệt.
- **Regression test gợi ý:** Unit pricing: biên sau chiết khấu cấp đơn; costPrice theo conversionRatio.

### [ ] R-014 — SEC-083 — Promotions: kiểm tra chéo giá trị và đồng bộ tên trường frontend/DTO

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Thêm validator PERCENT <= 100 và endDate >= startDate (kể cả cập nhật một phần so với giá trị hiện có, ở service); đồng bộ tên trường giữa frontend và DTO sau khi xác nhận bằng test.
- **File:** `backend/src/modules/promotions/dto/promotion.dto.ts`, `backend/src/modules/promotions/promotions.service.ts`, `frontend/src/pages/admin/Promotions.vue`
- **Dependencies:** —
- **Acceptance criteria:** Giá trị vô lý bị từ chối; tạo mã từ form admin thành công với maxDiscount/perUserLimit.
- **Regression test gợi ý:** DTO/service: PERCENT=150 và endDate<startDate trả 400; Vitest cho payload form.

### [ ] R-015 — SEC-006 — POS: đưa bộ đếm sai phê duyệt sang Redis và so sánh approvalToken constant-time

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Medium / Confirmed Vulnerability
- **Cần làm:** Bộ đếm `approvalFailures` đang in-memory theo từng tiến trình nên chạy nhiều instance sẽ nới giới hạn. Chuyển sang Redis (dùng lại kho throttler). Đồng thời xử lý secret dự phòng `pos-override-secret` và so sánh chuỗi không constant-time của approvalToken (liên quan SEC-049).
- **File:** `backend/src/modules/pos/pos.service.ts`, `backend/src/modules/pos/pos.security.spec.ts`
- **Dependencies:** SEC-049 (secret dự phòng)
- **Acceptance criteria:** Khóa 15 phút sau 5 lần sai hiệu lực giữa nhiều instance; approvalToken so sánh bằng timingSafeEqual; không còn secret hardcode.
- **Regression test gợi ý:** Unit với kho Redis giả; unit timingSafeEqual.

### [ ] R-021 — SEC-022 — Đảm bảo production luôn chạy MongoDB replica set (transaction) và cảnh báo khi không có

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** SEC-009, 022 và các luồng checkout dựa vào transaction MongoDB; nhánh không có session chỉ re-check, không atomic (liên quan SEC-063). Kiểm tra môi trường production (Atlas là replica set), thêm kiểm tra/cảnh báo khi khởi động nếu không phải replica set.
- **File:** `backend/src/config/env.validation.ts`, `backend/src/app.module.ts`, `backend/src/modules/orders/services/checkout.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Production fail-fast hoặc cảnh báo rõ ràng khi không có replica set.
- **Regression test gợi ý:** Unit cho hàm kiểm tra cấu hình.

### [ ] R-022 — SEC-020 — Checklist triển khai: FRONTEND_URL phải liệt kê đủ origin cho CORS và WebSocket

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Kiểm tra biến `FRONTEND_URL` ở production gồm cả origin có và không có `www` (CORS HTTP và kiểm tra Origin của WebSocket cùng dùng danh sách này).
- **File:** `(biến môi trường production)`, `backend/src/modules/notifications/notifications.gateway.ts`
- **Dependencies:** —
- **Acceptance criteria:** Socket.IO kết nối được từ mọi origin hợp lệ của frontend; origin lạ bị ngắt.
- **Regression test gợi ý:** Kiểm tra thủ công ở staging.

### [ ] R-026 — SEC-078 — Sửa filter lỗi: 413 cho body quá lớn, CORS bị từ chối không trả 500, che stack theo cờ production/cloud

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Misconfiguration
- **Cần làm:** 1) Map PayloadTooLargeError/entity.too.large sang 413. 2) Dùng cùng cờ isProduction (gồm cloud) ở filter và main.ts, mặc định che stack. 3) Với CORS bị từ chối: trả 403 gọn. LƯU Ý: verifier của finding login CSRF (đã bác bỏ) chỉ ra rằng việc CORS callback ném lỗi hiện đang chặn ở phía server các form POST cross-site tới /api/auth/login; nếu đổi sang callback(null,false) phải bổ sung kiểm tra Origin tường minh cho endpoint tạo phiên (login/register/refresh).
- **File:** `backend/src/main.ts`, `backend/src/common/filters/http-exception.filter.ts`
- **Dependencies:** —
- **Acceptance criteria:** Body > 1MB trả 413. Origin lạ không còn trả 500. Không response nào chứa details.stack ngoài môi trường dev cục bộ.
- **Regression test gợi ý:** Unit cho filter: PayloadTooLargeError trả 413 không có stack; NODE_ENV khác production vẫn không trả stack khi cờ cloud bật. E2E: Origin lạ trả 403/blocked, không 500.

### [ ] R-030 — SEC-002 — Dọn dữ liệu đánh giá cũ chứa URL ảnh không an toàn trong DB

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** High / Confirmed Vulnerability
- **Cần làm:** Admin đã lọc URL khi hiển thị nhưng dữ liệu cũ trong DB vẫn có thể chứa `javascript:`/`data:`. Viết script migration một lần (chạy có dry-run) loại các URL không phải http/https khỏi `reviews.images`; kiểm tra storefront khách nếu có hiển thị ảnh review.
- **File:** `backend/src/migrations/* (mới)`, `backend/src/modules/reviews/schemas/review.schema.ts`
- **Dependencies:** —
- **Acceptance criteria:** Không còn review nào có ảnh không phải http/https; script có dry-run và log số bản ghi.
- **Regression test gợi ý:** Unit cho hàm lọc URL của script.

### [ ] R-034 — SEC-037 — Khắc phục: Guest order access token lưu vĩnh viễn trong localStorage

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Chuyển sang sessionStorage, hoặc lưu kèm `expiresAt` và xóa khi đơn ở trạng thái cuối hoặc sau N ngày. Backend nên đặt TTL cho guest token (vd. 30 ngày, hoặc đến khi đơn hoàn tất) và yêu cầu xác minh thêm (SĐT hoặc OTP) cho thao tác hủy. Cân nhắc dùng cookie HttpOnly theo path `/api/orders/guest` thay cho localStorage.
- **File:** `frontend/src/pages/customer/Checkout.vue`, `frontend/src/pages/customer/OrderDetail.vue`, `backend/src/modules/orders (guest token TTL)`
- **Dependencies:** —
- **Acceptance criteria:** Token khách có hạn sống, bị xóa khỏi storage khi hết hạn hoặc đơn kết thúc. Thao tác hủy có thêm bước xác minh, nếu nghiệp vụ duyệt.
- **Regression test gợi ý:** Vitest cho Checkout và OrderDetail: token lưu kèm expiry, token hết hạn bị bỏ qua và xóa. Backend e2e: guest token hết hạn thì trả 401/403.

### [ ] R-039 — SEC-043 — Khắc phục: Header X-Client-Platform: mobile biến phiên cookie HttpOnly thành token đọc được trong response

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Trả token trong body CHỈ KHI refresh token được gửi qua body (đặc trưng của client native). Nếu refresh token đến từ cookie thì luôn đặt cookie và không bao giờ trả token trong body, bất kể header. Với login và register, có thể giữ hành vi theo header vì cần mật khẩu. Song song, bỏ `'unsafe-inline'` khỏi script-src (dùng hash hoặc nonce).
- **File:** `backend/src/modules/auth/auth.controller.ts`, `backend/src/modules/auth/auth.controller.spec.ts`, `frontend/vercel.json`
- **Dependencies:** —
- **Acceptance criteria:** POST /auth/refresh dùng refresh cookie và có header mobile thì response không chứa accessToken hoặc refreshToken.
- **Regression test gợi ý:** auth.controller.spec: refresh với cookie refresh_token + header mobile thì body không có token và cookie được set. Refresh với body refreshToken + header mobile thì body có token.

### [ ] R-040 — SEC-045 — Khắc phục: Mỗi user chỉ lưu một refreshTokenHash, đăng nhập thiết bị thứ hai hoặc refresh song song làm hỏng phiên

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Lưu phiên theo thiết bị: collection `sessions` hoặc mảng `{sessionId, refreshHash, familyId, expiresAt, userAgent}`. Reuse-detection chỉ thu hồi family tương ứng. Cho phép grace window ngắn (khoảng 30 giây) cho token vừa xoay vòng để xử lý race nhiều tab. Cập nhật bằng `findOneAndUpdate` có điều kiện hash cũ (compare-and-swap).
- **File:** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/users/schemas/user.schema.ts`
- **Dependencies:** —
- **Acceptance criteria:** Đăng nhập web rồi đăng nhập mobile, sau đó web refresh vẫn thành công. Dùng lại đúng refresh token đã xoay vòng chỉ thu hồi family của nó.
- **Regression test gợi ý:** auth.service.spec: hai phiên song song refresh độc lập. Replay token cũ ngoài grace window chỉ thu hồi family đó.

### [ ] R-041 — SEC-046 — Khắc phục: Lộ sự tồn tại tài khoản qua thông báo đăng ký, thông báo khóa và chênh lệch thời gian

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Login: luôn chạy `bcrypt.compare` (với hash giả khi user không tồn tại). Chỉ báo "đã bị khóa" SAU khi mật khẩu đúng, còn lại dùng một thông điệp chung. Register: cân nhắc phản hồi chung ("Nếu email hợp lệ, vui lòng kiểm tra hộp thư") kèm xác minh email, hoặc chấp nhận rủi ro và giữ throttle chặt (quyết định UX).
- **File:** `backend/src/modules/auth/auth.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Login sai mật khẩu với tài khoản bị khóa trả cùng thông điệp và thời gian xấp xỉ như email không tồn tại.
- **Regression test gợi ý:** auth.service.spec: user không tồn tại vẫn gọi bcrypt.compare. User bị khóa + sai mật khẩu nhận thông điệp chung.

### [ ] R-042 — SEC-047 — Khắc phục: Blacklist token fail-open khi Redis lỗi; trạng thái thu hồi nằm trong bộ nhớ từng instance

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Trong production, khi Redis không sẵn sàng thì fail-closed cho request mang token (trả 503 hoặc 401), hoặc ít nhất tăng một `sessionVersion` per-session khi logout. Thêm cảnh báo hoặc metric khi Redis mất kết nối.
- **File:** `backend/src/modules/auth/token-blacklist.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Token đã logout bị từ chối ở mọi instance, kể cả khi Redis lỗi (theo chính sách đã chọn).
- **Regression test gợi ý:** token-blacklist.service.spec: Redis ném lỗi thì hành vi theo chính sách fail-closed.

### [ ] R-043 — SEC-048 — Khắc phục: Môi trường không phải production bỏ qua kiểm tra secret; danh sách chặn secret yếu chỉ so khớp chính xác

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Misconfiguration
- **Cần làm:** Bỏ cơ chế suy ra secret (bắt buộc 3 secret riêng ở mọi môi trường trừ test). Thêm kiểm tra entropy tối thiểu (ví dụ ≥128 bit, base64 hoặc hex). docker-compose: mặc định `NODE_ENV=production` cho image triển khai, bind `127.0.0.1:3000:3000`. Thêm `OTP_PEPPER` vào schema env và bắt buộc ở production.
- **File:** `backend/src/config/env.validation.ts`, `docker-compose.yml`, `backend/.env.example`, `backend/src/config/env.validation.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** Ứng dụng không khởi động nếu thiếu JWT_REFRESH_SECRET hoặc JWT_RESET_SECRET ở môi trường khác test.
- **Regression test gợi ý:** env.validation.spec: thiếu refresh secret ở development thì throw.

### [ ] R-051 — SEC-057 — Khắc phục: IPN báo thanh toán thành công cho đơn đã HỦY không tạo yêu cầu hoàn tiền

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Trong handleCallback, đọc order (trong session) trước khi cập nhật. Nếu orderStatus thuộc CANCELLED/RETURNED và result.success thì set refundStatus=MANUAL_REQUIRED, refundAmount=payment.amount, ghi timeline, không recognize revenue. Ngoài ra khi hủy đơn online còn phiên PENDING thì nên đánh dấu payment FAILED/CANCELLED.
- **File:** `backend/src/modules/payments/payments.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** IPN thành công cho đơn CANCELLED thì order.refundStatus=MANUAL_REQUIRED và refundAmount=amount.
- **Regression test gợi ý:** payment-order-safety.spec.ts: order CANCELLED, payment chưa hết hạn, IPN success thì kỳ vọng refundStatus MANUAL_REQUIRED.

### [ ] R-054 — SEC-060 — Khắc phục: Trả hàng NCC: kiểm tra số lượng còn được trả nằm ngoài transaction

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Lưu `returnedBaseQuantity` trên từng dòng GRN và cập nhật bằng findOneAndUpdate có điều kiện `items.$.returnedBaseQuantity + qty <= baseQuantity` trong cùng session, hoặc đọc GRN và previousReturns trong session kèm ghi 'touch' GRN để tạo write conflict.
- **File:** `backend/src/modules/purchasing/purchase-returns.service.ts`, `backend/src/modules/purchasing/schemas/goods-receipt.schema.ts`
- **Dependencies:** —
- **Acceptance criteria:** Hai request song song, mỗi request trả toàn bộ số đã nhận: chỉ 1 thành công.
- **Regression test gợi ý:** Test tích hợp với mongodb-memory-server replica set: Promise.all 2 createReturn thì kỳ vọng 1 lỗi.

### [ ] R-055 — SEC-061 — Khắc phục: Combo landing page bán với quantity=1: khách trả giá combo nhiều cuốn nhưng kho chỉ trừ 1

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Thêm `quantity` (Min 1) vào PackageItem và DTO. submitOrder dùng `quantity: pkg.quantity` và `price: pkg.price / pkg.quantity`, hoặc lưu giá gói làm line total.
- **File:** `backend/src/modules/landing-pages/schemas/landing-page.schema.ts`, `backend/src/modules/landing-pages/dto/landing-page.dto.ts`, `backend/src/modules/landing-pages/landing-page.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Đặt gói 3 cuốn thì kho trừ 3 và order.items[0].quantity=3.
- **Regression test gợi ý:** landing-page.service.spec.ts: gói quantity=3 thì createOrderDto.items[0].quantity===3.

### [ ] R-056 — SEC-062 — Khắc phục: Đối soát COD không xử lý đơn COMPLETED; COD đánh dấu PAID ngay khi DELIVERED

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Chấp nhận `$in: [DELIVERED, COMPLETED]` ở cả 2 hàm. Về nghiệp vụ: cân nhắc giữ paymentStatus=UNPAID/PENDING_COLLECTION cho COD tới khi đối soát, hoặc tách 'revenueRecognized' khỏi 'cashCollected'.
- **File:** `backend/src/modules/finance/services/cod-reconciliation.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Bảng kê chứa trackingCode của đơn COMPLETED thì được RECONCILED.
- **Regression test gợi ý:** cod-reconciliation.service.spec.ts: order COMPLETED, codAmount khớp thì matchedOrdersCount=1.

### [ ] R-060 — SEC-066 — Khắc phục: Lộ thông báo lỗi bên thứ ba (Cloudinary) và 500 khi ObjectId không hợp lệ ở route công khai

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Misconfiguration
- **Cần làm:** Log lỗi Cloudinary ở server, trả message chung. Dùng IsMongoObjectId hoặc ParseObjectIdPipe cho :productId, :id. Map BSONError sang 400 trong filter.
- **File:** `backend/src/modules/users/cloudinary.service.ts`, `backend/src/modules/reviews/reviews.controller.ts`, `backend/src/common/filters/http-exception.filter.ts`
- **Dependencies:** —
- **Acceptance criteria:** GET /reviews/product/abc trả 400. Lỗi upload trả message chung.
- **Regression test gợi ý:** Jest filter: BSONError được map sang 400.

### [ ] R-063 — SEC-069 — Khắc phục: Nhân viên chỉ có MANAGE_PRODUCTS tạo được phiếu trả hàng NCC (trừ kho, bù trừ công nợ)

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Confirmed Vulnerability
- **Cần làm:** 1) Bỏ MANAGE_PRODUCTS khỏi @Permissions của POST /purchasing/returns (chỉ MANAGE_INVENTORY). 2) Trong controller, nếu `dto.applyCreditAdjustmentImmediately === true` mà actor không phải ADMIN/SUPER_ADMIN và không có MANAGE_FINANCE thì trả 403, hoặc bỏ qua cờ và để PENDING. 3) Truyền actor (role, permissions) xuống service để kiểm tra lại. 4) Cập nhật route-coverage hoặc test RBAC.
- **File:** `backend/src/modules/purchasing/purchase-returns.controller.ts`, `backend/src/modules/purchasing/purchase-returns.service.ts`, `backend/src/modules/purchasing/purchase-returns.service.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** STAFF chỉ có MANAGE_PRODUCTS gọi POST /purchasing/returns nhận 403. STAFF có MANAGE_INVENTORY nhưng không có MANAGE_FINANCE gửi applyCreditAdjustmentImmediately=true thì nhận 403, hoặc phiếu vẫn ở creditAdjustmentStatus PENDING và payable không đổi.
- **Regression test gợi ý:** Test controller/guard: STAFF[MANAGE_PRODUCTS] gọi create thì Forbidden. STAFF[MANAGE_INVENTORY] với cờ immediate=true thì applyPurchaseReturnCredit không được gọi. ADMIN thì được gọi.

### [ ] R-064 — SEC-070 — Khắc phục: Kiểm kê kho: cờ requiresApproval không được thực thi, người nộp tự duyệt

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** 1) Trong approve(), nếu `audit.requiresApproval` thì actor phải là ADMIN/SUPER_ADMIN (hoặc có permission mới, ví dụ APPROVE_INVENTORY_ADJUSTMENT, cần chốt nghiệp vụ). 2) Từ chối khi `audit.submittedBy?.equals(userId)` hoặc `audit.createdBy?.equals(userId)`. 3) Truyền actor (role, permissions) từ controller vào service.
- **File:** `backend/src/modules/stock-audits/stock-audits.service.ts`, `backend/src/modules/stock-audits/stock-audits.controller.ts`, `backend/src/common/enums/index.ts`, `backend/src/modules/stock-audits/stock-audits.service.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** Audit có requiresApproval=true: STAFF không có quyền duyệt nhận 403. Người submit tự approve nhận 403. ADMIN approve thành công.
- **Regression test gợi ý:** stock-audits.service.spec: approve với requiresApproval=true và actor STAFF thì Forbidden. approve với userId === submittedBy thì Forbidden. Actor ADMIN thì adjustStock được gọi.

### [ ] R-067 — SEC-073 — Khắc phục: Phân quyền entity trong data-exchange lệch với module gốc (MANAGE_PRODUCTS ghi đè dữ liệu suppliers)

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Confirmed Vulnerability
- **Cần làm:** 1) suppliers: chỉ MANAGE_INVENTORY (đồng bộ với SuppliersController). 2) products import: bỏ cột stock/costPrice, hoặc yêu cầu thêm MANAGE_INVENTORY khi file có stock > 0. 3) opening_stock và allowReimport: chỉ ADMIN, hoặc chặn khi sản phẩm đã có giao dịch kho.
- **File:** `backend/src/modules/data-exchange/data-exchange.controller.ts`, `backend/src/modules/data-exchange/data-exchange.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** STAFF[MANAGE_PRODUCTS] gọi preview/execute với type=suppliers nhận 403. Import products bởi STAFF không có MANAGE_INVENTORY thì không tạo IMPORT transaction có costPrice.
- **Regression test gợi ý:** data-exchange.controller spec: checkEntityPermission(user{perms:[MANAGE_PRODUCTS]}, 'suppliers') phải throw ForbiddenException.

### [ ] R-068 — SEC-074 — Khắc phục: Máy trạng thái chứng từ điện tử không chặt: xóa được file đính kèm của chứng từ đã REVERSED/đã chốt

- **Priority:** P2  |  **Status:** OPEN
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** removeAttachment và cancelDocument chỉ cho phép khi `doc.status === DocumentStatus.DRAFT`. Bọc reverseDocument trong MongoDB session như các module finance/warehouses.
- **File:** `backend/src/modules/documents/documents.service.ts`, `backend/src/modules/documents/documents.service.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** DELETE attachments và PATCH cancel trên chứng từ REVERSED/CANCELLED trả 400. Reverse lỗi giữa chừng thì không để lại chứng từ gốc ở trạng thái REVERSED.
- **Regression test gợi ý:** documents.service.spec: removeAttachment trên doc REVERSED thì BadRequest. cancelDocument trên doc REVERSED thì BadRequest.

### [ ] R-069 — SEC-075 — Khắc phục: STAFF có MANAGE_ORDERS tạo được công nợ phải thu tùy ý, không đối chiếu đơn hàng

- **Priority:** P2  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Chỉ cho MANAGE_FINANCE tạo receivable thủ công. Nếu có orderId hoặc posOrderId thì kiểm tra tồn tại, đúng customer, và lấy totalAmount từ đơn (không tin client). Bỏ creditLimit khỏi DTO receivable vì đã quản lý ở credit-profiles.
- **File:** `backend/src/modules/finance/finance.controller.ts`, `backend/src/modules/finance/finance.service.ts`, `backend/src/modules/finance/dto/finance.dto.ts`
- **Dependencies:** —
- **Acceptance criteria:** STAFF[MANAGE_ORDERS] gọi POST /finance/receivables nhận 403, hoặc chỉ tạo được khi orderId hợp lệ và số tiền lấy từ đơn.
- **Regression test gợi ý:** finance.service.spec: createReceivable với orderId không tồn tại thì NotFound. totalAmount khác order.finalAmount thì BadRequest.

### [ ] R-009 — SEC-005 — Dùng verifyTokenForRevocation cho refreshToken() và changePassword()

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Medium / Confirmed Vulnerability
- **Cần làm:** Hai chỗ này vẫn ghi blacklist `rawAccessToken` bằng `decode()` (rủi ro thấp vì đã qua guard). Dùng chung helper `verifyTokenForRevocation` cho nhất quán.
- **File:** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/auth/auth.service.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** Không còn chỗ nào ghi blacklist từ payload chưa xác thực chữ ký.
- **Regression test gợi ý:** Unit: token giả không được ghi blacklist ở refresh và changePassword.

### [ ] R-016 — SEC-009 — Finance: xử lý trường hợp chạy không có replica set (session=null)

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Medium / Confirmed Vulnerability
- **Cần làm:** Khi chạy không có replica set (chỉ dev) mà update bị từ chối, phiếu thu/chi đã tạo không được hoàn tác. Cân nhắc fail-fast hoặc từ chối thao tác thanh toán công nợ khi không có session (ngoài môi trường test).
- **File:** `backend/src/modules/finance/finance.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Không thể tạo phiếu thu/chi mồ côi khi update công nợ bị từ chối, ở mọi môi trường.
- **Regression test gợi ý:** Unit: session=null và update bị từ chối thì phiếu bị hoàn tác hoặc thao tác bị từ chối trước khi tạo phiếu.

### [ ] R-017 — SEC-025 — Import Excel: chặn zip bomb (kích thước giải nén, đọc theo luồng)

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Medium / Potential Risk
- **Cần làm:** exceljs vẫn nạp toàn bộ workbook trước khi kiểm tra rowCount và chưa kiểm tra kích thước sau giải nén. Thêm kiểm tra kích thước giải nén hoặc đọc theo luồng (streaming reader) với trần dòng.
- **File:** `backend/src/modules/products/products.service.ts`, `backend/src/modules/data-exchange/data-exchange.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** File zip nén cực cao bị từ chối trước khi tốn bộ nhớ lớn.
- **Regression test gợi ý:** Unit với workbook giả lập nén cao.

### [ ] R-018 — SEC-028 — Tăng bcrypt cost (đề xuất 12) và rà giới hạn body với avatar data URL

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** bcrypt cost đang là 10: đo độ trễ đăng nhập rồi nâng lên 12 (hash cũ vẫn xác thực được, rehash khi đăng nhập). `main.ts` giới hạn JSON body 1mb nên giới hạn data URL 3M ký tự trong DTO chỉ là dự phòng; thống nhất con số.
- **File:** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/users/users.service.ts`, `backend/src/main.ts`, `backend/src/modules/auth/dto/auth.dto.ts`
- **Dependencies:** —
- **Acceptance criteria:** Hash mới dùng cost 12; avatar vượt giới hạn body trả lỗi rõ ràng.
- **Regression test gợi ý:** Unit rehash khi đăng nhập; test DTO avatar theo giới hạn thống nhất.

### [ ] R-019 — SEC-017 — Customers: trả 404 khi không tìm thấy và xử lý id sai định dạng không gây 500

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Confirmed Vulnerability
- **Cần làm:** Controller `GET /customers/:id` đang trả 200 với body rỗng khi `findById` trả null; `updateCRMProfile` với id sai định dạng ném BSONError dẫn tới 500. Trả 404 và 400 tương ứng.
- **File:** `backend/src/modules/customers/customers.controller.ts`, `backend/src/modules/customers/customers.service.ts`, `backend/src/modules/customers/customers.service.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** Id không tồn tại hoặc không phải khách trả 404; id sai định dạng trả 400.
- **Regression test gợi ý:** Controller/service test cho hai trường hợp.

### [ ] R-020 — SEC-012 — Chuyển Combos.vue sang tải phân trang rồi hạ trần limit xuống 100

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Medium / Confirmed Vulnerability
- **Cần làm:** Admin `Combos.vue` đang gọi `limit=1000` nên `PaginationDto.limit` có trần 1000. Chuyển sang phân trang/tìm kiếm rồi hạ `@Max` xuống 100.
- **File:** `frontend/src/pages/admin/Combos.vue`, `backend/src/common/dto/pagination.dto.ts`
- **Dependencies:** —
- **Acceptance criteria:** Không còn request limit > 100; test DTO cập nhật.
- **Regression test gợi ý:** Vitest cho Combos.vue; DTO test limit=101 bị từ chối.

### [ ] R-023 — — — Đồng bộ tài liệu dự án với thực tế

- **Priority:** P3  |  **Status:** OPEN
- **Cần làm:** Cập nhật `docs/PROJECT_OVERVIEW.md` (mục RBAC lệch code, số liệu test mục 11.2: backend 90 suites / 1183 test, frontend 37 files / 254 test) và `AGENTS.md` (ngưỡng lint backend ghi 1950 nhưng `backend/package.json` dùng 2650).
- **File:** `docs/PROJECT_OVERVIEW.md`, `AGENTS.md`
- **Dependencies:** —
- **Acceptance criteria:** Tài liệu khớp code và số liệu hiện tại.
- **Regression test gợi ý:** Không áp dụng.

### [ ] R-027 — SEC-079 — Không trả tokenVersion trong response người dùng

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Dùng allowlist trường trả về hoặc loại tokenVersion trong sanitizeUser ở AuthService và UsersService; kiểm tra frontend/mobile không đọc trường này.
- **File:** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/users/users.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Không response người dùng nào chứa tokenVersion.
- **Regression test gợi ý:** Unit: sanitizeUser không chứa tokenVersion, password, refreshTokenHash, resetOtp*.

### [ ] R-028 — SEC-014 — Gom escapeRegex thành util dùng chung

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Confirmed Vulnerability
- **Cần làm:** Repo không có helper dùng chung nên mỗi service (finance, customers, data-exchange) có bản `escapeRegex` riêng. Tạo util trong `backend/src/common/` và thay các bản riêng, kèm lint rule hoặc test chặn `new RegExp(` với input người dùng không qua helper.
- **File:** `backend/src/common/utils/*`, `backend/src/modules/finance/finance.service.ts`, `backend/src/modules/customers/customers.service.ts`, `backend/src/modules/data-exchange/data-exchange.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Một helper duy nhất; test hiện có vẫn pass.
- **Regression test gợi ý:** Giữ test SEC-014 hiện có, thêm test cho util.

### [ ] R-029 — SEC-019 — Thay nhánh dự phòng không nguyên tử của reserveOtpAttempt bằng UsersService.reserveOtpAttempt

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Potential Risk
- **Cần làm:** Hiện `reserveOtpAttempt` dùng `user.constructor` làm Mongoose Model và có nhánh dự phòng không nguyên tử cho mock. Thêm `UsersService.reserveOtpAttempt` (findOneAndUpdate có điều kiện) rồi bỏ nhánh dự phòng; cập nhật `token-isolation.spec.ts` mock.
- **File:** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/users/users.service.ts`, `backend/src/modules/auth/token-isolation.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** Không còn nhánh không nguyên tử; test song song OTP vẫn chỉ cho 5 lần so khớp.
- **Regression test gợi ý:** Giữ test SEC-019 hiện có.

### [ ] R-032 — SEC-035 — Khắc phục: Seed-safety coi host localhost/mongodb là an toàn: stack docker-compose tự host có thể bị xóa DB demo

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** 1) clearDatabase(): luôn từ chối khi NODE_ENV==='production' hoặc khi cờ isCloudHosted bật, và yêu cầu thêm `SEED_CONFIRM_DB_NAME` khớp đúng tên DB, hoặc cờ CLI `--confirm=<dbName>`. 2) Bỏ 'mongodb' khỏi LOCAL_HOSTS, hoặc chỉ chấp nhận khi có cờ rõ ràng như `SEED_ALLOW_DOCKER_HOST=true`. 3) Bỏ hẳn fallback mật khẩu công khai: không có SEED_*_PASSWORD thì sinh mật khẩu ngẫu nhiên (crypto.randomBytes) và chỉ in ra console một lần, hoặc bắt buộc đặt biến. 4) docker-compose: đổi NODE_ENV mặc định thành production cho stack deploy, tách compose dev riêng. 5) Thêm test: URI host `mongodb` + NODE_ENV=production thì clearDatabase phải bị từ chối.
- **File:** `backend/src/seeds/seed-safety.ts`, `backend/src/seeds/seed.service.ts`, `backend/src/seeds/run-seed.ts`, `backend/src/seeds/seed.service.spec.ts`, `backend/src/seeds/seed-safety.spec.ts`, `docker-compose.yml`
- **Dependencies:** —
- **Acceptance criteria:** Không cách nào xóa DB khi NODE_ENV=production hoặc cloud. Không còn mật khẩu mặc định cố định trong source.
- **Regression test gợi ý:** seed.service.spec: URI `mongodb+srv://[ĐÃ CHE]` + NODE_ENV=production thì clearDatabase phải reject và deleteMany không được gọi. Không có SEED_* thì seed() không bao giờ dùng 'SuperAdmin@123456'.

### [ ] R-033 — SEC-036 — Khắc phục: Deny-by-default và route-coverage.spec chỉ bảo vệ route đã gắn PermissionsGuard/RolesGuard

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Mở rộng route-coverage.spec thành snapshot hoặc allowlist tường minh: mọi route phải thuộc một trong ba nhóm {PUBLIC_ALLOWLIST, AUTH_ANY_ALLOWLIST, có Permissions/Roles}. Route mới không thuộc nhóm nào làm test fail, buộc người viết review quyền. Về lâu dài cân nhắc JwtAuthGuard toàn cục + decorator @Public(). Đây là thay đổi kiến trúc, cần duyệt theo AGENTS.md 3.2. Xóa nhánh STAFF trong orders.service.findById(userRole) và check thừa ở orders.controller getInvoice.
- **File:** `backend/src/common/guards/route-coverage.spec.ts`, `backend/src/modules/orders/orders.service.ts`, `backend/src/modules/orders/orders.controller.ts`
- **Dependencies:** —
- **Acceptance criteria:** CI fail khi có route mới mà chưa được phân loại quyền tường minh.
- **Regression test gợi ý:** route-coverage.spec: route mới không nằm trong allowlist và không có Permissions/Roles thì fail.

### [ ] R-035 — SEC-038 — Khắc phục: Hồ sơ người dùng (PII, role, permissions) lưu plaintext ở localStorage/SharedPreferences; Android không tắt allowBackup

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Chỉ cache các trường tối thiểu cho UI (`_id`, `fullName`, `role`, `avatar`) hoặc dùng sessionStorage. Luôn hydrate từ `/auth/me` trước khi render khu vực admin. Lên kế hoạch gỡ decodeLegacyStorage và OBFUSCATION_KEY sau một số release.
- **File:** `frontend/src/stores/auth.ts`, `frontend/src/utils/helpers.ts`, `mobile/android/app/src/main/AndroidManifest.xml`, `mobile/lib/providers/auth_provider.dart`
- **Dependencies:** —
- **Acceptance criteria:** localStorage['user'] không còn chứa email/phone/permissions, hoặc bị xóa khi phiên kết thúc.
- **Regression test gợi ý:** Vitest auth store: sau login, giá trị lưu chỉ có các trường được phép. clearSession xóa key.

### [ ] R-036 — SEC-039 — Khắc phục: Socket.IO fallback về http://localhost:3000 khi build production thiếu VITE_SOCKET_URL

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Khi `import.meta.env.PROD`, fallback về same-origin (`io('/notifications', { path: '/socket.io' })`). Hoặc fail rõ ràng khi thiếu VITE_SOCKET_URL. Thêm VITE_SOCKET_URL (wss://...) vào cấu hình build Vercel và Docker ARG.
- **File:** `frontend/src/App.vue`, `frontend/Dockerfile`
- **Dependencies:** —
- **Acceptance criteria:** Bundle production không chứa 'localhost:3000'. Socket kết nối same-origin hoặc tới URL cấu hình.
- **Regression test gợi ý:** Vitest cho App.vue với env PROD: io được gọi với URL same-origin. CI: grep dist không có 'localhost:3000'.

### [ ] R-037 — SEC-040 — Khắc phục: Gửi URL đơn hàng và thông tin chuyển khoản tới dịch vụ bên thứ ba qua thẻ img (QR)

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Sinh QR phía client bằng thư viện QR có sẵn (cần hỏi trước khi thêm thư viện theo AGENTS.md), hoặc sinh ở backend. Giữ VietQR nếu nghiệp vụ chấp nhận và ghi vào chính sách quyền riêng tư.
- **File:** `frontend/src/pages/customer/OrderDetail.vue`
- **Dependencies:** —
- **Acceptance criteria:** Không còn request tới api.qrserver.com.
- **Regression test gợi ý:** Vitest: OrderDetail render không có img src chứa 'qrserver.com'.

### [ ] R-038 — SEC-041 — Khắc phục: Vite alias ép dùng bản Vue đầy đủ có runtime template compiler

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Bỏ alias trong build production, chỉ giữ cho Vitest (`test.alias` trong vitest config) nếu stub cần.
- **File:** `frontend/vite.config.ts`, `frontend/vitest.config.ts`
- **Dependencies:** —
- **Acceptance criteria:** Build production dùng runtime-only Vue. Test unit vẫn pass.
- **Regression test gợi ý:** Chạy `npm run test:unit` và `npm run build` sau khi tách alias.

### [ ] R-044 — SEC-049 — Khắc phục: Secret dự phòng hardcode (OTP pepper, POS approval token, guest token) và dùng lại JWT_SECRET

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Bắt buộc `OTP_PEPPER` riêng (thêm vào env.validation), bỏ chuỗi hardcode, xóa nhánh legacy SHA-256.
- **File:** `backend/src/modules/auth/auth.service.ts`, `backend/src/config/env.validation.ts`, `backend/src/modules/pos/pos.service.ts`, `backend/src/modules/pricing/pricing.service.ts`, `backend/src/modules/orders/services/checkout.service.ts`, `backend/.env.example`
- **Dependencies:** —
- **Acceptance criteria:** Không còn chuỗi secret trong source. Ứng dụng từ chối khởi động nếu thiếu OTP_PEPPER ở production.
- **Regression test gợi ý:** auth.service.spec: hash SHA-256 không pepper bị từ chối.

### [ ] R-045 — SEC-050 — Khắc phục: JWT chưa pin thuật toán, payload chứa email/permissions, user bị xóa nhận 404 thay vì 401

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Thêm `algorithms:['HS256']` vào strategy và mọi chỗ gọi verifyAsync, cùng `signOptions.algorithm:'HS256'`. Bỏ `email` và `permissions` khỏi payload. Trong strategy, bắt NotFound và ném UnauthorizedException.
- **File:** `backend/src/modules/auth/auth.module.ts`, `backend/src/modules/auth/strategies/jwt.strategy.ts`, `backend/src/modules/auth/auth.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Token ký HS512 hoặc none bị từ chối. User bị xóa nhận 401.
- **Regression test gợi ý:** jwt.strategy.spec: user bị xóa thì nhận UnauthorizedException.

### [ ] R-047 — SEC-052 — Khắc phục: Dependency production có advisory: sanitize-html, nodemailer và các gói gián tiếp (exceljs, @nestjs...)

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Nâng `sanitize-html` lên bản đã sửa mới nhất trong nhánh 2.x (>2.18.0, theo advisory GHSA-x3q4 thì sửa từ 2.18.0; npm audit gắn cờ cả `<=2.18.0` nên nên lấy bản mới nhất). Bản này không phải major. Kiểm tra lại override `htmlparser2: 10.0.0` có tương thích không. Chạy lại test của security.sanitizer. Cân nhắc thêm bước `npm audit --omit=dev --audit-level=moderate` riêng cho dependency production.
- **File:** `backend/package.json`, `backend/package-lock.json`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `backend/src/modules/products/dto/stock-alert.dto.ts`
- **Dependencies:** —
- **Acceptance criteria:** `npm audit --omit=dev` không còn cảnh báo sanitize-html hay deepmerge. Test sanitizer pass.
- **Regression test gợi ý:** Thêm case vào security.sanitizer spec: `<noscript><p><img src=x onerror=alert(1)></p></noscript>`, `<svg><animate attributeName=href values=javascript:alert(1)>`, `<meta http-equiv=refresh content="0;url=javascript:alert(1)">`, tất cả phải ra chuỗi rỗng hoặc text an toàn.

### [ ] R-048 — SEC-053 — Khắc phục: Dependency dev có nhiều lỗ hổng moderate; cổng supply chain CI còn mỏng (audit chỉ chặn từ high, thiếu Dependabot)

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Nâng vitest lên ^4.1.12 (không phải major). `npm update fast-uri` để lấy 3.1.9. Phần còn lại (minimatch/glob trong eslint/jest) chờ upstream; không hạ version.
- **File:** `frontend/package.json`, `frontend/package-lock.json`, `backend/package-lock.json`, `.github/dependabot.yml`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/workflows/docker-build.yml`
- **Dependencies:** —
- **Acceptance criteria:** npm audit frontend không còn cảnh báo vitest
- **Regression test gợi ý:** npm run test:unit pass

### [ ] R-049 — SEC-054 — Khắc phục: GitHub Actions pin theo tag (chưa pin SHA) và Docker base image không pin digest

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Pin theo `image:tag@sha256:<digest>` (ví dụ `node:22.x.y-alpine3.xx@sha256:...`) và để Dependabot ecosystem docker tự cập nhật. || Bổ sung từ finding GitHub Actions: Thêm `permissions: { contents: read }` ở cấp workflow cho ci, deploy, docker-build, release. Riêng create-release giữ `contents: write`. Pin mọi action theo commit SHA (giữ tag trong comment) và bật Dependabot cho `github-actions`. Pin `vercel@<exact>`. Ở release.yml chuyển sang `env: TAG: ${{ github.ref_name }}` rồi dùng `"$TAG"`.
- **File:** `backend/Dockerfile`, `frontend/Dockerfile`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/workflows/docker-build.yml`, `.github/workflows/release.yml`
- **Dependencies:** —
- **Acceptance criteria:** Mọi lệnh FROM đều có @sha256
- **Regression test gợi ý:** docker-build workflow pass

### [ ] R-050 — SEC-055 — Khắc phục: Log chứa PII và URL đầy đủ; IP lấy từ X-Forwarded-For mà client có thể giả mạo

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Bổ sung các key PII (phone, email, address, fullName, customerName, shippingAddress) vào danh sách mask, ví dụ mask một phần. Log `path` không kèm query. Chỉ log domain hoặc hash của email người nhận. Dùng `req.ip` sau khi cấu hình trust proxy đúng, thay vì header thô.
- **File:** `backend/src/common/logger/log-sanitizer.ts`, `backend/src/common/filters/http-exception.filter.ts`, `backend/src/modules/email/email.service.ts`, `backend/src/common/interceptors/logging.interceptor.ts`
- **Dependencies:** —
- **Acceptance criteria:** Log lỗi 5xx của POST /orders không chứa số điện thoại hay địa chỉ rõ
- **Regression test gợi ý:** Unit test sanitizeForLogging với phone/email/address

### [ ] R-057 — SEC-063 — Khắc phục: Checkout chuyển sang chế độ không transaction (compensated) cả trong production

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Khi NODE_ENV==='production', ném ServiceUnavailableException thay vì fallback, giống inventory/GRN. Health check nên kiểm tra replica set.
- **File:** `backend/src/modules/orders/services/checkout.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** NODE_ENV=production và lỗi transaction unsupported thì trả 503, không tạo đơn.
- **Regression test gợi ý:** checkout spec: giả lập lỗi 'Transaction numbers are only allowed' với NODE_ENV=production thì kỳ vọng ServiceUnavailableException.

### [ ] R-058 — SEC-064 — Khắc phục: Hoàn tiền đơn online không bao giờ hoàn tất; hoàn đảo phiếu thu POS/COD không ràng buộc chặt

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Thêm endpoint xác nhận hoàn tiền thủ công (MANAGE_FINANCE): tạo CashEntry OUT và set REFUNDED một cách nguyên tử. Với reverseEntry, chặn đảo các referenceType do hệ thống sinh (POS_ORDER, COD) hoặc yêu cầu đi qua luồng nghiệp vụ tương ứng.
- **File:** `backend/src/modules/orders/services/order-lifecycle.service.ts`, `backend/src/modules/finance/finance.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Có luồng ghi nhận REFUNDED kèm phiếu chi. Đảo phiếu POS_ORDER bị từ chối hoặc đồng bộ chứng từ gốc.
- **Regression test gợi ý:** Spec cho endpoint xác nhận hoàn tiền và cho reverseEntry với referenceType POS_ORDER.

### [ ] R-061 — SEC-067 — Khắc phục: Đăng ký nhận thông báo có hàng không xác minh email: dùng hệ thống gửi mail tới địa chỉ bất kỳ

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Gửi email xác nhận (double opt-in) trước khi kích hoạt alert, hoặc yêu cầu đăng nhập. Giới hạn số alert theo email và theo IP.
- **File:** `backend/src/modules/products/products.service.ts`, `backend/src/modules/products/products.controller.ts`
- **Dependencies:** —
- **Acceptance criteria:** Alert chỉ được kích hoạt sau khi email được xác nhận.
- **Regression test gợi ý:** Jest: subscribe tạo bản ghi pending và chưa gửi thông báo cho đến khi xác nhận.

### [ ] R-062 — SEC-068 — Khắc phục: Bỏ qua bước phê duyệt chuyển kho: xuất kho trực tiếp từ phiếu DRAFT rồi người tạo tự nhận

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** 1) shipTransfer chỉ chấp nhận status APPROVED. 2) approveTransfer từ chối khi `transfer.createdBy.equals(userId)`, và cân nhắc yêu cầu ADMIN hoặc một permission duyệt riêng. 3) receiveTransfer: khi variance > 0 (hoặc vượt ngưỡng số lượng/giá trị) thì chuyển sang trạng thái chờ duyệt hao hụt thay vì ghi DAMAGE ngay. Cũng nên cấm receivedBy trùng shippedBy.
- **File:** `backend/src/modules/warehouses/warehouses.service.ts`, `backend/src/modules/warehouses/warehouses.service.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** PATCH transfers/:id/ship trên phiếu DRAFT trả 400. Người tạo phiếu gọi approve trên phiếu của chính mình nhận 403 (nếu nghiệp vụ chốt SoD). Variance > ngưỡng không tự động ghi DAMAGE.
- **Regression test gợi ý:** warehouses.service.spec: shipTransfer với status DRAFT phải throw BadRequestException. approveTransfer với userId === createdBy phải throw ForbiddenException. receiveTransfer với variance>0 phải tạo trạng thái chờ duyệt.

### [ ] R-065 — SEC-071 — Khắc phục: Endpoint kho thủ công cho nhập giá vốn tùy ý và ghi bán/hủy/điều chỉnh tồn ngoài chứng từ

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** 1) Bỏ costPrice khỏi InventoryTransactionDto cho route công khai, chỉ cho GoodsReceiptsService hoặc data-exchange opening_stock (ADMIN) truyền giá vốn nội bộ. 2) Giới hạn /inventory/adjust, /sale, /export, /damage cho ADMIN hoặc một permission riêng, hoặc buộc đi qua stock-audits khi |delta| hoặc giá trị vượt ngưỡng. 3) Bắt buộc note/reason cho adjust và damage. 4) Cân nhắc gỡ route legacy /inventory/export và /inventory/sale nếu frontend không còn dùng.
- **File:** `backend/src/modules/inventory/inventory.controller.ts`, `backend/src/modules/inventory/dto/inventory.dto.ts`, `backend/src/modules/inventory/inventory.service.ts`, `backend/src/modules/inventory/inventory.service.spec.ts`
- **Dependencies:** —
- **Acceptance criteria:** STAFF gửi costPrice tới /inventory/import nhận 400 (forbidNonWhitelisted), hoặc giá trị bị bỏ qua. Adjust hoặc damage vượt ngưỡng bởi STAFF nhận 403 hoặc chuyển sang chờ duyệt.
- **Regression test gợi ý:** inventory.service.spec: importStock từ controller không làm đổi inventory.costPrice. adjustStock vượt ngưỡng với actor STAFF thì Forbidden.

### [ ] R-070 — SEC-076 — Khắc phục: Quyền VIEW_REPORTS và MANAGE_ORDERS quá rộng với dữ liệu tài chính (giá vốn, lãi gộp, sổ quỹ, danh sách thanh toán)

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Chốt với nghiệp vụ: tách VIEW_REPORTS (doanh số) khỏi VIEW_COST_REPORTS hoặc VIEW_FINANCE (giá vốn, lãi gộp, sổ quỹ, công nợ). Cập nhật @Permissions tương ứng và seed permission.
- **File:** `backend/src/common/enums/index.ts`, `backend/src/modules/reports/reports.controller.ts`, `backend/src/modules/finance/finance.controller.ts`, `backend/src/modules/documents/documents.controller.ts`, `backend/src/modules/payments/payments.controller.ts`, `docs/PROJECT_OVERVIEW.md`
- **Dependencies:** —
- **Acceptance criteria:** Ma trận permission được chốt, và STAFF chỉ có VIEW_REPORTS không truy cập được endpoint giá vốn/sổ quỹ.
- **Regression test gợi ý:** rbac/route spec: STAFF[VIEW_REPORTS] gọi GET /reports/inventory-ledger-profit và GET /finance/entries thì nhận 403 sau khi tách permission.

### [ ] R-071 — SEC-077 — Khắc phục: ADMIN đổi được vai trò STAFF/CUSTOMER; tài liệu RBAC (PROJECT_OVERVIEW mục 6) lệch với code

- **Priority:** P3  |  **Status:** OPEN  |  **Cần quyết định nghiệp vụ:** CÓ
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** Chốt nghiệp vụ. Nếu giữ đặc tả: đổi @Roles của :id/role thành chỉ SUPER_ADMIN. Nếu giữ code: cập nhật docs mục 6.2. Trong mọi trường hợp, thêm `securityAuditService.logPermissionChange({actorId, actorRole, targetUserId, before, after})` trong updatePermissions.
- **File:** `backend/src/modules/users/users.controller.ts`, `backend/src/modules/users/users.service.ts`, `backend/src/common/audit/security-audit.service.ts`, `docs/PROJECT_OVERVIEW.md`
- **Dependencies:** —
- **Acceptance criteria:** Hành vi :id/role khớp docs. Mỗi lần đổi permission đều có bản ghi audit (actor, target, trước/sau).
- **Regression test gợi ý:** users.controller/rbac spec: ADMIN gọi PATCH :id/role thì 403 (nếu chọn chỉ SUPER_ADMIN). updatePermissions gọi logPermissionChange.

### [ ] R-072 — SEC-085 — Khắc phục: Thiếu giới hạn độ dài/định dạng cho nhiều trường DTO người dùng nhập (ghi chú đơn, đánh giá, landing page...)

- **Priority:** P3  |  **Status:** OPEN
- **Severity / Category:** Low / Best Practice Improvement
- **Cần làm:** - avatar: @IsUrl({protocols:['https']}) hoặc chỉ nhận data:image để upload, và chỉ lưu URL Cloudinary trả về.
- @MaxLength cho fullName (100), review content (2000), password (128).
- @ArrayMaxSize cho mọi mảng.
- @ValidateNested + @Type cho các mảng landing page. Giới hạn customCss (MaxLength, chặn url(), @import).
- Sửa SAFE_URL_REGEX thành ^(\/(?!\/)|https?:\/\/). Không lưu data URI khi upload thất bại mà trả lỗi.
- **File:** `backend/src/modules/auth/dto/auth.dto.ts`, `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/reviews/dto/review.dto.ts`, `backend/src/modules/landing-pages/dto/landing-page.dto.ts`, `backend/src/modules/banners/dto/banner.dto.ts`, `backend/src/modules/banners/banners.service.ts`
- **Dependencies:** —
- **Acceptance criteria:** Các payload vượt giới hạn hoặc sai scheme trả 400, không trả 500.
- **Regression test gợi ý:** Jest DTO validation cho từng trường.

---

## Các mục đã FIXED nhưng cần theo dõi khi triển khai

| SEC | Lưu ý khi triển khai/vận hành |
|---|---|
| SEC-009, SEC-022 | Phụ thuộc MongoDB replica set (transaction + WriteConflict retry); chạy standalone chỉ re-check, không atomic |
| SEC-020 | `FRONTEND_URL` production phải liệt kê đủ origin (www và không www) |
| SEC-012 | Trần limit 1000 do Combos.vue; hạ xuống 100 sau khi Combos.vue phân trang |
| SEC-013 | `ORDER_MAX_ITEMS=50` có thể chặn giỏ hàng >50 dòng distinct (CartSyncDto cho 200) |
| SEC-030 | `.dockerignore` loại `.env.*`; biến VITE_ lúc build phải truyền bằng build-arg |
| SEC-004, 024, 032 | Luồng admin vẫn thấy đủ giá vốn; mọi đường trả response mới cho khách phải dùng `toCustomerOrderView` hoặc tương đương |
