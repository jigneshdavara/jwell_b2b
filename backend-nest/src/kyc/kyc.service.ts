import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UpdateKycProfileDto, UpdateKycStatusDto } from './dto/kyc.dto';
import { UpdateOnboardingKycProfileDto } from './dto/onboarding-kyc.dto';
import * as fs from 'fs';
import { existsSync } from 'fs';

@Injectable()
export class KycService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {}

    async getProfile(userId: bigint) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                type: true,
                kyc_status: true,
                business_name: true,
                business_website: true,
                gst_number: true,
                pan_number: true,
                registration_number: true,
                address_line1: true,
                address_line2: true,
                city: true,
                state: true,
                postal_code: true,
                country: true,
                contact_name: true,
                contact_phone: true,
                kyc_metadata: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Generate access token (same format as login)
        const payload = {
            email: user.email,
            sub: user.id.toString(),
            type: user.type,
            guard: 'user',
            kyc_status: user.kyc_status,
        };

        const access_token = this.jwtService.sign(payload);

        return {
            ...user,
            access_token,
        };
    }

    async updateProfile(userId: bigint, dto: UpdateKycProfileDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return await this.prisma.user.update({
            where: { id: userId },
            data: {
                business_name: dto.business_name,
                business_website: dto.business_website,
                gst_number: dto.gst_number,
                pan_number: dto.pan_number,
                registration_number: dto.registration_number,
                address_line1: dto.address_line1,
                address_line2: dto.address_line2,
                city: dto.city,
                state: dto.state,
                postal_code: dto.postal_code,
                country: dto.country,
                contact_name: dto.contact_name,
                contact_phone: dto.contact_phone,
            },
        });
    }

    async uploadDocument(userId: bigint, type: string, filePath: string) {
        return await this.prisma.user_kyc_documents.create({
            data: {
                user_id: userId,
                type,
                file_path: filePath,
                status: 'pending',
            },
        });
    }

    async getDocuments(userId: bigint) {
        return await this.prisma.user_kyc_documents.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });
    }

    async updateStatus(
        userId: bigint,
        dto: UpdateKycStatusDto,
        adminId?: bigint,
    ) {
        return await this.prisma.$transaction(async (tx) => {
            // Update user status
            await tx.user.update({
                where: { id: userId },
                data: { kyc_status: dto.status },
            });

            // Verify if adminId exists in User table to avoid FK violation
            let validAdminId: bigint | undefined = undefined;
            if (adminId) {
                const adminUser = await tx.user.findUnique({
                    where: { id: adminId },
                });
                if (adminUser) {
                    validAdminId = adminId;
                }
            }

            // Log the status change in messages (audit trail)
            if (dto.remarks || dto.status) {
                await tx.user_kyc_messages.create({
                    data: {
                        user_id: userId,
                        admin_id: validAdminId, // Use valid admin ID or null
                        sender_type: 'admin', // sender_type must be 'admin' or 'user'
                        message: `KYC Status updated to ${dto.status}. Remarks: ${dto.remarks || 'None'}`,
                    },
                });
            }

            return { status: dto.status };
        });
    }

    async getMessages(userId: bigint) {
        return await this.prisma.user_kyc_messages.findMany({
            where: { user_id: userId },
            include: {
                users: {
                    select: { name: true },
                },
            },
            orderBy: { created_at: 'asc' },
        });
    }

    async addMessage(userId: bigint, message: string, adminId?: bigint) {
        return await this.prisma.user_kyc_messages.create({
            data: {
                user_id: userId,
                admin_id: adminId,
                sender_type: adminId ? 'admin' : 'user',
                message,
            },
        });
    }

    // Onboarding-specific methods
    async getOnboardingData(userId: bigint) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                user_kyc_documents: {
                    orderBy: { created_at: 'desc' },
                },
                user_kyc_messages: {
                    include: {
                        admins: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                    orderBy: { created_at: 'asc' },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            user: {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                phone: user.phone,
                type: user.type,
                kyc_status: user.kyc_status,
                kyc_notes: user.kyc_notes,
                kyc_comments_enabled: user.kyc_comments_enabled,
            },
            profile: {
                business_name: user.business_name,
                business_website: user.business_website,
                gst_number: user.gst_number,
                pan_number: user.pan_number,
                registration_number: user.registration_number,
                address_line1: user.address_line1,
                address_line2: user.address_line2,
                city: user.city,
                state: user.state,
                postal_code: user.postal_code,
                country: user.country,
                contact_name: user.contact_name,
                contact_phone: user.contact_phone,
            },
            documents: user.user_kyc_documents.map((doc) => ({
                id: doc.id.toString(),
                type: doc.type,
                status: doc.status,
                remarks: doc.remarks,
                url: doc.file_path ? `/${doc.file_path}` : null,
                download_url: `/api/onboarding/kyc/documents/${doc.id}/download`,
                uploaded_at: doc.created_at?.toISOString(),
            })),
            documentTypes: [
                'gst_certificate',
                'trade_license',
                'pan_card',
                'aadhaar',
                'bank_statement',
                'store_photos',
            ],
            messages: user.user_kyc_messages.map((msg) => ({
                id: msg.id.toString(),
                sender_type: msg.sender_type,
                message: msg.message,
                created_at: msg.created_at?.toISOString(),
                admin: msg.admins
                    ? {
                          id: msg.admins.id.toString(),
                          name: msg.admins.name,
                      }
                    : null,
            })),
            can_user_reply: user.kyc_comments_enabled,
        };
    }

    async updateOnboardingProfile(
        userId: bigint,
        dto: UpdateOnboardingKycProfileDto,
    ) {
        return await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const updated = await tx.user.update({
                where: { id: userId },
                data: {
                    business_name: dto.business_name,
                    business_website: dto.business_website,
                    gst_number: dto.gst_number,
                    pan_number: dto.pan_number,
                    registration_number: dto.registration_number,
                    address_line1: dto.address_line1,
                    address_line2: dto.address_line2,
                    city: dto.city,
                    state: dto.state,
                    postal_code: dto.postal_code,
                    country: dto.country,
                    contact_name: dto.contact_name,
                    contact_phone: dto.contact_phone,
                    kyc_status:
                        user.kyc_status !== 'approved'
                            ? 'pending'
                            : user.kyc_status,
                    kyc_notes:
                        user.kyc_status !== 'approved' ? null : user.kyc_notes,
                },
            });

            return updated;
        });
    }

    async uploadOnboardingDocument(
        userId: bigint,
        type: string,
        filePath: string,
    ) {
        return await this.prisma.$transaction(async (tx) => {
            const document = await tx.user_kyc_documents.create({
                data: {
                    user_id: userId,
                    type,
                    file_path: filePath,
                    status: 'pending',
                },
            });

            // Mark user as pending if not already approved
            const user = await tx.user.findUnique({
                where: { id: userId },
            });

            if (user && user.kyc_status !== 'approved') {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        kyc_status: 'pending',
                        kyc_notes: null,
                    },
                });
            }

            return document;
        });
    }

    async deleteOnboardingDocument(userId: bigint, documentId: bigint) {
        return await this.prisma.$transaction(async (tx) => {
            const document = await tx.user_kyc_documents.findUnique({
                where: { id: documentId },
            });

            if (!document) {
                throw new NotFoundException('Document not found');
            }

            // Delete file if exists
            // file_path is stored as storage/kyc/{userId}/{filename}
            if (document.file_path) {
                const filePath = `./public/${document.file_path}`;
                if (existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            await tx.user_kyc_documents.delete({
                where: { id: documentId },
            });

            // Mark user as pending if not already approved
            const user = await tx.user.findUnique({
                where: { id: userId },
            });

            if (user && user.kyc_status !== 'approved') {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        kyc_status: 'pending',
                        kyc_notes: null,
                    },
                });
            }

            return { message: 'Document deleted successfully' };
        });
    }

    async sendOnboardingMessage(userId: bigint, message: string) {
        return await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            if (!user.kyc_comments_enabled) {
                throw new ForbiddenException(
                    'Comments are disabled for your account',
                );
            }

            const kycMessage = await tx.user_kyc_messages.create({
                data: {
                    user_id: userId,
                    sender_type: 'user',
                    message: message.trim(),
                },
            });

            // Update status to review if not already approved or in review
            if (
                user.kyc_status !== 'approved' &&
                user.kyc_status !== 'review'
            ) {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        kyc_status: 'review',
                    },
                });
            }

            return kycMessage;
        });
    }

    async getDocumentById(documentId: bigint) {
        const document = await this.prisma.user_kyc_documents.findUnique({
            where: { id: documentId },
        });

        if (!document) {
            throw new NotFoundException('Document not found');
        }

        return document;
    }
}
