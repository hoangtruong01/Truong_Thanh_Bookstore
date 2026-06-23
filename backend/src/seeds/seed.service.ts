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
  ) {}

  async onModuleInit() {
    const hasUsers = await this.userModel.countDocuments({}).exec();
    const hasCategories = await this.categoryModel.countDocuments({}).exec();
    const firstCategory = await this.categoryModel.findOne({ name: 'Sách giáo khoa' }).exec() as any;

    if (hasUsers === 0 || hasCategories === 0 || !firstCategory || !firstCategory.optionsLabel) {
      this.logger.log('Seeding core users and categories...');
      await this.clearDatabase();
      await this.seed();
    } else {
      // Wipe all existing demo products, orders, promotions, inventory if any exist
      const prodCount = await this.productModel.countDocuments({}).exec();
      if (prodCount > 0) {
        this.logger.log('Clearing old demo products, promotions, orders and inventory...');
        await this.productModel.deleteMany({});
        await this.orderModel.deleteMany({});
        await this.promotionModel.deleteMany({});
        await this.inventoryModel.deleteMany({});
        await this.transactionModel.deleteMany({});
        await this.categoryModel.updateMany({}, { products: [] });
      }
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

    await this.categoryModel.insertMany(parentCategories);
    this.logger.log('6 Real parent categories seeded successfully');
  }
}
