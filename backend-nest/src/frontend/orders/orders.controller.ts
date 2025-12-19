import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { FrontendOrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { KycApprovedGuard } from '../../kyc/guards/kyc-approved.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard, KycApprovedGuard)
export class FrontendOrdersController {
    constructor(private ordersService: FrontendOrdersService) {}

    @Get()
    async index(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('per_page') perPage?: string,
    ) {
        const userId = BigInt(req.user.userId);
        const pageNumber = page ? parseInt(page, 10) : 1;
        const perPageNumber = perPage ? parseInt(perPage, 10) : 15;

        const result = await this.ordersService.findAll(
            userId,
            pageNumber,
            perPageNumber,
        );

        return {
            orders: result,
        };
    }

    @Get(':id')
    async show(
        @Param('id', ParseIntPipe) id: number,
        @Request() req: any,
    ) {
        const orderId = BigInt(id);
        const userId = BigInt(req.user.userId);

        const order = await this.ordersService.findOne(orderId, userId);

        return {
            order,
        };
    }
}

