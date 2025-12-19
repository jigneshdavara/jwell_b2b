import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UserGroupsService } from './user-groups.service';
import { CreateUserGroupDto, UpdateUserGroupDto, BulkDestroyDto } from './dto/user-group.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/user-groups')
@UseGuards(JwtAuthGuard)
export class UserGroupsController {
  constructor(private readonly userGroupsService: UserGroupsService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '20',
  ) {
    return this.userGroupsService.findAll(+page, +perPage);
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
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserGroupDto) {
    return this.userGroupsService.update(id, dto);
  }

  @Delete('bulk')
  bulkRemove(@Body() dto: BulkDestroyDto) {
    return this.userGroupsService.bulkRemove(dto.ids);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userGroupsService.remove(id);
  }
}
