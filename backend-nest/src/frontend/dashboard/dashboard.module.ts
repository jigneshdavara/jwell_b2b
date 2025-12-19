import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PricingModule } from '../../common/pricing/pricing.module';

@Module({
    imports: [PrismaModule, PricingModule],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule {}
