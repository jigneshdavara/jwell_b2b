import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateMakingChargeDiscountDto,
    UpdateMakingChargeDiscountDto,
} from './dto/making-charge-discount.dto';

@Injectable()
export class MakingChargeDiscountsService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number = 1, perPage: number = 20) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.making_charge_discounts.findMany({
                skip,
                take: perPage,
                include: {
                    brands: { select: { id: true, name: true } },
                    categories: { select: { id: true, name: true } },
                    customer_groups: { select: { id: true, name: true } },
                },
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.making_charge_discounts.count(),
        ]);

        // Format items to match Laravel response structure
        const formattedItems = items.map((item) => ({
            ...item,
            id: Number(item.id),
            brand: item.brands ? { id: Number(item.brands.id), name: item.brands.name } : null,
            category: item.categories ? { id: Number(item.categories.id), name: item.categories.name } : null,
            customer_group: item.customer_groups ? { id: Number(item.customer_groups.id), name: item.customer_groups.name } : null,
            brands: undefined,
            categories: undefined,
            customer_groups: undefined,
        }));

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
                customer_groups: { select: { id: true, name: true } },
            },
        });

        if (!discount) {
            throw new NotFoundException('Making charge discount not found');
        }

        return {
            ...discount,
            id: Number(discount.id),
            brand: discount.brands ? { id: Number(discount.brands.id), name: discount.brands.name } : null,
            category: discount.categories ? { id: Number(discount.categories.id), name: discount.categories.name } : null,
            customer_group: discount.customer_groups ? { id: Number(discount.customer_groups.id), name: discount.customer_groups.name } : null,
            brands: undefined,
            categories: undefined,
            customer_groups: undefined,
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
                customer_group_id: dto.customer_group_id
                    ? BigInt(dto.customer_group_id)
                    : null,
                min_cart_total: dto.min_cart_total,
                is_auto: dto.is_auto ?? true,
                is_active: dto.is_active ?? true,
                starts_at: dto.starts_at ? new Date(dto.starts_at) : null,
                ends_at: dto.ends_at ? new Date(dto.ends_at) : null,
                customer_types: dto.customer_types as any,
            },
            include: {
                brands: { select: { id: true, name: true } },
                categories: { select: { id: true, name: true } },
                customer_groups: { select: { id: true, name: true } },
            },
        });
        return {
            ...discount,
            id: Number(discount.id),
            brand: discount.brands ? { id: Number(discount.brands.id), name: discount.brands.name } : null,
            category: discount.categories ? { id: Number(discount.categories.id), name: discount.categories.name } : null,
            customer_group: discount.customer_groups ? { id: Number(discount.customer_groups.id), name: discount.customer_groups.name } : null,
            brands: undefined,
            categories: undefined,
            customer_groups: undefined,
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
                customer_group_id: dto.customer_group_id
                    ? BigInt(dto.customer_group_id)
                    : undefined,
                min_cart_total: dto.min_cart_total,
                is_auto: dto.is_auto,
                is_active: dto.is_active,
                starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
                ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
                customer_types: dto.customer_types as any,
            },
            include: {
                brands: { select: { id: true, name: true } },
                categories: { select: { id: true, name: true } },
                customer_groups: { select: { id: true, name: true } },
            },
        });
        return {
            ...discount,
            id: Number(discount.id),
            brand: discount.brands ? { id: Number(discount.brands.id), name: discount.brands.name } : null,
            category: discount.categories ? { id: Number(discount.categories.id), name: discount.categories.name } : null,
            customer_group: discount.customer_groups ? { id: Number(discount.customer_groups.id), name: discount.customer_groups.name } : null,
            brands: undefined,
            categories: undefined,
            customer_groups: undefined,
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
