import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../modules/users/schemas/user.schema';
import {
  Category,
  CategoryDocument,
} from '../modules/categories/schemas/category.schema';
import {
  Product,
  ProductDocument,
} from '../modules/products/schemas/product.schema';
import {
  Promotion,
  PromotionDocument,
} from '../modules/promotions/schemas/promotion.schema';
import {
  Inventory,
  InventoryDocument,
  InventoryTransaction,
  InventoryTransactionDocument,
} from '../modules/inventory/schemas/inventory.schema';
import { Order, OrderDocument } from '../modules/orders/schemas/order.schema';
import {
  LandingPage,
  LandingPageDocument,
} from '../modules/landing-pages/schemas/landing-page.schema';
import {
  UserRole,
  ProductStatus,
  DiscountType,
  InventoryStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../common/enums';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Promotion.name)
    private promotionModel: Model<PromotionDocument>,
    @InjectModel(Inventory.name)
    private inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryTransaction.name)
    private transactionModel: Model<InventoryTransactionDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(LandingPage.name)
    private landingPageModel: Model<LandingPageDocument>,
  ) {}

  async onModuleInit() {
    const hasUsers = await this.userModel.countDocuments({}).exec();
    const hasCategories = await this.categoryModel.countDocuments({}).exec();
    const firstCategory = await this.categoryModel.findOne({ name: 'Sách giáo khoa' }).exec() as any;
    const productCount = await this.productModel.countDocuments({}).exec();
    const promotionCount = await this.promotionModel.countDocuments({}).exec();

    if (hasUsers === 0 || hasCategories === 0 || !firstCategory || !firstCategory.optionsLabel || productCount !== 120) {
      this.logger.log(`Triggering seed: users=${hasUsers}, categories=${hasCategories}, products=${productCount}`);
      await this.clearDatabase();
      await this.seed();
    } else {
      this.logger.log('Database already populated with 120 products. Skipping seed.');
      if (promotionCount === 0) {
        this.logger.log('No promotions found, seeding default promotions...');
        const promotions = [
          {
            code: 'GIAM10K',
            name: 'Voucher giảm 10K',
            description: 'Giảm 10.000đ cho đơn hàng từ 50.000đ trở lên',
            discountType: DiscountType.FIXED,
            discountValue: 10000,
            minOrderValue: 50000,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            usageLimit: 1000,
            usedCount: 0,
            status: true,
          },
          {
            code: 'HE2026',
            name: 'Chào Hè Rực Rỡ',
            description: 'Giảm 10% cho đơn hàng từ 100.000đ trở lên',
            discountType: DiscountType.PERCENT,
            discountValue: 10,
            minOrderValue: 100000,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            usageLimit: 500,
            usedCount: 0,
            status: true,
          },
          {
            code: 'TRUONGTHANH50',
            name: 'Tri ân khách hàng',
            description: 'Giảm 50.000đ cho đơn hàng từ 300.000đ trở lên',
            discountType: DiscountType.FIXED,
            discountValue: 50000,
            minOrderValue: 300000,
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            usageLimit: 100,
            usedCount: 0,
            status: true,
          },
        ];
        await this.promotionModel.insertMany(promotions);
        this.logger.log('Promotions seeded successfully');
      }
    }
    await this.seedDealHotLandingPage();
  }

  async clearDatabase() {
    await this.userModel.deleteMany({});
    await this.categoryModel.deleteMany({});
    await this.productModel.deleteMany({});
    await this.inventoryModel.deleteMany({});
    await this.transactionModel.deleteMany({});
    await this.promotionModel.deleteMany({});
    await this.orderModel.deleteMany({});
    await this.landingPageModel.deleteMany({});
  }

  async seedDealHotLandingPage() {
    const existing = await this.landingPageModel.findOne({ slug: 'deal-hot' }).exec();
    if (!existing) {
      this.logger.log('Seeding default deal-hot landing page...');
      await this.landingPageModel.create({
        title: 'Siêu Deal Hot Văn Phòng Phẩm & Đồ Dùng Học Tập',
        slug: 'deal-hot',
        description: 'Sở hữu ngay bộ combo văn phòng phẩm và đồ dùng học tập độc quyền từ Trường Thành Bookstore với mức giá cực kỳ ưu đãi. Cam kết hàng chính hãng 100%!',
        images: ['https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800'],
        countdownMinutes: 30,
        price: 99000,
        originalPrice: 199000,
        badgeText: 'MUA NGAY HÔM NAY - ƯU ĐÃI ĐỘC QUYỀN GIẢM GIÁ 50%',
        primaryColor: '#dc2626',
        backgroundColor: '#f8fafc',
        textColor: '#1e293b',
        status: true,
        benefits: [
          {
            title: 'Giao Hàng Siêu Tốc',
            description: 'Hỗ trợ giao hàng hoả tốc trong vòng 2h tại khu vực nội thành.',
            icon: 'TruckIcon',
          },
          {
            title: 'Cam Kết Chính Hãng',
            description: 'Cam kết 100% sản phẩm chính hãng từ các thương hiệu lớn như Thiên Long, Hồng Hà, Pentel...',
            icon: 'ShieldCheckIcon',
          },
          {
            title: 'Đổi Trả Dễ Dàng',
            description: 'Bảo hành 1 đổi 1 trong vòng 7 ngày nếu phát hiện bất kỳ lỗi nào từ nhà sản xuất.',
            icon: 'ArrowPathIcon',
          },
        ],
        packages: [
          {
            name: 'Gói Học Tập Cơ Bản (Hộp Bút + 5 Bút Gel)',
            price: 49000,
            originalPrice: 99000,
            badge: 'Bán Chạy Nhất',
            isBestSeller: true,
          },
          {
            name: 'Gói Combo Siêu Hời (Hộp Bút + 10 Bút Bi + Sổ Tay + Tẩy)',
            price: 99000,
            originalPrice: 199000,
            badge: 'Ưu Đãi Lớn',
            isBestSeller: false,
          },
          {
            name: 'Gói Học Đường Cao Cấp (Bình Giữ Nhiệt + Sổ Tay Da + Đèn Silicon)',
            price: 249000,
            originalPrice: 499000,
            badge: 'Quà Tặng Đặc Biệt',
            isBestSeller: false,
          },
        ],
        testimonials: [
          {
            authorName: 'Chị Nguyễn Minh Anh',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            content: 'Bộ combo học tập siêu xinh luôn mọi người ơi, bé nhà mình thích lắm. Giao hàng siêu nhanh đóng gói cẩn thận nữa!',
            rating: 5,
          },
          {
            authorName: 'Anh Hoàng Quốc Trung',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            content: 'Sản phẩm chất lượng tốt, giá thành hợp lý so với mua lẻ. Khuyên mọi người nên mua combo to cho tiết kiệm.',
            rating: 5,
          },
        ],
      });
      this.logger.log('Default deal-hot landing page seeded successfully');
    }
  }

  async seed() {
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    const customerPassword = await bcrypt.hash('Customer@123456', 10);

    await this.userModel.create({
      fullName: 'Admin Truong Thanh',
      email: 'admin@truongthanh.vn',
      password: adminPassword,
      phone: '0901234567',
      role: UserRole.ADMIN,
      status: true,
    });

    await this.userModel.create({
      fullName: 'Nguyen Van Khach',
      email: 'customer@truongthanh.vn',
      password: customerPassword,
      phone: '0912345678',
      role: UserRole.CUSTOMER,
      status: true,
    });

    this.logger.log('Users seeded');

    const parentCategories = [
      {
        name: 'Sách giáo khoa',
        slug: 'sach-giao-khoa',
        description: 'Sách giáo khoa dành cho các cấp học sinh.',
        comboPrice: 0,
        products: [],
        status: true,
        optionsLabel: 'Chọn Lớp',
        optionsType: 'grid',
        options: ['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5', 'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9', 'Lớp 10', 'Lớp 11', 'Lớp 12'],
      },
      {
        name: 'Sách tham khảo',
        slug: 'sach-tham-khao',
        description: 'Sách tham khảo bồi dưỡng học sinh giỏi và ôn luyện thi.',
        comboPrice: 0,
        products: [],
        status: true,
        optionsLabel: 'Chọn Môn Học',
        optionsType: 'pills',
        options: ['Toán', 'Văn', 'Anh', 'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí'],
      },
      {
        name: 'Truyện tranh',
        slug: 'truyen-tranh',
        description: 'Truyện tranh, manga hấp dẫn, đa dạng thể loại.',
        comboPrice: 0,
        products: [],
        status: true,
        optionsLabel: 'Chọn Nhân vật / Thể loại',
        optionsType: 'pills',
        options: ['Conan', 'Doraemon', 'Trinh thám', 'Anime'],
      },
      {
        name: 'Combo',
        slug: 'combo',
        description: 'Các combo đồ dùng học tập và văn phòng phẩm tiết kiệm.',
        comboPrice: 50000,
        products: [],
        status: true,
        optionsLabel: 'Chọn Loại Combo',
        optionsType: 'pills',
        options: ['Học tập', 'Quà tặng', 'Mỹ thuật', 'Đóng gói'],
      },
      {
        name: 'Đồ chơi',
        slug: 'do-choi',
        description: 'Đồ chơi giáo dục, lắp ráp trí tuệ phát triển tư duy.',
        comboPrice: 0,
        products: [],
        status: true,
        optionsLabel: 'Chọn Loại Đồ Chơi',
        optionsType: 'pills',
        options: ['Lego', 'Rubik', 'Thủ công', 'Boardgame'],
      },
      {
        name: 'Đồ lưu niệm',
        slug: 'do-luu-niem',
        description: 'Quà lưu niệm độc đáo, xinh xắn cho bạn bè và người thân.',
        comboPrice: 0,
        products: [],
        status: true,
        optionsLabel: 'Chọn Loại Lưu Niệm',
        optionsType: 'pills',
        options: ['Móc khóa', 'Sổ tay', 'Bình nước', 'Hộp quà'],
      },
    ];

    const createdCombos = await this.categoryModel.insertMany(parentCategories);
    this.logger.log('6 Real parent categories seeded successfully');

    const slugify = (text: string): string => {
      return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    };

    const categoryImages = [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500',
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500',
      'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=500',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500',
      'https://images.unsplash.com/photo-1590845947376-2638caa06a1a?w=500',
    ];

    const rawProducts = [
      // Sách giáo khoa (20 items)
      { name: 'Bộ Sách Giáo Khoa Lớp 1 - Cánh Diều', sku: 'SGK-L1-CD', description: 'Bộ sách giáo khoa lớp 1 đầy đủ môn học theo chương trình mới Cánh Diều.', price: 180000, discountPrice: 165000, categoryIndex: 0, subOptions: ['Lớp 1'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 2 - Kết Nối Tri Thức', sku: 'SGK-L2-KNTT', description: 'Bộ sách giáo khoa lớp 2 đầy đủ môn học Kết nối tri thức với cuộc sống.', price: 195000, discountPrice: 180000, categoryIndex: 0, subOptions: ['Lớp 2'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 3 - Chân Trời Sáng Tạo', sku: 'SGK-L3-CTST', description: 'Bộ sách giáo khoa lớp 3 đầy đủ môn học Chân trời sáng tạo.', price: 210000, discountPrice: 195000, categoryIndex: 0, subOptions: ['Lớp 3'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 4 - Cánh Diều', sku: 'SGK-L4-CD', description: 'Bộ sách giáo khoa lớp 4 đầy đủ môn học chương trình mới Cánh Diều.', price: 230000, discountPrice: 215000, categoryIndex: 0, subOptions: ['Lớp 4'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 5 - Kết Nối Tri Thức', sku: 'SGK-L5-KNTT', description: 'Bộ sách giáo khoa lớp 5 đầy đủ môn học chương trình mới Kết nối tri thức.', price: 245000, discountPrice: 230000, categoryIndex: 0, subOptions: ['Lớp 5'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 6 - Chân Trời Sáng Tạo', sku: 'SGK-L6-CTST', description: 'Bộ sách giáo khoa lớp 6 đầy đủ môn học chương trình mới Chân trời sáng tạo.', price: 260000, discountPrice: 240000, categoryIndex: 0, subOptions: ['Lớp 6'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 7 - Kết Nối Tri Thức', sku: 'SGK-L7-KNTT', description: 'Bộ sách giáo khoa lớp 7 đầy đủ môn học chương trình mới Kết nối tri thức.', price: 275000, discountPrice: 255000, categoryIndex: 0, subOptions: ['Lớp 7'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 8 - Cánh Diều', sku: 'SGK-L8-CD', description: 'Bộ sách giáo khoa lớp 8 đầy đủ môn học chương trình mới Cánh Diều.', price: 290000, discountPrice: 270000, categoryIndex: 0, subOptions: ['Lớp 8'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 9 - Kết Nối Tri Thức', sku: 'SGK-L9-KNTT', description: 'Bộ sách giáo khoa lớp 9 đầy đủ môn học chương trình mới Kết nối tri thức.', price: 310000, discountPrice: 290000, categoryIndex: 0, subOptions: ['Lớp 9'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 10 - Cánh Diều', sku: 'SGK-L10-CD', description: 'Bộ sách giáo khoa lớp 10 đầy đủ môn học chương trình mới Cánh Diều.', price: 330000, discountPrice: 300000, categoryIndex: 0, subOptions: ['Lớp 10'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 11 - Kết Nối Tri Thức', sku: 'SGK-L11-KNTT', description: 'Bộ sách giáo khoa lớp 11 đầy đủ môn học chương trình mới Kết nối tri thức.', price: 345000, discountPrice: 315000, categoryIndex: 0, subOptions: ['Lớp 11'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Sách Giáo Khoa Lớp 12 - Kết Nối Tri Thức', sku: 'SGK-L12-KNTT', description: 'Bộ sách giáo khoa lớp 12 đầy đủ môn học chương trình mới Kết nối tri thức.', price: 360000, discountPrice: 330000, categoryIndex: 0, subOptions: ['Lớp 12'], brand: 'NXB Giáo Dục' },
      { name: 'Vở Bài Tập Toán Lớp 1 (Tập 1)', sku: 'VBT-T1-1', description: 'Vở bài tập Toán lớp 1 tập 1 biên soạn theo chương trình mới.', price: 15000, discountPrice: 13000, categoryIndex: 0, subOptions: ['Lớp 1'], brand: 'NXB Giáo Dục' },
      { name: 'Vở Bài Tập Tiếng Việt Lớp 2 (Tập 1)', sku: 'VBT-TV2-1', description: 'Vở bài tập Tiếng Việt lớp 2 tập 1 hỗ trợ học tập hiệu quả.', price: 18000, discountPrice: 16000, categoryIndex: 0, subOptions: ['Lớp 2'], brand: 'NXB Giáo Dục' },
      { name: 'Sách Giáo Khoa Tiếng Anh Lớp 3', sku: 'SGK-TA3', description: 'Sách giáo khoa môn Tiếng Anh lớp 3 giúp làm quen ngoại ngữ.', price: 48000, discountPrice: 43000, categoryIndex: 0, subOptions: ['Lớp 3'], brand: 'NXB Giáo Dục' },
      { name: 'Sách Giáo Khoa Toán Lớp 4 (Tập 2)', sku: 'SGK-T4-2', description: 'Sách giáo khoa Toán lớp 4 tập 2 chương trình mới nhất.', price: 22000, discountPrice: 20000, categoryIndex: 0, subOptions: ['Lớp 4'], brand: 'NXB Giáo Dục' },
      { name: 'Sách Giáo Khoa Tiếng Việt Lớp 5 (Tập 1)', sku: 'SGK-TV5-1', description: 'Sách giáo khoa Tiếng Việt lớp 5 tập 1 chính hãng.', price: 24000, discountPrice: 22000, categoryIndex: 0, subOptions: ['Lớp 5'], brand: 'NXB Giáo Dục' },
      { name: 'Sách Giáo Khoa Hóa Học Lớp 8', sku: 'SGK-H8', description: 'Sách giáo khoa Hóa học lớp 8 giúp hình thành kiến thức hóa học nền tảng.', price: 28000, discountPrice: 25000, categoryIndex: 0, subOptions: ['Lớp 8'], brand: 'NXB Giáo Dục' },
      { name: 'Sách Giáo Khoa Vật Lí Lớp 9', sku: 'SGK-L9', description: 'Sách giáo khoa Vật lí lớp 9 đầy đủ bài học chính khóa.', price: 30000, discountPrice: 27000, categoryIndex: 0, subOptions: ['Lớp 9'], brand: 'NXB Giáo Dục' },
      { name: 'Sách Giáo Khoa Lịch Sử Lớp 12', sku: 'SGK-LS12', description: 'Sách giáo khoa Lịch sử lớp 12 hỗ trợ kì thi THPT quốc gia.', price: 35000, discountPrice: 32000, categoryIndex: 0, subOptions: ['Lớp 12'], brand: 'NXB Giáo Dục' },

      // Sách tham khảo (20 items)
      { name: 'Đột Phá 8+ Kì Thi THPT Quốc Gia Môn Toán', sku: 'STK-TOAN-DP8', description: 'Sách hướng dẫn giải đề và ôn luyện thi THPT Quốc Gia môn Toán đạt điểm 8+.', price: 160000, discountPrice: 140000, categoryIndex: 1, subOptions: ['Toán'], brand: 'NXB ĐHQG' },
      { name: 'Chiến Thuật Ôn Luyện Ngữ Văn Vào Lớp 10', sku: 'STK-VAN-10', description: 'Chiến thuật ôn thi hiệu quả, các chuyên đề và dàn ý văn mẫu chọn lọc.', price: 95000, discountPrice: 85000, categoryIndex: 1, subOptions: ['Văn'], brand: 'NXB Giáo Dục' },
      { name: 'Sách Học Nhanh Ngữ Pháp Tiếng Anh', sku: 'STK-ANH-NP', description: 'Tổng hợp ngữ pháp tiếng Anh từ cơ bản đến nâng cao siêu tốc.', price: 120000, discountPrice: 105000, categoryIndex: 1, subOptions: ['Anh'], brand: 'Trường Thành' },
      { name: 'Bồi Dưỡng Học Sinh Giỏi Vật Lí Lớp 9', sku: 'STK-LY-9', description: 'Tài liệu bồi dưỡng học sinh giỏi và giải nhanh đề thi học sinh giỏi Vật lí 9.', price: 85000, discountPrice: 75000, categoryIndex: 1, subOptions: ['Vật lí'], brand: 'NXB ĐHQG' },
      { name: 'Phân Loại Và Phương Pháp Giải Nhanh Hóa Học 12', sku: 'STK-HOA-12', description: 'Hướng dẫn phương pháp tư duy và giải nhanh các bài tập trắc nghiệm Hóa học 12.', price: 135000, discountPrice: 120000, categoryIndex: 1, subOptions: ['Hóa học'], brand: 'NXB Sư Phạm' },
      { name: 'Đề Kiểm Tra Sinh Học Lớp 11 (Cơ Bản & Nâng Cao)', sku: 'STK-SINH-11', description: 'Hệ thống đề thi trắc nghiệm và tự luận Sinh học 11.', price: 65000, discountPrice: 58000, categoryIndex: 1, subOptions: ['Sinh học'], brand: 'NXB Giáo Dục' },
      { name: 'Sách Tham Khảo Lịch Sử Việt Nam Cận Đại', sku: 'STK-SU-CD', description: 'Phân tích các sự kiện lịch sử cận đại nổi bật của Việt Nam.', price: 110000, discountPrice: 99000, categoryIndex: 1, subOptions: ['Lịch sử'], brand: 'NXB Khoa Học Xã Hội' },
      { name: 'Atlas Địa Lí Việt Nam (Khổ Lớn)', sku: 'STK-DIA-ATLAS', description: 'Bản đồ địa lí Việt Nam đầy đủ thông tin địa hình, khí hậu, kinh tế xã hội.', price: 45000, discountPrice: 40000, categoryIndex: 1, subOptions: ['Địa lí'], brand: 'NXB Bản Đồ' },
      { name: '500 Bài Toán Cơ Bản Và Nâng Cao Lớp 6', sku: 'STK-TOAN-6', description: 'Tài liệu ôn tập toán học lớp 6 với 500 bài toán đa dạng các dạng.', price: 78000, discountPrice: 70000, categoryIndex: 1, subOptions: ['Toán'], brand: 'NXB Giáo Dục' },
      { name: 'Sổ Tay Trọng Tâm Kiến Thức Hóa Học 10-11-12', sku: 'STK-HOA-ST', description: 'Sổ tay bỏ túi tổng hợp toàn bộ công thức và kiến thức Hóa học THPT.', price: 55000, discountPrice: 49000, categoryIndex: 1, subOptions: ['Hóa học'], brand: 'Trường Thành' },
      { name: '10 Trọng Điểm Đề Thi Tiếng Anh Vào 10', sku: 'STK-ANH-10', description: 'Tuyển tập 10 chuyên đề tiếng Anh trọng tâm thi vào lớp 10.', price: 88000, discountPrice: 78000, categoryIndex: 1, subOptions: ['Anh'], brand: 'NXB ĐHQG' },
      { name: 'Combo Đề Ôn Luyện Đánh Giá Năng Lực', sku: 'STK-DGNL-CB', description: 'Bộ đề thi thử đánh giá năng lực đại học quốc gia cấu trúc chuẩn.', price: 250000, discountPrice: 220000, categoryIndex: 1, subOptions: ['Toán', 'Văn', 'Anh'], brand: 'NXB ĐHQG' },
      { name: 'Bí Quyết Đạt Điểm Cao Môn Ngữ Văn 12', sku: 'STK-VAN-12', description: 'Cung cấp phương pháp viết văn nghị luận xã hội và nghị luận văn học xuất sắc.', price: 90000, discountPrice: 80000, categoryIndex: 1, subOptions: ['Văn'], brand: 'NXB Giáo Dục' },
      { name: 'Tuyển Tập Đề Thi Học Sinh Giỏi Môn Toán 8', sku: 'STK-TOAN-8HSG', description: 'Tuyển chọn đề thi học sinh giỏi cấp huyện, cấp tỉnh môn Toán lớp 8.', price: 70000, discountPrice: 62000, categoryIndex: 1, subOptions: ['Toán'], brand: 'NXB Sư Phạm' },
      { name: 'Phương Pháp Giải Toán Hình Học Không Gian 11', sku: 'STK-TOAN-HH11', description: 'Các chuyên đề hình học không gian 11 chi tiết, dễ hiểu kèm hình vẽ trực quan.', price: 85000, discountPrice: 75000, categoryIndex: 1, subOptions: ['Toán'], brand: 'NXB ĐHQG' },
      { name: 'Rèn Luyện Tư Duy Giải Toán Hóa Học Lớp 9', sku: 'STK-HOA-9', description: 'Phương pháp phân tích đề và lập hệ phương trình giải toán Hóa học lớp 9.', price: 72000, discountPrice: 65000, categoryIndex: 1, subOptions: ['Hóa học'], brand: 'NXB Giáo Dục' },
      { name: 'Bộ Đề Luyện Thi Vật Lí 12 Theo Định Hướng Mới', sku: 'STK-LY-12', description: 'Bộ đề thi minh họa và hướng dẫn ôn luyện thi THPT Vật lí theo cấu trúc mới.', price: 98000, discountPrice: 88000, categoryIndex: 1, subOptions: ['Vật lí'], brand: 'NXB ĐHQG' },
      { name: 'Học Tốt Địa Lí Lớp 10 (Chương Trình Mới)', sku: 'STK-DIA-10', description: 'Sách giải chi tiết câu hỏi và bổ sung bài tập tự luyện Địa lí 10.', price: 50000, discountPrice: 45000, categoryIndex: 1, subOptions: ['Địa lí'], brand: 'NXB Giáo Dục' },
      { name: 'Ôn Tập Lịch Sử Lớp 11 Nâng Cao', sku: 'STK-SU-11', description: 'Tài liệu củng cố kiến thức lịch sử thế giới và lịch sử Việt Nam 11.', price: 68000, discountPrice: 60000, categoryIndex: 1, subOptions: ['Lịch sử'], brand: 'NXB Sư Phạm' },
      { name: 'Chinh Phục Ngữ Pháp Tiếng Anh THPT', sku: 'STK-ANH-THPT', description: 'Cẩm nang cấu trúc ngữ pháp và bài tập thực hành ngữ pháp thi THPT.', price: 115000, discountPrice: 100000, categoryIndex: 1, subOptions: ['Anh'], brand: 'Trường Thành' },

      // Truyện tranh (20 items)
      { name: 'Truyện Tranh Conan - Tập 101', sku: 'TRUYEN-CONAN-101', description: 'Tập 101 của bộ truyện tranh thám tử lừng danh Conan nổi tiếng.', price: 25000, discountPrice: 22000, categoryIndex: 2, subOptions: ['Conan', 'Trinh thám'], brand: 'Kim Đồng' },
      { name: 'Truyện Tranh Conan - Tập 102', sku: 'TRUYEN-CONAN-102', description: 'Hành trình phá án nghẹt thở tiếp tục trong tập 102.', price: 25000, discountPrice: 22000, categoryIndex: 2, subOptions: ['Conan', 'Trinh thám'], brand: 'Kim Đồng' },
      { name: 'Truyện Tranh Doraemon Tập Ngắn - Tập 45', sku: 'TRUYEN-DORA-45', description: 'Tập 45 của bộ truyện tranh Doraemon huyền thoại.', price: 25000, discountPrice: 22000, categoryIndex: 2, subOptions: ['Doraemon'], brand: 'Kim Đồng' },
      { name: 'Truyện Tranh Doraemon Tập Ngắn - Tập 1', sku: 'TRUYEN-DORA-1', description: 'Tập 1 mở đầu cho thế giới bảo bối thần kỳ của chú mèo máy.', price: 25000, discountPrice: 22000, categoryIndex: 2, subOptions: ['Doraemon'], brand: 'Kim Đồng' },
      { name: 'Đội Quân Doraemon Thêm - Tập 1', sku: 'TRUYEN-DORA-ADD', description: 'Những câu chuyện phiêu lưu hài hước của nhóm bạn Doraemon thêm.', price: 25000, discountPrice: 22000, categoryIndex: 2, subOptions: ['Doraemon'], brand: 'Kim Đồng' },
      { name: 'Truyện Tranh Thám Tử Kindaichi - Tập 1', sku: 'TRUYEN-KINDAICHI-1', description: 'Những vụ án hóc búa được giải quyết bởi thám tử Kindaichi thông minh.', price: 30000, discountPrice: 27000, categoryIndex: 2, subOptions: ['Trinh thám'], brand: 'Kim Đồng' },
      { name: 'Truyện Tranh Shin Cậu Bé Bút Chì - Tập 30', sku: 'TRUYEN-SHIN-30', description: 'Cuộc sống ngộ nghĩnh, hài hước đầy ắp tiếng cười của cu Shin.', price: 25000, discountPrice: 22000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Manga One Piece - Tập 101', sku: 'TRUYEN-OP-101', description: 'Băng Mũ Rơm đối đầu ác liệt tại Đảo Quỷ Wano quốc.', price: 30000, discountPrice: 27000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Manga One Piece - Tập 102', sku: 'TRUYEN-OP-102', description: 'Luffy chạm trán Kaido trong trận chiến định đoạt tương lai.', price: 30000, discountPrice: 27000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Manga Dragon Ball - Tập 1', sku: 'TRUYEN-DB-1', description: 'Bộ truyện 7 viên ngọc rồng quen thuộc gắn liền tuổi thơ.', price: 25000, discountPrice: 22000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Manga Dragon Ball - Tập 2', sku: 'TRUYEN-DB-2', description: 'Cuộc tìm kiếm ngọc rồng kỳ thú của Goku và nhóm bạn.', price: 25000, discountPrice: 22000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Manga Naruto - Tập 72', sku: 'TRUYEN-NARUTO-72', description: 'Tập cuối cùng khép lại thiên sử thi huyền thoại về nhẫn giả Naruto.', price: 30000, discountPrice: 27000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Manga Naruto - Tập 1', sku: 'TRUYEN-NARUTO-1', description: 'Khởi đầu giấc mơ trở thành Hokage của cậu bé mồ côi Naruto.', price: 25000, discountPrice: 22000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Truyện Tranh Học Viện Siêu Anh Hùng - Tập 35', sku: 'TRUYEN-MHA-35', description: 'Học viện anh hùng lớp 1-A bước vào trận đại chiến quyết định.', price: 35000, discountPrice: 31000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Manga Spy x Family - Tập 9', sku: 'TRUYEN-SPY-9', description: 'Gia đình điệp viên hờ Loid, Anya và Yor tiếp tục các nhiệm vụ dở khóc dở cười.', price: 30000, discountPrice: 27000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Manga Spy x Family - Tập 10', sku: 'TRUYEN-SPY-10', description: 'Anya đi học và kế hoạch tiếp cận mục tiêu đầy thú vị.', price: 30000, discountPrice: 27000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Truyện Tranh Chú Thuật Hồi Chiến - Tập 20', sku: 'TRUYEN-JJK-20', description: 'Cuộc chiến đẩy nguyền hồn điên cuồng của các chú thuật sư.', price: 35000, discountPrice: 31000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Manga Thanh Gươm Diệt Quỷ - Tập 23', sku: 'TRUYEN-KNY-23', description: 'Trận chiến cuối cùng chống lại chúa quỷ Muzan và kết thúc viên mãn.', price: 30000, discountPrice: 27000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Manga Lớp Học Ám Sát - Tập 1', sku: 'TRUYEN-ASSASS-1', description: 'Lớp học cá biệt 3-E cùng thầy giáo ngoài hành tinh Koro-sensei.', price: 30000, discountPrice: 27000, categoryIndex: 2, subOptions: ['Anime'], brand: 'Kim Đồng' },
      { name: 'Truyện Tranh Conan Tuyển Tập Đặc Biệt - Tập 1', sku: 'TRUYEN-CONAN-SP1', description: 'Tuyển chọn các vụ án đặc sắc về tổ chức áo đen kỳ bí.', price: 35000, discountPrice: 31000, categoryIndex: 2, subOptions: ['Conan', 'Trinh thám'], brand: 'Kim Đồng' },

      // Combo (20 items)
      { name: 'Combo Học Tập Tiết Kiệm Học Sinh Lớp 1', sku: 'COMBO-L1', description: 'Bao gồm hộp bút, bút chì, tẩy, thước, tập vẽ cho bé vào lớp 1.', price: 120000, discountPrice: 99000, categoryIndex: 3, subOptions: ['Học tập'], brand: 'Trường Thành' },
      { name: 'Combo Văn Phòng Phẩm Tiện Lợi Khối THCS', sku: 'COMBO-THCS', description: 'Bút mực, ruột bút, sổ ghi chép, máy tính khoa học bỏ túi học sinh cấp 2.', price: 180000, discountPrice: 155000, categoryIndex: 3, subOptions: ['Học tập'], brand: 'Trường Thành' },
      { name: 'Combo Quà Tặng Sinh Nhật Học Sinh Cute', sku: 'COMBO-QT-SN', description: 'Set quà sinh nhật dễ thương với bình nước, móc khóa, sổ tay mini decor xinh xắn.', price: 150000, discountPrice: 129000, categoryIndex: 3, subOptions: ['Quà tặng'], brand: 'Trường Thành' },
      { name: 'Combo Mỹ Thuật Vẽ Tranh Cơ Bản', sku: 'COMBO-MT-CB', description: 'Gồm bút chì phác thảo, màu nước 12 màu, cọ vẽ và giấy vẽ chuyên dụng.', price: 220000, discountPrice: 195000, categoryIndex: 3, subOptions: ['Mỹ thuật'], brand: 'Pentel' },
      { name: 'Combo Đóng Gói Quà Tặng Độc Đáo', sku: 'COMBO-DG-QT', description: 'Giấy Kraft gói quà, ruy băng trang trí và thiệp handmade xinh xắn.', price: 60000, discountPrice: 50000, categoryIndex: 3, subOptions: ['Đóng gói'], brand: 'Trường Thành' },
      { name: 'Combo 10 Bút Bi Thiên Long TL-027', sku: 'COMBO-TL027-10', description: 'Set 10 bút bi Thiên Long TL-027 mực xanh bền đẹp, êm tay.', price: 40000, discountPrice: 35000, categoryIndex: 3, subOptions: ['Học tập'], brand: 'Thiên Long' },
      { name: 'Combo 5 Bút Gel Xóa Được Pilot Frixion', sku: 'COMBO-PILOT-FX', description: 'Sản phẩm bút gel viết êm xóa sạch tiện lợi của thương hiệu Pilot Nhật Bản.', price: 290000, discountPrice: 260000, categoryIndex: 3, subOptions: ['Học tập'], brand: 'Pilot' },
      { name: 'Combo 3 Sổ Tay A5 Bìa Da Sang Trọng', sku: 'COMBO-SOTAY-3', description: 'Set 3 cuốn sổ tay A5 bìa da cao cấp cho người làm việc văn phòng.', price: 170000, discountPrice: 149000, categoryIndex: 3, subOptions: ['Quà tặng'], brand: 'Trường Thành' },
      { name: 'Combo 2 Bình Nước Thủy Tinh Giữ Nhiệt', sku: 'COMBO-BINHNUOC-2', description: 'Set 2 bình giữ nhiệt thủy tinh vỏ bọc silicon nhám đẹp mắt.', price: 130000, discountPrice: 110000, categoryIndex: 3, subOptions: ['Quà tặng'], brand: 'Trường Thành' },
      { name: 'Combo 5 Móc Khóa Capybara Dễ Thương', sku: 'COMBO-MK-CAPY', description: 'Bộ 5 móc khóa nhồi bông Capybara nhỏ xinh tặng bạn bè.', price: 110000, discountPrice: 95000, categoryIndex: 3, subOptions: ['Quà tặng'], brand: 'Trường Thành' },
      { name: 'Combo Dụng Cụ Mỹ Thuật Cao Cấp Pentel', sku: 'COMBO-MT-PENTEL', description: 'Màu poster Pentel, cọ vẽ cao cấp và khay pha màu chính hãng.', price: 350000, discountPrice: 310000, categoryIndex: 3, subOptions: ['Mỹ thuật'], brand: 'Pentel' },
      { name: 'Combo 3 Set Sticker Vintage Cổ Điển', sku: 'COMBO-STICKER-VT', description: 'Các nhãn dán sticker chất liệu giấy kraft phong cách vintage cổ điển decor sổ.', price: 45000, discountPrice: 38000, categoryIndex: 3, subOptions: ['Đóng gói'], brand: 'Trường Thành' },
      { name: 'Combo 2 Đất Sét Tự Khô 24 Màu', sku: 'COMBO-DATSET-24', description: 'Đất sét tự khô an toàn cho bé thỏa sức sáng tạo nặn hình đồ chơi.', price: 150000, discountPrice: 129000, categoryIndex: 3, subOptions: ['Mỹ thuật'], brand: 'Trường Thành' },
      { name: 'Combo Hộp Quà Giáng Sinh Ý Nghĩa', sku: 'COMBO-NOEL', description: 'Hộp quà Noel gồm tất len, cốc giữ nhiệt họa tiết cây thông sang trọng.', price: 190000, discountPrice: 169000, categoryIndex: 3, subOptions: ['Quà tặng'], brand: 'Trường Thành' },
      { name: 'Combo Set Bút Ký Quà Tặng Doanh Nhân', sku: 'COMBO-BUTKY-DN', description: 'Bút ký kim loại cao cấp kèm bao da và hộp đựng lót nhung sang trọng.', price: 450000, discountPrice: 399000, categoryIndex: 3, subOptions: ['Quà tặng'], brand: 'Trường Thành' },
      { name: 'Combo Đồ Dùng Học Tập Lớp 10 Toàn Diện', sku: 'COMBO-L10-TD', description: 'Đầy đủ compa, thước kẻ parabol, bút bi, ruột chì chì kim phục vụ lớp 10.', price: 130000, discountPrice: 110000, categoryIndex: 3, subOptions: ['Học tập'], brand: 'Trường Thành' },
      { name: 'Combo Học Sinh Khéo Tay Làm Thủ Công', sku: 'COMBO-THUCONG', description: 'Băng dính hai mặt, dao rọc giấy mini, thước thép và bìa màu thủ công.', price: 90000, discountPrice: 79000, categoryIndex: 3, subOptions: ['Mỹ thuật'], brand: 'Trường Thành' },
      { name: 'Combo 4 Set Băng Keo Washi Nhiều Màu', sku: 'COMBO-WASHI-4', description: 'Set 4 hộp băng keo trang trí Washi Tape nhiều tông màu dễ thương.', price: 80000, discountPrice: 69000, categoryIndex: 3, subOptions: ['Đóng gói'], brand: 'Trường Thành' },
      { name: 'Combo 2 Hộp Nhạc Gỗ Quay Tay Sang Trọng', sku: 'COMBO-HN-2', description: 'Set 2 hộp nhạc gỗ khắc laser tinh xảo làm quà tặng lưu niệm cực sang.', price: 320000, discountPrice: 280000, categoryIndex: 3, subOptions: ['Quà tặng'], brand: 'Trường Thành' },
      { name: 'Combo 5 Cuộn Băng Xóa Học Sinh Plus', sku: 'COMBO-XOAPLUS', description: 'Set 5 cuộn băng xóa học sinh Plus Nhật Bản dùng bền đẹp, tiết kiệm.', price: 75000, discountPrice: 65000, categoryIndex: 3, subOptions: ['Học tập'], brand: 'Plus' },

      // Đồ chơi (20 items)
      { name: 'Thùng Gạch Lắp Ráp Lego Classic 10698', sku: 'DC-LEGO-10698', description: 'Thùng Lego Classic chứa 790 chi tiết đa sắc màu kích thích trí tưởng tượng.', price: 890000, discountPrice: 790000, categoryIndex: 4, subOptions: ['Lego'], brand: 'LEGO' },
      { name: 'Bộ Lắp Ráp Lego Ninjago Rồng Thần', sku: 'DC-LEGO-NINJA', description: 'Chiến binh rồng Ninjago đầy dũng mãnh với 350 mảnh ghép hấp dẫn.', price: 550000, discountPrice: 490000, categoryIndex: 4, subOptions: ['Lego'], brand: 'LEGO' },
      { name: 'Rubik 3x3x3 Gan 356 M Có Nam Châm', sku: 'DC-RUBIK-GAN', description: 'Rubik thi đấu chuyên nghiệp lực hút nam châm xoay mượt cực đỉnh.', price: 450000, discountPrice: 399000, categoryIndex: 4, subOptions: ['Rubik'], brand: 'GAN' },
      { name: 'Rubik 4x4x4 QiYi QiYuan S2 Xoay Mượt', sku: 'DC-RUBIK-4X4', description: 'Rubik 4x4x4 QiYi chất liệu nhựa ABS an toàn cho người dùng mới.', price: 120000, discountPrice: 99000, categoryIndex: 4, subOptions: ['Rubik'], brand: 'QiYi' },
      { name: 'Bộ Đất Sét Tự Khô Tạo Hình Thủ Công', sku: 'DC-DATSET-TC', description: 'Bộ đất sét 24 màu kèm bộ dụng cụ tạo dáng sáng tạo hình vẽ.', price: 75000, discountPrice: 65000, categoryIndex: 4, subOptions: ['Thủ công'], brand: 'Trường Thành' },
      { name: 'Trò Chơi Boardgame Ma Sói Việt Hóa', sku: 'DC-MASOI-VH', description: 'Trò chơi đấu trí ma sói phổ biến dành cho nhóm bạn từ 8-30 người.', price: 85000, discountPrice: 75000, categoryIndex: 4, subOptions: ['Boardgame'], brand: 'Trường Thành' },
      { name: 'Boardgame Cờ Tỷ Phú Việt Nam Phiên Bản Cao Cấp', sku: 'DC-COTYPHU', description: 'Bàn cờ tỷ phú giấy cứng bền bỉ, quân cờ nhựa đẹp mắt chơi giải trí gia đình.', price: 160000, discountPrice: 140000, categoryIndex: 4, subOptions: ['Boardgame'], brand: 'Trường Thành' },
      { name: 'Trò Chơi Rút Gỗ Màu 54 Thanh Winwintoys', sku: 'DC-RUTGO-54', description: 'Bộ trò chơi rút gỗ màu sắc nổi bật, làm từ gỗ tự nhiên cực an toàn.', price: 130000, discountPrice: 110000, categoryIndex: 4, subOptions: ['Boardgame'], brand: 'Winwintoys' },
      { name: 'Bộ Đồ Chơi Khéo Tay Xếp Hình Gỗ Trí Tuệ', sku: 'DC-XEPHINH-GO', description: 'Bộ xếp hình khối gỗ đa dạng rèn luyện tư duy không gian cho trẻ nhỏ.', price: 95000, discountPrice: 85000, categoryIndex: 4, subOptions: ['Thủ công'], brand: 'Winwintoys' },
      { name: 'Bộ Đồ Chơi Trồng Cây Kỳ Diệu Magic Garden', sku: 'DC-MAGIC-GARDEN', description: 'Bộ kit trồng cây khoa học thu nhỏ giúp bé làm quen với thế giới thực vật.', price: 150000, discountPrice: 130000, categoryIndex: 4, subOptions: ['Thủ công'], brand: 'Trường Thành' },
      { name: 'Lego Technic Xe Đua Siêu Cấp', sku: 'DC-LEGO-RACE', description: 'Mô hình xe đua thể thao lắp ráp phức tạp cho người đam mê cơ khí.', price: 1200000, discountPrice: 1050000, categoryIndex: 4, subOptions: ['Lego'], brand: 'LEGO' },
      { name: 'Rubik 2x2x2 Moyu Meilong Cực Mượt', sku: 'DC-RUBIK-2X2', description: 'Rubik Moyu Meilong 2x2 phù hợp cho trẻ bắt đầu tập chơi.', price: 45000, discountPrice: 39000, categoryIndex: 4, subOptions: ['Rubik'], brand: 'MoYu' },
      { name: 'Bộ Tranh Cát 12 Màu Tự Làm Sáng Tạo', sku: 'DC-TRANHCAT-12', description: 'Tranh cát nghệ thuật DIY gồm 10 tranh vẽ và 12 lọ cát màu mịn.', price: 60000, discountPrice: 50000, categoryIndex: 4, subOptions: ['Thủ công'], brand: 'Trường Thành' },
      { name: 'Boardgame Mèo Nổ Exploding Kittens Bản Mở Rộng', sku: 'DC-MEONO-EXT', description: 'Thẻ bài mèo nổ kịch tính, cười thả ga khi chơi tụ tập cùng nhóm bạn.', price: 110000, discountPrice: 95000, categoryIndex: 4, subOptions: ['Boardgame'], brand: 'Exploding Kittens' },
      { name: 'Trò Chơi Uno Classic 108 Lá Bài', sku: 'DC-UNO-108', description: 'Bộ bài Uno 108 lá bài dày dặn, sắc nét kết nối tình bạn bè.', price: 40000, discountPrice: 35000, categoryIndex: 4, subOptions: ['Boardgame'], brand: 'Trường Thành' },
      { name: 'Bộ Đồ Chơi Lắp Ráp Mô Hình Gỗ 3D', sku: 'DC-GO3D-MH', description: 'Mô hình nhà gỗ, máy bay gỗ 3D tự lắp ráp cực kỳ đẹp mắt trang trí.', price: 180000, discountPrice: 155000, categoryIndex: 4, subOptions: ['Thủ công'], brand: 'Trường Thành' },
      { name: 'Bộ Tô Tượng Thạch Cao Cho Bé Sáng Tạo', sku: 'DC-TOTUONG', description: 'Gồm 10 tượng thạch cao đa dạng hình thù và bộ cọ màu acrylic tô đẹp.', price: 90000, discountPrice: 79000, categoryIndex: 4, subOptions: ['Thủ công'], brand: 'Trường Thành' },
      { name: 'Thảm Chơi Sudoku Bằng Gỗ Trí Tuệ', sku: 'DC-SUDOKU-GO', description: 'Bảng trò chơi Sudoku bằng gỗ cao cấp kèm các hạt số bằng gỗ rõ nét.', price: 210000, discountPrice: 185000, categoryIndex: 4, subOptions: ['Boardgame'], brand: 'Trường Thành' },
      { name: 'Boardgame Cờ Vây Gỗ Nhập Khẩu', sku: 'DC-COVAY', description: 'Bàn cờ vây chất liệu gỗ kèm hai hộp quân cờ đen trắng tinh xảo.', price: 480000, discountPrice: 420000, categoryIndex: 4, subOptions: ['Boardgame'], brand: 'Trường Thành' },
      { name: 'Rubik Megaminx 12 Mặt Moyu Cao Cấp', sku: 'DC-RUBIK-12M', description: 'Rubik Megaminx biến thể 12 mặt xoay cực mượt thử thách trí não.', price: 190000, discountPrice: 169000, categoryIndex: 4, subOptions: ['Rubik'], brand: 'MoYu' },

      // Đồ lưu niệm (20 items)
      { name: 'Móc Khóa Bông Hình Capybara Siêu Cute', sku: 'LN-MK-CAPYB', description: 'Móc khóa Capybara nhồi bông mịn màng làm móc khóa balo rất thời trang.', price: 45000, discountPrice: 35000, categoryIndex: 5, subOptions: ['Móc khóa'], brand: 'Trường Thành' },
      { name: 'Móc Khóa Acrylic Hình Anime Chibi Dễ Thương', sku: 'LN-MK-ANIME', description: 'Móc khóa mica acrylic in hình nhân vật anime nổi tiếng siêu sắc nét.', price: 25000, discountPrice: 20000, categoryIndex: 5, subOptions: ['Móc khóa'], brand: 'Trường Thành' },
      { name: 'Móc Khóa Kim Loại Hình Tháp Eiffel Cổ Điển', sku: 'LN-MK-EIFFEL', description: 'Móc khóa kim loại xi đồng bền bỉ mang phong cách cổ điển lãng mạn.', price: 30000, discountPrice: 25000, categoryIndex: 5, subOptions: ['Móc khóa'], brand: 'Trường Thành' },
      { name: 'Sổ Tay Bìa Gỗ Khắc Tên Theo Yêu Cầu', sku: 'LN-SOTAY-GO', description: 'Cuốn sổ bìa gỗ tự nhiên sang trọng, thích hợp lưu bút hay làm quà tặng kỷ niệm.', price: 140000, discountPrice: 120000, categoryIndex: 5, subOptions: ['Sổ tay'], brand: 'Trường Thành' },
      { name: 'Sổ Tay Da PU Khóa Số Bảo Mật A5', sku: 'LN-SOTAY-KHOA', description: 'Cuốn sổ mật mã cá nhân bìa da PU cao cấp bảo vệ thông tin riêng tư.', price: 180000, discountPrice: 159000, categoryIndex: 5, subOptions: ['Sổ tay'], brand: 'Trường Thành' },
      { name: 'Bình Nước Nhựa PP Cute Capybara Có Ống Hút', sku: 'LN-BINH-CAPY', description: 'Bình nước nhựa an toàn in hình Capybara ngộ nghĩnh đi kèm dây đeo chéo.', price: 95000, discountPrice: 85000, categoryIndex: 5, subOptions: ['Bình nước'], brand: 'Trường Thành' },
      { name: 'Bình Nước Giữ Nhiệt Inox 304 Cao Cấp 500ml', sku: 'LN-BINH-INOX', description: 'Bình nước giữ nhiệt nóng lạnh hiệu quả trong 12 tiếng, thiết kế trơn hiện đại.', price: 190000, discountPrice: 165000, categoryIndex: 5, subOptions: ['Bình nước'], brand: 'Trường Thành' },
      { name: 'Hộp Nhạc Bằng Gỗ Quay Tay Phát Nhạc Du Dương', sku: 'LN-HN-GOW', description: 'Hộp nhạc gỗ nhỏ gọn quay tay phát bản nhạc Castle in the Sky lãng mạn.', price: 150000, discountPrice: 129000, categoryIndex: 5, subOptions: ['Hộp quà'], brand: 'Trường Thành' },
      { name: 'Hộp Quà Giấy Vintage Bìa Cứng Cao Cấp', sku: 'LN-HOPQUA-VT', description: 'Hộp đựng quà carton bìa cứng thắt nơ ruy băng trang nhã, sang trọng.', price: 40000, discountPrice: 35000, categoryIndex: 5, subOptions: ['Hộp quà'], brand: 'Trường Thành' },
      { name: 'Quạt Nhựa Cầm Tay Mini Hình Thú Ngộ Nghĩnh', sku: 'LN-QUAT-MINI', description: 'Quạt nhựa xòe cầm tay mát mẻ xua tan cái nóng mùa hè cho học sinh.', price: 15000, discountPrice: 12000, categoryIndex: 5, subOptions: ['Móc khóa'], brand: 'Trường Thành' },
      { name: 'Đèn Ngủ Silicon Capybara Phát Sáng Dễ Thương', sku: 'LN-DEN-CAPY', description: 'Đèn ngủ chất liệu silicon mềm mại, vỗ nhẹ đổi màu ánh sáng cực thư giãn.', price: 210000, discountPrice: 180000, categoryIndex: 5, subOptions: ['Hộp quà'], brand: 'Trường Thành' },
      { name: 'Tượng Gốm Trang Trí Bàn Học Mini', sku: 'LN-TUONG-GOM', description: 'Bộ tượng nhỏ bằng gốm sứ trang trí tiểu cảnh bàn học vô cùng xinh xắn.', price: 50000, discountPrice: 42000, categoryIndex: 5, subOptions: ['Hộp quà'], brand: 'Bát Tràng' },
      { name: 'Đai Đọc Sách Silicon Chống Mỏi Mắt', sku: 'LN-DAI-DOC', description: 'Dụng cụ hỗ trợ giữ trang sách bằng silicon dẻo bền bỉ.', price: 20000, discountPrice: 17000, categoryIndex: 5, subOptions: ['Sổ tay'], brand: 'Trường Thành' },
      { name: 'Bookmark Kim Loại Mạ Vàng Hình Chiếc Lá', sku: 'LN-BOOKMARK', description: 'Kẹp sách kim loại mạ vàng hình lá cây phong cách thanh lịch.', price: 35000, discountPrice: 30000, categoryIndex: 5, subOptions: ['Sổ tay'], brand: 'Trường Thành' },
      { name: 'Lọ Ước Nguyện Thủy Tinh Ngôi Sao May Mắn', sku: 'LN-LO-UOC', description: 'Lọ thủy tinh chứa các hạt sao gấp sẵn nhiều màu làm quà tặng bạn gái.', price: 65000, discountPrice: 55000, categoryIndex: 5, subOptions: ['Hộp quà'], brand: 'Trường Thành' },
      { name: 'Hộp Bút Vải Canvas Đa Năng Hàn Quốc', sku: 'LN-HOPBUT-CV', description: 'Hộp đựng bút viết chất liệu vải canvas dày dặn có nhiều ngăn tiện lợi.', price: 85000, discountPrice: 75000, categoryIndex: 5, subOptions: ['Sổ tay'], brand: 'Trường Thành' },
      { name: 'Thẻ Hành Lý Silicon Hình Thú Ngộ Nghĩnh', sku: 'LN-LUGGAGE-TAG', description: 'Tag treo vali hành lý silicon chống thất lạc khi đi du lịch.', price: 35000, discountPrice: 30000, categoryIndex: 5, subOptions: ['Móc khóa'], brand: 'Trường Thành' },
      { name: 'Tấm Gỗ Treo Cửa Phòng Decor Cực Xinh', sku: 'LN-TREOCUA-GO', description: 'Bảng gỗ treo cửa phòng in chữ Welcom hoặc tên phòng sáng tạo.', price: 75000, discountPrice: 65000, categoryIndex: 5, subOptions: ['Hộp quà'], brand: 'Trường Thành' },
      { name: 'Bộ Viết Thư Vintage Giấy Kraft Cổ Điển', sku: 'LN-VIETTHU', description: 'Gồm 5 giấy viết thư và 5 phong bì chất liệu kraft nâu đậm chất hoài niệm.', price: 30000, discountPrice: 25000, categoryIndex: 5, subOptions: ['Sổ tay'], brand: 'Trường Thành' },
      { name: 'Gối Ôm Cổ Capybara Đi Du Lịch Tiện Lợi', sku: 'LN-GOI-CO', description: 'Gối chữ U ôm cổ êm ái nhồi bông Capybara xinh xắn dùng đi tàu xe.', price: 160000, discountPrice: 139000, categoryIndex: 5, subOptions: ['Hộp quà'], brand: 'Trường Thành' }
    ];

    const getProductImage = (name: string, categoryIndex: number, idx: number): string => {
      const nameLower = name.toLowerCase();
      
      // Category 0: Sách giáo khoa
      if (categoryIndex === 0) {
        const sgkImages = [
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500',
          'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500',
          'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=500',
          'https://images.unsplash.com/photo-1513001900722-370f803f498d?w=500',
          'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500',
          'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500',
        ];
        return sgkImages[idx % sgkImages.length];
      }
      
      // Category 1: Sách tham khảo
      if (categoryIndex === 1) {
        const stkImages = [
          'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500',
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
          'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500',
          'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500',
          'https://images.unsplash.com/photo-1495446815901-a7297e63b58d?w=500',
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500',
        ];
        return stkImages[idx % stkImages.length];
      }
      
      // Category 2: Truyện tranh
      if (categoryIndex === 2) {
        if (nameLower.includes('conan')) {
          return 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500';
        }
        if (nameLower.includes('doraemon')) {
          return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500';
        }
        const mangaImages = [
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500',
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500',
          'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=500',
          'https://images.unsplash.com/photo-1627389955805-72ff047c3bf3?w=500',
          'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=500',
        ];
        return mangaImages[idx % mangaImages.length];
      }
      
      // Category 3: Combo
      if (categoryIndex === 3) {
        const comboImages = [
          'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500',
          'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=500',
          'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500',
          'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500',
          'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?w=500',
        ];
        return comboImages[idx % comboImages.length];
      }
      
      // Category 4: Đồ chơi
      if (categoryIndex === 4) {
        if (nameLower.includes('lego')) {
          return 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500';
        }
        if (nameLower.includes('rubik')) {
          return 'https://images.unsplash.com/photo-1591261730799-ee4e6c2d16d7?w=500';
        }
        const toyImages = [
          'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500',
          'https://images.unsplash.com/photo-1591261730799-ee4e6c2d16d7?w=500',
          'https://images.unsplash.com/photo-1531214159280-079b95d26139?w=500',
          'https://images.unsplash.com/photo-1515488042361-404e9250afef?w=500',
          'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=500',
        ];
        return toyImages[idx % toyImages.length];
      }
      
      // Category 5: Đồ lưu niệm
      if (categoryIndex === 5) {
        const souvenirImages = [
          'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=500',
          'https://images.unsplash.com/photo-1507262925270-f55fd0147735?w=500',
          'https://images.unsplash.com/photo-1590845947376-2638caa06a1a?w=500',
          'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500',
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
        ];
        return souvenirImages[idx % souvenirImages.length];
      }
      
      return categoryImages[categoryIndex] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500';
    };

    const nonComboRawProducts = rawProducts.filter((p) => p.categoryIndex !== 3);
    const comboRawProducts = rawProducts.filter((p) => p.categoryIndex === 3);

    const nonComboProductsToCreate = nonComboRawProducts.map((p, idx) => {
      const categoryId = createdCombos[p.categoryIndex]._id;
      const imageUrl = getProductImage(p.name, p.categoryIndex, idx);
      return {
        name: p.name,
        slug: slugify(p.name),
        sku: p.sku,
        description: p.description,
        category: categoryId,
        brand: p.brand,
        price: p.price,
        discountPrice: p.discountPrice,
        stock: 100,
        images: [imageUrl],
        rating: 4.5 + Math.random() * 0.5,
        sold: Math.floor(Math.random() * 200) + 10,
        isFeatured: Math.random() > 0.7,
        status: ProductStatus.ACTIVE,
        subOptions: p.subOptions,
      };
    });

    const createdNonComboProducts = await this.productModel.insertMany(nonComboProductsToCreate);
    this.logger.log(`${createdNonComboProducts.length} Non-Combo Products seeded successfully`);

    // Group non-combo products by category index
    const productsByCategoryIndex: { [key: number]: any[] } = {
      0: [], 1: [], 2: [], 4: [], 5: []
    };
    createdNonComboProducts.forEach((product: any) => {
      const rawProd = nonComboRawProducts.find((rp) => rp.sku === product.sku);
      if (rawProd) {
        productsByCategoryIndex[rawProd.categoryIndex].push(product);
      }
    });

    // Create combo subcategories and combo products
    const comboProductsToCreate: any[] = [];

    for (let idx = 0; idx < comboRawProducts.length; idx++) {
      const p = comboRawProducts[idx];
      const opt = p.subOptions?.[0] || 'Học tập';
      const selectedSubProducts: any[] = [];

      if (opt === 'Học tập') {
        const sgkList = productsByCategoryIndex[0] || [];
        const stkList = productsByCategoryIndex[1] || [];
        const souvenirList = productsByCategoryIndex[5] || [];
        if (sgkList.length > 0) selectedSubProducts.push(sgkList[idx % sgkList.length]._id);
        if (stkList.length > 0) selectedSubProducts.push(stkList[(idx + 1) % stkList.length]._id);
        if (souvenirList.length > 0) {
          const stationeryItems = souvenirList.filter(item => 
            item.name.toLowerCase().includes('bút') || 
            item.name.toLowerCase().includes('sổ') || 
            item.name.toLowerCase().includes('hộp')
          );
          if (stationeryItems.length > 0) {
            selectedSubProducts.push(stationeryItems[idx % stationeryItems.length]._id);
          } else {
            selectedSubProducts.push(souvenirList[idx % souvenirList.length]._id);
          }
        }
      } else if (opt === 'Mỹ thuật') {
        const toyList = productsByCategoryIndex[4] || [];
        const craftToys = toyList.filter(item => 
          item.name.toLowerCase().includes('đất') || 
          item.name.toLowerCase().includes('cát') || 
          item.name.toLowerCase().includes('tượng') || 
          item.name.toLowerCase().includes('thủ công')
        );
        if (craftToys.length > 0) {
          selectedSubProducts.push(craftToys[idx % craftToys.length]._id);
          if (craftToys.length > 1) {
            selectedSubProducts.push(craftToys[(idx + 1) % craftToys.length]._id);
          }
        } else if (toyList.length > 0) {
          selectedSubProducts.push(toyList[idx % toyList.length]._id);
        }
      } else if (opt === 'Quà tặng') {
        const souvenirList = productsByCategoryIndex[5] || [];
        if (souvenirList.length > 0) {
          selectedSubProducts.push(souvenirList[idx % souvenirList.length]._id);
          if (souvenirList.length > 1) {
            selectedSubProducts.push(souvenirList[(idx + 1) % souvenirList.length]._id);
          }
          if (souvenirList.length > 2) {
            selectedSubProducts.push(souvenirList[(idx + 2) % souvenirList.length]._id);
          }
        }
      } else if (opt === 'Đóng gói') {
        const souvenirList = productsByCategoryIndex[5] || [];
        const wrappingItems = souvenirList.filter(item => 
          item.name.toLowerCase().includes('hộp') || 
          item.name.toLowerCase().includes('sticker') || 
          item.name.toLowerCase().includes('băng') || 
          item.name.toLowerCase().includes('thư')
        );
        if (wrappingItems.length > 0) {
          selectedSubProducts.push(wrappingItems[idx % wrappingItems.length]._id);
          if (wrappingItems.length > 1) {
            selectedSubProducts.push(wrappingItems[(idx + 1) % wrappingItems.length]._id);
          }
        } else if (souvenirList.length > 0) {
          selectedSubProducts.push(souvenirList[idx % souvenirList.length]._id);
        }
      }

      if (selectedSubProducts.length === 0 && createdNonComboProducts.length > 0) {
        selectedSubProducts.push(createdNonComboProducts[idx % createdNonComboProducts.length]._id);
      }

      // Create unique subcategory for this combo
      const subCategorySlug = `${slugify(p.name)}-cat`;
      const subCat = new this.categoryModel({
        name: p.name,
        slug: subCategorySlug,
        description: `Nhóm sản phẩm liên kết của ${p.name}`,
        parentId: createdCombos[3]._id,
        comboPrice: p.discountPrice || p.price,
        products: selectedSubProducts,
        status: true,
      });
      const savedSubCat = await subCat.save();

      const imageUrl = getProductImage(p.name, 3, idx);
      comboProductsToCreate.push({
        name: p.name,
        slug: slugify(p.name),
        sku: p.sku,
        description: p.description,
        category: savedSubCat._id,
        brand: p.brand,
        price: p.price,
        discountPrice: p.discountPrice,
        stock: 100,
        images: [imageUrl],
        rating: 4.5 + Math.random() * 0.5,
        sold: Math.floor(Math.random() * 200) + 10,
        isFeatured: Math.random() > 0.7,
        status: ProductStatus.ACTIVE,
        subOptions: p.subOptions,
      });
    }

    const createdComboProducts = await this.productModel.insertMany(comboProductsToCreate);
    this.logger.log(`${createdComboProducts.length} Combo Products seeded successfully`);

    // Combine all created products
    const createdProducts = [...createdNonComboProducts, ...createdComboProducts];

    // Group product IDs by category index for parent categories
    const categoryProductIds: { [index: number]: any[] } = {
      0: productsByCategoryIndex[0].map(p => p._id),
      1: productsByCategoryIndex[1].map(p => p._id),
      2: productsByCategoryIndex[2].map(p => p._id),
      3: createdComboProducts.map(p => p._id),
      4: productsByCategoryIndex[4].map(p => p._id),
      5: productsByCategoryIndex[5].map(p => p._id),
    };

    // Save bidirectional product reference into parent categories
    for (let i = 0; i < 6; i++) {
      const catId = createdCombos[i]._id;
      const productIds = categoryProductIds[i];
      await this.categoryModel.findByIdAndUpdate(catId, {
        products: productIds,
      });
    }
    this.logger.log('Bidirectional category product relationships mapped');

    // Create inventory records
    const inventoryRecords = createdProducts.map((product: any) => ({
      product: product._id,
      currentStock: product.stock,
      minStock: 10,
      maxStock: 1000,
      status: InventoryStatus.IN_STOCK,
      lastUpdated: new Date(),
    }));

    await this.inventoryModel.insertMany(inventoryRecords);
    this.logger.log('Inventory records generated');

    // Create promotions
    const promotions = [
      {
        code: 'GIAM10K',
        name: 'Voucher giảm 10K',
        description: 'Giảm 10.000đ cho đơn hàng từ 50.000đ trở lên',
        discountType: DiscountType.FIXED,
        discountValue: 10000,
        minOrderValue: 50000,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        usageLimit: 1000,
        usedCount: 0,
        status: true,
      },
      {
        code: 'HE2026',
        name: 'Chào Hè Rực Rỡ',
        description: 'Giảm 10% cho đơn hàng từ 100.000đ trở lên',
        discountType: DiscountType.PERCENT,
        discountValue: 10,
        minOrderValue: 100000,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        usageLimit: 500,
        usedCount: 0,
        status: true,
      },
      {
        code: 'TRUONGTHANH50',
        name: 'Tri ân khách hàng',
        description: 'Giảm 50.000đ cho đơn hàng từ 300.000đ trở lên',
        discountType: DiscountType.FIXED,
        discountValue: 50000,
        minOrderValue: 300000,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        usageLimit: 100,
        usedCount: 0,
        status: true,
      },
    ];
    await this.promotionModel.insertMany(promotions);
    this.logger.log('Promotions seeded');
    await this.seedDealHotLandingPage();
  }
}
