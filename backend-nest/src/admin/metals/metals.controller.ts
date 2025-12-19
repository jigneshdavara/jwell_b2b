import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { MetalsService } from './metals.service';
import { CreateMetalDto, UpdateMetalDto, BulkDestroyDto } from './dto/metal.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/metals')
@UseGuards(JwtAuthGuard)
export class MetalsController {
  constructor(private readonly metalsService: MetalsService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '10',
  ) {
    return this.metalsService.findAll(+page, +perPage);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.metalsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMetalDto) {
    return this.metalsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMetalDto) {
    return this.metalsService.update(id, dto);
  }

  @Delete('bulk')
  bulkRemove(@Body() dto: BulkDestroyDto) {
    return this.metalsService.bulkRemove(dto.ids);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.metalsService.remove(id);
  }
}
