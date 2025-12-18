import { Module } from '@nestjs/common';
import { MakingChargeDiscountsService } from './making-charge-discounts.service';
import { MakingChargeDiscountsController } from './making-charge-discounts.controller';

@Module({
  providers: [MakingChargeDiscountsService],
  controllers: [MakingChargeDiscountsController]
})
export class MakingChargeDiscountsModule {}
