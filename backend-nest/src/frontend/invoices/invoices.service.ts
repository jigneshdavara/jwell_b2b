import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvoiceGenerationService } from '../../admin/invoices/invoice-generation.service';

@Injectable()
export class FrontendInvoicesService {
    constructor(
        private prisma: PrismaService,
        private invoiceGenerationService: InvoiceGenerationService,
    ) {}

    async findAll(userId: bigint, page: number = 1, perPage: number = 15) {
        const skip = (page - 1) * perPage;

        const [items, total] = await Promise.all([
            this.prisma.invoices.findMany({
                where: {
                    orders: {
                        user_id: userId,
                    },
                },
                skip,
                take: perPage,
                orderBy: { created_at: 'desc' },
                include: {
                    orders: {
                        select: {
                            id: true,
                            reference: true,
                        },
                    },
                },
            }),
            this.prisma.invoices.count({
                where: {
                    orders: {
                        user_id: userId,
                    },
                },
            }),
        ]);

        return {
            items: items.map((invoice) => ({
                id: invoice.id.toString(),
                invoice_number: invoice.invoice_number,
                status: invoice.status,
                status_label: this.formatStatusLabel(invoice.status),
                total_amount: invoice.total_amount.toString(),
                currency: invoice.currency,
                issue_date: invoice.issue_date,
                due_date: invoice.due_date,
                created_at: invoice.created_at,
                order_reference: invoice.orders?.reference,
            })),
            meta: {
                total,
                page,
                per_page: perPage,
                total_pages: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(invoiceId: bigint, userId: bigint) {
        const invoice = await this.prisma.invoices.findUnique({
            where: { id: invoiceId },
            include: {
                orders: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                business_name: true,
                                business_website: true,
                                gst_number: true,
                                pan_number: true,
                                registration_number: true,
                                address_line1: true,
                                address_line2: true,
                                city: true,
                                state: true,
                                postal_code: true,
                                country: true,
                            },
                        },
                        order_items: {
                            include: {
                                products: {
                                    include: {
                                        product_medias: {
                                            orderBy: { display_order: 'asc' },
                                            take: 1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        // Verify invoice belongs to the user
        if (invoice.orders?.user_id !== userId) {
            throw new ForbiddenException(
                'You do not have access to this invoice',
            );
        }

        return {
            id: invoice.id.toString(),
            invoice_number: invoice.invoice_number,
            status: invoice.status,
            status_label: this.formatStatusLabel(invoice.status),
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            subtotal_amount: invoice.subtotal_amount.toString(),
            tax_amount: invoice.tax_amount.toString(),
            discount_amount: invoice.discount_amount.toString(),
            total_amount: invoice.total_amount.toString(),
            currency: invoice.currency,
            notes: invoice.notes,
            terms: invoice.terms,
            metadata: invoice.metadata,
            created_at: invoice.created_at,
            updated_at: invoice.updated_at,
            order: invoice.orders
                ? {
                      id: invoice.orders.id.toString(),
                      reference: invoice.orders.reference,
                      user: invoice.orders.users
                          ? {
                                id: invoice.orders.users.id.toString(),
                                name: invoice.orders.users.name,
                                email: invoice.orders.users.email,
                                phone: invoice.orders.users.phone,
                                business_name:
                                    invoice.orders.users.business_name,
                                business_website:
                                    invoice.orders.users.business_website,
                                gst_number: invoice.orders.users.gst_number,
                                pan_number: invoice.orders.users.pan_number,
                                registration_number:
                                    invoice.orders.users.registration_number,
                                address: {
                                    line1: invoice.orders.users.address_line1,
                                    line2: invoice.orders.users.address_line2,
                                    city: invoice.orders.users.city,
                                    state: invoice.orders.users.state,
                                    postal_code:
                                        invoice.orders.users.postal_code,
                                    country: invoice.orders.users.country,
                                },
                            }
                          : null,
                      items: invoice.orders.order_items.map((item) => ({
                          id: item.id.toString(),
                          sku: item.sku,
                          name: item.name,
                          quantity: item.quantity,
                          unit_price: item.unit_price.toString(),
                          total_price: item.total_price.toString(),
                          configuration: item.configuration,
                          product: item.products
                              ? {
                                    id: item.products.id.toString(),
                                    name: item.products.name,
                                    sku: item.products.sku,
                                    media: item.products.product_medias.map(
                                        (media) => ({
                                            url: media.url,
                                        }),
                                    ),
                                }
                              : null,
                      })),
                  }
                : null,
        };
    }

    async generatePdf(invoiceId: bigint, userId: bigint): Promise<Buffer> {
        const invoice = await this.findOne(invoiceId, userId);
        return this.invoiceGenerationService.generatePdf(invoice);
    }

    private formatStatusLabel(status: string): string {
        return status
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}
