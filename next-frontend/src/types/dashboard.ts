/**
 * Dashboard-related types
 */

export type DashboardData = {
    stats: Record<string, number>;
    recentOrders?: Array<{
        reference: string;
        status: string;
        total: number;
        items: number;
        placed_on: string;
    }>;
    recentProducts: Array<{
        id: number;
        name: string;
        sku: string;
        brand?: string | null;
        catalog?: string | null;
        price_total: number;
        thumbnail?: string | null;
    }>;
    featuredCatalogs: Array<{
        id: number;
        name: string;
        slug?: string | null;
        description?: string | null;
        products_count?: number;
        thumbnail?: string | null;
    }>;
};

