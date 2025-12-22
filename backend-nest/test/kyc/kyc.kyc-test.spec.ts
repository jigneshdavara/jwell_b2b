import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('KYC Module (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let accessToken: string;
    let testUser: any;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Add BigInt serialization fix for tests
        (BigInt.prototype as any).toJSON = function () {
            return this.toString();
        };

        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);
        authService = moduleFixture.get<AuthService>(AuthService);

        // Find or create a test customer
        const email = 'test.kyc@example.com';
        testUser = await prisma.customer.findUnique({ where: { email } });

        if (!testUser) {
            const registered = await authService.register({
                name: 'Test KYC User',
                email,
                phone: '9876543210',
                account_type: 'retailer',
                business_name: 'Test Business',
                password: 'password123',
                password_confirmation: 'password123',
            });
            testUser = registered;
        }

        const loginResult = await authService.login({
            ...testUser,
            guard: 'user',
        });
        accessToken = loginResult.access_token;
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /kyc/profile - Should retrieve the user kyc profile', async () => {
        const response = await request(app.getHttpServer())
            .get('/kyc/profile')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('business_name');
        expect(response.body.user_id).toBe(testUser.id.toString());
    });

    it('PATCH /kyc/profile - Should update the business details', async () => {
        const updateDto = {
            business_name: 'Updated Business Name',
            gst_number: '24AAAAA0000A1Z5',
        };

        const response = await request(app.getHttpServer())
            .patch('/kyc/profile')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(updateDto);

        expect(response.status).toBe(200);
        expect(response.body.business_name).toBe('Updated Business Name');
        expect(response.body.gst_number).toBe('24AAAAA0000A1Z5');
    });

    it('POST /kyc/messages - Should allow sending a message', async () => {
        const response = await request(app.getHttpServer())
            .post('/kyc/messages')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ message: 'Hello Admin, please review my KYC.' });

        expect(response.status).toBe(201);
        expect(response.body.message).toContain('Hello Admin');
    });

    it('GET /kyc/messages - Should retrieve message history', async () => {
        const response = await request(app.getHttpServer())
            .get('/kyc/messages')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('PATCH /kyc/:id/status (Admin) - Should simulate admin approval', async () => {
        // Find a real admin user to avoid FK constraint error
        const admin = await prisma.user.findFirst();

        // If no admin exists, we skip the status update message by not passing adminId
        // or we create a temp admin. But here we'll just fix the service to handle null adminId better.

        const response = await request(app.getHttpServer())
            .patch(`/kyc/${testUser.id}/status`)
            .set('Authorization', `Bearer ${accessToken}`) // Using user token for now
            .send({
                status: 'approved',
                remarks: 'Looks good!',
                // In the controller, it takes req.user.userId as adminId.
                // We'll modify the service to only use it if guard is admin.
            });

        // Note: This might still fail if the service tries to use testUser.id as adminId
        // and testUser.id doesn't exist in the 'users' table.

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('approved');
    });
});
