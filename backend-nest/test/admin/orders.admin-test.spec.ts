import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Orders (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let authToken: string;
    let testCustomer: any;
    let testOrder: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Add BigInt serialization fix for tests
        (BigInt.prototype as any).toJSON = function () {
            return this.toString();
        };

        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        app.setGlobalPrefix('api');
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);
        authService = moduleFixture.get<AuthService>(AuthService);

        // Cleanup
        await prisma.order_status_histories.deleteMany({});
        await prisma.order_items.deleteMany({});
        await prisma.orders.deleteMany({});
        await prisma.order_statuses.deleteMany({});

        // Create test admin user and login
        let admin = await prisma.admin.findFirst({
            where: { email: 'admin@test.com' },
        });

        if (!admin) {
            admin = await prisma.admin.create({
                data: {
                    email: 'admin@test.com',
                    password:
                        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
                    name: 'Admin User',
                    type: 'admin',
                },
            });
        }

        const loginResult = await authService.login({
            ...admin,
            guard: 'admin',
        });
        authToken = loginResult.access_token;

        // Create test customer
        testCustomer = await prisma.customer.findFirst({
            where: { email: 'customer@test.com' },
        });

        if (!testCustomer) {
            testCustomer = await prisma.customer.create({
                data: {
                    email: 'customer@test.com',
                    password:
                        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
                    name: 'Test Customer',
                    type: 'retailer',
                    kyc_status: 'approved',
                },
            });
        }

        // Create test order (check if exists first)
        testOrder = await prisma.orders.findFirst({
            where: { reference: 'ORD-TEST-001' },
        });

        if (!testOrder) {
            testOrder = await prisma.orders.create({
                data: {
                    user_id: testCustomer.id,
                    reference: 'ORD-TEST-001',
                    status: 'pending_payment',
                    currency: 'INR',
                    subtotal_amount: 10000,
                    tax_amount: 1800,
                    discount_amount: 0,
                    total_amount: 11800,
                },
            });
        }
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/admin/orders', () => {
        it('should return list of orders', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.items)).toBe(true);
            expect(response.body.items.length).toBeGreaterThan(0);
            expect(response.body.statuses).toBeDefined();
            expect(Array.isArray(response.body.statuses)).toBe(true);
        });

        it('should filter orders by status', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/orders?status=pending_payment')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(
                response.body.items.every(
                    (order: any) => order.status === 'pending_payment',
                ),
            ).toBe(true);
        });

        it('should paginate orders', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/orders?page=1&per_page=1')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(1);
            expect(response.body.meta.page).toBe(1);
            expect(response.body.meta.per_page).toBe(1);
        });
    });

    describe('GET /api/admin/orders/:id', () => {
        it('should return order details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/admin/orders/${testOrder.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id', testOrder.id.toString());
            expect(response.body).toHaveProperty('reference', 'ORD-TEST-001');
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('status_history');
            expect(response.body).toHaveProperty('payments');
            expect(response.body).toHaveProperty('statusOptions');
        });

        it('should return 404 for non-existent order', async () => {
            await request(app.getHttpServer())
                .get('/api/admin/orders/999999999')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('POST /api/admin/orders/:id/status', () => {
        it('should update order status', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/admin/orders/${testOrder.id}/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    status: 'pending',
                    meta: { comment: 'Order approved' },
                })
                .expect(201);

            expect(response.body).toHaveProperty('message');

            // Verify order status was updated
            const updatedOrder = await prisma.orders.findUnique({
                where: { id: testOrder.id },
            });

            expect(updatedOrder?.status).toBe('pending');

            // Verify status history was created
            const history = await prisma.order_status_histories.findFirst({
                where: { order_id: testOrder.id },
                orderBy: { created_at: 'desc' },
            });

            expect(history).toBeDefined();
            expect(history?.status).toBe('pending');
            expect(history?.meta).toMatchObject({
                comment: 'Order approved',
                actor_guard: 'admin',
            });
        });

        it('should return 400 for invalid status', async () => {
            await request(app.getHttpServer())
                .post(`/api/admin/orders/${testOrder.id}/status`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    status: 'invalid_status',
                })
                .expect(400);
        });
    });
});

describe('Admin Order Statuses (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let authToken: string;
    let testStatus: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Add BigInt serialization fix for tests
        (BigInt.prototype as any).toJSON = function () {
            return this.toString();
        };

        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        app.setGlobalPrefix('api');
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);
        authService = moduleFixture.get<AuthService>(AuthService);

        // Cleanup
        await prisma.order_status_histories.deleteMany({});
        await prisma.order_items.deleteMany({});
        await prisma.orders.deleteMany({});
        await prisma.order_statuses.deleteMany({});

        // Create test admin user and login
        let admin = await prisma.admin.findFirst({
            where: { email: 'admin@test.com' },
        });

        if (!admin) {
            admin = await prisma.admin.create({
                data: {
                    email: 'admin@test.com',
                    password:
                        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
                    name: 'Admin User',
                    type: 'admin',
                },
            });
        }

        const loginResult = await authService.login({
            ...admin,
            guard: 'admin',
        });
        authToken = loginResult.access_token;
    });

    afterAll(async () => {
        await prisma.order_status_histories.deleteMany({});
        await prisma.order_items.deleteMany({});
        await prisma.orders.deleteMany({});
        await prisma.order_statuses.deleteMany({});
        await app.close();
    });

    describe('GET /api/admin/orders/statuses', () => {
        it('should return list of order statuses', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('meta');
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('should paginate order statuses', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/orders/statuses?page=1&per_page=5')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(5);
            expect(response.body.meta.page).toBe(1);
        });
    });

    describe('POST /api/admin/orders/statuses', () => {
        it('should create order status', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Processing',
                    color: '#3b82f6',
                    is_default: false,
                    is_active: true,
                    position: 1,
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', 'Processing');
            expect(response.body).toHaveProperty('slug');
            expect(response.body).toHaveProperty('color', '#3b82f6');
            expect(response.body).toHaveProperty('is_default', false);
            expect(response.body).toHaveProperty('is_active', true);

            testStatus = response.body;
        });

        it('should set default status and unset others', async () => {
            // Create another status
            const status1 = await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Default Status',
                    is_default: true,
                })
                .expect(201);

            // Create another status as default
            const status2 = await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'New Default',
                    is_default: true,
                })
                .expect(201);

            // Verify first status is no longer default
            const updatedStatus1 = await prisma.order_statuses.findUnique({
                where: { id: BigInt(status1.body.id) },
            });

            expect(updatedStatus1?.is_default).toBe(false);

            // Verify second status is default
            const updatedStatus2 = await prisma.order_statuses.findUnique({
                where: { id: BigInt(status2.body.id) },
            });

            expect(updatedStatus2?.is_default).toBe(true);
        });

        it('should return 400 for duplicate name', async () => {
            await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Processing',
                })
                .expect(400);
        });
    });

    describe('PUT /api/admin/orders/statuses/:id', () => {
        it('should update order status', async () => {
            const response = await request(app.getHttpServer())
                .put(`/api/admin/orders/statuses/${testStatus.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Processing Updated',
                    color: '#6366f1',
                    is_active: false,
                })
                .expect(200);

            expect(response.body).toHaveProperty('name', 'Processing Updated');
            expect(response.body).toHaveProperty('color', '#6366f1');
            expect(response.body).toHaveProperty('is_active', false);
        });

        it('should generate new slug when name changes', async () => {
            const originalSlug = testStatus.slug;

            const response = await request(app.getHttpServer())
                .put(`/api/admin/orders/statuses/${testStatus.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Completely New Name',
                })
                .expect(200);

            expect(response.body.slug).not.toBe(originalSlug);
            expect(response.body.slug).toContain('completely-new-name');
        });

        it('should return 404 for non-existent status', async () => {
            await request(app.getHttpServer())
                .put('/api/admin/orders/statuses/999999999')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated',
                })
                .expect(404);
        });
    });

    describe('DELETE /api/admin/orders/statuses/:id', () => {
        it('should delete order status', async () => {
            // Create a status to delete
            const statusToDelete = await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'To Delete',
                })
                .expect(201);

            await request(app.getHttpServer())
                .delete(`/api/admin/orders/statuses/${statusToDelete.body.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Verify it's deleted
            const deleted = await prisma.order_statuses.findUnique({
                where: { id: BigInt(statusToDelete.body.id) },
            });

            expect(deleted).toBeNull();
        });

        it('should prevent deleting default status if other statuses exist', async () => {
            // Create default status
            const defaultStatus = await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Default To Delete',
                    is_default: true,
                })
                .expect(201);

            // Create another status
            await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Another Status',
                })
                .expect(201);

            // Try to delete default status
            await request(app.getHttpServer())
                .delete(`/api/admin/orders/statuses/${defaultStatus.body.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });

    describe('DELETE /api/admin/orders/statuses/bulk', () => {
        it('should bulk delete order statuses', async () => {
            // Create statuses to delete
            const status1 = await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Bulk Delete 1',
                })
                .expect(201);

            const status2 = await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Bulk Delete 2',
                })
                .expect(201);

            const response = await request(app.getHttpServer())
                .delete('/api/admin/orders/statuses/bulk')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ids: [parseInt(status1.body.id), parseInt(status2.body.id)],
                })
                .expect(200);

            expect(response.body).toHaveProperty('message');

            // Verify they're deleted
            const deleted1 = await prisma.order_statuses.findUnique({
                where: { id: BigInt(status1.body.id) },
            });

            const deleted2 = await prisma.order_statuses.findUnique({
                where: { id: BigInt(status2.body.id) },
            });

            expect(deleted1).toBeNull();
            expect(deleted2).toBeNull();
        });

        it('should prevent bulk deleting if any is default', async () => {
            // Create default status
            const defaultStatus = await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Default Bulk',
                    is_default: true,
                })
                .expect(201);

            // Create another status
            const regularStatus = await request(app.getHttpServer())
                .post('/api/admin/orders/statuses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Regular Bulk',
                })
                .expect(201);

            // Try to bulk delete including default
            await request(app.getHttpServer())
                .delete('/api/admin/orders/statuses/bulk')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    ids: [
                        parseInt(defaultStatus.body.id),
                        parseInt(regularStatus.body.id),
                    ],
                })
                .expect(400);
        });
    });
});
