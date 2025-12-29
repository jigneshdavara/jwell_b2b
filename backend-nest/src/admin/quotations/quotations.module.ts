import { Module } from '@nestjs/common';
import { AdminQuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PricingModule } from '../../common/pricing/pricing.module';
import { TaxModule } from '../../common/tax/tax.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
    imports: [PrismaModule, PricingModule, TaxModule, MailModule],
    controllers: [AdminQuotationsController],
    providers: [QuotationsService],
})
export class AdminQuotationsModule {}
