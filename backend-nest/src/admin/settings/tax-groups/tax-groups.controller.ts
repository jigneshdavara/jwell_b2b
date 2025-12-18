import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TaxGroupsService } from './tax-groups.service';
import { CreateTaxGroupDto, UpdateTaxGroupDto } from './dto/tax-group.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';

@Controller('admin/settings/tax-groups')
@UseGuards(JwtAuthGuard)
export class TaxGroupsController {
  constructor(private readonly taxGroupsService: TaxGroupsService) {}

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('per_page') perPage: string = '20',
  ) {
    return this.taxGroupsService.findAll(+page, +perPage);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taxGroupsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTaxGroupDto) {
    return this.taxGroupsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaxGroupDto) {
    return this.taxGroupsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.taxGroupsService.remove(id);
  }
}
