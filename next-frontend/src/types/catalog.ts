/**
 * Catalog and filtering types
 */

export type CatalogFiltersInput = {
    brand?: string | string[] | null;
    metal?: string | string[] | null;
    metal_purity?: string | string[] | null;
    metal_tone?: string | string[] | null;
    diamond?: string | string[] | null;
    price_min?: string | null;
    price_max?: string | null;
    search?: string | string[] | null;
    category?: string | string[] | null;
    catalog?: string | null;
    sort?: string | null;
    jobwork_available?: string | null;
    ready_made?: string | null;
};

export type CatalogFilters = {
    brand: string[];
    metal: string[];
    metal_purity: string[];
    metal_tone: string[];
    diamond: string[];
    price_min?: string;
    price_max?: string;
    search?: string;
    category: string[];
    catalog: string[];
    sort?: string;
    jobwork_available?: string;
    ready_made?: string;
};

export type PriceRange = {
    min: number;
    max: number;
};

export type CatalogFacets = {
    brands: string[];
    categories: Array<{ id: number; name: string; slug?: string | null }>;
    catalogs: Array<{ id: number; name: string; slug?: string | null }>;
    metals: Array<{ id: number; name: string }>;
    metalPurities: Array<{ 
        id: number; 
        name: string; 
        metal_id: number; 
        metal: { id: number; name: string } | null 
    }>;
    metalTones: Array<{ 
        id: number; 
        name: string; 
        metal_id: number; 
        metal: { id: number; name: string } | null 
    }>;
    diamondOptions: {
        types: Array<{ id: number; name: string }>;
        shapes: Array<{ id: number; name: string }>;
        colors: Array<{ id: number; name: string }>;
        clarities: Array<{ id: number; name: string }>;
    };
};

export type CatalogProps = {
    filters: CatalogFiltersInput;
    products: {
        data: import('./product').Product[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        next_page_url: string | null;
        prev_page_url: string | null;
    };
    facets: CatalogFacets;
};

