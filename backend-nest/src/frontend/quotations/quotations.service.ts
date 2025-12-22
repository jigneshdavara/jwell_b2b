import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../../common/pricing/pricing.service';
import { TaxService } from '../../common/tax/tax.service';
import { CartService } from '../../cart/cart.service';
import { MailService } from '../../common/mail/mail.service';
import {
    CreateQuotationDto,
    StoreQuotationMessageDto,
} from './dto/quotation.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class FrontendQuotationsService {
    constructor(
        private prisma: PrismaService,
        private pricingService: PricingService,
        private taxService: TaxService,
        private cartService: CartService,
        private mailService: MailService,
    ) {}

    async findAll(userId: bigint) {
        const quotations = await this.prisma.quotations.findMany({
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
                quotation_messages: {
                    include: { customers: true },
                    orderBy: { created_at: 'desc' },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        // Group quotations by quotation_group_id
        const grouped = new Map<string, typeof quotations>();
        quotations.forEach((quotation) => {
            let groupKey: string;
            if (quotation.quotation_group_id) {
                groupKey = quotation.quotation_group_id;
            } else {
                // Fallback for old quotations: group by user and date+hour+minute (rounded to 5 minutes)
                const createdAt = quotation.created_at;
                if (createdAt) {
                    const date = new Date(createdAt);
                    const minute = Math.floor(date.getMinutes() / 5) * 5;
                    groupKey =
                        quotation.user_id.toString() +
                        '_' +
                        date.toISOString().slice(0, 16).replace('T', ' ') +
                        ':' +
                        minute.toString().padStart(2, '0');
                } else {
                    groupKey = quotation.user_id.toString() + '_' + Date.now();
                }
            }

            if (!grouped.has(groupKey)) {
                grouped.set(groupKey, []);
            }
            grouped.get(groupKey)!.push(quotation);
        });

        return Array.from(grouped.values()).map((group) => {
            const first = group[0];
            const totalQuantity = group.reduce(
                (sum, q) => sum + q.quantity,
                0,
            );

            // Prioritize pending_customer_confirmation status if any quotation in the group has it
            let status = first.status;
            const hasPendingConfirmation = group.some(
                (q) => q.status === 'pending_customer_confirmation',
            );
            if (hasPendingConfirmation) {
                status = 'pending_customer_confirmation';
            }

            const getThumbnail = (product: any) => {
                const media = product.product_medias?.find(
                    (m: any) => m.display_order === 0,
                ) || product.product_medias?.[0];
                return media?.url || null;
            };

            return {
                id: first.id.toString(),
                ids: group.map((q) => q.id.toString()),
                status,
                quantity: totalQuantity,
                approved_at: first.approved_at?.toISOString() || null,
                created_at: first.created_at?.toISOString() || null,
                updated_at: first.updated_at?.toISOString() || null,
                product: {
                    id: first.products.id.toString(),
                    name: first.products.name,
                    sku: first.products.sku,
                    thumbnail: getThumbnail(first.products),
                },
                products: group.map((q) => ({
                    id: q.products.id.toString(),
                    name: q.products.name,
                    sku: q.products.sku,
                    thumbnail: getThumbnail(q.products),
                })),
                order_reference: first.orders?.reference || null,
            };
        });
    }

    async findOne(quotationId: bigint, userId: bigint) {
        // First check if quotation exists and user has permission
        const permissionCheck = await this.prisma.quotations.findUnique({
            where: { id: quotationId },
            select: { user_id: true },
        });

        if (!permissionCheck) {
            throw new NotFoundException('Quotation not found');
        }

        if (permissionCheck.user_id !== userId) {
            throw new ForbiddenException(
                'You do not have permission to view this quotation',
            );
        }

        // Now fetch the full quotation with all relations
        const quotation: any = await this.prisma.quotations.findUnique({
            where: { id: quotationId },
            include: {
                customers: true,
                products: {
                    include: {
                        product_medias: { orderBy: { display_order: 'asc' } },
                        product_variants: true,
                    },
                },
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
                orders: {
                    include: {
                        order_status_histories: {
                            orderBy: { created_at: 'desc' },
                        },
                    },
                },
                quotation_messages: {
                    include: { customers: true },
                    orderBy: { created_at: 'asc' },
                },
            },
        });

        if (!quotation) {
            throw new NotFoundException('Quotation not found');
        }

        if (quotation.user_id !== userId) {
            throw new ForbiddenException(
                'You do not have permission to view this quotation',
            );
        }

        // Find related quotations in the same group
        let relatedQuotations: any[] = [];
        if (quotation.quotation_group_id) {
            relatedQuotations = await this.prisma.quotations.findMany({
                where: {
                    quotation_group_id: quotation.quotation_group_id,
                    id: { not: quotation.id },
                },
                include: {
                    products: {
                        include: {
                            product_medias: { orderBy: { display_order: 'asc' } },
                            product_variants: true,
                        },
                    },
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
                orderBy: { created_at: 'asc' },
            });
        } else {
            // Fallback for old quotations without group_id
            const createdAt = quotation.created_at;
            if (createdAt) {
                const timeWindow = new Date(createdAt);
                timeWindow.setMinutes(timeWindow.getMinutes() - 5);
                const timeWindowEnd = new Date(createdAt);
                timeWindowEnd.setMinutes(timeWindowEnd.getMinutes() + 5);

                relatedQuotations = await this.prisma.quotations.findMany({
                    where: {
                        user_id: quotation.user_id,
                        id: { not: quotation.id },
                        created_at: {
                            gte: timeWindow,
                            lte: timeWindowEnd,
                        },
                    },
                    include: {
                        products: {
                            include: {
                                product_medias: {
                                    orderBy: { display_order: 'asc' },
                                },
                                product_variants: true,
                            },
                        },
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
                    orderBy: { created_at: 'asc' },
                });
            }
        }

        const customer = quotation.customers;
        const product = quotation.products;
        const variant = quotation.product_variants;

        if (!customer) {
            throw new NotFoundException('Customer not found for quotation');
        }
        if (!product) {
            throw new NotFoundException('Product not found for quotation');
        }

        // Calculate price breakdown for main quotation
        const mainPriceBreakdown = await this.pricingService.calculateProductPrice(
            product as any,
            customer as any,
            {
                variant_id: variant ? Number(variant.id) : null,
                quantity: quotation.quantity,
                customer_group_id: customer.customer_group_id
                    ? Number(customer.customer_group_id)
                    : undefined,
                customer_type: customer.type || undefined,
            },
        );

        // Calculate price breakdown for related quotations
        const relatedQuotationsWithPricing = await Promise.all(
            relatedQuotations.map(async (rq) => {
                if (!rq.products) {
                    return null;
                }
                const pricing = await this.pricingService.calculateProductPrice(
                    rq.products as any,
                    customer as any,
                    {
                        variant_id: rq.product_variants
                            ? Number(rq.product_variants.id)
                            : null,
                        quantity: rq.quantity,
                        customer_group_id: customer.customer_group_id
                            ? Number(customer.customer_group_id)
                            : undefined,
                        customer_type: customer.type || undefined,
                    },
                );

                return {
                    id: rq.id.toString(),
                    status: rq.status,
                    quantity: rq.quantity,
                    notes: rq.notes,
                    product: {
                        id: rq.products.id.toString(),
                        name: rq.products.name,
                        sku: rq.products.sku,
                        base_price: (rq.products as any).base_price
                            ? Number((rq.products as any).base_price)
                            : null,
                        making_charge_amount: (rq.products as any)
                            .making_charge_amount
                            ? Number((rq.products as any).making_charge_amount)
                            : null,
                        media: rq.products.product_medias?.map((m: any) => ({
                            url: m.url,
                            alt: (m.metadata as any)?.alt || rq.products.name,
                        })) || [],
                        variants: rq.products.product_variants?.map((v: any) => ({
                            id: v.id.toString(),
                            label: v.label || '',
                            metadata: (v.metadata as any) || {},
                        })) || [],
                    },
                    variant: rq.product_variants
                        ? {
                              id: rq.product_variants.id.toString(),
                              label: rq.product_variants.label || '',
                              metadata: (rq.product_variants.metadata as any) || {},
                          }
                        : null,
                    price_breakdown: pricing,
                };
            }),
        );
        
        // Filter out null entries
        const validRelatedQuotations = relatedQuotationsWithPricing.filter((q) => q !== null);

        // Calculate tax summary
        const taxSummary = await this.calculateQuotationTaxSummary(
            quotation,
            relatedQuotations.filter((rq) => rq.products !== null),
            customer as any,
        );

        const getMedia = (product: any) => {
            return product.product_medias?.map((m: any) => ({
                url: m.url,
                alt: (m.metadata as any)?.alt || product.name,
            })) || [];
        };

        return {
            id: quotation.id.toString(),
            status: quotation.status,
            quantity: quotation.quantity,
            notes: quotation.notes,
            admin_notes: quotation.admin_notes,
            approved_at: quotation.approved_at?.toISOString() || null,
            created_at: quotation.created_at?.toISOString() || null,
            updated_at: quotation.updated_at?.toISOString() || null,
            related_quotations: validRelatedQuotations,
            product: {
                id: product.id.toString(),
                name: product.name,
                sku: product.sku,
                base_price: (product as any).base_price
                    ? Number((product as any).base_price)
                    : null,
                making_charge: (product as any).making_charge || null,
                media: getMedia(product),
                variants: product.product_variants?.map((v: any) => ({
                    id: v.id.toString(),
                    label: v.label || '',
                    metadata: (v.metadata as any) || {},
                })) || [],
            },
            variant: variant
                ? {
                      id: variant.id.toString(),
                      label: variant.label || '',
                      metadata: (variant.metadata as any) || {},
                  }
                : null,
            price_breakdown: mainPriceBreakdown,
            user: {
                name: customer.name || null,
                email: customer.email || null,
            },
            order: quotation.orders
                ? {
                      id: quotation.orders.id.toString(),
                      reference: quotation.orders.reference,
                      status: quotation.orders.status,
                      total_amount: Number(quotation.orders.total_amount),
                      history: quotation.orders.order_status_histories.map(
                          (h) => ({
                              id: h.id.toString(),
                              status: h.status,
                              created_at: h.created_at?.toISOString() || null,
                              meta: (h.meta as any) || {},
                          }),
                      ),
                  }
                : null,
            tax_rate: await this.taxService.getDefaultTaxRate(),
            tax_summary: taxSummary,
            messages: quotation.quotation_messages.map((m) => ({
                id: m.id.toString(),
                sender: m.sender,
                message: m.message,
                created_at: m.created_at?.toISOString() || null,
                author: m.customers?.name || null,
            })),
        };
    }

    async create(dto: CreateQuotationDto, userId: bigint) {
        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(dto.product_id.toString()) },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        let variant: any = null;
        if (dto.product_variant_id) {
            variant = await this.prisma.product_variants.findUnique({
                where: { id: BigInt(dto.product_variant_id.toString()) },
            });

            if (!variant) {
                throw new NotFoundException('Product variant not found');
            }

            if (variant.product_id !== BigInt(dto.product_id.toString())) {
                throw new NotFoundException(
                    'Product variant not found',
                );
            }

            // Validate inventory availability
            if (variant.inventory_quantity !== null) {
                const inventoryQuantity = Number(variant.inventory_quantity);
                if (inventoryQuantity === 0) {
                    throw new BadRequestException(
                        'This product variant is currently out of stock. Quotation requests are not available.',
                    );
                }
                if (dto.quantity > inventoryQuantity) {
                    throw new BadRequestException(
                        `The requested quantity (${dto.quantity}) exceeds the available inventory (${inventoryQuantity}).`,
                    );
                }
            }
        }

        const quotationGroupId = randomUUID();

        const quotation = await this.prisma.quotations.create({
            data: {
                user_id: userId,
                quotation_group_id: quotationGroupId,
                product_id: BigInt(dto.product_id.toString()),
                product_variant_id: dto.product_variant_id
                    ? BigInt(dto.product_variant_id.toString())
                    : null,
                status: 'pending',
                quantity: dto.quantity,
                notes: dto.notes || null,
                created_at: new Date(),
                updated_at: new Date(),
            },
            include: {
                customers: true,
                products: true,
            },
        });

        // Send email notifications
        try {
            await this.mailService.sendQuotationSubmittedCustomer(
                Number(quotation.id),
            );
            await this.mailService.sendQuotationSubmittedAdmin(
                Number(quotation.id),
            );
        } catch (error) {
            console.error('Failed to send quotation emails:', error);
        }

        return {
            message: 'Quotation submitted successfully. Our team will get back to you shortly.',
            quotation: {
                id: quotation.id.toString(),
            },
        };
    }

    async createFromCart(userId: bigint) {
        const cart = await this.cartService.getActiveCart(userId);

        const cartItems = await this.prisma.cart_items.findMany({
            where: { cart_id: cart.id },
            include: {
                products: true,
                product_variants: true,
            },
        });

        if (cartItems.length === 0) {
            throw new BadRequestException('Your cart is empty.');
        }

        const errors: string[] = [];

        // Group items by product_variant_id to check total quantity per variant
        const variantQuantities = new Map<
            bigint,
            {
                variant: any;
                product: any;
                total_quantity: number;
                items: any[];
            }
        >();

        cartItems.forEach((item) => {
            if (item.product_variant_id) {
                const variantId = item.product_variant_id;
                if (!variantQuantities.has(variantId)) {
                    variantQuantities.set(variantId, {
                        variant: item.product_variants,
                        product: item.products,
                        total_quantity: 0,
                        items: [],
                    });
                }
                const data = variantQuantities.get(variantId)!;
                data.total_quantity += item.quantity;
                data.items.push(item);
            }
        });

        // Validate total quantity per variant
        for (const [variantId, data] of variantQuantities.entries()) {
            const variant = data.variant;
            const product = data.product;
            const totalQuantity = data.total_quantity;

            if (variant && variant.inventory_quantity !== null) {
                const inventoryQuantity = Number(variant.inventory_quantity);
                if (inventoryQuantity === 0) {
                    errors.push(
                        `${product.name} (${variant.label || 'N/A'}) is currently out of stock. Quotation requests are not available.`,
                    );
                    continue;
                }
                if (totalQuantity > inventoryQuantity) {
                    const itemWord = inventoryQuantity === 1 ? 'item is' : 'items are';
                    errors.push(
                        `Total quantity requested for ${product.name} (${variant.label || 'N/A'}) is ${totalQuantity}, but only ${inventoryQuantity} ${itemWord} available.`,
                    );
                }
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors.join(' '));
        }

        // Generate a unique group ID for all quotations in this submission
        const quotationGroupId = randomUUID();
        const quotations: any[] = [];

        for (const item of cartItems) {
            const product = item.products;
            if (!product) {
                continue;
            }

            const configuration = (item.configuration as any) || {};
            const notes = configuration.notes || null;

            const quotation = await this.prisma.quotations.create({
                data: {
                    user_id: userId,
                    quotation_group_id: quotationGroupId,
                    product_id: item.product_id,
                    product_variant_id: item.product_variant_id,
                    status: 'pending',
                    quantity: item.quantity,
                    notes: notes,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                include: {
                    customers: true,
                    products: true,
                },
            });

            // Create message if notes exist
            if (notes) {
                await this.prisma.quotation_messages.create({
                    data: {
                        quotation_id: quotation.id,
                        user_id: userId,
                        sender: 'customer',
                        message: notes,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }

            quotations.push(quotation as any);
        }

        // Clear cart items
        await this.cartService.clearItems(userId);

        // Send email notifications (send for first quotation in group)
        if (quotations.length > 0) {
            try {
                await this.mailService.sendQuotationSubmittedCustomer(
                    Number(quotations[0].id),
                );
                await this.mailService.sendQuotationSubmittedAdmin(
                    Number(quotations[0].id),
                );
            } catch (error) {
                console.error('Failed to send quotation emails:', error);
            }
        }

        return {
            message:
                'Quotation requests submitted successfully.',
            quotations: quotations.map((q) => ({
                id: q.id.toString(),
            })),
        };
    }

    async remove(quotationId: bigint, userId: bigint) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: quotationId },
        });

        if (!quotation) {
            throw new NotFoundException('Quotation not found');
        }

        if (quotation.user_id !== userId) {
            throw new ForbiddenException(
                'You do not have permission to cancel this quotation',
            );
        }

        if (quotation.status !== 'pending') {
            throw new BadRequestException(
                'Only pending quotations can be cancelled.',
            );
        }

        await this.prisma.quotations.delete({
            where: { id: quotationId },
        });

        return {
            message: 'Quotation cancelled successfully.',
        };
    }

    async createMessage(
        quotationId: bigint,
        dto: StoreQuotationMessageDto,
        userId: bigint,
    ) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: quotationId },
        });

        if (!quotation) {
            throw new NotFoundException('Quotation not found');
        }

        if (quotation.user_id !== userId) {
            throw new ForbiddenException(
                'You do not have permission to send messages for this quotation',
            );
        }

        await this.prisma.quotation_messages.create({
            data: {
                quotation_id: quotationId,
                user_id: userId,
                sender: 'customer',
                message: dto.message,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        // Explicitly return formatted response to avoid Prisma object serialization
        return {
            message: 'Message sent.',
        };
    }

    async confirm(quotationId: bigint, userId: bigint) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: quotationId },
        });

        if (!quotation) {
            throw new NotFoundException('Quotation not found');
        }

        if (quotation.user_id !== userId) {
            throw new ForbiddenException(
                'You do not have permission to confirm this quotation',
            );
        }

        // Find all related quotations in the same group
        let relatedQuotations: any[] = [];
        if (quotation.quotation_group_id) {
            relatedQuotations = await this.prisma.quotations.findMany({
                where: {
                    quotation_group_id: quotation.quotation_group_id,
                    user_id: userId,
                },
            });
        } else {
            // Fallback for old quotations without group_id
            const createdAt = quotation.created_at;
            if (createdAt) {
                const timeWindow = new Date(createdAt);
                timeWindow.setMinutes(timeWindow.getMinutes() - 5);
                const timeWindowEnd = new Date(createdAt);
                timeWindowEnd.setMinutes(timeWindowEnd.getMinutes() + 5);

                relatedQuotations = await this.prisma.quotations.findMany({
                    where: {
                        user_id: userId,
                        created_at: {
                            gte: timeWindow,
                            lte: timeWindowEnd,
                        },
                    },
                });
            }
        }

        // Check if any quotation in the group (including the main one) requires confirmation
        const hasPendingConfirmation =
            quotation.status === 'pending_customer_confirmation' ||
            relatedQuotations.some(
                (q) => q.status === 'pending_customer_confirmation',
            );

        if (!hasPendingConfirmation) {
            throw new BadRequestException(
                'No confirmation required for this quotation.',
            );
        }

        // Check if already confirmed (including the main quotation)
        const allQuotations = [quotation, ...relatedQuotations];
        const alreadyConfirmed = allQuotations.every(
            (q) => q.status === 'customer_confirmed',
        );

        if (alreadyConfirmed) {
            return {
                message: 'Quotation already confirmed.',
            };
        }

        // Update all related quotations in the group (including the main one) to customer_confirmed
        const allQuotationsToUpdate = [
            { id: quotation.id, status: quotation.status },
            ...relatedQuotations.map((q) => ({ id: q.id, status: q.status })),
        ];

        for (const q of allQuotationsToUpdate) {
            if (q.status === 'pending_customer_confirmation') {
                await this.prisma.quotations.update({
                    where: { id: q.id },
                    data: {
                        status: 'customer_confirmed',
                        updated_at: new Date(),
                    },
                });
            }
        }

        // Add message to the main quotation only
        await this.prisma.quotation_messages.create({
            data: {
                quotation_id: quotationId,
                user_id: userId,
                sender: 'customer',
                message: 'Customer approved the updated quotation.',
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return {
            message: 'Quotation approved. Awaiting admin confirmation.',
        };
    }

    async decline(quotationId: bigint, userId: bigint) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: quotationId },
        });

        if (!quotation) {
            throw new NotFoundException('Quotation not found');
        }

        if (quotation.user_id !== userId) {
            throw new ForbiddenException(
                'You do not have permission to decline this quotation',
            );
        }

        // Find all related quotations in the same group
        let relatedQuotations: any[] = [];
        if (quotation.quotation_group_id) {
            relatedQuotations = await this.prisma.quotations.findMany({
                where: {
                    quotation_group_id: quotation.quotation_group_id,
                    user_id: userId,
                },
            });
        } else {
            // Fallback for old quotations without group_id
            const createdAt = quotation.created_at;
            if (createdAt) {
                const timeWindow = new Date(createdAt);
                timeWindow.setMinutes(timeWindow.getMinutes() - 5);
                const timeWindowEnd = new Date(createdAt);
                timeWindowEnd.setMinutes(timeWindowEnd.getMinutes() + 5);

                relatedQuotations = await this.prisma.quotations.findMany({
                    where: {
                        user_id: userId,
                        created_at: {
                            gte: timeWindow,
                            lte: timeWindowEnd,
                        },
                    },
                });
            }
        }

        // Check if any quotation in the group (including the main one) requires confirmation
        const hasPendingConfirmation =
            quotation.status === 'pending_customer_confirmation' ||
            relatedQuotations.some(
                (q) => q.status === 'pending_customer_confirmation',
            );

        if (!hasPendingConfirmation) {
            throw new BadRequestException(
                'No confirmation required for this quotation.',
            );
        }

        // Check if already declined
        const alreadyDeclined = relatedQuotations.every(
            (q) => q.status === 'customer_declined',
        );

        if (alreadyDeclined) {
            return {
                message: 'Quotation already declined.',
            };
        }

        // Update all related quotations in the group (including the main one) to customer_declined
        const allQuotationsToUpdate = [
            { id: quotation.id, status: quotation.status },
            ...relatedQuotations.map((q) => ({ id: q.id, status: q.status })),
        ];

        for (const q of allQuotationsToUpdate) {
            if (q.status === 'pending_customer_confirmation') {
                await this.prisma.quotations.update({
                    where: { id: q.id },
                    data: {
                        status: 'customer_declined',
                        updated_at: new Date(),
                    },
                });
            }
        }

        // Add message to the main quotation only
        await this.prisma.quotation_messages.create({
            data: {
                quotation_id: quotationId,
                user_id: userId,
                sender: 'customer',
                message: 'Customer declined the updated quotation.',
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return {
            message: 'Quotation declined.',
        };
    }

    private async calculateQuotationTaxSummary(
        quotation: any,
        relatedQuotations: any[],
        user: any,
    ) {
        const allQuotations = [quotation, ...relatedQuotations];
        let totalSubtotal = 0;

        for (const q of allQuotations) {
            if (!q.products) {
                continue;
            }
            const pricing = await this.pricingService.calculateProductPrice(
                q.products,
                user,
                {
                    variant_id: q.product_variants
                        ? Number(q.product_variants.id)
                        : null,
                    quantity: q.quantity,
                    customer_group_id: user?.customer_group_id
                        ? Number(user.customer_group_id)
                        : undefined,
                    customer_type: user?.type || undefined,
                },
            );

            const unitSubtotal =
                pricing.subtotal ||
                (pricing.metal || 0) +
                    (pricing.diamond || 0) +
                    (pricing.making || 0);
            const unitDiscount = pricing.discount || 0;
            const lineSubtotal = (unitSubtotal - unitDiscount) * q.quantity;

            totalSubtotal += lineSubtotal;
        }

        const taxAmount = await this.taxService.calculateTax(totalSubtotal);
        const grandTotal = totalSubtotal + taxAmount;

        return {
            subtotal: Math.round(totalSubtotal * 100) / 100,
            tax: Math.round(taxAmount * 100) / 100,
            total: Math.round(grandTotal * 100) / 100,
        };
    }
}

