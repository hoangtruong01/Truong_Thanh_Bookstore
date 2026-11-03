# AI IMPLEMENTATION PLAYBOOK & SỔ TAY KIẾN TRÚC ERP MINI
# TRƯỜNG THÀNH BOOKSTORE — SỬA BUG, HOÀN THIỆN NGHIỆP VỤ VÀ PHÁT TRIỂN ERP MINI

> **Mục đích:** Tài liệu quản lý tiến độ, kiến trúc và giao việc chuẩn hóa cho đội ngũ kỹ sư và AI Coding Agent (Cursor, Claude Code, Antigravity, Copilot...).  
> **Repository:** https://github.com/hoangtruong01/Truong_Thanh_Bookstore  
> **Website:** https://truong-thanh-bookstore.vercel.app  
> **Ngày lập kế hoạch:** 01/11/2026 | **Cập nhật trạng thái thực thi:** 03/11/2026  
> **Phạm vi:** Backend NestJS, Frontend Vue 3, MongoDB ReplicaSet, POS quầy, Multi-Warehouse kho, Mua hàng & NCC, Tài chính & Dòng tiền, Quản lý Báo giá, Document Center, Khách sỉ CRM, Excel Data Exchange, Phân quyền RBAC.
>
> **Ngoài phạm vi:** Không thay đổi/tái xây dựng cổng thanh toán trực tuyến (VNPay/MoMo/VietQR). Tuy nhiên, các nghiệp vụ nội bộ như ghi nhận tiền mặt/ngân hàng, thu chi, công nợ, đối soát POS, COD và sổ quỹ vẫn thuộc phạm vi cốt lõi.

---

## 🚦 BẢNG HIỆN TRẠNG THỰC THI & CHỨNG THỰC CHẤT LƯỢNG (EXECUTION STATUS)

> 🟢 **TỔNG KẾT HỆ THỐNG:** Toàn bộ **Phase 1 (Core Financial & Invariants)**, **Phase 2 (Data Exchange & Security)**, **Phase 3 (ERP Feature Extensions)** và **Phase 4 (Customer Sales Returns & Carrier COD Reconciliation)** đã được triển khai, kiểm thử tự động và merge chính thức vào mã nguồn nhánh `main`.  
> - **Backend Test Suite:** `71 suites passed`, **`831 / 831 unit & regression tests passed (100%)`**, `0 errors`.  
> - **Frontend Test Suite:** `18 test files passed`, **`101 / 101 unit tests passed (100%)`**, Typecheck `0 errors`, Lint `0 errors, 0 warnings`, Build `SUCCESS`.

| Giai đoạn | Mã Task | Tên phân hệ / Nghiệp vụ | Trạng thái thực tế | Bằng chứng Commit & Kiểm thử |
| :--- | :---: | :--- | :---: | :--- |
| **P0 Baseline** | `BASE-00` | Khảo sát hiện trạng, Root cause & Test Baseline | ✅ **VERIFIED** | Baseline test suite thiết lập thành công |
| **Phase 1** | `FIN-01` | Atomic Thu/Chi & Idempotency AP/AR | ✅ **VERIFIED** | Commit `442ee1b`: Session transaction, payload hash, duplicate protection |
| **Phase 1** | `FIN-02` | Hoàn đảo phiếu tiền an toàn (Reversal) | ✅ **VERIFIED** | Commit `228c47b`: Conditional update, negative balance guard |
| **Phase 1** | `PUR-RET-01`| Trả hàng NCC & Cấn trừ công nợ / Hoàn tiền | ✅ **VERIFIED** | Commit `beb1a26`: Inventory ledger sync, returnable quantity calculation |
| **Phase 1** | `PRC-01` | Enforce Chính sách giá & Sàn Margin Floor Server-side | ✅ **VERIFIED** | Commit `898acc8`: Pricing engine dùng chung POS/Web, approval tokens |
| **Phase 1** | `AR-01` | Quản lý Công nợ Khách sỉ & Hạn mức Tín dụng | ✅ **VERIFIED** | Commit `05526a1`: CustomerCreditProfile, atomic exposure reservation |
| **Phase 1** | `POS-CASH-01`| Đồng bộ POS với Sổ quỹ, Split Payment & Đối soát ca | ✅ **VERIFIED** | Commit `e3a15bc`: Split payments, POS shift reconciliation |
| **Phase 2** | `XLS-01` | Shared Validation Pipeline Import Excel | ✅ **VERIFIED** | Commit `27a4e71`: Shared validator, error skip logic, audit batch |
| **Phase 2** | `SEC-01` | Bảo vệ Endpoint Upload (Magic bytes, File limits) | ✅ **VERIFIED** | Commit `27a4e71`: File signature, size limit, path traversal sanitization |
| **Phase 2** | `SEC-02` | Phân quyền RBAC Data Exchange theo Entity Type | ✅ **VERIFIED** | Commit `27a4e71`: Entity-based permission matrix, test matrix pass |
| **Phase 2** | `CASH-01` | Export Sổ quỹ Chuẩn hóa Bộ lọc & Streaming Data | ✅ **VERIFIED** | Commit `47ab840`: Cursor-based streaming, no silent truncation |
| **Phase 2** | `DOC-01` | Đồng bộ Toàn diện Tài liệu Dự án với Codebase | ✅ **VERIFIED** | Commit `da5bc94`: PROJECT_OVERVIEW.md & PENDING_TASKS.md synced |
| **Phase 2** | `ACC-01` | Khảo sát & Đặc tả Kế toán / Thuế (Survey Spec) | ✅ **VERIFIED** | Commit `17039d8`: Xuất bản ACCOUNTING_TAX_REQUIREMENTS.md |
| **Phase 3 (ERP)**| `INV-02` | Quản lý Nhiều Kho, Chuyển Kho & Kho Cách Ly | ✅ **VERIFIED** | Commit `2ce6b52`: Multi-warehouse, StockTransfer, quarantine isolation |
| **Phase 3 (ERP)**| `DOC-02` | Document Center & Quản lý Chứng từ Điện tử | ✅ **VERIFIED** | Commit `8058004`: Document archiving, metadata indexing, audit log |
| **Phase 3 (ERP)**| `CRM-01` | Phân hạng Khách Sỉ/Lẻ, Hạn mức & Chăm sóc | ✅ **VERIFIED** | Commit `8058004`: Customer tiering, wholesale priority scoring |
| **Phase 3 (ERP)**| `PUR-02` | Báo giá NCC & Đề xuất Nguồn hàng Tối ưu | ✅ **VERIFIED** | Commit `d82df2e`: Supplier quotations, price history, procurement engine |
| **Phase 4 (Mới)**| `SALES-RET-01`| Khách Hàng Trả Hàng, Đổi Hàng & Hoàn Tiền / Giảm Nợ | ✅ **VERIFIED** | Commit `2bc840b` + Return Request Modal Storefront & Admin rejection dialog |
| **Phase 4 (Mới)**| `FIN-COD-01`| Đối Soát Thu Hộ COD & Cước Vận Chuyển Logistics | ✅ **VERIFIED** | Commit `2bc840b` + Cashbook.vue Tab 5 COD Reconciliation & Statement batches |

---

# PHẦN A — LỆNH TỔNG CHO AI CODING AGENT

## A1. Vai trò của bạn

Bạn là một đội ngũ triển khai phần mềm gồm:

- CTO / Solution Architect.
- Senior NestJS Backend Engineer.
- Senior Vue 3 Frontend Engineer.
- MongoDB/Mongoose Engineer.
- Business Analyst (BA).
- QA/QC và Automation Tester.
- DevOps Engineer.
- Security Engineer.
- ERP / Inventory / Finance Business Analyst.

Bạn đang làm việc trên dự án hiện hữu **Trường Thành Bookstore**. Đây không phải dự án mới. Phải hiểu kiến trúc và nghiệp vụ đang chạy trước khi thay đổi.

## A2. Mục tiêu sản phẩm

Hoàn thiện hệ thống thành một nền tảng quản lý tổng thể cho doanh nghiệp kinh doanh sách và văn phòng phẩm:

1. Website phục vụ khách lẻ, khách sỉ, đăng ký, đặt hàng và theo dõi đơn.
2. Admin quản lý sản phẩm, giá vốn, giá bán, khuyến mãi, khách hàng, nhân viên.
3. Quản lý nguồn hàng: nhà cung cấp, báo giá, đặt mua, nhận hàng, trả hàng.
4. Quản lý kho: nhập, xuất, tồn, kiểm kê, điều chuyển và hàng lỗi.
5. Quản lý tài chính: vốn nhập hàng, thu chi, sổ quỹ, công nợ phải thu/phải trả.
6. Quản lý khách sỉ: bảng giá riêng, hạng khách, hạn mức nợ, thời hạn thanh toán.
7. Import/export Excel có kiểm tra dữ liệu, lịch sử và kiểm soát quyền.
8. Quản lý chứng từ điện tử, file đính kèm, lịch sử thay đổi.
9. Báo cáo quản trị có số liệu thống nhất giữa bán hàng, kho và tài chính.
10. Có nền tảng mở rộng kế toán/tax sau khi được kế toán xác nhận yêu cầu.

## A3. Nguồn tham khảo và các phát hiện đầu vào

Một đợt rà soát source code trước đó đã ghi nhận các khu vực cần xác minh/sửa:

| ID | Khu vực | Vấn đề cần kiểm tra lại trên code mới nhất |
|---|---|---|
| FIN-01 | Thu/chi và công nợ | Tính atomic, transaction và idempotency khi thu nợ/trả NCC |
| FIN-02 | Hoàn đảo phiếu tiền | Chống đảo trùng, cập nhật số dư nguyên tử, tránh số dư âm ngoài chính sách |
| PRC-01 | Chính sách giá | Margin/Markup phải được thực thi ở backend khi tạo đơn |
| AR-01 | Công nợ khách sỉ | Hồ sơ hạn mức tín dụng và luồng bán chịu/thu nợ end-to-end |
| PUR-RET-01 | Trả hàng NCC | Transaction, số lượng trả, bù trừ công nợ và retry |
| XLS-01 | Excel import | Preview/execute phải dùng chung validation; skipErrors đúng |
| SEC-01 | Upload Excel | Giới hạn file size, loại file, số dòng và tài nguyên xử lý |
| SEC-02 | Phân quyền Data Exchange | Quyền phải đúng theo loại dữ liệu, không cấp quá rộng |
| CASH-01 | Export sổ quỹ | Export phải khớp bộ lọc đang xem, không cắt dữ liệu âm thầm |
| POS-CASH-01 | POS và sổ quỹ | Xác định và triển khai đồng bộ doanh thu/tiền thực thu đúng phương thức |
| DOC-01 | Tài liệu dự án | Đồng bộ tài liệu kiến trúc, backlog và source code |
| ACC-01 | Kế toán/thuế | Khảo sát và lập đặc tả, chưa tự ý triển khai hạch toán/thuế khi chưa có xác nhận kế toán |

**CẢNH BÁO:** Các phát hiện trên là đầu vào cần AI xác minh lại. Không được coi số dòng, tên hàm, schema hoặc hành vi trong báo cáo cũ là bất biến. Branch/commit hiện tại có thể đã thay đổi. Nếu phát hiện đã được sửa, hãy xác minh bằng test và đánh dấu `ALREADY_FIXED`, không tạo code trùng.

## A4. Quy tắc bắt buộc trước khi sửa code

Trước mỗi task:

1. Đọc `AGENTS.md`, `README.md`, `docs/PROJECT_OVERVIEW.md`, tài liệu liên quan và `package.json`.
2. Kiểm tra branch, commit, git status. Không ghi đè thay đổi chưa commit của người dùng.
3. Đọc toàn bộ module liên quan: schema, DTO, controller, service, guard, module, frontend service, page/component và test.
4. Tìm tất cả nơi gọi tới function/service đang sửa bằng search toàn repository.
5. Xác định luồng dữ liệu từ UI → API → service → database → side effects → báo cáo.
6. Xác minh root cause bằng code/test, không sửa theo suy đoán.
7. Viết kế hoạch ngắn trước khi code: file dự kiến sửa, migration/index, ảnh hưởng API, test cần bổ sung.
8. Chỉ xử lý một task trong một nhánh/PR hoặc một commit logic riêng. Không gộp nhiều nghiệp vụ lớn vào một thay đổi khó review.

## A5. Quy tắc kỹ thuật không được vi phạm

### Dữ liệu và transaction

- Nghiệp vụ có nhiều document MongoDB phải dùng transaction hoặc thiết kế Outbox/Saga có trạng thái, retry và compensation rõ ràng.
- Không được tạo CashEntry rồi cập nhật payable/receivable ở bước độc lập mà không có cơ chế atomic.
- Không được trừ kho nếu ledger không ghi nhận tương ứng.
- Không được cập nhật balance bằng `$inc` nếu không có kiểm soát trạng thái, số dư và tính idempotent.
- Không được để trạng thái chứng từ là `APPLIED/POSTED/COMPLETED` trước khi tất cả side effect cần thiết hoàn tất.
- Không hard delete chứng từ tài chính/kho đã ghi sổ. Dùng reversal/adjustment theo nghiệp vụ.
- Dùng Decimal128 hoặc cách lưu tiền hiện có của dự án một cách nhất quán. Không đưa sai số floating point vào phép tính tiền.
- Xác định rõ quy tắc làm tròn tiền, VAT, margin và đơn giá.

### Idempotency và concurrency

- Idempotency key phải có unique constraint phù hợp.
- Cùng key + cùng payload: trả kết quả cũ, không chạy side effect lần hai.
- Cùng key + payload khác: trả `409 Conflict`.
- Có payload hash được tạo từ dữ liệu canonical phía server.
- Phải test hai hoặc nhiều request đồng thời, không chỉ test request tuần tự.
- Không chỉ dựa vào kiểm tra `find()` rồi `save()` vì có race condition.

### Giá, tồn kho và quyền

- Không tin `costPrice`, tồn kho, credit limit, discount approval, role hoặc giá cuối do client gửi.
- Backend tự lấy dữ liệu nguồn sự thật từ database.
- Giá và cost phải lưu snapshot vào đơn/chứng từ để lịch sử không thay đổi khi giá hiện tại thay đổi.
- Không để thiếu costPrice tự động được hiểu là hợp lệ.
- Permission phải kiểm tra tại backend cho từng endpoint và từng loại dữ liệu.
- Không dựa vào việc ẩn nút ở frontend để bảo vệ API.

### Tương thích và an toàn

- Không đổi tên API hoặc field đang dùng mà không có backward compatibility/migration.
- Không sửa/xóa test cũ chỉ để làm CI pass.
- Không tắt validation, lint, typecheck, security scan hoặc giảm tiêu chuẩn test để né lỗi.
- Không log password, token, secret, dữ liệu cá nhân nhạy cảm hoặc toàn bộ nội dung file Excel.
- Không commit `.env`, secret, key hoặc dữ liệu production.
- Migration/index phải có cách chạy an toàn và ghi rõ cách xử lý dữ liệu cũ bị trùng.
- Không tự ý đổi payment gateway.

## A6. Quy trình thực hiện mỗi task

Với từng task, AI phải làm theo đúng 8 bước:

1. **Inspect:** đọc code hiện tại và xác nhận vấn đề còn tồn tại hay đã được sửa.
2. **Explain:** mô tả root cause bằng tên file/function và tình huống tái hiện.
3. **Design:** đề xuất flow mới, transaction boundary, state transition, permission và idempotency.
4. **Implement:** sửa backend/frontend/schema/index/migration theo phạm vi task.
5. **Test:** thêm unit, integration, concurrency, rollback và RBAC test phù hợp.
6. **Verify:** chạy các lệnh test/lint/build thực tế.
7. **Review:** tự review diff, tìm side effect và backward compatibility.
8. **Report:** ghi rõ file thay đổi, kết quả test, migration, rủi ro còn lại.

Không được báo “đã hoàn thành” nếu chưa chạy test tương ứng hoặc chưa nói rõ test nào không chạy được.

## A7. Format báo cáo sau mỗi task

AI phải trả báo cáo theo mẫu:

```text
TASK ID:
STATUS: DONE / PARTIAL / ALREADY_FIXED / BLOCKED

1. Root cause:
2. Files inspected:
3. Files changed:
4. Database schema/index/migration:
5. API changes:
6. Business flow before:
7. Business flow after:
8. Security/RBAC impact:
9. Tests added:
10. Commands executed:
11. Test results:
12. Known limitations:
13. Manual test steps:
14. Recommended next task:
```

---

# PHẦN B — THỨ TỰ TRIỂN KHAI

## B1. Thứ tự bắt buộc

Không làm tất cả cùng lúc. Thực hiện theo thứ tự:

| Thứ tự | Task | Ưu tiên | Phụ thuộc | Có thể merge khi |
|---:|---|---|---|---|
| 0 | BASE-00 — Xác minh hiện trạng và lập test baseline | P0 | Không | Có baseline và báo cáo root cause |
| 1 | FIN-01 — Atomic thu/chi và công nợ | P1 | BASE-00 | Transaction/idempotency/concurrency pass |
| 2 | FIN-02 — Reversal phiếu tiền | P1 | FIN-01 | Duplicate reversal và balance test pass |
| 3 | PUR-RET-01 — Trả hàng NCC | P1 | FIN-01, hiểu inventory ledger | Return/stock/AP rollback test pass |
| 4 | SALES-RET-01 — Khách hàng trả hàng & Hoàn tiền/Công nợ | P1 | FIN-01, AR-01, INV-02 | Customer return, restocking & refund test pass |
| 5 | PRC-01 — Enforce price policy | P1 | BASE-00 | POS/WEB server-side pricing pass |
| 6 | AR-01 — Công nợ khách sỉ | P1 | FIN-01 | Credit limit/collection test pass |
| 7 | POS-CASH-01 — POS và Cashbook | P1 | FIN-01, AR-01 | Đối soát POS/Cashbook pass |
| 8 | FIN-COD-01 — Đối soát thu hộ COD & Vận chuyển Logistics | P1 | POS-CASH-01, FIN-01 | Carrier statement matching, Net payout pass |
| 9 | XLS-01 — Excel validation/import | P2 | BASE-00 | Invalid rows không được import |
| 10 | SEC-01 — Bảo vệ upload | P2 | XLS-01 | File abuse tests pass |
| 11 | SEC-02 — Phân quyền import/export | P2 | XLS-01 | Permission matrix pass |
| 12 | CASH-01 — Export sổ quỹ | P2 | FIN-01 | Excel khớp bộ lọc |
| 13 | DOC-01 — Đồng bộ tài liệu | P2 | Các task đã merge | Docs khớp code |
| 14 | ACC-01 — Đặc tả kế toán/thuế | P1 Planning | BA + kế toán | Có yêu cầu được kế toán xác nhận |

## B2. Không triển khai các phase mở rộng trước khi P1 ổn định

Các tính năng như nhiều kho, Document Center, dashboard nâng cao, marketing automation, kế toán tổng hợp chỉ bắt đầu sau khi các giao dịch tiền/kho/công nợ đã có transaction, idempotency, audit log và test.

---

# PHẦN C — CHI TIẾT TASK VÀ CASE XỬ LÝ

# TASK BASE-00 — XÁC MINH HIỆN TRẠNG, ROOT CAUSE VÀ TEST BASELINE

**Priority:** P0 — bắt buộc trước khi sửa.

## Mục tiêu

Xác định chính xác code đang chạy, test đang có, task nào còn lỗi và task nào đã được sửa từ lần audit trước.

## Phạm vi cần kiểm tra

- Backend: finance, purchasing, suppliers, inventory, stock-audits, POS, pricing, orders/checkout, data-exchange.
- Frontend: Cashbook, Purchases, Suppliers, PricingPolicies, POS, customer/order pages.
- Database: schema/index/transaction requirements.
- CI: backend tests, frontend tests, E2E, Flutter tests, security scans.
- Documentation: AGENTS, README, project overview, pending tasks.

## Việc AI phải làm

1. Kiểm tra commit/branch và trạng thái working tree.
2. Xác nhận MongoDB deployment có hỗ trợ transaction (replica set hoặc sharded cluster) ở môi trường chạy thực tế.
3. Search các function liên quan FIN-01, FIN-02, PUR-RET-01, PRC-01, AR-01.
4. Đọc test hiện tại và xác định test nào chỉ mock service, test nào chạy database thật.
5. Chạy baseline:
   - backend test;
   - backend lint;
   - backend build;
   - frontend typecheck/lint/build;
   - test liên quan module;
   - E2E nếu môi trường hỗ trợ.
6. Lập bảng phát hiện:
   - còn lỗi;
   - đã sửa nhưng thiếu test;
   - đã sửa và test đầy đủ;
   - không thể xác minh.
7. Không sửa nghiệp vụ trong task này, trừ lỗi tooling nhỏ được yêu cầu riêng.

## Test case

| Case | Thao tác | Kết quả |
|---|---|---|
| BASE-01 | Checkout branch và kiểm tra git status | Không ghi đè thay đổi chưa commit |
| BASE-02 | Chạy backend test | Có log và exit code thực tế |
| BASE-03 | Chạy frontend build/typecheck | Có log và exit code thực tế |
| BASE-04 | Kiểm tra MongoDB transaction support | Xác định được môi trường có transaction hay không |
| BASE-05 | Search các function và nơi gọi | Có danh sách caller đầy đủ |
| BASE-06 | Kiểm tra index hiện tại | Xác định index thiếu/trùng và migration cần thiết |

## Acceptance Criteria

- Có báo cáo baseline.
- Mỗi phát hiện cũ được gắn `OPEN`, `ALREADY_FIXED`, `NOT_REPRODUCED` hoặc `BLOCKED`.
- Có danh sách file/function thực tế ở commit hiện tại.
- Không tự kết luận đã fix chỉ vì CI xanh.

---

# TASK FIN-01 — SỬA TÍNH ATOMIC CHO THU/CHI, THANH TOÁN NCC VÀ THU NỢ KHÁCH

**Priority:** P1 — rất cao.

## Mục tiêu nghiệp vụ

Một lần thanh toán/thu nợ phải cập nhật đồng thời và nhất quán:

- CashEntry.
- CashAccount balance.
- SupplierPayable hoặc CustomerReceivable.
- Payment/collection history.
- Audit log/reference.

Nếu một bước thất bại thì không được có dữ liệu cập nhật một nửa.

## Khu vực code cần inspect

- `backend/src/modules/finance/finance.service.ts`
- `backend/src/modules/finance/finance.controller.ts`
- `backend/src/modules/finance/schemas/cash-entry.schema.ts`
- `backend/src/modules/finance/schemas/cash-account.schema.ts`
- `backend/src/modules/finance/schemas/supplier-payable.schema.ts`
- `backend/src/modules/finance/schemas/customer-receivable.schema.ts`
- `backend/src/modules/finance/dto/finance.dto.ts`
- Finance module và test liên quan.

Tên hàm dự kiến cần kiểm tra: `createEntry()`, `paySupplier()`, `collectCustomerPayment()`. Nếu code đã đổi tên, tìm theo nghiệp vụ tương đương.

## Root cause cần xác minh

- Tạo CashEntry và cập nhật AP/AR có dùng chung session transaction không?
- `idempotencyKey` có unique index thật trong database không?
- Retry có trả về entry cũ rồi vẫn tiếp tục cộng `paidAmount/collectedAmount` không?
- Có kiểm tra cùng key nhưng payload khác không?
- Có race condition khi hai request thanh toán cùng payable/receivable không?
- Có thể thanh toán vượt remainingAmount không?

## Yêu cầu triển khai

### FIN-01.1 — Chuẩn hóa idempotency

Tạo cơ chế idempotency thống nhất:

- Key bắt buộc cho các thao tác có side effect tài chính.
- Payload hash tạo từ dữ liệu canonical phía server.
- Unique index phù hợp, có xét dữ liệu cũ và record không có key.
- Cùng key + cùng payload: trả response của giao dịch cũ, không chạy side effect lần nữa.
- Cùng key + payload khác: trả HTTP 409.
- Không trả record cũ rồi tiếp tục cập nhật payable/receivable.

Không được chỉ dùng `findOne({ idempotencyKey })` rồi `save()` vì có race condition. Cần unique constraint và xử lý duplicate key.

### FIN-01.2 — Transaction cho paySupplier

Flow yêu cầu:

```text
BEGIN TRANSACTION
  Validate supplier payable exists and is payable
  Validate amount > 0
  Validate amount <= remainingAmount
  Validate cash account exists and is active
  Validate cash account has sufficient balance
  Validate idempotency key + payload hash
  Create CashEntry (OUT)
  Update CashAccount balance
  Update SupplierPayable paidAmount and remainingAmount
  Append supplier payment history
  Append audit event
COMMIT
```

Nếu bất kỳ bước nào lỗi: rollback toàn bộ.

### FIN-01.3 — Transaction cho collectCustomerPayment

```text
BEGIN TRANSACTION
  Validate customer receivable exists
  Validate amount > 0
  Validate amount <= remainingAmount
  Validate cash account is active
  Validate idempotency key + payload hash
  Create CashEntry (IN)
  Update CashAccount balance
  Update CustomerReceivable collected/paid and remainingAmount
  Append collection history
  Append audit event
COMMIT
```

Nếu lỗi: rollback toàn bộ.

### FIN-01.4 — Chống concurrency

- Không chỉ đọc remainingAmount rồi update bằng `$inc` không điều kiện.
- Dùng conditional update/optimistic concurrency phù hợp.
- Đảm bảo hai request đồng thời không thể cùng dùng một phần remainingAmount.
- Nếu transaction conflict, retry có giới hạn và trả lỗi có thể hiểu được.
- Không retry vô hạn.

### FIN-01.5 — Chuẩn hóa tiền

- Kiểm tra cách lưu tiền hiện tại.
- Dùng cùng một cách biểu diễn tiền trong CashEntry, Payable, Receivable, Account.
- Không so sánh số tiền floating point tùy tiện.
- Quy định rõ số chữ số thập phân và rounding.

## Test cases bắt buộc

| ID | Dữ liệu/Thao tác | Kết quả mong đợi |
|---|---|---|
| FIN-01-T01 | Trả NCC 2.000.000đ, payable còn 5.000.000đ | Tạo 1 phiếu chi; AP còn 3.000.000đ; account giảm 2.000.000đ |
| FIN-01-T02 | Retry cùng key, cùng payload 5 lần | Chỉ có 1 CashEntry, 1 payment history và 1 lần trừ balance |
| FIN-01-T03 | Cùng key nhưng đổi amount | 409; không thay đổi dữ liệu |
| FIN-01-T04 | Cùng key nhưng đổi cash account | 409 |
| FIN-01-T05 | Amount lớn hơn remainingAmount | Từ chối; không tạo CashEntry |
| FIN-01-T06 | Account không đủ tiền | Từ chối; không thay đổi AP |
| FIN-01-T07 | Giả lập lỗi khi save payable sau khi tạo CashEntry | Transaction rollback; không còn entry/account movement |
| FIN-01-T08 | Hai request cùng thanh toán 4 triệu, AP còn 5 triệu | Tổng thanh toán không vượt 5 triệu |
| FIN-01-T09 | Thu nợ khách 1 triệu | Tạo 1 phiếu thu; AR giảm đúng; account tăng đúng |
| FIN-01-T10 | Retry thu nợ sau timeout | Không tăng collectedAmount lần hai |
| FIN-01-T11 | Hai request thu cùng một receivable | Không thu vượt số còn nợ |
| FIN-01-T12 | Amount bằng 0, âm, NaN, Infinity hoặc sai định dạng | Validation từ chối |

## Acceptance Criteria

- Toàn bộ side effect của paySupplier/collectCustomerPayment nằm trong transaction.
- Idempotency được bảo vệ bởi unique index.
- Cùng key khác payload trả 409.
- Test rollback và concurrency pass.
- Không còn tình huống CashEntry đã tạo nhưng AP/AR không đổi hoặc ngược lại.
- Có script/migration tạo index và cách xử lý duplicate key cũ.

---

# TASK FIN-02 — HOÀN ĐẢO PHIẾU THU/CHI AN TOÀN

**Priority:** P1.

## Mục tiêu

Không cho một phiếu tiền bị hoàn đảo nhiều lần. Hoàn đảo phải cập nhật phiếu gốc, phiếu đảo và số dư account một cách atomic.

## Khu vực code

- `backend/src/modules/finance/finance.service.ts`
- CashEntry schema.
- CashAccount schema.
- Finance DTO/controller.
- Test reversal.

Tên hàm dự kiến: `reverseEntry()`.

## Yêu cầu triển khai

1. Kiểm tra phiếu gốc tồn tại, thuộc đúng account/tenant nếu hệ thống có tenant.
2. Chỉ phiếu `POSTED` mới được đảo.
3. Dùng conditional update để chỉ một request chuyển được `POSTED → REVERSED`.
4. Tạo reversal entry có `reversalOf` tham chiếu phiếu gốc.
5. Tạo unique partial index cho `reversalOf` để một phiếu gốc chỉ có một reversal hợp lệ.
6. Cập nhật CashAccount trong cùng transaction.
7. Nếu đảo phiếu thu (IN), reversal là OUT; kiểm tra số dư account có đủ hay không.
8. Nếu nghiệp vụ cho phép số dư âm, phải có policy, quyền phê duyệt, lý do và audit log. Không tự cho âm quỹ.
9. Không sửa nội dung phiếu gốc; lưu liên kết phiếu đảo.
10. Reversal phải có idempotency key.

## Test cases

| ID | Kịch bản | Kết quả |
|---|---|---|
| FIN-02-T01 | Đảo phiếu chi 1 triệu | Tạo phiếu thu đảo; balance tăng 1 triệu; gốc thành REVERSED |
| FIN-02-T02 | Đảo phiếu thu khi account đủ tiền | Tạo phiếu chi đảo; balance giảm đúng |
| FIN-02-T03 | Đảo phiếu thu khi account không đủ tiền | Bị từ chối; không tạo reversal |
| FIN-02-T04 | Gửi 10 request đảo đồng thời | Chỉ một reversal được tạo |
| FIN-02-T05 | Retry cùng idempotency key | Trả reversal cũ, không cộng/trừ lần hai |
| FIN-02-T06 | Đảo phiếu đã REVERSED | Từ chối |
| FIN-02-T07 | Đảo phiếu DRAFT/CANCELLED | Từ chối |
| FIN-02-T08 | Lỗi khi cập nhật account | Transaction rollback cả reversal và trạng thái gốc |
| FIN-02-T09 | User không có MANAGE_FINANCE | 403 |

## Acceptance Criteria

- Không thể tạo hai reversal cho một phiếu gốc.
- Không thể đảo phiếu chưa POSTED hoặc đã REVERSED.
- Account balance và CashEntry ledger khớp.
- Test concurrency/rollback pass.

---

# TASK PUR-RET-01 — HOÀN THIỆN TRẢ HÀNG NHÀ CUNG CẤP

**Priority:** P1.

## Mục tiêu

Một phiếu trả NCC phải đồng bộ đúng:

- Phiếu Goods Receipt gốc.
- Số lượng đủ điều kiện trả.
- Inventory ledger và tồn kho.
- Purchase Return.
- Supplier Payable/Credit/Refund.
- Trạng thái chứng từ và audit history.

## Khu vực code

- `backend/src/modules/purchasing/purchase-returns.service.ts`
- `backend/src/modules/purchasing/purchase-returns.controller.ts`
- `backend/src/modules/purchasing/dto/purchase-return.dto.ts`
- `backend/src/modules/purchasing/schemas/purchase-return.schema.ts`
- `backend/src/modules/purchasing/goods-receipts.service.ts`
- `backend/src/modules/inventory/*`
- Finance supplier payable service/schema.
- Test purchasing/inventory/finance.

## Các vấn đề phải xác minh

1. Tạo PurchaseReturn, trừ kho và apply credit có nằm trong cùng transaction không?
2. Có đặt `creditAdjustmentStatus = APPLIED` trước khi bù trừ hoàn tất không?
3. Retry cùng idempotency key có bỏ qua bước apply credit không?
4. Hai dòng trùng productId có thể vượt lượng trả không?
5. Hệ thống dùng `acceptedQuantity` hay `baseQuantity` làm số lượng được trả?
6. Giá trị hàng trả lấy từ snapshot giá vốn của Goods Receipt hay client gửi?
7. Nếu giá trị trả lớn hơn payable còn lại, phần chênh lệch được lưu ở đâu?

## Yêu cầu nghiệp vụ

### PUR-RET-01.1 — Số lượng được trả

- Tính số lượng đủ điều kiện trả từ Goods Receipt gốc.
- Phải trừ số lượng đã trả ở các return trước.
- Phải cộng dồn số lượng của các dòng cùng product trong request hiện tại.
- Không cho tổng returnedQuantity vượt returnableQuantity.
- Xác định rõ hàng `ACCEPTED`, `REJECTED`, `DAMAGED`, `QUARANTINE`.
- Hàng chưa từng vào tồn khả dụng không được trừ khỏi tồn khả dụng lần nữa.
- Nếu trả hàng lỗi/hỏng, ghi movement đúng loại và khu vực tồn tương ứng.

### PUR-RET-01.2 — Giá trị trả

- Giá trả phải dựa vào cost/price snapshot của Goods Receipt hoặc chính sách đã được doanh nghiệp xác nhận.
- Không tin `unitCost`, `returnAmount` do client gửi.
- Lưu rõ quantity, unit, baseQuantity, unitCost, lineAmount.
- Quy tắc rounding phải thống nhất.

### PUR-RET-01.3 — State machine

Thiết kế trạng thái rõ ràng, ví dụ:

```text
DRAFT
  -> APPROVED
  -> POSTED

Credit adjustment:
PENDING
  -> APPLIED
  -> FAILED / CANCELLED (theo chính sách)
```

Không đánh dấu `APPLIED` trước khi bù trừ công nợ hoàn tất.

### PUR-RET-01.4 — Atomic transaction và idempotency

- Tạo return, inventory movement, inventory balance, supplier credit/payable trong transaction nếu cùng MongoDB deployment.
- Có unique idempotency theo return request.
- Có unique reference theo `purchaseReturnId` cho credit adjustment.
- Dùng conditional transition để chỉ một request được apply.
- Nếu bù trừ thất bại, trạng thái phải phản ánh thất bại/pending để retry an toàn.
- Không để trạng thái APPLIED nhưng payable chưa được điều chỉnh.

### PUR-RET-01.5 — NCC phải hoàn tiền

Nếu giá trị trả lớn hơn công nợ phải trả còn lại:

- Không bỏ mất phần chênh lệch.
- Tạo SupplierCredit/RefundReceivable hoặc mô hình tương đương.
- Cho phép ghi nhận NCC hoàn tiền vào CashAccount sau này.
- Có trạng thái: chờ NCC hoàn, hoàn một phần, hoàn đủ.
- Không tự biến phần chênh lệch thành doanh thu.

## Test cases

| ID | Kịch bản | Kết quả |
|---|---|---|
| PUR-RET-T01 | GRN nhận 10 sản phẩm A, chưa trả; trả 3 | Tồn giảm 3; return ghi 3 |
| PUR-RET-T02 | Đã trả 4, tiếp tục trả 7 | Bị từ chối vì vượt số lượng còn được trả |
| PUR-RET-T03 | Một request có hai dòng A: 7 và 7, GRN chỉ có 10 | Bị từ chối |
| PUR-RET-T04 | Hàng REJECTED chưa vào tồn khả dụng | Không trừ tồn khả dụng lần nữa |
| PUR-RET-T05 | Lỗi sau khi tạo return nhưng trước inventory movement | Rollback toàn bộ |
| PUR-RET-T06 | Lỗi sau inventory movement nhưng trước credit adjustment | Rollback toàn bộ hoặc trạng thái workflow rõ ràng theo thiết kế Outbox |
| PUR-RET-T07 | Retry cùng key | Không tạo return/movement/credit lần hai |
| PUR-RET-T08 | Hai request apply credit đồng thời | Chỉ một lần bù trừ |
| PUR-RET-T09 | Return amount 5 triệu, payable còn 3 triệu | AP giảm 3 triệu; 2 triệu thành khoản NCC phải hoàn/credit |
| PUR-RET-T10 | Client sửa unitCost thành 1đ | Backend dùng snapshot cost đáng tin cậy |
| PUR-RET-T11 | User chỉ có MANAGE_INVENTORY nhưng không có quyền tài chính | Không được xác nhận credit adjustment |
| PUR-RET-T12 | Trả hàng thuộc GRN của NCC khác hoặc GRN không tồn tại | Bị từ chối |

## Acceptance Criteria

- Không thể trả vượt quantity.
- Không có duplicate inventory movement.
- Không có duplicate supplier credit.
- Transaction rollback đúng.
- Phần NCC phải hoàn được theo dõi.
- Có audit trail người tạo/người duyệt/người ghi sổ.

---

# TASK SALES-RET-01 — HOÀN TẤT LUỒNG KHÁCH HÀNG TRẢ HÀNG, ĐỔI HÀNG VÀ HOÀN TIỀN/CÔNG NỢ (CUSTOMER SALES RETURN)

**Priority:** P1 — Nghiệp vụ thương mại cốt lõi.

## Mục tiêu nghiệp vụ

Xử lý toàn diện và đồng bộ giao dịch khi khách hàng (khách lẻ POS, khách mua Online hoặc khách sỉ B2B) yêu cầu hoàn trả hoặc đổi sản phẩm. Một giao dịch khách trả hàng phải cập nhật đồng thời, nhất quán 5 trụ cột:

1. **Phiếu hoàn trả bán hàng (Sales Return / Return Request):** Ghi nhận lý do trả, tình trạng sản phẩm, số lượng, giá trị hoàn tiền và người thực hiện/phê duyệt.
2. **Kho & Tồn kho (Inventory Ledger):**
   - Hàng nguyên vẹn: Nhập lại kho khả dụng bán hàng (`SALE_WAREHOUSE`).
   - Hàng lỗi, rách, hỏng từ khách: Chuyển thẳng vào kho cách ly/quarantine (`DAMAGED_WAREHOUSE` theo kiến trúc `INV-02`), tuyệt đối không nhập lại kho bán được.
3. **Dòng tiền & Công nợ (Finance / AP-AR):**
   - Đơn đã thanh toán (Tiền mặt/Chuyển khoản/Online): Tạo `CashEntry` (OUT) từ `CashAccount` tương ứng hoặc cấp Mã giảm giá/Điểm tín dụng (Store Credit).
   - Đơn khách sỉ bán chịu (AR-01): Cấn trừ trực tiếp vào `CustomerReceivable`, giảm dư nợ hiện tại và giải phóng hạn mức tín dụng (`currentExposure`) trong `CustomerCreditProfile`.
4. **Điểm thưởng & Khuyến mãi (Loyalty & Promotion):**
   - Thu hồi/khấu trừ lại số điểm thưởng (Loyalty Points) đã cộng cho khách từ sản phẩm bị trả.
   - Nếu khách đã tiêu điểm cho đơn này và trả toàn bộ đơn: Hoàn trả lại số điểm đã dùng.
5. **Giá vốn (COGS) & Doanh thu:** Đảo bút toán ghi nhận giá vốn xuất kho và ghi nhận khoản giảm trừ doanh thu (TK 5212) chuẩn bị cho phân hệ kế toán ACC-01.

## Khu vực code liên quan

- `backend/src/modules/orders/services/order-lifecycle.service.ts`
- `backend/src/modules/orders/orders.controller.ts`
- `backend/src/modules/orders/schemas/order.schema.ts`
- `backend/src/modules/pos/pos.service.ts`
- `backend/src/modules/pos/schemas/pos-order.schema.ts`
- `backend/src/modules/inventory/inventory.service.ts`
- `backend/src/modules/finance/finance.service.ts`
- `backend/src/modules/finance/services/customer-credit.service.ts`
- Frontend: `OrderDetail.vue`, `POS.vue`, `Orders.vue`.
- Test suites: `orders.service.spec.ts`, `pos.service.spec.ts`, `finance.service.spec.ts`.

## Các vấn đề bắt buộc xác minh

1. Đơn hàng ở trạng thái nào mới được phép trả? (Chỉ chấp nhận đơn `DELIVERED` hoặc `COMPLETED`).
2. Thời hạn cho phép trả hàng (Return Window): Ví dụ 7 ngày kể từ khi giao thành công. Nếu vượt quá, cần Manager Approval Override Token.
3. Số lượng trả: Có kiểm tra `quantity - returnedQuantity` của từng sản phẩm không? Một request có dòng trùng hoặc trả nhiều lần có bị vượt số lượng gốc không?
4. Đơn giá hoàn trả: Phải dựa trên giá thực mua trên hóa đơn (sau khi đã phân bổ Voucher/Chiết khấu), tuyệt đối không hoàn theo giá niêm yết hiện hành của sản phẩm.
5. Hàng đổi (Exchange): Xử lý như 1 giao dịch Return + 1 New Sale trong cùng session để bù trừ tiền chênh lệch.

## Quy trình giao dịch (Transaction Flow)

```text
BEGIN TRANSACTION
  1. Validate Order/POSOrder exists and status in [DELIVERED, COMPLETED]
  2. Validate return window policy (nếu quá hạn -> kiểm tra manager approval token)
  3. Validate returned items:
     - Từng productId thuộc đơn hàng
     - Số lượng trả <= (quantity - returnedQuantity)
  4. Calculate net refund amount:
     - Giá trị hoàn trả = Đơn giá ròng (net price) sau chiết khấu * số lượng trả
  5. Process Inventory Movement:
     - Nếu condition == 'GOOD': Tạo InventoryMovement (RETURN_RESTOCK) vào kho bán
     - Nếu condition == 'DAMAGED': Tạo InventoryMovement (RETURN_DAMAGED) vào kho kiểm định/cách ly
     - Cập nhật tồn kho (InventoryBalance) tương ứng
  6. Process Financial Adjustment:
     - Nếu đơn khách sỉ công nợ (AR):
         Cập nhật CustomerReceivable (giảm remainingAmount)
         Cập nhật CustomerCreditProfile (giảm currentExposure)
     - Nếu đơn đã thực thu tiền (CASH / BANK):
         Validate CashAccount có đủ số dư
         Tạo CashEntry (OUT, direction=OUT, type=SALES_REFUND)
         Cập nhật CashAccount balance
  7. Adjust Loyalty Points:
     - Khấu trừ điểm đã thưởng cho khách
     - Hoàn lại điểm đã tiêu (nếu hoàn toàn bộ đơn)
  8. Update Order/POSOrder:
     - Cập nhật returnedQuantity cho từng item
     - Thêm bản ghi vào refundHistory/returnHistory (kèm idempotencyKey, payloadHash, reason, actor)
     - Cập nhật orderStatus = RETURNED (nếu trả 100%) hoặc PARTIALLY_RETURNED
  9. Append Audit Log & Outbox Event
COMMIT
```

## Bảng Test Cases bắt buộc

| ID | Kịch bản kiểm thử | Kết quả mong đợi |
|---|---|---|
| SALES-RET-T01 | Khách trả 1 sản phẩm nguyên vẹn trên đơn lẻ đã giao | Tồn kho bán tăng 1; CashEntry OUT tạo thành công; Quỹ tiền giảm đúng giá ròng |
| SALES-RET-T02 | Khách trả sản phẩm bị rách mép, lỗi in ấn | Nhập vào Kho cách ly (Quarantine/Damaged), không tăng tồn kho khả dụng bán |
| SALES-RET-T03 | Khách sỉ trả hàng đơn bán chịu (AR-01) | Không chi tiền mặt; Giảm `remainingAmount` của Receivable; Giảm `currentExposure` |
| SALES-RET-T04 | Trả vượt số lượng còn lại có thể trả | Bị từ chối với HTTP 400 Bad Request |
| SALES-RET-T05 | Trả hàng sau 15 ngày (chính sách cho phép 7 ngày) không có approval token | Bị từ chối với HTTP 400 (Quá hạn trả hàng) |
| SALES-RET-T06 | Trả hàng quá hạn nhưng có Manager Approval Token hợp lệ | Chấp thuận hoàn trả; Audit log lưu mã người phê duyệt |
| SALES-RET-T07 | Retry gửi lại cùng `idempotencyKey` và payload | Trả lại kết quả hoàn trả cũ; Không trừ quỹ tiền và không cộng kho lần 2 |
| SALES-RET-T08 | Gửi cùng `idempotencyKey` nhưng thay đổi số lượng/số tiền hoàn | Trả về HTTP 409 Conflict |
| SALES-RET-T09 | Hai request hoàn trả đồng thời trên cùng 1 đơn hàng | Concurrency safety: Tổng số lượng hoàn trả không được vượt quá số lượng mua |
| SALES-RET-T10 | Khách dùng Voucher giảm 20% khi mua | Đơn giá hoàn tính theo giá sau giảm 20%, không hoàn theo giá gốc |
| SALES-RET-T11 | Đơn hàng đang ở trạng thái `PROCESSING` hoặc `SHIPPING` | Từ chối hoàn trả hàng; Hướng dẫn chuyển sang luồng Hủy đơn / Từ chối nhận |
| SALES-RET-T12 | Nhân viên không có quyền `MANAGE_ORDERS` hoặc `POS_REFUND` | Trả về HTTP 403 Forbidden |

## Acceptance Criteria

- Đầy đủ luồng trả một phần và trả toàn bộ cho cả Web Order và POS Order.
- Phân luồng kho chính xác: Hàng tốt vào kho bán lẻ, hàng hỏng vào kho lỗi/cách ly.
- Tiền mặt, công nợ khách sỉ và quỹ tiền được đồng bộ atomic qua transaction.
- Không thể bypass kiểm tra số lượng hay giá trị hoàn trả.
- Khấu trừ điểm thưởng loyalty chính xác, bảo toàn quyền lợi doanh nghiệp.

---

# TASK PRC-01 — BẮT BUỘC THỰC THI PRICE POLICY VÀ MARGIN Ở BACKEND

**Priority:** P1.

## Mục tiêu

Chính sách giá phải được áp dụng tại server khi tạo đơn, không chỉ là API kiểm tra hoặc logic hiển thị trên frontend.

Phải hỗ trợ:

- Giá bán lẻ.
- Giá sỉ.
- Giá theo tier khách hàng.
- Giá theo kênh WEB/POS.
- Giá theo số lượng.
- Chiết khấu/voucher.
- Margin floor.
- Quy trình phê duyệt khi bán dưới biên lợi nhuận tối thiểu.

## Khu vực code

- `backend/src/modules/pricing/pricing.service.ts`
- `backend/src/modules/pricing/pricing.controller.ts`
- `backend/src/modules/pricing/dto/*`
- `backend/src/modules/pos/pos.service.ts`
- `backend/src/modules/pos/pos.controller.ts`
- `backend/src/modules/orders/services/checkout.service.ts`
- Product/Inventory schemas.
- PricePolicy schemas.
- Frontend POS/PricingPolicies.
- Tests pricing/POS/checkout.

## Vấn đề phải xác minh

- `checkMargin()` có được gọi trong POS và WEB order creation không?
- CostPrice có được lấy từ database hay nhận từ request?
- Khi thiếu costPrice, có fail-open không?
- Margin và Markup có bị tính nhầm công thức không?
- Approval có gắn với đúng product, quantity, cost, price, discount, order và user không?
- Client có thể sửa giá cuối hoặc discount rồi gọi API trực tiếp không?

## Quy tắc tính phải định nghĩa rõ

- Gross margin % = `(sellingPrice - costPrice) / sellingPrice * 100`.
- Markup % = `(sellingPrice - costPrice) / costPrice * 100`.
- Không dùng hai khái niệm thay thế nhau.
- Phải xác định giá trước/sau VAT dùng trong phép tính.
- Phải xác định cost basis: cost hiện hành, weighted average, FIFO hoặc snapshot theo chính sách kế toán.
- Không tự ý đổi phương pháp tính giá vốn đang dùng.

## Yêu cầu triển khai

1. Tạo một service tính giá dùng chung cho POS và WEB.
2. Backend lấy Product, cost, PricePolicy, customer tier và channel từ database.
3. Client chỉ gửi productId, quantity, channel/context cần thiết; không gửi cost làm nguồn chuẩn.
4. Backend tự tính unit price, discount, tax và line total.
5. Nếu thiếu cost:
   - mặc định block bán dưới chính sách margin;
   - hoặc chuyển sang trạng thái cần quản lý phê duyệt;
   - không trả kết quả `requiresApproval: false` khi chưa đủ dữ liệu.
6. Kiểm tra policy theo priority/effective date/active status.
7. Lưu snapshot vào order item:
   - base selling price;
   - applied policy ID/version;
   - cost snapshot;
   - discount;
   - final unit price;
   - margin/markup;
   - approver;
   - approval reason.
8. Nếu cần manager approval, token phải ràng buộc đúng nội dung giao dịch và không được replay cho đơn khác.
9. Backend phải kiểm tra lại khi tạo đơn, không tin kết quả preview từ frontend.

## Test cases

| ID | Kịch bản | Kết quả |
|---|---|---|
| PRC-T01 | Cost 90.000đ, sell 100.000đ, margin floor 15% | Yêu cầu approval hoặc từ chối |
| PRC-T02 | Cost 80.000đ, sell 100.000đ, margin floor 15% | Được bán nếu các policy khác hợp lệ |
| PRC-T03 | CostPrice null/0 | Không tự động thông qua |
| PRC-T04 | Client gửi costPrice = 1đ | Backend bỏ qua, lấy cost từ DB |
| PRC-T05 | Client gửi giá bán thấp hơn policy | Backend tính lại hoặc từ chối |
| PRC-T06 | Product policy và Global policy cùng áp dụng | Chọn đúng policy theo precedence |
| PRC-T07 | Policy hết hạn | Không áp dụng |
| PRC-T08 | Policy chưa tới effective date | Không áp dụng |
| PRC-T09 | Khách sỉ có tier riêng | Đúng giá theo tier |
| PRC-T10 | Cùng sản phẩm/khách/channel ở POS và WEB | Kết quả tính giá nhất quán |
| PRC-T11 | Approval token dùng cho order khác | Từ chối |
| PRC-T12 | User không có quyền duyệt margin | Không thể approve |
| PRC-T13 | Quantity tăng làm thay đổi bậc giá | Giá được tính đúng theo quantity |
| PRC-T14 | Voucher + wholesale discount cùng lúc | Áp dụng rule stacking/priority rõ ràng, không double discount |

## Acceptance Criteria

- Không thể bypass margin bằng cách sửa request.
- POS và WEB dùng chung pricing engine.
- Missing cost fail-closed.
- Snapshot giá và cost lưu trên đơn.
- Có test precedence, expiry, concurrency nếu policy bị sửa trong lúc tạo đơn.
- Frontend preview khớp backend final result nhưng backend luôn là nguồn quyết định cuối.

---

# TASK AR-01 — HOÀN THIỆN CÔNG NỢ KHÁCH HÀNG VÀ BÁN SỈ

**Priority:** P1.

## Mục tiêu

Khách sỉ được quản lý như một đối tác có hồ sơ tín dụng:

- Hạn mức nợ.
- Thời hạn thanh toán.
- Dư nợ hiện tại.
- Nợ quá hạn.
- Lịch sử đơn hàng.
- Lịch sử thu tiền.
- Bảng giá riêng.
- Trạng thái cho phép bán chịu.

## Khu vực code

- `backend/src/modules/finance/*`
- `backend/src/modules/customers/*`
- `backend/src/modules/pos/*`
- `backend/src/modules/orders/*`
- `backend/src/modules/users/*` nếu customer model đang đặt ở module khác.
- `frontend/src/services/finance.service.ts`
- `frontend/src/pages/admin/Cashbook.vue`
- Customer detail/admin pages.
- POS checkout UI.
- Tests finance/customer/POS/checkout.

## Vấn đề phải xác minh

- Credit limit đang lấy từ receivable đầu tiên hay từ hồ sơ khách hàng?
- Có default credit limit cố định cho khách mới không?
- POS/WEB có gọi check credit limit khi bán chịu không?
- POS có tạo CustomerReceivable không?
- Frontend có API và UI quản lý receivable không?
- Thu một phần có idempotent không?
- Có kiểm soát hai đơn đồng thời vượt hạn mức không?

## Yêu cầu dữ liệu

Thiết kế CustomerCreditProfile hoặc mở rộng Customer schema phù hợp:

- customerId;
- creditLimit;
- currentExposure (nếu chọn denormalize, phải có reconciliation);
- creditStatus: PENDING/APPROVED/BLOCKED;
- paymentTermDays;
- approvedBy;
- approvedAt;
- reviewAt;
- creditNote;
- overduePolicy.

Không lấy creditLimit từ một receivable tùy ý. Khách mới mặc định không được bán chịu nếu chưa được duyệt.

## Yêu cầu luồng bán chịu

1. Nhân viên chọn khách hàng.
2. Backend lấy credit profile và dư nợ hiện tại.
3. Backend kiểm tra:
   - khách có được bán chịu không;
   - có bị khóa do quá hạn không;
   - đơn mới có vượt hạn mức không;
   - điều khoản thanh toán.
4. Nếu không đạt: từ chối hoặc tạo yêu cầu quản lý duyệt vượt hạn mức.
5. Nếu đạt: tạo Order/POSOrder và CustomerReceivable trong cùng transaction.
6. Lưu dueDate và snapshot credit profile.
7. Không đánh dấu đơn đã thanh toán nếu khách chưa trả tiền.

## Yêu cầu thu nợ

- Thu đủ/thu một phần.
- Chọn cash account/phương thức nhận tiền.
- Tạo CashEntry và update receivable trong FIN-01 transaction.
- Có idempotency.
- Lưu người thu, thời gian, số tiền, chứng từ và ghi chú.
- Hỗ trợ nhiều lần thu cho một hóa đơn.

## Yêu cầu báo cáo/UI

- Danh sách công nợ khách hàng.
- Bộ lọc theo khách, tier, trạng thái, quá hạn.
- Chi tiết từng hóa đơn.
- Tổng dư nợ.
- Tuổi nợ: chưa đến hạn, 1–30, 31–60, 61–90, trên 90 ngày.
- Lịch sử thu tiền.
- Cảnh báo vượt hạn mức.
- Cảnh báo sắp tới hạn/quá hạn.
- Export Excel theo filter.
- Nút khóa/mở bán chịu theo quyền.
- Không xóa receivable đã ghi nhận; điều chỉnh bằng chứng từ.

## Concurrency design bắt buộc

Nếu hai nhân viên tạo đơn bán chịu cùng lúc, không được để cả hai cùng đọc một hạn mức cũ rồi vượt hạn mức.

AI phải thiết kế cơ chế reservation/exposure atomic, ví dụ:

- CustomerCreditProfile có `currentExposure`.
- Conditional update chỉ tăng exposure khi `currentExposure + requestedAmount <= creditLimit`.
- Cập nhật exposure, tạo order và receivable trong cùng transaction.
- Khi thu nợ/huỷ đơn/hoàn đơn, exposure giảm đúng một lần.
- Có reconciliation job so sánh currentExposure với tổng remaining receivables.

Không triển khai denormalized exposure nếu không có cơ chế reconcile và chống drift.

## Test cases

| ID | Kịch bản | Kết quả |
|---|---|---|
| AR-T01 | Khách mới chưa được duyệt credit | Không được bán chịu |
| AR-T02 | Hạn mức 10 triệu, dư nợ 9 triệu, đơn mới 2 triệu | Bị chặn hoặc yêu cầu duyệt |
| AR-T03 | Hạn mức 10 triệu, dư nợ 9 triệu, đơn mới 1 triệu | Được phép nếu policy cho phép bằng hạn mức |
| AR-T04 | Khách bị BLOCKED | Không bán chịu |
| AR-T05 | Khách quá hạn theo policy | Chặn hoặc yêu cầu manager override |
| AR-T06 | Thu một phần 2 triệu trên nợ 5 triệu | Remaining còn 3 triệu |
| AR-T07 | Retry thu nợ cùng key | Không cộng collectedAmount hai lần |
| AR-T08 | Hai đơn đồng thời, mỗi đơn 2 triệu, hạn mức còn 3 triệu | Chỉ tổng tối đa 3 triệu được duyệt |
| AR-T09 | Huỷ đơn bán chịu chưa thanh toán | Receivable/exposure được giải phóng đúng một lần |
| AR-T10 | Đơn bán chịu có trả trước một phần | Tách amount paid và amount receivable đúng |
| AR-T11 | Thu tiền vào cash account không tồn tại | Từ chối |
| AR-T12 | Nhân viên không có quyền sửa credit limit | 403 |
| AR-T13 | Manager đổi hạn mức | Audit log ghi old/new value, người duyệt, lý do |
| AR-T14 | Export aging report | Tổng theo bucket khớp từng receivable |

## Acceptance Criteria

- Có hồ sơ tín dụng riêng.
- Bán chịu được kiểm tra ở backend cả POS và WEB (nếu website cho khách sỉ đặt công nợ).
- Thu một phần/thu đủ chạy qua FIN-01.
- Có UI công nợ và aging.
- Không thể vượt hạn mức do race condition.
- Có test reconcile exposure.

---

# TASK POS-CASH-01 — ĐỒNG BỘ POS VỚI SỔ QUỸ VÀ ĐỐI SOÁT CA

**Priority:** P1.

## Mục tiêu

Doanh thu POS, tiền thực thu và sổ quỹ phải được liên kết rõ ràng. Không ghi nhận doanh thu/tiền hai lần và không coi mọi đơn PAID là tiền mặt.

## Khu vực code

- `backend/src/modules/pos/pos.module.ts`
- `backend/src/modules/pos/pos.service.ts`
- `backend/src/modules/pos/schemas/pos-order.schema.ts`
- `backend/src/modules/finance/*`
- `frontend/src/pages/admin/POS.vue`
- Cashbook UI/service.
- Tests POS/finance.

## Việc phải xác minh trước khi code

1. POS hỗ trợ payment method nào: cash, bank transfer, QR, card, split payment, credit sale?
2. POSOrder hiện lưu payment method và payment transaction history ở đâu?
3. `paymentStatus: PAID` có được set khi chưa thực thu không?
4. Có CashEntry `POS_REVENUE` được tạo ở nơi khác không?
5. Có ca bán hàng/cash session chưa?
6. Quy trình refund/void hiện tại là gì?

Không được tạo thêm CashEntry nếu hệ thống đã có integration tương đương.

## Yêu cầu triển khai

- Phân biệt:
  - doanh thu bán hàng;
  - tiền thực thu;
  - công nợ phát sinh;
  - hoàn tiền.
- Mỗi payment component có method, amount, reference, status và idempotency.
- Chỉ phương thức đã thực thu mới làm tăng CashAccount tương ứng.
- Credit sale phải tạo CustomerReceivable, không ghi tiền đã thu.
- Split payment phải tạo từng movement phù hợp.
- POSOrder và các CashEntry/Receivable liên quan phải atomic hoặc qua Outbox có trạng thái/retry rõ ràng.
- Refund phải tạo chứng từ hoàn/đảo có liên kết đơn gốc.
- Không xóa đơn đã ghi nhận; dùng void/refund theo trạng thái.
- Có POS shift/cash session nếu mô hình vận hành yêu cầu:
  - opening cash;
  - cash sales;
  - cash in/out;
  - expected cash;
  - actual cash;
  - variance;
  - người mở/đóng ca.

## Test cases

| ID | Kịch bản | Kết quả |
|---|---|---|
| POS-CASH-T01 | POS bán 500.000đ, khách trả tiền mặt | POSOrder + CashEntry IN + CashAccount tăng 500.000đ |
| POS-CASH-T02 | Khách chuyển khoản vào account ngân hàng | Không cộng vào quỹ tiền mặt; tăng đúng bank account khi xác nhận |
| POS-CASH-T03 | Bán chịu 1 triệu | Tạo receivable; không tăng CashAccount |
| POS-CASH-T04 | Split: 200k cash + 300k bank | Tạo hai payment movements đúng account |
| POS-CASH-T05 | Retry tạo POS order | Không tạo CashEntry trùng |
| POS-CASH-T06 | Lỗi ghi CashEntry sau khi tạo POSOrder | Rollback hoặc Outbox pending có retry an toàn; không báo PAID sai |
| POS-CASH-T07 | Refund một phần | Ghi nhận đúng số tiền hoàn và trạng thái đơn |
| POS-CASH-T08 | Refund toàn bộ | Tổng hoàn không vượt số đã thu |
| POS-CASH-T09 | Đóng ca POS | Expected cash khớp tổng cash movement |
| POS-CASH-T10 | Nhân viên không có quyền refund | 403 |
| POS-CASH-T11 | Đối soát POSOrder với CashEntry | Không có order paid thiếu movement hoặc movement không có reference hợp lệ |

## Acceptance Criteria

- Mỗi khoản thực thu có movement duy nhất.
- Bán chịu không bị ghi nhận thành tiền mặt.
- Refund có liên kết đơn gốc.
- Có báo cáo đối soát POS/Cashbook.
- Retry/concurrency không tạo movement trùng.

---

# TASK FIN-COD-01 — ĐỐI SOÁT THU HỘ COD VÀ CHI PHÍ VẬN CHUYỂN GIAO VẬN (COD & LOGISTICS RECONCILIATION)

**Priority:** P1 — Nghiệp vụ tài chính online.

## Mục tiêu nghiệp vụ

Xây dựng luồng quản lý và đối soát dòng tiền bán lẻ online qua các hãng vận chuyển (GHN, GHTK, Viettel Post, v.v.). Khi đơn hàng giao COD thành công (`DELIVERED`):
- Tiền thu hộ (COD Amount) chưa thể ghi nhận ngay vào tài khoản ngân hàng của nhà sách, mà phải được theo dõi ở trạng thái **COD Đang vận chuyển / Chờ đối soát (COD In-Transit / Pending Reconciliation)**.
- Khi hãng vận chuyển gửi Bảng kê đối soát (Carrier Statement) và chuyển tiền thanh toán thực (Net Payout):
  $$\text{Net Payout} = \text{Tổng tiền thu hộ (COD)} - \text{Cước phí vận chuyển thực tế} - \text{Phí bảo hiểm/Phí chuyển hoàn (nếu có)}$$
- Hệ thống phải đối chiếu tự động/bán tự động từng mã vận đơn (`trackingCode`), cấn trừ công nợ giao vận, ghi nhận doanh thu thực thu vào `CashAccount` ngân hàng, ghi nhận chi phí vận chuyển hợp lệ và gắn cờ xử lý các trường hợp lệch soát (Variance).

## Khu vực code liên quan

- `backend/src/modules/finance/finance.service.ts`
- `backend/src/modules/finance/finance.controller.ts`
- `backend/src/modules/finance/schemas/cash-entry.schema.ts`
- `backend/src/modules/shipping/ghn-shipping.service.ts`
- `backend/src/modules/orders/schemas/order.schema.ts`
- DTO & Controller đối soát vận chuyển mới (`CodReconciliationDto`).
- Frontend: `Cashbook.vue`, `Orders.vue` hoặc màn hình Quản lý đối soát COD.
- Test suites: `finance.service.spec.ts`, `ghn-shipping.service.spec.ts`.

## Quy tắc nghiệp vụ cốt lõi

1. **Vòng đời trạng thái COD của Đơn hàng (COD Lifecycle):**
   ```text
   Order DELIVERED (paymentMethod=COD)
     -> codStatus: PENDING_RECONCILIATION (Ghi nhận nợ hãng vận chuyển)
     -> Import Bảng kê đối soát từ đối tác vận chuyển
     -> Khớp dữ liệu (Tracking Code, COD Amount, Shipping Fee)
     -> codStatus: RECONCILED & paymentStatus: PAID
     -> Nếu lệch tiền: codStatus: DISCREPANCY (Cần kế toán đối soát thủ công)
   ```
2. **Transaction đối soát (Reconciliation Transaction):**
   Trong cùng một MongoDB Session Transaction:
   - Cập nhật danh sách đơn hàng sang `codStatus = RECONCILED`, `paymentStatus = PAID`.
   - Tạo `CashEntry` (IN) cho tổng số tiền COD thực nhận vào Tài khoản ngân hàng (`CashAccount` type=BANK).
   - Tạo `CashEntry` (OUT) cho chi phí cước vận chuyển đối tác đã cấn trừ (hạng mục chi phí vận chuyển).
   - Cập nhật số dư `CashAccount` tăng tương ứng với Net Payout.
   - Ghi nhận `ReconciliationBatch` lưu lịch sử file đối soát, mã phiên, ngày chuyển tiền của nhà vận chuyển.
3. **Xử lý đơn giao thất bại / Hoàn trả (Return Shipping Fee):**
   - Đơn chuyển trạng thái `RETURNED`: Tiền COD = 0 đ.
   - Bảng kê ghi nhận cước vận chuyển chuyển hoàn (Phí quay đầu): Hệ thống ghi nhận chi phí cước hoàn (CashEntry OUT), không ghi nhận tiền thu hộ.
4. **Idempotency & Concurrency:**
   - Mỗi bảng kê đối soát có `statementId` / `reconciliationCode` duy nhất.
   - Không được phép đối soát 2 lần trên cùng một mã vận đơn đã `RECONCILED`.

## Bảng Test Cases bắt buộc

| ID | Kịch bản kiểm thử | Kết quả mong đợi |
|---|---|---|
| FIN-COD-T01 | Bảng kê đối soát 10 đơn COD giao thành công, khớp 100% số tiền | 10 đơn chuyển `RECONCILED` + `PAID`; Tạo 1 CashEntry IN (tiền COD), 1 CashEntry OUT (cước phí); Số dư tài khoản ngân hàng tăng đúng Net Payout |
| FIN-COD-T02 | Bảng kê chứa mã vận đơn không tồn tại trong hệ thống | Báo lỗi dòng không hợp lệ trong báo cáo import, không làm gián đoạn các dòng hợp lệ (nếu bật `skipErrors`) |
| FIN-COD-T03 | Đơn hàng chưa ở trạng thái `DELIVERED` hoặc `RETURNED` nhưng có trong bảng kê | Đưa vào danh sách cảnh báo bất thường (Warning/Discrepancy); Chờ kế toán xác nhận |
| FIN-COD-T04 | Tiền COD trên bảng kê thấp hơn tiền COD trên đơn hàng | Gắn cờ `DISCREPANCY`; Không tự ý ghi nhận hoàn tất; Lưu lý do lệch số tiền |
| FIN-COD-T05 | Đơn hàng hoàn trả (RETURNED) bị tính cước vận chuyển hoàn | Tiền thu COD ghi nhận 0 đ; Ghi nhận chi phí cước hoàn chính xác |
| FIN-COD-T06 | Import lại cùng một bảng kê đối soát lần thứ 2 | Idempotency chặn lại: Không tạo thêm CashEntry và không cộng tiền tài khoản lần 2 |
| FIN-COD-T07 | Hai nhân viên cùng bấm duyệt đối soát cho cùng 1 lô đơn hàng | Concurrency safety: Chỉ 1 request được xử lý thành công, request thứ hai trả về trạng thái đã duyệt |
| FIN-COD-T08 | Lỗi hệ thống giữa chừng (ví dụ ghi sổ quỹ thất bại) | Rollback toàn bộ session: Trạng thái các đơn hàng giữ nguyên `PENDING_RECONCILIATION` |
| FIN-COD-T09 | Lọc và export danh sách đơn hàng COD đang chờ đối soát | Xuất đúng danh sách kèm tổng số tiền COD đang nằm ở nhà vận chuyển |
| FIN-COD-T10 | Nhân viên không có quyền `MANAGE_FINANCE` gọi API đối soát COD | Trả về HTTP 403 Forbidden |

## Acceptance Criteria

- Quản lý tách biệt tiền bán hàng COD chưa về và tiền đã vào tài khoản ngân hàng.
- Bảng kê đối soát ghi nhận rõ ràng Net Payout và Chi phí cước vận chuyển.
- Xử lý mượt mà cả đơn giao thành công lẫn đơn chuyển hoàn.
- Cơ chế Idempotent chống ghi trùng tiền khi đối tác gửi lại bảng kê.
- Có báo cáo công nợ tồn đọng theo từng đối tác vận chuyển (GHN, GHTK...).

---

# TASK XLS-01 — SỬA PIPELINE PREVIEW/EXECUTE IMPORT EXCEL

**Priority:** P2.

## Mục tiêu

Preview và Execute phải dùng cùng một logic validation. Dòng đã invalid ở Preview không được import khi bật `skipErrors`.

## Khu vực code

- `backend/src/modules/data-exchange/data-exchange.controller.ts`
- `backend/src/modules/data-exchange/data-exchange.service.ts`
- DTO/schema data exchange.
- Product/Supplier/Inventory services.
- Frontend import UI.
- Test data-exchange.

## Yêu cầu triển khai

### XLS-01.1 — Shared validation pipeline

Tách thành các hàm:

- parse workbook;
- normalize row;
- validate row;
- map normalized row sang command;
- execute valid row;
- build import result.

Preview và Execute phải dùng chung normalized data và validation rules. Không viết hai bộ logic khác nhau.

### XLS-01.2 — Kết quả từng dòng

Mỗi dòng có:

- rowNumber;
- entityType;
- normalizedData (không trả field nhạy cảm);
- isValid;
- validationErrors[];
- warning[];
- executionStatus;
- entityId nếu thành công.

Tổng số dòng phải thỏa:

`totalRows = validRows + invalidRows + skippedRows` (theo định nghĩa rõ, không đếm trùng).

### XLS-01.3 — skipErrors

- `skipErrors=false`: nếu có lỗi, không thực thi batch hoặc yêu cầu người dùng sửa trước.
- `skipErrors=true`: chỉ thực thi dòng `isValid=true`.
- Dòng invalid phải nằm trong error report, không được âm thầm import.
- `success` không được true khi có failed rows mà không có field `partialSuccess` rõ ràng.
- Response phải có `successCount`, `failedCount`, `skippedCount`, `partialSuccess`, `batchId`.

### XLS-01.4 — Quy tắc dữ liệu

- Không dùng `Number(value) || 0` để biến dữ liệu thiếu thành 0 nếu 0 không hợp lệ.
- SKU trùng trong cùng file phải được phát hiện.
- SKU đã tồn tại phải có chính sách rõ: create, update, skip hoặc reject.
- Không âm thầm bỏ qua opening stock = 0.
- Phân biệt thiếu giá, giá 0 và giá null.
- Không tự tạo category mặc định nếu template yêu cầu category bắt buộc, trừ khi user chọn rõ chế độ.
- Phân biệt import product master với import opening stock.
- Import lại cùng batch không được tạo inventory movement trùng.

### XLS-01.5 — Import batch/audit

Lưu ImportBatch:

- batchId;
- fileName (sanitize);
- fileHash;
- importType;
- uploadedBy;
- createdAt;
- status;
- total/success/failed/skipped;
- options;
- result summary.

Không lưu file chứa dữ liệu nhạy cảm lâu hơn chính sách retention. Nếu lưu file gốc, phải có access control.

### XLS-01.6 — Rollback

Không tự ý rollback các import đã tạo side effect nếu không có thiết kế. Đề xuất:
- Preview/dry-run.
- Execute.
- Nếu entity hỗ trợ, rollback bằng reverse transaction hoặc import correction batch.
- Inventory opening balance phải rollback bằng inventory adjustment ledger, không xóa ledger đã ghi sổ.

## Test cases

| ID | Kịch bản | Kết quả |
|---|---|---|
| XLS-T01 | Supplier thiếu phone, skipErrors=true | Dòng invalid không được import |
| XLS-T02 | Product thiếu category | Invalid và không tạo product |
| XLS-T03 | Product thiếu price | Invalid, không tự đổi thành 0 |
| XLS-T04 | Product price = 0 | Áp dụng rule cho phép/không cho phép rõ ràng |
| XLS-T05 | Opening stock = 0 | Có kết quả rõ, không âm thầm bỏ qua |
| XLS-T06 | SKU trùng trong cùng file | Preview báo đúng dòng trùng |
| XLS-T07 | 99 dòng valid, 1 invalid, skipErrors=true | Import 99, báo 1 lỗi |
| XLS-T08 | 1 dòng invalid, skipErrors=false | Không execute batch |
| XLS-T09 | Execute cùng batch 2 lần | Không nhân đôi inventory opening movement |
| XLS-T10 | File hash đã import trước đó | Cảnh báo duplicate/re-import theo policy |
| XLS-T11 | Lỗi giữa batch | Batch có trạng thái rõ; không báo success giả |
| XLS-T12 | Export error report | Có row number, column, error message |
| XLS-T13 | Import product SKU tồn tại | Update/skip/reject theo lựa chọn và audit |
| XLS-T14 | User không có quyền import type đó | 403 |

## Acceptance Criteria

- Shared validator.
- Invalid rows không bao giờ được execute khi skipErrors.
- Có import history và row-level errors.
- Import idempotent theo batch/row policy.
- Không có success giả.
- Có test với file nhiều dòng và file lỗi.

---

# TASK SEC-01 — BẢO VỆ ENDPOINT UPLOAD EXCEL

**Priority:** P2 — Security.

## Khu vực code

- `backend/src/modules/data-exchange/data-exchange.controller.ts`
- `backend/src/modules/data-exchange/data-exchange.service.ts`
- NestJS Multer/FileInterceptor config.
- Security tests.

## Yêu cầu

1. Giới hạn file size bằng `limits.fileSize` phù hợp cấu hình môi trường.
2. Chỉ nhận `.xlsx` nếu hệ thống chỉ hỗ trợ xlsx.
3. Kiểm tra extension, MIME và file signature/workbook thực tế; không tin một yếu tố đơn lẻ.
4. Giới hạn:
   - số sheet;
   - số row;
   - số column;
   - số cell;
   - độ dài chuỗi;
   - thời gian parse.
5. Từ chối workbook corrupt hoặc có cấu trúc bất thường.
6. Có rate limit cho endpoint upload.
7. Không lưu file tạm vô thời hạn.
8. Sanitize filename.
9. Không log toàn bộ nội dung file.
10. Có cấu hình limit theo environment, không hardcode rải rác.
11. Trả lỗi HTTP rõ: 400/413/415/429 tùy trường hợp.
12. Nếu có malware scanning service sẵn có, tích hợp theo kiến trúc; không tự tạo service giả.

## Test cases

| ID | Kịch bản | Kết quả |
|---|---|---|
| SEC-01-T01 | File vượt max size | HTTP 413 |
| SEC-01-T02 | File `.exe` đổi tên `.xlsx` | Bị từ chối |
| SEC-01-T03 | File zip không phải Excel hợp lệ | Bị từ chối |
| SEC-01-T04 | Workbook vượt max rows | Bị từ chối |
| SEC-01-T05 | Workbook có quá nhiều sheet | Bị từ chối |
| SEC-01-T06 | Upload liên tục vượt rate limit | HTTP 429 |
| SEC-01-T07 | Filename có path traversal | Tên được sanitize, không ghi file ra path tùy ý |
| SEC-01-T08 | Parse lỗi giữa chừng | Giải phóng tài nguyên, không tạo batch nửa vời |
| SEC-01-T09 | Upload file hợp lệ trong giới hạn | Preview hoạt động bình thường |

## Acceptance Criteria

- Có file size/type/row limits.
- Có tests cho oversize, MIME spoofing, corrupt workbook, rate limit.
- Không làm hỏng import file hợp lệ.
- Không lộ thông tin nhạy cảm trong log.

---

# TASK SEC-02 — PHÂN QUYỀN IMPORT/EXPORT THEO ENTITY TYPE

**Priority:** P2 — Security.

## Vấn đề cần xác minh

PermissionsGuard có thể dùng logic OR giữa các quyền. Nếu controller gắn `MANAGE_PRODUCTS` hoặc `MANAGE_INVENTORY` cho toàn bộ route Data Exchange, user có một quyền có thể import loại dữ liệu không thuộc trách nhiệm của mình.

## Khu vực code

- `backend/src/common/guards/permissions.guard.ts`
- `backend/src/common/decorators/permissions.decorator.ts`
- `backend/src/common/enums/*`
- `backend/src/modules/data-exchange/data-exchange.controller.ts`
- Role/permission seed.
- RBAC tests.

## Yêu cầu

1. Xác định permission hiện có, không tự giả định enum `MANAGE_SUPPLIERS` tồn tại.
2. Xây dựng mapping theo entity:
   - products → quyền quản lý sản phẩm;
   - suppliers → quyền quản lý nhà cung cấp (nếu chưa có, bổ sung permission + seed + migration);
   - opening_stock → quyền quản lý tồn kho.
3. Preview và Execute có thể có quyền khác nhau:
   - xem/preview;
   - thực thi import.
4. Không làm thay đổi semantics của các controller khác khi sửa PermissionsGuard.
5. Admin/Super Admin bypass phải rõ ràng và được test.
6. Không dựa vào frontend route guard.

## Permission matrix bắt buộc

| Role/Permission | Import products | Import suppliers | Import opening stock |
|---|---:|---:|---:|
| SUPER_ADMIN | Allow | Allow | Allow |
| ADMIN | Theo policy admin | Theo policy admin | Theo policy admin |
| MANAGE_PRODUCTS | Allow | Deny | Deny |
| MANAGE_SUPPLIERS | Deny | Allow | Deny |
| MANAGE_INVENTORY | Deny | Deny | Allow |
| POS_ACCESS only | Deny | Deny | Deny |
| CUSTOMER | Deny | Deny | Deny |

Nếu tên quyền khác trong source code, map sang tên thực tế và ghi rõ.

## Test cases

- Mỗi permission gọi từng endpoint và xác nhận đúng allow/deny.
- User có hai permission chỉ được thao tác đúng các entity tương ứng.
- User không có permission bị 403 dù gọi API trực tiếp.
- SUPER_ADMIN có quyền theo policy.
- Kiểm tra cả preview và execute.
- Kiểm tra không ảnh hưởng endpoint khác dùng `@Permissions`.

## Acceptance Criteria

- Có test matrix.
- Không có quyền quá rộng.
- Permission mới được seed/migrate an toàn.
- Guard dùng chung không làm hỏng các module khác.

---

# TASK CASH-01 — EXPORT SỔ QUỸ PHẢI KHỚP BỘ LỌC VÀ ĐỦ DỮ LIỆU

**Priority:** P2.

## Khu vực code

- `frontend/src/pages/admin/Cashbook.vue`
- `frontend/src/services/finance.service.ts`
- `backend/src/modules/finance/finance.service.ts`
- Finance controller/DTO.
- Export tests.

## Mục tiêu

Khi người dùng lọc dữ liệu trên Cashbook và bấm Export, file Excel phải có đúng tập dữ liệu đang xem hoặc bộ lọc đang chọn.

## Yêu cầu

1. Chuẩn hóa filter DTO dùng chung cho list và export:
   - search;
   - accountId;
   - direction;
   - category;
   - status;
   - startDate;
   - endDate;
   - referenceType/referenceId nếu hỗ trợ.
2. Frontend truyền toàn bộ filter hiện tại vào export.
3. Backend dùng chung query builder/filter builder cho list và export.
4. Không dùng limit 5000 rồi âm thầm cắt dữ liệu.
5. Với dữ liệu lớn, dùng cursor/chunk/streaming hoặc tạo export job.
6. File cần có:
   - danh sách phiếu;
   - tổng thu;
   - tổng chi;
   - số dư đầu kỳ;
   - số dư cuối kỳ;
   - thời gian export;
   - người export;
   - bộ lọc đã dùng.
7. Nếu export async, có trạng thái job và link tải có quyền truy cập.

## Test cases

| ID | Kịch bản | Kết quả |
|---|---|---|
| CASH-T01 | Filter account A | Excel chỉ có account A |
| CASH-T02 | Filter direction OUT | Excel chỉ có phiếu chi |
| CASH-T03 | Filter date range | Không có record ngoài khoảng |
| CASH-T04 | Search theo mã phiếu | Kết quả khớp list |
| CASH-T05 | Kết hợp nhiều filter | Excel khớp query list |
| CASH-T06 | Có trên 5.000 record | Không mất dữ liệu âm thầm |
| CASH-T07 | Không có dữ liệu | File hợp lệ, có thông báo không có record |
| CASH-T08 | User không có VIEW_FINANCE/permission phù hợp | 403 |
| CASH-T09 | Tổng thu/chi Excel | Khớp API summary và màn hình |

## Acceptance Criteria

- List/export dùng chung filter logic.
- Không còn giới hạn âm thầm.
- Có test trên 5.000 record hoặc test streaming/chunk.
- Tổng số liệu khớp.

---

# TASK DOC-01 — ĐỒNG BỘ TÀI LIỆU VỚI SOURCE CODE

**Priority:** P2.

## Khu vực

- `README.md`
- `AGENTS.md`
- `docs/PROJECT_OVERVIEW.md`
- `docs/PENDING_TASKS.md`
- Các docs kiến trúc/module/QA nếu có.

## Yêu cầu

1. Đọc source tree mới nhất và liệt kê module thật.
2. Đồng bộ module map, kiến trúc backend/frontend/mobile.
3. Đồng bộ lệnh cài đặt, test, lint, build, deploy.
4. Cập nhật trạng thái task đã hoàn thành.
5. Không để một task vừa được đánh dấu completed ở bảng trên nhưng nội dung bên dưới vẫn nói chưa triển khai.
6. Lint warning budget trong docs phải khớp `package.json`.
7. Test count phải ghi kèm commit/ngày hoặc không ghi số tuyệt đối.
8. Ghi rõ môi trường nào hỗ trợ MongoDB transaction.
9. Ghi rõ cách chạy integration test với replica set.
10. Không đưa secret, URL database có credential hoặc thông tin production nhạy cảm vào docs.

## Test/Acceptance

- Tên module trong docs khớp source tree.
- Lệnh trong docs chạy được hoặc ghi rõ prerequisite.
- Không còn task status mâu thuẫn.
- Có phần architecture flow cho:
  - nhập hàng;
  - trả hàng;
  - POS;
  - công nợ;
  - cashbook;
  - Excel import/export.

---

# TASK ACC-01 — KHẢO SÁT VÀ ĐẶC TẢ KẾ TOÁN/TAX (CHƯA CODE GENERAL LEDGER)

**Priority:** P1 Planning.

## Mục tiêu

Xác định hệ thống cần quản lý tài chính ở mức nào và chuẩn bị đặc tả có kế toán/đơn vị tư vấn xác nhận. Không tự động viết quy tắc thuế dựa trên suy đoán của AI.

## Hiện trạng cần xác minh

Finance hiện có thể gồm CashAccount, CashEntry, SupplierPayable, CustomerReceivable. Cần xác minh xem source mới nhất đã có accounting/general ledger/tax module nào chưa.

## BA phải thu thập

1. Thông tin pháp lý doanh nghiệp/hộ kinh doanh.
2. Mô hình bán lẻ/bán sỉ.
3. Loại hóa đơn đầu vào/đầu ra.
4. Cách ghi nhận doanh thu.
5. VAT/tax code theo hàng hóa/dịch vụ.
6. Cách tính giá vốn được kế toán chấp nhận.
7. Kỳ kế toán và thời điểm khóa sổ.
8. Cách xử lý hàng trả, giảm giá, voucher, chiết khấu.
9. Cách đối chiếu ngân hàng.
10. Dữ liệu kế toán cần xuất cho đơn vị dịch vụ/kế toán.
11. Nhà cung cấp hóa đơn điện tử đang sử dụng (nếu có).
12. Mẫu báo cáo kế toán/thuế cần có.

## Đề xuất module để phân tích

- Chart of Accounts.
- Journal Entry / Double-entry.
- General Ledger.
- Accounts Payable / Receivable sub-ledger.
- VAT input/output.
- Purchase/Sales invoice.
- Bank reconciliation.
- Accounting period/closing.
- Audit trail.
- E-invoice integration.
- Tax/report export.

## Deliverables

- `docs/ACCOUNTING_TAX_REQUIREMENTS.md`
- Business flow.
- Data dictionary.
- Accounting event matrix.
- Mapping chứng từ → bút toán dự kiến (chỉ sau khi kế toán xác nhận).
- Danh sách câu hỏi cần kế toán trả lời.
- Estimate và phase triển khai.

## Không được làm

- Không tự kết luận thuế suất.
- Không tự tạo báo cáo kê khai được tuyên bố hợp pháp khi chưa được kế toán xác nhận.
- Không coi PDF phiếu bán hàng nội bộ là hóa đơn điện tử hợp lệ.
- Không thay đổi cách tính giá vốn hoặc ghi nhận doanh thu hiện hành khi chưa có approval.

## Acceptance Criteria

Có tài liệu BA hoàn chỉnh, được chủ doanh nghiệp/kế toán review trước khi viết code.

---

# PHẦN D — CÁC FEATURE GAP SAU KHI SỬA BUG P1/P2

Đây là các chức năng phát triển tiếp theo, không được trộn vào các PR sửa bug ở phần C.

# FEATURE INV-02 — QUẢN LÝ NHIỀU KHO

## Mục tiêu

Hỗ trợ kho tổng, kho cửa hàng, kho online, kho hàng lỗi/hỏng, kho chờ kiểm và nhiều chi nhánh.

## Yêu cầu BA/Tech

- Warehouse.
- WarehouseLocation/Bin.
- Inventory theo product + warehouse + location.
- StockTransfer request/approve/ship/receive.
- Stock reservation theo order/channel.
- Stock count theo warehouse/location.
- Quarantine/damaged stock.
- Ledger vẫn là nguồn sự thật.
- Migration từ mô hình một inventory/product sang product + warehouse phải bảo toàn số lượng và lịch sử.

## Test cases

- Chuyển 10 sản phẩm từ kho A sang B.
- Xuất kho A nhưng chưa nhận kho B: trạng thái in-transit.
- Nhận thiếu hàng: ghi nhận variance.
- Hai order đồng thời reserve cùng tồn: không oversell.
- Hàng hỏng chuyển sang quarantine không còn bán được.
- Kiểm kê điều chỉnh có duyệt và audit.
- User chỉ được xem kho được phân quyền nếu có policy kho.

---

# FEATURE DOC-02 — DOCUMENT CENTER / QUẢN LÝ CHỨNG TỪ ĐIỆN TỬ

## Mục tiêu

Giảm giấy tờ, tập trung chứng từ mua hàng, bán hàng, thu chi, kho và file đính kèm.

## Nhóm chứng từ

- Purchase Request.
- Purchase Order.
- Goods Receipt.
- Supplier Return.
- Cash Receipt/Payment.
- Customer Receipt.
- Inventory Adjustment.
- Stock Transfer.
- Sales Order/POS Receipt.
- Supplier Invoice.
- Sales Invoice.
- Bank Statement.
- Biên bản kiểm kê.
- Hợp đồng/báo giá.

## Yêu cầu chung

- Mã chứng từ duy nhất.
- Loại chứng từ.
- Ngày tạo/ngày ghi sổ.
- Người tạo/người duyệt.
- Trạng thái.
- Đối tượng liên quan.
- File PDF/ảnh/XML.
- Liên kết chứng từ gốc.
- Audit log.
- Permission xem/tải/sửa.
- Chứng từ đã ghi sổ không được sửa trực tiếp.
- Điều chỉnh bằng chứng từ điều chỉnh/đảo.

## Test cases

- Upload file hợp lệ.
- Upload file quá lớn/không đúng loại.
- User không có quyền không xem được chứng từ.
- Chứng từ đã POSTED không sửa được.
- Reversal liên kết đúng chứng từ gốc.
- File đính kèm không thể truy cập bằng URL công khai không bảo vệ.

---

# FEATURE CRM-01 — QUẢN LÝ KHÁCH SỈ/LẺ, HẠNG KHÁCH VÀ ƯU TIÊN CHĂM SÓC

## Mục tiêu

Tăng khả năng giữ khách, quản lý giá và công nợ theo từng nhóm khách.

## Nhóm khách đề xuất

- Retail.
- Wholesale.
- School.
- Office.
- Reseller.
- Corporate/Contract.

## Dữ liệu

- Customer type.
- Tier.
- Doanh số 30/90/365 ngày.
- Số đơn.
- Giá trị đơn trung bình.
- Lịch sử mua.
- Công nợ.
- Số ngày quá hạn.
- Credit limit.
- Payment terms.
- Giá riêng.
- Voucher/loyalty.

## Rule cần cấu hình

- Tier không chỉ dựa trên doanh số; phải xét nợ quá hạn, trạng thái khách và policy.
- Giá sỉ theo tier không được làm margin xuống dưới floor mà không có approval.
- Khách bị khóa tín dụng vẫn có thể mua trả trước nếu policy cho phép.
- Voucher không được cộng dồn ngoài quy tắc.
- Thay đổi tier phải có audit.

---

# FEATURE PUR-02 — QUẢN LÝ BÁO GIÁ VÀ TỐI ƯU NGUỒN HÀNG

## Mục tiêu

Chọn NCC tốt nhất theo giá, chất lượng, thời gian giao, MOQ và điều khoản thanh toán.

## Chức năng

- RFQ/Request for Quotation.
- Nhiều báo giá cho cùng product.
- Supplier price history.
- MOQ/lead time.
- Giá theo bậc số lượng.
- Điều khoản thanh toán.
- Tỷ lệ giao đủ/đúng hẹn.
- Tỷ lệ lỗi/đổi trả.
- So sánh NCC.
- Purchase recommendation.

## Test cases

- So sánh 3 NCC cùng SKU.
- NCC giá thấp nhưng lead time dài.
- NCC có MOQ lớn.
- NCC có tỷ lệ hàng lỗi cao.
- Báo giá hết hạn.
- PO tạo từ báo giá đã duyệt.
- Thay đổi giá sau khi PO duyệt không được làm thay đổi snapshot PO.

---

# PHẦN E — TEST MATRIX XUYÊN PHÂN HỆ BẮT BUỘC

Sau khi hoàn thành các task riêng lẻ, AI phải tạo integration test cho toàn bộ flow.

## E1. Nhập hàng và công nợ NCC

```text
Supplier
  -> Purchase Order
  -> Approve PO
  -> Goods Receipt
  -> Inventory Ledger
  -> Inventory Balance
  -> Supplier Payable
  -> Supplier Payment
  -> CashEntry
  -> CashAccount
```

Kiểm tra:

- PO đúng NCC.
- Nhận thiếu/thừa.
- Hàng lỗi.
- Giá vốn.
- AP phát sinh đúng.
- Thanh toán một phần/nhiều lần.
- Retry.
- Rollback.
- Đối soát tồn và AP.

## E2. Trả hàng NCC

```text
Goods Receipt
  -> Purchase Return
  -> Validate Returnable Quantity
  -> Inventory Return/Damage Movement
  -> Inventory Balance
  -> Supplier Credit
  -> Payable Offset / Supplier Refund Receivable
  -> Supplier Refund CashEntry (khi NCC hoàn)
```

Kiểm tra:

- Không trả vượt số lượng.
- Không trả hai lần.
- Không trừ kho sai.
- Không bù trừ AP hai lần.
- Phần NCC phải hoàn không bị mất.

## E3. Bán lẻ POS

```text
POS
  -> Server-side Pricing
  -> Validate Inventory
  -> Create POSOrder
  -> Inventory Sale Movement
  -> Payment Allocation
  -> CashEntry
  -> CashAccount
  -> Cashbook/Shift Reconciliation
```

Kiểm tra:

- Giá đúng.
- Margin đúng.
- Tồn kho đúng.
- Payment method đúng.
- Không ghi tiền hai lần.
- Refund đúng.

## E4. Bán sỉ có công nợ

```text
Customer Credit Profile
  -> Credit Limit Check/Reservation
  -> Wholesale Price Policy
  -> Create Order/POSOrder
  -> Inventory Movement/Reservation
  -> Customer Receivable
  -> Due Date/Aging
  -> Partial/Full Collection
  -> CashEntry
  -> CashAccount
  -> Receivable Update
```

Kiểm tra:

- Không vượt hạn mức.
- Không bán chịu khách bị block.
- Thu nợ đúng.
- Retry không ghi trùng.
- Hủy/hoàn đơn giải phóng exposure đúng.

## E5. Excel import

```text
Upload
  -> File Validation
  -> Parse
  -> Normalize
  -> Preview
  -> Row Validation
  -> User Confirm
  -> Execute Valid Rows
  -> Import Batch Result
  -> Audit Log
  -> Error Excel
```

Kiểm tra:

- Invalid row không được import.
- Skip errors đúng.
- Retry batch không nhân đôi.
- Permission đúng.
- File size/type được giới hạn.

---

# PHẦN F — YÊU CẦU QA, SECURITY, DEVOPS VÀ RELEASE

## F1. Unit test

Test:
- Validation.
- Calculation.
- State transition.
- Idempotency payload hash.
- Permission mapping.
- Price precedence.
- Credit limit calculation.
- Returnable quantity.
- Excel row normalization.

## F2. Integration test

Dùng MongoDB replica set test environment để xác minh transaction thật. Không chỉ mock session.

Test:
- Commit.
- Rollback.
- Duplicate key.
- Concurrent requests.
- Optimistic concurrency.
- Index creation.
- Migration từ dữ liệu cũ.

## F3. E2E

Các luồng tối thiểu:
- Admin tạo NCC → tạo PO → nhận hàng.
- Trả hàng NCC.
- Thanh toán NCC.
- Tạo khách sỉ → duyệt hạn mức → bán chịu.
- Thu nợ một phần.
- POS bán tiền mặt.
- POS bán chuyển khoản.
- POS bán chịu.
- Export cashbook.
- Import Excel preview/execute.

## F4. Security

- RBAC backend.
- IDOR trên resource IDs.
- Upload file abuse.
- Rate limit.
- Input validation.
- Mass assignment.
- Audit log.
- Không lộ secrets.
- Không để staff tự nâng quyền/credit limit/giá vốn.
- Không cho customer gọi admin API.
- Không tin dữ liệu tính toán từ client.

## F5. DevOps

- Kiểm tra MongoDB replica set ở staging/production.
- Backup định kỳ.
- Test restore backup.
- Có migration/index deployment plan.
- Không chạy migration phá dữ liệu trực tiếp không có backup.
- Có health check.
- Có structured logging và request correlation ID.
- Có cảnh báo khi Outbox pending quá lâu.
- Có cảnh báo khi CashEntry và POSOrder/Payable/Receivable không reconcile.
- Có staging smoke test trước production.

## F6. Go/No-Go

Không release nếu còn một trong các điều kiện:

- Thu/chi có thể ghi trùng.
- AP/AR có thể lệch so với CashEntry.
- Reversal có thể chạy hai lần.
- Trả hàng có thể trừ kho vượt quantity.
- Price policy có thể bypass qua API.
- Credit limit có thể vượt do concurrency.
- Import invalid row vẫn tạo dữ liệu.
- Staff có thể import sai entity type.
- Export bị mất dữ liệu âm thầm.
- CI test quan trọng thất bại.
- Migration/index chưa được xác minh.
- Không có backup/restore plan.

---

# PHẦN G — LỆNH GIAO VIỆC CHO AI THEO TỪNG LẦN

## G1. Prompt khởi động dự án

Dán đoạn sau vào AI Coding Agent khi bắt đầu:

```text
Hãy đọc toàn bộ file AI_IMPLEMENTATION_PLAYBOOK_TRUONG_THANH_BOOKSTORE.md.

Bạn đang làm việc trên repository hiện hữu Trường Thành Bookstore. Không được rewrite dự án.

Bước đầu tiên chỉ làm TASK BASE-00:
- Đọc AGENTS.md và tài liệu kiến trúc.
- Kiểm tra branch/commit/git status.
- Đọc module liên quan.
- Xác minh từng finding.
- Chạy test baseline.
- Báo cáo root cause và trạng thái OPEN/ALREADY_FIXED/NOT_REPRODUCED/BLOCKED.

Không sửa các task khác cho tới khi tôi duyệt kết quả BASE-00.

Khi báo cáo, dùng đúng format A7 trong tài liệu.
```

## G2. Prompt thực hiện một task

Sau khi BASE-00 được duyệt, dùng prompt:

```text
Hãy thực hiện duy nhất TASK [TASK_ID] trong
AI_IMPLEMENTATION_PLAYBOOK_TRUONG_THANH_BOOKSTORE.md.

Bắt buộc:
1. Đọc lại code mới nhất và xác minh finding.
2. Không giả định line number/tên function từ báo cáo cũ là chính xác.
3. Phân tích root cause trước khi sửa.
4. Nêu transaction boundary, state transition, idempotency, concurrency, RBAC và migration.
5. Chỉ sửa đúng phạm vi task.
6. Viết test cho happy path, invalid input, retry, duplicate, concurrency và rollback nếu liên quan.
7. Không xóa test cũ, không tắt lint/typecheck/security.
8. Chạy test thực tế và ghi rõ kết quả.
9. Review diff và kiểm tra các caller bị ảnh hưởng.
10. Báo cáo theo format A7.

Nếu task phụ thuộc vào quyết định nghiệp vụ chưa rõ, dừng ở phần đó, nêu câu hỏi cụ thể và không tự đoán.
Không bắt đầu task tiếp theo khi task hiện tại chưa đạt Acceptance Criteria.
```

## G3. Prompt review độc lập sau khi AI code xong

```text
Hãy review độc lập phần code vừa sửa như một Senior Engineer + QA + Security Engineer.

Không tin mô tả của người code. Hãy đọc diff và kiểm tra:
- Có xử lý đúng root cause không?
- Có race condition không?
- Có retry làm side effect hai lần không?
- Có transaction rollback thật không?
- Có thiếu unique index/migration không?
- Có thể bypass bằng gọi API trực tiếp không?
- Có lỗi rounding/tiền/quantity không?
- Có backward compatibility không?
- Test có thực sự kiểm tra database hay chỉ mock?
- Có test concurrency và failure injection không?
- Có thay đổi ngoài phạm vi không?

Nếu phát hiện lỗi, liệt kê file/function, tình huống tái hiện và yêu cầu sửa. Không tự kết luận pass khi chưa có bằng chứng.
```

## G4. Prompt release readiness

```text
Hãy thực hiện release readiness review cho các task đã merge.

1. Chạy lại test backend/frontend/E2E liên quan.
2. Kiểm tra MongoDB indexes và migrations.
3. Kiểm tra RBAC matrix.
4. Chạy integration flow nhập hàng, trả hàng, bán POS, bán chịu, thu nợ, export/import.
5. Kiểm tra reconciliation:
   - Inventory ledger vs inventory balance.
   - POSOrder vs CashEntry.
   - SupplierPayable vs CashEntry/payment history.
   - CustomerReceivable vs CashEntry/collection history.
6. Kiểm tra backup/restore và staging smoke test.
7. Lập bảng GO/NO-GO.
8. Liệt kê mọi rủi ro còn lại.

Không deploy production nếu còn lỗi P1 hoặc dữ liệu tài chính/kho không reconcile.
```

---

# PHẦN H — DEFINITION OF DONE CHUNG

Một task chỉ được coi là DONE khi đáp ứng đủ:

- [ ] Root cause đã được xác minh.
- [ ] Có thiết kế flow trước/sau.
- [ ] Code đúng phạm vi.
- [ ] Không có secret hoặc dữ liệu production trong diff.
- [ ] Có validation DTO/backend.
- [ ] Có RBAC nếu endpoint cần bảo vệ.
- [ ] Có transaction nếu nhiều side effects.
- [ ] Có idempotency nếu thao tác có thể retry.
- [ ] Có test happy path.
- [ ] Có test invalid input.
- [ ] Có test duplicate/retry.
- [ ] Có test concurrency nếu có race condition.
- [ ] Có test rollback/failure injection.
- [ ] Có test permission.
- [ ] Có migration/index nếu cần.
- [ ] Backend test/lint/build pass.
- [ ] Frontend typecheck/lint/build pass nếu có thay đổi UI.
- [ ] E2E pass nếu có thay đổi flow người dùng.
- [ ] Đã review diff.
- [ ] Docs đã cập nhật.
- [ ] Có hướng dẫn manual QA.
- [ ] Không còn P1 blocker.

---

# KẾT LUẬN VÀ CHỈ THỊ CUỐI

AI phải hiểu đây là một dự án quản lý doanh nghiệp, không chỉ là website bán hàng.

**Thứ tự ưu tiên không được đảo:**

1. Đúng tiền.
2. Đúng công nợ.
3. Đúng tồn kho.
4. Đúng giá vốn/giá bán/lợi nhuận.
5. Đúng phân quyền.
6. Đúng import/export và chứng từ.
7. Sau đó mới mở rộng dashboard, CRM, nhiều kho, Document Center và kế toán.

Không chạy một prompt “fix all” để AI sửa hàng loạt. Hãy làm từng task, review, test, merge rồi mới chuyển task tiếp theo. Một nghiệp vụ tài chính hoặc kho chỉ được coi là hoàn thiện khi retry, concurrency, rollback và đối soát đều đúng.
