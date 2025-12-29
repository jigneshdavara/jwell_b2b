import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../../common/pricing/pricing.service';
import { TaxService } from '../../common/tax/tax.service';
import { MailService } from '../../common/mail/mail.service';
import {
    QuotationFilterDto,
    RequestConfirmationDto,
    UpdateQuotationProductDto,
    AddQuotationItemDto,
} from '../../quotations/dto/quotation.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuotationsService {
    constructor(
        private prisma: PrismaService,
        private pricingService: PricingService,
        private taxService: TaxService,
        private mailService: MailService,
    ) {}

    async findAll(filters: QuotationFilterDto) {
        const page = parseInt(filters.page || '1');
        const perPage = 20;
        const skip = (page - 1) * perPage;

        const where: any = {};
        if (filters.order_reference) {
            where.orders = {
                reference: {
                    contains: filters.order_reference,
                    mode: 'insensitive',
                },
            };
        }
        if (filters.customer_name) {
            where.users = {
                name: { contains: filters.customer_name, mode: 'insensitive' },
            };
        }
        if (filters.customer_email) {
            where.users = {
                email: {
                    contains: filters.customer_email,
                    mode: 'insensitive',
                },
            };
        }

        const items = await this.prisma.quotations.findMany({
            where,
            include: {
                users: true,
                products: true,
                orders: true,
            },
            orderBy: { created_at: 'desc' },
        });

        // Grouping for admin is same as frontend
        const groups = new Map<string, any[]>();
        for (const item of items) {
            let groupKey = item.quotation_group_id;
            if (!groupKey) {
                const date = item.created_at;
                if (date) {
                    const minute = Math.floor(date.getMinutes() / 5) * 5;
                    groupKey = `${item.user_id}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}:${minute}`;
                } else {
                    groupKey = `${item.user_id}_no_date`;
                }
            }
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            const group = groups.get(groupKey);
            if (group) {
                group.push(item);
            }
        }

        const allFormatted = Array.from(groups.values()).map((group) => {
            const first = group[0];
            return {
                id: first.id.toString(),
                ids: group.map((q) => q.id.toString()),
                status: first.status,
                quantity: group.reduce((sum, q) => sum + q.quantity, 0),
                created_at: first.created_at,
                product: {
                    id: first.products.id.toString(),
                    name: first.products.name,
                },
                products: group.map((q) => ({
                    id: q.products.id.toString(),
                    name: q.products.name,
                })),
                user: { name: first.users.name, email: first.users.email },
                order_reference: first.orders?.reference || null,
            };
        });

        const total = allFormatted.length;
        const paginated = allFormatted.slice(skip, skip + perPage);

        return {
            items: paginated,
            meta: {
                total,
                page,
                perPage,
                lastPage: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: number) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
            include: {
                users: true,
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
                orders: {
                    include: {
                        order_status_histories: {
                            orderBy: { created_at: 'desc' },
                        },
                    },
                },
                quotation_messages: {
                    include: { users: true },
                    orderBy: { created_at: 'asc' },
                },
            },
        });

        if (!quotation) throw new NotFoundException('Quotation not found');

        const related = await this.prisma.quotations.findMany({
            where: {
                id: { not: quotation.id },
                quotation_group_id: quotation.quotation_group_id,
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
            },
        });

        const user = quotation.users;
        const priceBreakdown = await this.pricingService.calculateProductPrice(
            quotation.products,
            user,
            {
                variant_id: quotation.product_variant_id,
                quantity: quotation.quantity,
                user_group_id: user.user_group_id,
                user_type: user.type,
            },
        );

        const relatedFormatted = await Promise.all(
            related.map(async (q) => {
                const p = await this.pricingService.calculateProductPrice(
                    q.products,
                    user,
                    {
                        variant_id: q.product_variant_id,
                        quantity: q.quantity,
                        user_group_id: user.user_group_id,
                        user_type: user.type,
                    },
                );
                return {
                    id: q.id.toString(),
                    status: q.status,
                    quantity: q.quantity,
                    notes: q.notes,
                    product: this.formatProductForAdminQuotation(q.products),
                    variant: q.product_variants
                        ? {
                              id: q.product_variants.id.toString(),
                              label: q.product_variants.label,
                          }
                        : null,
                    price_breakdown: p,
                };
            }),
        );

        const taxSummary = await this.calculateTaxSummary(
            [quotation, ...related],
            user,
        );

        return {
            id: quotation.id.toString(),
            status: quotation.status,
            quantity: quotation.quantity,
            notes: quotation.notes,
            admin_notes: quotation.admin_notes,
            created_at: quotation.created_at,
            updated_at: quotation.updated_at,
            approved_at: quotation.approved_at,
            product: this.formatProductForAdminQuotation(quotation.products),
            variant: quotation.product_variants
                ? {
                      id: quotation.product_variants.id.toString(),
                      label: quotation.product_variants.label,
                  }
                : null,
            price_breakdown: priceBreakdown,
            related_quotations: relatedFormatted,
            tax_summary: taxSummary,
            user: {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
            },
            messages: quotation.quotation_messages.map((m) => ({
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

    async approve(id: number, adminNotes?: string) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
            include: { users: true },
        });
        if (!quotation) throw new NotFoundException('Quotation not found');

        if (quotation.status === 'approved')
            throw new BadRequestException('Already approved');
        if (!['pending', 'customer_confirmed'].includes(quotation.status)) {
            throw new BadRequestException(
                'Quotation must be confirmed by customer before approval',
            );
        }

        const related = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotation.quotation_group_id,
                status: { in: ['pending', 'customer_confirmed'] },
            },
            include: { products: true, users: true },
        });

        if (related.length === 0)
            throw new BadRequestException('No quotations found to approve');

        return await this.prisma.$transaction(async (tx) => {
            // Create Order
            const order = await this.createOrderFromQuotations(related, tx);

            for (const q of related) {
                await tx.quotations.update({
                    where: { id: q.id },
                    data: {
                        status: 'approved',
                        approved_at: new Date(),
                        admin_notes: adminNotes,
                        order_id: order.id,
                        updated_at: new Date(),
                    },
                });

                // Inventory update
                if (q.product_variant_id) {
                    const variant = await tx.product_variants.findUnique({
                        where: { id: q.product_variant_id },
                    });
                    if (variant && variant.inventory_quantity !== null) {
                        await tx.product_variants.update({
                            where: { id: q.product_variant_id },
                            data: {
                                inventory_quantity: Math.max(
                                    0,
                                    (variant.inventory_quantity || 0) -
                                        q.quantity,
                                ),
                            },
                        });
                    }
                }
            }

            // Send approval email (send for first quotation in group)
            if (related.length > 0) {
                try {
                    await this.mailService.sendQuotationApproved(
                        Number(related[0].id),
                    );
                } catch (error) {
                    console.error(
                        'Failed to send quotation approval email:',
                        error,
                    );
                }
            }

            return {
                order_id: order.id.toString(),
                message: 'Quotations approved',
            };
        });
    }

    async reject(id: number, adminNotes?: string) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
            include: { users: true },
        });
        if (!quotation) throw new NotFoundException('Quotation not found');

        await this.prisma.quotations.updateMany({
            where: {
                quotation_group_id: quotation.quotation_group_id,
                status: { not: 'rejected' },
            },
            data: {
                status: 'rejected',
                admin_notes: adminNotes,
                updated_at: new Date(),
            },
        });

        // Send rejection email
        try {
            await this.mailService.sendQuotationRejected(
                Number(id),
                adminNotes,
            );
        } catch (error) {
            console.error('Failed to send quotation rejection email:', error);
        }

        return { message: 'Quotations rejected' };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async addMessage(id: number, message: string, _userId: bigint) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
        });
        if (!quotation) throw new NotFoundException('Quotation not found');

        return await this.prisma.quotation_messages.create({
            data: {
                quotation_id: quotation.id,
                user_id: null, // Admin messages don't have user_id
                sender: 'admin',
                message,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    async requestConfirmation(id: number, dto: RequestConfirmationDto) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
            include: { products: true },
        });
        if (!quotation) throw new NotFoundException('Quotation not found');

        const related = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotation.quotation_group_id,
                status: { in: ['pending', 'approved', 'rejected'] },
            },
        });

        return await this.prisma.$transaction(async (tx) => {
            for (const q of related) {
                const updateData: any = {
                    status: 'pending_customer_confirmation',
                    updated_at: new Date(),
                };
                if (dto.notes) updateData.admin_notes = dto.notes;

                if (q.id === quotation.id) {
                    updateData.quantity = dto.quantity;
                    if (dto.product_variant_id)
                        updateData.product_variant_id = BigInt(
                            dto.product_variant_id,
                        );
                }

                await tx.quotations.update({
                    where: { id: q.id },
                    data: updateData,
                });

                await tx.quotation_messages.create({
                    data: {
                        quotation_id: q.id,
                        sender: 'admin',
                        message:
                            dto.notes ||
                            'Please review updated quotation details.',
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }

            // Send confirmation request email (send for main quotation)
            try {
                await this.mailService.sendQuotationConfirmationRequest(
                    Number(id),
                    dto.notes,
                );
            } catch (error) {
                console.error(
                    'Failed to send quotation confirmation request email:',
                    error,
                );
            }

            return { message: 'Confirmation requested' };
        });
    }

    async addItem(id: number, dto: AddQuotationItemDto) {
        const baseQuotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
        });
        if (!baseQuotation) throw new NotFoundException('Quotation not found');

        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(dto.product_id) },
        });
        if (!product) throw new NotFoundException('Product not found');

        if (dto.product_variant_id) {
            const variant = await this.prisma.product_variants.findUnique({
                where: { id: BigInt(dto.product_variant_id) },
            });
            if (!variant || variant.product_id !== product.id)
                throw new BadRequestException('Invalid variant');
            if (
                variant.inventory_quantity !== null &&
                variant.inventory_quantity < dto.quantity
            )
                throw new BadRequestException('Insufficient inventory');
        }

        return await this.prisma.$transaction(async (tx) => {
            const newQ = await tx.quotations.create({
                data: {
                    user_id: baseQuotation.user_id,
                    quotation_group_id:
                        baseQuotation.quotation_group_id || uuidv4(),
                    product_id: product.id,
                    product_variant_id: dto.product_variant_id
                        ? BigInt(dto.product_variant_id)
                        : null,
                    status: 'pending_customer_confirmation',
                    quantity: dto.quantity,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            const message =
                dto.admin_notes ||
                `Added new product '${product.name}' to quotation.`;
            await tx.quotation_messages.create({
                data: {
                    quotation_id: baseQuotation.id,
                    sender: 'admin',
                    message,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            // Send confirmation request email after transaction
            try {
                await this.mailService.sendQuotationConfirmationRequest(
                    Number(baseQuotation.id),
                    message,
                );
            } catch (error) {
                console.error(
                    'Failed to send quotation confirmation request email:',
                    error,
                );
            }

            return newQ;
        });
    }

    async updateProduct(id: number, dto: UpdateQuotationProductDto) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
            include: { products: true },
        });
        if (!quotation) throw new NotFoundException('Quotation not found');

        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(dto.product_id) },
        });
        if (!product) throw new NotFoundException('Product not found');

        return await this.prisma.$transaction(async (tx) => {
            await tx.quotations.update({
                where: { id: quotation.id },
                data: {
                    product_id: product.id,
                    product_variant_id: dto.product_variant_id
                        ? BigInt(dto.product_variant_id)
                        : quotation.product_variant_id,
                    quantity: dto.quantity,
                    status: 'pending_customer_confirmation',
                    admin_notes: dto.admin_notes,
                    updated_at: new Date(),
                },
            });

            // Update related
            await tx.quotations.updateMany({
                where: {
                    id: { not: quotation.id },
                    quotation_group_id: quotation.quotation_group_id,
                },
                data: {
                    status: 'pending_customer_confirmation',
                    admin_notes: dto.admin_notes,
                    updated_at: new Date(),
                },
            });

            const message =
                dto.admin_notes ||
                `Product changed from '${quotation.products.name}' to '${product.name}'.`;
            await tx.quotation_messages.create({
                data: {
                    quotation_id: quotation.id,
                    sender: 'admin',
                    message,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            // Send confirmation request email after transaction
            try {
                await this.mailService.sendQuotationConfirmationRequest(
                    Number(id),
                    message,
                );
            } catch (error) {
                console.error(
                    'Failed to send quotation confirmation request email:',
                    error,
                );
            }

            return { message: 'Product updated' };
        });
    }

    async remove(id: number) {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(id) },
        });
        if (!quotation) {
            throw new NotFoundException('Quotation not found');
        }
        return await this.prisma.quotations.delete({
            where: { id: BigInt(id) },
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

    private async createOrderFromQuotations(
        quotations: any[],
        tx: any,
    ): Promise<any> {
        const first = quotations[0];
        const user = first.users;

        let totalSubtotal = 0;
        let totalDiscount = 0;
        const orderItems: any[] = [];

        for (const q of quotations) {
            const p = await this.pricingService.calculateProductPrice(
                q.products,
                user,
                {
                    variant_id: q.product_variant_id,
                    quantity: q.quantity,
                    user_group_id: user.user_group_id,
                    user_type: user.type,
                },
            );

            const unitSubtotal =
                p.subtotal ||
                (p.metal || 0) + (p.diamond || 0) + (p.making || 0);
            const unitDiscount = p.discount || 0;
            const unitTotal = p.total || unitSubtotal - unitDiscount;

            totalSubtotal += unitSubtotal * q.quantity;
            totalDiscount += unitDiscount * q.quantity;

            orderItems.push({
                product: q.products,
                variant_id: q.product_variant_id,
                quantity: q.quantity,
                unit_price: unitTotal,
                total_price: unitTotal * q.quantity,
                line_subtotal: unitSubtotal * q.quantity,
                line_discount: unitDiscount * q.quantity,
                pricing: p,
                quotation_id: q.id,
            } as any);
        }

        const taxableAmount = totalSubtotal - totalDiscount;
        const taxAmount = await this.taxService.calculateTax(taxableAmount);
        const totalAmount = totalSubtotal + taxAmount - totalDiscount;

        const reference = Math.random()
            .toString(36)
            .substring(2, 12)
            .toUpperCase();

        const order = await tx.orders.create({
            data: {
                user_id: user.id,
                status: 'in_production',
                reference,
                currency: 'INR',
                total_amount: totalAmount,
                subtotal_amount: totalSubtotal,
                tax_amount: taxAmount,
                discount_amount: totalDiscount,
                price_breakdown: {
                    items: orderItems.map((item) => ({
                        quotation_id: item.quotation_id.toString(),
                        unit: item.pricing,
                        quantity: item.quantity,
                        line_subtotal:
                            Math.round(item.line_subtotal * 100) / 100,
                        line_discount:
                            Math.round(item.line_discount * 100) / 100,
                    })),
                },
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        for (const item of orderItems) {
            let variantData: any = null;
            if (item.variant_id) {
                const v = await tx.product_variants.findUnique({
                    where: { id: item.variant_id },
                });
                if (v) {
                    variantData = {
                        id: v.id.toString(),
                        label: v.label,
                        metadata: v.metadata,
                    };
                }
            }

            await tx.order_items.create({
                data: {
                    order_id: order.id,
                    product_id: (item as any).product.id,
                    sku: (item as any).product.sku,
                    name: (item as any).product.name,
                    quantity: (item as any).quantity,
                    unit_price: (item as any).unit_price,
                    total_price: (item as any).total_price,
                    metadata: {
                        quotation_id: (item as any).quotation_id.toString(),
                        variant: variantData,
                    },
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }

        await tx.order_status_histories.create({
            data: {
                order_id: order.id,
                status: 'in_production',
                meta: {
                    source: 'quotation_approval',
                    quotation_ids: quotations.map((q) => q.id.toString()),
                },
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return order;
    }

    private formatProductForAdminQuotation(product: any) {
        return {
            id: product.id.toString(),
            name: product.name,
            sku: product.sku,
            making_charge_amount: product.making_charge_amount?.toNumber(),
            media: product.product_medias.map((m) => ({ url: m.url })),
            variants: product.product_variants.map((v) => ({
                id: v.id.toString(),
                label: v.label,
                metadata: v.metadata || {},
                size_id: v.size_id?.toString(),
                size: v.sizes
                    ? {
                          id: v.sizes.id.toString(),
                          name: v.sizes.name,
                          value: v.sizes.value,
                      }
                    : null,
                metals: v.product_variant_metals.map((m) => ({
                    id: m.id.toString(),
                    metal_id: m.metal_id.toString(),
                    metal: { id: m.metals.id.toString(), name: m.metals.name },
                    metal_purity: {
                        id: m.metal_purities.id.toString(),
                        name: m.metal_purities.name,
                    },
                    metal_tone: {
                        id: m.metal_tones.id.toString(),
                        name: m.metal_tones.name,
                    },
                })),
            })),
        };
    }
}
