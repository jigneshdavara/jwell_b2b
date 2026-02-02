import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Body,
    UseGuards,
    ParseIntPipe,
    Request,
    BadRequestException,
    NotFoundException,
    Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, AdminGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get()
    async findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('per_page', new ParseIntPipe({ optional: true }))
        perPage?: number,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.ordersService.findAll(page ?? 1, perPage ?? 10, {
            status,
            search,
        });
    }

    @Post(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateOrderStatusDto,
        @Request() req: any,
    ) {
        // Validate that id is a number
        const numId = Number(id);
        if (isNaN(numId) || !Number.isInteger(numId)) {
            throw new BadRequestException('Invalid order ID');
        }
        const userId = req.user?.userId ? BigInt(req.user.userId) : undefined;
        return this.ordersService.updateStatus(
            BigInt(id),
            dto.status,
            dto.meta,
            userId,
            'admin',
        );
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
        return this.ordersService.getStatistics(userId, { startDate, endDate });
    }

    @Get('report/export/pdf')
    async exportPdf(
        @Query('user_id', new ParseIntPipe({ optional: true }))
        userId: number | undefined,
        @Query('start_date')
        startDate: string | undefined,
        @Query('end_date')
        endDate: string | undefined,
        @Res() res: Response,
    ) {
        const pdfBuffer = await this.ordersService.exportStatisticsPDF(userId, {
            startDate,
            endDate,
        });
        const dateStr = new Date().toISOString().split('T')[0];
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="order-report-${dateStr}.pdf"`,
        );
        res.send(pdfBuffer);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        // Validate that id is a number, not a string like "statuses"
        // If it's not a number, let NestJS try the next route by returning 404
        const numId = Number(id);
        if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
            throw new NotFoundException('Order not found');
        }
        return this.ordersService.findOne(BigInt(id));
    }
}
