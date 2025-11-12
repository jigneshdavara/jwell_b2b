import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

const FILTER_LABELS: Record<string, string> = {
    brand: 'Brand',
    gold_purity: 'Gold purity',
    silver_purity: 'Silver purity',
    search: 'Search',
    category: 'Category',
    catalog: 'Catalog',
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
    };
};

type CatalogFilters = {
    brand: string[];
    gold_purity: string[];
    silver_purity: string[];
    search?: string;
    category?: string;
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
    const navigationData = page.props.navigation ?? { categories: [], catalogs: [], brands: [] };
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
            category: normalizeSingle(rawFilters.category),
            catalog: normalizeSingle(rawFilters.catalog),
        };
    }, [rawFilters]);
    const [search, setSearch] = useState(filters.search ?? '');

    const highlightCategories = useMemo(
        () => (navigationData.categories ?? []).slice(0, 4),
        [navigationData.categories],
    );
    const highlightCatalogs = useMemo(
        () => (navigationData.catalogs ?? []).slice(0, 4),
        [navigationData.catalogs],
    );

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

        if (filters.category) {
            entries.push({
                key: 'category',
                value: filters.category,
                label: FILTER_LABELS.category,
                valueLabel: valueNameMap.get(`category:${filters.category}`) ?? filters.category,
            });
        }

        if (filters.catalog) {
            entries.push({
                key: 'catalog',
                value: filters.catalog,
                label: FILTER_LABELS.catalog,
                valueLabel: valueNameMap.get(`catalog:${filters.catalog}`) ?? filters.catalog,
            });
        }

        return entries;
    }, [filters, valueNameMap]);

    return (
        <AuthenticatedLayout>
            <Head title="Catalogue" />

            <div className="space-y-10" id="catalog">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white shadow-2xl">
                    <div className="absolute inset-0">
                        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-500/30 blur-3xl" />
                        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
                    </div>
                    <div className="relative z-10 grid gap-10 px-6 py-10 lg:grid-cols-[1.4fr_1fr] lg:px-12 lg:py-14">
                        <div className="space-y-6">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
                                Curated for {mode === 'jobwork' ? 'Jobwork' : 'Retailers'}
                            </span>
                            <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                                Discover the latest Elvee signatures crafted for wholesale partners.
                            </h1>
                            <p className="text-sm text-white/70 lg:text-base">
                                Browse by category, explore curated catalogues, and shortlist favourites to your wishlist or quotation cart in one click.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href={route('frontend.catalog.index', { mode })}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/20 transition hover:bg-white/90"
                                >
                                    Explore full catalogue
                                </Link>
                                <Link
                                    href={route('frontend.wishlist.index')}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                                >
                                    View wishlist
                                </Link>
                            </div>
                            {(highlightCategories.length > 0 || highlightCatalogs.length > 0) && (
                                <div className="mt-6 space-y-4">
                                    {highlightCategories.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                                            <span className="font-semibold uppercase tracking-[0.35em] text-white/60">Trending categories</span>
                                            {highlightCategories.map((category) => {
                                                const value = category.slug ?? category.id;

                                                return (
                                                    <Link
                                                        key={`hero-category-${category.id}`}
                                                        href={route('frontend.catalog.index', {
                                                            mode,
                                                            category: value,
                                                        })}
                                                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-semibold text-white transition hover:bg-white/20"
                                                    >
                                                        {category.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {highlightCatalogs.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                                            <span className="font-semibold uppercase tracking-[0.35em] text-white/60">Featured catalogues</span>
                                            {highlightCatalogs.map((catalog) => {
                                                const value = catalog.slug ?? catalog.id;

                                                return (
                                                    <Link
                                                        key={`hero-catalog-${catalog.id}`}
                                                        href={route('frontend.catalog.index', {
                                                            mode,
                                                            catalog: value,
                                                        })}
                                                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-semibold text-white transition hover:bg-white/20"
                                                    >
                                                        {catalog.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="relative hidden overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur lg:block">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-sky-500/10" />
                            <div className="relative flex h-full flex-col justify-between p-8">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">
                                        Quick Access
                                    </p>
                                    <p className="mt-4 text-2xl font-semibold leading-snug text-white">
                                        Build wishlists, sync rates, and generate quotations in a single workspace.
                                    </p>
                                </div>
                                <div className="space-y-3 text-sm text-white/70">
                                    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                        <p className="font-semibold text-white">Wishlist sync</p>
                                        <p className="mt-1 text-white/70">
                                            Save designs and move them to quotation list instantly when customers confirm.
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-4">
                                        <p className="font-semibold text-white">Live metal rates</p>
                                        <p className="mt-1 text-white/70">
                                            Your catalogue prices reflect the latest mint rates configured in admin.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

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
                                if (key === 'brand' || key === 'gold_purity' || key === 'silver_purity') {
                                    const existing = Array.isArray(filters[key]) ? (filters[key] as string[]) : [];
                                    const updated = existing.filter((entry) => entry !== value);
                                    applyFilter(key as keyof CatalogProps['filters'], updated.length ? updated : undefined);

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
                            <div className="mt-3 flex flex-wrap gap-2">
                                {facets.categories.map((category) => {
                                    const value = category.slug ?? String(category.id);
                                    const selected = filters.category === value;

                                    return (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() =>
                                                applyFilter(
                                                    'category',
                                                    selected ? undefined : value,
                                                )
                                            }
                                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                                                selected
                                                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600'
                                            }`}
                                        >
                                            {category.name}
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

