import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as bcrypt from 'bcrypt';

describe('Frontend Dashboard (e2e)', () => {
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

        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        app.setGlobalPrefix('api');
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);
        authService = moduleFixture.get<AuthService>(AuthService);

    // Create test customer with approved KYC
    const hashedPassword = await bcrypt.hash('password123', 10);
    testCustomer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: `dashboard-test-${Date.now()}@example.com`,
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
    });

    afterAll(async () => {
        // Cleanup test data
        if (testCustomer) {
            await prisma.orders.deleteMany({
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

    describe('GET /api/dashboard', () => {
        it('should return dashboard data with stats, recent orders, products, and catalogs', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('stats');
            expect(response.body).toHaveProperty('recentOrders');
            expect(response.body).toHaveProperty('recentProducts');
            expect(response.body).toHaveProperty('featuredCatalogs');

            // Check stats structure
            expect(response.body.stats).toHaveProperty('open_orders');
            expect(response.body.stats).toHaveProperty('active_offers');
            expect(typeof response.body.stats.open_orders).toBe('number');
            expect(typeof response.body.stats.active_offers).toBe('number');

            // Check recentOrders structure
            expect(Array.isArray(response.body.recentOrders)).toBe(true);
            if (response.body.recentOrders.length > 0) {
                const order = response.body.recentOrders[0];
                expect(order).toHaveProperty('reference');
                expect(order).toHaveProperty('status');
                expect(order).toHaveProperty('total');
                expect(order).toHaveProperty('items');
                expect(order).toHaveProperty('placed_on');
            }

            // Check recentProducts structure
            expect(Array.isArray(response.body.recentProducts)).toBe(true);
            if (response.body.recentProducts.length > 0) {
                const product = response.body.recentProducts[0];
                expect(product).toHaveProperty('id');
                expect(product).toHaveProperty('name');
                expect(product).toHaveProperty('sku');
                expect(product).toHaveProperty('price_total');
                expect(product).toHaveProperty('thumbnail');
            }

            // Check featuredCatalogs structure
            expect(Array.isArray(response.body.featuredCatalogs)).toBe(true);
            if (response.body.featuredCatalogs.length > 0) {
                const catalog = response.body.featuredCatalogs[0];
                expect(catalog).toHaveProperty('id');
                expect(catalog).toHaveProperty('name');
                expect(catalog).toHaveProperty('products_count');
            }
        });

        it('should return 401 without authentication', async () => {
            await request(app.getHttpServer())
                .get('/api/dashboard')
                .expect(401);
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
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${pendingToken}`)
                .expect(403);

            // Cleanup
            await prisma.customer.delete({
                where: { id: pendingCustomer.id },
            });
        });

        it('should return correct open orders count', async () => {
            // Create some test orders with open statuses
            const openStatuses = ['pending', 'approved', 'in_production'];
            for (const status of openStatuses) {
                await prisma.orders.create({
                    data: {
                        user_id: testCustomer.id,
                        reference: `TEST-${Date.now()}-${status}`,
                        status: status,
                        currency: 'INR',
                        total_amount: 1000,
                        subtotal_amount: 900,
                        tax_amount: 100,
                        discount_amount: 0,
                    },
                });
            }

            // Create a closed order (should not be counted)
            await prisma.orders.create({
                data: {
                    user_id: testCustomer.id,
                    reference: `TEST-${Date.now()}-delivered`,
                    status: 'delivered',
                    currency: 'INR',
                    total_amount: 2000,
                    subtotal_amount: 1800,
                    tax_amount: 200,
                    discount_amount: 0,
                },
            });

            const response = await request(app.getHttpServer())
                .get('/api/dashboard')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Should have at least 3 open orders (we created 3)
            expect(response.body.stats.open_orders).toBeGreaterThanOrEqual(3);

            // Cleanup
            await prisma.orders.deleteMany({
                where: {
                    user_id: testCustomer.id,
                    reference: { startsWith: 'TEST-' },
                },
            });
        });
    });
});
