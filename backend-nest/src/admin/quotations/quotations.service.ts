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
            const groupKey = item.quotation_group_id;
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            const group = groups.get(groupKey);
            if (group) {
                group.push(item);
            }
        }

        const allFormatted = Array.from(groups.entries()).map(
            ([groupKey, group]) => {
                const first = group[0];
                // Use actual quotation_group_id from database only (no generation)
                const actualQuotationGroupId = first.quotation_group_id;

                return {
                    quotation_group_id: actualQuotationGroupId,
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
            },
        );

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

    async findByGroupId(quotationGroupId: string) {
        // Find all quotations in the group
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
            },
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
            },
            orderBy: { created_at: 'asc' },
        });

        if (quotations.length === 0)
            throw new NotFoundException('Quotation group not found');

        // Use the first quotation as the primary one
        const quotation = quotations[0];
        const related = quotations.slice(1);

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
                    quotation_group_id: q.quotation_group_id,
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
            quotation_group_id: quotation.quotation_group_id,
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
            messages: (
                await this.prisma.quotation_messages.findMany({
                    where: {
                        quotation_group_id: quotation.quotation_group_id,
                    },
                    include: { users: true },
                    orderBy: { created_at: 'asc' },
                })
            ).map((m) => ({
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
                'Quotation must be confirmed by user before approval',
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
                        related[0].quotation_group_id,
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

    async approveByGroupId(quotationGroupId: string, adminNotes?: string) {
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
            },
            include: { users: true },
        });

        if (quotations.length === 0)
            throw new NotFoundException('Quotation group not found');

        const firstQuotation = quotations[0];

        if (firstQuotation.status === 'approved')
            throw new BadRequestException('Already approved');
        if (
            !['pending', 'customer_confirmed'].includes(firstQuotation.status)
        ) {
            throw new BadRequestException(
                'Quotation must be confirmed by user before approval',
            );
        }

        const related = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
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
                        related[0].quotation_group_id,
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

    async rejectByGroupId(quotationGroupId: string, adminNotes?: string) {
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
            },
            include: { users: true },
        });

        if (quotations.length === 0)
            throw new NotFoundException('Quotation group not found');

        await this.prisma.quotations.updateMany({
            where: {
                quotation_group_id: quotationGroupId,
                status: { not: 'rejected' },
            },
            data: {
                status: 'rejected',
                admin_notes: adminNotes,
                updated_at: new Date(),
            },
        });

        // Send rejection email (use first quotation for email)
        if (quotations.length > 0) {
            try {
                await this.mailService.sendQuotationRejected(
                    quotations[0].quotation_group_id,
                    adminNotes,
                );
            } catch (error) {
                console.error(
                    'Failed to send quotation rejection email:',
                    error,
                );
            }
        }

        return { message: 'Quotations rejected' };
    }

    async addMessageByGroupId(
        quotationGroupId: string,
        message: string,
        _userId: bigint,
    ) {
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
            },
            orderBy: { created_at: 'asc' },
        });

        if (quotations.length === 0)
            throw new NotFoundException('Quotation group not found');

        // Use the first quotation in the group for the message
        const quotation = quotations[0];

        await this.prisma.quotation_messages.create({
            data: {
                quotation_group_id: quotation.quotation_group_id,
                user_id: null, // Admin messages don't have user_id
                sender: 'admin',
                message,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return { success: true };
    }

    async requestConfirmationByGroupId(
        quotationGroupId: string,
        dto: RequestConfirmationDto,
    ) {
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
                status: { in: ['pending', 'approved', 'rejected'] },
            },
            include: { products: true },
            orderBy: { created_at: 'asc' },
        });

        if (quotations.length === 0)
            throw new NotFoundException('Quotation group not found');

        await this.prisma.$transaction(async (tx) => {
            // Update the first quotation with the new details
            const firstQuotation = quotations[0];
            const updateData: any = {
                status: 'pending_customer_confirmation',
                updated_at: new Date(),
            };
            if (dto.notes) updateData.admin_notes = dto.notes;
            if (dto.quantity) updateData.quantity = dto.quantity;
            if (dto.product_variant_id)
                updateData.product_variant_id = BigInt(dto.product_variant_id);

            await tx.quotations.update({
                where: { id: firstQuotation.id },
                data: updateData,
            });

            // Update other quotations in the group
            for (const q of quotations.slice(1)) {
                const relatedUpdateData: any = {
                    status: 'pending_customer_confirmation',
                    updated_at: new Date(),
                };
                if (dto.notes) relatedUpdateData.admin_notes = dto.notes;

                await tx.quotations.update({
                    where: { id: q.id },
                    data: relatedUpdateData,
                });
            }

            // Create messages for all quotations
            const quotationGroupId = quotations[0].quotation_group_id;
            await tx.quotation_messages.create({
                data: {
                    quotation_group_id: quotationGroupId,
                    sender: 'admin',
                    message:
                        dto.notes || 'Please review updated quotation details.',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        });

        // Send confirmation request email (send for first quotation) - after transaction
        try {
            await this.mailService.sendQuotationConfirmationRequest(
                quotations[0].quotation_group_id,
                dto.notes,
            );
        } catch (error) {
            console.error(
                'Failed to send quotation confirmation request email:',
                error,
            );
        }

        return { message: 'Confirmation requested' };
    }

    async addItemByGroupId(quotationGroupId: string, dto: AddQuotationItemDto) {
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
            },
            orderBy: { created_at: 'asc' },
        });

        if (quotations.length === 0)
            throw new NotFoundException('Quotation group not found');

        const baseQuotation = quotations[0];

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
                    quotation_group_id: quotationGroupId,
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
                    quotation_group_id: baseQuotation.quotation_group_id,
                    sender: 'admin',
                    message,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });

            // Send confirmation request email after transaction
            try {
                await this.mailService.sendQuotationConfirmationRequest(
                    baseQuotation.quotation_group_id,
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

    async updateProductByGroupId(
        quotationGroupId: string,
        dto: UpdateQuotationProductDto,
    ) {
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
            },
            include: { products: true },
            orderBy: { created_at: 'asc' },
        });

        if (quotations.length === 0)
            throw new NotFoundException('Quotation group not found');

        const firstQuotation = quotations[0];

        const product = await this.prisma.products.findUnique({
            where: { id: BigInt(dto.product_id) },
        });
        if (!product) throw new NotFoundException('Product not found');

        return await this.prisma.$transaction(async (tx) => {
            // Update the first quotation with new product details
            await tx.quotations.update({
                where: { id: firstQuotation.id },
                data: {
                    product_id: product.id,
                    product_variant_id: dto.product_variant_id
                        ? BigInt(dto.product_variant_id)
                        : firstQuotation.product_variant_id,
                    quantity: dto.quantity,
                    status: 'pending_customer_confirmation',
                    admin_notes: dto.admin_notes,
                    updated_at: new Date(),
                },
            });

            // Get quotation_group_id for use below
            const quotationGroupId = quotations[0].quotation_group_id;

            // Update other quotations in the group (status and notes only)
            if (quotations.length > 1 && quotationGroupId) {
                await tx.quotations.updateMany({
                    where: {
                        id: { not: firstQuotation.id },
                        quotation_group_id: quotationGroupId,
                    },
                    data: {
                        status: 'pending_customer_confirmation',
                        admin_notes: dto.admin_notes,
                        updated_at: new Date(),
                    },
                });
            }

            const message =
                dto.admin_notes ||
                `Product changed from '${firstQuotation.products.name}' to '${product.name}'.`;

            // Create message for the quotation group
            if (quotationGroupId) {
                await tx.quotation_messages.create({
                    data: {
                        quotation_group_id: quotationGroupId,
                        sender: 'admin',
                        message,
                        created_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }

            // Send confirmation request email after transaction
            try {
                await this.mailService.sendQuotationConfirmationRequest(
                    firstQuotation.quotation_group_id,
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

    async removeByGroupId(quotationGroupId: string) {
        const quotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
            },
        });

        if (quotations.length === 0) {
            throw new NotFoundException('Quotation group not found');
        }

        // Delete all quotations in the group
        return await this.prisma.quotations.deleteMany({
            where: {
                quotation_group_id: quotationGroupId,
            },
        });
    }

    async removeById(quotationId: string) {
        const quotation = await this.prisma.quotations.findUnique({
            where: {
                id: BigInt(quotationId),
            },
        });

        if (!quotation) {
            throw new NotFoundException('Quotation not found');
        }

        const quotationGroupId = quotation.quotation_group_id;

        // Check if this is the last quotation in the group
        const remainingQuotations = await this.prisma.quotations.findMany({
            where: {
                quotation_group_id: quotationGroupId,
            },
        });

        const isLastQuotation = remainingQuotations.length === 1;

        // Delete the single quotation
        await this.prisma.quotations.delete({
            where: {
                id: BigInt(quotationId),
            },
        });

        // If this was the last quotation in the group, also delete related messages
        if (isLastQuotation) {
            await this.prisma.quotation_messages.deleteMany({
                where: {
                    quotation_group_id: quotationGroupId,
                },
            });
        }

        return {
            message: 'Quotation removed successfully',
            isLastQuotation,
            quotation_group_id: quotationGroupId,
        };
    }

    async getStatistics(
        userId?: number,
        dateFilter?: { startDate?: string; endDate?: string },
    ) {
        // Build where clause
        const where: any = {};
        if (userId) {
            where.user_id = BigInt(userId);
        }

        // Add date filter if provided
        if (dateFilter?.startDate || dateFilter?.endDate) {
            where.created_at = {};
            if (dateFilter.startDate && dateFilter.startDate.trim() !== '') {
                // Start of day - parse date string and set to start of day in local timezone
                const startDate = new Date(dateFilter.startDate + 'T00:00:00');
                where.created_at.gte = startDate;
            }
            if (dateFilter.endDate && dateFilter.endDate.trim() !== '') {
                // End of day - parse date string and set to end of day in local timezone
                const endDate = new Date(dateFilter.endDate + 'T23:59:59.999');
                where.created_at.lte = endDate;
            }
        }

        // Get all quotations with basic info (get unique groups)
        const allQuotations = await this.prisma.quotations.findMany({
            where,
            select: {
                id: true,
                status: true,
                quantity: true,
                quotation_group_id: true,
                created_at: true,
                user_id: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        // Group by quotation_group_id to get unique quotation groups
        const quotationGroups = new Map<string, any>();
        for (const q of allQuotations) {
            const groupKey = q.quotation_group_id;
            if (!quotationGroups.has(groupKey)) {
                quotationGroups.set(groupKey, {
                    quotation_group_id: q.quotation_group_id,
                    status: q.status,
                    quantity: q.quantity,
                    created_at: q.created_at,
                    user_id: q.user_id.toString(),
                });
            }
        }

        const uniqueQuotations = Array.from(quotationGroups.values());

        // Calculate totals
        const totalQuotations = uniqueQuotations.length;
        const totalQuantity = uniqueQuotations.reduce(
            (sum, q) => sum + Number(q.quantity || 0),
            0,
        );
        const averageQuantity =
            totalQuotations > 0 ? totalQuantity / totalQuotations : 0;

        // Group by status
        const quotationsByStatus = uniqueQuotations.reduce(
            (acc, q) => {
                const status = q.status;
                if (!acc[status]) {
                    acc[status] = {
                        status,
                        status_label: this.formatStatusLabel(status),
                        count: 0,
                        quantity: 0,
                    };
                }
                acc[status].count += 1;
                acc[status].quantity += Number(q.quantity || 0);
                return acc;
            },
            {} as Record<
                string,
                {
                    status: string;
                    status_label: string;
                    count: number;
                    quantity: number;
                }
            >,
        );

        // Group by date (daily)
        const quotationsByDate = uniqueQuotations.reduce(
            (acc, q) => {
                if (!q.created_at) return acc;
                const date = new Date(q.created_at).toISOString().split('T')[0];
                if (!acc[date]) {
                    acc[date] = {
                        date,
                        count: 0,
                        quantity: 0,
                    };
                }
                acc[date].count += 1;
                acc[date].quantity += Number(q.quantity || 0);
                return acc;
            },
            {} as Record<
                string,
                { date: string; count: number; quantity: number }
            >,
        );

        // Convert to arrays and sort
        const statusData = Object.values(quotationsByStatus).sort(
            (
                a: {
                    status: string;
                    status_label: string;
                    count: number;
                    quantity: number;
                },
                b: {
                    status: string;
                    status_label: string;
                    count: number;
                    quantity: number;
                },
            ) => a.status.localeCompare(b.status),
        );
        const dateData = Object.values(quotationsByDate)
            .sort(
                (
                    a: { date: string; count: number; quantity: number },
                    b: { date: string; count: number; quantity: number },
                ) => a.date.localeCompare(b.date),
            )
            .slice(-30); // Last 30 days

        return {
            summary: {
                total_quotations: totalQuotations,
                total_quantity: totalQuantity.toString(),
                average_quantity: averageQuantity.toString(),
            },
            by_status: statusData,
            by_date: dateData,
        };
    }

    private formatStatusLabel(status: string): string {
        return status
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async exportStatisticsPDF(
        userId?: number,
        dateFilter?: { startDate?: string; endDate?: string },
    ): Promise<Buffer> {
        const statistics = await this.getStatistics(userId, dateFilter);
        return this.generateStatisticsPDF(statistics);
    }

    private async generateStatisticsPDF(statistics: any): Promise<Buffer> {
        const PDFDocument = require('pdfkit');
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4',
                    info: {
                        Title: 'Quotation Statistics Report',
                        Author: 'Elvee',
                        Subject: 'Quotation Report',
                    },
                });
                const buffers: Buffer[] = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfBuffer = Buffer.concat(buffers);
                    resolve(pdfBuffer);
                });
                doc.on('error', reject);

                // Colors
                const primaryColor = '#0E244D';
                const darkGray = '#1F2937';
                const mediumGray = '#6B7280';

                const hexToRgb = (hex: string) => {
                    const result =
                        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result
                        ? {
                              r: parseInt(result[1], 16),
                              g: parseInt(result[2], 16),
                              b: parseInt(result[3], 16),
                          }
                        : null;
                };

                const primaryRgb = hexToRgb(primaryColor);

                // Header
                doc.fillColor(
                    primaryRgb
                        ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                        : '#0E244D',
                )
                    .fontSize(24)
                    .font('Helvetica-Bold')
                    .text('Quotation Statistics Report', 50, 50);

                doc.fontSize(10)
                    .fillColor(mediumGray)
                    .font('Helvetica')
                    .text(
                        `Generated: ${new Date().toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}`,
                        400,
                        50,
                        { align: 'right' },
                    );

                let y = 100;

                // Quotations by Status
                if (statistics.by_status && statistics.by_status.length > 0) {
                    if (y > 650) {
                        doc.addPage();
                        y = 50;
                    }

                    doc.fontSize(16)
                        .fillColor(darkGray)
                        .font('Helvetica-Bold')
                        .text('Quotations by Status', 50, y);
                    y += 25;

                    // Table header
                    doc.fillColor(
                        primaryRgb
                            ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                            : '#0E244D',
                    )
                        .rect(50, y, 500, 25)
                        .fill();

                    doc.fillColor('#FFFFFF')
                        .fontSize(11)
                        .font('Helvetica-Bold')
                        .text('Status', 60, y + 8, { width: 200 })
                        .text('Count', 270, y + 8, {
                            width: 100,
                            align: 'right',
                        })
                        .text('Quantity', 380, y + 8, {
                            width: 160,
                            align: 'right',
                        });

                    y += 30;

                    doc.fontSize(10).font('Helvetica').fillColor(darkGray);

                    for (const item of statistics.by_status) {
                        if (y > 680) {
                            doc.addPage();
                            y = 50;
                            // Redraw header
                            doc.fillColor(
                                primaryRgb
                                    ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                                    : '#0E244D',
                            )
                                .rect(50, y, 500, 25)
                                .fill();

                            doc.fillColor('#FFFFFF')
                                .fontSize(11)
                                .font('Helvetica-Bold')
                                .text('Status', 60, y + 8, { width: 200 })
                                .text('Count', 270, y + 8, {
                                    width: 100,
                                    align: 'right',
                                })
                                .text('Quantity', 380, y + 8, {
                                    width: 160,
                                    align: 'right',
                                });
                            y += 30;
                            doc.fontSize(10)
                                .font('Helvetica')
                                .fillColor(darkGray);
                        }

                        doc.text(item.status_label, 60, y, { width: 200 })
                            .text(item.count.toString(), 270, y, {
                                width: 100,
                                align: 'right',
                            })
                            .text(
                                parseFloat(item.quantity || 0).toLocaleString(
                                    'en-IN',
                                ),
                                380,
                                y,
                                { width: 160, align: 'right' },
                            );

                        y += 20;
                    }

                    y += 20;
                }

                // Quotations Over Time
                if (statistics.by_date && statistics.by_date.length > 0) {
                    if (y > 600) {
                        doc.addPage();
                        y = 50;
                    }

                    doc.fontSize(16)
                        .fillColor(darkGray)
                        .font('Helvetica-Bold')
                        .text('Quotations Over Time (Last 30 Days)', 50, y);
                    y += 25;

                    // Table header
                    doc.fillColor(
                        primaryRgb
                            ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                            : '#0E244D',
                    )
                        .rect(50, y, 500, 25)
                        .fill();

                    doc.fillColor('#FFFFFF')
                        .fontSize(11)
                        .font('Helvetica-Bold')
                        .text('Date', 60, y + 8, { width: 150 })
                        .text('Count', 220, y + 8, {
                            width: 100,
                            align: 'right',
                        })
                        .text('Quantity', 330, y + 8, {
                            width: 210,
                            align: 'right',
                        });

                    y += 30;

                    doc.fontSize(10).font('Helvetica').fillColor(darkGray);

                    for (const item of statistics.by_date) {
                        if (y > 680) {
                            doc.addPage();
                            y = 50;
                            // Redraw header
                            doc.fillColor(
                                primaryRgb
                                    ? `rgb(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b})`
                                    : '#0E244D',
                            )
                                .rect(50, y, 500, 25)
                                .fill();

                            doc.fillColor('#FFFFFF')
                                .fontSize(11)
                                .font('Helvetica-Bold')
                                .text('Date', 60, y + 8, { width: 150 })
                                .text('Count', 220, y + 8, {
                                    width: 100,
                                    align: 'right',
                                })
                                .text('Quantity', 330, y + 8, {
                                    width: 210,
                                    align: 'right',
                                });
                            y += 30;
                            doc.fontSize(10)
                                .font('Helvetica')
                                .fillColor(darkGray);
                        }

                        const dateStr = new Date(item.date).toLocaleDateString(
                            'en-IN',
                            {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                            },
                        );

                        doc.text(dateStr, 60, y, { width: 150 })
                            .text(item.count.toString(), 220, y, {
                                width: 100,
                                align: 'right',
                            })
                            .text(
                                parseFloat(item.quantity || 0).toLocaleString(
                                    'en-IN',
                                ),
                                330,
                                y,
                                { width: 210, align: 'right' },
                            );

                        y += 20;
                    }

                    y += 20;
                }

                // Summary Section
                if (y > 650) {
                    doc.addPage();
                    y = 50;
                }

                doc.fontSize(16)
                    .fillColor(darkGray)
                    .font('Helvetica-Bold')
                    .text('Summary', 50, y);
                y += 25;

                doc.fontSize(10).font('Helvetica').fillColor(darkGray);
                doc.text(
                    `Total Quotations: ${statistics.summary.total_quotations}`,
                    50,
                    y,
                );
                y += 15;
                doc.text(
                    `Total Quantity: ${parseFloat(statistics.summary.total_quantity || '0').toLocaleString('en-IN')}`,
                    50,
                    y,
                );
                y += 15;
                doc.text(
                    `Average Quantity: ${parseFloat(statistics.summary.average_quantity || '0').toFixed(1)}`,
                    50,
                    y,
                );

                doc.end();
            } catch (error) {
                reject(error);
            }
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
                quotation_group_id: q.quotation_group_id,
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
                        quotation_group_id: item.quotation_group_id,
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
                        quotation_group_id: (item as any).quotation_group_id,
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
                    quotation_group_ids: quotations.map(
                        (q) => q.quotation_group_id,
                    ),
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
