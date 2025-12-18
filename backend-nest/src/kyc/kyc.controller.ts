import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  UseGuards, 
  Request, 
  UploadedFile, 
  UseInterceptors,
  ParseIntPipe
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { UpdateKycProfileDto, UpdateKycStatusDto } from './dto/kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const userId = BigInt(req.user.userId);
    return this.kycService.getProfile(userId);
  }

  @Patch('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateKycProfileDto) {
    const userId = BigInt(req.user.userId);
    return this.kycService.updateProfile(userId, dto);
  }

  @Get('documents')
  async getDocuments(@Request() req) {
    const userId = BigInt(req.user.userId);
    return this.kycService.getDocuments(userId);
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/kyc',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadDocument(@Request() req, @UploadedFile() file: Express.Multer.File, @Body('type') type: string) {
    const userId = BigInt(req.user.userId);
    return this.kycService.uploadDocument(userId, type, file.path);
  }

  @Get('messages')
  async getMessages(@Request() req) {
    const userId = BigInt(req.user.userId);
    return this.kycService.getMessages(userId);
  }

  @Post('messages')
  async addMessage(@Request() req, @Body('message') message: string) {
    const userId = BigInt(req.user.userId);
    return this.kycService.addMessage(userId, message);
  }

  // Admin Routes (Should be protected by a RoleGuard later)
  @Patch(':id/status')
  async updateStatus(
    @Request() req, 
    @Param('id') id: string, 
    @Body() dto: UpdateKycStatusDto
  ) {
    const userId = BigInt(id);
    const adminId = BigInt(req.user.userId); // Assuming admin is also using JWT
    return this.kycService.updateStatus(userId, dto, adminId);
  }
}
