import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('Frontend Wishlist (e2e)', () => {
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
                email: `wishlist-test-${Date.now()}@example.com`,
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
            // Cleanup wishlist and cart items
            await prisma.wishlist_items.deleteMany({
                where: {
                    wishlists: {
                        customer_id: testCustomer.id,
                    },
                },
            });
            await prisma.wishlists.deleteMany({
                where: { customer_id: testCustomer.id },
            });
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

    describe('GET /api/wishlist', () => {
        it('should return empty wishlist initially', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('items');
            expect(response.body.items).toBeInstanceOf(Array);
            expect(response.body.items.length).toBe(0);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer()).get('/api/wishlist').expect(401);
        });
    });

    describe('POST /api/wishlist/items', () => {
        it('should add item to wishlist', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/wishlist/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: testProduct.id.toString(),
                })
                .expect(201);

            expect(response.body).toHaveProperty('success');
            expect(response.body.success).toBe(true);
        });

        it('should add item with variant to wishlist', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/wishlist/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: testProduct.id.toString(),
                    product_variant_id: testVariant.id.toString(),
                })
                .expect(201);

            expect(response.body).toHaveProperty('success');
            expect(response.body.success).toBe(true);
        });

        it('should not add duplicate item', async () => {
            // Add same item again
            await request(app.getHttpServer())
                .post('/api/wishlist/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: testProduct.id.toString(),
                    product_variant_id: testVariant.id.toString(),
                })
                .expect(201);

            // Check wishlist - should still have only one item
            const wishlistResponse = await request(app.getHttpServer())
                .get('/api/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const matchingItems = wishlistResponse.body.items.filter(
                (item: any) =>
                    item.product_id === testProduct.id.toString() &&
                    item.variant_id === testVariant.id.toString(),
            );
            expect(matchingItems.length).toBe(1);
        });

        it('should return 404 for non-existent product', async () => {
            await request(app.getHttpServer())
                .post('/api/wishlist/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: '999999999',
                })
                .expect(404);
        });

        it('should return 404 for invalid variant', async () => {
            await request(app.getHttpServer())
                .post('/api/wishlist/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_id: testProduct.id.toString(),
                    product_variant_id: '999999999',
                })
                .expect(404);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .post('/api/wishlist/items')
                .send({
                    product_id: testProduct.id.toString(),
                })
                .expect(401);
        });
    });

    describe('GET /api/wishlist (after adding items)', () => {
        it('should return wishlist items', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.items).toBeInstanceOf(Array);
            expect(response.body.items.length).toBeGreaterThan(0);

            const item = response.body.items[0];
            expect(item).toHaveProperty('id');
            expect(item).toHaveProperty('product_id');
            expect(item).toHaveProperty('sku');
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('thumbnail');
        });
    });

    describe('DELETE /api/wishlist/items/:id', () => {
        let wishlistItemId: string;

        beforeAll(async () => {
            // Get wishlist item ID
            const wishlist = await prisma.wishlists.findUnique({
                where: { customer_id: testCustomer.id },
                include: { wishlist_items: true },
            });

            if (wishlist && wishlist.wishlist_items.length > 0) {
                wishlistItemId = wishlist.wishlist_items[0].id.toString();
            }
        });

        it('should remove item from wishlist', async () => {
            if (!wishlistItemId) {
                // Ensure wishlist exists
                let wishlist = await prisma.wishlists.findUnique({
                    where: { customer_id: testCustomer.id },
                });

                if (!wishlist) {
                    wishlist = await prisma.wishlists.create({
                        data: {
                            customer_id: testCustomer.id,
                            name: 'Primary',
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                    });
                }

                // Add an item
                const item = await prisma.wishlist_items.create({
                    data: {
                        wishlist_id: wishlist.id,
                        product_id: testProduct.id,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });

                wishlistItemId = item.id.toString();
            }

            const response = await request(app.getHttpServer())
                .delete(`/api/wishlist/items/${wishlistItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return 404 for non-existent item', async () => {
            await request(app.getHttpServer())
                .delete('/api/wishlist/items/999999999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .delete('/api/wishlist/items/1')
                .expect(401);
        });
    });

    describe('POST /api/wishlist/items/:id/move-to-cart', () => {
        let wishlistItemId: string;

        beforeEach(async () => {
            // Ensure we have a wishlist item
            const wishlist = await prisma.wishlists.findFirst({
                where: { customer_id: testCustomer.id },
            });

            if (!wishlist) {
                await prisma.wishlists.create({
                    data: {
                        customer_id: testCustomer.id,
                        name: 'Primary',
                    },
                });
            }

            const wishlistRecord = await prisma.wishlists.findFirst({
                where: { customer_id: testCustomer.id },
            });

            const existingItem = await prisma.wishlist_items.findFirst({
                where: {
                    wishlist_id: wishlistRecord!.id,
                    product_id: testProduct.id,
                },
            });

            if (existingItem) {
                wishlistItemId = existingItem.id.toString();
            } else {
                const newItem = await prisma.wishlist_items.create({
                    data: {
                        wishlist_id: wishlistRecord!.id,
                        product_id: testProduct.id,
                        product_variant_id: testVariant.id,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
                wishlistItemId = newItem.id.toString();
            }
        });

        it('should move item from wishlist to cart', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/wishlist/items/${wishlistItemId}/move-to-cart`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: 1 })
                .expect(200);

            expect(response.body.success).toBe(true);

            const wishlistResponse = await request(app.getHttpServer())
                .get('/api/wishlist')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const itemExists = wishlistResponse.body.items.some(
                (item: any) => item.id === wishlistItemId,
            );
            expect(itemExists).toBe(false);
        });

        it('should return 404 for non-existent item', async () => {
            await request(app.getHttpServer())
                .post('/api/wishlist/items/999999999/move-to-cart')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: 1 })
                .expect(404);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .post('/api/wishlist/items/1/move-to-cart')
                .send({ quantity: 1 })
                .expect(401);
        });
    });

    describe('DELETE /api/wishlist/product/:id', () => {
        beforeEach(async () => {
            // Ensure product is in wishlist
            let wishlist = await prisma.wishlists.findFirst({
                where: { customer_id: testCustomer.id },
            });

            if (!wishlist) {
                wishlist = await prisma.wishlists.create({
                    data: {
                        customer_id: testCustomer.id,
                        name: 'Primary',
                    },
                });
            }

            const existingItem = await prisma.wishlist_items.findFirst({
                where: {
                    wishlist_id: wishlist.id,
                    product_id: testProduct.id,
                },
            });

            if (!existingItem) {
                await prisma.wishlist_items.create({
                    data: {
                        wishlist_id: wishlist.id,
                        product_id: testProduct.id,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }
        });

        it('should remove item by product', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/wishlist/product/${testProduct.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should remove item by product and variant', async () => {
            // Add item with variant first (only if it doesn't exist)
            const wishlist = await prisma.wishlists.findFirst({
                where: { customer_id: testCustomer.id },
            });

            const existingItem = await prisma.wishlist_items.findFirst({
                where: {
                    wishlist_id: wishlist!.id,
                    product_id: testProduct.id,
                    product_variant_id: testVariant.id,
                },
            });

            if (!existingItem) {
                await prisma.wishlist_items.create({
                    data: {
                        wishlist_id: wishlist!.id,
                        product_id: testProduct.id,
                        product_variant_id: testVariant.id,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }

            const response = await request(app.getHttpServer())
                .delete(`/api/wishlist/product/${testProduct.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    product_variant_id: testVariant.id.toString(),
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should return 404 for non-existent product', async () => {
            await request(app.getHttpServer())
                .delete('/api/wishlist/product/999999999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .delete(`/api/wishlist/product/${testProduct.id}`)
                .expect(401);
        });
    });
});
