# Việc chưa xong — Kiểm thử & Sửa lỗi Trường Thành Bookstore

> **Cập nhật:** 2026-11-03 22:45 (+07:00)
> **Phạm vi:** Web (Backend NestJS + Frontend Vue: Storefront & Admin CMS). App mobile Flutter **chưa nằm trong đợt này**.
> **File này dùng để theo dõi tiến độ.** Báo cáo đầy đủ sẽ nằm ở `TEST_REPORT_AND_BUG_FIX.md` khi đợt kiểm thử chạy xong.

---

## 1. Tình trạng hiện tại

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Khảo sát source, cấu hình, scripts, phân quyền | ✅ Xong | Đã đọc `AGENTS.md`, `docs/PROJECT_OVERVIEW.md`, `docs/PENDING_TASKS.md` và mã nguồn thật |
| Dựng môi trường QA cô lập | ✅ Xong | Snapshot source lúc 22:23. Mỗi tester có backend + frontend + DB riêng (`truong-thanh-qa-N`). **Không đụng DB dev `truong-thanh-stationery`** |
| Baseline tự động (unit, lint, typecheck, build, E2E có sẵn) | ✅ Xong | Xem mục 2 |
| Kiểm thử như người dùng thật — 7 mảng | 🔄 Đang chạy | Trình duyệt Chrome thật qua Playwright |
| Xác minh độc lập từng bug | ⏳ Chờ | Chạy ngay sau khi từng mảng kiểm thử xong |
| Test bù phần còn thiếu | ⏳ Chờ | Một agent rà soát độ phủ, sau đó giao test bù |
| Gộp bug, đánh số BUG/TASK, viết `TEST_REPORT_AND_BUG_FIX.md` | ⏳ Chờ | |
| **Sửa lỗi** | ⛔ Chưa bắt đầu | Chờ danh sách bug đã xác minh. Đang vướng xung đột với agent Codex (mục 4) |
| Kiểm thử lại sau sửa + hồi quy | ⛔ Chưa bắt đầu | Phụ thuộc bước sửa lỗi |

---

## 2. Kết quả đã có — Baseline tự động (trên snapshot)

| Test ID | Hạng mục | Kết quả | Chi tiết |
|---|---|---|---|
| TC-BASE-BE-001 | Backend unit test (Jest) | ✅ PASS | 77/77 suite, 913/913 test |
| TC-BASE-BE-002 | Backend ESLint | ✅ PASS | 0 lỗi, 2.576 cảnh báo (trần 2.650) |
| TC-BASE-BE-003 | Backend type check | ✅ PASS | 0 lỗi |
| TC-BASE-BE-004 | Backend E2E (Jest) | ❌ FAIL (môi trường) | 20/21 PASS. Test hủy đơn cần MongoDB replica set, máy local đang chạy standalone |
| TC-BASE-BE-005 | Backend E2E `sprint4-regression` | ⚠️ BLOCKED | Spec tự tạo DB riêng và bắt buộc replica set |
| TC-BASE-BE-006 | 4 file test trong `backend/test/*.spec.ts` | ✅ PASS khi chạy tay | 36/36 test PASS, nhưng **cả `npm test` lẫn `test:e2e` đều không chạy các file này** |
| TC-BASE-BE-007 | Index unique `CashEntry.idempotencyKey` | ❌ FAIL | Trên DB mới chỉ có index thường. Tạo index báo lỗi `IndexKeySpecsConflict` |
| TC-BASE-FE-001 | Frontend unit test (Vitest) | ✅ PASS | 26/26 file, 124/124 test |
| TC-BASE-FE-002 | Frontend typecheck | ✅ PASS | 0 lỗi |
| TC-BASE-FE-003 | Frontend ESLint | ✅ PASS | 0 lỗi, 0 cảnh báo |
| TC-BASE-FE-004 | Frontend build | ✅ PASS | Cảnh báo: bundle chính 542 kB (> 500 kB) |
| TC-BASE-FE-005…014 | 9 kịch bản Playwright E2E có sẵn | 6 PASS / 3 FAIL khi có backend thật; 9/9 PASS khi chỉ dùng mock | 3 FAIL do test **không mock** `GET /api/reports/notifications`, request lọt sang backend thật → 401 → app đá về `/login` |
| TC-BASE-FE-015 | E2E trên Firefox / Safari / mobile | ⏸ NOT TESTED | Đợt này chỉ chạy Chromium |

### Phát hiện sơ bộ từ baseline (CHƯA xác minh độc lập — chưa tính là bug)

| Mã tạm | Nội dung | Mức nghi ngờ | Việc cần làm |
|---|---|---|---|
| PRE-01 | `CashEntry.idempotencyKey` không có index unique ở DB → chống ghi trùng phiếu thu/chi có thể chỉ dựa vào code | Cao (liên quan tiền) | Xác minh schema có khai báo index trùng key không; thử ghi 2 phiếu cùng key đồng thời |
| PRE-02 | 4 file test trong `backend/test/` bị bỏ qua khi chạy CI → mất độ phủ mà không ai biết | Trung bình | Đưa vào config Jest phù hợp hoặc đổi tên theo quy ước `.e2e-spec.ts` |
| PRE-03 | 3 kịch bản E2E không cô lập (thiếu mock `reports/notifications`) | Thấp (lỗi test, không phải lỗi sản phẩm) | Bổ sung mock trong helper E2E |
| PRE-04 | Hủy/cập nhật trạng thái đơn trả 503 khi MongoDB không phải replica set | Môi trường | Đúng thiết kế. Cần ghi rõ trong hướng dẫn chạy local |
| PRE-05 | Bundle JS chính 542 kB | Thấp (hiệu năng) | Tách code theo route (lazy load) |

---

## 3. Checklist việc chưa xong

### A. Kiểm thử (đang chạy)
- [ ] **A1** — Mảng Khách hàng: đăng ký, đăng nhập, đăng xuất, quên mật khẩu, hồ sơ, sổ địa chỉ, yêu thích, phiên hết hạn, chặn route
- [ ] **A2** — Mảng Mua hàng: danh sách/chi tiết, tìm kiếm có dấu/không dấu, lọc, sắp xếp, giỏ hàng (số lượng âm, vượt tồn kho), checkout COD/chuyển khoản, voucher, điểm thưởng, bấm đặt hàng nhiều lần, mất mạng, sửa giá từ client
- [ ] **A3** — Admin danh mục & kho: sản phẩm, danh mục, tồn kho, kho hàng, chính sách giá, khuyến mãi, banner, đánh giá, landing page, nhập/xuất Excel
- [ ] **A4** — Admin vận hành: đơn hàng (chuyển trạng thái hợp lệ/không hợp lệ, trả hàng), khách hàng, nhân viên & phân quyền, báo cáo doanh thu, sổ quỹ, POS, mua hàng, chứng từ
- [ ] **A5** — Luồng xuyên suốt: Khách đặt → Admin duyệt → Kho trừ → Hoàn tất → Báo cáo doanh thu; đối chiếu UI / API / DB; mua đồng thời sản phẩm cuối cùng; trùng idempotency key
- [ ] **A6** — Bảo mật & phân quyền: ma trận quyền theo vai trò cho mọi module, IDOR, mass assignment, token, injection, lộ stack trace. **Ưu tiên kiểm tra guard "deny-by-default" mới (chưa commit) có chặn nhầm người dùng hợp lệ không**
- [ ] **A7** — Responsive & khả năng chịu lỗi: mọi route trên desktop/tablet/mobile, offline, mạng chậm, API lỗi 500, tràn ngang, chữ `undefined`/`NaN`
- [ ] **A8** — Xác minh độc lập từng bug (tái hiện lại từ đầu, tìm nguyên nhân gốc kèm file:dòng)
- [ ] **A9** — Rà soát độ phủ và test bù phần còn thiếu
- [ ] **A10** — Gộp bug, đánh số BUG-xxx / TASK-xxx, viết `TEST_REPORT_AND_BUG_FIX.md`

### B. Sửa lỗi & kiểm thử lại (chưa bắt đầu)
- [ ] **B1** — Sửa từng bug đã xác minh theo nguyên nhân gốc, kèm regression test (ưu tiên P0 → P3)
- [ ] **B2** — Kiểm thử lại đúng thao tác gây lỗi trên trình duyệt thật + các chức năng liên quan
- [ ] **B3** — Chạy lại đủ bộ kiểm tra: backend `npm test`, `npm run lint`, `npm run build`; frontend `npm run test:unit`, `npm run typecheck`, `npm run lint`, `npm run build`
- [ ] **B4** — Đưa bản sửa vào workspace (xem điều kiện ở mục 4)
- [ ] **B5** — Cập nhật `TEST_REPORT_AND_BUG_FIX.md` (file đã sửa, kết quả kiểm thử lại thật)
- [ ] **B6** — Cập nhật `docs/PROJECT_OVERVIEW.md` mục 11.2 (số liệu test) và `docs/PENDING_TASKS.md` nếu bản sửa ảnh hưởng nghiệp vụ

### C. Dọn dẹp & bảo mật
- [ ] **C1** — Dừng các stack QA, xóa các DB QA tạm (`truong-thanh-qa-1` … `truong-thanh-qa-9`, `truong-thanh-qa-jest`). Không đụng các DB khác
- [ ] **C2** — **Xoay (đổi) `GEMINI_API_KEY`** trong `backend/.env`: giá trị này đã bị lộ trong log của phiên làm việc. Kiểm tra luôn URL Google Sheets WebApp
- [ ] **C3** — Xác nhận `backend/.env` không bị commit (hiện đã nằm trong `.gitignore`)

### D. Ngoài phạm vi đợt này (backlog có sẵn trong `docs/PENDING_TASKS.md`)
- [ ] PAY-01 — VNPay/MoMo sandbox (chờ merchant key)
- [ ] SHIPPING-01 — GHN sandbox (chờ token)
- [ ] MOBILE-01 / MOBILE-02 — Ký số app, push notification, E2E trên thiết bị thật
- [ ] INFRA-01 — Chạy nhiều instance + Redis phân tán
- [ ] ACC-01 — Khảo sát kế toán/thuế
- [ ] PM-01 — Go/No-Go phát hành
- [ ] Kiểm thử app mobile Flutter (chưa nằm trong đợt này)

---

## 4. Điều đang chặn & cách xử lý

| Vấn đề | Ảnh hưởng | Cách xử lý |
|---|---|---|
| **Agent Codex đang sửa cùng workspace.** Số file thay đổi trong git đã tăng từ 29 lên 98 trong khoảng 20 phút | Sửa trực tiếp lúc này dễ ghi đè lẫn nhau. Bug tìm được trên snapshot có thể đã bị Codex sửa hoặc thay đổi | Sửa và kiểm thử lại trên snapshot, xuất thành file patch. Chỉ áp vào workspace khi Codex đã dừng, sau khi chạy `git apply --check` và đối chiếu từng file |
| MongoDB local chạy standalone (không replica set) | Một số luồng (cập nhật trạng thái đơn, E2E Jest) bị chặn có chủ đích | Lỗi chỉ do môi trường được ghi là ENV, không tính là bug. Muốn test đầy đủ, chạy `docker compose up -d mongodb redis` (Docker Desktop hiện đang tắt) |
| Không có Redis | Throttle và blacklist token dùng bộ nhớ tạm của từng tiến trình | Không ảnh hưởng kết quả chức năng. Kiểm thử đa instance thuộc INFRA-01 |

## 5. Cần bạn quyết định
1. **Dừng Codex**, hoặc cho tôi biết nó đang làm gì, để tôi áp bản sửa thẳng vào workspace.
2. Sau khi có danh sách bug: chọn sửa **tất cả** hay chỉ **P0–P1** trước.

---
*Bằng chứng (ảnh chụp, log, script kiểm thử) đang lưu tạm trong thư mục scratchpad của phiên làm việc. Báo cáo chính thức sẽ trích các phần quan trọng vào `TEST_REPORT_AND_BUG_FIX.md`.*
