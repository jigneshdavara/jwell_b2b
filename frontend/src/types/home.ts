/**
 * Home page types
 */

export type HomePageStats = {
    products: number;
    orders: number;
    jobworks: number;
    active_offers: number;
};

export type HomePageFeature = {
    title: string;
    description: string;
};

export type HomePageProps = {
    stats: HomePageStats;
    brands: string[];
    spotlight: Array<import('./product').SpotlightProduct>;
    features: HomePageFeature[];
};

