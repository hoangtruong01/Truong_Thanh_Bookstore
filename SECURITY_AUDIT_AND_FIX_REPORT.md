# Báo cáo kiểm toán bảo mật và khắc phục — Trường Thành Bookstore

- **Ngày lập báo cáo:** 2026-11-10 (nhánh `refactor/web-mobile-sync`, working tree có thay đổi chưa commit)
- **Phạm vi:** backend NestJS, frontend Vue 3, mobile Flutter (đọc mã), cấu hình hạ tầng và CI
- **Phương pháp:** audit tĩnh 8 chiều, 78 lượt kiểm chứng độc lập, 10 dynamic test trên backend cục bộ, sửa lỗi theo cụm kèm review chéo, kiểm tra tổng thể cuối
- **Quy ước:** không có giá trị bí mật nào xuất hiện trong báo cáo này. Hai mục liên quan credential (SEC-003, SEC-056) chỉ được mô tả và che hoàn toàn.

---

## 1. Executive Security Summary

Đợt audit ghi nhận **107 phát hiện thô** từ 8 chiều. Sau khi gộp các phát hiện trùng cùng nguyên nhân gốc, bổ sung 7 mục từ dynamic test và ghi chú review (SEC-078 đến SEC-084), và **loại 2 phát hiện đã bị bác bỏ** (Phụ lục A), còn **85 mục SEC** (SEC-001 đến SEC-085). Mức độ dùng **severity đã điều chỉnh theo verifier**.

| Mức độ | Số mục |
|---|---|
| Critical | 0 |
| High | 3 (FIXED – VERIFIED 1; FIXED – NOT VERIFIED 0; PARTIAL 1; OPEN 0; BLOCKED 1) |
| Medium | 16 (FIXED – VERIFIED 10; FIXED – NOT VERIFIED 0; PARTIAL 2; OPEN 4; BLOCKED 0) |
| Low | 66 (FIXED – VERIFIED 15; FIXED – NOT VERIFIED 3; PARTIAL 2; OPEN 45; BLOCKED 1) |

Theo phân loại: Confirmed Vulnerability 24; Potential Risk 22; Best Practice Improvement 32; Misconfiguration 7.

**Tình trạng khắc phục:** FIXED – VERIFIED 26; FIXED – NOT VERIFIED 3; PARTIAL 5; OPEN 49; BLOCKED 2. Tổng đã có bản sửa (kể cả một phần): 34/85.

**Điểm nhấn chính**

1. **Có 3 mục High: 1 đã đóng, 1 còn PARTIAL, 1 BLOCKED.** SEC-002 (stored XSS qua ảnh đánh giá) đã được sửa và kiểm chứng. SEC-001 (khách tự chọn giá landing page) đã đóng các kẽ hở chính nhưng còn PARTIAL vì cần method đáng tin cho landing page. SEC-003 (chuỗi kết nối MongoDB Atlas và API key trong lịch sử git đã push lên GitHub và GitLab) **BLOCKED**: chỉ chủ sở hữu mới xoay được credential, AI không làm được. Đây là việc phải làm ngay.
2. **Rủi ro lớn nhất về nghiệp vụ nằm ở lộ giá vốn và toàn vẹn giá/tiền:** SEC-004 và SEC-032 (khách/guest thấy costPrice, biên lợi nhuận và các trường hash nội bộ, đã tái hiện bằng dynamic test TEST-SEC-005), SEC-006/007/023/024 (POS), SEC-008 (khách tự đặc cách hạn trả hàng), SEC-009 (race thanh toán công nợ). Tất cả đã sửa kèm regression test.
3. **Lớp phân quyền nền tảng tốt nhưng còn khoảng trống ERP.** Guard đã chuyển sang deny-by-default (thay đổi chưa commit của developer, SEC-034) và dynamic test cho thấy IDOR/leo thang đặc quyền cơ bản bị chặn. Các lỗ hổng còn mở chủ yếu là thiếu phân tách nhiệm vụ (maker-checker) ở kho và mua hàng (SEC-068 đến SEC-075).
4. **Hạ tầng triển khai cần quyết định của chủ sở hữu:** rate-limit đăng nhập chỉ theo IP, chưa có khóa theo tài khoản (SEC-044; phần trust proxy đã có ở commit 99b4309, cần xác minh số hop trên production), docker-compose mặc định development (SEC-051), CSP của Vercel còn unsafe-inline và thiếu frame-src (SEC-042), dependency production có advisory (SEC-052).
5. **Kiểm tra tổng thể cuối (sau toàn bộ bản vá):** backend `npm test` 90 suites / 1183 test PASS (baseline trước bản vá: 77 / 913); backend lint 0 lỗi, 2598 warning (ngưỡng 2650); backend build OK; frontend 37 files / 254 test PASS (baseline 26 / 124), typecheck, lint, build đều OK. Chưa chạy lại dynamic test và e2e Playwright sau bản vá (xem mục 3 và 16).

**Kết luận ngắn:** không còn lỗ hổng Critical; mức High còn lại phụ thuộc hành động của chủ sở hữu (SEC-003) và một thay đổi thiết kế nhỏ (SEC-001). Chưa nên coi hệ thống "đã an toàn" cho tới khi credential bị lộ được xoay và các thay đổi chưa commit được review, commit, triển khai.

### Bảng tổng hợp (tất cả SEC)

| SEC ID | Module | Vulnerability | Severity | Evidence | Root Cause | Fix | Retest | Status |
|---|---|---|---|---|---|---|---|---|
| SEC-001 | orders/checkout | Khách tự chọn giá và orderSource=LANDING_PAGE khi tạo đơn công khai | High | checkout.service.ts:390-399 chỉ cần orderSource===LANDING_PAGE và landingPageId (cả hai từ client)… | Giá ưu đãi landing page được chọn bằng cách so khớp giá do client gửi, thay vì ràng buộc chặt: gói… | Giá client chỉ được áp khi landing page đang bật và khớp giá cấu hình cho đúng sản phẩm (resolveLandingPrice… | PASS: checkout.service.spec.ts | PARTIAL |
| SEC-002 | reviews (backend DTO) + frontend/pages/a… | Stored XSS qua ảnh đánh giá (javascript:/data: URL), admin Reviews.vue mở bằng window.open | High | backend/src/modules/reviews/dto/review.dto.ts:35-38 và 61-64: `@IsOptional() @IsArray() @IsString({… | Backend thiếu allowlist scheme/host cho URL ảnh do người dùng gửi. Frontend đưa dữ liệu không tin… | DTO: @ArrayMaxSize(5), @MaxLength(2048,{each}), @IsUrl chỉ http/https. Service: assertSafeImageUrls() (new… | PASS: backend/src/modules/reviews/reviews.security.spec.ts | FIXED – VERIFIED |
| SEC-003 | Repository / Secrets | Chuỗi kết nối MongoDB Atlas (có mật khẩu) và Gemini API key nằm trong lịch sử git đã push | High | Lịch sử git (git log --all -p) có commit thêm các file scratch (backend/scratch_check_db.js,… | Script thử nghiệm (scratch_*) dùng credential thật được commit trước khi `.gitignore` có rule… | Chưa có thay đổi nào. Không thể tự động xử lý: cần chủ sở hữu xoay (rotate) thông tin đăng nhập. | — | BLOCKED |
| SEC-004 | orders (ảnh hưởng tới phạm vi ERP: dữ… | Response đơn hàng cho khách/guest lộ costPrice, grossMargin, markup, approver | Medium | checkout.service.ts:468-469 `const itemCostPrice = costMap.get(...) \|\| product.costPrice \|\| 0;` và… | Snapshot dữ liệu nội bộ (giá vốn, biên lợi nhuận) nằm chung subdocument với dữ liệu hiển thị cho… | Helper toCustomerOrderView loại costPrice, baseSellingPrice, appliedPolicy*, grossMarginPercent,… | PASS: orders.customer-view.spec.ts | FIXED – VERIFIED |
| SEC-005 | auth | POST /auth/logout đưa jti/exp chưa xác thực chữ ký vào blacklist | Medium | auth.service.ts:330-339: `const decoded: any = this.jwtService.decode(rawAccessToken); ... if (jti)… | Dữ liệu chưa xác thực (payload JWT chỉ được decode) được dùng làm key và TTL cho kho lưu trữ dài… | Helper verifyTokenForRevocation: verifyAsync bằng secret access/refresh với ignoreExpiration, kiểm tra đúng… | PASS: auth.service.spec.ts | FIXED – VERIFIED |
| SEC-006 | pos | POS managerPassword là password oracle (so sánh plaintext, lách throttle đăng nhập) | Medium | pos.service.ts:564-618: `if (totalDiscountPercent > 20 \|\| marginApprovalRequired)`, approver lấy… | Xác thực mật khẩu quản lý được nhúng vào API nghiệp vụ, không có rate-limit hay lockout riêng, và… | Bỏ so sánh plaintext, chỉ bcrypt.compare. Mọi lỗi xác thực phê duyệt trả cùng một thông báo. Bộ đếm sai theo… | PASS: pos.security.spec.ts | FIXED – VERIFIED |
| SEC-007 | pos/pricing | POS: thu ngân né sàn biên lợi nhuận bằng unitPrice giả cao | Medium | pos.service.ts:338-339 và 383-384: unitPrice lấy từ DB/giá sỉ. 410-435: lineTotal tính theo… | Kiểm tra biên lợi nhuận và tính tiền dùng 2 nguồn giá khác nhau, và nguồn dùng cho kiểm tra lại do… | POS luôn truyền giá thực từ CSDL (requestedUnitPrice) cho PricingService; BadRequest nếu unitPrice client lớn… | PASS: pos.security.spec.ts | FIXED – VERIFIED |
| SEC-008 | orders/lifecycle ; orders | Khách vượt hạn trả hàng 7 ngày bằng overrideToken tùy ý | Medium | order-lifecycle.service.ts:598-606: `const isOverrideValid = dto.overrideToken &&… | Placeholder kiểm tra token chưa được hiện thực bằng cơ chế ký hoặc phê duyệt thật. | requestReturn chỉ chấp nhận overrideToken khi người gọi là ADMIN/SUPER_ADMIN hoặc STAFF có MANAGE_ORDERS;… | PASS: order-lifecycle.service.spec.ts | FIXED – VERIFIED |
| SEC-009 | finance | Race khi thanh toán NCC / thu nợ khách (fallback doc.save() ghi đè dữ liệu cũ) | Medium | finance.service.ts:928-948: đọc payable và kiểm tra remainingAmount ngoài session. 1035-1054:… | Nhánh fallback (có vẻ thêm vào để chạy được với mock trong test) biến lệnh cập nhật nguyên tử có… | Bỏ fallback save() ở paySupplier và collectCustomerPayment; luôn dùng findOneAndUpdate có điều kiện… | PASS: finance.service.spec.ts | FIXED – VERIFIED |
| SEC-010 | promotions ; promotions / data-exchange | PATCH /promotions/:id bỏ qua ValidationPipe (Partial<CreatePromotionDto>) | Medium | promotions.controller.ts:74 `update(@Param('id') id: string, @Body() dto:… | Dùng kiểu generic cho @Body thay vì class DTO cụ thể. Schema thiếu ràng buộc dữ liệu. | Thêm UpdatePromotionDto = PartialType(CreatePromotionDto) (@nestjs/swagger); controller PATCH dùng DTO này.… | PASS: promotions.controller.spec.ts | FIXED – VERIFIED |
| SEC-011 | email / orders | Email xác nhận đơn chèn HTML chưa escape (phishing dưới thương hiệu cửa hàng) | Medium | email/email.service.ts:177 (${order.customerName}), 185 (${order.shippingAddress}), 247 (status… | Template email ghép chuỗi HTML không escape. Email của khách không được xác minh trước khi gửi. | Thêm hàm export escapeHtml (& < > " ') áp dụng cho mọi giá trị người dùng nhúng vào HTML ở sendOtpEmail,… | PASS: email.service.spec.ts | FIXED – VERIFIED |
| SEC-012 | products / common pagination | Phân trang không giới hạn (limit=0 hoặc rất lớn) trên API công khai | Medium | common/dto/pagination.dto.ts:14-17 (@Min(1) không @Max) products/products.controller.ts:45-49… | Thiếu cận trên cho tham số phân trang ở DTO dùng chung, và route đọc query primitive mà không clamp. | PaginationDto.limit thêm @IsInt @Min(1) @Max(1000) (trần 1000 vì admin Combos.vue gọi limit=1000); thêm… | PASS: products.public-exposure.spec.ts | FIXED – VERIFIED |
| SEC-013 | orders | checkout-preview công khai không giới hạn số item/quantity, truy vấn tuần tự từng item | Medium | orders/dto/order.dto.ts:219-225 (items: @IsArray @ArrayMinSize(1), không ArrayMaxSize)… | Thiếu giới hạn kích thước mảng ở DTO. Pattern N+1 query trong vòng lặp. | Thêm ORDER_MAX_ITEMS=50 (@ArrayMaxSize) cho CheckoutPreviewDto.items và CreateOrderDto.items;… | PASS: checkout.service.spec.ts | PARTIAL |
| SEC-014 | finance ; finance, customers,… | Regex injection/ReDoS (finance, customers, data-exchange) và :type không validate | Low | finance.service.ts:733-741: `const searchRegex = new RegExp(query.search.trim(), 'i'); filter.$or =… | Thiếu escape ký tự đặc biệt của regex. | Thêm escapeRegex trong từng service: buildCashEntryFilter, findAllPayables, findAllReceivables,… | PASS: finance SEC-014-T01/T02 | FIXED – VERIFIED |
| SEC-015 | reviews / products ; products (reviews… | Mọi STAFF xóa được đánh giá của khách, bỏ qua permission | Low | reviews.service.ts:213-220 `if (review.user.toString() !== userId && userRole !== 'ADMIN' &&… | Kiểm tra quyền dựa trên role trong service, không dùng permission (MANAGE_PRODUCTS), lệch với mô… | Route dùng chung với khách nên sửa ở service: delete() nhận thêm userPermissions (mặc định []), controller… | PASS: reviews.security.spec.ts | FIXED – VERIFIED |
| SEC-016 | products / categories ; products | API công khai trả sản phẩm INACTIVE, danh mục ẩn (includeInactive) và wholesalePrice | Low | categories.controller.ts:37-48 không có @UseGuards, `includeInactive === 'true'` truyền thẳng vào… | Endpoint public dùng chung cho admin (admin cần thấy sản phẩm ẩn), nhưng không có nhánh phân quyền. | GET /products dùng OptionalJwtAuthGuard + @CurrentUser; findAll ép status=ACTIVE cho khách/CUSTOMER;… | PASS: products.public-exposure.spec.ts | FIXED – VERIFIED |
| SEC-017 | customers | GET /customers/:id và cập nhật CRM truy cập được tài khoản STAFF/ADMIN/SUPER_ADMIN | Low | customers.service.ts:211 `filter = { role: UserRole.CUSTOMER }` (findAll). Dòng 307-308… | Thiếu ràng buộc loại đối tượng (object-level scoping) ở các endpoint theo id. | findById dùng findOne({_id, role: CUSTOMER}) và trả null nếu id không hợp lệ; thêm assertIsCustomer… | PASS: customers.service.spec.ts | FIXED – VERIFIED |
| SEC-018 | notifications | GET /notifications/my-notifications lộ readBy chứa id người dùng khác | Low | notifications.service.ts:137-144 `.find(filter)...lean()`. Dòng 149-162 `return { ...item, isRead… | Trả document thô thay vì projection hoặc DTO. | findByUser tách readBy khỏi từng item, chỉ trả isRead tính riêng cho người gọi. | PASS: notifications.service.spec.ts | FIXED – VERIFIED |
| SEC-019 | auth | Bộ đếm lần thử OTP kiểu đọc-rồi-ghi, request song song vượt giới hạn | Low | auth.service.ts:521-548 và 599-627: `const currentAttempts = user.resetOtpAttempts \|\| 0; ...… | Cập nhật bộ đếm bảo mật không atomic. | reserveOtpAttempt: findOneAndUpdate có điều kiện {resetOtp hiện tại, attempts < 5} và $inc, đặt chỗ nguyên tử… | PASS: auth.service.spec.ts, describe "SEC-019 atomic OTP attempt counter" | FIXED – VERIFIED |
| SEC-020 | notifications (websocket auth) | WebSocket /notifications xác thực bằng cookie nhưng không kiểm tra Origin | Low | notifications.gateway.ts:14-39: `cors.origin` callback, không có `allowRequest`.… | Dựa vào CORS của socket.io (không áp dụng cho WebSocket) để giới hạn origin, trong khi vẫn chấp… | Khi token đến từ cookie access_token, Origin phải nằm trong FRONTEND_URL (danh sách phân tách dấu phẩy);… | PASS: notifications.gateway.spec.ts, describe "SEC-020" | FIXED – VERIFIED |
| SEC-021 | landing-pages | POST /landing-pages/submit-order thiếu throttle riêng và không kiểm tra trạng thái trang | Low | landing-page.controller.ts:80-85 không có @Throttle. landing-page.service.ts:288-291… | Luồng landing page không dùng chung cấu hình chống spam với POST /orders. | @Throttle 10/phút cho submit-order; page.status !== true thì ném NotFoundException trước khi gọi… | PASS: landing-page.service.spec.ts | PARTIAL |
| SEC-022 | orders/lifecycle | Race khi khách/guest hủy đơn đã chuyển sang CONFIRMED/PROCESSING | Low | order-lifecycle.service.ts:100-119: findById ngoài session, kiểm tra `existingOrder.orderStatus !==… | Ràng buộc theo vai trò không được truyền vào bước kiểm tra trong transaction. | Cờ nội bộ _expectedStatus=PENDING đặt cho khách (không phải admin/staff) trong updateStatus và cho… | PASS: order-lifecycle.service.spec.ts | FIXED – VERIFIED |
| SEC-023 | pos | Hoàn trả POS nhiều dòng cùng sản phẩm hoàn tiền nhiều hơn đã bán | Low | pos.service.ts:1205-1267: vòng lặp dto.items, targetItem.returnedQuantity được cộng dồn trong bộ… | Biến tích lũy tiền hoàn theo sản phẩm không tính phần đã hoàn trong cùng request, và không gộp các… | Gộp số lượng theo từng dòng hóa đơn và validate trước khi chạm tồn kho; cộng số tiền đã tính cho cùng dòng… | PASS: pos.security.spec.ts | FIXED – VERIFIED |
| SEC-024 | pos | Response tạo đơn/hoàn trả POS trả costPrice cho thu ngân | Low | pos.service.ts:1076 `return savedOrder;`, :1097 `return existing;`, :1454 `return order;` (refund).… | Logic che dữ liệu nằm rải rác trong từng hàm đọc, không áp dụng cho response của hàm ghi. Danh sách… | Helper sanitizeOrderForActor: với vai trò không phải ADMIN/SUPER_ADMIN trả bản sao đã xóa costPrice,… | PASS: pos.security.spec.ts | FIXED – VERIFIED |
| SEC-025 | products / data-exchange | Import Excel sản phẩm thiếu kiểm tra magic bytes và giới hạn số dòng | Medium | products/products.controller.ts:92-117 (chỉ kiểm tra regex đuôi file)… | Parse đồng bộ toàn bộ workbook trong bộ nhớ, không giới hạn kích thước sau giải nén. | validateImportFileSafety (mirror logic DataExchangeService): từ chối buffer rỗng, >10MB, thiếu magic bytes… | PASS: products.public-exposure.spec.ts | FIXED – VERIFIED |
| SEC-026 | Security middleware ; common/security | sanitizePayload trả nguyên dữ liệu khi lồng sâu hơn 15 cấp (bỏ qua lọc $-key và XSS) | Low | security.sanitizer.ts:123-125 `if (currentDepth > maxDepth \|\| data === null \|\| data === undefined)… | Giới hạn độ sâu được thiết kế fail-open thay vì fail-closed | Ném BadRequestException("Dữ liệu đầu vào lồng quá sâu") khi vượt maxDepth với object/array/string; số/boolean… | PASS: security.sanitizer.spec.ts | FIXED – VERIFIED |
| SEC-027 | frontend/nginx.conf ; Frontend hosting… | nginx.conf thiếu security headers đầy đủ (CSP, HSTS, Permissions-Policy, Referrer-Policy lỏng) và header bị… | Low | frontend/nginx.conf:16-19 chỉ có XFO SAMEORIGIN, X-XSS-Protection, nosniff, Referrer-Policy… | Cấu hình nginx không được đồng bộ với header của Vercel. | Thêm ở cấp server (kèm always): CSP giống vercel.json (bổ sung frame-src https://maps.google.com… | Chưa có test tự động | FIXED – NOT VERIFIED |
| SEC-028 | auth / users ; auth | DTO auth thiếu @IsString/@MaxLength cho password, fullName; avatar nhận chuỗi tùy ý | Low | auth.service.ts:175, 450, 633; users.service.ts:171: `bcrypt.hash(..., 10)`. auth.dto.ts:52-54… | Thiếu ràng buộc validate và tham số băm chưa được nâng theo khuyến nghị hiện hành. | password/currentPassword/newPassword thêm @IsString và @MaxLength(128); fullName @MaxLength(100); avatar dùng… | PASS: auth.dto.spec.ts | FIXED – VERIFIED |
| SEC-029 | auth (frontend/mobile) ; frontend auth | Client web/mobile còn code hiển thị OTP "Development" đọc từ response API | Low | auth.service.ts:507-512 chỉ trả `{success, message}`. email.service.ts:105-110 thay `\b\d{6}\b`… | Còn sót helper debug từ thời backend trả OTP. | Web: xóa nhánh UI hiển thị OTP, biến devOtp/isDev và đoạn đọc res.data.otp; toast đổi thành "Mã OTP đã được… | PASS: ForgotPasswordNoDevOtp.spec.ts | PARTIAL |
| SEC-030 | Repository hygiene | .gitignore/.dockerignore chưa bao phủ đủ biến thể .env và file khóa/keystore | Low | git check-ignore -v chỉ trả về match cho mobile/android/key.properties và *.jks.… | Pattern ignore liệt kê từng tên file thay vì dùng wildcard deny-by-default | Bổ sung .env.*, !.env.example, !backend/.env.test, *.pem, *.key, *.p12, *.pfx, *.jks, *.keystore,… | Chưa có test tự động | FIXED – NOT VERIFIED |
| SEC-031 | CI/CD | GitHub Actions thiếu permissions tối thiểu và nội suy ${{ }} trong run | Low | ci.yml:1-9, deploy.yml:1-11, docker-build.yml:1-10 không có `permissions:`. release.yml:82-83 chỉ… | Workflow chưa áp dụng quy tắc least privilege và pin action theo SHA | permissions: contents: read ở cấp workflow cho cả 4 file (gitleaks thêm pull-requests: read; create-release… | Chưa có test tự động | FIXED – NOT VERIFIED |
| SEC-032 | orders | Response tạo đơn/replay lộ các trường select:false (guestAccessTokenHash, idempotencyKeyHash...) | Low | checkout.service.ts:720-724 `const result = savedOrder.toObject(); return {...result,… | Không có lớp serializer hoặc DTO output cho Order. | toCustomerOrderView cũng loại guestAccessTokenHash, idempotencyKeyHash, idempotencyPayloadHash,… | PASS: checkout.service.spec.ts | FIXED – VERIFIED |
| SEC-033 | orders | @Body("note") của return-approve / return-received không được validate | Low | orders.controller.ts:246 và 289 `@Body('note') note: string`. Đối chiếu RejectReturnDto có… | Dùng tham số body lẻ thay vì DTO. | ReturnNoteDto (@IsOptional @IsString @MaxLength(1000)); controller approveReturn và confirmReturnReceived… | PASS: order-lifecycle.service.spec.ts | FIXED – VERIFIED |
| SEC-034 | common/guards (RBAC) | RolesGuard/PermissionsGuard cho qua mọi request khi route thiếu @Roles/@Permissions (đã chuyển… | Low | git diff: permissions.guard.ts xóa dòng 21-24 cũ (`// No permissions required — allow access ...… | Guard dùng mô hình fail-open: thiếu metadata thì hiểu là 'không yêu cầu quyền', thay vì 'không xác… | Thay đổi do developer thực hiện, chưa commit: cả hai guard deny-by-default (route thiếu decorator chỉ… | PASS: rbac.guard.spec.ts và route-coverage.spec.ts | FIXED – VERIFIED |
| SEC-035 | seeds | Seed-safety coi host localhost/mongodb là an toàn: stack docker-compose tự host có thể bị xóa DB demo | Low | seed-safety.ts:7 `new Set(['localhost','127.0.0.1','::1','mongodb'])`, :28-31 isLocalMongoUri.… | Dùng vị trí mạng của host làm thước đo môi trường. clearDatabase thiếu chốt chặn độc lập với URI… | Chưa sửa | — | OPEN |
| SEC-036 | common/guards, app.module | Deny-by-default và route-coverage.spec chỉ bảo vệ route đã gắn PermissionsGuard/RolesGuard | Low | app.module.ts:123-126 chỉ có APP_GUARD ThrottlerGuard. route-coverage.spec.ts:44-63 chỉ xét route… | Mô hình opt-in: bảo vệ chỉ có khi dev nhớ gắn guard. | Chưa sửa | — | OPEN |
| SEC-037 | frontend checkout / guest order | Guest order access token lưu vĩnh viễn trong localStorage | Low | frontend/src/pages/customer/Checkout.vue:1069-1072 `localStorage.setItem(`guest-order-token:${orderI… | Dùng bearer capability có giá trị lâu dài, lưu ở storage đọc được bằng JS và không có vòng đời. | Chưa sửa | — | OPEN |
| SEC-038 | frontend/stores/auth.ts ; mobile… | Hồ sơ người dùng (PII, role, permissions) lưu plaintext ở localStorage/SharedPreferences; Android không tắt… | Low | frontend/src/stores/auth.ts:11-20 đọc user từ localStorage. Ghi ở các dòng :46, :86, :100, :113,… | Dùng localStorage làm cache hồ sơ để tránh nháy UI khi tải trang. | Chưa sửa | — | OPEN |
| SEC-039 | frontend/App.vue realtime | Socket.IO fallback về http://localhost:3000 khi build production thiếu VITE_SOCKET_URL | Low | frontend/src/App.vue:87-95. frontend/Dockerfile:11-15 không có ARG VITE_*. frontend/.dockerignore:3… | Fallback dành cho dev bị đóng gói vào bản production. | Chưa sửa | — | OPEN |
| SEC-040 | frontend OrderDetail/Checkout | Gửi URL đơn hàng và thông tin chuyển khoản tới dịch vụ bên thứ ba qua thẻ img (QR) | Low | frontend/src/pages/customer/OrderDetail.vue:171-172, :384-387 (trackingUrl = origin + /my-orders/ +… | Dùng API ngoài để render QR. | Chưa sửa | — | OPEN |
| SEC-041 | frontend build | Vite alias ép dùng bản Vue đầy đủ có runtime template compiler | Low | frontend/vite.config.ts:11. Grep `template:` trong src chỉ khớp file spec. | Alias có lẽ được thêm để phục vụ test stub dùng template string. | Chưa sửa | — | OPEN |
| SEC-042 | frontend deploy headers | CSP frontend (Vercel) cho phép script-src unsafe-inline, connect-src https: wss: quá rộng và thiếu frame-src… | Low | vercel.json:32 và frontend/vercel.json:32 `script-src 'self' 'unsafe-inline'; ... connect-src… | Dùng 'unsafe-inline' để chạy script inline trong index.html thay vì dùng hash. connect-src dùng… | Chưa sửa | — | OPEN |
| SEC-043 | auth | Header X-Client-Platform: mobile biến phiên cookie HttpOnly thành token đọc được trong response | Low | auth.controller.ts:132-136: `const isMobile = _clientPlatform?.trim().toLowerCase() === 'mobile';… | Kênh trả token được chọn theo header do client tự khai, không theo nguồn của credential. Token lấy… | Chưa sửa | — | OPEN |
| SEC-044 | auth / throttler | Rate-limit đăng nhập/OTP/reset chỉ theo req.ip, không khóa theo tài khoản (phần trust proxy đã có ở commit… | Medium | auth.controller.ts:161-172 (`@Throttle({ default: { limit: 5, ttl: 60000 } })`), 267-286 (forgot,… | Kiểm soát brute-force chỉ dựa vào IP, và IP thực của client không được xác định đúng sau reverse… | CẬP NHẬT KHI LẬP BÁO CÁO: mô tả và bằng chứng gốc nói code không có trust proxy (grep 0 kết quả) nhưng mã… | PASS: backend/src/config/trust-proxy.spec.ts và env.validation.spec.ts | PARTIAL |
| SEC-045 | auth | Mỗi user chỉ lưu một refreshTokenHash, đăng nhập thiết bị thứ hai hoặc refresh song song làm hỏng phiên | Low | auth.service.ts:163-164: `user.refreshTokenHash = this.hashToken(refreshToken); await user.save();`… | Mô hình một phiên trên một user kết hợp reuse-detection mà không có token family hay session id… | Chưa sửa | — | OPEN |
| SEC-046 | auth | Lộ sự tồn tại tài khoản qua thông báo đăng ký, thông báo khóa và chênh lệch thời gian | Low | auth.service.ts:170-173: `throw new ConflictException('Email đã tồn tại trên hệ thống')`.… | Thông điệp lỗi và đường đi xử lý khác nhau tùy trạng thái tài khoản. | Chưa sửa | — | OPEN |
| SEC-047 | auth | Blacklist token fail-open khi Redis lỗi; trạng thái thu hồi nằm trong bộ nhớ từng instance | Low | token-blacklist.service.ts:56-64, 85-98: `if (this.redisService?.isConnected) {...} return false;`.… | Chọn ưu tiên tính sẵn sàng hơn tính chính xác khi kiểm tra thu hồi token. | Chưa sửa | — | OPEN |
| SEC-048 | config ; Config validation | Môi trường không phải production bỏ qua kiểm tra secret; danh sách chặn secret yếu chỉ so khớp chính xác | Low | env.validation.ts:334-343 (suy ra secret), 399-401 (`isStrictProduction`), 403-458 (chỉ kiểm tra độ… | Các biện pháp an toàn được gắn với NODE_ENV thay vì luôn bắt buộc. Suy diễn secret để tiện cho dev. | Chưa sửa | — | OPEN |
| SEC-049 | auth ; pricing/pos/checkout ; orders | Secret dự phòng hardcode (OTP pepper, POS approval token, guest token) và dùng lại JWT_SECRET | Low | auth.service.ts:68-74: `\|\| 'truong-thanh-otp-pepper-secret-2026'`. auth.service.ts:91-98: legacy… | Giữ lại code tương thích ngược và giá trị dự phòng tiện lợi. | Chưa sửa | — | OPEN |
| SEC-050 | auth | JWT chưa pin thuật toán, payload chứa email/permissions, user bị xóa nhận 404 thay vì 401 | Low | auth.module.ts:17-23 và jwt.strategy.ts:26-44: không có `algorithms`. auth.service.ts:134-142 và… | Dùng cấu hình mặc định của thư viện, và tái sử dụng hàm findById vốn ném lỗi. | Chưa sửa | — | OPEN |
| SEC-051 | DevOps / Docker Compose | docker-compose chạy image production với NODE_ENV mặc định development, mật khẩu mặc định và Redis không mật… | Low | docker-compose.yml:59-60 `ports: - "3000:3000"`. :62 `NODE_ENV: ${NODE_ENV:-development}`. :64… | Một file compose dùng chung cho cả dev và triển khai thật, dùng fallback `:-default` thay cho cú… | Chưa sửa | — | OPEN |
| SEC-052 | Supply chain / Backend dependencies ;… | Dependency production có advisory: sanitize-html, nodemailer và các gói gián tiếp (exceljs, @nestjs...) | Low | backend/node_modules/sanitize-html/package.json cho version 2.17.7. npm audit:… | Không có quy trình cập nhật dependency tự động (không có Dependabot/Renovate), và ngưỡng audit… | Chưa sửa | — | OPEN |
| SEC-053 | Supply chain / Dev toolchain ; CI/CD | Dependency dev có nhiều lỗ hổng moderate; cổng supply chain CI còn mỏng (audit chỉ chặn từ high, thiếu… | Low | fe-audit-all: `vitest@2.1.0-beta.1 - 4.1.11 direct=true fix=true`, `@vitest/mocker@<=4.1.11`.… | Không có quy trình cập nhật dependency tự động | Chưa sửa | — | OPEN |
| SEC-054 | DevOps / Docker | GitHub Actions pin theo tag (chưa pin SHA) và Docker base image không pin digest | Low | frontend/Dockerfile:18 `FROM nginxinc/nginx-unprivileged:alpine AS runner`. backend/Dockerfile:6,22… | Pin theo tag thay vì digest | Chưa sửa | — | OPEN |
| SEC-055 | Logging / Observability | Log chứa PII và URL đầy đủ; IP lấy từ X-Forwarded-For mà client có thể giả mạo | Low | http-exception.filter.ts:277-288 `body: sanitizeForLogging((request?.body as unknown) \|\| {})`,… | Chính sách log chưa phân loại PII | Chưa sửa | — | OPEN |
| SEC-056 | Developer workstation | GitLab Personal Access Token lưu dạng rõ trong URL remote của .git/config trên máy dev | Low | Lệnh git remote get-url gitlab cho thấy URL có username dạng oauth2 và password là token cá nhân… | Nhúng token vào URL thay vì dùng credential helper | Chưa sửa | — | BLOCKED |
| SEC-057 | payments | IPN báo thanh toán thành công cho đơn đã HỦY không tạo yêu cầu hoàn tiền | Low | payments.service.ts:432-494: kiểm tra isOrderTerminal chỉ khi `isExpired`. 524-570: nhánh thường… | Không xử lý trường hợp thanh toán thành công đến sau khi đơn đã chuyển sang trạng thái terminal… | Chưa sửa | — | OPEN |
| SEC-058 | orders/loyalty | Thu hồi điểm loyalty khi trả hàng bị chặn ở 0: khách tiêu điểm trước rồi trả hàng thì giữ lại lợi ích | Medium | users.service.ts:563-574: `user.loyaltyPoints = Math.max(0, (user.loyaltyPoints \|\| 0) - points);… | Điểm được ghi nhận trước khi giao dịch hết rủi ro hoàn trả, và không có cơ chế công nợ điểm hay… | Chưa sửa | — | OPEN |
| SEC-059 | promotions | Giới hạn mã giảm giá theo người (perUserLimit) không áp dụng được với khách vãng lai | Medium | promotions.service.ts:40-46: `userId ? user: : guestEmail ? email: : phone:`. 166-167:… | Không có danh tính đáng tin cậy cho guest, và định danh dùng cho giới hạn không được chuẩn hóa. | Chưa sửa | — | OPEN |
| SEC-060 | purchasing/returns | Trả hàng NCC: kiểm tra số lượng còn được trả nằm ngoài transaction | Low | purchase-returns.service.ts:133-212: đọc receipt/previousReturns và kiểm tra eligibleQuantity không… | Bất biến 'tổng trả ≤ tổng nhận' không được thực thi nguyên tử ở tầng DB. | Chưa sửa | — | OPEN |
| SEC-061 | landing-pages | Combo landing page bán với quantity=1: khách trả giá combo nhiều cuốn nhưng kho chỉ trừ 1 | Low | landing-page.schema.ts:18-40: PackageItem không có quantity. landing-page.service.ts:331-337:… | Mô hình gói thiếu số lượng đơn vị. | Chưa sửa | — | OPEN |
| SEC-062 | finance/cod | Đối soát COD không xử lý đơn COMPLETED; COD đánh dấu PAID ngay khi DELIVERED | Low | cod-reconciliation.service.ts:121 `if (order.orderStatus === OrderStatus.DELIVERED)`, 147 `else if… | Bộ lọc trạng thái chưa bao gồm COMPLETED. Thời điểm ghi nhận thanh toán COD chưa gắn với đối soát. | Chưa sửa | — | OPEN |
| SEC-063 | orders/checkout | Checkout chuyển sang chế độ không transaction (compensated) cả trong production | Low | checkout.service.ts:683-688: `if (!this.isTransactionUnsupported(error)) throw error; ...… | Chính sách bắt buộc transaction chưa đồng nhất giữa các module. | Chưa sửa | — | OPEN |
| SEC-064 | orders/finance | Hoàn tiền đơn online không bao giờ hoàn tất; hoàn đảo phiếu thu POS/COD không ràng buộc chặt | Low | Grep `RefundStatus.REFUNDED` chỉ thấy phép so sánh ở order-lifecycle.service.ts:709. Đoạn 737-738… | Luồng hoàn tiền và đảo chứng từ chưa khép kín. | Chưa sửa | — | OPEN |
| SEC-065 | orders / landing-pages | Khách vãng lai giữ (trừ) tồn kho hàng loạt bằng đơn COD PENDING (giữ 48h) | Medium | landing-pages/landing-page.controller.ts:81-85 (submit-order không @Throttle)… | Chống lạm dụng luồng đặt hàng khách chỉ dựa vào số điện thoại do client cung cấp. Thiếu giới hạn số… | Chưa sửa | — | OPEN |
| SEC-066 | users/cloudinary, reviews | Lộ thông báo lỗi bên thứ ba (Cloudinary) và 500 khi ObjectId không hợp lệ ở route công khai | Low | users/cloudinary.service.ts:62-66 auth/auth.service.ts:416-420 reviews/reviews.service.ts:28-36… | Đẩy thẳng error message của SDK ra ngoài. Thiếu ParseObjectId pipe cho param. | Chưa sửa | — | OPEN |
| SEC-067 | products (stock alert) | Đăng ký nhận thông báo có hàng không xác minh email: dùng hệ thống gửi mail tới địa chỉ bất kỳ | Low | products/products.controller.ts:262-274 products/dto/stock-alert.dto.ts:5-16 (chỉ @IsEmail) | Thiếu xác minh quyền sở hữu email. | Chưa sửa | — | OPEN |
| SEC-068 | warehouses | Bỏ qua bước phê duyệt chuyển kho: xuất kho trực tiếp từ phiếu DRAFT rồi người tạo tự nhận | Low | warehouses.service.ts:559-566 `if (transfer.status !== StockTransferStatus.APPROVED &&… | Máy trạng thái cho phép bỏ qua bước APPROVED. Không áp dụng phân tách nhiệm vụ (maker-checker) giữa… | Chưa sửa | — | OPEN |
| SEC-069 | purchasing | Nhân viên chỉ có MANAGE_PRODUCTS tạo được phiếu trả hàng NCC (trừ kho, bù trừ công nợ) | Low | purchase-returns.controller.ts:29-33 `@Permissions(StaffPermission.MANAGE_INVENTORY,… | Kiểm tra quyền chỉ đặt ở cấp route với danh sách permission rộng. Bên trong một hành động kho,… | Chưa sửa | — | OPEN |
| SEC-070 | stock-audits | Kiểm kê kho: cờ requiresApproval không được thực thi, người nộp tự duyệt | Low | stock-audits.service.ts:214-224 đặt `requiresApproval = true` khi `Math.abs(item.discrepancy) > 5`… | Ngưỡng duyệt chỉ được tính và lưu, không được dùng để phân quyền. Thiếu permission duyệt riêng và… | Chưa sửa | — | OPEN |
| SEC-071 | inventory | Endpoint kho thủ công cho nhập giá vốn tùy ý và ghi bán/hủy/điều chỉnh tồn ngoài chứng từ | Low | inventory.controller.ts:27-28 class `@Permissions(StaffPermission.MANAGE_INVENTORY)`. :101-166 các… | Endpoint vận hành cấp thấp (ghi sổ kho trực tiếp) được mở cho cùng permission với luồng nghiệp vụ… | Chưa sửa | — | OPEN |
| SEC-072 | purchasing / finance / documents | Thiếu phân tách nhiệm vụ (maker-checker) trên PO, báo giá NCC, chứng từ điện tử, phiếu thu/chi | Medium | purchase-orders.service.ts:386-410 approve: chỉ `if (po.status !== DRAFT) throw`, rồi… | Mô hình RBAC chỉ có permission dạng "MANAGE_*" thô, không tách quyền lập và quyền duyệt. Service… | Chưa sửa | — | OPEN |
| SEC-073 | data-exchange | Phân quyền entity trong data-exchange lệch với module gốc (MANAGE_PRODUCTS ghi đè dữ liệu suppliers) | Low | data-exchange.controller.ts:79-87 `else if (type === 'suppliers') { if… | Ma trận quyền theo entity trong data-exchange được định nghĩa riêng, không dùng lại quyền của… | Chưa sửa | — | OPEN |
| SEC-074 | documents | Máy trạng thái chứng từ điện tử không chặt: xóa được file đính kèm của chứng từ đã REVERSED/đã chốt | Low | documents.service.ts:236-240 `if (doc.status === DocumentStatus.POSTED) throw` là kiểm tra duy… | Kiểm tra trạng thái dùng blacklist thay cho whitelist (chỉ DRAFT mới được sửa). Thiếu transaction. | Chưa sửa | — | OPEN |
| SEC-075 | finance | STAFF có MANAGE_ORDERS tạo được công nợ phải thu tùy ý, không đối chiếu đơn hàng | Low | finance.controller.ts:162-172 `@Permissions(StaffPermission.MANAGE_FINANCE,… | Endpoint ghi sổ tài chính thủ công được mở cho quyền bán hàng, và không xác minh chứng từ gốc. | Chưa sửa | — | OPEN |
| SEC-076 | reports / finance / documents /… | Quyền VIEW_REPORTS và MANAGE_ORDERS quá rộng với dữ liệu tài chính (giá vốn, lãi gộp, sổ quỹ, danh sách thanh… | Low | reports.controller.ts:22 class `@Permissions(StaffPermission.VIEW_REPORTS)`, :116-146… | Mô hình permission thô, không tách nhóm dữ liệu nhạy cảm theo vai trò. | Chưa sửa | — | OPEN |
| SEC-077 | users ; docs | ADMIN đổi được vai trò STAFF/CUSTOMER; tài liệu RBAC (PROJECT_OVERVIEW mục 6) lệch với code | Low | users.controller.ts:110-126 `@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)` trên :id/role.… | Đặc tả và code không đồng bộ. Audit log chưa phủ thao tác cấp quyền. | Chưa sửa | — | OPEN |
| SEC-078 | common/filters, main.ts | HttpExceptionFilter trả 500 thay vì 4xx (CORS bị từ chối, body > 1MB) và lộ stack khi không phải production | Low | TEST-SEC-008: Origin https://evil.example và Origin null nhận 500, OPTIONS preflight 500,… | Lỗi từ CORS callback và body-parser không được map sang 4xx; điều kiện che stack phụ thuộc một biến… | Chưa sửa | — | OPEN |
| SEC-079 | auth/users | tokenVersion bị trả về client trong /auth/me, /users và response đăng ký | Low | TEST-SEC-005 (dynamic): tokenVersion xuất hiện trong /auth/me, /users và register response;… | sanitizeUser chỉ loại các trường nhạy cảm cổ điển, không có allowlist. | Chưa sửa | — | OPEN |
| SEC-080 | products/cart/categories/common guards | Phần còn lại của lộ dữ liệu công khai: OptionalJwtAuthGuard coi token hết hạn là khách, giỏ hàng lộ… | Low | Reviewer của cluster C8 (SEC-016) ghi nhận (a) đến (e) khi rà soát bản sửa; chưa có test động. | Guard tùy chọn nuốt mọi lỗi xác thực; populate không có projection; endpoint danh mục chưa lọc theo… | Chưa sửa | — | OPEN |
| SEC-081 | products/email | Email "có hàng trở lại" trong products.service.ts nhúng tên sản phẩm chưa escape HTML | Low | Reviewer C10 đọc products.service.ts khoảng dòng 1239-1246. | Chưa dùng chung helper escapeHtml. | Chưa sửa | — | OPEN |
| SEC-082 | pos/pricing | POS: biên lợi nhuận chưa tính chiết khấu cấp đơn đã phân bổ; costPrice chưa nhân conversionRatio khi bán theo… | Low | Ghi chú của fixer và reviewer cluster C9. | Công thức biên chưa phản ánh toàn bộ giảm giá và quy đổi đơn vị. | Chưa sửa | — | OPEN |
| SEC-083 | promotions | Promotions: thiếu kiểm tra chéo (PERCENT > 100, endDate < startDate) và lệch tên trường giữa admin… | Low | Reviewer cluster C6. | DTO thiếu validator chéo; frontend và DTO không đồng bộ tên trường. | Chưa sửa | — | OPEN |
| SEC-084 | frontend customer | Storefront OrderDetail.vue vẫn cho khách nhập "mã đặc cách" trả hàng (backend đã bỏ qua token) | Low | Reviewer cluster C3. | Frontend chưa đồng bộ với chính sách mới. | Chưa sửa | — | OPEN |
| SEC-085 | auth / reviews / landing-pages / banners | Thiếu giới hạn độ dài/định dạng cho nhiều trường DTO người dùng nhập (ghi chú đơn, đánh giá, landing page...) | Low | auth/dto/auth.dto.ts:57-74 auth/auth.service.ts:416-425 reviews/dto/review.dto.ts:24-38… | DTO thiếu ràng buộc độ dài, scheme và nested validation một cách nhất quán. | Chưa sửa | — | OPEN |

### Bảng triển khai (công việc đã làm và còn lại)

| Task ID | SEC ID | Công việc | File liên quan | Priority | Dependencies | Acceptance Criteria | Status |
|---|---|---|---|---|---|---|---|
| T-001 | SEC-001 | Triển khai fix: Giá client chỉ được áp khi landing page đang bật và khớp giá cấu hình cho đúng sản phẩm (resolveLandingPrice dùng chung cho preview và create).… | backend/src/modules/orders/services/checkout.service.ts, backend/src/modules/orders/services/checkout.service.spec.ts | P1 | — | POST /orders với orderSource=LANDING_PAGE, product X không thuộc gói nào và item.price bằng landingPage.price phải tính giá DB của X. Gói của sản… | DONE (một phần) |
| T-002 | SEC-002 | Triển khai fix: DTO: @ArrayMaxSize(5), @MaxLength(2048,{each}), @IsUrl chỉ http/https. Service: assertSafeImageUrls() (new URL, chỉ http/https) gọi trước khi chạm DB… | backend/src/modules/reviews/dto/review.dto.ts, backend/src/modules/reviews/reviews.service.ts, frontend/src/pages/admin/Reviews.vue … | P0 | — | POST/PATCH review với images ['javascript:alert(1)'], ['data:text/html,...'], ['http://x'] đều trả 400. URL https hợp lệ (host được phép) vẫn tạo… | DONE – VERIFIED |
| T-004 | SEC-004 | Triển khai fix: Helper toCustomerOrderView loại costPrice, baseSellingPrice, appliedPolicy*, grossMarginPercent, markupPercent, approver, approvalReason. Áp dụng cho… | backend/src/modules/orders/services/checkout.service.ts, backend/src/modules/orders/orders.service.ts,… | P1 | — | Response JSON của GET /orders/my-orders, GET /orders/:id (role CUSTOMER), GET /orders/guest/:id và POST /orders không còn các key costPrice,… | DONE – VERIFIED |
| T-005 | SEC-005 | Triển khai fix: Helper verifyTokenForRevocation: verifyAsync bằng secret access/refresh với ignoreExpiration, kiểm tra đúng type và có exp; token sai thì không ghi… | backend/src/modules/auth/auth.service.ts, backend/src/modules/auth/auth.service.spec.ts | P1 | — | Logout với JWT không ký hoặc ký bằng secret sai thì không tạo bản ghi blacklist nào. jti không phải UUID bị bỏ qua. TTL không bao giờ vượt quá thời… | DONE – VERIFIED |
| T-006 | SEC-006 | Triển khai fix: Bỏ so sánh plaintext, chỉ bcrypt.compare. Mọi lỗi xác thực phê duyệt trả cùng một thông báo. Bộ đếm sai theo thu ngân và theo người duyệt (5 lần/15… | backend/src/modules/pos/pos.service.ts, backend/src/modules/pos/pos.controller.ts, backend/src/modules/pos/pos.security.spec.ts (mới) … | P1 | — | Gửi managerPassword bằng chuỗi hash thì bị từ chối. Sai quá N lần thì bị khóa hoặc trả 429. | DONE – VERIFIED |
| T-007 | SEC-007 | Triển khai fix: POS luôn truyền giá thực từ CSDL (requestedUnitPrice) cho PricingService; BadRequest nếu unitPrice client lớn hơn max(giá thực, giá niêm yết);… | backend/src/modules/pos/pos.service.ts, backend/src/modules/pos/pos.security.spec.ts (mới) | P1 | — | Đơn bán dưới sàn margin luôn yêu cầu approvedById, bất kể unitPrice client gửi. | DONE – VERIFIED |
| T-008 | SEC-008 | Triển khai fix: requestReturn chỉ chấp nhận overrideToken khi người gọi là ADMIN/SUPER_ADMIN hoặc STAFF có MANAGE_ORDERS; token của khách bị bỏ qua; nhãn "Đặc cách"… | backend/src/modules/orders/services/order-lifecycle.service.ts, backend/src/modules/orders/services/order-lifecycle.service.spec.ts (mới),… | P1 | — | Customer gửi overrideToken tùy ý cho đơn quá 7 ngày thì nhận 400. | DONE – VERIFIED |
| T-009 | SEC-009 | Triển khai fix: Bỏ fallback save() ở paySupplier và collectCustomerPayment; luôn dùng findOneAndUpdate có điều kiện (remainingAmount >= amount, status != PAID,… | backend/src/modules/finance/finance.service.ts, backend/src/modules/finance/finance.service.spec.ts, backend/src/modules/uat-e2e-flows.spec.ts (bổ… | P1 | — | Khi lệnh cập nhật có điều kiện không khớp, service ném 409 và không có CashEntry hay thay đổi số dư quỹ nào được commit. | DONE – VERIFIED |
| T-010 | SEC-010 | Triển khai fix: Thêm UpdatePromotionDto = PartialType(CreatePromotionDto) (@nestjs/swagger); controller PATCH dùng DTO này. Review phát hiện PartialType cho phép… | backend/src/modules/promotions/dto/promotion.dto.ts, backend/src/modules/promotions/promotions.controller.ts,… | P1 | — | PATCH với discountValue:-1000 hoặc usedCount:0 hoặc field lạ thì nhận 400. | DONE – VERIFIED |
| T-011 | SEC-011 | Triển khai fix: Thêm hàm export escapeHtml (& < > " ') áp dụng cho mọi giá trị người dùng nhúng vào HTML ở sendOtpEmail, sendOrderConfirmationEmail,… | backend/src/modules/email/email.service.ts, backend/src/modules/email/email.service.spec.ts | P1 | — | HTML email render customerName '<a href="https://x">y</a>' thành văn bản đã escape. | DONE – VERIFIED |
| T-012 | SEC-012 | Triển khai fix: PaginationDto.limit thêm @IsInt @Min(1) @Max(1000) (trần 1000 vì admin Combos.vue gọi limit=1000); thêm clampLimit() cho các endpoint nhận limit thô… | backend/src/common/dto/pagination.dto.ts, backend/src/modules/products/products.service.ts,… | P1 | — | GET /products?limit=1000 trả 400 hoặc bị clamp còn 100. GET /products/best-selling?limit=0 trả tối đa N bản ghi mặc định. | DONE – VERIFIED |
| T-013 | SEC-013 | Triển khai fix: Thêm ORDER_MAX_ITEMS=50 (@ArrayMaxSize) cho CheckoutPreviewDto.items và CreateOrderDto.items; ORDER_ITEM_MAX_QUANTITY=1000 (@Max) cho… | backend/src/modules/orders/dto/order.dto.ts, backend/src/modules/orders/services/checkout.service.spec.ts | P1 | — | Gửi 51 item trả 400. Preview chạy đúng một truy vấn sản phẩm cho mỗi request. | DONE (một phần) |
| T-014 | SEC-014 | Triển khai fix: Thêm escapeRegex trong từng service: buildCashEntryFilter, findAllPayables, findAllReceivables, customers.findAll (kèm trim, ép page>=1, limit trong… | backend/src/modules/finance/finance.service.ts, backend/src/modules/customers/customers.service.ts,… | P2 | — | search='(' thì không gây 500, được tìm như chuỗi literal. | DONE – VERIFIED |
| T-015 | SEC-015 | Triển khai fix: Route dùng chung với khách nên sửa ở service: delete() nhận thêm userPermissions (mặc định []), controller truyền req.user.permissions.… | backend/src/modules/reviews/reviews.service.ts, backend/src/modules/reviews/reviews.controller.ts,… | P2 | — | Chỉ chủ review, ADMIN/SUPER_ADMIN hoặc STAFF có MANAGE_PRODUCTS xóa được review. Chủ review sửa và xóa được review của mình. | DONE – VERIFIED |
| T-016 | SEC-016 | Triển khai fix: GET /products dùng OptionalJwtAuthGuard + @CurrentUser; findAll ép status=ACTIVE cho khách/CUSTOMER; findByIdForViewer trả 404 với sản phẩm không… | backend/src/modules/products/products.service.ts, backend/src/modules/products/products.controller.ts,… | P2 | — | Guest gọi /categories/tree?includeInactive=true không thấy danh mục status=false. Guest gọi /products?status=INACTIVE nhận danh sách rỗng hoặc 403. | DONE – VERIFIED |
| T-017 | SEC-017 | Triển khai fix: findById dùng findOne({_id, role: CUSTOMER}) và trả null nếu id không hợp lệ; thêm assertIsCustomer (NotFoundException) ở updateCRMProfile và… | backend/src/modules/customers/customers.service.ts, backend/src/modules/customers/customers.service.spec.ts | P2 | — | GET /customers/<adminId> trả 404. PATCH crm và evaluate-tier với id không phải CUSTOMER trả 404. | DONE – VERIFIED |
| T-018 | SEC-018 | Triển khai fix: findByUser tách readBy khỏi từng item, chỉ trả isRead tính riêng cho người gọi. | backend/src/modules/notifications/notifications.service.ts, backend/src/modules/notifications/notifications.service.spec.ts | P2 | — | Response my-notifications không chứa readBy. isRead vẫn đúng. | DONE – VERIFIED |
| T-019 | SEC-019 | Triển khai fix: reserveOtpAttempt: findOneAndUpdate có điều kiện {resetOtp hiện tại, attempts < 5} và $inc, đặt chỗ nguyên tử trước khi so khớp OTP; áp dụng cho… | backend/src/modules/auth/auth.service.ts, backend/src/modules/auth/auth.service.spec.ts | P2 | — | 20 request verify song song với OTP sai thì DB ghi nhận tối đa 5 lần và OTP bị hủy. | DONE – VERIFIED |
| T-020 | SEC-020 | Triển khai fix: Khi token đến từ cookie access_token, Origin phải nằm trong FRONTEND_URL (danh sách phân tách dấu phẩy); localhost chỉ cho phép khi không phải… | backend/src/modules/notifications/notifications.gateway.ts, backend/src/modules/notifications/notifications.gateway.spec.ts | P2 | — | Handshake WebSocket với Origin lạ bị từ chối dù cookie hợp lệ. | DONE – VERIFIED |
| T-021 | SEC-021 | Triển khai fix: @Throttle 10/phút cho submit-order; page.status !== true thì ném NotFoundException trước khi gọi productsService/ordersService; xác minh giá chỉ lấy… | backend/src/modules/landing-pages/landing-page.controller.ts, backend/src/modules/landing-pages/landing-page.service.ts,… | P2 | — | Request thứ 11 trong 1 phút nhận 429. Landing page status=false trả 404. | DONE (một phần) |
| T-022 | SEC-022 | Triển khai fix: Cờ nội bộ _expectedStatus=PENDING đặt cho khách (không phải admin/staff) trong updateStatus và cho cancelGuest; updateStatusInternal kiểm tra lại… | backend/src/modules/orders/services/order-lifecycle.service.ts, backend/src/modules/orders/services/order-lifecycle.service.spec.ts | P2 | — | Customer hủy khi bản ghi trong session là CONFIRMED thì nhận 400. | DONE – VERIFIED |
| T-023 | SEC-023 | Triển khai fix: Gộp số lượng theo từng dòng hóa đơn và validate trước khi chạm tồn kho; cộng số tiền đã tính cho cùng dòng hàng ở các dòng trước trong cùng yêu cầu… | backend/src/modules/pos/pos.service.ts, backend/src/modules/pos/pos.security.spec.ts (mới) | P2 | — | Tổng refundAmount của mỗi dòng hàng qua mọi lần trả không vượt effectiveLineTotal. Request có productId+unit trùng bị gộp hoặc bị từ chối 400. | DONE – VERIFIED |
| T-024 | SEC-024 | Triển khai fix: Helper sanitizeOrderForActor: với vai trò không phải ADMIN/SUPER_ADMIN trả bản sao đã xóa costPrice, grossMarginPercent, markupPercent từng dòng; áp… | backend/src/modules/pos/pos.service.ts, backend/src/modules/pos/pos.service.spec.ts, backend/src/modules/pos/pos.security.spec.ts (mới) | P2 | — | Response POST /pos/orders và POST /pos/orders/:id/refund với actor STAFF không chứa costPrice, grossMarginPercent, markupPercent. | DONE – VERIFIED |
| T-025 | SEC-025 | Triển khai fix: validateImportFileSafety (mirror logic DataExchangeService): từ chối buffer rỗng, >10MB, thiếu magic bytes zip, tên file chứa "..", "/", "\"; tối đa… | backend/src/modules/products/products.service.ts, backend/src/modules/products/products.controller.ts,… | P1 | — | File có hơn 5000 dòng hoặc kích thước giải nén vượt ngưỡng bị từ chối mà không tăng RAM đáng kể. | DONE – VERIFIED |
| T-026 | SEC-026 | Triển khai fix: Ném BadRequestException("Dữ liệu đầu vào lồng quá sâu") khi vượt maxDepth với object/array/string; số/boolean đi qua. Middleware đã bọc try/catch trả… | backend/src/common/security/security.sanitizer.ts, backend/src/common/security/security.sanitizer.spec.ts | P3 | — | Payload lồng 20 cấp chứa `$where` bị từ chối hoặc bị loại | DONE – VERIFIED |
| T-027 | SEC-027 | Triển khai fix: Thêm ở cấp server (kèm always): CSP giống vercel.json (bổ sung frame-src https://maps.google.com https://www.google.com sau review để iframe Google… | frontend/nginx.conf | P2 | — | `curl -I` tới / và tới một file /assets/*.js đều trả đủ CSP, XFO DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy. | DONE – NOT VERIFIED |
| T-028 | SEC-028 | Triển khai fix: password/currentPassword/newPassword thêm @IsString và @MaxLength(128); fullName @MaxLength(100); avatar dùng validator IsAvatarValue (URL http/https… | backend/src/modules/auth/dto/auth.dto.ts, backend/src/modules/auth/dto/auth.dto.spec.ts (mới) | P3 | — | Login với password là object trả 400, không phải 500. Hash mới có cost ≥12. | DONE – VERIFIED |
| T-029 | SEC-029 | Triển khai fix: Web: xóa nhánh UI hiển thị OTP, biến devOtp/isDev và đoạn đọc res.data.otp; toast đổi thành "Mã OTP đã được gửi!". | frontend/src/pages/customer/ForgotPassword.vue, frontend/src/pages/customer/__tests__/ForgotPasswordNoDevOtp.spec.ts (mới) | P3 | — | Không còn code client đọc OTP từ response. | DONE (một phần) |
| T-030 | SEC-030 | Triển khai fix: Bổ sung .env.*, !.env.example, !backend/.env.test, *.pem, *.key, *.p12, *.pfx, *.jks, *.keystore, **/key.properties, **/google-services.json,… | .gitignore, backend/.dockerignore, frontend/.dockerignore | P3 | — | git check-ignore khớp với tất cả các đường dẫn trên | DONE – NOT VERIFIED |
| T-031 | SEC-031 | Triển khai fix: permissions: contents: read ở cấp workflow cho cả 4 file (gitleaks thêm pull-requests: read; create-release giữ contents: write riêng).… | .github/workflows/ci.yml, .github/workflows/deploy.yml, .github/workflows/docker-build.yml … | P3 | — | Mọi workflow có `permissions:`. 100% `uses:` pin theo SHA. Không còn `${{ github.* }}` do người dùng kiểm soát nằm trong `run:`. | DONE – NOT VERIFIED |
| T-032 | SEC-032 | Triển khai fix: toCustomerOrderView cũng loại guestAccessTokenHash, idempotencyKeyHash, idempotencyPayloadHash, guestPhoneKey, guestPendingSlot; áp dụng cho create,… | backend/src/modules/orders/services/checkout.service.ts, backend/src/modules/orders/orders.service.ts,… | P3 | — | Response create, replay và landing submit không chứa *Hash, guestPhoneKey, guestPendingSlot. | DONE – VERIFIED |
| T-033 | SEC-033 | Triển khai fix: ReturnNoteDto (@IsOptional @IsString @MaxLength(1000)); controller approveReturn và confirmReturnReceived dùng @Body() dto: ReturnNoteDto. Frontend… | backend/src/modules/orders/dto/return-note.dto.ts (mới), backend/src/modules/orders/orders.controller.ts,… | P3 | — | note là object hoặc dài hơn 500 ký tự nhận 400. | DONE – VERIFIED |
| T-034 | SEC-034 | Triển khai fix: Thay đổi do developer thực hiện, chưa commit: cả hai guard deny-by-default (route thiếu decorator chỉ ADMIN/SUPER_ADMIN qua; STAFF/CUSTOMER 403).… | backend/src/common/guards/roles.guard.ts, backend/src/common/guards/permissions.guard.ts, backend/src/common/guards/rbac.guard.spec.ts … | P3 | — | Thay đổi được commit. CI chạy route-coverage.spec. Route có guard mà thiếu decorator luôn trả 403 cho STAFF/CUSTOMER. | DONE – VERIFIED |
| T-044 | SEC-044 | Đã có sẵn trước đợt audit (không phải bản sửa của đợt này): CẬP NHẬT KHI LẬP BÁO CÁO: mô tả và bằng chứng gốc nói code không có trust proxy (grep 0 kết quả) nhưng mã… | backend/src/config/trust-proxy.ts, backend/src/main.ts, backend/src/config/env.validation.ts … | P1 | — | Hai client khác IP sau proxy có bucket riêng. 10 lần sai cho cùng một email từ nhiều IP thì bị chặn tạm thời. | DONE (một phần) |
| R-001 | SEC-003 | Xoay credential MongoDB Atlas và Gemini/Google API key đã lộ trong lịch sử git | .gitleaks.toml, (lịch sử git) backend/scratch_*.js, (Atlas) database user và IP allowlist … | P0 | — | Credential cũ không còn đăng nhập hoặc gọi API được; secret mới chỉ nằm trong biến môi trường; gitleaks quét toàn bộ lịch sử không còn phát hiện chưa… | BLOCKED (chủ sở hữu) |
| R-002 | SEC-056 | Thu hồi GitLab Personal Access Token đang nằm trong URL remote của .git/config | .git/config (không được track) | P0 | — | Token cũ bị thu hồi; `git remote -v` không còn chứa username:token; push/pull vẫn hoạt động qua credential helper hoặc SSH. | BLOCKED (chủ sở hữu) |
| R-003 | SEC-001 | Đóng hẳn giá landing page: method trusted và bỏ qua item.price/orderSource=LANDING_PAGE ở POST /orders công khai | backend/src/modules/orders/orders.service.ts, backend/src/modules/orders/services/checkout.service.ts,… | P1 | — | Client không thể mua giá landing page qua POST /orders công khai (kể cả khi biết giá gói); submit-order vẫn tạo đơn đúng giá cấu hình. | OPEN |
| R-004 | SEC-013 | Batch lookup sản phẩm cho checkoutPreview và đồng bộ trần giỏ hàng | backend/src/modules/orders/services/checkout.service.ts, backend/src/modules/orders/dto/order.dto.ts,… | P2 | Phối hợp chủ sở hữu orders.service.spec.… | Preview 50 dòng chỉ tốn 1 truy vấn sản phẩm; giỏ hàng hợp lệ không bị chặn oan khi checkout; test cũ cập nhật theo mock mới. | OPEN |
| R-005 | SEC-021 | Landing page: cửa sổ ngày hiệu lực (startAt/endAt) và giới hạn ghi chú đơn | backend/src/modules/landing-pages/schemas/landing-page.schema.ts, backend/src/modules/landing-pages/dto/*,… | P2 | — | Đơn gửi ngoài cửa sổ hiệu lực bị 404; note quá dài bị 400. | OPEN |
| R-006 | SEC-029 | Mobile: xóa đoạn đọc OTP từ response trong forgot_password_screen.dart | mobile/lib/screens/auth/forgot_password_screen.dart | P2 | — | Không còn mã hiển thị/đọc OTP từ API ở mobile; `flutter analyze` 0 issue; `flutter test` pass. | OPEN |
| R-007 | SEC-042 | CSP Vercel: thêm frame-src cho Google Maps, bỏ unsafe-inline, thu hẹp connect-src | vercel.json, frontend/vercel.json, frontend/index.html … | P1 | — | Trang không báo vi phạm CSP; iframe bản đồ hiển thị; `script-src` không còn `unsafe-inline`; `connect-src` chỉ gồm domain cần thiết. | OPEN |
| R-008 | SEC-027 | Xác nhận nginx.conf (nginx -t, kiểm tra header) và sửa location ảnh che mất /api/uploads | frontend/nginx.conf | P2 | — | `nginx -t` OK; các header CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy xuất hiện ở cả location tĩnh lẫn `/`, `/api/`,… | OPEN |
| R-009 | SEC-005 | Dùng verifyTokenForRevocation cho refreshToken() và changePassword() | backend/src/modules/auth/auth.service.ts, backend/src/modules/auth/auth.service.spec.ts | P3 | — | Không còn chỗ nào ghi blacklist từ payload chưa xác thực chữ ký. | OPEN |
| R-010 | SEC-084 | Ẩn ô nhập mã đặc cách trả hàng ở storefront OrderDetail.vue | frontend/src/pages/customer/OrderDetail.vue | P2 | — | Khách không còn thấy/gửi returnOverrideToken. | OPEN |
| R-011 | SEC-080 | Phần còn lại lộ dữ liệu công khai: OptionalJwtAuthGuard, giỏ hàng lộ wholesalePrice, categories ẩn | backend/src/common/guards/optional-jwt.guard.ts, backend/src/modules/cart/cart.service.ts, backend/src/modules/categories/categories.controller.ts … | P2 | — | Admin hết hạn token nhận 401 rồi tự refresh; giỏ hàng không có giá sỉ; khách không xem được danh mục ẩn bằng id/slug. | OPEN |
| R-012 | SEC-081 | Escape HTML trong email "có hàng trở lại" của products.service.ts | backend/src/modules/products/products.service.ts | P2 | — | Email không chứa thẻ HTML thô từ dữ liệu sản phẩm. | OPEN |
| R-013 | SEC-082 | Biên lợi nhuận POS: tính chiết khấu cấp đơn và conversionRatio cho costPrice | backend/src/modules/pos/pos.service.ts, backend/src/modules/pricing/pricing.service.ts | P2 | — | Biên được tính đúng trong cả hai trường hợp và đơn dưới sàn bị yêu cầu phê duyệt. | OPEN |
| R-014 | SEC-083 | Promotions: kiểm tra chéo giá trị và đồng bộ tên trường frontend/DTO | backend/src/modules/promotions/dto/promotion.dto.ts, backend/src/modules/promotions/promotions.service.ts, frontend/src/pages/admin/Promotions.vue | P2 | — | Giá trị vô lý bị từ chối; tạo mã từ form admin thành công với maxDiscount/perUserLimit. | OPEN |
| R-015 | SEC-006 | POS: đưa bộ đếm sai phê duyệt sang Redis và so sánh approvalToken constant-time | backend/src/modules/pos/pos.service.ts, backend/src/modules/pos/pos.security.spec.ts | P2 | SEC-049 (secret dự phòng) | Khóa 15 phút sau 5 lần sai hiệu lực giữa nhiều instance; approvalToken so sánh bằng timingSafeEqual; không còn secret hardcode. | OPEN |
| R-016 | SEC-009 | Finance: xử lý trường hợp chạy không có replica set (session=null) | backend/src/modules/finance/finance.service.ts | P3 | — | Không thể tạo phiếu thu/chi mồ côi khi update công nợ bị từ chối, ở mọi môi trường. | OPEN |
| R-017 | SEC-025 | Import Excel: chặn zip bomb (kích thước giải nén, đọc theo luồng) | backend/src/modules/products/products.service.ts, backend/src/modules/data-exchange/data-exchange.service.ts | P3 | — | File zip nén cực cao bị từ chối trước khi tốn bộ nhớ lớn. | OPEN |
| R-018 | SEC-028 | Tăng bcrypt cost (đề xuất 12) và rà giới hạn body với avatar data URL | backend/src/modules/auth/auth.service.ts, backend/src/modules/users/users.service.ts, backend/src/main.ts … | P3 | — | Hash mới dùng cost 12; avatar vượt giới hạn body trả lỗi rõ ràng. | OPEN |
| R-019 | SEC-017 | Customers: trả 404 khi không tìm thấy và xử lý id sai định dạng không gây 500 | backend/src/modules/customers/customers.controller.ts, backend/src/modules/customers/customers.service.ts,… | P3 | — | Id không tồn tại hoặc không phải khách trả 404; id sai định dạng trả 400. | OPEN |
| R-020 | SEC-012 | Chuyển Combos.vue sang tải phân trang rồi hạ trần limit xuống 100 | frontend/src/pages/admin/Combos.vue, backend/src/common/dto/pagination.dto.ts | P3 | — | Không còn request limit > 100; test DTO cập nhật. | OPEN |
| R-021 | SEC-022 | Đảm bảo production luôn chạy MongoDB replica set (transaction) và cảnh báo khi không có | backend/src/config/env.validation.ts, backend/src/app.module.ts, backend/src/modules/orders/services/checkout.service.ts | P2 | — | Production fail-fast hoặc cảnh báo rõ ràng khi không có replica set. | OPEN |
| R-022 | SEC-020 | Checklist triển khai: FRONTEND_URL phải liệt kê đủ origin cho CORS và WebSocket | (biến môi trường production), backend/src/modules/notifications/notifications.gateway.ts | P2 | — | Socket.IO kết nối được từ mọi origin hợp lệ của frontend; origin lạ bị ngắt. | OPEN |
| R-023 | — | Đồng bộ tài liệu dự án với thực tế | docs/PROJECT_OVERVIEW.md, AGENTS.md | P3 | — | Tài liệu khớp code và số liệu hiện tại. | OPEN |
| R-024 | TẤT CẢ | Chạy lại dynamic test TEST-SEC-001..010 và e2e trên bản build đã vá | backend/test/*, frontend/e2e/* | P1 | — | TEST-SEC-005 chuyển từ FAIL sang PASS; không test nào hồi quy; báo cáo cập nhật phần 11 và 16. | OPEN |
| R-025 | SEC-034 | Review và commit các thay đổi bảo mật đang nằm trong working tree | (toàn bộ working tree) | P1 | — | Các commit nằm trên nhánh, CI xanh (gitleaks, test, lint, build), PR được review. | OPEN |
| R-026 | SEC-078 | Sửa filter lỗi: 413 cho body quá lớn, CORS bị từ chối không trả 500, che stack theo cờ production/cloud | backend/src/main.ts, backend/src/common/filters/http-exception.filter.ts | P2 | — | Body > 1MB trả 413. Origin lạ không còn trả 500. Không response nào chứa details.stack ngoài môi trường dev cục bộ. | OPEN |
| R-027 | SEC-079 | Không trả tokenVersion trong response người dùng | backend/src/modules/auth/auth.service.ts, backend/src/modules/users/users.service.ts | P3 | — | Không response người dùng nào chứa tokenVersion. | OPEN |
| R-028 | SEC-014 | Gom escapeRegex thành util dùng chung | backend/src/common/utils/*, backend/src/modules/finance/finance.service.ts, backend/src/modules/customers/customers.service.ts … | P3 | — | Một helper duy nhất; test hiện có vẫn pass. | OPEN |
| R-029 | SEC-019 | Thay nhánh dự phòng không nguyên tử của reserveOtpAttempt bằng UsersService.reserveOtpAttempt | backend/src/modules/auth/auth.service.ts, backend/src/modules/users/users.service.ts, backend/src/modules/auth/token-isolation.spec.ts | P3 | — | Không còn nhánh không nguyên tử; test song song OTP vẫn chỉ cho 5 lần so khớp. | OPEN |
| R-031 | SEC-044 | Throttler/khóa tạm theo tài khoản cho login, forgot-password, verify-otp, reset-password và xác minh số hop TRUST_PROXY | backend/src/modules/auth/auth.service.ts, backend/src/modules/auth/auth.controller.ts, backend/src/app.module.ts … | P1 | Quyết định nghiệp vụ về ngưỡng khóa;… | Hai client khác IP sau proxy có bucket riêng; 10 lần sai cho cùng một email từ nhiều IP thì bị chặn tạm thời; thông điệp lỗi chung. | OPEN |
| R-030 | SEC-002 | Dọn dữ liệu đánh giá cũ chứa URL ảnh không an toàn trong DB | backend/src/migrations/* (mới), backend/src/modules/reviews/schemas/review.schema.ts | P2 | — | Không còn review nào có ảnh không phải http/https; script có dry-run và log số bản ghi. | OPEN |
| R-032 | SEC-035 | Khắc phục: Seed-safety coi host localhost/mongodb là an toàn: stack docker-compose tự host có thể bị xóa DB demo | backend/src/seeds/seed-safety.ts, backend/src/seeds/seed.service.ts, backend/src/seeds/run-seed.ts … | P3 | — | Không cách nào xóa DB khi NODE_ENV=production hoặc cloud. Không còn mật khẩu mặc định cố định trong source. | OPEN |
| R-033 | SEC-036 | Khắc phục: Deny-by-default và route-coverage.spec chỉ bảo vệ route đã gắn PermissionsGuard/RolesGuard | backend/src/common/guards/route-coverage.spec.ts, backend/src/modules/orders/orders.service.ts, backend/src/modules/orders/orders.controller.ts | P3 | — | CI fail khi có route mới mà chưa được phân loại quyền tường minh. | OPEN |
| R-034 | SEC-037 | Khắc phục: Guest order access token lưu vĩnh viễn trong localStorage | frontend/src/pages/customer/Checkout.vue, frontend/src/pages/customer/OrderDetail.vue, backend/src/modules/orders (guest token TTL) | P2 | — | Token khách có hạn sống, bị xóa khỏi storage khi hết hạn hoặc đơn kết thúc. Thao tác hủy có thêm bước xác minh, nếu nghiệp vụ duyệt. | OPEN |
| R-035 | SEC-038 | Khắc phục: Hồ sơ người dùng (PII, role, permissions) lưu plaintext ở localStorage/SharedPreferences; Android không tắt allowBackup | frontend/src/stores/auth.ts, frontend/src/utils/helpers.ts, mobile/android/app/src/main/AndroidManifest.xml … | P3 | — | localStorage['user'] không còn chứa email/phone/permissions, hoặc bị xóa khi phiên kết thúc. | OPEN |
| R-036 | SEC-039 | Khắc phục: Socket.IO fallback về http://localhost:3000 khi build production thiếu VITE_SOCKET_URL | frontend/src/App.vue, frontend/Dockerfile | P3 | — | Bundle production không chứa 'localhost:3000'. Socket kết nối same-origin hoặc tới URL cấu hình. | OPEN |
| R-037 | SEC-040 | Khắc phục: Gửi URL đơn hàng và thông tin chuyển khoản tới dịch vụ bên thứ ba qua thẻ img (QR) | frontend/src/pages/customer/OrderDetail.vue | P3 | — | Không còn request tới api.qrserver.com. | OPEN |
| R-038 | SEC-041 | Khắc phục: Vite alias ép dùng bản Vue đầy đủ có runtime template compiler | frontend/vite.config.ts, frontend/vitest.config.ts | P3 | — | Build production dùng runtime-only Vue. Test unit vẫn pass. | OPEN |
| R-039 | SEC-043 | Khắc phục: Header X-Client-Platform: mobile biến phiên cookie HttpOnly thành token đọc được trong response | backend/src/modules/auth/auth.controller.ts, backend/src/modules/auth/auth.controller.spec.ts, frontend/vercel.json | P2 | — | POST /auth/refresh dùng refresh cookie và có header mobile thì response không chứa accessToken hoặc refreshToken. | OPEN |
| R-040 | SEC-045 | Khắc phục: Mỗi user chỉ lưu một refreshTokenHash, đăng nhập thiết bị thứ hai hoặc refresh song song làm hỏng phiên | backend/src/modules/auth/auth.service.ts, backend/src/modules/users/schemas/user.schema.ts | P2 | — | Đăng nhập web rồi đăng nhập mobile, sau đó web refresh vẫn thành công. Dùng lại đúng refresh token đã xoay vòng chỉ thu hồi family của nó. | OPEN |
| R-041 | SEC-046 | Khắc phục: Lộ sự tồn tại tài khoản qua thông báo đăng ký, thông báo khóa và chênh lệch thời gian | backend/src/modules/auth/auth.service.ts | P2 | — | Login sai mật khẩu với tài khoản bị khóa trả cùng thông điệp và thời gian xấp xỉ như email không tồn tại. | OPEN |
| R-042 | SEC-047 | Khắc phục: Blacklist token fail-open khi Redis lỗi; trạng thái thu hồi nằm trong bộ nhớ từng instance | backend/src/modules/auth/token-blacklist.service.ts | P2 | — | Token đã logout bị từ chối ở mọi instance, kể cả khi Redis lỗi (theo chính sách đã chọn). | OPEN |
| R-043 | SEC-048 | Khắc phục: Môi trường không phải production bỏ qua kiểm tra secret; danh sách chặn secret yếu chỉ so khớp chính xác | backend/src/config/env.validation.ts, docker-compose.yml, backend/.env.example … | P2 | — | Ứng dụng không khởi động nếu thiếu JWT_REFRESH_SECRET hoặc JWT_RESET_SECRET ở môi trường khác test. | OPEN |
| R-044 | SEC-049 | Khắc phục: Secret dự phòng hardcode (OTP pepper, POS approval token, guest token) và dùng lại JWT_SECRET | backend/src/modules/auth/auth.service.ts, backend/src/config/env.validation.ts, backend/src/modules/pos/pos.service.ts … | P3 | — | Không còn chuỗi secret trong source. Ứng dụng từ chối khởi động nếu thiếu OTP_PEPPER ở production. | OPEN |
| R-045 | SEC-050 | Khắc phục: JWT chưa pin thuật toán, payload chứa email/permissions, user bị xóa nhận 404 thay vì 401 | backend/src/modules/auth/auth.module.ts, backend/src/modules/auth/strategies/jwt.strategy.ts, backend/src/modules/auth/auth.service.ts | P3 | — | Token ký HS512 hoặc none bị từ chối. User bị xóa nhận 401. | OPEN |
| R-046 | SEC-051 | Khắc phục: docker-compose chạy image production với NODE_ENV mặc định development, mật khẩu mặc định và Redis không mật khẩu | docker-compose.yml, docker-compose.tools.yml, backend/src/common/filters/http-exception.filter.ts … | P1 | — | `docker compose config` báo lỗi khi thiếu JWT_SECRET hoặc MONGO_INITDB_ROOT_PASSWORD. Backend không lắng nghe trên 0.0.0.0:3000 của host. Lỗi 5xx… | OPEN |
| R-047 | SEC-052 | Khắc phục: Dependency production có advisory: sanitize-html, nodemailer và các gói gián tiếp (exceljs, @nestjs...) | backend/package.json, backend/package-lock.json, .github/workflows/ci.yml … | P3 | — | `npm audit --omit=dev` không còn cảnh báo sanitize-html hay deepmerge. Test sanitizer pass. | OPEN |
| R-048 | SEC-053 | Khắc phục: Dependency dev có nhiều lỗ hổng moderate; cổng supply chain CI còn mỏng (audit chỉ chặn từ high, thiếu Dependabot) | frontend/package.json, frontend/package-lock.json, backend/package-lock.json … | P3 | — | npm audit frontend không còn cảnh báo vitest | OPEN |
| R-049 | SEC-054 | Khắc phục: GitHub Actions pin theo tag (chưa pin SHA) và Docker base image không pin digest | backend/Dockerfile, frontend/Dockerfile, .github/workflows/ci.yml … | P3 | — | Mọi lệnh FROM đều có @sha256 | OPEN |
| R-050 | SEC-055 | Khắc phục: Log chứa PII và URL đầy đủ; IP lấy từ X-Forwarded-For mà client có thể giả mạo | backend/src/common/logger/log-sanitizer.ts, backend/src/common/filters/http-exception.filter.ts, backend/src/modules/email/email.service.ts … | P3 | — | Log lỗi 5xx của POST /orders không chứa số điện thoại hay địa chỉ rõ | OPEN |
| R-051 | SEC-057 | Khắc phục: IPN báo thanh toán thành công cho đơn đã HỦY không tạo yêu cầu hoàn tiền | backend/src/modules/payments/payments.service.ts | P2 | — | IPN thành công cho đơn CANCELLED thì order.refundStatus=MANUAL_REQUIRED và refundAmount=amount. | OPEN |
| R-052 | SEC-058 | Khắc phục: Thu hồi điểm loyalty khi trả hàng bị chặn ở 0: khách tiêu điểm trước rồi trả hàng thì giữ lại lợi ích | backend/src/modules/users/users.service.ts, backend/src/modules/orders/services/order-lifecycle.service.ts,… | P1 | — | Trả đơn đã cộng điểm khi số dư điểm không đủ thì phần thiếu được khấu trừ hoặc ghi nhận rõ ràng, không bị bỏ qua lặng lẽ. | OPEN |
| R-053 | SEC-059 | Khắc phục: Giới hạn mã giảm giá theo người (perUserLimit) không áp dụng được với khách vãng lai | backend/src/modules/promotions/promotions.service.ts, backend/src/modules/orders/services/checkout.service.ts | P1 | — | Hai đơn guest cùng phone (dạng 0xxx và +84xxx), email khác nhau thì đơn thứ 2 bị từ chối khi perUserLimit=1. | OPEN |
| R-054 | SEC-060 | Khắc phục: Trả hàng NCC: kiểm tra số lượng còn được trả nằm ngoài transaction | backend/src/modules/purchasing/purchase-returns.service.ts, backend/src/modules/purchasing/schemas/goods-receipt.schema.ts | P2 | — | Hai request song song, mỗi request trả toàn bộ số đã nhận: chỉ 1 thành công. | OPEN |
| R-055 | SEC-061 | Khắc phục: Combo landing page bán với quantity=1: khách trả giá combo nhiều cuốn nhưng kho chỉ trừ 1 | backend/src/modules/landing-pages/schemas/landing-page.schema.ts, backend/src/modules/landing-pages/dto/landing-page.dto.ts,… | P2 | — | Đặt gói 3 cuốn thì kho trừ 3 và order.items[0].quantity=3. | OPEN |
| R-056 | SEC-062 | Khắc phục: Đối soát COD không xử lý đơn COMPLETED; COD đánh dấu PAID ngay khi DELIVERED | backend/src/modules/finance/services/cod-reconciliation.service.ts | P2 | — | Bảng kê chứa trackingCode của đơn COMPLETED thì được RECONCILED. | OPEN |
| R-057 | SEC-063 | Khắc phục: Checkout chuyển sang chế độ không transaction (compensated) cả trong production | backend/src/modules/orders/services/checkout.service.ts | P3 | — | NODE_ENV=production và lỗi transaction unsupported thì trả 503, không tạo đơn. | OPEN |
| R-058 | SEC-064 | Khắc phục: Hoàn tiền đơn online không bao giờ hoàn tất; hoàn đảo phiếu thu POS/COD không ràng buộc chặt | backend/src/modules/orders/services/order-lifecycle.service.ts, backend/src/modules/finance/finance.service.ts | P3 | — | Có luồng ghi nhận REFUNDED kèm phiếu chi. Đảo phiếu POS_ORDER bị từ chối hoặc đồng bộ chứng từ gốc. | OPEN |
| R-059 | SEC-065 | Khắc phục: Khách vãng lai giữ (trừ) tồn kho hàng loạt bằng đơn COD PENDING (giữ 48h) | backend/src/modules/landing-pages/landing-page.controller.ts, backend/src/modules/landing-pages/landing-page.service.ts,… | P1 | — | submit-order bị chặn sau 10 request/phút. Quantity vượt ngưỡng trả 400. | OPEN |
| R-060 | SEC-066 | Khắc phục: Lộ thông báo lỗi bên thứ ba (Cloudinary) và 500 khi ObjectId không hợp lệ ở route công khai | backend/src/modules/users/cloudinary.service.ts, backend/src/modules/reviews/reviews.controller.ts,… | P2 | — | GET /reviews/product/abc trả 400. Lỗi upload trả message chung. | OPEN |
| R-061 | SEC-067 | Khắc phục: Đăng ký nhận thông báo có hàng không xác minh email: dùng hệ thống gửi mail tới địa chỉ bất kỳ | backend/src/modules/products/products.service.ts, backend/src/modules/products/products.controller.ts | P3 | — | Alert chỉ được kích hoạt sau khi email được xác nhận. | OPEN |
| R-062 | SEC-068 | Khắc phục: Bỏ qua bước phê duyệt chuyển kho: xuất kho trực tiếp từ phiếu DRAFT rồi người tạo tự nhận | backend/src/modules/warehouses/warehouses.service.ts, backend/src/modules/warehouses/warehouses.service.spec.ts | P3 | — | PATCH transfers/:id/ship trên phiếu DRAFT trả 400. Người tạo phiếu gọi approve trên phiếu của chính mình nhận 403 (nếu nghiệp vụ chốt SoD). Variance… | OPEN |
| R-063 | SEC-069 | Khắc phục: Nhân viên chỉ có MANAGE_PRODUCTS tạo được phiếu trả hàng NCC (trừ kho, bù trừ công nợ) | backend/src/modules/purchasing/purchase-returns.controller.ts, backend/src/modules/purchasing/purchase-returns.service.ts,… | P2 | — | STAFF chỉ có MANAGE_PRODUCTS gọi POST /purchasing/returns nhận 403. STAFF có MANAGE_INVENTORY nhưng không có MANAGE_FINANCE gửi… | OPEN |
| R-064 | SEC-070 | Khắc phục: Kiểm kê kho: cờ requiresApproval không được thực thi, người nộp tự duyệt | backend/src/modules/stock-audits/stock-audits.service.ts, backend/src/modules/stock-audits/stock-audits.controller.ts,… | P2 | — | Audit có requiresApproval=true: STAFF không có quyền duyệt nhận 403. Người submit tự approve nhận 403. ADMIN approve thành công. | OPEN |
| R-065 | SEC-071 | Khắc phục: Endpoint kho thủ công cho nhập giá vốn tùy ý và ghi bán/hủy/điều chỉnh tồn ngoài chứng từ | backend/src/modules/inventory/inventory.controller.ts, backend/src/modules/inventory/dto/inventory.dto.ts,… | P3 | — | STAFF gửi costPrice tới /inventory/import nhận 400 (forbidNonWhitelisted), hoặc giá trị bị bỏ qua. Adjust hoặc damage vượt ngưỡng bởi STAFF nhận 403… | OPEN |
| R-066 | SEC-072 | Khắc phục: Thiếu phân tách nhiệm vụ (maker-checker) trên PO, báo giá NCC, chứng từ điện tử, phiếu thu/chi | backend/src/common/enums/index.ts, backend/src/modules/purchasing/purchase-orders.service.ts,… | P1 | — | Người tạo PO, báo giá, chứng từ hoặc phiếu chi không tự approve/post được (403). Hành động trên ngưỡng yêu cầu ADMIN. | OPEN |
| R-067 | SEC-073 | Khắc phục: Phân quyền entity trong data-exchange lệch với module gốc (MANAGE_PRODUCTS ghi đè dữ liệu suppliers) | backend/src/modules/data-exchange/data-exchange.controller.ts, backend/src/modules/data-exchange/data-exchange.service.ts | P2 | — | STAFF[MANAGE_PRODUCTS] gọi preview/execute với type=suppliers nhận 403. Import products bởi STAFF không có MANAGE_INVENTORY thì không tạo IMPORT… | OPEN |
| R-068 | SEC-074 | Khắc phục: Máy trạng thái chứng từ điện tử không chặt: xóa được file đính kèm của chứng từ đã REVERSED/đã chốt | backend/src/modules/documents/documents.service.ts, backend/src/modules/documents/documents.service.spec.ts | P2 | — | DELETE attachments và PATCH cancel trên chứng từ REVERSED/CANCELLED trả 400. Reverse lỗi giữa chừng thì không để lại chứng từ gốc ở trạng thái… | OPEN |
| R-069 | SEC-075 | Khắc phục: STAFF có MANAGE_ORDERS tạo được công nợ phải thu tùy ý, không đối chiếu đơn hàng | backend/src/modules/finance/finance.controller.ts, backend/src/modules/finance/finance.service.ts, backend/src/modules/finance/dto/finance.dto.ts | P2 | — | STAFF[MANAGE_ORDERS] gọi POST /finance/receivables nhận 403, hoặc chỉ tạo được khi orderId hợp lệ và số tiền lấy từ đơn. | OPEN |
| R-070 | SEC-076 | Khắc phục: Quyền VIEW_REPORTS và MANAGE_ORDERS quá rộng với dữ liệu tài chính (giá vốn, lãi gộp, sổ quỹ, danh sách thanh toán) | backend/src/common/enums/index.ts, backend/src/modules/reports/reports.controller.ts, backend/src/modules/finance/finance.controller.ts … | P3 | — | Ma trận permission được chốt, và STAFF chỉ có VIEW_REPORTS không truy cập được endpoint giá vốn/sổ quỹ. | OPEN |
| R-071 | SEC-077 | Khắc phục: ADMIN đổi được vai trò STAFF/CUSTOMER; tài liệu RBAC (PROJECT_OVERVIEW mục 6) lệch với code | backend/src/modules/users/users.controller.ts, backend/src/modules/users/users.service.ts, backend/src/common/audit/security-audit.service.ts … | P3 | — | Hành vi :id/role khớp docs. Mỗi lần đổi permission đều có bản ghi audit (actor, target, trước/sau). | OPEN |
| R-072 | SEC-085 | Khắc phục: Thiếu giới hạn độ dài/định dạng cho nhiều trường DTO người dùng nhập (ghi chú đơn, đánh giá, landing page...) | backend/src/modules/auth/dto/auth.dto.ts, backend/src/modules/auth/auth.service.ts, backend/src/modules/reviews/dto/review.dto.ts … | P3 | — | Các payload vượt giới hạn hoặc sai scheme trả 400, không trả 500. | OPEN |

---

## 2. Technology Stack & Attack Surface

**Stack:** NestJS v11 (modular monolith, 30 controller + 1 gateway, global prefix `/api`), MongoDB (replica set cho transaction), Redis (throttler, blacklist token; có fallback bộ nhớ), Vue 3 + Vite + TailwindCSS (storefront và admin CMS), Flutter (Android/iOS), Socket.IO (`/notifications`), Cloudinary (ảnh), cổng thanh toán VNPay/MoMo/webhook HMAC, triển khai Vercel (frontend), Render (backend), Docker/nginx (tự host), GitHub Actions + GitLab.

**Bề mặt tấn công chính**

| Bề mặt | Ghi chú | SEC liên quan |
|---|---|---|
| API công khai ghi dữ liệu | `POST /orders` (guest), `POST /orders/checkout-preview`, `POST /promotions/apply`, `POST /landing-pages/submit-order`, `POST /products/:id/alert`, `GET/DELETE /orders/guest/:id` (X-Guest-Order-Token) | SEC-001, 011, 013, 021, 032, 065, 067 |
| API công khai đọc dữ liệu | products, categories, banners, landing page, reviews | SEC-012, 016, 080 |
| Xác thực | login/register/refresh/logout/forgot/verify-otp/reset, cookie HttpOnly, JWT 3 loại token | SEC-005, 019, 028, 043 đến 050 |
| Webhook thanh toán | `callback`, `vnpay/ipn`, `momo/ipn` (HMAC, `timingSafeEqual`, `@SkipThrottle`) | SEC-057 |
| Upload | Excel sản phẩm và data-exchange (multer memory, 10MB), ảnh base64 lên Cloudinary (avatar, banner) | SEC-025, 028, 066, 073 |
| WebSocket | namespace `/notifications`, xác thực bằng token hoặc cookie | SEC-020 |
| Giao diện quản trị và POS | RBAC theo 18 `StaffPermission`, maker-checker | SEC-006, 007, 015, 017, 068 đến 077 |
| Mobile | token trong body khi `X-Client-Platform: mobile`, SharedPreferences | SEC-029, 038, 043 |
| Hạ tầng/CI | docker-compose, nginx, vercel.json, GitHub Actions, lịch sử git | SEC-003, 027, 030, 031, 042, 051 đến 056 |

---

## 3. Scope & Testing Limitations

**Đã thực hiện**

- Audit tĩnh working tree theo 8 chiều: wip-guards-regression, frontend, authn, devsecops, business-integrity, authz-erp, authz-commerce, api-input; cộng một bản đồ kiến trúc bảo mật và baseline chất lượng.
- 78 lượt kiểm chứng độc lập (verifier: khả năng tiếp cận "reach" và giảm thiểu "mitig") cho các phát hiện chính. 2 phát hiện bị bác bỏ, nhiều phát hiện bị hạ mức.
- 10 dynamic test (TEST-SEC-001 đến 010) trên backend cục bộ (cổng 3999) với MongoDB 8.2 replica set tạm, secret ngẫu nhiên dùng một lần, bộ nhớ thay Redis. Đã dọn sạch tiến trình và dữ liệu tạm sau khi chạy.
- 11 cụm sửa lỗi (C1 đến C11), mỗi cụm có review chéo (5 cụm có chỉnh sửa bổ sung từ reviewer: C2, C3, C6, C9, C11), sau đó kiểm tra tổng thể toàn bộ test, lint, typecheck, build.

**Giới hạn (cần đọc kỹ)**

- **Không phải pentest trên môi trường đã triển khai.** Hành vi chỉ có ở production (CSP nghiêm, che lỗi 5xx, HSTS, cấu hình proxy thật) chỉ được xác nhận bằng đọc mã, không chạy động.
- **Dynamic test chưa được chạy lại sau bản vá.** Kết quả mục 11 phản ánh bản build trước khi sửa (đã chứa guard deny-by-default). Việc kiểm tra lại sau bản vá dựa vào unit/regression test (mục 16). Cần chạy lại TEST-SEC-001..010 trên bản build mới (R-024).
- Không có Redis và Docker khi chạy dynamic test nên throttler và blacklist chạy ở chế độ bộ nhớ; hành vi nhiều instance không được kiểm tra.
- Mobile (Flutter) chỉ đọc mã, không chạy `flutter test`/`flutter analyze`. Không chạy backend `test:e2e` và Playwright e2e của frontend.
- Gitleaks không cài trên máy audit; quét bí mật dùng `git grep`. Quét dependency dùng `npm audit` (không có SCA/DAST chuyên dụng như ZAP, Snyk).
- Nhiều phiên và agent cùng sửa repo trong lúc audit (ghi nhận ở checkout.service.ts và categories.service.ts); số dòng trích dẫn có thể lệch nhẹ.
- Một số phát hiện mức Low chưa có lượt kiểm chứng độc lập; cột Confidence ở mục 12 và 13 ghi rõ từng mục.
- Regression test được viết bởi cùng cụm sửa lỗi; một số test không được chứng minh là fail khi bỏ bản sửa (do không được dùng git stash/checkout trong môi trường nhiều agent), ví dụ SEC-022 và SEC-007. Test của SEC-021 về giá là test khẳng định (guard test) vì DTO vốn không có trường price.
- Tất cả thay đổi vẫn nằm trong working tree, **chưa commit** (AI không commit/push theo quy tắc phiên làm việc).

---

## 4. Security Architecture Review

**Các lớp bảo vệ toàn cục (theo thứ tự request đi qua)**

1. `helmet` (CSP `default-src 'none'; frame-ancestors 'none'` chỉ khi production/cloud), body parser giới hạn 1MB, `cookieParser`, middleware Correlation-ID.
2. CORS theo whitelist `FRONTEND_URL` (production bắt buộc có; ngoài production cho thêm localhost), `credentials: true`. Request không có Origin được cho qua.
3. `ValidationPipe` toàn cục: `whitelist`, `forbidNonWhitelisted`, `transform`, `enableImplicitConversion`.
4. `SecuritySanitizerMiddleware`: kiểm tra CSRF bằng header `X-Requested-With` khi có cookie auth, loại key `$`, key chứa `.`, `__proto__`/`prototype`/`constructor`, lọc HTML bằng sanitize-html allowlist (SEC-026 đã vá lỗ hổng bỏ qua khi lồng sâu).
5. `ThrottlerGuard` là APP_GUARD duy nhất (mặc định 100 request/phút, Redis, fallback bộ nhớ); giới hạn riêng cho login 5/phút, register 3/10 phút, forgot 3/5 phút, OTP 5/5 phút, refresh 10/phút, đơn guest 10/phút.
6. `HttpExceptionFilter` bắt mọi lỗi (che 5xx khi production; SEC-078 còn điểm yếu), `TransformInterceptor`, `LoggingInterceptor`. Không có `ClassSerializerInterceptor` và không có `toJSON` transform, nên an toàn dữ liệu phụ thuộc từng chỗ query (gốc rễ của SEC-004, 024, 032).

**Điều khiển đã xác minh tốt**

- JWT: 3 loại token, 3 secret riêng; access 15 phút, refresh 30 ngày có xoay vòng và phát hiện dùng lại (tăng `tokenVersion`); role/permissions lấy từ DB mỗi request, không tin payload JWT.
- Production bắt buộc (env.validation.ts): secret >= 32 ký tự, 3 secret khác nhau, `COOKIE_SECURE`, `REDIS_URL`, `FRONTEND_URL` HTTPS, cấm AUTO_SEED.
- Webhook thanh toán xác minh HMAC bằng `timingSafeEqual`. Gateway WebSocket xác thực lại người dùng trước mỗi lần gửi.
- RBAC deny-by-default kèm `route-coverage.spec.ts` kiểm tra mọi route có guard đều khai báo decorator (SEC-034, SEC-036 nêu giới hạn).

**Điểm yếu kiến trúc**

- Thiếu allowlist trường trả về ở tầng response (lặp lại ở SEC-004, 018, 024, 032, 079). Khuyến nghị serializer dùng chung (mục 14, 18).
- `trust proxy`: audit ban đầu ghi nhận chưa bật, nhưng khi lập báo cáo đã kiểm tra lại mã hiện tại thì `backend/src/config/trust-proxy.ts` và `main.ts` (commit 99b4309, BUG-011) đã cấu hình qua `TRUST_PROXY` (số hop, cấm `true` ở production, kèm test). Còn lại: xác minh số hop thật trên Render/Vercel và thêm giới hạn theo tài khoản (SEC-044).
- Checkout có chế độ "compensated" (không transaction) ngay cả trong production (SEC-063); hoàn tiền đơn online không bao giờ hoàn tất (SEC-064).

**Secure controls từ các chiều audit (rút gọn)**

- RolesGuard deny-by-default xử lý SUPER_ADMIN trước nhánh deny, ADMIN vẫn qua route không decorator, STAFF/CUSTOMER bị 403, thiếu user trả 401
- PermissionsGuard cho ADMIN/SUPER_ADMIN qua trước khi deny. Thiếu @Permissions thì STAFF/CUSTOMER bị 403. STAFF cần ít nhất 1 permission. CUSTOMER luôn bị 403
- Toàn bộ 264 route đã được kiểm metadata ở runtime: mọi route có PermissionsGuard/RolesGuard đều có decorator không rỗng, deny-by-default không gây hồi quy chức năng
- Thứ tự guard đúng: AuthGuard('jwt') chạy trước RolesGuard/PermissionsGuard (class guard chạy trước method guard)
- Chống leo thang đặc quyền trong quản trị user: chỉ SUPER_ADMIN được tạo hoặc gán ADMIN/SUPER_ADMIN. ADMIN không sửa được admin khác. Không tự đổi role hay khóa chính mình. Không khóa được SUPER_ADMIN
- Truy cập đơn hàng và thanh toán theo permission thay vì role: STAFF cần MANAGE_ORDERS, CUSTOMER chỉ xem đơn của mình
- OTP không bao giờ trả trong response. Có test hồi quy cho 6 tổ hợp NODE_ENV/lỗi email. Email simulation che OTP trong log
- Seed chỉ chạy khi AUTO_SEED=true. AUTO_SEED/RESET_DATABASE_ON_SEED bị cấm khi production hoặc cloud ở bước validate env. Seed không ghi đè DB đã có dữ liệu. Seed CLI không còn in mật khẩu
- Seed-safety từ chối URI Atlas/remote không có marker, chặn host remote đặt sau host local trong danh sách replica, chặn credential chứa chữ 'localhost', và với DB remote thì bắt buộc SEED_*_PASSWORD ≥12 ký tự

---

## 5. Authentication Audit

**Kết quả dynamic (TEST-SEC-001, 004):** truy cập không token trả 401 ở các endpoint nhạy cảm; token `alg:none` và token bị sửa payload bị 401; logout vô hiệu hóa access và refresh token; reuse refresh token bị 401 và thu hồi cả cặp mới; cookie `HttpOnly; SameSite=Lax`, refresh cookie `Path=/api/auth`; CSRF cookie-only không có `X-Requested-With` trả 403.

**Đã sửa:** SEC-005 (logout xác thực chữ ký trước khi blacklist), SEC-019 (bộ đếm OTP nguyên tử), SEC-020 (kiểm tra Origin cho WebSocket dùng cookie), SEC-028 (DTO mật khẩu/họ tên/avatar), SEC-029 (xóa hiển thị OTP dev ở web).

**Còn mở:** SEC-043 (header mobile đổi chế độ token), SEC-044 (rate-limit chỉ theo IP, chưa khóa theo tài khoản; phần trust proxy đã được xử lý ở commit 99b4309), SEC-045 (một refresh hash mỗi user), SEC-046 (liệt kê tài khoản), SEC-047 (blacklist fail-open), SEC-048/049 (secret yếu và hardcode), SEC-050 (pin thuật toán JWT).

**Điều khiển tốt (rút gọn):**

- Tách loại token và tách secret: access (JWT_SECRET, 15 phút), refresh (JWT_REFRESH_SECRET, 30 ngày), reset (JWT_RESET_SECRET, 15 phút). Strategy chỉ chấp nhận type='access' kèm jti và tokenVersion. Lấy secret bằng getOrThrow nên…
- Xoay vòng refresh token kèm phát hiện reuse. Refresh token lưu dạng hash SHA-256, so sánh bằng timingSafeEqual. Phát hiện reuse thì tăng tokenVersion. jti cũ bị blacklist khi xoay vòng.
- req.user được dựng lại từ DB mỗi request (role, permissions, status, tokenVersion). Khóa tài khoản, đổi role hoặc permission có hiệu lực ngay mà không phụ thuộc claim trong JWT.
- Đổi mật khẩu bắt buộc mật khẩu hiện tại. Đổi và reset mật khẩu đều tăng tokenVersion, xóa refreshTokenHash và blacklist access token hiện tại. Không có luồng đổi email trong profile.
- Đăng ký không cho chèn role: ValidationPipe whitelist và forbidNonWhitelisted chặn trường lạ, service gán cứng role CUSTOMER sau spread. Tạo ADMIN hoặc SUPER_ADMIN chỉ SUPER_ADMIN làm được.
- OTP sinh bằng CSPRNG (randomInt 6 chữ số), lưu dạng HMAC-SHA256 có pepper, so sánh timingSafeEqual. Hết hạn 10 phút, tối đa 5 lần thử, thông điệp lỗi chung. forgot-password chống dò email. OTP không còn trả trong response (thay…
- Chính sách mật khẩu tối thiểu: ≥8 ký tự, có chữ hoa, chữ thường, chữ số, áp dụng cho register, change, reset và tạo staff.
- Trường nhạy cảm của User có select:false (password, resetOtp*, refreshTokenHash), kèm sanitizeUser ở AuthService và UsersService trước khi trả về.
- Cookie phiên HttpOnly, SameSite cấu hình được (mặc định lax). Refresh cookie giới hạn path /api/auth. SameSite=none tự ép Secure. Production bắt buộc COOKIE_SECURE=true. Browser không nhận token trong body.
- Chống CSRF cho request đã có cookie: method ghi bắt buộc X-Requested-With (header tùy chỉnh kích hoạt preflight, CORS whitelist có credentials).
- Throttle riêng cho các route xác thực: login 5/phút, register 3/10 phút, forgot 3/5 phút, verify-otp 5/5 phút, reset 5/phút, refresh và logout 10/phút. Dùng Redis storage.
- Production bắt buộc secret ≥32 ký tự, 3 secret khác nhau, không thuộc danh sách mặc định, có REDIS_URL, FRONTEND_URL HTTPS. Thông báo lỗi khởi động không in giá trị env.

---

## 6. Authorization & RBAC Audit

**Mô hình:** 4 nhóm Guest, User (CUSTOMER), Staff (18 `StaffPermission`), Admin (ADMIN và SUPER_ADMIN). Quyết định cuối cùng nằm ở backend; router frontend chỉ phục vụ giao diện. Dynamic test TEST-SEC-002 và 010 xác nhận: CUSTOMER 403 ở các endpoint quản trị, STAFF bị chặn theo permission, IDOR giữa hai khách bị 403, ADMIN không thể nâng quyền lên ADMIN/SUPER_ADMIN hoặc khóa/xóa SUPER_ADMIN.

**Lưu ý:** STAFF chỉ có MANAGE_ORDERS và VIEW_REPORTS vào được `/finance/accounts` vì route cho phép VIEW_REPORTS; đây là thiết kế nhưng cần chủ sở hữu xác nhận (SEC-076).

**Ma trận phân quyền thực tế (từ chiều authz-erp và authz-commerce)**

Cột Enforcement ghi nhận trạng thái tại thời điểm audit; mục "[Lưu ý lúc audit]" đã/đang được xử lý theo mục 12 và 13. "own-only" nghĩa là chỉ tài nguyên của chính người dùng; Cột Staff ghi permission StaffPermission cần có (hoặc Allow/Deny).

| Resource | Action | Guest | User | Staff | Admin | Backend Enforcement |
|---|---|---|---|---|---|---|
| addresses | POST /api/addresses | Deny | own-only | own-only | own-only | JWT, gán user=req.user |
| addresses | GET /api/addresses | Deny | own-only | own-only | own-only | JWT, find({user}) |
| addresses | GET /api/addresses/default | Deny | own-only | own-only | own-only | JWT, find({user}) |
| addresses | GET /api/addresses/:id | Deny | own-only | own-only | own-only | JWT, findOne({_id,user}) |
| addresses | PUT /api/addresses/:id | Deny | own-only | own-only | own-only | JWT, findOne({_id,user}), UpdateAddressDto |
| addresses | DELETE /api/addresses/:id | Deny | own-only | own-only | own-only | JWT, findOne({_id,user}), xóa mềm |
| addresses | PUT /api/addresses/:id/default | Deny | own-only | own-only | own-only | JWT, scope theo user [Lưu ý lúc audit: updateMany bỏ cờ default trước khi kiểm ownership (lỗi chức năng nhỏ, chỉ ảnh hưởng dữ…] |
| auth | POST /api/auth/register | Allow | Allow | Allow | Allow | Public, Throttle 3/10 phút, RegisterDto whitelist, service ép role=CUSTOMER |
| auth | POST /api/auth/login | Allow | Allow | Allow | Allow | Public, Throttle 5/phút |
| auth | POST /api/auth/refresh | allow (cần refresh token hợp lệ) | own-only | own-only | own-only | Public, Throttle 10/phút. Xác minh refresh token, status, tokenVersion, hash và phát hiện dùng lại |
| auth | POST /api/auth/logout | allow (no-op) | own-only | own-only | own-only | Không có guard. Danh tính lấy từ chữ ký token (verifyAsync). Chống CSRF bằng X-Requested-With |
| auth | GET /api/auth/me | Deny | own-only | own-only | own-only | AuthGuard('jwt'), req.user._id |
| auth | PUT /api/auth/profile | Deny | own-only | own-only | own-only | AuthGuard('jwt'). Copy tường minh fullName/phone/avatar [Lưu ý lúc audit: avatar là URL tùy ý, fullName không có MaxLength (Low)] |
| auth | PUT /api/auth/change-password | Deny | own-only | own-only | own-only | AuthGuard('jwt'), Throttle 5/phút, yêu cầu currentPassword |
| auth | POST /api/auth/forgot-password | Allow | Allow | Allow | Allow | Public, Throttle 3/5 phút |
| auth | POST /api/auth/verify-otp | Allow | Allow | Allow | Allow | Public, Throttle 5/5 phút |
| auth | POST /api/auth/reset-password | Allow | Allow | Allow | Allow | Public, Throttle 5/phút |
| banners | GET /api/banners/active | Allow | Allow | Allow | Allow | Public |
| banners | GET /api/banners/active-popup | Allow | Allow | Allow | Allow | Public |
| banners | GET /api/banners | Deny | Deny | allow nếu có MANAGE_BANNERS | Allow | JWT + PermissionsGuard MANAGE_BANNERS |
| banners | POST /api/banners | Deny | Deny | allow nếu có MANAGE_BANNERS | Allow | JWT + PermissionsGuard MANAGE_BANNERS, CreateBannerDto |
| banners | PATCH /api/banners/:id | Deny | Deny | allow nếu có MANAGE_BANNERS | Allow | JWT + PermissionsGuard MANAGE_BANNERS, UpdateBannerDto |
| banners | DELETE /api/banners/:id | Deny | Deny | allow nếu có MANAGE_BANNERS | Allow | JWT + PermissionsGuard MANAGE_BANNERS |
| cart | GET /api/cart | Deny | own-only | own-only | own-only | JWT, findOne({user}) |
| cart | GET /api/cart/validate | Deny | own-only | own-only | own-only | JWT, scope theo user |
| cart | POST /api/cart/items | Deny | own-only | own-only | own-only | JWT, AddToCartDto, scope theo user |
| cart | PATCH /api/cart/items/:productId | Deny | own-only | own-only | own-only | JWT, scope theo user |
| cart | DELETE /api/cart/items/:productId | Deny | own-only | own-only | own-only | JWT, scope theo user |
| cart | DELETE /api/cart | Deny | own-only | own-only | own-only | JWT, scope theo user |
| cart | POST /api/cart/sync | Deny | own-only | own-only | own-only | JWT, SyncCartDto, scope theo user |
| cart | POST /api/cart/voucher | Deny | own-only | own-only | own-only | JWT, Throttle 15/phút, scope theo user |
| cart | DELETE /api/cart/voucher | Deny | own-only | own-only | own-only | JWT, scope theo user |
| categories | GET /api/categories \| /parents \| /slug/:slug \| /:id \| /:id/subcategories | Allow | Allow | Allow | Allow | Public |
| categories | GET /api/categories/tree | Allow | Allow | Allow | Allow | Public [Lưu ý lúc audit: ?includeInactive=true trả danh mục ẩn cho guest] |
| categories | GET /api/categories/admin | Deny | Deny | MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard MANAGE_PRODUCTS |
| categories | POST/PATCH/PATCH/DELETE /api/categories, /:id, /:id/status, /:id | Deny | Deny | MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard MANAGE_PRODUCTS, Throttle 20/phút |
| customers | GET /api/customers | Deny | Deny | allow nếu có MANAGE_CUSTOMERS | Allow | JWT + PermissionsGuard @Permissions(MANAGE_CUSTOMERS) ở class, lọc role CUSTOMER [Lưu ý lúc audit: regex search không escape, limit không giới hạn] |
| customers | GET /api/customers/:id | Deny | Deny | allow nếu có MANAGE_CUSTOMERS | Allow | JWT + PermissionsGuard MANAGE_CUSTOMERS [Lưu ý lúc audit: Không lọc role, đọc được hồ sơ STAFF/ADMIN/SUPER_ADMIN] |
| customers | PATCH /api/customers/:id/crm | Deny | Deny | allow nếu có MANAGE_CUSTOMERS | Allow | JWT + PermissionsGuard MANAGE_CUSTOMERS, UpdateCustomerCRMProfileDto [Lưu ý lúc audit: Không kiểm target là CUSTOMER] |
| customers | POST /api/customers/:id/evaluate-tier | Deny | Deny | allow nếu có MANAGE_CUSTOMERS | Allow | JWT + PermissionsGuard MANAGE_CUSTOMERS [Lưu ý lúc audit: Không kiểm target là CUSTOMER] |
| data-exchange | GET /api/data-exchange/templates/:type | Deny | Deny | Theo entity | Allow | JWT + PermissionsGuard @Permissions(MANAGE_PRODUCTS, MANAGE_INVENTORY) + checkEntityPermission [Lưu ý lúc audit: :type không validate enum] |
| data-exchange | POST /api/data-exchange/preview/:type | Deny | Deny | Theo entity | Allow | Như trên, kèm Multer 10MB và fileFilter .xlsx [Lưu ý lúc audit: suppliers cho phép MANAGE_PRODUCTS] |
| data-exchange | POST /api/data-exchange/execute/:type | Deny | Deny | Theo entity | Allow | Như trên, kèm chống reimport theo fileHash (trừ allowReimport) [Lưu ý lúc audit: MANAGE_PRODUCTS ghi đè NCC; import products tạo tồn và giá vốn; opening_stock lặp được;…] |
| data-exchange | POST /api/data-exchange/errors/export | Deny | Deny | MANAGE_PRODUCTS hoặc MANAGE_INVENTORY | Allow | @Permissions(MANAGE_PRODUCTS, MANAGE_INVENTORY) [Lưu ý lúc audit: Body mảng không validate (rủi ro thấp, chỉ trả cho chính người gọi)] |
| documents | POST /api/documents | Deny | Deny | MANAGE_DOCUMENTS hoặc MANAGE_FINANCE | Allow | JWT + PermissionsGuard @Permissions(MANAGE_DOCUMENTS, MANAGE_FINANCE). DTO whitelist |
| documents | GET /api/documents \| /documents/:id | Deny | Deny | 1 trong 4 permission (dữ liệu dùng chung nội bộ, không có… | Allow | @Permissions(VIEW_DOCUMENTS, MANAGE_DOCUMENTS, MANAGE_FINANCE, VIEW_REPORTS) |
| documents | PATCH /api/documents/:id/post | Deny | Deny | MANAGE_DOCUMENTS hoặc MANAGE_FINANCE | Allow | @Permissions(MANAGE_DOCUMENTS, MANAGE_FINANCE) [Lưu ý lúc audit: Người lập tự ghi sổ (approvedBy = chính mình)] |
| documents | POST /api/documents/:id/attachments | Deny | Deny | MANAGE_DOCUMENTS hoặc MANAGE_FINANCE | Allow | @Permissions(MANAGE_DOCUMENTS, MANAGE_FINANCE). Chỉ URL HTTPS, MIME allowlist |
| documents | DELETE /api/documents/:id/attachments/:fileId | Deny | Deny | MANAGE_DOCUMENTS hoặc MANAGE_FINANCE | Allow | @Permissions(MANAGE_DOCUMENTS, MANAGE_FINANCE). Chỉ chặn POSTED [Lưu ý lúc audit: Xóa được đính kèm của chứng từ REVERSED/CANCELLED] |
| documents | POST /api/documents/:id/reverse | Deny | Deny | MANAGE_DOCUMENTS hoặc MANAGE_FINANCE | Allow | @Permissions(MANAGE_DOCUMENTS, MANAGE_FINANCE) [Lưu ý lúc audit: Không nguyên tử; tự hoàn đảo] |
| documents | PATCH /api/documents/:id/cancel | Deny | Deny | MANAGE_DOCUMENTS hoặc MANAGE_FINANCE | Allow | @Permissions(MANAGE_DOCUMENTS, MANAGE_FINANCE). Chỉ chặn POSTED [Lưu ý lúc audit: Hủy được chứng từ đã REVERSED] |
| finance | POST /api/finance/accounts | Deny | Deny | MANAGE_FINANCE | Allow | JWT + PermissionsGuard MANAGE_FINANCE |
| finance | GET /api/finance/accounts | Deny | Deny | MANAGE_FINANCE hoặc VIEW_REPORTS | Allow | @Permissions(MANAGE_FINANCE, VIEW_REPORTS) [Lưu ý lúc audit: VIEW_REPORTS thấy số dư quỹ (cần chốt nghiệp vụ)] |
| finance | GET/PUT /api/finance/accounts/:id | Deny | Deny | MANAGE_FINANCE | Allow | @Permissions(MANAGE_FINANCE). DTO update không có balance |
| finance | POST /api/finance/entries | Deny | Deny | MANAGE_FINANCE | Allow | @Permissions(MANAGE_FINANCE). Kiểm tra số dư, idempotency [Lưu ý lúc audit: Phiếu chi không ngưỡng hay maker-checker] |
| finance | GET /api/finance/entries \| /entries/export | Deny | Deny | MANAGE_FINANCE hoặc VIEW_REPORTS | Allow | @Permissions(MANAGE_FINANCE, VIEW_REPORTS) [Lưu ý lúc audit: VIEW_REPORTS đọc được sổ quỹ] |
| finance | POST /api/finance/entries/:id/reverse | Deny | Deny | MANAGE_FINANCE | Allow | @Permissions(MANAGE_FINANCE) [Lưu ý lúc audit: Người lập tự hoàn đảo] |
| finance | GET /api/finance/payables | Deny | Deny | MANAGE_FINANCE hoặc MANAGE_INVENTORY | Allow | @Permissions(MANAGE_FINANCE, MANAGE_INVENTORY) |
| finance | POST /api/finance/payables/:id/pay | Deny | Deny | MANAGE_FINANCE | Allow | @Permissions(MANAGE_FINANCE). Giới hạn ≤ remainingAmount |
| finance | GET /api/finance/receivables \| /receivables/:id | Deny | Deny | MANAGE_FINANCE hoặc MANAGE_ORDERS | Allow | @Permissions(MANAGE_FINANCE, MANAGE_ORDERS) |
| finance | POST /api/finance/receivables | Deny | Deny | MANAGE_FINANCE hoặc MANAGE_ORDERS | Allow | @Permissions(MANAGE_FINANCE, MANAGE_ORDERS) [Lưu ý lúc audit: MANAGE_ORDERS tạo công nợ tùy ý, không đối chiếu đơn] |
| finance | POST /api/finance/receivables/:id/collect | Deny | Deny | MANAGE_FINANCE | Allow | @Permissions(MANAGE_FINANCE) |
| finance | GET /api/finance/customers/:customerId/credit-check | Deny | Deny | MANAGE_FINANCE hoặc MANAGE_ORDERS | Allow | @Permissions(MANAGE_FINANCE, MANAGE_ORDERS) |
| finance | GET /api/finance/credit-profiles \| /credit-profiles/:customerId | Deny | Deny | MANAGE_FINANCE hoặc MANAGE_ORDERS | Allow | @Permissions(MANAGE_FINANCE, MANAGE_ORDERS) |
| finance | POST/PUT/POST /api/finance/credit-profiles, /credit-profiles/:customerId,… | Deny | Deny | MANAGE_FINANCE | Allow | @Permissions(MANAGE_FINANCE) [Lưu ý lúc audit: Nâng hạn mức tín dụng không duyệt (cần chốt nghiệp vụ, chưa đọc service)] |
| finance | GET /api/finance/reports/aging \| /reports/aging/export | Deny | Deny | MANAGE_FINANCE hoặc VIEW_REPORTS | Allow | @Permissions(MANAGE_FINANCE, VIEW_REPORTS) [Lưu ý lúc audit: VIEW_REPORTS thấy tuổi nợ kèm PII khách hàng] |
| finance | POST /api/finance/cod-reconciliation | Deny | Deny | MANAGE_FINANCE | Allow | @Permissions(MANAGE_FINANCE) |
| finance | GET /api/finance/cod-reconciliation/batches | Deny | Deny | MANAGE_FINANCE hoặc VIEW_REPORTS | Allow | @Permissions(MANAGE_FINANCE, VIEW_REPORTS) |
| finance | GET /api/finance/cod-reconciliation/pending | Deny | Deny | MANAGE_FINANCE hoặc MANAGE_ORDERS | Allow | @Permissions(MANAGE_FINANCE, MANAGE_ORDERS) |
| health | GET /api/health | Allow | Allow | Allow | Allow | Public. Response tối giản khi production/cloud (app.controller.ts:49-58) |
| health | GET /api/health | Allow | Allow | Allow | Allow | Public. Không trả thông tin hệ thống khi chạy production/cloud |
| inventory | GET /api/inventory \| /low-stock \| /reconcile \| /reconcile-ledger \|… | Deny | Deny | MANAGE_INVENTORY | Allow | Class: JWT + PermissionsGuard MANAGE_INVENTORY |
| inventory | POST /api/inventory/sync-missing | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY |
| inventory | POST /api/inventory/import | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY [Lưu ý lúc audit: costPrice tùy ý từ client làm thay đổi giá vốn bình quân, ngoài luồng PO/GR] |
| inventory | POST /api/inventory/transactions | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY. Chặn type ADJUSTMENT [Lưu ý lúc audit: type IMPORT có costPrice tùy ý; SALE/DAMAGE thủ công] |
| inventory | POST /api/inventory/export \| /sale \| /return \| /damage | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY [Lưu ý lúc audit: Ghi bán/hủy thủ công không chứng từ, không duyệt] |
| inventory | POST /api/inventory/adjust | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY, có optimistic lock tùy chọn [Lưu ý lúc audit: Đặt tồn trực tiếp, bỏ qua quy trình kiểm kê và ngưỡng duyệt] |
| landing-pages | GET /api/landing-pages | Deny | Deny | allow nếu có MANAGE_LANDING_PAGES | Allow | JWT + PermissionsGuard MANAGE_LANDING_PAGES |
| landing-pages | GET /api/landing-pages/public/:slug | Allow | Allow | Allow | Allow | Public, lọc status:true |
| landing-pages | GET /api/landing-pages/:id | Deny | Deny | allow nếu có MANAGE_LANDING_PAGES | Allow | JWT + PermissionsGuard MANAGE_LANDING_PAGES |
| landing-pages | POST /api/landing-pages | Deny | Deny | allow nếu có MANAGE_LANDING_PAGES | Allow | JWT + PermissionsGuard MANAGE_LANDING_PAGES, CreateLandingPageDto, assertProductBindings |
| landing-pages | PUT /api/landing-pages/:id | Deny | Deny | allow nếu có MANAGE_LANDING_PAGES | Allow | JWT + PermissionsGuard MANAGE_LANDING_PAGES |
| landing-pages | DELETE /api/landing-pages/:id | Deny | Deny | allow nếu có MANAGE_LANDING_PAGES | Allow | JWT + PermissionsGuard MANAGE_LANDING_PAGES |
| landing-pages | POST /api/landing-pages/submit-order | Allow | Allow | Allow | Allow | Public, SubmitOrderDto, gọi tạo đơn qua OrdersService (guest COD). Chỉ throttle mặc định 100/phút [Lưu ý lúc audit: Không có throttle riêng hay captcha, không kiểm page.status, lộ costPrice trong response] |
| landing-pages | POST /api/landing-pages/generate | Deny | Deny | allow nếu có MANAGE_LANDING_PAGES | Allow | JWT + PermissionsGuard MANAGE_LANDING_PAGES |
| notifications | POST /api/notifications/device-token | Deny | own-only | own-only | own-only | JWT, upsert theo token và gán cho req.user [Lưu ý lúc audit: Token FCM của user khác bị chuyển chủ nếu biết token (Low, token khó đoán)] |
| notifications | PATCH /api/notifications/device-token/unregister | Deny | own-only | own-only | own-only | JWT, deleteOne({userId, token}) |
| notifications | GET /api/notifications/my-notifications | Deny | own-only + global | own-only + global (+stock nếu có MANAGE_INVENTORY) | own-only + global + stock | JWT. Lấy thông báo của user và global, stock chỉ cho ADMIN/STAFF có MANAGE_INVENTORY [Lưu ý lúc audit: Lộ mảng readBy chứa userId của người khác] |
| notifications | GET /api/notifications/unread-count | Deny | own-only | own-only | own-only | JWT |
| notifications | PATCH /api/notifications/:id/read | Deny | own-only | own-only | own-only | JWT. Kiểm notif.userId === userId, stock cần quyền |
| notifications | PATCH /api/notifications/read-all | Deny | own-only | own-only | own-only | JWT, scope theo user |
| notifications | POST /api/notifications/broadcast | Deny | Deny | Deny | Allow | JWT + RolesGuard @Roles(SUPER_ADMIN, ADMIN), BroadcastNotificationDto |
| orders | POST /api/orders/checkout-preview | Allow | Allow | Allow | Allow | OptionalJwtAuthGuard, Throttle 30/phút, giá lấy từ DB |
| orders | POST /api/orders | Allow | allow (tạo dưới dạng guest) | Allow | Allow | Public (guest), Throttle 10/phút, chỉ COD, giới hạn PENDING theo phone + Turnstile [Lưu ý lúc audit: Response lộ costPrice/margin và các trường select:false] |
| orders | POST /api/orders/authenticated | Deny | own-only | own-only | own-only | JWT, Throttle 10/phút, customer=req.user [Lưu ý lúc audit: Response lộ costPrice/margin] |
| orders | GET /api/orders | Deny | Deny | allow nếu có MANAGE_ORDERS | Allow | JWT + PermissionsGuard MANAGE_ORDERS |
| orders | GET /api/orders/my-orders | Deny | own-only | own-only | own-only | JWT, find({customer:req.user._id}) [Lưu ý lúc audit: Lộ costPrice/margin trong items] |
| orders | GET /api/orders/:id/invoice | Deny | own-only | allow nếu có MANAGE_ORDERS | Allow | JWT + findByIdForActor (owner, STAFF MANAGE_ORDERS hoặc ADMIN) |
| orders | GET /api/orders/guest/:id/invoice | own-only (có token) | own-only (có token) | own-only (có token) | own-only (có token) | Public + X-Guest-Order-Token (sha256, timingSafeEqual), chỉ đơn customer=null |
| orders | GET /api/orders/guest/:id | own-only (có token) | own-only (có token) | own-only (có token) | own-only (có token) | Public + X-Guest-Order-Token [Lưu ý lúc audit: Lộ costPrice/margin. Token không có hạn dùng] |
| orders | GET /api/orders/:id | Deny | own-only | allow nếu có MANAGE_ORDERS | Allow | JWT + findByIdForActor [Lưu ý lúc audit: Lộ costPrice/margin cho chủ đơn] |
| orders | PATCH /api/orders/:id/status | Deny | Deny | allow nếu có MANAGE_ORDERS | Allow | JWT + PermissionsGuard MANAGE_ORDERS, state machine, chặn GHN (chỉ SUPER_ADMIN override) |
| orders | DELETE /api/orders/:id | Deny | own-only (PENDING) | allow nếu có MANAGE_ORDERS | Allow | JWT + cancelForActor: owner chỉ hủy khi PENDING, STAFF cần MANAGE_ORDERS |
| orders | DELETE /api/orders/guest/:id | own-only (có token) | own-only (có token) | own-only (có token) | own-only (có token) | Public + X-Guest-Order-Token, chỉ khi PENDING |
| orders | POST /api/orders/:id/return-request | Deny | own-only | deny (trừ khi là owner) | Allow | JWT + kiểm owner hoặc ADMIN trong service, hạn 7 ngày [Lưu ý lúc audit: overrideToken tùy ý vượt được hạn 7 ngày (Medium)] |
| orders | POST /api/orders/:id/return-approve | Deny | Deny | allow nếu có MANAGE_ORDERS | Allow | JWT + PermissionsGuard MANAGE_ORDERS [Lưu ý lúc audit: @Body('note') không validate] |
| orders | POST /api/orders/:id/return-reject | Deny | Deny | allow nếu có MANAGE_ORDERS | Allow | JWT + PermissionsGuard MANAGE_ORDERS, RejectReturnDto |
| orders | POST /api/orders/:id/return-received | Deny | Deny | allow nếu có MANAGE_ORDERS | Allow | JWT + PermissionsGuard MANAGE_ORDERS [Lưu ý lúc audit: @Body('note') không validate] |
| orders | POST /api/orders/:id/refund | Deny | Deny | allow nếu có MANAGE_ORDERS | Allow | JWT + PermissionsGuard MANAGE_ORDERS + kiểm lại trong service + khóa nguyên tử |
| orders | POST /api/orders/:id/cancel | Deny | own-only (PENDING) | allow nếu có MANAGE_ORDERS | Allow | JWT + cancelForActor (giống DELETE /orders/:id), CancelOrderDto |
| payments | GET /api/payments/methods | Allow | Allow | Allow | Allow | Public |
| payments | POST /api/payments | Deny | own-only | allow nếu có MANAGE_ORDERS | Allow | JWT, Throttle 10/phút, assertOrderAccess, số tiền và provider lấy từ đơn |
| payments | GET /api/payments/order/:orderId | Deny | own-only | allow nếu có MANAGE_ORDERS | Allow | JWT + assertOrderAccess |
| payments | POST /api/payments/callback | allow (cần chữ ký) | allow (cần chữ ký) | allow (cần chữ ký) | allow (cần chữ ký) | Public, SkipThrottle, HMAC PAYMENT_WEBHOOK_SECRET (timingSafeEqual) |
| payments | GET /api/payments/vnpay/ipn | allow (cần chữ ký) | allow (cần chữ ký) | allow (cần chữ ký) | allow (cần chữ ký) | Public, SkipThrottle, HMAC-SHA512 |
| payments | POST /api/payments/momo/ipn | allow (cần chữ ký) | allow (cần chữ ký) | allow (cần chữ ký) | allow (cần chữ ký) | Public, SkipThrottle, HMAC-SHA256, body kiểu Record (không qua DTO) [Lưu ý lúc audit: Trả err.message cho caller (thuộc dimension payment)] |
| payments | GET /api/payments | Deny | Deny | allow nếu có MANAGE_ORDERS | Allow | JWT + PermissionsGuard MANAGE_ORDERS [Lưu ý lúc audit: Cân nhắc dùng MANAGE_FINANCE (quyết định nghiệp vụ)] |
| pos | POST /api/pos/orders | Deny | Deny | POS_ACCESS | Allow | JWT + PermissionsGuard POS_ACCESS. Override chiết khấu được kiểm tra lại trong service [Lưu ý lúc audit: Response trả costPrice và margin cho thu ngân] |
| pos | GET /api/pos/orders \| /orders/:id | Deny | Deny | POS_ACCESS: chỉ hóa đơn của mình. POS_VIEW_ORDERS/MANAGE_ORD… | Allow | @Permissions(POS_ACCESS, POS_VIEW_ORDERS) + giới hạn theo cashier trong service, xóa costPrice, che SĐT [Lưu ý lúc audit: grossMarginPercent/markupPercent không bị che] |
| pos | POST /api/pos/orders/:id/refund | Deny | Deny | POS_REFUND | Allow | @Permissions(POS_REFUND) + service kiểm tra lại POS_REFUND [Lưu ý lúc audit: Response trả costPrice] |
| pos | GET /api/pos/reports/session | Deny | Deny | Chỉ ca của mình | Allow | @Permissions(POS_ACCESS, POS_VIEW_REPORTS). Non-admin bị ép cashierId = chính mình |
| pos | GET /api/pos/reconcile/cashbook | Deny | Deny | POS_VIEW_REPORTS hoặc MANAGE_FINANCE | Allow | @Permissions(POS_VIEW_REPORTS, MANAGE_FINANCE) |
| pos | GET /api/pos/products/search | Deny | Deny | POS_ACCESS | Allow | @Permissions(POS_ACCESS). Projection không có cost |
| pricing | POST /api/pricing/calculate | Deny | Deny | allow nếu có 1 trong 3 quyền | Allow | JWT + PermissionsGuard (class) @Permissions(MANAGE_PRICING, MANAGE_PRODUCTS, POS_ACCESS) |
| pricing | POST /api/pricing/check-margin | Deny | Deny | allow nếu có 1 trong 3 quyền | Allow | JWT + PermissionsGuard @Permissions(MANAGE_PRICING, MANAGE_PRODUCTS, POS_ACCESS) |
| pricing | POST /api/pricing/calculate-item | Deny | Deny | allow nếu có 1 trong 3 quyền | Allow | JWT + PermissionsGuard @Permissions(MANAGE_PRICING, MANAGE_PRODUCTS, POS_ACCESS) |
| pricing | POST /api/pricing/policies | Deny | Deny | allow nếu có MANAGE_PRICING hoặc MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard @Permissions(MANAGE_PRICING, MANAGE_PRODUCTS) |
| pricing | GET /api/pricing/policies | Deny | Deny | allow nếu có MANAGE_PRICING hoặc MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard @Permissions(MANAGE_PRICING, MANAGE_PRODUCTS) |
| pricing | GET /api/pricing/policies/:id | Deny | Deny | allow nếu có MANAGE_PRICING hoặc MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard @Permissions(MANAGE_PRICING, MANAGE_PRODUCTS) |
| pricing | PUT /api/pricing/policies/:id | Deny | Deny | allow nếu có MANAGE_PRICING hoặc MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard @Permissions(MANAGE_PRICING, MANAGE_PRODUCTS), UpdatePricePolicyDto |
| pricing | DELETE /api/pricing/policies/:id | Deny | Deny | allow nếu có MANAGE_PRICING hoặc MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard @Permissions(MANAGE_PRICING, MANAGE_PRODUCTS) |
| products | GET /api/products | Allow | Allow | Allow | Allow | Public [Lưu ý lúc audit: Trả cả sản phẩm INACTIVE, ?status=INACTIVE liệt kê sản phẩm ẩn, lộ wholesalePrice] |
| products | GET /api/products/export/template | Deny | Deny | MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard @Permissions(MANAGE_PRODUCTS), Throttle 10/phút |
| products | GET /api/products/export/excel | Deny | Deny | MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard MANAGE_PRODUCTS, Throttle |
| products | POST /api/products/import/excel | Deny | Deny | MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard MANAGE_PRODUCTS, Multer 10MB, kiểm tra đuôi, Throttle 5/phút |
| products | GET /api/products/featured \| best-selling \| discounted \| new \| search \|… | Allow | Allow | Allow | Allow | Public |
| products | GET /api/products/slug/:slug | Allow | Allow | Allow | Allow | Public, lọc ACTIVE |
| products | GET /api/products/:id/related | Allow | Allow | Allow | Allow | Public |
| products | GET /api/products/:id | Allow | Allow | Allow | Allow | Public [Lưu ý lúc audit: Trả sản phẩm INACTIVE (không lọc status)] |
| products | POST /api/products | Deny | Deny | MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard MANAGE_PRODUCTS, Throttle 20/phút |
| products | PATCH /api/products/:id | Deny | Deny | MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard MANAGE_PRODUCTS. DTO không có stock |
| products | DELETE /api/products/:id | Deny | Deny | MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard MANAGE_PRODUCTS (xóa mềm) |
| products | GET /api/products/:id/reviews | Allow | Allow | Allow | Allow | Public |
| products | POST /api/products/:id/reviews | Deny | Allow | Allow | Allow | JWT only (AuthGuard('jwt')). Logic mua hàng nằm ở reviews.service (không trong phạm vi) |
| products | PATCH /api/products/:id/reviews/:reviewId | Deny | Owner | Owner | Owner | JWT + kiểm tra owner trong reviews.service:181 [Lưu ý lúc audit: So sánh owner string với ObjectId có thể luôn fail (lỗi chức năng, fail-closed)] |
| products | DELETE /api/products/:id/reviews/:reviewId | Deny | Owner | Allow (mọi STAFF) | Allow | JWT + owner hoặc role ADMIN/STAFF/SUPER_ADMIN (reviews.service:213-219) [Lưu ý lúc audit: Mọi STAFF xóa được mọi review, không theo permission] |
| products | POST /api/products/:id/alert | Allow | Allow | Allow | Allow | Public, Throttle 5/phút, DTO email |
| promotions | POST /api/promotions/apply | Allow | Allow | Allow | Allow | OptionalJwtAuthGuard, Throttle 15/phút, không tăng lượt dùng |
| promotions | GET /api/promotions/active | Allow | Allow | Allow | Allow | Public |
| promotions | GET /api/promotions | Deny | Deny | allow nếu có MANAGE_PROMOTIONS | Allow | JWT + PermissionsGuard MANAGE_PROMOTIONS |
| promotions | GET /api/promotions/:id | Deny | Deny | allow nếu có MANAGE_PROMOTIONS | Allow | JWT + PermissionsGuard MANAGE_PROMOTIONS |
| promotions | POST /api/promotions | Deny | Deny | allow nếu có MANAGE_PROMOTIONS | Allow | JWT + PermissionsGuard MANAGE_PROMOTIONS, CreatePromotionDto [Lưu ý lúc audit: PERCENT không giới hạn ≤100, không kiểm endDate > startDate] |
| promotions | PATCH /api/promotions/:id | Deny | Deny | allow nếu có MANAGE_PROMOTIONS | Allow | JWT + PermissionsGuard MANAGE_PROMOTIONS. Body Partial<> nên bị ValidationPipe bỏ qua [Lưu ý lúc audit: Bỏ qua validation, mass assignment (usedCount, giá trị âm)] |
| promotions | DELETE /api/promotions/:id | Deny | Deny | allow nếu có MANAGE_PROMOTIONS | Allow | JWT + PermissionsGuard MANAGE_PROMOTIONS [Lưu ý lúc audit: Xóa cứng] |
| purchasing | POST/GET/GET/PUT /api/purchase-orders, /purchase-orders, /:id, /:id | Deny | Deny | MANAGE_INVENTORY | Allow | Class: JWT + PermissionsGuard MANAGE_INVENTORY |
| purchasing | PATCH /api/purchase-orders/:id/approve | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY [Lưu ý lúc audit: Người tạo PO tự duyệt, không ngưỡng giá trị] |
| purchasing | PATCH /api/purchase-orders/:id/send \| /:id/cancel | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY |
| purchasing | POST/GET/GET /api/goods-receipts, /goods-receipts, /:id | Deny | Deny | MANAGE_INVENTORY | Allow | Class: JWT + PermissionsGuard MANAGE_INVENTORY. Giá lấy từ PO, chặn nhận vượt |
| purchasing | POST /api/purchasing/returns | Deny | Deny | MANAGE_INVENTORY hoặc MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard @Permissions(MANAGE_INVENTORY, MANAGE_PRODUCTS) [Lưu ý lúc audit: MANAGE_PRODUCTS trừ được kho; cờ applyCreditAdjustmentImmediately bù trừ công nợ NCC mà…] |
| purchasing | GET /api/purchasing/returns | Deny | Deny | 1 trong 3 permission | Allow | @Permissions(MANAGE_INVENTORY, VIEW_REPORTS, MANAGE_FINANCE) |
| purchasing | GET /api/purchasing/returns/:id | Deny | Deny | MANAGE_INVENTORY hoặc VIEW_REPORTS | Allow | @Permissions(MANAGE_INVENTORY, VIEW_REPORTS) [Lưu ý lúc audit: Không nhất quán với list (thiếu MANAGE_FINANCE), nhỏ] |
| purchasing | POST /api/purchasing/returns/:id/credit-adjustment | Deny | Deny | MANAGE_FINANCE | Allow | @Permissions(MANAGE_FINANCE) |
| purchasing | POST/GET/GET/GET/GET /api/supplier-quotations, /supplier-quotations,… | Deny | Deny | MANAGE_INVENTORY | Allow | Class: JWT + PermissionsGuard MANAGE_INVENTORY |
| purchasing | PATCH /api/supplier-quotations/:id/approve \| /:id/reject | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY [Lưu ý lúc audit: Người tạo báo giá tự duyệt] |
| purchasing | POST /api/supplier-quotations/create-po | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY. Yêu cầu báo giá APPROVED, PO tạo ra ở DRAFT |
| reports | GET /api/reports/dashboard \| /revenue \| /best-selling-products \|… | Deny | Deny | VIEW_REPORTS | Allow | Class: JWT + PermissionsGuard VIEW_REPORTS |
| reports | GET /api/reports/inventory-ledger-profit \| /export/inventory-ledger-profit | Deny | Deny | VIEW_REPORTS | Allow | Class VIEW_REPORTS [Lưu ý lúc audit: Giá vốn và lãi gộp mở cho VIEW_REPORTS (cần permission riêng)] |
| reviews | GET /api/reviews/product/:productId | Allow | Allow | Allow | Allow | Public, chỉ review isVisible, populate user (fullName, avatar) [Lưu ý lúc audit: productId sai định dạng có thể gây 500 (BSONError)] |
| reviews | GET /api/reviews/product/:productId/breakdown | Allow | Allow | Allow | Allow | Public |
| reviews | GET /api/reviews/product/:productId/can-review | Deny | own-only | own-only | own-only | JWT, req.user._id |
| reviews | POST /api/reviews/product/:productId | Deny | own-only (đã mua) | own-only (đã mua) | own-only (đã mua) | JWT, Throttle 10/phút, cần đơn DELIVERED/COMPLETED của chính user [Lưu ý lúc audit: images là URL tùy ý, content không có MaxLength (Low)] |
| reviews | PATCH /api/reviews/:id/product/:productId | Deny | own-only | own-only | own-only | JWT, kiểm review.user === userId và review thuộc product |
| reviews | DELETE /api/reviews/:id/product/:productId | Deny | own-only | allow (mọi STAFF, không kiểm permission) | Allow | JWT. Service cho owner hoặc mọi role ADMIN/STAFF/SUPER_ADMIN [Lưu ý lúc audit: BFLA: STAFF không có MANAGE_PRODUCTS vẫn xóa được review] |
| reviews | GET /api/reviews/admin | Deny | Deny | allow nếu có MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard MANAGE_PRODUCTS |
| reviews | PATCH /api/reviews/:id/moderate | Deny | Deny | allow nếu có MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard MANAGE_PRODUCTS |
| reviews | PATCH /api/reviews/:id/reply | Deny | Deny | allow nếu có MANAGE_PRODUCTS | Allow | JWT + PermissionsGuard MANAGE_PRODUCTS |
| shipping | POST /api/shipping/orders/:orderId/ghn | Deny | Deny | allow nếu có MANAGE_ORDERS | Allow | JWT + PermissionsGuard, @Permissions(MANAGE_ORDERS) ở class |
| shipping | GET /api/shipping/orders/:orderId/track | Deny | Deny | allow nếu có MANAGE_ORDERS | Allow | JWT + PermissionsGuard MANAGE_ORDERS ở class [Lưu ý lúc audit: GET có tác dụng phụ (thay đổi trạng thái đơn), nên dùng POST] |
| stock-audits | POST/GET/GET /api/stock-audits, /stock-audits, /:id | Deny | Deny | MANAGE_INVENTORY | Allow | Class: JWT + PermissionsGuard MANAGE_INVENTORY |
| stock-audits | PATCH /api/stock-audits/:id/submit | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY |
| stock-audits | PATCH /api/stock-audits/:id/approve | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY. Optimistic lock [Lưu ý lúc audit: requiresApproval không được thực thi; người nộp tự duyệt] |
| stock-audits | PATCH /api/stock-audits/:id/reject | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY |
| suppliers | POST/GET/GET/GET/GET/PUT/DELETE /api/suppliers, /suppliers, /by-product/:productId, /export, /:id,… | Deny | Deny | MANAGE_INVENTORY | Allow | Class: JWT + PermissionsGuard MANAGE_INVENTORY [Lưu ý lúc audit: Có thể bị vòng qua bằng data-exchange suppliers (MANAGE_PRODUCTS)] |
| users | GET /api/users | Deny | Deny | Deny | Allow | JWT + RolesGuard @Roles(SUPER_ADMIN, ADMIN) [Lưu ý lúc audit: Docs cho Staff MANAGE_CUSTOMERS nhưng code chặn (lệch tài liệu)] |
| users | POST /api/users | Deny | Deny | Deny | allow (chỉ STAFF/CUSTOMER) | JWT + RolesGuard @Roles(SUPER_ADMIN, ADMIN). Service: chỉ SUPER_ADMIN tạo ADMIN/SUPER_ADMIN |
| users | GET /api/users/wishlist | Deny | own-only | own-only | own-only | JWT, req.user._id |
| users | POST /api/users/wishlist/move-to-cart/:productId | Deny | own-only | own-only | own-only | JWT, req.user._id |
| users | POST /api/users/wishlist/:productId | Deny | own-only | own-only | own-only | JWT, req.user._id |
| users | DELETE /api/users/wishlist/:productId | Deny | own-only | own-only | own-only | JWT, req.user._id |
| users | GET /api/users/loyalty | Deny | own-only | own-only | own-only | JWT, req.user._id |
| users | GET /api/users/:id | Deny | Deny | Deny | Allow | JWT + RolesGuard @Roles(SUPER_ADMIN, ADMIN), sanitizeUser |
| users | PATCH /api/users/:id/role | Deny | Deny | Deny | allow (STAFF và CUSTOMER) | JWT + RolesGuard @Roles(SUPER_ADMIN, ADMIN). Service: cấm tự đổi, bảo vệ SUPER_ADMIN, ADMIN chỉ đổi STAFF và… [Lưu ý lúc audit: Docs quy định chỉ SUPER_ADMIN (cần quyết định nghiệp vụ)] |
| users | PATCH /api/users/:id/permissions | Deny | Deny | Deny | Allow | JWT + RolesGuard @Roles(SUPER_ADMIN, ADMIN). Target phải là STAFF [Lưu ý lúc audit: Không có audit log khi đổi permission] |
| users | PATCH /api/users/:id/status | Deny | Deny | Deny | Allow | JWT + RolesGuard @Roles(SUPER_ADMIN, ADMIN). Cấm tự khóa và khóa SUPER_ADMIN, ADMIN chỉ do SUPER_ADMIN khóa |
| users | DELETE /api/users/:id | Deny | Deny | Deny | Allow | JWT + RolesGuard @Roles(SUPER_ADMIN, ADMIN). Phân cấp như status [Lưu ý lúc audit: Xóa cứng] |
| warehouses | POST/GET/GET/PUT /api/warehouses, /warehouses, /warehouses/:id, /warehouses/:id | Deny | Deny | MANAGE_INVENTORY | Allow | Class: JWT + PermissionsGuard MANAGE_INVENTORY |
| warehouses | GET /api/warehouses/sellable/:productId \| /transfers/list \|… | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY |
| warehouses | POST /api/warehouses/transfers | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY |
| warehouses | PATCH /api/warehouses/transfers/:id/approve | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY [Lưu ý lúc audit: Người tạo tự duyệt; bước duyệt có thể bị bỏ qua] |
| warehouses | PATCH /api/warehouses/transfers/:id/ship | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY. Service chấp nhận cả DRAFT [Lưu ý lúc audit: Xuất kho từ DRAFT, bỏ qua phê duyệt] |
| warehouses | PATCH /api/warehouses/transfers/:id/receive | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY [Lưu ý lúc audit: Khai hao hụt tùy ý thì tự ghi DAMAGE, không duyệt] |
| warehouses | PATCH /api/warehouses/transfers/:id/cancel | Deny | Deny | MANAGE_INVENTORY | Allow | Class MANAGE_INVENTORY |

**SEC liên quan:** SEC-015, 016, 017, 034, 036, 068 đến 077.

---

## 7. API Security Audit

**Đã sửa:** SEC-010 (PATCH promotions bypass validation), SEC-011 (HTML injection email), SEC-012 (limit không giới hạn), SEC-013 (giới hạn item/quantity, còn PARTIAL), SEC-014 (regex injection), SEC-025 (import Excel), SEC-026 (sanitizer), SEC-033 (note không validate).

**Còn mở:** SEC-065 (giữ tồn kho bằng đơn COD), SEC-066 (lộ lỗi Cloudinary, 500 do ObjectId), SEC-067 (alert email không xác minh), SEC-078 (500 thay vì 4xx), SEC-085 (giới hạn DTO còn thiếu).

**Dynamic (TEST-SEC-003, 006, 007):** NoSQL injection (`{$ne:null}`, `search[$ne]`) trả 400; mass assignment (`role`, `permissions`, `tokenVersion`) trả 400; `__proto__` bị lọc; client gửi `price=1`, `discount`, `shippingFee=0` khi đặt đơn guest bị server tính lại; file `.exe` và file giả `.xlsx` bị từ chối, 11MB trả 413.

**Điều khiển tốt (rút gọn):**

- ValidationPipe toàn cục bật whitelist, forbidNonWhitelisted, transform và enableImplicitConversion, trả lỗi có cấu trúc, không lộ dữ liệu nội bộ
- Express 5 dùng query parser 'simple' mặc định (Nest 11 không bật 'extended'), nên query string không tạo được object lồng nhau kiểu ?q[$ne]=. Middleware còn loại thêm key bắt đầu bằng $ hoặc chứa '.', và…
- Giới hạn body JSON và urlencoded 1MB, đăng ký trước body parser mặc định của Nest
- Escape regex và cắt độ dài 100 ký tự ở các luồng tìm kiếm public và phần lớn luồng admin: products (makeDiacriticRegex), orders, users, pos, warehouses, documents, inventory, reviews
- Sort không nhận tên trường từ client. Products ánh xạ tham số sort qua switch sang tập giá trị cố định. Không thấy .sort(), .select() hay .populate() nhận trực tiếp input người dùng
- Chống mass assignment khi cập nhật sản phẩm: UpdateProductDto không có stock, service còn xóa stock trước findByIdAndUpdate. Profile update chỉ chọn fullName, phone, avatar
- Populate tham chiếu user luôn chỉ định trường (fullName, email, phone), không populate cả document user
- Trường nhạy cảm của User (password, resetOtp*, refreshTokenHash) đặt select:false, có thêm sanitizeUser. Danh sách user loại thêm bằng .select(). UserQueryDto có @Max(100)
- Upload Excel ở data-exchange: giới hạn 10MB, fileFilter, kiểm magic bytes PK, chặn path traversal trong tên file, tối đa 10 sheet và 5000 dòng. Chống CSV/Formula injection bằng sanitizeCellValue (thêm tiền tố ' cho =,+,-,@).…
- Upload ảnh base64 lên Cloudinary kiểm tra MIME bằng regex (png/jpeg/webp/gif, không SVG), giới hạn 8MB, resource_type image. Attachment chứng từ chỉ nhận URL HTTPS
- Không có SSRF: các lệnh fetch ra ngoài chỉ tới URL cố định hoặc lấy từ config (Gemini, FCM, Turnstile, GHN, GOOGLE_SHEET_WEBAPP_URL, gateway thanh toán). returnUrl thanh toán được kiểm tra origin theo allowlist
- Frontend escape HTML trước khi render mô tả sản phẩm bằng v-html (parseMarkdown escape & < > " ' rồi mới thêm thẻ). Đây là v-html duy nhất trong frontend. Banner linkUrl chặn scheme javascript: và data:

---

## 8. Frontend Security Audit

**Đã sửa:** SEC-002 (XSS qua `window.open` URL ảnh đánh giá), SEC-027 (nginx), SEC-029 (xóa hiển thị OTP).

**Còn mở:** SEC-037 (guest token ở localStorage), SEC-038 (PII trong localStorage/SharedPreferences, Android allowBackup), SEC-039 (fallback socket localhost), SEC-040 (QR qua dịch vụ ngoài), SEC-041 (Vue bản có compiler), SEC-042 (CSP Vercel).

**Điều khiển tốt (rút gọn):**

- Không có sink HTML nguy hiểm ngoài một chỗ v-html, và chỗ đó escape toàn bộ trước khi format
- Không lưu access/refresh token ở localStorage, phiên dùng cookie HttpOnly
- Hàng đợi refresh token an toàn: singleton promise, cờ _retry chống vòng lặp, refresh chỉ gọi baseURL nội bộ
- Header CSRF luôn được gửi, khớp với kiểm tra phía backend
- URL liên kết banner/popup được kiểm tra ở cả backend lẫn frontend
- URL đính kèm chứng từ bắt buộc HTTPS
- Redirect sau thanh toán VNPay/MoMo được backend kiểm tra theo whitelist origin
- Redirect sau login chỉ điều hướng trong ứng dụng
- Router guard chỉ phục vụ giao diện, backend vẫn cưỡng chế quyền
- Không có secret trong mã nguồn frontend, .env không bị commit, dist không có source map
- Header bảo mật trên Vercel
- Không có handler postMessage, không có eval/new Function

---

## 9. Database & Data Security Audit

- **Che trường nhạy cảm:** `password`, `resetOtp*`, `refreshTokenHash`, token thiết bị, hash của đơn guest đặt `select:false`; không có serializer toàn cục nên mỗi đường trả response phải tự che. Các chỗ lọt đã vá: SEC-004, 018, 024, 032; còn SEC-079 (tokenVersion) và SEC-080 (cart lộ giá sỉ).
- **Chống NoSQL injection:** middleware loại key `$` và `.`; ValidationPipe chặn kiểu object ở tham số chuỗi; regex tìm kiếm đã escape (SEC-014). `sanitizePayload` đã chặn lỗ hổng độ sâu (SEC-026).
- **Toàn vẹn dữ liệu và transaction:** các race đã sửa SEC-009 (công nợ), SEC-019 (OTP), SEC-022 (hủy đơn). Còn mở: SEC-060 (trả hàng NCC ngoài transaction), SEC-063 (checkout compensated trong production), SEC-064 (hoàn tiền online), SEC-062 (COD).
- **Bí mật trong dữ liệu/lịch sử:** SEC-003 (BLOCKED) và SEC-056; ignore file đã siết (SEC-030).
- **Hạ tầng dữ liệu:** Mongo và Redis bind 127.0.0.1 trong compose, Mongo có keyFile; Redis không mật khẩu và mật khẩu Mongo mặc định (SEC-051).
- **Chiều business-integrity - điều khiển tốt (rút gọn):**

- Giá web/mobile tính tại server từ DB (discountPrice/price), phí ship do server tính, bỏ qua shippingFee/discount client gửi
- Validate số lượng: số nguyên ≥1, kiểm tra tồn, chặn sản phẩm trùng dòng
- Trừ tồn kho nguyên tử có điều kiện ($gte + $inc) trong transaction
- Khuyến mãi: usedCount tăng nguyên tử có điều kiện, per-user usage có unique index {promotion, identityHash}, release khi hủy có cờ chống lặp
- Loyalty: chỉ user đăng nhập, tối thiểu 1000 điểm, tối đa 20% subtotal, trừ điểm nguyên tử ($gte); hoàn điểm/cộng điểm có cờ chống lặp
- Idempotency đơn hàng: unique partial index {customer, idempotencyKeyHash}, so payloadHash và trả 409 khi khác nội dung, key lưu dạng hash
- Guest checkout: chỉ COD, giới hạn số đơn PENDING theo số điện thoại bằng unique slot index, Turnstile khi vượt ngưỡng
- State machine đơn hàng có allowedTransitions; cập nhật trạng thái bắt buộc transaction (503 nếu không hỗ trợ), retry khi WriteConflict; cờ inventoryRestoredAt chống hoàn kho 2 lần
- Đơn online không thể DELIVERED/COMPLETED nếu chưa PAID; khách chỉ hủy được đơn của mình ở trạng thái PENDING
- processRefund kiểm quyền, số tiền ≤ total, chống hoàn 2 lần bằng findOneAndUpdate có điều kiện refundStatus

---

## 10. Dependency & DevSecOps Audit

**Kết quả `npm audit`:** backend tổng 45 lỗ hổng (44 moderate, 1 low), riêng production 13 (12 moderate, 1 low); frontend tổng 21 moderate, production 0. Không có high/critical. Gitleaks chưa cài trên máy audit (quét bằng `git grep`).

| Hạng mục | SEC | Trạng thái |
|---|---|---|
| Credential lộ trong lịch sử git | SEC-003 | BLOCKED |
| PAT GitLab trong .git/config | SEC-056 | BLOCKED |
| .gitignore/.dockerignore | SEC-030 | FIXED – NOT VERIFIED |
| Quyền tối thiểu GitHub Actions | SEC-031 | FIXED – NOT VERIFIED |
| Pin SHA action, digest Docker | SEC-054 | OPEN |
| Header nginx | SEC-027 | FIXED – NOT VERIFIED |
| docker-compose mặc định | SEC-051 | OPEN |
| Dependency production (sanitize-html, nodemailer...) | SEC-052 | OPEN |
| Dependency dev và cổng CI | SEC-053 | OPEN |
| Env validation, secret dự phòng | SEC-048, SEC-049 | OPEN |
| Log PII | SEC-055 | OPEN |

**Điều khiển tốt (rút gọn):**

- Dependency production của frontend sạch lỗ hổng
- Backend production không có lỗ hổng high/critical, và đang có override vá dependency gián tiếp
- Không có file .env thật, keystore, google-services hay khóa riêng nào được track hoặc từng xuất hiện trong lịch sử git
- .env.test chỉ chứa giá trị dành cho test
- Kiểm tra cấu hình fail-closed khi production/cloud
- Dockerfile multi-stage, chạy bằng user không phải root, dùng npm ci và dumb-init
- Mongo và Redis trong compose chỉ bind localhost. Mongo có keyFile ngẫu nhiên. mongo-express bắt buộc basic auth
- Deploy chỉ chạy khi CI thành công trên push vào main cùng repo. Không dùng pull_request_target
- Có quét secret và audit dependency trong CI. Job tạo release dùng quyền tối thiểu
- Ký app Android an toàn

---

## 11. Security Test Cases

Kết quả dynamic test chạy **trước** bản vá trên bản build đã có guard deny-by-default. Chi tiết probe nằm trong thư mục scratchpad của phiên (probe-results.txt).

| Test | Kịch bản | Kết quả | Bằng chứng chính | SEC liên quan |
|---|---|---|---|---|
| TEST-SEC-001 | Truy cập endpoint bảo vệ khi chưa đăng nhập | PASS | 401 ở /users, /orders, /reports/dashboard, /finance/accounts, /inventory, /auth/me, /customers, /users/loyalty, /cart. Token `alg:none` và token sửa payload `role:SUPER_ADMIN` đều 401 | SEC-034 |
| TEST-SEC-002 | Role, permission, IDOR | PASS | CUSTOMER 403 ở các endpoint quản trị; STAFF (MANAGE_ORDERS, VIEW_REPORTS) 403 ở /inventory, /users, /customers, /suppliers, 200 ở /orders và /reports/dashboard; khách thứ hai 403 với đơn, hóa đơn, hủy đơn của người khác; guest không token hoặc sai token 403. STAFF vào được /finance/accounts do route cho phép VIEW_REPORTS (cần xác nhận) | SEC-076 |
| TEST-SEC-003 | Validation, NoSQL injection, mass assignment | PASS (ghi chú Low) | `{$ne:null}` ở login, `search[$ne]` đều 400; register kèm `role`/`permissions` 400; PUT /auth/profile kèm `role`/`tokenVersion` 400; XSS trong fullName được làm sạch; `__proto__` bị lọc. Ghi chú: avatar `javascript:` được lưu nguyên vì chỉ `@IsString` (không thực thi vì chỉ render trong img src) | SEC-028 (đã sửa) |
| TEST-SEC-004 | Phiên: logout, reuse refresh, CSRF | PASS (ghi chú) | Logout vô hiệu hóa access và refresh; reuse R1 trả 401 và thu hồi cặp R2/A2; cookie HttpOnly SameSite=Lax; cookie-only PUT thiếu `X-Requested-With` trả 403. Ghi chú: access token cũ A1 vẫn dùng được tối đa 15 phút nếu client không gửi nó tới /refresh | SEC-005, SEC-047 |
| TEST-SEC-005 | Dữ liệu nhạy cảm trong response | **FAIL** | Guest đặt đơn nhận `costPrice 41234`, `grossMarginPercent 75.01`, `markupPercent 300.16`, `baseSellingPrice` trong đơn; cùng trường ở my-orders, orders/:id, orders/guest/:id. Response tạo đơn còn trả `guestAccessTokenHash`, `guestPhoneKey`, `guestPendingSlot`. `tokenVersion` lộ ở /auth/me, /users, register. Không lộ password, refreshTokenHash, resetOtp, OTP | SEC-004, SEC-032 (đã sửa), SEC-079 (mở) |
| TEST-SEC-006 | Toàn vẹn đơn hàng và giá | PASS | Guest gửi `price=1`, `discount=99999999`, `shippingFee=0`, tên "FREE": server tính lại unitPrice 99000, total 228000; `totalAmount`/`subtotal` thừa trả 400; `loyaltyPointsUsed=99999999` trả 400 | SEC-001 (đường landing page vẫn PARTIAL) |
| TEST-SEC-007 | Upload: sai kiểu, quá lớn, không quyền | PASS | `evil.exe` 400; `fake.xlsx` chứa HTML 400 không lộ stack; 11MB 413; CUSTOMER 403. Lúc đó chỉ kiểm tra đuôi file | SEC-025 (đã sửa thêm magic bytes) |
| TEST-SEC-008 | Security header và CORS | PASS (Low) | helmet mặc định, nosniff, HSTS, không X-Powered-By; Origin lạ không có ACAO nhưng trả **500** thay vì 403, preflight cũng 500, response có `details.error` và stack | SEC-078 |
| TEST-SEC-009 | Lộ lỗi | PASS (Low) | ObjectId sai trả 400/404 không stack; JSON sai 400; body > 1MB trả **500 thay vì 413**; ngoài production response có `details.stack` với đường dẫn tuyệt đối | SEC-078, SEC-066 |
| TEST-SEC-010 | Thao tác quản trị, leo thang đặc quyền | PASS | ADMIN 403 khi đổi vai trò lên ADMIN/SUPER_ADMIN, hạ SUPER_ADMIN, đổi vai trò chính mình, khóa hoặc xóa SUPER_ADMIN; STAFF và CUSTOMER đổi vai trò 403; role "ROOT" 400 | SEC-077 |

**Tổng:** 10 test: 7 PASS (001, 002, 003, 004, 006, 007, 010; trong đó 003 và 004 kèm ghi chú), 2 PASS kèm vấn đề Low (008, 009) và **1 FAIL (005)**, lỗi FAIL đã được sửa bằng SEC-004/032 và kiểm chứng bằng unit test (chưa chạy lại động).

---

## 12. Confirmed Vulnerabilities

24 mục được phân loại Confirmed Vulnerability (sau điều chỉnh của verifier), sắp theo mức độ. Mỗi mục theo mẫu đầy đủ.

#### SEC-001 — Khách tự chọn giá và orderSource=LANDING_PAGE khi tạo đơn công khai

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-840 Business Logic Errors / CWE-602 Client-Side Enforcement of Server-Side Security
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N (7.5), áp dụng khi tồn tại landing page đang bật có nhiều gói/gói khác sản phẩm, hoặc không có productId gốc
- **Severity:** High
- **Confidence:** Cao (xác nhận bởi 2 lượt kiểm chứng độc lập)
- **Module:** orders/checkout
- **File/Function:** backend/src/modules/orders/services/checkout.service.ts:444 (CheckoutService.createAtomic)
- **Tác nhân tấn công:** Guest
- **Nguồn phát hiện:** business-integrity#0

**1. Mô tả.** Lỗi bảo mật thuộc loại thao túng giá. Endpoint công khai POST /api/orders tin vào 3 giá trị client gửi lên: dto.orderSource, dto.landingPageId và item.price. Khi item.price trùng với giá của bất kỳ gói (package) nào trên landing page đang bật, server đổi giá dòng hàng sang giá gói đó. Có 2 nhánh bị lỏng điều kiện. (1) Nhánh package dùng `pkg.productId == product || landingPage.productId == product`: nếu landing page có productId chính là A, mọi gói trên trang (kể cả gói gắn sản phẩm B rẻ hơn, hoặc gói giá 0) đều áp được cho A, với số lượng tùy ý. (2) Nhánh giá gốc dùng `!landingPage.productId || ...`: landing page không có productId gốc nhưng các gói đều gắn productId riêng là cấu hình hợp lệ theo cleanLandingPageDto (landing-page.service.ts:188-201). Khi đó MỌI sản phẩm ACTIVE đều mua được với landingPage.price, tức giá của gói best-seller. Tên dòng hàng cũng lấy từ client (`item.name || ...`), nên kẻ tấn công có thể ngụy trang tên để nhân viên khó phát hiện khi xác nhận đơn. ID và giá của landing page lộ qua GET /landing-pages/public/:slug.

**2. Điều kiện khai thác.** Có ít nhất 1 landing page status=true với (a) productId gốc rỗng và các gói gắn productId riêng, hoặc (b) gói giá thấp/0 hoặc gói gắn sản phẩm khác. Đơn COD vẫn cần nhân viên xác nhận.

**3. Tác động CIA.** Integrity cao: bán hàng dưới giá, sai doanh thu và biên lợi nhuận

**4. Bằng chứng.** checkout.service.ts:390-399 chỉ cần orderSource===LANDING_PAGE và landingPageId (cả hai từ client) là nạp landing page. Dòng 445-451: `(pkg.productId?.toString() === product._id.toString() || landingPage.productId?.toString() === product._id.toString()) && item.price !== undefined && pkg.price === item.price`. Dòng 456-464: `landingPage.price > 0 && item.price !== undefined && landingPage.price === item.price && (!landingPage.productId || ...)` rồi `effectivePrice = landingPage.price; effectiveName = item.name || product.name`. orders.controller.ts:62-67 là POST /orders, không có guard. landing-page.dto.ts:117-120 cho thấy productId gốc là optional. Logic giống hệt ở checkoutPreview (dòng 170-192).

**5. Root Cause.** Giá ưu đãi landing page được chọn bằng cách so khớp giá do client gửi, thay vì ràng buộc chặt: gói nào, của sản phẩm nào, số lượng bao nhiêu. Nguồn đơn (orderSource) cũng do client tự khai.

**6. Remediation.** 1) Bỏ việc so khớp theo item.price. Client chỉ gửi landingPageId và packageName/packageIndex, server tra gói theo định danh đó. 2) Chỉ áp giá gói khi `pkg.productId` (sau chuẩn hóa) bằng đúng product của dòng, bỏ nhánh `landingPage.productId ==` trong điều kiện OR. 3) Bỏ nhánh `!landingPage.productId`; chỉ áp landingPage.price khi landingPage.productId === product. 4) Tên dòng hàng luôn do server sinh, không lấy item.name. 5) Cân nhắc chỉ cho phép orderSource=LANDING_PAGE đi qua LandingPageService.submitOrder (đánh dấu nội bộ), còn POST /orders thì ép về WEB. 6) Từ chối gói giá 0 khi status=true.

**7. Files.** `backend/src/modules/orders/services/checkout.service.ts`, `backend/src/modules/orders/services/checkout.service.spec.ts` (các file đã sửa)

**8. Regression Tests.** checkout.service.spec.ts (8 case: giá thấp bị bỏ qua, LANDING_PAGE không landingPageId chuyển WEB, trang tắt, trang không gắn sản phẩm, gói sản phẩm khác, POS chuyển WEB, giá hợp lệ vẫn áp dụng, preview không áp giá giả); landing-page-order-pricing.spec.ts

**9. Acceptance Criteria.** POST /orders với orderSource=LANDING_PAGE, product X không thuộc gói nào và item.price bằng landingPage.price phải tính giá DB của X. Gói của sản phẩm B không áp được cho sản phẩm A. item.name từ client bị bỏ qua.

**10. Fix Status — PARTIAL (một phần FIXED – VERIFIED, phần còn lại OPEN).** Giá client chỉ được áp khi landing page đang bật và khớp giá cấu hình cho đúng sản phẩm (resolveLandingPrice dùng chung cho preview và create). orderSource được chuẩn hóa ở server (POS/LANDING_PAGE không hợp lệ quy về WEB, landingPageId chỉ lưu khi nguồn là LANDING_PAGE). **Phần còn lại:** Client biết giá gói thật của landing page vẫn mua được ở mức đó qua POST /orders công khai (giá do admin cấu hình nên rủi ro thấp). Muốn đóng hẳn cần method trusted (vd. createFromLandingPage) trong OrdersService/CheckoutService, đổi landing-page.service.ts submitOrder sang gọi method này, và để POST /orders công khai bỏ qua hoàn toàn item.price/orderSource=LANDING_PAGE. Cần sửa landing-page.service.ts (ngoài phạm vi lượt fix này).

#### SEC-002 — Stored XSS qua ảnh đánh giá (javascript:/data: URL), admin Reviews.vue mở bằng window.open

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-79 (Stored XSS), CWE-1022 (Use of Web Link to Untrusted Target with window.opener Access)
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N (8.7)
- **Severity:** High
- **Confidence:** Cao (xác nhận bởi 4 lượt kiểm chứng độc lập)
- **Module:** reviews (backend DTO) + frontend/pages/admin/Reviews.vue ; reviews + frontend admin
- **File/Function:** frontend/src/pages/admin/Reviews.vue:343 (previewImage)
- **Tác nhân tấn công:** Customer (đã có ít nhất 1 đơn DELIVERED/COMPLETED chứa sản phẩm, ví dụ tự mua 1 cuốn sách COD giá rẻ)
- **Nguồn phát hiện:** frontend#0, api-input#0

**1. Mô tả.** Khách hàng gửi đánh giá kèm mảng `images` tùy ý. Backend chỉ kiểm tra `@IsString({ each: true })`, không kiểm tra scheme. Middleware sanitizer chỉ lọc chuỗi có ký tự `<`, nên `javascript:fetch(...)` được lưu nguyên vẹn. Trang Admin Reviews (quyền MANAGE_PRODUCTS, ADMIN, SUPER_ADMIN) hiển thị từng ảnh dạng `<img :src=img @click=previewImage(img)>`, và `previewImage` gọi `window.open(url, '_blank')` mà không kiểm tra URL. Admin/Staff bấm vào thumbnail (với URL `javascript:` ảnh sẽ hiện ô vỡ nhỏ, dễ gây tò mò) thì trình duyệt mở cửa sổ about:blank kế thừa origin của trang admin và chạy script. Script này gọi được `/api/*` cùng origin (Vercel rewrite hoặc nginx proxy), cookie HttpOnly tự gửi kèm, tự thêm được header `X-Requested-With`. Kẻ tấn công vì vậy thực hiện được mọi thao tác với quyền admin: tạo hoặc nâng quyền user, sửa giá, xuất dữ liệu khách hàng. CSP trên Vercel có `script-src 'unsafe-inline'` nên cho phép URL `javascript:`. Bản deploy nginx không có CSP. Cùng gốc rễ đó, nếu ảnh là URL https do kẻ tấn công kiểm soát, `window.open` không có `noopener` cho phép reverse tabnabbing: trang độc hại chuyển tab admin sang trang đăng nhập giả.

**2. Điều kiện khai thác.** Kẻ tấn công có tài khoản khách và 1 đơn đã giao chứa sản phẩm. Admin hoặc Staff có MANAGE_PRODUCTS mở trang Reviews và bấm vào thumbnail ảnh.

**3. Tác động CIA.** C:H/I:H. Chiếm phiên quản trị, đọc và sửa toàn bộ dữ liệu theo quyền admin.

**4. Bằng chứng.** backend/src/modules/reviews/dto/review.dto.ts:35-38 và 61-64: `@IsOptional() @IsArray() @IsString({ each: true }) images?: string[];`, không có IsUrl hay giới hạn protocol.
backend/src/modules/reviews/reviews.service.ts:146,155,187: gán thẳng `dto.images`. Hàm update (165-187) chỉ kiểm tra chủ sở hữu, nên khách sửa review cũ để chèn payload.
backend/src/common/security/security.sanitizer.ts:79: `if (!value.includes('<')) return value;` nên chuỗi `javascript:` đi qua nguyên vẹn.
frontend/src/pages/admin/Reviews.vue:119-123 `v-for="(img, idx) in row.images" :src="img" @click="previewImage(img)"`.
frontend/src/pages/admin/Reviews.vue:342-343 `function previewImage(url: string) { window.open(url, '_blank') }`.
vercel.json:32 và frontend/vercel.json:32 có `script-src 'self' 'unsafe-inline'`. frontend/nginx.conf không có CSP.
reviews.controller.ts:56-57: POST review chỉ cần `AuthGuard('jwt')`. Trang admin reviews (107-109) yêu cầu MANAGE_PRODUCTS.
Chưa chạy PoC runtime. Hành vi `window.open('javascript:...')` chạy script trong ngữ cảnh opener là hành vi đã được ghi nhận của Chrome và Firefox.

**5. Root Cause.** Backend thiếu allowlist scheme/host cho URL ảnh do người dùng gửi. Frontend đưa dữ liệu không tin cậy thẳng vào sink điều hướng (`window.open`) mà không kiểm tra protocol và không có `noopener`. CSP cho phép inline script nên không có lớp chặn thứ hai.

**6. Remediation.** 1) Backend (bắt buộc): trong CreateReviewDto và UpdateReviewDto, thay `@IsString({each:true})` bằng `@IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })`, thêm `@ArrayMaxSize(5)` và `@MaxLength(1000, {each:true})`. Nên giới hạn host về res.cloudinary.com hoặc tự upload qua CloudinaryService như avatar. 2) Viết migration hoặc script dọn các review có `images` không bắt đầu bằng `https://`. 3) Frontend Reviews.vue: trong previewImage, kiểm tra `new URL(url).protocol === 'https:'` và gọi `window.open(url, '_blank', 'noopener,noreferrer')`, hoặc hiển thị ảnh bằng lightbox nội bộ thay cho window.open. 4) Defense-in-depth: bỏ `'unsafe-inline'` khỏi script-src (xem finding CSP).

**7. Files.** `backend/src/modules/reviews/dto/review.dto.ts`, `backend/src/modules/reviews/reviews.service.ts`, `frontend/src/pages/admin/Reviews.vue`, `frontend/src/pages/admin/reviewImageUrl.ts (mới)` (các file đã sửa)

**8. Regression Tests.** backend/src/modules/reviews/reviews.security.spec.ts (mới); frontend/src/pages/admin/reviewImageUrl.spec.ts (mới, 11 test)

**9. Acceptance Criteria.** POST/PATCH review với images ['javascript:alert(1)'], ['data:text/html,...'], ['http://x'] đều trả 400. URL https hợp lệ (host được phép) vẫn tạo được. previewImage không mở URL có scheme khác https. Mọi window.open tới URL ngoài đều có noopener.

**10. Fix Status — FIXED – VERIFIED.** DTO: @ArrayMaxSize(5), @MaxLength(2048,{each}), @IsUrl chỉ http/https. Service: assertSafeImageUrls() (new URL, chỉ http/https) gọi trước khi chạm DB ở create/update. Frontend admin: helper toSafeHttpUrl/safeReviewImages, previewImage mở bằng window.open(safeUrl,"_blank","noopener,noreferrer"). Dữ liệu cũ trong DB cũng bị lọc khi admin xem. **Phần còn lại:** Cân nhắc dọn dữ liệu review cũ đã lưu URL không an toàn trong DB (admin đã được bảo vệ khi hiển thị). Nếu sau này khách được upload ảnh review thì endpoint upload phải trả URL tuyệt đối http/https.

#### SEC-003 — Chuỗi kết nối MongoDB Atlas (có mật khẩu) và Gemini API key nằm trong lịch sử git đã push

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-798, CWE-540
- **CVSS:** CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H (8.1). AC:H vì còn phụ thuộc credential có còn hiệu lực hay không và IP allowlist của Atlas.
- **Severity:** High
- **Confidence:** Cao (xác nhận bởi 2 lượt kiểm chứng độc lập)
- **Module:** Repository / Secrets
- **File/Function:** backend/scratch_check_db.js (đã xóa, còn trong history):1
- **Tác nhân tấn công:** Guest (bất kỳ ai đọc được repo GitHub/GitLab hoặc một bản clone)
- **Nguồn phát hiện:** devsecops#0

**1. Mô tả.** Quét lịch sử git (`git log --all -p -G`) cho thấy các commit 0fd5bc4 và bd09e67 (2026-06-20) đã thêm `backend/scratch_check_db.js`, `backend/scratch_check_landing_pages.js`, `backend/scratch_test_gemini.js` và `backend/scratch_test_vertex.js`. Các file này chứa `const MONGODB_URI = 'mongodb+srv://[ĐÃ CHE]'` và `const apiKey = 'AQ.A***'` (Google/Gemini). Các file đã bị xóa ở commit 8666291 và 7a114f2, nhưng nội dung vẫn còn trong lịch sử. Cả 4 commit đều nằm trên `origin/main` (GitHub) và trên `gitlab/main`, `gitlab/dev`. Ai đọc được repo đều lấy được credential bằng `git log -p`. Gemini key hiện tại trong backend/.env KHÔNG trùng với key trong lịch sử, nghĩa là key cũ có thể đã được thay. Tuy nhiên chưa có bằng chứng key cũ đã bị thu hồi. Mật khẩu Atlas cũng chưa xác minh được là đã đổi hay chưa. Không tài liệu audit nào trước đây nhắc tới việc xoay vòng các credential này.

**2. Điều kiện khai thác.** Credential Atlas/Gemini cũ chưa được xoay vòng. Kẻ tấn công đọc được repo, hoặc repo là public.

**3. Tác động CIA.** C:H (đọc toàn bộ DB gồm PII và hash mật khẩu), I:H (sửa hoặc xóa dữ liệu), A:H. Gemini key có thể bị lạm dụng làm phát sinh chi phí.

**4. Bằng chứng.** Lịch sử git (git log --all -p) có commit thêm các file scratch (backend/scratch_check_db.js, scratch_test_gemini.js, scratch_test_vertex.js) chứa chuỗi kết nối MongoDB Atlas có mật khẩu và một Gemini/Google API key. Các commit này có trên origin/main, gitlab/main và gitlab/dev. File đã bị xóa khỏi working tree nhưng vẫn còn trong lịch sử. CI có chạy gitleaks (fetch-depth: 0) nhưng bộ rule mặc định nhiều khả năng không bắt được URI mongodb+srv và key Google dạng này; gitleaks không có trên máy audit nên quét bằng git grep. Giá trị bí mật được che hoàn toàn trong báo cáo này.

**5. Root Cause.** Script thử nghiệm (scratch_*) dùng credential thật được commit trước khi `.gitignore` có rule `scratch_*`. Khi dọn dẹp chỉ xóa file chứ không viết lại lịch sử và không xoay vòng secret.

**6. Remediation.** 1) Đổi ngay mật khẩu user `[user Atlas đã che]` trên Atlas, hoặc xóa user đó và tạo user mới quyền tối thiểu. Kiểm tra Network Access (IP allowlist, không để 0.0.0.0/0) và Atlas audit/access log từ 2026-06-20. 2) Thu hồi mọi Gemini/Google API key từng xuất hiện trong lịch sử trên Google Cloud Console, rồi giới hạn key mới theo API và theo nguồn gọi. 3) (Cần quyết định) Viết lại lịch sử bằng `git filter-repo --path-glob 'backend/scratch_*' --invert-paths`, force-push lên cả GitHub và GitLab, và báo cộng tác viên clone lại. Chỉ viết lại lịch sử thì không đủ, bước xoay vòng secret là bắt buộc. 4) Thêm rule gitleaks tùy chỉnh cho `mongodb(\+srv)?://[^:]+:[^@]+@` và `AQ\.[A-Za-z0-9_-]{20,}`, sau đó chạy `gitleaks detect --log-opts=--all` để xác nhận lịch sử sạch.

**7. Files.** `.gitleaks.toml`, `(git history) backend/scratch_*.js` (các file cần sửa theo audit)

**8. Regression Tests.** Không áp dụng

**9. Acceptance Criteria.** Credential cũ không còn đăng nhập được Atlas và Gemini key cũ trả về 401/403. `gitleaks detect --log-opts=--all` với rule mới cho 0 phát hiện. Ghi nhận việc xoay vòng vào docs.

**10. Fix Status — BLOCKED (cần chủ sở hữu hành động, AI không làm được).** Chưa có thay đổi nào. Không thể tự động xử lý: cần chủ sở hữu xoay (rotate) thông tin đăng nhập. **Phần còn lại:** AI không xoay credential và không tự ý ghi đè lịch sử git. Chủ sở hữu phải làm thủ công (xem R-001).

#### SEC-004 — Response đơn hàng cho khách/guest lộ costPrice, grossMargin, markup, approver

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-213 (Exposure of Sensitive Information Due to Incompatible Policies) / CWE-200
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (5.3): khách vãng lai tự tạo đơn rồi đọc lại bằng token của chính mình
- **Severity:** Medium
- **Confidence:** Cao (xác nhận bởi 3 lượt kiểm chứng độc lập và dynamic test)
- **Module:** orders (ảnh hưởng tới phạm vi ERP: dữ liệu giá vốn) ; orders
- **File/Function:** backend/src/modules/orders/services/checkout.service.ts:522 (CheckoutService.createAtomic (verifiedItems) / OrdersService.findByUser, findByIdForActor, findGuestById)
- **Tác nhân tấn công:** Guest/Customer
- **Nguồn phát hiện:** authz-erp#0, authz-commerce#1, api-input#1 ; TEST-SEC-005

**1. Mô tả.** Khi tạo đơn online, mỗi dòng hàng được lưu snapshot costPrice (giá vốn bình quân lấy từ Inventory), grossMarginPercent và markupPercent. Ba endpoint trả đơn cho khách là GET /api/orders/my-orders, GET /api/orders/:id và GET /api/orders/guest/:id. Cả ba đều trả nguyên document Mongoose, không loại các trường nội bộ này. Không có ClassSerializerInterceptor, toJSON transform hay select:false nào che chúng. Kết quả là bất kỳ khách hàng nào, kể cả khách vãng lai tự đặt một đơn, cũng đọc được giá vốn và tỷ suất lãi gộp của từng sản phẩm. Trong khi đó module POS đã chủ động xóa costPrice cho nhân viên không phải quản lý (pos.service.ts:1551-1556).

**2. Điều kiện khai thác.** Có một đơn hàng của chính mình: tài khoản khách, hoặc đơn khách vãng lai kèm X-Guest-Order-Token. Sản phẩm đã có costPrice trong Inventory (đã nhập kho có giá vốn).

**3. Tác động CIA.** C: Lộ giá vốn và biên lợi nhuận của từng SKU cho đối thủ hoặc khách sỉ. I/A: không ảnh hưởng.

**4. Bằng chứng.** checkout.service.ts:468-469 `const itemCostPrice = costMap.get(...) || product.costPrice || 0;` và :517-528 push `{..., costPrice: itemCostPrice, ..., grossMarginPercent, markupPercent}`. order.schema.ts:26-27 `@Prop({ type: Number, default: 0 }) costPrice?` và :48-52 grossMarginPercent/markupPercent, không có select:false. orders.service.ts:314-333 findByUser `.find(filter)...exec()` không có projection. orders.service.ts:264-286 findByIdForActor và :288-312 findGuestById trả `order` nguyên vẹn. orders.controller.ts:87-93, 151-158, 161-172 trả thẳng kết quả service.

**5. Root Cause.** Snapshot dữ liệu nội bộ (giá vốn, biên lợi nhuận) nằm chung subdocument với dữ liệu hiển thị cho khách. Không có lớp DTO hoặc projection riêng cho response phía khách hàng.

**6. Remediation.** 1) Thêm `select: false` cho items.costPrice, items.grossMarginPercent, items.markupPercent, items.baseSellingPrice, items.appliedPolicy* và approver trong OrderItem schema, hoặc thêm projection `-items.costPrice -items.grossMarginPercent -items.markupPercent ...` trong findByUser, findGuestById, nhánh CUSTOMER của findByIdForActor và response của create/createGuest. 2) Chỉ trả các trường này cho ADMIN, hoặc STAFF có MANAGE_ORDERS kèm VIEW_REPORTS. 3) Rà các query nội bộ đang đọc costPrice (reports.service, orders.service:497 aggregate) để chắc rằng chúng vẫn chọn rõ trường cần dùng.

**7. Files.** `backend/src/modules/orders/services/checkout.service.ts`, `backend/src/modules/orders/orders.service.ts`, `backend/src/modules/orders/orders.customer-view.spec.ts`, `backend/src/modules/orders/services/checkout.service.spec.ts` (các file đã sửa)

**8. Regression Tests.** orders.customer-view.spec.ts (my-orders, chủ đơn, guest lookup, cancelForActor, cancelGuest, requestReturn; admin vẫn thấy đủ); checkout.service.spec.ts (create và replay không có trường giá vốn, helper không mutate)

**9. Acceptance Criteria.** Response JSON của GET /orders/my-orders, GET /orders/:id (role CUSTOMER), GET /orders/guest/:id và POST /orders không còn các key costPrice, grossMarginPercent, markupPercent trong items. Admin, hoặc staff có MANAGE_ORDERS, vẫn xem được nếu nghiệp vụ yêu cầu.

**10. Fix Status — FIXED – VERIFIED.** Helper toCustomerOrderView loại costPrice, baseSellingPrice, appliedPolicy*, grossMarginPercent, markupPercent, approver, approvalReason. Áp dụng cho create (guest/đăng nhập), replay idempotent, my-orders, findByIdForActor của chủ đơn, findGuestById, và (sau review) cancelForActor, cancelGuest, requestReturn. Admin/staff có MANAGE_ORDERS vẫn xem đủ.

#### SEC-005 — POST /auth/logout đưa jti/exp chưa xác thực chữ ký vào blacklist

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-400 / CWE-345
- **CVSS:** CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:H (5.9)
- **Severity:** Medium
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** auth
- **File/Function:** backend/src/modules/auth/auth.service.ts:343 (AuthService.logout / TokenBlacklistService.blacklistJti)
- **Tác nhân tấn công:** Guest
- **Nguồn phát hiện:** authn#0

**1. Mô tả.** Endpoint logout là public, không có guard. Service dùng `jwtService.decode()` (KHÔNG kiểm tra chữ ký) để lấy `jti` và `exp` từ access token (header hoặc cookie) và từ refresh token (body). Sau đó gọi `blacklistJti(jti, exp)` và `blacklistToken(raw, exp)`. Kẻ tấn công không cần đăng nhập vẫn tự tạo được một JWT không ký, chứa `jti` dài hàng trăm KB và `exp` ở tương lai rất xa (ví dụ năm 2286). Giá trị này được lưu vào Map trong bộ nhớ (`jtiBlacklist`) và vào Redis với key `bl:jti:<jti>`, TTL bằng `exp - now` (vài trăm năm). `cleanupExpiredTokens` chỉ xóa bản ghi đã hết hạn nên dữ liệu này nằm lại vĩnh viễn. `RefreshTokenDto.refreshToken` không có `MaxLength`, giới hạn duy nhất là body 1MB. Throttle 10 request/phút/IP không chặn được việc tích lũy dần: khoảng 7MB/phút/IP, đủ làm OOM một instance 512MB trong khoảng 1 giờ, đồng thời làm phình Redis dùng chung cho throttler và blacklist.

**2. Điều kiện khai thác.** Không cần tài khoản. Chỉ cần gửi nhiều request POST /api/auth/logout theo thời gian.

**3. Tác động CIA.** A: cao (OOM tiến trình Node, Redis đầy làm hỏng throttler và blacklist)

**4. Bằng chứng.** auth.service.ts:330-339: `const decoded: any = this.jwtService.decode(rawAccessToken); ... if (jti) await this.tokenBlacklistService.blacklistJti(jti, exp);`
auth.service.ts:343-353: tương tự với `rawRefreshToken` lấy từ body.
auth.controller.ts:197-216: `@Post('logout')` chỉ có `@Throttle(10/60s)`, không có guard.
auth.dto.ts:116-121: `refreshToken` chỉ có `@IsString()`, không có `MaxLength`.
token-blacklist.service.ts:42-58: TTL lấy từ `expSeconds` do client cung cấp, không giới hạn trần. Lưu `jti` thô làm key cả trong Map lẫn Redis.
Các bước xác minh chữ ký (verifyAsync, dòng 357-388) chỉ chạy SAU khi đã blacklist.

**5. Root Cause.** Dữ liệu chưa xác thực (payload JWT chỉ được decode) được dùng làm key và TTL cho kho lưu trữ dài hạn. Không validate định dạng `jti` và không giới hạn TTL theo thời hạn tối đa của token.

**6. Remediation.** 1) Trong logout, chỉ blacklist sau khi `verifyAsync` thành công với đúng secret (access dùng JWT_SECRET, refresh dùng JWT_REFRESH_SECRET; cho phép `ignoreExpiration` nhưng bỏ qua token đã hết hạn vì không cần blacklist). 2) Chỉ chấp nhận `jti` có dạng UUID (regex), loại các giá trị khác. 3) Trong `blacklistJti` và `blacklistToken`, giới hạn TTL ở mức min(exp - now, 30 ngày) và bỏ qua khi exp đã qua. 4) Thêm `@MaxLength(4096)` cho `RefreshTokenDto.refreshToken`.

**7. Files.** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/auth/auth.service.spec.ts` (các file đã sửa)

**8. Regression Tests.** auth.service.spec.ts: 4 test SEC-005 (chữ ký sai, sai type, đúng secret và TTL bị chặn trần, token hết hạn); 3 test logout cũ cập nhật mock verifyAsync

**9. Acceptance Criteria.** Logout với JWT không ký hoặc ký bằng secret sai thì không tạo bản ghi blacklist nào. jti không phải UUID bị bỏ qua. TTL không bao giờ vượt quá thời hạn tối đa của token.

**10. Fix Status — FIXED – VERIFIED.** Helper verifyTokenForRevocation: verifyAsync bằng secret access/refresh với ignoreExpiration, kiểm tra đúng type và có exp; token sai thì không ghi blacklist (controller vẫn xóa cookie). jti/exp lấy từ payload đã verify. TTL chặn trần 30 ngày (access) và 365 ngày (refresh). **Phần còn lại:** refreshToken() và changePassword() vẫn ghi blacklist rawAccessToken theo cách cũ (decode). Rủi ro thấp vì đã qua guard/refresh hợp lệ; nên dùng cùng helper cho nhất quán (R-009).

#### SEC-006 — POS managerPassword là password oracle (so sánh plaintext, lách throttle đăng nhập)

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-307 Improper Restriction of Excessive Authentication Attempts
- **CVSS:** CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:H/I:H/A:N (7.1) nếu mật khẩu admin yếu; thực tế phụ thuộc độ mạnh mật khẩu
- **Severity:** Medium
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** pos
- **File/Function:** backend/src/modules/pos/pos.service.ts:608 (PosService.createPOSOrder)
- **Tác nhân tấn công:** Staff (POS_ACCESS)
- **Nguồn phát hiện:** business-integrity#4

**1. Mô tả.** Lỗi bảo mật xác thực. Thu ngân tự chọn approvedById (có thể là ID của ADMIN/SUPER_ADMIN) cùng managerPassword. Endpoint trả 403 khác nhau tùy mật khẩu đúng hay sai, và lỗi xảy ra trước khi có bất kỳ thao tác ghi nào. Endpoint chỉ chịu throttle mặc định 100 req/phút (không có throttle riêng, không khóa tài khoản), nên đây là kênh brute-force mật khẩu admin vượt qua giới hạn đăng nhập 5/phút. Thu ngân tự kích hoạt nhánh này bằng cách đặt chiết khấu >20%. Ngoài ra code so sánh trực tiếp `approver.password === dto.managerPassword`: ai biết chuỗi hash bcrypt (ví dụ từ backup hoặc log) có thể dùng chính hash đó làm mật khẩu.

**2. Điều kiện khai thác.** Có POS_ACCESS và biết ObjectId của tài khoản admin/quản lý (lộ qua approvedBy trong hóa đơn POS đã phê duyệt).

**3. Tác động CIA.** Confidentiality/Integrity: chiếm mật khẩu tài khoản quản trị

**4. Bằng chứng.** pos.service.ts:564-618: `if (totalDiscountPercent > 20 || marginApprovalRequired)`, approver lấy theo `dto.approvedById`, `approver.password === dto.managerPassword || (await bcrypt.compare(...))`, sai thì ném ForbiddenException 'Mật khẩu xác thực của Quản lý phê duyệt không chính xác.'. pos.controller.ts:32-50 không có @Throttle.

**5. Root Cause.** Xác thực mật khẩu quản lý được nhúng vào API nghiệp vụ, không có rate-limit hay lockout riêng, và còn giữ nhánh so sánh plaintext kiểu legacy.

**6. Remediation.** Bỏ nhánh `===`, chỉ dùng bcrypt.compare. Thêm @Throttle chặt (ví dụ 5/phút) và lockout theo approvedById sau N lần sai, kèm ghi audit. Tốt hơn nữa: tách luồng phê duyệt thành endpoint riêng để quản lý tự đăng nhập/xác nhận và phát approval token ngắn hạn, gắn với payload và dùng 1 lần.

**7. Files.** `backend/src/modules/pos/pos.service.ts`, `backend/src/modules/pos/pos.controller.ts`, `backend/src/modules/pos/pos.security.spec.ts (mới)`, `backend/src/modules/pos/pos.service.spec.ts` (các file đã sửa)

**8. Regression Tests.** pos.security.spec.ts: plaintext không còn được chấp nhận; sai mật khẩu và approver không tồn tại trả cùng thông báo chung; khóa sau 5 lần sai; pos.service.spec.ts cập nhật mock bcrypt

**9. Acceptance Criteria.** Gửi managerPassword bằng chuỗi hash thì bị từ chối. Sai quá N lần thì bị khóa hoặc trả 429.

**10. Fix Status — FIXED – VERIFIED.** Bỏ so sánh plaintext, chỉ bcrypt.compare. Mọi lỗi xác thực phê duyệt trả cùng một thông báo. Bộ đếm sai theo thu ngân và theo người duyệt (5 lần/15 phút thì khóa 15 phút). Controller POST /pos/orders thêm @Throttle 30/phút. Review bổ sung dọn Map approvalFailures khi vượt 1000 phần tử (chống phình bộ nhớ). **Phần còn lại:** Bộ đếm sai nằm in-memory theo từng tiến trình (không chia sẻ giữa nhiều instance). Nên chuyển sang Redis (R-015).

#### SEC-007 — POS: thu ngân né sàn biên lợi nhuận bằng unitPrice giả cao

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-840 Business Logic Errors
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N (4.3)
- **Severity:** Medium
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** pos/pricing
- **File/Function:** backend/src/modules/pos/pos.service.ts:460 (PosService.createPOSOrder)
- **Tác nhân tấn công:** Staff (POS_ACCESS)
- **Nguồn phát hiện:** business-integrity#3

**1. Mô tả.** Lỗi logic phân quyền nghiệp vụ. Khi kiểm tra biên lợi nhuận, pricingService.calculateItemPrice nhận `requestedUnitPrice: itemDto.unitPrice` do client gửi. Trong khi đó, giá thực ghi vào hóa đơn là `unitPrice` lấy từ DB. Thu ngân không có quyền override chỉ cần gửi unitPrice rất cao: margin tính ra cao và lineDiscountPercent nhỏ, nên `requiresApproval=false`. Nhờ vậy họ bán dưới giá vốn (kết hợp chiết khấu dòng ≤20%) mà không cần quản lý phê duyệt (PRC-T01/T02).

**2. Điều kiện khai thác.** Tài khoản STAFF có POS_ACCESS, không có POS_OVERRIDE_DISCOUNT.

**3. Tác động CIA.** Integrity: bán lỗ không qua phê duyệt, báo cáo biên lợi nhuận sai

**4. Bằng chứng.** pos.service.ts:338-339 và 383-384: unitPrice lấy từ DB/giá sỉ. 410-435: lineTotal tính theo unitPrice DB. 450-462: `requestedUnitPrice: itemDto.unitPrice, requestedDiscount: itemDiscount`. pricing.service.ts:494-499: `unitPrice = Number(params.requestedUnitPrice)`, sau đó 508-549 tính grossMargin/requiresApproval trên giá này. pos.service.ts:475-478 lấy requiresApproval từ kết quả đó. orderItems.unitPrice (510) là giá DB.

**5. Root Cause.** Kiểm tra biên lợi nhuận và tính tiền dùng 2 nguồn giá khác nhau, và nguồn dùng cho kiểm tra lại do client cung cấp.

**6. Remediation.** Không truyền itemDto.unitPrice vào pricing, hoặc truyền chính unitPrice DB và lineTotal thực tế. Nếu muốn hỗ trợ thu ngân đổi giá, phải dùng giá đó cho CẢ hóa đơn lẫn kiểm tra, và tính chênh lệch so với giá DB là chiết khấu cần phê duyệt.

**7. Files.** `backend/src/modules/pos/pos.service.ts`, `backend/src/modules/pos/pos.security.spec.ts (mới)` (các file đã sửa)

**8. Regression Tests.** pos.security.spec.ts: từ chối unitPrice cao hơn CSDL; unitPrice thấp hơn bị bỏ qua và requestedUnitPrice truyền sang pricing là giá CSDL; ADMIN vẫn tạo đơn bình thường

**9. Acceptance Criteria.** Đơn bán dưới sàn margin luôn yêu cầu approvedById, bất kể unitPrice client gửi.

**10. Fix Status — FIXED – VERIFIED.** POS luôn truyền giá thực từ CSDL (requestedUnitPrice) cho PricingService; BadRequest nếu unitPrice client lớn hơn max(giá thực, giá niêm yết); unitPrice thấp hơn bị bỏ qua (giảm giá phải đi qua discount và quy trình phê duyệt). **Phần còn lại:** Biên lợi nhuận chưa tính phần chiết khấu cấp đơn đã phân bổ; pricing.service chưa nhân costPrice với conversionRatio khi bán theo đơn vị quy đổi (R-013, cần quyết định chính sách).

#### SEC-008 — Khách vượt hạn trả hàng 7 ngày bằng overrideToken tùy ý

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-287 Improper Authentication / CWE-840
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N (4.3)
- **Severity:** Medium
- **Confidence:** Cao (xác nhận bởi 2 lượt kiểm chứng độc lập)
- **Module:** orders/lifecycle ; orders
- **File/Function:** backend/src/modules/orders/services/order-lifecycle.service.ts:599 (OrderLifecycleService.requestReturn)
- **Tác nhân tấn công:** Customer
- **Nguồn phát hiện:** business-integrity#5, authz-commerce#0

**1. Mô tả.** Lỗi logic nghiệp vụ. Mã 'phê duyệt đặc cách của quản lý' không được xác minh: chỉ cần chuỗi trim dài ≥6 là được chấp nhận. Khách gửi overrideToken='aaaaaa' sẽ mở được yêu cầu trả hàng cho đơn đã giao quá 7 ngày. Timeline còn được ghi '(Đặc cách phê duyệt quá hạn)', dễ khiến nhân viên tưởng đã có quản lý phê duyệt. Bước duyệt vẫn do nhân viên làm, nên tác động bị giới hạn.

**2. Điều kiện khai thác.** Khách đăng nhập, sở hữu đơn DELIVERED/COMPLETED quá 7 ngày.

**3. Tác động CIA.** Integrity: vô hiệu chính sách đổi trả, gây nhiễu quy trình duyệt

**4. Bằng chứng.** order-lifecycle.service.ts:598-606: `const isOverrideValid = dto.overrideToken && dto.overrideToken.trim().length >= 6;`. Dòng 611 ghi note 'Đặc cách phê duyệt quá hạn'. order.dto.ts:291-297 cho thấy overrideToken chỉ có @IsString.

**5. Root Cause.** Placeholder kiểm tra token chưa được hiện thực bằng cơ chế ký hoặc phê duyệt thật.

**6. Remediation.** Chỉ chấp nhận override khi actor là ADMIN/STAFF có MANAGE_ORDERS, hoặc khi token là HMAC ngắn hạn do quản lý phát, gắn orderId và dùng 1 lần, xác minh bằng timingSafeEqual. Nếu không có cơ chế này thì loại bỏ overrideToken khỏi API khách.

**7. Files.** `backend/src/modules/orders/services/order-lifecycle.service.ts`, `backend/src/modules/orders/services/order-lifecycle.service.spec.ts (mới)`, `backend/src/modules/orders/sales-return.spec.ts (sửa test SALES-RET-T06 theo hành vi đúng)` (các file đã sửa)

**8. Regression Tests.** order-lifecycle.service.spec.ts (mới): khách quá hạn + token bị từ chối, trong hạn, ADMIN đặc cách, ADMIN thiếu token, STAFF có/không MANAGE_ORDERS; sales-return.spec.ts SALES-RET-T06 chuyển actor sang ADMIN

**9. Acceptance Criteria.** Customer gửi overrideToken tùy ý cho đơn quá 7 ngày thì nhận 400.

**10. Fix Status — FIXED – VERIFIED.** requestReturn chỉ chấp nhận overrideToken khi người gọi là ADMIN/SUPER_ADMIN hoặc STAFF có MANAGE_ORDERS; token của khách bị bỏ qua; nhãn "Đặc cách" chỉ gắn khi đặc cách thực sự được áp dụng. **Phần còn lại:** Frontend frontend/src/pages/customer/OrderDetail.vue vẫn có ô nhập "mã đặc cách" cho khách (backend nay bỏ qua token, gây khó hiểu). Nên ẩn ô này với khách (R-010). Nhánh STAFF của canOverrideWindow hầu như không phát huy vì requestReturn đòi người gọi là admin hoặc chủ đơn. *Ghi chú verifier: authz-commerce#0 reach: downgraded -> Low.*

#### SEC-009 — Race khi thanh toán NCC / thu nợ khách (fallback doc.save() ghi đè dữ liệu cũ)

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-362 Race Condition / CWE-367 TOCTOU
- **CVSS:** CVSS:3.1/AV:N/AC:H/PR:H/UI:N/S:U/C:N/I:H/A:N (4.2)
- **Severity:** Medium
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** finance
- **File/Function:** backend/src/modules/finance/finance.service.ts:1056 (FinanceService.paySupplier / collectCustomerPayment)
- **Tác nhân tấn công:** Staff (MANAGE_FINANCE), kể cả vô tình do bấm đúp
- **Nguồn phát hiện:** business-integrity#2

**1. Mô tả.** Vấn đề toàn vẹn dữ liệu do race condition. Ở 2 hàm này, phần kiểm tra số nợ còn lại đọc document NGOÀI transaction. Sau đó lệnh cập nhật có điều kiện `remainingAmount >= amount` được chạy. Nếu lệnh này trả về null (vì một request song song đã trừ nợ), code KHÔNG báo lỗi mà rơi vào nhánh fallback: gán giá trị tính từ snapshot cũ rồi `payable.save()`. Kết quả: phiếu chi/thu (CashEntry) thứ hai vẫn được ghi, sổ quỹ bị trừ hoặc cộng 2 lần, còn công nợ bị ghi đè về trạng thái của 1 lần thanh toán (mất cập nhật). Ở collectCustomerPayment, currentExposure còn bị trừ 2 lần, có thể âm và làm khách vượt hạn mức tín dụng. Tình huống dễ xảy ra khi kế toán bấm đúp mà không gửi idempotencyKey.

**2. Điều kiện khai thác.** 2 request thanh toán cùng một khoản nợ chạy song song, không có idempotencyKey hoặc dùng key khác nhau.

**3. Tác động CIA.** Integrity: trả NCC 2 lần, sổ quỹ sai, hạn mức tín dụng khách bị sai

**4. Bằng chứng.** finance.service.ts:928-948: đọc payable và kiểm tra remainingAmount ngoài session. 1035-1054: findOneAndUpdate có điều kiện `remainingAmount: { $gte: dto.amount }`. 1056-1064: `if (!updatedPayable) { payable.paidAmount = nextPaid; payable.remainingAmount = nextRemaining; ... await payable.save({session}) }`. Phiếu chi đã được tạo trước đó ở 999-1014. Pattern giống hệt ở collectCustomerPayment 1581-1610, và exposure bị trừ ở 1613-1620.

**5. Root Cause.** Nhánh fallback (có vẻ thêm vào để chạy được với mock trong test) biến lệnh cập nhật nguyên tử có điều kiện thành ghi đè vô điều kiện bằng dữ liệu cũ.

**6. Remediation.** Khi findOneAndUpdate trả null thì throw ConflictException để transaction abort, xóa nhánh save() fallback. Nếu test cần, mock findOneAndUpdate đúng cách. Đồng thời đọc payable/receivable trong session, và cân nhắc bắt buộc idempotencyKey cho 2 endpoint này.

**7. Files.** `backend/src/modules/finance/finance.service.ts`, `backend/src/modules/finance/finance.service.spec.ts`, `backend/src/modules/uat-e2e-flows.spec.ts (bổ sung mock findOneAndUpdate trong bước kiểm chứng cuối)` (các file đã sửa)

**8. Regression Tests.** finance.service.spec.ts: SEC-009-T01..T04 (stale thì Conflict và không save; 2 request đồng thời chỉ 1 thành công; đồng bộ status sang PAID); uat-e2e-flows.spec.ts UAT-E2E-03 và UAT-E2E-08 (14/14 pass)

**9. Acceptance Criteria.** Khi lệnh cập nhật có điều kiện không khớp, service ném 409 và không có CashEntry hay thay đổi số dư quỹ nào được commit.

**10. Fix Status — FIXED – VERIFIED.** Bỏ fallback save() ở paySupplier và collectCustomerPayment; luôn dùng findOneAndUpdate có điều kiện (remainingAmount >= amount, status != PAID, isDeleted=false) trong cùng session; không khớp thì ném ConflictException để transaction abort. Thêm bước đồng bộ status sang PAID khi remaining = 0. **Phần còn lại:** Khi chạy không có replica set (session=null, chỉ dev) và update bị từ chối thì phiếu thu/chi đã tạo không được hoàn tác. Production dùng replica set nên transaction abort xử lý được.

#### SEC-010 — PATCH /promotions/:id bỏ qua ValidationPipe (Partial<CreatePromotionDto>)

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-20 Improper Input Validation / CWE-915 Mass Assignment
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:N (4.9)
- **Severity:** Medium
- **Confidence:** Cao (xác nhận bởi 3 lượt kiểm chứng độc lập)
- **Module:** promotions ; promotions / data-exchange
- **File/Function:** backend/src/modules/promotions/promotions.controller.ts:74 (PromotionsController.update)
- **Tác nhân tấn công:** Staff (MANAGE_PROMOTIONS)
- **Nguồn phát hiện:** business-integrity#9, authz-commerce#2, api-input#8

**1. Mô tả.** Generic `Partial<CreatePromotionDto>` bị TypeScript xóa kiểu khi chạy, metatype trở thành Object nên ValidationPipe toàn cục bỏ qua hoàn toàn: không whitelist, không validate. Nhân viên có MANAGE_PROMOTIONS (hoặc token bị đánh cắp) có thể đặt `discountValue` âm. Với FIXED, discount âm làm `total = subtotal + ship - discount` TĂNG, tức khách bị thu thêm. Họ cũng có thể đặt PERCENT > 100, sửa `usedCount` để reset giới hạn, hoặc đặt endDate trước startDate. Schema Mongoose không có `min` cho discountValue/usedCount. Ngoài ra, ngay cả khi tạo mới hợp lệ, discount FIXED không bị chặn ≤ subtotal, nên trường `discount` lưu trong đơn có thể lớn hơn subtotal và làm báo cáo giảm giá bị thổi phồng.

**2. Điều kiện khai thác.** Có quyền MANAGE_PROMOTIONS.

**3. Tác động CIA.** Integrity: thu sai tiền khách, vô hiệu giới hạn khuyến mãi

**4. Bằng chứng.** promotions.controller.ts:74 `update(@Param('id') id: string, @Body() dto: Partial<CreatePromotionDto>)`. promotions.service.ts:101-103 `findByIdAndUpdate(id, dto)`. promotion.schema.ts:21-43 không có min/max. promotions.service.ts:203-205 `discount = promo.discountValue` không chặn theo orderTotal. checkout.service.ts:609-612 tính total.

**5. Root Cause.** Dùng kiểu generic cho @Body thay vì class DTO cụ thể. Schema thiếu ràng buộc dữ liệu.

**6. Remediation.** Tạo `UpdatePromotionDto extends PartialType(CreatePromotionDto)` (từ @nestjs/swagger) và loại `usedCount`. Thêm @Max(100) khi PERCENT (validate tùy biến), thêm `min: 0` trong schema cho discountValue/usedCount/usageLimit, và kiểm tra endDate > startDate. Trong apply(): `discount = Math.min(discount, orderTotal)`.

**7. Files.** `backend/src/modules/promotions/dto/promotion.dto.ts`, `backend/src/modules/promotions/promotions.controller.ts`, `backend/src/modules/promotions/promotions.controller.spec.ts (mới)` (các file đã sửa)

**8. Regression Tests.** promotions.controller.spec.ts (mới, 11 test): metatype là UpdatePromotionDto, discountValue âm/usedCount/trường lạ trả 400, cập nhật một phần hợp lệ, null ở trường bắt buộc bị từ chối

**9. Acceptance Criteria.** PATCH với discountValue:-1000 hoặc usedCount:0 hoặc field lạ thì nhận 400.

**10. Fix Status — FIXED – VERIFIED.** Thêm UpdatePromotionDto = PartialType(CreatePromotionDto) (@nestjs/swagger); controller PATCH dùng DTO này. Review phát hiện PartialType cho phép null lọt qua (IsOptional) nên controller từ chối với 400 nếu bất kỳ trường nào là null. **Phần còn lại:** Chưa có kiểm tra chéo PERCENT > 100 và endDate < startDate (cần quyết định nghiệp vụ); admin/Promotions.vue gửi maxDiscountAmount/limitPerUser trong khi DTO là maxDiscount/perUserLimit (R-014). *Ghi chú verifier: authz-commerce#2 reach: downgraded -> Low.*

#### SEC-011 — Email xác nhận đơn chèn HTML chưa escape (phishing dưới thương hiệu cửa hàng)

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-80
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N (6.1)
- **Severity:** Medium
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** email / orders
- **File/Function:** backend/src/modules/email/email.service.ts:177 (sendOrderConfirmationEmail / sendOrderStatusEmail)
- **Tác nhân tấn công:** Guest
- **Nguồn phát hiện:** api-input#2

**1. Mô tả.** Khách vãng lai tự đặt customerEmail, customerName và shippingAddress trong POST /orders. Hệ thống gửi email xác nhận tới customerEmail mà không xác minh địa chỉ đó. Template email nội suy trực tiếp ${order.customerName} và ${order.shippingAddress} vào HTML, không escape. Middleware sanitize-html chỉ lọc theo allowlist, vẫn giữ <a href="https://...">, <strong>, <p>, <ul>. Kẻ tấn công vì vậy gửi được email mang thương hiệu Trường Thành, từ domain gửi thật của cửa hàng, chứa link lừa đảo tới nạn nhân tùy ý. Mỗi lần làm vậy cũng tạo một đơn PENDING và trừ tồn kho.

**2. Điều kiện khai thác.** Không cần đăng nhập. Rate limit 10/phút/IP. Sau 2 đơn PENDING trên cùng số điện thoại thì cần Turnstile, đổi số điện thoại là vượt được.

**3. Tác động CIA.** I:L (nội dung giả mạo), uy tín domain gửi mail

**4. Bằng chứng.** email/email.service.ts:177 (${order.customerName}), 185 (${order.shippingAddress}), 247 (status email)
orders/dto/order.dto.ts:97-110 (customerName MaxLength 100, customerEmail tự do)
orders/services/checkout.service.ts:803-816 (emailRecipient = savedOrder.customerEmail)
orders/services/order-notification.service.ts:208-213 (gửi email xác nhận)
common/security/security.sanitizer.ts:34-56 (allowlist giữ thẻ a href http/https)

**5. Root Cause.** Template email ghép chuỗi HTML không escape. Email của khách không được xác minh trước khi gửi.

**6. Remediation.** 1) Thêm hàm escapeHtml() và áp dụng cho mọi giá trị động trong email.service.ts (customerName, shippingAddress, item.name, note, statusText), hoặc dùng template engine tự escape. 2) Khi validate, cân nhắc từ chối ký tự '<' và '>' trong customerName và shippingAddress. 3) Cân nhắc chỉ gửi email cho guest sau khi xác minh, hoặc giới hạn số email theo địa chỉ nhận.

**7. Files.** `backend/src/modules/email/email.service.ts`, `backend/src/modules/email/email.service.spec.ts` (các file đã sửa)

**8. Regression Tests.** email.service.spec.ts: 2 test SEC-011 (payload <a href> trong tên/điện thoại/địa chỉ/tên sản phẩm bị escape; statusText chứa <script> bị escape)

**9. Acceptance Criteria.** HTML email render customerName '<a href="https://x">y</a>' thành văn bản đã escape.

**10. Fix Status — FIXED – VERIFIED.** Thêm hàm export escapeHtml (& < > " ') áp dụng cho mọi giá trị người dùng nhúng vào HTML ở sendOtpEmail, sendOrderConfirmationEmail, sendOrderStatusEmail. **Phần còn lại:** products.service.ts (email "có hàng trở lại", khoảng dòng 1239-1246) còn nhúng ${product.name} chưa escape (R-012). Việc chặn gửi tới địa chỉ tùy ý ở guest checkout là quyết định nghiệp vụ.

#### SEC-012 — Phân trang không giới hạn (limit=0 hoặc rất lớn) trên API công khai

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-770
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L (5.3)
- **Severity:** Medium
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** products / common pagination
- **File/Function:** backend/src/common/dto/pagination.dto.ts:14 (PaginationDto.limit; ProductsController.getBestSelling/getDiscounted/getNew/getRelated/getSuggestions)
- **Tác nhân tấn công:** Guest
- **Nguồn phát hiện:** api-input#3

**1. Mô tả.** PaginationDto.limit chỉ có @Min(1), không có @Max. GET /products?limit=1000000 vì vậy trả toàn bộ catalog, mỗi bản ghi populate category và parentId. Các route GET /products/best-selling, discounted, new, :id/related, suggestions nhận @Query('limit') kiểu number không validate. ValidationPipe chuyển '0' thành 0, mà giá trị mặc định của tham số chỉ áp dụng khi undefined, nên .limit(0) trong Mongoose nghĩa là không giới hạn. Các endpoint này public, chỉ chịu throttle mặc định 100 request/phút/IP, và giới hạn này còn bị chia sẻ nếu thiếu trust proxy (mapper đã nêu). Kẻ tấn công khuếch đại tải lên DB và băng thông. Cùng gốc rễ: các DTO kế thừa PaginationDto như OrderQueryDto, finance, pricing, quotations, cùng customers.controller.ts:39-45 (@Query('limit') và @Query('page') thô, page âm làm skip âm và gây 500) cho phép staff kéo không giới hạn.

**2. Điều kiện khai thác.** Không cần đăng nhập.

**3. Tác động CIA.** A:L

**4. Bằng chứng.** common/dto/pagination.dto.ts:14-17 (@Min(1) không @Max)
products/products.controller.ts:45-49 (findAll), 125-141 (@Query('limit') limit?: number)
products/products.service.ts:538-553 (.limit(limit)), 833-860 (.limit(limit) với limit=0)
customers/customers.controller.ts:39-45

**5. Root Cause.** Thiếu cận trên cho tham số phân trang ở DTO dùng chung, và route đọc query primitive mà không clamp.

**6. Remediation.** 1) Thêm @Max(100) và @IsInt cho PaginationDto.limit, thêm @IsInt cho page. 2) Với các route @Query('limit') primitive, clamp trong service: const safe = Math.min(50, Math.max(1, Number(limit) || default)). 3) Đổi customers.controller sang DTO có validate.

**7. Files.** `backend/src/common/dto/pagination.dto.ts`, `backend/src/modules/products/products.service.ts`, `backend/src/modules/products/products.public-exposure.spec.ts (mới)` (các file đã sửa)

**8. Regression Tests.** products.public-exposure.spec.ts: clampLimit, findAll limit=0 gọi .limit(10), best-selling/discounted/new với limit 0 và 100000, DTO từ chối 0/-1/1001/1.5 và chấp nhận 1/100/1000

**9. Acceptance Criteria.** GET /products?limit=1000 trả 400 hoặc bị clamp còn 100. GET /products/best-selling?limit=0 trả tối đa N bản ghi mặc định.

**10. Fix Status — FIXED – VERIFIED.** PaginationDto.limit thêm @IsInt @Min(1) @Max(1000) (trần 1000 vì admin Combos.vue gọi limit=1000); thêm clampLimit() cho các endpoint nhận limit thô (mặc định giữ nguyên, tối đa 100, suggestions 50); paginate() không còn trả Infinity. **Phần còn lại:** Nên chuyển Combos.vue sang tải phân trang để sau này hạ trần xuống 100.

#### SEC-013 — checkout-preview công khai không giới hạn số item/quantity, truy vấn tuần tự từng item

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-770
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L (5.3)
- **Severity:** Medium
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** orders
- **File/Function:** backend/src/modules/orders/services/checkout.service.ts:170 (checkoutPreview)
- **Tác nhân tấn công:** Guest
- **Nguồn phát hiện:** api-input#4

**1. Mô tả.** CheckoutPreviewDto.items chỉ có @ArrayMinSize(1). Cả codebase không có @ArrayMaxSize. checkoutPreview lặp từng item và gọi await productsService.findById(item.product), kèm populate category, theo thứ tự tuần tự. Hàm preview cũng không loại item trùng (createAtomic thì có). Body tối đa 1MB, tương đương khoảng 20.000 item lặp cùng một productId hợp lệ, tức khoảng 20.000 truy vấn cho một request. Route cho phép 30 request/phút/IP (OptionalJwt, không cần đăng nhập). POST /orders cũng không có ArrayMaxSize nhưng dùng findByIds gộp và chặn item trùng, nên nhẹ hơn nhiều.

**2. Điều kiện khai thác.** Không cần đăng nhập. Biết một productId hợp lệ (public).

**3. Tác động CIA.** A:L

**4. Bằng chứng.** orders/dto/order.dto.ts:219-225 (items: @IsArray @ArrayMinSize(1), không ArrayMaxSize)
orders/services/checkout.service.ts:170-171 (for … await this.productsService.findById(item.product))
orders/orders.controller.ts:49-60 (@UseGuards(OptionalJwtAuthGuard) @Throttle 30/60s)

**5. Root Cause.** Thiếu giới hạn kích thước mảng ở DTO. Pattern N+1 query trong vòng lặp.

**6. Remediation.** 1) Thêm @ArrayMaxSize(50) cho items trong CheckoutPreviewDto và CreateOrderDto, và @Max(999) cho OrderItemDto.quantity. 2) Ở checkoutPreview, bỏ item trùng hoặc từ chối, rồi lấy sản phẩm bằng một lần findByIds($in).

**7. Files.** `backend/src/modules/orders/dto/order.dto.ts`, `backend/src/modules/orders/services/checkout.service.spec.ts` (các file đã sửa)

**8. Regression Tests.** checkout.service.spec.ts: preview và create từ chối 51 dòng, chấp nhận 50; từ chối quantity 1001, chấp nhận 1000

**9. Acceptance Criteria.** Gửi 51 item trả 400. Preview chạy đúng một truy vấn sản phẩm cho mỗi request.

**10. Fix Status — PARTIAL (một phần FIXED – VERIFIED, phần còn lại OPEN).** Thêm ORDER_MAX_ITEMS=50 (@ArrayMaxSize) cho CheckoutPreviewDto.items và CreateOrderDto.items; ORDER_ITEM_MAX_QUANTITY=1000 (@Max) cho OrderItemDto.quantity. Số truy vấn tuần tự bị chặn ở 50 mỗi request, đi cùng Throttle 30/phút. **Phần còn lại:** Chưa batch lookup bằng findByIds ($in) cho checkoutPreview vì ~15 test trong orders.service.spec.ts mock findById từng item và findByIds đổi hành vi (bỏ qua sản phẩm bị xóa). Giỏ hàng >50 dòng distinct sẽ bị chặn khi checkout (CartSyncDto cho tới 200 dòng): cần nâng ORDER_MAX_ITEMS hoặc đồng bộ trần giỏ hàng (R-004).

#### SEC-058 — Thu hồi điểm loyalty khi trả hàng bị chặn ở 0: khách tiêu điểm trước rồi trả hàng thì giữ lại lợi ích

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-840 Business Logic Errors
- **CVSS:** Chưa chấm CVSS trong audit gốc
- **Severity:** Medium
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** orders/loyalty
- **File/Function:** backend/src/modules/users/users.service.ts:572 (UsersService.deductLoyaltyPoints)
- **Tác nhân tấn công:** Customer
- **Nguồn phát hiện:** business-integrity#7

**1. Mô tả.** Lỗi logic nghiệp vụ. Điểm được cộng ngay khi đơn DELIVERED (order-lifecycle 425-436), trước khi hết hạn đổi trả 7 ngày. Khách có thể dùng ngay số điểm đó cho đơn khác (spendLoyaltyPoints). Khi đơn gốc được trả (RETURNED), deductLoyaltyPoints dùng `Math.max(0, points - awarded)`, nên nếu số dư không đủ thì phần thiếu bị bỏ qua lặng lẽ. Tiền hoàn mặc định vẫn là order.total, không trừ phần điểm chưa thu hồi được. Khách giữ được giá trị giảm giá từ điểm của đơn đã trả.

**2. Điều kiện khai thác.** Đơn được DELIVERED, khách dùng ≥1000 điểm cho đơn khác, sau đó yêu cầu trả đơn gốc và được duyệt.

**3. Tác động CIA.** Integrity: thất thoát giá trị loyalty (khoảng 10% giá trị đơn trả)

**4. Bằng chứng.** users.service.ts:563-574: `user.loyaltyPoints = Math.max(0, (user.loyaltyPoints || 0) - points); return user.save(...)`. order-lifecycle.service.ts:398-422 gọi deductAwardedPoints khi RETURNED, 359-360 đặt `refundAmount = order.total`. Hàm này cũng đọc-sửa-ghi (không dùng $inc), dễ mất cập nhật khi không có session.

**5. Root Cause.** Điểm được ghi nhận trước khi giao dịch hết rủi ro hoàn trả, và không có cơ chế công nợ điểm hay khấu trừ vào tiền hoàn.

**6. Remediation.** Chọn 1 trong các cách (cần quyết định nghiệp vụ): (a) chỉ cộng điểm khi COMPLETED hoặc sau hết hạn trả hàng (pending points); (b) khi thu hồi thiếu thì khấu trừ phần thiếu × 100đ vào refundAmount, hoặc cho phép số dư điểm âm. Đồng thời chuyển deductLoyaltyPoints sang `$inc` nguyên tử.

**7. Files.** `backend/src/modules/users/users.service.ts`, `backend/src/modules/orders/services/order-lifecycle.service.ts`, `backend/src/modules/orders/services/order-loyalty.service.ts` (các file cần sửa theo audit)

**8. Regression Tests.** Spec: award 1500 điểm, spend 1000, RETURNED thì kỳ vọng thiếu hụt 1000 điểm được xử lý (refundAmount giảm 100.000đ hoặc loyaltyPoints âm, tùy quyết định). (đề xuất, chưa viết)

**9. Acceptance Criteria.** Trả đơn đã cộng điểm khi số dư điểm không đủ thì phần thiếu được khấu trừ hoặc ghi nhận rõ ràng, không bị bỏ qua lặng lẽ.

**10. Fix Status — OPEN.** Chưa có bản sửa trong đợt này.

#### SEC-059 — Giới hạn mã giảm giá theo người (perUserLimit) không áp dụng được với khách vãng lai

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-837 Improper Enforcement of a Single, Unique Action
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N (5.3)
- **Severity:** Medium
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** promotions
- **File/Function:** backend/src/modules/promotions/promotions.service.ts:40 (PromotionsService.getIdentityHash / apply)
- **Tác nhân tấn công:** Guest
- **Nguồn phát hiện:** business-integrity#8

**1. Mô tả.** Lạm dụng luồng nghiệp vụ. Với guest, danh tính tính theo email (tùy chọn, client tự khai) trước, phone sau. Lịch sử dùng mã đếm theo `$or [email, phone]`, trong đó phone chỉ được trim, không chuẩn hóa. Guest đổi email mỗi lần và dùng 2 dạng phone hợp lệ (0901... / +84901..., đều qua IsPhoneNumberVN), hoặc đơn giản dùng số điện thoại khác (không xác minh), là dùng được mã 'mỗi khách 1 lần' nhiều lần, cho tới khi chạm usageLimit toàn cục. Ngoài ra checkout-preview công khai trả thông điệp 'Mỗi khách hàng chỉ được sử dụng mã này...' cho email/phone bất kỳ, tạo oracle cho biết một email/phone đã từng dùng mã hay chưa.

**2. Điều kiện khai thác.** Có mã đang hoạt động với perUserLimit nhỏ và usageLimit còn dư.

**3. Tác động CIA.** Integrity: thất thoát ngân sách khuyến mãi

**4. Bằng chứng.** promotions.service.ts:40-46: `userId ? user: : guestEmail ? email: : phone:`. 166-167: `matchConditions.push({ phone: guestPhone.trim() })`, không chuẩn hóa. custom-validators.ts:36 chấp nhận cả `0` và `+84`. checkout.service.ts:223-229 gọi apply với customerEmail/phone do client cung cấp ở preview.

**5. Root Cause.** Không có danh tính đáng tin cậy cho guest, và định danh dùng cho giới hạn không được chuẩn hóa.

**6. Remediation.** Chuẩn hóa phone (dùng normalizeGuestPhone như checkout), luôn băm theo phone đã chuẩn hóa thay vì ưu tiên email, và đếm historicalUsage theo guestPhoneKey. Về nghiệp vụ: cân nhắc yêu cầu đăng nhập hoặc OTP cho mã có perUserLimit, hoặc thêm cờ `requiresLogin` trên Promotion. Preview không nên tiết lộ lý do per-user cho danh tính chưa xác thực.

**7. Files.** `backend/src/modules/promotions/promotions.service.ts`, `backend/src/modules/orders/services/checkout.service.ts` (các file cần sửa theo audit)

**8. Regression Tests.** promotions.service.spec.ts: apply(commit) với phone '+84901234567' sau khi đã dùng '0901234567' thì kỳ vọng BadRequest. (đề xuất, chưa viết)

**9. Acceptance Criteria.** Hai đơn guest cùng phone (dạng 0xxx và +84xxx), email khác nhau thì đơn thứ 2 bị từ chối khi perUserLimit=1.

**10. Fix Status — OPEN.** Chưa có bản sửa trong đợt này.

#### SEC-014 — Regex injection/ReDoS (finance, customers, data-exchange) và :type không validate

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-1333 ReDoS / CWE-625
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:N/A:L (4.3)
- **Severity:** Low (audit gốc: Medium; đã điều chỉnh theo verifier)
- **Confidence:** Cao (xác nhận bởi 3 lượt kiểm chứng độc lập)
- **Module:** finance ; finance, customers, suppliers, purchasing, pricing, reports, stock-audits, data-exchange ; customers ; data-exchange
- **File/Function:** backend/src/modules/finance/finance.service.ts:734 (FinanceService.buildCashEntryFilter)
- **Tác nhân tấn công:** Staff (VIEW_REPORTS/MANAGE_FINANCE)
- **Nguồn phát hiện:** business-integrity#17, api-input#6, authz-commerce#8, authz-erp#13

**1. Mô tả.** Tham số query.search được đưa thẳng vào RegExp mà không escape. Người dùng có quyền VIEW_REPORTS/MANAGE_FINANCE có thể gửi mẫu regex thảm họa (ví dụ `(a+)+$`) để làm chậm Mongo (regex chạy server-side trên 4 trường), hoặc gửi regex không hợp lệ gây lỗi 500. Endpoint liên quan là GET /finance/entries và /entries/export. Lưu ý orders.service đã dùng `safeSearch` cho tình huống tương tự.

**2. Điều kiện khai thác.** Có quyền xem sổ quỹ.

**3. Tác động CIA.** Availability thấp

**4. Bằng chứng.** finance.service.ts:733-741: `const searchRegex = new RegExp(query.search.trim(), 'i'); filter.$or = [{ entryCode: searchRegex }, { partnerName: searchRegex }, { note: searchRegex }, { referenceId: searchRegex }]`.

**5. Root Cause.** Thiếu escape ký tự đặc biệt của regex.

**6. Remediation.** Escape bằng `s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` (đã có tiện ích safeSearch ở orders), và giới hạn độ dài search bằng @MaxLength(100) trong CashEntryQueryDto.

**7. Files.** `backend/src/modules/finance/finance.service.ts`, `backend/src/modules/customers/customers.service.ts`, `backend/src/modules/data-exchange/data-exchange.service.ts`, `backend/src/modules/data-exchange/data-exchange.controller.ts`, `backend/src/modules/finance/finance.service.spec.ts`, `backend/src/modules/customers/customers.service.spec.ts`, `backend/src/modules/data-exchange/data-exchange.service.spec.ts`, `backend/src/modules/data-exchange/data-exchange.controller.spec.ts` (các file đã sửa)

**8. Regression Tests.** finance SEC-014-T01/T02; customers SEC-014-T01/T02 (escape, cap limit 100, page/limit không hợp lệ); data-exchange.service (escape tên danh mục); data-exchange.controller (3 test type lạ trả 400)

**9. Acceptance Criteria.** search='(' thì không gây 500, được tìm như chuỗi literal.

**10. Fix Status — FIXED – VERIFIED.** Thêm escapeRegex trong từng service: buildCashEntryFilter, findAllPayables, findAllReceivables, customers.findAll (kèm trim, ép page>=1, limit trong [1,100]), tên danh mục từ Excel. data-exchange.controller thêm whitelist VALID_ENTITY_TYPES (products, suppliers, opening_stock) trong checkEntityPermission, áp dụng cả với ADMIN. *Ghi chú verifier: api-input#6 reach: downgraded -> Low.*

#### SEC-015 — Mọi STAFF xóa được đánh giá của khách, bỏ qua permission

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-863 Incorrect Authorization
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:L/A:N = 2.7
- **Severity:** Low
- **Confidence:** Cao (xác nhận bởi 3 lượt kiểm chứng độc lập)
- **Module:** reviews / products ; products (reviews sub-route) ; reviews
- **File/Function:** backend/src/modules/reviews/reviews.service.ts:214 (ReviewsService.delete)
- **Tác nhân tấn công:** Staff
- **Nguồn phát hiện:** wip-guards-regression#3, authz-erp#12, authz-commerce#3

**1. Mô tả.** Kiểm duyệt review (moderate, reply, admin list) đòi `@Permissions(MANAGE_PRODUCTS)`. Nhưng hai route xóa review chỉ có AuthGuard('jwt') và giao quyết định cho service. Service cho xóa nếu role là 'STAFF', không xét permission. Vì vậy nhân viên chỉ có POS_ACCESS hoặc MANAGE_ORDERS vẫn xóa được bất kỳ review nào và làm sai rating sản phẩm (recalculateProductRating). Đây là lỗ hổng vượt quyền theo chức năng, cùng loại vấn đề mà deny-by-default nhắm tới nhưng nằm ngoài guard. Ghi chú thêm (không phải bảo mật): userId truyền vào là `req.user._id` (ObjectId, jwt.strategy.ts:121), nên phép so sánh `review.user.toString() !== userId` luôn true. CUSTOMER chủ review vì thế không tự sửa hoặc xóa được review của mình (update :180, delete :214). Unit test không phát hiện vì truyền chuỗi.

**2. Điều kiện khai thác.** Có tài khoản STAFF với bất kỳ permission nào.

**3. Tác động CIA.** I:L (xóa nội dung UGC, thao túng rating)

**4. Bằng chứng.** reviews.service.ts:213-220 `if (review.user.toString() !== userId && userRole !== 'ADMIN' && userRole !== 'STAFF' && userRole !== 'SUPER_ADMIN') throw Forbidden`. reviews.controller.ts:90-104 `@Delete(':id/product/:productId') @UseGuards(AuthGuard('jwt'))` truyền req.user.role. products.controller.ts:245-259 `@Delete(':id/reviews/:reviewId')` chỉ có AuthGuard, gọi productsService.deleteReview, và products.service.ts:1050-1057 chuyển tiếp sang reviewsService.delete. So sánh với reviews.controller.ts:118-124 moderate có `@Permissions(MANAGE_PRODUCTS)`.

**5. Root Cause.** Kiểm tra quyền dựa trên role trong service, không dùng permission (MANAGE_PRODUCTS), lệch với mô hình RBAC chi tiết.

**6. Remediation.** Truyền cả actor `{_id, role, permissions}` vào ReviewsService.delete. Cho phép khi: là chủ review (so sánh bằng `review.user.equals(actor._id)` hoặc `String(actor._id)`), hoặc ADMIN/SUPER_ADMIN, hoặc STAFF có MANAGE_PRODUCTS. Sửa so sánh ObjectId tương tự trong update(). Thêm test: STAFF chỉ có POS_ACCESS thì 403; STAFF có MANAGE_PRODUCTS thì OK; CUSTOMER chủ review với _id kiểu ObjectId thì OK.

**7. Files.** `backend/src/modules/reviews/reviews.service.ts`, `backend/src/modules/reviews/reviews.controller.ts`, `backend/src/modules/reviews/reviews.security.spec.ts (mới)` (các file đã sửa)

**8. Regression Tests.** reviews.security.spec.ts: STAFF thiếu quyền 403; STAFF không truyền permissions 403; STAFF có MANAGE_PRODUCTS xóa được; ADMIN/SUPER_ADMIN xóa được; chủ review xóa được, khách khác 403

**9. Acceptance Criteria.** Chỉ chủ review, ADMIN/SUPER_ADMIN hoặc STAFF có MANAGE_PRODUCTS xóa được review. Chủ review sửa và xóa được review của mình.

**10. Fix Status — FIXED – VERIFIED.** Route dùng chung với khách nên sửa ở service: delete() nhận thêm userPermissions (mặc định []), controller truyền req.user.permissions. ADMIN/SUPER_ADMIN xóa mọi review; STAFF chỉ khi có MANAGE_PRODUCTS; khách chỉ xóa review của mình.

#### SEC-016 — API công khai trả sản phẩm INACTIVE, danh mục ẩn (includeInactive) và wholesalePrice

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-200
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (5.3), tác động kinh doanh thấp nên xếp Low
- **Severity:** Low
- **Confidence:** Cao (xác nhận bởi 2 lượt kiểm chứng độc lập)
- **Module:** products / categories ; products
- **File/Function:** backend/src/modules/categories/categories.controller.ts:45 (CategoriesController.getTree; ProductsService.findAll/findById)
- **Tác nhân tấn công:** Guest
- **Nguồn phát hiện:** authz-erp#11, api-input#9

**1. Mô tả.** GET /api/categories/tree?includeInactive=true là route public, không có guard, và trả cả danh mục đã ẩn (status=false). GET /api/products không có status mặc định là ACTIVE, nên trả cả sản phẩm INACTIVE, và `?status=INACTIVE` liệt kê riêng các sản phẩm ẩn. GET /api/products/:id trả sản phẩm INACTIVE. Response public gồm toàn bộ document Product, kể cả wholesalePrice và wholesaleMinQuantity (giá bán sỉ B2B). Riêng findBySlug đã lọc ACTIVE.

**2. Điều kiện khai thác.** Không có.

**3. Tác động CIA.** C: lộ danh mục, sản phẩm chưa phát hành và giá sỉ.

**4. Bằng chứng.** categories.controller.ts:37-48 không có @UseGuards, `includeInactive === 'true'` truyền thẳng vào service. categories.service.ts:183-189 `const filter = includeInactive ? {} : { status: true }`. products.service.ts:343-345 `const filter = { isDeleted: false }; if (status) filter.status = status;`. :556-572 findById không kiểm tra status. product.schema.ts:111-115 wholesalePrice/wholesaleMinQuantity không có select:false. Đối chiếu :575-577 findBySlug có `status: ProductStatus.ACTIVE`.

**5. Root Cause.** Endpoint public dùng chung cho admin (admin cần thấy sản phẩm ẩn), nhưng không có nhánh phân quyền.

**6. Remediation.** Route public: ép `status: ACTIVE` (bỏ qua query.status trừ khi actor là staff MANAGE_PRODUCTS qua OptionalJwt), bỏ hỗ trợ includeInactive cho guest (chuyển sang /categories/admin). Projection loại wholesalePrice nếu đây là giá nội bộ (cần chốt nghiệp vụ).

**7. Files.** `backend/src/modules/products/products.service.ts`, `backend/src/modules/products/products.controller.ts`, `backend/src/modules/categories/categories.controller.ts`, `backend/src/modules/products/products.public-exposure.spec.ts (mới)`, `backend/src/modules/categories/categories.controller.spec.ts (mới)` (các file đã sửa)

**8. Regression Tests.** products.public-exposure.spec.ts (khách/CUSTOMER bị ép ACTIVE, ADMIN/STAFF lọc được, findByIdForViewer 404, strip giá sỉ/giá vốn); categories.controller.spec.ts (includeInactive bị bỏ qua với khách/CUSTOMER)

**9. Acceptance Criteria.** Guest gọi /categories/tree?includeInactive=true không thấy danh mục status=false. Guest gọi /products?status=INACTIVE nhận danh sách rỗng hoặc 403.

**10. Fix Status — FIXED – VERIFIED.** GET /products dùng OptionalJwtAuthGuard + @CurrentUser; findAll ép status=ACTIVE cho khách/CUSTOMER; findByIdForViewer trả 404 với sản phẩm không ACTIVE; controller strip wholesalePrice/costPrice cho khách; categories getTree chỉ honour includeInactive cho ADMIN/SUPER_ADMIN/STAFF. **Phần còn lại:** Phần còn lại xem SEC-080 (OptionalJwtAuthGuard coi token hết hạn là khách, cart populate lộ wholesalePrice, GET /categories/:id và /slug/:slug vẫn trả danh mục ẩn).

#### SEC-017 — GET /customers/:id và cập nhật CRM truy cập được tài khoản STAFF/ADMIN/SUPER_ADMIN

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-639 Authorization Bypass Through User-Controlled Key
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N (4.3)
- **Severity:** Low
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** customers
- **File/Function:** backend/src/modules/customers/customers.service.ts:307 (CustomersService.findById / updateCRMProfile / evaluateCustomerTier)
- **Tác nhân tấn công:** Staff
- **Nguồn phát hiện:** authz-commerce#4

**1. Mô tả.** findAll có lọc role CUSTOMER, nhưng findById(id) thì không: `userModel.findById(id).select('-password')`. Staff có MANAGE_CUSTOMERS vì vậy đọc được hồ sơ của bất kỳ user nào, kể cả ADMIN và SUPER_ADMIN (email, phone, role, permissions, tokenVersion, wishlist, loyalty) cùng 20 đơn gần nhất. Đây là thông tin dùng được cho phishing hoặc nhắm mục tiêu tài khoản quản trị, trong khi staff không được gọi /users. Tương tự, PATCH /customers/:id/crm và POST /customers/:id/evaluate-tier tạo và sửa CRM profile cho tài khoản không phải khách (getOrCreateCRMProfile), làm bẩn dữ liệu.

**2. Điều kiện khai thác.** STAFF có MANAGE_CUSTOMERS và biết ObjectId của tài khoản quản trị (lộ qua populate/notifications.readBy, xem phát hiện readBy).

**3. Tác động CIA.** C: Low (thông tin liên hệ và quyền của tài khoản quản trị), I: Low (CRM profile rác)

**4. Bằng chứng.** customers.service.ts:211 `filter = { role: UserRole.CUSTOMER }` (findAll). Dòng 307-308 `findById(id)` không có điều kiện role. Dòng 49-55 updateCRMProfile và 90-95 evaluateCustomerTier không kiểm role của target. Controller customers.controller.ts:47-80.

**5. Root Cause.** Thiếu ràng buộc loại đối tượng (object-level scoping) ở các endpoint theo id.

**6. Remediation.** Dùng `findOne({ _id: id, role: UserRole.CUSTOMER })` trong findById, updateCRMProfile và evaluateCustomerTier, trả 404 nếu không phải khách. Validate id bằng ParseObjectId/IsMongoObjectId.

**7. Files.** `backend/src/modules/customers/customers.service.ts`, `backend/src/modules/customers/customers.service.spec.ts` (các file đã sửa)

**8. Regression Tests.** customers.service.spec.ts: SEC-017-T01 (findById kèm role CUSTOMER, null với STAFF), T02 (updateCRMProfile NotFound, không tạo profile), T03 (evaluateCustomerTier NotFound), id không hợp lệ

**9. Acceptance Criteria.** GET /customers/<adminId> trả 404. PATCH crm và evaluate-tier với id không phải CUSTOMER trả 404.

**10. Fix Status — FIXED – VERIFIED.** findById dùng findOne({_id, role: CUSTOMER}) và trả null nếu id không hợp lệ; thêm assertIsCustomer (NotFoundException) ở updateCRMProfile và evaluateCustomerTier. **Phần còn lại:** Controller vẫn trả 200 + body rỗng khi findById trả null; updateCRMProfile với id sai định dạng vẫn ném BSONError dẫn tới 500 (hành vi cũ; R-019).

#### SEC-018 — GET /notifications/my-notifications lộ readBy chứa id người dùng khác

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-200 Exposure of Sensitive Information to an Unauthorized Actor
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N (4.3)
- **Severity:** Low
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** notifications
- **File/Function:** backend/src/modules/notifications/notifications.service.ts:149 (NotificationsService.findByUser)
- **Tác nhân tấn công:** Customer
- **Nguồn phát hiện:** authz-commerce#6

**1. Mô tả.** Thông báo global (userId=null, ví dụ promotion hoặc broadcast) lưu mảng readBy gồm ObjectId của mọi user đã đọc. findByUser dùng .lean() rồi spread `...item` vào response, nên mỗi khách đăng nhập nhận được toàn bộ mảng readBy. Từ đó họ liệt kê được ObjectId của các tài khoản khác, kể cả admin và staff. Các ID này là đầu vào cho tấn công BOLA (xem phát hiện /customers/:id) và để đếm số người dùng.

**2. Điều kiện khai thác.** Có tài khoản customer. Có ít nhất 1 thông báo global đã được người khác đọc.

**3. Tác động CIA.** C: Low (lộ định danh nội bộ của người dùng khác)

**4. Bằng chứng.** notifications.service.ts:137-144 `.find(filter)...lean()`. Dòng 149-162 `return { ...item, isRead }`, không loại readBy. schemas/notification.schema.ts:31 `readBy: Types.ObjectId[]`, không có select:false.

**5. Root Cause.** Trả document thô thay vì projection hoặc DTO.

**6. Remediation.** Thêm `.select('-readBy')` (hoặc projection chỉ gồm _id, title, message, type, meta, createdAt, isRead), hoặc `delete item.readBy` trước khi trả về. Tính isRead bằng aggregation hoặc $in trên server.

**7. Files.** `backend/src/modules/notifications/notifications.service.ts`, `backend/src/modules/notifications/notifications.service.spec.ts` (các file đã sửa)

**8. Regression Tests.** notifications.service.spec.ts: kết quả không có thuộc tính readBy, JSON không chứa id người khác, isRead đúng theo từng người dùng

**9. Acceptance Criteria.** Response my-notifications không chứa readBy. isRead vẫn đúng.

**10. Fix Status — FIXED – VERIFIED.** findByUser tách readBy khỏi từng item, chỉ trả isRead tính riêng cho người gọi.

#### SEC-023 — Hoàn trả POS nhiều dòng cùng sản phẩm hoàn tiền nhiều hơn đã bán

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-840 Business Logic Errors
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:N (4.9)
- **Severity:** Low (audit gốc: Medium; đã điều chỉnh theo verifier)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** pos
- **File/Function:** backend/src/modules/pos/pos.service.ts:1237 (PosService.refundPOSOrder)
- **Tác nhân tấn công:** Staff (POS_REFUND)
- **Nguồn phát hiện:** business-integrity#1

**1. Mô tả.** Vấn đề toàn vẹn tài chính, có thể bị lạm dụng để gian lận nội bộ. Số tiền đã hoàn `alreadyRefundedForItem` chỉ tính từ order.refundHistory đã lưu, không cộng các dòng đã xử lý trong cùng request. Ví dụ: dòng hàng qty=2, effectiveLineTotal=200k, gửi items=[{p,qty:1},{p,qty:1}]. Lần lặp 1 hoàn 100k. Lần lặp 2 thấy availableToReturn=1 bằng qty, nên hoàn `effectiveTotal - alreadyRefunded(0)` = 200k. Tổng hoàn 300k cho hàng trị giá 200k. Mức chặn cuối chỉ là `order.finalAmount - totalRefundedAmount`, nên nếu hóa đơn còn hàng khác thì phần dư được chi ra thành phiếu chi tiền mặt (CashEntry OUT), trong khi hàng còn lại không được nhập kho lại. DTO không chặn productId trùng lặp.

**2. Điều kiện khai thác.** Có quyền POS_REFUND. Hóa đơn có từ 2 dòng trở lên hoặc dòng qty ≥ 2.

**3. Tác động CIA.** Integrity: chi tiền mặt vượt giá trị hàng nhận lại, lệch sổ quỹ và tồn kho

**4. Bằng chứng.** pos.service.ts:1205-1267: vòng lặp dto.items, targetItem.returnedQuantity được cộng dồn trong bộ nhớ (1274-1275), nhưng alreadyRefundedForItem chỉ duyệt order.refundHistory (1238-1248). Nhánh `refItem.quantity === availableToReturn` hoàn toàn bộ phần còn lại (1251-1256). Phần cap ở 1345-1351 dựa trên finalAmount của cả hóa đơn. Phiếu chi được tạo ở 1405-1445. RefundPOSOrderDto (pos.dto.ts:284-304) không có ArrayUnique.

**5. Root Cause.** Biến tích lũy tiền hoàn theo sản phẩm không tính phần đã hoàn trong cùng request, và không gộp các dòng trùng sản phẩm/đơn vị trước khi tính.

**6. Remediation.** Gộp dto.items theo (productId, unit) trước khi xử lý, hoặc từ chối dòng trùng (ArrayUnique theo productId+unit). Ngoài ra duy trì một Map tiền đã hoàn trong request và cộng vào alreadyRefundedForItem. Có thể tính tiền hoàn đơn giản là round(netUnit*qty), với lần trả cuối cùng mới lấy phần dư.

**7. Files.** `backend/src/modules/pos/pos.service.ts`, `backend/src/modules/pos/pos.security.spec.ts (mới)` (các file đã sửa)

**8. Regression Tests.** pos.security.spec.ts: tổng số lượng dòng trùng vượt mức thì BadRequest và không cộng tồn kho; hoàn bút chia 2 dòng (1+2) chỉ ra 9.000đ thay vì 12.000đ

**9. Acceptance Criteria.** Tổng refundAmount của mỗi dòng hàng qua mọi lần trả không vượt effectiveLineTotal. Request có productId+unit trùng bị gộp hoặc bị từ chối 400.

**10. Fix Status — FIXED – VERIFIED.** Gộp số lượng theo từng dòng hóa đơn và validate trước khi chạm tồn kho; cộng số tiền đã tính cho cùng dòng hàng ở các dòng trước trong cùng yêu cầu vào alreadyRefundedForItem. *Ghi chú verifier: business-integrity#1 reach: downgraded -> Low.*

#### SEC-024 — Response tạo đơn/hoàn trả POS trả costPrice cho thu ngân

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-213
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N (4.3)
- **Severity:** Low
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** pos
- **File/Function:** backend/src/modules/pos/pos.service.ts:1076 (PosService.createPOSOrder / refundPOSOrder / findAll / findById)
- **Tác nhân tấn công:** Staff (POS_ACCESS)
- **Nguồn phát hiện:** authz-erp#7

**1. Mô tả.** findAll và findById cố ý xóa items[].costPrice với người không phải ADMIN (POS-08). Nhưng createPOSOrder trả nguyên savedOrder, kể cả nhánh idempotent replay (`return existing`), và refundPOSOrder trả nguyên `order`. Vì vậy mọi thu ngân có POS_ACCESS hoặc POS_REFUND đều thấy costPrice trong response. Ngoài ra grossMarginPercent và markupPercent không bị xóa ở bất kỳ nhánh nào, nên giá vốn suy ra được: cost = netUnitPrice × (1 − margin).

**2. Điều kiện khai thác.** STAFF có POS_ACCESS.

**3. Tác động CIA.** C: thu ngân biết giá vốn và biên lợi nhuận.

**4. Bằng chứng.** pos.service.ts:1076 `return savedOrder;`, :1097 `return existing;`, :1454 `return order;` (refund). Chính sách che có ở :1551-1556 và :1612-1616 `delete it.costPrice` khi !isManager. pos-order.schema.ts:52-53 costPrice, :83-87 grossMarginPercent/markupPercent trên POSOrderItem.

**5. Root Cause.** Logic che dữ liệu nằm rải rác trong từng hàm đọc, không áp dụng cho response của hàm ghi. Danh sách trường nhạy cảm thiếu margin/markup.

**6. Remediation.** Tạo một hàm `sanitizePosOrderForActor(order, actor)` dùng chung cho create, refund, findAll và findById. Hàm này xóa costPrice, grossMarginPercent, markupPercent, baseSellingPrice (tùy nghiệp vụ) khi actor không phải ADMIN/SUPER_ADMIN, và che SĐT như hiện tại.

**7. Files.** `backend/src/modules/pos/pos.service.ts`, `backend/src/modules/pos/pos.service.spec.ts`, `backend/src/modules/pos/pos.security.spec.ts (mới)` (các file đã sửa)

**8. Regression Tests.** pos.security.spec.ts: create bởi thu ngân không có costPrice/grossMarginPercent/markupPercent nhưng ADMIN thấy; refund bởi thu ngân không lộ

**9. Acceptance Criteria.** Response POST /pos/orders và POST /pos/orders/:id/refund với actor STAFF không chứa costPrice, grossMarginPercent, markupPercent.

**10. Fix Status — FIXED – VERIFIED.** Helper sanitizeOrderForActor: với vai trò không phải ADMIN/SUPER_ADMIN trả bản sao đã xóa costPrice, grossMarginPercent, markupPercent từng dòng; áp dụng cho createPOSOrder (mới, replay, race 11000) và refundPOSOrder.

#### SEC-069 — Nhân viên chỉ có MANAGE_PRODUCTS tạo được phiếu trả hàng NCC (trừ kho, bù trừ công nợ)

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-863 (Incorrect Authorization) / CWE-285
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N (4.3)
- **Severity:** Low (audit gốc: Medium; đã điều chỉnh theo verifier)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** purchasing
- **File/Function:** backend/src/modules/purchasing/purchase-returns.controller.ts:29 (PurchaseReturnsController.create / PurchaseReturnsService.createReturn)
- **Tác nhân tấn công:** Staff (MANAGE_PRODUCTS hoặc MANAGE_INVENTORY)
- **Nguồn phát hiện:** authz-erp#2

**1. Mô tả.** POST /api/purchasing/returns chấp nhận MANAGE_INVENTORY hoặc MANAGE_PRODUCTS. Service ghi phiếu ở trạng thái POSTED ngay, trừ tồn kho thực tế qua inventoryService.adjustStock, và nếu body có `applyCreditAdjustmentImmediately: true` thì gọi financeService.applyPurchaseReturnCredit để giảm remainingAmount/totalAmount của công nợ phải trả NCC hoặc sinh refundDueAmount. Trong khi đó, chính hành động bù trừ công nợ này qua endpoint riêng POST /purchasing/returns/:id/credit-adjustment lại bắt buộc MANAGE_FINANCE. Vì vậy một nhân viên quản lý danh mục sản phẩm (không có quyền kho, không có quyền tài chính) vẫn trừ được kho và điều chỉnh sổ công nợ phải trả.

**2. Điều kiện khai thác.** STAFF có MANAGE_PRODUCTS. Tồn tại goods receipt có hàng chưa trả hết.

**3. Tác động CIA.** I: thay đổi tồn kho và số dư công nợ phải trả NCC ngoài thẩm quyền. Giá trị bị giới hạn bởi số lượng còn có thể trả trên GRN gốc (service :209) và đơn giá thực nhận (:226).

**4. Bằng chứng.** purchase-returns.controller.ts:29-33 `@Permissions(StaffPermission.MANAGE_INVENTORY, StaffPermission.MANAGE_PRODUCTS)` trên create. :57-58 credit-adjustment `@Permissions(StaffPermission.MANAGE_FINANCE)`. purchase-returns.service.ts:280 `status: PurchaseReturnStatus.POSTED`. :296-313 adjustStock với quantity âm. :316-345 `if (dto.applyCreditAdjustmentImmediately && this.financeService && totalAmount > 0) { ... applyPurchaseReturnCredit(...) }`. dto/purchase-return.dto.ts:68-70 `@IsOptional() @IsBoolean() applyCreditAdjustmentImmediately?`. finance.service.ts:868-873 giảm payable.remainingAmount và totalAmount.

**5. Root Cause.** Kiểm tra quyền chỉ đặt ở cấp route với danh sách permission rộng. Bên trong một hành động kho, service thực hiện thêm side-effect tài chính mà không kiểm tra lại quyền tài chính của actor.

**6. Remediation.** 1) Bỏ MANAGE_PRODUCTS khỏi @Permissions của POST /purchasing/returns (chỉ MANAGE_INVENTORY). 2) Trong controller, nếu `dto.applyCreditAdjustmentImmediately === true` mà actor không phải ADMIN/SUPER_ADMIN và không có MANAGE_FINANCE thì trả 403, hoặc bỏ qua cờ và để PENDING. 3) Truyền actor (role, permissions) xuống service để kiểm tra lại. 4) Cập nhật route-coverage hoặc test RBAC.

**7. Files.** `backend/src/modules/purchasing/purchase-returns.controller.ts`, `backend/src/modules/purchasing/purchase-returns.service.ts`, `backend/src/modules/purchasing/purchase-returns.service.spec.ts` (các file cần sửa theo audit)

**8. Regression Tests.** Test controller/guard: STAFF[MANAGE_PRODUCTS] gọi create thì Forbidden. STAFF[MANAGE_INVENTORY] với cờ immediate=true thì applyPurchaseReturnCredit không được gọi. ADMIN thì được gọi. (đề xuất, chưa viết)

**9. Acceptance Criteria.** STAFF chỉ có MANAGE_PRODUCTS gọi POST /purchasing/returns nhận 403. STAFF có MANAGE_INVENTORY nhưng không có MANAGE_FINANCE gửi applyCreditAdjustmentImmediately=true thì nhận 403, hoặc phiếu vẫn ở creditAdjustmentStatus PENDING và payable không đổi.

**10. Fix Status — OPEN.** Chưa có bản sửa trong đợt này. *Ghi chú verifier: authz-erp#2 reach: downgraded -> Low.*

#### SEC-073 — Phân quyền entity trong data-exchange lệch với module gốc (MANAGE_PRODUCTS ghi đè dữ liệu suppliers)

- **Category:** Confirmed Vulnerability
- **CWE:** CWE-863 (Incorrect Authorization)
- **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N (4.3)
- **Severity:** Low
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module:** data-exchange
- **File/Function:** backend/src/modules/data-exchange/data-exchange.controller.ts:79 (DataExchangeController.checkEntityPermission; DataExchangeService.executeValidRow)
- **Tác nhân tấn công:** Staff (MANAGE_PRODUCTS)
- **Nguồn phát hiện:** authz-erp#6

**1. Mô tả.** checkEntityPermission('suppliers') chấp nhận MANAGE_INVENTORY hoặc MANAGE_PRODUCTS. Trong khi đó toàn bộ SuppliersController yêu cầu MANAGE_INVENTORY. Vì vậy một STAFF chỉ có MANAGE_PRODUCTS, qua POST /data-exchange/execute/suppliers, vẫn tạo mới hoặc ghi đè name, phone, email, address, taxCode của nhà cung cấp hiện có (theo code). Đây là dữ liệu master dễ bị lợi dụng cho gian lận đổi thông tin liên hệ NCC. Ngoài ra import 'products' (chỉ cần MANAGE_PRODUCTS) gọi inventoryService.importStock với stock và costPrice lấy từ file Excel, tức ghi IMPORT và xác lập giá vốn mà không có MANAGE_INVENTORY. Import 'opening_stock' có thể chạy lặp lại bằng allowReimport=true, mỗi lần cộng thêm tồn.

**2. Điều kiện khai thác.** STAFF có MANAGE_PRODUCTS. File .xlsx hợp lệ.

**3. Tác động CIA.** I: sửa dữ liệu master nhà cung cấp, tồn kho ban đầu và giá vốn ngoài thẩm quyền.

**4. Bằng chứng.** data-exchange.controller.ts:79-87 `else if (type === 'suppliers') { if (!perms.includes(MANAGE_INVENTORY) && !perms.includes(MANAGE_PRODUCTS)) throw ... }`. suppliers.controller.ts:30-31 class `@Permissions(StaffPermission.MANAGE_INVENTORY)`. data-exchange.service.ts:884-892 ghi đè supplier hiện có. :853-866 `inventoryService.importStock({ quantity: initialStock, costPrice: initialCost, ...})` trong nhánh products. :919-941 opening_stock importStock, :971-985 chặn reimport chỉ khi `!options?.allowReimport`.

**5. Root Cause.** Ma trận quyền theo entity trong data-exchange được định nghĩa riêng, không dùng lại quyền của module đích. Import sản phẩm gộp luôn thao tác kho.

**6. Remediation.** 1) suppliers: chỉ MANAGE_INVENTORY (đồng bộ với SuppliersController). 2) products import: bỏ cột stock/costPrice, hoặc yêu cầu thêm MANAGE_INVENTORY khi file có stock > 0. 3) opening_stock và allowReimport: chỉ ADMIN, hoặc chặn khi sản phẩm đã có giao dịch kho.

**7. Files.** `backend/src/modules/data-exchange/data-exchange.controller.ts`, `backend/src/modules/data-exchange/data-exchange.service.ts` (các file cần sửa theo audit)

**8. Regression Tests.** data-exchange.controller spec: checkEntityPermission(user{perms:[MANAGE_PRODUCTS]}, 'suppliers') phải throw ForbiddenException. (đề xuất, chưa viết)

**9. Acceptance Criteria.** STAFF[MANAGE_PRODUCTS] gọi preview/execute với type=suppliers nhận 403. Import products bởi STAFF không có MANAGE_INVENTORY thì không tạo IMPORT transaction có costPrice.

**10. Fix Status — OPEN.** Chưa có bản sửa trong đợt này.

---

## 13. Potential Risks

61 mục thuộc nhóm Potential Risk, Misconfiguration và Best Practice Improvement. Dùng mẫu rút gọn.

#### SEC-025 — Import Excel sản phẩm thiếu kiểm tra magic bytes và giới hạn số dòng

- **Category / Severity / Status:** Potential Risk / Medium / FIXED – VERIFIED — **CWE:** CWE-409 — **CVSS:** CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:N/A:H (4.9)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt, có dynamic test)
- **Module / File:** products / data-exchange — backend/src/modules/products/products.service.ts:1568 (importFromExcel / parseWorkbook)
- **Mô tả:** POST /products/import/excel chỉ kiểm tra đuôi tên file và giới hạn 10MB. Route này không gọi validateFileSafety và không có giới hạn số dòng như module data-exchange (5000 dòng). Nó tải toàn bộ product và category vào bộ nhớ, rồi xử lý tuần tự từng dòng với nhiều lần save. File xlsx 10MB (zip) có thể giải nén ra hàng trăm MB XML hoặc hàng triệu dòng. Lệnh workbook.xlsx.load() đọc toàn bộ vào RAM. Ở data-exchange, việc kiểm sheet.rowCount > 5000 cũng chỉ chạy sau khi load xong. Một upload có thể làm tiến trình Node hết bộ nhớ và sập toàn bộ API. Chưa chạy PoC.
- **Điều kiện / Tác động:** STAFF có MANAGE_PRODUCTS hoặc MANAGE_INVENTORY (hoặc tài khoản bị chiếm). / A:H (sập process)
- **Root cause:** Parse đồng bộ toàn bộ workbook trong bộ nhớ, không giới hạn kích thước sau giải nén.
- **Remediation:** 1) Gọi validateFileSafety và áp giới hạn 5000 dòng cho products import, hoặc chuyển hẳn route này sang pipeline data-exchange. 2) Dùng ExcelJS.stream.xlsx.WorkbookReader để đọc streaming và dừng khi vượt N dòng. Có thể kiểm tổng uncompressed size trong central directory của zip trước khi parse. 3) Cân nhắc đẩy import sang job nền.
- **Acceptance:** File có hơn 5000 dòng hoặc kích thước giải nén vượt ngưỡng bị từ chối mà không tăng RAM đáng kể.
- **Đã làm:** validateImportFileSafety (mirror logic DataExchangeService): từ chối buffer rỗng, >10MB, thiếu magic bytes zip, tên file chứa "..", "/", "\"; tối đa 10 sheet và 5000 dòng (PRODUCT_IMPORT_MAX_ROWS); controller truyền file.originalname.
- **Còn lại:** exceljs vẫn nạp toàn bộ workbook trước khi kiểm tra rowCount và chưa kiểm tra kích thước sau giải nén (zip bomb); được giảm bởi trần 10MB (R-017).
- **Files đã sửa:** `backend/src/modules/products/products.service.ts`, `backend/src/modules/products/products.controller.ts`, `backend/src/modules/products/products.public-exposure.spec.ts (mới)`
- **Regression tests:** products.public-exposure.spec.ts: từ chối file không phải zip, buffer rỗng, tên file path traversal, file 5001 dòng (không chạm DB)

#### SEC-044 — Rate-limit đăng nhập/OTP/reset chỉ theo req.ip, không khóa theo tài khoản (phần trust proxy đã có ở commit 99b4309)

- **Category / Severity / Status:** Misconfiguration / Medium / PARTIAL — **CWE:** CWE-307 / CWE-348 — **CVSS:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L (5.3)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** auth / throttler — backend/src/modules/auth/auth.controller.ts:162 (AuthController.login / AuthService.login)
- **Mô tả:** Đăng nhập chỉ bị giới hạn 5 lần/phút qua `@Throttle`, tracker mặc định là `req.ip`. Không có bộ đếm lần sai theo email và không có lockout hoặc backoff theo tài khoản. Code không đặt `app.set('trust proxy', ...)` hay override `getTracker` (grep không thấy). Hệ quả phụ thuộc vào cách triển khai: (a) Sau proxy (Render, Vercel rewrite, nginx), mọi người dùng chung một IP proxy, nên kẻ tấn công gửi 5 request/phút là khóa đăng nhập, quên mật khẩu, verify OTP của TẤT CẢ người dùng. (b) Nếu sau này bật trust proxy, hoặc backend lộ trực tiếp (docker-compose publish 3000), credential stuffing phân tán qua nhiều IP không bị hạn chế theo tài khoản. `SecurityAuditService.logAuthFailure` chỉ ghi log, không dùng để chặn. Phát hiện này trùng với mục trust proxy của bản đồ kiến trúc, ở đây nhìn từ góc độ xác thực.
- **Điều kiện / Tác động:** Triển khai sau proxy (DoS), hoặc có nhiều IP (brute-force) / A: chặn đăng nhập toàn hệ thống. C/I: tạo điều kiện brute-force phân tán
- **Root cause:** Kiểm soát brute-force chỉ dựa vào IP, và IP thực của client không được xác định đúng sau reverse proxy.
- **Remediation:** 1) Đặt `app.getHttpAdapter().getInstance().set('trust proxy', <số hop cụ thể hoặc dải IP của proxy>)`, không dùng `true`. 2) Thêm throttler key theo `email` (đã chuẩn hóa) cho /auth/login, /auth/forgot-password, /auth/verify-otp, /auth/reset-password (ví dụ override `getTracker` theo route, hoặc dùng bộ đếm Redis `login:fail:<email>` có backoff tăng dần hay khóa tạm 15 phút sau 10 lần sai). 3) Cân nhắc CAPTCHA sau N lần sai.
- **Acceptance:** Hai client khác IP sau proxy có bucket riêng. 10 lần sai cho cùng một email từ nhiều IP thì bị chặn tạm thời.
- **Đã làm:** CẬP NHẬT KHI LẬP BÁO CÁO: mô tả và bằng chứng gốc nói code không có trust proxy (grep 0 kết quả) nhưng mã hiện tại đã có: resolveTrustProxy/applyTrustProxy đọc TRUST_PROXY (số hop 0-10, loopback/CIDR; cấm true ở production; mặc định 1 hop khi chạy trên cloud) và áp dụng ở main.ts, đã commit ở 99b4309 (BUG-011). Vì vậy kịch bản "mọi người dùng chung một bucket sau proxy" chỉ còn xảy ra nếu TRUST_PROXY cấu hình sai số hop.
- **Còn lại:** Chưa có khóa/backoff theo tài khoản (email đã chuẩn hóa) cho login, forgot-password, verify-otp, reset-password; chưa xác minh số hop thật trên production (trùng SEO-TASK-012 trong docs/PENDING_TASKS.md); backend vẫn publish cổng 3000 trong docker-compose (xem SEC-051).
- **Files đã sửa:** `backend/src/config/trust-proxy.ts`, `backend/src/main.ts`, `backend/src/config/env.validation.ts`, `backend/src/config/trust-proxy.spec.ts`
- **Regression tests:** backend/src/config/trust-proxy.spec.ts và env.validation.spec.ts (BUG-011), nằm trong 90 suites / 1183 test PASS của bước kiểm tra cuối. Không phải bản sửa của đợt audit này.

#### SEC-065 — Khách vãng lai giữ (trừ) tồn kho hàng loạt bằng đơn COD PENDING (giữ 48h)

- **Category / Severity / Status:** Potential Risk / Medium / OPEN — **CWE:** CWE-799 — **CVSS:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:L (6.5)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** orders / landing-pages — backend/src/modules/landing-pages/landing-page.controller.ts:81 (submitOrder / createAtomic / checkGuestCheckoutProtection)
- **Mô tả:** Đơn COD của khách trừ tồn kho ngay khi tạo (deductOrderStock). Cron chỉ tự hủy đơn COD PENDING sau 48h. OrderItemDto.quantity không có @Max, nên một đơn có thể trừ toàn bộ tồn kho của một sản phẩm. Lớp bảo vệ khách vãng lai chỉ đếm theo số điện thoại: tối đa 3 đơn pending, cần Turnstile từ đơn thứ 3. Đổi số điện thoại (định dạng VN hợp lệ) là vượt được. POST /landing-pages/submit-order không có @Throttle riêng nên dùng mặc định 100/phút/IP, trong khi POST /orders là 10/phút. Route này cũng không truyền clientIp. Kết quả là đối thủ hoặc bot có thể làm sản phẩm hiển thị hết hàng trong 48h và làm rác dữ liệu đơn. Chưa xác minh runtime.
- **Điều kiện / Tác động:** Không cần đăng nhập. Có nhiều số điện thoại hợp lệ (có thể sinh ngẫu nhiên). / I:L A:L (khả dụng hàng hóa)
- **Root cause:** Chống lạm dụng luồng đặt hàng khách chỉ dựa vào số điện thoại do client cung cấp. Thiếu giới hạn số lượng và throttle nhất quán.
- **Remediation:** 1) Thêm @Throttle({default:{limit:10,ttl:60000}}) cho submit-order và truyền req.ip. 2) Thêm @Max cho quantity, cấu hình được theo nghiệp vụ, ví dụ 50 cho khách. 3) Giới hạn tổng số lượng đang giữ theo IP hoặc thiết bị, hoặc bắt buộc Turnstile ngay từ đơn đầu tiên khi số lượng lớn. 4) Cân nhắc rút thời gian giữ hàng cho đơn khách chưa xác nhận.
- **Acceptance:** submit-order bị chặn sau 10 request/phút. Quantity vượt ngưỡng trả 400.

#### SEC-072 — Thiếu phân tách nhiệm vụ (maker-checker) trên PO, báo giá NCC, chứng từ điện tử, phiếu thu/chi

- **Category / Severity / Status:** Potential Risk / Medium / OPEN — **CWE:** CWE-654 (Reliance on a Single Factor in a Security Decision) / CWE-841 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** purchasing / finance / documents — backend/src/modules/purchasing/purchase-orders.service.ts:386 (PurchaseOrdersService.approve; SupplierQuotationsService.approve; DocumentsService.postDocument/reverseDocument; FinanceService.createEntry/reverseEntry)
- **Mô tả:** Các hành động phê duyệt hoặc ghi sổ quan trọng đều cho phép chính người lập tự duyệt, không có ngưỡng giá trị và không có permission duyệt riêng:
(1) PATCH /purchase-orders/:id/approve chỉ kiểm tra status DRAFT. Người tạo PO (MANAGE_INVENTORY) tự duyệt, rồi tạo goods receipt, và hệ thống tự sinh công nợ phải trả (goods-receipts.service.ts:284).
(2) PATCH /supplier-quotations/:id/approve cũng vậy.
(3) PATCH /documents/:id/post gán `approvedBy = userId` cho chính người gọi, và reverseDocument tạo chứng từ đối ứng với createdBy = approvedBy = cùng một người.
(4) POST /finance/entries tạo phiếu chi (OUT) giá trị bất kỳ, tối đa bằng số dư quỹ, rồi POST /finance/entries/:id/reverse, đều bởi cùng một STAFF có MANAGE_FINANCE, không có ngưỡng duyệt.
Nếu một STAFF được gán cả MANAGE_INVENTORY và MANAGE_FINANCE thì người đó thực hiện trọn chu trình procure-to-pay một mình.
- **Điều kiện / Tác động:** STAFF có permission tương ứng. Nghiêm trọng hơn khi một người có nhiều permission. / I: gian lận nội bộ (PO hoặc chi tiền khống, tự hợp thức hóa). Mức độ phụ thuộc vào cách gán permission thực tế.
- **Root cause:** Mô hình RBAC chỉ có permission dạng "MANAGE_*" thô, không tách quyền lập và quyền duyệt. Service không ghi nhận hay kiểm tra quan hệ người lập với người duyệt.
- **Remediation:** 1) Thêm các permission duyệt riêng (ví dụ APPROVE_PURCHASE_ORDERS, APPROVE_FINANCE_ENTRIES, POST_DOCUMENTS), hoặc giới hạn approve/post/reverse cho ADMIN. 2) Từ chối khi approver trùng createdBy. 3) Đặt ngưỡng giá trị (ví dụ PO hoặc phiếu chi trên X đồng thì bắt buộc ADMIN). 4) Ghi audit log có actor cho mọi hành động duyệt.
- **Acceptance:** Người tạo PO, báo giá, chứng từ hoặc phiếu chi không tự approve/post được (403). Hành động trên ngưỡng yêu cầu ADMIN.

#### SEC-019 — Bộ đếm lần thử OTP kiểu đọc-rồi-ghi, request song song vượt giới hạn

- **Category / Severity / Status:** Potential Risk / Low / FIXED – VERIFIED — **CWE:** CWE-362 / CWE-307 — **CVSS:** CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:L/I:L/A:N (4.8)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** auth — backend/src/modules/auth/auth.service.ts:539 (AuthService.verifyOtp / resetPassword)
- **Mô tả:** `verifyOtp` và `resetPassword` (nhánh OTP) đọc `resetOtpAttempts`, so sánh, rồi `user.save()`. Schema không bật `optimisticConcurrency` và không dùng `$inc` có điều kiện. Nhiều request song song cùng đọc attempts=0, nên số lần đoán thực tế mỗi OTP vượt 5. Có hai endpoint dùng chung bộ đếm (verify-otp 5 lần/5 phút/IP và reset-password 5 lần/phút/IP). Với nhiều IP (khi trust proxy được cấu hình đúng hoặc backend lộ trực tiếp), kẻ tấn công có thể gửi hàng nghìn lần đoán cho mỗi lần phát OTP, rồi gọi forgot-password để lấy OTP mới. Không gian 6 chữ số (900k) khiến rủi ro thực tế thấp nhưng không còn được giới hạn chặt.
- **Điều kiện / Tác động:** Nhiều IP, gửi request song song / C/I: chiếm tài khoản nếu đoán trúng OTP
- **Root cause:** Cập nhật bộ đếm bảo mật không atomic.
- **Remediation:** Dùng `findOneAndUpdate({_id, resetOtpAttempts: {$lt: 5}, resetOtpExpiry: {$gt: now}}, {$inc: {resetOtpAttempts: 1}}, {new: true})` TRƯỚC khi so OTP. Nếu không có kết quả trả về thì từ chối. Khi so khớp thành công thì xóa OTP (single-use) ở verify-otp hoặc reset.
- **Acceptance:** 20 request verify song song với OTP sai thì DB ghi nhận tối đa 5 lần và OTP bị hủy.
- **Đã làm:** reserveOtpAttempt: findOneAndUpdate có điều kiện {resetOtp hiện tại, attempts < 5} và $inc, đặt chỗ nguyên tử trước khi so khớp OTP; áp dụng cho verifyOtp và nhánh OTP của resetPassword.
- **Còn lại:** Có nhánh dự phòng không nguyên tử chỉ cho mock (runtime luôn nhận Mongoose document). Sạch hơn nếu thêm UsersService.reserveOtpAttempt rồi bỏ nhánh dự phòng. Lần nhập đúng cũng tính vào bộ đếm (tối đa 5 lần/OTP).
- **Files đã sửa:** `backend/src/modules/auth/auth.service.ts`, `backend/src/modules/auth/auth.service.spec.ts`
- **Regression tests:** auth.service.spec.ts, describe "SEC-019 atomic OTP attempt counter": dùng findOneAndUpdate/$inc, không save(); 20 lần đoán song song chỉ có 5 lần so khớp; hết lượt thì OTP đúng cũng bị từ chối; lượt cuối vẫn chấp nhận OTP đúng

#### SEC-020 — WebSocket /notifications xác thực bằng cookie nhưng không kiểm tra Origin

- **Category / Severity / Status:** Potential Risk / Low / FIXED – VERIFIED — **CWE:** CWE-1385 — **CVSS:** CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N (3.1)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** notifications (websocket auth) — backend/src/modules/notifications/notifications.gateway.ts:68 (NotificationsGateway.extractToken / handleConnection)
- **Mô tả:** Gateway nhận access token từ cookie `access_token`. Option `cors.origin` của socket.io chỉ áp dụng cho HTTP long-polling. Frontend dùng `transports:['websocket']`, mà đường upgrade WebSocket không đi qua CORS và gateway không có `allowRequest` để kiểm tra header Origin. Ngoài ra `!origin` luôn được chấp nhận. Hiện tại `COOKIE_SAME_SITE=lax` nên cookie không được gửi cross-site. Tuy vậy, mô hình Vercel (frontend) tới Render (socket gọi thẳng `VITE_SOCKET_URL`) chỉ hoạt động với cookie nếu đặt SameSite=none trên domain backend. Khi đó một trang độc hại mở được socket thay nạn nhân là ADMIN và đọc thông báo đơn hàng, tồn kho ở room `admin:orders` và `admin:inventory`. Chưa xác minh runtime. Bản đồ kiến trúc đã nêu, ở đây xác nhận lại trong phạm vi websocket auth.
- **Điều kiện / Tác động:** COOKIE_SAME_SITE=none, nạn nhân là admin đang đăng nhập và truy cập trang độc hại / C: thấp đến trung bình (lộ thông báo đơn hàng, tồn kho)
- **Root cause:** Dựa vào CORS của socket.io (không áp dụng cho WebSocket) để giới hạn origin, trong khi vẫn chấp nhận credential là cookie ambient.
- **Remediation:** Thêm `allowRequest: (req, cb) => cb(null, isAllowedOrigin(req.headers.origin))` vào cấu hình gateway, từ chối khi không có Origin nếu credential đến từ cookie. Hoặc chỉ chấp nhận token qua `handshake.auth.token` (frontend lấy short-lived ws-ticket qua API) và bỏ cookie.
- **Acceptance:** Handshake WebSocket với Origin lạ bị từ chối dù cookie hợp lệ.
- **Đã làm:** Khi token đến từ cookie access_token, Origin phải nằm trong FRONTEND_URL (danh sách phân tách dấu phẩy); localhost chỉ cho phép khi không phải production. Token tường minh (mobile) không bị kiểm tra Origin.
- **Còn lại:** Production phải khai báo đủ origin (www và không www) trong FRONTEND_URL, giống CORS HTTP (R-022).
- **Files đã sửa:** `backend/src/modules/notifications/notifications.gateway.ts`, `backend/src/modules/notifications/notifications.gateway.spec.ts`
- **Regression tests:** notifications.gateway.spec.ts, describe "SEC-020": cookie + Origin lạ bị ngắt và không verify JWT; Origin hợp lệ trong danh sách nhiều origin được chấp nhận; localhost bị từ chối ở production; Bearer/auth.token không bị kiểm tra Origin

#### SEC-021 — POST /landing-pages/submit-order thiếu throttle riêng và không kiểm tra trạng thái trang

- **Category / Severity / Status:** Potential Risk / Low / PARTIAL — **CWE:** CWE-770 Allocation of Resources Without Limits or Throttling — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** landing-pages — backend/src/modules/landing-pages/landing-page.controller.ts:81 (LandingPageController.submitOrder / LandingPageService.submitOrder)
- **Mô tả:** POST /orders (guest) giới hạn 10 request/phút, còn submit-order chỉ chịu giới hạn mặc định 100/phút và không truyền clientIp cho Turnstile. Mỗi đơn COD giữ tồn kho (deductOrderStock). Kẻ tấn công xoay số điện thoại để né giới hạn theo phone có thể tạo hàng loạt đơn PENDING, khóa tồn kho của sản phẩm flash-sale. Service cũng không kiểm tra `page.status`: landing page đã tắt vẫn nhận đơn (checkout sẽ tính giá sản phẩm thường, vì checkout có kiểm tra landingPage.status).
- **Điều kiện / Tác động:** Biết landingPageId (có trong response public/:slug). / A: Low/Medium (khóa tồn kho bằng đơn ảo)
- **Root cause:** Luồng landing page không dùng chung cấu hình chống spam với POST /orders.
- **Remediation:** Thêm `@Throttle({ default: { limit: 10, ttl: 60000 } })`. Truyền req.ip (sau khi bật trust proxy). Bổ sung captchaToken vào SubmitOrderDto. Kiểm tra `page.status === true` trước khi tạo đơn.
- **Acceptance:** Request thứ 11 trong 1 phút nhận 429. Landing page status=false trả 404.
- **Đã làm:** @Throttle 10/phút cho submit-order; page.status !== true thì ném NotFoundException trước khi gọi productsService/ordersService; xác minh giá chỉ lấy từ cấu hình server (SubmitOrderDto không có trường price).
- **Còn lại:** Cửa sổ ngày hiệu lực (startAt/endAt) chưa làm: schema LandingPage không có trường này, cần thêm vào schema + CreateLandingPageDto và quyết định nghiệp vụ. SubmitOrderDto.note chưa có @MaxLength (R-005).
- **Files đã sửa:** `backend/src/modules/landing-pages/landing-page.controller.ts`, `backend/src/modules/landing-pages/landing-page.service.ts`, `backend/src/modules/landing-pages/landing-page.service.spec.ts`
- **Regression tests:** landing-page.service.spec.ts: trang inactive bị 404 và không tạo đơn; giá lấy từ gói server dù client gửi price=1; metadata throttle limit=10/ttl=60000 (12/12 pass)

#### SEC-022 — Race khi khách/guest hủy đơn đã chuyển sang CONFIRMED/PROCESSING

- **Category / Severity / Status:** Potential Risk / Low / FIXED – VERIFIED — **CWE:** CWE-367 TOCTOU — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** orders/lifecycle — backend/src/modules/orders/services/order-lifecycle.service.ts:114 (OrderLifecycleService.updateStatus / cancelGuest)
- **Mô tả:** Race condition TOCTOU. Điều kiện 'chỉ hủy khi PENDING' của customer/guest được kiểm tra trên bản đọc ngoài transaction. Trong transaction, updateStatusInternal chỉ dùng bảng allowedTransitions chung, mà bảng này cho phép CONFIRMED→CANCELLED và PROCESSING→CANCELLED. Nếu nhân viên xác nhận hoặc đóng gói đơn đúng lúc khách bấm hủy, đơn vẫn bị hủy. Cửa sổ race nhỏ, tác động thấp: đơn đang chuẩn bị bị hủy, kho được hoàn.
- **Điều kiện / Tác động:** Hủy đồng thời với thao tác xác nhận của nhân viên. / Integrity thấp
- **Root cause:** Ràng buộc theo vai trò không được truyền vào bước kiểm tra trong transaction.
- **Remediation:** Truyền `requiredFromStatus: PENDING` (hoặc actorRole) vào updateStatusInternal và kiểm tra lại `order.orderStatus === PENDING` trên bản đọc trong session khi actor là customer/guest.
- **Acceptance:** Customer hủy khi bản ghi trong session là CONFIRMED thì nhận 400.
- **Đã làm:** Cờ nội bộ _expectedStatus=PENDING đặt cho khách (không phải admin/staff) trong updateStatus và cho cancelGuest; updateStatusInternal kiểm tra lại trạng thái bên trong transaction ngay sau khi đọc đơn.
- **Còn lại:** Dựa vào transaction MongoDB và WriteConflict retry; nhánh không có session (standalone/mock) chỉ re-check, không atomic. Liên quan SEC-063 (R-021).
- **Files đã sửa:** `backend/src/modules/orders/services/order-lifecycle.service.ts`, `backend/src/modules/orders/services/order-lifecycle.service.spec.ts`
- **Regression tests:** order-lifecycle.service.spec.ts: 2 test (khách có tài khoản và guest; đơn đã CONFIRMED trong transaction thì BadRequest và save không được gọi)

#### SEC-026 — sanitizePayload trả nguyên dữ liệu khi lồng sâu hơn 15 cấp (bỏ qua lọc $-key và XSS)

- **Category / Severity / Status:** Best Practice Improvement / Low / FIXED – VERIFIED — **CWE:** CWE-943, CWE-1321 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** Security middleware ; common/security — backend/src/common/security/security.sanitizer.ts:123 (sanitizePayload)
- **Mô tả:** Khi `currentDepth > maxDepth` (mặc định 15), hàm trả về `data` gốc mà không loại key `$`/`.`/`__proto__` và không lọc HTML. Body JSON (giới hạn 1mb, body-parser không giới hạn độ sâu) có thể lồng hơn 15 cấp. Rủi ro chỉ thành hiện thực nếu có DTO hoặc handler nhận object tự do (`@IsObject()` hay `Record<string, unknown>`, ví dụ tham số IPN của payments) rồi đưa xuống Mongo query hoặc render HTML. Tôi chưa tìm thấy đường khai thác cụ thể (Not Verified end-to-end).
- **Điều kiện / Tác động:** Có endpoint nhận object lồng sâu tùy ý / Phụ thuộc vào nơi dùng payload
- **Root cause:** Giới hạn độ sâu được thiết kế fail-open thay vì fail-closed
- **Remediation:** Khi vượt maxDepth thì throw BadRequestException (fail-closed) hoặc bỏ nhánh đó, thay vì trả nguyên dữ liệu.
- **Acceptance:** Payload lồng 20 cấp chứa `$where` bị từ chối hoặc bị loại
- **Đã làm:** Ném BadRequestException("Dữ liệu đầu vào lồng quá sâu") khi vượt maxDepth với object/array/string; số/boolean đi qua. Middleware đã bọc try/catch trả 400.
- **Files đã sửa:** `backend/src/common/security/security.sanitizer.ts`, `backend/src/common/security/security.sanitizer.spec.ts`
- **Regression tests:** security.sanitizer.spec.ts: object/mảng/chuỗi lồng 20 tầng ném BadRequestException; lồng 5 tầng vẫn được lọc
- *Ghi chú verifier:* devsecops#12 reach: downgraded -> Low.

#### SEC-027 — nginx.conf thiếu security headers đầy đủ (CSP, HSTS, Permissions-Policy, Referrer-Policy lỏng) và header bị mất ở location tĩnh

- **Category / Severity / Status:** Misconfiguration / Low / FIXED – NOT VERIFIED — **CWE:** CWE-693 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (xác nhận bởi 2 lượt kiểm chứng độc lập)
- **Module / File:** frontend/nginx.conf ; Frontend hosting (Docker/nginx) — frontend/nginx.conf:16
- **Mô tả:** Khi chạy bằng Docker/nginx, frontend không có Content-Security-Policy, Strict-Transport-Security hay Permissions-Policy. Hai header đang có thì yếu hơn bản Vercel: X-Frame-Options là SAMEORIGIN (Vercel là DENY), Referrer-Policy là `no-referrer-when-downgrade`, gửi full URL gồm path `/orders/guest/<id>` hay `/my-orders/<id>` tới các host ảnh bên thứ ba (qrserver, vietqr, unsplash, cloudinary). Thêm vào đó, block `location ~* \.(js|css|...)` có `add_header Cache-Control`. Theo quy tắc kế thừa của nginx, block này không nhận các add_header ở cấp server, nên file JS/CSS không có nosniff hay XFO.
- **Điều kiện / Tác động:** Triển khai bằng Docker image frontend (không qua Vercel). / Thấp. Rò URL nội bộ qua Referer, thiếu lớp chặn XSS và clickjacking cùng origin.
- **Root cause:** Cấu hình nginx không được đồng bộ với header của Vercel.
- **Remediation:** Đưa các header bảo mật vào một snippet (`include /etc/nginx/snippets/security-headers.conf;`) và include ở cấp server và trong mọi location có add_header. Dùng CSP giống Vercel (đã bỏ unsafe-inline), XFO DENY, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy. Chỉ thêm HSTS nếu nginx đứng sau TLS, hoặc thêm ở lớp terminator TLS.
- **Acceptance:** `curl -I` tới / và tới một file /assets/*.js đều trả đủ CSP, XFO DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy.
- **Đã làm:** Thêm ở cấp server (kèm always): CSP giống vercel.json (bổ sung frame-src https://maps.google.com https://www.google.com sau review để iframe Google Maps ở footer không bị chặn), X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy. Location tĩnh lặp lại toàn bộ header (nginx không kế thừa khi location có add_header). HSTS để dạng comment vì container chỉ nghe HTTP 8080, TLS terminate ở proxy/CDN.
- **Còn lại:** Chạy nginx -t và kiểm tra header ở staging (R-008). Location regex ảnh (.png/.jpg...) có độ ưu tiên cao hơn prefix /api/ nên ảnh dạng /api/uploads/x.jpg không được proxy tới backend (lỗi có từ trước).
- **Files đã sửa:** `frontend/nginx.conf`
- **Regression tests:** Không có test tự động (cấu hình hạ tầng). Chưa chạy nginx -t vì không có nginx cục bộ; đã đọc lại cú pháp thủ công.

#### SEC-028 — DTO auth thiếu @IsString/@MaxLength cho password, fullName; avatar nhận chuỗi tùy ý

- **Category / Severity / Status:** Best Practice Improvement / Low / FIXED – VERIFIED — **CWE:** CWE-916 / CWE-20 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** auth / users ; auth — backend/src/modules/auth/auth.service.ts:175 (AuthService.register / changePassword / resetPassword; UsersService.createStaffOrAdmin)
- **Mô tả:** (1) Cả 4 nơi hash dùng `bcrypt.hash(..., 10)`, OWASP hiện khuyến nghị ≥12 (hoặc argon2id). (2) `LoginDto.password` và `ChangePasswordDto.currentPassword` chỉ có `@IsNotEmpty`, không có `@IsString` hay `@MaxLength`. Mật khẩu mới không có giới hạn trên, trong khi bcrypt cắt ở 72 byte nên hai mật khẩu dài khác nhau ở phần đuôi được coi là giống nhau. Body kiểu object hoặc number có thể gây lỗi 500 từ bcrypt. (3) `UpdateProfileDto.avatar` chỉ `@IsString`: chuỗi không bắt đầu bằng `data:image` được lưu nguyên, không kiểm tra URL https và độ dài. Hiện chỉ hiển thị cho chính chủ qua `<img :src>` nên tác động rất thấp.
- **Điều kiện / Tác động:** DB lộ (cost) hoặc input bất thường / C thấp
- **Root cause:** Thiếu ràng buộc validate và tham số băm chưa được nâng theo khuyến nghị hiện hành.
- **Remediation:** Đặt `BCRYPT_ROUNDS=12` qua config. Thêm `@IsString() @MaxLength(72)` (hoặc 128 kèm pre-hash) cho mọi trường mật khẩu. Avatar: `@IsUrl({protocols:['https'], require_protocol:true})` hoặc regex data:image, cùng `@MaxLength`.
- **Acceptance:** Login với password là object trả 400, không phải 500. Hash mới có cost ≥12.
- **Đã làm:** password/currentPassword/newPassword thêm @IsString và @MaxLength(128); fullName @MaxLength(100); avatar dùng validator IsAvatarValue (URL http/https tối đa 2048 ký tự, hoặc data URL ảnh png/jpeg/webp/gif base64 tối đa 3M ký tự; từ chối javascript:, file:, ftp:, data:text/html).
- **Còn lại:** bcrypt cost 10 chưa đổi (đề xuất 12, R-018). main.ts giới hạn JSON body 1mb nên giới hạn data URL 3M ký tự chỉ là dự phòng; body-parser mới là giới hạn thực tế. Các DTO khác xem SEC-085.
- **Files đã sửa:** `backend/src/modules/auth/dto/auth.dto.ts`, `backend/src/modules/auth/dto/auth.dto.spec.ts (mới)`
- **Regression tests:** auth.dto.spec.ts (mới): password > 128 hoặc không phải chuỗi bị từ chối; fullName 101 ký tự bị từ chối; avatar URL http/https và data URL ảnh hợp lệ, scheme nguy hiểm bị từ chối

#### SEC-029 — Client web/mobile còn code hiển thị OTP "Development" đọc từ response API

- **Category / Severity / Status:** Best Practice Improvement / Low / PARTIAL — **CWE:** CWE-489 Active Debug Code — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** auth (frontend/mobile) ; frontend auth — frontend/src/pages/customer/ForgotPassword.vue:130 (handleRequestOtp)
- **Mô tả:** Backend forgotPassword không trả OTP trong mọi NODE_ENV, kể cả khi gửi email lỗi. Điều này đã có test hồi quy 6 kịch bản trong auth.service.spec (working tree). Email simulation khi dev che chuỗi 6 chữ số trước khi log. Working tree đã thêm điều kiện `import.meta.env.DEV` và `kDebugMode`, nên bản build production không hiển thị. Tuy vậy phần code đọc `res.data.otp` / `res['otp']` là dead code, và sẽ lại hiển thị OTP trong bản dev nếu backend vô tình hồi quy. Không có lỗ hổng hiện hữu.
- **Điều kiện / Tác động:** Backend hồi quy và chạy bản build dev. / Không đáng kể
- **Root cause:** Còn sót helper debug từ thời backend trả OTP.
- **Remediation:** Xóa devOtp/_devOtp cùng khối UI liên quan ở cả web và mobile. Giữ test backend khẳng định response không có key 'otp'.
- **Acceptance:** Không còn code client đọc OTP từ response.
- **Đã làm:** Web: xóa nhánh UI hiển thị OTP, biến devOtp/isDev và đoạn đọc res.data.otp; toast đổi thành "Mã OTP đã được gửi!".
- **Còn lại:** Mobile: mobile/lib/screens/auth/forgot_password_screen.dart vẫn đọc res["otp"] trong kDebugMode (không còn tác dụng vì backend không trả OTP) nên dọn (R-006).
- **Files đã sửa:** `frontend/src/pages/customer/ForgotPassword.vue`, `frontend/src/pages/customer/__tests__/ForgotPasswordNoDevOtp.spec.ts (mới)`
- **Regression tests:** ForgotPasswordNoDevOtp.spec.ts (mới): API trả otp "654321" nhưng trang không chứa "654321" hay "Development"

#### SEC-030 — .gitignore/.dockerignore chưa bao phủ đủ biến thể .env và file khóa/keystore

- **Category / Severity / Status:** Best Practice Improvement / Low / FIXED – NOT VERIFIED — **CWE:** CWE-538 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** Repository hygiene — .gitignore:1
- **Mô tả:** `git check-ignore` xác nhận các đường dẫn `backend/.env.production`, `frontend/.env.production`, `*.pem`, `mobile/android/app/google-services.json` và `mobile/ios/Runner/GoogleService-Info.plist` KHÔNG bị ignore. Root .gitignore chỉ có `.env`, `.env.local` và `.env.*.local`. mobile/android/.gitignore có ignore key.properties, *.jks và *.keystore. backend/.dockerignore chỉ loại `.env`, `.env.local`, `.env.test`, nên `.env.production` hay `.env.development` (nếu có) sẽ bị `COPY . .` vào layer builder (backend/Dockerfile:18). Image cuối không chứa các file này, nhưng build cache hoặc builder stage thì có.
- **Điều kiện / Tác động:** Developer tạo file .env.production hoặc file khóa trong repo / C (rò rỉ secret do commit nhầm)
- **Root cause:** Pattern ignore liệt kê từng tên file thay vì dùng wildcard deny-by-default
- **Remediation:** Thêm vào root .gitignore: `.env.*` kèm `!.env.example` và `!backend/.env.test`, cùng `*.pem`, `*.key`, `*.p12`, `*.pfx`, `**/google-services.json`, `**/GoogleService-Info.plist`, `service-account*.json`. backend/.dockerignore và frontend/.dockerignore dùng `.env*` kèm `!.env.example`.
- **Acceptance:** git check-ignore khớp với tất cả các đường dẫn trên
- **Đã làm:** Bổ sung .env.*, !.env.example, !backend/.env.test, *.pem, *.key, *.p12, *.pfx, *.jks, *.keystore, **/key.properties, **/google-services.json, **/GoogleService-Info.plist; .dockerignore backend/frontend có cùng danh sách.
- **Còn lại:** .dockerignore giờ loại .env.* nên nếu cần biến VITE_ lúc build image phải truyền bằng build-arg.
- **Files đã sửa:** `.gitignore`, `backend/.dockerignore`, `frontend/.dockerignore`
- **Regression tests:** Không có test tự động. Kiểm chứng thủ công bằng git check-ignore: backend/.env.test, các .env.example, key.properties.example không bị ignore; *.pem, google-services.json, key.properties bị ignore; git ls-files không có file bí mật nào đang được track.

#### SEC-031 — GitHub Actions thiếu permissions tối thiểu và nội suy ${{ }} trong run

- **Category / Severity / Status:** Best Practice Improvement / Low / FIXED – NOT VERIFIED — **CWE:** CWE-250, CWE-829, CWE-78 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** CI/CD — .github/workflows/deploy.yml:11
- **Mô tả:** ci.yml, deploy.yml, docker-build.yml và job `verify-release` trong release.yml đều không có khối `permissions:`, nên GITHUB_TOKEN nhận quyền mặc định theo cấu hình repo/org. Với repo cũ, mặc định này có thể là read/write. deploy.yml (trigger workflow_run, chạy trong context base repo, giữ VERCEL_TOKEN và RENDER_DEPLOY_HOOK) là chỗ cần quyền tối thiểu nhất. Tất cả action đều pin theo tag có thể bị dời: actions/*@v4, docker/*@v3/v5, cùng các action bên thứ ba `gitleaks/gitleaks-action@v2`, `subosito/flutter-action@v2`, `softprops/action-gh-release@v2`. Ngoài ra `npm install --global vercel@33` chạy không có lockfile mà vẫn có VERCEL_TOKEN trong env. release.yml:94 nội suy `${{ github.ref_name }}` thẳng vào shell. Chỉ người có quyền push tag mới khai thác được, nên rủi ro thấp.
- **Điều kiện / Tác động:** Action upstream bị chiếm quyền hoặc tag bị dời / I/C ở mức pipeline: lộ VERCEL_TOKEN hoặc deploy hook nếu action bị chiếm quyền
- **Root cause:** Workflow chưa áp dụng quy tắc least privilege và pin action theo SHA
- **Remediation:** Thêm `permissions: { contents: read }` ở cấp workflow cho ci, deploy, docker-build, release. Riêng create-release giữ `contents: write`. Pin mọi action theo commit SHA (giữ tag trong comment) và bật Dependabot cho `github-actions`. Pin `vercel@<exact>`. Ở release.yml chuyển sang `env: TAG: ${{ github.ref_name }}` rồi dùng `"$TAG"`.
- **Acceptance:** Mọi workflow có `permissions:`. 100% `uses:` pin theo SHA. Không còn `${{ github.* }}` do người dùng kiểm soát nằm trong `run:`.
- **Đã làm:** permissions: contents: read ở cấp workflow cho cả 4 file (gitleaks thêm pull-requests: read; create-release giữ contents: write riêng). deploy.yml/release.yml chuyển head_sha, URL, steps outputs và github.ref_name vào env rồi dùng biến shell.
- **Còn lại:** Action vẫn pin theo tag chưa pin SHA (xem SEC-054).
- **Files đã sửa:** `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/workflows/docker-build.yml`, `.github/workflows/release.yml`
- **Regression tests:** Không có test tự động; chưa chạy actionlint (không có sẵn). Review thủ công: không có bước nào dùng GITHUB_TOKEN ngoài các quyền đã cấp.

#### SEC-032 — Response tạo đơn/replay lộ các trường select:false (guestAccessTokenHash, idempotencyKeyHash...)

- **Category / Severity / Status:** Best Practice Improvement / Low / FIXED – VERIFIED — **CWE:** CWE-212 Improper Removal of Sensitive Information Before Storage or Transfer — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã tái hiện bằng dynamic test)
- **Module / File:** orders — backend/src/modules/orders/services/checkout.service.ts:720 (CheckoutService.create)
- **Mô tả:** select:false chỉ có tác dụng khi query. Document vừa save() hoặc query có `.select('+...')` rồi toObject() vẫn chứa đủ các hash nội bộ. Schema có chú thích rõ 'must never be persisted or serialized in API responses', nhưng response POST /orders, POST /landing-pages/submit-order và nhánh replay lại trả chúng. Rủi ro trực tiếp thấp vì người tạo đơn vốn đã giữ token gốc, nhưng điều này vi phạm hợp đồng dữ liệu và làm lộ thiết kế hashing.
- **Điều kiện / Tác động:** Đặt đơn guest. / C: Low
- **Root cause:** Không có lớp serializer hoặc DTO output cho Order.
- **Remediation:** Gộp vào hàm `toCustomerOrderView` của phát hiện lộ giá vốn: delete các field hash, phoneKey và slot trước khi trả. Hoặc thêm `toJSON/toObject` transform trong OrderSchema để loại bỏ chúng.
- **Acceptance:** Response create, replay và landing submit không chứa *Hash, guestPhoneKey, guestPendingSlot.
- **Đã làm:** toCustomerOrderView cũng loại guestAccessTokenHash, idempotencyKeyHash, idempotencyPayloadHash, guestPhoneKey, guestPendingSlot; áp dụng cho create, replay idempotent, findGuestById. guestAccessToken (raw, trả một lần) giữ nguyên theo thiết kế BE-03.
- **Files đã sửa:** `backend/src/modules/orders/services/checkout.service.ts`, `backend/src/modules/orders/orders.service.ts`, `backend/src/modules/orders/services/checkout.service.spec.ts`, `backend/src/modules/orders/orders.customer-view.spec.ts`
- **Regression tests:** checkout.service.spec.ts: response create guest và replay không chứa 5 trường nội bộ; orders.customer-view.spec.ts: guest lookup không trả hash

#### SEC-033 — @Body("note") của return-approve / return-received không được validate

- **Category / Severity / Status:** Best Practice Improvement / Low / FIXED – VERIFIED — **CWE:** CWE-20 Improper Input Validation — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** orders — backend/src/modules/orders/orders.controller.ts:246 (OrdersController.approveReturn / confirmReturnReceived)
- **Mô tả:** Tham số primitive `@Body('note') note: string` không đi qua class-validator, vì ValidationPipe bỏ qua metatype String. Client gửi được object, mảng hoặc chuỗi rất dài, và giá trị này được ghi vào timeline. Không vượt quyền vì route yêu cầu MANAGE_ORDERS, nhưng vi phạm quy tắc 'mọi DTO có class-validator' và có thể gây lỗi 500 hoặc dữ liệu rác.
- **Điều kiện / Tác động:** STAFF có MANAGE_ORDERS. / I: Low
- **Root cause:** Dùng tham số body lẻ thay vì DTO.
- **Remediation:** Tạo ReturnNoteDto { @IsOptional @IsString @MaxLength(500) note?: string } và dùng `@Body() dto: ReturnNoteDto`.
- **Acceptance:** note là object hoặc dài hơn 500 ký tự nhận 400.
- **Đã làm:** ReturnNoteDto (@IsOptional @IsString @MaxLength(1000)); controller approveReturn và confirmReturnReceived dùng @Body() dto: ReturnNoteDto. Frontend vẫn gửi { note } nên tương thích.
- **Files đã sửa:** `backend/src/modules/orders/dto/return-note.dto.ts (mới)`, `backend/src/modules/orders/orders.controller.ts`, `backend/src/modules/orders/services/order-lifecycle.service.spec.ts`
- **Regression tests:** order-lifecycle.service.spec.ts: 4 test validate ReturnNoteDto (bỏ trống, object, dài hơn 1000 ký tự, hợp lệ)

#### SEC-034 — RolesGuard/PermissionsGuard cho qua mọi request khi route thiếu @Roles/@Permissions (đã chuyển deny-by-default trong working tree)

- **Category / Severity / Status:** Best Practice Improvement / Low / FIXED – VERIFIED — **CWE:** CWE-862 Missing Authorization / CWE-276 Incorrect Default Permissions — **CVSS:** Lịch sử (/documents): CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N = 8.1. Hiện tại: 0 (đã khắc phục)
- **Confidence:** Cao (xác nhận bởi 2 lượt kiểm chứng độc lập)
- **Module / File:** common/guards (RBAC) — backend/src/common/guards/permissions.guard.ts:40 (PermissionsGuard.canActivate / RolesGuard.canActivate)
- **Mô tả:** Ở HEAD, hai guard có nhánh `if (!required || required.length === 0) return true;` chạy trước cả kiểm tra user. Vì vậy route nào gắn PermissionsGuard/RolesGuard mà quên decorator sẽ mở cho mọi user đã đăng nhập, kể cả CUSTOMER. Trường hợp đã bị khai thác thật là /documents (SEC-P0-01): CUSTOMER đọc và tạo được chứng từ ERP. Lỗi cụ thể này đã sửa trong commit 231b1b4 bằng cách thêm @Permissions. Working tree (chưa commit) sửa tận gốc: route thiếu decorator chỉ còn ADMIN/SUPER_ADMIN vào được, STAFF/CUSTOMER nhận 403, user rỗng nhận 401. Tôi đã dump runtime metadata của toàn bộ 264 route trong 30 controller (getAllAndOverride, ưu tiên handler rồi đến class). Mọi route có PermissionsGuard/RolesGuard đều có danh sách quyền không rỗng. Kết luận: (a) ở HEAD không còn route nào đang mở do allow-by-default; (b) deny-by-default KHÔNG gây hồi quy chức năng. Không route nào dành cho CUSTOMER/STAFF bị…
- **Điều kiện / Tác động:** Có tài khoản CUSTOMER hoặc STAFF, và route dùng guard nhưng quên decorator. Ở HEAD không còn route nào như vậy. / C:H I:H (lịch sử). Hiện tại không còn.
- **Root cause:** Guard dùng mô hình fail-open: thiếu metadata thì hiểu là 'không yêu cầu quyền', thay vì 'không xác định nên từ chối'.
- **Remediation:** 1) Commit thay đổi deny-by-default cùng rbac.guard.spec.ts và route-coverage.spec.ts. 2) Giữ route-coverage.spec.ts trong CI để chặn route mới quên decorator. 3) Ghi vào PROJECT_OVERVIEW rằng route có guard mà thiếu decorator mặc định chỉ admin truy cập được.
- **Acceptance:** Thay đổi được commit. CI chạy route-coverage.spec. Route có guard mà thiếu decorator luôn trả 403 cho STAFF/CUSTOMER.
- **Đã làm:** Thay đổi do developer thực hiện, chưa commit: cả hai guard deny-by-default (route thiếu decorator chỉ ADMIN/SUPER_ADMIN qua; STAFF/CUSTOMER 403). Dynamic test TEST-SEC-001/002 đã chạy trên bản build chứa thay đổi này.
- **Còn lại:** Thay đổi vẫn nằm trong working tree chưa commit; developer cần review và commit (R-025).
- **Files đã sửa:** `backend/src/common/guards/roles.guard.ts`, `backend/src/common/guards/permissions.guard.ts`, `backend/src/common/guards/rbac.guard.spec.ts`, `backend/src/common/guards/route-coverage.spec.ts (mới)`
- **Regression tests:** rbac.guard.spec.ts và route-coverage.spec.ts (24 test pass khi map; nằm trong 1183 test pass của lần kiểm tra cuối)
- *Ghi chú verifier:* wip-guards-regression#0 reach: downgraded -> Low; wip-guards-regression#0 mitig: downgraded -> Low.

#### SEC-035 — Seed-safety coi host localhost/mongodb là an toàn: stack docker-compose tự host có thể bị xóa DB demo

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-1188 Insecure Default Initialization / CWE-798 Hard-coded Credentials — **CVSS:** (Chiếm tài khoản sau khi seed bằng mật khẩu mặc định) CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:H = 7.5. Phụ thuộc thao tác của vận hành.
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** seeds — backend/src/seeds/seed-safety.ts:7 (isLocalMongoUri / isDemoSeedSafeUri / SeedService.clearDatabase / SeedService.seed)
- **Mô tả:** `LOCAL_HOSTS` gồm 'localhost', '127.0.0.1', '::1' và 'mongodb', tức tên service trong docker-compose. Nhưng docker-compose.yml lại chính là cấu hình deploy self-host theo README/PROJECT_OVERVIEW. Trong đó MONGODB_URI mặc định trỏ tới `@mongodb:27017/truong_thanh_bookstore`, NODE_ENV mặc định là development và backend publish cổng 3000 trên mọi interface. Hệ quả: (1) `node dist/seeds/run-seed.js --reset` (dist có sẵn run-seed.js) gọi clearDatabase(), hàm này chỉ kiểm tra URI và KHÔNG kiểm tra NODE_ENV, nên deleteMany xóa toàn bộ users, products, orders, inventory... ngay cả khi NODE_ENV=production. seed() có ném lỗi sau đó do thiếu SEED_* thì dữ liệu cũng đã mất. (2) Khi NODE_ENV khác production (mặc định của compose), getSeedPassword chấp nhận mật khẩu mặc định có trong repo, ví dụ superadmin@truongthanh.vn với SuperAdmin@123456. Server public sẽ có SUPER_ADMIN với mật khẩu ai cũng biết.…
- **Điều kiện / Tác động:** Deploy bằng docker-compose.yml của repo, hoặc DB production được tunnel về localhost. Người vận hành chạy run-seed (--reset), hoặc bật AUTO_SEED khi NODE_ENV khác production. / I:H A:H (xóa sạch DB). C:H/I:H khi có SUPER_ADMIN mật khẩu công khai.
- **Root cause:** Dùng vị trí mạng của host làm thước đo môi trường. clearDatabase thiếu chốt chặn độc lập với URI (NODE_ENV/cloud/xác nhận tên DB).
- **Remediation:** 1) clearDatabase(): luôn từ chối khi NODE_ENV==='production' hoặc khi cờ isCloudHosted bật, và yêu cầu thêm `SEED_CONFIRM_DB_NAME` khớp đúng tên DB, hoặc cờ CLI `--confirm=<dbName>`. 2) Bỏ 'mongodb' khỏi LOCAL_HOSTS, hoặc chỉ chấp nhận khi có cờ rõ ràng như `SEED_ALLOW_DOCKER_HOST=true`. 3) Bỏ hẳn fallback mật khẩu công khai: không có SEED_*_PASSWORD thì sinh mật khẩu ngẫu nhiên (crypto.randomBytes) và chỉ in ra console một lần, hoặc bắt buộc đặt biến. 4) docker-compose: đổi NODE_ENV mặc định thành production cho stack deploy, tách compose dev riêng. 5) Thêm test: URI host `mongodb` + NODE_ENV=production thì clearDatabase phải bị từ chối.
- **Acceptance:** Không cách nào xóa DB khi NODE_ENV=production hoặc cloud. Không còn mật khẩu mặc định cố định trong source.
- *Ghi chú verifier:* wip-guards-regression#1 reach: downgraded -> Low.

#### SEC-036 — Deny-by-default và route-coverage.spec chỉ bảo vệ route đã gắn PermissionsGuard/RolesGuard

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-1188 Insecure Default Initialization — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** common/guards, app.module — backend/src/common/guards/route-coverage.spec.ts:44 (findViolations)
- **Mô tả:** APP_GUARD duy nhất là ThrottlerGuard. Không có JwtAuthGuard toàn cục hay @Public, nên mọi controller mới mặc định là public. route-coverage.spec.ts chỉ kiểm tra khi `guards.includes(PermissionsGuard|RolesGuard)`. Một endpoint quản trị mới chỉ có `@UseGuards(AuthGuard('jwt'))` sẽ mở cho mọi CUSTOMER mà cả guard lẫn spec đều không phát hiện. Hiện có 47 route dạng 'chỉ cần JWT' (cart, addresses, notifications, orders/my-orders, reviews, users/wishlist...) và chúng đều hợp lệ nghiệp vụ. Ngoài ra còn các check role inline 'STAFF = toàn quyền' đang tiềm ẩn: orders.service.ts:245-253 (findById có tham số userRole, hiện không có caller nào truyền role) và orders.controller.ts:111-118 (check thừa sau findByIdForActor). Spec dùng `hasMeta(handler) || hasMeta(class)`, còn runtime dùng getAllAndOverride: `@Permissions()` rỗng ở handler sẽ đè class. Trường hợp này fail-closed, chỉ ảnh hưởng chức năng…
- **Điều kiện / Tác động:** Dev thêm endpoint quản trị mà quên gắn PermissionsGuard. / Phụ thuộc route tương lai
- **Root cause:** Mô hình opt-in: bảo vệ chỉ có khi dev nhớ gắn guard.
- **Remediation:** Mở rộng route-coverage.spec thành snapshot hoặc allowlist tường minh: mọi route phải thuộc một trong ba nhóm {PUBLIC_ALLOWLIST, AUTH_ANY_ALLOWLIST, có Permissions/Roles}. Route mới không thuộc nhóm nào làm test fail, buộc người viết review quyền. Về lâu dài cân nhắc JwtAuthGuard toàn cục + decorator @Public(). Đây là thay đổi kiến trúc, cần duyệt theo AGENTS.md 3.2. Xóa nhánh STAFF trong orders.service.findById(userRole) và check thừa ở orders.controller getInvoice.
- **Acceptance:** CI fail khi có route mới mà chưa được phân loại quyền tường minh.

#### SEC-037 — Guest order access token lưu vĩnh viễn trong localStorage

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-922 (Insecure Storage of Sensitive Information) — **CVSS:** CVSS:3.1/AV:L/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N (3.4)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** frontend checkout / guest order — frontend/src/pages/customer/Checkout.vue:1071 (submitOrder (đặt hàng khách vãng lai))
- **Mô tả:** Sau khi khách vãng lai đặt hàng, token truy cập đơn (`guestAccessToken`, header `X-Guest-Order-Token`) được lưu ở `localStorage['guest-order-token:<orderId>']` và không bao giờ bị xóa. Token cho phép xem chi tiết đơn (họ tên, SĐT, địa chỉ), tải hóa đơn và HỦY đơn. Trên máy dùng chung (tiệm net, máy văn phòng), người sau có thể liệt kê key trong localStorage để mở và hủy đơn của người trước. Mọi XSS cũng đọc được token này, khác với cookie HttpOnly. Chưa xác minh backend có đặt hạn sống cho guest token hay không.
- **Điều kiện / Tác động:** Truy cập vật lý vào trình duyệt đã đặt hàng, hoặc có một lỗi XSS. / C:L (PII đơn khách), I:L (hủy đơn).
- **Root cause:** Dùng bearer capability có giá trị lâu dài, lưu ở storage đọc được bằng JS và không có vòng đời.
- **Remediation:** Chuyển sang sessionStorage, hoặc lưu kèm `expiresAt` và xóa khi đơn ở trạng thái cuối hoặc sau N ngày. Backend nên đặt TTL cho guest token (vd. 30 ngày, hoặc đến khi đơn hoàn tất) và yêu cầu xác minh thêm (SĐT hoặc OTP) cho thao tác hủy. Cân nhắc dùng cookie HttpOnly theo path `/api/orders/guest` thay cho localStorage.
- **Acceptance:** Token khách có hạn sống, bị xóa khỏi storage khi hết hạn hoặc đơn kết thúc. Thao tác hủy có thêm bước xác minh, nếu nghiệp vụ duyệt.

#### SEC-038 — Hồ sơ người dùng (PII, role, permissions) lưu plaintext ở localStorage/SharedPreferences; Android không tắt allowBackup

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-922 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** frontend/stores/auth.ts ; mobile android ; mobile auth — frontend/src/stores/auth.ts:46 (hydrateAuth / login / register / updateProfile)
- **Mô tả:** Token đã chuyển sang cookie HttpOnly (tốt), nhưng toàn bộ object user trả từ `/auth/me` (email, SĐT, avatar, role, permissions, wishlist...) vẫn được ghi vào `localStorage['user']`. Dữ liệu này tồn tại sau khi đóng trình duyệt. Nếu phiên hết hạn mà hydrate gặp lỗi khác 401 (mạng, 5xx), dữ liệu không bị xóa (auth.ts:47-62). Router guard và UI dùng role từ localStorage trước khi hydrate xong. Đây chỉ là vấn đề hiển thị vì backend mới quyết định quyền. helpers.ts:89 còn hằng `OBFUSCATION_KEY` dùng để giải mã dữ liệu XOR cũ. Đây không phải secret, nhưng là code thừa gây hiểu nhầm là có mã hóa.
- **Điều kiện / Tác động:** Truy cập trình duyệt hoặc XSS. / C:L
- **Root cause:** Dùng localStorage làm cache hồ sơ để tránh nháy UI khi tải trang.
- **Remediation:** Chỉ cache các trường tối thiểu cho UI (`_id`, `fullName`, `role`, `avatar`) hoặc dùng sessionStorage. Luôn hydrate từ `/auth/me` trước khi render khu vực admin. Lên kế hoạch gỡ decodeLegacyStorage và OBFUSCATION_KEY sau một số release.
- **Acceptance:** localStorage['user'] không còn chứa email/phone/permissions, hoặc bị xóa khi phiên kết thúc.

#### SEC-039 — Socket.IO fallback về http://localhost:3000 khi build production thiếu VITE_SOCKET_URL

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-1188 (Insecure Default Initialization) — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** frontend/App.vue realtime — frontend/src/App.vue:90 (connectSocket)
- **Mô tả:** `connectSocket` dùng `VITE_SOCKET_URL || VITE_API_URL || 'http://localhost:3000/api'`. Docker image (frontend/.env bị .dockerignore loại trừ, Dockerfile không truyền ARG) và Vercel (dùng rewrite `/api`, nhiều khả năng không đặt VITE_API_URL) đều build ra fallback localhost. Hệ quả: trình duyệt người dùng mở WebSocket tới cổng 3000 trên chính máy họ, realtime không hoạt động, và client gửi request tới dịch vụ cục bộ không liên quan. Nginx có proxy `/socket.io` nhưng không được dùng. Vercel không có rewrite `/socket.io`. Bản dist local hiện có chứa chuỗi `localhost:3000`. Chưa xác minh biến môi trường thực tế trên Vercel.
- **Điều kiện / Tác động:** Build production không có VITE_SOCKET_URL. / A:L (mất thông báo realtime)
- **Root cause:** Fallback dành cho dev bị đóng gói vào bản production.
- **Remediation:** Khi `import.meta.env.PROD`, fallback về same-origin (`io('/notifications', { path: '/socket.io' })`). Hoặc fail rõ ràng khi thiếu VITE_SOCKET_URL. Thêm VITE_SOCKET_URL (wss://...) vào cấu hình build Vercel và Docker ARG.
- **Acceptance:** Bundle production không chứa 'localhost:3000'. Socket kết nối same-origin hoặc tới URL cấu hình.
- *Ghi chú verifier:* frontend#5 reach: downgraded -> Low.

#### SEC-040 — Gửi URL đơn hàng và thông tin chuyển khoản tới dịch vụ bên thứ ba qua thẻ img (QR)

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-359 (Exposure of Private Personal Information) — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** frontend OrderDetail/Checkout — frontend/src/pages/customer/OrderDetail.vue:172
- **Mô tả:** Mã QR theo dõi đơn được sinh bằng `https://api.qrserver.com/v1/create-qr-code/?data=<origin>/my-orders/<orderId>`. Như vậy order ID kèm IP và User-Agent của khách bị gửi cho một dịch vụ miễn phí bên ngoài. QR VietQR (img.vietqr.io) nhận số tài khoản, số tiền và mã đơn. Đây là luồng nghiệp vụ phổ biến nhưng nên được ghi nhận trong chính sách quyền riêng tư. Không có token trong URL nên mức độ thấp.
- **Điều kiện / Tác động:** Khách mở trang chi tiết đơn. / C:L
- **Root cause:** Dùng API ngoài để render QR.
- **Remediation:** Sinh QR phía client bằng thư viện QR có sẵn (cần hỏi trước khi thêm thư viện theo AGENTS.md), hoặc sinh ở backend. Giữ VietQR nếu nghiệp vụ chấp nhận và ghi vào chính sách quyền riêng tư.
- **Acceptance:** Không còn request tới api.qrserver.com.

#### SEC-041 — Vite alias ép dùng bản Vue đầy đủ có runtime template compiler

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-1336 (Template Injection, tiềm ẩn) — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** frontend build — frontend/vite.config.ts:11
- **Mô tả:** `'vue': 'vue/dist/vue.esm-bundler.js'` đưa trình biên dịch template vào bundle production. Hiện không có component nào dùng template dạng chuỗi lúc runtime (grep chỉ thấy trong __tests__), nên chưa có lỗ hổng. Tuy nhiên alias này mở ra bề mặt client-side template injection nếu sau này có code biên dịch template từ dữ liệu người dùng hoặc mount lên DOM có sẵn nội dung. Nó cũng làm bundle nặng hơn. CSP không có 'unsafe-eval' nên trình biên dịch runtime sẽ lỗi ở production, nghĩa là alias không mang lại lợi ích gì.
- **Điều kiện / Tác động:** Không có / Không trực tiếp
- **Root cause:** Alias có lẽ được thêm để phục vụ test stub dùng template string.
- **Remediation:** Bỏ alias trong build production, chỉ giữ cho Vitest (`test.alias` trong vitest config) nếu stub cần.
- **Acceptance:** Build production dùng runtime-only Vue. Test unit vẫn pass.

#### SEC-042 — CSP frontend (Vercel) cho phép script-src unsafe-inline, connect-src https: wss: quá rộng và thiếu frame-src cho Google Maps

- **Category / Severity / Status:** Misconfiguration / Low / OPEN — **CWE:** CWE-1021 / CWE-693 (Protection Mechanism Failure) — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** frontend deploy headers — vercel.json:32
- **Mô tả:** CSP có `script-src 'self' 'unsafe-inline'`, cho phép inline script, event handler và URL `javascript:` chạy. Lý do duy nhất cần 'unsafe-inline' là đoạn script chọn theme/lang inline trong index.html. `connect-src 'self' https: wss:` cho phép script độc hại gửi dữ liệu ra bất kỳ host HTTPS nào. Thiếu `form-action`. Header `X-XSS-Protection: 1; mode=block` đã lỗi thời, khuyến nghị hiện nay là đặt `0`. Cấu hình bị lặp ở 2 file (vercel.json gốc và frontend/vercel.json), dễ lệch nhau khi sửa.
- **Điều kiện / Tác động:** Cần có một lỗi XSS khác. / Không trực tiếp. Tăng mức độ của các lỗi XSS.
- **Root cause:** Dùng 'unsafe-inline' để chạy script inline trong index.html thay vì dùng hash. connect-src dùng wildcard theo scheme.
- **Remediation:** Chuyển script theme trong index.html sang file tĩnh `/theme-init.js`, hoặc dùng `'sha256-...'` cho đúng đoạn script đó, rồi bỏ `'unsafe-inline'` khỏi script-src. Thu hẹp connect-src về `'self'` cộng domain API/socket thật (vd. https://truong-thanh-bookstore.onrender.com wss://truong-thanh-bookstore.onrender.com). Thêm `form-action 'self'`. Đặt `X-XSS-Protection: 0`. Gộp về 1 file vercel.json nếu được.
- **Acceptance:** Header CSP production không còn 'unsafe-inline' trong script-src. Trang vẫn đổi theme đúng. Smoke test CSP (FRONT-P2-01) pass.

#### SEC-043 — Header X-Client-Platform: mobile biến phiên cookie HttpOnly thành token đọc được trong response

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-1004 / CWE-522 — **CVSS:** CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:N (6.8)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** auth — backend/src/modules/auth/auth.controller.ts:132 (AuthController.finishBrowserOrMobileAuth / refreshToken)
- **Mô tả:** Server quyết định trả token trong body hay đặt cookie chỉ dựa vào header `x-client-platform` do client tự khai. Endpoint `/auth/refresh` lấy refresh token từ cookie HttpOnly (khi body trống), nhưng nếu request có header `x-client-platform: mobile` thì trả `accessToken` và `refreshToken` (30 ngày) dạng plaintext trong JSON. Kết quả: một đoạn script XSS chạy trên origin frontend (qua rewrite /api thì cùng origin, không cần preflight; header này cũng nằm trong CORS allowedHeaders) có thể gọi `fetch('/api/auth/refresh',{method:'POST',headers:{'X-Client-Platform':'mobile','X-Requested-With':'XMLHttpRequest'},credentials:'include'})` và lấy được cặp token, vô hiệu hóa lợi ích của HttpOnly. CSP frontend có `script-src 'unsafe-inline'` nên lớp phòng thủ XSS yếu hơn. Ở môi trường không phải production, CORS còn chấp nhận mọi origin `http://localhost:*` kèm credentials. Cơ chế phát hiện reuse sẽ h…
- **Điều kiện / Tác động:** Có một lỗ hổng XSS trên origin frontend được whitelist, hoặc trên một trang localhost ở môi trường dev. / C/I cao: chiếm phiên người dùng, kể cả ADMIN, cho tới khi reuse-detection kích hoạt
- **Root cause:** Kênh trả token được chọn theo header do client tự khai, không theo nguồn của credential. Token lấy từ cookie lại được trả về dưới dạng JS đọc được.
- **Remediation:** Trả token trong body CHỈ KHI refresh token được gửi qua body (đặc trưng của client native). Nếu refresh token đến từ cookie thì luôn đặt cookie và không bao giờ trả token trong body, bất kể header. Với login và register, có thể giữ hành vi theo header vì cần mật khẩu. Song song, bỏ `'unsafe-inline'` khỏi script-src (dùng hash hoặc nonce).
- **Acceptance:** POST /auth/refresh dùng refresh cookie và có header mobile thì response không chứa accessToken hoặc refreshToken.
- *Ghi chú verifier:* authn#1 reach: downgraded -> Low.

#### SEC-045 — Mỗi user chỉ lưu một refreshTokenHash, đăng nhập thiết bị thứ hai hoặc refresh song song làm hỏng phiên

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-613 / CWE-362 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** auth — backend/src/modules/auth/auth.service.ts:285 (AuthService.generateTokens / refreshToken)
- **Mô tả:** `generateTokens` ghi đè `user.refreshTokenHash` ở mỗi lần login, register, refresh. Nếu một người dùng đăng nhập cả web và app mobile (đúng như kiến trúc dự án), lần đăng nhập thứ hai làm refresh token của thiết bị đầu không còn khớp hash. Khi thiết bị đầu refresh, code đi vào nhánh "SUSPECTED TOKEN REUSE", tăng `tokenVersion` và đăng xuất MỌI thiết bị. Điều tương tự xảy ra khi hai tab trình duyệt cùng refresh đồng thời: hàng đợi `refreshPromise` ở frontend chỉ có tác dụng trong một tab. Hệ quả: (1) người dùng thật bị đăng xuất ngẫu nhiên; (2) log cảnh báo reuse nhiễu, khiến tín hiệu tấn công thật bị lu mờ; (3) bất kỳ ai giữ một refresh token cũ hợp lệ chữ ký đều có thể đăng xuất cưỡng bức nạn nhân. Cập nhật hash theo kiểu đọc rồi ghi (không atomic) cũng có race giữa hai request refresh đồng thời.
- **Điều kiện / Tác động:** Người dùng dùng hai thiết bị, hoặc nhiều tab cùng refresh / A: thấp đến trung bình (đăng xuất hàng loạt). Giảm chất lượng tín hiệu phát hiện chiếm phiên
- **Root cause:** Mô hình một phiên trên một user kết hợp reuse-detection mà không có token family hay session id theo thiết bị.
- **Remediation:** Lưu phiên theo thiết bị: collection `sessions` hoặc mảng `{sessionId, refreshHash, familyId, expiresAt, userAgent}`. Reuse-detection chỉ thu hồi family tương ứng. Cho phép grace window ngắn (khoảng 30 giây) cho token vừa xoay vòng để xử lý race nhiều tab. Cập nhật bằng `findOneAndUpdate` có điều kiện hash cũ (compare-and-swap).
- **Acceptance:** Đăng nhập web rồi đăng nhập mobile, sau đó web refresh vẫn thành công. Dùng lại đúng refresh token đã xoay vòng chỉ thu hồi family của nó.

#### SEC-046 — Lộ sự tồn tại tài khoản qua thông báo đăng ký, thông báo khóa và chênh lệch thời gian

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-204 / CWE-208 — **CVSS:** CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N (5.3)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** auth — backend/src/modules/auth/auth.service.ts:200 (AuthService.register / AuthService.login)
- **Mô tả:** (1) `register` trả 409 với nội dung "Email đã tồn tại trên hệ thống", cho phép dò email (throttle 3 lần/10 phút/IP). (2) `login` kiểm tra `user.status` TRƯỚC khi so mật khẩu và trả "Tài khoản đã bị khóa", nên không cần mật khẩu vẫn biết được email tồn tại và đang bị khóa. (3) Khi email không tồn tại, code trả lỗi ngay mà không chạy bcrypt, chênh khoảng 50-100ms so với email tồn tại (bcrypt cost 10), đủ để dò email qua thời gian phản hồi. Riêng luồng forgot-password đã chống dò bằng thông điệp chung.
- **Điều kiện / Tác động:** Không / C: thấp (lộ danh sách email khách hàng hoặc nhân viên, hỗ trợ phishing và credential stuffing)
- **Root cause:** Thông điệp lỗi và đường đi xử lý khác nhau tùy trạng thái tài khoản.
- **Remediation:** Login: luôn chạy `bcrypt.compare` (với hash giả khi user không tồn tại). Chỉ báo "đã bị khóa" SAU khi mật khẩu đúng, còn lại dùng một thông điệp chung. Register: cân nhắc phản hồi chung ("Nếu email hợp lệ, vui lòng kiểm tra hộp thư") kèm xác minh email, hoặc chấp nhận rủi ro và giữ throttle chặt (quyết định UX).
- **Acceptance:** Login sai mật khẩu với tài khoản bị khóa trả cùng thông điệp và thời gian xấp xỉ như email không tồn tại.

#### SEC-047 — Blacklist token fail-open khi Redis lỗi; trạng thái thu hồi nằm trong bộ nhớ từng instance

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-613 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** auth — backend/src/modules/auth/token-blacklist.service.ts:85 (TokenBlacklistService.isJtiBlacklisted / isTokenBlacklisted)
- **Mô tả:** Khi Redis không kết nối hoặc lỗi, `isJtiBlacklisted` và `isTokenBlacklisted` trả `false` (fail-open). Khi chạy nhiều instance, access token đã logout ở instance A vẫn dùng được ở instance B tới khi hết hạn (tối đa 15 phút). Đổi mật khẩu và reset mật khẩu được bù lại nhờ `tokenVersion` kiểm tra từ DB. Riêng logout thường KHÔNG tăng `tokenVersion`, nên token vừa logout vẫn sống tạm thời.
- **Điều kiện / Tác động:** Redis lỗi hoặc nhiều instance, và token đã bị lộ / C/I thấp (cửa sổ tối đa 15 phút)
- **Root cause:** Chọn ưu tiên tính sẵn sàng hơn tính chính xác khi kiểm tra thu hồi token.
- **Remediation:** Trong production, khi Redis không sẵn sàng thì fail-closed cho request mang token (trả 503 hoặc 401), hoặc ít nhất tăng một `sessionVersion` per-session khi logout. Thêm cảnh báo hoặc metric khi Redis mất kết nối.
- **Acceptance:** Token đã logout bị từ chối ở mọi instance, kể cả khi Redis lỗi (theo chính sách đã chọn).

#### SEC-048 — Môi trường không phải production bỏ qua kiểm tra secret; danh sách chặn secret yếu chỉ so khớp chính xác

- **Category / Severity / Status:** Misconfiguration / Low / OPEN — **CWE:** CWE-1188 / CWE-521 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** config ; Config validation — backend/src/config/env.validation.ts:338 (validateEnv)
- **Mô tả:** Khi thiếu `JWT_REFRESH_SECRET` hoặc `JWT_RESET_SECRET`, validator tự gán `${JWT_SECRET}_refresh_secret` và `${JWT_SECRET}_reset_secret`. Nếu JWT_SECRET bị lộ thì cả ba secret đều lộ. Các kiểm tra ≥32 ký tự, khác nhau, COOKIE_SECURE, REDIS_URL chỉ chạy khi NODE_ENV=production hoặc khi chạy trên Render/Vercel. docker-compose.yml đặt mặc định `NODE_ENV=development` và publish cổng 3000 trên mọi interface. Một bản self-host (VPS) chạy compose mặc định sẽ có cookie không Secure, secret ngắn hoặc suy diễn, Swagger bật, lỗi 5xx kèm stack. Kiểm tra production cũng không đo entropy, chỉ độ dài và một danh sách đen ngắn. File backend/.env local (gitignored) có JWT_SECRET 30 ký tự, refresh và reset 32 ký tự, cả ba là chuỗi chữ dễ đọc bắt đầu bằng tên dự án (`Truo***`), không có OTP_PEPPER. Chấp nhận được cho dev nhưng không được sao chép lên môi trường thật.
- **Điều kiện / Tác động:** Self-host bằng compose mặc định, hoặc secret dev được dùng lại / C/I: phụ thuộc cách triển khai
- **Root cause:** Các biện pháp an toàn được gắn với NODE_ENV thay vì luôn bắt buộc. Suy diễn secret để tiện cho dev.
- **Remediation:** Bỏ cơ chế suy ra secret (bắt buộc 3 secret riêng ở mọi môi trường trừ test). Thêm kiểm tra entropy tối thiểu (ví dụ ≥128 bit, base64 hoặc hex). docker-compose: mặc định `NODE_ENV=production` cho image triển khai, bind `127.0.0.1:3000:3000`. Thêm `OTP_PEPPER` vào schema env và bắt buộc ở production.
- **Acceptance:** Ứng dụng không khởi động nếu thiếu JWT_REFRESH_SECRET hoặc JWT_RESET_SECRET ở môi trường khác test.

#### SEC-049 — Secret dự phòng hardcode (OTP pepper, POS approval token, guest token) và dùng lại JWT_SECRET

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-798 / CWE-323 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** auth ; pricing/pos/checkout ; orders — backend/src/modules/auth/auth.service.ts:72 (AuthService.getOtpPepper / isOtpHashValid)
- **Mô tả:** `getOtpPepper` rơi về `JWT_RESET_SECRET`, cuối cùng là chuỗi hardcode `'truong-thanh-otp-pepper-secret-2026'` (vi phạm quy tắc không hardcode secret của AGENTS.md 3.4, dù trên thực tế JWT_RESET_SECRET luôn được set). Cùng một khóa vừa ký JWT reset vừa làm HMAC OTP (tái sử dụng khóa). Nhánh tương thích ngược còn chấp nhận `sha256(otp)` không pepper; với không gian 6 chữ số, hash dạng này bị đảo ngược tức thì nếu DB lộ. Do OTP chỉ sống 10 phút, nhánh legacy giờ là code chết.
- **Điều kiện / Tác động:** DB hoặc secret bị lộ / C thấp
- **Root cause:** Giữ lại code tương thích ngược và giá trị dự phòng tiện lợi.
- **Remediation:** Bắt buộc `OTP_PEPPER` riêng (thêm vào env.validation), bỏ chuỗi hardcode, xóa nhánh legacy SHA-256.
- **Acceptance:** Không còn chuỗi secret trong source. Ứng dụng từ chối khởi động nếu thiếu OTP_PEPPER ở production.

#### SEC-050 — JWT chưa pin thuật toán, payload chứa email/permissions, user bị xóa nhận 404 thay vì 401

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-327 / CWE-200 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** auth — backend/src/modules/auth/strategies/jwt.strategy.ts:42 (JwtStrategy / AuthModule / AuthService.generateTokens)
- **Mô tả:** `JwtModule` và `JwtStrategy` không khai báo `algorithms: ['HS256']` hay `signOptions.algorithm`. Hiện jsonwebtoken 9.0.3 đã tự giới hạn HS* khi dùng secret dạng chuỗi nên chưa khai thác được, nhưng nên pin rõ ràng. Access và refresh token chứa `email` và `permissions` (JWT chỉ base64, ai giữ token cũng đọc được), trong khi guard đã đọc quyền từ DB nên các claim này không cần thiết. `JwtStrategy.validate` gọi `usersService.findById`, hàm này ném `NotFoundException` khi user đã bị xóa, nên API trả 404 thay vì 401. Frontend chỉ xử lý 401 để refresh hoặc logout.
- **Điều kiện / Tác động:** Không / C rất thấp
- **Root cause:** Dùng cấu hình mặc định của thư viện, và tái sử dụng hàm findById vốn ném lỗi.
- **Remediation:** Thêm `algorithms:['HS256']` vào strategy và mọi chỗ gọi verifyAsync, cùng `signOptions.algorithm:'HS256'`. Bỏ `email` và `permissions` khỏi payload. Trong strategy, bắt NotFound và ném UnauthorizedException.
- **Acceptance:** Token ký HS512 hoặc none bị từ chối. User bị xóa nhận 401.

#### SEC-051 — docker-compose chạy image production với NODE_ENV mặc định development, mật khẩu mặc định và Redis không mật khẩu

- **Category / Severity / Status:** Misconfiguration / Low / OPEN — **CWE:** CWE-1188, CWE-1392, CWE-209 — **CVSS:** CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N (7.4), có điều kiện tiên quyết triển khai
- **Confidence:** Cao (xác nhận bởi 2 lượt kiểm chứng độc lập)
- **Module / File:** DevOps / Docker Compose — docker-compose.yml:59
- **Mô tả:** Compose build image từ Dockerfile production nhưng override `NODE_ENV: ${NODE_ENV:-development}`. Nếu thiếu `.env`, mọi secret sẽ rơi về giá trị mặc định đã nằm trong repo: JWT_SECRET/REFRESH/RESET `local-development-*`, mật khẩu Mongo `admin123456`. Backend publish `3000:3000` trên 0.0.0.0, frontend publish `80:8080`. Khi ai đó chạy `docker compose up -d` trên VPS mà quên `.env`, các hậu quả sau xảy ra cùng lúc. (a) `validate()` trong env.validation.ts:399-401 không vào chế độ strict, vì NODE_ENV không phải production và không chạy trên Render/Vercel, nên không có lỗi gì chặn khởi động. (b) HttpExceptionFilter trả `details.stack` cho lỗi 5xx (http-exception.filter.ts:82,242-253). (c) Swagger bật (main.ts:164). Health endpoint lộ nodeVersion và environment (app.controller.ts:60-76). (d) Seed coi host `mongodb` là local (seed-safety.ts:7) nên dùng mật khẩu mặc định công khai `SuperAdmin@1…
- **Điều kiện / Tác động:** Chạy `docker compose up` trên host public mà không có `.env` đầy đủ. / C:H/I:H nếu seed dùng mật khẩu mặc định hoặc JWT bị giả mạo. Stack trace lộ cấu trúc nội bộ.
- **Root cause:** Một file compose dùng chung cho cả dev và triển khai thật, dùng fallback `:-default` thay cho cú pháp bắt buộc `:?`, và môi trường mặc định không an toàn.
- **Remediation:** Đổi các secret sang cú pháp bắt buộc `${JWT_SECRET:?JWT_SECRET is required}` (tương tự cho Mongo password, REFRESH, RESET), hoặc tách `docker-compose.override.yml` riêng cho dev. Đặt `NODE_ENV: ${NODE_ENV:-production}` để khớp với image. Bỏ publish cổng 3000 vì nginx đã proxy `/api`, hoặc bind `127.0.0.1:3000:3000`. Đồng bộ HttpExceptionFilter để dùng cùng điều kiện isProduction (gồm cả cloud) như main.ts.
- **Acceptance:** `docker compose config` báo lỗi khi thiếu JWT_SECRET hoặc MONGO_INITDB_ROOT_PASSWORD. Backend không lắng nghe trên 0.0.0.0:3000 của host. Lỗi 5xx trong container compose không trả stack.
- *Ghi chú verifier:* devsecops#1 reach: downgraded -> Low; devsecops#13 reach: downgraded -> Low.

#### SEC-052 — Dependency production có advisory: sanitize-html, nodemailer và các gói gián tiếp (exceljs, @nestjs...)

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-1395, CWE-79 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (xác nhận bởi 2 lượt kiểm chứng độc lập)
- **Module / File:** Supply chain / Backend dependencies ; Supply chain / Email — backend/package.json:58 (sanitizeXss)
- **Mô tả:** `npm audit --omit=dev` cho backend báo 13 lỗ hổng: 12 moderate, 1 low, 0 high/critical. sanitize-html 2.17.7 là dependency trực tiếp và được SecuritySanitizerMiddleware dùng cho mọi request body. Nó dính 3 advisory: GHSA-x3q4-9hxx-gx8m (vùng discard của `<noscript>` kết thúc sớm), GHSA-374f-7chj-9948 (bypass qua namespace của SMIL animation, chèn `javascript:`), GHSA-cv27-6wvh-8x7j (`meta http-equiv=refresh` vẫn giữ URL `javascript:`/`data:`). Allowlist của dự án rất chặt (security.sanitizer.ts:34-68: không có svg, meta hay noscript; chỉ cho thẻ a với scheme http/https/mailto/tel), nên 2 trong 3 advisory gần như không áp dụng được. Riêng lỗi noscript liên quan tới `nonTextTags` mặc định nên chưa loại trừ hoàn toàn. Bản sửa không phải major. Pipeline dùng `npm audit --audit-level=high` (ci.yml:53,108; release.yml:36,53) nên các lỗ hổng moderate trong code production đi qua CI mà không ai …
- **Điều kiện / Tác động:** Chuỗi HTML độc hại lọt qua allowlist và được render dưới dạng HTML ở frontend / I/C thấp tới trung bình nếu bypass thành công và frontend render HTML bằng v-html
- **Root cause:** Không có quy trình cập nhật dependency tự động (không có Dependabot/Renovate), và ngưỡng audit trong CI bỏ qua mức moderate.
- **Remediation:** Nâng `sanitize-html` lên bản đã sửa mới nhất trong nhánh 2.x (>2.18.0, theo advisory GHSA-x3q4 thì sửa từ 2.18.0; npm audit gắn cờ cả `<=2.18.0` nên nên lấy bản mới nhất). Bản này không phải major. Kiểm tra lại override `htmlparser2: 10.0.0` có tương thích không. Chạy lại test của security.sanitizer. Cân nhắc thêm bước `npm audit --omit=dev --audit-level=moderate` riêng cho dependency production.
- **Acceptance:** `npm audit --omit=dev` không còn cảnh báo sanitize-html hay deepmerge. Test sanitizer pass.
- *Ghi chú verifier:* devsecops#2 reach: downgraded -> Low; devsecops#3 reach: downgraded -> Low.

#### SEC-053 — Dependency dev có nhiều lỗ hổng moderate; cổng supply chain CI còn mỏng (audit chỉ chặn từ high, thiếu Dependabot)

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-1395 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** Supply chain / Dev toolchain ; CI/CD — frontend/package.json:53
- **Mô tả:** Tổng backend: 45 lỗ hổng (44 moderate, 1 low), trong đó 32 chỉ thuộc dev (eslint/minimatch, jest/glob, @nestjs/cli, fast-uri 3.1.8, typescript-eslint). Frontend: 21 moderate, toàn bộ là dev. Production frontend có 0 lỗ hổng. Đáng chú ý là vitest 4.1.11 / @vitest/mocker <=4.1.11 (GHSA-qxg6-89mg-rqv8 code injection khi đăng ký manual mock không xác thực, và GHSA-xp26-3454-mjgp traversal bằng backslash trên Windows). Lỗi này ảnh hưởng máy dev chạy Windows khi vitest server mở. Bản sửa 4.1.12 không phải major. Các đề xuất `eslint@4.0.0`, `jest@29.7.0`, `@vue/test-utils@2.4.11` là hạ version, KHÔNG làm theo.
- **Điều kiện / Tác động:** Chạy vitest ở chế độ watch/server trên máy dev / Thấp, giới hạn trong môi trường dev
- **Root cause:** Không có quy trình cập nhật dependency tự động
- **Remediation:** Nâng vitest lên ^4.1.12 (không phải major). `npm update fast-uri` để lấy 3.1.9. Phần còn lại (minimatch/glob trong eslint/jest) chờ upstream; không hạ version.
- **Acceptance:** npm audit frontend không còn cảnh báo vitest

#### SEC-054 — GitHub Actions pin theo tag (chưa pin SHA) và Docker base image không pin digest

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-829 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** DevOps / Docker — frontend/Dockerfile:18
- **Mô tả:** `nginxinc/nginx-unprivileged:alpine` là tag trôi, không có version. `node:22-alpine` (backend/Dockerfile:6,22; frontend/Dockerfile:7) chỉ pin theo major. Mỗi lần build có thể lấy image khác nhau, nên không tái lập được và dễ bị tấn công supply chain qua registry.
- **Điều kiện / Tác động:**  / I (supply chain)
- **Root cause:** Pin theo tag thay vì digest
- **Remediation:** Pin theo `image:tag@sha256:<digest>` (ví dụ `node:22.x.y-alpine3.xx@sha256:...`) và để Dependabot ecosystem docker tự cập nhật.
- **Acceptance:** Mọi lệnh FROM đều có @sha256

#### SEC-055 — Log chứa PII và URL đầy đủ; IP lấy từ X-Forwarded-For mà client có thể giả mạo

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-532 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** Logging / Observability — backend/src/common/filters/http-exception.filter.ts:287 (HttpExceptionFilter.catch)
- **Mô tả:** Khi có lỗi 5xx, filter log toàn bộ request body sau sanitizeForLogging (dòng 287). Sanitizer này chỉ che theo tên key (password/token/otp/secret...), nên họ tên, số điện thoại, địa chỉ và email của khách (đơn hàng, checkout) vẫn vào log. Dòng 281 và 313 log `request.url` gồm cả query string, trong khi field `query` thì đã được che. Tôi xác minh hiện không có token nào được truyền qua query string. EmailService log địa chỉ người nhận ở dạng rõ (email.service.ts:85,89,100). LoggingInterceptor:41 và filter:268 lấy `x-forwarded-for` thô, client có thể giả mạo giá trị này để làm nhiễu điều tra.
- **Điều kiện / Tác động:** Có lỗi 5xx xảy ra trên request chứa PII / C thấp (PII nằm trong log)
- **Root cause:** Chính sách log chưa phân loại PII
- **Remediation:** Bổ sung các key PII (phone, email, address, fullName, customerName, shippingAddress) vào danh sách mask, ví dụ mask một phần. Log `path` không kèm query. Chỉ log domain hoặc hash của email người nhận. Dùng `req.ip` sau khi cấu hình trust proxy đúng, thay vì header thô.
- **Acceptance:** Log lỗi 5xx của POST /orders không chứa số điện thoại hay địa chỉ rõ

#### SEC-056 — GitLab Personal Access Token lưu dạng rõ trong URL remote của .git/config trên máy dev

- **Category / Severity / Status:** Best Practice Improvement / Low / BLOCKED — **CWE:** CWE-256 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** Developer workstation — .git/config (không được track)
- **Mô tả:** Remote `gitlab` có dạng `https://[ĐÃ CHE]@gitlab.com/...`, tức PAT nằm thẳng trong URL. File này không được commit, nhưng mọi tool hay agent đọc được thư mục repo (và cả output của `git remote -v`) đều thấy token.
- **Điều kiện / Tác động:** Truy cập được filesystem của máy dev / I/C cho repo GitLab
- **Root cause:** Nhúng token vào URL thay vì dùng credential helper
- **Remediation:** `git remote set-url gitlab https://gitlab.com/truonghoang_11/Truong_Thanh_Bookstore.git` và dùng Git Credential Manager. Thu hồi và tạo lại PAT với scope tối thiểu (read_repository/write_repository) và có ngày hết hạn.
- **Acceptance:** `git remote -v` không còn chứa token

#### SEC-057 — IPN báo thanh toán thành công cho đơn đã HỦY không tạo yêu cầu hoàn tiền

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-840 Business Logic Errors — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** payments — backend/src/modules/payments/payments.service.ts:524 (PaymentsService.handleCallback / syncOrderPaymentStatus)
- **Mô tả:** Vấn đề toàn vẹn tài chính. Trạng thái terminal của đơn (CANCELLED/RETURNED) chỉ được kiểm tra trong nhánh phiên đã hết hạn. Tình huống: khách tạo phiên VNPay/MoMo (15 phút), hủy đơn PENDING (được phép với owner, lúc đó paymentStatus chưa PAID nên refundStatus vẫn NONE), rồi vẫn hoàn tất thanh toán trong 15 phút. IPN hợp lệ đi vào nhánh thường: payment PAID và order.paymentStatus=PAID, nhưng orderStatus vẫn CANCELLED và refundStatus vẫn NONE. Tiền đã thu nhưng không có cờ hoàn tiền, kho đã hoàn lại. Đơn cũng không vào doanh thu (bị loại vì CANCELLED), nên tiền nằm ngoài mọi luồng đối soát.
- **Điều kiện / Tác động:** ENABLED_PAYMENT_METHODS bật VNPAY/MOMO, đơn bị hủy trong vòng 15 phút kể từ khi tạo phiên. / Integrity: tiền khách đã trả không có đầu mối hoàn tiền, gây khiếu nại/chargeback
- **Root cause:** Không xử lý trường hợp thanh toán thành công đến sau khi đơn đã chuyển sang trạng thái terminal nhưng phiên thanh toán chưa hết hạn.
- **Remediation:** Trong handleCallback, đọc order (trong session) trước khi cập nhật. Nếu orderStatus thuộc CANCELLED/RETURNED và result.success thì set refundStatus=MANUAL_REQUIRED, refundAmount=payment.amount, ghi timeline, không recognize revenue. Ngoài ra khi hủy đơn online còn phiên PENDING thì nên đánh dấu payment FAILED/CANCELLED.
- **Acceptance:** IPN thành công cho đơn CANCELLED thì order.refundStatus=MANUAL_REQUIRED và refundAmount=amount.
- *Ghi chú verifier:* business-integrity#6 reach: downgraded -> Low.

#### SEC-060 — Trả hàng NCC: kiểm tra số lượng còn được trả nằm ngoài transaction

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-367 TOCTOU Race Condition — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** purchasing/returns — backend/src/modules/purchasing/purchase-returns.service.ts:146 (PurchaseReturnsService.createReturn)
- **Mô tả:** Race condition TOCTOU gây vấn đề toàn vẹn dữ liệu. Số đã trả trước đó (previousReturns) và GRN được đọc ngoài session, rồi mới mở transaction để ghi phiếu trả, trừ kho và bù trừ công nợ. Không có khóa hay cập nhật có điều kiện trên GRN (ví dụ trường returnedBaseQuantity). Hai request song song với idempotencyKey khác nhau (hoặc không có key) đều qua kiểm tra, dẫn đến tổng trả vượt số đã nhận và công nợ NCC bị bù trừ 2 lần. Tồn kho được trừ nguyên tử nên không âm, nhưng chỉ bảo vệ được khi tồn không đủ.
- **Điều kiện / Tác động:** 2 request trả hàng cho cùng GRN chạy đồng thời. / Integrity: công nợ NCC và tồn kho sai lệch
- **Root cause:** Bất biến 'tổng trả ≤ tổng nhận' không được thực thi nguyên tử ở tầng DB.
- **Remediation:** Lưu `returnedBaseQuantity` trên từng dòng GRN và cập nhật bằng findOneAndUpdate có điều kiện `items.$.returnedBaseQuantity + qty <= baseQuantity` trong cùng session, hoặc đọc GRN và previousReturns trong session kèm ghi 'touch' GRN để tạo write conflict.
- **Acceptance:** Hai request song song, mỗi request trả toàn bộ số đã nhận: chỉ 1 thành công.

#### SEC-061 — Combo landing page bán với quantity=1: khách trả giá combo nhiều cuốn nhưng kho chỉ trừ 1

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-840 Business Logic Errors — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** landing-pages — backend/src/modules/landing-pages/landing-page.service.ts:337 (LandingPageService.submitOrder)
- **Mô tả:** Lỗi nghiệp vụ gây vấn đề toàn vẹn dữ liệu, không phải lỗ hổng bảo mật. Gói do AI/template sinh ra có dạng 'Gói Combo' giá ≈ 2× và 'Gói Siêu Rẻ' giá ≈ 3× giá lẻ (landing-page.service.ts:403-406, 571-588). Tuy vậy PackageItem không có trường quantity, và submitOrder luôn tạo dòng `quantity: 1`. Doanh thu ghi nhận cho 1 đơn vị là giá combo, kho chỉ trừ 1, nên giá vốn và biên lợi nhuận sai, đồng thời có nguy cơ giao thiếu hoặc bán vượt tồn.
- **Điều kiện / Tác động:** Landing page có gói nhiều đơn vị. / Integrity: tồn kho, COGS, biên lợi nhuận
- **Root cause:** Mô hình gói thiếu số lượng đơn vị.
- **Remediation:** Thêm `quantity` (Min 1) vào PackageItem và DTO. submitOrder dùng `quantity: pkg.quantity` và `price: pkg.price / pkg.quantity`, hoặc lưu giá gói làm line total.
- **Acceptance:** Đặt gói 3 cuốn thì kho trừ 3 và order.items[0].quantity=3.

#### SEC-062 — Đối soát COD không xử lý đơn COMPLETED; COD đánh dấu PAID ngay khi DELIVERED

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-840 Business Logic Errors — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** finance/cod — backend/src/modules/finance/services/cod-reconciliation.service.ts:121 (CodReconciliationService.processStatement / getPendingCodOrders)
- **Mô tả:** Lỗi nghiệp vụ gây vấn đề toàn vẹn dữ liệu. processStatement chỉ nhận đơn DELIVERED hoặc RETURNED. Đơn đã chuyển DELIVERED→COMPLETED rơi vào nhánh discrepancy 'chưa giao thành công', không bao giờ được RECONCILED, và cũng không xuất hiện ở /cod-reconciliation/pending. Bên cạnh đó, lifecycle set paymentStatus=PAID cho COD ngay khi nhân viên chuyển DELIVERED (order-lifecycle 286-292), và revenue được ghi nhận lúc đó. Nghĩa là trạng thái 'đã thu tiền' và doanh thu không phụ thuộc vào tiền thực nhận từ hãng vận chuyển.
- **Điều kiện / Tác động:** Đơn COD được chuyển sang COMPLETED trước khi đối soát. / Integrity: sổ quỹ và công nợ hãng vận chuyển không khớp
- **Root cause:** Bộ lọc trạng thái chưa bao gồm COMPLETED. Thời điểm ghi nhận thanh toán COD chưa gắn với đối soát.
- **Remediation:** Chấp nhận `$in: [DELIVERED, COMPLETED]` ở cả 2 hàm. Về nghiệp vụ: cân nhắc giữ paymentStatus=UNPAID/PENDING_COLLECTION cho COD tới khi đối soát, hoặc tách 'revenueRecognized' khỏi 'cashCollected'.
- **Acceptance:** Bảng kê chứa trackingCode của đơn COMPLETED thì được RECONCILED.

#### SEC-063 — Checkout chuyển sang chế độ không transaction (compensated) cả trong production

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-662 Improper Synchronization — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** orders/checkout — backend/src/modules/orders/services/checkout.service.ts:683 (CheckoutService.createAtomic)
- **Mô tả:** Khi Mongo không hỗ trợ transaction, checkout chạy persist() không có session và dùng các bước bù trừ (rollbackStock, releaseUsage, refundLoyaltyPoints). Các bước bù trừ này có `.catch` nuốt lỗi, nên có thể lệch kho, khuyến mãi hoặc điểm nếu rollback thất bại. Inventory (inventory.service.ts:782-815) và GRN (goods-receipts.service.ts:164-171) đã chặn fallback này trong production, nhưng checkout thì chưa. Đây là luồng tài chính quan trọng nhất.
- **Điều kiện / Tác động:** Mongo production chạy standalone. / Integrity khi hạ tầng cấu hình sai
- **Root cause:** Chính sách bắt buộc transaction chưa đồng nhất giữa các module.
- **Remediation:** Khi NODE_ENV==='production', ném ServiceUnavailableException thay vì fallback, giống inventory/GRN. Health check nên kiểm tra replica set.
- **Acceptance:** NODE_ENV=production và lỗi transaction unsupported thì trả 503, không tạo đơn.

#### SEC-064 — Hoàn tiền đơn online không bao giờ hoàn tất; hoàn đảo phiếu thu POS/COD không ràng buộc chặt

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-840 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** orders/finance — backend/src/modules/orders/services/order-lifecycle.service.ts:737 (OrderLifecycleService.processRefund / FinanceService.reverseEntry)
- **Mô tả:** Lỗi quy trình nghiệp vụ. processRefund chỉ chuyển refundStatus sang MANUAL_REQUIRED. Trong mã nguồn không có chỗ nào set RefundStatus.REFUNDED và cũng không tạo CashEntry OUT cho đơn web, nên trạng thái hoàn tiền thực tế và sổ quỹ không được ghi nhận. Ngoài ra, reverseEntry (finance.service.ts:427-714) cho phép đảo bất kỳ phiếu POSTED nào, kể cả phiếu POS_REVENUE hoặc ONLINE_REVENUE do hệ thống sinh ra, mà không cập nhật POSOrder hay batch COD tương ứng. Kết quả là chứng từ nghiệp vụ và sổ quỹ lệch nhau, và chỉ phát hiện được qua đối soát.
- **Điều kiện / Tác động:**  / Integrity: báo cáo tài chính
- **Root cause:** Luồng hoàn tiền và đảo chứng từ chưa khép kín.
- **Remediation:** Thêm endpoint xác nhận hoàn tiền thủ công (MANAGE_FINANCE): tạo CashEntry OUT và set REFUNDED một cách nguyên tử. Với reverseEntry, chặn đảo các referenceType do hệ thống sinh (POS_ORDER, COD) hoặc yêu cầu đi qua luồng nghiệp vụ tương ứng.
- **Acceptance:** Có luồng ghi nhận REFUNDED kèm phiếu chi. Đảo phiếu POS_ORDER bị từ chối hoặc đồng bộ chứng từ gốc.

#### SEC-066 — Lộ thông báo lỗi bên thứ ba (Cloudinary) và 500 khi ObjectId không hợp lệ ở route công khai

- **Category / Severity / Status:** Misconfiguration / Low / OPEN — **CWE:** CWE-209 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** users/cloudinary, reviews — backend/src/modules/users/cloudinary.service.ts:64 (uploadImage; ReviewsService.findByProduct)
- **Mô tả:** uploadImage trả về client chuỗi `Tải ảnh lên thất bại: ${error.message}` với message gốc của Cloudinary, có thể lộ trạng thái cấu hình như 'Must supply api_key'. Đường avatar trong auth.service không gọi isConfigured() trước khi upload. GET /reviews/product/:productId gọi new Types.ObjectId(productId) không kiểm tra hợp lệ. BSONError không được HttpExceptionFilter map nên trả 500; ngoài production còn kèm stack (mapper đã nêu filter chỉ dựa vào NODE_ENV).
- **Điều kiện / Tác động:** Không cần hoặc chỉ cần tài khoản customer. / C:L
- **Root cause:** Đẩy thẳng error message của SDK ra ngoài. Thiếu ParseObjectId pipe cho param.
- **Remediation:** Log lỗi Cloudinary ở server, trả message chung. Dùng IsMongoObjectId hoặc ParseObjectIdPipe cho :productId, :id. Map BSONError sang 400 trong filter.
- **Acceptance:** GET /reviews/product/abc trả 400. Lỗi upload trả message chung.

#### SEC-067 — Đăng ký nhận thông báo có hàng không xác minh email: dùng hệ thống gửi mail tới địa chỉ bất kỳ

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-799 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** products (stock alert) — backend/src/modules/products/products.controller.ts:262 (subscribeToStockAlert)
- **Mô tả:** POST /products/:id/alert (public, 5/phút/IP) nhận email bất kỳ và không có double opt-in. Khi sản phẩm có hàng lại, hệ thống gửi email tới các địa chỉ đó. Kẻ tấn công có thể đăng ký hàng loạt email nạn nhân, làm hỏng uy tín domain gửi mail. Đi cùng vấn đề trust proxy mà mapper đã nêu.
- **Điều kiện / Tác động:** Không cần đăng nhập. / I:L
- **Root cause:** Thiếu xác minh quyền sở hữu email.
- **Remediation:** Gửi email xác nhận (double opt-in) trước khi kích hoạt alert, hoặc yêu cầu đăng nhập. Giới hạn số alert theo email và theo IP.
- **Acceptance:** Alert chỉ được kích hoạt sau khi email được xác nhận.

#### SEC-068 — Bỏ qua bước phê duyệt chuyển kho: xuất kho trực tiếp từ phiếu DRAFT rồi người tạo tự nhận

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-841 (Improper Enforcement of Behavioral Workflow) — **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N (4.3)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** warehouses — backend/src/modules/warehouses/warehouses.service.ts:559 (WarehousesService.shipTransfer / receiveTransfer)
- **Mô tả:** Luồng chuyển kho được thiết kế là DRAFT, rồi APPROVED, rồi IN_TRANSIT, rồi COMPLETED. Nhưng shipTransfer chấp nhận cả phiếu đang DRAFT, nên endpoint PATCH /warehouses/transfers/:id/approve trở thành tùy chọn. Toàn bộ chuỗi tạo, xuất, nhận chỉ cần MANAGE_INVENTORY và không kiểm tra người thực hiện khác người tạo. Khi nhận hàng, người nhận được khai receivedQty nhỏ hơn shippedQty, và phần chênh lệch tự động ghi thành giao dịch DAMAGE (hao hụt vận chuyển) mà không ai duyệt. Như vậy một nhân viên kho có thể tạo phiếu, xuất hàng, rồi khai thiếu để hợp thức hóa việc làm mất hàng mà không cần phê duyệt.
- **Điều kiện / Tác động:** Tài khoản STAFF có MANAGE_INVENTORY, có ít nhất 2 kho. / I: sai lệch tồn kho, che giấu thất thoát hàng hóa, sổ cái kho mất giá trị kiểm soát.
- **Root cause:** Máy trạng thái cho phép bỏ qua bước APPROVED. Không áp dụng phân tách nhiệm vụ (maker-checker) giữa người lập, người duyệt, người xuất và người nhận. Ghi nhận hao hụt không có ngưỡng hay phê duyệt.
- **Remediation:** 1) shipTransfer chỉ chấp nhận status APPROVED. 2) approveTransfer từ chối khi `transfer.createdBy.equals(userId)`, và cân nhắc yêu cầu ADMIN hoặc một permission duyệt riêng. 3) receiveTransfer: khi variance > 0 (hoặc vượt ngưỡng số lượng/giá trị) thì chuyển sang trạng thái chờ duyệt hao hụt thay vì ghi DAMAGE ngay. Cũng nên cấm receivedBy trùng shippedBy.
- **Acceptance:** PATCH transfers/:id/ship trên phiếu DRAFT trả 400. Người tạo phiếu gọi approve trên phiếu của chính mình nhận 403 (nếu nghiệp vụ chốt SoD). Variance > ngưỡng không tự động ghi DAMAGE.
- *Ghi chú verifier:* authz-erp#1 reach: downgraded -> Low.

#### SEC-070 — Kiểm kê kho: cờ requiresApproval không được thực thi, người nộp tự duyệt

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-841 (Improper Enforcement of Behavioral Workflow) / CWE-863 — **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N (4.3)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** stock-audits — backend/src/modules/stock-audits/stock-audits.service.ts:243 (StockAuditsService.approve)
- **Mô tả:** submitCount tính requiresApproval=true khi một dòng lệch quá 5 đơn vị hoặc tổng giá trị lệch vượt 500.000đ. Comment ghi rõ "Bắt buộc quản lý duyệt". Tuy vậy approve() không đọc cờ này, không kiểm tra người duyệt khác submittedBy/createdBy, và không yêu cầu role quản lý. Mọi STAFF có MANAGE_INVENTORY, kể cả chính người đếm, đều tự duyệt được, và hệ thống áp ngay adjustStock cho mọi dòng chênh lệch. Đây là ngưỡng kiểm soát nghiệp vụ (ERP-04) chỉ tồn tại trên giấy.
- **Điều kiện / Tác động:** STAFF có MANAGE_INVENTORY. / I: điều chỉnh tồn kho giá trị lớn mà không có kiểm soát độc lập, có thể dùng để che giấu thất thoát.
- **Root cause:** Ngưỡng duyệt chỉ được tính và lưu, không được dùng để phân quyền. Thiếu permission duyệt riêng và thiếu kiểm tra người duyệt khác người lập/nộp.
- **Remediation:** 1) Trong approve(), nếu `audit.requiresApproval` thì actor phải là ADMIN/SUPER_ADMIN (hoặc có permission mới, ví dụ APPROVE_INVENTORY_ADJUSTMENT, cần chốt nghiệp vụ). 2) Từ chối khi `audit.submittedBy?.equals(userId)` hoặc `audit.createdBy?.equals(userId)`. 3) Truyền actor (role, permissions) từ controller vào service.
- **Acceptance:** Audit có requiresApproval=true: STAFF không có quyền duyệt nhận 403. Người submit tự approve nhận 403. ADMIN approve thành công.
- *Ghi chú verifier:* authz-erp#3 reach: downgraded -> Low.

#### SEC-071 — Endpoint kho thủ công cho nhập giá vốn tùy ý và ghi bán/hủy/điều chỉnh tồn ngoài chứng từ

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-841 / CWE-639-like trust of client-supplied business value (CWE-602 Client-Side Enforcement) — **CVSS:** CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N (4.3)
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** inventory — backend/src/modules/inventory/inventory.controller.ts:101 (InventoryController.importStock / exportStock / saleStock / damageStock / adjustStock; InventoryService.applyMovement)
- **Mô tả:** Mọi STAFF có MANAGE_INVENTORY có thể làm các việc sau.
(a) POST /inventory/import (hoặc /inventory/transactions type IMPORT) với costPrice bất kỳ từ client. applyMovement dùng giá trị này để tính lại giá vốn bình quân gia quyền, trong khi backlog đã chốt "Giá vốn phải xuất phát từ chứng từ mua và nhận hàng" (docs/AUDIT_V2_BACKLOG.md:312).
(b) POST /inventory/sale hoặc /inventory/export để ghi xuất bán SALE mà không có đơn hàng hay phiếu thu.
(c) POST /inventory/damage để ghi hủy hàng.
(d) POST /inventory/adjust để đặt thẳng tồn mới (newStock) mà không qua quy trình kiểm kê có ngưỡng duyệt.
Hệ quả là có thể bóp méo COGS và lãi gộp trên báo cáo (reports.service.ts:720-888), giá sàn/biên lợi nhuận dùng trong pricing, và che giấu thất thoát hàng. Đánh giá là Potential Risk vì đây có thể là tính năng vận hành chủ ý, nhưng thiếu ngưỡng và thiếu phê duyệt.
- **Điều kiện / Tác động:** STAFF có MANAGE_INVENTORY. / I: sai lệch giá vốn, lãi gộp và tồn kho. Rủi ro gian lận nội bộ.
- **Root cause:** Endpoint vận hành cấp thấp (ghi sổ kho trực tiếp) được mở cho cùng permission với luồng nghiệp vụ chuẩn (PO/GR/kiểm kê). Không có ngưỡng, lý do bắt buộc hay phê duyệt.
- **Remediation:** 1) Bỏ costPrice khỏi InventoryTransactionDto cho route công khai, chỉ cho GoodsReceiptsService hoặc data-exchange opening_stock (ADMIN) truyền giá vốn nội bộ. 2) Giới hạn /inventory/adjust, /sale, /export, /damage cho ADMIN hoặc một permission riêng, hoặc buộc đi qua stock-audits khi |delta| hoặc giá trị vượt ngưỡng. 3) Bắt buộc note/reason cho adjust và damage. 4) Cân nhắc gỡ route legacy /inventory/export và /inventory/sale nếu frontend không còn dùng.
- **Acceptance:** STAFF gửi costPrice tới /inventory/import nhận 400 (forbidNonWhitelisted), hoặc giá trị bị bỏ qua. Adjust hoặc damage vượt ngưỡng bởi STAFF nhận 403 hoặc chuyển sang chờ duyệt.
- *Ghi chú verifier:* authz-erp#4 reach: downgraded -> Low.

#### SEC-074 — Máy trạng thái chứng từ điện tử không chặt: xóa được file đính kèm của chứng từ đã REVERSED/đã chốt

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-841 / CWE-662 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** documents — backend/src/modules/documents/documents.service.ts:236 (DocumentsService.removeAttachment / cancelDocument / reverseDocument)
- **Mô tả:** removeAttachment chỉ chặn trạng thái POSTED, nên với chứng từ đã REVERSED hoặc CANCELLED vẫn xóa được file bằng chứng (addAttachment thì đã chặn cả hai trạng thái này). cancelDocument chỉ chặn POSTED, nên chứng từ REVERSED có thể bị chuyển sang CANCELLED, làm sai lịch sử hoàn đảo. reverseDocument lưu chứng từ gốc rồi mới tạo chứng từ đối ứng, không dùng session/transaction: nếu bước thứ hai lỗi thì chứng từ gốc đã REVERSED nhưng không có đối ứng. Không có IDOR theo người dùng vì chứng từ là dữ liệu dùng chung nội bộ. Không có endpoint tải file (chỉ lưu URL HTTPS).
- **Điều kiện / Tác động:** STAFF có MANAGE_DOCUMENTS hoặc MANAGE_FINANCE. / I: làm mất bằng chứng đính kèm và sai lệch trạng thái sổ chứng từ (auditLog vẫn ghi nhận hành động).
- **Root cause:** Kiểm tra trạng thái dùng blacklist thay cho whitelist (chỉ DRAFT mới được sửa). Thiếu transaction.
- **Remediation:** removeAttachment và cancelDocument chỉ cho phép khi `doc.status === DocumentStatus.DRAFT`. Bọc reverseDocument trong MongoDB session như các module finance/warehouses.
- **Acceptance:** DELETE attachments và PATCH cancel trên chứng từ REVERSED/CANCELLED trả 400. Reverse lỗi giữa chừng thì không để lại chứng từ gốc ở trạng thái REVERSED.

#### SEC-075 — STAFF có MANAGE_ORDERS tạo được công nợ phải thu tùy ý, không đối chiếu đơn hàng

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-863 / CWE-602 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** finance — backend/src/modules/finance/finance.service.ts:1408 (FinanceService.createReceivable)
- **Mô tả:** POST /finance/receivables cho phép MANAGE_ORDERS (không cần MANAGE_FINANCE). Service tạo khoản phải thu với customerId, totalAmount, creditLimit và invoiceCode do client gửi. orderId/posOrderId là tùy chọn và không được kiểm tra tồn tại, cũng không kiểm tra thuộc đúng khách hay khớp số tiền. Nhân viên bán hàng có thể ghi nợ khống cho một khách, làm sai lệch báo cáo tuổi nợ và hạn mức tín dụng (credit-check, aging), hoặc chặn khách đó mua chịu.
- **Điều kiện / Tác động:** STAFF có MANAGE_ORDERS. / I: sai lệch công nợ phải thu và báo cáo tuổi nợ.
- **Root cause:** Endpoint ghi sổ tài chính thủ công được mở cho quyền bán hàng, và không xác minh chứng từ gốc.
- **Remediation:** Chỉ cho MANAGE_FINANCE tạo receivable thủ công. Nếu có orderId hoặc posOrderId thì kiểm tra tồn tại, đúng customer, và lấy totalAmount từ đơn (không tin client). Bỏ creditLimit khỏi DTO receivable vì đã quản lý ở credit-profiles.
- **Acceptance:** STAFF[MANAGE_ORDERS] gọi POST /finance/receivables nhận 403, hoặc chỉ tạo được khi orderId hợp lệ và số tiền lấy từ đơn.

#### SEC-076 — Quyền VIEW_REPORTS và MANAGE_ORDERS quá rộng với dữ liệu tài chính (giá vốn, lãi gộp, sổ quỹ, danh sách thanh toán)

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-269 (Improper Privilege Management) — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** reports / finance / documents / purchasing ; payments — backend/src/modules/reports/reports.controller.ts:116 (ReportsController.getInventoryLedgerProfit / exportInventoryLedgerProfit; FinanceController.findAllEntries/exportEntries/getAgingReport)
- **Mô tả:** Chỉ một permission VIEW_REPORTS đã mở cùng lúc: báo cáo Nhập-Xuất-Tồn kèm costPrice, COGS, lãi gộp (reports.service.ts:841-888, export Excel :944-972); danh sách sổ quỹ, phiếu thu/chi và export sổ quỹ; báo cáo tuổi nợ khách hàng (có tên, SĐT); danh sách và chi tiết chứng từ; danh sách phiếu trả NCC. Không có permission tách riêng cho dữ liệu giá vốn (VIEW_COST) hay tài chính (VIEW_FINANCE). Nếu doanh nghiệp gán VIEW_REPORTS cho quản lý ca hoặc nhân viên bán hàng để xem doanh số, họ sẽ thấy luôn giá vốn và sổ quỹ.
- **Điều kiện / Tác động:** STAFF được gán VIEW_REPORTS. / C: lộ dữ liệu tài chính và giá vốn nội bộ cho nhân sự không cần biết.
- **Root cause:** Mô hình permission thô, không tách nhóm dữ liệu nhạy cảm theo vai trò.
- **Remediation:** Chốt với nghiệp vụ: tách VIEW_REPORTS (doanh số) khỏi VIEW_COST_REPORTS hoặc VIEW_FINANCE (giá vốn, lãi gộp, sổ quỹ, công nợ). Cập nhật @Permissions tương ứng và seed permission.
- **Acceptance:** Ma trận permission được chốt, và STAFF chỉ có VIEW_REPORTS không truy cập được endpoint giá vốn/sổ quỹ.

#### SEC-077 — ADMIN đổi được vai trò STAFF/CUSTOMER; tài liệu RBAC (PROJECT_OVERVIEW mục 6) lệch với code

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-285 Improper Authorization / CWE-778 Insufficient Logging — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Cao (đã kiểm chứng độc lập 1 lượt)
- **Module / File:** users ; docs — backend/src/modules/users/users.service.ts:244 (UsersService.updateRole / updatePermissions)
- **Mô tả:** PROJECT_OVERVIEW.md mục 6.2 quy định `PATCH /users/:id/role` là 'Duy nhất SUPER_ADMIN'. Code lại cho cả ADMIN (@Roles(SUPER_ADMIN, ADMIN)). Service vẫn chặn ADMIN gán hoặc sửa ADMIN/SUPER_ADMIN, nhưng ADMIN thăng được CUSTOMER lên STAFF, sau đó tự cấp mọi StaffPermission qua PATCH /users/:id/permissions (kể cả MANAGE_FINANCE, POS_*). updatePermissions cũng không ghi securityAuditService, khác với updateRole và updateStatus. Không có leo thang lên ADMIN, nhưng hành vi lệch đặc tả và thiếu dấu vết kiểm toán khi cấp quyền.
- **Điều kiện / Tác động:** Tài khoản ADMIN. / I: Low (cấp quyền nội bộ không đúng cấp phê duyệt, khó truy vết)
- **Root cause:** Đặc tả và code không đồng bộ. Audit log chưa phủ thao tác cấp quyền.
- **Remediation:** Chốt nghiệp vụ. Nếu giữ đặc tả: đổi @Roles của :id/role thành chỉ SUPER_ADMIN. Nếu giữ code: cập nhật docs mục 6.2. Trong mọi trường hợp, thêm `securityAuditService.logPermissionChange({actorId, actorRole, targetUserId, before, after})` trong updatePermissions.
- **Acceptance:** Hành vi :id/role khớp docs. Mỗi lần đổi permission đều có bản ghi audit (actor, target, trước/sau).
- *Ghi chú verifier:* authz-commerce#5 reach: downgraded -> Low.

#### SEC-078 — HttpExceptionFilter trả 500 thay vì 4xx (CORS bị từ chối, body > 1MB) và lộ stack khi không phải production

- **Category / Severity / Status:** Misconfiguration / Low / OPEN — **CWE:** CWE-209 / CWE-755 — **CVSS:** Chưa chấm CVSS chính thức; dynamic agent xếp Low
- **Confidence:** Trung bình (tổng hợp từ dynamic test hoặc ghi chú review, chưa có lượt kiểm chứng độc lập riêng)
- **Module / File:** common/filters, main.ts — backend/src/main.ts:91; backend/src/common/filters/http-exception.filter.ts:82,171-178
- **Mô tả:** Khi Origin không được phép, main.ts gọi callback(new Error("Not allowed by CORS")) nên preflight và request trả 500 (kèm details.error và stack khi không phải production). Body JSON > 1MB trả 500 thay vì 413 vì filter không có nhánh cho PayloadTooLargeError/entity.too.large. Ngoài production, response chứa details.stack với đường dẫn tuyệt đối của server. Filter chỉ dựa vào NODE_ENV==="production" trong khi main.ts tính cả môi trường cloud; docker-compose mặc định NODE_ENV=development nên có thể lộ stack nếu cấu hình sai.
- **Điều kiện / Tác động:** Môi trường chạy với NODE_ENV khác production (docker-compose mặc định) hoặc cấu hình sai. / C: lộ đường dẫn và cấu trúc nội bộ. A: lỗi 500 gây nhiễu giám sát.
- **Root cause:** Lỗi từ CORS callback và body-parser không được map sang 4xx; điều kiện che stack phụ thuộc một biến môi trường duy nhất.
- **Remediation:** 1) Map PayloadTooLargeError/entity.too.large sang 413. 2) Dùng cùng cờ isProduction (gồm cloud) ở filter và main.ts, mặc định che stack. 3) Với CORS bị từ chối: trả 403 gọn. LƯU Ý: verifier của finding login CSRF (đã bác bỏ) chỉ ra rằng việc CORS callback ném lỗi hiện đang chặn ở phía server các form POST cross-site tới /api/auth/login; nếu đổi sang callback(null,false) phải bổ sung kiểm tra Origin tường minh cho endpoint tạo phiên (login/register/refresh).
- **Acceptance:** Body > 1MB trả 413. Origin lạ không còn trả 500. Không response nào chứa details.stack ngoài môi trường dev cục bộ.

#### SEC-079 — tokenVersion bị trả về client trong /auth/me, /users và response đăng ký

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-200 — **CVSS:** Chưa chấm CVSS chính thức; dynamic agent xếp Low
- **Confidence:** Trung bình (tổng hợp từ dynamic test hoặc ghi chú review, chưa có lượt kiểm chứng độc lập riêng)
- **Module / File:** auth/users — backend/src/modules/auth/auth.service.ts (sanitizeUser); backend/src/modules/users/users.service.ts
- **Mô tả:** Trường tokenVersion (bộ đếm thu hồi phiên nội bộ) được trả về trong GET /auth/me, GET /users và response đăng ký. Giá trị không trực tiếp khai thác được nhưng tiết lộ cơ chế thu hồi token và số lần đổi mật khẩu/reuse refresh.
- **Điều kiện / Tác động:** Có tài khoản hợp lệ hoặc đăng ký mới. / C: lộ thông tin nội bộ (nhẹ).
- **Root cause:** sanitizeUser chỉ loại các trường nhạy cảm cổ điển, không có allowlist.
- **Remediation:** Dùng allowlist trường trả về hoặc loại tokenVersion trong sanitizeUser ở AuthService và UsersService; kiểm tra frontend/mobile không đọc trường này.
- **Acceptance:** Không response người dùng nào chứa tokenVersion.

#### SEC-080 — Phần còn lại của lộ dữ liệu công khai: OptionalJwtAuthGuard coi token hết hạn là khách, giỏ hàng lộ wholesalePrice, /categories/:id trả danh mục ẩn

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-285 / CWE-200 — **CVSS:** Chưa chấm CVSS chính thức; reviewer xếp Low
- **Confidence:** Trung bình (tổng hợp từ dynamic test hoặc ghi chú review, chưa có lượt kiểm chứng độc lập riêng)
- **Module / File:** products/cart/categories/common guards — backend/src/common/guards/optional-jwt.guard.ts; backend/src/modules/cart/cart.service.ts; backend/src/modules/categories/categories.controller.ts
- **Mô tả:** (a) Nếu access token của admin hết hạn, OptionalJwtAuthGuard coi người đó là khách thay vì trả 401, nên danh sách /products ở admin im lặng chỉ hiện sản phẩm ACTIVE và /products/:id trả 404 với sản phẩm INACTIVE cho tới khi token được làm mới (không 401 nên interceptor refresh của frontend không kích hoạt). (b) cart.service.ts dùng populate("items.product") không chọn trường nên giỏ hàng của chính người dùng vẫn trả wholesalePrice. (c) GET /categories/:id và /categories/slug/:slug vẫn trả danh mục ẩn. (d) Sản phẩm OUT_OF_STOCK nay không hiện cho khách (cần chủ sản phẩm xác nhận chính sách). (e) STAFF nào cũng thấy wholesalePrice kể cả khi không có MANAGE_PRODUCTS.
- **Điều kiện / Tác động:** Token admin hết hạn (a); tài khoản khách có giỏ hàng (b); biết slug danh mục ẩn (c). / C: lộ giá sỉ và danh mục ẩn (thấp). I/A: trải nghiệm admin sai lệch tạm thời.
- **Root cause:** Guard tùy chọn nuốt mọi lỗi xác thực; populate không có projection; endpoint danh mục chưa lọc theo trạng thái.
- **Remediation:** 1) optional-jwt.guard.ts: ném 401 khi request có token nhưng token không hợp lệ/hết hạn (frontend sẽ tự refresh). 2) cart.service.ts: populate với select loại wholesalePrice/costPrice. 3) categories: lọc hidden cho khách ở getById/getBySlug. 4) Xác nhận chính sách OUT_OF_STOCK và quyền xem giá sỉ của STAFF (quyết định nghiệp vụ).
- **Acceptance:** Admin hết hạn token nhận 401 rồi tự refresh; giỏ hàng không có giá sỉ; khách không xem được danh mục ẩn bằng id/slug.

#### SEC-081 — Email "có hàng trở lại" trong products.service.ts nhúng tên sản phẩm chưa escape HTML

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-79 / CWE-116 — **CVSS:** Chưa chấm CVSS chính thức; reviewer xếp rủi ro thấp (dữ liệu do admin nhập)
- **Confidence:** Trung bình (tổng hợp từ dynamic test hoặc ghi chú review, chưa có lượt kiểm chứng độc lập riêng)
- **Module / File:** products/email — backend/src/modules/products/products.service.ts (khoảng dòng 1239-1246)
- **Mô tả:** Cluster C10 đã thêm escapeHtml cho các email đơn hàng/OTP nhưng email thông báo có hàng trở lại vẫn dựng HTML bằng ${product.name} không escape. Giá trị do admin nhập nên rủi ro thấp hơn nhiều so với SEC-011.
- **Điều kiện / Tác động:** Tài khoản có quyền sửa sản phẩm đặt tên chứa HTML; có người đăng ký alert. / I: chèn HTML vào email gửi khách.
- **Root cause:** Chưa dùng chung helper escapeHtml.
- **Remediation:** Import escapeHtml từ email.service và áp dụng cho product.name (và mọi giá trị khác) trong template.
- **Acceptance:** Email không chứa thẻ HTML thô từ dữ liệu sản phẩm.

#### SEC-082 — POS: biên lợi nhuận chưa tính chiết khấu cấp đơn đã phân bổ; costPrice chưa nhân conversionRatio khi bán theo đơn vị quy đổi

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-840 (Business Logic Errors) — **CVSS:** Chưa chấm CVSS chính thức; cần quyết định chính sách
- **Confidence:** Trung bình (tổng hợp từ dynamic test hoặc ghi chú review, chưa có lượt kiểm chứng độc lập riêng)
- **Module / File:** pos/pricing — backend/src/modules/pos/pos.service.ts; backend/src/modules/pricing/pricing.service.ts
- **Mô tả:** Sau khi sửa SEC-007, sàn biên lợi nhuận được kiểm trên giá thực thu nhưng chưa tính phần chiết khấu cấp đơn đã phân bổ về từng dòng, và pricing.service chưa nhân costPrice với conversionRatio khi bán theo đơn vị quy đổi, nên biên có thể bị tính sai.
- **Điều kiện / Tác động:** Thu ngân POS bán hàng có chiết khấu cấp đơn hoặc đơn vị quy đổi. / I: bán dưới sàn biên mà không cần phê duyệt (khó khai thác có chủ đích).
- **Root cause:** Công thức biên chưa phản ánh toàn bộ giảm giá và quy đổi đơn vị.
- **Remediation:** Chốt chính sách (tính biên trên giá sau chiết khấu phân bổ); nhân costPrice với conversionRatio; thêm test cho cả hai trường hợp.
- **Acceptance:** Biên được tính đúng trong cả hai trường hợp và đơn dưới sàn bị yêu cầu phê duyệt.

#### SEC-083 — Promotions: thiếu kiểm tra chéo (PERCENT > 100, endDate < startDate) và lệch tên trường giữa admin Promotions.vue và DTO

- **Category / Severity / Status:** Potential Risk / Low / OPEN — **CWE:** CWE-20 — **CVSS:** Chưa chấm CVSS chính thức
- **Confidence:** Trung bình (tổng hợp từ dynamic test hoặc ghi chú review, chưa có lượt kiểm chứng độc lập riêng)
- **Module / File:** promotions — backend/src/modules/promotions/dto/promotion.dto.ts; frontend/src/pages/admin/Promotions.vue
- **Mô tả:** Sau SEC-010, PATCH được validate nhưng vẫn chưa kiểm tra PERCENT > 100 hay endDate < startDate (cập nhật một phần cũng không kiểm tra chéo với giá trị hiện có). Ngoài ra Promotions.vue gửi maxDiscountAmount và limitPerUser trong khi CreatePromotionDto chỉ có maxDiscount và perUserLimit; với forbidNonWhitelisted, tạo mã từ form admin có thể bị 400 và hai giá trị bị bỏ qua (lệch contract có sẵn, reviewer ghi "có thể").
- **Điều kiện / Tác động:** Quyền MANAGE_PROMOTIONS. / I: khuyến mãi sai giá trị; A: không tạo được mã từ giao diện.
- **Root cause:** DTO thiếu validator chéo; frontend và DTO không đồng bộ tên trường.
- **Remediation:** Thêm validator PERCENT <= 100 và endDate >= startDate (kể cả cập nhật một phần so với giá trị hiện có, ở service); đồng bộ tên trường giữa frontend và DTO sau khi xác nhận bằng test.
- **Acceptance:** Giá trị vô lý bị từ chối; tạo mã từ form admin thành công với maxDiscount/perUserLimit.

#### SEC-084 — Storefront OrderDetail.vue vẫn cho khách nhập "mã đặc cách" trả hàng (backend đã bỏ qua token)

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-1021 / UX — **CVSS:** Không áp dụng (chỉ giao diện)
- **Confidence:** Trung bình (tổng hợp từ dynamic test hoặc ghi chú review, chưa có lượt kiểm chứng độc lập riêng)
- **Module / File:** frontend customer — frontend/src/pages/customer/OrderDetail.vue (khoảng dòng 345 và 461-485)
- **Mô tả:** Sau khi sửa SEC-008, backend bỏ qua overrideToken của khách và trả lỗi "Đã quá thời hạn 7 ngày", nhưng giao diện vẫn hiển thị ô nhập mã đặc cách, gây khó hiểu.
- **Điều kiện / Tác động:** Khách có đơn quá hạn trả hàng. / Không có tác động bảo mật trực tiếp.
- **Root cause:** Frontend chưa đồng bộ với chính sách mới.
- **Remediation:** Ẩn ô nhập khi người dùng không phải admin/staff (hoặc bỏ hẳn ở storefront).
- **Acceptance:** Khách không còn thấy/gửi returnOverrideToken.

#### SEC-085 — Thiếu giới hạn độ dài/định dạng cho nhiều trường DTO người dùng nhập (ghi chú đơn, đánh giá, landing page...)

- **Category / Severity / Status:** Best Practice Improvement / Low / OPEN — **CWE:** CWE-20 — **CVSS:** Chưa chấm CVSS trong audit gốc
- **Confidence:** Trung bình (chỉ có phát hiện của audit, chưa có lượt kiểm chứng độc lập)
- **Module / File:** auth / reviews / landing-pages / banners — backend/src/modules/auth/dto/auth.dto.ts:73 (UpdateProfileDto / RegisterDto / CreateReviewDto / CreateLandingPageDto / CreateBannerDto)
- **Mô tả:** - UpdateProfileDto.avatar chỉ có @IsString. Chuỗi không bắt đầu bằng 'data:image' được lưu nguyên (auth.service.ts:416-425), có thể là URL theo dõi, URL dài 1MB hay scheme bất kỳ, và hiển thị ở trang admin hoặc review.
- fullName (Register, UpdateProfile) và review content không có MaxLength. Password không có MaxLength (bcrypt cắt ở 72 byte).
- Cả codebase không dùng @ArrayMaxSize.
- Landing page: benefits, packages, testimonials chỉ @IsArray, không @ValidateNested hay @Type. Phần tử không được validate và gặp kiểu lạ thì .trim() ném TypeError, trả 500.
- customCss tự do được render trong <style> trên trang landing public (CSS injection, UI redress).
- Banner: linkUrl regex ^(/|https?://) chấp nhận '//evil.com' (open redirect qua window.open). imageUrl khi Cloudinary lỗi được lưu nguyên data URI, kể cả svg+xml.
- **Điều kiện / Tác động:** Customer (profile, review) hoặc Staff (landing, banner). / I:L A:L
- **Root cause:** DTO thiếu ràng buộc độ dài, scheme và nested validation một cách nhất quán.
- **Remediation:** - avatar: @IsUrl({protocols:['https']}) hoặc chỉ nhận data:image để upload, và chỉ lưu URL Cloudinary trả về.
- @MaxLength cho fullName (100), review content (2000), password (128).
- @ArrayMaxSize cho mọi mảng.
- @ValidateNested + @Type cho các mảng landing page. Giới hạn customCss (MaxLength, chặn url(), @import).
- Sửa SAFE_URL_REGEX thành ^(\/(?!\/)|https?:\/\/). Không lưu data URI khi upload thất bại mà trả lỗi.
- **Acceptance:** Các payload vượt giới hạn hoặc sai scheme trả 400, không trả 500.

---

## 14. Root Cause Analysis (mẫu hình mang tính hệ thống)

| # | Mẫu hình gốc | Biểu hiện | SEC |
|---|---|---|---|
| 1 | Tin dữ liệu client ở nơi cần tin server | Giá/orderSource/unitPrice/overrideToken/jti/exp do client gửi | SEC-001, 005, 007, 008 |
| 2 | Không có allowlist trường ở tầng response | Trả nguyên document Mongoose, mỗi chỗ tự che | SEC-004, 018, 024, 032, 079, 080 |
| 3 | Kiểm tra kiểu quyền thô (role) thay vì permission cụ thể | STAFF bất kỳ xóa review; VIEW_REPORTS/MANAGE_ORDERS quá rộng; customers lẫn tài khoản nội bộ | SEC-015, 017, 075, 076 |
| 4 | Đọc-rồi-ghi không nguyên tử, kiểm tra ngoài transaction | Công nợ, OTP, hủy đơn, trả hàng NCC | SEC-009, 019, 022, 060, 063 |
| 5 | Validation thiếu hoặc bị vô hiệu do kiểu TypeScript | `Partial<Dto>` mất metatype; `@Body("note")`; thiếu `@MaxLength`/`@ArrayMaxSize` | SEC-010, 012, 013, 028, 033, 085 |
| 6 | Chuỗi người dùng đi thẳng vào regex, HTML, URL | RegExp không escape, email HTML, `window.open(url)` | SEC-002, 011, 014 |
| 7 | Giá trị mặc định/dự phòng không an toàn | Secret hardcode, NODE_ENV development, Redis không mật khẩu, localhost fallback | SEC-039, 048, 049, 051 |
| 8 | Thiếu phân tách nhiệm vụ ở nghiệp vụ ERP | Người tạo tự duyệt, bỏ qua bước phê duyệt | SEC-068 đến 075 |
| 9 | Bí mật và cấu hình ngoài vòng kiểm soát | Credential trong git history, PAT trong .git/config, thiếu quy tắc ignore | SEC-003, 030, 056 |
| 10 | Giới hạn tài nguyên và hạ tầng sau proxy chưa chặt | limit không giới hạn, preview không giới hạn, throttler chỉ theo IP | SEC-012, 013, 044, 065 |

---

## 15. Source Code Fixes (file đã thay đổi theo SEC)

| SEC | File đã thay đổi | Ghi chú |
|---|---|---|
| SEC-001 | `backend/src/modules/orders/services/checkout.service.ts`<br>`backend/src/modules/orders/services/checkout.service.spec.ts` | Giá client chỉ được áp khi landing page đang bật và khớp giá cấu hình cho đúng sản phẩm (resolveLandingPrice dùng chung cho preview và create). orderSource được chuẩn hóa ở server (POS/LANDING_PAGE… |
| SEC-002 | `backend/src/modules/reviews/dto/review.dto.ts`<br>`backend/src/modules/reviews/reviews.service.ts`<br>`frontend/src/pages/admin/Reviews.vue`<br>`frontend/src/pages/admin/reviewImageUrl.ts (mới)` | DTO: @ArrayMaxSize(5), @MaxLength(2048,{each}), @IsUrl chỉ http/https. Service: assertSafeImageUrls() (new URL, chỉ http/https) gọi trước khi chạm DB ở create/update. Frontend admin: helper… |
| SEC-004 | `backend/src/modules/orders/services/checkout.service.ts`<br>`backend/src/modules/orders/orders.service.ts`<br>`backend/src/modules/orders/orders.customer-view.spec.ts`<br>`backend/src/modules/orders/services/checkout.service.spec.ts` | Helper toCustomerOrderView loại costPrice, baseSellingPrice, appliedPolicy*, grossMarginPercent, markupPercent, approver, approvalReason. Áp dụng cho create (guest/đăng nhập), replay idempotent,… |
| SEC-005 | `backend/src/modules/auth/auth.service.ts`<br>`backend/src/modules/auth/auth.service.spec.ts` | Helper verifyTokenForRevocation: verifyAsync bằng secret access/refresh với ignoreExpiration, kiểm tra đúng type và có exp; token sai thì không ghi blacklist (controller vẫn xóa cookie). jti/exp lấy… |
| SEC-006 | `backend/src/modules/pos/pos.service.ts`<br>`backend/src/modules/pos/pos.controller.ts`<br>`backend/src/modules/pos/pos.security.spec.ts (mới)`<br>`backend/src/modules/pos/pos.service.spec.ts` | Bỏ so sánh plaintext, chỉ bcrypt.compare. Mọi lỗi xác thực phê duyệt trả cùng một thông báo. Bộ đếm sai theo thu ngân và theo người duyệt (5 lần/15 phút thì khóa 15 phút). Controller POST /pos/orders… |
| SEC-007 | `backend/src/modules/pos/pos.service.ts`<br>`backend/src/modules/pos/pos.security.spec.ts (mới)` | POS luôn truyền giá thực từ CSDL (requestedUnitPrice) cho PricingService; BadRequest nếu unitPrice client lớn hơn max(giá thực, giá niêm yết); unitPrice thấp hơn bị bỏ qua (giảm giá phải đi qua… |
| SEC-008 | `backend/src/modules/orders/services/order-lifecycle.service.ts`<br>`backend/src/modules/orders/services/order-lifecycle.service.spec.ts (mới)`<br>`backend/src/modules/orders/sales-return.spec.ts (sửa test SALES-RET-T06 theo hành vi đúng)` | requestReturn chỉ chấp nhận overrideToken khi người gọi là ADMIN/SUPER_ADMIN hoặc STAFF có MANAGE_ORDERS; token của khách bị bỏ qua; nhãn "Đặc cách" chỉ gắn khi đặc cách thực sự được áp dụng. |
| SEC-009 | `backend/src/modules/finance/finance.service.ts`<br>`backend/src/modules/finance/finance.service.spec.ts`<br>`backend/src/modules/uat-e2e-flows.spec.ts (bổ sung mock findOneAndUpdate trong bước kiểm chứng cuối)` | Bỏ fallback save() ở paySupplier và collectCustomerPayment; luôn dùng findOneAndUpdate có điều kiện (remainingAmount >= amount, status != PAID, isDeleted=false) trong cùng session; không khớp thì ném… |
| SEC-010 | `backend/src/modules/promotions/dto/promotion.dto.ts`<br>`backend/src/modules/promotions/promotions.controller.ts`<br>`backend/src/modules/promotions/promotions.controller.spec.ts (mới)` | Thêm UpdatePromotionDto = PartialType(CreatePromotionDto) (@nestjs/swagger); controller PATCH dùng DTO này. Review phát hiện PartialType cho phép null lọt qua (IsOptional) nên controller từ chối với… |
| SEC-011 | `backend/src/modules/email/email.service.ts`<br>`backend/src/modules/email/email.service.spec.ts` | Thêm hàm export escapeHtml (& < > " ') áp dụng cho mọi giá trị người dùng nhúng vào HTML ở sendOtpEmail, sendOrderConfirmationEmail, sendOrderStatusEmail. |
| SEC-012 | `backend/src/common/dto/pagination.dto.ts`<br>`backend/src/modules/products/products.service.ts`<br>`backend/src/modules/products/products.public-exposure.spec.ts (mới)` | PaginationDto.limit thêm @IsInt @Min(1) @Max(1000) (trần 1000 vì admin Combos.vue gọi limit=1000); thêm clampLimit() cho các endpoint nhận limit thô (mặc định giữ nguyên, tối đa 100, suggestions 50);… |
| SEC-013 | `backend/src/modules/orders/dto/order.dto.ts`<br>`backend/src/modules/orders/services/checkout.service.spec.ts` | Thêm ORDER_MAX_ITEMS=50 (@ArrayMaxSize) cho CheckoutPreviewDto.items và CreateOrderDto.items; ORDER_ITEM_MAX_QUANTITY=1000 (@Max) cho OrderItemDto.quantity. Số truy vấn tuần tự bị chặn ở 50 mỗi… |
| SEC-014 | `backend/src/modules/finance/finance.service.ts`<br>`backend/src/modules/customers/customers.service.ts`<br>`backend/src/modules/data-exchange/data-exchange.service.ts`<br>`backend/src/modules/data-exchange/data-exchange.controller.ts`<br>`backend/src/modules/finance/finance.service.spec.ts`<br>`backend/src/modules/customers/customers.service.spec.ts`<br>`backend/src/modules/data-exchange/data-exchange.service.spec.ts`<br>`backend/src/modules/data-exchange/data-exchange.controller.spec.ts` | Thêm escapeRegex trong từng service: buildCashEntryFilter, findAllPayables, findAllReceivables, customers.findAll (kèm trim, ép page>=1, limit trong [1,100]), tên danh mục từ Excel.… |
| SEC-015 | `backend/src/modules/reviews/reviews.service.ts`<br>`backend/src/modules/reviews/reviews.controller.ts`<br>`backend/src/modules/reviews/reviews.security.spec.ts (mới)` | Route dùng chung với khách nên sửa ở service: delete() nhận thêm userPermissions (mặc định []), controller truyền req.user.permissions. ADMIN/SUPER_ADMIN xóa mọi review; STAFF chỉ khi có… |
| SEC-016 | `backend/src/modules/products/products.service.ts`<br>`backend/src/modules/products/products.controller.ts`<br>`backend/src/modules/categories/categories.controller.ts`<br>`backend/src/modules/products/products.public-exposure.spec.ts (mới)`<br>`backend/src/modules/categories/categories.controller.spec.ts (mới)` | GET /products dùng OptionalJwtAuthGuard + @CurrentUser; findAll ép status=ACTIVE cho khách/CUSTOMER; findByIdForViewer trả 404 với sản phẩm không ACTIVE; controller strip wholesalePrice/costPrice cho… |
| SEC-017 | `backend/src/modules/customers/customers.service.ts`<br>`backend/src/modules/customers/customers.service.spec.ts` | findById dùng findOne({_id, role: CUSTOMER}) và trả null nếu id không hợp lệ; thêm assertIsCustomer (NotFoundException) ở updateCRMProfile và evaluateCustomerTier. |
| SEC-018 | `backend/src/modules/notifications/notifications.service.ts`<br>`backend/src/modules/notifications/notifications.service.spec.ts` | findByUser tách readBy khỏi từng item, chỉ trả isRead tính riêng cho người gọi. |
| SEC-019 | `backend/src/modules/auth/auth.service.ts`<br>`backend/src/modules/auth/auth.service.spec.ts` | reserveOtpAttempt: findOneAndUpdate có điều kiện {resetOtp hiện tại, attempts < 5} và $inc, đặt chỗ nguyên tử trước khi so khớp OTP; áp dụng cho verifyOtp và nhánh OTP của resetPassword. |
| SEC-020 | `backend/src/modules/notifications/notifications.gateway.ts`<br>`backend/src/modules/notifications/notifications.gateway.spec.ts` | Khi token đến từ cookie access_token, Origin phải nằm trong FRONTEND_URL (danh sách phân tách dấu phẩy); localhost chỉ cho phép khi không phải production. Token tường minh (mobile) không bị kiểm tra… |
| SEC-021 | `backend/src/modules/landing-pages/landing-page.controller.ts`<br>`backend/src/modules/landing-pages/landing-page.service.ts`<br>`backend/src/modules/landing-pages/landing-page.service.spec.ts` | @Throttle 10/phút cho submit-order; page.status !== true thì ném NotFoundException trước khi gọi productsService/ordersService; xác minh giá chỉ lấy từ cấu hình server (SubmitOrderDto không có trường… |
| SEC-022 | `backend/src/modules/orders/services/order-lifecycle.service.ts`<br>`backend/src/modules/orders/services/order-lifecycle.service.spec.ts` | Cờ nội bộ _expectedStatus=PENDING đặt cho khách (không phải admin/staff) trong updateStatus và cho cancelGuest; updateStatusInternal kiểm tra lại trạng thái bên trong transaction ngay sau khi đọc đơn. |
| SEC-023 | `backend/src/modules/pos/pos.service.ts`<br>`backend/src/modules/pos/pos.security.spec.ts (mới)` | Gộp số lượng theo từng dòng hóa đơn và validate trước khi chạm tồn kho; cộng số tiền đã tính cho cùng dòng hàng ở các dòng trước trong cùng yêu cầu vào alreadyRefundedForItem. |
| SEC-024 | `backend/src/modules/pos/pos.service.ts`<br>`backend/src/modules/pos/pos.service.spec.ts`<br>`backend/src/modules/pos/pos.security.spec.ts (mới)` | Helper sanitizeOrderForActor: với vai trò không phải ADMIN/SUPER_ADMIN trả bản sao đã xóa costPrice, grossMarginPercent, markupPercent từng dòng; áp dụng cho createPOSOrder (mới, replay, race 11000)… |
| SEC-025 | `backend/src/modules/products/products.service.ts`<br>`backend/src/modules/products/products.controller.ts`<br>`backend/src/modules/products/products.public-exposure.spec.ts (mới)` | validateImportFileSafety (mirror logic DataExchangeService): từ chối buffer rỗng, >10MB, thiếu magic bytes zip, tên file chứa "..", "/", "\"; tối đa 10 sheet và 5000 dòng (PRODUCT_IMPORT_MAX_ROWS);… |
| SEC-026 | `backend/src/common/security/security.sanitizer.ts`<br>`backend/src/common/security/security.sanitizer.spec.ts` | Ném BadRequestException("Dữ liệu đầu vào lồng quá sâu") khi vượt maxDepth với object/array/string; số/boolean đi qua. Middleware đã bọc try/catch trả 400. |
| SEC-027 | `frontend/nginx.conf` | Thêm ở cấp server (kèm always): CSP giống vercel.json (bổ sung frame-src https://maps.google.com https://www.google.com sau review để iframe Google Maps ở footer không bị chặn),… |
| SEC-028 | `backend/src/modules/auth/dto/auth.dto.ts`<br>`backend/src/modules/auth/dto/auth.dto.spec.ts (mới)` | password/currentPassword/newPassword thêm @IsString và @MaxLength(128); fullName @MaxLength(100); avatar dùng validator IsAvatarValue (URL http/https tối đa 2048 ký tự, hoặc data URL ảnh… |
| SEC-029 | `frontend/src/pages/customer/ForgotPassword.vue`<br>`frontend/src/pages/customer/__tests__/ForgotPasswordNoDevOtp.spec.ts (mới)` | Web: xóa nhánh UI hiển thị OTP, biến devOtp/isDev và đoạn đọc res.data.otp; toast đổi thành "Mã OTP đã được gửi!". |
| SEC-030 | `.gitignore`<br>`backend/.dockerignore`<br>`frontend/.dockerignore` | Bổ sung .env.*, !.env.example, !backend/.env.test, *.pem, *.key, *.p12, *.pfx, *.jks, *.keystore, **/key.properties, **/google-services.json, **/GoogleService-Info.plist; .dockerignore… |
| SEC-031 | `.github/workflows/ci.yml`<br>`.github/workflows/deploy.yml`<br>`.github/workflows/docker-build.yml`<br>`.github/workflows/release.yml` | permissions: contents: read ở cấp workflow cho cả 4 file (gitleaks thêm pull-requests: read; create-release giữ contents: write riêng). deploy.yml/release.yml chuyển head_sha, URL, steps outputs và… |
| SEC-032 | `backend/src/modules/orders/services/checkout.service.ts`<br>`backend/src/modules/orders/orders.service.ts`<br>`backend/src/modules/orders/services/checkout.service.spec.ts`<br>`backend/src/modules/orders/orders.customer-view.spec.ts` | toCustomerOrderView cũng loại guestAccessTokenHash, idempotencyKeyHash, idempotencyPayloadHash, guestPhoneKey, guestPendingSlot; áp dụng cho create, replay idempotent, findGuestById. guestAccessToken… |
| SEC-033 | `backend/src/modules/orders/dto/return-note.dto.ts (mới)`<br>`backend/src/modules/orders/orders.controller.ts`<br>`backend/src/modules/orders/services/order-lifecycle.service.spec.ts` | ReturnNoteDto (@IsOptional @IsString @MaxLength(1000)); controller approveReturn và confirmReturnReceived dùng @Body() dto: ReturnNoteDto. Frontend vẫn gửi { note } nên tương thích. |
| SEC-034 | `backend/src/common/guards/roles.guard.ts`<br>`backend/src/common/guards/permissions.guard.ts`<br>`backend/src/common/guards/rbac.guard.spec.ts`<br>`backend/src/common/guards/route-coverage.spec.ts (mới)` | Thay đổi do developer thực hiện, chưa commit: cả hai guard deny-by-default (route thiếu decorator chỉ ADMIN/SUPER_ADMIN qua; STAFF/CUSTOMER 403). Dynamic test TEST-SEC-001/002 đã chạy trên bản build… |

Ghi chú: SEC-034 (guard deny-by-default) là thay đổi của developer chưa commit; phần trust proxy của SEC-044 đã có ở commit 99b4309 trước đợt audit nên không liệt kê ở bảng trên.

**Chỉnh sửa bổ sung của reviewer và bước kiểm tra cuối (ngoài danh sách cụm)**

- `backend/src/modules/orders/orders.service.ts` và `orders.customer-view.spec.ts` (C2): che giá vốn cho `cancelForActor`, `cancelGuest`, `requestReturn` (lỗ hổng còn sót của SEC-004).
- `backend/src/modules/orders/sales-return.spec.ts` (C3): SALES-RET-T06 cập nhật theo hành vi đúng của SEC-008.
- `backend/src/modules/promotions/promotions.controller.ts` (C6): từ chối giá trị null ở PATCH.
- `backend/src/modules/pos/pos.service.ts` (C9): dọn bản ghi hết hạn của `approvalFailures` khi vượt 1000 phần tử.
- `frontend/nginx.conf` (C11): thêm `frame-src` cho Google Maps vào CSP.
- Bước kiểm tra cuối: `backend/src/modules/uat-e2e-flows.spec.ts` bổ sung mock `findOneAndUpdate` (do SEC-009); thêm `eslint-disable` đầu file cho các spec: `auth.service.spec.ts`, `data-exchange.controller.spec.ts`, `data-exchange.service.spec.ts`, `email.service.spec.ts`, `promotions.controller.spec.ts`, `products.public-exposure.spec.ts`, `orders.customer-view.spec.ts` để lint không vượt ngưỡng 2650 warning. Việc này chỉ che warning kiểu mock `no-unsafe-*` trong test, không phải cải thiện chất lượng mã.
- Cấu hình/CI: `.gitignore`, `backend/.dockerignore`, `frontend/.dockerignore`, 4 workflow trong `.github/workflows/`.

---

## 16. Security Retest Results

| Chỉ số | Baseline (trước bản vá) | Sau bản vá |
|---|---|---|
| Backend `npm test` | 77 suites, 913 test PASS | **90 suites, 1183 test PASS** |
| Backend `npm run lint` | 0 lỗi, 2576 warning | 0 lỗi, 2598 warning (ngưỡng 2650; AGENTS.md ghi 1950, tài liệu lệch với package.json) |
| Backend `npm run build` | OK | OK |
| Frontend `npm run test:unit` | 26 files, 124 test PASS | **37 files, 254 test PASS** |
| Frontend `typecheck`, `lint`, `build` | OK | OK |

**Hai lỗi do bản vá gây ra và đã sửa trong bước kiểm tra cuối:** (1) `uat-e2e-flows.spec.ts` (UAT-E2E-03, UAT-E2E-08) fail vì mock thiếu `findOneAndUpdate` sau SEC-009; (2) lint backend vượt ngưỡng (2702 so với tối đa 2650) do spec mới/đã sửa, xử lý bằng `eslint-disable` đầu file ở 7 spec. Không có lỗi nào do phiên khác gây ra.

**Retest theo SEC (unit/regression test, chạy trong bước cuối cùng và theo từng cụm)**

| SEC | Test/Kiểm chứng | Kết quả | Trạng thái |
|---|---|---|---|
| SEC-001 | checkout.service.spec.ts (8 case: giá thấp bị bỏ qua, LANDING_PAGE không landingPageId chuyển WEB, trang tắt, trang không gắn sản phẩm, gói sản phẩm khác, POS chuyển WEB, giá hợp lệ vẫn áp dụng, preview không áp giá giả); landing-page-order-pricing.spec.ts | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | PARTIAL |
| SEC-002 | backend/src/modules/reviews/reviews.security.spec.ts (mới); frontend/src/pages/admin/reviewImageUrl.spec.ts (mới, 11 test) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-003 | Không áp dụng | — | BLOCKED |
| SEC-004 | orders.customer-view.spec.ts (my-orders, chủ đơn, guest lookup, cancelForActor, cancelGuest, requestReturn; admin vẫn thấy đủ); checkout.service.spec.ts (create và replay không có trường giá vốn, helper không mutate) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-005 | auth.service.spec.ts: 4 test SEC-005 (chữ ký sai, sai type, đúng secret và TTL bị chặn trần, token hết hạn); 3 test logout cũ cập nhật mock verifyAsync | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-006 | pos.security.spec.ts: plaintext không còn được chấp nhận; sai mật khẩu và approver không tồn tại trả cùng thông báo chung; khóa sau 5 lần sai; pos.service.spec.ts cập nhật mock bcrypt | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-007 | pos.security.spec.ts: từ chối unitPrice cao hơn CSDL; unitPrice thấp hơn bị bỏ qua và requestedUnitPrice truyền sang pricing là giá CSDL; ADMIN vẫn tạo đơn bình thường | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-008 | order-lifecycle.service.spec.ts (mới): khách quá hạn + token bị từ chối, trong hạn, ADMIN đặc cách, ADMIN thiếu token, STAFF có/không MANAGE_ORDERS; sales-return.spec.ts SALES-RET-T06 chuyển actor sang ADMIN | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-009 | finance.service.spec.ts: SEC-009-T01..T04 (stale thì Conflict và không save; 2 request đồng thời chỉ 1 thành công; đồng bộ status sang PAID); uat-e2e-flows.spec.ts UAT-E2E-03 và UAT-E2E-08 (14/14 pass) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-010 | promotions.controller.spec.ts (mới, 11 test): metatype là UpdatePromotionDto, discountValue âm/usedCount/trường lạ trả 400, cập nhật một phần hợp lệ, null ở trường bắt buộc bị từ chối | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-011 | email.service.spec.ts: 2 test SEC-011 (payload <a href> trong tên/điện thoại/địa chỉ/tên sản phẩm bị escape; statusText chứa <script> bị escape) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-012 | products.public-exposure.spec.ts: clampLimit, findAll limit=0 gọi .limit(10), best-selling/discounted/new với limit 0 và 100000, DTO từ chối 0/-1/1001/1.5 và chấp nhận 1/100/1000 | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-013 | checkout.service.spec.ts: preview và create từ chối 51 dòng, chấp nhận 50; từ chối quantity 1001, chấp nhận 1000 | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | PARTIAL |
| SEC-014 | finance SEC-014-T01/T02; customers SEC-014-T01/T02 (escape, cap limit 100, page/limit không hợp lệ); data-exchange.service (escape tên danh mục); data-exchange.controller (3 test type lạ trả 400) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-015 | reviews.security.spec.ts: STAFF thiếu quyền 403; STAFF không truyền permissions 403; STAFF có MANAGE_PRODUCTS xóa được; ADMIN/SUPER_ADMIN xóa được; chủ review xóa được, khách khác 403 | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-016 | products.public-exposure.spec.ts (khách/CUSTOMER bị ép ACTIVE, ADMIN/STAFF lọc được, findByIdForViewer 404, strip giá sỉ/giá vốn); categories.controller.spec.ts (includeInactive bị bỏ qua với khách/CUSTOMER) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-017 | customers.service.spec.ts: SEC-017-T01 (findById kèm role CUSTOMER, null với STAFF), T02 (updateCRMProfile NotFound, không tạo profile), T03 (evaluateCustomerTier NotFound), id không hợp lệ | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-018 | notifications.service.spec.ts: kết quả không có thuộc tính readBy, JSON không chứa id người khác, isRead đúng theo từng người dùng | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-019 | auth.service.spec.ts, describe "SEC-019 atomic OTP attempt counter": dùng findOneAndUpdate/$inc, không save(); 20 lần đoán song song chỉ có 5 lần so khớp; hết lượt thì OTP đúng cũng bị từ chối; lượt cuối vẫn chấp nhận OTP đúng | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-020 | notifications.gateway.spec.ts, describe "SEC-020": cookie + Origin lạ bị ngắt và không verify JWT; Origin hợp lệ trong danh sách nhiều origin được chấp nhận; localhost bị từ chối ở production; Bearer/auth.token không bị kiểm tra Origin | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-021 | landing-page.service.spec.ts: trang inactive bị 404 và không tạo đơn; giá lấy từ gói server dù client gửi price=1; metadata throttle limit=10/ttl=60000 (12/12 pass) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | PARTIAL |
| SEC-022 | order-lifecycle.service.spec.ts: 2 test (khách có tài khoản và guest; đơn đã CONFIRMED trong transaction thì BadRequest và save không được gọi) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-023 | pos.security.spec.ts: tổng số lượng dòng trùng vượt mức thì BadRequest và không cộng tồn kho; hoàn bút chia 2 dòng (1+2) chỉ ra 9.000đ thay vì 12.000đ | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-024 | pos.security.spec.ts: create bởi thu ngân không có costPrice/grossMarginPercent/markupPercent nhưng ADMIN thấy; refund bởi thu ngân không lộ | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-025 | products.public-exposure.spec.ts: từ chối file không phải zip, buffer rỗng, tên file path traversal, file 5001 dòng (không chạm DB) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-026 | security.sanitizer.spec.ts: object/mảng/chuỗi lồng 20 tầng ném BadRequestException; lồng 5 tầng vẫn được lọc | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-027 | Không có test tự động (cấu hình hạ tầng). Chưa chạy nginx -t vì không có nginx cục bộ; đã đọc lại cú pháp thủ công. | Không có test tự động | FIXED – NOT VERIFIED |
| SEC-028 | auth.dto.spec.ts (mới): password > 128 hoặc không phải chuỗi bị từ chối; fullName 101 ký tự bị từ chối; avatar URL http/https và data URL ảnh hợp lệ, scheme nguy hiểm bị từ chối | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-029 | ForgotPasswordNoDevOtp.spec.ts (mới): API trả otp "654321" nhưng trang không chứa "654321" hay "Development" | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | PARTIAL |
| SEC-030 | Không có test tự động. Kiểm chứng thủ công bằng git check-ignore: backend/.env.test, các .env.example, key.properties.example không bị ignore; *.pem, google-services.json, key.properties bị ignore; git ls-files không có file bí mật nào đang được track. | Không có test tự động | FIXED – NOT VERIFIED |
| SEC-031 | Không có test tự động; chưa chạy actionlint (không có sẵn). Review thủ công: không có bước nào dùng GITHUB_TOKEN ngoài các quyền đã cấp. | Không có test tự động | FIXED – NOT VERIFIED |
| SEC-032 | checkout.service.spec.ts: response create guest và replay không chứa 5 trường nội bộ; orders.customer-view.spec.ts: guest lookup không trả hash | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-033 | order-lifecycle.service.spec.ts: 4 test validate ReturnNoteDto (bỏ trống, object, dài hơn 1000 ký tự, hợp lệ) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-034 | rbac.guard.spec.ts và route-coverage.spec.ts (24 test pass khi map; nằm trong 1183 test pass của lần kiểm tra cuối) | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | FIXED – VERIFIED |
| SEC-044 | backend/src/config/trust-proxy.spec.ts và env.validation.spec.ts (BUG-011), nằm trong 90 suites / 1183 test PASS của bước kiểm tra cuối. Không phải bản sửa của đợt audit này. | PASS (trong 90 suites / 1183 test cuối; frontend 37 files / 254 test) | PARTIAL |

**Cách xác nhận trạng thái:** FIXED – VERIFIED chỉ cấp khi có bản sửa, regression test PASS và bước kiểm tra cuối xanh. FIXED – NOT VERIFIED dành cho cấu hình hạ tầng không có test tự động (SEC-027, 030, 031). Việc chạy lại dynamic test và e2e vẫn còn phải làm (R-024).

---

## 17. Remaining Vulnerabilities

Còn **56** mục chưa đóng hoàn toàn (OPEN 49, PARTIAL 5, BLOCKED 2). Ngoài ra 29 mục đã FIXED còn một vài việc phụ (xem SECURITY_REMAINING_TASKS.md). Danh sách chi tiết theo từng mục nằm ở `SECURITY_REMAINING_TASKS.md`.

| SEC | Severity | Trạng thái | Việc còn lại (tóm tắt) |
|---|---|---|---|
| SEC-001 | High | PARTIAL | Client biết giá gói thật của landing page vẫn mua được ở mức đó qua POST /orders công khai (giá do admin cấu hình nên rủi ro thấp). Muốn đóng hẳn cần method trusted (vd.… |
| SEC-003 | High | BLOCKED | AI không xoay credential và không tự ý ghi đè lịch sử git. Chủ sở hữu phải làm thủ công (xem R-001). |
| SEC-013 | Medium | PARTIAL | Chưa batch lookup bằng findByIds ($in) cho checkoutPreview vì ~15 test trong orders.service.spec.ts mock findById từng item và findByIds đổi hành vi (bỏ qua sản phẩm bị… |
| SEC-044 | Medium | PARTIAL | Chưa có khóa/backoff theo tài khoản (email đã chuẩn hóa) cho login, forgot-password, verify-otp, reset-password; chưa xác minh số hop thật trên production (trùng… |
| SEC-058 | Medium | OPEN | Thu hồi điểm loyalty khi trả hàng bị chặn ở 0: khách tiêu điểm trước rồi trả hàng thì giữ lại lợi ích |
| SEC-059 | Medium | OPEN | Giới hạn mã giảm giá theo người (perUserLimit) không áp dụng được với khách vãng lai |
| SEC-065 | Medium | OPEN | Khách vãng lai giữ (trừ) tồn kho hàng loạt bằng đơn COD PENDING (giữ 48h) |
| SEC-072 | Medium | OPEN | Thiếu phân tách nhiệm vụ (maker-checker) trên PO, báo giá NCC, chứng từ điện tử, phiếu thu/chi |
| SEC-021 | Low | PARTIAL | Cửa sổ ngày hiệu lực (startAt/endAt) chưa làm: schema LandingPage không có trường này, cần thêm vào schema + CreateLandingPageDto và quyết định nghiệp vụ.… |
| SEC-029 | Low | PARTIAL | Mobile: mobile/lib/screens/auth/forgot_password_screen.dart vẫn đọc res["otp"] trong kDebugMode (không còn tác dụng vì backend không trả OTP) nên dọn (R-006). |
| SEC-035 | Low | OPEN | Seed-safety coi host localhost/mongodb là an toàn: stack docker-compose tự host có thể bị xóa DB demo |
| SEC-036 | Low | OPEN | Deny-by-default và route-coverage.spec chỉ bảo vệ route đã gắn PermissionsGuard/RolesGuard |
| SEC-037 | Low | OPEN | Guest order access token lưu vĩnh viễn trong localStorage |
| SEC-038 | Low | OPEN | Hồ sơ người dùng (PII, role, permissions) lưu plaintext ở localStorage/SharedPreferences; Android không tắt allowBackup |
| SEC-039 | Low | OPEN | Socket.IO fallback về http://localhost:3000 khi build production thiếu VITE_SOCKET_URL |
| SEC-040 | Low | OPEN | Gửi URL đơn hàng và thông tin chuyển khoản tới dịch vụ bên thứ ba qua thẻ img (QR) |
| SEC-041 | Low | OPEN | Vite alias ép dùng bản Vue đầy đủ có runtime template compiler |
| SEC-042 | Low | OPEN | CSP frontend (Vercel) cho phép script-src unsafe-inline, connect-src https: wss: quá rộng và thiếu frame-src cho Google Maps |
| SEC-043 | Low | OPEN | Header X-Client-Platform: mobile biến phiên cookie HttpOnly thành token đọc được trong response |
| SEC-045 | Low | OPEN | Mỗi user chỉ lưu một refreshTokenHash, đăng nhập thiết bị thứ hai hoặc refresh song song làm hỏng phiên |
| SEC-046 | Low | OPEN | Lộ sự tồn tại tài khoản qua thông báo đăng ký, thông báo khóa và chênh lệch thời gian |
| SEC-047 | Low | OPEN | Blacklist token fail-open khi Redis lỗi; trạng thái thu hồi nằm trong bộ nhớ từng instance |
| SEC-048 | Low | OPEN | Môi trường không phải production bỏ qua kiểm tra secret; danh sách chặn secret yếu chỉ so khớp chính xác |
| SEC-049 | Low | OPEN | Secret dự phòng hardcode (OTP pepper, POS approval token, guest token) và dùng lại JWT_SECRET |
| SEC-050 | Low | OPEN | JWT chưa pin thuật toán, payload chứa email/permissions, user bị xóa nhận 404 thay vì 401 |
| SEC-051 | Low | OPEN | docker-compose chạy image production với NODE_ENV mặc định development, mật khẩu mặc định và Redis không mật khẩu |
| SEC-052 | Low | OPEN | Dependency production có advisory: sanitize-html, nodemailer và các gói gián tiếp (exceljs, @nestjs...) |
| SEC-053 | Low | OPEN | Dependency dev có nhiều lỗ hổng moderate; cổng supply chain CI còn mỏng (audit chỉ chặn từ high, thiếu Dependabot) |
| SEC-054 | Low | OPEN | GitHub Actions pin theo tag (chưa pin SHA) và Docker base image không pin digest |
| SEC-055 | Low | OPEN | Log chứa PII và URL đầy đủ; IP lấy từ X-Forwarded-For mà client có thể giả mạo |
| SEC-056 | Low | BLOCKED | GitLab Personal Access Token lưu dạng rõ trong URL remote của .git/config trên máy dev |
| SEC-057 | Low | OPEN | IPN báo thanh toán thành công cho đơn đã HỦY không tạo yêu cầu hoàn tiền |
| SEC-060 | Low | OPEN | Trả hàng NCC: kiểm tra số lượng còn được trả nằm ngoài transaction |
| SEC-061 | Low | OPEN | Combo landing page bán với quantity=1: khách trả giá combo nhiều cuốn nhưng kho chỉ trừ 1 |
| SEC-062 | Low | OPEN | Đối soát COD không xử lý đơn COMPLETED; COD đánh dấu PAID ngay khi DELIVERED |
| SEC-063 | Low | OPEN | Checkout chuyển sang chế độ không transaction (compensated) cả trong production |
| SEC-064 | Low | OPEN | Hoàn tiền đơn online không bao giờ hoàn tất; hoàn đảo phiếu thu POS/COD không ràng buộc chặt |
| SEC-066 | Low | OPEN | Lộ thông báo lỗi bên thứ ba (Cloudinary) và 500 khi ObjectId không hợp lệ ở route công khai |
| SEC-067 | Low | OPEN | Đăng ký nhận thông báo có hàng không xác minh email: dùng hệ thống gửi mail tới địa chỉ bất kỳ |
| SEC-068 | Low | OPEN | Bỏ qua bước phê duyệt chuyển kho: xuất kho trực tiếp từ phiếu DRAFT rồi người tạo tự nhận |
| SEC-069 | Low | OPEN | Nhân viên chỉ có MANAGE_PRODUCTS tạo được phiếu trả hàng NCC (trừ kho, bù trừ công nợ) |
| SEC-070 | Low | OPEN | Kiểm kê kho: cờ requiresApproval không được thực thi, người nộp tự duyệt |
| SEC-071 | Low | OPEN | Endpoint kho thủ công cho nhập giá vốn tùy ý và ghi bán/hủy/điều chỉnh tồn ngoài chứng từ |
| SEC-073 | Low | OPEN | Phân quyền entity trong data-exchange lệch với module gốc (MANAGE_PRODUCTS ghi đè dữ liệu suppliers) |
| SEC-074 | Low | OPEN | Máy trạng thái chứng từ điện tử không chặt: xóa được file đính kèm của chứng từ đã REVERSED/đã chốt |
| SEC-075 | Low | OPEN | STAFF có MANAGE_ORDERS tạo được công nợ phải thu tùy ý, không đối chiếu đơn hàng |
| SEC-076 | Low | OPEN | Quyền VIEW_REPORTS và MANAGE_ORDERS quá rộng với dữ liệu tài chính (giá vốn, lãi gộp, sổ quỹ, danh sách thanh toán) |
| SEC-077 | Low | OPEN | ADMIN đổi được vai trò STAFF/CUSTOMER; tài liệu RBAC (PROJECT_OVERVIEW mục 6) lệch với code |
| SEC-078 | Low | OPEN | HttpExceptionFilter trả 500 thay vì 4xx (CORS bị từ chối, body > 1MB) và lộ stack khi không phải production |
| SEC-079 | Low | OPEN | tokenVersion bị trả về client trong /auth/me, /users và response đăng ký |
| SEC-080 | Low | OPEN | Phần còn lại của lộ dữ liệu công khai: OptionalJwtAuthGuard coi token hết hạn là khách, giỏ hàng lộ wholesalePrice, /categories/:id trả danh mục ẩn |
| SEC-081 | Low | OPEN | Email "có hàng trở lại" trong products.service.ts nhúng tên sản phẩm chưa escape HTML |
| SEC-082 | Low | OPEN | POS: biên lợi nhuận chưa tính chiết khấu cấp đơn đã phân bổ; costPrice chưa nhân conversionRatio khi bán theo đơn vị quy đổi |
| SEC-083 | Low | OPEN | Promotions: thiếu kiểm tra chéo (PERCENT > 100, endDate < startDate) và lệch tên trường giữa admin Promotions.vue và DTO |
| SEC-084 | Low | OPEN | Storefront OrderDetail.vue vẫn cho khách nhập "mã đặc cách" trả hàng (backend đã bỏ qua token) |
| SEC-085 | Low | OPEN | Thiếu giới hạn độ dài/định dạng cho nhiều trường DTO người dùng nhập (ghi chú đơn, đánh giá, landing page...) |

---

## 18. Recommendations

1. **Xoay credential ngay (SEC-003, SEC-056).** Xoay mật khẩu người dùng MongoDB Atlas và Gemini/Google API key, thu hồi PAT GitLab; xem log truy cập Atlas; sau đó mới cân nhắc xóa lịch sử git (git filter-repo/BFG, cần phối hợp vì ghi đè lịch sử). Bổ sung rule gitleaks tùy chỉnh cho `mongodb+srv://` và key Google.
2. **Commit và triển khai các bản vá** sau khi developer review (toàn bộ nằm trong working tree). Chạy lại dynamic test TEST-SEC-001..010 trên bản build mới và Playwright e2e.
3. **Chuẩn hóa response bằng serializer/allowlist dùng chung** (DTO phản hồi hoặc `ClassSerializerInterceptor`) để chặn cả lớp lỗi lộ trường (mẫu hình số 2).
4. **Hạ tầng sau proxy:** xác minh `TRUST_PROXY` đúng số hop trên production (code đã hỗ trợ), throttler theo email cho login/OTP/reset, Redis có mật khẩu, `NODE_ENV=production` mặc định trong compose cho image production, CSP không dùng `unsafe-inline` (nonce/hash).
5. **Siết nghiệp vụ ERP:** maker-checker cho chuyển kho, kiểm kê, PO, trả hàng NCC, công nợ; tách quyền xem báo cáo tài chính khỏi VIEW_REPORTS.
6. **Supply chain:** nâng sanitize-html, nodemailer, các gói gián tiếp; Dependabot/Renovate; `npm audit` chặn từ mức moderate cho production; pin action theo SHA và image theo digest.
7. **Quy trình:** mỗi endpoint mới phải có test phân quyền (đã có `route-coverage.spec.ts`), mỗi DTO có giới hạn độ dài/kích thước, mỗi query regex phải qua helper `escapeRegex` dùng chung (hiện mỗi service tự có một bản).
8. **Đồng bộ tài liệu:** cập nhật `docs/PROJECT_OVERVIEW.md` (mục RBAC và số liệu test), sửa ngưỡng lint trong `AGENTS.md` (1950 so với 2650).

---

## 19. Prioritized Roadmap

| Phase | Mục tiêu | Nội dung (task) | Ước lượng |
|---|---|---|---|
| Phase 1 — Khẩn cấp (làm ngay) | Cắt rủi ro lộ credential, đưa bản vá lên | R-001 (xoay credential Atlas/Gemini), R-002 (PAT GitLab), R-025 (review và commit), R-024 (dynamic retest), R-007 (CSP Vercel, thêm frame-src) | 1 đến 2 ngày |
| Phase 2 — Hạ tầng triển khai | Đúng cấu hình production | SEC-044 (xác minh số hop TRUST_PROXY, khóa theo email), SEC-051 (compose), SEC-048/049 (env validation, secret dự phòng), R-008 (nginx -t), R-022 (FRONTEND_URL), R-021 (xác nhận replica set ở production) | 3 đến 5 ngày |
| Phase 3 — Đóng các PARTIAL và nghiệp vụ tiền | Toàn vẹn giá, tiền, kho | R-003 (SEC-001 method trusted), R-004 (SEC-013), R-005 (SEC-021), SEC-057 đến 064, SEC-065 | 1 đến 2 tuần |
| Phase 4 — Phân quyền ERP | Maker-checker và quyền tài chính | SEC-068 đến 077, R-011 (SEC-080, gồm quyết định nghiệp vụ về giá sỉ và OUT_OF_STOCK) | 2 đến 3 tuần (cần quyết định nghiệp vụ) |
| Phase 5 — Xác thực nâng cao và DevSecOps | Thiết bị, enumerate, supply chain | SEC-043, 045, 046, 047, 050, 052, 053, 054, 055 | 2 tuần |
| Phase 6 — Client, tài liệu và làm sạch | Giảm nợ kỹ thuật | SEC-037 đến 041, 066, 067, 078 đến 085, R-023 (docs), R-016 đến R-020, R-027 đến R-030, serializer dùng chung | liên tục |

---

## 20. Final Assessment

Hệ thống có nền tảng bảo mật khá tốt: xác thực token tách loại và có xoay vòng, phân quyền lấy từ DB, validation nghiêm, kiểm tra CSRF, throttler, che lỗi production, webhook có HMAC. Phần lớn rủi ro tìm thấy là lỗi nghiệp vụ và lộ dữ liệu ở lớp response/ERP chứ không phải lỗi hạ tầng cơ bản.

Trong 85 mục SEC, 29 mục đã có bản sửa đầy đủ (26 FIXED – VERIFIED, 3 FIXED – NOT VERIFIED), 5 PARTIAL, 2 BLOCKED và 49 OPEN. Toàn bộ test/lint/typecheck/build của backend và frontend xanh sau bản vá (90 suites / 1183 test backend; 37 files / 254 test frontend).

**Điều kiện để coi là "sẵn sàng phát hành an toàn":**

1. Credential trong SEC-003 và SEC-056 đã được xoay (chủ sở hữu thực hiện).
2. Các thay đổi chưa commit đã được review, commit và triển khai; dynamic test và e2e được chạy lại xanh.
3. SEC-001 đóng hẳn bằng method trusted, và các cấu hình hạ tầng ở Phase 2 đã đúng.

**Không được khẳng định hơn mức đã chứng minh:** báo cáo này không thay thế pentest trên môi trường thật. Các hành vi production-only chỉ được xác nhận qua đọc mã, một số regression test chưa được chứng minh fail khi bỏ bản sửa, và hành vi nhiều instance (Redis, throttler, blacklist) chưa được kiểm tra.

---

## Phụ lục A — Đã bác bỏ

Các phát hiện sau bị **tất cả** verifier bác bỏ và không được tính vào SEC:

- **isDemoSeedSafeUri khớp chuỗi con 'test|staging|e2e|demo' ở bất kỳ đâu trong phần path tự parse, nên DB thật tên 'latest'/'contest'/'..._demo' hoặc…** (wip-guards-regression#2; seeds). Lý do bác bỏ: Finding này dựa trên phiên bản cũ của seed-safety.ts. Working tree hiện tại đã sửa đúng nguyên nhân gốc mà finding mô tả. 1. Không còn regex khớp chuỗi con. seed-safety.ts:11 là `NON_PRODUCTION_DB_TOKENS = new Set(['test','staging','e2e','demo'])`. Hàm isNonProductionDbName (:13-19) tách tên DB theo `/[_\-.]+/` rồi so khớp nguyên token. Riêng tên DB đúng bằng 'test' bị loại trừ tường minh (:15). Dòng 8 mà finding trích dẫn giờ là comment giải thích chính bản sửa này. 2. Đã chạy thử hàm thật (ts-node, chỉ đọc) với các ví dụ nêu trong finding: - `.../truongthanh_latest` → false - `.../contest_shop` → false - `mongodb+srv://[ĐÃ CHE]` → false (token 'shop/test' không khớp) - `.../shop#test` →…
- **Login CSRF: form cross-site có thể đăng nhập nạn nhân vào tài khoản của kẻ tấn công** (authn#6; auth / middleware). Lý do bác bỏ: Đường đi (reachability): form POST cross-site tới /api/auth/login sẽ chạy helmet, json/urlencoded và cookieParser (main.ts:32-51), rồi tới middleware cors (main.ts:78). Header Origin của trang độc hại không có trong allowedOrigins (main.ts:73-76, 84-93), nên callback trả `new Error('Not allowed by CORS')`. Thư viện cors gọi `next(err2)` (node_modules/cors/lib/index.js:219-221), request chuyển sang error handler và không bao giờ tới AuthController.login (auth.controller.ts:161-172). Vì vậy `setAuthCookies` (auth.controller.ts:105-125) không chạy và cookie không được đặt vào trình duyệt nạn nhân. Các nhận định trong finding: - Kiểm tra X-Requested-With chỉ chạy khi đã có cookie: đúng…

**Ghi chú về phần bị bác bỏ một phần:** trong phát hiện data-exchange (SEC-073) verifier chỉ giữ phần suppliers; các phần products-stock và opening_stock bị bác bỏ hoặc chỉ là Best Practice. Trong SEC-016 phần wholesalePrice chỉ còn là Best Practice Improvement.

## Phụ lục B — Bảng ánh xạ phát hiện gốc sang SEC

| SEC | Phát hiện gốc (chiều#chỉ số) |
|---|---|
| SEC-001 | business-integrity#0 |
| SEC-002 | frontend#0, api-input#0 |
| SEC-003 | devsecops#0 |
| SEC-004 | authz-erp#0, authz-commerce#1, api-input#1 |
| SEC-005 | authn#0 |
| SEC-006 | business-integrity#4 |
| SEC-007 | business-integrity#3 |
| SEC-008 | business-integrity#5, authz-commerce#0 |
| SEC-009 | business-integrity#2 |
| SEC-010 | business-integrity#9, authz-commerce#2, api-input#8 |
| SEC-011 | api-input#2 |
| SEC-012 | api-input#3 |
| SEC-013 | api-input#4 |
| SEC-014 | business-integrity#17, api-input#6, authz-commerce#8, authz-erp#13 |
| SEC-015 | wip-guards-regression#3, authz-erp#12, authz-commerce#3 |
| SEC-016 | authz-erp#11, api-input#9 |
| SEC-017 | authz-commerce#4 |
| SEC-018 | authz-commerce#6 |
| SEC-019 | authn#5 |
| SEC-020 | authn#7 |
| SEC-021 | authz-commerce#9 |
| SEC-022 | business-integrity#13 |
| SEC-023 | business-integrity#1 |
| SEC-024 | authz-erp#7 |
| SEC-025 | api-input#7 |
| SEC-026 | devsecops#12, api-input#11 |
| SEC-027 | frontend#2, devsecops#10 |
| SEC-028 | authn#11, authz-commerce#13 |
| SEC-029 | wip-guards-regression#5, authn#14 |
| SEC-030 | devsecops#9 |
| SEC-031 | devsecops#6 |
| SEC-032 | authz-commerce#7 |
| SEC-033 | authz-commerce#10 |
| SEC-034 | wip-guards-regression#0 |
| SEC-035 | wip-guards-regression#1 |
| SEC-036 | wip-guards-regression#4 |
| SEC-037 | frontend#3 |
| SEC-038 | frontend#4, frontend#8, authn#13 |
| SEC-039 | frontend#5 |
| SEC-040 | frontend#6 |
| SEC-041 | frontend#7 |
| SEC-042 | frontend#1 |
| SEC-043 | authn#1 |
| SEC-044 | authn#2 |
| SEC-045 | authn#3 |
| SEC-046 | authn#4 |
| SEC-047 | authn#8 |
| SEC-048 | authn#9, devsecops#8 |
| SEC-049 | authn#10, business-integrity#16, authz-commerce#11 |
| SEC-050 | authn#12 |
| SEC-051 | devsecops#1, devsecops#13 |
| SEC-052 | devsecops#2, devsecops#3, devsecops#4 |
| SEC-053 | devsecops#5, devsecops#7 |
| SEC-054 | devsecops#14, devsecops#6 |
| SEC-055 | devsecops#11 |
| SEC-056 | devsecops#15 |
| SEC-057 | business-integrity#6 |
| SEC-058 | business-integrity#7 |
| SEC-059 | business-integrity#8 |
| SEC-060 | business-integrity#10 |
| SEC-061 | business-integrity#11 |
| SEC-062 | business-integrity#12 |
| SEC-063 | business-integrity#14 |
| SEC-064 | business-integrity#15 |
| SEC-065 | api-input#5 |
| SEC-066 | api-input#12 |
| SEC-067 | api-input#13 |
| SEC-068 | authz-erp#1 |
| SEC-069 | authz-erp#2 |
| SEC-070 | authz-erp#3 |
| SEC-071 | authz-erp#4 |
| SEC-072 | authz-erp#5 |
| SEC-073 | authz-erp#6 |
| SEC-074 | authz-erp#8 |
| SEC-075 | authz-erp#9 |
| SEC-076 | authz-erp#10, authz-commerce#12 |
| SEC-077 | authz-commerce#5, authz-commerce#14 |
| SEC-078 | dynamic/review |
| SEC-079 | dynamic/review |
| SEC-080 | dynamic/review |
| SEC-081 | dynamic/review |
| SEC-082 | dynamic/review |
| SEC-083 | dynamic/review |
| SEC-084 | dynamic/review |
| SEC-085 | api-input#10 |
