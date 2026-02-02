import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from '../../cart/cart.service';
import { PaymentGatewayManager } from '../../common/payments/payment-gateway-manager.service';
import { OrderWorkflowService } from '../../admin/orders/order-workflow.service';
import { OrderStatus } from '../../admin/orders/dto/order.dto';
import { MailService } from '../../common/mail/mail.service';
import { Inject } from '@nestjs/common';

@Injectable()
export class FrontendCheckoutService {
    constructor(
        private prisma: PrismaService,
        private cartService: CartService,
        private gatewayManager: PaymentGatewayManager,
        private orderWorkflowService: OrderWorkflowService,
        private mailService: MailService,
    ) {}

    async initialize(userId: bigint) {
        const cart = await this.cartService.getActiveCart(userId);

        const cartItems = await this.prisma.cart_items.findMany({
            where: { cart_id: cart.id },
            include: {
                products: true,
            },
        });

        if (cartItems.length === 0) {
            throw new BadRequestException('Cart is empty.');
        }

        const summary = await this.cartService.summarize(userId);

        // Create or update order
        const metadata = (cart.metadata as Record<string, any>) || {};
        const pendingOrderId = metadata.pending_order_id
            ? BigInt(metadata.pending_order_id)
            : null;

        let order: any = null;

        if (pendingOrderId) {
            order = await this.prisma.orders.findFirst({
                where: {
                    id: pendingOrderId,
                    user_id: userId,
                },
            });
        }

        const reference = order ? order.reference : this.generateReference();

        if (!order) {
            order = await this.prisma.orders.create({
                data: {
                    user_id: userId,
                    reference: reference,
                    currency: summary.currency,
                    status: OrderStatus.PENDING_PAYMENT,
                    subtotal_amount: summary.subtotal,
                    tax_amount: summary.tax,
                    discount_amount: summary.discount,
                    total_amount: summary.total,
                    price_breakdown: {
                        subtotal: summary.subtotal,
                        tax: summary.tax,
                        discount: summary.discount,
                        shipping: summary.shipping,
                    } as any,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        } else {
            order = await this.prisma.orders.update({
                where: { id: order.id },
                data: {
                    status: OrderStatus.PENDING_PAYMENT,
                    subtotal_amount: summary.subtotal,
                    tax_amount: summary.tax,
                    discount_amount: summary.discount,
                    total_amount: summary.total,
                    price_breakdown: {
                        subtotal: summary.subtotal,
                        tax: summary.tax,
                        discount: summary.discount,
                        shipping: summary.shipping,
                    } as any,
                    updated_at: new Date(),
                },
            });
        }

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Delete existing order items
        await this.prisma.order_items.deleteMany({
            where: { order_id: order.id },
        });

        // Create order items
        for (const itemSummary of summary.items) {
            await this.prisma.order_items.create({
                data: {
                    order_id: order.id,
                    product_id: BigInt(
                        typeof itemSummary.product_id === 'string'
                            ? itemSummary.product_id
                            : (itemSummary.product_id as any).toString(),
                    ),
                    sku: itemSummary.sku,
                    name: itemSummary.name,
                    quantity: itemSummary.quantity,
                    unit_price: itemSummary.unit_total,
                    total_price: itemSummary.line_total,
                    configuration: {
                        variant_label: itemSummary.variant_label || null,
                        variant_id: itemSummary.product_variant_id
                            ? typeof itemSummary.product_variant_id === 'string'
                                ? itemSummary.product_variant_id
                                : (
                                      itemSummary.product_variant_id as any
                                  ).toString()
                            : null,
                    } as any,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }

        // Update cart metadata
        await this.prisma.carts.update({
            where: { id: cart.id },
            data: {
                metadata: {
                    ...metadata,
                    pending_order_id: order.id.toString(),
                } as any,
                updated_at: new Date(),
            },
        });

        // Create or update payment
        const paymentData = await this.createOrUpdatePayment(order);

        return {
            ...summary,
            order: {
                id: order.id.toString(),
                reference: order.reference,
                total: Number(order.total_amount),
                currency: order.currency,
                items: summary.items,
            },
            payment: paymentData,
        };
    }

    async initializeExistingOrder(orderId: bigint, userId: bigint) {
        const order = await this.prisma.orders.findUnique({
            where: { id: orderId },
            include: {
                order_items: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.user_id !== userId) {
            throw new NotFoundException('Order not found');
        }

        if (
            order.status !== OrderStatus.PENDING_PAYMENT &&
            order.status !== OrderStatus.PAYMENT_FAILED
        ) {
            throw new BadRequestException('Order is not awaiting payment.');
        }

        const priceBreakdown =
            (order.price_breakdown as Record<string, any>) || {};

        const summary = {
            subtotal: Number(order.subtotal_amount),
            tax: Number(order.tax_amount),
            discount: Number(order.discount_amount),
            shipping: priceBreakdown.shipping || 0,
            total: Number(order.total_amount),
            currency: order.currency || 'INR',
        };

        // Create or update payment
        const paymentData = await this.createOrUpdatePayment(order);

        return {
            ...summary,
            order: {
                id: order.id.toString(),
                reference: order.reference,
                total: summary.total,
                currency: summary.currency,
                items: order.order_items.map((item) => ({
                    sku: item.sku,
                    name: item.name,
                    quantity: item.quantity,
                    line_total: Number(item.total_price),
                })),
            },
            payment: paymentData,
        };
    }

    async finalize(providerReference: string, userId: bigint) {
        const payment = await this.prisma.payments.findFirst({
            where: {
                provider_reference: providerReference,
                orders: {
                    user_id: userId,
                },
            },
            include: {
                orders: true,
                payment_gateways: true,
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        const gateway = await this.gatewayManager.activeGateway();
        const driver = this.gatewayManager.driver(gateway);

        const intent = await driver.retrieveIntent(providerReference);

        if (
            intent.status !== 'succeeded' &&
            intent.status !== 'requires_capture'
        ) {
            await this.prisma.payments.update({
                where: { id: payment.id },
                data: {
                    status: 'failed',
                    updated_at: new Date(),
                },
            });

            await this.prisma.orders.update({
                where: { id: payment.order_id },
                data: {
                    status: OrderStatus.PAYMENT_FAILED,
                    updated_at: new Date(),
                },
            });

            throw new BadRequestException('Payment has not succeeded.');
        }

        const paymentMeta = (payment.meta as Record<string, any>) || {};
        await this.prisma.payments.update({
            where: { id: payment.id },
            data: {
                status: 'succeeded',
                meta: {
                    ...paymentMeta,
                    intent: intent,
                } as any,
                updated_at: new Date(),
            },
        });

        await this.orderWorkflowService.transitionOrder(
            payment.order_id,
            OrderStatus.PENDING,
            {
                source: 'payment_success',
            },
            userId,
            'user',
        );

        const updatedOrder = await this.prisma.orders.findUnique({
            where: { id: payment.order_id },
            include: {
                order_items: true,
            },
        });

        // Send order confirmation emails
        try {
            await this.mailService.sendOrderConfirmation(
                Number(payment.order_id),
                Number(payment.id),
            );
            await this.mailService.sendAdminOrderNotification(
                Number(payment.order_id),
                Number(payment.id),
            );
        } catch (error) {
            // Log error but don't fail order finalization
            console.error('Failed to send order confirmation emails:', error);
        }

        return updatedOrder;
    }

    private async createOrUpdatePayment(order: any) {
        const gateway = await this.gatewayManager.activeGateway();
        const driver = this.gatewayManager.driver(gateway);

        const existingPayment = await this.prisma.payments.findFirst({
            where: {
                order_id: order.id,
                payment_gateway_id: gateway.id,
                status: {
                    in: ['pending', 'requires_action'],
                },
            },
            orderBy: { created_at: 'desc' },
        });

        const intent = await driver.ensurePaymentIntent(
            order,
            existingPayment || null,
        );

        let payment = existingPayment;

        if (!payment) {
            payment = await this.prisma.payments.create({
                data: {
                    order_id: order.id,
                    payment_gateway_id: gateway.id,
                    provider_reference: intent.provider_reference,
                    status: 'pending',
                    amount: intent.amount,
                    currency: intent.currency,
                    meta: {
                        client_secret: intent.client_secret,
                    } as any,
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            });
        } else {
            const paymentMeta = (payment.meta as Record<string, any>) || {};
            payment = await this.prisma.payments.update({
                where: { id: payment.id },
                data: {
                    provider_reference: intent.provider_reference,
                    amount: intent.amount,
                    currency: intent.currency,
                    meta: {
                        ...paymentMeta,
                        client_secret: intent.client_secret,
                    } as any,
                    updated_at: new Date(),
                },
            });
        }

        return {
            publishable_key: driver.publishableKey(),
            provider_reference: intent.provider_reference,
            client_secret: intent.client_secret,
            payment_id: payment.id.toString(),
        };
    }

    private generateReference(): string {
        const randomString = Math.random()
            .toString(36)
            .substring(2, 12)
            .toUpperCase();
        return `ORD-${randomString}`;
    }
}
