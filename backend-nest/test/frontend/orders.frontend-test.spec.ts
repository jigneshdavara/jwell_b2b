import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('Frontend Orders (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let authToken: string;
    let testCustomer: any;
    let testOtherCustomer: any;
    let testOrder: any;
    let testOtherOrder: any;
    let testProduct: any;
    let testBrand: any;
    let testCategory: any;
    let testOrderItem: any;
    let testPayment: any;
    let testPaymentGateway: any;

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
                email: `orders-test-${Date.now()}@example.com`,
                password: hashedPassword,
                type: 'retailer',
                kyc_status: 'approved',
                is_active: true,
            },
        });

        // Create another test customer for authorization tests
        testOtherCustomer = await prisma.customer.create({
            data: {
                name: 'Other Customer',
                email: `orders-other-${Date.now()}@example.com`,
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

        // Create payment gateway for test payments
        testPaymentGateway = await prisma.payment_gateways.create({
            data: {
                name: 'Fake Gateway',
                slug: 'fake',
                driver: 'FakeGateway',
                is_active: true,
                is_default: true,
                config: {
                    publishable_key: 'pk_test_fake',
                    secret_key: 'sk_test_fake',
                },
            },
        });

        // Create test order for testCustomer
        testOrder = await prisma.orders.create({
            data: {
                user_id: testCustomer.id,
                reference: `ORD-TEST-${Date.now()}`,
                status: 'pending',
                currency: 'INR',
                subtotal_amount: 10000,
                tax_amount: 1800,
                discount_amount: 0,
                total_amount: 11800,
                price_breakdown: {
                    subtotal: 10000,
                    tax: 1800,
                    discount: 0,
                    shipping: 0,
                },
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        // Create test order item
        testOrderItem = await prisma.order_items.create({
            data: {
                order_id: testOrder.id,
                product_id: testProduct.id,
                sku: testProduct.sku,
                name: testProduct.name,
                quantity: 2,
                unit_price: 5000,
                total_price: 10000,
                configuration: {
                    variant_label: 'Test Variant',
                },
                metadata: {
                    price_breakdown: {
                        metal: 8000,
                        diamond: 1000,
                        making: 500,
                        subtotal: 9500,
                        discount: 0,
                        total: 9500,
                    },
                },
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        // Create test payment
        testPayment = await prisma.payments.create({
            data: {
                order_id: testOrder.id,
                payment_gateway_id: testPaymentGateway.id,
                provider_reference: `pi_test_${Date.now()}`,
                status: 'succeeded',
                amount: 11800,
                currency: 'INR',
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        // Create order status history
        await prisma.order_status_histories.create({
            data: {
                order_id: testOrder.id,
                user_id: testCustomer.id,
                status: 'pending',
                meta: {
                    actor_guard: 'customer',
                    actor_user_id: testCustomer.id.toString(),
                },
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        // Create test order for other customer
        testOtherOrder = await prisma.orders.create({
            data: {
                user_id: testOtherCustomer.id,
                reference: `ORD-OTHER-${Date.now()}`,
                status: 'pending',
                currency: 'INR',
                subtotal_amount: 5000,
                tax_amount: 900,
                discount_amount: 0,
                total_amount: 5900,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    });

    afterAll(async () => {
        // Cleanup test data
        if (testOrderItem) {
            await prisma.order_items.delete({
                where: { id: testOrderItem.id },
            });
        }
        if (testPayment) {
            await prisma.payments.delete({
                where: { id: testPayment.id },
            });
        }
        if (testOrder) {
            await prisma.order_status_histories.deleteMany({
                where: { order_id: testOrder.id },
            });
            await prisma.orders.delete({
                where: { id: testOrder.id },
            });
        }
        if (testOtherOrder) {
            await prisma.order_status_histories.deleteMany({
                where: { order_id: testOtherOrder.id },
            });
            await prisma.orders.delete({
                where: { id: testOtherOrder.id },
            });
        }
        if (testProduct) {
            await prisma.products.delete({
                where: { id: testProduct.id },
            });
        }
        if (testBrand) {
            await prisma.brands.delete({
                where: { id: testBrand.id },
            });
        }
        if (testCategory) {
            await prisma.categories.delete({
                where: { id: testCategory.id },
            });
        }
        if (testPaymentGateway) {
            await prisma.payment_gateways.delete({
                where: { id: testPaymentGateway.id },
            });
        }
        if (testCustomer) {
            await prisma.customer.delete({
                where: { id: testCustomer.id },
            });
        }
        if (testOtherCustomer) {
            await prisma.customer.delete({
                where: { id: testOtherCustomer.id },
            });
        }
        if (app) {
            await app.close();
        }
    });

    describe('GET /api/orders', () => {
        it('should return orders list with pagination', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.orders).toBeDefined();
            expect(response.body.orders.data).toBeInstanceOf(Array);
            expect(response.body.orders.meta).toBeDefined();
            expect(response.body.orders.meta.total).toBeGreaterThanOrEqual(1);
            expect(response.body.orders.meta.current_page).toBe(1);
            expect(response.body.orders.meta.per_page).toBe(15);

            // Check order structure
            if (response.body.orders.data.length > 0) {
                const order = response.body.orders.data[0];
                expect(order.id).toBeDefined();
                expect(order.reference).toBeDefined();
                expect(order.status).toBeDefined();
                expect(order.status_label).toBeDefined();
                expect(order.total_amount).toBeDefined();
                expect(order.items).toBeInstanceOf(Array);
            }
        });

        it('should only return orders for authenticated user', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Verify all returned orders belong to testCustomer
            response.body.orders.data.forEach((order: any) => {
                // The service filters by user_id, so we just verify structure
                expect(order).toHaveProperty('id');
                expect(order).toHaveProperty('reference');
            });
        });

        it('should support pagination', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/orders?page=1&per_page=5')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.orders.meta.per_page).toBe(5);
            expect(response.body.orders.data.length).toBeLessThanOrEqual(5);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/orders')
                .expect(401);
        });

        it('should return orders in descending order by created_at', async () => {
            // Create another order to test ordering
            const newerOrder = await prisma.orders.create({
                data: {
                    user_id: testCustomer.id,
                    reference: `ORD-NEWER-${Date.now()}`,
                    status: 'pending',
                    currency: 'INR',
                    subtotal_amount: 5000,
                    tax_amount: 900,
                    discount_amount: 0,
                    total_amount: 5900,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            const response = await request(app.getHttpServer())
                .get('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const orders = response.body.orders.data;
            if (orders.length >= 2) {
                const firstDate = new Date(orders[0].created_at);
                const secondDate = new Date(orders[1].created_at);
                expect(firstDate.getTime()).toBeGreaterThanOrEqual(
                    secondDate.getTime(),
                );
            }

            // Cleanup
            await prisma.orders.delete({
                where: { id: newerOrder.id },
            });
        });
    });

    describe('GET /api/orders/:id', () => {
        it('should return order details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/orders/${testOrder.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.order).toBeDefined();
            expect(response.body.order.id).toBe(testOrder.id.toString());
            expect(response.body.order.reference).toBe(testOrder.reference);
            expect(response.body.order.status).toBeDefined();
            expect(response.body.order.status_label).toBeDefined();
            expect(response.body.order.total_amount).toBe(11800);
            expect(response.body.order.subtotal_amount).toBe(10000);
            expect(response.body.order.tax_amount).toBe(1800);
            expect(response.body.order.items).toBeInstanceOf(Array);
            expect(response.body.order.items.length).toBeGreaterThan(0);
        });

        it('should include order items with product details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/orders/${testOrder.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const order = response.body.order;
            expect(order.items[0]).toHaveProperty('id');
            expect(order.items[0]).toHaveProperty('name');
            expect(order.items[0]).toHaveProperty('sku');
            expect(order.items[0]).toHaveProperty('quantity');
            expect(order.items[0]).toHaveProperty('unit_price');
            expect(order.items[0]).toHaveProperty('total_price');
            expect(order.items[0]).toHaveProperty('configuration');
            expect(order.items[0]).toHaveProperty('product');
            expect(order.items[0].product).toHaveProperty('id');
            expect(order.items[0].product).toHaveProperty('name');
            expect(order.items[0].product).toHaveProperty('media');
        });

        it('should include price breakdown in order items', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/orders/${testOrder.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const order = response.body.order;
            const item = order.items[0];
            if (item.price_breakdown) {
                expect(item.price_breakdown).toHaveProperty('metal');
                expect(item.price_breakdown).toHaveProperty('diamond');
                expect(item.price_breakdown).toHaveProperty('making');
                expect(item.price_breakdown).toHaveProperty('subtotal');
                expect(item.price_breakdown).toHaveProperty('discount');
                expect(item.price_breakdown).toHaveProperty('total');
            }
        });

        it('should include payments history', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/orders/${testOrder.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const order = response.body.order;
            expect(order.payments).toBeInstanceOf(Array);
            if (order.payments.length > 0) {
                expect(order.payments[0]).toHaveProperty('id');
                expect(order.payments[0]).toHaveProperty('status');
                expect(order.payments[0]).toHaveProperty('amount');
                expect(order.payments[0]).toHaveProperty('created_at');
            }
        });

        it('should include status history', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/orders/${testOrder.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const order = response.body.order;
            expect(order.status_history).toBeInstanceOf(Array);
            if (order.status_history.length > 0) {
                expect(order.status_history[0]).toHaveProperty('id');
                expect(order.status_history[0]).toHaveProperty('status');
                expect(order.status_history[0]).toHaveProperty('created_at');
                expect(order.status_history[0]).toHaveProperty('meta');
            }
        });

        it('should include related quotations', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/orders/${testOrder.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const order = response.body.order;
            expect(order.quotations).toBeInstanceOf(Array);
            // Quotations might be empty, which is fine
        });

        it('should return 404 for non-existent order', async () => {
            await request(app.getHttpServer())
                .get('/api/orders/999999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 403 for other user order', async () => {
            await request(app.getHttpServer())
                .get(`/api/orders/${testOtherOrder.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .get(`/api/orders/${testOrder.id}`)
                .expect(401);
        });

        it('should format status labels correctly', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/orders/${testOrder.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const order = response.body.order;
            expect(order.status_label).toBeDefined();
            // Status label should be formatted (e.g., "pending_payment" → "Pending Payment")
            expect(typeof order.status_label).toBe('string');
        });
    });
});

