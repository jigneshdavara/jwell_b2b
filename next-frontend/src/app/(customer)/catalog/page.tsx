'use client';

import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { route } from '@/utils/route';
import { getMediaUrlNullable } from '@/utils/mediaUrl';
import { frontendService } from '@/services/frontendService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchWishlist, addProductId, removeProductId } from '@/store/slices/wishlistSlice';
import { selectWishlistProductIds } from '@/store/selectors/wishlistSelectors';
import { formatCurrency } from '@/utils/formatting';
import { toastError } from '@/utils/toast';
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
    const dispatch = useAppDispatch();
    const wishlistProductIds = useAppSelector(selectWishlistProductIds);
    const refreshWishlist = async () => {
        await dispatch(fetchWishlist());
    };
    
    const [data, setData] = useState<CatalogProps | null>(null);
    const [loading, setLoading] = useState(true);
    const [wishlistBusyId, setWishlistBusyId] = useState<number | null>(null);
    // Toast notifications are handled via RTK
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

    const [selectedDiamondTypes, setSelectedDiamondTypes] = useState<number[]>([]);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

    const loaderRef = useRef<HTMLDivElement | null>(null);

    // Helper function to get media URL

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
                        thumbnail: product.thumbnail ? getMediaUrlNullable(product.thumbnail) : null,
                        media: (product.media || []).map((m: any) => ({
                            ...m,
                            url: getMediaUrlNullable(m.url) || m.url,
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
                                types: (apiData.facets?.diamondOptions?.types || []).map((t: any) => ({
                                    id: Number(t.id),
                                    code: t.code,
                                    name: t.name,
                                })),
                                shapes: (apiData.facets?.diamondOptions?.shapes || []).map((s: any) => ({
                                    id: Number(s.id),
                                    name: s.name,
                                    diamond_type_id: s.diamond_type_id ? Number(s.diamond_type_id) : null,
                                })),
                                colors: (apiData.facets?.diamondOptions?.colors || []).map((c: any) => ({
                                    id: Number(c.id),
                                    name: c.name,
                                    diamond_type_id: c.diamond_type_id ? Number(c.diamond_type_id) : null,
                                })),
                                clarities: (apiData.facets?.diamondOptions?.clarities || []).map((c: any) => ({
                                    id: Number(c.id),
                                    name: c.name,
                                    diamond_type_id: c.diamond_type_id ? Number(c.diamond_type_id) : null,
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

                // Update RTK state
                dispatch(removeProductId(productId));
                
                // Refresh wishlist to ensure count is accurate
                await refreshWishlist();
            } else {
                // Add to wishlist
                await frontendService.addToWishlist({
                    product_id: productId,
                    product_variant_id: variantId ?? undefined,
                });

                // Update context
                dispatch(addProductId(productId));
                
                // Refresh wishlist to ensure count is accurate
                await refreshWishlist();
            }
        } catch (error: any) {
            console.error('Error toggling wishlist:', error);
            toastError(error.response?.data?.message || 'Failed to update wishlist. Please try again.');
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
            <div className="flex items-center justify-center py-12 sm:py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent sm:h-12 sm:w-12" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3 sm:space-y-4" id="catalog">
                <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                        Showcase Collection
                    </h1>
                    <form onSubmit={onSearchSubmit} className="flex gap-1.5 sm:gap-2">
                        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px]">
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search SKU or design"
                                className="w-full rounded-lg border border-slate-300 bg-white/80 px-2.5 py-1.5 text-xs text-slate-700 shadow-inner focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 sm:rounded-xl sm:px-3 sm:text-sm"
                            />
                            {filters.search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        applyFilter('search');
                                    }}
                                    className="absolute inset-y-0 right-1.5 flex items-center text-[10px] font-medium text-slate-400 hover:text-slate-600 sm:right-2 sm:text-xs"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <button type="submit" className="rounded-lg bg-elvee-blue px-2.5 py-1.5 text-xs font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy sm:rounded-xl sm:px-3 sm:text-sm">
                            Search
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800 sm:rounded-xl sm:px-3 sm:py-1.5 sm:text-sm"
                        >
                            Reset
                        </button>
                    </form>
                </div>

                <div className="flex flex-col gap-3 rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/70 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:p-3">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                        <button
                            type="button"
                            onClick={() => setMobileFilterOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy active:scale-[0.98] lg:hidden"
                            aria-label="Open filters"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                            </svg>
                            Filters
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition sm:h-9 sm:w-9 flex-shrink-0 ${
                                viewMode === 'grid' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            aria-label="Grid view"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-4 sm:w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25A2.25 2.25 0 018 10.5H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition sm:h-9 sm:w-9 flex-shrink-0 ${
                                viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            aria-label="List view"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 sm:h-4 sm:w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 sm:gap-2 sm:text-sm flex-shrink-0">
                        <label htmlFor="catalog-sort" className="font-medium whitespace-nowrap">
                            Sort by
                        </label>
                        <select
                            id="catalog-sort"
                            value={filters.sort ?? 'newest'}
                            onChange={(event) => {
                                applyFilter('sort', event.target.value === 'newest' ? undefined : event.target.value);
                            }}
                            className="min-w-[140px] rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 sm:min-w-[170px] sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm"
                        >
                            <option value="newest">Newest arrivals</option>
                            <option value="price_asc">Price: Low to high</option>
                            <option value="price_desc">Price: High to low</option>
                            <option value="name_asc">Name: A to Z</option>
                        </select>
                    </div>
                </div>

                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 text-[10px] sm:gap-2 sm:text-xs">
                        {activeFilters.map(({ key, label, valueLabel, value }) => (
                        <button
                            key={`${key}-${value}`}
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
                            className="inline-flex items-center gap-0.5 rounded-full bg-slate-200 px-2 py-0.5 text-slate-700 hover:bg-slate-300 sm:gap-1 sm:px-2.5"
                        >
                            {label}: <span className="font-semibold">{valueLabel}</span>
                            <span aria-hidden>×</span>
                        </button>
                        ))}
                    </div>
                )}

                <div className="grid gap-3 rounded-xl bg-white p-3 shadow-xl ring-1 ring-slate-200/70 sm:gap-4 sm:rounded-2xl sm:p-4 lg:grid-cols-5">
                    <aside className="hidden space-y-2 sm:space-y-3 lg:col-span-1 lg:block">
                        {/* Categories Filter */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setCollapsedFilters((prev) => ({ ...prev, categories: !prev.categories }))}
                                className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                            >
                                <span>Categories</span>
                                <svg
                                    className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.categories ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                            >
                                <span>Catalogs</span>
                                <svg
                                    className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.catalogs ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                            >
                                <span>Brands</span>
                                <svg
                                    className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.brands ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                            >
                                <span>Metals</span>
                                <svg
                                    className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.metals ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                            >
                                <span>Metal purities</span>
                                <svg
                                    className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.metalPurities ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                            >
                                <span>Metal tones</span>
                                <svg
                                    className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.metalTones ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                            >
                                <span>Diamond</span>
                                <svg
                                    className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.diamond ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                            {!collapsedFilters.diamond && (
                                <div className="mt-3 space-y-4 text-sm">
                                    {/* Step 1: Select Diamond Types */}
                                    <div>
                                        <p className="mb-2 text-xs font-semibold text-slate-500">Diamond Types</p>
                                        <div className="space-y-1.5">
                                            {facets.diamondOptions.types.map((type) => {
                                                const isSelected = selectedDiamondTypes.includes(type.id);
                                                return (
                                                    <label
                                                        key={type.id}
                                                        className={`flex items-center gap-2.5 py-1.5 text-sm transition ${
                                                            isSelected ? 'text-slate-900' : 'text-slate-600'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                            checked={isSelected}
                                                            onChange={(event) => {
                                                                if (event.target.checked) {
                                                                    setSelectedDiamondTypes([...selectedDiamondTypes, type.id]);
                                                                } else {
                                                                    setSelectedDiamondTypes(
                                                                        selectedDiamondTypes.filter((id) => id !== type.id)
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <span>{type.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Step 2: Show options for selected types */}
                                    {selectedDiamondTypes.length > 0 && (
                                        <>
                                            {selectedDiamondTypes.map((typeId) => {
                                                const type = facets.diamondOptions.types.find((t) => t.id === typeId);
                                                if (!type) return null;

                                                // Filter options by selected type
                                                const typeShapes = facets.diamondOptions.shapes.filter(
                                                    (s) => s.diamond_type_id === typeId
                                                );
                                                const typeColors = facets.diamondOptions.colors.filter(
                                                    (c) => c.diamond_type_id === typeId
                                                );
                                                const typeClarities = facets.diamondOptions.clarities.filter(
                                                    (c) => c.diamond_type_id === typeId
                                                );

                                                return (
                                                    <div key={typeId} className="space-y-4">
                                                        {/* Shapes */}
                                                        {typeShapes.length > 0 && (
                                                            <div>
                                                                <p className="mb-2 text-xs font-semibold text-slate-500">
                                                                    {type.name} - Shapes
                                                                </p>
                                                                <div className="space-y-1.5">
                                                                    {typeShapes.map((option) => {
                                                                        const value = `shape:${option.id}`;
                                                                        const selected = filters.diamond.includes(value);
                                                                        return (
                                                                            <label
                                                                                key={`shape-${option.id}`}
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
                                                        )}

                                                        {/* Colors */}
                                                        {typeColors.length > 0 && (
                                                            <div>
                                                                <p className="mb-2 text-xs font-semibold text-slate-500">
                                                                    {type.name} - Colors
                                                                </p>
                                                                <div className="space-y-1.5">
                                                                    {typeColors.map((option) => {
                                                                        const value = `color:${option.id}`;
                                                                        const selected = filters.diamond.includes(value);
                                                                        return (
                                                                            <label
                                                                                key={`color-${option.id}`}
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
                                                        )}

                                                        {/* Clarities */}
                                                        {typeClarities.length > 0 && (
                                                            <div>
                                                                <p className="mb-2 text-xs font-semibold text-slate-500">
                                                                    {type.name} - Clarities
                                                                </p>
                                                                <div className="space-y-1.5">
                                                                    {typeClarities.map((option) => {
                                                                        const value = `clarity:${option.id}`;
                                                                        const selected = filters.diamond.includes(value);
                                                                        return (
                                                                            <label
                                                                                key={`clarity-${option.id}`}
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
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Price Range Filter */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setCollapsedFilters((prev) => ({ ...prev, price: !prev.price }))}
                                className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                            >
                                <span>Price range (₹)</span>
                                <svg
                                    className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.price ? '' : 'rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 sm:rounded-2xl sm:p-6 sm:text-sm">
                                No products match your filters. Try broadening your search or reset filters.
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? 'grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-2 sm:gap-3'}>
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

                        <div ref={loaderRef} className="mt-6 flex justify-center sm:mt-10">
                            {isLoadingMore && (
                                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 sm:px-4 sm:py-2 sm:text-sm">
                                    Loading more products…
                                </span>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {mobileFilterOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setMobileFilterOpen(false)}
                    />
                    {/* Filter Panel */}
                    <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white shadow-2xl scrollbar-hide">
                        <div className="flex h-full flex-col">
                            {/* Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Filters</h2>
                                <button
                                    type="button"
                                    onClick={() => setMobileFilterOpen(false)}
                                    className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                                    aria-label="Close filters"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            {/* Filter Content */}
                            <div className="flex-1 space-y-2 p-4 sm:space-y-3">
                                {/* Categories Filter */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setCollapsedFilters((prev) => ({ ...prev, categories: !prev.categories }))}
                                        className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                                    >
                                        <span>Categories</span>
                                        <svg
                                            className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.categories ? '' : 'rotate-180'}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                        className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                                    >
                                        <span>Catalogs</span>
                                        <svg
                                            className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.catalogs ? '' : 'rotate-180'}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                        className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                                    >
                                        <span>Brands</span>
                                        <svg
                                            className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.brands ? '' : 'rotate-180'}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                        className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                                    >
                                        <span>Metals</span>
                                        <svg
                                            className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.metals ? '' : 'rotate-180'}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                        className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                                    >
                                        <span>Metal purities</span>
                                        <svg
                                            className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.metalPurities ? '' : 'rotate-180'}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                        className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                                    >
                                        <span>Metal tones</span>
                                        <svg
                                            className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.metalTones ? '' : 'rotate-180'}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
                                        className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                                    >
                                        <span>Diamond</span>
                                        <svg
                                            className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.diamond ? '' : 'rotate-180'}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>
                                    {!collapsedFilters.diamond && (
                                        <div className="mt-3 space-y-4 text-sm">
                                            {/* Step 1: Select Diamond Types */}
                                            <div>
                                                <p className="mb-2 text-xs font-semibold text-slate-500">Diamond Types</p>
                                                <div className="space-y-1.5">
                                                    {facets.diamondOptions.types.map((type) => {
                                                        const isSelected = selectedDiamondTypes.includes(type.id);
                                                        return (
                                                            <label
                                                                key={type.id}
                                                                className={`flex items-center gap-2.5 py-1.5 text-sm transition ${
                                                                    isSelected ? 'text-slate-900' : 'text-slate-600'
                                                                }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    className="h-4 w-4 rounded border-slate-300 text-elvee-blue focus:ring-feather-gold"
                                                                    checked={isSelected}
                                                                    onChange={(event) => {
                                                                        if (event.target.checked) {
                                                                            setSelectedDiamondTypes([...selectedDiamondTypes, type.id]);
                                                                        } else {
                                                                            setSelectedDiamondTypes(
                                                                                selectedDiamondTypes.filter((id) => id !== type.id)
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                                <span>{type.name}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Step 2: Show options for selected types */}
                                            {selectedDiamondTypes.length > 0 && (
                                                <>
                                                    {selectedDiamondTypes.map((typeId) => {
                                                        const type = facets.diamondOptions.types.find((t) => t.id === typeId);
                                                        if (!type) return null;

                                                        // Filter options by selected type
                                                        const typeShapes = facets.diamondOptions.shapes.filter(
                                                            (s) => s.diamond_type_id === typeId
                                                        );
                                                        const typeColors = facets.diamondOptions.colors.filter(
                                                            (c) => c.diamond_type_id === typeId
                                                        );
                                                        const typeClarities = facets.diamondOptions.clarities.filter(
                                                            (c) => c.diamond_type_id === typeId
                                                        );

                                                        return (
                                                            <div key={typeId} className="space-y-4">
                                                                {/* Shapes */}
                                                                {typeShapes.length > 0 && (
                                                                    <div>
                                                                        <p className="mb-2 text-xs font-semibold text-slate-500">
                                                                            {type.name} - Shapes
                                                                        </p>
                                                                        <div className="space-y-1.5">
                                                                            {typeShapes.map((option) => {
                                                                                const value = `shape:${option.id}`;
                                                                                const selected = filters.diamond.includes(value);
                                                                                return (
                                                                                    <label
                                                                                        key={`shape-${option.id}`}
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
                                                                )}

                                                                {/* Colors */}
                                                                {typeColors.length > 0 && (
                                                                    <div>
                                                                        <p className="mb-2 text-xs font-semibold text-slate-500">
                                                                            {type.name} - Colors
                                                                        </p>
                                                                        <div className="space-y-1.5">
                                                                            {typeColors.map((option) => {
                                                                                const value = `color:${option.id}`;
                                                                                const selected = filters.diamond.includes(value);
                                                                                return (
                                                                                    <label
                                                                                        key={`color-${option.id}`}
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
                                                                )}

                                                                {/* Clarities */}
                                                                {typeClarities.length > 0 && (
                                                                    <div>
                                                                        <p className="mb-2 text-xs font-semibold text-slate-500">
                                                                            {type.name} - Clarities
                                                                        </p>
                                                                        <div className="space-y-1.5">
                                                                            {typeClarities.map((option) => {
                                                                                const value = `clarity:${option.id}`;
                                                                                const selected = filters.diamond.includes(value);
                                                                                return (
                                                                                    <label
                                                                                        key={`clarity-${option.id}`}
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
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Price Range Filter */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setCollapsedFilters((prev) => ({ ...prev, price: !prev.price }))}
                                        className="flex w-full items-center justify-between text-xs font-semibold text-slate-800 sm:text-sm"
                                    >
                                        <span>Price range (₹)</span>
                                        <svg
                                            className={`h-3.5 w-3.5 text-slate-500 transition-transform sm:h-4 sm:w-4 ${collapsedFilters.price ? '' : 'rotate-180'}`}
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            strokeWidth={2.5}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>
                                    {!collapsedFilters.price && (
                                        <div className="mt-3">
                                            <PriceRangeFilter
                                                applyPriceRange={applyPriceRange}
                                                resetPriceRange={resetPriceRange}
                                                priceRange={priceRange}
                                                setPriceRange={setPriceRange}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Footer with Apply Button */}
                            <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
                                <button
                                    type="button"
                                    onClick={() => setMobileFilterOpen(false)}
                                    className="w-full rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy active:scale-[0.98]"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
    const [minInput, setMinInput] = useState<string>(priceRange.min.toString());
    const [maxInput, setMaxInput] = useState<string>(priceRange.max.toString());
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    // Predefined price ranges
    const pricePresets = [
        { label: '< ₹25,000', min: DEFAULT_PRICE_MIN, max: 25000 },
        { label: '₹25,000 - ₹50,000', min: 25000, max: 50000 },
        { label: '₹50,000 - ₹1,00,000', min: 50000, max: 100000 },
        { label: '₹1,00,000+', min: 100000, max: DEFAULT_PRICE_MAX },
    ];

    // Sync local state when priceRange changes externally (e.g., from URL params or reset)
    useEffect(() => {
        setMinInput(priceRange.min.toString());
        setMaxInput(priceRange.max.toString());
        
        // Check if current values match any preset
        const matchingPreset = pricePresets.findIndex(
            (preset) => priceRange.min === preset.min && priceRange.max === preset.max
        );
        setSelectedPreset(matchingPreset >= 0 ? matchingPreset.toString() : null);
    }, [priceRange.min, priceRange.max]);

    const handlePresetClick = (preset: typeof pricePresets[0], index: number) => {
        setPriceRange({ min: preset.min, max: preset.max });
        setMinInput(preset.min.toString());
        setMaxInput(preset.max.toString());
        setSelectedPreset(index.toString());
        // Apply filter immediately when preset is clicked
        applyPriceRange(preset.min, preset.max);
    };

    const handleMinInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setMinInput(value);
        setSelectedPreset(null); // Clear preset selection when manually typing
        
        // Allow empty input for better UX
        if (value === '') {
            return;
        }
        
        const numValue = Number(value);
        if (!Number.isNaN(numValue) && numValue >= 0) {
            setPriceRange((prev) => {
                const nextMin = clamp(numValue, DEFAULT_PRICE_MIN, prev.max - PRICE_STEP);
                return { ...prev, min: nextMin };
            });
        }
    };

    const handleMaxInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setMaxInput(value);
        setSelectedPreset(null); // Clear preset selection when manually typing
        
        // Allow empty input for better UX
        if (value === '') {
            return;
        }
        
        const numValue = Number(value);
        if (!Number.isNaN(numValue) && numValue >= 0) {
            setPriceRange((prev) => {
                const nextMax = clamp(numValue, prev.min + PRICE_STEP, DEFAULT_PRICE_MAX);
                return { ...prev, max: nextMax };
            });
        }
    };

    const handleMinBlur = () => {
        const numValue = Number(minInput);
        if (minInput === '' || Number.isNaN(numValue) || numValue < DEFAULT_PRICE_MIN) {
            // Reset to current priceRange.min if invalid
            setMinInput(priceRange.min.toString());
        } else {
            // Validate and clamp
            setPriceRange((prev) => {
                const nextMin = clamp(numValue, DEFAULT_PRICE_MIN, prev.max - PRICE_STEP);
                setMinInput(nextMin.toString());
                // Apply filter with updated values
                applyPriceRange(nextMin, prev.max);
                return { ...prev, min: nextMin };
            });
        }
    };

    const handleMaxBlur = () => {
        const numValue = Number(maxInput);
        if (maxInput === '' || Number.isNaN(numValue) || numValue < DEFAULT_PRICE_MIN) {
            // Reset to current priceRange.max if invalid
            setMaxInput(priceRange.max.toString());
        } else {
            // Validate and clamp
            setPriceRange((prev) => {
                const nextMax = clamp(numValue, prev.min + PRICE_STEP, DEFAULT_PRICE_MAX);
                setMaxInput(nextMax.toString());
                // Apply filter with updated values
                applyPriceRange(prev.min, nextMax);
                return { ...prev, max: nextMax };
            });
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.currentTarget.blur(); // Trigger blur which will apply the filter
        }
    };

    const handleApply = () => {
        applyPriceRange(priceRange.min, priceRange.max);
    };

    const handleReset = () => {
        resetPriceRange();
    };

    return (
        <div className="mt-3 space-y-3 sm:space-y-4">
            {/* Predefined Price Range Buttons */}
            <div className="flex flex-wrap gap-2">
                {pricePresets.map((preset, index) => {
                    const isSelected = selectedPreset === index.toString() || 
                        (priceRange.min === preset.min && priceRange.max === preset.max && selectedPreset === null);
                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handlePresetClick(preset, index)}
                            className={`rounded-full px-3 py-1.5 text-[10px] font-medium transition sm:px-4 sm:py-2 sm:text-xs ${
                                isSelected
                                    ? 'bg-elvee-blue text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {preset.label}
                        </button>
                    );
                })}
            </div>

            {/* Instruction Text */}
            <p className="text-[10px] text-slate-500 sm:text-xs">
                For custom price range, use the input fields below
            </p>

            {/* Manual Price Range Input Fields */}
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-1">
                    <label className="text-[10px] font-medium text-slate-500 sm:text-xs" htmlFor="price-min">
                        Min
                    </label>
                    <input
                        id="price-min"
                        type="number"
                        value={minInput}
                        onChange={handleMinInputChange}
                        onBlur={handleMinBlur}
                        onKeyDown={handleKeyDown}
                        min={DEFAULT_PRICE_MIN}
                        max={priceRange.max}
                        step={PRICE_STEP}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] text-slate-700 placeholder:text-slate-400 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 sm:px-3 sm:py-2 sm:text-xs"
                        placeholder="₹ Min"
                    />
                </div>
                <span className="mt-6 text-xs font-medium text-slate-500 sm:mt-7 sm:text-sm">TO</span>
                <div className="flex-1">
                    <label className="text-[10px] font-medium text-slate-500 sm:text-xs" htmlFor="price-max">
                        Max
                    </label>
                    <input
                        id="price-max"
                        type="number"
                        value={maxInput}
                        onChange={handleMaxInputChange}
                        onBlur={handleMaxBlur}
                        onKeyDown={handleKeyDown}
                        min={priceRange.min}
                        max={DEFAULT_PRICE_MAX}
                        step={PRICE_STEP}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] text-slate-700 placeholder:text-slate-400 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 sm:px-3 sm:py-2 sm:text-xs"
                        placeholder="₹ Max"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 rounded-lg bg-elvee-blue px-3 py-1.5 text-xs font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy sm:px-4 sm:py-2 sm:text-sm"
                >
                    Apply
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:px-4 sm:py-2 sm:text-sm"
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
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs transition sm:h-10 sm:w-10 sm:text-sm ${isWishlisted ? 'border-rose-200 bg-rose-500/10 text-rose-500' : 'border-white/70 bg-white/70 text-slate-600 hover:text-rose-500'} ${wishlistDisabled ? 'opacity-60' : ''}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 5.053 7.5 10.5 9 10.5s9-5.447 9-10.5z" />
            </svg>
        </button>
    );

    if (viewMode === 'list') {
        return (
            <article className="group relative flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:gap-4 sm:gap-6 sm:rounded-3xl sm:p-4">
                <Link href={productLink} className="block w-24 flex-shrink-0 overflow-hidden rounded-xl sm:w-32 sm:rounded-2xl lg:w-48">
                    <div className="relative h-24 w-full overflow-hidden rounded-xl bg-slate-100 sm:h-32 sm:rounded-2xl lg:h-48">
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
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 sm:text-sm">No image</div>
                        )}
                    </div>
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="min-w-0 flex-1 space-y-1 sm:space-y-2">
                            <Link href={productLink} className="text-sm font-semibold text-slate-900 transition hover:text-feather-gold sm:text-base lg:text-lg">{product.name}</Link>
                            <p className="text-[10px] text-slate-500 sm:text-xs">SKU {product.sku}</p>
                            <p className="text-xs text-slate-600 sm:text-sm">{product.brand ?? 'Elvee Atelier'}</p>
                            <p className="text-xs font-semibold text-slate-900 sm:text-sm">{formatCurrency(product.price_total)}</p>
                            <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-500 sm:gap-2 sm:text-xs"><span>{product.material ?? 'Custom material'}</span></div>
                        </div>
                        <div className="flex-shrink-0">{WishlistButton}</div>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl sm:rounded-3xl">
            <div className="absolute right-3 top-3 z-20 sm:right-5 sm:top-5">{WishlistButton}</div>
            <Link href={productLink} className="block">
                <div className="relative h-40 w-full overflow-hidden rounded-t-2xl bg-slate-100 sm:h-48 lg:h-56 sm:rounded-t-3xl">
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
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-500 sm:text-sm">No image</div>
                    )}
                </div>
            </Link>
            <div className="space-y-2 p-3 sm:space-y-3 sm:p-6">
                <Link href={productLink} className="text-sm font-semibold text-slate-900 transition hover:text-feather-gold sm:text-base lg:text-lg">{product.name}</Link>
                <p className="text-[10px] text-slate-500 sm:text-xs">SKU {product.sku}</p>
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 sm:rounded-2xl sm:p-4 sm:text-sm">
                    <span className="font-semibold">{formatCurrency(product.price_total)}</span>
                    <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 sm:mt-3 sm:gap-2 sm:text-xs">
                        <div><span className="font-medium text-slate-600">Material</span><p>{product.material ?? 'Custom blend'}</p></div>
                    </div>
                </div>
            </div>
        </article>
    );
}
