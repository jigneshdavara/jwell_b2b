/**
 * Order-related types
 */

export type OrderListItem = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    total_amount: number;
    created_at?: string | null;
    items: Array<{
        id: number;
        name: string;
        quantity: number;
    }>;
};

export type OrderShowItem = {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    configuration?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    price_breakdown?: {
        metal?: number;
        diamond?: number;
        making?: number;
        subtotal?: number;
        discount?: number;
        total?: number;
    } | null;
    calculated_making_charge?: number | null;
    product?: {
        id: number;
        name: string;
        sku: string;
        base_price?: number | null;
        making_charge_amount?: number | null;
        making_charge_percentage?: number | null;
        making_charge_types?: string[];
        media: Array<{ url: string; alt: string }>;
    } | null;
};

export type OrderPayment = {
    id: number;
    status: string;
    amount: number;
    created_at?: string | null;
    gateway?: string;
    provider_reference?: string | null;
};

export type Order = {
    id: number;
    reference: string;
    status: string;
    currency: string;
    subtotal_amount: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    price_breakdown?: Record<string, unknown> | null;
    locked_rates?: Record<string, unknown> | null;
    created_at: string;
    items: OrderShowItem[];
    payments?: OrderPayment[];
};

export type OrderDetails = {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    total_amount: number;
    subtotal_amount: number;
    tax_amount: number;
    discount_amount: number;
    created_at?: string | null;
    updated_at?: string | null;
    items: OrderShowItem[];
    payments: OrderPayment[];
    status_history: Array<{
        id: number;
        status: string;
        created_at?: string | null;
    }>;
    quotations?: Array<{
        id: number;
        status: string;
        quantity: number;
        product?: {
            id: number;
            name: string;
            sku: string;
            media: Array<{ url: string; alt: string }>;
        } | null;
    }>;
};

