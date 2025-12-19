import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CustomerFilterDto,
    UpdateCustomerStatusDto,
    UpdateCustomerGroupDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
    constructor(private prisma: PrismaService) {}

    async findAll(filters: CustomerFilterDto) {
        const {
            page = 1,
            per_page = 20,
            search,
            status,
            customer_group_id,
            type,
            only_active,
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

        if (customer_group_id) {
            where.AND.push({ customer_group_id: BigInt(customer_group_id) });
        }

        if (type) {
            where.AND.push({ type: type });
        }

        if (only_active) {
            where.AND.push({ is_active: true });
        }

        const [items, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                skip,
                take: per_page,
                include: {
                    customer_groups: {
                        select: { id: true, name: true },
                    },
                    kycProfile: {
                        select: {
                            business_name: true,
                            city: true,
                            state: true,
                        },
                    },
                    _count: {
                        select: { user_kyc_documents: true },
                    },
                },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.customer.count({ where }),
        ]);

        // Map to match Laravel response structure
        const formattedItems = items.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.type,
            is_active: user.is_active,
            kyc_status: user.kyc_status,
            kyc_notes: user.kyc_notes,
            kyc_document_count: user._count.user_kyc_documents,
            customer_group: user.customer_groups
                ? {
                      id: user.customer_groups.id,
                      name: user.customer_groups.name,
                  }
                : null,
            kyc_profile:
                user.kycProfile && user.kycProfile.length > 0
                    ? {
                          business_name: user.kycProfile[0].business_name,
                          city: user.kycProfile[0].city,
                          state: user.kycProfile[0].state,
                      }
                    : null,
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
            this.prisma.customer.count(),
            this.prisma.customer.count({ where: { kyc_status: 'pending' } }),
            this.prisma.customer.count({ where: { kyc_status: 'review' } }),
            this.prisma.customer.count({ where: { kyc_status: 'approved' } }),
            this.prisma.customer.count({ where: { kyc_status: 'rejected' } }),
        ]);

        return {
            total,
            pending,
            review,
            approved,
            rejected,
        };
    }

    async updateStatus(id: number, dto: UpdateCustomerStatusDto) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: BigInt(id) },
        });
        if (!customer) throw new NotFoundException('Customer not found');

        return await this.prisma.customer.update({
            where: { id: BigInt(id) },
            data: {
                kyc_status: dto.kyc_status,
                kyc_notes: dto.kyc_notes,
            },
        });
    }

    async updateGroup(id: number, dto: UpdateCustomerGroupDto) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: BigInt(id) },
        });
        if (!customer) throw new NotFoundException('Customer not found');

        return await this.prisma.customer.update({
            where: { id: BigInt(id) },
            data: {
                customer_group_id: BigInt(dto.customer_group_id),
            },
        });
    }

    async toggleStatus(id: number) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: BigInt(id) },
        });
        if (!customer) throw new NotFoundException('Customer not found');

        return await this.prisma.customer.update({
            where: { id: BigInt(id) },
            data: {
                is_active: !customer.is_active,
            },
        });
    }

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: per_page,
        include: {
          customer_groups: {
            select: { id: true, name: true }
          },
          kycProfile: {
            select: { business_name: true, city: true, state: true }
          },
          _count: {
            select: { user_kyc_documents: true }
          }
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.customer.count({ where }),
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
      customer_group: user.customer_groups ? {
        id: Number(user.customer_groups.id),
        name: user.customer_groups.name,
      } : null,
      kyc_profile: user.kycProfile && user.kycProfile.length > 0 ? {
        business_name: user.kycProfile[0].business_name,
        city: user.kycProfile[0].city,
        state: user.kycProfile[0].state,
      } : null,
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
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { kyc_status: 'pending' } }),
      this.prisma.customer.count({ where: { kyc_status: 'review' } }),
      this.prisma.customer.count({ where: { kyc_status: 'approved' } }),
      this.prisma.customer.count({ where: { kyc_status: 'rejected' } }),
    ]);

    return {
      total,
      pending,
      review,
      approved,
      rejected,
    };
  }

  async updateStatus(id: number, dto: UpdateCustomerStatusDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('Customer not found');

    return await this.prisma.customer.update({
      where: { id: BigInt(id) },
      data: {
        kyc_status: dto.kyc_status,
        kyc_notes: dto.kyc_notes,
      },
    });
  }

  async updateGroup(id: number, dto: UpdateCustomerGroupDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('Customer not found');

    return await this.prisma.customer.update({
      where: { id: BigInt(id) },
      data: {
        customer_group_id: BigInt(dto.customer_group_id),
      },
    });
  }

  async toggleStatus(id: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('Customer not found');

    return await this.prisma.customer.update({
      where: { id: BigInt(id) },
      data: {
        is_active: !customer.is_active,
      },
    });
  }

  async findOne(id: number) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: BigInt(id) },
      include: {
        customer_groups: {
          select: { id: true, name: true }
        },
        kycProfile: {
          select: {
            id: true,
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
            metadata: true,
            created_at: true,
            updated_at: true,
          }
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
      throw new NotFoundException('Customer not found');
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
      customer_group: cust.customer_groups ? {
        id: Number(cust.customer_groups.id),
        name: cust.customer_groups.name,
      } : null,
      kyc_profile: cust.kycProfile && cust.kycProfile.length > 0 ? {
        id: Number(cust.kycProfile[0].id),
        business_name: cust.kycProfile[0].business_name,
        business_website: cust.kycProfile[0].business_website,
        gst_number: cust.kycProfile[0].gst_number,
        pan_number: cust.kycProfile[0].pan_number,
        registration_number: cust.kycProfile[0].registration_number,
        address_line1: cust.kycProfile[0].address_line1,
        address_line2: cust.kycProfile[0].address_line2,
        city: cust.kycProfile[0].city,
        state: cust.kycProfile[0].state,
        postal_code: cust.kycProfile[0].postal_code,
        country: cust.kycProfile[0].country,
        contact_name: cust.kycProfile[0].contact_name,
        contact_phone: cust.kycProfile[0].contact_phone,
        metadata: cust.kycProfile[0].metadata,
        created_at: cust.kycProfile[0].created_at,
        updated_at: cust.kycProfile[0].updated_at,
      } : null,
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
    const customer = await this.prisma.customer.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('Customer not found');

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
    const customer = await this.prisma.customer.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('Customer not found');

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
    const customer = await this.prisma.customer.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('Customer not found');

    return await this.prisma.customer.update({
      where: { id: BigInt(id) },
      data: {
        kyc_comments_enabled: allowReplies,
      },
    });
  }

  async remove(id: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: BigInt(id) } });
    if (!customer) throw new NotFoundException('Customer not found');

    return await this.prisma.customer.delete({
      where: { id: BigInt(id) },
    });
  }
}
