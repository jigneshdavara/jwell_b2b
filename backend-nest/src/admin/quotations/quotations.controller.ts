import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseIntPipe,
    Request,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { QuotationsService } from './quotations.service';
import {
    QuotationFilterDto,
    ApproveQuotationDto,
    RequestConfirmationDto,
    AddQuotationItemDto,
    UpdateQuotationProductDto,
    StoreQuotationMessageDto,
} from '../../quotations/dto/quotation.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/quotations')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminQuotationsController {
    constructor(private readonly quotationsService: QuotationsService) {}

    @Get()
    findAll(@Query() filters: QuotationFilterDto) {
        return this.quotationsService.findAll(filters);
    }

    @Get('report/statistics')
    async getStatistics(
        @Query('user_id', new ParseIntPipe({ optional: true }))
        userId?: number,
        @Query('start_date')
        startDate?: string,
        @Query('end_date')
        endDate?: string,
    ) {
        // Filter out empty strings
        const dateFilter: { startDate?: string; endDate?: string } = {};
        if (startDate && startDate.trim() !== '') {
            dateFilter.startDate = startDate;
        }
        if (endDate && endDate.trim() !== '') {
            dateFilter.endDate = endDate;
        }
        return this.quotationsService.getStatistics(userId, Object.keys(dateFilter).length > 0 ? dateFilter : undefined);
    }

    @Get('report/export/pdf')
    async exportPdf(
        @Query('user_id', new ParseIntPipe({ optional: true }))
        userId: number | undefined,
        @Query('start_date')
        startDate?: string,
        @Query('end_date')
        endDate?: string,
        @Res() res: Response,
    ) {
        // Filter out empty strings
        const dateFilter: { startDate?: string; endDate?: string } = {};
        if (startDate && startDate.trim() !== '') {
            dateFilter.startDate = startDate;
        }
        if (endDate && endDate.trim() !== '') {
            dateFilter.endDate = endDate;
        }
        const pdfBuffer = await this.quotationsService.exportStatisticsPDF(
            userId,
            Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        );
        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="quotation-report-${dateStr}.pdf"`,
        );
        res.send(pdfBuffer);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.quotationsService.findOne(id);
    }

    @Post(':id/approve')
    approve(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ApproveQuotationDto,
    ) {
        return this.quotationsService.approve(id, dto.admin_notes);
    }

    @Post(':id/reject')
    reject(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ApproveQuotationDto,
    ) {
        return this.quotationsService.reject(id, dto.admin_notes);
    }

    @Post(':id/messages')
    message(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: StoreQuotationMessageDto,
        @Request() req: { user: { userId: string | number } },
    ) {
        return this.quotationsService.addMessage(
            id,
            dto.message,
            BigInt(req.user?.userId || 0),
        );
    }

    @Post(':id/request-confirmation')
    requestConfirmation(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RequestConfirmationDto,
    ) {
        return this.quotationsService.requestConfirmation(id, dto);
    }

    @Post(':id/add-item')
    addItem(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AddQuotationItemDto,
    ) {
        return this.quotationsService.addItem(id, dto);
    }

    @Post(':id/update-product')
    updateProduct(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateQuotationProductDto,
    ) {
        return this.quotationsService.updateProduct(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        // This removes a single item from a group
        return this.quotationsService.remove(id);
    }
}
