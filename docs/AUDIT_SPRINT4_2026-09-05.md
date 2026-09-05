# Audit sau Sprint 4 — 2026-09-05

**Kết luận: đã sửa các lỗi xác nhận được trong code và bổ sung kiểm thử; chưa đủ bằng chứng xác nhận production release.** Trạng thái “Sprint 4 hoàn thành 100% / RELEASE READY” trước audit vượt quá bằng chứng trong repository.

Audit thực hiện trên working tree hiện tại, bao gồm các thay đổi Sprint 4 chưa commit. Không reset thay đổi của chủ dự án, không deploy, không tạo signing key và không thay đổi database vận hành. MongoDB kiểm thử được tạo riêng trên `127.0.0.1:27028`; dữ liệu load test nằm trong `truongthanh_audit_load`.

## Phạm vi và mức bảo đảm

- Đối chiếu tracker và business rules với order/loyalty/reporting, các shared component Vue và trang sử dụng chúng, hợp đồng API mobile, signing scripts, Docker và CI/CD.
- Chạy toàn bộ backend unit, các suite phụ được CI gọi, backend E2E với MongoDB replica set thật, frontend unit/build/Playwright, Flutter test/analyze và npm audit.
- Bổ sung kiểm thử cho những đường lỗi trước đây không được bao phủ. Không coi mock là bằng chứng cho MongoDB aggregation, kiểm thử tải production hay push trên thiết bị thật.
- Đây là audit code và kiểm thử cục bộ, không phải chứng nhận không còn lỗi trên mọi endpoint, thiết bị, trình duyệt hoặc môi trường production. Không thực hiện pentest hệ thống đang vận hành hay quét toàn bộ lịch sử Git bằng Gitleaks cục bộ.

## Lỗi và thay đổi

| ID | Mức | Phát hiện | Xử lý / bằng chứng |
|---|---|---|---|
| A01 | P0 | `updateStatus()` fallback standalone đọc trạng thái rồi hoàn kho/điểm trước khi lưu, không có transaction; hai yêu cầu có thể hoàn lặp. | Bỏ fallback không an toàn, trả 503 yêu cầu replica set. Test chặn fallback trước side effect; MongoDB thật kiểm tra hai cancellation chỉ hoàn điểm một lần. |
| A02 | P1 | Thông báo loyalty/trạng thái và đồng bộ Sheet được gọi trước commit; rollback vẫn có thể phát thông báo. | Chỉ thực hiện sau commit; test lỗi ghi đơn xác nhận rollback số dư, giữ trạng thái cũ và không gửi notification. |
| A03 | P1 | Revenue query lọc theo `revenueRecognizedAt` nhưng group theo `createdAt`, đẩy doanh thu sang ngày khác. | Group theo ngày ghi nhận, fallback ngày tạo cho legacy order. Test aggregation MongoDB thật với hai ngày khác nhau. |
| A04 | P1 | Báo cáo discount và một số màn hình/hóa đơn thiếu phần giảm giá loyalty. | Tổng discount trong report gồm voucher + loyalty; thêm dòng loyalty trong PDF và chi tiết đơn customer web/mobile. MongoDB test kiểm tra tổng discount và legacy field thiếu. |
| A05 | P1 | Khoảng ngày báo cáo phụ thuộc timezone máy chủ; ngày không hợp lệ và khoảng đảo chiều chưa bị từ chối. | Chuẩn hóa đầu/cuối ngày Việt Nam UTC+7; kiểm tra định dạng, ngày lịch và thứ tự. Thêm 5 unit cases. |
| A06 | P1 | Load test có thể PASS khi không có sản phẩm, mọi checkout bị lỗi, không đọc được tồn cuối hoặc toàn bộ catalog bị 429; checkout DTO sai trường. | Sửa DTO, idempotency key, timeout, đọc đủ response body, điều kiện PASS và nhận diện lỗi hết hàng. 5 test của script + chạy API thật với fixture riêng. |
| A07 | P1 | FCM được đánh DONE nhưng chỉ có scaffold: thiếu Firebase packages/listeners/initialization, backend token endpoint và sender. | **Đã sửa phần mã nguồn:** Firebase Messaging listeners/initialization, token lifecycle API và FCM HTTP v1 sender đã có test. Còn credential, signed build và push thật trên thiết bị trước khi đóng MOBILE-01. |
| A08 | P1 | Mobile đọc `data` dạng List thay vì `data.items`, `count` thay vì `unreadCount`, `data` thay vì `meta`; fallback tới named route `/orders` chưa đăng ký. | Sửa contract parsing và mở `OrderHistoryScreen` trực tiếp. Thêm test HTTP fixture kiểm tra list, unread count và orderId. |
| A09 | P1 | Compose bật auth + replica set nhưng không cấp keyfile xác thực nội bộ; healthcheck chưa yêu cầu writable primary. | Thêm entrypoint tạo key ngẫu nhiên, persistent config volume, quyền 400 và healthcheck primary. `docker compose config --quiet` PASS; **runtime Docker chưa được chạy** vì máy không có daemon hoạt động. |
| A10 | P1 | CD chỉ kiểm tra kết quả workflow thành công; chưa ràng buộc nguồn CI là push của chính repository. | Hai deploy job yêu cầu event `push`, branch `main`, đúng head repository. Chưa chạy workflow production trong audit. |
| A11 | P1 | E2E có thể nạp `.env` của developer, kéo theo database/SMTP/Sheet ngoài fixture. | `ConfigModule` không đọc env files khi `NODE_ENV=test`; test cung cấp URI/JWT riêng. Chạy lại các suite database sau thay đổi. |
| A12 | P2 | Clear search không hủy debounce; từ khóa cũ có thể phát lại sau clear/unmount. | Hủy timer khi clear/unmount; 2 unit regressions. |
| A13 | P2 | Footer FormModal gọi confirm trực tiếp, bỏ qua native validity của form nằm trong slot. | Kiểm tra `reportValidity()` trước emit; regression kiểm tra cả form invalid/valid. |
| A14 | P2 | ImageUploader nhiều FileReader có thể ghi đè model, thiếu MIME validation và phát upload vượt giới hạn ảnh. | Đọc theo batch, cập nhật một lần, kiểm tra loại/dung lượng/số lượng, xử lý lỗi đọc và URL scheme. 3 unit regressions. Component hiện chưa được tích hợp vào trang admin sử dụng upload thực tế. |
| A15 | P2 | Checkout có thể clamp điểm xuống dưới tối thiểu hoặc gửi điểm lẻ, preview khác yêu cầu hợp lệ. | Chỉ tính giảm giá cho số nguyên hợp lệ trong hạn mức; chặn submit nếu input có lỗi. |
| A16 | P2 | Generator keystore có nhánh xóa key cũ trước khi sinh key mới, dễ mất khóa signing nếu bước sinh lỗi. | Cả PowerShell/Bash từ chối ghi đè key có sẵn. Không chạy sinh khóa trong audit. |
| A17 | P1 | `test/all-fixes.spec.ts` trong CI còn kỳ vọng cộng điểm lúc create và trừ điểm chưa từng được cộng khi cancel; unit ở `src` xanh vẫn không bảo đảm CI xanh. | Cập nhật kỳ vọng theo business rule DELIVERED. Bộ phụ CI 20/20 PASS. |
| A18 | P1 | Điểm thưởng được tính trên subtotal trước giảm giá; đơn online/chuyển khoản chưa thanh toán vẫn có thể chuyển sang giao thành công và nhận điểm. | Tính điểm trên `subtotal - discount - loyaltyDiscount`; chặn DELIVERED/COMPLETED cho phương thức không phải COD khi chưa `PAID`. Regression MongoDB thật kiểm tra COD sau giảm giá, không cộng lần hai và từ chối BANK_TRANSFER/VNPAY chưa trả tiền. |

MongoDB yêu cầu xác thực nội bộ khi dùng replica set có access control; cấu hình keyfile tham chiếu [MongoDB 7.0: Deploy a replica set with keyfile authentication](https://www.mongodb.com/docs/v7.0/tutorial/deploy-replica-set-with-keyfile-access-control/). Bản Compose này là single-node replica set, không phải cấu hình high availability.

## Kết quả kiểm thử

| Kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| Backend unit | 35 suites, 397 tests PASS | Phần lớn dùng mocks; không thay thế integration. |
| Backend auxiliary CI | 3 suites, 20 tests PASS | Chạy đúng ba file được workflow gọi. |
| Backend E2E | 3 suites, 30 tests PASS | MongoDB 8.2 local replica set; gồm regression transaction, reporting và loyalty/payment mới. Production Compose dùng MongoDB 7.0 cần kiểm thử runtime riêng. |
| Backend build | PASS | Nest production compilation. |
| Backend ESLint | 0 errors, 1.811 warnings, budget 1.816 | Vẫn còn nợ typing đáng kể; không tăng warning budget. |
| Frontend unit | 5 suites, 13 tests PASS | Gồm regression cho shared components, form validation và multi-modal scroll lock. |
| Frontend build/typecheck | PASS | Vue TypeScript và Vite production bundle. |
| Playwright Chromium | 5/5 PASS | Các suite dùng API mocks; chưa chứng minh browser → API thật → MongoDB toàn trình. |
| Flutter | 22/22 tests PASS; analyze không issue | Gồm widget test thao tác thông báo → chi tiết/lịch sử đơn; không phải signed AAB/IPA hay thiết bị thật. |
| npm audit | Backend 0, frontend 0 vulnerabilities | Tra registry theo lockfiles tại thời điểm audit; không chứng minh code ứng dụng an toàn tuyệt đối. |
| Load script regression | 5/5 PASS | Kiểm tra script không cho PASS giả. |
| Catalog local | 92/92 HTTP 200; 0 HTTP 429/4xx/5xx; p95 khoảng 9ms, 18.2 req/s | 2 workers, 5 giây, delay 100ms; fixture rất nhỏ, không phải production capacity. |
| Checkout local | 10 đồng thời: 3 HTTP 201 + 7 HTTP 400 hết hàng; tồn đầu 3, tồn cuối 0 | Fixture riêng, không có writers ngoài bài test. |
| Docker Compose | Parse/validate cấu hình PASS | Chưa chạy container, auth bootstrapping hoặc restart persistence. |

Log cục bộ được giữ trong `scratch_audit/` (được gitignore bằng `scratch_*`). Tham khảo `backend-unit.log`, `backend-e2e-final.log`, `backend-integration.log`, `lint-final.json`, `playwright-final.log`, `catalog-load.log`, `orders-load-final.log`, `backend-audit.json`, `frontend-audit.json`.

## Release gates còn mở

1. **DevOps:** chạy Compose mới trên môi trường có Docker; xác nhận authenticated replica set writable, volume/key persistence, backup/restore, secrets/TLS và smoke test đúng revision trên staging/production. Status update sẽ trả 503 nếu dùng standalone; phải chuyển database sang replica set trước rollout.
2. **Mobile:** cấp Firebase project/service-account credential rồi kiểm tra foreground/background/cold-start trên thiết bị thật. Cần signed AAB/iOS archive và evidence install/upgrade trước khi đóng MOBILE-01.
3. **QA:** chạy browser với backend thật và bộ dữ liệu staging đại diện; đo tải đủ lâu, nhiều user, query explain và kiểm thử Redis nhiều instance. Benchmark local nhỏ chưa đóng QA-03/NV-07.
4. **Security/maintainability:** chạy Gitleaks/CI trên revision đã commit; xử lý dần 1.811 lint warnings. Sanitizer HTML allowlist đã thay regex và có regression XSS; modal focus trap/keyboard accessibility vẫn cần rà soát riêng.
5. **Reliability:** các thông báo sau commit vẫn là best effort, chưa có transactional outbox; crash sau commit có thể làm mất thông báo. Checkout standalone còn cơ chế compensation, không cung cấp bảo đảm cross-document như replica set; không dùng standalone để xác nhận release.
6. **Đối tác:** PAY-01 và SHIPPING-01 đã có kết nối/protocol test cho VNPay, MoMo và GHN nhưng máy audit không có merchant/token sandbox. Phải chạy giao dịch và vận đơn sandbox thật trước khi đánh dấu DONE.

PM-01 giữ WIP cho tới khi có evidence của các gate thuộc scope phát hành. Có thể tách release web COD và mobile thành hai quyết định riêng, nhưng audit này không tự xác nhận hoặc thực hiện deploy.

## Chạy lại

Tạo MongoDB replica set và chỉ định `MONGODB_URI` tới database test riêng; đặt `NODE_ENV=test`, `AUTO_SEED=false`, ba JWT test secrets khác nhau. Không dùng URI production.

```sh
# backend/
npm test -- --runInBand
npx jest --rootDir . test/all-fixes.spec.ts test/e2e-flow.spec.ts test/critical-commerce-regression.spec.ts --runInBand
npm run test:e2e -- --runInBand
npm run build
npm run lint
npm audit

# frontend/
npm run test:unit
npm run build
npm run test:e2e
npm audit

# mobile/
flutter test --no-pub
flutter analyze --no-pub

# repository root, isolated API only
node --test scripts/load/load.test.js
```

Trên Windows dùng `npm.cmd` nếu PowerShell chặn `npm.ps1`. Máy audit chạy CLI Node trực tiếp khi sandbox không truy cập được đường dẫn npm SDK; Flutter test/analyze được cấp quyền ghi cache SDK. Xem [load-test guide](../scripts/load/README.md) để chạy bài test có tạo đơn.
