import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('Frontend Catalog (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let authToken: string;
    let testCustomer: any;
    let testProduct: any;
    let testCategory: any;
    let testBrand: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Add BigInt serialization fix for tests
        (BigInt.prototype as any).toJSON = function () {
            return this.toString();
        };

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
            }),
        );
        app.setGlobalPrefix('api');
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);
        authService = app.get<AuthService>(AuthService);

        // Create test customer with approved KYC
        const hashedPassword = await bcrypt.hash('password123', 10);
        testCustomer = await prisma.customer.create({
            data: {
                name: 'Test Customer',
                email: `catalog-test-${Date.now()}@example.com`,
                password: hashedPassword,
                type: 'retailer',
                kyc_status: 'approved',
                is_active: true,
            },
        });

        // Login to get auth token
        const loginResult = await authService.login({
            ...testCustomer,
            id: testCustomer.id.toString(),
        });
        if (loginResult && 'access_token' in loginResult) {
            authToken = loginResult.access_token;
        }

        // Create test brand
        testBrand = await prisma.brands.create({
            data: {
                name: 'Test Brand',
                code: `TEST-BRAND-${Date.now()}`,
                is_active: true,
            },
        });

        // Create test category
        testCategory = await prisma.categories.create({
            data: {
                name: 'Test Category',
                is_active: true,
            },
        });

        // Create test product
        testProduct = await prisma.products.create({
            data: {
                name: 'Test Product',
                sku: `TEST-${Date.now()}`,
                description: 'Test product description',
                making_charge_amount: 500,
                is_active: true,
                brand_id: testBrand.id,
                category_id: testCategory.id,
                metadata: {
                    uses_gold: true,
                },
            },
        });

        // Create a variant for the product
        await prisma.product_variants.create({
            data: {
                product_id: testProduct.id,
                label: 'Default Variant',
                is_default: true,
                inventory_quantity: 10,
            },
        });
    });

    afterAll(async () => {
        // Cleanup test data
        if (testProduct) {
            await prisma.product_variants.deleteMany({
                where: { product_id: testProduct.id },
            });
            await prisma.products.delete({
                where: { id: testProduct.id },
            });
        }
        if (testCategory) {
            await prisma.categories.delete({
                where: { id: testCategory.id },
            });
        }
        if (testBrand) {
            await prisma.brands.delete({
                where: { id: testBrand.id },
            });
        }
        if (testCustomer) {
            await prisma.customer.delete({
                where: { id: testCustomer.id },
            });
        }
        if (app) {
            await app.close();
        }
    });

    describe('GET /api/catalog', () => {
        it('should return catalog with products', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/catalog')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('filters');
            expect(response.body).toHaveProperty('products');
            expect(response.body).toHaveProperty('facets');
            expect(response.body.products).toHaveProperty('data');
            expect(response.body.products).toHaveProperty('current_page');
            expect(response.body.products).toHaveProperty('total');
        });

        it('should filter products by search', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/catalog')
                .query({ search: 'Test Product' })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.products.data).toBeInstanceOf(Array);
            const foundProduct = response.body.products.data.find(
                (p: any) => p.id === testProduct.id.toString(),
            );
            expect(foundProduct).toBeDefined();
        });

        it('should filter products by category', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/catalog')
                .query({ category: [testCategory.id.toString()] })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.products.data).toBeInstanceOf(Array);
            const foundProduct = response.body.products.data.find(
                (p: any) => p.id === testProduct.id.toString(),
            );
            expect(foundProduct).toBeDefined();
        });

        it('should filter products by brand', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/catalog')
                .query({ brand: [testBrand.name] })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.products.data).toBeInstanceOf(Array);
            const foundProduct = response.body.products.data.find(
                (p: any) => p.id === testProduct.id.toString(),
            );
            expect(foundProduct).toBeDefined();
        });

        it('should sort products by name', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/catalog')
                .query({ sort: 'name_asc' })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.products.data).toBeInstanceOf(Array);
            if (response.body.products.data.length > 1) {
                const names = response.body.products.data.map(
                    (p: any) => p.name,
                );
                const sortedNames = [...names].sort();
                expect(names).toEqual(sortedNames);
            }
        });

        it('should return facets', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/catalog')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.facets).toHaveProperty('categories');
            expect(response.body.facets).toHaveProperty('metals');
            expect(response.body.facets).toHaveProperty('brands');
            expect(response.body.facets).toHaveProperty('catalogs');
            expect(response.body.facets).toHaveProperty('diamondOptions');
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer()).get('/api/catalog').expect(401);
        });

        it('should return 403 if KYC is not approved', async () => {
            // Create customer with pending KYC
            const pendingPassword = await bcrypt.hash('password123', 10);
            const pendingCustomer = await prisma.customer.create({
                data: {
                    name: 'Pending Customer',
                    email: `pending-${Date.now()}@example.com`,
                    password: pendingPassword,
                    type: 'retailer',
                    kyc_status: 'pending',
                    is_active: true,
                },
            });

            const loginResult = await authService.login({
                ...pendingCustomer,
                id: pendingCustomer.id.toString(),
            });
            const pendingToken =
                loginResult && 'access_token' in loginResult
                    ? loginResult.access_token
                    : null;

            await request(app.getHttpServer())
                .get('/api/catalog')
                .set('Authorization', `Bearer ${pendingToken}`)
                .expect(403);

            // Cleanup
            await prisma.customer.delete({
                where: { id: pendingCustomer.id },
            });
        });

        it('should paginate products', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/catalog')
                .query({ page: 1, per_page: 5 })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.products.current_page).toBe(1);
            expect(response.body.products.data.length).toBeLessThanOrEqual(12); // per_page is fixed at 12
        });
    });

    describe('GET /api/catalog/:id', () => {
        it('should return product details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/catalog/${testProduct.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('product');
            expect(response.body).toHaveProperty('configurationOptions');
            expect(response.body.product.id).toBe(testProduct.id.toString());
            expect(response.body.product.name).toBe('Test Product');
            expect(response.body.product).toHaveProperty('variants');
            expect(response.body.product).toHaveProperty('media');
        });

        it('should return 404 for non-existent product', async () => {
            await request(app.getHttpServer())
                .get('/api/catalog/999999999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/catalog/${testProduct.id}`)
                .expect(401);
        });

        it('should include configuration options', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/catalog/${testProduct.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.configurationOptions).toBeInstanceOf(Array);
            if (response.body.configurationOptions.length > 0) {
                const option = response.body.configurationOptions[0];
                expect(option).toHaveProperty('variant_id');
                expect(option).toHaveProperty('label');
                expect(option).toHaveProperty('price_total');
                expect(option).toHaveProperty('price_breakup');
            }
        });
    });

    describe('POST /api/catalog/:id/calculate-price', () => {
        it('should calculate price for a product', async () => {
            const variant = await prisma.product_variants.findFirst({
                where: { product_id: testProduct.id },
            });

            const response = await request(app.getHttpServer())
                .post(`/api/catalog/${testProduct.id}/calculate-price`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    variant_id: variant?.id.toString(),
                    quantity: 1,
                })
                .expect(201);

            expect(response.body).toHaveProperty('metal');
            expect(response.body).toHaveProperty('diamond');
            expect(response.body).toHaveProperty('making');
            expect(response.body).toHaveProperty('subtotal');
            expect(response.body).toHaveProperty('total');
        });

        it('should calculate price with quantity', async () => {
            const variant = await prisma.product_variants.findFirst({
                where: { product_id: testProduct.id },
            });

            const response = await request(app.getHttpServer())
                .post(`/api/catalog/${testProduct.id}/calculate-price`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    variant_id: variant?.id.toString(),
                    quantity: 2,
                })
                .expect(201);

            expect(response.body).toHaveProperty('total');
            expect(typeof response.body.total).toBe('number');
        });

        it('should return 404 for non-existent product', async () => {
            await request(app.getHttpServer())
                .post('/api/catalog/999999999/calculate-price')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: 1 })
                .expect(404);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .post(`/api/catalog/${testProduct.id}/calculate-price`)
                .send({ quantity: 1 })
                .expect(401);
        });
    });
});
