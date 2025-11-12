import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from 'react';

const FILTER_LABELS: Record<string, string> = {
    brand: 'Brand',
    gold_purity: 'Gold purity',
    silver_purity: 'Silver purity',
    search: 'Search',
    category: 'Category',
    catalog: 'Catalog',
    diamond: 'Diamond',
    price_min: 'Min price',
    price_max: 'Max price',
};

type Product = {
    id: number;
    name: string;
    sku: string;
    brand?: string | null;
    category?: string | null;
    material?: string | null;
    purity?: string | null;
    gross_weight: number;
    net_weight: number;
    base_price: number;
    making_charge: number;
    is_jobwork_allowed: boolean;
    uses_gold: boolean;
    uses_silver: boolean;
    uses_diamond: boolean;
    thumbnail?: string | null;
    media?: Array<{ url: string; alt: string }>;
    catalogs?: Array<{ id: number; name: string; slug?: string | null }>;
    variants: Array<{
        id: number;
        label: string;
        price_adjustment: number;
        is_default: boolean;
        metadata?: Record<string, unknown>;
    }>;
};

type CatalogFiltersInput = {
    brand?: string | string[] | null;
    gold_purity?: string | string[] | null;
    silver_purity?: string | string[] | null;
    diamond?: string | string[] | null;
    price_min?: string | null;
    price_max?: string | null;
    search?: string | null;
    category?: string | null;
    catalog?: string | null;
};

type CatalogProps = {
    mode: 'purchase' | 'jobwork';
    filters: CatalogFiltersInput;
    products: {
        data: Product[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    facets: {
        brands: string[];
        categories: Array<{ id: number; name: string; slug?: string | null }>;
        catalogs: Array<{ id: number; name: string; slug?: string | null }>;
        goldPurities: Array<{ id: number; name: string }>;
        silverPurities: Array<{ id: number; name: string }>;
        diamondOptions: {
            types: Array<{ id: number; name: string }>;
            shapes: Array<{ id: number; name: string }>;
            colors: Array<{ id: number; name: string }>;
            clarities: Array<{ id: number; name: string }>;
            cuts: Array<{ id: number; name: string }>;
        };
    };
};

type PriceRange = {
    min: number;
    max: number;
};

const DEFAULT_PRICE_MIN = 0;
const DEFAULT_PRICE_MAX = 500000;
const PRICE_STEP = 1000;

type CatalogFilters = {
    brand: string[];
    gold_purity: string[];
    silver_purity: string[];
    diamond: string[];
    price_min?: string;
    price_max?: string;
    search?: string;
    category: string[];
    catalog?: string;
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

export default function CatalogIndex() {
    const page = usePage<
        PageProps<CatalogProps> & {
            navigation?: {
                categories?: Array<{ id: number; name: string; slug?: string | null }>;
                catalogs?: Array<{ id: number; name: string; slug?: string | null }>;
                brands?: Array<{ id: number; name: string; slug?: string | null }>;
            };
            wishlist?: { product_ids?: number[] };
        }
    >();
    const { mode, filters: rawFilters, products, facets } = page.props;
    const wishlistProductIds = page.props.wishlist?.product_ids ?? [];
    const wishlistLookup = useMemo(() => new Set(wishlistProductIds), [wishlistProductIds]);
    const [wishlistBusyId, setWishlistBusyId] = useState<number | null>(null);

    const filters = useMemo<CatalogFilters>(() => {
        const normalizeArray = (input?: string | string[] | null): string[] => {
            if (!input) {
                return [];
            }

            return Array.isArray(input) ? input.map(String) : [String(input)];
        };

        const normalizeSingle = (input?: string | null): string | undefined => {
            if (typeof input !== 'string') {
                return undefined;
            }

            const trimmed = input.trim();
            return trimmed === '' ? undefined : trimmed;
        };

        return {
            brand: normalizeArray(rawFilters.brand),
            search: normalizeSingle(rawFilters.search),
            gold_purity: normalizeArray(rawFilters.gold_purity),
            silver_purity: normalizeArray(rawFilters.silver_purity),
            diamond: normalizeArray(rawFilters.diamond),
            price_min: normalizeSingle(rawFilters.price_min),
            price_max: normalizeSingle(rawFilters.price_max),
            category: normalizeArray(rawFilters.category),
            catalog: normalizeSingle(rawFilters.catalog),
        };
    }, [rawFilters]);
    const [search, setSearch] = useState(filters.search ?? '');
    const [priceRange, setPriceRange] = useState<PriceRange>(() => ({
        min: filters.price_min ? Number(filters.price_min) : DEFAULT_PRICE_MIN,
        max: filters.price_max ? Number(filters.price_max) : DEFAULT_PRICE_MAX,
    }));

    useEffect(() => {
        setPriceRange({
            min: filters.price_min ? Number(filters.price_min) : DEFAULT_PRICE_MIN,
            max: filters.price_max ? Number(filters.price_max) : DEFAULT_PRICE_MAX,
        });
    }, [filters.price_min, filters.price_max]);

    const applyPriceRange = (min: number, max: number) => {
        router.get(
            route('frontend.catalog.index'),
            {
                ...rawFilters,
                price_min: min > DEFAULT_PRICE_MIN ? String(min) : undefined,
                price_max: max < DEFAULT_PRICE_MAX ? String(max) : undefined,
                mode,
                page: undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const resetPriceRange = () => {
        setPriceRange({ min: DEFAULT_PRICE_MIN, max: DEFAULT_PRICE_MAX });
        router.get(
            route('frontend.catalog.index'),
            {
                ...rawFilters,
                price_min: undefined,
                price_max: undefined,
                mode,
                page: undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const changeMode = (nextMode: 'purchase' | 'jobwork') => {
        if (nextMode === mode) return;
        router.get(
            route('frontend.catalog.index'),
            {
                ...rawFilters,
                mode: nextMode,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const valueNameMap = useMemo(() => {
        const map = new Map<string, string>();
        facets.goldPurities.forEach((purity) => map.set(`gold_purity:${purity.id}`, purity.name));
        facets.silverPurities.forEach((purity) => map.set(`silver_purity:${purity.id}`, purity.name));
        facets.diamondOptions.types.forEach((option) => map.set(`diamond:type:${option.id}`, option.name));
        facets.diamondOptions.shapes.forEach((option) => map.set(`diamond:shape:${option.id}`, option.name));
        facets.diamondOptions.colors.forEach((option) => map.set(`diamond:color:${option.id}`, option.name));
        facets.diamondOptions.clarities.forEach((option) => map.set(`diamond:clarity:${option.id}`, option.name));
        facets.diamondOptions.cuts.forEach((option) => map.set(`diamond:cut:${option.id}`, option.name));
        facets.brands.forEach((brand) => map.set(`brand:${brand}`, brand));
        facets.categories.forEach((category) => {
            map.set(`category:${category.slug ?? category.id}`, category.name);
        });
        facets.catalogs.forEach((catalog) => {
            map.set(`catalog:${catalog.slug ?? catalog.id}`, catalog.name);
        });
        (navigationData.categories ?? []).forEach((category: any) => {
            map.set(`category:${category.slug ?? category.id}`, category.name);
        });
        (navigationData.catalogs ?? []).forEach((catalog: any) => {
            map.set(`catalog:${catalog.slug ?? catalog.id}`, catalog.name);
        });
        return map;
    }, [facets, navigationData]);

    const applyFilter = (key: keyof CatalogProps['filters'], value?: string | string[]) => {
        router.get(
            route('frontend.catalog.index'),
            {
                ...rawFilters,
                [key]: value ?? undefined,
                mode,
                page: undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const resetFilters = () => {
        router.get(route('frontend.catalog.index'), { mode });
    };

    const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilter('search', search.trim() || undefined);
    };

    const toggleWishlist = (productId: number, variantId?: number | null) => {
        if (wishlistBusyId === productId) {
            return;
        }

        setWishlistBusyId(productId);

        if (wishlistLookup.has(productId)) {
            router.delete(
                route('frontend.wishlist.items.destroy-by-product', productId),
                {
                    product_variant_id: variantId ?? undefined,
                },
                {
                    preserveScroll: true,
                    onFinish: () => setWishlistBusyId(null),
                },
            );
        } else {
            router.post(
                route('frontend.wishlist.items.store'),
                {
                    product_id: productId,
                    product_variant_id: variantId ?? undefined,
                },
                {
                    preserveScroll: true,
                    onFinish: () => setWishlistBusyId(null),
                },
            );
        }
    };

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

        filters.gold_purity.forEach((value) => {
            entries.push({
                key: 'gold_purity',
                value,
                label: FILTER_LABELS.gold_purity,
                valueLabel: valueNameMap.get(`gold_purity:${value}`) ?? value,
            });
        });

        filters.silver_purity.forEach((value) => {
            entries.push({
                key: 'silver_purity',
                value,
                label: FILTER_LABELS.silver_purity,
                valueLabel: valueNameMap.get(`silver_purity:${value}`) ?? value,
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

        if (filters.catalog) {
            entries.push({
                key: 'catalog',
                value: filters.catalog,
                label: FILTER_LABELS.catalog,
                valueLabel: valueNameMap.get(`catalog:${filters.catalog}`) ?? filters.catalog,
            });
        }

        filters.diamond.forEach((value) => {
            entries.push({
                key: 'diamond',
                value,
                label: 'Diamond',
                valueLabel:
                    valueNameMap.get(`diamond:type:${value}`) ??
                    valueNameMap.get(`diamond:shape:${value}`) ??
                    valueNameMap.get(`diamond:color:${value}`) ??
                    valueNameMap.get(`diamond:clarity:${value}`) ??
                    valueNameMap.get(`diamond:cut:${value}`) ??
                    value,
            });
        });

        if (filters.price_min) {
            entries.push({
                key: 'price_min',
                value: filters.price_min,
                label: FILTER_LABELS.price_min,
                valueLabel: currencyFormatter.format(Number(filters.price_min)),
            });
        }

        if (filters.price_max) {
            entries.push({
                key: 'price_max',
                value: filters.price_max,
                label: FILTER_LABELS.price_max,
                valueLabel: currencyFormatter.format(Number(filters.price_max)),
            });
        }

        return entries;
    }, [filters, valueNameMap]);

    return (
        <AuthenticatedLayout>
            <Head title="Catalogue" />

            <div className="space-y-10" id="catalog">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">
                            {mode === 'jobwork' ? 'Jobwork-ready Designs' : 'Showcase Collection'}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            {mode === 'jobwork'
                                ? 'Explore pieces eligible for custom manufacturing. Select a design to raise a jobwork quotation.'
                                : 'Filter by brand, material, or purity. Review variants and request a quotation for wholesale purchase.'}
                        </p>
                    </div>
                    <div>
                        <form onSubmit={onSearchSubmit} className="flex gap-3">
                            <div className="relative flex-1 min-w-[220px]">
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search SKU or design"
                                    className="w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                                {filters.search && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            applyFilter('search');
                                        }}
                                        className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-slate-400 hover:text-slate-600"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <button type="submit" className="rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sky-600/30 transition hover:bg-sky-500">
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800"
                            >
                                Reset
                            </button>
                        </form>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs">
                    {activeFilters.map(({ key, label, valueLabel, value }) => (
                        <button
                            key={`${key}-${valueLabel}`}
                            onClick={() => {
                                if (
                                    key === 'brand' ||
                                    key === 'gold_purity' ||
                                    key === 'silver_purity' ||
                                    key === 'category' ||
                                    key === 'diamond'
                                ) {
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
                            className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300"
                        >
                            {label}: <span className="font-semibold">{valueLabel}</span>
                            <span aria-hidden>×</span>
                        </button>
                    ))}
                </div>

                <div className="grid gap-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 lg:grid-cols-5">
                    <aside className="space-y-6 lg:col-span-1">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Categories</h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {facets.categories.map((category) => {
                                    const value = category.slug ?? String(category.id);
                                    const selected = filters.category.includes(value);

                                    return (
                                        <label
                                            key={category.id}
                                            className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                                                selected
                                                    ? 'border-sky-500 bg-sky-50 text-slate-900'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                checked={selected}
                                                onChange={(event) => {
                                                    const list = [...filters.category];

                                                    if (event.target.checked) {
                                                        if (!list.includes(value)) {
                                                            list.push(value);
                                                        }
                                                    } else {
                                                        const index = list.indexOf(value);
                                                        if (index >= 0) {
                                                            list.splice(index, 1);
                                                        }
                                                    }

                                                    applyFilter('category', list.length ? list : undefined);
                                                }}
                                            />
                                            <span>{category.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Catalogs</h2>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {facets.catalogs.map((catalog) => {
                                    const value = catalog.slug ?? String(catalog.id);
                                    const selected = filters.catalog === value;

                                    return (
                                        <button
                                            key={catalog.id}
                                            type="button"
                                            onClick={() =>
                                                applyFilter(
                                                    'catalog',
                                                    selected ? undefined : value,
                                                )
                                            }
                                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                                                selected
                                                    ? 'bg-slate-900 text-white shadow-sm shadow-slate-800/30'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                            }`}
                                        >
                                            {catalog.name}
                                            {selected && (
                                                <span className="text-[10px] uppercase tracking-[0.3em]">
                                                    ×
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Brands</h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {facets.brands.map((brand) => {
                                    const selected = filters.brand.includes(brand);

                                    return (
                                        <label
                                            key={brand}
                                            className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                                                selected
                                                    ? 'border-sky-500 bg-sky-50 text-slate-900'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                checked={selected}
                                                onChange={(event) => {
                                                    const list = [...filters.brand];

                                                    if (event.target.checked) {
                                                        if (!list.includes(brand)) {
                                                            list.push(brand);
                                                        }
                                                    } else {
                                                        const index = list.indexOf(brand);
                                                        if (index >= 0) {
                                                            list.splice(index, 1);
                                                        }
                                                    }

                                                    applyFilter('brand', list.length ? list : undefined);
                                                }}
                                            />
                                            <span>{brand}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Gold purities</h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {facets.goldPurities.map((purity) => {
                                    const selected = filters.gold_purity.includes(String(purity.id));

                                    return (
                                        <label
                                            key={purity.id}
                                            className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                                                selected
                                                    ? 'border-sky-500 bg-sky-50 text-slate-900'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                checked={selected}
                                                onChange={(event) => {
                                                    const list = [...filters.gold_purity];

                                                    if (event.target.checked) {
                                                        list.push(String(purity.id));
                                                    } else {
                                                        const index = list.indexOf(String(purity.id));
                                                        if (index >= 0) {
                                                            list.splice(index, 1);
                                                        }
                                                    }

                                                    applyFilter('gold_purity', list.length ? list : undefined);
                                                }}
                                            />
                                            <span>{purity.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Silver purities</h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {facets.silverPurities.map((purity) => {
                                    const selected = filters.silver_purity.includes(String(purity.id));

                                    return (
                                        <label
                                            key={purity.id}
                                            className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                                                selected
                                                    ? 'border-sky-500 bg-sky-50 text-slate-900'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                checked={selected}
                                                onChange={(event) => {
                                                    const list = [...filters.silver_purity];

                                                    if (event.target.checked) {
                                                        list.push(String(purity.id));
                                                    } else {
                                                        const index = list.indexOf(String(purity.id));
                                                        if (index >= 0) {
                                                            list.splice(index, 1);
                                                        }
                                                    }

                                                    applyFilter('silver_purity', list.length ? list : undefined);
                                                }}
                                            />
                                            <span>{purity.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Diamond</h2>
                            <div className="mt-3 space-y-4 text-sm">
                                {[
                                    { title: 'Types', kind: 'type', options: facets.diamondOptions.types },
                                    { title: 'Shapes', kind: 'shape', options: facets.diamondOptions.shapes },
                                    { title: 'Colors', kind: 'color', options: facets.diamondOptions.colors },
                                    { title: 'Clarities', kind: 'clarity', options: facets.diamondOptions.clarities },
                                    { title: 'Cuts', kind: 'cut', options: facets.diamondOptions.cuts },
                                ].map(({ title, kind, options }) => (
                                    <div key={kind}>
                                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</p>
                                        <div className="mt-2 space-y-2">
                                            {options.map((option) => {
                                                const value = `${kind}:${option.id}`;
                                                const selected = filters.diamond.includes(value);

                                                return (
                                                    <label
                                                        key={value}
                                                        className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition ${
                                                            selected
                                                                ? 'border-sky-500 bg-sky-50 text-slate-900'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                                            checked={selected}
                                                            onChange={(event) => {
                                                                const list = [...filters.diamond];

                                                                if (event.target.checked) {
                                                                    if (!list.includes(value)) {
                                                                        list.push(value);
                                                                    }
                                                                } else {
                                                                    const index = list.indexOf(value);
                                                                    if (index >= 0) {
                                                                        list.splice(index, 1);
                                                                    }
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
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Price range (₹)</h2>
                            <PriceRangeFilter
                                applyPriceRange={applyPriceRange}
                                resetPriceRange={resetPriceRange}
                                priceRange={priceRange}
                                setPriceRange={setPriceRange}
                            />
                        </div>
                    </aside>

                    <section className="lg:col-span-4">
                        {products.data.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                                No products match your filters. Try broadening your search or reset filters.
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {products.data.map((product) => {
                                    const productLink = route('frontend.catalog.show', { product: product.id, mode });
                                    const imageUrl = product.thumbnail ?? product.media?.[0]?.url ?? null;
                                    const defaultVariant =
                                        product.variants.find((variant) => variant.is_default) ?? product.variants[0] ?? null;
                                    const isWishlisted = wishlistLookup.has(product.id);

                                    return (
                                        <article
                                            key={product.id}
                                            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                                        >
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    event.stopPropagation();
                                                    toggleWishlist(product.id, defaultVariant?.id ?? null);
                                                }}
                                                disabled={wishlistBusyId === product.id}
                                                aria-pressed={isWishlisted}
                                                className={`absolute right-5 top-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm transition ${
                                                    isWishlisted
                                                        ? 'border-rose-200 bg-rose-500/10 text-rose-500'
                                                        : 'border-white/70 bg-white/70 text-slate-600 hover:border-rose-200 hover:text-rose-500'
                                                } ${wishlistBusyId === product.id ? 'opacity-60' : ''}`}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill={isWishlisted ? 'currentColor' : 'none'}
                                                    stroke="currentColor"
                                                    strokeWidth={1.5}
                                                    className="h-5 w-5"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 5.053 7.5 10.5 9 10.5s9-5.447 9-10.5z"
                                                    />
                                                </svg>
                                            </button>
                                            <Link href={productLink} className="block">
                                                <div className="relative h-56 w-full overflow-hidden rounded-t-3xl">
                                                    {imageUrl ? (
                                                        <>
                                                            <img
                                                                src={imageUrl}
                                                                alt={product.name}
                                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                                                            <div className="absolute bottom-4 left-4 flex flex-col text-white">
                                                                <span className="text-xs uppercase tracking-[0.35em] text-white/80">
                                                                    {product.category ?? 'Signature'}
                                                                </span>
                                                                <span className="text-sm font-semibold">
                                                                    {product.brand ?? 'Elvee Atelier'}
                                                                </span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
                                                            <span className="text-xs uppercase tracking-[0.35em] text-white/70">
                                                                {product.category ?? 'Signature'}
                                                            </span>
                                                            <span className="mt-2 text-lg font-semibold">{product.brand ?? 'Elvee Atelier'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="space-y-3 p-6">
                                                <Link
                                                    href={productLink}
                                                    className="text-lg font-semibold text-slate-900 transition hover:text-sky-600"
                                                >
                                                    {product.name}
                                                </Link>
                                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                                    SKU {product.sku}
                                                </p>
                                                {product.catalogs && product.catalogs.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {product.catalogs.slice(0, 2).map((catalog) => (
                                                            <span
                                                                key={catalog.id}
                                                                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500"
                                                            >
                                                                {catalog.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-2">
                                                    {product.variants.slice(0, 3).map((variant) => (
                                                        <span
                                                            key={variant.id}
                                                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                                                                variant.is_default
                                                                    ? 'bg-slate-900 text-white'
                                                                    : 'bg-slate-100 text-slate-600'
                                                            }`}
                                                        >
                                                            {(variant.metadata?.auto_label as string | undefined) ?? variant.label}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="rounded-2xl bg-slate-50 p-4">
                                                    <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                                                        <div>
                                                            <dt className="font-medium text-slate-600">Material</dt>
                                                            <dd>{product.material ?? 'Custom blend'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="font-medium text-slate-600">Gross</dt>
                                                            <dd>{product.gross_weight.toFixed(2)} g</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="font-medium text-slate-600">Net</dt>
                                                            <dd>{product.net_weight.toFixed(2)} g</dd>
                                                        </div>
                                                    </dl>
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wide text-slate-400">
                                                            Base Price
                                                        </p>
                                                        <p className="text-lg font-semibold text-slate-900">
                                                            {currencyFormatter.format(product.base_price)}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Making {currencyFormatter.format(product.making_charge)}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Link
                                                            href={productLink}
                                                            className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sky-600/30 transition hover:bg-sky-500"
                                                        >
                                                            View details
                                                        </Link>
                                                        {mode === 'jobwork' && product.is_jobwork_allowed && (
                                                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-center text-[11px] font-semibold text-emerald-700">
                                                                Available for jobwork
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm">
                            {products.links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                    className={`rounded-full px-4 py-2 transition ${
                                        link.active
                                            ? 'bg-sky-600 text-white shadow-lg'
                                            : link.url
                                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                            : 'bg-slate-100 text-slate-400'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

type PriceRangeFilterProps = {
    priceRange: PriceRange;
    setPriceRange: Dispatch<SetStateAction<PriceRange>>;
    applyPriceRange: (min: number, max: number) => void;
    resetPriceRange: () => void;
};

function PriceRangeFilter({
    priceRange,
    setPriceRange,
    applyPriceRange,
    resetPriceRange,
}: PriceRangeFilterProps) {
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

    const handleMinRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (Number.isNaN(value)) return;
        setPriceRange((prev) => {
            const nextMin = clamp(value, DEFAULT_PRICE_MIN, prev.max);
            return { ...prev, min: nextMin };
        });
    };

    const handleMaxRangeChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        if (Number.isNaN(value)) return;
        setPriceRange((prev) => {
            const nextMax = clamp(value, prev.min, DEFAULT_PRICE_MAX);
            return { ...prev, max: nextMax };
        });
    };

    const handleMinInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value === '' ? DEFAULT_PRICE_MIN : Number(event.target.value);
        if (Number.isNaN(value)) return;
        setPriceRange((prev) => {
            const nextMin = clamp(value, DEFAULT_PRICE_MIN, prev.max);
            return { ...prev, min: nextMin };
        });
    };

    const handleMaxInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value === '' ? DEFAULT_PRICE_MAX : Number(event.target.value);
        if (Number.isNaN(value)) return;
        setPriceRange((prev) => {
            const nextMax = clamp(value, prev.min, DEFAULT_PRICE_MAX);
            return { ...prev, max: nextMax };
        });
    };

    const apply = () => applyPriceRange(priceRange.min, priceRange.max);
    const reset = () => resetPriceRange();

    return (
        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
                <span>{currencyFormatter.format(priceRange.min)}</span>
                <span>{currencyFormatter.format(priceRange.max)}</span>
            </div>
            <div className="space-y-2">
                <input
                    type="range"
                    min={DEFAULT_PRICE_MIN}
                    max={DEFAULT_PRICE_MAX}
                    step={PRICE_STEP}
                    value={priceRange.min}
                    onChange={handleMinRangeChange}
                    className="w-full accent-sky-500"
                />
                <input
                    type="range"
                    min={DEFAULT_PRICE_MIN}
                    max={DEFAULT_PRICE_MAX}
                    step={PRICE_STEP}
                    value={priceRange.max}
                    onChange={handleMaxRangeChange}
                    className="w-full accent-sky-500"
                />
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <label className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400" htmlFor="price-min">
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
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                </div>
                <div className="flex-1">
                    <label className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400" htmlFor="price-max">
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
                        className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={apply}
                    className="flex-1 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sky-600/30 transition hover:bg-sky-500"
                >
                    Apply
                </button>
                <button
                    type="button"
                    onClick={reset}
                    className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}

