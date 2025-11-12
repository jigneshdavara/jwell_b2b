import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

type WishlistItem = {
    id: number;
    product_id: number;
    variant_id: number | null;
    sku?: string;
    name?: string;
    thumbnail?: string | null;
    variant_label?: string | null;
    configuration?: Record<string, unknown> | null;
};

type WishlistPageProps = PageProps<{
    items: WishlistItem[];
}>;

export default function WishlistIndex() {
    const { items } = usePage<WishlistPageProps>().props;
    const isEmpty = items.length === 0;

    const removeItem = (item: WishlistItem) => {
        router.delete(route('frontend.wishlist.items.destroy', item.id), {
            preserveScroll: true,
        });
    };

    const moveToCart = (item: WishlistItem) => {
        router.post(route('frontend.wishlist.items.move-to-cart', item.id), undefined, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Wishlist" />

            <div className="space-y-10">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Wishlist</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Keep track of designs you love and move them to the quotation list when you&apos;re ready.
                        </p>
                    </div>
                    {!isEmpty && (
                        <Link
                            href={route('frontend.catalog.index')}
                            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500"
                        >
                            Browse more products
                        </Link>
                    )}
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    {isEmpty ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-16 text-sm text-slate-500">
                            <p>Your wishlist is empty. Add favourites while browsing the catalogue.</p>
                            <Link
                                href={route('frontend.catalog.index')}
                                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                            >
                                Explore catalogue
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {items.map((item) => (
                                <article
                                    key={item.id}
                                    className="flex flex-col justify-between rounded-2xl border border-slate-200 p-5 shadow-sm transition hover:shadow-lg"
                                >
                                    <div className="space-y-3">
                                        <Link
                                            href={route('frontend.catalog.show', { product: item.product_id })}
                                            className="block overflow-hidden rounded-2xl bg-slate-100"
                                        >
                                            {item.thumbnail ? (
                                                <img
                                                    src={item.thumbnail}
                                                    alt={item.name ?? 'Product image'}
                                                    className="h-48 w-full object-cover transition duration-500 hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
                                                    <span className="text-lg font-semibold">{item.name ?? 'Product'}</span>
                                                </div>
                                            )}
                                        </Link>
                                        <div>
                                            <Link
                                                href={route('frontend.catalog.show', { product: item.product_id })}
                                                className="text-base font-semibold text-slate-900 transition hover:text-sky-600"
                                            >
                                                {item.name}
                                            </Link>
                                            {item.variant_label && (
                                                <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">
                                                    {item.variant_label}
                                                </p>
                                            )}
                                            {item.sku && (
                                                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">SKU {item.sku}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => moveToCart(item)}
                                            className="inline-flex flex-1 items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/30 transition hover:bg-sky-500"
                                        >
                                            Move to quotations
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item)}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                                            aria-label="Remove from wishlist"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={1.5}
                                                className="h-4 w-4"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

