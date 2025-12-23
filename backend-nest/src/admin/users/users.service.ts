import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserFilterDto, UpdateUserStatusDto, UpdateUserGroupDto, BulkDeleteUsersDto, BulkGroupUpdateDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: UserFilterDto) {
    const { 
      page = 1, 
      per_page = 20, 
      search, 
      status, 
      user_group_id, 
      type, 
      only_active 
    } = filters;

    const skip = (page - 1) * per_page;

    const where: any = {
      AND: [],
    };

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (status) {
      where.AND.push({ kyc_status: status });
    }

    if (user_group_id) {
      where.AND.push({ user_group_id: BigInt(user_group_id) });
    }

    if (type) {
      where.AND.push({ type: type });
    }

    if (only_active) {
      where.AND.push({ is_active: true });
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: per_page,
        include: {
          user_groups: {
            select: { id: true, name: true }
          },
          _count: {
            select: { user_kyc_documents: true }
          }
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Map to match Laravel response structure
    const formattedItems = items.map(user => ({
      id: Number(user.id),
      name: user.name,
      email: user.email,
      type: user.type,
      is_active: user.is_active,
      kyc_status: user.kyc_status,
      kyc_notes: user.kyc_notes,
      kyc_document_count: user._count.user_kyc_documents,
      customer_group: user.user_groups ? {
        id: Number(user.user_groups.id),
        name: user.user_groups.name,
      } : null,
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

  async updateStatus(id: number, dto: UpdateUserStatusDto) {
    const customer = await this.prisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('User? not found');

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
          sender_type: 'admin',
          message: `KYC status updated to '${dto.kyc_status}'. Notes: ${dto.kyc_notes || 'N/A'}`,
        },
      });

      return updatedCustomer;
    });
  }

  async updateGroup(id: number, dto: UpdateUserGroupDto) {
    const customer = await this.prisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('User? not found');

    return await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        user_group_id: BigInt(dto.user_group_id),
      },
    });
  }

  async toggleStatus(id: number) {
    const customer = await this.prisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('User? not found');

    return await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        is_active: !customer.is_active,
      },
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
      include: {
        user_groups: {
          select: { id: true, name: true }
        },
        user_kyc_documents: {
          orderBy: { created_at: 'desc' }
        },
        user_kyc_messages: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: { created_at: 'desc' }
        },
        _count: {
          select: { user_kyc_documents: true, user_kyc_messages: true }
        }
      },
    });

    if (!customer) {
      throw new NotFoundException('User? not found');
    }

    // Type assertion to handle Prisma include types - Prisma types may not include all relations
    const cust = customer as any;

    return {
      id: Number(cust.id),
      name: cust.name,
      email: cust.email,
      phone: cust.phone,
      type: cust.type,
      is_active: cust.is_active,
      kyc_status: cust.kyc_status,
      kyc_notes: cust.kyc_notes,
      kyc_comments_enabled: cust.kyc_comments_enabled,
      customer_group: cust.user_groups ? {
        id: Number(cust.user_groups.id),
        name: cust.user_groups.name,
      } : null,
      kyc_profile: {
        business_name: cust.business_name,
        business_website: cust.business_website,
        gst_number: cust.gst_number,
        pan_number: cust.pan_number,
        registration_number: cust.registration_number,
        address_line1: cust.address_line1,
        address_line2: cust.address_line2,
        city: cust.city,
        state: cust.state,
        postal_code: cust.postal_code,
        country: cust.country,
        contact_name: cust.contact_name,
        contact_phone: cust.contact_phone,
        metadata: cust.kyc_metadata,
      },
      kyc_documents: (cust.user_kyc_documents || []).map((doc: any) => ({
        id: Number(doc.id),
        type: doc.type,
        file_path: doc.file_path,
        file_name: doc.file_path ? doc.file_path.split('/').pop() || doc.file_path : null,
        status: doc.status || 'pending',
        remarks: doc.remarks,
        created_at: doc.created_at,
      })),
      kyc_messages: (cust.user_kyc_messages || []).map((msg: any) => ({
        id: Number(msg.id),
        message: msg.message,
        is_admin: msg.sender_type === 'admin',
        sender_type: msg.sender_type,
        admin: msg.users ? {
          id: Number(msg.users.id),
          name: msg.users.name,
        } : null,
        created_at: msg.created_at,
      })),
      kyc_document_count: cust._count?.user_kyc_documents || 0,
      kyc_message_count: cust._count?.user_kyc_messages || 0,
      joined_at: cust.created_at,
      created_at: cust.created_at,
      updated_at: cust.updated_at,
    };
  }

  async addKycMessage(id: number, message: string, adminId: bigint | null = null) {
    const customer = await this.prisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('User? not found');

    return await this.prisma.user_kyc_messages.create({
      data: {
        user_id: BigInt(id),
        message,
        sender_type: 'admin',
        admin_id: adminId,
      },
    });
  }

  async updateDocumentStatus(id: number, docId: number, status: string, remarks?: string) {
    const customer = await this.prisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('User? not found');

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
    const customer = await this.prisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('User? not found');

    return await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        kyc_comments_enabled: allowReplies,
      },
    });
  }

  async remove(id: number) {
    const customer = await this.prisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('User? not found');

    return await this.prisma.user.delete({
      where: { id: BigInt(id) },
    });
  }

  async bulkDelete(dto: BulkDeleteUsersDto) {
    if (!dto.ids || dto.ids.length === 0) {
      return { deleted: 0 };
    }

    const ids = dto.ids.map(id => BigInt(id));
    const result = await this.prisma.user.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return { deleted: result.count };
  }

  async bulkGroupUpdate(dto: BulkGroupUpdateDto) {
    if (!dto.ids || dto.ids.length === 0) {
      return { updated: 0 };
    }

    const ids = dto.ids.map(id => BigInt(id));
    const updateData: any = {};
    
    if (dto.user_group_id !== undefined && dto.user_group_id !== null) {
      updateData.user_group_id = BigInt(dto.user_group_id);
    } else {
      updateData.user_group_id = null;
    }

    const result = await this.prisma.user.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    });

    return { updated: result.count };
  }
}