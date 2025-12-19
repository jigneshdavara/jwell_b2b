import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Metals & Rates (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let accessToken: string;

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

        // Clean up test data
        await prisma.metals.deleteMany({ where: { code: 'test-metal' } });

        // Find an admin user or create one for testing
        let admin = await prisma.user.findFirst({ where: { type: 'admin' } });
        if (!admin) {
            admin = await prisma.user.create({
                data: {
                    name: 'Admin User',
                    email: 'admin.metal@example.com',
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
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Metals', () => {
        let metalId: string;

        it('POST /api/admin/metals - Should create a metal', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/metals')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    code: 'test-metal',
                    name: 'Test Metal',
                    description: 'Used for testing',
                    is_active: true,
                    display_order: 1,
                });

            expect(response.status).toBe(201);
            expect(response.body.code).toBe('test-metal');
            metalId = response.body.id;
        });

        it('GET /api/admin/metals - Should list metals', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/metals')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.items)).toBe(true);
        });
    });

    describe('Rates', () => {
        it('POST /api/admin/rates/:metal/store - Should store metal rates', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/rates/gold/store')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currency: 'INR',
                    rates: [
                        { purity: '24K', price_per_gram: 6500.5 },
                        { purity: '22K', price_per_gram: 6000.0 },
                    ],
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toContain('gold rates saved');
        });

        it('GET /api/admin/rates - Should list rates and summaries', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/rates')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('metalSummaries');
            expect(response.body).toHaveProperty('availableMetals');
        });
    });
});
