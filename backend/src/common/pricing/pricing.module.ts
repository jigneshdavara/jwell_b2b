import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
    imports: [PrismaModule, DiscountsModule],
    providers: [PricingService],
    exports: [PricingService],
})
export class PricingModule {}
