import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Forgot Password (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

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
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        // Clean up password reset tokens for nensi.omeecr@gmail.com before each test
        await prisma.password_reset_tokens.deleteMany({
            where: {
                email: 'nensi.omeecr@gmail.com',
            },
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should successfully send password reset link for existing customer', async () => {
            const testEmail = 'nensi.omeecr@gmail.com';

            // Check if customer exists, create if not
            let customer = await prisma.customer.findUnique({
                where: { email: testEmail },
            });

            if (!customer) {
                const testPassword = await bcrypt.hash('password123', 10);
                customer = await prisma.customer.create({
                    data: {
                        name: 'Nensi Mavani',
                        email: testEmail,
                        password: testPassword,
                        type: 'retailer',
                        kyc_status: 'approved',
                    },
                });
            }

            // Request password reset
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: testEmail });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain(
                'If that email address exists, we will send a password reset link.',
            );

            // Verify reset token was created
            const resetToken = await prisma.password_reset_tokens.findUnique({
                where: { email: testEmail },
            });

            expect(resetToken).toBeTruthy();
            expect(resetToken?.email).toBe(testEmail);
            expect(resetToken?.token).toBeTruthy();
            expect(resetToken?.created_at).toBeTruthy();

            // Clean up reset token (but keep the customer)
            await prisma.password_reset_tokens.delete({
                where: { email: testEmail },
            });
        });

        it.skip('should successfully send password reset link for existing admin user', async () => {
            // Create a test admin user
            const testEmail = 'forgot.password.admin@example.com';
            const testPassword = await bcrypt.hash('password123', 10);

            const adminUser = await prisma.user.create({
                data: {
                    name: 'Test Admin',
                    email: testEmail,
                    password: testPassword,
                    type: 'admin',
                },
            });

            // Request password reset
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: testEmail });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain(
                'If that email address exists, we will send a password reset link.',
            );

            // Verify reset token was created
            const resetToken = await prisma.password_reset_tokens.findUnique({
                where: { email: testEmail },
            });

            expect(resetToken).toBeTruthy();
            expect(resetToken?.email).toBe(testEmail);

            // Clean up
            await prisma.user.delete({
                where: { id: adminUser.id },
            });
            await prisma.password_reset_tokens.delete({
                where: { email: testEmail },
            });
        });

        it.skip('should return success message even for non-existent email (prevent enumeration)', async () => {
            const nonExistentEmail = 'nonexistent@example.com';

            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: nonExistentEmail });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain(
                'If that email address exists, we will send a password reset link.',
            );

            // Verify no reset token was created for non-existent email
            const resetToken = await prisma.password_reset_tokens.findUnique({
                where: { email: nonExistentEmail },
            });

            expect(resetToken).toBeNull();
        });

        it.skip('should update existing reset token if one already exists', async () => {
            const testEmail = 'nensi.omeecr@gmail.com';

            // Check if customer exists, create if not
            let customer = await prisma.customer.findUnique({
                where: { email: testEmail },
            });

            if (!customer) {
                const testPassword = await bcrypt.hash('password123', 10);
                customer = await prisma.customer.create({
                    data: {
                        name: 'Nensi Mavani',
                        email: testEmail,
                        password: testPassword,
                        type: 'retailer',
                        kyc_status: 'approved',
                    },
                });
            }

            // Create an existing reset token
            const oldToken = await bcrypt.hash('old-token', 10);
            const oldCreatedAt = new Date(Date.now() - 10000); // 10 seconds ago

            await prisma.password_reset_tokens.create({
                data: {
                    email: testEmail,
                    token: oldToken,
                    created_at: oldCreatedAt,
                },
            });

            // Request password reset again
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: testEmail });

            expect(response.status).toBe(200);

            // Verify token was updated
            const resetToken = await prisma.password_reset_tokens.findUnique({
                where: { email: testEmail },
            });

            expect(resetToken).toBeTruthy();
            expect(resetToken?.token).not.toBe(oldToken);
            expect(resetToken?.created_at.getTime()).toBeGreaterThan(
                oldCreatedAt.getTime(),
            );

            // Clean up reset token (but keep the customer)
            await prisma.password_reset_tokens.delete({
                where: { email: testEmail },
            });
        });

        it.skip('should return 400 when email is missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({});

            expect(response.status).toBe(400);
        });

        it.skip('should return 400 when email is invalid', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: 'invalid-email' });

            expect(response.status).toBe(400);
        });

        it.skip('should return 400 when email is empty string', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: '' });

            expect(response.status).toBe(400);
        });

        it.skip('should send password reset link for nensi.omeecr@gmail.com', async () => {
            const testEmail = 'nensi.omeecr@gmail.com';

            // Check if customer exists
            const existingCustomer = await prisma.customer.findUnique({
                where: { email: testEmail },
            });

            if (!existingCustomer) {
                // Create test customer if doesn't exist
                const testPassword = await bcrypt.hash('password123', 10);
                await prisma.customer.create({
                    data: {
                        name: 'Nensi Mavani',
                        email: testEmail,
                        password: testPassword,
                        type: 'retailer',
                        kyc_status: 'approved',
                    },
                });
            }

            // Request password reset
            const response = await request(app.getHttpServer())
                .post('/api/auth/forgot-password')
                .send({ email: testEmail });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain(
                'If that email address exists, we will send a password reset link.',
            );

            // Verify reset token was created
            const resetToken = await prisma.password_reset_tokens.findUnique({
                where: { email: testEmail },
            });

            expect(resetToken).toBeTruthy();
            expect(resetToken?.email).toBe(testEmail);
            expect(resetToken?.token).toBeTruthy();
            expect(resetToken?.created_at).toBeTruthy();

            // Clean up reset token (but keep the customer)
            await prisma.password_reset_tokens.delete({
                where: { email: testEmail },
            });
        });
    });
});
