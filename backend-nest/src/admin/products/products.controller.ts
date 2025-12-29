import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseIntPipe,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import {
    CreateProductDto,
    UpdateProductDto,
    BulkDestroyDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';
import { FormDataToJsonInterceptor } from '../../common/interceptors/formdata-to-json.interceptor';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Get()
    findAll(
        @Query('page') page: number = 1,
        @Query('per_page') perPage: number = 10,
    ) {
        return this.productsService.findAll(page, perPage);
    }

    @Get('options')
    getOptions() {
        return this.productsService.getOptions();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.findOne(id);
    }

    @Post()
    @UseInterceptors(
        FilesInterceptor('media_uploads', 20, {
            storage: diskStorage({
                destination: './public/storage/products',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    return cb(
                        null,
                        `${randomName}${extname(file.originalname)}`,
                    );
                },
            }),
        }),
        FormDataToJsonInterceptor,
    )
    create(
        @Body() dto: CreateProductDto,
        @UploadedFiles() files?: Express.Multer.File[],
    ) {
        const mediaFiles = files
            ? files.map((file) => `storage/products/${file.filename}`)
            : [];
        return this.productsService.create(dto, mediaFiles);
    }

    @Patch(':id')
    @UseInterceptors(
        FilesInterceptor('media_uploads', 20, {
            storage: diskStorage({
                destination: './public/storage/products',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    return cb(
                        null,
                        `${randomName}${extname(file.originalname)}`,
                    );
                },
            }),
        }),
        FormDataToJsonInterceptor,
    )
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProductDto,
        @UploadedFiles() files?: Express.Multer.File[],
    ) {
        const mediaFiles = files
            ? files.map((file) => `storage/products/${file.filename}`)
            : [];
        return this.productsService.update(id, dto, mediaFiles);
    }

    @Delete('bulk')
    @UseInterceptors(FormDataToJsonInterceptor)
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.productsService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productsService.remove(id);
    }
}
