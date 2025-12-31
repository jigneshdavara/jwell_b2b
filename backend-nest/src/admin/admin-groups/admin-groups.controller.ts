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
import { AdminGroupsService } from './admin-groups.service';
import {
    CreateAdminGroupDto,
    UpdateAdminGroupDto,
    BulkDestroyDto,
    AssignAdminsDto,
} from './dto/admin-group.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/admin-groups')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminGroupsController {
    constructor(private readonly adminGroupsService: AdminGroupsService) {}

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('per_page') perPage: number = 10,
    ) {
        return this.adminGroupsService.findAll(page, perPage);
    }

    @Post()
    create(@Body() dto: CreateAdminGroupDto) {
        return this.adminGroupsService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateAdminGroupDto,
    ) {
        return this.adminGroupsService.update(id, dto);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.adminGroupsService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.adminGroupsService.remove(id);
    }

    @Get(':id/assign-admins')
    getAdminsForAssignment(
        @Param('id', ParseIntPipe) id: number,
        @Query('page') page: number = 1,
        @Query('per_page') perPage: number = 10,
        @Query('search') search?: string,
    ) {
        return this.adminGroupsService.getAdminsForAssignment(
            id,
            page,
            perPage,
            search,
        );
    }

    @Post(':id/assign-admins')
    assignAdmins(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AssignAdminsDto,
    ) {
        return this.adminGroupsService.assignAdmins(id, dto.admin_ids);
    }
}
