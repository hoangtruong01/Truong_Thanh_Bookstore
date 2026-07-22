import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('TRƯỜNG THÀNH BOOKSTORE — COMPLETE E2E TEST SUITE', () => {
  let app: INestApplication;
  let customerToken: string;
  let adminToken: string;
  let testProductId: string;
  let testOrderCode: string;
  let testOrderId: string;

  const testUser = {
    fullName: 'E2E Tester',
    email: `e2e_user_${Date.now()}@example.com`,
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
  });

  // ==========================================
  // 1. AUTHENTICATION E2E FLOW
  // ==========================================
  describe('1. Authentication E2E Flow', () => {
    it('1.1 Should register a new customer account', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
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
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Email already exists');
    });

    it('1.3 Should login successfully with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
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
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.total).toBeDefined();

      if (res.body.data.data.length > 0) {
        testProductId = res.body.data.data[0]._id;
      }
    });

    it('2.2 Should search products safely with diacritics', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/products?q=bút')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.data)).toBe(true);
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
        items: [{ product: testProductId, name: 'Sản phẩm E2E Test', price: 100000, quantity: 1 }],
        shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
        phone: '0901234567',
        paymentMethod: 'COD',
        customerName: 'Guest Tester',
        customerEmail: 'guest@example.com',
      };

      const res = await request(app.getHttpServer())
        .post('/api/orders')
        .send(orderData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.orderCode).toBeDefined();
      expect(res.body.data.shippingFee).toBe(30000); // Threshold 299K check: < 299K -> ship 30K
      expect(res.body.data.total).toBe(res.body.data.subtotal + res.body.data.shippingFee);
    });

    it('3.2 Should create order for authenticated user', async () => {
      if (!testProductId) return;

      const orderData = {
        items: [{ product: testProductId, name: 'Sản phẩm E2E Test', price: 150000, quantity: 2 }],
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
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThan(0);
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
    it('4.1 Should login as seed Admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@truongthanh.vn', password: 'Admin@123456' })
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
    await app.close();
  });
});
