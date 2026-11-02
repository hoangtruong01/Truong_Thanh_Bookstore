# 📊 ĐẶC TẢ KHẢO SÁT HỆ THỐNG KẾ TOÁN & THUẾ (TASK ACC-01)
> **Mã Task:** ACC-01  
> **Dự án:** Nhà sách Trường Thành (Trường Thành Bookstore ERP)  
> **Vai trò phân tích:** Business Analyst (BA) & Solution Architect  
> **Ngày lập:** 2026-11-01  
> **Trạng thái:** DRAFT FOR ACCOUNTANT REVIEW (Chờ xác nhận của Kế toán trưởng / Đơn vị tư vấn thuế trước khi lập trình General Ledger)

---

## 1. 🎯 Mục Tiêu & Nguyên Tắc Triển Khai

1. **Không tự động lập trình kế toán dựa trên phỏng đoán:** Kế toán và thuế là lĩnh vực tuân thủ pháp lý cao (Thông tư 133/2016/TT-BTC, Thông tư 200/2014/TT-BTC, Nghị định 123/2020/NĐ-CP và Thông tư 78/2021/TT-BTC về Hóa đơn điện tử).
2. **Xác định ranh giới hệ thống (System Boundaries):**
   - Hiện tại: Phân hệ **Quản trị dòng tiền (Cash Management)** và **Sổ cái kho/công nợ (Sub-ledger)** đã hoàn thiện ở tầng vận hành nghiệp vụ bán lẻ và B2B (`CashAccount`, `CashEntry`, `SupplierPayable`, `CustomerReceivable`, `InventoryLedger`).
   - Tương lai (giai đoạn sau khi có xác nhận): Mở rộng hệ thống **Bút toán kép (Double-entry Bookkeeping)**, **Sổ cái chung (General Ledger)** và **Thuế GTGT (VAT)**.

---

## 2. 📋 Bảng Khảo Sát Nghiệp Vụ Cần Thu Thập từ Kế Toán

| STT | Câu hỏi khảo sát | Mục đích kỹ thuật | Trạng thái đề xuất hiện tại |
|:---:|:---|:---|:---|
| 1 | Doanh nghiệp áp dụng chế độ kế toán nào? (Thông tư 133 cho DNNVV hay Thông tư 200)? | Thiết lập Hệ thống Tài khoản Chuẩn (Chart of Accounts - COA). | Đề xuất: Hệ thống tài khoản theo **Thông tư 133/2016/TT-BTC** (gọn nhẹ, phù hợp quy mô doanh nghiệp bán lẻ/sách). |
| 2 | Doanh nghiệp kê khai thuế GTGT theo phương pháp nào? (Khấu trừ hay Trực tiếp trên doanh thu)? | Xác định thuế suất đầu ra/đầu vào và hạch toán TK 1331, TK 33311. | Đề xuất: Phương pháp **Khấu trừ** (Tax invoice đầu vào và đầu ra). |
| 3 | Mức thuế suất GTGT cho từng nhóm hàng hóa? | Cấu hình VAT Rate trên Product Schema. | - Sách giáo khoa, sách tham khảo, văn hóa phẩm: `0%` hoặc `5%`.<br>- Văn phòng phẩm, đồ chơi giáo dục, quà lưu niệm: `8%` hoặc `10%`. |
| 4 | Phương pháp tính giá vốn hàng tồn kho được chấp thuận? | Thiết lập công thức định giá xuất kho (`Costing Method`). | Hệ thống đang áp dụng **Bình quân gia quyền di động (Moving Weighted Average Cost)** tự động sau mỗi lần GRN. |
| 5 | Doanh nghiệp sử dụng nhà cung cấp Hóa đơn điện tử (E-Invoice) nào? | Thiết kế E-Invoice Integration Adapter. | Các đơn vị phổ biến: VNPT Invoice, Viettel S-Invoice, MISA meInvoice, BKAV eHoadon. |
| 6 | Thời điểm phát hành hóa đơn điện tử? | Quyết định trigger tự động hay thủ công. | - Khách lẻ: Xuất bảng kê cuối ngày hoặc theo yêu cầu lấy hóa đơn VAT.<br>- Khách sỉ B2B: Xuất hóa đơn VAT kèm theo từng phiếu giao hàng / công nợ. |
| 7 | Quy trình khóa sổ kế toán (Period Closing)? | Thiết kế cơ chế khóa chứng từ theo tháng/quý. | Khóa chỉnh sửa dữ liệu các phiếu `CashEntry`, `GoodsReceipt`, `Orders` đã thuộc kỳ kế toán đã chốt. |

---

## 3. 🏗️ Đề Xuất Thiết Kế Kiến Trúc Module Kế Toán (Phase Sau)

### 3.1. Danh Mục Tài Khoản Kế Toán (Chart of Accounts - COA)

Dự kiến các tài khoản cấp 1 và cấp 2 cốt lõi:
- **Tài sản ngắn hạn:**
  - `TK 111` — Tiền mặt (1111: Tiền Việt Nam)
  - `TK 112` — Tiền gửi ngân hàng (1121: Vietcombank/MBBank...)
  - `TK 131` — Phải thu của khách hàng (Chi tiết theo từng `Customer`)
  - `TK 133` — Thuế GTGT được khấu trừ (1331: Thuế GTGT đầu vào)
  - `TK 156` — Hàng hóa (1561: Giá mua hàng hóa)
- **Nợ phải trả:**
  - `TK 331` — Phải trả cho người bán (Chi tiết theo từng `Supplier`)
  - `TK 333` — Thuế và các khoản phải nộp nhà nước (33311: Thuế GTGT đầu ra)
- **Doanh thu & Chi phí:**
  - `TK 511` — Doanh thu bán hàng và cung cấp dịch vụ (5111: Doanh thu bán hàng)
  - `TK 521` — Các khoản giảm trừ doanh thu (5211: Chiết khấu thương mại, 5212: Hàng bán bị trả lại, 5213: Giảm giá hàng bán)
  - `TK 632` — Giá vốn hàng bán
  - `TK 642` — Chi phí quản lý kinh doanh

---

### 3.2. Sơ Đồ Bút Toán Kép Tự Động Dự Kiến (Automated Double-entry Mapping)

```
1. Nhập hàng hóa từ Nhà Cung Cấp (Goods Receipt):
   Nợ TK 1561:  Giá trị hàng nhập theo giá vốn
   Nợ TK 1331:  Thuế GTGT đầu vào (nếu có hóa đơn)
      Có TK 331:   Tổng tiền nợ NCC (SupplierPayable)

2. Bán hàng thu tiền ngay (POS Bán lẻ / Online đã thanh toán):
   Nợ TK 111 / TK 112: Tiền thực thu vào sổ quỹ
      Có TK 5111:        Doanh thu bán hàng
      Có TK 33311:       Thuế GTGT đầu ra (nếu có)
   (Đồng thời ghi nhận giá vốn):
   Nợ TK 632:   Giá vốn hàng xuất bán
      Có TK 1561:  Giá vốn hàng tồn kho xuất kho

3. Bán chịu cho khách sỉ (B2B Credit Sale):
   Nợ TK 131:   Phải thu khách hàng (CustomerReceivable)
      Có TK 5111:  Doanh thu bán hàng
      Có TK 33311: Thuế GTGT đầu ra

4. Thu nợ từ khách sỉ:
   Nợ TK 111 / TK 112: Tiền thu được
      Có TK 131:          Giảm công nợ khách hàng

5. Thanh toán nợ cho Nhà Cung Cấp:
   Nợ TK 331:   Giảm nợ NCC
      Có TK 111 / TK 112: Tiền chi từ sổ quỹ

6. Trả hàng nhà cung cấp (Purchase Return):
   Nợ TK 331 (hoặc 111/112): Giảm nợ NCC hoặc thu lại tiền
      Có TK 1561:              Giảm giá trị tồn kho
      Có TK 1331:              Giảm thuế GTGT được khấu trừ
```

---

## 4. 🔗 Định Dạng Dữ Liệu Xuất Cho Phần Mềm Kế Toán (MISA, Fast, Bravo)

Thay vì cố gắng xây dựng lại toàn bộ phần mềm kế toán cồng kềnh, hệ thống ERP sẽ cung cấp các tệp xuất dữ liệu chuẩn hóa (Data Export Feeds) để nạp thẳng vào phần mềm kế toán chuyên dụng:
1. **Bảng kê Bán hàng:** Ngày, số hóa đơn/chứng từ, mã khách, tên hàng, ĐVT, số lượng, đơn giá, thành tiền, % thuế, tiền thuế.
2. **Bảng kê Mua hàng & Nhập kho:** Ngày nhập, số phiếu GRN, mã NCC, tên hàng, số lượng, giá vốn, thành tiền.
3. **Bảng kê Thu / Chi Sổ Quỹ:** Ngày ghi sổ, mã chứng từ, tài khoản quỹ, diễn giải, số tiền thu/chi, đối tác.
4. **Báo cáo Tổng hợp Công nợ AP/AR:** Số dư đầu kỳ, phát sinh tăng, phát sinh giảm, số dư cuối kỳ theo từng đối tượng.

---

## 5. ✅ Trạng Thái Nghiệm Thu Task ACC-01
- [x] Khảo sát hiện trạng source code tài chính hiện tại (`CashAccount`, `CashEntry`, `SupplierPayable`, `CustomerReceivable`).
- [x] Lập danh sách câu hỏi khảo sát pháp lý và thuế gửi Kế toán trưởng.
- [x] Thiết kế sơ bộ ma trận bút toán kép (Double-entry mapping) theo Thông tư 133.
- [x] Đảm bảo tuân thủ nguyên tắc: **Chưa can thiệp code General Ledger khi chưa có phê duyệt chính thức từ ban kiểm soát kế toán**.
