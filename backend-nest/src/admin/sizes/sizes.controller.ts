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
import { SizesService } from './sizes.service';
import { CreateSizeDto, UpdateSizeDto, BulkDestroyDto } from './dto/size.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/sizes')
@UseGuards(JwtAuthGuard)
export class SizesController {
    constructor(private readonly sizesService: SizesService) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '10',
    ) {
        return this.sizesService.findAll(+page, +perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.sizesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateSizeDto) {
        return this.sizesService.create(dto);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSizeDto) {
        return this.sizesService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.sizesService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.sizesService.remove(id);
    }
}
