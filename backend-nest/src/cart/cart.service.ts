import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../common/pricing/pricing.service';
import { TaxService } from '../common/tax/tax.service';

@Injectable()
export class CartService {
    constructor(
        private prisma: PrismaService,
        private pricingService: PricingService,
        private taxService: TaxService,
    ) {}

    async getActiveCart(userId: bigint) {
        let cart = await this.prisma.carts.findFirst({
            where: {
                user_id: userId,
                status: 'active',
            },
            include: {
                cart_items: {
                    include: {
                        products: {
                            include: {
                                product_medias: {
                                    orderBy: { display_order: 'asc' },
                                },
                            },
                        },
                        product_variants: true,
                    },
                },
            },
        });

        if (!cart) {
            cart = await this.prisma.carts.create({
                data: {
                    user_id: userId,
                    status: 'active',
                    currency: 'INR',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                include: {
                    cart_items: {
                        include: {
                            products: {
                                include: {
                                    product_medias: {
                                        orderBy: { display_order: 'asc' },
                                    },
                                },
                            },
                            product_variants: true,
                        },
                    },
                },
            });
        }

        return cart;
    }

    async summarize(userId: bigint) {
        const cart = await this.getActiveCart(userId);
        const user = await this.prisma.customer.findUnique({
            where: { id: userId },
        });

        const items = await Promise.all(
            cart.cart_items.map(async (item) => {
                const pricing = await this.pricingService.calculateProductPrice(
                    item.products,
                    user,
                    {
                        variant_id: item.product_variant_id,
                        quantity: item.quantity,
                        customer_group_id: user?.customer_group_id,
                        customer_type: user?.type,
                    },
                );

                // Update item breakdown in DB
                await this.prisma.cart_items.update({
                    where: { id: item.id },
                    data: { price_breakdown: pricing },
                });

                const unitSubtotal =
                    pricing.subtotal ||
                    (pricing.metal || 0) +
                        (pricing.diamond || 0) +
                        (pricing.making || 0);
                const unitDiscount = pricing.discount || 0;
                const unitTotal = pricing.total || unitSubtotal - unitDiscount;

                const lineSubtotal = unitSubtotal * item.quantity;
                const lineDiscount = unitDiscount * item.quantity;
                const lineTotal = unitTotal * item.quantity;

                return {
                    id: item.id.toString(),
                    product_id: item.product_id.toString(),
                    product_variant_id: item.product_variant_id?.toString(),
                    sku: item.products.sku,
                    name: item.products.name,
                    variant_label: item.product_variants?.label,
                    quantity: item.quantity,
                    inventory_quantity:
                        item.product_variants?.inventory_quantity,
                    unit_total: Math.round(unitTotal * 100) / 100,
                    line_total: Math.round(lineTotal * 100) / 100,
                    line_subtotal: Math.round(lineSubtotal * 100) / 100,
                    line_discount: Math.round(lineDiscount * 100) / 100,
                    price_breakdown: pricing,
                    thumbnail: item.products.product_medias[0]?.url || null,
                    configuration: item.configuration,
                };
            }),
        );

        const subtotal = items.reduce((sum, i) => sum + i.line_subtotal, 0);
        const discount = items.reduce((sum, i) => sum + i.line_discount, 0);
        const taxableAmount = subtotal - discount;
        const tax = await this.taxService.calculateTax(taxableAmount);
        const shipping = 0.0;
        const total = subtotal + tax - discount + shipping;

        return {
            items,
            currency: cart.currency || 'INR',
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            discount: Math.round(discount * 100) / 100,
            shipping: Math.round(shipping * 100) / 100,
            total: Math.round(total * 100) / 100,
        };
    }

    async clearItems(userId: bigint) {
        const cart = await this.getActiveCart(userId);
        await this.prisma.cart_items.deleteMany({
            where: { cart_id: cart.id },
        });
        await this.prisma.carts.update({
            where: { id: cart.id },
            data: { status: 'active', updated_at: new Date() },
        });
    }
}
