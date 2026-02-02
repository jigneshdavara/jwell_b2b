/**
 * Quotation-related types
 */

export type QuotationRow = {
    quotation_group_id: string;
    ids?: number[];
    status: string;
    approved_at?: string | null;
    admin_notes?: string | null;
    quantity: number;
    notes?: string | null;
    product: {
        id: number;
        name: string;
        sku: string;
        thumbnail?: string | null;
    };
    products?: Array<{
        id: number;
        name: string;
        sku: string;
        thumbnail?: string | null;
    }>;
    variant?: {
        id: number;
        label: string;
        metadata?: Record<string, string | number | boolean | null | undefined> | null;
    } | null;
    order_reference?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
};

export type QuotationItem = {
    id: number;
    product_id: number;
    product_name: string;
    variant_id?: number | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    configuration?: Record<string, unknown> | null;
};

export type Quotation = {
    id: number;
    reference: string;
    status: string;
    currency: string;
    subtotal: number;
    tax: number;
    grand_total: number;
    created_at: string;
    updated_at: string;
    items: QuotationItem[];
    order?: {
        id: number;
        reference: string;
        total_amount: number;
    } | null;
};

