import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Body,
    UseGuards,
    Request,
    NotFoundException,
    ParseIntPipe,
    HttpCode,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogFilterDto, CalculatePriceDto } from './dto/catalog.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../kyc/guards/kyc-approved.guard';

@Controller('catalog')
@UseGuards(JwtAuthGuard, KycApprovedGuard)
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) {}

    @Get()
    async index(@Query() filters: CatalogFilterDto, @Request() req) {
        const userId = req.user?.userId ? BigInt(req.user.userId) : undefined;
        return this.catalogService.findAll(filters, userId);
    }

    @Get(':id')
    async show(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
    ) {
        try {
            const userId = req.user?.userId ? BigInt(req.user.userId) : undefined;
            return await this.catalogService.findOne(BigInt(id), userId);
        } catch (error) {
            if (error.message === 'Product not found') {
                throw new NotFoundException('Product not found');
            }
            throw error;
        }
    }

    @Post(':id/calculate-price')
    @HttpCode(201)
    async calculatePrice(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CalculatePriceDto,
        @Request() req,
    ) {
        try {
            const userId = req.user?.userId ? BigInt(req.user.userId) : undefined;
            return await this.catalogService.calculatePrice(
                BigInt(id),
                dto,
                userId,
            );
        } catch (error) {
            if (error.message === 'Product not found') {
                throw new NotFoundException('Product not found');
            }
            throw error;
        }
    }
}

