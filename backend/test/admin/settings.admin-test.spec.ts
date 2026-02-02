import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Admin Settings (e2e)', () => {
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
        const uploadDir = path.join(process.cwd(), 'public', 'settings');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Find an admin user
        let admin = await prisma.admin.findFirst({ where: { type: 'admin' } });
        if (!admin) {
            admin = await prisma.admin.create({
                data: {
                    name: 'Admin User',
                    email: 'admin.settings@example.com',
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

    describe('General Settings', () => {
        it('GET /api/admin/settings/general - Should get general settings', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/settings/general')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('app_name');
        });

        it('PUT /api/admin/settings/general - Should update general settings', async () => {
            const response = await request(app.getHttpServer())
                .put('/api/admin/settings/general')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    admin_email: 'test@example.com',
                    company_name: 'Test Company',
                    app_name: 'Test App',
                    app_timezone: 'UTC',
                    app_currency: 'USD',
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('updated successfully');
        });
    });

    describe('Tax Groups & Taxes', () => {
        let groupId: string;
        let taxId: string;

        it('POST /api/admin/settings/tax-groups - Should create a tax group', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/settings/tax-groups')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    name: 'GST',
                    description: 'Goods and Services Tax',
                    is_active: true,
                });

            expect(response.status).toBe(201);
            expect(response.body.name).toBe('GST');
            groupId = response.body.id;
        });

        it('POST /api/admin/settings/taxes - Should create a tax', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/settings/taxes')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    tax_group_id: parseInt(groupId),
                    name: 'CGST',
                    code: 'CGST_TEST',
                    rate: 9.0,
                    is_active: true,
                });

            expect(response.status).toBe(201);
            expect(response.body.name).toBe('CGST');
            taxId = response.body.id;
        });

        it('GET /api/admin/settings/taxes - Should list taxes', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/settings/taxes')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        it('DELETE /api/admin/settings/taxes/:id - Should delete a tax', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/admin/settings/taxes/${taxId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
        });

        it('DELETE /api/admin/settings/tax-groups/:id - Should delete a tax group', async () => {
            const response = await request(app.getHttpServer())
                .delete(`/api/admin/settings/tax-groups/${groupId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
        });
    });
});
