import { PaymentGatewayDriver } from '../contracts/payment-gateway-driver.interface';

export class FakeGateway implements PaymentGatewayDriver {
    constructor(private gateway: any) {}

    gateway(): any {
        return this.gateway;
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
        const reference =
            payment?.provider_reference || `pi_fake_${order.id}`;

        return {
            provider_reference: reference,
            client_secret: `cs_fake_${order.id}`,
            amount: Number(order.total_amount),
            currency: order.currency || 'INR',
        };
    }

    async retrieveIntent(providerReference: string): Promise<{
        status: string;
        amount: number;
        currency: string;
    }> {
        return {
            status: 'succeeded',
            amount: 0,
            currency: 'INR',
        };
    }

    publishableKey(): string {
        return (this.gateway.config as any)?.publishable_key || 'pk_test_fake';
    }
}

