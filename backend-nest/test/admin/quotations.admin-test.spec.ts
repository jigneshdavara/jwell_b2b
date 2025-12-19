import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Quotations (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let accessToken: string;
    let testCustomer: any;
    let testProduct: any;

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

        // Setup Admin
        let admin = await prisma.user.findFirst({ where: { type: 'admin' } });
        if (!admin) {
            admin = await prisma.user.create({
                data: {
                    name: 'Admin User',
                    email: 'admin.quotations@example.com',
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

        // Setup Customer
        testCustomer = await prisma.customer.findFirst({
            where: { email: 'customer.quotations@example.com' },
        });
        if (!testCustomer) {
            testCustomer = await prisma.customer.create({
                data: {
                    name: 'Test Customer',
                    email: 'customer.quotations@example.com',
                    password: 'hashed_password',
                    type: 'retailer',
                    kyc_status: 'approved',
                },
            });
        }

        // Setup Brand and Category for Product
        let brand = await prisma.brands.findFirst({ where: { code: 'TBR' } });
        if (!brand) {
            brand = await prisma.brands.create({
                data: { name: 'Test Brand', code: 'TBR' },
            });
        }
        let category = await prisma.categories.findFirst({
            where: { name: 'Test Category' },
        });
        if (!category) {
            category = await prisma.categories.create({
                data: { name: 'Test Category' },
            });
        }

        // Setup Product
        testProduct = await prisma.products.findFirst({
            where: { sku: 'TEST-PROD-Q' },
        });
        if (!testProduct) {
            testProduct = await prisma.products.create({
                data: {
                    name: 'Test Product',
                    sku: 'TEST-PROD-Q',
                    brand_id: brand.id,
                    category_id: category.id,
                    making_charge_amount: 200,
                    is_active: true,
                },
            });
        }
    });

    afterAll(async () => {
        await prisma.quotation_messages.deleteMany({
            where: { message: { contains: 'Test' } },
        });
        if (testCustomer)
            await prisma.quotations.deleteMany({
                where: { user_id: testCustomer.id },
            });
        if (testProduct)
            await prisma.products.deleteMany({ where: { id: testProduct.id } });
        await prisma.categories.deleteMany({
            where: { name: 'Test Category' },
        });
        await prisma.brands.deleteMany({ where: { code: 'TBR' } });
        if (testCustomer)
            await prisma.customer.deleteMany({
                where: { id: testCustomer.id },
            });
        await app.close();
    });

    describe('Quotation Lifecycle', () => {
        let quotationId: string;

        it('POST /api/quotations - Should create a quotation (Frontend)', async () => {
            // Need customer token
            const customerLogin = await authService.login({
                ...testCustomer,
                guard: 'web',
            });
            const customerToken = customerLogin.access_token;

            const response = await request(app.getHttpServer())
                .post('/api/quotations')
                .set('Authorization', `Bearer ${customerToken}`)
                .send({
                    product_id: Number(testProduct.id),
                    quantity: 2,
                    notes: 'Test Quotation Note',
                });

            expect(response.status).toBe(201);
            quotationId = response.body.id;
        });

        it('GET /api/admin/quotations - Should list quotations', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/quotations')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('GET /api/admin/quotations/:id - Should get quotation details', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/admin/quotations/${quotationId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(quotationId.toString());
        });

        it('POST /api/admin/quotations/:id/messages - Should send message to client', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/admin/quotations/${quotationId}/messages`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ message: 'Test admin message' });

            expect(response.status).toBe(201);
        });

        it('POST /api/admin/quotations/:id/reject - Should reject quotation', async () => {
            const response = await request(app.getHttpServer())
                .post(`/api/admin/quotations/${quotationId}/reject`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ admin_notes: 'Test rejection reason' });

            expect(response.status).toBe(201);
        });

        it('POST /api/admin/quotations/:id/request-confirmation - Should update and request confirmation', async () => {
            const response = await request(app.getHttpServer())
                .post(
                    `/api/admin/quotations/${quotationId}/request-confirmation`,
                )
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    quantity: 5,
                    notes: 'Please confirm updated quantity',
                });

            expect(response.status).toBe(201);
        });

        it('POST /api/admin/quotations/:id/approve - Should approve quotation and create order', async () => {
            // First, customer must confirm (since status was changed to pending_customer_confirmation)
            const customerLogin = await authService.login({
                ...testCustomer,
                guard: 'web',
            });
            const customerToken = customerLogin.access_token;

            await request(app.getHttpServer())
                .post(`/api/quotations/${quotationId}/confirm`)
                .set('Authorization', `Bearer ${customerToken}`);

            const response = await request(app.getHttpServer())
                .post(`/api/admin/quotations/${quotationId}/approve`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ admin_notes: 'Approved!' });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('order_id');
        });
    });
});
