import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { OnboardingKycController } from './onboarding-kyc.controller';
import { KycApprovedGuard } from './guards/kyc-approved.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '24h' },
        }),
    ],
    controllers: [KycController, OnboardingKycController],
    providers: [KycService, KycApprovedGuard],
    exports: [KycService, KycApprovedGuard],
})
export class KycModule {}
