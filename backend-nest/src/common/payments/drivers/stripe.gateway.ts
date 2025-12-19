import { BadRequestException } from '@nestjs/common';
import { PaymentGatewayDriver } from '../contracts/payment-gateway-driver.interface';
import Stripe from 'stripe';

export class StripeGateway implements PaymentGatewayDriver {
    private client: Stripe;

    constructor(private gatewayConfig: any) {
        const secretKey = (this.gatewayConfig.config as any)?.secret_key;

        if (!secretKey) {
            throw new BadRequestException(
                'Stripe secret key is not configured.',
            );
        }

        this.client = new Stripe(secretKey, {
            apiVersion: '2025-12-15.clover',
        });
    }

    gateway(): any {
        return this.gatewayConfig;
    }

    async ensurePaymentIntent(
        order: any,
        payment?: any | null,
    ): Promise<{
        provider_reference: string;
        client_secret: string;
        amount: number;
        currency: string;
    }> {
        const amount = Math.round(Number(order.total_amount) * 100);
        const currency = (order.currency || 'inr').toLowerCase();
        const description = `Order ${order.reference} – Jewellery export transaction`;
        const statementDescriptor = 'AURUMCRAFT';

        try {
            let intent: Stripe.PaymentIntent;

            if (payment && payment.provider_reference) {
                intent = await this.client.paymentIntents.update(
                    payment.provider_reference,
                    {
                        amount,
                        currency,
                        description,
                        statement_descriptor: statementDescriptor,
                    },
                );
            } else {
                intent = await this.client.paymentIntents.create({
                    amount,
                    currency,
                    payment_method_types: ['card'],
                    description,
                    statement_descriptor: statementDescriptor,
                    metadata: {
                        order_id: order.id.toString(),
                        order_reference: order.reference,
                    },
                });
            }

            return {
                provider_reference: intent.id,
                client_secret: intent.client_secret || '',
                amount: intent.amount / 100,
                currency: intent.currency.toUpperCase(),
            };
        } catch (error: any) {
            throw new BadRequestException(
                error.message || 'Failed to create payment intent',
            );
        }
    }

    async retrieveIntent(providerReference: string): Promise<{
        status: string;
        amount: number;
        currency: string;
    }> {
        try {
            const intent = await this.client.paymentIntents.retrieve(
                providerReference,
            );

            return {
                status: intent.status,
                amount: intent.amount / 100,
                currency: intent.currency.toUpperCase(),
            };
        } catch (error: any) {
            throw new BadRequestException(
                error.message || 'Failed to retrieve payment intent',
            );
        }
    }

    publishableKey(): string {
        const publishableKey = (this.gatewayConfig.config as any)?.publishable_key;

        if (!publishableKey) {
            throw new BadRequestException(
                'Stripe publishable key is not configured.',
            );
        }

        return publishableKey;
    }
}

