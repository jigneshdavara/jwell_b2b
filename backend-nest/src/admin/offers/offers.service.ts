import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOfferDto, UpdateOfferDto } from './dto/offer.dto';

interface ResolveOffersContext {
    subtotal?: number;
    orderTotal?: number;
    customerType?: string;
    customerGroupId?: number;
    items?: unknown[];
    metalCost?: number;
    makingCharge?: number;
}

interface OfferConstraints {
    min_order_total?: number;
    customer_types?: string[];
    customer_group_ids?: number[];
}

interface ResolvedOffer {
    code: string;
    name: string;
    description: string | null;
    type: string;
    value: number;
    amount: number; // Calculated discount amount
    constraints?: OfferConstraints;
}

@Injectable()
export class OffersService {
    constructor(private prisma: PrismaService) {}

    async findAll(page: number, perPage: number) {
        const skip = (page - 1) * perPage;
        const [items, total] = await Promise.all([
            this.prisma.offers.findMany({
                skip,
                take: perPage,
                orderBy: { created_at: 'desc' },
            }),
            this.prisma.offers.count(),
        ]);

        return {
            items: items.map((item) => ({
                ...item,
                id: Number(item.id),
            })),
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const offer = await this.prisma.offers.findUnique({
            where: { id: BigInt(id) },
        });
        if (!offer) {
            throw new NotFoundException('Offer not found');
        }
        return {
            ...offer,
            id: Number(offer.id),
        };
    }

    async create(dto: CreateOfferDto) {
        await this.prisma.offers.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                type: dto.type,
                value: dto.value,
                constraints: dto.constraints
                    ? (dto.constraints as Prisma.InputJsonValue)
                    : undefined,
                starts_at: dto.starts_at ? new Date(dto.starts_at) : null,
                ends_at: dto.ends_at ? new Date(dto.ends_at) : null,
                is_active: dto.is_active ?? true,
            },
        });
        return { success: true, message: 'Offer created successfully' };
    }

    async update(id: number, dto: UpdateOfferDto) {
        await this.findOne(id);
        await this.prisma.offers.update({
            where: { id: BigInt(id) },
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                type: dto.type,
                value: dto.value,
                constraints: dto.constraints
                    ? (dto.constraints as Prisma.InputJsonValue)
                    : undefined,
                starts_at: dto.starts_at ? new Date(dto.starts_at) : undefined,
                ends_at: dto.ends_at ? new Date(dto.ends_at) : undefined,
                is_active: dto.is_active,
            },
        });
        return { success: true, message: 'Offer updated successfully' };
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.prisma.offers.delete({
            where: { id: BigInt(id) },
        });
        return { success: true, message: 'Offer deleted successfully' };
    }

    async resolveOffers(
        userId: bigint,
        context: ResolveOffersContext,
    ): Promise<ResolvedOffer[]> {
        const now = new Date();

        // Get user details for constraint checking
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                user_groups: true,
            },
        });

        if (!user) {
            return [];
        }

        // Query active offers
        const offers = await this.prisma.offers.findMany({
            where: {
                is_active: true,
                AND: [
                    {
                        OR: [{ starts_at: null }, { starts_at: { lte: now } }],
                    },
                    {
                        OR: [{ ends_at: null }, { ends_at: { gte: now } }],
                    },
                ],
            },
        });

        const applicableOffers: ResolvedOffer[] = [];

        for (const offer of offers) {
            // Check if offer matches constraints
            if (this.matchesConstraints(offer, user, context)) {
                // Calculate discount amount
                const discountAmount = this.calculateDiscount(
                    {
                        value: Number(offer.value),
                        type: offer.type,
                    },
                    context,
                );

                if (discountAmount > 0) {
                    applicableOffers.push({
                        code: offer.code,
                        name: offer.name,
                        description: offer.description,
                        type: offer.type,
                        value: Number(offer.value),
                        amount: discountAmount,
                        constraints:
                            (offer.constraints as OfferConstraints) ||
                            undefined,
                    });
                }
            }
        }

        // Sort by discount amount (highest first)
        return applicableOffers.sort((a, b) => b.amount - a.amount);
    }

    private matchesConstraints(
        offer: {
            constraints: unknown;
        },
        user: {
            type: string;
            user_group_id: bigint | null;
        },
        context: ResolveOffersContext,
    ): boolean {
        const constraints = offer.constraints as OfferConstraints | null;

        if (!constraints) {
            return true; // No constraints means offer applies to all
        }

        // Check minimum order total
        if (constraints.min_order_total) {
            const orderTotal = context.orderTotal || context.subtotal || 0;
            if (orderTotal < Number(constraints.min_order_total)) {
                return false;
            }
        }

        // Check customer types
        if (
            constraints.customer_types &&
            Array.isArray(constraints.customer_types) &&
            constraints.customer_types.length > 0
        ) {
            if (!constraints.customer_types.includes(user.type)) {
                return false;
            }
        }

        // Check customer group IDs
        if (
            constraints.customer_group_ids &&
            Array.isArray(constraints.customer_group_ids) &&
            constraints.customer_group_ids.length > 0
        ) {
            const userGroupId = user.user_group_id
                ? Number(user.user_group_id)
                : null;
            if (
                !userGroupId ||
                !constraints.customer_group_ids.includes(userGroupId)
            ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate discount amount based on offer type and value
     */
    private calculateDiscount(
        offer: { value: number | string; type: string },
        context: ResolveOffersContext,
    ): number {
        const offerValue = Number(offer.value);
        const offerType = offer.type;

        switch (offerType) {
            case 'percentage': {
                // Percentage discount on order total
                const orderTotal = context.orderTotal || context.subtotal || 0;
                return (
                    Math.round(((orderTotal * offerValue) / 100) * 100) / 100
                );
            }

            case 'fixed': {
                // Fixed amount discount
                const orderTotal = context.orderTotal || context.subtotal || 0;
                // Don't allow discount to exceed order total
                return Math.min(offerValue, orderTotal);
            }

            case 'making_charge': {
                // Percentage or fixed discount on making charge only
                const makingCharge = context.makingCharge || 0;
                if (makingCharge <= 0) {
                    return 0;
                }

                // If value is less than 1, treat as percentage (e.g., 0.1 = 10%)
                // Otherwise treat as fixed amount
                if (offerValue < 1) {
                    return (
                        Math.round(makingCharge * offerValue * 100 * 100) / 100
                    );
                } else {
                    return Math.min(offerValue, makingCharge);
                }
            }

            default:
                return 0;
        }
    }

    async applyOffersToOrder(
        orderId: bigint,
        offers: ResolvedOffer[],
    ): Promise<number> {
        // Calculate total discount
        const totalDiscount = offers.reduce(
            (sum, offer) => sum + offer.amount,
            0,
        );

        // Update order discount amount
        // Note: This assumes orders table has discount_amount field
        // If you need to store individual offer relationships, create order_offers pivot table
        await this.prisma.orders.update({
            where: { id: orderId },
            data: {
                discount_amount: totalDiscount,
                updated_at: new Date(),
            },
        });

        // TODO: If you need to track which offers were applied to which order,
        // create an order_offers pivot table and store relationships here

        return totalDiscount;
    }

    async findByCode(code: string) {
        const offer = await this.prisma.offers.findUnique({
            where: { code },
        });

        if (!offer) {
            throw new NotFoundException(`Offer with code ${code} not found`);
        }

        return {
            ...offer,
            id: Number(offer.id),
            value: Number(offer.value),
        };
    }
}
