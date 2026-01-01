import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Query,
    UseGuards,
    Request,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FrontendInvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../kyc/guards/kyc-approved.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard, KycApprovedGuard)
export class FrontendInvoicesController {
    constructor(private invoicesService: FrontendInvoicesService) {}

    @Get()
    async index(
        @Request() req: any,
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('per_page', new ParseIntPipe({ optional: true })) perPage?: number,
    ) {
        const userId = BigInt(req.user.userId);
        const pageNumber = page ?? 1;
        const perPageNumber = perPage ?? 15;

        return this.invoicesService.findAll(userId, pageNumber, perPageNumber);
    }

    @Get(':id')
    async show(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
        const invoiceId = BigInt(id);
        const userId = BigInt(req.user.userId);

        return this.invoicesService.findOne(invoiceId, userId);
    }

    @Get(':id/pdf')
    async downloadPdf(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: any,
        @Res() res: Response,
    ) {
        const invoiceId = BigInt(id);
        const userId = BigInt(req.user.userId);

        const pdfBuffer = await this.invoicesService.generatePdf(invoiceId, userId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="invoice-${id}.pdf"`,
        );
        res.send(pdfBuffer);
    }
}


