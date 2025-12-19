import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Admin Brands (e2e)', () => {
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

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'brands');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Clean up test data
        await prisma.brands.deleteMany({ where: { code: 'test-brand' } });

        // Find an admin user
        let admin = await prisma.user.findFirst({ where: { type: 'admin' } });
        if (!admin) {
            admin = await prisma.user.create({
                data: {
                    name: 'Admin User',
                    email: 'admin.brand@example.com',
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

    describe('Brands', () => {
        let brandId: string;

        it('POST /api/admin/brands - Should create a brand', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/brands')
                .set('Authorization', `Bearer ${accessToken}`)
                .field('code', 'test-brand')
                .field('name', 'Test Brand')
                .field('description', 'Used for testing')
                .field('display_order', 1);

            expect(response.status).toBe(201);
            expect(response.body.code).toBe('test-brand');
            brandId = response.body.id;
        });

        it('GET /api/admin/brands - Should list brands', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/brands')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('PATCH /api/admin/brands/:id - Should update a brand', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/admin/brands/${brandId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .field('name', 'Updated Brand Name');

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Updated Brand Name');
        });

        it('DELETE /api/admin/brands/:id - Should delete a brand', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/admin/brands/${brandId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);

            const check = await prisma.brands.findUnique({
                where: { id: BigInt(brandId) },
            });
            expect(check).toBeNull();
        });
    });
});
