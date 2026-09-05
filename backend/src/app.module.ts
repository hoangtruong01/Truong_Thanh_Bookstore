import { Module, Logger, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { OrdersModule } from './modules/orders/orders.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SeedModule } from './seeds/seed.module';
import { LandingPagesModule } from './modules/landing-pages/landing-pages.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './common/redis/redis.module';
import { RedisThrottlerStorageService } from './common/redis/redis-throttler-storage.service';
import { APP_GUARD } from '@nestjs/core';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BannersModule } from './modules/banners/banners.module';
import { AppController } from './app.controller';
import { AddressesModule } from './modules/users/addresses.module';
import { EmailModule } from './modules/email/email.module';
import { CartModule } from './modules/cart/cart.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SecuritySanitizerMiddleware } from './common/middleware/security-sanitizer.middleware';
import { CommonModule } from './common/common.module';
import { ShippingModule } from './modules/shipping/shipping.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
      // Tests must use explicit test credentials/database and must not load
      // developer SMTP, Google Sheets or production database configuration.
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    CommonModule,
    ScheduleModule.forRoot(),
    RedisModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection: Connection): Connection => {
          const logger = new Logger('Database');
          connection.on('error', (err: unknown) => {
            if (!(err instanceof Error)) return;
            logger.error(`❌ Mongoose connection error: ${err.message || err}`);
          });
          connection.on('connected', () => {
            logger.log('✅ Mongoose connected successfully');
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisThrottlerStorageService],
      useFactory: (redisStorage: RedisThrottlerStorageService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000,
            limit: 100, // 100 requests per minute
          },
        ],
        storage: redisStorage,
      }),
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    PaymentsModule,
    ShippingModule,
    InventoryModule,
    ReviewsModule,
    CustomersModule,
    PromotionsModule,
    ReportsModule,
    SeedModule,
    LandingPagesModule,
    NotificationsModule,
    BannersModule,
    AddressesModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecuritySanitizerMiddleware).forRoutes('*');
  }
}
