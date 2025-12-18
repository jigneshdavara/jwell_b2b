import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { MetalTonesService } from './metal-tones.service';
import { CreateMetalToneDto, UpdateMetalToneDto, BulkDestroyDto } from './dto/metal-tone.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('admin/metal-tones')
@UseGuards(JwtAuthGuard)
export class MetalTonesController {
  constructor(private readonly metalTonesService: MetalTonesService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '10',
  ) {
    return this.metalTonesService.findAll(+page, +perPage);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.metalTonesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMetalToneDto) {
    return this.metalTonesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMetalToneDto) {
    return this.metalTonesService.update(id, dto);
  }

  @Delete('bulk')
  bulkRemove(@Body() dto: BulkDestroyDto) {
    return this.metalTonesService.bulkRemove(dto.ids);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.metalTonesService.remove(id);
  }
}
