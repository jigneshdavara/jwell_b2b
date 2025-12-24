import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Request,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto, UpdatePasswordDto, DeleteProfileDto, ProfileResponseDto } from './dto/profile.dto';
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

    @Patch('password')
    async updatePassword(
        @Body() dto: UpdatePasswordDto,
        @Request() req: any,
    ): Promise<{ message: string }> {
        // Validate password confirmation
        if (dto.password !== dto.password_confirmation) {
            throw new BadRequestException('Passwords do not match');
        }

        const userId = BigInt(req.user.userId);
        return await this.profileService.updatePassword(
            userId,
            dto.current_password,
            dto.password,
        );
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

