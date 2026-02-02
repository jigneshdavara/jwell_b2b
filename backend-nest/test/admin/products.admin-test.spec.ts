import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Products (e2e)', () => {
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
        let admin = await prisma.admin.findFirst({ where: { type: 'admin' } });
        if (!admin) {
            admin = await prisma.admin.create({
                data: {
                    name: 'Admin User',
                    email: 'admin.products@example.com',
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
        await prisma.products.deleteMany({
            where: { sku: { startsWith: 'TEST_PROD' } },
        });
        await app.close();
    });

    describe('Product Lifecycle', () => {
        let productId: string;
        let brandId: string;
        let categoryId: string;
        let metalId: string;

        it('Setup dependencies', async () => {
            const brand =
                (await prisma.brands.findFirst()) ||
                (await prisma.brands.create({
                    data: { name: 'Test Brand', code: 'TEST_BRAND' },
                }));
            brandId = brand.id.toString();

            const category =
                (await prisma.categories.findFirst()) ||
                (await prisma.categories.create({
                    data: { name: 'Test Category' },
                }));
            categoryId = category.id.toString();

            const metal =
                (await prisma.metals.findFirst()) ||
                (await prisma.metals.create({
                    data: { name: 'Gold', code: 'GOLD' },
                }));
            metalId = metal.id.toString();
        });

        it('POST /api/admin/products - Should create a product with variant', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/products')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Test Product',
                    sku: 'TEST_PROD_001',
                    brand_id: parseInt(brandId),
                    category_id: parseInt(categoryId),
                    variants: [
                        {
                            label: 'Default Variant',
                            sku: 'TEST_PROD_001_V1',
                            is_default: true,
                            metals: [
                                {
                                    metal_id: parseInt(metalId),
                                    metal_weight: 10.5,
                                },
                            ],
                        },
                    ],
                });

            expect(response.status).toBe(201);
            expect(response.body.sku).toBe('TEST_PROD_001');
            productId = response.body.id;
        });

        it('GET /api/admin/products - Should list products', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/products')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.items)).toBe(true);
            expect(
                response.body.items.some(
                    (p: any) => p.id.toString() === productId.toString(),
                ),
            ).toBe(true);
        });

        it('GET /api/admin/products/:id - Should get product details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/admin/products/${productId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.sku).toBe('TEST_PROD_001');
            expect(response.body.variants.length).toBe(1);
        });

        it('POST /api/admin/products/:id/copy - Should copy product', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/admin/products/${productId}/copy`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(201);
            expect(response.body.name).toContain('(Copy)');
        });

        it('DELETE /api/admin/products/:id - Should delete product', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/admin/products/${productId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
        });
    });
});
