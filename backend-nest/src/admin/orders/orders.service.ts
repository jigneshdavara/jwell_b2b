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

        // Get all orders with basic info
        const allOrders = await this.prisma.orders.findMany({
            where,
            select: {
                id: true,
                status: true,
                total_amount: true,
                subtotal_amount: true,
                tax_amount: true,
                discount_amount: true,
                created_at: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        // Calculate totals
        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce(
            (sum, order) => sum + Number(order.total_amount),
            0,
        );
        const totalSubtotal = allOrders.reduce(
            (sum, order) => sum + Number(order.subtotal_amount),
            0,
        );
        const totalTax = allOrders.reduce(
            (sum, order) => sum + Number(order.tax_amount),
            0,
        );
        const totalDiscount = allOrders.reduce(
            (sum, order) => sum + Number(order.discount_amount),
            0,
        );
        const averageOrderValue =
            totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Fetch all order statuses with colors from database
        const orderStatuses = await this.prisma.order_statuses.findMany({
            where: {
                is_active: true,
            },
            select: {
                code: true,
                color: true,
            },
        });

        // Create a map of status code to color
        const statusColorMap = new Map<string, string>();
        orderStatuses.forEach((status) => {
            statusColorMap.set(status.code, status.color);
        });

        // Group by status
        const ordersByStatus = allOrders.reduce(
            (acc, order) => {
                const status = order.status;
                if (!acc[status]) {
                    acc[status] = {
                        status,
                        status_label: this.formatStatusLabel(status),
                        color: statusColorMap.get(status) || '#6B7280', // Default gray if not found
                        count: 0,
                        revenue: 0,
                    };
                }
                acc[status].count += 1;
                acc[status].revenue += Number(order.total_amount);
                return acc;
            },
            {} as Record<
                string,
                {
                    status: string;
                    status_label: string;
                    color: string;
                    count: number;
                    revenue: number;
                }
            >,
        );

        // Group by date (daily)
        const ordersByDate = allOrders.reduce(
            (acc, order) => {
                if (!order.created_at) return acc;
                const date = new Date(order.created_at)
                    .toISOString()
                    .split('T')[0];
                if (!acc[date]) {
                    acc[date] = {
                        date,
                        count: 0,
                        revenue: 0,
                    };
                }
                acc[date].count += 1;
                acc[date].revenue += Number(order.total_amount);
                return acc;
            },
            {} as Record<
                string,
                { date: string; count: number; revenue: number }
            >,
        );

        // Convert to arrays and sort
        const statusData = Object.values(ordersByStatus).sort((a, b) =>
            a.status.localeCompare(b.status),
        );
        const dateData = Object.values(ordersByDate)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30); // Last 30 days

        return {
            summary: {
                total_orders: totalOrders,
                total_revenue: totalRevenue.toString(),
                total_subtotal: totalSubtotal.toString(),
                total_tax: totalTax.toString(),
                total_discount: totalDiscount.toString(),
                average_order_value: averageOrderValue.toString(),
            },
            by_status: statusData,
            by_date: dateData,
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
                        Title: 'Order Statistics Report',
                        Author: 'Elvee',
                        Subject: 'Order Report',
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
                    .text('Order Statistics Report', 50, 50);

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

                // Orders by Status
                if (statistics.by_status && statistics.by_status.length > 0) {
                    if (y > 650) {
                        doc.addPage();
                        y = 50;
                    }

                    doc.fontSize(16)
                        .fillColor(darkGray)
                        .font('Helvetica-Bold')
                        .text('Orders by Status', 50, y);
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
                        .text('Revenue', 380, y + 8, {
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
                                .text('Revenue', 380, y + 8, {
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
                                `₹${item.revenue.toLocaleString('en-IN')}`,
                                380,
                                y,
                                { width: 160, align: 'right' },
                            );

                        y += 20;
                    }

                    y += 20;
                }

                // Orders Over Time
                if (statistics.by_date && statistics.by_date.length > 0) {
                    if (y > 600) {
                        doc.addPage();
                        y = 50;
                    }

                    doc.fontSize(16)
                        .fillColor(darkGray)
                        .font('Helvetica-Bold')
                        .text('Orders Over Time (Last 30 Days)', 50, y);
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
                        .text('Revenue', 330, y + 8, {
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
                                .text('Revenue', 330, y + 8, {
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
                                `₹${item.revenue.toLocaleString('en-IN')}`,
                                330,
                                y,
                                { width: 210, align: 'right' },
                            );

                        y += 20;
                    }

                    y += 20;
                }

                // Summary Section (at the end)
                if (y > 600) {
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
                    `Total Orders: ${statistics.summary.total_orders}`,
                    50,
                    y,
                );
                y += 15;
                doc.text(
                    `Total Revenue: ₹${parseFloat(statistics.summary.total_revenue).toLocaleString('en-IN')}`,
                    50,
                    y,
                );
                y += 15;
                doc.text(
                    `Total Subtotal: ₹${parseFloat(statistics.summary.total_subtotal).toLocaleString('en-IN')}`,
                    50,
                    y,
                );
                y += 15;
                doc.text(
                    `Total Tax: ₹${parseFloat(statistics.summary.total_tax).toLocaleString('en-IN')}`,
                    50,
                    y,
                );
                y += 15;
                doc.text(
                    `Total Discount: ₹${parseFloat(statistics.summary.total_discount).toLocaleString('en-IN')}`,
                    50,
                    y,
                );
                y += 15;
                doc.text(
                    `Average Order Value: ₹${parseFloat(statistics.summary.average_order_value).toLocaleString('en-IN')}`,
                    50,
                    y,
                );

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    private formatStatusLabel(status: string): string {
        return status
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
