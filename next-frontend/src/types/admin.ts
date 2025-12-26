/**
 * Admin-related types
 */

export type AdminUser = {
    id: number;
    name: string;
    email: string;
    type: string;
    is_active: boolean;
    created_at: string;
};

export type BrandRow = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
};

export type MetalRow = {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    is_active: boolean;
    display_order: number;
};

export type CategoryRow = {
    id: number;
    name: string;
    slug: string;
    parent_id?: number | null;
    style_id?: number | null;
    size_id?: number | null;
    description?: string | null;
    is_active: boolean;
    display_order: number;
};

export type CategoryTreeNode = {
    id: number;
    name: string;
    children?: CategoryTreeNode[];
};

export type DiamondType = {
    id: number;
    name: string;
    code: string | null;
};

export type DiamondTypeRow = {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    display_order: number;
    is_active: boolean;
};

export type DiamondShapeRow = {
    id: number;
    diamond_type_id: number;
    name: string;
    code: string | null;
    display_order: number;
    is_active: boolean;
};

export type DiamondColorRow = {
    id: number;
    diamond_type_id: number;
    name: string;
    code: string | null;
    display_order: number;
    is_active: boolean;
};

export type DiamondClarityRow = {
    id: number;
    diamond_type_id: number;
    name: string;
    code: string | null;
    display_order: number;
    is_active: boolean;
};

export type DiamondClarity = {
    id: number;
    name: string;
    code: string | null;
};

export type DiamondShape = {
    id: number;
    name: string;
    code: string | null;
};

