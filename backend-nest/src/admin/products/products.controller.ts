import {
    Controller,
    Get,
    Post,
    Body,
    Put,
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
import { ProductsService } from './products.service';
import {
    CreateProductDto,
    UpdateProductDto,
    ProductFilterDto,
    BulkActionDto,
    BulkStatusDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';
import { TransformMultipartInterceptor } from '../../common/interceptors/transform-multipart.interceptor';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, AdminGuard)
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
    @UseInterceptors(
        FilesInterceptor('media_uploads', 10, {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const dir = './public/storage/products';
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    cb(null, dir);
                },
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
        TransformMultipartInterceptor, // Transform multipart/form-data strings to proper types
    )
    create(
        @Body() dto: CreateProductDto,
        @UploadedFiles() mediaFiles: Express.Multer.File[],
    ) {
        return this.productsService.create(dto, mediaFiles);
    }

    @Put(':id')
    @UseInterceptors(
        FilesInterceptor('media_uploads', 10, {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const dir = './public/storage/products';
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    cb(null, dir);
                },
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
        TransformMultipartInterceptor, // Transform multipart/form-data strings to proper types
    )
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProductDto,
        @UploadedFiles() mediaFiles: Express.Multer.File[],
    ) {
        return this.productsService.update(id, dto, mediaFiles);
    }

    @Patch(':id')
    @UseInterceptors(
        FilesInterceptor('media_uploads', 10, {
            storage: diskStorage({
                destination: (req, file, cb) => {
                    const dir = './public/storage/products';
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    cb(null, dir);
                },
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
        TransformMultipartInterceptor, // Transform multipart/form-data strings to proper types
    )
    patch(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProductDto,
        @UploadedFiles() mediaFiles: Express.Multer.File[],
    ) {
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
