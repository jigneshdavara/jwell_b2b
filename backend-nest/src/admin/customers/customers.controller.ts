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
import { CustomersService } from './customers.service';
import {
    CustomerFilterDto,
    UpdateCustomerStatusDto,
    UpdateCustomerGroupDto,
} from './dto/customer.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) {}

    @Get()
    findAll(@Query() filters: CustomerFilterDto) {
        return this.customersService.findAll(filters);
    }

    @Post(':id/kyc-status')
    updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerStatusDto,
    ) {
        return this.customersService.updateStatus(id, dto);
    }

    @Post(':id/toggle-status')
    toggleStatus(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.toggleStatus(id);
    }

    @Patch(':id/group')
    updateGroup(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCustomerGroupDto,
    ) {
        return this.customersService.updateGroup(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.customersService.remove(id);
    }
}
