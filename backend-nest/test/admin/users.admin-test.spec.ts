import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthService } from '../../src/auth/auth.service';

describe('Admin Users & Groups (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let accessToken: string;

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

    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: 'team.test@example.com' }
    });
    await prisma.user_groups.deleteMany({
      where: { name: { in: ['Sales Team', 'Sales Team Updated'] } }
    });

    // Find an admin user or create one for testing
    let admin = await prisma.user.findFirst({
      where: { type: 'super-admin' }
    });
    if (!admin) {
      admin = await prisma.user.findFirst({
        where: { type: 'admin' }
      });
    }
    
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin.test@example.com',
          password: 'hashed_password', 
          type: 'admin',
        }
      });
    }

    const loginResult = await authService.login({ ...admin, guard: 'admin' });
    accessToken = loginResult.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Groups', () => {
    let groupId: string;

    it('POST /api/admin/user-groups - Should create a group', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/user-groups')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Sales Team',
          description: 'Access for sales department',
          features: ['dashboard.view', 'orders.manage'],
          is_active: true,
          position: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Sales Team');
      groupId = response.body.id;
    });

    it('GET /api/admin/user-groups - Should list groups', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/user-groups')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('PATCH /api/admin/user-groups/:id - Should update group', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/user-groups/${groupId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Sales Team Updated' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Sales Team Updated');
    });
  });

  describe('Team Users', () => {
    let userId: string;

    it('POST /api/admin/team-users - Should create a user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/team-users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Team Member',
          email: 'team.test@example.com',
          password: 'password123',
          type: 'sales',
        });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe('team.test@example.com');
      userId = response.body.id;
    });

    it('GET /api/admin/team-users - Should list internal users', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/team-users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.some(u => u.id === userId)).toBe(true);
    });

    it('PATCH /api/admin/team-users/:id - Should update user', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/admin/team-users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test Team Member Updated' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Team Member Updated');
    });

    it('DELETE /api/admin/team-users/:id - Should delete user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/admin/team-users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
    });
  });
});

