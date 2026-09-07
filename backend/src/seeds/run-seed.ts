import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';
import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../modules/users/schemas/user.schema';
import { Category } from '../modules/categories/schemas/category.schema';
import { Product } from '../modules/products/schemas/product.schema';
import { Promotion } from '../modules/promotions/schemas/promotion.schema';
import { Order } from '../modules/orders/schemas/order.schema';
import { Inventory } from '../modules/inventory/schemas/inventory.schema';

async function bootstrap() {
  const logger = new Logger('SeedRunner');
  const isReset = process.argv.includes('--reset');

  logger.log('====================================================');
  logger.log('🌱 KHỞI CHẠY TIẾN TRÌNH SEED DỮ LIỆU CỤC BỘ (CLI)');
  logger.log(`Chế độ: ${isReset ? 'RESET (Xóa cũ & nạp lại mới)' : 'BỔ SUNG AN TOÀN'}`);
  logger.log('====================================================');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const seedService = app.get(SeedService);

    if (isReset) {
      logger.warn('Đang dọn dẹp cơ sở dữ liệu cũ...');
      await seedService.clearDatabase();
      logger.log('Đã dọn dẹp xong database!');
    }

    logger.log('Đang nạp dữ liệu mẫu...');
    await seedService.seed();

    // Thống kê kết quả
    const userModel = app.get(getModelToken(User.name));
    const catModel = app.get(getModelToken(Category.name));
    const prodModel = app.get(getModelToken(Product.name));
    const promoModel = app.get(getModelToken(Promotion.name));
    const orderModel = app.get(getModelToken(Order.name));
    const invModel = app.get(getModelToken(Inventory.name));

    const [users, categories, products, promos, orders, inventories] = await Promise.all([
      userModel.countDocuments({}),
      catModel.countDocuments({}),
      prodModel.countDocuments({}),
      promoModel.countDocuments({}),
      orderModel.countDocuments({}),
      invModel.countDocuments({}),
    ]);

    logger.log('----------------------------------------------------');
    logger.log('✅ SEED DỮ LIỆU HOÀN TẤT THÀNH CÔNG!');
    logger.log(`👥 Tài khoản (Users):         ${users}`);
    logger.log(`📂 Danh mục (Categories):     ${categories}`);
    logger.log(`📚 Sản phẩm sách (Products):   ${products}`);
    logger.log(`📦 Kho hàng (Inventories):     ${inventories}`);
    logger.log(`🎟️ Mã giảm giá (Promotions):   ${promos}`);
    logger.log(`🧾 Đơn hàng mẫu (Orders):      ${orders}`);
    logger.log('----------------------------------------------------');
    logger.log('🔑 TÀI KHOẢN ĐĂNG NHẬP THỬ NGHIỆM:');
    logger.log('1. Super Admin: superadmin@truongthanh.vn | Pass: SuperAdmin@123456');
    logger.log('2. Admin:       admin@truongthanh.vn      | Pass: Admin@123456');
    logger.log('3. Staff:       staff@truongthanh.vn      | Pass: Staff@123456');
    logger.log('4. Customer:    customer@truongthanh.vn   | Pass: Customer@123456');
    logger.log('----------------------------------------------------');
  } catch (error) {
    logger.error('Lỗi khi thực thi seed dữ liệu:', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap();
