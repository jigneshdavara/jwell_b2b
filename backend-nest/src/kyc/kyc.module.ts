import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { OnboardingKycController } from './onboarding-kyc.controller';
import { KycApprovedGuard } from './guards/kyc-approved.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [KycController, OnboardingKycController],
    providers: [KycService, KycApprovedGuard],
    exports: [KycService, KycApprovedGuard],
})
export class KycModule {}
