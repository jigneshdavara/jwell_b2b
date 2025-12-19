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

    async remove(id: number) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: BigInt(id) },
        });
        if (!customer) throw new NotFoundException('Customer not found');

        return await this.prisma.customer.delete({
            where: { id: BigInt(id) },
        });
    }
}
