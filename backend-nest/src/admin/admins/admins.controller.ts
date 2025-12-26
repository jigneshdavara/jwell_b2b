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
import { AdminsService } from './admins.service';
import {
    CreateAdminDto,
    UpdateAdminDto,
    UpdateAdminGroupDto,
    BulkDestroyDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/admins')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '20',
    ) {
        return this.adminsService.findAll(+page, +perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.adminsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateAdminDto) {
        return this.adminsService.create(dto);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminDto) {
        return this.adminsService.update(id, dto);
    }

    @Patch(':id/group')
    updateGroup(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateAdminGroupDto,
    ) {
        return this.adminsService.updateGroup(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.adminsService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.adminsService.remove(id);
    }
}
