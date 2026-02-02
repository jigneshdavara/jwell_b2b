export class DashboardStatsDto {
    open_orders: number;
    active_offers: number;
}

export class RecentOrderDto {
    reference: string;
    status: string;
    total: number;
    items: number;
    placed_on: string;
}

export class RecentProductDto {
    id: bigint;
    name: string;
    sku: string;
    price_total: number;
    thumbnail: string | null;
}

export class FeaturedCatalogDto {
    id: bigint;
    name: string;
    description: string | null;
    products_count: number;
}

export class DashboardDataDto {
    stats: DashboardStatsDto;
    recentOrders: RecentOrderDto[];
    recentProducts: RecentProductDto[];
    featuredCatalogs: FeaturedCatalogDto[];
}
