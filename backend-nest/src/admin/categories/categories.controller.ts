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
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CategoriesService } from './categories.service';
import {
    CreateCategoryDto,
    UpdateCategoryDto,
    BulkDestroyDto,
} from './dto/category.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/auth/guards/admin.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '10',
    ) {
        return this.categoriesService.findAll(+page, +perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.findOne(id);
    }

    @Post()
    @UseInterceptors(
        FileInterceptor('cover_image', {
            storage: diskStorage({
                destination: './public/storage/categories',
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
    )
    create(
        @Body() dto: CreateCategoryDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const imagePath = file
            ? `storage/categories/${file.filename}`
            : undefined;
        return this.categoriesService.create(dto, imagePath);
    }

    @Patch(':id')
    @UseInterceptors(
        FileInterceptor('cover_image', {
            storage: diskStorage({
                destination: './public/storage/categories',
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
    )
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateCategoryDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const imagePath = file
            ? `storage/categories/${file.filename}`
            : undefined;
        return this.categoriesService.update(id, dto, imagePath);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.categoriesService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.categoriesService.remove(id);
    }
}
