import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderWorkflowService } from './order-workflow.service';
import { OrderStatus } from './dto/order.dto';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private orderWorkflowService: OrderWorkflowService,
    ) {}

    async findAll(
        page: number = 1,
        perPage: number = 10,
        filters?: {
            status?: string;
            search?: string;
        },
    ) {
        const skip = (page - 1) * perPage;

        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.search) {
            where.OR = [
                {
                    reference: {
                        contains: filters.search,
                        mode: 'insensitive',
                    },
                },
                {
                    users: {
                        name: { contains: filters.search, mode: 'insensitive' },
                    },
                },
                {
                    users: {
                        email: {
                            contains: filters.search,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.orders.findMany({
                where,
                skip,
                take: perPage,
                orderBy: { created_at: 'desc' },
                include: {
                    users: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    order_items: {
                        select: {
                            id: true,
                        },
                    },
                },
            }),
            this.prisma.orders.count({ where }),
        ]);

        // Get all order status enum values
        const statuses = Object.values(OrderStatus);

        return {
            items: items.map((order) => ({
                id: order.id.toString(),
                reference: order.reference,
                status: order.status,
                status_label: this.formatStatusLabel(order.status),
                total_amount: order.total_amount.toString(),
                created_at: order.created_at,
                user: order.users
                    ? {
                          name: order.users.name,
                          email: order.users.email,
                      }
                    : null,
                items_count: order.order_items.length,
            })),
            meta: {
                total,
                page,
                per_page: perPage,
                total_pages: Math.ceil(total / perPage),
            },
            statuses,
        };
    }

    async findOne(id: bigint) {
        const order = await this.prisma.orders.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
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
            throw new NotFoundException(`Order with ID ${id} not found`);
        }

        // Get all order status enum values with labels
        const statusOptions = Object.values(OrderStatus).map((status) => ({
            value: status,
            label: this.formatStatusLabel(status),
        }));

        return {
            id: order.id.toString(),
            reference: order.reference,
            status: order.status,
            status_label: this.formatStatusLabel(order.status),
            subtotal_amount: order.subtotal_amount.toString(),
            tax_amount: order.tax_amount.toString(),
            discount_amount: order.discount_amount.toString(),
            total_amount: order.total_amount.toString(),
            price_breakdown: order.price_breakdown,
            created_at: order.created_at,
            updated_at: order.updated_at,
            user: order.users
                ? {
                      name: order.users.name,
                      email: order.users.email,
                  }
                : null,
            items: order.order_items.map((item) => {
                // Try to get price breakdown from item metadata
                let priceBreakdown: any = null;
                if (item.metadata && typeof item.metadata === 'object') {
                    const metadata = item.metadata as any;
                    priceBreakdown = metadata.price_breakdown ?? null;
                }

                // If not in item metadata, try to get from order-level price_breakdown
                if (
                    !priceBreakdown &&
                    order.price_breakdown &&
                    typeof order.price_breakdown === 'object'
                ) {
                    const orderBreakdown = order.price_breakdown as any;
                    if (Array.isArray(orderBreakdown.items)) {
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

                // Ensure price_breakdown has all required fields
                if (priceBreakdown && typeof priceBreakdown === 'object') {
                    priceBreakdown = {
                        metal: parseFloat(priceBreakdown.metal ?? 0),
                        diamond: parseFloat(priceBreakdown.diamond ?? 0),
                        making: parseFloat(priceBreakdown.making ?? 0),
                        subtotal: parseFloat(priceBreakdown.subtotal ?? 0),
                        discount: parseFloat(priceBreakdown.discount ?? 0),
                        total: parseFloat(
                            priceBreakdown.total ??
                                parseFloat(item.unit_price.toString()),
                        ),
                    };
                }

                return {
                    id: item.id.toString(),
                    sku: item.sku,
                    name: item.name,
                    quantity: item.quantity,
                    unit_price: item.unit_price.toString(),
                    total_price: item.total_price.toString(),
                    configuration: item.configuration,
                    metadata: item.metadata,
                    price_breakdown: priceBreakdown,
                    calculated_making_charge: priceBreakdown
                        ? priceBreakdown.making
                        : null,
                    product: item.products
                        ? {
                              id: item.products.id.toString(),
                              name: item.products.name,
                              sku: item.products.sku,
                              making_charge_amount:
                                  (
                                      item.products as any
                                  ).making_charge_amount?.toString() ?? null,
                              making_charge_percentage:
                                  (
                                      item.products as any
                                  ).making_charge_percentage?.toString() ??
                                  null,
                              making_charge_types:
                                  item.products.metadata?.[
                                      'making_charge_types'
                                  ] ?? [],
                              media: item.products.product_medias.map(
                                  (media) => ({
                                      url: media.url,
                                      alt:
                                          (media.metadata as any)?.['alt'] ??
                                          item.products?.name ??
                                          '',
                                  }),
                              ),
                          }
                        : null,
                };
            }),
            status_history: order.order_status_histories.map((entry) => ({
                id: entry.id.toString(),
                status: entry.status,
                created_at: entry.created_at,
                meta: entry.meta,
            })),
            payments: order.payments.map((payment) => ({
                id: payment.id.toString(),
                status: payment.status,
                amount: payment.amount.toString(),
                created_at: payment.created_at,
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
                                      (media.metadata as any)?.['alt'] ??
                                      quotation.products.name,
                              }),
                          ),
                      }
                    : null,
            })),
            statusOptions,
        };
    }

    async updateStatus(
        id: bigint,
        status: OrderStatus,
        meta: Record<string, any> = {},
        userId?: bigint,
        actorGuard: 'customer' | 'admin' = 'admin',
    ) {
        await this.orderWorkflowService.transitionOrder(
            id,
            status,
            meta,
            userId,
            actorGuard,
        );
        return {
            message: `Order status updated to ${this.formatStatusLabel(status)}.`,
        };
    }

    private formatStatusLabel(status: string): string {
        return status
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
