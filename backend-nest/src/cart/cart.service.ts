import { Injectable, NotFoundException } from '@nestjs/common';
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
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        const items = await Promise.all(
            cart.cart_items.map(async (item) => {
                const pricing = await this.pricingService.calculateProductPrice(
                    item.products,
                    user,
                    {
                        variant_id: item.product_variant_id
                            ? Number(item.product_variant_id)
                            : null,
                        quantity: item.quantity,
                        user_group_id: user?.user_group_id
                            ? Number(user.user_group_id)
                            : undefined,
                        user_type: user?.type || undefined,
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

    async clear(cart: any) {
        const metadata = (cart.metadata as Record<string, any>) || {};
        delete metadata.pending_order_id;

        await this.prisma.carts.update({
            where: { id: cart.id },
            data: {
                status: 'converted',
                metadata: metadata,
                updated_at: new Date(),
            },
        });
    }

    async addItem(
        userId: bigint,
        productId: bigint,
        variantId: bigint | null,
        quantity: number = 1,
        configuration?: Record<string, any>,
    ) {
        const cart = await this.getActiveCart(userId);
        quantity = Math.max(1, quantity);

        // Get product and user for pricing
        const product = await this.prisma.products.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        // Normalize configuration for comparison
        const normalizedConfig = this.normalizeConfiguration(
            configuration || {},
        );

        // Find existing item with same product, variant, and configuration
        const existingItem = cart.cart_items.find((item) => {
            if (item.product_id.toString() !== productId.toString()) {
                return false;
            }

            const itemVariantId = item.product_variant_id?.toString() || null;
            const targetVariantId = variantId?.toString() || null;
            if (itemVariantId !== targetVariantId) {
                return false;
            }

            // Compare normalized configurations
            const itemNormalizedConfig = this.normalizeConfiguration(
                (item.configuration as Record<string, any>) || {},
            );
            return itemNormalizedConfig === normalizedConfig;
        });

        const targetQuantity = existingItem
            ? existingItem.quantity + quantity
            : quantity;

        // Calculate pricing
        const pricing = await this.pricingService.calculateProductPrice(
            product,
            user,
            {
                variant_id: variantId ? Number(variantId) : null,
                quantity: targetQuantity,
                user_group_id: user?.user_group_id
                    ? Number(user.user_group_id)
                    : undefined,
                user_type: user?.type || undefined,
            },
        );

        // Merge configuration with variant label if variant exists
        let finalConfiguration = configuration || {};
        if (variantId) {
            const variant = await this.prisma.product_variants.findUnique({
                where: { id: variantId },
            });
            if (variant) {
                finalConfiguration = {
                    ...finalConfiguration,
                    variant: variant.label,
                };
            }
        }

        if (existingItem) {
            // Update existing item
            await this.prisma.cart_items.update({
                where: { id: existingItem.id },
                data: {
                    quantity: targetQuantity,
                    price_breakdown: pricing as any,
                    updated_at: new Date(),
                },
            });
        } else {
            // Create new item
            await this.prisma.cart_items.create({
                data: {
                    cart_id: cart.id,
                    product_id: productId,
                    product_variant_id: variantId,
                    quantity: quantity,
                    configuration: finalConfiguration as any,
                    price_breakdown: pricing as any,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }
    }

    async updateItemQuantity(itemId: bigint, quantity: number) {
        quantity = Math.max(1, quantity);
        await this.prisma.cart_items.update({
            where: { id: itemId },
            data: {
                quantity: quantity,
                updated_at: new Date(),
            },
        });
    }

    async updateItemConfiguration(
        itemId: bigint,
        configuration: Record<string, any>,
    ) {
        // Get existing configuration
        const item = await this.prisma.cart_items.findUnique({
            where: { id: itemId },
        });

        if (!item) {
            throw new NotFoundException('Cart item not found');
        }

        const existing = (item.configuration as Record<string, any>) || {};
        const merged = { ...existing, ...configuration };

        await this.prisma.cart_items.update({
            where: { id: itemId },
            data: {
                configuration: merged as any,
                updated_at: new Date(),
            },
        });
    }

    async removeItem(itemId: bigint) {
        await this.prisma.cart_items.delete({
            where: { id: itemId },
        });
    }

    /**
     * Normalize configuration for comparison by extracting only relevant fields
     * (notes) and ignoring extra fields like 'variant' label.
     */
    private normalizeConfiguration(
        configuration: Record<string, any>,
    ): string {
        // Extract only the fields that matter for matching
        const relevantFields = {
            notes: configuration['notes'] || null,
        };

        // Convert to JSON string for reliable comparison
        return JSON.stringify(relevantFields);
    }
}
