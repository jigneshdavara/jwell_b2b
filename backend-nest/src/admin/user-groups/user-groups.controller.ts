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
import { UserGroupsService } from './user-groups.service';
import {
    CreateUserGroupDto,
    UpdateUserGroupDto,
    BulkDestroyUserGroupsDto,
    AssignUsersDto,
} from './dto/user-group.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/user-groups')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserGroupsController {
    constructor(private readonly userGroupsService: UserGroupsService) {}

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('per_page') perPage: number = 10,
    ) {
        return this.userGroupsService.findAll(page, perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userGroupsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateUserGroupDto) {
        return this.userGroupsService.create(dto);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserGroupDto,
    ) {
        return this.userGroupsService.update(id, dto);
    }

    @Delete('bulk')
    bulkDelete(@Body() dto: BulkDestroyUserGroupsDto) {
        return this.userGroupsService.bulkDelete(dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.userGroupsService.remove(id);
    }

    @Get(':id/assign-users')
    getUsersForAssignment(
        @Param('id', ParseIntPipe) id: number,
        @Query('search') search?: string,
    ) {
        return this.userGroupsService.getUsersForAssignment(id, search);
    }

    @Post(':id/assign-users')
    assignUsers(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AssignUsersDto,
    ) {
        return this.userGroupsService.assignUsers(id, dto.user_ids);
    }
}
