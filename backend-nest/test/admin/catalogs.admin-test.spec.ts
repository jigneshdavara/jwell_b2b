import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Catalogs (e2e)', () => {
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

        // Find an admin user
        let admin = await prisma.user.findFirst({ where: { type: 'admin' } });
        if (!admin) {
            admin = await prisma.user.create({
                data: {
                    name: 'Admin User',
                    email: 'admin.catalogs@example.com',
                    password: 'hashed_password',
                    type: 'admin',
                },
            });
        }

        const loginResult = await authService.login({
            ...admin,
            guard: 'admin',
        });
        accessToken = loginResult.access_token;
    });

    afterAll(async () => {
        await prisma.catalogs.deleteMany({
            where: { code: { startsWith: 'TEST_CAT' } },
        });
        await app.close();
    });

    describe('Catalog Lifecycle', () => {
        let catalogId: string;

        it('POST /api/admin/catalogs - Should create a catalog', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/catalogs')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    code: 'TEST_CAT_001',
                    name: 'Test Catalog',
                    description: 'Test Description',
                    is_active: true,
                    display_order: 1,
                });

            expect(response.status).toBe(201);
            expect(response.body.code).toBe('TEST_CAT_001');
            catalogId = response.body.id;
        });

        it('GET /api/admin/catalogs - Should list catalogs', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/catalogs')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.items)).toBe(true);
            expect(
                response.body.items.some(
                    (c: any) => c.id.toString() === catalogId.toString(),
                ),
            ).toBe(true);
        });

        it('GET /api/admin/catalogs/:id - Should get catalog details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/admin/catalogs/${catalogId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.code).toBe('TEST_CAT_001');
        });

        it('PUT /api/admin/catalogs/:id - Should update catalog', async () => {
            const response = await request(app.getHttpServer())
                .put(`/api/admin/catalogs/${catalogId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Updated Catalog',
                    display_order: 2,
                });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Updated Catalog');
        });

        it('GET /api/admin/catalogs/:id/assign-products - Should get products for assignment', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/admin/catalogs/${catalogId}/assign-products`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('products');
            expect(Array.isArray(response.body.products)).toBe(true);
        });

        it('DELETE /api/admin/catalogs/:id - Should delete catalog', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/admin/catalogs/${catalogId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
        });
    });
});
