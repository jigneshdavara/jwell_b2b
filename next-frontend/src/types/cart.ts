/**
 * Cart-related types
 */

export type PriceBreakdown = {
    metal?: number;
    diamond?: number;
    making?: number;
    subtotal?: number;
    discount?: number;
    total?: number;
};

export type CartItem = {
    id: number;
    product_id: number;
    product_variant_id?: number | null;
    sku: string;
    name: string;
    quantity: number;
    inventory_quantity?: number | null;
    unit_total: number;
    line_total: number;
    line_subtotal?: number;
    line_discount?: number;
    price_breakdown: PriceBreakdown;
    thumbnail?: string | null;
    variant_label?: string | null;
    configuration?: {
        notes?: string | null;
    };
};

export type CartData = {
    items: CartItem[];
    currency: string;
    subtotal: number;
    tax: number;
    discount: number;
    shipping: number;
    total: number;
};

