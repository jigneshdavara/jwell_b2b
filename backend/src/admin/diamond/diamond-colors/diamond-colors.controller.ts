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
import { DiamondColorsService } from './diamond-colors.service';
import {
    CreateDiamondColorDto,
    UpdateDiamondColorDto,
    BulkDestroyDto,
} from './dto/diamond-color.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/auth/guards/admin.guard';

@Controller('admin/diamond/colors')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DiamondColorsController {
    constructor(private readonly diamondColorsService: DiamondColorsService) {}

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('per_page') perPage: number = 10,
    ) {
        return this.diamondColorsService.findAll(page, perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.diamondColorsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateDiamondColorDto) {
        return this.diamondColorsService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDiamondColorDto,
    ) {
        return this.diamondColorsService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.diamondColorsService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.diamondColorsService.remove(id);
    }
}
