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
import { DiamondClaritiesService } from './diamond-clarities.service';
import {
    CreateDiamondClarityDto,
    UpdateDiamondClarityDto,
    BulkDestroyDto,
} from './dto/diamond-clarity.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/auth/guards/admin.guard';

@Controller('admin/diamond/clarities')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DiamondClaritiesController {
    constructor(
        private readonly diamondClaritiesService: DiamondClaritiesService,
    ) {}

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('per_page') perPage: number = 10,
    ) {
        return this.diamondClaritiesService.findAll(page, perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.diamondClaritiesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateDiamondClarityDto) {
        return this.diamondClaritiesService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDiamondClarityDto,
    ) {
        return this.diamondClaritiesService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.diamondClaritiesService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.diamondClaritiesService.remove(id);
    }
}
