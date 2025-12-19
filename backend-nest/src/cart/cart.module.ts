import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PricingModule } from '../common/pricing/pricing.module';
import { TaxModule } from '../common/tax/tax.module';

@Module({
  imports: [PrismaModule, PricingModule, TaxModule],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}
