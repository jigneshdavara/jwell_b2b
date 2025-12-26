import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('Frontend Cart (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let authToken: string;
    let testCustomer: any;
    let testProduct: any;
    let testBrand: any;
    let testCategory: any;
    let testVariant: any;

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
                email: `cart-test-${Date.now()}@example.com`,
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
                is_default: true,
                inventory_quantity: 10,
            },
        });
    });

    afterAll(async () => {
        // Cleanup test data
        if (testVariant) {
            await prisma.product_variants.delete({
                where: { id: testVariant.id },
            });
        }
        if (testProduct) {
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
            // Cleanup cart items
            await prisma.cart_items.deleteMany({
                where: {
                    carts: {
                        user_id: testCustomer.id,
                    },
                },
            });
            await prisma.carts.deleteMany({
                where: { user_id: testCustomer.id },
            });
            await prisma.customer.delete({
                where: { id: testCustomer.id },
            });
        }
        if (app) {
            await app.close();
        }
    });

    describe('GET /api/cart', () => {
        it('should return empty cart initially', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('cart');
            expect(response.body.cart).toHaveProperty('items');
            expect(response.body.cart).toHaveProperty('subtotal');
            expect(response.body.cart).toHaveProperty('tax');
            expect(response.body.cart).toHaveProperty('total');
            expect(response.body.cart.items).toBeInstanceOf(Array);
            expect(response.body.cart.items.length).toBe(0);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer()).get('/api/cart').expect(401);
        });
    });

    describe('POST /api/cart/items', () => {
        it('should add item to cart', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: testProduct.id.toString(),
                    quantity: 1,
                })
                .expect(201);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain(
                'added to your quotation list',
            );
        });

        it('should add item with variant to cart', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: testProduct.id.toString(),
                    product_variant_id: testVariant.id.toString(),
                    quantity: 2,
                })
                .expect(201);

            expect(response.body.message).toContain(
                'added to your quotation list',
            );
        });

        it('should increment quantity for duplicate items', async () => {
            // Add same item again
            await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: testProduct.id.toString(),
                    product_variant_id: testVariant.id.toString(),
                    quantity: 1,
                })
                .expect(201);

            // Check cart - quantity should be increased
            const cartResponse = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const matchingItem = cartResponse.body.cart.items.find(
                (item: any) =>
                    item.product_id === testProduct.id.toString() &&
                    item.product_variant_id === testVariant.id.toString(),
            );

            expect(matchingItem).toBeDefined();
            expect(matchingItem.quantity).toBeGreaterThanOrEqual(2);
        });

        it('should return 404 for non-existent product', async () => {
            await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: '999999999',
                })
                .expect(404);
        });

        it('should return 404 for invalid variant', async () => {
            await request(app.getHttpServer())
                .post('/api/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: testProduct.id.toString(),
                    product_variant_id: '999999999',
                })
                .expect(404);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .post('/api/cart/items')
                .send({
                    product_id: testProduct.id.toString(),
                })
                .expect(401);
        });
    });

    describe('GET /api/cart (after adding items)', () => {
        it('should return cart with items', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.cart.items).toBeInstanceOf(Array);
            expect(response.body.cart.items.length).toBeGreaterThan(0);

            const item = response.body.cart.items[0];
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('product_id');
            expect(item).toHaveProperty('sku');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('quantity');
            expect(item).toHaveProperty('unit_total');
            expect(item).toHaveProperty('line_total');
            expect(item).toHaveProperty('price_breakdown');
        });
    });

    describe('PATCH /api/cart/items/:id', () => {
        let cartItemId: string;

        beforeEach(async () => {
            // Ensure we have a cart item
            const cart = await prisma.carts.findFirst({
                where: { user_id: testCustomer.id, status: 'active' },
            });

            if (!cart) {
                await prisma.carts.create({
                    data: {
                        user_id: testCustomer.id,
                        status: 'active',
                        currency: 'INR',
                    },
                });
            }

            const cartRecord = await prisma.carts.findFirst({
                where: { user_id: testCustomer.id, status: 'active' },
            });

            const existingItem = await prisma.cart_items.findFirst({
                where: {
                    cart_id: cartRecord!.id,
                    product_id: testProduct.id,
                },
            });

            if (existingItem) {
                cartItemId = existingItem.id.toString();
            } else {
                const newItem = await prisma.cart_items.create({
                    data: {
                        cart_id: cartRecord!.id,
                        product_id: testProduct.id,
                        product_variant_id: testVariant.id,
                        quantity: 1,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
                cartItemId = newItem.id.toString();
            }
        });

        it('should update item quantity', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: 3 })
                .expect(200);

            expect(response.body.message).toBe('Updated quotation entry.');

            // Verify quantity was updated
            const cartResponse = await request(app.getHttpServer())
                .get('/api/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const item = cartResponse.body.cart.items.find(
                (item: any) => item.id === cartItemId,
            );
            expect(item.quantity).toBe(3);
        });

        it('should update item configuration', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    configuration: {
                        notes: 'Test notes',
                    },
                })
                .expect(200);

            expect(response.body.message).toBe('Updated quotation entry.');
        });

        it('should reject quantity exceeding inventory', async () => {
            // Set variant inventory to 5
            await prisma.product_variants.update({
                where: { id: testVariant.id },
                data: { inventory_quantity: 5 },
            });

            await request(app.getHttpServer())
                .patch(`/api/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: 10 })
                .expect(400);

            // Reset inventory
            await prisma.product_variants.update({
                where: { id: testVariant.id },
                data: { inventory_quantity: 10 },
            });
        });

        it('should return 404 for non-existent item', async () => {
            await request(app.getHttpServer())
                .patch('/api/cart/items/999999999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: 2 })
                .expect(404);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .patch(`/api/cart/items/${cartItemId}`)
                .send({ quantity: 2 })
                .expect(401);
        });
    });

    describe('DELETE /api/cart/items/:id', () => {
        let cartItemId: string;

        beforeEach(async () => {
            // Ensure we have a cart item
            const cart = await prisma.carts.findFirst({
                where: { user_id: testCustomer.id, status: 'active' },
            });

            if (!cart) {
                await prisma.carts.create({
                    data: {
                        user_id: testCustomer.id,
                        status: 'active',
                        currency: 'INR',
                    },
                });
            }

            const cartRecord = await prisma.carts.findFirst({
                where: { user_id: testCustomer.id, status: 'active' },
            });

            const existingItem = await prisma.cart_items.findFirst({
                where: {
                    cart_id: cartRecord!.id,
                    product_id: testProduct.id,
                },
            });

            if (existingItem) {
                cartItemId = existingItem.id.toString();
            } else {
                const newItem = await prisma.cart_items.create({
                    data: {
                        cart_id: cartRecord!.id,
                        product_id: testProduct.id,
                        quantity: 1,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
                cartItemId = newItem.id.toString();
            }
        });

        it('should remove item from cart', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.message).toBe(
                'Removed from your purchase list.',
            );
        });

        it('should return 404 for non-existent item', async () => {
            await request(app.getHttpServer())
                .delete('/api/cart/items/999999999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/api/cart/items/${cartItemId}`)
                .expect(401);
        });
    });
});
