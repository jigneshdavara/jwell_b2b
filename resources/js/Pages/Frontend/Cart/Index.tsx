import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

type PriceBreakdown = {
    base?: number;
    making?: number;
    variant_adjustment?: number;
    subtotal?: number;
    discount?: number;
    total?: number;
    discount_details?: {
        amount: number;
        type: 'percentage' | 'fixed' | null;
        value: number;
        source?: string | null;
        name?: string | null;
    } | null;
};

type CartItem = {
    id: number;
    product_id: number;
    sku: string;
    name: string;
    quantity: number;
    unit_total: number;
    line_total: number;
    line_subtotal?: number;
    line_discount?: number;
    price_breakdown: PriceBreakdown;
    thumbnail?: string | null;
    variant_label?: string | null;
    configuration?: {
        mode?: 'purchase' | 'jobwork';
        notes?: string | null;
        selections?: Record<string, unknown> | null;
    };
};

type ItemConfigurationUpdate = {
    mode?: 'purchase' | 'jobwork';
    notes?: string | null;
    selections?: Record<string, string | number | boolean | null> | null;
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

    const updateConfiguration = (item: CartItem, configuration: ItemConfigurationUpdate) => {
        router.patch(
            route('frontend.cart.items.update', item.id),
            { configuration },
            { preserveScroll: true, preserveState: true },
        );
    };

    const removeItem = (item: CartItem) => {
        router.delete(route('frontend.cart.items.destroy', item.id), {
            preserveScroll: true,
        });
    };

    const isEmpty = cart.items.length === 0;

    const submitQuotations = () => {
        if (isEmpty) {
            return;
        }

        router.post(route('frontend.quotations.store-from-cart'), undefined, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Quotation list" />

            <div className="space-y-10" id="cart">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold text-slate-900">Quotation list</h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Adjust metal modes and notes before submitting all requests together for merchandising review.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={submitQuotations}
                        disabled={isEmpty}
                        className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                            isEmpty
                                ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                                : 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500'
                        }`}
                    >
                        Submit quotations
                    </button>
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
                                                    {(item.line_discount ?? 0) > 0 && (
                                                        <p className="mt-1 text-xs font-semibold text-emerald-600">
                                                            Making discount −{formatter.format(item.line_discount ?? 0)}
                                                            {item.price_breakdown.discount_details?.name
                                                                ? ` (${item.price_breakdown.discount_details.name})`
                                                                : ''}
                                                        </p>
                                                    )}
                                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                                                            Mode
                                                            <select
                                                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                                value={item.configuration?.mode ?? 'purchase'}
                                                                onChange={(event) =>
                                                                    updateConfiguration(item, {
                                                                        mode: event.target.value,
                                                                    })
                                                                }
                                                            >
                                                                <option value="purchase">Jewellery quotation</option>
                                                                <option value="jobwork">Jobwork</option>
                                                            </select>
                                                        </label>
                                                        <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.3em] text-slate-400">
                                                            Notes
                                                            <textarea
                                                                defaultValue={item.configuration?.notes ?? ''}
                                                                onBlur={(event) =>
                                                                    updateConfiguration(item, {
                                                                        notes: event.target.value,
                                                                    })
                                                                }
                                                                className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                                                placeholder="Share expectations or deadlines"
                                                                rows={3}
                                                            />
                                                        </label>
                                                    </div>
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
                            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Subtotal</span>
                                    <span>{formatter.format(cart.subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tax</span>
                                    <span>{formatter.format(cart.tax)}</span>
                                </div>
                                {cart.discount > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span>Discount</span>
                                        <span>-{formatter.format(cart.discount)}</span>
                                    </div>
                                )}
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
                            <button
                                type="button"
                                onClick={submitQuotations}
                                disabled={isEmpty}
                                className={`mt-6 block w-full rounded-full px-4 py-2 text-center text-sm font-semibold transition ${
                                    isEmpty
                                        ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                                        : 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500'
                                }`}
                            >
                                Submit quotations
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
