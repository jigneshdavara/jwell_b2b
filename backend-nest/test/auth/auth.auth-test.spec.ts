import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { LoginDto } from '../../src/auth/dto/login.dto';

describe('Auth Local Debugger', () => {
    let service: AuthService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                PrismaModule,
                JwtModule.register({
                    secret: process.env.JWT_SECRET || 'secret',
                    signOptions: { expiresIn: '1d' },
                }),
            ],
            providers: [AuthService],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('DEBUG LOGIN: nensi.omeecr@gmail.com', async () => {
        const loginDto: LoginDto = {
            email: 'nensi.omeecr@gmail.com',
            password: 'nensi.omeecr@gmail.com',
        };

        console.log('\n--- STARTING DEBUG SESSION ---');

        // 1. Test Admin Guard
        const adminResult = await service.validateUser(loginDto, 'admin');

        // 2. Test Web Guard
        const webResult = await service.validateUser(loginDto, 'user');

        console.log('--- FINAL RESULTS ---');
        console.log('Admin Guard Result:', adminResult ? 'SUCCESS' : 'FAILED');
        console.log('Web Guard Result:', webResult ? 'SUCCESS' : 'FAILED');

        if (webResult) {
            const loginToken = await service.login(webResult);
            console.log('JWT Token Generated:', loginToken.access_token);
        }
        console.log('--- END DEBUG SESSION ---\n');
    });
});
