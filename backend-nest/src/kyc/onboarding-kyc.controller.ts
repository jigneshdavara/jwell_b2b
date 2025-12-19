import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    UploadedFile,
    UseInterceptors,
    Res,
    HttpCode,
    HttpStatus,
    UseFilters,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { KycService } from './kyc.service';
import {
    UpdateOnboardingKycProfileDto,
    StoreKycDocumentDto,
    SendKycMessageDto,
    KYC_DOCUMENT_TYPES,
} from './dto/onboarding-kyc.dto';
import { JwtAuthGuard } from '../common/auth/guards/jwt-auth.guard';
import { MulterExceptionFilter } from '../common/filters/multer-exception.filter';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { existsSync } from 'fs';

@Controller('onboarding/kyc')
@UseGuards(JwtAuthGuard)
export class OnboardingKycController {
    constructor(private readonly kycService: KycService) {}

    @Get()
    async show(@Request() req) {
        const userId = BigInt(req.user.userId);
        return this.kycService.getOnboardingData(userId);
    }

    @Patch('profile')
    @HttpCode(HttpStatus.OK)
    async updateProfile(
        @Request() req,
        @Body() dto: UpdateOnboardingKycProfileDto,
    ) {
        const userId = BigInt(req.user.userId);
        return this.kycService.updateOnboardingProfile(userId, dto);
    }

    @Post('documents')
    @UseFilters(MulterExceptionFilter)
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(
        FileInterceptor('document_file', {
            storage: diskStorage({
                destination: './uploads/kyc',
                filename: (req, file, cb) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    cb(null, `${randomName}${extname(file.originalname)}`);
                },
            }),
            limits: {
                fileSize: 8 * 1024 * 1024, // 8MB
            },
            fileFilter: (req, file, cb) => {
                const allowedMimes = [
                    'application/pdf',
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                ];
                if (allowedMimes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(
                        new Error(
                            'Invalid file type. Only PDF, JPEG, JPG, PNG allowed.',
                        ),
                        false,
                    );
                }
            },
        }),
    )
    async storeDocument(
        @Request() req,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: StoreKycDocumentDto,
    ) {
        if (!file) {
            throw new BadRequestException('Document file is required');
        }

        const userId = BigInt(req.user.userId);
        const relativePath = `kyc/${userId}/${file.filename}`;
        const fullPath = file.path;

        // Ensure directory exists
        const dir = `./uploads/kyc/${userId}`;
        if (!existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Move file to user-specific directory
        const targetPath = join(dir, file.filename);
        if (file.path !== targetPath) {
            fs.renameSync(file.path, targetPath);
        }

        return this.kycService.uploadOnboardingDocument(
            userId,
            dto.document_type,
            relativePath,
        );
    }

    @Delete('documents/:id')
    @HttpCode(HttpStatus.OK)
    async destroyDocument(@Request() req, @Param('id') id: string) {
        const userId = BigInt(req.user.userId);
        const documentId = BigInt(id);

        // Verify ownership
        const document = await this.kycService.getDocumentById(documentId);
        if (document.user_id.toString() !== userId.toString()) {
            throw new ForbiddenException(
                'You do not have permission to delete this document',
            );
        }

        return this.kycService.deleteOnboardingDocument(userId, documentId);
    }

    @Get('documents/:id/download')
    async downloadDocument(
        @Request() req,
        @Param('id') id: string,
        @Res() res: Response,
    ) {
        const userId = BigInt(req.user.userId);
        const documentId = BigInt(id);

        // Verify ownership
        const document = await this.kycService.getDocumentById(documentId);
        if (document.user_id.toString() !== userId.toString()) {
            throw new ForbiddenException(
                'You do not have permission to download this document',
            );
        }

        if (
            !document.file_path ||
            !existsSync(`./uploads/${document.file_path}`)
        ) {
            throw new NotFoundException('Document file not found');
        }

        const filePath = join(process.cwd(), 'uploads', document.file_path);
        const fileName = `${document.type}-${filePath.split('/').pop()}`;

        res.download(filePath, fileName);
    }

    @Post('messages')
    @HttpCode(HttpStatus.CREATED)
    async storeMessage(@Request() req, @Body() dto: SendKycMessageDto) {
        const userId = BigInt(req.user.userId);
        return this.kycService.sendOnboardingMessage(userId, dto.message);
    }

    @Get('document-types')
    getDocumentTypes() {
        return {
            documentTypes: KYC_DOCUMENT_TYPES,
        };
    }
}
