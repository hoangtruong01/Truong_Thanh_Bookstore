import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import {
  Category,
  CategoryDocument,
} from '../categories/schemas/category.schema';
import {
  Supplier,
  SupplierDocument,
} from '../suppliers/schemas/supplier.schema';
import { InventoryService } from '../inventory/inventory.service';
import { ProductStatus } from '../../common/enums';

export interface RowError {
  rowNumber: number;
  column: string;
  field: string;
  value: any;
  message: string;
}

export interface PreviewResult {
  templateType: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: RowError[];
  previewData: any[];
}

export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  importedCount: number;
  updatedCount: number;
  failedCount: number;
  importedCodes: string[];
  errors: RowError[];
}

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
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * Bảo mật: Khử nguy cơ Formula Injection (CSV/Excel Formula Injection - CWE-1236)
   * Các ký tự bắt đầu hiểm độc: =, +, -, @, |, tab, CR
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
   * DOC-01: Tạo file mẫu Excel chuẩn theo từng nghiệp vụ (có sheet Hướng dẫn và Dữ liệu)
   */
  async generateTemplate(
    type: 'products' | 'suppliers' | 'opening_stock',
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Truong Thanh Bookstore ERP';
    workbook.created = new Date();

    // 1. Sheet Hướng dẫn
    const guideSheet = workbook.addWorksheet('Huong_Dan');
    guideSheet.columns = [
      { header: 'Mục', key: 'section', width: 20 },
      { header: 'Quy định / Hướng dẫn', key: 'content', width: 80 },
    ];
    guideSheet.getRow(1).font = { bold: true };

    // 2. Sheet Dữ liệu mẫu
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
   * DOC-01: Đọc và kiểm tra dữ liệu trước khi import (Dry-run / Preview)
   */
  async previewImport(
    type: 'products' | 'suppliers' | 'opening_stock',
    fileBuffer: Buffer,
  ): Promise<PreviewResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    const sheet =
      workbook.getWorksheet('Du_Lieu') ||
      workbook.getWorksheet(1) ||
      workbook.worksheets[0];

    if (!sheet) {
      throw new BadRequestException(
        'Không tìm thấy sheet dữ liệu trong file Excel tải lên',
      );
    }

    const errors: RowError[] = [];
    const previewData: any[] = [];
    const seenCodes = new Set<string>();

    const rowCount = sheet.rowCount;
    if (rowCount < 2) {
      return {
        templateType: type,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [],
        previewData: [],
      };
    }

    // Đọc header dòng 1
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = this.getCellText(cell.value);
    });

    for (let r = 2; r <= rowCount; r++) {
      const row = sheet.getRow(r);
      const isRowEmpty =
        !row.values ||
        (Array.isArray(row.values) &&
          row.values
            .slice(1)
            .every((v) => v === null || v === undefined || v === ''));
      if (isRowEmpty) continue;

      const rowObj: Record<string, any> = {};
      let hasError = false;

      if (type === 'products') {
        const skuRaw = row.getCell(1).value;
        const nameRaw = row.getCell(2).value;
        const catRaw = row.getCell(3).value;
        const priceRaw = row.getCell(4).value;
        const costPriceRaw = row.getCell(5).value;
        const stockRaw = row.getCell(6).value;

        const sku = this.getCellText(skuRaw);
        const name = this.getCellText(nameRaw);
        const category = this.getCellText(catRaw);
        const price = Number(priceRaw);
        const costPrice = costPriceRaw ? Number(costPriceRaw) : 0;
        const stock = stockRaw ? Number(stockRaw) : 0;

        if (!sku) {
          errors.push({
            rowNumber: r,
            column: 'A',
            field: 'sku',
            value: skuRaw,
            message: 'Mã SKU không được để trống',
          });
          hasError = true;
        } else if (seenCodes.has(sku.toUpperCase())) {
          errors.push({
            rowNumber: r,
            column: 'A',
            field: 'sku',
            value: sku,
            message: `Mã SKU "${sku}" bị trùng lặp trong file`,
          });
          hasError = true;
        } else {
          seenCodes.add(sku.toUpperCase());
        }

        if (!name) {
          errors.push({
            rowNumber: r,
            column: 'B',
            field: 'name',
            value: nameRaw,
            message: 'Tên sản phẩm không được để trống',
          });
          hasError = true;
        }

        if (!category) {
          errors.push({
            rowNumber: r,
            column: 'C',
            field: 'category',
            value: catRaw,
            message: 'Danh mục không được để trống',
          });
          hasError = true;
        }

        if (isNaN(price) || price < 0) {
          errors.push({
            rowNumber: r,
            column: 'D',
            field: 'price',
            value: priceRaw,
            message: 'Giá bán phải là số >= 0',
          });
          hasError = true;
        }

        if (isNaN(costPrice) || costPrice < 0) {
          errors.push({
            rowNumber: r,
            column: 'E',
            field: 'costPrice',
            value: costPriceRaw,
            message: 'Giá vốn phải là số >= 0',
          });
          hasError = true;
        }

        if (isNaN(stock) || stock < 0) {
          errors.push({
            rowNumber: r,
            column: 'F',
            field: 'stock',
            value: stockRaw,
            message: 'Số lượng tồn kho phải là số nguyên >= 0',
          });
          hasError = true;
        }

        rowObj.sku = this.sanitizeCellValue(sku);
        rowObj.name = this.sanitizeCellValue(name);
        rowObj.category = this.sanitizeCellValue(category);
        rowObj.price = price;
        rowObj.costPrice = costPrice;
        rowObj.stock = stock;
        rowObj.isValid = !hasError;
      } else if (type === 'suppliers') {
        const codeRaw = row.getCell(1).value;
        const nameRaw = row.getCell(2).value;
        const phoneRaw = row.getCell(4).value;

        const code = this.getCellText(codeRaw);
        const name = this.getCellText(nameRaw);
        const phone = this.getCellText(phoneRaw);

        if (!code) {
          errors.push({
            rowNumber: r,
            column: 'A',
            field: 'code',
            value: codeRaw,
            message: 'Mã nhà cung cấp không được để trống',
          });
          hasError = true;
        } else if (seenCodes.has(code.toUpperCase())) {
          errors.push({
            rowNumber: r,
            column: 'A',
            field: 'code',
            value: code,
            message: `Mã nhà cung cấp "${code}" bị trùng trong file`,
          });
          hasError = true;
        } else {
          seenCodes.add(code.toUpperCase());
        }

        if (!name) {
          errors.push({
            rowNumber: r,
            column: 'B',
            field: 'name',
            value: nameRaw,
            message: 'Tên nhà cung cấp không được để trống',
          });
          hasError = true;
        }

        if (!phone) {
          errors.push({
            rowNumber: r,
            column: 'D',
            field: 'phone',
            value: phoneRaw,
            message: 'Số điện thoại không được để trống',
          });
          hasError = true;
        }

        rowObj.code = this.sanitizeCellValue(code);
        rowObj.name = this.sanitizeCellValue(name);
        rowObj.phone = this.sanitizeCellValue(phone);
        rowObj.isValid = !hasError;
      } else if (type === 'opening_stock') {
        const skuRaw = row.getCell(1).value;
        const stockRaw = row.getCell(3).value;
        const costRaw = row.getCell(4).value;

        const sku = this.getCellText(skuRaw);
        const stock = Number(stockRaw);
        const cost = Number(costRaw);

        if (!sku) {
          errors.push({
            rowNumber: r,
            column: 'A',
            field: 'sku',
            value: skuRaw,
            message: 'Mã SKU không được để trống',
          });
          hasError = true;
        } else if (seenCodes.has(sku.toUpperCase())) {
          errors.push({
            rowNumber: r,
            column: 'A',
            field: 'sku',
            value: sku,
            message: `Mã SKU "${sku}" bị trùng trong file`,
          });
          hasError = true;
        } else {
          seenCodes.add(sku.toUpperCase());
        }

        if (isNaN(stock) || stock < 0) {
          errors.push({
            rowNumber: r,
            column: 'C',
            field: 'openingStock',
            value: stockRaw,
            message: 'Tồn đầu kỳ phải là số >= 0',
          });
          hasError = true;
        }

        if (isNaN(cost) || cost < 0) {
          errors.push({
            rowNumber: r,
            column: 'D',
            field: 'unitCost',
            value: costRaw,
            message: 'Giá vốn phải là số >= 0',
          });
          hasError = true;
        }

        rowObj.sku = this.sanitizeCellValue(sku);
        rowObj.openingStock = stock;
        rowObj.unitCost = cost;
        rowObj.isValid = !hasError;
      }

      previewData.push(rowObj);
    }

    const validRows = previewData.filter((d) => d.isValid).length;
    const invalidRows = previewData.length - validRows;

    return {
      templateType: type,
      totalRows: previewData.length,
      validRows,
      invalidRows,
      errors,
      previewData: previewData.slice(0, 100),
    };
  }

  /**
   * DOC-02 & DOC-03: Thực thi Import chính thức sau khi preview được xác nhận
   */
  async executeImport(
    type: 'products' | 'suppliers' | 'opening_stock',
    fileBuffer: Buffer,
    userId: string,
    options?: { skipErrors?: boolean },
  ): Promise<ImportResult> {
    const preview = await this.previewImport(type, fileBuffer);

    if (preview.invalidRows > 0 && !options?.skipErrors) {
      throw new BadRequestException(
        `File Excel chứa ${preview.invalidRows} dòng lỗi. Vui lòng khắc phục hoặc bật chế độ bỏ qua dòng lỗi.`,
      );
    }

    const importedCodes: string[] = [];
    let importedCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const executionErrors: RowError[] = [];

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    const sheet =
      workbook.getWorksheet('Du_Lieu') ||
      workbook.getWorksheet(1) ||
      workbook.worksheets[0];

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

      try {
        if (type === 'products') {
          const sku = this.getCellText(row.getCell(1).value);
          const name = this.getCellText(row.getCell(2).value);
          const catName = this.getCellText(row.getCell(3).value);
          const price = Number(row.getCell(4).value) || 0;
          const costPrice = Number(row.getCell(5).value) || 0;
          const stock = Number(row.getCell(6).value) || 0;
          const unit = this.getCellText(row.getCell(7).value) || 'cái';
          const barcode = this.getCellText(row.getCell(8).value);

          if (!sku || !name || price < 0) continue;

          // Tìm hoặc tạo category
          let category = await this.categoryModel.findOne({
            name: new RegExp(`^${catName}$`, 'i'),
          });
          if (!category) {
            category = new this.categoryModel({
              name: catName || 'Chung',
              slug: catName
                ? catName.toLowerCase().replace(/\s+/g, '-')
                : 'chung',
            });
            await category.save();
          }

          const existingProduct = await this.productModel.findOne({ sku });
          if (existingProduct) {
            existingProduct.name = this.sanitizeCellValue(name);
            existingProduct.price = price;
            existingProduct.unit = unit;
            if (barcode) existingProduct.barcode = barcode;
            await existingProduct.save();
            updatedCount++;
          } else {
            const baseSlug = name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

            const newProduct = new this.productModel({
              sku,
              name: this.sanitizeCellValue(name),
              slug: uniqueSlug,
              category: category._id,
              price,
              stock: 0,
              unit,
              barcode: barcode || undefined,
              status: ProductStatus.ACTIVE,
            });
            await newProduct.save();

            if (stock > 0) {
              await this.inventoryService.importStock(
                {
                  product: newProduct._id.toString(),
                  quantity: stock,
                  costPrice,
                  reference: `IMPORT_${sku}`,
                  note: 'Nhập tồn đầu kỳ qua Excel',
                },
                userId,
              );
            } else {
              await this.inventoryService.ensureInventoryRecord(
                newProduct._id.toString(),
              );
            }
            importedCount++;
          }
          importedCodes.push(sku);
        } else if (type === 'suppliers') {
          const code = this.getCellText(row.getCell(1).value);
          const name = this.getCellText(row.getCell(2).value);
          const contactPerson = this.getCellText(row.getCell(3).value);
          const phone = this.getCellText(row.getCell(4).value);
          const email = this.getCellText(row.getCell(5).value);
          const address = this.getCellText(row.getCell(6).value);
          const taxCode = this.getCellText(row.getCell(7).value);

          if (!code || !name) continue;

          const existingSupplier = await this.supplierModel.findOne({ code });
          if (existingSupplier) {
            existingSupplier.name = this.sanitizeCellValue(name);
            existingSupplier.phone = phone;
            if (contactPerson) existingSupplier.contactPerson = contactPerson;
            if (email) existingSupplier.email = email;
            if (address) existingSupplier.address = address;
            if (taxCode) existingSupplier.taxCode = taxCode;
            await existingSupplier.save();
            updatedCount++;
          } else {
            const newSupplier = new this.supplierModel({
              code,
              name: this.sanitizeCellValue(name),
              contactPerson: contactPerson || undefined,
              phone,
              email: email || undefined,
              address: address || undefined,
              taxCode: taxCode || undefined,
            });
            await newSupplier.save();
            importedCount++;
          }
          importedCodes.push(code);
        } else if (type === 'opening_stock') {
          const sku = this.getCellText(row.getCell(1).value);
          const stock = Number(row.getCell(3).value) || 0;
          const cost = Number(row.getCell(4).value) || 0;

          if (!sku || stock <= 0) continue;

          const product = await this.productModel.findOne({ sku });
          if (!product) {
            executionErrors.push({
              rowNumber: r,
              column: 'A',
              field: 'sku',
              value: sku,
              message: `Không tìm thấy sản phẩm có SKU "${sku}" trong hệ thống`,
            });
            failedCount++;
            continue;
          }

          // Idempotent: kiểm tra xem đã import tồn đầu kỳ với reference này chưa
          const refKey = `OPENING_STOCK_${sku}`;
          await this.inventoryService.importStock(
            {
              product: product._id.toString(),
              quantity: stock,
              costPrice: cost,
              reference: refKey,
              note: `Ghi nhận tồn đầu kỳ theo import Excel`,
            },
            userId,
          );

          importedCodes.push(sku);
          importedCount++;
        }
      } catch (err: any) {
        this.logger.error(`Lỗi khi import dòng ${r}: ${err?.message || err}`);
        executionErrors.push({
          rowNumber: r,
          column: 'ALL',
          field: 'row',
          value: null,
          message: err?.message || 'Lỗi không xác định',
        });
        failedCount++;
      }
    }

    return {
      success: executionErrors.length === 0 || (options?.skipErrors ?? false),
      totalProcessed: importedCount + updatedCount + failedCount,
      importedCount,
      updatedCount,
      failedCount,
      importedCodes,
      errors: executionErrors,
    };
  }
}
