import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserFilterDto, UpdateUserStatusDto, UpdateUserGroupDto, BulkDeleteUsersDto, BulkGroupUpdateDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() filters: UserFilterDto) {
    return this.usersService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post(':id/kyc-status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(id, dto);
  }

  @Post(':id/toggle-status')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleStatus(id);
  }

  @Patch(':id/group')
  updateGroup(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserGroupDto) {
    return this.usersService.updateGroup(id, dto);
  }

  @Post(':id/kyc-messages')
  addKycMessage(@Param('id', ParseIntPipe) id: number, @Body('message') message: string, @Request() req: any) {
    const adminId = req.user?.userId ? BigInt(req.user.userId) : null;
    return this.usersService.addKycMessage(id, message, adminId);
  }

  @Patch(':id/kyc-documents/:docId')
  updateDocumentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @Body() body: { status: string; remarks?: string }
  ) {
    return this.usersService.updateDocumentStatus(id, docId, body.status, body.remarks);
  }

  @Post(':id/kyc-comments')
  toggleKycComments(@Param('id', ParseIntPipe) id: number, @Body('allow_replies') allowReplies: boolean) {
    return this.usersService.toggleKycComments(id, allowReplies);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }

  @Delete('bulk')
  bulkDelete(@Body() dto: BulkDeleteUsersDto) {
    return this.usersService.bulkDelete(dto);
  }

  @Post('bulk/group')
  bulkGroupUpdate(@Body() dto: BulkGroupUpdateDto) {
    return this.usersService.bulkGroupUpdate(dto);
  }
}