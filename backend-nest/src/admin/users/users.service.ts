import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
    UserFilterDto,
    UpdateUserStatusDto,
    BulkDeleteUsersDto,
    BulkGroupUpdateDto,
} from './dto/user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findAll(filters: UserFilterDto) {
        const {
            page = 1,
            per_page = 10,
            search,
            status,
            user_group_id,
            type,
            only_active,
        } = filters;

        const skip = (page - 1) * per_page;

        const andConditions: Prisma.UserWhereInput[] = [];

        if (search) {
            andConditions.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (status) {
            andConditions.push({ kyc_status: status });
        }

        if (user_group_id) {
            andConditions.push({ user_group_id: BigInt(user_group_id) });
        }

        if (type) {
            andConditions.push({ type: type });
        }

        if (only_active) {
            andConditions.push({ is_active: true });
        }

        const where: Prisma.UserWhereInput =
            andConditions.length > 0 ? { AND: andConditions } : {};

        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: per_page,
                include: {
                    user_groups: {
                        select: { id: true, name: true },
                    },
                    _count: {
                        select: { user_kyc_documents: true },
                    },
                },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        // Map to match Laravel response structure
        const formattedItems = items.map((user) => ({
            id: Number(user.id),
            name: user.name,
            email: user.email,
            type: user.type,
            is_active: user.is_active,
            kyc_status: user.kyc_status,
            kyc_notes: user.kyc_notes,
            kyc_document_count: user._count.user_kyc_documents,
            customer_group: user.user_groups
                ? {
                      id: Number(user.user_groups.id),
                      name: user.user_groups.name,
                  }
                : null,
            kyc_profile: {
                business_name: user.business_name,
                city: user.city,
                state: user.state,
            },
            joined_at: user.created_at,
        }));

        const stats = await this.getStats();

        return {
            items: formattedItems,
            stats,
            meta: {
                total,
                page,
                perPage: per_page,
                lastPage: Math.ceil(total / per_page),
            },
        };
    }

    async getStats() {
        const [total, pending, review, approved, rejected] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { kyc_status: 'pending' } }),
            this.prisma.user.count({ where: { kyc_status: 'review' } }),
            this.prisma.user.count({ where: { kyc_status: 'approved' } }),
            this.prisma.user.count({ where: { kyc_status: 'rejected' } }),
        ]);

        return {
            total,
            pending,
            review,
            approved,
            rejected,
        };
    }

    async updateStatus(
        id: number,
        dto: UpdateUserStatusDto,
        adminId: bigint | null,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
        });
        if (!user) throw new NotFoundException('User not found');

        return await this.prisma.$transaction(async (tx) => {
            const updatedCustomer = await tx.user.update({
                where: { id: BigInt(id) },
                data: {
                    kyc_status: dto.kyc_status,
                    kyc_notes: dto.kyc_notes,
                },
            });

            // Add an audit trail message
            await tx.user_kyc_messages.create({
                data: {
                    user_id: BigInt(id),
                    admin_id: adminId,
                    sender_type: 'admin',
                    message: `KYC status updated to '${dto.kyc_status}'. ${dto.kyc_notes ? `Notes: ${dto.kyc_notes}` : ''}`,
                },
            });

            return updatedCustomer;
        });
    }

    async toggleStatus(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
        });
        if (!user) throw new NotFoundException('User not found');

        return await this.prisma.user.update({
            where: { id: BigInt(id) },
            data: {
                is_active: !user.is_active,
            },
        });
    }

    async findOne(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
            include: {
                user_groups: {
                    select: { id: true, name: true },
                },
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
                    orderBy: { created_at: 'desc' },
                },
                _count: {
                    select: {
                        user_kyc_documents: true,
                        user_kyc_messages: true,
                    },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            id: Number(user.id),
            name: user.name,
            email: user.email,
            phone: user.phone,
            type: user.type,
            is_active: user.is_active,
            kyc_status: user.kyc_status,
            kyc_notes: user.kyc_notes,
            kyc_comments_enabled: user.kyc_comments_enabled,
            customer_group: user.user_groups
                ? {
                      id: Number(user.user_groups.id),
                      name: user.user_groups.name,
                  }
                : null,
            kyc_profile: {
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
                metadata: user.kyc_metadata,
            },
            kyc_documents: (user.user_kyc_documents || []).map((doc) => ({
                id: Number(doc.id),
                type: doc.type,
                file_path: doc.file_path,
                file_name: doc.file_path
                    ? doc.file_path.split('/').pop() || doc.file_path
                    : null,
                status: doc.status || 'pending',
                remarks: doc.remarks,
                created_at: doc.created_at,
            })),
            kyc_messages: (user.user_kyc_messages || []).map((msg) => ({
                id: Number(msg.id),
                message: msg.message,
                is_admin: msg.sender_type === 'admin',
                sender_type: msg.sender_type,
                admin: msg.users
                    ? {
                          id: Number(msg.users.id),
                          name: msg.users.name,
                      }
                    : null,
                created_at: msg.created_at,
            })),
            kyc_document_count: user._count?.user_kyc_documents || 0,
            kyc_message_count: user._count?.user_kyc_messages || 0,
            joined_at: user.created_at,
            created_at: user.created_at,
            updated_at: user.updated_at,
        };
    }

    async addKycMessage(
        id: number,
        message: string,
        adminId: bigint | null = null,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
        });
        if (!user) throw new NotFoundException('User not found');

        return await this.prisma.user_kyc_messages.create({
            data: {
                user_id: BigInt(id),
                message,
                sender_type: 'admin',
                admin_id: adminId,
            },
        });
    }

    async updateDocumentStatus(
        id: number,
        docId: number,
        status: string,
        remarks?: string,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
        });
        if (!user) throw new NotFoundException('User not found');

        const document = await this.prisma.user_kyc_documents.findUnique({
            where: { id: BigInt(docId) },
        });
        if (!document || document.user_id !== BigInt(id)) {
            throw new NotFoundException('Document not found');
        }

        return await this.prisma.user_kyc_documents.update({
            where: { id: BigInt(docId) },
            data: {
                status,
                remarks: remarks || null,
            },
        });
    }

    async toggleKycComments(id: number, allowReplies: boolean) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
        });
        if (!user) throw new NotFoundException('User not found');

        return await this.prisma.user.update({
            where: { id: BigInt(id) },
            data: {
                kyc_comments_enabled: allowReplies,
            },
        });
    }

    async remove(id: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: BigInt(id) },
        });
        if (!user) throw new NotFoundException('User not found');

        await this.prisma.user.delete({
            where: { id: BigInt(id) },
        });

        return { success: true, message: 'User removed successfully' };
    }

    async bulkDelete(dto: BulkDeleteUsersDto) {
        if (!dto.ids || dto.ids.length === 0) {
            throw new BadRequestException('No users to delete');
        }

        const ids = dto.ids.map((id) => BigInt(id));
        await this.prisma.user.deleteMany({
            where: {
                id: { in: ids },
            },
        });

        return { success: true, message: 'Users deleted successfully' };
    }

    async bulkGroupUpdate(dto: BulkGroupUpdateDto) {
        if (!dto.ids || dto.ids.length === 0) {
            return { updated: 0 };
        }

        const ids = dto.ids.map((id) => BigInt(id));
        const updateData: Prisma.UserUpdateManyMutationInput & {
            user_group_id?: bigint | null;
        } = {};

        if (dto.user_group_id !== undefined && dto.user_group_id !== null) {
            updateData.user_group_id = BigInt(dto.user_group_id);
        } else {
            updateData.user_group_id = null;
        }

        await this.prisma.user.updateMany({
            where: {
                id: { in: ids },
            },
            data: updateData,
        });

        return { success: true, message: 'Users updated successfully' };
    }
}
