import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { DiamondShapesService } from './diamond-shapes.service';
import { CreateDiamondShapeDto, UpdateDiamondShapeDto, BulkDestroyDto } from './dto/diamond-shape.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';

@Controller('admin/diamond/shapes')
@UseGuards(JwtAuthGuard)
export class DiamondShapesController {
  constructor(private readonly diamondShapesService: DiamondShapesService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '10',
  ) {
    return this.diamondShapesService.findAll(+page, +perPage);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.diamondShapesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDiamondShapeDto) {
    return this.diamondShapesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDiamondShapeDto) {
    return this.diamondShapesService.update(id, dto);
  }

  @Delete('bulk')
  bulkRemove(@Body() dto: BulkDestroyDto) {
    return this.diamondShapesService.bulkRemove(dto.ids);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.diamondShapesService.remove(id);
  }
}
