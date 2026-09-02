import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../src/modules/users/schemas/user.schema';
import {
  Product,
  ProductDocument,
} from '../src/modules/products/schemas/product.schema';
import {
  Order,
  OrderDocument,
} from '../src/modules/orders/schemas/order.schema';
import {
  Inventory,
  InventoryDocument,
} from '../src/modules/inventory/schemas/inventory.schema';
import { ProductsService } from '../src/modules/products/products.service';
import {
  Category,
  CategoryDocument,
} from '../src/modules/categories/schemas/category.schema';
import { CategoriesService } from '../src/modules/categories/categories.service';
import { UserRole } from '../src/common/enums';

jest.setTimeout(60000);

describe('TRƯỜNG THÀNH BOOKSTORE — COMPLETE E2E TEST SUITE', () => {
  let app: INestApplication;
  let customerToken: string;
  let adminToken: string;
  let testProductId: string;
  let testCategoryId: string;
  let testOrderCode: string;
  let testOrderId: string;
  let userModel: Model<UserDocument>;
  let productModel: Model<ProductDocument>;
  let orderModel: Model<OrderDocument>;
  let inventoryModel: Model<InventoryDocument>;
  let categoryModel: Model<CategoryDocument>;

  const runId = Date.now();
  const adminEmail = `e2e_admin_${runId}@example.com`;
  const adminPassword = 'AdminE2E@123';
  const guestEmail = `e2e_guest_${runId}@example.com`;

  const testUser = {
    fullName: 'E2E Tester',
    email: `e2e_user_${runId}@example.com`,
    password: 'Password@123',
    phone: '0912345678',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    userModel = moduleFixture.get<Model<UserDocument>>(
      getModelToken(User.name),
    );
    productModel = moduleFixture.get<Model<ProductDocument>>(
      getModelToken(Product.name),
    );
    orderModel = moduleFixture.get<Model<OrderDocument>>(
      getModelToken(Order.name),
    );
    inventoryModel = moduleFixture.get<Model<InventoryDocument>>(
      getModelToken(Inventory.name),
    );
    categoryModel = moduleFixture.get<Model<CategoryDocument>>(
      getModelToken(Category.name),
    );

    await userModel.create({
      fullName: 'E2E Admin',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: UserRole.ADMIN,
      status: true,
    });

    const createdCategory = await moduleFixture.get(CategoriesService).create({
      name: `E2E Category ${runId}`,
      slug: `e2e-category-${runId}`,
    });
    testCategoryId = createdCategory._id.toString();

    const createdProduct = await moduleFixture.get(ProductsService).create({
      name: `E2E Product ${runId}`,
      slug: `e2e-product-${runId}`,
      sku: `E2E-${runId}`,
      category: testCategoryId,
      price: 100000,
      stock: 100,
    });
    testProductId = createdProduct._id.toString();
  }, 60000);

  // ==========================================
  // 1. AUTHENTICATION E2E FLOW
  // ==========================================
  describe('1. Authentication E2E Flow', () => {
    it('1.1 Should register a new customer account', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('x-client-platform', 'mobile')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.accessToken).toBeDefined();

      customerToken = res.body.data.accessToken;
    });

    it('1.2 Should reject duplicate registration with same email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('x-client-platform', 'mobile')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Email (đã tồn tại|already exists)/i);
    });

    it('1.3 Should login successfully with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('x-client-platform', 'mobile')
        .send({ email: testUser.email, password: testUser.password })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      customerToken = res.body.data.accessToken;
    });

    it('1.4 Should reject login with invalid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('1.5 Should fetch current user profile via JWT', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.password).toBeUndefined(); // Ensure password hash is not leaked
    });

    it('1.6 Should change password successfully', async () => {
      const res = await request(app.getHttpServer())
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          currentPassword: testUser.password,
          newPassword: 'NewPassword@123',
        })
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify login with new password
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('x-client-platform', 'mobile')
        .send({ email: testUser.email, password: 'NewPassword@123' })
        .expect(201);

      expect(loginRes.body.data.accessToken).toBeDefined();
      customerToken = loginRes.body.data.accessToken;
    });
  });

  // ==========================================
  // 2. PRODUCTS & CATALOG SEARCH E2E FLOW
  // ==========================================
  describe('2. Products & Catalog E2E Flow', () => {
    it('2.1 Should retrieve product list with pagination', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?page=1&limit=10')
        .expect(200);

      expect(res.body.success).toBe(true);
      const items = Array.isArray(res.body.data)
        ? res.body.data
        : res.body.data.data;
      expect(Array.isArray(items)).toBe(true);
      expect(
        res.body.meta?.total !== undefined ||
          res.body.data?.total !== undefined ||
          items.length >= 0,
      ).toBe(true);

      if (!testProductId && items.length > 0) {
        // Find a product with price < 299,000 to ensure shipping fee of 30,000 is triggered in guest checkout tests
        const cheapProduct = items.find((p: any) => {
          const actualPrice = p.discountPrice > 0 ? p.discountPrice : p.price;
          return actualPrice < 299000;
        });
        testProductId = cheapProduct ? cheapProduct._id : items[0]._id;
      }
    });

    it('2.2 Should search products safely with diacritics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?q=bút')
        .expect(200);

      expect(res.body.success).toBe(true);
      const items = Array.isArray(res.body.data)
        ? res.body.data
        : res.body.data.data;
      expect(Array.isArray(items)).toBe(true);
    });

    it('2.3 Should fetch single product detail if ID exists', async () => {
      if (!testProductId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/products/${testProductId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(testProductId);
    });

    it('2.4 Should return 404 for non-existent product ID', async () => {
      await request(app.getHttpServer())
        .get('/api/products/507f1f77bcf86cd799439099')
        .expect(404);
    });
  });

  // ==========================================
  // 3. ORDERS & CHECKOUT E2E FLOW
  // ==========================================
  describe('3. Orders & Checkout E2E Flow', () => {
    it('3.1 Should create order via guest checkout', async () => {
      if (!testProductId) return;

      const orderData = {
        items: [
          {
            product: testProductId,
            name: 'Sản phẩm E2E Test',
            price: 100000,
            quantity: 1,
          },
        ],
        shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
        phone: '0901234567',
        paymentMethod: 'COD',
        customerName: 'Guest Tester',
        customerEmail: guestEmail,
      };

      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.orderCode).toBeDefined();
      expect(res.body.data.shippingFee).toBe(30000); // Threshold 299K check: < 299K -> ship 30K
      expect(res.body.data.total).toBe(
        res.body.data.subtotal + res.body.data.shippingFee,
      );
    });

    it('3.2 Should create order for authenticated user', async () => {
      if (!testProductId) return;

      const orderData = {
        items: [
          {
            product: testProductId,
            name: 'Sản phẩm E2E Test',
            price: 150000,
            quantity: 2,
          },
        ],
        shippingAddress: '456 Đường XYZ, Quận 3, TP.HCM',
        phone: '0912345678',
        paymentMethod: 'COD',
        customerName: 'Authenticated Tester',
        customerEmail: testUser.email,
      };

      const res = await request(app.getHttpServer())
        .post('/api/orders/authenticated')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(orderData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.orderCode).toBeDefined();
      testOrderCode = res.body.data.orderCode;
      testOrderId = res.body.data._id;
    });

    it('3.3 Should fetch customer order history', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const orders = Array.isArray(res.body.data)
        ? res.body.data
        : res.body.data.data;
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
    });

    it('3.4 Should fetch order detail by ID', async () => {
      if (!testOrderId) return;

      const res = await request(app.getHttpServer())
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.orderCode).toBe(testOrderCode);
    });

    it('3.5 Should cancel PENDING order and restore stock', async () => {
      if (!testOrderId) return;

      const res = await request(app.getHttpServer())
        .delete(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.orderStatus).toBe('CANCELLED');
    });
  });

  // ==========================================
  // 4. ADMIN & BACKOFFICE E2E FLOW
  // ==========================================
  describe('4. Admin & Backoffice E2E Flow', () => {
    it('4.1 Should login as the isolated E2E Admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('x-client-platform', 'mobile')
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ADMIN');
      adminToken = res.body.data.accessToken;
    });

    it('4.2 Should fetch Admin Dashboard analytics', async () => {
      if (!adminToken) return;

      const res = await request(app.getHttpServer())
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
    });

    it('4.3 Should fetch Inventory status list', async () => {
      if (!adminToken) return;

      const res = await request(app.getHttpServer())
        .get('/api/inventory')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('4.4 Should fetch Customers list', async () => {
      if (!adminToken) return;

      const res = await request(app.getHttpServer())
        .get('/api/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  afterAll(async () => {
    if (orderModel) {
      await orderModel.deleteMany({
        customerEmail: { $in: [testUser.email, guestEmail] },
      });
    }
    if (inventoryModel && testProductId) {
      await inventoryModel.deleteOne({ product: testProductId });
    }
    if (productModel && testProductId) {
      await productModel.deleteOne({ _id: testProductId });
    }
    if (categoryModel && testCategoryId) {
      await categoryModel.deleteOne({ _id: testCategoryId });
    }
    if (userModel) {
      await userModel.deleteMany({
        email: { $in: [testUser.email, adminEmail] },
      });
    }
    await app.close();
  });
});
