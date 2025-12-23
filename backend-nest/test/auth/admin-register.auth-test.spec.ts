import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Registration (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;

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
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        // Clean up test data before each test from admins and users tables
        const testEmails = [
            'admin@gmail.com',
            'admin.register.test2@example.com',
            'admin.register.test3@example.com',
            'admin.register.test4@example.com',
        ];

        await prisma.admin.deleteMany({
            where: {
                email: {
                    in: testEmails,
                },
            },
        });

        await prisma.user.deleteMany({
            where: {
                email: {
                    in: testEmails,
                },
            },
        });
    });

    // afterEach(async () => {
    //     // Clean up test data after each test to ensure no conflicts
    //     const testEmails = [
    //         'admin@gmail.com',
    //         'admin.register.test2@example.com',
    //         'admin.register.test3@example.com',
    //         'admin.register.test4@example.com',
    //     ];

    //     await prisma.admin.deleteMany({
    //         where: {
    //             email: {
    //                 in: testEmails,
    //             },
    //         },
    //     });

    //     await prisma.user.deleteMany({
    //         where: {
    //             email: {
    //                 in: testEmails,
    //             },
    //         },
    //     });
    // });

    describe('POST /api/auth/register/admin', () => {
        it('should successfully register a new admin user', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'Test Admin',
                    email: 'admin@gmail.com',
                    password: 'admin123',
                    password_confirmation: 'admin123',
                    type: 'admin',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('admin@gmail.com');
            expect(response.body.user.name).toBe('Test Admin');
            expect(response.body.user.type).toBe('admin');
            expect(response.body.user.guard).toBe('admin');
            expect(response.body.user).not.toHaveProperty('password');

            // Verify admin was created in database
            const admin = await prisma.admin.findUnique({
                where: { email: 'admin@gmail.com' },
            });
            expect(admin).toBeTruthy();
            expect(admin?.name).toBe('Test Admin');
            expect(admin?.type).toBe('admin');
        });

        it.skip('should register admin with default type when type is not provided', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'Test Admin Default',
                    email: 'admin.register.test2@example.com',
                    password: 'admin123',
                    password_confirmation: 'admin123',
                });

            expect(response.status).toBe(201);
            expect(response.body.user.type).toBe('admin'); // Default type

            const admin = await prisma.admin.findUnique({
                where: { email: 'admin.register.test2@example.com' },
            });
            expect(admin?.type).toBe('admin');
        });

        it.skip('should register admin with different user types', async () => {
            const types = ['admin', 'super-admin', 'production', 'sales'];

            for (const type of types) {
                const email = `admin.register.test.${type}@example.com`;
                await prisma.admin.deleteMany({ where: { email } });

                const response = await request(app.getHttpServer())
                    .post('/api/auth/register/admin')
                    .send({
                        name: `Test ${type}`,
                        email,
                        password: 'admin123',
                        password_confirmation: 'admin123',
                        type,
                    });

                expect(response.status).toBe(201);
                expect(response.body.user.type).toBe(type);

                const admin = await prisma.admin.findUnique({
                    where: { email },
                });
                expect(admin?.type).toBe(type);
            }
        });

        it.skip('should register admin with admin_group_id', async () => {
            // Create a test admin group first
            const adminGroup = await prisma.admin_groups.create({
                data: {
                    name: 'Test Group',
                    code: 'test-group',
                    is_active: true,
                    display_order: 0,
                },
            });

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'Test Admin with Group',
                    email: 'admin.register.test3@example.com',
                    password: 'admin123',
                    password_confirmation: 'admin123',
                    type: 'admin',
                    admin_group_id: Number(adminGroup.id),
                });

            expect(response.status).toBe(201);
            expect(response.body.user.admin_group_id).toBe(
                adminGroup.id.toString(),
            );

            // Clean up
            await prisma.admin_groups.delete({ where: { id: adminGroup.id } });
        });

        it.skip('should return 400 when passwords do not match', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'Test Admin',
                    email: 'admin.register.test4@example.com',
                    password: 'admin123',
                    password_confirmation: 'differentpassword',
                    type: 'admin',
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Passwords do not match');
        });

        it.skip('should return 409 when email already exists in admins table', async () => {
            // Create an admin first
            await prisma.admin.create({
                data: {
                    name: 'Existing Admin',
                    email: 'admin@gmail.com',
                    password: 'hashedpassword',
                    type: 'admin',
                },
            });

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'New Admin',
                    email: 'admin@gmail.com',
                    password: 'admin123',
                    password_confirmation: 'admin123',
                    type: 'admin',
                });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('Email already registered');
        });

        it.skip('should return 409 when email already exists in users table (as customer user)', async () => {
            // Create a user (customer user) first
            await prisma.user.create({
                data: {
                    name: 'Existing Customer User',
                    email: 'admin@gmail.com',
                    password: 'hashedpassword',
                    type: 'retailer',
                    business_name: 'Test Business',
                },
            });

            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'New Admin',
                    email: 'admin@gmail.com',
                    password: 'admin123',
                    password_confirmation: 'admin123',
                    type: 'admin',
                });

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('Email already registered');
        });

        it.skip('should return 400 when password is too short', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'Test Admin',
                    email: 'admin@gmail.com',
                    password: 'short',
                    password_confirmation: 'short',
                    type: 'admin',
                });

            expect(response.status).toBe(400);
        });

        it.skip('should return 400 when required fields are missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    email: 'admin@gmail.com',
                    // Missing name, password, password_confirmation
                });

            expect(response.status).toBe(400);
        });

        it.skip('should return 400 when email is invalid', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'Test Admin',
                    email: 'invalid-email',
                    password: 'admin123',
                    password_confirmation: 'admin123',
                    type: 'admin',
                });

            expect(response.status).toBe(400);
        });

        it.skip('should return 400 when type is invalid', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'Test Admin',
                    email: 'admin@gmail.com',
                    password: 'admin123',
                    password_confirmation: 'admin123',
                    type: 'invalid-type',
                });

            expect(response.status).toBe(400);
        });

        it.skip('should hash password before storing', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'Test Admin',
                    email: 'admin@gmail.com',
                    password: 'admin123',
                    password_confirmation: 'admin123',
                    type: 'admin',
                });

            expect(response.status).toBe(201);

            const admin = await prisma.admin.findUnique({
                where: { email: 'admin@gmail.com' },
            });

            expect(admin?.password).not.toBe('admin123');
            expect(admin?.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
        });

        it.skip('should set email_verified_at on registration', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'Test Admin',
                    email: 'admin@gmail.com',
                    password: 'admin123',
                    password_confirmation: 'admin123',
                    type: 'admin',
                });

            expect(response.status).toBe(201);

            const admin = await prisma.admin.findUnique({
                where: { email: 'admin@gmail.com' },
            });

            expect(admin?.email_verified_at).toBeTruthy();
        });

        it.skip('should allow login after registration', async () => {
            // Register admin
            const registerResponse = await request(app.getHttpServer())
                .post('/api/auth/register/admin')
                .send({
                    name: 'Test Admin',
                    email: 'admin@gmail.com',
                    password: 'admin123',
                    password_confirmation: 'admin123',
                    type: 'admin',
                });

            expect(registerResponse.status).toBe(201);
            const accessToken = registerResponse.body.access_token;

            // Try to login with the same credentials
            const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'admin@gmail.com',
                    password: 'admin123',
                });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body).toHaveProperty('access_token');
            expect(loginResponse.body.user.email).toBe(
                'admin@gmail.com',
            );
        });
    });
});

