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
        return this.quotationsService.getStatistics(
            userId,
            Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        );
    }

    @Get('report/export/pdf')
    async exportPdf(
        @Res() res: Response,
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

    @Get(':quotation_group_id')
    findOne(@Param('quotation_group_id') quotationGroupId: string) {
        return this.quotationsService.findByGroupId(quotationGroupId);
    }

    @Post(':quotation_group_id/approve')
    approve(
        @Param('quotation_group_id') quotationGroupId: string,
        @Body() dto: ApproveQuotationDto,
    ) {
        return this.quotationsService.approveByGroupId(quotationGroupId, dto.admin_notes);
    }

    @Post(':quotation_group_id/reject')
    reject(
        @Param('quotation_group_id') quotationGroupId: string,
        @Body() dto: ApproveQuotationDto,
    ) {
        return this.quotationsService.rejectByGroupId(quotationGroupId, dto.admin_notes);
    }

    @Post(':quotation_group_id/messages')
    message(
        @Param('quotation_group_id') quotationGroupId: string,
        @Body() dto: StoreQuotationMessageDto,
        @Request() req: { user: { userId: string | number } },
    ) {
        return this.quotationsService.addMessageByGroupId(
            quotationGroupId,
            dto.message,
            BigInt(req.user?.userId || 0),
        );
    }

    @Post(':quotation_group_id/request-confirmation')
    requestConfirmation(
        @Param('quotation_group_id') quotationGroupId: string,
        @Body() dto: RequestConfirmationDto,
    ) {
        return this.quotationsService.requestConfirmationByGroupId(quotationGroupId, dto);
    }

    @Post(':quotation_group_id/add-item')
    addItem(
        @Param('quotation_group_id') quotationGroupId: string,
        @Body() dto: AddQuotationItemDto,
    ) {
        return this.quotationsService.addItemByGroupId(quotationGroupId, dto);
    }

    @Post(':quotation_group_id/update-product')
    updateProduct(
        @Param('quotation_group_id') quotationGroupId: string,
        @Body() dto: UpdateQuotationProductDto,
    ) {
        return this.quotationsService.updateProductByGroupId(quotationGroupId, dto);
    }

    @Delete('item/:quotation_id')
    removeItem(@Param('quotation_id') quotationId: string) {
        // This removes a single quotation item
        return this.quotationsService.removeById(quotationId);
    }

    @Delete(':quotation_group_id')
    remove(@Param('quotation_group_id') quotationGroupId: string) {
        // This removes the entire quotation group
        return this.quotationsService.removeByGroupId(quotationGroupId);
    }
}
