import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PricingModule } from '../../common/pricing/pricing.module';
import { KycModule } from '../../kyc/kyc.module';

@Module({
    imports: [PrismaModule, PricingModule, KycModule],
    controllers: [CatalogController],
    providers: [CatalogService],
})
export class CatalogModule {}

