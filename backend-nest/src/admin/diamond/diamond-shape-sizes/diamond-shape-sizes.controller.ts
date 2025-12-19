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
import { DiamondShapeSizesService } from './diamond-shape-sizes.service';
import {
    CreateDiamondShapeSizeDto,
    UpdateDiamondShapeSizeDto,
    BulkDestroyDto,
} from './dto/diamond-shape-size.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';

@Controller('admin/diamond/shape-sizes')
@UseGuards(JwtAuthGuard)
export class DiamondShapeSizesController {
    constructor(
        private readonly diamondShapeSizesService: DiamondShapeSizesService,
    ) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '10',
    ) {
        return this.diamondShapeSizesService.findAll(+page, +perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.diamondShapeSizesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateDiamondShapeSizeDto) {
        return this.diamondShapeSizesService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDiamondShapeSizeDto,
    ) {
        return this.diamondShapeSizesService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.diamondShapeSizesService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.diamondShapeSizesService.remove(id);
    }
}
