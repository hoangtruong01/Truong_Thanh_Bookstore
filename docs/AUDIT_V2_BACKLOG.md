<USER_REQUEST>
# TRƯỜNG THÀNH BOOKSTORE — AUDIT V2 & UPGRADE BACKLOG

**Ngày rà soát:** 30/10/2026

**Repository:** https://github.com/hoangtruong01/Truong_Thanh_Bookstore

**Commit kiểm tra:** `5d841f809b2b1f3a0a44c1d8a0971270ab1eebce`

**Mục tiêu:** Hoàn thiện phần mềm quản lý cửa hàng sách và văn phòng phẩm, phục vụ bán hàng online, bán hàng tại quầy POS, nhân viên, kho, nhập hàng, nhà cung cấp, giá vốn và báo cáo quản trị.

**Phạm vi loại trừ:** Không chỉnh sửa các cổng thanh toán hoặc tích hợp thanh toán.

**Lưu ý:** Các task P0/P1 dưới đây được xác định thông qua phân tích code. AI phải tái kiểm chứng trên code hiện hành, bổ sung test và không tự ý sửa dữ liệu production.

---

## NHÓM 1 — SỬA NGAY CÁC RỦI RO TRONG POS

### NEW-001 — Khóa quyền giảm giá tại quầy [P0]

**File:** `backend/src/modules/pos/pos.service.ts`

**Vấn đề:**
Hệ thống có cơ chế kiểm soát chiết khấu trên 20%, nhưng nhân viên thông thường vẫn có thể áp dụng nếu nhập lý do đủ dài. Ngoài ra, chiết khấu từng dòng sản phẩm chưa được cộng vào tổng mức giảm để kiểm tra quyền.

**Yêu cầu sửa:**
- Backend tính tổng mức giảm từ từng dòng và giảm giá cấp đơn.
- Phân quyền giảm giá theo chính sách, ví dụ nhân viên tối đa 20%; cao hơn phải có quản lý phê duyệt.
- Nhập lý do không được thay thế quyền phê duyệt.
- Không cho giảm giá dòng lớn hơn giá trị dòng hàng.
- Không cho số âm, `NaN`, `Infinity` hoặc tỷ lệ giảm không hợp lệ.
- Lưu người thực hiện và người phê duyệt nếu áp dụng quy trình duyệt.
- Không chỉ ẩn nút trên frontend; phải bảo vệ API.

**Test:**
- Nhân viên giảm 25%, có lý do → bị chặn nếu chưa có duyệt.
- Nhân viên giảm 15% ở từng dòng và thêm 15% toàn đơn → kiểm tra mức giảm tổng.
- Quản lý đủ quyền thực hiện → thành công.
- Chiết khấu vượt giá trị hàng → từ chối.

### NEW-002 — Không tin tỷ lệ quy đổi đơn vị do client gửi [P0]

**File:** `backend/src/modules/pos/pos.service.ts`

**Vấn đề:**
Khi đơn vị tính không khớp với dữ liệu sản phẩm, backend có nhánh nhận `conversionRatio` từ request.

**Yêu cầu sửa:**
- Tỷ lệ quy đổi chỉ lấy từ cấu hình sản phẩm trong database.
- Đơn vị gốc mặc định tỷ lệ bằng 1.
- Đơn vị không được cấu hình → từ chối.
- Tỷ lệ client gửi khác tỷ lệ đã cấu hình → từ chối.
- Số lượng bán là số nguyên dương đối với mặt hàng tính theo cái, cây, cuốn, hộp.
- Kiểm tra tồn kho bằng đơn vị gốc.
- Giá bán vẫn do backend quyết định.

**Test:**
- Một hộp = 20 cây, bán 2 hộp → trừ 40 cây.
- Client giả tỷ lệ hộp từ 20 thành 1 → từ chối.
- Client gửi đơn vị không tồn tại → từ chối.

### NEW-003 — Chống hoàn trả hàng trùng và tranh chấp đồng thời [P0]

**File:**
- `backend/src/modules/pos/pos.service.ts`
- `backend/src/modules/pos/schemas/pos-order.schema.ts`

**Vấn đề:**
Lệnh trả hàng có `idempotencyKey` trong DTO nhưng quá trình xử lý chưa sử dụng đầy đủ. Phiếu gốc cũng được đọc trước khi bắt đầu transaction.

**Yêu cầu sửa:**
- Đưa việc kiểm tra số lượng đã trả vào transaction.
- Chống hai request đồng thời cùng trả một sản phẩm vượt số lượng đã bán.
- Lưu mã giao dịch trả hàng duy nhất.
- Gửi lại cùng yêu cầu phải nhận cùng kết quả, không cộng tồn lần nữa.
- Cùng key nhưng nội dung khác → `409 Conflict`.
- Ghi lịch sử trả hàng và biến động kho trong cùng transaction.
- Phân biệt hàng tốt, hàng hỏng và hàng cần kiểm tra.

**Test:**
- Bán 10, đã trả 7, yêu cầu trả tiếp 4 → từ chối.
- Hai request đồng thời cùng trả 6/10 → không được nhận cả hai.
- Retry sau timeout → không nhập kho lần hai.

### NEW-004 — Sửa cách tính giá trị hàng trả khi đơn có giảm giá [P0]

**File:** `backend/src/modules/pos/pos.service.ts`

**Vấn đề:**
Số tiền trả được tính từ `lineTotal`, chưa phân bổ giảm giá toàn đơn. Vì vậy tổng giá trị trả có thể vượt `finalAmount`.

**Yêu cầu sửa:**
- Phân bổ giảm giá toàn đơn xuống từng dòng theo quy tắc làm tròn VND xác định.
- Lưu giá trị thực của từng dòng sau phân bổ.
- Hoàn trả theo giá trị thực đã bán.
- Tổng giá trị trả không vượt giá trị hợp lệ của phiếu.
- Xử lý chính xác khi trả nhiều lần.
- Có phương án phân bổ chênh lệch làm tròn.

**Test:**
- Hai sản phẩm tổng 200.000đ, giảm đơn 50.000đ.
- Trả một sản phẩm → giá trị trả phải tính trên số tiền đã giảm, không trả theo giá gốc.
- Trả hết → tổng giá trị trả đúng 150.000đ.

### NEW-005 — Khóa idempotency của phiếu POS theo nội dung request [P1]

**File:**
- `backend/src/modules/pos/pos.service.ts`
- `backend/src/modules/pos/schemas/pos-order.schema.ts`
- `frontend/src/pages/admin/POS.vue`

**Vấn đề:**
Backend trả lại phiếu đã tồn tại khi nhận cùng key mà chưa kiểm tra payload. Frontend lại tạo key mới mỗi lần gọi hàm submit, nên retry thủ công sau lỗi mạng có thể không còn dùng key cũ.

**Yêu cầu sửa:**
- Tạo idempotency key khi bắt đầu một lần xác nhận đơn, giữ nguyên qua các lần retry.
- Lưu fingerprint/hash của các trường nghiệp vụ quan trọng.
- Cùng key và cùng payload → trả phiếu cũ.
- Cùng key nhưng payload khác → trả 409.
- Không thay đổi khóa sau timeout khi chưa biết request cũ đã xử lý chưa.
- Kiểm tra xử lý race condition khi hai request cùng key đến đồng thời.

**Test:** Gửi hai lần cùng key chỉ tạo một phiếu và một lần trừ kho.

### NEW-006 — Sửa mã hóa đơn POS bị tranh chấp khi nhiều thu ngân cùng bán [P1]

**File:** `backend/src/modules/pos/pos.service.ts`

**Vấn đề:**
Mã hóa đơn được tạo bằng cách đếm số phiếu trong ngày rồi cộng 1. Hai giao dịch đồng thời có thể chọn cùng mã.

**Yêu cầu sửa:**
- Dùng bộ đếm nguyên tử hoặc chiến lược cấp mã bảo đảm duy nhất.
- Không phụ thuộc vào `countDocuments()` để cấp mã.
- Thống nhất ngày tạo mã theo múi giờ Việt Nam.
- Có cơ chế retry an toàn khi đụng mã.
- Không tạo thêm phiếu hoặc trừ kho hai lần trong quá trình retry.

**Test:** 100 yêu cầu tạo phiếu đồng thời không có hai phiếu trùng mã.

### NEW-007 — Quét mã vạch hộp/thùng phải nhận đúng đơn vị [P1]

**File:**
- `frontend/src/pages/admin/POS.vue`
- `backend/src/modules/pos/pos.service.ts`

**Vấn đề:**
API có tìm kiếm mã vạch của đơn vị quy đổi, nhưng frontend hiện thêm sản phẩm theo đơn vị gốc mặc định.

**Ví dụ:**
- Mã A đại diện 1 cây bút.
- Mã B đại diện 1 hộp 20 cây.
- Quét mã B phải thêm 1 hộp, tương ứng 20 cây tồn kho.

**Yêu cầu sửa:**
- API trả rõ mã vạch khớp với SKU, barcode gốc hay barcode đơn vị quy đổi.
- Frontend chọn đúng đơn vị khi quét.
- Hiển thị giá và số lượng theo đúng đơn vị bán.
- Nếu mã vạch trùng ở nhiều sản phẩm, cảnh báo thay vì tự chọn sản phẩm đầu tiên.
- Có chính sách bảo đảm barcode duy nhất trong danh mục có hiệu lực.

**Test:** Quét barcode hộp 1 lần → thêm đúng 1 hộp, không phải 1 cây.

---

## NHÓM 2 — PHÂN QUYỀN VÀ GIAO DIỆN NHÂN VIÊN

### NEW-008 — Đồng bộ quyền POS ở menu, router và backend [P1]

**File:**
- `frontend/src/layouts/AdminLayout.vue`
- `frontend/src/router/index.ts`
- `backend/src/modules/pos/pos.controller.ts`
- `backend/src/common/guards/permissions.guard.ts`

**Vấn đề:**
Menu POS dùng quyền `MANAGE_ORDERS`, router POS dùng quyền `POS_ACCESS`, còn controller cho phép một trong hai quyền.

**Yêu cầu sửa:**
- Thống nhất điều kiện truy cập POS giữa giao diện và backend.
- Tách quyền tạo phiếu, xem lịch sử, xem báo cáo, đổi trả, hủy phiếu và duyệt chiết khấu.
- Nhân viên chỉ bán hàng không mặc nhiên được thực hiện nghiệp vụ quản lý.
- Không để người có quyền quản lý đơn online tự động sở hữu mọi quyền POS nếu không có chủ đích.
- Kiểm tra user đã khóa không truy cập được qua API.

**Test:**
- Nhân viên có POS_ACCESS nhìn thấy và sử dụng được POS.
- Nhân viên không có quyền trả hàng không gọi được API refund.
- Quản lý có đủ quyền xem lịch sử và phê duyệt.

### NEW-009 — Hạn chế dữ liệu khách hàng theo quyền và phạm vi công việc [P1]

**File:** `backend/src/modules/pos/pos.controller.ts`, `pos.service.ts`

**Vấn đề:**
Danh sách phiếu POS có thể cung cấp thông tin khách hàng và lịch sử bán cho người được cấp quyền truy cập POS nói chung.

**Yêu cầu sửa:**
- Xác định chính sách nhân viên được xem phiếu của mình, của ca hay toàn cửa hàng.
- Quản lý xem được dữ liệu phù hợp với quyền.
- Ẩn thông tin nhạy cảm không cần thiết.
- Chặn truy cập trực tiếp các phiếu ngoài phạm vi được phép.
- Kiểm soát cả API danh sách và API chi tiết.

**Test:** Nhân viên không đủ quyền không thể xem phiếu bị giới hạn bằng cách đổi ID trong URL.

### NEW-010 — Không in thông tin liên hệ mẫu lên phiếu bán [P1]

**File:** `frontend/src/pages/admin/POS.vue`

**Vấn đề:**
Mẫu phiếu in đang ghi cố định địa chỉ `123 Đường Sách, Q. Ninh Kiều, Cần Thơ` và hotline `0987 654 321`. Đây là thông tin chưa được xác minh.

**Yêu cầu sửa:**
- Lấy tên, địa chỉ, hotline của cửa hàng từ cấu hình quản trị.
- Có giao diện xem trước mẫu in.
- Hỗ trợ khổ in 58mm/80mm nếu phù hợp phần cứng thực tế.
- Kiểm tra tên sản phẩm dài, tiếng Việt có dấu và phiếu nhiều dòng hàng.
- Chỉ hiển thị thông tin đã được admin xác nhận.

**Test:** Thay thông tin cửa hàng ở cấu hình → phiếu in dùng thông tin mới.

---

## NHÓM 3 — TỒN KHO, BÁO CÁO VÀ GIÁ VỐN (✅ ĐÃ HOÀN THÀNH - SPRINT 3)

### NEW-011 — Làm cho kiểm kê và điều chỉnh tồn kho chống tranh chấp thật sự [P1] [✅ ĐÃ HOÀN THÀNH]

**File:** `backend/src/modules/inventory/inventory.service.ts`

**Vấn đề:**
Cơ chế kiểm tra `expectedCurrentStock` được thực hiện trước lời gọi ghi biến động. Giữa hai thời điểm đó vẫn có khả năng phát sinh đơn bán mới.

**Yêu cầu sửa:**
- Kiểm tra version hoặc số tồn kỳ vọng ngay trong thao tác ghi có điều kiện.
- Sử dụng transaction cho tồn kho và sổ kho.
- Nếu dữ liệu thay đổi giữa lúc đọc và lưu, trả 409.
- Không được ghi đè sản lượng bán vừa phát sinh.
- Viết test có hai giao dịch kiểm kê và bán hàng xảy ra cùng lúc.

**Test:** Tồn 10, nhân viên mở phiếu kiểm kê; trong lúc đó POS bán 2, khiến tồn còn 8; xác nhận kiểm kê dựa trên số 10 cũ phải bị từ chối hoặc yêu cầu đối soát lại.

### NEW-012 — Kiểm soát chế độ fallback khi MongoDB không hỗ trợ transaction [P1] [✅ ĐÃ HOÀN THÀNH]

**File:** `backend/src/modules/inventory/inventory.service.ts`

**Vấn đề:**
Hệ thống có cơ chế chuyển sang xử lý bù trừ khi MongoDB không hỗ trợ transaction. Nếu bù trừ cũng thất bại, dữ liệu có thể không nhất quán.

**Yêu cầu sửa:**
- Production phải dùng MongoDB hỗ trợ transaction đối với nghiệp vụ tồn kho quan trọng.
- Không âm thầm fallback sang phương thức ghi nhiều bước thiếu nguyên tử.
- Môi trường test có thể mô phỏng fallback riêng, nhưng phải nêu rõ giới hạn.
- Bổ sung cảnh báo, log và đối soát khi gặp lỗi transaction.
- Xây dựng lệnh phát hiện chênh lệch giữa tồn và sổ kho.

**Test:** Giả lập lỗi ghi lịch sử kho giữa giao dịch; không được để tồn đã thay đổi nhưng thiếu chứng từ.

### NEW-013 — Tổng hợp doanh thu cả WEB, MOBILE, POS và bán sỉ [P1] [✅ ĐÃ HOÀN THÀNH]

**File:**
- `backend/src/modules/reports/reports.service.ts`
- `backend/src/modules/orders/orders.service.ts`
- `frontend/src/pages/admin/Reports.vue`

**Vấn đề:**
Báo cáo chung hiện lấy dữ liệu từ `OrdersService`, còn POS lưu ở `POSOrder` riêng.

**Yêu cầu sửa:**
- Tạo lớp tổng hợp doanh số của tất cả các kênh.
- Không đếm trùng một giao dịch có nhiều trạng thái hoặc phát sinh đổi trả.
- Báo cáo theo ngày, tháng, nhân viên, sản phẩm, danh mục, kênh bán.
- Có tổng doanh thu, doanh thu giảm trừ và doanh thu thuần.
- Định nghĩa rõ ngày ghi nhận doanh thu.
- Tất cả bộ lọc phải dùng cùng khoảng thời gian.
- Không sửa logic cổng thanh toán.

**Test:**
- WEB 1 triệu + POS 2 triệu → tổng 3 triệu khi đều đủ điều kiện ghi nhận.
- Trả hàng POS hợp lệ 200.000đ → tính đúng doanh thu thuần theo chính sách báo cáo.
- Lọc riêng POS không hiển thị doanh số WEB.

### NEW-014 — Chuẩn hóa múi giờ báo cáo ca bán [P1] [✅ ĐÃ HOÀN THÀNH]

**File:** `backend/src/modules/pos/pos.service.ts`

**Vấn đề:**
Báo cáo POS đang có cách tính mốc ngày khác nhau giữa ngày do client truyền và ngày mặc định.

**Yêu cầu sửa:**
- Chuẩn hóa `Asia/Ho_Chi_Minh`.
- Tách rõ báo cáo theo ngày và báo cáo theo ca.
- Cho phép định nghĩa ca sáng, ca chiều, ca tối.
- Lưu giờ bắt đầu/kết thúc ca.
- Trả hàng vào ngày khác phải được phân loại đúng ngày phát sinh nghiệp vụ.

**Test:** Giao dịch lúc 00:30 Việt Nam phải thuộc đúng ngày tại Việt Nam.

### NEW-015 — Chuẩn hóa giá vốn và lãi gộp theo sản phẩm [P1] [✅ ĐÃ HOÀN THÀNH]

**File:**
- `backend/src/modules/inventory/schemas/inventory.schema.ts`
- `backend/src/modules/pos/pos.service.ts`
- Module báo cáo và nhập hàng cần xây dựng thêm

**Vấn đề:**
POS lưu `costPrice` từ Inventory. Tuy nhiên, hệ thống chưa có luồng mua hàng đầy đủ để xác lập giá vốn theo các lần nhập.

**Yêu cầu sửa:**
- Chọn một phương pháp tính giá vốn phù hợp, chẳng hạn bình quân gia quyền di động.
- Giá vốn phải xuất phát từ chứng từ mua và nhận hàng.
- Bán hàng lưu snapshot giá vốn tại thời điểm xuất.
- Khi trả hàng, xác định giá vốn hoàn nhập theo chứng từ gốc.
- Không mặc định giá vốn 0 rồi báo lợi nhuận dương.
- Hỗ trợ tính lãi gộp theo SKU, nhóm hàng, kênh bán.

**Test:** Nhập 10 sản phẩm giá vốn 5.000đ và 10 sản phẩm giá vốn 7.000đ; nếu sử dụng bình quân gia quyền thì giá vốn bình quân là 6.000đ/sản phẩm, trước các điều chỉnh khác.

### NEW-016 — Sửa báo cáo danh mục để tính đúng giảm giá và thời gian [P1] [✅ ĐÃ HOÀN THÀNH]

**File:**
- `backend/src/modules/orders/orders.service.ts`
- `backend/src/modules/reports/reports.service.ts`

**Vấn đề:**
Báo cáo doanh thu theo danh mục hiện cộng giá × số lượng từ dòng đơn và chưa phản ánh đầy đủ giảm giá, đổi trả và POS.

**Yêu cầu sửa:**
- Phân bổ giảm giá cấp đơn về dòng sản phẩm.
- Trừ các khoản giảm trừ theo định nghĩa doanh thu thuần.
- Dùng snapshot thông tin cần thiết để tránh kết quả quá khứ bị thay đổi khi sửa danh mục sản phẩm.
- Cho phép lọc ngày và kênh.
- Tổng doanh thu theo danh mục phải khớp tổng doanh thu tương ứng.

**Test:** Tổng tỷ trọng doanh thu danh mục phải xấp xỉ 100%, chênh lệch chỉ do quy tắc làm tròn đã công bố.

---

## NHÓM 4 — NÂNG CẤP HỆ THỐNG THÀNH PHẦN MỀM QUẢN LÝ CỬA HÀNG THỰC TẾ

Các module dưới đây nên phát triển theo thứ tự phụ thuộc nghiệp vụ.

### ERP-01 — Quản lý nhà cung cấp

**Yêu cầu:**
- Mã và tên nhà cung cấp.
- Người liên hệ, số điện thoại, địa chỉ.
- Danh sách sản phẩm cung ứng.
- Giá mua gần nhất và lịch sử giá.
- Trạng thái đang hợp tác/ngừng hợp tác.
- Không xóa vĩnh viễn nhà cung cấp đã có chứng từ.

**Nghiệm thu:** Có thể biết một sản phẩm từng nhập từ nhà cung cấp nào, ngày nào, giá bao nhiêu.

### ERP-02 — Đơn đặt mua hàng (Purchase Order)

**Yêu cầu:**
- Tạo PO theo nhà cung cấp.
- Các dòng SKU, đơn vị mua, số lượng, đơn giá dự kiến.
- Trạng thái nháp, đã duyệt, đã gửi, nhận một phần, nhận đủ, hủy.
- Lưu người tạo, người duyệt và lịch sử thay đổi.
- Chưa làm tăng tồn chỉ vì đã tạo PO.

**Nghiệm thu:** Đặt mua 100 hộp nhưng chưa nhận hàng → tồn thực tế không tăng.

### ERP-03 — Phiếu nhận hàng và nhập kho từ PO

**Yêu cầu:**
- Nhận toàn bộ hoặc một phần PO.
- Nhập số lượng kiểm đếm thực tế.
- Ghi nhận hàng thiếu/thừa, hàng hỏng.
- Quy đổi về đơn vị tồn gốc.
- Tạo biến động kho và lịch sử giá vốn đồng bộ.
- Chống nhận lặp cùng chứng từ.
- Theo dõi số lượng còn chờ nhận.

**Nghiệm thu:** PO 100 hộp, nhận 60 hộp → tồn tăng theo 60 hộp, PO còn chờ 40 hộp.

### ERP-04 — Phiếu kiểm kê và phê duyệt chênh lệch

**Yêu cầu:**
- Tạo đợt kiểm kê.
- Chốt danh sách SKU tại thời điểm kiểm.
- Nhập số lượng thực đếm.
- Tự tính chênh lệch.
- Có quyền duyệt chênh lệch lớn.
- Có lịch sử nguyên nhân và người chịu trách nhiệm.
- Chỉ cập nhật kho sau phê duyệt và kiểm tra xung đột.

### ERP-05 — Báo cáo nhập xuất tồn và lãi gộp

**Yêu cầu:**
- Tồn đầu kỳ.
- Nhập trong kỳ.
- Xuất trong kỳ.
- Điều chỉnh trong kỳ.
- Tồn cuối kỳ.
- Giá vốn hàng xuất.
- Doanh thu thuần.
- Lãi gộp.
- Lọc theo SKU, nhà cung cấp, nhóm hàng, kênh và thời gian.

### ERP-06 — Đề xuất nhập hàng thông minh

**Yêu cầu:**
- Mức tồn tối thiểu và tồn mục tiêu.
- Tốc độ bán 7/30/90 ngày.
- Số lượng hàng đang đặt mua nhưng chưa nhận.
- Thời gian giao hàng dự kiến của nhà cung cấp.
- Gợi ý số lượng nên nhập.
- Cho phép quản lý duyệt hoặc chỉnh sửa đề xuất.

**Nghiệm thu:** Sản phẩm bán nhanh, tồn thấp và chưa có hàng đang về sẽ được ưu tiên đề xuất nhập.

---

## NHÓM 5 — KIỂM THỬ VÀ NGHIỆM THU

### QA-01 — Bổ sung test tích hợp MongoDB thật

Các test hiện tại có sử dụng nhiều mock. Cần bổ sung kiểm thử trên MongoDB Replica Set dành cho test.

Các tình huống bắt buộc:
- Hai quầy bán cùng một SKU còn 1 sản phẩm.
- POS và WEB cùng trừ tồn.
- Hai yêu cầu hoàn trả cùng một phiếu.
- Hai giao dịch tạo mã hóa đơn cùng thời điểm.
- Transaction thất bại sau khi trừ tồn nhưng trước khi lưu phiếu.
- Retry request POS sau timeout.
- Kiểm kê xung đột với giao dịch bán.
- Giá vốn, doanh số và sổ kho khớp nhau.

### QA-02 — Kiểm thử vận hành cửa hàng thực tế (UAT)

Kiểm thử theo vai trò:

**Nhân viên bán hàng:** Quét mã, bán lẻ, bán theo hộp, tìm hàng, tạo phiếu, in phiếu, giữ giỏ, tra cứu.

**Nhân viên kho:** Nhận hàng, nhập kho, xuất nội bộ, kiểm kê, xử lý hàng lỗi.

**Quản lý:** Duyệt giá, duyệt chênh lệch kiểm kê, quản lý nhân viên, tra cứu sai lệch, xem lãi gộp.

**Chủ cửa hàng:** Xem doanh thu đa kênh, lãi gộp, hàng bán chạy, hàng tồn lâu, đề xuất nhập hàng.

---

## THỨ TỰ TRIỂN KHAI ĐỀ XUẤT

**Sprint 1 — An toàn dữ liệu và POS** [✅ ĐÃ HOÀN THÀNH - Branch: `feature/sprint1-pos-safety`]
- NEW-001: Khóa quyền giảm giá tại quầy
- NEW-002: Không tin tỷ lệ quy đổi đơn vị do client gửi
- NEW-003: Chống hoàn trả hàng trùng và tranh chấp đồng thời
- NEW-004: Sửa cách tính giá trị hàng trả khi đơn có giảm giá
- NEW-005: Khóa idempotency của phiếu POS theo nội dung request
- NEW-006: Sửa mã hóa đơn POS bị tranh chấp khi nhiều thu ngân cùng bán

**Sprint 2 — Trải nghiệm bán hàng và phân quyền** [✅ ĐÃ HOÀN THÀNH - Branch: `feature/sprint2-pos-ux-permissions`]
- NEW-007: Quét mã vạch hộp/thùng phải nhận đúng đơn vị
- NEW-008: Đồng bộ quyền POS ở menu, router và backend
- NEW-009: Hạn chế dữ liệu khách hàng theo quyền và phạm vi công việc
- NEW-010: Không in thông tin liên hệ mẫu lên phiếu bán

**Sprint 3 — Báo cáo, tồn kho và giá vốn** [⏳ TIẾP THEO]
NEW-011 đến NEW-016.

**Sprint 4 — Mua hàng và vận hành**
ERP-01, ERP-02, ERP-03, ERP-04.

**Sprint 5 — Quản trị và tối ưu**
ERP-05, ERP-06, QA-01, QA-02 và hoàn thiện kiểm thử.

---

## QUY TẮC BẮT BUỘC KHI AI SỬA CODE

1. Đọc `AGENTS.md` và source code thực tế trước khi sửa.
2. Kiểm tra task đã được xử lý trên commit mới hơn hay chưa.
3. Mỗi thay đổi thực hiện qua branch và Pull Request riêng theo nhóm nghiệp vụ.
4. Không sửa trực tiếp `main`.
5. Không làm lại các task cũ đã đạt yêu cầu.
6. Không thay đổi nghiệp vụ thanh toán.
7. Không tự ý sửa dữ liệu production.
8. Không được bỏ qua test lỗi, test quyền, test cạnh tranh dữ liệu và test hồi quy.
9. Với mỗi task phải nêu file sửa, nguyên nhân, giải pháp, test pass/fail và rủi ro.
10. CI xanh không thay thế kiểm thử tích hợp và UAT.
11. Không tuyên bố hoàn thành khi chưa có bằng chứng.

**Tiêu chí hoàn thành:** Từng task phải có code, regression test, CI đạt, review và kết quả nghiệm thu đúng nghiệp vụ.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-10-30T14:04:05+07:00.
</ADDITIONAL_METADATA>