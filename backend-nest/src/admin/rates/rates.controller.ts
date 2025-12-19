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

@Controller('admin/rates')
@UseGuards(JwtAuthGuard)
export class RatesController {
    constructor(private readonly ratesService: RatesService) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '20',
    ) {
        return this.ratesService.findAll(+page, +perPage);
    }

    @Post(':metal/store')
    storeMetalRates(
        @Param('metal') metal: string,
        @Body() dto: UpdateMetalRatesDto,
    ) {
        return this.ratesService.storeMetalRates(metal, dto);
    }
}
