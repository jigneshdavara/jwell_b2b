import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FrontendOrdersService {
    constructor(private prisma: PrismaService) {}

    async findAll(userId: bigint, page: number = 1, perPage: number = 15) {
        const skip = (page - 1) * perPage;

        const where = {
            user_id: userId,
        };

        const [items, total] = await Promise.all([
            this.prisma.orders.findMany({
                where,
                skip,
                take: perPage,
                orderBy: { created_at: 'desc' },
                include: {
                    order_items: {
                        select: {
                            id: true,
                            name: true,
                            quantity: true,
                        },
                    },
                },
            }),
            this.prisma.orders.count({ where }),
        ]);

        return {
            data: items.map((order) => ({
                id: order.id.toString(),
                reference: order.reference,
                status: order.status,
                status_label: this.formatStatusLabel(order.status),
                total_amount: Number(order.total_amount),
                created_at: order.created_at?.toISOString() || null,
                items: order.order_items.map((item) => ({
                    id: item.id.toString(),
                    name: item.name,
                    quantity: item.quantity,
                })),
            })),
            meta: {
                total,
                current_page: page,
                per_page: perPage,
                last_page: Math.ceil(total / perPage),
                from: skip + 1,
                to: Math.min(skip + perPage, total),
            },
        };
    }

    async findOne(orderId: bigint, userId: bigint) {
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: {
                order_items: {
                    include: {
                        products: {
                            include: {
                                product_medias: {
                                    orderBy: { display_order: 'asc' },
                                },
                            },
                        },
                    },
                },
                payments: {
                    select: {
                        id: true,
                        status: true,
                        amount: true,
                        created_at: true,
                    },
                },
                order_status_histories: {
                    orderBy: { created_at: 'desc' },
                    select: {
                        id: true,
                        status: true,
                        created_at: true,
                        meta: true,
                    },
                },
                quotations: {
                    include: {
                        products: {
                            include: {
                                product_medias: {
                                    orderBy: { display_order: 'asc' },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.user_id !== userId) {
            throw new ForbiddenException(
                'You do not have access to this order',
            );
        }

        const priceBreakdown =
            (order.price_breakdown as Record<string, any>) || {};

        return {
            id: order.id.toString(),
            reference: order.reference,
            status: order.status,
            status_label: this.formatStatusLabel(order.status),
            total_amount: Number(order.total_amount),
            subtotal_amount: Number(order.subtotal_amount),
            tax_amount: Number(order.tax_amount),
            discount_amount: Number(order.discount_amount),
            created_at: order.created_at?.toISOString() || null,
            updated_at: order.updated_at?.toISOString() || null,
            items: order.order_items.map((item) => {
                const itemMetadata =
                    (item.metadata as Record<string, any>) || {};
                const itemConfiguration =
                    (item.configuration as Record<string, any>) || {};

                // Try to get price breakdown from item metadata
                let priceBreakdown = itemMetadata.price_breakdown || null;

                // If not in item metadata, try to get from order-level price_breakdown
                if (!priceBreakdown) {
                    const orderBreakdown =
                        (order.price_breakdown as Record<string, any>) || {};
                    if (
                        orderBreakdown.items &&
                        Array.isArray(orderBreakdown.items)
                    ) {
                        for (const breakdownItem of orderBreakdown.items) {
                            if (
                                breakdownItem.unit &&
                                typeof breakdownItem.unit === 'object'
                            ) {
                                priceBreakdown = breakdownItem.unit;
                                break;
                            }
                        }
                    } else if (
                        orderBreakdown.unit &&
                        typeof orderBreakdown.unit === 'object'
                    ) {
                        priceBreakdown = orderBreakdown.unit;
                    }
                }

                // Ensure price_breakdown has all required fields with defaults
                if (priceBreakdown && typeof priceBreakdown === 'object') {
                    priceBreakdown = {
                        metal: Number(priceBreakdown.metal || 0),
                        diamond: Number(priceBreakdown.diamond || 0),
                        making: Number(priceBreakdown.making || 0),
                        subtotal:
                            Number(priceBreakdown.subtotal) ||
                            Number(priceBreakdown.metal || 0) +
                                Number(priceBreakdown.diamond || 0) +
                                Number(priceBreakdown.making || 0),
                        discount: Number(priceBreakdown.discount || 0),
                        total:
                            Number(priceBreakdown.total) ||
                            Number(item.unit_price),
                    };
                } else {
                    priceBreakdown = null;
                }

                return {
                    id: item.id.toString(),
                    name: item.name,
                    sku: item.sku,
                    quantity: item.quantity,
                    unit_price: Number(item.unit_price),
                    total_price: Number(item.total_price),
                    configuration: itemConfiguration,
                    metadata: itemMetadata,
                    price_breakdown: priceBreakdown,
                    calculated_making_charge: priceBreakdown
                        ? priceBreakdown.making
                        : null,
                    product: item.products
                        ? {
                              id: item.products.id.toString(),
                              name: item.products.name,
                              sku: item.products.sku,
                              making_charge_amount: item.products
                                  .making_charge_amount
                                  ? Number(item.products.making_charge_amount)
                                  : null,
                              making_charge_percentage: item.products
                                  .making_charge_percentage
                                  ? Number(
                                        item.products.making_charge_percentage,
                                    )
                                  : null,
                              making_charge_types: this.getMakingChargeTypes(
                                  item.products,
                              ),
                              media: item.products.product_medias.map(
                                  (media) => ({
                                      url: media.url,
                                      alt:
                                          ((media.metadata as any)?.alt as
                                              | string
                                              | undefined) ||
                                          item.products?.name ||
                                          '',
                                  }),
                              ),
                          }
                        : null,
                };
            }),
            payments: order.payments.map((payment) => ({
                id: payment.id.toString(),
                status: payment.status,
                amount: Number(payment.amount),
                created_at: payment.created_at?.toISOString() || null,
            })),
            status_history: order.order_status_histories.map((history) => ({
                id: history.id.toString(),
                status: history.status,
                created_at: history.created_at?.toISOString() || null,
                meta: (history.meta as Record<string, any>) || {},
            })),
            quotations: order.quotations.map((quotation) => ({
                id: quotation.id.toString(),
                status: quotation.status,
                quantity: quotation.quantity,
                product: quotation.products
                    ? {
                          id: quotation.products.id.toString(),
                          name: quotation.products.name,
                          sku: quotation.products.sku,
                          media: quotation.products.product_medias.map(
                              (media) => ({
                                  url: media.url,
                                  alt:
                                      ((media.metadata as any)?.alt as
                                          | string
                                          | undefined) ||
                                      quotation.products.name,
                              }),
                          ),
                      }
                    : null,
            })),
        };
    }

    private formatStatusLabel(status: string): string {
        return status
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    private getMakingChargeTypes(product: any): string[] {
        const metadata = (product.metadata as Record<string, any>) || {};
        if (
            metadata.making_charge_types &&
            Array.isArray(metadata.making_charge_types)
        ) {
            return metadata.making_charge_types;
        }

        // Fallback: infer from making_charge_amount and making_charge_percentage
        const types: string[] = [];
        if (product.making_charge_amount) {
            types.push('fixed');
        }
        if (product.making_charge_percentage) {
            types.push('percentage');
        }
        return types.length > 0 ? types : [];
    }
}
