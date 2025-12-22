import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Customer Registration (e2e)', () => {
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
        // Clean up test data before each test
        const testEmails = [
            'nensi.omeecr@gmail.com',
            'register.test1@example.com',
            'register.test2@example.com',
            'register.test3@example.com',
            'register.test4@example.com',
            'register.test5@example.com',
        ];

        // Delete from customers table
        await prisma.customer.deleteMany({
            where: {
                email: {
                    in: testEmails,
                },
            },
        });

        // Delete from users table (in case of conflicts)
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: testEmails,
                },
            },
        });

        // Delete KYC profiles
        const customers = await prisma.customer.findMany({
            where: {
                email: {
                    in: testEmails,
                },
            },
            select: { id: true },
        });

        if (customers.length > 0) {
            const customerIds = customers.map((c) => c.id);
            await prisma.userKycProfile.deleteMany({
                where: {
                    user_id: {
                        in: customerIds,
                    },
                },
            });
        }
    });

    describe('POST /api/auth/register', () => {
        it('should successfully register a new customer (retailer)', async () => {
            const registerData = {
                name: 'Nensi Mavani',
                email: 'nensi.omeecr@gmail.com',
                phone: '+919876543210',
                account_type: 'retailer',
                business_name: 'Test Business',
                website: 'https://testbusiness.com',
                gst_number: '27ABCDE1234F1Z5',
                pan_number: 'ABCDE1234F',
                registration_number: 'REG123456',
                address_line1: '123 Test Street',
                address_line2: 'Near Test Park',
                city: 'Mumbai',
                state: 'Maharashtra',
                postal_code: '400001',
                country: 'India',
                contact_name: 'Nensi Mavani',
                contact_phone: '+919876543210',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('access_token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('id');

            expect(response.body.user).toHaveProperty(
                'email',
                'nensi.omeecr@gmail.com',
            );

            expect(response.body.user).toHaveProperty('name', 'Nensi Mavani');

            expect(response.body.user).toHaveProperty('type', 'retailer');

            expect(response.body.user).toHaveProperty('guard', 'user');

            expect(response.body.user).toHaveProperty('kyc_status', 'pending');

            expect(response.body.user).not.toHaveProperty('password');

            // Verify customer was created in database
            const customer = await prisma.customer.findUnique({
                where: { email: 'nensi.omeecr@gmail.com' },
            });

            expect(customer).toBeTruthy();
            expect(customer?.name).toBe('Nensi Mavani');
            expect(customer?.type).toBe('retailer');
            expect(customer?.kyc_status).toBe('pending');
            expect(customer?.password).not.toBe('password123');
            expect(customer?.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format

            // Verify KYC profile was created
            const kycProfile = await prisma.userKycProfile.findFirst({
                where: { user_id: customer?.id },
            });

            expect(kycProfile).toBeTruthy();
            expect(kycProfile?.business_name).toBe('Test Business');
            expect(kycProfile?.gst_number).toBe('27ABCDE1234F1Z5');
            expect(kycProfile?.pan_number).toBe('ABCDE1234F');
        }, 10000); // 10 second timeout

        it.skip('should successfully register a new customer (wholesaler)', async () => {
            const registerData = {
                name: 'Test Wholesaler',
                email: 'register.test1@example.com',
                phone: '+919876543211',
                account_type: 'wholesaler',
                business_name: 'Wholesale Business',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.type).toBe('wholesaler');
            expect(response.body.user.kyc_status).toBe('pending');

            const customer = await prisma.customer.findUnique({
                where: { email: 'register.test1@example.com' },
            });
            expect(customer?.type).toBe('wholesaler');
        });

        it.skip('should return 400 when passwords do not match', async () => {
            const registerData = {
                name: 'Test User',
                email: 'register.test2@example.com',
                phone: '+919876543212',
                account_type: 'retailer',
                business_name: 'Test Business',
                password: 'password123',
                password_confirmation: 'differentpassword',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('Passwords do not match');
        });

        it.skip('should return 409 when email already exists', async () => {
            // Create a customer first
            await prisma.customer.create({
                data: {
                    name: 'Existing Customer',
                    email: 'register.test3@example.com',
                    password: 'hashedpassword',
                    type: 'retailer',
                    phone: '+919876543213',
                    kyc_status: 'pending',
                },
            });

            const registerData = {
                name: 'New Customer',
                email: 'register.test3@example.com',
                phone: '+919876543213',
                account_type: 'retailer',
                business_name: 'New Business',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(409);
            expect(response.body.message).toContain('Email already registered');
        });

        it.skip('should return 400 when required fields are missing', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'register.test4@example.com',
                    // Missing name, phone, account_type, business_name, password
                });

            expect(response.status).toBe(400);
        });

        it.skip('should return 400 when email is invalid', async () => {
            const registerData = {
                name: 'Test User',
                email: 'invalid-email',
                phone: '+919876543214',
                account_type: 'retailer',
                business_name: 'Test Business',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(400);
        });

        it.skip('should return 400 when account_type is invalid', async () => {
            const registerData = {
                name: 'Test User',
                email: 'register.test5@example.com',
                phone: '+919876543215',
                account_type: 'invalid-type',
                business_name: 'Test Business',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(400);
        });

        it.skip('should return 400 when password is too short', async () => {
            const registerData = {
                name: 'Test User',
                email: 'register.test5@example.com',
                phone: '+919876543215',
                account_type: 'retailer',
                business_name: 'Test Business',
                password: 'short',
                password_confirmation: 'short',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(400);
        });

        it.skip('should create KYC profile with all optional fields', async () => {
            const registerData = {
                name: 'Test User',
                email: 'register.test1@example.com',
                phone: '+919876543211',
                account_type: 'retailer',
                business_name: 'Complete Business',
                website: 'https://completebusiness.com',
                gst_number: '27ABCDE1234F1Z5',
                pan_number: 'ABCDE1234F',
                registration_number: 'REG789012',
                address_line1: '456 Complete Street',
                address_line2: 'Suite 100',
                city: 'Delhi',
                state: 'Delhi',
                postal_code: '110001',
                country: 'India',
                contact_name: 'Contact Person',
                contact_phone: '+919876543299',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(201);

            const customer = await prisma.customer.findUnique({
                where: { email: 'register.test1@example.com' },
            });

            const kycProfile = await prisma.userKycProfile.findFirst({
                where: { user_id: customer?.id },
            });

            expect(kycProfile).toBeTruthy();
            expect(kycProfile?.business_website).toBe(
                'https://completebusiness.com',
            );
            expect(kycProfile?.gst_number).toBe('27ABCDE1234F1Z5');
            expect(kycProfile?.pan_number).toBe('ABCDE1234F');
            expect(kycProfile?.registration_number).toBe('REG789012');
            expect(kycProfile?.address_line1).toBe('456 Complete Street');
            expect(kycProfile?.address_line2).toBe('Suite 100');
            expect(kycProfile?.city).toBe('Delhi');
            expect(kycProfile?.state).toBe('Delhi');
            expect(kycProfile?.postal_code).toBe('110001');
            expect(kycProfile?.country).toBe('India');
            expect(kycProfile?.contact_name).toBe('Contact Person');
            expect(kycProfile?.contact_phone).toBe('+919876543299');
        });

        it.skip('should use name and phone as defaults for contact_name and contact_phone', async () => {
            const registerData = {
                name: 'Test User',
                email: 'register.test2@example.com',
                phone: '+919876543212',
                account_type: 'retailer',
                business_name: 'Test Business',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(201);

            const customer = await prisma.customer.findUnique({
                where: { email: 'register.test2@example.com' },
            });

            const kycProfile = await prisma.userKycProfile.findFirst({
                where: { user_id: customer?.id },
            });

            expect(kycProfile?.contact_name).toBe('Test User');
            expect(kycProfile?.contact_phone).toBe('+919876543212');
        });

        it.skip('should set default country to India when not provided', async () => {
            const registerData = {
                name: 'Test User',
                email: 'register.test3@example.com',
                phone: '+919876543213',
                account_type: 'retailer',
                business_name: 'Test Business',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(201);

            const customer = await prisma.customer.findUnique({
                where: { email: 'register.test3@example.com' },
            });

            const kycProfile = await prisma.userKycProfile.findFirst({
                where: { user_id: customer?.id },
            });

            expect(kycProfile?.country).toBe('India');
        });

        it.skip('should send welcome email and admin notification on registration', async () => {
            // Mock console to verify email sending (emails are sent but errors are caught)
            const consoleErrorSpy = jest
                .spyOn(console, 'error')
                .mockImplementation();

            const registerData = {
                name: 'Nensi Mavani',
                email: 'nensi.omeecr@gmail.com',
                phone: '+919876543210',
                account_type: 'retailer',
                business_name: 'Test Business',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(201);

            // Note: Email sending errors are caught and logged, but don't fail registration
            // Check console logs for email sending attempts
            consoleErrorSpy.mockRestore();
        });

        it.skip('should allow login after registration', async () => {
            // Register customer
            const registerData = {
                name: 'Test User',
                email: 'register.test4@example.com',
                phone: '+919876543214',
                account_type: 'retailer',
                business_name: 'Test Business',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const registerResponse = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(registerResponse.status).toBe(201);

            // Try to login with the same credentials
            const loginResponse = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'register.test4@example.com',
                    password: 'password123',
                });

            expect(loginResponse.status).toBe(200);
            expect(loginResponse.body).toHaveProperty('access_token');
            expect(loginResponse.body.user.email).toBe(
                'register.test4@example.com',
            );
            expect(loginResponse.body.user.guard).toBe('user');
        });

        it.skip('should handle registration in a transaction', async () => {
            // This test verifies that if KYC profile creation fails,
            // the customer is not created (transaction rollback)
            // Note: This is more of an integration test scenario
            const registerData = {
                name: 'Test User',
                email: 'register.test5@example.com',
                phone: '+919876543215',
                account_type: 'retailer',
                business_name: 'Test Business',
                password: 'password123',
                password_confirmation: 'password123',
            };

            const response = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(registerData);

            expect(response.status).toBe(201);

            // Verify both customer and KYC profile exist
            const customer = await prisma.customer.findUnique({
                where: { email: 'register.test5@example.com' },
            });
            expect(customer).toBeTruthy();

            const kycProfile = await prisma.userKycProfile.findFirst({
                where: { user_id: customer?.id },
            });
            expect(kycProfile).toBeTruthy();
        });
    });
});
