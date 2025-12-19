import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { MakingChargeDiscountsService } from './making-charge-discounts.service';
import { CreateMakingChargeDiscountDto, UpdateMakingChargeDiscountDto, BulkDestroyDto } from './dto/making-charge-discount.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';

@Controller('admin/offers/making-charge-discounts')
@UseGuards(JwtAuthGuard)
export class MakingChargeDiscountsController {
  constructor(private readonly discountsService: MakingChargeDiscountsService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '20',
  ) {
    return this.discountsService.findAll(+page, +perPage);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.discountsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMakingChargeDiscountDto) {
    return this.discountsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMakingChargeDiscountDto) {
    return this.discountsService.update(id, dto);
  }

  @Delete('bulk')
  bulkRemove(@Body() dto: BulkDestroyDto) {
    return this.discountsService.bulkRemove(dto.ids);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.discountsService.remove(id);
  }
}
