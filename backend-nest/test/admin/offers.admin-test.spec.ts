import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Offers & Discounts (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    // Clean up test data
    await prisma.offers.deleteMany({ where: { code: 'TEST_OFFER' } });
    await prisma.making_charge_discounts.deleteMany({ where: { name: 'Test Discount' } });

    // Find an admin user
    let admin = await prisma.user.findFirst({ where: { type: 'admin' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin.offers@example.com',
          password: 'hashed_password',
          type: 'admin',
        }
      });
    }

    const loginResult = await authService.login({ ...admin, guard: 'admin' });
    accessToken = loginResult.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Offers', () => {
    let offerId: string;

    it('POST /api/admin/offers - Should create an offer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/offers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'TEST_OFFER',
          name: 'Test Offer',
          type: 'percentage',
          value: 10.0,
          is_active: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('TEST_OFFER');
      offerId = response.body.id;
    });

    it('GET /api/admin/offers - Should list offers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/offers')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('PUT /api/admin/offers/:id - Should update an offer', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/admin/offers/${offerId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Offer',
          value: 15.0,
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Offer');
    });

    it('DELETE /api/admin/offers/:id - Should delete an offer', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/admin/offers/${offerId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Making Charge Discounts', () => {
    let discountId: string;

    it('POST /api/admin/offers/making-charge-discounts - Should create a discount', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/offers/making-charge-discounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Discount',
          discount_type: 'percentage',
          value: 5.0,
          is_active: true,
          customer_types: ['retailer'],
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Discount');
      discountId = response.body.id;
    });

    it('GET /api/admin/offers/making-charge-discounts - Should list discounts', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/offers/making-charge-discounts')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('PATCH /api/admin/offers/making-charge-discounts/:id - Should update a discount', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/offers/making-charge-discounts/${discountId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Discount',
          value: 7.5,
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Discount');
    });

    it('DELETE /api/admin/offers/making-charge-discounts/:id - Should delete a discount', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/admin/offers/making-charge-discounts/${discountId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });
  });
});

