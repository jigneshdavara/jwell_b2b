import { Module } from '@nestjs/common';
import { FrontendQuotationsController } from './quotations.controller';
import { FrontendQuotationsService } from './quotations.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PricingModule } from '../../common/pricing/pricing.module';
import { TaxModule } from '../../common/tax/tax.module';
import { CartModule } from '../../cart/cart.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
    imports: [
        PrismaModule,
        PricingModule,
        TaxModule,
        CartModule,
        MailModule,
    ],
    controllers: [FrontendQuotationsController],
    providers: [FrontendQuotationsService],
    exports: [FrontendQuotationsService],
})
export class FrontendQuotationsModule {}

