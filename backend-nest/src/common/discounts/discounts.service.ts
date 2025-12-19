import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DiscountsService {
    constructor(private prisma: PrismaService) {}

    async resolve(product: any, user?: any, context: any = {}): Promise<any> {
        const metalCost = parseFloat(context.metal || context.metal_cost || 0);
        const makingCharge = this.calculateMakingCharge(product, metalCost);

        if (makingCharge <= 0) {
            return this.emptyDiscount();
        }

        const now = context.now ? new Date(context.now) : new Date();
        const customerGroupId =
            context.customer_group_id ?? user?.customer_group_id ?? null;
        const customerType = (
            context.customer_type ||
            user?.type ||
            ''
        ).toLowerCase();
        const quantity = Math.max(1, parseInt(context.quantity || 1));
        const unitSubtotal = parseFloat(
            context.unit_subtotal ||
                makingCharge + parseFloat(context.base || 0),
        );
        const lineSubtotal = parseFloat(
            context.line_subtotal || unitSubtotal * quantity,
        );

        const globalDiscounts =
            await this.prisma.making_charge_discounts.findMany({
                where: {
                    is_active: true,
                    OR: [{ starts_at: null }, { starts_at: { lte: now } }],
                    AND: [
                        { OR: [{ ends_at: null }, { ends_at: { gte: now } }] },
                    ],
                },
            });

        const candidates = globalDiscounts.filter((discount) => {
            if (!discount.is_auto) return false;

            if (discount.brand_id && discount.brand_id !== product.brand_id)
                return false;
            if (
                discount.category_id &&
                discount.category_id !== product.category_id
            )
                return false;

            const allowedTypes = (
                (discount.customer_types as string[]) || []
            ).map((t) => t.toLowerCase());
            if (allowedTypes.length > 0) {
                if (!customerType || !allowedTypes.includes(customerType))
                    return false;
            }

            if (discount.customer_group_id) {
                if (
                    !customerGroupId ||
                    discount.customer_group_id !== BigInt(customerGroupId)
                )
                    return false;
            }

            if (
                discount.min_cart_total &&
                lineSubtotal < discount.min_cart_total.toNumber()
            )
                return false;

            return true;
        });

        if (candidates.length === 0) {
            return this.emptyDiscount();
        }

        const formattedCandidates = candidates.map((discount) => {
            let priority = 200;
            const hasCustomerTypes =
                ((discount.customer_types as string[]) || []).length > 0;

            if (hasCustomerTypes) {
                priority = 280;
            } else if (discount.customer_group_id) {
                priority = 260;
            } else if (discount.brand_id || discount.category_id) {
                priority = 220;
            }

            return this.buildDiscountPayload(
                discount.discount_type,
                discount.value.toNumber(),
                makingCharge,
                {
                    source: 'global',
                    name: discount.name,
                    priority,
                    customer_types: discount.customer_types,
                    meta: {
                        discount_id: discount.id.toString(),
                        brand_id: discount.brand_id?.toString(),
                        category_id: discount.category_id?.toString(),
                        customer_group_id:
                            discount.customer_group_id?.toString(),
                        customer_types: discount.customer_types,
                        min_cart_total: discount.min_cart_total?.toNumber(),
                    },
                },
            );
        });

        const best = formattedCandidates.reduce((carry, candidate) => {
            if (!carry) return candidate;
            if (candidate.amount > carry.amount) return candidate;
            if (
                candidate.amount === carry.amount &&
                candidate.priority > carry.priority
            )
                return candidate;
            return carry;
        }, null);

        if (best) {
            delete best.priority;
        }

        return best || this.emptyDiscount();
    }

    public calculateMakingCharge(
        product: any,
        metalCost: number = 0.0,
    ): number {
        const metadata = product.metadata || {};
        let types = metadata.making_charge_types || [];

        if (types.length === 0) {
            const hasFixed =
                product.making_charge_amount !== null &&
                parseFloat(product.making_charge_amount) > 0;
            const hasPercentage =
                product.making_charge_percentage !== null &&
                parseFloat(product.making_charge_percentage) > 0;

            if (hasFixed && hasPercentage) {
                types = ['fixed', 'percentage'];
            } else if (hasFixed) {
                types = ['fixed'];
            } else if (hasPercentage) {
                types = ['percentage'];
            }
        }

        let makingCharge = 0.0;

        if (types.includes('fixed')) {
            makingCharge += Math.max(
                0.0,
                parseFloat(product.making_charge_amount || 0),
            );
        }

        if (types.includes('percentage') && metalCost > 0) {
            const percentage = Math.max(
                0.0,
                parseFloat(product.making_charge_percentage || 0),
            );
            makingCharge += metalCost * (percentage / 100);
        }

        return Math.round(makingCharge * 100) / 100;
    }

    private buildDiscountPayload(
        type: string,
        value: number,
        makingCharge: number,
        attributes: any = {},
    ): any {
        value = Math.max(0, value);
        if (value <= 0) return null;

        let amount =
            type === 'percentage'
                ? makingCharge * (Math.min(value, 100) / 100)
                : value;

        amount = Math.min(amount, makingCharge);

        return {
            ...attributes,
            amount: Math.round(amount * 100) / 100,
            type,
            value: Math.round(value * 100) / 100,
            priority: attributes.priority || 0,
            source: attributes.source || null,
            name: attributes.name || null,
            meta: attributes.meta || {},
            customer_types:
                attributes.customer_types ||
                attributes.meta?.customer_types ||
                null,
        };
    }

    private emptyDiscount(): any {
        return {
            amount: 0.0,
            type: null,
            value: 0.0,
            source: null,
            name: null,
            meta: {},
        };
    }
}
