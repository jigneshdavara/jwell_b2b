import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

type CartItem = {
    id: number;
    product_id: number;
    sku: string;
    name: string;
    quantity: number;
    unit_total: number;
    line_total: number;
    price_breakdown: Record<string, number>;
    thumbnail?: string | null;
    variant_label?: string | null;
};

type CartPageProps = PageProps<{
    cart: {
        items: CartItem[];
        currency: string;
        subtotal: number;
        tax: number;
        discount: number;
        shipping: number;
        total: number;
    };
}>;

const currencyFormatter = (currency: string) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    });

export default function CartIndex() {
    const { cart } = usePage<CartPageProps>().props;
    const formatter = useMemo(() => currencyFormatter(cart.currency || 'INR'), [cart.currency]);

    const updateQuantity = (item: CartItem, delta: number) => {
        const nextQuantity = Math.max(1, item.quantity + delta);
        router.patch(
            route('frontend.cart.items.update', item.id),
            { quantity: nextQuantity },
            { preserveScroll: true, preserveState: true },
        );
    };

    const removeItem = (item: CartItem) => {
        router.delete(route('frontend.cart.items.destroy', item.id), {
            preserveScroll: true,
        });
    };

    const isEmpty = cart.items.length === 0;

    return (
        <AuthenticatedLayout>
            <Head title="Cart" />

            <div className="space-y-10" id="cart">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Purchase List</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Review your curated pieces before proceeding to secure payment and production planning.
                        </p>
                    </div>
                    <Link
                        href={route('frontend.checkout.show')}
                        className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                            isEmpty
                                ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                                : 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500'
                        }`}
                        as={isEmpty ? undefined : 'button'}
                        disabled={isEmpty}
                    >
                        Proceed to checkout
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-4">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            {isEmpty ? (
                                <div className="flex flex-col items-center justify-center space-y-4 py-16 text-sm text-slate-500">
                                    <p>Your cart is empty. Explore the catalogue to add designs.</p>
                                    <Link
                                        href={route('frontend.catalog.index')}
                                        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                                    >
                                        Browse catalogue
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 md:flex-row md:items-center md:justify-between"
                                        >
                                            <div className="flex flex-1 items-start gap-4">
                                                {item.thumbnail && (
                                                    <img
                                                        src={item.thumbnail}
                                                        alt={item.name}
                                                        className="h-20 w-20 rounded-xl object-cover shadow"
                                                    />
                                                )}
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                                                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">SKU {item.sku}</p>
                                                    {item.variant_label && (
                                                        <p className="mt-1 text-xs font-medium text-slate-500">{item.variant_label}</p>
                                                    )}
                                                    <p className="mt-2 text-sm text-slate-500">
                                                        Base {formatter.format(item.price_breakdown.base ?? 0)} · Making{' '}
                                                        {formatter.format(item.price_breakdown.making ?? 0)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
                                                <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item, -1)}
                                                        className="text-lg text-slate-500 hover:text-slate-800"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="text-sm font-semibold text-slate-900">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item, 1)}
                                                        className="text-lg text-slate-500 hover:text-slate-800"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Total</p>
                                                    <p className="text-lg font-semibold text-slate-900">
                                                        {formatter.format(item.line_total)}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item)}
                                                    className="text-xs font-medium text-rose-500 hover:text-rose-600"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatter.format(cart.subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tax</span>
                                    <span>{formatter.format(cart.tax)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Discount</span>
                                    <span>-{formatter.format(cart.discount)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Shipping</span>
                                    <span>{formatter.format(cart.shipping)}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 font-semibold text-slate-900">
                                    <div className="flex items-center justify-between text-base">
                                        <span>Total</span>
                                        <span>{formatter.format(cart.total)}</span>
                                    </div>
                                </div>
                            </div>
                            <Link
                                href={route('frontend.checkout.show')}
                                className={`mt-6 block rounded-full px-4 py-2 text-center text-sm font-semibold transition ${
                                    isEmpty
                                        ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                                        : 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500'
                                }`}
                                as={isEmpty ? undefined : 'button'}
                                disabled={isEmpty}
                            >
                                Proceed to checkout
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
