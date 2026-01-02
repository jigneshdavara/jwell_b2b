import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from '../common/pricing/pricing.service';
import { TaxService } from '../common/tax/tax.service';
import { CartService } from '../cart/cart.service';
import { MailService } from '../common/mail/mail.service';
import { CreateQuotationDto } from './dto/quotation.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuotationsService {
    constructor(
        private prisma: PrismaService,
        private pricingService: PricingService,
        private taxService: TaxService,
        private cartService: CartService,
        private mailService: MailService,
    ) {}

    async findAll(userId: bigint) {
        const items = await this.prisma.quotations.findMany({
            where: { user_id: userId },
            include: {
                products: {
                    include: {
                        product_medias: { orderBy: { display_order: 'asc' } },
                    },
                },
                product_variants: true,
                orders: {
                    include: {
                        order_status_histories: {
                            orderBy: { created_at: 'desc' },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        // Group quotations
        const groups = new Map<string, any[]>();
        for (const item of items) {
            const groupKey = item.quotation_group_id;
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            const group = groups.get(groupKey);
            if (group) {
                group.push(item);
            }
        }

        const formattedGroups = Array.from(groups.entries()).map(
            ([groupKey, group]) => {
                const first = group[0];
                const totalQuantity = group.reduce(
                    (sum, q) => sum + q.quantity,
                    0,
                );

                let status = first.status;
                if (
                    group.some(
                        (q) => q.status === 'pending_customer_confirmation',
                    )
                ) {
                    status = 'pending_customer_confirmation';
                }

                // Use actual quotation_group_id from database only (no generation)
                const actualQuotationGroupId = first.quotation_group_id;

                return {
                    quotation_group_id: actualQuotationGroupId,
                    ids: group.map((q) => q.id.toString()),
                    status,
                    quantity: totalQuantity,
                    approved_at: first.approved_at,
                    created_at: first.created_at,
                    updated_at: first.updated_at,
                    product: {
                        id: first.products.id.toString(),
                        name: first.products.name,
                        sku: first.products.sku,
                        thumbnail:
                            first.products.product_medias[0]?.url || null,
                    },
                    products: group.map((q) => ({
                        id: q.products.id.toString(),
                        name: q.products.name,
                        sku: q.products.sku,
                        thumbnail: q.products.product_medias[0]?.url || null,
                    })),
                    order_reference: first.orders?.reference || null,
                };
            },
        );

        return formattedGroups.sort(
            (a, b) => b.created_at.getTime() - a.created_at.getTime(),
        );
    }

    async findByGroupId(quotationGroupId: string, userId: bigint) {
        // Find all quotations in the group
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
                user_id: userId,
            },
            include: {
                products: {
                    include: {
                        product_medias: { orderBy: { display_order: 'asc' } },
                        product_variants: {
                            include: {
                                product_variant_metals: {
                                    include: {
                                        metals: true,
                                        metal_purities: true,
                                        metal_tones: true,
                                    },
                                },
                                product_variant_diamonds: {
                                    include: { diamonds: true },
                                },
                                sizes: true,
                            },
                        },
                    },
                },
                product_variants: true,
                users: true,
                orders: {
                    include: {
                        order_status_histories: {
                            orderBy: { created_at: 'desc' },
                        },
                    },
                },
            },
            orderBy: { created_at: 'asc' },
        });

        if (quotations.length === 0) {
            throw new NotFoundException('Quotation group not found');
        }

        // Use the first quotation as the primary one
        const quotation = quotations[0];
        const relatedQuotations = quotations.slice(1);

        const user = quotation.users;
        const priceBreakdown = await this.pricingService.calculateProductPrice(
            quotation.products,
            user,
            {
                variant_id: quotation.product_variant_id,
                quantity: quotation.quantity,
                user_group_id: user?.user_group_id,
                user_type: user?.type,
            },
        );

        const relatedFormatted = await Promise.all(
            relatedQuotations.map(async (q) => {
                const relatedPrice =
                    await this.pricingService.calculateProductPrice(
                        q.products,
                        user,
                        {
                            variant_id: q.product_variant_id,
                            quantity: q.quantity,
                            user_group_id: user?.user_group_id,
                            user_type: user?.type,
                        },
                    );

                return {
                    quotation_group_id: q.quotation_group_id,
                    status: q.status,
                    quantity: q.quantity,
                    notes: q.notes,
                    product: {
                        id: q.products.id.toString(),
                        name: q.products.name,
                        sku: q.products.sku,
                        media: q.products.product_medias.map((m) => ({
                            url: m.url,
                        })),
                        variants: q.products.product_variants.map((v) => ({
                            id: v.id.toString(),
                            label: v.label,
                        })),
                    },
                    variant: q.product_variants
                        ? {
                              id: q.product_variants.id.toString(),
                              label: q.product_variants.label,
                          }
                        : null,
                    price_breakdown: relatedPrice,
                };
            }),
        );

        const taxSummary = await this.calculateTaxSummary(
            [quotation, ...relatedQuotations],
            user,
        );

        // Query messages separately using quotation_group_id
        const messages = await this.prisma.quotation_messages.findMany({
            where: {
                quotation_group_id: quotation.quotation_group_id,
            },
            include: { users: true },
            orderBy: { created_at: 'asc' },
        });

        return {
            quotation_group_id: quotation.quotation_group_id,
            status: quotation.status,
            quantity: quotation.quantity,
            notes: quotation.notes,
            admin_notes: quotation.admin_notes,
            created_at: quotation.created_at,
            updated_at: quotation.updated_at,
            approved_at: quotation.approved_at,
            user: user
                ? {
                      name: user.name,
                      email: user.email,
                  }
                : null,
            product: {
                id: quotation.products.id.toString(),
                name: quotation.products.name,
                sku: quotation.products.sku,
                media: quotation.products.product_medias.map((m) => ({
                    url: m.url,
                })),
                variants: quotation.products.product_variants.map((v) => ({
                    id: v.id.toString(),
                    label: v.label,
                })),
            },
            variant: quotation.product_variants
                ? {
                      id: quotation.product_variants.id.toString(),
                      label: quotation.product_variants.label,
                  }
                : null,
            price_breakdown: priceBreakdown,
            related_quotations: relatedFormatted,
            tax_summary: taxSummary,
            messages: messages.map((m) => ({
                id: m.id.toString(),
                sender: m.sender,
                message: m.message,
                created_at: m.created_at,
                author: m.users?.name || 'Admin',
            })),
            order: quotation.orders
                ? {
                      id: quotation.orders.id.toString(),
                      reference: quotation.orders.reference,
                      status: quotation.orders.status,
                      total_amount: quotation.orders.total_amount.toNumber(),
                      history: quotation.orders.order_status_histories.map(
                          (h) => ({
                              id: h.id.toString(),
                              status: h.status,
                              created_at: h.created_at,
                              meta: h.meta,
                          }),
                      ),
                  }
                : null,
        };
    }

    async create(dto: CreateQuotationDto, userId: bigint) {
        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(dto.product_id) },
        });
        if (!product) throw new NotFoundException('Product not found');

        if (dto.product_variant_id) {
            const variant = await this.prisma.product_variants.findUnique({
                where: { id: BigInt(dto.product_variant_id) },
            });
            if (!variant || variant.product_id !== product.id) {
                throw new BadRequestException('Invalid product variant');
            }
            if (
                variant.inventory_quantity !== null &&
                variant.inventory_quantity < dto.quantity
            ) {
                throw new BadRequestException('Insufficient inventory');
            }
        }

        const groupKey = uuidv4();
        return await this.prisma.quotations.create({
            data: {
                user_id: userId,
                quotation_group_id: groupKey,
                product_id: product.id,
                product_variant_id: dto.product_variant_id
                    ? BigInt(dto.product_variant_id)
                    : null,
                status: 'pending',
                quantity: dto.quantity,
                notes: dto.notes,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    async storeFromCart(userId: bigint) {
        const cart = await this.cartService.getActiveCart(userId);
        if (!cart.cart_items || cart.cart_items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        return await this.prisma.$transaction(async (tx) => {
            // Validate inventory
            for (const item of cart.cart_items) {
                if (
                    item.product_variants &&
                    item.product_variants.inventory_quantity !== null
                ) {
                    if (
                        item.product_variants.inventory_quantity < item.quantity
                    ) {
                        throw new BadRequestException(
                            `Insufficient inventory for ${item.products.name}`,
                        );
                    }
                }
            }

            const groupKey = uuidv4();
            const quotations: any[] = [];

            for (const item of cart.cart_items) {
                const configuration = (item.configuration as any) || {};
                const q = await tx.quotations.create({
                    data: {
                        user_id: userId,
                        quotation_group_id: groupKey,
                        product_id: item.product_id,
                        product_variant_id: item.product_variant_id,
                        status: 'pending',
                        quantity: item.quantity,
                        notes: configuration.notes || null,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });

                if (configuration.notes) {
                    await tx.quotation_messages.create({
                        data: {
                            quotation_group_id: q.quotation_group_id,
                            user_id: userId,
                            sender: 'user',
                            message: configuration.notes,
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                    });
                }
                quotations.push(q as any);
            }

            // Clear cart items
            await tx.cart_items.deleteMany({ where: { cart_id: cart.id } });

            return quotations;
        });
    }

    async addMessage(
        id: number,
        message: string,
        userId: bigint,
        sender: 'user' | 'admin',
    ) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
        });
        if (!quotation) throw new NotFoundException('Quotation not found');

        return await this.prisma.quotation_messages.create({
            data: {
                quotation_group_id: quotation.quotation_group_id,
                user_id: sender === 'user' ? userId : null,
                sender,
                message,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    async addMessageByGroupId(
        quotationGroupId: string,
        message: string,
        userId: bigint,
        sender: 'user' | 'admin',
    ) {
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
                user_id: userId,
            },
            orderBy: { created_at: 'asc' },
        });

        if (quotations.length === 0)
            throw new NotFoundException('Quotation group not found');

        const firstQuotation = quotations[0];

        await this.prisma.quotation_messages.create({
            data: {
                quotation_group_id: firstQuotation.quotation_group_id,
                user_id: sender === 'user' ? userId : null,
                sender,
                message,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return {
            success: true,
        };
    }

    async confirm(id: number, userId: bigint) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
        });
        if (!quotation || quotation.user_id !== userId)
            throw new NotFoundException('Quotation not found');

        const related = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotation.quotation_group_id,
                user_id: userId,
            },
        });

        if (
            !related.some((q) => q.status === 'pending_customer_confirmation')
        ) {
            throw new BadRequestException('No confirmation required');
        }

        return await this.prisma.$transaction(async (tx) => {
            await tx.quotations.updateMany({
                where: {
                    quotation_group_id: quotation.quotation_group_id,
                    status: 'pending_customer_confirmation',
                },
                data: { status: 'customer_confirmed', updated_at: new Date() },
            });

            await tx.quotation_messages.create({
                data: {
                    quotation_group_id: quotation.quotation_group_id,
                    user_id: userId,
                    sender: 'user',
                    message: 'User approved the updated quotation.',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            return { message: 'Quotation approved' };
        });
    }

    async confirmByGroupId(quotationGroupId: string, userId: bigint) {
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
                user_id: userId,
            },
            orderBy: { created_at: 'asc' },
        });

        if (quotations.length === 0)
            throw new NotFoundException('Quotation group not found');

        const firstQuotation = quotations[0];

        if (
            !quotations.some(
                (q) => q.status === 'pending_customer_confirmation',
            )
        ) {
            throw new BadRequestException('No confirmation required');
        }

        return await this.prisma.$transaction(async (tx) => {
            await tx.quotations.updateMany({
                where: {
                    quotation_group_id: quotationGroupId,
                    user_id: userId,
                    status: 'pending_customer_confirmation',
                },
                data: { status: 'customer_confirmed', updated_at: new Date() },
            });

            await tx.quotation_messages.create({
                data: {
                    quotation_group_id: firstQuotation.quotation_group_id,
                    user_id: userId,
                    sender: 'user',
                    message: 'User approved the updated quotation.',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            return { message: 'Quotation approved' };
        });
    }

    async declineByGroupId(quotationGroupId: string, userId: bigint) {
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
                user_id: userId,
            },
            orderBy: { created_at: 'asc' },
        });

        if (quotations.length === 0)
            throw new NotFoundException('Quotation group not found');

        const firstQuotation = quotations[0];

        if (
            !quotations.some(
                (q) => q.status === 'pending_customer_confirmation',
            )
        ) {
            throw new BadRequestException('No confirmation required');
        }

        return await this.prisma.$transaction(async (tx) => {
            await tx.quotations.updateMany({
                where: {
                    quotation_group_id: quotationGroupId,
                    user_id: userId,
                    status: 'pending_customer_confirmation',
                },
                data: { status: 'customer_declined', updated_at: new Date() },
            });

            await tx.quotation_messages.create({
                data: {
                    quotation_group_id: firstQuotation.quotation_group_id,
                    user_id: userId,
                    sender: 'user',
                    message: 'User declined the updated quotation.',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            return { message: 'Quotation declined' };
        });
    }

    async decline(id: number, userId: bigint) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
        });
        if (!quotation || quotation.user_id !== userId)
            throw new NotFoundException('Quotation not found');

        return await this.prisma.$transaction(async (tx) => {
            await tx.quotations.updateMany({
                where: {
                    quotation_group_id: quotation.quotation_group_id,
                    status: 'pending_customer_confirmation',
                },
                data: { status: 'customer_declined', updated_at: new Date() },
            });

            await tx.quotation_messages.create({
                data: {
                    quotation_group_id: quotation.quotation_group_id,
                    user_id: userId,
                    sender: 'user',
                    message: 'User declined the updated quotation.',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            return { message: 'Quotation declined' };
        });
    }

    private async calculateTaxSummary(quotations: any[], user: any) {
        let totalSubtotal = 0;
        for (const q of quotations) {
            const p = await this.pricingService.calculateProductPrice(
                q.products,
                user,
                {
                    variant_id: q.product_variant_id,
                    quantity: q.quantity,
                    user_group_id: user?.user_group_id,
                    user_type: user?.type,
                },
            );
            const unitSubtotal =
                p.subtotal ||
                (p.metal || 0) + (p.diamond || 0) + (p.making || 0);
            const unitDiscount = p.discount || 0;
            totalSubtotal += (unitSubtotal - unitDiscount) * q.quantity;
        }

        const taxAmount = await this.taxService.calculateTax(totalSubtotal);
        return {
            subtotal: Math.round(totalSubtotal * 100) / 100,
            tax: Math.round(taxAmount * 100) / 100,
            total: Math.round((totalSubtotal + taxAmount) * 100) / 100,
        };
    }
}
