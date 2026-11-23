import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';
import * as crypto from 'crypto';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import {
  Supplier,
  SupplierDocument,
} from '../suppliers/schemas/supplier.schema';
import {
  ImportBatch,
  ImportBatchDocument,
  ImportBatchStatus,
} from './schemas/import-batch.schema';
import { InventoryService } from '../inventory/inventory.service';
import { ProductStatus } from '../../common/enums';
import {
  RowError,
  ImportOptionsDto,
  OnDuplicateSkuAction,
  NormalizedRow,
  PreviewResult,
  ImportResult,
} from './dto/data-exchange.dto';

export {
  RowError,
  ImportOptionsDto,
  OnDuplicateSkuAction,
  NormalizedRow,
  PreviewResult,
  ImportResult,
};

@Injectable()
export class DataExchangeService {
  private readonly logger = new Logger(DataExchangeService.name);

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Supplier.name)
    private readonly supplierModel: Model<SupplierDocument>,
    @InjectModel(ImportBatch.name)
    private readonly importBatchModel: Model<ImportBatchDocument>,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Tính SHA-256 checksum của file buffer để nhận diện batch trùng lặp
   */
  public computeFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * SEC-014: Escape ký tự đặc biệt của RegExp để dữ liệu từ file Excel không
   * bị hiểu là pattern (chống ReDoS / regex injection).
   */
  private escapeRegex(input: string): string {
    return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Bảo mật: Khử nguy cơ Formula Injection (CSV/Excel Formula Injection - CWE-1236)
   */
  public sanitizeCellValue(val: any): any {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (/^[=+\-@|\t\r]/.test(trimmed)) {
        return `'${trimmed}`;
      }
      return trimmed;
    }
    return val;
  }

  /**
   * Đọc giá trị ô cell dạng chuỗi an toàn
   */
  public getCellText(cellValue: any): string {
    if (cellValue === null || cellValue === undefined) return '';
    if (typeof cellValue === 'object') {
      if ('result' in cellValue) return String(cellValue.result ?? '').trim();
      if ('text' in cellValue) return String(cellValue.text ?? '').trim();
      if (Array.isArray(cellValue.richText)) {
        return cellValue.richText
          .map((rt: any) => rt.text || '')
          .join('')
          .trim();
      }
    }
    return String(cellValue).trim();
  }

  /**
   * SEC-01: Kiểm tra an toàn file buffer trước khi parse
   */
  public validateFileSafety(fileBuffer: Buffer, fileName?: string): void {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('File tải lên không có nội dung');
    }

    // Kiểm tra magic bytes của zip (.xlsx là định dạng zip, byte bắt đầu PK\x03\x04)
    if (fileBuffer.length < 4) {
      throw new BadRequestException(
        'Định dạng file không phải file Excel .xlsx hợp lệ',
      );
    }

    // Phát hiện file Excel nhị phân cũ (.xls - OLE2 BIFF8)
    if (
      fileBuffer.length >= 2 &&
      fileBuffer[0] === 0xd0 &&
      fileBuffer[1] === 0xcf
    ) {
      throw new BadRequestException(
        'Hệ thống chỉ hỗ trợ định dạng Excel chuẩn OpenXML (.xlsx). Vui lòng mở file .xls bằng Excel và Lưu dưới dạng (Save As) .xlsx rồi tải lên lại.',
      );
    }

    const isZip =
      fileBuffer[0] === 0x50 &&
      fileBuffer[1] === 0x4b &&
      (fileBuffer[2] === 0x03 ||
        fileBuffer[2] === 0x05 ||
        fileBuffer[2] === 0x07) &&
      (fileBuffer[3] === 0x04 ||
        fileBuffer[3] === 0x06 ||
        fileBuffer[3] === 0x08);

    if (!isZip) {
      throw new BadRequestException(
        'Định dạng file không phải file Excel .xlsx hợp lệ',
      );
    }

    // Sanitize file name nếu có (chống path traversal)
    if (
      fileName &&
      (fileName.includes('..') ||
        fileName.includes('/') ||
        fileName.includes('\\'))
    ) {
      throw new BadRequestException(
        'Tên file không hợp lệ hoặc chứa ký tự nguy hiểm',
      );
    }
  }

  /**
   * DOC-01: Tạo file mẫu Excel chuẩn theo từng nghiệp vụ
   */
  async generateTemplate(
    type: 'products' | 'suppliers' | 'opening_stock',
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Truong Thanh Bookstore ERP';
    workbook.created = new Date();

    const guideSheet = workbook.addWorksheet('Huong_Dan');
    guideSheet.columns = [
      { header: 'Mục', key: 'section', width: 20 },
      { header: 'Quy định / Hướng dẫn', key: 'content', width: 80 },
    ];
    guideSheet.getRow(1).font = { bold: true };

    const dataSheet = workbook.addWorksheet('Du_Lieu');

    if (type === 'products') {
      guideSheet.addRow({
        section: 'Quy tắc nhập',
        content:
          'Mã SKU là duy nhất. Tên sản phẩm, Giá bán và Danh mục là bắt buộc.',
      });
      guideSheet.addRow({
        section: 'Giá tiền & Tồn kho',
        content:
          'Số tiền là số nguyên dương không chứa dấu phẩy hay ký tự tiền tệ. Tồn kho >= 0.',
      });
      guideSheet.addRow({
        section: 'An toàn bảo mật',
        content: 'Không bắt đầu ô bằng các ký tự công thức (=, +, -, @).',
      });

      dataSheet.columns = [
        { header: 'Mã SKU (*)', key: 'sku', width: 16 },
        { header: 'Tên sản phẩm (*)', key: 'name', width: 35 },
        { header: 'Danh mục (*)', key: 'category', width: 22 },
        { header: 'Giá bán VND (*)', key: 'price', width: 18 },
        { header: 'Giá vốn VND', key: 'costPrice', width: 18 },
        { header: 'Tồn kho ban đầu', key: 'stock', width: 16 },
        { header: 'Đơn vị tính', key: 'unit', width: 14 },
        { header: 'Mã Barcode', key: 'barcode', width: 20 },
        { header: 'Tác giả / Thương hiệu', key: 'author', width: 25 },
        { header: 'Nhà xuất bản', key: 'publisher', width: 25 },
      ];

      dataSheet.addRow({
        sku: 'SKU-DEMO-001',
        name: 'Sổ tay bìa da cao cấp A5',
        category: 'Văn phòng phẩm',
        price: 85000,
        costPrice: 50000,
        stock: 50,
        unit: 'quyển',
        barcode: '893600001001',
        author: 'Trường Thành',
        publisher: 'NXB Văn Hóa',
      });
    } else if (type === 'suppliers') {
      guideSheet.addRow({
        section: 'Quy tắc nhập',
        content:
          'Mã NCC là duy nhất. Tên nhà cung cấp và Số điện thoại là bắt buộc.',
      });
      dataSheet.columns = [
        { header: 'Mã NCC (*)', key: 'code', width: 16 },
        { header: 'Tên nhà cung cấp (*)', key: 'name', width: 35 },
        { header: 'Người liên hệ', key: 'contactPerson', width: 22 },
        { header: 'Số điện thoại (*)', key: 'phone', width: 18 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Địa chỉ', key: 'address', width: 35 },
        { header: 'Mã số thuế', key: 'taxCode', width: 18 },
      ];

      dataSheet.addRow({
        code: 'NCC-DEMO-01',
        name: 'Công ty Cổ phần Giấy Bãi Bằng',
        contactPerson: 'Nguyễn Văn A',
        phone: '0901234567',
        email: 'lienhe@baibang.vn',
        address: 'Hà Nội, Việt Nam',
        taxCode: '0101234567',
      });
    } else if (type === 'opening_stock') {
      guideSheet.addRow({
        section: 'Quy tắc tồn đầu kỳ',
        content:
          'Mã SKU phải trùng khớp với SKU đã có trong hệ thống hoặc tạo mới. Số lượng tồn và giá vốn >= 0.',
      });
      dataSheet.columns = [
        { header: 'Mã SKU (*)', key: 'sku', width: 18 },
        { header: 'Tên sản phẩm', key: 'productName', width: 35 },
        { header: 'Tồn đầu kỳ (*)', key: 'openingStock', width: 18 },
        { header: 'Giá vốn nhập (*)', key: 'unitCost', width: 18 },
        { header: 'Đơn vị tính', key: 'unit', width: 14 },
      ];

      dataSheet.addRow({
        sku: 'GIAY-A4-001',
        productName: 'Giấy A4 Double A 70gsm',
        openingStock: 100,
        unitCost: 75000,
        unit: 'ram',
      });
    } else {
      throw new BadRequestException('Loại mẫu Excel không hợp lệ');
    }

    dataSheet.getRow(1).font = { bold: true };
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * XLS-01.1: 1. Parse workbook từ buffer
   */
  public async parseWorkbook(
    fileBuffer: Buffer,
    type: string,
  ): Promise<{
    rows: { rowNumber: number; cells: any[] }[];
    sheetName: string;
    headerMap: Record<string, number>;
  }> {
    this.validateFileSafety(fileBuffer);

    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(fileBuffer as any);
    } catch {
      throw new BadRequestException(
        'Không thể đọc file Excel. File bị hỏng hoặc sai cấu trúc',
      );
    }

    if (workbook.worksheets.length > 10) {
      throw new BadRequestException(
        'File Excel có quá nhiều sheet (tối đa 10 sheets)',
      );
    }

    let sheet =
      workbook.getWorksheet('Du_Lieu') ||
      workbook.getWorksheet('du_lieu') ||
      workbook.getWorksheet('Data') ||
      workbook.getWorksheet('data') ||
      workbook.getWorksheet('DanhSachSanPham');

    if (!sheet) {
      sheet = workbook.worksheets.find((w) => {
        const norm = w.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        return ![
          'huongdan',
          'huong_dan',
          'guide',
          'instructions',
          'readme',
        ].includes(norm);
      });
    }

    if (!sheet) {
      throw new BadRequestException(
        'Không tìm thấy sheet dữ liệu trong file Excel tải lên. Vui lòng đảm bảo file có sheet "Du_Lieu" chứa dữ liệu cần nhập (không chỉ có sheet "Huong_Dan").',
      );
    }

    if (sheet.rowCount > 5000) {
      throw new BadRequestException(
        'File Excel vượt quá giới hạn tối đa 5000 dòng',
      );
    }

    const headerRow = sheet.getRow(1);
    const headerTexts: { col: number; text: string }[] = [];
    const maxCols = Math.min(sheet.columnCount || 30, 50);
    for (let c = 1; c <= maxCols; c++) {
      const cellVal = this.getCellText(headerRow.getCell(c).value);
      if (cellVal) {
        headerTexts.push({ col: c, text: cellVal.toLowerCase().trim() });
      }
    }

    const normHeaders = headerTexts.map((h) => h.text);

    // Kiểm tra lệch loại mẫu nhập liệu (Template type validation)
    const hasSupplierHeaders = normHeaders.some(
      (h) =>
        h.includes('mã ncc') ||
        h.includes('ma ncc') ||
        h.includes('nhà cung cấp') ||
        h.includes('nha cung cap'),
    );
    const hasProductHeaders = normHeaders.some(
      (h) =>
        (h.includes('mã sku') || h.includes('ma sku') || h.includes('sku')) &&
        (h.includes('giá bán') ||
          h.includes('gia ban') ||
          h.includes('danh mục') ||
          h.includes('danh muc')),
    );
    const hasOpeningStockHeaders = normHeaders.some(
      (h) =>
        h.includes('tồn đầu kỳ') ||
        h.includes('ton dau ky') ||
        h.includes('giá vốn nhập') ||
        h.includes('gia von nhap'),
    );

    if (type === 'products' && hasSupplierHeaders && !hasProductHeaders) {
      throw new BadRequestException(
        'File tải lên là mẫu Nhà cung cấp, không phải mẫu Sản phẩm. Vui lòng chọn đúng file mẫu.',
      );
    }
    if (type === 'suppliers' && hasProductHeaders && !hasSupplierHeaders) {
      throw new BadRequestException(
        'File tải lên là mẫu Sản phẩm, không phải mẫu Nhà cung cấp. Vui lòng chọn đúng file mẫu.',
      );
    }
    if (
      type === 'opening_stock' &&
      hasSupplierHeaders &&
      !hasOpeningStockHeaders
    ) {
      throw new BadRequestException(
        'File tải lên là mẫu Nhà cung cấp, không phải mẫu Tồn đầu kỳ. Vui lòng chọn đúng file mẫu.',
      );
    }

    // Dynamic header mapping
    const headerMap: Record<string, number> = {};
    for (const h of headerTexts) {
      const clean = h.text
        .replace(/\(\*\)/g, '')
        .replace(/\(vnd\)/g, '')
        .replace(/vnd/g, '')
        .trim();

      if (
        clean.includes('sku') ||
        clean.includes('mã sp') ||
        clean.includes('ma sp')
      ) {
        headerMap['sku'] = h.col;
      } else if (
        clean.includes('tên sản phẩm') ||
        clean.includes('ten san pham')
      ) {
        headerMap['name'] = h.col;
        headerMap['productName'] = h.col;
      } else if (clean.includes('danh mục') || clean.includes('danh muc')) {
        headerMap['category'] = h.col;
      } else if (clean.includes('giá bán') || clean.includes('gia ban')) {
        headerMap['price'] = h.col;
      } else if (
        clean.includes('giá vốn') ||
        clean.includes('gia von') ||
        clean.includes('unit cost')
      ) {
        headerMap['costPrice'] = h.col;
        headerMap['unitCost'] = h.col;
      } else if (clean.includes('tồn đầu kỳ') || clean.includes('ton dau ky')) {
        headerMap['openingStock'] = h.col;
      } else if (
        clean.includes('tồn kho') ||
        clean.includes('ton kho') ||
        clean.includes('stock')
      ) {
        headerMap['stock'] = h.col;
      } else if (
        clean.includes('đơn vị') ||
        clean.includes('don vi') ||
        clean.includes('unit')
      ) {
        headerMap['unit'] = h.col;
      } else if (clean.includes('barcode')) {
        headerMap['barcode'] = h.col;
      } else if (
        clean.includes('tác giả') ||
        clean.includes('tac gia') ||
        clean.includes('author') ||
        clean.includes('thương hiệu')
      ) {
        headerMap['author'] = h.col;
      } else if (
        clean.includes('nhà xuất bản') ||
        clean.includes('nha xuat ban') ||
        clean.includes('publisher')
      ) {
        headerMap['publisher'] = h.col;
      } else if (
        clean.includes('mã ncc') ||
        clean.includes('ma ncc') ||
        clean.includes('code')
      ) {
        headerMap['code'] = h.col;
      } else if (
        clean.includes('nhà cung cấp') ||
        clean.includes('nha cung cap')
      ) {
        headerMap['name'] = h.col;
      } else if (
        clean.includes('liên hệ') ||
        clean.includes('lien he') ||
        clean.includes('contact')
      ) {
        headerMap['contactPerson'] = h.col;
      } else if (
        clean.includes('thoại') ||
        clean.includes('thoai') ||
        clean.includes('phone')
      ) {
        headerMap['phone'] = h.col;
      } else if (clean.includes('email')) {
        headerMap['email'] = h.col;
      } else if (
        clean.includes('địa chỉ') ||
        clean.includes('dia chi') ||
        clean.includes('address')
      ) {
        headerMap['address'] = h.col;
      } else if (
        clean.includes('thuế') ||
        clean.includes('thue') ||
        clean.includes('tax')
      ) {
        headerMap['taxCode'] = h.col;
      }
    }

    const rows: { rowNumber: number; cells: any[] }[] = [];
    const rowCount = sheet.rowCount;

    for (let r = 2; r <= rowCount; r++) {
      const row = sheet.getRow(r);
      const isRowEmpty =
        !row.values ||
        (Array.isArray(row.values) &&
          row.values
            .slice(1)
            .every((v) => v === null || v === undefined || v === ''));
      if (isRowEmpty) continue;

      const cells: any[] = [];
      const colCount = Math.min(row.cellCount, 50);
      for (let c = 1; c <= colCount; c++) {
        cells[c] = row.getCell(c).value;
      }
      rows.push({ rowNumber: r, cells });
    }

    return { rows, sheetName: sheet.name, headerMap };
  }

  /**
   * XLS-01.1: 2. Normalize row - Chuẩn hóa dữ liệu ô
   */
  public normalizeRow(
    type: 'products' | 'suppliers' | 'opening_stock',
    cells: any[],
    rowNumber: number,
    headerMap?: Record<string, number>,
  ): NormalizedRow {
    const rawData: Record<string, any> = {};
    const errors: RowError[] = [];
    const warnings: string[] = [];

    if (type === 'products') {
      const skuRaw = headerMap?.['sku'] ? cells[headerMap['sku']] : cells[1];
      const nameRaw = headerMap?.['name'] ? cells[headerMap['name']] : cells[2];
      const catRaw = headerMap?.['category']
        ? cells[headerMap['category']]
        : cells[3];
      const priceRaw = headerMap?.['price']
        ? cells[headerMap['price']]
        : cells[4];
      const costPriceRaw = headerMap?.['costPrice']
        ? cells[headerMap['costPrice']]
        : cells[5];
      const stockRaw = headerMap?.['stock']
        ? cells[headerMap['stock']]
        : cells[6];
      const unitRaw = headerMap?.['unit'] ? cells[headerMap['unit']] : cells[7];
      const barcodeRaw = headerMap?.['barcode']
        ? cells[headerMap['barcode']]
        : cells[8];
      const authorRaw = headerMap?.['author']
        ? cells[headerMap['author']]
        : cells[9];
      const publisherRaw = headerMap?.['publisher']
        ? cells[headerMap['publisher']]
        : cells[10];

      const sku = this.getCellText(skuRaw);
      const name = this.getCellText(nameRaw);
      const category = this.getCellText(catRaw);

      let price: number | null = null;
      if (
        priceRaw !== null &&
        priceRaw !== undefined &&
        String(priceRaw).trim() !== ''
      ) {
        const num = Number(priceRaw);
        price = isNaN(num) ? NaN : num;
      }

      let costPrice: number | null = null;
      if (
        costPriceRaw !== null &&
        costPriceRaw !== undefined &&
        String(costPriceRaw).trim() !== ''
      ) {
        const num = Number(costPriceRaw);
        costPrice = isNaN(num) ? NaN : num;
      }

      let stock: number | null = null;
      if (
        stockRaw !== null &&
        stockRaw !== undefined &&
        String(stockRaw).trim() !== ''
      ) {
        const num = Number(stockRaw);
        stock = isNaN(num) ? NaN : num;
      }

      const unit = this.getCellText(unitRaw) || 'cái';
      const barcode = this.getCellText(barcodeRaw);
      const author = this.getCellText(authorRaw);
      const publisher = this.getCellText(publisherRaw);

      rawData.sku = this.sanitizeCellValue(sku);
      rawData.name = this.sanitizeCellValue(name);
      rawData.category = this.sanitizeCellValue(category);
      rawData.price = price;
      rawData.costPrice = costPrice;
      rawData.stock = stock;
      rawData.unit = this.sanitizeCellValue(unit);
      rawData.barcode = barcode || undefined;
      rawData.author = author || undefined;
      rawData.publisher = publisher || undefined;
    } else if (type === 'suppliers') {
      const codeRaw = headerMap?.['code'] ? cells[headerMap['code']] : cells[1];
      const nameRaw = headerMap?.['name'] ? cells[headerMap['name']] : cells[2];
      const contactPersonRaw = headerMap?.['contactPerson']
        ? cells[headerMap['contactPerson']]
        : cells[3];
      const phoneRaw = headerMap?.['phone']
        ? cells[headerMap['phone']]
        : cells[4];
      const emailRaw = headerMap?.['email']
        ? cells[headerMap['email']]
        : cells[5];
      const addressRaw = headerMap?.['address']
        ? cells[headerMap['address']]
        : cells[6];
      const taxCodeRaw = headerMap?.['taxCode']
        ? cells[headerMap['taxCode']]
        : cells[7];

      rawData.code = this.sanitizeCellValue(this.getCellText(codeRaw));
      rawData.name = this.sanitizeCellValue(this.getCellText(nameRaw));
      rawData.contactPerson =
        this.sanitizeCellValue(this.getCellText(contactPersonRaw)) || undefined;
      rawData.phone = this.sanitizeCellValue(this.getCellText(phoneRaw));
      rawData.email =
        this.sanitizeCellValue(this.getCellText(emailRaw)) || undefined;
      rawData.address =
        this.sanitizeCellValue(this.getCellText(addressRaw)) || undefined;
      rawData.taxCode =
        this.sanitizeCellValue(this.getCellText(taxCodeRaw)) || undefined;
    } else if (type === 'opening_stock') {
      const skuRaw = headerMap?.['sku'] ? cells[headerMap['sku']] : cells[1];
      const productNameRaw = headerMap?.['productName']
        ? cells[headerMap['productName']]
        : cells[2];
      const stockRaw = headerMap?.['openingStock']
        ? cells[headerMap['openingStock']]
        : cells[3];
      const costRaw = headerMap?.['unitCost']
        ? cells[headerMap['unitCost']]
        : cells[4];
      const unitRaw = headerMap?.['unit'] ? cells[headerMap['unit']] : cells[5];

      let openingStock: number | null = null;
      if (
        stockRaw !== null &&
        stockRaw !== undefined &&
        String(stockRaw).trim() !== ''
      ) {
        const num = Number(stockRaw);
        openingStock = isNaN(num) ? NaN : num;
      }

      let unitCost: number | null = null;
      if (
        costRaw !== null &&
        costRaw !== undefined &&
        String(costRaw).trim() !== ''
      ) {
        const num = Number(costRaw);
        unitCost = isNaN(num) ? NaN : num;
      }

      rawData.sku = this.sanitizeCellValue(this.getCellText(skuRaw));
      rawData.productName =
        this.sanitizeCellValue(this.getCellText(productNameRaw)) || undefined;
      rawData.openingStock = openingStock;
      rawData.unitCost = unitCost;
      rawData.unit = this.sanitizeCellValue(this.getCellText(unitRaw)) || 'cái';
    }

    return {
      rowNumber,
      data: rawData,
      errors,
      warnings,
      isValid: true,
    };
  }

  /**
   * XLS-01.1 & XLS-01.4: 3. Validate row - Dùng chung giữa Preview và Execute
   */
  public validateRow(
    type: 'products' | 'suppliers' | 'opening_stock',
    normRow: NormalizedRow,
    context: {
      seenCodes: Set<string>;
    },
  ): NormalizedRow {
    const { rowNumber, data } = normRow;
    const errors = [...normRow.errors];
    const warnings = [...normRow.warnings];

    if (type === 'products') {
      // 1. Mã SKU bắt buộc & không trùng trong file
      if (!data.sku) {
        errors.push({
          rowNumber,
          column: 'A',
          field: 'sku',
          value: data.sku,
          message: 'Mã SKU không được để trống',
        });
      } else if (context.seenCodes.has(data.sku.toUpperCase())) {
        errors.push({
          rowNumber,
          column: 'A',
          field: 'sku',
          value: data.sku,
          message: `Mã SKU "${data.sku}" bị trùng lặp trong file`,
        });
      } else {
        context.seenCodes.add(data.sku.toUpperCase());
      }

      // 2. Tên sản phẩm bắt buộc
      if (!data.name) {
        errors.push({
          rowNumber,
          column: 'B',
          field: 'name',
          value: data.name,
          message: 'Tên sản phẩm không được để trống',
        });
      }

      // 3. Danh mục bắt buộc
      if (!data.category) {
        errors.push({
          rowNumber,
          column: 'C',
          field: 'category',
          value: data.category,
          message: 'Danh mục không được để trống',
        });
      }

      // 4. Giá bán bắt buộc, không được undefined/null/NaN, phải >= 0
      if (
        data.price === null ||
        data.price === undefined ||
        isNaN(data.price)
      ) {
        errors.push({
          rowNumber,
          column: 'D',
          field: 'price',
          value: data.price,
          message: 'Giá bán không được để trống và phải là số hợp lệ',
        });
      } else if (data.price < 0) {
        errors.push({
          rowNumber,
          column: 'D',
          field: 'price',
          value: data.price,
          message: 'Giá bán phải là số >= 0',
        });
      } else if (data.price === 0) {
        warnings.push(
          `Dòng ${rowNumber}: Giá bán bằng 0 (hàng tặng / khuyến mại)`,
        );
      }

      // 5. Giá vốn nếu có phải >= 0
      if (data.costPrice !== null && data.costPrice !== undefined) {
        if (isNaN(data.costPrice) || data.costPrice < 0) {
          errors.push({
            rowNumber,
            column: 'E',
            field: 'costPrice',
            value: data.costPrice,
            message: 'Giá vốn phải là số >= 0',
          });
        }
      }

      // 6. Tồn kho nếu có phải là số nguyên >= 0
      if (data.stock !== null && data.stock !== undefined) {
        if (
          isNaN(data.stock) ||
          data.stock < 0 ||
          !Number.isInteger(data.stock)
        ) {
          errors.push({
            rowNumber,
            column: 'F',
            field: 'stock',
            value: data.stock,
            message: 'Số lượng tồn kho phải là số nguyên >= 0',
          });
        }
      }
    } else if (type === 'suppliers') {
      // 1. Mã NCC
      if (!data.code) {
        errors.push({
          rowNumber,
          column: 'A',
          field: 'code',
          value: data.code,
          message: 'Mã nhà cung cấp không được để trống',
        });
      } else if (context.seenCodes.has(data.code.toUpperCase())) {
        errors.push({
          rowNumber,
          column: 'A',
          field: 'code',
          value: data.code,
          message: `Mã nhà cung cấp "${data.code}" bị trùng trong file`,
        });
      } else {
        context.seenCodes.add(data.code.toUpperCase());
      }

      // 2. Tên NCC
      if (!data.name) {
        errors.push({
          rowNumber,
          column: 'B',
          field: 'name',
          value: data.name,
          message: 'Tên nhà cung cấp không được để trống',
        });
      }

      // 3. Số điện thoại bắt buộc (XLS-T01)
      if (!data.phone) {
        errors.push({
          rowNumber,
          column: 'D',
          field: 'phone',
          value: data.phone,
          message: 'Số điện thoại không được để trống',
        });
      }
    } else if (type === 'opening_stock') {
      // 1. Mã SKU
      if (!data.sku) {
        errors.push({
          rowNumber,
          column: 'A',
          field: 'sku',
          value: data.sku,
          message: 'Mã SKU không được để trống',
        });
      } else if (context.seenCodes.has(data.sku.toUpperCase())) {
        errors.push({
          rowNumber,
          column: 'A',
          field: 'sku',
          value: data.sku,
          message: `Mã SKU "${data.sku}" bị trùng trong file`,
        });
      } else {
        context.seenCodes.add(data.sku.toUpperCase());
      }

      // 2. Tồn đầu kỳ (XLS-T05: 0 là hợp lệ, nhưng null/NaN/<0 là lỗi)
      if (
        data.openingStock === null ||
        data.openingStock === undefined ||
        isNaN(data.openingStock) ||
        data.openingStock < 0 ||
        !Number.isInteger(data.openingStock)
      ) {
        errors.push({
          rowNumber,
          column: 'C',
          field: 'openingStock',
          value: data.openingStock,
          message: 'Tồn đầu kỳ phải là số nguyên >= 0',
        });
      }

      // 3. Giá vốn nhập
      if (
        data.unitCost === null ||
        data.unitCost === undefined ||
        isNaN(data.unitCost) ||
        data.unitCost < 0
      ) {
        errors.push({
          rowNumber,
          column: 'D',
          field: 'unitCost',
          value: data.unitCost,
          message: 'Giá vốn phải là số >= 0',
        });
      }
    }

    return {
      rowNumber,
      data,
      errors,
      warnings,
      isValid: errors.length === 0,
    };
  }

  /**
   * DOC-01: Đọc và kiểm tra dữ liệu trước khi import (Dry-run / Preview)
   */
  async previewImport(
    type: 'products' | 'suppliers' | 'opening_stock',
    fileBuffer: Buffer,
  ): Promise<PreviewResult> {
    const fileHash = this.computeFileHash(fileBuffer);
    const { rows, headerMap } = await this.parseWorkbook(fileBuffer, type);

    const existingBatch = await this.importBatchModel.findOne({
      fileHash,
      importType: type,
      status: { $in: [ImportBatchStatus.COMPLETED, ImportBatchStatus.PARTIAL] },
    });

    const isDuplicateFile = !!existingBatch;
    const globalWarnings: string[] = [];
    if (isDuplicateFile) {
      globalWarnings.push(
        `Cảnh báo: File này đã từng được import trong đợt "${existingBatch.batchId}". Hãy kiểm tra để tránh trùng lặp.`,
      );
    }

    const seenCodes = new Set<string>();
    const allErrors: RowError[] = [];
    const previewData: any[] = [];
    let validCount = 0;
    let invalidCount = 0;

    for (const rowItem of rows) {
      const norm = this.normalizeRow(
        type,
        rowItem.cells,
        rowItem.rowNumber,
        headerMap,
      );
      const validated = this.validateRow(type, norm, { seenCodes });

      if (validated.isValid) {
        validCount++;
      } else {
        invalidCount++;
        allErrors.push(...validated.errors);
      }

      if (validated.warnings.length > 0) {
        globalWarnings.push(...validated.warnings);
      }

      previewData.push({
        rowNumber: validated.rowNumber,
        ...validated.data,
        isValid: validated.isValid,
      });
    }

    return {
      templateType: type,
      fileHash,
      isDuplicateFile,
      totalRows: rows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      skippedRows: 0,
      errors: allErrors,
      warnings: globalWarnings,
      previewData: previewData.slice(0, 100),
    };
  }

  /**
   * XLS-01.1: 4. Map normalized row sang domain command
   */
  public mapCommand(
    type: 'products' | 'suppliers' | 'opening_stock',
    normRow: NormalizedRow,
  ): any {
    return { ...normRow.data, rowNumber: normRow.rowNumber };
  }

  /**
   * XLS-01.1: 5. Execute valid row - Thực thi một dòng hợp lệ
   */
  public async executeValidRow(
    type: 'products' | 'suppliers' | 'opening_stock',
    command: any,
    userId: string,
    batchId: string,
    options?: ImportOptionsDto,
  ): Promise<{
    status: 'SUCCESS' | 'SKIPPED' | 'FAILED';
    isUpdate?: boolean;
    code?: string;
    entityId?: string;
    error?: string;
  }> {
    if (type === 'products') {
      const {
        sku,
        name,
        category: catName,
        price,
        costPrice,
        stock,
        unit,
        barcode,
      } = command;

      let category = await this.categoryModel.findOne({
        name: new RegExp(`^${this.escapeRegex(catName)}$`, 'i'),
      });

      if (!category) {
        if (options?.createCategoryIfMissing) {
          category = new this.categoryModel({
            name: catName,
            slug: catName.toLowerCase().replace(/\s+/g, '-'),
          });
          await category.save();
        } else {
          return {
            status: 'FAILED',
            code: sku,
            error: `Danh mục "${catName}" chưa tồn tại trong hệ thống. Vui lòng tạo danh mục trước hoặc bật tùy chọn tự động tạo.`,
          };
        }
      }

      const existingProduct = await this.productModel.findOne({ sku });
      if (existingProduct) {
        if (options?.onDuplicateSku === OnDuplicateSkuAction.REJECT) {
          return {
            status: 'FAILED',
            code: sku,
            error: `Mã SKU "${sku}" đã tồn tại trong hệ thống (tùy chọn: Từ chối trùng SKU)`,
          };
        }
        if (options?.onDuplicateSku === OnDuplicateSkuAction.SKIP) {
          return {
            status: 'SKIPPED',
            code: sku,
            entityId: existingProduct._id.toString(),
          };
        }

        existingProduct.name = name;
        existingProduct.price = price;
        existingProduct.unit = unit;
        if (barcode) existingProduct.barcode = barcode;
        await existingProduct.save();

        return {
          status: 'SUCCESS',
          isUpdate: true,
          code: sku,
          entityId: existingProduct._id.toString(),
        };
      } else {
        const baseSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

        const newProduct = new this.productModel({
          sku,
          name,
          slug: uniqueSlug,
          category: category._id,
          price,
          stock: 0,
          unit,
          barcode: barcode || undefined,
          status: ProductStatus.ACTIVE,
        });
        await newProduct.save();

        const initialStock = stock ?? 0;
        const initialCost = costPrice ?? 0;

        if (initialStock > 0) {
          await this.inventoryService.importStock(
            {
              product: newProduct._id.toString(),
              quantity: initialStock,
              costPrice: initialCost,
              reference: `IMPORT_${batchId}_${sku}`,
              note: 'Nhập tồn đầu kỳ qua Excel',
            },
            userId,
          );
        } else {
          await this.inventoryService.ensureInventoryRecord(
            newProduct._id.toString(),
          );
        }

        return {
          status: 'SUCCESS',
          isUpdate: false,
          code: sku,
          entityId: newProduct._id.toString(),
        };
      }
    } else if (type === 'suppliers') {
      const { code, name, contactPerson, phone, email, address, taxCode } =
        command;

      const existingSupplier = await this.supplierModel.findOne({ code });
      if (existingSupplier) {
        existingSupplier.name = name;
        existingSupplier.phone = phone;
        if (contactPerson) existingSupplier.contactPerson = contactPerson;
        if (email) existingSupplier.email = email;
        if (address) existingSupplier.address = address;
        if (taxCode) existingSupplier.taxCode = taxCode;
        await existingSupplier.save();

        return {
          status: 'SUCCESS',
          isUpdate: true,
          code,
          entityId: existingSupplier._id.toString(),
        };
      } else {
        const newSupplier = new this.supplierModel({
          code,
          name,
          contactPerson: contactPerson || undefined,
          phone,
          email: email || undefined,
          address: address || undefined,
          taxCode: taxCode || undefined,
        });
        await newSupplier.save();

        return {
          status: 'SUCCESS',
          isUpdate: false,
          code,
          entityId: newSupplier._id.toString(),
        };
      }
    } else if (type === 'opening_stock') {
      const { sku, openingStock, unitCost } = command;

      const product = await this.productModel.findOne({ sku });
      if (!product) {
        return {
          status: 'FAILED',
          code: sku,
          error: `Không tìm thấy sản phẩm có SKU "${sku}" trong hệ thống`,
        };
      }

      // Idempotency: mã reference gắn với batchId để tránh nhân đôi giao dịch
      const refKey = `OPENING_STOCK_${batchId}_${sku}`;
      if (openingStock > 0) {
        await this.inventoryService.importStock(
          {
            product: product._id.toString(),
            quantity: openingStock,
            costPrice: unitCost,
            reference: refKey,
            note: 'Ghi nhận tồn đầu kỳ theo import Excel',
          },
          userId,
        );
      } else {
        // XLS-T05: Tồn đầu kỳ = 0 vẫn đảm bảo bản ghi tồn kho được khởi tạo
        await this.inventoryService.ensureInventoryRecord(
          product._id.toString(),
        );
      }

      return {
        status: 'SUCCESS',
        code: sku,
        entityId: product._id.toString(),
      };
    }

    return { status: 'FAILED', error: 'Loại entity không hỗ trợ' };
  }

  /**
   * XLS-01: Thực thi import chính thức với Shared Validation Pipeline & Audit Batch
   */
  async executeImport(
    type: 'products' | 'suppliers' | 'opening_stock',
    fileBuffer: Buffer,
    userId: string,
    options?: ImportOptionsDto,
  ): Promise<ImportResult> {
    const fileHash = this.computeFileHash(fileBuffer);

    // XLS-T10: Kiểm tra file đã từng import thành công trước đó
    if (!options?.allowReimport) {
      const completedBatch = await this.importBatchModel.findOne({
        fileHash,
        importType: type,
        status: {
          $in: [ImportBatchStatus.COMPLETED, ImportBatchStatus.PARTIAL],
        },
      });
      if (completedBatch) {
        throw new BadRequestException(
          `File này đã từng được import thành công trong đợt "${completedBatch.batchId}". Bật tùy chọn allowReimport nếu muốn tiếp tục.`,
        );
      }
    }

    // Pipeline: 1. Parse workbook
    const { rows, headerMap } = await this.parseWorkbook(fileBuffer, type);
    const seenCodes = new Set<string>();

    const validatedRows: NormalizedRow[] = [];
    const initialErrors: RowError[] = [];

    // Pipeline: 2. Normalize & 3. Validate
    for (const r of rows) {
      const norm = this.normalizeRow(type, r.cells, r.rowNumber, headerMap);
      const validated = this.validateRow(type, norm, { seenCodes });
      validatedRows.push(validated);
      if (!validated.isValid) {
        initialErrors.push(...validated.errors);
      }
    }

    const invalidCount = validatedRows.filter((r) => !r.isValid).length;

    // XLS-T08: Nếu skipErrors = false và có dòng lỗi -> Từ chối toàn bộ batch
    if (invalidCount > 0 && !options?.skipErrors) {
      throw new BadRequestException(
        `File Excel chứa ${invalidCount} dòng lỗi. Vui lòng khắc phục hoặc bật chế độ bỏ qua dòng lỗi.`,
      );
    }

    const batchId = `IB-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const importedCodes: string[] = [];
    let importedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const executionErrors: RowError[] = [...initialErrors];

    // Pipeline: 4. Map & 5. Execute
    for (const vRow of validatedRows) {
      if (!vRow.isValid) {
        // Dòng không hợp lệ trong chế độ skipErrors=true -> bỏ qua không execute
        skippedCount++;
        continue;
      }

      const command = this.mapCommand(type, vRow);

      try {
        const result = await this.executeValidRow(
          type,
          command,
          userId,
          batchId,
          options,
        );

        if (result.status === 'SUCCESS') {
          if (result.isUpdate) {
            updatedCount++;
          } else {
            importedCount++;
          }
          if (result.code) importedCodes.push(result.code);
        } else if (result.status === 'SKIPPED') {
          skippedCount++;
        } else {
          // Failed in execution
          failedCount++;
          executionErrors.push({
            rowNumber: vRow.rowNumber,
            column: 'ALL',
            field: 'execute',
            value: result.code || null,
            message: result.error || 'Thực thi dòng thất bại',
          });
        }
      } catch (err: any) {
        this.logger.error(
          `Lỗi thực thi dòng ${vRow.rowNumber}: ${err?.message || err}`,
        );
        failedCount++;
        executionErrors.push({
          rowNumber: vRow.rowNumber,
          column: 'ALL',
          field: 'execute',
          value: null,
          message: err?.message || 'Lỗi không xác định khi lưu cơ sở dữ liệu',
        });
      }
    }

    const successCount = importedCount + updatedCount;
    const isSuccess = failedCount === 0 && initialErrors.length === 0;
    const isPartialSuccess =
      successCount > 0 && (failedCount > 0 || initialErrors.length > 0);

    let batchStatus = ImportBatchStatus.COMPLETED;
    if (isPartialSuccess) {
      batchStatus = ImportBatchStatus.PARTIAL;
    } else if (!isSuccess && successCount === 0) {
      batchStatus = ImportBatchStatus.FAILED;
    }

    // XLS-01.5: Lưu audit record ImportBatch
    try {
      await this.importBatchModel.create({
        batchId,
        fileName: 'import.xlsx',
        fileHash,
        importType: type,
        uploadedBy: userId,
        status: batchStatus,
        totalRows: rows.length,
        successCount,
        failedCount:
          failedCount + (options?.skipErrors ? initialErrors.length : 0),
        skippedCount,
        partialSuccess: isPartialSuccess,
        options: options || {},
        importErrors: executionErrors,
        importedCodes,
      });
    } catch (saveErr: any) {
      this.logger.warn(`Không thể lưu audit batch: ${saveErr?.message}`);
    }

    return {
      batchId,
      templateType: type,
      success: isSuccess,
      partialSuccess: isPartialSuccess,
      totalRows: rows.length,
      totalProcessed: successCount + failedCount + skippedCount,
      successCount,
      importedCount,
      updatedCount,
      failedCount:
        failedCount + (options?.skipErrors ? initialErrors.length : 0),
      skippedCount,
      importedCodes,
      errors: executionErrors,
    };
  }

  /**
   * XLS-T12: Xuất file Excel báo cáo danh sách dòng lỗi
   */
  async exportErrorReport(errors: RowError[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bao_Cao_Loi');

    sheet.columns = [
      { header: 'Dòng', key: 'rowNumber', width: 10 },
      { header: 'Cột', key: 'column', width: 10 },
      { header: 'Trường dữ liệu', key: 'field', width: 20 },
      { header: 'Giá trị gửi lên', key: 'value', width: 25 },
      { header: 'Thông báo lỗi', key: 'message', width: 60 },
    ];

    sheet.getRow(1).font = { bold: true };

    for (const err of errors) {
      sheet.addRow({
        rowNumber: err.rowNumber,
        column: err.column,
        field: err.field,
        value:
          typeof err.value === 'object'
            ? JSON.stringify(err.value)
            : String(err.value ?? ''),
        message: err.message,
      });
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
