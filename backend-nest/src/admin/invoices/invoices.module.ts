import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceGenerationService } from './invoice-generation.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../../common/mail/mail.module';

@Module({
    imports: [PrismaModule, MailModule],
    controllers: [InvoicesController],
    providers: [InvoicesService, InvoiceGenerationService],
    exports: [InvoicesService],
})
export class InvoicesModule {}

