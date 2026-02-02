import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Admin Categories (e2e)', () => {
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
        const uploadDir = path.join(process.cwd(), 'public', 'categories');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Clean up test data
        await prisma.categories.deleteMany({
            where: { code: 'test-category' },
        });

        // Find an admin user
        let admin = await prisma.admin.findFirst({ where: { type: 'admin' } });
        if (!admin) {
            admin = await prisma.admin.create({
                data: {
                    name: 'Admin User',
                    email: 'admin.category@example.com',
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

    describe('Categories', () => {
        let categoryId: string;

        it('POST /api/admin/categories - Should create a category', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/categories')
                .set('Authorization', `Bearer ${accessToken}`)
                .field('code', 'test-category')
                .field('name', 'Test Category')
                .field('description', 'Used for testing')
                .field('display_order', 1);

            expect(response.status).toBe(201);
            expect(response.body.code).toBe('test-category');
            categoryId = response.body.id;
        });

        it('GET /api/admin/categories - Should list categories with tree and meta', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/categories')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.items)).toBe(true);
            expect(response.body).toHaveProperty('categoryTree');
            expect(response.body).toHaveProperty('parentCategories');
            expect(response.body).toHaveProperty('styles');
            expect(response.body).toHaveProperty('sizes');
        });

        it('PATCH /api/admin/categories/:id - Should update a category', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/admin/categories/${categoryId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .field('name', 'Updated Category Name');

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Updated Category Name');
        });

        it('DELETE /api/admin/categories/:id - Should delete a category', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/admin/categories/${categoryId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);

            const check = await prisma.categories.findUnique({
                where: { id: BigInt(categoryId) },
            });
            expect(check).toBeNull();
        });
    });
});
