import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateKycProfileDto, UpdateKycStatusDto } from './dto/kyc.dto';
import { UpdateOnboardingKycProfileDto } from './dto/onboarding-kyc.dto';
import * as fs from 'fs';
import { existsSync } from 'fs';

@Injectable()
export class KycService {
    constructor(private prisma: PrismaService) {}

    async getProfile(userId: bigint) {
        const profile = await this.prisma.userKycProfile.findFirst({
            where: { user_id: userId },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        kyc_status: true,
                    },
                },
            },
        });

        if (!profile) {
            throw new NotFoundException('KYC profile not found');
        }

        return profile;
    }

    async updateProfile(userId: bigint, dto: UpdateKycProfileDto) {
        // Since user_id is not marked as @unique in Prisma but is logically unique,
        // we use updateMany or find first then update by id.
        const profile = await this.prisma.userKycProfile.findFirst({
            where: { user_id: userId },
        });

        if (!profile) {
            throw new NotFoundException('KYC profile not found');
        }

        return await this.prisma.userKycProfile.update({
            where: { id: profile.id },
            data: {
                ...dto,
                updated_at: new Date(),
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
            // Update customer status
            await tx.customer.update({
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
                        sender_type: 'admin', // sender_type must be 'admin' or 'customer'
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
                sender_type: adminId ? 'admin' : 'customer',
                message,
            },
        });
    }

    // Onboarding-specific methods
    async getOnboardingData(userId: bigint) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: userId },
            include: {
                kycProfile: true,
                user_kyc_documents: {
                    orderBy: { created_at: 'desc' },
                },
                user_kyc_messages: {
                    include: {
                        users: {
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

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        // Auto-create profile if it doesn't exist
        // kycProfile is an array in Prisma schema, but should only have one item
        let profile = customer.kycProfile?.[0] || null;
        if (!profile) {
            profile = await this.prisma.userKycProfile.create({
                data: {
                    user_id: userId,
                    business_name: `${customer.name} Enterprises`,
                    country: 'India',
                    contact_name: customer.name,
                    contact_phone: customer.phone || null,
                },
            });
        }

        return {
            user: {
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                type: customer.type,
                kyc_status: customer.kyc_status,
                kyc_notes: customer.kyc_notes,
            },
            profile: profile
                ? {
                      business_name: profile.business_name,
                      business_website: profile.business_website,
                      gst_number: profile.gst_number,
                      pan_number: profile.pan_number,
                      registration_number: profile.registration_number,
                      address_line1: profile.address_line1,
                      address_line2: profile.address_line2,
                      city: profile.city,
                      state: profile.state,
                      postal_code: profile.postal_code,
                      country: profile.country,
                      contact_name: profile.contact_name,
                      contact_phone: profile.contact_phone,
                  }
                : null,
            documents: customer.user_kyc_documents.map((doc) => ({
                id: doc.id.toString(),
                type: doc.type,
                status: doc.status,
                remarks: doc.remarks,
                url: doc.file_path ? `/uploads/${doc.file_path}` : null,
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
            messages: customer.user_kyc_messages.map((msg) => ({
                id: msg.id.toString(),
                sender_type: msg.sender_type,
                message: msg.message,
                created_at: msg.created_at?.toISOString(),
                admin: msg.users
                    ? {
                          id: msg.users.id.toString(),
                          name: msg.users.name,
                      }
                    : null,
            })),
            can_customer_reply: customer.kyc_comments_enabled,
        };
    }

    async updateOnboardingProfile(
        userId: bigint,
        dto: UpdateOnboardingKycProfileDto,
    ) {
        return await this.prisma.$transaction(async (tx) => {
            let profile = await tx.userKycProfile.findFirst({
                where: { user_id: userId },
            });

            if (!profile) {
                profile = await tx.userKycProfile.create({
                    data: {
                        user_id: userId,
                        ...dto,
                    },
                });
            } else {
                profile = await tx.userKycProfile.update({
                    where: { id: profile.id },
                    data: {
                        ...dto,
                        updated_at: new Date(),
                    },
                });
            }

            // Mark user as pending if not already approved
            const customer = await tx.customer.findUnique({
                where: { id: userId },
            });

            if (customer && customer.kyc_status !== 'approved') {
                await tx.customer.update({
                    where: { id: userId },
                    data: {
                        kyc_status: 'pending',
                        kyc_notes: null,
                    },
                });
            }

            return profile;
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
            const customer = await tx.customer.findUnique({
                where: { id: userId },
            });

            if (customer && customer.kyc_status !== 'approved') {
                await tx.customer.update({
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
            if (document.file_path) {
                const filePath = `./uploads/${document.file_path}`;
                if (existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            await tx.user_kyc_documents.delete({
                where: { id: documentId },
            });

            // Mark user as pending if not already approved
            const customer = await tx.customer.findUnique({
                where: { id: userId },
            });

            if (customer && customer.kyc_status !== 'approved') {
                await tx.customer.update({
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
            const customer = await tx.customer.findUnique({
                where: { id: userId },
            });

            if (!customer) {
                throw new NotFoundException('Customer not found');
            }

            if (!customer.kyc_comments_enabled) {
                throw new ForbiddenException(
                    'Comments are disabled for your account',
                );
            }

            const kycMessage = await tx.user_kyc_messages.create({
                data: {
                    user_id: userId,
                    sender_type: 'customer',
                    message: message.trim(),
                },
            });

            // Update status to review if not already approved or in review
            if (
                customer.kyc_status !== 'approved' &&
                customer.kyc_status !== 'review'
            ) {
                await tx.customer.update({
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
