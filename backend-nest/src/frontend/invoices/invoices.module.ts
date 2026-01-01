import { Module } from '@nestjs/common';
import { FrontendInvoicesController } from './invoices.controller';
import { FrontendInvoicesService } from './invoices.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { InvoiceGenerationService } from '../../admin/invoices/invoice-generation.service';

@Module({
    imports: [PrismaModule],
    controllers: [FrontendInvoicesController],
    providers: [FrontendInvoicesService, InvoiceGenerationService],
    exports: [FrontendInvoicesService],
})
export class FrontendInvoicesModule {}


