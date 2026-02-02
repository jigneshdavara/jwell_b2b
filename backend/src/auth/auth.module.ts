import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../common/auth/strategies/jwt.strategy';
import { MailModule } from '../common/mail/mail.module';

@Module({
    imports: [
        PassportModule,
        MailModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'fallback_secret', // Should use ConfigService in production
            signOptions: { expiresIn: '1d' },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
