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
import { MetalPuritiesService } from './metal-purities.service';
import {
    CreateMetalPurityDto,
    UpdateMetalPurityDto,
    BulkDestroyDto,
} from './dto/metal-purity.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/metal-purities')
@UseGuards(JwtAuthGuard, AdminGuard)
export class MetalPuritiesController {
    constructor(private readonly metalPuritiesService: MetalPuritiesService) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '10',
    ) {
        return this.metalPuritiesService.findAll(+page, +perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.metalPuritiesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateMetalPurityDto) {
        return this.metalPuritiesService.create(dto);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateMetalPurityDto,
    ) {
        return this.metalPuritiesService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.metalPuritiesService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.metalPuritiesService.remove(id);
    }
}
