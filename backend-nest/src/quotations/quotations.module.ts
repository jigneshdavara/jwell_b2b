import { Module } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingModule } from '../common/pricing/pricing.module';
import { TaxModule } from '../common/tax/tax.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [PrismaModule, PricingModule, TaxModule, CartModule],
  providers: [QuotationsService],
  controllers: [QuotationsController],
  exports: [QuotationsService],
})
export class QuotationsModule {}
