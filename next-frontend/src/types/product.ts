/**
 * Product-related types
 */

export type Product = {
    id: number;
    name: string;
    sku: string;
    brand?: string | null;
    category?: string | null;
    material?: string | null;
    purity?: string | null;
    price_total: number;
    making_charge_amount: number;
    making_charge_percentage?: number | null;
    making_charge_types?: string[];
    uses_gold: boolean;
    uses_silver: boolean;
    uses_diamond: boolean;
    thumbnail?: string | null;
    media?: Array<{ url: string; alt: string }>;
    catalogs?: Array<{ id: number; name: string; slug?: string | null }>;
    variants: Array<{
        id: number;
        label: string;
        is_default: boolean;
        metadata?: Record<string, unknown>;
    }>;
};

export type ProductVariant = {
    id: number;
    label: string;
    is_default: boolean;
    metadata?: Record<string, unknown>;
};

export type ProductMedia = {
    url: string;
    alt: string;
};

export type SpotlightProduct = {
    id: number | string;
    name: string;
    brand?: string | null;
    price: number | null;
    making_charge_amount: number | null;
    making_charge_percentage?: number | null;
    making_charge_types?: string[];
};

export type ConfigMetal = {
    label: string;
    metalId: number;
    metalPurityId: number | null;
    metalToneId: number | null;
    metalWeight?: string | null;
    metalName?: string;
    purityName?: string;
    toneName?: string;
};

export type ConfigDiamond = {
    label: string;
    diamondShapeId: number;
    diamondColorId: number;
    diamondClarityId: number;
    stoneCount: number;
    totalCarat: string;
};

export type ConfigurationOption = {
    variant_id: number;
    label: string;
    metal_label: string;
    diamond_label: string;
    metals: ConfigMetal[];
    diamonds: ConfigDiamond[];
    price_total: number;
    price_breakup: {
        base: number;
        metal: number;
        diamond: number;
        making: number;
    };
    sku: string;
    inventory_quantity?: number | null;
    size?: {
        id: number;
        name: string;
        value?: string;
    } | null;
    metadata?: Record<string, unknown> | null;
};

export type ProductDetail = {
    id: number;
    name: string;
    sku: string;
    description?: string;
    brand?: string;
    material?: string;
    purity?: string;
    base_price?: number | null;
    making_charge_amount?: number | null;
    making_charge_percentage?: number | null;
    making_charge_types?: string[];
    uses_gold: boolean;
    uses_silver: boolean;
    uses_diamond: boolean;
    category_sizes?: Array<{ id: number; name: string; code: string }>;
    thumbnail?: string | null;
    media?: Array<{ url: string; alt: string }>;
    variants: ProductVariant[];
    configurationOptions?: ConfigurationOption[];
};

