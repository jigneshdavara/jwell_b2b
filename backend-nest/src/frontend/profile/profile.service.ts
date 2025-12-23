import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto, ProfileResponseDto } from './dto/profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
    constructor(private prisma: PrismaService) {}

    async getProfile(userId: bigint): Promise<ProfileResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            preferred_language: user.preferred_language,
            email_verified_at: user.email_verified_at?.toISOString() || null,
            type: user.type,
            kyc_status: user.kyc_status,
            is_active: user.is_active,
            created_at: user.created_at?.toISOString() || new Date().toISOString(),
            updated_at: user.updated_at?.toISOString() || new Date().toISOString(),
        };
    }

    async updateProfile(
        userId: bigint,
        dto: UpdateProfileDto,
    ): Promise<ProfileResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if email is being changed
        const emailChanged = dto.email.toLowerCase() !== user.email.toLowerCase();

        // Check email uniqueness if email is being changed
        if (emailChanged) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    email: dto.email.toLowerCase(),
                    id: { not: userId },
                },
            });

            if (existingUser) {
                throw new ConflictException('Email is already taken');
            }
        }

        // Prepare update data
        const updateData: any = {
            name: dto.name,
            email: dto.email.toLowerCase(),
            phone: dto.phone || null,
            preferred_language: dto.preferred_language || null,
            updated_at: new Date(),
        };

        // If email changed, reset email verification
        if (emailChanged) {
            updateData.email_verified_at = null;
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return {
            id: updatedUser.id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            preferred_language: updatedUser.preferred_language,
            email_verified_at: updatedUser.email_verified_at?.toISOString() || null,
            type: updatedUser.type,
            kyc_status: updatedUser.kyc_status,
            is_active: updatedUser.is_active,
            created_at: updatedUser.created_at?.toISOString() || new Date().toISOString(),
            updated_at: updatedUser.updated_at?.toISOString() || new Date().toISOString(),
        };
    }

    async deleteProfile(
        userId: bigint,
        password: string,
    ): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Verify password
        const isPasswordValid = await this.verifyPassword(
            password,
            user.password,
        );

        if (!isPasswordValid) {
            throw new BadRequestException('Password is incorrect');
        }

        // Delete user account
        await this.prisma.user.delete({
            where: { id: userId },
        });

        return { message: 'Your account has been deleted.' };
    }

    private async verifyPassword(
        plainPassword: string,
        hashedPassword: string,
    ): Promise<boolean> {
        try {
            // Handle Laravel's $2y$ format
            // Convert $2y$ to $2a$ or $2b$ for bcrypt compatibility (both work)
            let dbHash = hashedPassword;
            if (dbHash.startsWith('$2y$')) {
                dbHash = dbHash.replace(/^\$2y\$/, '$2a$');
            }

            return await bcrypt.compare(plainPassword, dbHash);
        } catch (error) {
            return false;
        }
    }
}

