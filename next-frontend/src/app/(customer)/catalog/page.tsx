'use client';

import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { route } from '@/utils/route';
import { frontendService } from '@/services/frontendService';
import { useWishlist } from '@/contexts/WishlistContext';
import { formatCurrency } from '@/utils/formatting';
import type { Product, CatalogFiltersInput, CatalogFilters, CatalogProps, PriceRange } from '@/types';

const FILTER_LABELS: Record<string, string> = {
    brand: 'Brand',
    metal: 'Metal',
    metal_purity: 'Metal purity',
    metal_tone: 'Metal tone',
    search: 'Search',
    category: 'Category',
    catalog: 'Catalog',
    diamond: 'Diamond',
    price_min: 'Min price',
    price_max: 'Max price',
    jobwork_available: 'Available for jobwork',
    ready_made: 'Ready made jewelry',
};

const DEFAULT_PRICE_MIN = 0;
const DEFAULT_PRICE_MAX = 500000;
const PRICE_STEP = 1000;


export default function CatalogPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { wishlistProductIds, addProductId, removeProductId, refreshWishlist } = useWishlist();
    
    const [data, setData] = useState<CatalogProps | null>(null);
    const [loading, setLoading] = useState(true);
    const [wishlistBusyId, setWishlistBusyId] = useState<number | null>(null);
    const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [catalogItems, setCatalogItems] = useState<Product[]>([]);
    
    const [collapsedFilters, setCollapsedFilters] = useState<Record<string, boolean>>({
        categories: false,
        catalogs: true,
        brands: true,
        metals: false,
        metalPurities: true,
        metalTones: true,
        diamond: true,
        price: false,
    });

    const loaderRef = useRef<HTMLDivElement | null>(null);

    // Helper function to get media URL
    const getMediaUrl = (url: string | null | undefined): string | null => {
        if (!url) return null;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
            setLoading(true);
                
                // Build filters from search params
                const filters: any = {
                    page: parseInt(searchParams.get('page') || '1'),
                };
                
                // Extract array params
                // For single values, pass as single value (backend @Transform(toArray) will handle it)
                // For multiple values, pass as array
                ['brand', 'metal', 'metal_purity', 'metal_tone', 'diamond', 'category', 'catalog'].forEach(key => {
                    const values = searchParams.getAll(key);
                    if (values.length > 0) {
                        // If single value, pass as string; if multiple, pass as array
                        filters[key] = values.length === 1 ? values[0] : values;
                    }
                });
                
                // Extract single params
                ['search', 'sort', 'ready_made'].forEach(key => {
                    const value = searchParams.get(key);
                    if (value) filters[key] = value;
                });
                
                // Extract price range
                const priceMin = searchParams.get('price_min');
                const priceMax = searchParams.get('price_max');
                if (priceMin) filters.price_min = parseInt(priceMin);
                if (priceMax) filters.price_max = parseInt(priceMax);
                
                // Call API
                const response = await frontendService.getCatalog(filters);
                
                if (response.data) {
                    // Map response to expected structure
                    const apiData = response.data;
                    
                    // Convert products - ensure BigInt IDs are numbers
                    const products = (apiData.products?.data || []).map((product: any) => ({
                        ...product,
                        id: Number(product.id),
                        price_total: Number(product.price_total || 0),
                        making_charge_amount: Number(product.making_charge_amount || 0),
                        thumbnail: product.thumbnail ? getMediaUrl(product.thumbnail) : null,
                        media: (product.media || []).map((m: any) => ({
                            ...m,
                            url: getMediaUrl(m.url) || m.url,
                        })),
                        variants: (product.variants || []).map((v: any) => ({
                            ...v,
                            id: Number(v.id),
                        })),
                    }));
                    
                    // Build pagination links
                    const currentPage = apiData.products?.current_page || 1;
                    const lastPage = apiData.products?.last_page || 1;
                    const links: Array<{ url: string | null; label: string; active: boolean }> = [];
                    
                    // Add previous link
                    if (currentPage > 1) {
                        const prevParams = new URLSearchParams(searchParams.toString());
                        prevParams.set('page', String(currentPage - 1));
                        links.push({ url: `?${prevParams.toString()}`, label: 'Previous', active: false });
                    }
                    
                    // Add page number links
                    for (let i = 1; i <= lastPage; i++) {
                        const pageParams = new URLSearchParams(searchParams.toString());
                        pageParams.set('page', String(i));
                        links.push({ 
                            url: `?${pageParams.toString()}`, 
                            label: String(i), 
                            active: i === currentPage 
                        });
                    }
                    
                    // Add next link
                    if (currentPage < lastPage) {
                        const nextParams = new URLSearchParams(searchParams.toString());
                        nextParams.set('page', String(currentPage + 1));
                        links.push({ url: `?${nextParams.toString()}`, label: 'Next', active: false });
                    }
                    
                    const mappedData: CatalogProps = {
                        filters: apiData.filters || {},
                products: {
                            data: products,
                            links,
                            next_page_url: currentPage < lastPage ? `?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(currentPage + 1) }).toString()}` : null,
                            prev_page_url: currentPage > 1 ? `?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(currentPage - 1) }).toString()}` : null,
                },
                facets: {
                            ...apiData.facets,
                            categories: (apiData.facets?.categories || []).map((c: any) => ({
                                id: Number(c.id),
                                name: c.name,
                                slug: c.slug || null,
                            })),
                            metals: (apiData.facets?.metals || []).map((m: any) => ({
                                id: Number(m.id),
                                name: m.name,
                            })),
                            metalPurities: (apiData.facets?.metalPurities || []).map((p: any) => ({
                                id: Number(p.id),
                                name: p.name,
                                metal_id: Number(p.metal_id),
                                metal: p.metal ? { id: Number(p.metal.id), name: p.metal.name } : null,
                            })),
                            metalTones: (apiData.facets?.metalTones || []).map((t: any) => ({
                                id: Number(t.id),
                                name: t.name,
                                metal_id: Number(t.metal_id),
                                metal: t.metal ? { id: Number(t.metal.id), name: t.metal.name } : null,
                            })),
                            catalogs: (apiData.facets?.catalogs || []).map((c: any) => ({
                                id: Number(c.id),
                                name: c.name,
                                slug: c.slug || null,
                            })),
                            diamondOptions: {
                                types: apiData.facets?.diamondOptions?.types || [],
                                shapes: (apiData.facets?.diamondOptions?.shapes || []).map((s: any) => ({
                                    id: Number(s.id),
                                    name: s.name,
                                })),
                                colors: (apiData.facets?.diamondOptions?.colors || []).map((c: any) => ({
                                    id: Number(c.id),
                                    name: c.name,
                                })),
                                clarities: (apiData.facets?.diamondOptions?.clarities || []).map((c: any) => ({
                                    id: Number(c.id),
                                    name: c.name,
                                })),
                            },
                        },
            };
            
                    setData(mappedData);
                    setCatalogItems(products);
                    
                    // Refresh wishlist count (context will handle it)
                    refreshWishlist();
                }
            } catch (error: any) {
                console.error('Failed to load catalog:', error);
                // Set empty data on error
                setData({
                    filters: {},
                    products: { data: [], links: [], next_page_url: null, prev_page_url: null },
                    facets: {
                        brands: [],
                        categories: [],
                        catalogs: [],
                        metals: [],
                        metalPurities: [],
                        metalTones: [],
                        diamondOptions: { types: [], shapes: [], colors: [], clarities: [] },
                    },
                });
                setCatalogItems([]);
            } finally {
            setLoading(false);
            }
        };
        fetchData();
    }, [searchParams]);

    const facets = data?.facets ?? {
        brands: [],
        categories: [],
        catalogs: [],
        metals: [],
        metalPurities: [],
        metalTones: [],
        diamondOptions: { types: [], shapes: [], colors: [], clarities: [] }
    };

    const rawFilters = data?.filters ?? {};

    const filters = useMemo<CatalogFilters>(() => {
        const normalizeArray = (input?: string | string[] | null): string[] => {
            if (!input) return [];
            return Array.isArray(input) ? input.map(String) : [String(input)];
        };

        const normalizeSingle = (input?: string | null): string | undefined => {
            if (typeof input !== 'string') return undefined;
            const trimmed = input.trim();
            return trimmed === '' ? undefined : trimmed;
        };

        return {
            brand: normalizeArray(rawFilters.brand),
            search: normalizeSingle(Array.isArray(rawFilters.search) ? rawFilters.search[0] : rawFilters.search),
            metal: normalizeArray(rawFilters.metal),
            metal_purity: normalizeArray(rawFilters.metal_purity),
            metal_tone: normalizeArray(rawFilters.metal_tone),
            diamond: normalizeArray(rawFilters.diamond),
            price_min: normalizeSingle(rawFilters.price_min),
            price_max: normalizeSingle(rawFilters.price_max),
            category: normalizeArray(rawFilters.category),
            catalog: normalizeArray(rawFilters.catalog),
            sort: normalizeSingle(rawFilters.sort),
            jobwork_available: normalizeSingle(rawFilters.jobwork_available),
            ready_made: normalizeSingle(rawFilters.ready_made),
        };
    }, [rawFilters]);

    const [search, setSearch] = useState(filters.search ?? '');
    const [priceRange, setPriceRange] = useState<PriceRange>(() => ({
        min: filters.price_min ? Number(filters.price_min) : DEFAULT_PRICE_MIN,
        max: filters.price_max ? Number(filters.price_max) : DEFAULT_PRICE_MAX,
    }));

    // Use refs to track previous values and prevent unnecessary updates
    const prevSearchRef = useRef<string | undefined>(filters.search);
    const prevPriceMinRef = useRef<string | undefined>(filters.price_min);
    const prevPriceMaxRef = useRef<string | undefined>(filters.price_max);

    useEffect(() => {
        // Only update search if it actually changed
        const newSearch = filters.search ?? '';
        if (prevSearchRef.current !== filters.search) {
            setSearch(newSearch);
            prevSearchRef.current = filters.search;
        }

        // Only update price range if it actually changed
        const newMin = filters.price_min ? Number(filters.price_min) : DEFAULT_PRICE_MIN;
        const newMax = filters.price_max ? Number(filters.price_max) : DEFAULT_PRICE_MAX;
        
        if (prevPriceMinRef.current !== filters.price_min || prevPriceMaxRef.current !== filters.price_max) {
        setPriceRange({
                min: newMin,
                max: newMax,
        });
            prevPriceMinRef.current = filters.price_min;
            prevPriceMaxRef.current = filters.price_max;
        }
    }, [filters.search, filters.price_min, filters.price_max]);

    const wishlistLookup = useMemo(() => new Set(wishlistProductIds), [wishlistProductIds]);

    const updateQueryParams = (newFilters: Record<string, any>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                params.delete(key);
            } else if (Array.isArray(value)) {
                params.delete(key);
                value.forEach(v => params.append(key, v));
            } else {
                params.set(key, value);
            }
        });
        params.delete('page'); // Reset pagination on filter change
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    const applyFilter = (key: keyof CatalogProps['filters'], value?: string | string[]) => {
        updateQueryParams({ [key]: value });
    };

    const applyPriceRange = (min: number, max: number) => {
        updateQueryParams({
            price_min: min > DEFAULT_PRICE_MIN ? String(min) : undefined,
            price_max: max < DEFAULT_PRICE_MAX ? String(max) : undefined,
        });
    };

    const resetPriceRange = () => {
        setPriceRange({ min: DEFAULT_PRICE_MIN, max: DEFAULT_PRICE_MAX });
        updateQueryParams({ price_min: undefined, price_max: undefined });
    };

    const resetFilters = () => {
        router.push(window.location.pathname);
    };

    const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilter('search', search.trim() || undefined);
    };

    const toggleWishlist = async (productId: number, variantId?: number | null) => {
        if (wishlistBusyId === productId) return;
        setWishlistBusyId(productId);

        try {
            if (wishlistLookup.has(productId)) {
                // Remove from wishlist
                await frontendService.removeFromWishlistByProduct(productId, variantId);

                // Update context
                removeProductId(productId);
                
                // Refresh wishlist to ensure count is accurate
                await refreshWishlist();
                
                // Show flash message
                setFlashMessage({ type: 'success', message: 'Removed from wishlist.' });
                setTimeout(() => setFlashMessage(null), 3000);
            } else {
                // Add to wishlist
                await frontendService.addToWishlist({
                    product_id: productId,
                    product_variant_id: variantId ?? undefined,
                });

                // Update context
                addProductId(productId);
                
                // Refresh wishlist to ensure count is accurate
                await refreshWishlist();
                
                // Show flash message (same as Laravel)
                setFlashMessage({ type: 'success', message: 'Saved to your wishlist.' });
                setTimeout(() => setFlashMessage(null), 3000);
            }
        } catch (error: any) {
            console.error('Error toggling wishlist:', error);
            setFlashMessage({ 
                type: 'error', 
                message: error.response?.data?.message || 'Failed to update wishlist. Please try again.' 
            });
            setTimeout(() => setFlashMessage(null), 3000);
        } finally {
            setWishlistBusyId(null);
        }
    };

    const valueNameMap = useMemo(() => {
        const map = new Map<string, string>();
        facets.metals.forEach((metal) => map.set(`metal:${metal.id}`, metal.name));
        facets.metalPurities.forEach((purity) => map.set(`metal_purity:${purity.id}`, purity.name));
        facets.metalTones.forEach((tone) => map.set(`metal_tone:${tone.id}`, tone.name));
        facets.diamondOptions.shapes.forEach((option) => map.set(`diamond:shape:${option.id}`, option.name));
        facets.diamondOptions.colors.forEach((option) => map.set(`diamond:color:${option.id}`, option.name));
        facets.diamondOptions.clarities.forEach((option) => map.set(`diamond:clarity:${option.id}`, option.name));
        facets.brands.forEach((brand) => map.set(`brand:${brand}`, brand));
        facets.categories.forEach((category) => {
            map.set(`category:${category.slug ?? category.id}`, category.name);
        });
        facets.catalogs.forEach((catalog) => {
            map.set(`catalog:${catalog.id}`, catalog.name);
        });
        return map;
    }, [facets]);

    const activeFilters = useMemo(() => {
        const entries: Array<{ key: keyof CatalogFilters; value: string; label: string; valueLabel: string }> = [];

        filters.brand.forEach((value) => {
            entries.push({
                key: 'brand',
                value,
                label: FILTER_LABELS.brand,
                valueLabel: valueNameMap.get(`brand:${value}`) ?? value,
            });
        });

        filters.metal.forEach((value) => {
            entries.push({
                key: 'metal',
                value,
                label: FILTER_LABELS.metal,
                valueLabel: valueNameMap.get(`metal:${value}`) ?? value,
            });
        });

        filters.metal_purity.forEach((value) => {
            entries.push({
                key: 'metal_purity',
                value,
                label: FILTER_LABELS.metal_purity,
                valueLabel: valueNameMap.get(`metal_purity:${value}`) ?? value,
            });
        });

        filters.metal_tone.forEach((value) => {
            entries.push({
                key: 'metal_tone',
                value,
                label: FILTER_LABELS.metal_tone,
                valueLabel: valueNameMap.get(`metal_tone:${value}`) ?? value,
            });
        });

        if (filters.search) {
            entries.push({
                key: 'search',
                value: filters.search,
                label: FILTER_LABELS.search,
                valueLabel: filters.search,
            });
        }

        filters.category.forEach((value) => {
            entries.push({
                key: 'category',
                value,
                label: FILTER_LABELS.category,
                valueLabel: valueNameMap.get(`category:${value}`) ?? value,
            });
        });

        filters.catalog.forEach((value) => {
            entries.push({
                key: 'catalog',
                value,
                label: FILTER_LABELS.catalog,
                valueLabel: valueNameMap.get(`catalog:${value}`) ?? value,
            });
        });

        filters.diamond.forEach((value) => {
            const [kind, id] = value.includes(':') ? value.split(':') : [null, value];
            const mapKey = kind ? `diamond:${kind}:${id}` : null;
            
            entries.push({
                key: 'diamond',
                value,
                label: 'Diamond',
                valueLabel: mapKey ? valueNameMap.get(mapKey) ?? value : value,
            });
        });

        if (filters.price_min) {
            entries.push({
                key: 'price_min',
                value: filters.price_min,
                label: FILTER_LABELS.price_min,
                valueLabel: formatCurrency(Number(filters.price_min)),
            });
        }

        if (filters.price_max) {
            entries.push({
                key: 'price_max',
                value: filters.price_max,
                label: FILTER_LABELS.price_max,
                valueLabel: formatCurrency(Number(filters.price_max)),
            });
        }

        if (filters.jobwork_available === '1') {
            entries.push({
                key: 'jobwork_available',
                value: '1',
                label: FILTER_LABELS.jobwork_available,
                valueLabel: 'Yes',
            });
        }

        if (filters.ready_made === '1') {
            entries.push({
                key: 'ready_made',
                value: '1',
                label: FILTER_LABELS.ready_made,
                valueLabel: 'Yes',
            });
        }

        return entries;
    }, [filters, valueNameMap]);

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    return (
        <>
            {flashMessage && (
                <div
                    className={`mb-6 rounded-2xl border px-4 py-3 text-sm shadow-sm transition ${
                        flashMessage.type === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <p className="font-medium">{flashMessage.message}</p>
                        <button
                            onClick={() => setFlashMessage(null)}
                            className="ml-4 text-current opacity-70 hover:opacity-100"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                className="h-4 w-4"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
            <div className="space-y-4" id="catalog">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h1 className="text-2xl font-semibold text-slate-900">
                        Showcase Collection
                    </h1>
                    <form onSubmit={onSearchSubmit} className="flex gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search SKU or design"
                                className="w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-1.5 text-sm text-slate-700 shadow-inner focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                            />
                            {filters.search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        applyFilter('search');
                                    }}
                                    className="absolute inset-y-0 right-2 flex items-center text-xs font-medium text-slate-400 hover:text-slate-600"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <button type="submit" className="rounded-xl bg-elvee-blue px-3 py-1.5 text-sm font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy">
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800"
                        >
                            Reset
                        </button>
                    </form>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                                viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            aria-label="Grid view"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25A2.25 2.25 0 018 10.5H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                                viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            aria-label="List view"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <label htmlFor="catalog-sort" className="font-medium">
                            Sort by
                        </label>
                        <select
                            id="catalog-sort"
                            value={filters.sort ?? 'newest'}
                            onChange={(event) => {
                                applyFilter('sort', event.target.value === 'newest' ? undefined : event.target.value);
                            }}
                            className="rounded-2xl border border-slate-200 px-3 py-2 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                        >
                            <option value="newest">Newest arrivals</option>
                            <option value="price_asc">Price: Low to high</option>
                            <option value="price_desc">Price: High to low</option>
                            <option value="name_asc">Name: A to Z</option>
                        </select>
                    </div>
                </div>

                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs">
                        {activeFilters.map(({ key, label, valueLabel, value }) => (
                        <button
                            key={`${key}-${valueLabel}`}
                            onClick={() => {
                                if (['brand', 'metal', 'metal_purity', 'metal_tone', 'category', 'catalog', 'diamond'].includes(key)) {
                                    const existing = Array.isArray(filters[key]) ? (filters[key] as string[]) : [];
                                    const updated = existing.filter((entry) => entry !== value);
                                    applyFilter(key as keyof CatalogProps['filters'], updated.length ? updated : undefined);
                                    return;
                                }
                                if (key === 'price_min') {
                                    applyPriceRange(DEFAULT_PRICE_MIN, filters.price_max ? Number(filters.price_max) : DEFAULT_PRICE_MAX);
                                    return;
                                }
                                if (key === 'price_max') {
                                    applyPriceRange(filters.price_min ? Number(filters.price_min) : DEFAULT_PRICE_MIN, DEFAULT_PRICE_MAX);
                                    return;
                                }
                                applyFilter(key as keyof CatalogProps['filters']);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-slate-700 hover:bg-slate-300"
                        >
                            {label}: <span className="font-semibold">{valueLabel}</span>
                            <span aria-hidden>×</span>
                        </button>
                        ))}
                    </div>
                )}

                <div className="grid gap-4 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200/70 lg:grid-cols-5">
                    <aside className="space-y-3 lg:col-span-1">
                        {/* Categories Filter */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setCollapsedFilters((prev) => ({ ...prev, categories: !prev.categories }))}
                                className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
                            >
                                <span>Categories</span>
                                <svg
                                    className={`h-4 w-4 transition-transform ${collapsedFilters.categories ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            {!collapsedFilters.categories && (
                                <div className="mt-3 space-y-1.5 text-sm">
                                    {facets.categories.map((category) => {
                                        const value = category.slug ?? String(category.id);
                                        const selected = filters.category.includes(value);
                                        return (
                                            <label key={category.id} className={`flex items-center gap-2.5 py-1.5 text-sm transition ${selected ? 'text-slate-900' : 'text-slate-600'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                    checked={selected}
                                                    onChange={(event) => {
                                                        const list = [...filters.category];
                                                        if (event.target.checked) {
                                                            if (!list.includes(value)) list.push(value);
                                                        } else {
                                                            const index = list.indexOf(value);
                                                            if (index >= 0) list.splice(index, 1);
                                                        }
                                                        applyFilter('category', list.length ? list : undefined);
                                                    }}
                                                />
                                                <span>{category.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Catalogs Filter */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setCollapsedFilters((prev) => ({ ...prev, catalogs: !prev.catalogs }))}
                                className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
                            >
                                <span>Catalogs</span>
                                <svg
                                    className={`h-4 w-4 transition-transform ${collapsedFilters.catalogs ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            {!collapsedFilters.catalogs && (
                                <div className="mt-3 space-y-1.5 text-sm">
                                    {facets.catalogs.map((catalog) => {
                                        const value = String(catalog.id);
                                        const selected = filters.catalog.includes(value);
                                        return (
                                            <label key={catalog.id} className={`flex items-center gap-2.5 py-1.5 text-sm transition ${selected ? 'text-slate-900' : 'text-slate-600'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                    checked={selected}
                                                    onChange={(event) => {
                                                        const list = [...filters.catalog];
                                                        if (event.target.checked) {
                                                            if (!list.includes(value)) list.push(value);
                                                        } else {
                                                            const index = list.indexOf(value);
                                                            if (index >= 0) list.splice(index, 1);
                                                        }
                                                        applyFilter('catalog', list.length ? list : undefined);
                                                    }}
                                                />
                                                <span>{catalog.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Brands Filter */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setCollapsedFilters((prev) => ({ ...prev, brands: !prev.brands }))}
                                className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
                            >
                                <span>Brands</span>
                                <svg
                                    className={`h-4 w-4 transition-transform ${collapsedFilters.brands ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            {!collapsedFilters.brands && (
                                <div className="mt-3 space-y-1.5 text-sm">
                                    {facets.brands.map((brand) => {
                                        const selected = filters.brand.includes(brand);
                                        return (
                                            <label
                                                key={brand}
                                                className={`flex items-center gap-2.5 py-1.5 text-sm transition ${
                                                    selected ? 'text-slate-900' : 'text-slate-600'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                    checked={selected}
                                                    onChange={(event) => {
                                                        const list = [...filters.brand];
                                                        if (event.target.checked) {
                                                            if (!list.includes(brand)) list.push(brand);
                                                        } else {
                                                            const index = list.indexOf(brand);
                                                            if (index >= 0) list.splice(index, 1);
                                                        }
                                                        applyFilter('brand', list.length ? list : undefined);
                                                    }}
                                                />
                                                <span>{brand}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Metals Filter */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setCollapsedFilters((prev) => ({ ...prev, metals: !prev.metals }))}
                                className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
                            >
                                <span>Metals</span>
                                <svg
                                    className={`h-4 w-4 transition-transform ${collapsedFilters.metals ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            {!collapsedFilters.metals && (
                                <div className="mt-3 space-y-1.5 text-sm">
                                    {facets.metals.map((metal) => {
                                        const selected = filters.metal.includes(String(metal.id));
                                        return (
                                            <label
                                                key={metal.id}
                                                className={`flex items-center gap-2.5 py-1.5 text-sm transition ${
                                                    selected ? 'text-slate-900' : 'text-slate-600'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                    checked={selected}
                                                    onChange={(event) => {
                                                        const list = [...filters.metal];
                                                        if (event.target.checked) {
                                                            list.push(String(metal.id));
                                                        } else {
                                                            const index = list.indexOf(String(metal.id));
                                                            if (index >= 0) list.splice(index, 1);
                                                        }
                                                        applyFilter('metal', list.length ? list : undefined);
                                                    }}
                                                />
                                                <span>{metal.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Metal Purities Filter */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setCollapsedFilters((prev) => ({ ...prev, metalPurities: !prev.metalPurities }))}
                                className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
                            >
                                <span>Metal purities</span>
                                <svg
                                    className={`h-4 w-4 transition-transform ${collapsedFilters.metalPurities ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            {!collapsedFilters.metalPurities && (
                                <div className="mt-3 space-y-1.5 text-sm">
                                    {facets.metalPurities.map((purity) => {
                                        const selected = filters.metal_purity.includes(String(purity.id));
                                        return (
                                            <label
                                                key={purity.id}
                                                className={`flex items-center gap-2.5 py-1.5 text-sm transition ${
                                                    selected ? 'text-slate-900' : 'text-slate-600'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                    checked={selected}
                                                    onChange={(event) => {
                                                        const list = [...filters.metal_purity];
                                                        if (event.target.checked) {
                                                            list.push(String(purity.id));
                                                        } else {
                                                            const index = list.indexOf(String(purity.id));
                                                            if (index >= 0) list.splice(index, 1);
                                                        }
                                                        applyFilter('metal_purity', list.length ? list : undefined);
                                                    }}
                                                />
                                                <span>{purity.name} {purity.metal ? `(${purity.metal.name})` : ''}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Metal Tones Filter */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setCollapsedFilters((prev) => ({ ...prev, metalTones: !prev.metalTones }))}
                                className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
                            >
                                <span>Metal tones</span>
                                <svg
                                    className={`h-4 w-4 transition-transform ${collapsedFilters.metalTones ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            {!collapsedFilters.metalTones && (
                                <div className="mt-3 space-y-1.5 text-sm">
                                    {facets.metalTones.map((tone) => {
                                        const selected = filters.metal_tone.includes(String(tone.id));
                                        return (
                                            <label
                                                key={tone.id}
                                                className={`flex items-center gap-2.5 py-1.5 text-sm transition ${
                                                    selected ? 'text-slate-900' : 'text-slate-600'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                    checked={selected}
                                                    onChange={(event) => {
                                                        const list = [...filters.metal_tone];
                                                        if (event.target.checked) {
                                                            list.push(String(tone.id));
                                                        } else {
                                                            const index = list.indexOf(String(tone.id));
                                                            if (index >= 0) list.splice(index, 1);
                                                        }
                                                        applyFilter('metal_tone', list.length ? list : undefined);
                                                    }}
                                                />
                                                <span>{tone.name} {tone.metal ? `(${tone.metal.name})` : ''}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Diamond Filter */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setCollapsedFilters((prev) => ({ ...prev, diamond: !prev.diamond }))}
                                className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
                            >
                                <span>Diamond</span>
                                <svg
                                    className={`h-4 w-4 transition-transform ${collapsedFilters.diamond ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            {!collapsedFilters.diamond && (
                                <div className="mt-3 space-y-4 text-sm">
                                    {[
                                        { title: 'Shapes', kind: 'shape', options: facets.diamondOptions.shapes },
                                        { title: 'Colors', kind: 'color', options: facets.diamondOptions.colors },
                                        { title: 'Clarities', kind: 'clarity', options: facets.diamondOptions.clarities },
                                    ].map(({ title, kind, options }) => (
                                        <div key={kind}>
                                            <p className="text-xs font-semibold text-slate-500">{title}</p>
                                            <div className="mt-2 space-y-1.5">
                                                {options.map((option) => {
                                                    const value = `${kind}:${option.id}`;
                                                    const selected = filters.diamond.includes(value);
                                                    return (
                                                        <label
                                                            key={value}
                                                            className={`flex items-center gap-2.5 py-1.5 text-sm transition ${
                                                                selected ? 'text-slate-900' : 'text-slate-600'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                                checked={selected}
                                                                onChange={(event) => {
                                                                    const list = [...filters.diamond];
                                                                    if (event.target.checked) {
                                                                        if (!list.includes(value)) list.push(value);
                                                                    } else {
                                                                        const index = list.indexOf(value);
                                                                        if (index >= 0) list.splice(index, 1);
                                                                    }
                                                                    applyFilter('diamond', list.length ? list : undefined);
                                                                }}
                                                            />
                                                            <span>{option.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Price Range Filter */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setCollapsedFilters((prev) => ({ ...prev, price: !prev.price }))}
                                className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
                            >
                                <span>Price range (₹)</span>
                                <svg
                                    className={`h-4 w-4 transition-transform ${collapsedFilters.price ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                            {!collapsedFilters.price && (
                                <PriceRangeFilter
                                    applyPriceRange={applyPriceRange}
                                    resetPriceRange={resetPriceRange}
                                    priceRange={priceRange}
                                    setPriceRange={setPriceRange}
                                />
                            )}
                        </div>
                    </aside>

                    <section className="lg:col-span-4">
                        {catalogItems.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                No products match your filters. Try broadening your search or reset filters.
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-3'}>
                                {catalogItems.map((product) => {
                                    const productLink = route('frontend.catalog.show', { product: product.id });
                                    const thumbnailUrl = product.thumbnail || null;
                                    const imageUrl = thumbnailUrl ?? product.media?.[0]?.url ?? null;
                                    const defaultVariant = product.variants.find((variant) => variant.is_default) ?? product.variants[0] ?? null;
                                    const isWishlisted = wishlistLookup.has(product.id);

                                    return (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            productLink={productLink}
                                            imageUrl={imageUrl}
                                            defaultVariant={defaultVariant}
                                            isWishlisted={isWishlisted}
                                            wishlistBusyId={wishlistBusyId}
                                            viewMode={viewMode}
                                            toggleWishlist={toggleWishlist}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        <div ref={loaderRef} className="mt-10 flex justify-center">
                            {isLoadingMore && (
                                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                                    Loading more products…
                                </span>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

function PriceRangeFilter({
    priceRange,
    setPriceRange,
    applyPriceRange,
    resetPriceRange,
}: {
    priceRange: PriceRange;
    setPriceRange: Dispatch<SetStateAction<PriceRange>>;
    applyPriceRange: (min: number, max: number) => void;
    resetPriceRange: () => void;
}) {
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
    const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    const getPercentage = (value: number) => {
        return ((value - DEFAULT_PRICE_MIN) / (DEFAULT_PRICE_MAX - DEFAULT_PRICE_MIN)) * 100;
    };

    const handleMinChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (Number.isNaN(value)) return;
        setPriceRange((prev) => {
            const nextMin = clamp(value, DEFAULT_PRICE_MIN, prev.max - PRICE_STEP);
            return { ...prev, min: nextMin };
        });
    };

    const handleMaxChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (Number.isNaN(value)) return;
        setPriceRange((prev) => {
            const nextMax = clamp(value, prev.min + PRICE_STEP, DEFAULT_PRICE_MAX);
            return { ...prev, max: nextMax };
        });
    };

    const handleMinInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value === '' ? DEFAULT_PRICE_MIN : Number(event.target.value);
        if (Number.isNaN(value)) return;
        setPriceRange((prev) => {
            const nextMin = clamp(value, DEFAULT_PRICE_MIN, prev.max - PRICE_STEP);
            return { ...prev, min: nextMin };
        });
    };

    const handleMaxInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value === '' ? DEFAULT_PRICE_MAX : Number(event.target.value);
        if (Number.isNaN(value)) return;
        setPriceRange((prev) => {
            const nextMax = clamp(value, prev.min + PRICE_STEP, DEFAULT_PRICE_MAX);
            return { ...prev, max: nextMax };
        });
    };

    const apply = () => applyPriceRange(priceRange.min, priceRange.max);
    const reset = () => resetPriceRange();

    const minPercent = getPercentage(priceRange.min);
    const maxPercent = getPercentage(priceRange.max);

    return (
        <div className="mt-3 space-y-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{formatCurrency(priceRange.min)}</span>
                <span>{formatCurrency(priceRange.max)}</span>
            </div>
            <div className="relative" ref={sliderRef}>
                <div className="relative h-2 w-full rounded-full bg-slate-200">
                    <div
                        className="absolute h-2 rounded-full bg-feather-gold"
                        style={{
                            left: `${minPercent}%`,
                            width: `${maxPercent - minPercent}%`,
                        }}
                    />
                </div>
                <input
                    type="range"
                    min={DEFAULT_PRICE_MIN}
                    max={DEFAULT_PRICE_MAX}
                    step={PRICE_STEP}
                    value={priceRange.min}
                    onChange={handleMinChange}
                    onMouseDown={() => setActiveThumb('min')}
                    onMouseUp={() => setActiveThumb(null)}
                    onTouchStart={() => setActiveThumb('min')}
                    onTouchEnd={() => setActiveThumb(null)}
                    className="absolute top-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-feather-gold [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:bg-warm-gold [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-10 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-feather-gold [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:hover:bg-warm-gold"
                    style={{
                        zIndex: activeThumb === 'min' ? 20 : 10,
                    }}
                />
                <input
                    type="range"
                    min={DEFAULT_PRICE_MIN}
                    max={DEFAULT_PRICE_MAX}
                    step={PRICE_STEP}
                    value={priceRange.max}
                    onChange={handleMaxChange}
                    onMouseDown={() => setActiveThumb('max')}
                    onMouseUp={() => setActiveThumb(null)}
                    onTouchStart={() => setActiveThumb('max')}
                    onTouchEnd={() => setActiveThumb(null)}
                    className="absolute top-0 h-2 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-feather-gold [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:hover:bg-warm-gold [&::-moz-range-thumb]:relative [&::-moz-range-thumb]:z-10 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-feather-gold [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:hover:bg-warm-gold"
                    style={{
                        zIndex: activeThumb === 'max' ? 20 : 10,
                    }}
                />
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <label className="text-xs font-medium text-slate-500" htmlFor="price-min">
                        Min
                    </label>
                    <input
                        id="price-min"
                        type="number"
                        value={priceRange.min}
                        onChange={handleMinInputChange}
                        min={DEFAULT_PRICE_MIN}
                        max={priceRange.max}
                        step={PRICE_STEP}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs font-medium text-slate-500" htmlFor="price-max">
                        Max
                    </label>
                    <input
                        id="price-max"
                        type="number"
                        value={priceRange.max}
                        onChange={handleMaxInputChange}
                        min={priceRange.min}
                        max={DEFAULT_PRICE_MAX}
                        step={PRICE_STEP}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={apply}
                    className="flex-1 rounded-lg bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy"
                >
                    Apply
                </button>
                <button
                    type="button"
                    onClick={reset}
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}

function ProductCard({
    product,
    productLink,
    imageUrl,
    defaultVariant,
    isWishlisted,
    wishlistBusyId,
    viewMode,
    toggleWishlist,
}: {
    product: Product;
    productLink: string;
    imageUrl: string | null;
    defaultVariant: any;
    isWishlisted: boolean;
    wishlistBusyId: number | null;
    viewMode: 'grid' | 'list';
    toggleWishlist: (productId: number, variantId?: number | null) => void;
}) {
    const wishlistDisabled = wishlistBusyId === product.id;

    const WishlistButton = (
        <button
            type="button"
            onClick={(event) => {
                event.preventDefault();
                toggleWishlist(product.id, defaultVariant?.id ?? null);
            }}
            disabled={wishlistDisabled}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${isWishlisted ? 'border-rose-200 bg-rose-500/10 text-rose-500' : 'border-white/70 bg-white/70 text-slate-600 hover:text-rose-500'} ${wishlistDisabled ? 'opacity-60' : ''}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 5.053 7.5 10.5 9 10.5s9-5.447 9-10.5z" />
            </svg>
        </button>
    );

    if (viewMode === 'list') {
        return (
            <article className="group relative flex gap-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <Link href={productLink} className="block w-48 flex-shrink-0 overflow-hidden rounded-2xl">
                    <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-slate-100">
                        {imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt={product.name} 
                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    console.error('Failed to load image:', imageUrl);
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No image</div>
                        )}
                    </div>
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <Link href={productLink} className="text-lg font-semibold text-slate-900 transition hover:text-feather-gold">{product.name}</Link>
                            <p className="text-sm text-slate-500">SKU {product.sku}</p>
                            <p className="text-sm text-slate-600">{product.brand ?? 'Elvee Atelier'}</p>
                            <p className="text-sm text-slate-600">{formatCurrency(product.price_total)}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500"><span>{product.material ?? 'Custom material'}</span></div>
                        </div>
                        {WishlistButton}
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute right-5 top-5 z-20">{WishlistButton}</div>
            <Link href={productLink} className="block">
                <div className="relative h-56 w-full overflow-hidden rounded-t-3xl bg-slate-100">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={product.name} 
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            onError={(e) => {
                                console.error('Failed to load image:', imageUrl);
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">No image</div>
                    )}
                </div>
            </Link>
            <div className="space-y-3 p-6">
                <Link href={productLink} className="text-lg font-semibold text-slate-900 transition hover:text-feather-gold">{product.name}</Link>
                <p className="text-sm text-slate-500">SKU {product.sku}</p>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <span>{formatCurrency(product.price_total)}</span>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div><span className="font-medium text-slate-600">Material</span><p>{product.material ?? 'Custom blend'}</p></div>
                    </div>
                </div>
            </div>
        </article>
    );
}
