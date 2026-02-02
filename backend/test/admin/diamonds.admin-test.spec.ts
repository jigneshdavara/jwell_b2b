import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Diamonds (e2e)', () => {
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
        await prisma.diamond_shapes.deleteMany({
            where: { code: 'test-diamond-shape' },
        });
        await prisma.diamond_types.deleteMany({
            where: { code: 'test-diamond-type' },
        });

        // Find an admin user
        let admin = await prisma.admin.findFirst({ where: { type: 'admin' } });
        if (!admin) {
            admin = await prisma.admin.create({
                data: {
                    name: 'Admin User',
                    email: 'admin.diamond@example.com',
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

    describe('Diamond Types', () => {
        let typeId: string;

        it('POST /api/admin/diamond/types - Should create a diamond type', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/admin/diamond/types')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    code: 'test-diamond-type',
                    name: 'Test Diamond Type',
                    description: 'Used for testing',
                    is_active: true,
                    display_order: 1,
                });

            expect(response.status).toBe(201);
            expect(response.body.code).toBe('test-diamond-type');
            typeId = response.body.id;
        });

        it('GET /api/admin/diamond/types - Should list diamond types', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/admin/diamond/types')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.items)).toBe(true);
        });

        describe('Diamond Shapes', () => {
            let shapeId: string;

            it('POST /api/admin/diamond/shapes - Should create a diamond shape', async () => {
                const response = await request(app.getHttpServer())
                    .post('/api/admin/diamond/shapes')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                        diamond_type_id: parseInt(typeId),
                        code: 'test-diamond-shape',
                        name: 'Test Diamond Shape',
                        description: 'Used for testing',
                        is_active: true,
                        display_order: 1,
                    });

                expect(response.status).toBe(201);
                expect(response.body.code).toBe('test-diamond-shape');
                shapeId = response.body.id;
            });

            it('GET /api/admin/diamond/shapes - Should list diamond shapes', async () => {
                const response = await request(app.getHttpServer())
                    .get('/api/admin/diamond/shapes')
                    .set('Authorization', `Bearer ${accessToken}`);

                expect(response.status).toBe(200);
                expect(Array.isArray(response.body.items)).toBe(true);
            });
        });
    });
});
