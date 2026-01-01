import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceFilterDto, InvoiceStatus } from './dto/invoice.dto';
import { InvoiceGenerationService } from './invoice-generation.service';
import { MailService } from '../../common/mail/mail.service';

@Injectable()
export class InvoicesService {
    constructor(
        private prisma: PrismaService,
        private invoiceGenerationService: InvoiceGenerationService,
        private mailService: MailService,
    ) {}

    async generateInvoiceNumber(): Promise<string> {
        // Generate invoice number: INV-YYYYMMDD-XXXX
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const prefix = `INV-${year}${month}${day}-`;

        // Get the last invoice number for today
        const lastInvoice = await this.prisma.invoices.findFirst({
            where: {
                invoice_number: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                invoice_number: 'desc',
            },
        });

        let sequence = 1;
        if (lastInvoice) {
            const lastSequence = parseInt(
                lastInvoice.invoice_number.replace(prefix, ''),
                10,
            );
            if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
            }
        }

        return `${prefix}${String(sequence).padStart(4, '0')}`;
    }

    async create(dto: CreateInvoiceDto) {
        // Check if order exists
        const order = await this.prisma.orders.findUnique({
            where: { id: BigInt(dto.order_id) },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        business_name: true,
                        address_line1: true,
                        address_line2: true,
                        city: true,
                        state: true,
                        postal_code: true,
                        country: true,
                        gst_number: true,
                        pan_number: true,
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Check if invoice already exists for this order
        const existingInvoice = await this.prisma.invoices.findFirst({
            where: { order_id: BigInt(dto.order_id) },
        });

        if (existingInvoice) {
            throw new BadRequestException('Invoice already exists for this order');
        }

        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber();

        // Set issue date to today if not provided
        const issueDate = dto.issue_date ? new Date(dto.issue_date) : new Date();

        // Set due date (default: 30 days from issue date)
        const dueDate = dto.due_date
            ? new Date(dto.due_date)
            : new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Create invoice with order amounts
        const invoice = await this.prisma.invoices.create({
            data: {
                order_id: BigInt(dto.order_id),
                invoice_number: invoiceNumber,
                status: InvoiceStatus.DRAFT,
                issue_date: issueDate,
                due_date: dueDate,
                subtotal_amount: order.subtotal_amount,
                tax_amount: order.tax_amount,
                discount_amount: order.discount_amount,
                total_amount: order.total_amount,
                currency: order.currency,
                notes: dto.notes,
                terms: dto.terms,
                metadata: dto.metadata,
            },
            include: {
                orders: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                business_name: true,
                                address_line1: true,
                                address_line2: true,
                                city: true,
                                state: true,
                                postal_code: true,
                                country: true,
                                gst_number: true,
                                pan_number: true,
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

        return this.formatInvoice(invoice);
    }

    async findAll(
        page: number = 1,
        perPage: number = 10,
        filters?: InvoiceFilterDto,
    ) {
        const skip = (page - 1) * perPage;

        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.order_id) {
            where.order_id = BigInt(filters.order_id);
        }

        if (filters?.search) {
            where.OR = [
                {
                    invoice_number: {
                        contains: filters.search,
                        mode: 'insensitive',
                    },
                },
                {
                    orders: {
                        reference: {
                            contains: filters.search,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    orders: {
                        users: {
                            name: {
                                contains: filters.search,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.invoices.findMany({
                where,
                skip,
                take: perPage,
                orderBy: { created_at: 'desc' },
                include: {
                    orders: {
                        include: {
                            users: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.invoices.count({ where }),
        ]);

        return {
            items: items.map((invoice) => this.formatInvoiceListItem(invoice)),
            meta: {
                total,
                page,
                per_page: perPage,
                total_pages: Math.ceil(total / perPage),
            },
        };
    }

    async findOne(id: bigint) {
        const invoice = await this.prisma.invoices.findUnique({
            where: { id },
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
                        payments: {
                            select: {
                                id: true,
                                status: true,
                                amount: true,
                                created_at: true,
                            },
                        },
                    },
                },
            },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        return this.formatInvoice(invoice);
    }

    async update(id: bigint, dto: UpdateInvoiceDto) {
        const invoice = await this.prisma.invoices.findUnique({
            where: { id },
            include: {
                orders: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                business_name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        const oldStatus = invoice.status;
        const isBeingSent = dto.status === InvoiceStatus.SENT && oldStatus !== InvoiceStatus.SENT;

        const updateData: any = {};

        if (dto.status) {
            updateData.status = dto.status;
        }

        if (dto.issue_date) {
            updateData.issue_date = new Date(dto.issue_date);
        }

        if (dto.due_date) {
            updateData.due_date = new Date(dto.due_date);
        }

        if (dto.notes !== undefined) {
            updateData.notes = dto.notes;
        }

        if (dto.terms !== undefined) {
            updateData.terms = dto.terms;
        }

        if (dto.metadata !== undefined) {
            updateData.metadata = dto.metadata;
        }

        const updated = await this.prisma.invoices.update({
            where: { id },
            data: updateData,
            include: {
                orders: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                business_name: true,
                                address_line1: true,
                                address_line2: true,
                                city: true,
                                state: true,
                                postal_code: true,
                                country: true,
                                gst_number: true,
                                pan_number: true,
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

        // Send email when invoice is marked as "sent"
        if (isBeingSent && updated.orders?.users?.email) {
            try {
                await this.sendInvoiceEmail(Number(id));
            } catch (error) {
                // Log error but don't fail the update
                console.error('Failed to send invoice email:', error);
            }
        }

        return this.formatInvoice(updated);
    }

    async delete(id: bigint) {
        const invoice = await this.prisma.invoices.findUnique({
            where: { id },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        // Only allow deletion of draft invoices
        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new BadRequestException(
                'Only draft invoices can be deleted',
            );
        }

        await this.prisma.invoices.delete({
            where: { id },
        });

        return { message: 'Invoice deleted successfully' };
    }

    async generatePdf(id: bigint): Promise<Buffer> {
        const invoice = await this.findOne(id);
        return this.invoiceGenerationService.generatePdf(invoice);
    }

    async findByOrderId(orderId: bigint) {
        const invoice = await this.prisma.invoices.findFirst({
            where: { order_id: orderId },
            select: {
                id: true,
                invoice_number: true,
                status: true,
            },
        });

        if (!invoice) {
            return null;
        }

        return {
            id: invoice.id.toString(),
            invoice_number: invoice.invoice_number,
            status: invoice.status,
        };
    }

    private formatInvoice(invoice: any) {
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
                      status: invoice.orders.status,
                      created_at: invoice.orders.created_at,
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
                      items: invoice.orders.order_items.map((item: any) => ({
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
                                        (media: any) => ({
                                            url: media.url,
                                        }),
                                    ),
                                }
                              : null,
                      })),
                      payments: invoice.orders.payments
                          ? invoice.orders.payments.map((payment: any) => ({
                                id: payment.id.toString(),
                                status: payment.status,
                                amount: payment.amount.toString(),
                                created_at: payment.created_at,
                            }))
                          : [],
                  }
                : null,
        };
    }

    private formatInvoiceListItem(invoice: any) {
        return {
            id: invoice.id.toString(),
            invoice_number: invoice.invoice_number,
            status: invoice.status,
            status_label: this.formatStatusLabel(invoice.status),
            total_amount: invoice.total_amount.toString(),
            currency: invoice.currency,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            created_at: invoice.created_at,
            order: invoice.orders
                ? {
                      id: invoice.orders.id.toString(),
                      reference: invoice.orders.reference,
                      user: invoice.orders.users
                          ? {
                                name: invoice.orders.users.name,
                                email: invoice.orders.users.email,
                            }
                          : null,
                  }
                : null,
        };
    }

    private formatStatusLabel(status: string): string {
        return status
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Send invoice email to customer
     */
    async sendInvoiceEmail(invoiceId: number): Promise<void> {
        const invoice = await this.prisma.invoices.findUnique({
            where: { id: BigInt(invoiceId) },
            include: {
                orders: {
                    include: {
                        users: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                business_name: true,
                            },
                        },
                        order_items: true,
                    },
                },
            },
        });

        if (!invoice?.orders?.users?.email) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const subject = `Invoice ${invoice.invoice_number} from ${brandName}`;

        // Format invoice data for email template
        const formattedInvoice = {
            ...invoice,
            total_amount: this.formatCurrency(invoice.total_amount.toString()),
            subtotal_amount: this.formatCurrency(invoice.subtotal_amount.toString()),
            tax_amount: this.formatCurrency(invoice.tax_amount.toString()),
            discount_amount: this.formatCurrency(invoice.discount_amount.toString()),
            issue_date: invoice.issue_date
                ? new Date(invoice.issue_date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                  })
                : null,
            due_date: invoice.due_date
                ? new Date(invoice.due_date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                  })
                : null,
            items: invoice.orders.order_items.map((item) => ({
                name: item.name,
                sku: item.sku,
                quantity: item.quantity,
                unit_price: this.formatCurrency(item.unit_price.toString()),
                total_price: this.formatCurrency(item.total_price.toString()),
            })),
        };

        await this.mailService.sendMail({
            to: invoice.orders.users.email,
            subject,
            template: 'invoice-sent',
            context: {
                invoice: formattedInvoice,
                order: invoice.orders,
                user: invoice.orders.users,
                subject,
                brandName,
            },
        });
    }

    /**
     * Format currency for display
     */
    private formatCurrency(amount: number | string): string {
        const numAmount =
            typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numAmount);
    }
}

