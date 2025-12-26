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
import { CatalogsService } from './catalogs.service';
import {
    CreateCatalogDto,
    UpdateCatalogDto,
    BulkDestroyCatalogsDto,
    AssignProductsToCatalogDto,
} from './dto/catalog.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/catalogs')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CatalogsController {
    constructor(private readonly catalogsService: CatalogsService) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '10',
    ) {
        return this.catalogsService.findAll(+page, +perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.catalogsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateCatalogDto) {
        return this.catalogsService.create(dto);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCatalogDto,
    ) {
        return this.catalogsService.update(id, dto);
    }

    @Delete('bulk')
    bulkDestroy(@Body() dto: BulkDestroyCatalogsDto) {
        return this.catalogsService.bulkDestroy(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.catalogsService.remove(id);
    }

    @Get(':id/assign-products')
    getProductsForAssignment(
        @Param('id', ParseIntPipe) id: number,
        @Query('search') search?: string,
    ) {
        return this.catalogsService.getProductsForAssignment(id, search);
    }

    @Post(':id/assign-products')
    assignProducts(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AssignProductsToCatalogDto,
    ) {
        return this.catalogsService.assignProducts(id, dto.product_ids);
    }
}
