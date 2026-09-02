import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Critical Commerce Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let productId: string;
  let productName: string;
  let productPrice: number;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Register/Login
    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('x-client-platform', 'mobile')
      .send({
        email: `test_e2e_${Date.now()}@test.com`,
        password: 'Password123!',
        fullName: 'E2E Test User',
        phone: '0987654321',
      });

    if (registerRes.status === 201) {
      accessToken =
        registerRes.body.data?.accessToken ?? registerRes.body.accessToken;
    } else {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('x-client-platform', 'mobile')
        .send({
          email: 'admin@truongthanh.com',
          password: 'Password123!',
        });
      accessToken =
        loginRes.body.data?.accessToken ?? loginRes.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should successfully get product lists', async () => {
    const res = await request(app.getHttpServer()).get('/api/products?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    if (res.body.data.length > 0) {
      productId = res.body.data[0]._id;
      productName = res.body.data[0].name;
      productPrice = res.body.data[0].discountPrice || res.body.data[0].price;
    }
  });

  it('should allow user to checkout if product exists', async () => {
    if (!productId) return; // Skip if no products

    const res = await request(app.getHttpServer())
      .post('/api/orders/authenticated')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        items: [
          {
            product: productId,
            name: productName,
            price: productPrice,
            quantity: 1,
          },
        ],
        shippingAddress: '123 Test St',
        phone: '0987654321',
        paymentMethod: 'COD',
      });

    expect(res.status).toBe(201);
    expect(res.body.orderCode).toBeDefined();
    expect(res.body.total).toBeGreaterThan(0);
  });
});
