import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, ParseIntPipe, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto, BulkActionDto, BulkStatusDto } from './dto/product.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Controller('admin/products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() filters: ProductFilterDto) {
    return this.productsService.findAll(filters);
  }

  @Get('options')
  getFormOptions() {
    return this.productsService.getFormOptions();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('media_uploads', 10, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = './public/storage/products';
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() mediaFiles: Express.Multer.File[]
  ) {
    // Transform stringified fields from multipart/form-data
    if (typeof dto.variants === 'string') dto.variants = JSON.parse(dto.variants);
    if (typeof dto.catalog_ids === 'string') dto.catalog_ids = JSON.parse(dto.catalog_ids);
    if (typeof dto.category_ids === 'string') dto.category_ids = JSON.parse(dto.category_ids);
    if (typeof dto.style_ids === 'string') dto.style_ids = JSON.parse(dto.style_ids);
    if (typeof dto.making_charge_types === 'string') dto.making_charge_types = JSON.parse(dto.making_charge_types);
    if (typeof dto.metadata === 'string') dto.metadata = JSON.parse(dto.metadata);

    return this.productsService.create(dto, mediaFiles);
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('media_uploads', 10, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = './public/storage/products';
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() mediaFiles: Express.Multer.File[]
  ) {
    // Transform stringified fields from multipart/form-data
    if (typeof dto.variants === 'string') dto.variants = JSON.parse(dto.variants);
    if (typeof dto.catalog_ids === 'string') dto.catalog_ids = JSON.parse(dto.catalog_ids);
    if (typeof dto.category_ids === 'string') dto.category_ids = JSON.parse(dto.category_ids);
    if (typeof dto.style_ids === 'string') dto.style_ids = JSON.parse(dto.style_ids);
    if (typeof dto.making_charge_types === 'string') dto.making_charge_types = JSON.parse(dto.making_charge_types);
    if (typeof dto.metadata === 'string') dto.metadata = JSON.parse(dto.metadata);
    if (typeof dto.removed_media_ids === 'string') dto.removed_media_ids = JSON.parse(dto.removed_media_ids);

    return this.productsService.update(id, dto, mediaFiles);
  }

  @Post(':id/copy')
  copy(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.copy(id);
  }

  @Post('bulk/status')
  bulkStatus(@Body() dto: BulkStatusDto) {
    return this.productsService.bulkStatus(dto.ids, dto.action);
  }

  @Delete('bulk')
  bulkDestroy(@Body() dto: BulkActionDto) {
    return this.productsService.bulkDestroy(dto.ids);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
