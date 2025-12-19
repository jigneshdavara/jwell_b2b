import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Customers & Groups (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let accessToken: string;

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

        // Clean up data before testing
        await prisma.customer_groups.deleteMany({
            where: {
                name: { in: ['Wholesale Tier 1', 'Wholesale Tier 1 Updated'] },
            },
        });

        // Find an admin user or create one for testing
        let admin = await prisma.user.findFirst();
        if (!admin) {
            admin = await prisma.user.create({
                data: {
                    name: 'Admin User',
                    email: 'admin@example.com',
                    password: 'hashed_password', // In real tests use bcrypt
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
        await app.close();
    });

    describe('Customer Groups', () => {
        let groupId: string;

        it('POST /api/admin/customer-groups - Should create a group', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/customer-groups')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'Wholesale Tier 1',
                    description: 'Special rates for bulk buyers',
                    is_active: true,
                    position: 1,
                });

            expect(response.status).toBe(201);
            expect(response.body.name).toBe('Wholesale Tier 1');
            expect(response.body).toHaveProperty('slug');
            groupId = response.body.id;
        });

        it('GET /api/admin/customer-groups - Should list groups', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/customer-groups')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('PATCH /api/admin/customer-groups/:id - Should update group', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/admin/customer-groups/${groupId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Wholesale Tier 1 Updated' });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Wholesale Tier 1 Updated');
        });
    });

    describe('Customers', () => {
        it('GET /api/admin/customers - Should list customers with stats', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/customers')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('stats');
            expect(response.body.stats).toHaveProperty('total');
        });

        it('GET /api/admin/customers (filtered) - Should filter by search', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/customers?search=test')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
        });
    });
});
