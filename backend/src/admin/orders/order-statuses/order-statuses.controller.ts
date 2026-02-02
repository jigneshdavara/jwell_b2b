import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
    BadRequestException,
} from '@nestjs/common';
import { OrderStatusesService } from './order-statuses.service';
import {
    CreateOrderStatusDto,
    UpdateOrderStatusDto,
    BulkDestroyOrderStatusesDto,
} from './dto/order-status.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/auth/guards/admin.guard';

@Controller('admin/orders/statuses')
@UseGuards(JwtAuthGuard, AdminGuard)
export class OrderStatusesController {
    constructor(private readonly orderStatusesService: OrderStatusesService) {}

    @Get()
    async findAll(
        @Query('page', new ParseIntPipe({ optional: true })) page?: number,
        @Query('per_page', new ParseIntPipe({ optional: true }))
        perPage?: number,
    ) {
        return this.orderStatusesService.findAll(page ?? 1, perPage ?? 10);
    }

    @Post()
    async create(@Body() dto: CreateOrderStatusDto) {
        return this.orderStatusesService.create(dto);
    }

    @Delete('bulk')
    async bulkDestroy(@Body() dto: BulkDestroyOrderStatusesDto) {
        return this.orderStatusesService.bulkDestroy(dto);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
        // Validate that id is a number, not a string like "bulk"
        const numId = Number(id);
        if (isNaN(numId) || !Number.isInteger(numId)) {
            throw new BadRequestException('Invalid status ID');
        }
        return this.orderStatusesService.update(BigInt(id), dto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        // Validate that id is a number, not a string like "bulk"
        const numId = Number(id);
        if (isNaN(numId) || !Number.isInteger(numId)) {
            throw new BadRequestException('Invalid status ID');
        }
        return this.orderStatusesService.remove(BigInt(id));
    }
}
