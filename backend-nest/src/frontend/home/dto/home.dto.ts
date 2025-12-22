export class HomeResponseDto {
    stats: {
        products: number;
        orders: number;
        jobworks: number;
        active_offers: number;
    };
    spotlight: Array<{
        id: string;
        name: string;
        brand?: string | null;
        price: number | null;
        making_charge_amount: number | null;
        making_charge_percentage: number | null;
        making_charge_types: string[];
    }>;
    features: Array<{
        title: string;
        description: string;
    }>;
    brands: string[];
}

