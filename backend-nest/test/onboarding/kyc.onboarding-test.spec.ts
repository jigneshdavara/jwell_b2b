import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

describe('Onboarding KYC (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authService: AuthService;
    let authToken: string;
    let testCustomer: any;

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

        // Cleanup
        await prisma.user_kyc_messages.deleteMany({});
        await prisma.user_kyc_documents.deleteMany({});
        await prisma.userKycProfile.deleteMany({});
        await prisma.customer.deleteMany({
            where: { email: 'kyc-customer@test.com' },
        });

        // Create test customer
        const hashedPassword = await bcrypt.hash('password', 10);
        testCustomer = await prisma.customer.create({
            data: {
                email: 'kyc-customer@test.com',
                password: hashedPassword,
                name: 'KYC Test Customer',
                type: 'retailer',
                kyc_status: 'pending',
            },
        });

        // Login to get auth token
        const loginResult = await authService.login({
            ...testCustomer,
            guard: 'customer',
        });
        authToken = loginResult.access_token;
    });

    afterAll(async () => {
        // Cleanup test files
        const uploadDir = path.join(
            process.cwd(),
            'uploads',
            'kyc',
            testCustomer.id.toString(),
        );
        if (fs.existsSync(uploadDir)) {
            fs.rmSync(uploadDir, { recursive: true, force: true });
        }

        await app.close();
    });

    describe('GET /api/onboarding/kyc', () => {
        it('should return onboarding data with auto-created profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/onboarding/kyc')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('profile');
            expect(response.body).toHaveProperty('documents');
            expect(response.body).toHaveProperty('documentTypes');
            expect(response.body).toHaveProperty('messages');
            expect(response.body).toHaveProperty('can_customer_reply');

            expect(response.body.user.email).toBe('kyc-customer@test.com');
            expect(response.body.profile).toBeTruthy();
            expect(response.body.profile.business_name).toContain(
                'KYC Test Customer',
            );
            expect(Array.isArray(response.body.documentTypes)).toBe(true);
        });

        it('should return existing profile if already created', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/onboarding/kyc')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.profile).toBeTruthy();
        });
    });

    describe('PATCH /api/onboarding/kyc/profile', () => {
        it('should update KYC profile', async () => {
            const response = await request(app.getHttpServer())
                .patch('/api/onboarding/kyc/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    business_name: 'Updated Business Name',
                    gst_number: '29ABCDE1234F1Z5',
                    pan_number: 'ABCDE1234F',
                    address_line1: '123 Business Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    postal_code: '400001',
                    country: 'India',
                })
                .expect(200);

            expect(response.body.business_name).toBe('Updated Business Name');
            expect(response.body.gst_number).toBe('29ABCDE1234F1Z5');
        });

        it('should mark customer as pending after profile update', async () => {
            // First approve customer
            await prisma.customer.update({
                where: { id: testCustomer.id },
                data: { kyc_status: 'approved' },
            });

            // Update profile
            await request(app.getHttpServer())
                .patch('/api/onboarding/kyc/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    business_name: 'Changed Business Name',
                })
                .expect(200);

            // Check status remains approved (should not change if already approved)
            const customer = await prisma.customer.findUnique({
                where: { id: testCustomer.id },
            });
            expect(customer?.kyc_status).toBe('approved');
        });

        it('should return 400 for invalid data', async () => {
            await request(app.getHttpServer())
                .patch('/api/onboarding/kyc/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    business_name: '', // Empty name
                })
                .expect(400);
        });
    });

    describe('POST /api/onboarding/kyc/documents', () => {
        it('should upload a document', async () => {
            // Create a dummy file
            const testFilePath = path.join(__dirname, 'test-document.pdf');
            fs.writeFileSync(testFilePath, 'dummy pdf content');

            const response = await request(app.getHttpServer())
                .post('/api/onboarding/kyc/documents')
                .set('Authorization', `Bearer ${authToken}`)
                .field('document_type', 'pan_card')
                .attach('document_file', testFilePath)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.type).toBe('pan_card');
            expect(response.body.status).toBe('pending');

            // Cleanup
            fs.unlinkSync(testFilePath);
        });

        it('should return 400 for invalid file type', async () => {
            const testFilePath = path.join(__dirname, 'test-document.txt');
            fs.writeFileSync(testFilePath, 'dummy text');

            await request(app.getHttpServer())
                .post('/api/onboarding/kyc/documents')
                .set('Authorization', `Bearer ${authToken}`)
                .field('document_type', 'pan_card')
                .attach('document_file', testFilePath)
                .expect(400);

            // Cleanup
            fs.unlinkSync(testFilePath);
        });

        it('should return 400 for invalid document type', async () => {
            const testFilePath = path.join(__dirname, 'test-document.pdf');
            fs.writeFileSync(testFilePath, 'dummy pdf');

            await request(app.getHttpServer())
                .post('/api/onboarding/kyc/documents')
                .set('Authorization', `Bearer ${authToken}`)
                .field('document_type', 'invalid_type')
                .attach('document_file', testFilePath)
                .expect(400);

            // Cleanup
            fs.unlinkSync(testFilePath);
        });
    });

    describe('DELETE /api/onboarding/kyc/documents/:id', () => {
        let documentId: string;

        beforeEach(async () => {
            // Create a test document
            const document = await prisma.user_kyc_documents.create({
                data: {
                    user_id: testCustomer.id,
                    type: 'gst_certificate',
                    file_path: 'kyc/test-doc.pdf',
                    status: 'pending',
                },
            });
            documentId = document.id.toString();
        });

        it('should delete a document', async () => {
            await request(app.getHttpServer())
                .delete(`/api/onboarding/kyc/documents/${documentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const document = await prisma.user_kyc_documents.findUnique({
                where: { id: BigInt(documentId) },
            });
            expect(document).toBeNull();
        });

        it('should return 403 for document belonging to another user', async () => {
            // Create another customer and document
            const otherCustomer = await prisma.customer.create({
                data: {
                    email: 'other-customer@test.com',
                    password: await bcrypt.hash('password', 10),
                    name: 'Other Customer',
                    type: 'retailer',
                },
            });

            const otherDocument = await prisma.user_kyc_documents.create({
                data: {
                    user_id: otherCustomer.id,
                    type: 'pan_card',
                    file_path: 'kyc/other-doc.pdf',
                    status: 'pending',
                },
            });

            await request(app.getHttpServer())
                .delete(`/api/onboarding/kyc/documents/${otherDocument.id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(403);

            // Cleanup
            await prisma.user_kyc_documents.delete({
                where: { id: otherDocument.id },
            });
            await prisma.customer.delete({ where: { id: otherCustomer.id } });
        });
    });

    describe('GET /api/onboarding/kyc/documents/:id/download', () => {
        let documentId: string;

        beforeEach(async () => {
            // Create test file and document
            const uploadDir = path.join(
                process.cwd(),
                'uploads',
                'kyc',
                testCustomer.id.toString(),
            );
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const testFilePath = path.join(uploadDir, 'test-document.pdf');
            fs.writeFileSync(testFilePath, 'dummy pdf content');

            const document = await prisma.user_kyc_documents.create({
                data: {
                    user_id: testCustomer.id,
                    type: 'pan_card',
                    file_path: `kyc/${testCustomer.id}/test-document.pdf`,
                    status: 'pending',
                },
            });
            documentId = document.id.toString();
        });

        it('should download a document', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/onboarding/kyc/documents/${documentId}/download`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.headers['content-disposition']).toContain(
                'pan_card',
            );
        });

        it('should return 404 for non-existent document', async () => {
            await request(app.getHttpServer())
                .get('/api/onboarding/kyc/documents/999999999/download')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('POST /api/onboarding/kyc/messages', () => {
        it('should send a message', async () => {
            // Enable comments
            await prisma.customer.update({
                where: { id: testCustomer.id },
                data: { kyc_comments_enabled: true },
            });

            const response = await request(app.getHttpServer())
                .post('/api/onboarding/kyc/messages')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'This is a test message',
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.message).toBe('This is a test message');
            expect(response.body.sender_type).toBe('customer');
        });

        it('should return 403 if comments are disabled', async () => {
            // Disable comments
            await prisma.customer.update({
                where: { id: testCustomer.id },
                data: { kyc_comments_enabled: false },
            });

            await request(app.getHttpServer())
                .post('/api/onboarding/kyc/messages')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'This should fail',
                })
                .expect(403);

            // Re-enable for other tests
            await prisma.customer.update({
                where: { id: testCustomer.id },
                data: { kyc_comments_enabled: true },
            });
        });

        it('should update status to review when message is sent', async () => {
            // Set status to pending
            await prisma.customer.update({
                where: { id: testCustomer.id },
                data: { kyc_status: 'pending', kyc_comments_enabled: true },
            });

            await request(app.getHttpServer())
                .post('/api/onboarding/kyc/messages')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'Review this please',
                })
                .expect(201);

            const customer = await prisma.customer.findUnique({
                where: { id: testCustomer.id },
            });
            expect(customer?.kyc_status).toBe('review');
        });
    });

    describe('GET /api/onboarding/kyc/document-types', () => {
        it('should return list of document types', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/onboarding/kyc/document-types')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('documentTypes');
            expect(Array.isArray(response.body.documentTypes)).toBe(true);
            expect(response.body.documentTypes).toContain('pan_card');
            expect(response.body.documentTypes).toContain('gst_certificate');
        });
    });
});
