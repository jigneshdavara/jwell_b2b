import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/offers')
@UseGuards(JwtAuthGuard, AdminGuard)
export class OffersController {
    constructor(private readonly offersService: OffersService) {}

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('per_page') perPage: number = 10,
    ) {
        return this.offersService.findAll(page, perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.offersService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateOfferDto) {
        return this.offersService.create(dto);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOfferDto) {
        return this.offersService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.offersService.remove(id);
    }

    @Get('code/:code')
    findByCode(@Param('code') code: string) {
        return this.offersService.findByCode(code);
    }
}
