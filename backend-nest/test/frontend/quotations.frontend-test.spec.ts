import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

describe('Frontend Quotations (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let authToken: string;
    let testCustomer: any;
    let testProduct: any;
    let testBrand: any;
    let testCategory: any;
    let testVariant: any;
    let testQuotation: any;

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

        prisma = moduleFixture.get<PrismaService>(PrismaService);
        authService = moduleFixture.get<AuthService>(AuthService);

        // Create test customer with approved KYC
        const hashedPassword = await bcrypt.hash('password123', 10);
        testCustomer = await prisma.customer.create({
            data: {
                name: 'Test Customer',
                email: `quotation-test-${Date.now()}@example.com`,
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

        // Create variant
        testVariant = await prisma.product_variants.create({
            data: {
                product_id: testProduct.id,
                label: 'Default Variant',
                inventory_quantity: 10,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    });

    afterAll(async () => {
        // Cleanup
        if (testQuotation) {
            await prisma.quotation_messages.deleteMany({
                where: { quotation_id: testQuotation.id },
            });
            await prisma.quotations.delete({
                where: { id: testQuotation.id },
            });
        }

        await prisma.cart_items.deleteMany({
            where: {
                cart_id: {
                    in: (
                        await prisma.carts.findMany({
                            where: { user_id: testCustomer.id },
                        })
                    ).map((c) => c.id),
                },
            },
        });
        await prisma.carts.deleteMany({
            where: { user_id: testCustomer.id },
        });
        await prisma.quotations.deleteMany({
            where: { user_id: testCustomer.id },
        });
        await prisma.product_variants.deleteMany({
            where: { product_id: testProduct.id },
        });
        await prisma.products.delete({
            where: { id: testProduct.id },
        });
        await prisma.categories.delete({
            where: { id: testCategory.id },
        });
        await prisma.brands.delete({
            where: { id: testBrand.id },
        });
        await prisma.customer.delete({
            where: { id: testCustomer.id },
        });

        await app.close();
    });

    describe('GET /api/quotations', () => {
        it('should return empty list initially', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/quotations')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Response might be an array or object with quotations property
            const quotations = Array.isArray(response.body)
                ? response.body
                : response.body.quotations;
            expect(quotations).toBeInstanceOf(Array);
            expect(quotations.length).toBe(0);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/quotations')
                .expect(401);
        });
    });

    describe('POST /api/quotations', () => {
        it('should create quotation from product', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/quotations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: Number(testProduct.id),
                    product_variant_id: Number(testVariant.id),
                    quantity: 2,
                    notes: 'Test quotation notes',
                })
                .expect(201);

            expect(response.body.id).toBeDefined();
            expect(response.body.product_id).toBeDefined();
            expect(response.body.quantity).toBe(2);

            // Store for later tests
            testQuotation = await prisma.quotations.findUnique({
                where: { id: BigInt(response.body.id) },
            });
        });

        it('should create quotation without variant', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/quotations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: Number(testProduct.id),
                    quantity: 1,
                })
                .expect(201);

            expect(response.body.id).toBeDefined();

            // Cleanup
            await prisma.quotations.delete({
                where: { id: BigInt(response.body.id) },
            });
        });

        it('should reject quantity exceeding inventory', async () => {
            await request(app.getHttpServer())
                .post('/api/quotations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: Number(testProduct.id),
                    product_variant_id: Number(testVariant.id),
                    quantity: 20, // More than available (10)
                })
                .expect(400);
        });

        it('should reject out of stock variant', async () => {
            // Set inventory to 0
            await prisma.product_variants.update({
                where: { id: testVariant.id },
                data: { inventory_quantity: 0 },
            });

            await request(app.getHttpServer())
                .post('/api/quotations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: Number(testProduct.id),
                    product_variant_id: Number(testVariant.id),
                    quantity: 1,
                })
                .expect(400);

            // Reset inventory
            await prisma.product_variants.update({
                where: { id: testVariant.id },
                data: { inventory_quantity: 10 },
            });
        });

        it('should return 404 for non-existent product', async () => {
            await request(app.getHttpServer())
                .post('/api/quotations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: 999999,
                    quantity: 1,
                })
                .expect(404);
        });

        it('should return 404 for invalid variant', async () => {
            await request(app.getHttpServer())
                .post('/api/quotations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: Number(testProduct.id),
                    product_variant_id: 999999,
                    quantity: 1,
                })
                .expect(404);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .post('/api/quotations')
                .send({
                    product_id: testProduct.id.toString(),
                    quantity: 1,
                })
                .expect(401);
        });
    });

    describe('GET /api/quotations/:id', () => {
        it('should return quotation details', async () => {
            if (!testQuotation) {
                // Create one if not exists
                testQuotation = await prisma.quotations.create({
                    data: {
                        user_id: testCustomer.id,
                        product_id: testProduct.id,
                        product_variant_id: testVariant.id,
                        status: 'pending',
                        quantity: 1,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }

            const response = await request(app.getHttpServer())
                .get(`/api/quotations/${testQuotation.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.quotation).toBeDefined();
            expect(response.body.quotation.id).toBe(
                testQuotation.id.toString(),
            );
            expect(response.body.quotation.product).toBeDefined();
        });

        it('should return 404 for non-existent quotation', async () => {
            await request(app.getHttpServer())
                .get('/api/quotations/999999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 403 for other user quotation', async () => {
            // Create another customer
            const otherCustomer = await prisma.customer.create({
                data: {
                    name: 'Other Customer',
                    email: `other-${Date.now()}@example.com`,
                    password: await bcrypt.hash('password123', 10),
                    type: 'retailer',
                    kyc_status: 'approved',
                    is_active: true,
                },
            });

            // Create quotation for other customer
            const otherQuotation = await prisma.quotations.create({
                data: {
                    user_id: otherCustomer.id,
                    product_id: testProduct.id,
                    status: 'pending',
                    quantity: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            await request(app.getHttpServer())
                .get(`/api/quotations/${otherQuotation.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            // Cleanup
            await prisma.quotations.delete({
                where: { id: otherQuotation.id },
            });
            await prisma.customer.delete({
                where: { id: otherCustomer.id },
            });
        });
    });

    describe('POST /api/quotations/from-cart', () => {
        it('should create quotations from cart', async () => {
            // Create cart with items
            let cart = await prisma.carts.findFirst({
                where: { user_id: testCustomer.id, status: 'active' },
            });

            if (!cart) {
                cart = await prisma.carts.create({
                    data: {
                        user_id: testCustomer.id,
                        status: 'active',
                        currency: 'INR',
                    },
                });
            }

            await prisma.cart_items.create({
                data: {
                    cart_id: cart.id,
                    product_id: testProduct.id,
                    product_variant_id: testVariant.id,
                    quantity: 2,
                    configuration: { notes: 'Cart notes' },
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .post('/api/quotations/from-cart')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(201);

            expect(response.body.message).toBeDefined();
            expect(response.body.quotations).toBeInstanceOf(Array);
            expect(response.body.quotations.length).toBeGreaterThan(0);

            // Verify cart is cleared
            const cartItems = await prisma.cart_items.findMany({
                where: { cart_id: cart.id },
            });
            expect(cartItems.length).toBe(0);
        });

        it('should return 400 for empty cart', async () => {
            await request(app.getHttpServer())
                .post('/api/quotations/from-cart')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });

    describe('POST /api/quotations/:id/messages', () => {
        it('should create message for quotation', async () => {
            if (!testQuotation) {
                testQuotation = await prisma.quotations.create({
                    data: {
                        user_id: testCustomer.id,
                        product_id: testProduct.id,
                        status: 'pending',
                        quantity: 1,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }

            const response = await request(app.getHttpServer())
                .post(`/api/quotations/${testQuotation.id}/messages`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'Test message',
                })
                .expect(201);

            // Response should be an object with message property
            console.log(
                'Response body:',
                JSON.stringify(response.body, null, 2),
            );
            expect(response.body).toBeDefined();
            expect(response.body.success).toBe(true);
        });

        it('should return 403 for other user quotation', async () => {
            const otherCustomer = await prisma.customer.create({
                data: {
                    name: 'Other Customer',
                    email: `other2-${Date.now()}@example.com`,
                    password: await bcrypt.hash('password123', 10),
                    type: 'retailer',
                    kyc_status: 'approved',
                    is_active: true,
                },
            });

            const otherQuotation = await prisma.quotations.create({
                data: {
                    user_id: otherCustomer.id,
                    product_id: testProduct.id,
                    status: 'pending',
                    quantity: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            await request(app.getHttpServer())
                .post(`/api/quotations/${otherQuotation.id}/messages`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'Test' })
                .expect(403);

            // Cleanup
            await prisma.quotations.delete({
                where: { id: otherQuotation.id },
            });
            await prisma.customer.delete({
                where: { id: otherCustomer.id },
            });
        });
    });

    describe('POST /api/quotations/:id/confirm', () => {
        it('should confirm quotation with pending_customer_confirmation status', async () => {
            const quotation = await prisma.quotations.create({
                data: {
                    user_id: testCustomer.id,
                    quotation_group_id: randomUUID(),
                    product_id: testProduct.id,
                    status: 'pending_customer_confirmation',
                    quantity: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/api/quotations/${quotation.id}/confirm`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(201);

            expect(response.body.message).toBeDefined();

            // Verify status updated
            const updated = await prisma.quotations.findUnique({
                where: { id: quotation.id },
            });
            expect(updated?.status).toBe('customer_confirmed');

            // Cleanup
            await prisma.quotation_messages.deleteMany({
                where: { quotation_id: quotation.id },
            });
            await prisma.quotations.delete({
                where: { id: quotation.id },
            });
        });

        it('should return 400 if no confirmation required', async () => {
            const quotation = await prisma.quotations.create({
                data: {
                    user_id: testCustomer.id,
                    product_id: testProduct.id,
                    status: 'pending',
                    quantity: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            await request(app.getHttpServer())
                .post(`/api/quotations/${quotation.id}/confirm`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            // Cleanup
            await prisma.quotations.delete({
                where: { id: quotation.id },
            });
        });
    });

    describe('POST /api/quotations/:id/decline', () => {
        it('should decline quotation with pending_customer_confirmation status', async () => {
            const quotation = await prisma.quotations.create({
                data: {
                    user_id: testCustomer.id,
                    quotation_group_id: randomUUID(),
                    product_id: testProduct.id,
                    status: 'pending_customer_confirmation',
                    quantity: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/api/quotations/${quotation.id}/decline`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(201);

            expect(response.body.message).toBe('Quotation declined.');

            // Verify status updated
            const updated = await prisma.quotations.findUnique({
                where: { id: quotation.id },
            });
            expect(updated?.status).toBe('customer_declined');

            // Cleanup
            await prisma.quotation_messages.deleteMany({
                where: { quotation_id: quotation.id },
            });
            await prisma.quotations.delete({
                where: { id: quotation.id },
            });
        });
    });

    describe('DELETE /api/quotations/:id', () => {
        it('should delete pending quotation', async () => {
            const quotation = await prisma.quotations.create({
                data: {
                    user_id: testCustomer.id,
                    product_id: testProduct.id,
                    status: 'pending',
                    quantity: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            const quotationId = quotation.id.toString();

            const response = await request(app.getHttpServer())
                .delete(`/api/quotations/${quotationId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(
                true,
            );

            // Verify deleted
            const deleted = await prisma.quotations.findUnique({
                where: { id: quotation.id },
            });
            expect(deleted).toBeNull();
        });

        it('should return 400 for non-pending quotation', async () => {
            const quotation = await prisma.quotations.create({
                data: {
                    user_id: testCustomer.id,
                    product_id: testProduct.id,
                    status: 'approved',
                    quantity: 1,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            const quotationId = quotation.id.toString();

            await request(app.getHttpServer())
                .delete(`/api/quotations/${quotationId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            // Cleanup
            await prisma.quotations.delete({
                where: { id: quotation.id },
            });
        });
    });
});
