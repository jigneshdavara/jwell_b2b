import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateMakingChargeDiscountDto,
    UpdateMakingChargeDiscountDto,
} from './dto/making-charge-discount.dto';

@Injectable()
export class MakingChargeDiscountsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 10) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.making_charge_discounts.findMany({
                skip,
                take: perPage,
                include: {
                    brands: { select: { id: true, name: true } },
                    categories: { select: { id: true, name: true } },
                    user_groups: { select: { id: true, name: true } },
                } as any,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.making_charge_discounts.count(),
        ]);

        // Format items to match Laravel response structure
        const formattedItems = items.map((item) => {
            const itemWithRelations = item as typeof item & {
                brands?: { id: bigint; name: string } | null;
                categories?: { id: bigint; name: string } | null;
                user_groups?: { id: bigint; name: string } | null;
            };
            return {
                ...item,
                id: Number(item.id),
                brand: itemWithRelations.brands
                    ? {
                          id: Number(itemWithRelations.brands.id),
                          name: itemWithRelations.brands.name,
                      }
                    : null,
                category: itemWithRelations.categories
                    ? {
                          id: Number(itemWithRelations.categories.id),
                          name: itemWithRelations.categories.name,
                      }
                    : null,
                customer_group: itemWithRelations.user_groups
                    ? {
                          id: Number(itemWithRelations.user_groups.id),
                          name: itemWithRelations.user_groups.name,
                      }
                    : null,
                brands: undefined,
                categories: undefined,
                user_groups: undefined,
            };
        });

        return {
            items: formattedItems,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const discount = await this.prisma.making_charge_discounts.findUnique({
            where: { id: BigInt(id) },
            include: {
                brands: { select: { id: true, name: true } },
                categories: { select: { id: true, name: true } },
                user_groups: { select: { id: true, name: true } },
            } as any,
        });

        if (!discount) {
            throw new NotFoundException('Making charge discount not found');
        }

        const discountWithRelations = discount as typeof discount & {
            brands?: { id: bigint; name: string } | null;
            categories?: { id: bigint; name: string } | null;
            user_groups?: { id: bigint; name: string } | null;
        };
        return {
            ...discount,
            id: Number(discount.id),
            brand: discountWithRelations.brands
                ? {
                      id: Number(discountWithRelations.brands.id),
                      name: discountWithRelations.brands.name,
                  }
                : null,
            category: discountWithRelations.categories
                ? {
                      id: Number(discountWithRelations.categories.id),
                      name: discountWithRelations.categories.name,
                  }
                : null,
            customer_group: discountWithRelations.user_groups
                ? {
                      id: Number(discountWithRelations.user_groups.id),
                      name: discountWithRelations.user_groups.name,
                  }
                : null,
            brands: undefined,
            categories: undefined,
            user_groups: undefined,
        };
    }

    async create(dto: CreateMakingChargeDiscountDto) {
        const discount = await this.prisma.making_charge_discounts.create({
            data: {
                name: dto.name,
                description: dto.description,
                discount_type: dto.discount_type,
                value: dto.value,
                brand_id: dto.brand_id ? BigInt(dto.brand_id) : null,
                category_id: dto.category_id ? BigInt(dto.category_id) : null,
                user_group_id: dto.user_group_id
                    ? BigInt(dto.user_group_id)
                    : (null as any),
                min_cart_total: dto.min_cart_total,
                is_auto: dto.is_auto ?? true,
                is_active: dto.is_active ?? true,
                starts_at: dto.starts_at ? new Date(dto.starts_at) : null,
                ends_at: dto.ends_at ? new Date(dto.ends_at) : null,
                user_types: dto.user_types as any,
            } as any,
            include: {
                brands: { select: { id: true, name: true } },
                categories: { select: { id: true, name: true } },
                user_groups: { select: { id: true, name: true } },
            } as any,
        });
        const discountWithRelations = discount as typeof discount & {
            brands?: { id: bigint; name: string } | null;
            categories?: { id: bigint; name: string } | null;
            user_groups?: { id: bigint; name: string } | null;
        };
        return {
            ...discount,
            id: Number(discount.id),
            brand: discountWithRelations.brands
                ? {
                      id: Number(discountWithRelations.brands.id),
                      name: discountWithRelations.brands.name,
                  }
                : null,
            category: discountWithRelations.categories
                ? {
                      id: Number(discountWithRelations.categories.id),
                      name: discountWithRelations.categories.name,
                  }
                : null,
            customer_group: discountWithRelations.user_groups
                ? {
                      id: Number(discountWithRelations.user_groups.id),
                      name: discountWithRelations.user_groups.name,
                  }
                : null,
            brands: undefined,
            categories: undefined,
            user_groups: undefined,
        };
    }

    async update(id: number, dto: UpdateMakingChargeDiscountDto) {
        await this.findOne(id);
        const discount = await this.prisma.making_charge_discounts.update({
            where: { id: BigInt(id) },
            data: {
                name: dto.name,
                description: dto.description,
                discount_type: dto.discount_type,
                value: dto.value,
                brand_id: dto.brand_id ? BigInt(dto.brand_id) : undefined,
                category_id: dto.category_id
                    ? BigInt(dto.category_id)
                    : undefined,
                user_group_id: dto.user_group_id
                    ? BigInt(dto.user_group_id)
                    : undefined,
                min_cart_total: dto.min_cart_total,
                is_auto: dto.is_auto,
                is_active: dto.is_active,
                starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
                ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
                user_types: dto.user_types as any, // Map user_types DTO field to customer_types DB field
            } as any,
            include: {
                brands: { select: { id: true, name: true } },
                categories: { select: { id: true, name: true } },
                user_groups: { select: { id: true, name: true } },
            } as any,
        });
        const discountWithRelations = discount as typeof discount & {
            brands?: { id: bigint; name: string } | null;
            categories?: { id: bigint; name: string } | null;
            user_groups?: { id: bigint; name: string } | null;
        };
        return {
            ...discount,
            id: Number(discount.id),
            brand: discountWithRelations.brands
                ? {
                      id: Number(discountWithRelations.brands.id),
                      name: discountWithRelations.brands.name,
                  }
                : null,
            category: discountWithRelations.categories
                ? {
                      id: Number(discountWithRelations.categories.id),
                      name: discountWithRelations.categories.name,
                  }
                : null,
            customer_group: discountWithRelations.user_groups
                ? {
                      id: Number(discountWithRelations.user_groups.id),
                      name: discountWithRelations.user_groups.name,
                  }
                : null,
            brands: undefined,
            categories: undefined,
            user_groups: undefined,
        };
    }

    async remove(id: number) {
        await this.findOne(id);
        return await this.prisma.making_charge_discounts.delete({
            where: { id: BigInt(id) },
        });
    }

    async bulkRemove(ids: number[]) {
        const bigIntIds = ids.map((id) => BigInt(id));
        return await this.prisma.making_charge_discounts.deleteMany({
            where: { id: { in: bigIntIds } },
        });
    }
}
