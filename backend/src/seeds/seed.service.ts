import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../modules/users/schemas/user.schema';
import { Category, CategoryDocument } from '../modules/categories/schemas/category.schema';
import { Product, ProductDocument } from '../modules/products/schemas/product.schema';
import { Promotion, PromotionDocument } from '../modules/promotions/schemas/promotion.schema';
import { Inventory, InventoryDocument, InventoryTransaction, InventoryTransactionDocument } from '../modules/inventory/schemas/inventory.schema';
import { Order, OrderDocument } from '../modules/orders/schemas/order.schema';
import { UserRole, ProductStatus, DiscountType, InventoryStatus, OrderStatus, PaymentMethod, PaymentStatus } from '../common/enums';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Promotion.name) private promotionModel: Model<PromotionDocument>,
    @InjectModel(Inventory.name) private inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryTransaction.name) private transactionModel: Model<InventoryTransactionDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async onModuleInit() {
    const productCount = await this.productModel.countDocuments({}).exec();
    if (productCount !== 20) {
      this.logger.log(`Product count is ${productCount} (expected 20). Clearing database and seeding real products...`);
      await this.clearDatabase();
      await this.seed();
      this.logger.log('Database cleared and seeded with exactly 20 real stationery products successfully!');
    } else {
      this.logger.log('Database already has exactly 20 products, skipping seed.');
    }
  }

  async clearDatabase() {
    await this.userModel.deleteMany({});
    await this.categoryModel.deleteMany({});
    await this.productModel.deleteMany({});
    await this.inventoryModel.deleteMany({});
    await this.transactionModel.deleteMany({});
    await this.promotionModel.deleteMany({});
    await this.orderModel.deleteMany({});
  }

  async seed() {
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    const customerPassword = await bcrypt.hash('Customer@123456', 10);

    const admin = await this.userModel.create({
      fullName: 'Admin Truong Thanh',
      email: 'admin@truongthanh.vn',
      password: adminPassword,
      phone: '0901234567',
      role: UserRole.ADMIN,
      status: true,
    });

    const customer = await this.userModel.create({
      fullName: 'Nguyen Van Khach',
      email: 'customer@truongthanh.vn',
      password: customerPassword,
      phone: '0912345678',
      role: UserRole.CUSTOMER,
      status: true,
    });

    this.logger.log('Users seeded');

    const parentCategories = [
      { name: 'Bút - Viết', slug: 'but-viet', description: 'Các loại bút viết học sinh và văn phòng', image: '' },
      { name: 'Dụng cụ học sinh', slug: 'dung-cu-hoc-sinh', description: 'Dụng cụ học tập cho học sinh các cấp', image: '' },
      { name: 'Dụng cụ văn phòng', slug: 'dung-cu-van-phong', description: 'Thiết bị và dụng cụ văn phòng chuyên nghiệp', image: '' },
      { name: 'Sản phẩm về giấy', slug: 'san-pham-ve-giay', description: 'Giấy in, tập vở học sinh và sổ tay', image: '' },
      { name: 'Mỹ thuật - Thủ công', slug: 'dung-cu-ve', description: 'Bộ dụng cụ vẽ, màu vẽ nghệ thuật và thủ công', image: '' },
      { name: 'Máy tính - Thiết bị', slug: 'may-tinh-thiet-bi-nho', description: 'Máy tính bỏ túi khoa học và các thiết bị hỗ trợ', image: '' },
    ];

    const createdParents = await this.categoryModel.insertMany(parentCategories);
    this.logger.log('Parent categories seeded');

    const subCategories = [
      { name: 'Bút bi', slug: 'but-bi', parentId: createdParents[0]._id },
      { name: 'Bút gel', slug: 'but-gel', parentId: createdParents[0]._id },
      { name: 'Bút chì', slug: 'but-chi', parentId: createdParents[0]._id },
      { name: 'Bút dạ quang', slug: 'but-da-quang', parentId: createdParents[0]._id },
      { name: 'Gôm - Tẩy', slug: 'gom-tay', parentId: createdParents[1]._id },
      { name: 'Thước', slug: 'thuoc', parentId: createdParents[1]._id },
      { name: 'Hộp bút', slug: 'hop-but', parentId: createdParents[1]._id },
      { name: 'Balo học sinh', slug: 'balo-hoc-sinh', parentId: createdParents[1]._id },
      { name: 'Keo dán', slug: 'keo-cat', parentId: createdParents[2]._id },
      { name: 'Dao rọc giấy', slug: 'dao-roc-giay', parentId: createdParents[2]._id },
      { name: 'Băng keo', slug: 'bang-keo', parentId: createdParents[2]._id },
      { name: 'Kẹp giấy', slug: 'kep-giay', parentId: createdParents[2]._id },
      { name: 'Bìa hồ sơ', slug: 'bia-ho-so', parentId: createdParents[2]._id },
      { name: 'File tài liệu', slug: 'file-tai-lieu', parentId: createdParents[2]._id },
      { name: 'Sổ tay', slug: 'so-tay', parentId: createdParents[3]._id },
      { name: 'Tập vở', slug: 'tap-vo', parentId: createdParents[3]._id },
      { name: 'Giấy A4', slug: 'giay-a4', parentId: createdParents[3]._id },
      { name: 'Giấy note', slug: 'giay-note', parentId: createdParents[3]._id },
      { name: 'Màu vẽ', slug: 'mau-ve', parentId: createdParents[4]._id },
      { name: 'Cọ vẽ', slug: 'co-ve', parentId: createdParents[4]._id },
      { name: 'Máy tính bỏ túi', slug: 'may-tinh-bo-tui', parentId: createdParents[5]._id },
    ];

    const createdSubs = await this.categoryModel.insertMany(subCategories);
    this.logger.log('Sub categories seeded');

    const findSub = (slug: string) => {
      const found = createdSubs.find((s: any) => s.slug === slug);
      return found ? found._id : createdParents[0]._id;
    };

    const products = [
      // 1. Bút bi Thiên Long TL-027
      { name: 'Bút bi Thiên Long TL-027', slug: 'but-bi-thien-long-tl-027', sku: 'TL-027', description: 'Bút bi Thiên Long TL-027 nét viết thanh mảnh, mực đều, bền bỉ và kinh tế.', category: findSub('but-bi'), brand: 'Thiên Long', price: 5000, discountPrice: 4000, stock: 500, images: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500'], rating: 4.8, sold: 120, isFeatured: true, status: ProductStatus.ACTIVE },
      // 2. Bút bi Thiên Long TL-095
      { name: 'Bút bi Thiên Long TL-095', slug: 'but-bi-thien-long-tl-095', sku: 'TL-095', description: 'Bút bi bấm cao cấp Thiên Long TL-095 có đệm cao su êm tay khi viết lâu.', category: findSub('but-bi'), brand: 'Thiên Long', price: 12000, discountPrice: 10000, stock: 300, images: ['https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=500'], rating: 4.7, sold: 85, isFeatured: true, status: ProductStatus.ACTIVE },
      // 3. Bút gel Uni-ball Signo 0.5mm
      { name: 'Bút gel Uni-ball Signo 0.5mm', slug: 'but-gel-uni-ball-signo-0.5mm', sku: 'UNI-UM151', description: 'Bút gel nước Uni-ball Signo UM-151 nhập khẩu Nhật Bản, nét chữ cực kì sắc sảo.', category: findSub('but-gel'), brand: 'Uni-ball', price: 35000, discountPrice: 32000, stock: 150, images: ['https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=500'], rating: 4.9, sold: 90, isFeatured: true, status: ProductStatus.ACTIVE },
      // 4. Bút ký cao cấp Pentel EnerGel BL77
      { name: 'Bút ký cao cấp Pentel EnerGel BL77', slug: 'but-ky-cao-cap-pentel-energel-bl77', sku: 'PENTEL-BL77', description: 'Bút ký gel Pentel EnerGel BL77 mực nước mau khô, thiết kế sang trọng lịch lãm.', category: findSub('but-gel'), brand: 'Pentel', price: 48000, discountPrice: 42000, stock: 100, images: ['https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=500'], rating: 4.9, sold: 65, isFeatured: true, status: ProductStatus.ACTIVE },
      // 5. Bút chì gỗ 2B Thiên Long GP-01
      { name: 'Bút chì gỗ 2B Thiên Long GP-01', slug: 'but-chi-go-2b-thien-long-gp-01', sku: 'GP-01', description: 'Bút chì gỗ 2B cao cấp thích hợp viết vẽ, tô trắc nghiệm nhanh chóng.', category: findSub('but-chi'), brand: 'Thiên Long', price: 5000, discountPrice: 0, stock: 600, images: ['https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=500'], rating: 4.6, sold: 210, isFeatured: false, status: ProductStatus.ACTIVE },
      // 6. Bút chì kim Pentel AX105
      { name: 'Bút chì kim Pentel AX105', slug: 'but-chi-kim-pentel-ax105', sku: 'PENTEL-AX105', description: 'Bút chì kim bấm học sinh Pentel AX105 thiết kế trẻ trung kèm gôm tẩy tiện lợi.', category: findSub('but-chi'), brand: 'Pentel', price: 25000, discountPrice: 20000, stock: 200, images: ['https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=500'], rating: 4.7, sold: 45, isFeatured: false, status: ProductStatus.ACTIVE },
      // 7. Bút dạ quang Pastel Set 6 màu
      { name: 'Bút dạ quang Pastel Set 6 màu', slug: 'but-da-quang-pastel-set-6-mau', sku: 'HL-PS-6', description: 'Bộ 6 bút dạ quang màu pastel dịu nhẹ bảo vệ mắt, không thấm trang giấy sau.', category: findSub('but-da-quang'), brand: 'Deli', price: 89000, discountPrice: 75000, stock: 120, images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500'], rating: 4.8, sold: 55, isFeatured: true, status: ProductStatus.ACTIVE },
      // 8. Gôm tẩy Pentel H.03
      { name: 'Gôm tẩy Pentel H.03', slug: 'gom-tay-pentel-h-03', sku: 'PENTEL-H03', description: 'Gôm tẩy siêu sạch Pentel Nhật Bản, tẩy nhẹ nhàng không rách giấy.', category: findSub('gom-tay'), brand: 'Pentel', price: 12000, discountPrice: 10000, stock: 400, images: ['https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500'], rating: 4.7, sold: 130, isFeatured: false, status: ProductStatus.ACTIVE },
      // 9. Thước kẻ nhựa dẻo Maped 30cm
      { name: 'Thước kẻ nhựa dẻo Maped 30cm', slug: 'thuoc-ke-nhua-deo-maped-30cm', sku: 'MAPED-30', description: 'Thước kẻ dẻo cao cấp chống gãy gập hiệu Maped của Pháp.', category: findSub('thuoc'), brand: 'Maped', price: 18000, discountPrice: 15000, stock: 250, images: ['https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500'], rating: 4.5, sold: 80, isFeatured: false, status: ProductStatus.ACTIVE },
      // 10. Hộp bút sắt hai tầng cá tính
      { name: 'Hộp bút sắt hai tầng cá tính', slug: 'hop-but-sat-hai-tang-ca-tinh', sku: 'HB-SAT', description: 'Hộp đựng bút bằng sắt bền đẹp thiết kế 2 tầng nhiều ngăn tiện dụng.', category: findSub('hop-but'), brand: 'Trường Thành', price: 45000, discountPrice: 38000, stock: 80, images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=500'], rating: 4.4, sold: 30, isFeatured: false, status: ProductStatus.ACTIVE },
      // 11. Keo dán khô Deli 9g
      { name: 'Keo dán khô Deli 9g', slug: 'keo-dan-kho-deli-9g', sku: 'DELI-A200', description: 'Hồ dán dạng khô Deli 9g nhỏ gọn, độ kết dính cao, sạch sẽ không nhăn giấy.', category: findSub('keo-cat'), brand: 'Deli', price: 8000, discountPrice: 0, stock: 500, images: ['https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500'], rating: 4.5, sold: 140, isFeatured: false, status: ProductStatus.ACTIVE },
      // 12. Dao rọc giấy SDI 0439
      { name: 'Dao rọc giấy SDI 0439', slug: 'dao-roc-giay-sdi-0439', sku: 'SDI-0439', description: 'Dao rọc giấy mini SDI thép không gỉ sắc bén, có khóa chốt an toàn.', category: findSub('dao-roc-giay'), brand: 'SDI', price: 22000, discountPrice: 18000, stock: 150, images: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500'], rating: 4.6, sold: 40, isFeatured: false, status: ProductStatus.ACTIVE },
      // 13. Băng keo trong Deli 2 inch 100y
      { name: 'Băng keo trong Deli 2 inch 100y', slug: 'bang-keo-trong-deli-2-inch-100y', sku: 'DELI-TAP-30', description: 'Băng keo trong bản rộng 4.8cm dày dặn, độ dính cực tốt cho đóng gói thùng.', category: findSub('bang-keo'), brand: 'Deli', price: 25000, discountPrice: 20000, stock: 300, images: ['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500'], rating: 4.4, sold: 110, isFeatured: false, status: ProductStatus.ACTIVE },
      // 14. Kẹp bướm Slecho 25mm hộp 12 cái
      { name: 'Kẹp bướm Slecho 25mm hộp 12 cái', slug: 'kep-buom-slecho-25mm-hop-12-cai', sku: 'SL-KB25', description: 'Kẹp bướm văn phòng Slecho 25mm kẹp giữ tài liệu tài liệu chắc chắn không rách.', category: findSub('kep-giay'), brand: 'Slecho', price: 18000, discountPrice: 15000, stock: 200, images: ['https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500'], rating: 4.5, sold: 75, isFeatured: false, status: ProductStatus.ACTIVE },
      // 15. File hồ sơ nhựa nút bấm A4
      { name: 'File hồ sơ nhựa nút bấm A4', slug: 'file-ho-so-nhua-nut-bam-a4', sku: 'FILE-A4', description: 'Bìa hồ sơ lá nhựa trong có nút bấm bảo vệ hồ sơ tài liệu khỏi ẩm ướt.', category: findSub('file-tai-lieu'), brand: 'Trường Thành', price: 6000, discountPrice: 5000, stock: 800, images: ['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500'], rating: 4.3, sold: 340, isFeatured: false, status: ProductStatus.ACTIVE },
      // 16. Giấy A4 Double A 70gsm (500 tờ)
      { name: 'Giấy A4 Double A 70gsm (500 tờ)', slug: 'giay-a4-double-a-70gsm-500-to', sku: 'DA-A4-70G', description: 'Giấy in văn phòng cao cấp Double A Thái Lan định lượng 70gsm láng mịn chống kẹt giấy.', category: findSub('giay-a4'), brand: 'Double A', price: 82000, discountPrice: 78000, stock: 250, images: ['https://images.unsplash.com/photo-1603481588273-2f908a9a7a1b?w=500'], rating: 4.8, sold: 190, isFeatured: true, status: ProductStatus.ACTIVE },
      // 17. Giấy A4 PaperOne 80gsm (500 tờ)
      { name: 'Giấy A4 PaperOne 80gsm (500 tờ)', slug: 'giay-a4-paperone-80gsm-500-to', sku: 'PO-A4-80G', description: 'Giấy in PaperOne định lượng 80gsm siêu trắng, chuyên dùng cho máy in laser tốc độ cao.', category: findSub('giay-a4'), brand: 'PaperOne', price: 98000, discountPrice: 92000, stock: 180, images: ['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500'], rating: 4.9, sold: 120, isFeatured: true, status: ProductStatus.ACTIVE },
      // 18. Sổ tay lò xo Trường Thành A5 120tr
      { name: 'Sổ tay lò xo Trường Thành A5 120tr', slug: 'so-tay-lo-xo-truong-thanh-a5-120tr', sku: 'TT-NB-A5', description: 'Sổ tay bìa da lò xo Trường Thành khổ A5, ruột kẻ ngang chống nhòe mực.', category: findSub('so-tay'), brand: 'Trường Thành', price: 28000, discountPrice: 24000, stock: 150, images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=500'], rating: 4.6, sold: 80, isFeatured: true, status: ProductStatus.ACTIVE },
      // 19. Vở học sinh 4 ô ly Hồng Hà 96tr
      { name: 'Vở học sinh 4 ô ly Hồng Hà 96tr', slug: 'vo-hoc-sinh-4-o-ly-hong-ha-96tr', sku: 'HH-TAP-96', description: 'Vở viết học sinh Hồng Hà 4 ô ly định lượng cao, bìa in tranh ngộ nghĩnh.', category: findSub('tap-vo'), brand: 'Hồng Hà', price: 8000, discountPrice: 7000, stock: 1000, images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=500'], rating: 4.5, sold: 450, isFeatured: false, status: ProductStatus.ACTIVE },
      // 20. Máy tính Casio FX-580VN X
      { name: 'Máy tính Casio FX-580VN X', slug: 'may-tinh-casio-fx-580vn-x', sku: 'CS-FX580', description: 'Máy tính khoa học thế hệ mới Casio FX-580VN X hỗ trợ đắc lực giải toán thi THPT Quốc Gia.', category: findSub('may-tinh-bo-tui'), brand: 'Casio', price: 690000, discountPrice: 620000, stock: 50, images: ['https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500'], rating: 4.9, sold: 95, isFeatured: true, status: ProductStatus.ACTIVE }
    ];

    const createdProducts = await this.productModel.insertMany(products);
    this.logger.log('Products seeded');

    const inventoryRecords = createdProducts.map((product: any) => ({
      product: product._id,
      currentStock: product.stock,
      minStock: 10,
      maxStock: 1000,
      status: product.stock > 10 ? InventoryStatus.IN_STOCK : InventoryStatus.LOW_STOCK,
      lastUpdated: new Date(),
    }));

    await this.inventoryModel.insertMany(inventoryRecords);
    this.logger.log('Inventory seeded');

    const now = new Date();
    const oneMonthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const twoMonthsLater = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    await this.promotionModel.insertMany([
      { code: 'WELCOME10', name: 'Welcome 10% off', description: 'Giảm 10% cho khách hàng mới', discountType: DiscountType.PERCENT, discountValue: 10, minOrderValue: 100000, startDate: now, endDate: twoMonthsLater, usageLimit: 1000, usedCount: 0, status: true },
      { code: 'SUMMER50K', name: 'Summer sale 50K', description: 'Giảm 50.000đ cho đơn hàng từ 300.000đ', discountType: DiscountType.FIXED, discountValue: 50000, minOrderValue: 300000, startDate: now, endDate: oneMonthLater, usageLimit: 500, usedCount: 0, status: true },
      { code: 'FREESHIP', name: 'Free shipping', description: 'Giảm 30.000đ phí ship cho đơn từ 200.000đ', discountType: DiscountType.FIXED, discountValue: 30000, minOrderValue: 200000, startDate: now, endDate: twoMonthsLater, usageLimit: 2000, usedCount: 0, status: true },
    ]);
    this.logger.log('Promotions seeded');

    const sampleOrders = [
      {
        orderCode: 'TT240601ABC001',
        customer: customer._id,
        items: [
          { product: createdProducts[0]._id, name: createdProducts[0].name, price: 4000, quantity: 5, image: '' },
          { product: createdProducts[17]._id, name: createdProducts[17].name, price: 24000, quantity: 2, image: '' },
        ],
        shippingAddress: '123 Nguyễn Trãi, Q.1, TP.HCM',
        phone: '0912345678',
        customerName: 'Nguyễn Văn Khách',
        customerEmail: 'customer@truongthanh.vn',
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.UNPAID,
        orderStatus: OrderStatus.COMPLETED,
        subtotal: 68000,
        shippingFee: 0,
        discount: 0,
        total: 68000,
      },
      {
        orderCode: 'TT240602DEF002',
        customer: customer._id,
        items: [
          { product: createdProducts[19]._id, name: createdProducts[19].name, price: 620000, quantity: 1, image: '' },
        ],
        shippingAddress: '456 Lê Lợi, Q.5, TP.HCM',
        phone: '0912345678',
        customerName: 'Nguyễn Văn Khách',
        customerEmail: 'customer@truongthanh.vn',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.SHIPPING,
        subtotal: 620000,
        shippingFee: 0,
        discount: 0,
        total: 620000,
      },
      {
        orderCode: 'TT240603GHI003',
        customer: customer._id,
        items: [
          { product: createdProducts[15]._id, name: createdProducts[15].name, price: 82000, quantity: 3, image: '' },
        ],
        shippingAddress: '789 Trần Hưng Đạo, Q.1, TP.HCM',
        phone: '0912345678',
        customerName: 'Nguyễn Văn Khách',
        customerEmail: 'customer@truongthanh.vn',
        paymentMethod: PaymentMethod.EWALLET,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PENDING,
        subtotal: 246000,
        shippingFee: 0,
        discount: 24600,
        total: 221400,
      },
    ];

    await this.orderModel.insertMany(sampleOrders);
    this.logger.log('Orders seeded');
    this.logger.log('All seed data created successfully!');
  }
}
