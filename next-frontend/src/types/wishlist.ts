/**
 * Wishlist-related types
 */

export type WishlistItem = {
    id: string | number;
    product_id: string | number;
    variant_id: string | number | null;
    sku?: string | null;
    name?: string | null;
    thumbnail?: string | null;
    variant_label?: string | null;
    configuration?: Record<string, unknown> | null;
};

