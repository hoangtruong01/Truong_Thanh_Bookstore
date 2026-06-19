import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../modules/users/schemas/user.schema';
import { Category, CategoryDocument } from '../modules/categories/schemas/category.schema';
import { Product, ProductDocument } from '../modules/products/schemas/product.schema';
import { Promotion, PromotionDocument } from '../modules/promotions/schemas/promotion.schema';
import { Inventory, InventoryDocument } from '../modules/inventory/schemas/inventory.schema';
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
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async onModuleInit() {
    const hasRealData = await this.productModel.findOne({ name: 'Bút bi Thiên Long TL-095' }).exec();
    if (!hasRealData) {
      this.logger.log('No real test data detected. Clearing old demo data and seeding real products...');
      await this.clearDatabase();
      await this.seed();
      this.logger.log('Database cleared and seeded with real stationery products successfully!');
    } else {
      this.logger.log('Database already has real data, skipping seed.');
    }
  }

  async clearDatabase() {
    await this.userModel.deleteMany({});
    await this.categoryModel.deleteMany({});
    await this.productModel.deleteMany({});
    await this.inventoryModel.deleteMany({});
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
      // Bút - Viết
      { name: 'Bút bi Thiên Long TL-027', slug: 'but-bi-thien-long-tl-027', sku: 'TL-027', description: 'Bút bi Thiên Long TL-027 nét viết thanh mảnh, mực đều, bền bỉ và kinh tế.', category: findSub('but-bi'), brand: 'Thiên Long', price: 5000, discountPrice: 4000, stock: 1200, images: [], rating: 4.6, sold: 1280, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Bút bi Thiên Long TL-095', slug: 'but-bi-thien-long-tl-095', sku: 'TL-095', description: 'Bút bi bấm cao cấp Thiên Long TL-095 có đệm cao su êm tay khi viết lâu.', category: findSub('but-bi'), brand: 'Thiên Long', price: 12000, discountPrice: 10000, stock: 800, images: [], rating: 4.7, sold: 680, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Bút gel Uni-ball Signo 0.5mm', slug: 'but-gel-uni-ball-signo-0.5mm', sku: 'UNI-UM151', description: 'Bút gel nước Uni-ball Signo UM-151 nhập khẩu Nhật Bản, nét chữ cực kì sắc sảo.', category: findSub('but-gel'), brand: 'Uni-ball', price: 35000, discountPrice: 32000, stock: 500, images: [], rating: 4.8, sold: 410, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Bút gel Pentel EnerGel BL77 0.7mm', slug: 'but-gel-pentel-energel-bl77-0.7mm', sku: 'PENTEL-BL77', description: 'Bút ký gel Pentel EnerGel BL77 mực nước mau khô, thiết kế sang trọng lịch lãm.', category: findSub('but-gel'), brand: 'Pentel', price: 48000, discountPrice: 42000, stock: 400, images: [], rating: 4.9, sold: 310, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Bút chì gỗ 2B Thiên Long GP-01', slug: 'but-chi-go-2b-thien-long-gp-01', sku: 'GP-01', description: 'Bút chì gỗ 2B cao cấp thích hợp viết vẽ, tô trắc nghiệm nhanh chóng.', category: findSub('but-chi'), brand: 'Thiên Long', price: 5000, discountPrice: 0, stock: 1500, images: [], rating: 4.5, sold: 1950, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Bút chì kim Pentel AX105', slug: 'but-chi-kim-pentel-ax105', sku: 'PENTEL-AX105', description: 'Bút chì kim bấm học sinh Pentel AX105 thiết kế trẻ trung kèm gôm tẩy tiện lợi.', category: findSub('but-chi'), brand: 'Pentel', price: 25000, discountPrice: 20000, stock: 600, images: [], rating: 4.6, sold: 870, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Bút dạ quang Pastel Set 6 màu', slug: 'but-da-quang-pastel-set-6-mau', sku: 'HL-PS-6', description: 'Bộ 6 bút dạ quang màu pastel dịu nhẹ bảo vệ mắt, không thấm trang giấy sau.', category: findSub('but-da-quang'), brand: 'Deli', price: 89000, discountPrice: 65000, stock: 350, images: [], rating: 4.7, sold: 450, isFeatured: true, status: ProductStatus.ACTIVE },

      // Dụng cụ học sinh
      { name: 'Gôm tẩy Pentel H.03', slug: 'gom-tay-pentel-h-03', sku: 'PENTEL-H03', description: 'Gôm tẩy siêu sạch Pentel Nhật Bản, tẩy nhẹ nhàng không rách giấy.', category: findSub('gom-tay'), brand: 'Pentel', price: 12000, discountPrice: 10000, stock: 900, images: [], rating: 4.8, sold: 1100, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Thước kẻ nhựa dẻo Maped 30cm', slug: 'thuoc-ke-nhua-deo-maped-30cm', sku: 'MAPED-30', description: 'Thước kẻ dẻo cao cấp chống gãy gập hiệu Maped của Pháp.', category: findSub('thuoc'), brand: 'Maped', price: 18000, discountPrice: 15000, stock: 500, images: [], rating: 4.4, sold: 620, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Hộp bút sắt hai tầng cá tính', slug: 'hop-but-sat-hai-tang-ca-tinh', sku: 'HB-SAT', description: 'Hộp đựng bút bằng sắt bền đẹp thiết kế 2 tầng nhiều ngăn tiện dụng.', category: findSub('hop-but'), brand: 'Trường Thành', price: 45000, discountPrice: 38000, stock: 200, images: [], rating: 4.3, sold: 290, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Balo học sinh chống gù Miti', slug: 'balo-hoc-sinh-chong-gu-miti', sku: 'MITI-BG', description: 'Balo chống gù lưng siêu nhẹ Miti bảo vệ cột sống cho bé yêu đến trường.', category: findSub('balo-hoc-sinh'), brand: 'Miti', price: 480000, discountPrice: 399000, stock: 100, images: [], rating: 4.8, sold: 150, isFeatured: true, status: ProductStatus.ACTIVE },

      // Dụng cụ văn phòng
      { name: 'Keo dán khô Deli 9g', slug: 'keo-dan-kho-deli-9g', sku: 'DELI-A200', description: 'Hồ dán dạng khô Deli 9g nhỏ gọn, độ kết dính cao, sạch sẽ không nhăn giấy.', category: findSub('keo-cat'), brand: 'Deli', price: 8000, discountPrice: 0, stock: 1000, images: [], rating: 4.4, sold: 820, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Dao rọc giấy SDI 0439', slug: 'dao-roc-giay-sdi-0439', sku: 'SDI-0439', description: 'Dao rọc giấy mini SDI thép không gỉ sắc bén, có khóa chốt an toàn.', category: findSub('dao-roc-giay'), brand: 'SDI', price: 22000, discountPrice: 18000, stock: 450, images: [], rating: 4.5, sold: 670, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Băng keo trong Deli 2 inch 100y', slug: 'bang-keo-trong-deli-2-inch-100y', sku: 'DELI-TAP-30', description: 'Băng keo trong bản rộng 4.8cm dày dặn, độ dính cực tốt cho đóng gói thùng.', category: findSub('bang-keo'), brand: 'Deli', price: 25000, discountPrice: 20000, stock: 700, images: [], rating: 4.3, sold: 980, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Kẹp bướm Slecho 25mm hộp 12 cái', slug: 'kep-buom-slecho-25mm-hop-12-cai', sku: 'SL-KB25', description: 'Kẹp bướm văn phòng Slecho 25mm kẹp giữ tài liệu tài liệu chắc chắn không rách.', category: findSub('kep-giay'), brand: 'Slecho', price: 18000, discountPrice: 15000, stock: 600, images: [], rating: 4.4, sold: 740, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'File hồ sơ nhựa nút bấm A4', slug: 'file-ho-so-nhua-nut-bam-a4', sku: 'FILE-A4', description: 'Bìa hồ sơ lá nhựa trong có nút bấm bảo vệ hồ sơ tài liệu khỏi ẩm ướt.', category: findSub('file-tai-lieu'), brand: 'Trường Thành', price: 6000, discountPrice: 5000, stock: 1500, images: [], rating: 4.2, sold: 2450, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Bìa còng nhẫn nhựa Kokuyo A4', slug: 'bia-cong-nhan-nhua-kokuyo-a4', sku: 'KK-RING-A4', description: 'Bìa còng Kokuyo khổ A4 gáy rộng 3.5cm lưu trữ tài liệu số lượng lớn chuyên nghiệp.', category: findSub('file-tai-lieu'), brand: 'Kokuyo', price: 65000, discountPrice: 58000, stock: 250, images: [], rating: 4.6, sold: 340, isFeatured: true, status: ProductStatus.ACTIVE },

      // Sản phẩm về giấy
      { name: 'Giấy A4 Double A 70gsm (500 tờ)', slug: 'giay-a4-double-a-70gsm-500-to', sku: 'DA-A4-70G', description: 'Giấy in văn phòng cao cấp Double A Thái Lan định lượng 70gsm láng mịn chống kẹt giấy.', category: findSub('giay-a4'), brand: 'Double A', price: 82000, discountPrice: 78000, stock: 500, images: [], rating: 4.8, sold: 1540, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Giấy A4 PaperOne 80gsm (500 tờ)', slug: 'giay-a4-paperone-80gsm-500-to', sku: 'PO-A4-80G', description: 'Giấy in PaperOne định lượng 80gsm siêu trắng, chuyên dùng cho máy in laser tốc độ cao.', category: findSub('giay-a4'), brand: 'PaperOne', price: 98000, discountPrice: 92000, stock: 400, images: [], rating: 4.9, sold: 880, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Sổ tay lò xo Trường Thành A5 120tr', slug: 'so-tay-lo-xo-truong-thanh-a5-120tr', sku: 'TT-NB-A5', description: 'Sổ tay bìa da lò xo Trường Thành khổ A5, ruột kẻ ngang chống nhòe mực.', category: findSub('so-tay'), brand: 'Trường Thành', price: 28000, discountPrice: 24000, stock: 350, images: [], rating: 4.4, sold: 480, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Tập học sinh 4 ô ly Hồng Hà 96tr', slug: 'tap-hoc-sinh-4-o-ly-hong-ha-96tr', sku: 'HH-TAP-96', description: 'Vở viết học sinh Hồng Hà 4 ô ly định lượng cao, bìa in tranh ngộ nghĩnh.', category: findSub('tap-vo'), brand: 'Hồng Hà', price: 8000, discountPrice: 7000, stock: 2000, images: [], rating: 4.5, sold: 3450, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Giấy note vàng Pronoti 3x3 inch', slug: 'giay-note-vang-pronoti-3x3-inch', sku: 'PR-NOTE-3', description: 'Giấy note tự dính Pronoti Đài Loan màu vàng nổi bật, keo bám chắc tháo rời không để lại dấu vết.', category: findSub('giay-note'), brand: 'Pronoti', price: 12000, discountPrice: 10000, stock: 800, images: [], rating: 4.6, sold: 1230, isFeatured: false, status: ProductStatus.ACTIVE },

      // Dụng cụ vẽ
      { name: 'Bộ màu nước Pentel 12 màu dạng tuýp', slug: 'bo-mau-nuoc-pentel-12-mau-dang-tuyp', sku: 'PT-WC-12', description: 'Bộ màu vẽ tranh cao cấp Pentel 12 màu tươi sáng dễ pha trộn, an toàn cho trẻ nhỏ.', category: findSub('mau-ve'), brand: 'Pentel', price: 125000, discountPrice: 110000, stock: 150, images: [], rating: 4.8, sold: 280, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Bộ cọ vẽ Keep Smiling 5 cây', slug: 'bo-co-ve-keep-smiling-5-cay', sku: 'KS-BR-5', description: 'Set 5 chiếc cọ Keep Smiling vẽ acrylic màu nước, thân gỗ bền đẹp lông cọ dẻo dai.', category: findSub('co-ve'), brand: 'Keep Smiling', price: 45000, discountPrice: 38000, stock: 200, images: [], rating: 4.5, sold: 190, isFeatured: false, status: ProductStatus.ACTIVE },

      // Máy tính bỏ túi
      { name: 'Máy tính Casio FX-580VN X', slug: 'may-tinh-casio-fx-580vn-x', sku: 'CS-FX580', description: 'Máy tính khoa học thế hệ mới Casio FX-580VN X hỗ trợ đắc lực giải toán thi THPT Quốc Gia.', category: findSub('may-tinh-bo-tui'), brand: 'Casio', price: 690000, discountPrice: 620000, stock: 120, images: [], rating: 4.9, sold: 680, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Máy tính Casio FX-570VN Plus', slug: 'may-tinh-casio-fx-570vn-plus', sku: 'CS-FX570', description: 'Máy tính học sinh Casio FX-570VN Plus phiên bản mới thiết kế đẹp, bền bỉ.', category: findSub('may-tinh-bo-tui'), brand: 'Casio', price: 520000, discountPrice: 480000, stock: 180, images: [], rating: 4.7, sold: 410, isFeatured: false, status: ProductStatus.ACTIVE },

      // Combos (Under Categories directly)
      { name: 'Combo văn phòng cơ bản 10 món', slug: 'combo-van-phong-co-ban-10-mon', sku: 'CB-VP-10', description: 'Combo văn phòng phẩm đầy đủ 10 món thông dụng giúp tiết kiệm chi phí mua lẻ.', category: createdParents[2]._id, brand: 'Trường Thành', price: 150000, discountPrice: 125000, stock: 100, images: [], rating: 4.6, sold: 220, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Bộ dụng cụ học sinh tiểu học', slug: 'bo-dung-cu-hoc-sinh-tieu-hoc', sku: 'CB-HS-TH', description: 'Set dụng cụ học tập thiết yếu cho bé bước vào cấp 1: bút, thước, gôm tẩy đầy đủ.', category: createdParents[1]._id, brand: 'Trường Thành', price: 95000, discountPrice: 79000, stock: 150, images: [], rating: 4.5, sold: 310, isFeatured: true, status: ProductStatus.ACTIVE },
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
          { product: createdProducts[17]._id, name: createdProducts[17].name, price: 78000, quantity: 2, image: '' },
        ],
        shippingAddress: '123 Nguyễn Trãi, Q.1, TP.HCM',
        phone: '0912345678',
        customerName: 'Nguyễn Văn Khách',
        customerEmail: 'customer@truongthanh.vn',
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.UNPAID,
        orderStatus: OrderStatus.COMPLETED,
        subtotal: 176000,
        shippingFee: 0,
        discount: 0,
        total: 176000,
      },
      {
        orderCode: 'TT240602DEF002',
        customer: customer._id,
        items: [
          { product: createdProducts[24]._id, name: createdProducts[24].name, price: 620000, quantity: 1, image: '' },
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
          { product: createdProducts[26]._id, name: createdProducts[26].name, price: 125000, quantity: 3, image: '' },
        ],
        shippingAddress: '789 Trần Hưng Đạo, Q.1, TP.HCM',
        phone: '0912345678',
        customerName: 'Nguyễn Văn Khách',
        customerEmail: 'customer@truongthanh.vn',
        paymentMethod: PaymentMethod.EWALLET,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PENDING,
        subtotal: 375000,
        shippingFee: 0,
        discount: 37500,
        total: 337500,
      },
    ];

    await this.orderModel.insertMany(sampleOrders);
    this.logger.log('Orders seeded');
    this.logger.log('All seed data created successfully!');
  }
}
