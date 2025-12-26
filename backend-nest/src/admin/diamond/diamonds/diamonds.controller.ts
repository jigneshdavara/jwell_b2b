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
import { DiamondsService } from './diamonds.service';
import {
    CreateDiamondDto,
    UpdateDiamondDto,
    BulkDestroyDto,
} from './dto/diamond.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/auth/guards/admin.guard';

@Controller('admin/diamond/diamonds')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DiamondsController {
    constructor(private readonly diamondsService: DiamondsService) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '10',
    ) {
        return this.diamondsService.findAll(+page, +perPage);
    }

    @Get('shape-sizes/:shapeId')
    getShapeSizes(@Param('shapeId', ParseIntPipe) shapeId: number) {
        return this.diamondsService.getShapeSizes(shapeId);
    }

    @Get('clarities-by-type/:typeId')
    getClaritiesByType(@Param('typeId', ParseIntPipe) typeId: number) {
        return this.diamondsService.getClaritiesByType(typeId);
    }

    @Get('colors-by-type/:typeId')
    getColorsByType(@Param('typeId', ParseIntPipe) typeId: number) {
        return this.diamondsService.getColorsByType(typeId);
    }

    @Get('shapes-by-type/:typeId')
    getShapesByType(@Param('typeId', ParseIntPipe) typeId: number) {
        return this.diamondsService.getShapesByType(typeId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.diamondsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateDiamondDto) {
        return this.diamondsService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDiamondDto,
    ) {
        return this.diamondsService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.diamondsService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.diamondsService.remove(id);
    }
}
