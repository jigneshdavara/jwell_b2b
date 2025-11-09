import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps as AppPageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

type Product = {
    id: number;
    name: string;
    sku: string;
    description?: string;
    brand?: string;
    material?: string;
    purity?: string;
    gross_weight?: number;
    net_weight?: number;
    base_price?: number;
    making_charge?: number;
    is_jobwork_allowed: boolean;
    media: Array<{ url: string; alt: string }>;
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

type CatalogShowPageProps = AppPageProps<{
    product: Product;
}>;

export default function CatalogShow() {
    const { props } = usePage<CatalogShowPageProps>();
    const { product } = props;
    const defaultVariantId = product.variants.find((variant) => variant.is_default)?.id ?? product.variants[0]?.id ?? null;
    const { data, setData, post, processing } = useForm({
        product_id: product.id,
        product_variant_id: defaultVariantId,
        quantity: 1,
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(route('frontend.cart.items.store'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={product.name} />

            <div className="space-y-8">
                <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            {product.media.map((media, index) => (
                                <div
                                    key={`${media.url}-${index}`}
                                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
                                >
                                    <img
                                        src={media.url}
                                        alt={media.alt}
                                        className="h-64 w-full object-cover transition duration-500 hover:scale-105"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200/80">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">SKU {product.sku}</p>
                                    <h1 className="mt-2 text-3xl font-semibold text-slate-900">{product.name}</h1>
                                    <p className="mt-3 text-sm text-slate-500">By {product.brand ?? 'AurumCraft Atelier'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Estimate</p>
                                    <p className="text-2xl font-semibold text-slate-900">₹ {product.base_price?.toLocaleString('en-IN')}</p>
                                    <p className="text-xs text-slate-500">Making ₹ {product.making_charge?.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                            <p className="mt-6 text-sm leading-7 text-slate-600">{product.description}</p>
                            <dl className="mt-6 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Material</dt>
                                    <dd className="font-semibold text-slate-800">{product.material}</dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Purity</dt>
                                    <dd className="font-semibold text-slate-800">{product.purity}</dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Gross wt.</dt>
                                    <dd className="font-semibold text-slate-800">{product.gross_weight?.toFixed(2)} g</dd>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                                    <dt className="text-slate-500">Net wt.</dt>
                                    <dd className="font-semibold text-slate-800">{product.net_weight?.toFixed(2)} g</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <form
                            onSubmit={submit}
                            className="w-full space-y-4 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80"
                        >
                            <h2 className="text-lg font-semibold text-slate-900">Add to purchase list</h2>
                            <p className="text-xs text-slate-500">Lock rates instantly and convert to production-ready order in checkout.</p>

                            {product.variants.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-slate-600">Select variant</span>
                                    <div className="grid gap-2">
                                        {product.variants.map((variant) => (
                                            <label
                                                key={variant.id}
                                                className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                                                    data.product_variant_id === variant.id
                                                        ? 'border-sky-500 bg-sky-50 text-slate-900'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300'
                                                }`}
                                            >
                                                <span>{variant.label}</span>
                                                <input
                                                    type="radio"
                                                    name="product_variant_id"
                                                    value={variant.id}
                                                    checked={data.product_variant_id === variant.id}
                                                    onChange={() => setData('product_variant_id', variant.id)}
                                                    className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Quantity</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={data.quantity}
                                    onChange={(event) => setData('quantity', Math.max(1, Number(event.target.value)))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Add to cart
                            </button>
                            {product.is_jobwork_allowed && (
                                <Link
                                    href={`${route('frontend.jobwork.index')}?product=${product.id}`}
                                    className="block rounded-full border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800"
                                >
                                    Request jobwork for this design
                                </Link>
                            )}
                        </form>

                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Need customisation?</h3>
                            <p className="mt-3 text-sm text-slate-600">
                                Share gemstone preferences, purity changes, or CAD references with our design desk. We offer 3D renders and
                                sampling within 5 business days for enterprise partners.
                            </p>
                            <Link
                                href="mailto:design@aurumcraft.test"
                                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-500"
                            >
                                design@aurumcraft.test
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7M21 12H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

