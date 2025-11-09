import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

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
    thumbnail?: string | null;
    media?: Array<{ url: string; alt: string }>;
    variants: Array<{
        id: number;
        label: string;
        metal_tone?: string | null;
        stone_quality?: string | null;
        size?: string | null;
        price_adjustment: number;
        is_default: boolean;
    }>;
};

type CatalogProps = {
    filters: {
        brand?: string;
        material?: string;
        purity?: string;
        search?: string;
    };
    products: {
        data: Product[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    facets: {
        brands: string[];
        materials: string[];
        purities: string[];
        categories: string[];
    };
};

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

export default function CatalogIndex() {
    const { filters, products, facets } = usePage<PageProps<CatalogProps>>().props;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilter = (key: keyof CatalogProps['filters'], value?: string) => {
        router.get(
            route('frontend.catalog.index'),
            {
                ...filters,
                [key]: value ?? undefined,
                page: undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const resetFilters = () => {
        router.get(route('frontend.catalog.index'));
    };

    const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        applyFilter('search', search.trim() || undefined);
    };

    const addToCart = (productId: number, variantId?: number) => {
        router.post(
            route('frontend.cart.items.store'),
            { product_id: productId, product_variant_id: variantId, quantity: 1 },
            { preserveScroll: true },
        );
    };

    const activeFilters = useMemo(
        () =>
            Object.entries(filters)
                .filter(([, value]) => value)
                .map(([key, value]) => ({ key, value })),
        [filters],
    );

    return (
        <AuthenticatedLayout>
            <Head title="Catalogue" />

            <div className="space-y-10" id="catalog">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Showcase Collection</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Filter by brand, material, or purity. Prices reflect live bullion rates locked at
                            checkout.
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
                    {activeFilters.map(({ key, value }) => (
                        <button
                            key={key}
                            onClick={() => applyFilter(key as keyof CatalogProps['filters'])}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-slate-700 hover:bg-slate-300"
                        >
                            {key.replace(/_/g, ' ')}: <span className="font-semibold">{value}</span>
                            <span aria-hidden>×</span>
                        </button>
                    ))}
                </div>

                <div className="grid gap-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/70 lg:grid-cols-5">
                    <aside className="space-y-6 lg:col-span-1">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Brands</h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {facets.brands.map((brand) => (
                                    <button
                                        key={brand}
                                        onClick={() => applyFilter('brand', brand)}
                                        className={`w-full rounded-xl px-3 py-2 text-left transition ${
                                            filters.brand === brand
                                                ? 'bg-sky-600/10 font-medium text-sky-700 ring-1 ring-sky-500/40'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {brand}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Materials</h2>
                            <div className="mt-3 space-y-2 text-sm">
                                {facets.materials.map((material) => (
                                    <button
                                        key={material}
                                        onClick={() => applyFilter('material', material)}
                                        className={`w-full rounded-xl px-3 py-2 text-left transition ${
                                            filters.material === material
                                                ? 'bg-sky-600/10 font-medium text-sky-700 ring-1 ring-sky-500/40'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {material}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">Purity</h2>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {facets.purities.map((purity) => (
                                    <button
                                        key={purity}
                                        onClick={() => applyFilter('purity', purity)}
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                            filters.purity === purity
                                                ? 'bg-sky-600 text-white'
                                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                        }`}
                                    >
                                        {purity}
                                    </button>
                                ))}
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
                                {products.data.map((product) => (
                                    <article
                                        key={product.id}
                                        className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                                    >
                                        {product.thumbnail && (
                                            <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                                                <img
                                                    src={product.thumbnail}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                                                <div className="absolute bottom-4 left-4 flex flex-col text-white">
                                                    <span className="text-xs uppercase tracking-[0.35em] text-white/80">
                                                        {product.category ?? 'Signature' }
                                                    </span>
                                                    <span className="text-sm font-semibold">{product.brand ?? 'AurumCraft Atelier'}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-3 p-6">
                                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-sky-600">
                                                {product.name}
                                            </h3>
                                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                                SKU {product.sku}
                                            </p>
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
                                                        {variant.label}
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
                                                        <dt className="font-medium text-slate-600">Purity</dt>
                                                        <dd>{product.purity ?? 'On request'}</dd>
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
                                                    {product.is_jobwork_allowed ? (
                                                        <Link
                                                            href={`${route('frontend.jobwork.index')}?product=${product.id}`}
                                                            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800"
                                                        >
                                                            Request jobwork
                                                        </Link>
                                                    ) : (
                                                        <span className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-400">
                                                            Catalogue only
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            addToCart(
                                                                product.id,
                                                                product.variants.find((variant) => variant.is_default)?.id ?? product.variants[0]?.id,
                                                            )
                                                        }
                                                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-slate-900/30 transition hover:bg-slate-700"
                                                    >
                                                        Add to cart
                                                    </button>
                                                    <Link
                                                        href={route('frontend.catalog.show', product.id)}
                                                        className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sky-600/30 transition hover:bg-sky-500"
                                                    >
                                                        View details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
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

