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
import { BrandsService } from './brands.service';
import {
    CreateBrandDto,
    UpdateBrandDto,
    BulkDestroyDto,
} from './dto/brand.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('admin/brands')
@UseGuards(JwtAuthGuard)
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) {}

    @Get()
    findAll(
        @Query('page') page: string = '1',
        @Query('per_page') perPage: string = '10',
    ) {
        return this.brandsService.findAll(+page, +perPage);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.brandsService.findOne(id);
    }

    @Post()
    @UseInterceptors(
        FileInterceptor('cover_image', {
            storage: diskStorage({
                destination: './public/brands',
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
        @Body() dto: CreateBrandDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const imagePath = file ? `brands/${file.filename}` : undefined;
        return this.brandsService.create(dto, imagePath);
    }

    @Patch(':id')
    @UseInterceptors(
        FileInterceptor('cover_image', {
            storage: diskStorage({
                destination: './public/brands',
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
        @Body() dto: UpdateBrandDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        const imagePath = file ? `brands/${file.filename}` : undefined;
        return this.brandsService.update(id, dto, imagePath);
    }

    @Delete('bulk')
    bulkRemove(@Body() dto: BulkDestroyDto) {
        return this.brandsService.bulkRemove(dto.ids);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.brandsService.remove(id);
    }
}
