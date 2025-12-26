import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { RatesService } from './rates.service';
import { UpdateMetalRatesDto } from './dto/rate.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/rates')
@UseGuards(JwtAuthGuard, AdminGuard)
export class RatesController {
    constructor(private readonly ratesService: RatesService) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '10',
    ) {
        return this.ratesService.findAll(+page, +perPage);
    }

    @Post('sync/:metal')
    syncWithMetal(@Param('metal') metal: string) {
        return this.ratesService.sync(metal);
    }

    @Post('sync')
    syncAll() {
        return this.ratesService.sync();
    }

    @Post(':metal/store')
    storeMetalRates(
        @Param('metal') metal: string,
        @Body() dto: UpdateMetalRatesDto,
    ) {
        return this.ratesService.storeMetalRates(metal, dto);
    }
}
