export interface PaymentGatewayDriver {
    gateway(): any; // PaymentGateway model from Prisma

    /**
     * Create or update a payment intent for the given order.
     */
    ensurePaymentIntent(
        order: any,
        payment?: any | null,
    ): Promise<{
        provider_reference: string;
        client_secret: string;
        amount: number;
        currency: string;
    }>;

    /**
     * Retrieve the latest status information for a payment intent.
     */
    retrieveIntent(providerReference: string): Promise<{
        status: string;
        amount: number;
        currency: string;
    }>;

    publishableKey(): string;
}
