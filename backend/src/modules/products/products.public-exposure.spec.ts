/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import * as ExcelJS from 'exceljs';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  ProductsService,
  PRODUCT_IMPORT_MAX_ROWS,
  isStaffViewer,
  stripPrivateProductFields,
} from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './schemas/product.schema';
import { StockAlert } from './schemas/stock-alert.schema';
import { Category } from '../categories/schemas/category.schema';
import { Inventory } from '../inventory/schemas/inventory.schema';
import { ReviewsService } from '../reviews/reviews.service';
import { EmailService } from '../email/email.service';
import { ProductStatus } from '../../common/enums';
import { ProductQueryDto } from './dto/product.dto';
import { PaginationDto, clampLimit } from '../../common/dto/pagination.dto';

/** Query chainable: mọi method trả về chính nó, await / exec() trả về `result`. */
const chain = (result: unknown) => {
  const q: any = {};
  for (const m of [
    'populate',
    'sort',
    'skip',
    'limit',
    'select',
    'lean',
    'find',
  ]) {
    q[m] = jest.fn().mockImplementation(() => q);
  }
  q.exec = jest.fn().mockResolvedValue(result);
  q.then = (res: any, rej: any) => Promise.resolve(result).then(res, rej);
  return q;
};

const privateDoc = (status = ProductStatus.ACTIVE) => ({
  _id: 'p1',
  name: 'Bút',
  price: 5000,
  wholesalePrice: 3000,
  costPrice: 2000,
  status,
  isDeleted: false,
});

describe('ProductsService — SEC-012/016/025', () => {
  let service: ProductsService;
  let productModel: any;

  beforeEach(async () => {
    productModel = {
      find: jest.fn().mockImplementation(() => chain([privateDoc()])),
      findById: jest.fn(),
      findOne: jest.fn(),
      countDocuments: jest.fn().mockReturnValue(chain(1)),
      applyDefaults: jest.fn(),
    };
    const categoryModel = {
      find: jest.fn().mockImplementation(() => chain([])),
      findOne: jest.fn().mockImplementation(() => chain(null)),
      applyDefaults: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: productModel },
        { provide: getModelToken(Category.name), useValue: categoryModel },
        { provide: getModelToken(Inventory.name), useValue: {} },
        { provide: getModelToken(StockAlert.name), useValue: {} },
        { provide: ReviewsService, useValue: {} },
        { provide: EmailService, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  const lastFindFilter = () => {
    const calls = productModel.find.mock.calls;
    return calls[calls.length - 1][0];
  };

  describe('SEC-016: ép status ACTIVE cho khách', () => {
    it('khách vãng lai truyền status=INACTIVE vẫn bị ép về ACTIVE', async () => {
      await service.findAll({ status: ProductStatus.INACTIVE });
      expect(lastFindFilter().status).toBe(ProductStatus.ACTIVE);
    });

    it('CUSTOMER truyền status=INACTIVE vẫn bị ép về ACTIVE', async () => {
      await service.findAll(
        { status: ProductStatus.INACTIVE },
        {
          role: 'CUSTOMER',
        },
      );
      expect(lastFindFilter().status).toBe(ProductStatus.ACTIVE);
    });

    it('khách không truyền status vẫn chỉ thấy ACTIVE', async () => {
      await service.findAll({});
      expect(lastFindFilter().status).toBe(ProductStatus.ACTIVE);
    });

    it('ADMIN / STAFF vẫn lọc được theo status tuỳ ý', async () => {
      await service.findAll(
        { status: ProductStatus.INACTIVE },
        {
          role: 'ADMIN',
        },
      );
      expect(lastFindFilter().status).toBe(ProductStatus.INACTIVE);
      await service.findAll(
        { status: ProductStatus.INACTIVE },
        {
          role: 'STAFF',
        },
      );
      expect(lastFindFilter().status).toBe(ProductStatus.INACTIVE);
    });

    it('ADMIN không truyền status thì thấy mọi trạng thái', async () => {
      await service.findAll({}, { role: 'SUPER_ADMIN' });
      expect(lastFindFilter().status).toBeUndefined();
    });

    it('findByIdForViewer: khách nhận 404 với sản phẩm INACTIVE, admin thì xem được', async () => {
      productModel.findById.mockReturnValue(
        chain(privateDoc(ProductStatus.INACTIVE)),
      );
      await expect(
        service.findByIdForViewer('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findByIdForViewer('507f1f77bcf86cd799439011', {
          role: 'CUSTOMER',
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findByIdForViewer('507f1f77bcf86cd799439011', {
          role: 'ADMIN',
        }),
      ).resolves.toMatchObject({ status: ProductStatus.INACTIVE });
    });

    it('findByIdForViewer: khách vẫn xem được sản phẩm ACTIVE', async () => {
      productModel.findById.mockReturnValue(chain(privateDoc()));
      await expect(
        service.findByIdForViewer('507f1f77bcf86cd799439011'),
      ).resolves.toMatchObject({ status: ProductStatus.ACTIVE });
    });

    it('isStaffViewer chỉ true với ADMIN/SUPER_ADMIN/STAFF', () => {
      expect(isStaffViewer(null)).toBe(false);
      expect(isStaffViewer(undefined)).toBe(false);
      expect(isStaffViewer({ role: 'CUSTOMER' })).toBe(false);
      expect(isStaffViewer({ role: 'STAFF' })).toBe(true);
      expect(isStaffViewer({ role: 'ADMIN' })).toBe(true);
      expect(isStaffViewer({ role: 'SUPER_ADMIN' })).toBe(true);
    });
  });

  describe('SEC-016: stripPrivateProductFields', () => {
    it('bỏ wholesalePrice/costPrice khỏi object, mảng, document và kết quả phân trang', () => {
      const doc = { ...privateDoc(), toJSON: () => ({ ...privateDoc() }) };
      const single = stripPrivateProductFields(doc) as any;
      expect(single.wholesalePrice).toBeUndefined();
      expect(single.costPrice).toBeUndefined();
      expect(single.price).toBe(5000);

      const list = stripPrivateProductFields([privateDoc()]) as any[];
      expect(list[0].wholesalePrice).toBeUndefined();

      const page = stripPrivateProductFields({
        data: [privateDoc()],
        total: 1,
      }) as any;
      expect(page.total).toBe(1);
      expect(page.data[0].wholesalePrice).toBeUndefined();
      expect(page.data[0].costPrice).toBeUndefined();

      const suggestions = stripPrivateProductFields({
        keywords: [],
        products: [privateDoc()],
      }) as any;
      expect(suggestions.products[0].wholesalePrice).toBeUndefined();
    });

    it('không làm hỏng giá trị null/undefined', () => {
      expect(stripPrivateProductFields(null)).toBeNull();
      expect(stripPrivateProductFields(undefined)).toBeUndefined();
    });
  });

  describe('SEC-012: limit không bao giờ là "không giới hạn"', () => {
    it('clampLimit xử lý 0, âm, NaN, quá lớn', () => {
      expect(clampLimit(0, 10)).toBe(10);
      expect(clampLimit(-5, 10)).toBe(10);
      expect(clampLimit('abc', 10)).toBe(10);
      expect(clampLimit(undefined, 8)).toBe(8);
      expect(clampLimit(999999, 10, 100)).toBe(100);
      expect(clampLimit('25', 10, 100)).toBe(25);
    });

    it('findAll với limit=0 gọi .limit(10) thay vì .limit(0)', async () => {
      const q = chain([privateDoc()]);
      productModel.find.mockReturnValueOnce(q);
      await service.findAll({ page: 1, limit: 0 });
      expect(q.limit).toHaveBeenCalledWith(10);
    });

    it.each([['getBestSelling'], ['getDiscounted'], ['getNew']])(
      '%s với limit=0 / quá lớn bị chuẩn hoá',
      async (method) => {
        let q = chain([]);
        productModel.find.mockReturnValueOnce(q);
        await (service as any)[method](0);
        expect(q.limit).toHaveBeenCalledWith(10);

        q = chain([]);
        productModel.find.mockReturnValueOnce(q);
        await (service as any)[method](100000);
        expect(q.limit).toHaveBeenCalledWith(100);
      },
    );

    it('PaginationDto từ chối limit=0, âm, quá lớn và chấp nhận 1..1000', async () => {
      const check = async (limit: unknown) =>
        validate(plainToInstance(PaginationDto, { limit }));
      expect((await check(0)).length).toBeGreaterThan(0);
      expect((await check(-1)).length).toBeGreaterThan(0);
      expect((await check(1001)).length).toBeGreaterThan(0);
      expect((await check(1.5)).length).toBeGreaterThan(0);
      expect(await check(1)).toHaveLength(0);
      expect(await check(100)).toHaveLength(0);
      expect(await check(1000)).toHaveLength(0);
    });

    it('ProductQueryDto kế thừa giới hạn limit', async () => {
      const errors = await validate(
        plainToInstance(ProductQueryDto, { limit: '0' }),
      );
      expect(errors.some((e) => e.property === 'limit')).toBe(true);
    });
  });

  describe('SEC-025: import Excel', () => {
    const buildXlsx = async (rows: number) => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('DanhSachSanPham');
      ws.addRow(['Tên', 'SKU', 'Danh mục', 'Giá']);
      for (let i = 0; i < rows; i++) ws.addRow([`SP ${i}`, `SKU${i}`, 'DM', 1]);
      return Buffer.from(await wb.xlsx.writeBuffer());
    };

    it('từ chối file không phải zip (magic bytes) trước khi parse', async () => {
      await expect(
        service.importFromExcel(Buffer.from('MZ\x90\x00 giả mạo exe'), 'u1'),
      ).rejects.toThrow(/không phải file Excel/);
    });

    it('từ chối buffer rỗng', async () => {
      await expect(service.importFromExcel(Buffer.alloc(0))).rejects.toThrow(
        BadRequestException,
      );
    });

    it('từ chối tên file chứa path traversal', async () => {
      const buf = await buildXlsx(1);
      await expect(
        service.importFromExcel(buf, 'u1', '../../etc/passwd.xlsx'),
      ).rejects.toThrow(/Tên file không hợp lệ/);
    });

    it('từ chối file vượt quá số dòng tối đa', async () => {
      const buf = await buildXlsx(PRODUCT_IMPORT_MAX_ROWS + 1);
      await expect(service.importFromExcel(buf, 'u1')).rejects.toThrow(
        /vượt quá giới hạn tối đa 5000 dòng/,
      );
      // Không được chạm DB khi vượt giới hạn
      expect(productModel.find).not.toHaveBeenCalled();
    });
  });
});

describe('ProductsController — SEC-016 (giá sỉ / giá vốn chỉ cho nhân sự)', () => {
  let controller: ProductsController;
  let svc: any;

  beforeEach(() => {
    svc = {
      findAll: jest.fn().mockResolvedValue({
        data: [privateDoc()],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }),
      findByIdForViewer: jest.fn().mockResolvedValue(privateDoc()),
      findBySlug: jest.fn().mockResolvedValue(privateDoc()),
      getFeatured: jest.fn().mockResolvedValue([privateDoc()]),
      getBestSelling: jest.fn().mockResolvedValue([privateDoc()]),
      getRelated: jest.fn().mockResolvedValue([privateDoc()]),
      search: jest.fn().mockResolvedValue([privateDoc()]),
    };
    controller = new ProductsController(svc);
  });

  it('findAll: khách không nhận wholesalePrice/costPrice và service nhận viewer', async () => {
    const res: any = await controller.findAll({}, undefined);
    expect(res.data[0].wholesalePrice).toBeUndefined();
    expect(res.data[0].costPrice).toBeUndefined();
    expect(res.data[0].price).toBe(5000);
    expect(svc.findAll).toHaveBeenCalledWith({}, undefined);
  });

  it('findAll: CUSTOMER cũng không nhận giá sỉ', async () => {
    const res: any = await controller.findAll({}, { role: 'CUSTOMER' });
    expect(res.data[0].wholesalePrice).toBeUndefined();
  });

  it('findAll: STAFF/ADMIN vẫn nhận giá sỉ (POS, ProductForm)', async () => {
    const res: any = await controller.findAll({}, { role: 'STAFF' });
    expect(res.data[0].wholesalePrice).toBe(3000);
    const res2: any = await controller.findAll({}, { role: 'ADMIN' });
    expect(res2.data[0].wholesalePrice).toBe(3000);
  });

  it('chi tiết / slug / featured / best-selling / related / search đều ẩn giá sỉ với khách', async () => {
    const detail: any = await controller.findById('p1', null);
    expect(detail.wholesalePrice).toBeUndefined();
    expect(svc.findByIdForViewer).toHaveBeenCalledWith('p1', null);

    expect(((await controller.findBySlug('s', null)) as any).costPrice).toBe(
      undefined,
    );
    for (const list of [
      await controller.getFeatured(null),
      await controller.getBestSelling(5, null),
      await controller.getRelated('p1', 5, null),
      await controller.search('but', null),
    ]) {
      expect((list as any[])[0].wholesalePrice).toBeUndefined();
    }
  });

  it('chi tiết: ADMIN nhận đủ trường', async () => {
    const detail: any = await controller.findById('p1', { role: 'ADMIN' });
    expect(detail.wholesalePrice).toBe(3000);
  });
});
