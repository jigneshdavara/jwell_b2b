import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TeamUsersService } from './team-users.service';
import { CreateTeamUserDto, UpdateTeamUserDto, UpdateUserGroupDto, BulkDestroyDto } from './dto/team-user.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/team-users')
@UseGuards(JwtAuthGuard)
export class TeamUsersController {
  constructor(private readonly teamUsersService: TeamUsersService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '20',
  ) {
    return this.teamUsersService.findAll(+page, +perPage);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamUsersService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTeamUserDto) {
    return this.teamUsersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeamUserDto) {
    return this.teamUsersService.update(id, dto);
  }

  @Patch(':id/group')
  updateGroup(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserGroupDto) {
    return this.teamUsersService.updateGroup(id, dto);
  }

  @Delete('bulk')
  bulkRemove(@Body() dto: BulkDestroyDto) {
    return this.teamUsersService.bulkRemove(dto.ids);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teamUsersService.remove(id);
  }
}
