import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    ParseIntPipe,
    Res,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { InvoicesService } from './invoices.service';
import {
    CreateInvoiceDto,
    UpdateInvoiceDto,
} from './dto/invoice.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/invoices')
@UseGuards(JwtAuthGuard, AdminGuard)
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateInvoiceDto) {
        return this.invoicesService.create(dto);
    }

    @Get('order/:orderId')
    async findByOrderId(@Param('orderId') orderId: string) {
        const numId = Number(orderId);
        if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
            throw new BadRequestException('Invalid order ID');
        }
        const invoice = await this.invoicesService.findByOrderId(BigInt(orderId));
        return invoice || { exists: false };
    }

    @Get()
    async findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('per_page', new ParseIntPipe({ optional: true }))
        perPage?: number,
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('order_id', new ParseIntPipe({ optional: true })) orderId?: number,
    ) {
        return this.invoicesService.findAll(page ?? 1, perPage ?? 10, {
            status,
            search,
            order_id: orderId,
        });
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const numId = Number(id);
        if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
            throw new BadRequestException('Invalid invoice ID');
        }
        return this.invoicesService.findOne(BigInt(id));
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateInvoiceDto,
    ) {
        const numId = Number(id);
        if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
            throw new BadRequestException('Invalid invoice ID');
        }
        return this.invoicesService.update(BigInt(id), dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async delete(@Param('id') id: string) {
        const numId = Number(id);
        if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
            throw new BadRequestException('Invalid invoice ID');
        }
        return this.invoicesService.delete(BigInt(id));
    }

    @Get(':id/pdf')
    async downloadPdf(@Param('id') id: string, @Res() res: Response) {
        const numId = Number(id);
        if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
            throw new BadRequestException('Invalid invoice ID');
        }
        const pdfBuffer = await this.invoicesService.generatePdf(BigInt(id));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="invoice-${id}.pdf"`,
        );
        res.send(pdfBuffer);
    }

}

