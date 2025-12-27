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
import { DiamondTypesService } from './diamond-types.service';
import {
    CreateDiamondTypeDto,
    UpdateDiamondTypeDto,
    BulkDestroyDto,
} from './dto/diamond-type.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../../common/auth/guards/admin.guard';

@Controller('admin/diamond/types')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DiamondTypesController {
    constructor(private readonly diamondTypesService: DiamondTypesService) {}

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('per_page') perPage: number = 10,
    ) {
        return this.diamondTypesService.findAll(page, perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.diamondTypesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateDiamondTypeDto) {
        return this.diamondTypesService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDiamondTypeDto,
    ) {
        return this.diamondTypesService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.diamondTypesService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.diamondTypesService.remove(id);
    }
}
