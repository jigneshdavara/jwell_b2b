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
import { StylesService } from './styles.service';
import {
    CreateStyleDto,
    UpdateStyleDto,
    BulkDestroyDto,
} from './dto/style.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/styles')
@UseGuards(JwtAuthGuard)
export class StylesController {
    constructor(private readonly stylesService: StylesService) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '10',
    ) {
        return this.stylesService.findAll(+page, +perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.stylesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateStyleDto) {
        return this.stylesService.create(dto);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStyleDto) {
        return this.stylesService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.stylesService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.stylesService.remove(id);
    }
}
