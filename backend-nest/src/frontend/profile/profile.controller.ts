import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto, DeleteProfileDto, ProfileResponseDto } from './dto/profile.dto';
import { JwtAuthGuard } from '../../common/auth/guards/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
    constructor(private profileService: ProfileService) {}

    @Get()
    async getProfile(@Request() req: any): Promise<ProfileResponseDto> {
        const userId = BigInt(req.user.userId);
        return await this.profileService.getProfile(userId);
    }

    @Patch()
    async updateProfile(
        @Body() dto: UpdateProfileDto,
        @Request() req: any,
    ): Promise<ProfileResponseDto> {
        const userId = BigInt(req.user.userId);
        return await this.profileService.updateProfile(userId, dto);
    }

    @Delete()
    async deleteProfile(
        @Body() dto: DeleteProfileDto,
        @Request() req: any,
    ): Promise<{ message: string }> {
        const userId = BigInt(req.user.userId);
        return await this.profileService.deleteProfile(userId, dto.password);
    }
}

