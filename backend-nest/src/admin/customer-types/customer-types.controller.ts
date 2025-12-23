import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { CustomerTypesService } from './customer-types.service';
import {
    CreateCustomerTypeDto,
    UpdateCustomerTypeDto,
    BulkDestroyDto,
} from './dto/customer-type.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/customer-types')
@UseGuards(JwtAuthGuard)
export class CustomerTypesController {
    constructor(
        private readonly customerTypesService: CustomerTypesService,
    ) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '20',
    ) {
        return this.customerTypesService.findAll(+page, +perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.customerTypesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateCustomerTypeDto) {
        return this.customerTypesService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerTypeDto,
    ) {
        return this.customerTypesService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.customerTypesService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.customerTypesService.remove(id);
    }
}

