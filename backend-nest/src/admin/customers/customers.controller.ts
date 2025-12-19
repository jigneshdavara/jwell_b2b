import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerFilterDto, UpdateCustomerStatusDto, UpdateCustomerGroupDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@Query() filters: CustomerFilterDto) {
    return this.customersService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Post(':id/kyc-status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCustomerStatusDto) {
    return this.customersService.updateStatus(id, dto);
  }

  @Post(':id/toggle-status')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.toggleStatus(id);
  }

  @Patch(':id/group')
  updateGroup(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCustomerGroupDto) {
    return this.customersService.updateGroup(id, dto);
  }

  @Post(':id/kyc-messages')
  addKycMessage(@Param('id', ParseIntPipe) id: number, @Body('message') message: string, @Request() req: any) {
    const adminId = req.user?.userId ? BigInt(req.user.userId) : null;
    return this.customersService.addKycMessage(id, message, adminId);
  }

  @Patch(':id/kyc-documents/:docId')
  updateDocumentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('docId', ParseIntPipe) docId: number,
    @Body() body: { status: string; remarks?: string }
  ) {
    return this.customersService.updateDocumentStatus(id, docId, body.status, body.remarks);
  }

  @Post(':id/kyc-comments')
  toggleKycComments(@Param('id', ParseIntPipe) id: number, @Body('allow_replies') allowReplies: boolean) {
    return this.customersService.toggleKycComments(id, allowReplies);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.remove(id);
  }
}
