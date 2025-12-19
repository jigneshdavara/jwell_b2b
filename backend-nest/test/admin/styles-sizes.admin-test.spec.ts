import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Styles & Sizes (e2e)', () => {
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
    await prisma.styles.deleteMany({ where: { code: 'test-style' } });
    await prisma.sizes.deleteMany({ where: { code: 'test-size' } });

    // Find an admin user
    let admin = await prisma.user.findFirst({ where: { type: 'admin' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin.stylesize@example.com',
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

  describe('Styles', () => {
    let styleId: string;

    it('POST /api/admin/styles - Should create a style', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/styles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'test-style',
          name: 'Test Style',
          description: 'Used for testing',
          is_active: true,
          display_order: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('test-style');
      styleId = response.body.id;
    });

    it('GET /api/admin/styles - Should list styles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/styles')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('PATCH /api/admin/styles/:id - Should update a style', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/styles/${styleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Style Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Style Name');
    });
  });

  describe('Sizes', () => {
    let sizeId: string;

    it('POST /api/admin/sizes - Should create a size', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/sizes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          code: 'test-size',
          name: 'Test Size',
          description: 'Used for testing',
          is_active: true,
          display_order: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('test-size');
      sizeId = response.body.id;
    });

    it('GET /api/admin/sizes - Should list sizes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/sizes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('PATCH /api/admin/sizes/:id - Should update a size', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/sizes/${sizeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Size Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Size Name');
    });
  });
});

