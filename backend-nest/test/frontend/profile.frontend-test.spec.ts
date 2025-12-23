import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('Frontend Profile (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let authToken: string;
    let testCustomer: any;

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
                email: `profile-test-${Date.now()}@example.com`,
                password: hashedPassword,
                type: 'retailer',
                kyc_status: 'approved',
                is_active: true,
                email_verified_at: new Date(),
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
    });

    afterAll(async () => {
        // Cleanup test data
        if (testCustomer && prisma) {
            try {
                // Delete related data first (order matters due to foreign keys)
                await prisma.quotation_messages.deleteMany({
                    where: { user_id: testCustomer.id },
                });
                await prisma.quotations.deleteMany({
                    where: { user_id: testCustomer.id },
                });
                
                // Delete cart items and carts
                const carts = await prisma.carts.findMany({
                    where: { user_id: testCustomer.id },
                    select: { id: true },
                });
                if (carts.length > 0) {
                    await prisma.cart_items.deleteMany({
                        where: { cart_id: { in: carts.map((c) => c.id) } },
                    });
                }
                await prisma.carts.deleteMany({
                    where: { user_id: testCustomer.id },
                });
                
                // Delete wishlist items through wishlists
                const wishlists = await prisma.wishlists.findMany({
                    where: { customer_id: testCustomer.id },
                    select: { id: true },
                });
                if (wishlists.length > 0) {
                    await prisma.wishlist_items.deleteMany({
                        where: { wishlist_id: { in: wishlists.map((w) => w.id) } },
                    });
                }
                await prisma.wishlists.deleteMany({
                    where: { customer_id: testCustomer.id },
                });
                
                // Delete orders and related data
                const orders = await prisma.orders.findMany({
                    where: { user_id: testCustomer.id },
                    select: { id: true },
                });
                if (orders.length > 0) {
                    const orderIds = orders.map((o) => o.id);
                    await prisma.order_items.deleteMany({
                        where: { order_id: { in: orderIds } },
                    });
                    await prisma.order_status_histories.deleteMany({
                        where: { order_id: { in: orderIds } },
                    });
                    await prisma.payments.deleteMany({
                        where: { order_id: { in: orderIds } },
                    });
                }
                await prisma.orders.deleteMany({
                    where: { user_id: testCustomer.id },
                });
                
                await prisma.user_kyc_documents.deleteMany({
                    where: { user_id: testCustomer.id },
                });
                await prisma.user_kyc_messages.deleteMany({
                    where: { user_id: testCustomer.id },
                });
                // KYC profile fields are now in customers table, no separate deletion needed
                await prisma.customer.delete({
                    where: { id: testCustomer.id },
                });
            } catch (error) {
                // Ignore cleanup errors - they don't affect test results
            }
        }
        if (app) {
            await app.close();
        }
    });

    describe('GET /api/profile', () => {
        it('should return user profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toBeDefined();
            expect(response.body.id).toBe(testCustomer.id.toString());
            expect(response.body.name).toBe(testCustomer.name);
            expect(response.body.email).toBe(testCustomer.email);
            expect(response.body.type).toBe(testCustomer.type);
            expect(response.body.kyc_status).toBe(testCustomer.kyc_status);
            expect(response.body.is_active).toBe(testCustomer.is_active);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/profile')
                .expect(401);
        });
    });

    describe('PATCH /api/profile', () => {
        it('should update profile information', async () => {
            const updateData = {
                name: 'Updated Name',
                email: `updated-${Date.now()}@example.com`,
                phone: '1234567890',
                preferred_language: 'en',
            };

            const response = await request(app.getHttpServer())
                .patch('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.name).toBe(updateData.name);
            expect(response.body.email).toBe(updateData.email);
            expect(response.body.phone).toBe(updateData.phone);
            expect(response.body.preferred_language).toBe(updateData.preferred_language);

            // Verify email_verified_at is null when email changed
            expect(response.body.email_verified_at).toBeNull();

            // Verify in database
            const updatedCustomer = await prisma.customer.findUnique({
                where: { id: testCustomer.id },
            });
            expect(updatedCustomer?.name).toBe(updateData.name);
            expect(updatedCustomer?.email).toBe(updateData.email);
            expect(updatedCustomer?.email_verified_at).toBeNull();

            // Restore original email for other tests
            await prisma.customer.update({
                where: { id: testCustomer.id },
                data: {
                    email: testCustomer.email,
                    email_verified_at: new Date(),
                },
            });
        });

        it('should not reset email_verified_at when email is unchanged', async () => {
            const originalEmail = testCustomer.email;
            const updateData = {
                name: 'Updated Name Again',
                email: originalEmail, // Same email
                phone: '9876543210',
            };

            const response = await request(app.getHttpServer())
                .patch('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.email).toBe(originalEmail);
            // email_verified_at should still be set
            expect(response.body.email_verified_at).not.toBeNull();

            // Verify in database
            const updatedCustomer = await prisma.customer.findUnique({
                where: { id: testCustomer.id },
            });
            expect(updatedCustomer?.email_verified_at).not.toBeNull();
        });

        it('should reject duplicate email', async () => {
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

            const updateData = {
                name: 'Test Customer',
                email: otherCustomer.email, // Try to use other customer's email
            };

            await request(app.getHttpServer())
                .patch('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(409); // Conflict

            // Cleanup
            await prisma.customer.delete({ where: { id: otherCustomer.id } });
        });

        it('should validate required fields', async () => {
            await request(app.getHttpServer())
                .patch('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    // Missing required fields
                })
                .expect(400);
        });

        it('should validate email format', async () => {
            await request(app.getHttpServer())
                .patch('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test',
                    email: 'invalid-email',
                })
                .expect(400);
        });

        it('should validate preferred_language values', async () => {
            await request(app.getHttpServer())
                .patch('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test',
                    email: 'test@example.com',
                    preferred_language: 'invalid',
                })
                .expect(400);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .patch('/api/profile')
                .send({
                    name: 'Test',
                    email: 'test@example.com',
                })
                .expect(401);
        });
    });

    describe('DELETE /api/profile', () => {
        it('should delete user account with correct password', async () => {
            // Create a new customer for deletion test
            const hashedPassword = await bcrypt.hash('delete-password', 10);
            const customerToDelete = await prisma.customer.create({
                data: {
                    name: 'Customer To Delete',
                    email: `delete-test-${Date.now()}@example.com`,
                    password: hashedPassword,
                    type: 'retailer',
                    kyc_status: 'approved',
                    is_active: true,
                },
            });

            // Login to get token
            const loginResult = await authService.login({
                ...customerToDelete,
                id: customerToDelete.id.toString(),
            });
            const deleteToken =
                loginResult && 'access_token' in loginResult
                    ? loginResult.access_token
                    : null;

            if (!deleteToken) {
                throw new Error('Failed to get auth token');
            }

            const response = await request(app.getHttpServer())
                .delete('/api/profile')
                .set('Authorization', `Bearer ${deleteToken}`)
                .send({ password: 'delete-password' })
                .expect(200);

            expect(response.body.message).toBe('Your account has been deleted.');

            // Verify customer is deleted
            const deletedCustomer = await prisma.customer.findUnique({
                where: { id: customerToDelete.id },
            });
            expect(deletedCustomer).toBeNull();
        });

        it('should reject deletion with incorrect password', async () => {
            await request(app.getHttpServer())
                .delete('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ password: 'wrong-password' })
                .expect(400);
        });

        it('should require password for deletion', async () => {
            await request(app.getHttpServer())
                .delete('/api/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .delete('/api/profile')
                .send({ password: 'password123' })
                .expect(401);
        });
    });
});

