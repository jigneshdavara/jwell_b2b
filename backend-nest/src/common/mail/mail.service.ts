import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../../prisma/prisma.service';

export interface SendMailOptions {
    to: string | string[];
    subject: string;
    template: string;
    context: Record<string, any>;
}

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly prisma: PrismaService,
    ) {}

    /**
     * Send an email using a template
     */
    async sendMail(options: SendMailOptions): Promise<void> {
        try {
            const context = {
                ...options.context,
                subject: options.subject,
            };

            await this.mailerService.sendMail({
                to: Array.isArray(options.to)
                    ? options.to.join(', ')
                    : options.to,
                subject: options.subject,
                template: options.template,
                context,
            });
        } catch (error) {
            console.error('Failed to send email:', error);
            console.error('Email options:', {
                to: options.to,
                subject: options.subject,
                template: options.template,
                context: options.context,
            });

            // In development with log driver, this should not fail
            // If it does, there might be a configuration issue
            if (process.env.MAIL_MAILER === 'log') {
                // Log driver should not throw errors, but if it does, log and continue
                console.warn(
                    'Email sending failed even with log driver. Check mail configuration.',
                );
                return; // Don't throw for log driver
            }

            // Re-throw error for production email failures
            throw error;
        }
    }

    /**
     * Send order confirmation email to customer
     */
    async sendOrderConfirmation(
        orderId: number,
        paymentId: number,
    ): Promise<void> {
        const order = await this.prisma.orders.findUnique({
            where: { id: BigInt(orderId) },
            include: {
                customers: true,
                order_items: true,
            },
        });

        const payment = await this.prisma.payments.findUnique({
            where: { id: BigInt(paymentId) },
        });

        if (!order?.customers?.email || !payment) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const subject = `Order ${order.reference} confirmed`;

        // Format order items for template
        const formattedItems = order.order_items.map((item) => ({
            ...item,
            total_price: this.formatCurrency(item.total_price.toString()),
        }));

        await this.sendMail({
            to: order.customers.email,
            subject,
            template: 'order-confirmation',
            context: {
                order: {
                    ...order,
                    total_amount: this.formatCurrency(
                        order.total_amount.toString(),
                    ),
                    items: formattedItems,
                },
                payment,
                subject,
                brandName,
                user: order.customers,
            },
        });
    }

    /**
     * Send admin notification for new order
     */
    async sendAdminOrderNotification(
        orderId: number,
        paymentId: number,
    ): Promise<void> {
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
            return;
        }

        const order = await this.prisma.orders.findUnique({
            where: { id: BigInt(orderId) },
            include: {
                customers: true,
                order_items: true,
            },
        });

        const payment = await this.prisma.payments.findUnique({
            where: { id: BigInt(paymentId) },
        });

        if (!order || !payment) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const subject = `New order received: ${order.reference}`;

        await this.sendMail({
            to: adminEmail,
            subject,
            template: 'admin-order-notification',
            context: {
                order: {
                    ...order,
                    total_amount: this.formatCurrency(
                        order.total_amount.toString(),
                    ),
                },
                payment,
                subject,
                brandName,
            },
        });
    }

    /**
     * Send welcome email to new customer
     */
    async sendWelcomeEmail(userId: number): Promise<void> {
        // Convert number to BigInt for Prisma query
        const user = await this.prisma.customer.findUnique({
            where: { id: BigInt(userId) },
        });

        if (!user?.email) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const subject = `Welcome to ${brandName}`;

        await this.sendMail({
            to: user.email,
            subject,
            template: 'welcome-customer',
            context: {
                user,
                subject,
                brandName,
            },
        });
    }

    /**
     * Send admin notification for new user registration
     */
    async sendAdminNewUserNotification(userId: number): Promise<void> {
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
            return;
        }

        // Convert number to BigInt for Prisma query
        const user = await this.prisma.customer.findUnique({
            where: { id: BigInt(userId) },
        });

        if (!user) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const subject = `New user registered: ${user.name}`;

        await this.sendMail({
            to: adminEmail,
            subject,
            template: 'admin-registration',
            context: {
                user,
                subject,
                brandName,
            },
        });
    }

    /**
     * Send login OTP email
     */
    async sendLoginOtp(
        email: string,
        code: string,
        expiresIn: string,
    ): Promise<void> {
        const brandName = process.env.BRAND_NAME || 'Elvee';
        const subject = 'Your Elvee login code';

        await this.sendMail({
            to: email,
            subject,
            template: 'login-otp',
            context: {
                code,
                expiresIn,
                brand: brandName,
            },
        });
    }

    /**
     * Send password reset link email
     */
    async sendPasswordResetLinkEmail(
        email: string,
        resetUrl: string,
        userName: string,
    ): Promise<void> {
        const brandName = process.env.BRAND_NAME || 'Elvee';
        const subject = 'Reset Your Password';

        await this.sendMail({
            to: email,
            subject,
            template: 'password-reset',
            context: {
                resetUrl,
                user: { name: userName },
                brandName,
                subject,
            },
        });
    }

    /**
     * Send email verification link
     */
    async sendEmailVerification(
        email: string,
        verificationUrl: string,
        userName: string,
    ): Promise<void> {
        const brandName = process.env.BRAND_NAME || 'Elvee';
        const subject = 'Verify Your Email Address';

        await this.sendMail({
            to: email,
            subject,
            template: 'email-verification',
            context: {
                verificationUrl,
                user: { name: userName },
                brandName,
                subject,
            },
        });
    }

    /**
     * Send quotation approved email
     */
    async sendQuotationApproved(quotationId: number): Promise<void> {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(quotationId) },
            include: {
                customers: true,
            },
        });

        if (!quotation?.customers?.email) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const quotationRef =
            quotation.quotation_group_id || `#${quotation.id.toString()}`;
        const subject = `Quotation ${quotationRef} approved`;

        await this.sendMail({
            to: quotation.customers.email,
            subject,
            template: 'quotation-approved',
            context: {
                quotation: {
                    ...quotation,
                    reference: quotationRef,
                },
                subject,
                brandName,
                user: quotation.customers,
            },
        });
    }

    /**
     * Send quotation rejected email
     */
    async sendQuotationRejected(
        quotationId: number,
        reason?: string,
    ): Promise<void> {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(quotationId) },
            include: {
                customers: true,
            },
        });

        if (!quotation?.customers?.email) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const quotationRef =
            quotation.quotation_group_id || `#${quotation.id.toString()}`;
        const subject = `Quotation ${quotationRef} update`;

        await this.sendMail({
            to: quotation.customers.email,
            subject,
            template: 'quotation-rejected',
            context: {
                quotation: {
                    ...quotation,
                    reference: quotationRef,
                },
                reason,
                subject,
                brandName,
                user: quotation.customers,
            },
        });
    }

    /**
     * Send quotation submitted email to customer
     */
    async sendQuotationSubmittedCustomer(quotationId: number): Promise<void> {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(quotationId) },
            include: {
                customers: true,
            },
        });

        if (!quotation?.customers?.email) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const quotationRef =
            quotation.quotation_group_id || `#${quotation.id.toString()}`;
        const subject = `Quotation ${quotationRef} submitted`;

        await this.sendMail({
            to: quotation.customers.email,
            subject,
            template: 'quotation-submitted-customer',
            context: {
                quotation: {
                    ...quotation,
                    reference: quotationRef,
                },
                subject,
                brandName,
                user: quotation.customers,
            },
        });
    }

    /**
     * Send quotation submitted email to admin
     */
    async sendQuotationSubmittedAdmin(quotationId: number): Promise<void> {
        const adminEmail = process.env.ADMIN_EMAIL;

        if (!adminEmail) {
            return;
        }

        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(quotationId) },
            include: {
                customers: true,
            },
        });

        if (!quotation) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const quotationRef =
            quotation.quotation_group_id || `#${quotation.id.toString()}`;
        const subject = `New quotation submitted: ${quotationRef}`;

        await this.sendMail({
            to: adminEmail,
            subject,
            template: 'quotation-submitted-admin',
            context: {
                quotation: {
                    ...quotation,
                    reference: quotationRef,
                },
                subject,
                brandName,
            },
        });
    }

    /**
     * Send quotation confirmation request email
     */
    async sendQuotationConfirmationRequest(
        quotationId: number,
        message?: string,
    ): Promise<void> {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(quotationId) },
            include: {
                customers: true,
            },
        });

        if (!quotation?.customers?.email) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const quotationRef =
            quotation.quotation_group_id || `#${quotation.id.toString()}`;
        const subject = `Action required: Quotation ${quotationRef}`;

        await this.sendMail({
            to: quotation.customers.email,
            subject,
            template: 'quotation-confirmation-request',
            context: {
                quotation: {
                    ...quotation,
                    reference: quotationRef,
                },
                message,
                subject,
                brandName,
                user: quotation.customers,
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
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(numAmount);
    }

    /**
     * Send quotation status updated email
     */
    async sendQuotationStatusUpdated(quotationId: number): Promise<void> {
        const quotation = await this.prisma.quotations.findUnique({
            where: { id: BigInt(quotationId) },
            include: {
                customers: true,
            },
        });

        if (!quotation?.customers?.email) {
            return;
        }

        const brandName = process.env.BRAND_NAME || 'Elvee';
        const quotationRef =
            quotation.quotation_group_id || `#${quotation.id.toString()}`;
        const subject = `Quotation ${quotationRef} status updated`;

        await this.sendMail({
            to: quotation.customers.email,
            subject,
            template: 'quotation-status-updated',
            context: {
                quotation: {
                    ...quotation,
                    reference: quotationRef,
                },
                subject,
                brandName,
                user: quotation.customers,
            },
        });
    }
}
