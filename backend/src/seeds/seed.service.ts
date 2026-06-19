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
    const userCount = await this.userModel.countDocuments().exec();
    if (userCount === 0) {
      this.logger.log('Seeding database...');
      await this.seed();
      this.logger.log('Database seeded successfully!');
    } else {
      this.logger.log('Database already has data, skipping seed.');
    }
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
      { name: 'But - Viet', slug: 'but-viet', description: 'Cac loai but viet', image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400' },
      { name: 'Dung Cu Hoc Sinh', slug: 'dung-cu-hoc-sinh', description: 'Dung cu cho hoc sinh', image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400' },
      { name: 'Dung Cu Van Phong', slug: 'dung-cu-van-phong', description: 'Dung cu van phong', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400' },
      { name: 'San Pham Ve Giay', slug: 'san-pham-ve-giay', description: 'Cac san pham tu giay', image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400' },
      { name: 'Dung Cu Ve', slug: 'dung-cu-ve', description: 'Bo dung cu ve', image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400' },
      { name: 'May Tinh & Thiet Bi Nho', slug: 'may-tinh-thiet-bi-nho', description: 'May tinh va thiet bi nho', image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400' },
    ];

    const createdParents = await this.categoryModel.insertMany(parentCategories);
    this.logger.log('Parent categories seeded');

    const subCategories = [
      { name: 'But bi', slug: 'but-bi', parentId: createdParents[0]._id },
      { name: 'But gel', slug: 'but-gel', parentId: createdParents[0]._id },
      { name: 'But chi', slug: 'but-chi', parentId: createdParents[0]._id },
      { name: 'But da quang', slug: 'but-da-quang', parentId: createdParents[0]._id },
      { name: 'Gom - Tay', slug: 'gom-tay', parentId: createdParents[1]._id },
      { name: 'Thuoc', slug: 'thuoc', parentId: createdParents[1]._id },
      { name: 'Hop but', slug: 'hop-but', parentId: createdParents[1]._id },
      { name: 'Balo hoc sinh', slug: 'balo-hoc-sinh', parentId: createdParents[1]._id },
      { name: 'Keo', slug: 'keo-cat', parentId: createdParents[2]._id },
      { name: 'Dao roc giay', slug: 'dao-roc-giay', parentId: createdParents[2]._id },
      { name: 'Bang keo', slug: 'bang-keo', parentId: createdParents[2]._id },
      { name: 'Kep giay', slug: 'kep-giay', parentId: createdParents[2]._id },
      { name: 'Bia ho so', slug: 'bia-ho-so', parentId: createdParents[2]._id },
      { name: 'File tai lieu', slug: 'file-tai-lieu', parentId: createdParents[2]._id },
      { name: 'So tay', slug: 'so-tay', parentId: createdParents[3]._id },
      { name: 'Tap vo', slug: 'tap-vo', parentId: createdParents[3]._id },
      { name: 'Giay A4', slug: 'giay-a4', parentId: createdParents[3]._id },
      { name: 'Giay note', slug: 'giay-note', parentId: createdParents[3]._id },
      { name: 'Mau ve', slug: 'mau-ve', parentId: createdParents[4]._id },
      { name: 'Co ve', slug: 'co-ve', parentId: createdParents[4]._id },
      { name: 'May tinh bo tui', slug: 'may-tinh-bo-tui', parentId: createdParents[5]._id },
    ];

    const createdSubs = await this.categoryModel.insertMany(subCategories);
    this.logger.log('Sub categories seeded');

    const findSub = (slug: string) => {
      const found = createdSubs.find((s: any) => s.slug === slug);
      return found ? found._id : createdParents[0]._id;
    };

    const products = [
      { name: 'But bi Thien Long TL-027', slug: 'but-bi-thien-long-tl-027', sku: 'TL-027', description: 'But bi Thien Long TL-027 muc xanh, viet tron muot.', category: findSub('but-bi'), brand: 'Thien Long', price: 5000, discountPrice: 4000, stock: 500, images: ['https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'], rating: 4.5, sold: 1250, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Giay A4 Double A 70gsm', slug: 'giay-a4-double-a-70gsm', sku: 'DA-A4-70', description: 'Giay A4 Double A 70gsm, 500 to/ream.', category: findSub('giay-a4'), brand: 'Double A', price: 85000, discountPrice: 75000, stock: 200, images: ['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400'], rating: 4.8, sold: 890, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'So tay lo xo Truong Thanh A5', slug: 'so-tay-lo-xo-truong-thanh-a5', sku: 'TT-NB-A5', description: 'So tay lo xo Truong Thanh kho A5, 120 trang giay ke ngang.', category: findSub('so-tay'), brand: 'Truong Thanh', price: 35000, discountPrice: 28000, stock: 150, images: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400'], rating: 4.3, sold: 430, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'But da quang Pastel Set 6 mau', slug: 'but-da-quang-pastel-set-6-mau', sku: 'HL-PS-6', description: 'Bo 6 but da quang mau pastel nhe nhang.', category: findSub('but-da-quang'), brand: 'Highlight', price: 45000, discountPrice: 38000, stock: 100, images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400'], rating: 4.6, sold: 670, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'File ho so nhua A4', slug: 'file-ho-so-nhua-a4', sku: 'FILE-A4-01', description: 'File ho so nhua A4, bia trong suot, co nut bam.', category: findSub('file-tai-lieu'), brand: 'Truong Thanh', price: 8000, discountPrice: 0, stock: 300, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'], rating: 4.0, sold: 560, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Kep giay mau hop 100 cai', slug: 'kep-giay-mau-hop-100-cai', sku: 'KG-100', description: 'Hop 100 kep giay nhieu mau sac.', category: findSub('kep-giay'), brand: 'Truong Thanh', price: 15000, discountPrice: 12000, stock: 250, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'], rating: 4.2, sold: 340, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'May tinh Casio FX-580VN X', slug: 'may-tinh-casio-fx-580vn-x', sku: 'CS-FX580', description: 'May tinh khoa hoc Casio FX-580VN X, 521 tinh nang.', category: findSub('may-tinh-bo-tui'), brand: 'Casio', price: 650000, discountPrice: 580000, stock: 50, images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400'], rating: 4.9, sold: 210, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Combo van phong co ban 10 mon', slug: 'combo-van-phong-co-ban-10-mon', sku: 'COMBO-VP-10', description: 'Bo combo van phong 10 mon.', category: createdParents[2]._id, brand: 'Truong Thanh', price: 120000, discountPrice: 89000, stock: 80, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'], rating: 4.7, sold: 450, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Bo dung cu hoc sinh tieu hoc', slug: 'bo-dung-cu-hoc-sinh-tieu-hoc', sku: 'SET-HS-01', description: 'Bo dung cu hoc sinh tieu hoc day du.', category: createdParents[1]._id, brand: 'Truong Thanh', price: 95000, discountPrice: 75000, stock: 120, images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400'], rating: 4.4, sold: 380, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Bang keo trong 5cm', slug: 'bang-keo-trong-5cm', sku: 'BK-5CM', description: 'Bang keo trong suot, rong 5cm, dai 100 yard.', category: findSub('bang-keo'), brand: 'Truong Thanh', price: 18000, discountPrice: 0, stock: 400, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'], rating: 4.1, sold: 890, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Thuoc ke nhua 30cm', slug: 'thuoc-ke-nhua-30cm', sku: 'TK-30', description: 'Thuoc ke nhua trong suot 30cm.', category: findSub('thuoc'), brand: 'Thien Long', price: 8000, discountPrice: 6000, stock: 300, images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400'], rating: 4.0, sold: 620, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Gom tay trang cao cap', slug: 'gom-tay-trang-cao-cap', sku: 'GT-01', description: 'Gom tay trang cao cap, tay sach khong de lai vet.', category: findSub('gom-tay'), brand: 'Thien Long', price: 5000, discountPrice: 0, stock: 500, images: ['https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400'], rating: 4.3, sold: 780, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'But chi 2B hop 12 cay', slug: 'but-chi-2b-hop-12-cay', sku: 'BC-2B-12', description: 'Hop 12 but chi 2B, than go tu nhien.', category: findSub('but-chi'), brand: 'Thien Long', price: 36000, discountPrice: 30000, stock: 200, images: ['https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400'], rating: 4.5, sold: 540, isFeatured: false, status: ProductStatus.ACTIVE },
      { name: 'Giay note pastel', slug: 'giay-note-pastel', sku: 'GN-PS', description: 'Giay note pastel 5 mau, kich thuoc 76x76mm.', category: findSub('giay-note'), brand: 'Truong Thanh', price: 12000, discountPrice: 9000, stock: 350, images: ['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400'], rating: 4.4, sold: 920, isFeatured: true, status: ProductStatus.ACTIVE },
      { name: 'Dao roc giay mini', slug: 'dao-roc-giay-mini', sku: 'DRG-MINI', description: 'Dao roc giay mini kich thuoc nho gon.', category: findSub('dao-roc-giay'), brand: 'Truong Thanh', price: 15000, discountPrice: 12000, stock: 180, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400'], rating: 4.2, sold: 320, isFeatured: false, status: ProductStatus.ACTIVE },
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
      { code: 'WELCOME10', name: 'Welcome 10% off', description: 'Giam 10% cho khach hang moi', discountType: DiscountType.PERCENT, discountValue: 10, minOrderValue: 100000, startDate: now, endDate: twoMonthsLater, usageLimit: 1000, usedCount: 0, status: true },
      { code: 'SUMMER50K', name: 'Summer sale 50K', description: 'Giam 50.000d cho don hang tu 300.000d', discountType: DiscountType.FIXED, discountValue: 50000, minOrderValue: 300000, startDate: now, endDate: oneMonthLater, usageLimit: 500, usedCount: 0, status: true },
      { code: 'FREESHIP', name: 'Free shipping', description: 'Giam 30.000d phi ship cho don tu 200.000d', discountType: DiscountType.FIXED, discountValue: 30000, minOrderValue: 200000, startDate: now, endDate: twoMonthsLater, usageLimit: 2000, usedCount: 0, status: true },
    ]);
    this.logger.log('Promotions seeded');

    const sampleOrders = [
      {
        orderCode: 'TT240601ABC001',
        customer: customer._id,
        items: [
          { product: createdProducts[0]._id, name: createdProducts[0].name, price: 4000, quantity: 5, image: createdProducts[0].images[0] },
          { product: createdProducts[1]._id, name: createdProducts[1].name, price: 75000, quantity: 2, image: createdProducts[1].images[0] },
        ],
        shippingAddress: '123 Nguyen Trai, Q.1, TP.HCM',
        phone: '0912345678',
        customerName: 'Nguyen Van Khach',
        customerEmail: 'customer@truongthanh.vn',
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.UNPAID,
        orderStatus: OrderStatus.COMPLETED,
        subtotal: 170000,
        shippingFee: 0,
        discount: 0,
        total: 170000,
      },
      {
        orderCode: 'TT240602DEF002',
        customer: customer._id,
        items: [
          { product: createdProducts[6]._id, name: createdProducts[6].name, price: 580000, quantity: 1, image: createdProducts[6].images[0] },
        ],
        shippingAddress: '456 Le Loi, Q.5, TP.HCM',
        phone: '0912345678',
        customerName: 'Nguyen Van Khach',
        customerEmail: 'customer@truongthanh.vn',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.SHIPPING,
        subtotal: 580000,
        shippingFee: 0,
        discount: 0,
        total: 580000,
      },
      {
        orderCode: 'TT240603GHI003',
        customer: customer._id,
        items: [
          { product: createdProducts[7]._id, name: createdProducts[7].name, price: 89000, quantity: 3, image: createdProducts[7].images[0] },
        ],
        shippingAddress: '789 Tran Hung Dao, Q.1, TP.HCM',
        phone: '0912345678',
        customerName: 'Nguyen Van Khach',
        customerEmail: 'customer@truongthanh.vn',
        paymentMethod: PaymentMethod.EWALLET,
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.PENDING,
        subtotal: 267000,
        shippingFee: 0,
        discount: 26700,
        total: 240300,
      },
    ];

    await this.orderModel.insertMany(sampleOrders);
    this.logger.log('Orders seeded');
    this.logger.log('All seed data created successfully!');
  }
}
