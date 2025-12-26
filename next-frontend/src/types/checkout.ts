/**
 * Checkout-related types
 */

export type CheckoutData = {
    order: {
        reference: string;
        total: number;
        currency: string;
        items: Array<{
            sku: string;
            name: string;
            quantity: number;
            line_total: number;
        }>;
    };
    payment: {
        publishableKey: string;
        clientSecret: string;
        paymentId?: string;
        providerReference: string;
    };
    summary: {
        subtotal: number;
        tax: number;
        discount: number;
        shipping: number;
        total: number;
        currency: string;
    };
};

