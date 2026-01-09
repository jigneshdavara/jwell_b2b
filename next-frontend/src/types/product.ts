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

// Admin Product Edit Form Types
export type VariantMetalForm = {
    id?: number;
    metal_id: number | string | "";
    metal_purity_id: number | string | "";
    metal_tone_id: number | string | "";
    metal_weight: string;
};

export type VariantDiamondForm = {
    id?: number;
    diamond_id?: number | "";
    diamonds_count?: string;
};

export type VariantForm = {
    id?: number;
    sku: string;
    label: string;
    metal_id: number | string | "";
    metal_purity_id: number | string | "";
    diamond_option_key: string | null | undefined;
    size_id?: number | null;
    is_default: boolean;
    inventory_quantity?: number | string;
    metadata?: Record<string, any>;
    metals: VariantMetalForm[];
    diamonds: VariantDiamondForm[];
};

export type AdminProduct = {
    id?: number;
    name?: string;
    titleline?: string;
    sku?: string;
    description?: string;
    brand_id?: number;
    category_id?: number;
    style_ids?: number[];
    category_ids?: number[];
    subcategory_ids?: number[];
    category?: {
        id: number;
        name: string;
        sizes?: Array<{ id: number; name: string; value?: string }>;
    } | null;
    catalog_ids?: number[];
    collection?: string;
    producttype?: string;
    gender?: string;
    making_charge_amount?: number | string;
    making_charge_percentage?: number | string;
    is_active?: boolean;
    metadata?: Record<string, any> | null;
    media?: AdminProductMedia[];
    variants?: Array<{
        id?: number;
        sku?: string;
        label?: string;
        is_default?: boolean;
        inventory_quantity?: number;
        metadata?: Record<string, any>;
        metals?: Array<{
            id?: number;
            metal_id?: number | "";
            metal_purity_id?: number | "";
            metal_tone_id?: number | "";
            metal_weight?: number | string;
        }>;
        diamonds?: Array<{
            id?: number;
            diamond_id?: number | "";
            diamonds_count?: number | string;
        }>;
    }>;
};

export type OptionListItem = {
    id: number;
    name: string;
    sizes?: Array<{ id: number; name: string; value?: string }>;
    styles?: Array<{ id: number; name: string }>;
};

export type OptionList = Record<string, string>;

export type MetalOption = {
    id: number;
    name: string;
};

export type MetalPurityOption = {
    id: number;
    metal_id: number;
    name: string;
    metal: { id: number; name: string } | null;
    is_active?: boolean;
};

export type MetalToneOption = {
    id: number;
    metal_id: number;
    name: string;
    metal: { id: number; name: string } | null;
    is_active?: boolean;
};

export type CatalogOption = {
    id: number;
    code: string | null;
    name: string;
    products_count: number;
    display_order: number;
    is_active: boolean;
};

export type SubcategoryOption = {
    id: number;
    name: string;
    parent_id: number;
};

export type AdminProductMedia = {
    id: number;
    type: string;
    url: string;
    display_order: number;
    metadata?: Record<string, unknown> | null;
};
