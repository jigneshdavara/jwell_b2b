import {
    Controller,
    Get,
    Put,
    Body,
    UseGuards,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { GeneralSettingsService } from './general.service';
import { UpdateGeneralSettingsDto } from './dto/general-settings.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('admin/settings/general')
@UseGuards(JwtAuthGuard)
export class GeneralSettingsController {
    constructor(
        private readonly generalSettingsService: GeneralSettingsService,
    ) {}

    @Get()
    findAll() {
        return this.generalSettingsService.findAll();
    }

    @Put()
    @UseInterceptors(
        FileFieldsInterceptor(
            [
                { name: 'logo', maxCount: 1 },
                { name: 'favicon', maxCount: 1 },
            ],
            {
                storage: diskStorage({
                    destination: './public/storage/settings',
                    filename: (req, file, cb) => {
                        const randomName = Array(32)
                            .fill(null)
                            .map(() =>
                                Math.round(Math.random() * 16).toString(16),
                            )
                            .join('');
                        return cb(
                            null,
                            `${randomName}${extname(file.originalname)}`,
                        );
                    },
                }),
            },
        ),
    )
    update(
        @Body() dto: UpdateGeneralSettingsDto,
        @UploadedFiles()
        files?: {
            logo?: Express.Multer.File[];
            favicon?: Express.Multer.File[];
        },
    ) {
        // If new file uploaded, use the path; if remove flag set, use null; otherwise undefined (don't update)
        const logoPath = files?.logo?.[0]
            ? `storage/settings/${files.logo[0].filename}`
            : dto.remove_logo
              ? null
              : undefined;
        const faviconPath = files?.favicon?.[0]
            ? `storage/settings/${files.favicon[0].filename}`
            : dto.remove_favicon
              ? null
              : undefined;

        // Remove flags from DTO before passing to service
        const cleanDto = { ...dto };
        delete cleanDto.remove_logo;
        delete cleanDto.remove_favicon;

        return this.generalSettingsService.update(
            cleanDto,
            logoPath,
            faviconPath,
        );
    }
}
