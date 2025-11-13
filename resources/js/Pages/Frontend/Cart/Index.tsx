import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notesModalOpen, setNotesModalOpen] = useState<number | null>(null);
    const [notesValue, setNotesValue] = useState<Record<number, string>>({});
    const totalQuantity = useMemo(() => cart.items.reduce((sum, item) => sum + item.quantity, 0), [cart.items]);
    const jobworkCount = useMemo(
        () => cart.items.filter((item) => (item.configuration?.mode ?? 'purchase') === 'jobwork').length,
        [cart.items],
    );

    const { data: cartCommentData, setData: setCartCommentData, post: postCartComment } = useForm({
        comment: '',
    });

    // Initialize notes values
    useEffect(() => {
        const initialNotes: Record<number, string> = {};
        cart.items.forEach((item) => {
            initialNotes[item.id] = item.configuration?.notes ?? '';
        });
        setNotesValue(initialNotes);
    }, [cart.items]);

    const updateQuantity = (item: CartItem, delta: number) => {
        const nextQuantity = Math.max(1, item.quantity + delta);
        router.patch(
            route('frontend.cart.items.update', item.id),
            { quantity: nextQuantity },
            { preserveScroll: true, preserveState: true },
        );
    };

    const updateConfiguration = (item: CartItem, configuration: { notes?: string | null }) => {
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

    const openNotesModal = (item: CartItem) => {
        setNotesValue((prev) => ({
            ...prev,
            [item.id]: item.configuration?.notes ?? '',
        }));
        setNotesModalOpen(item.id);
    };

    const saveNotes = (item: CartItem) => {
        updateConfiguration(item, {
            notes: notesValue[item.id] || null,
        });
        setNotesModalOpen(null);
    };

    const isEmpty = cart.items.length === 0;

    const submitQuotations = () => {
        if (isEmpty) {
            return;
        }

        setConfirmOpen(true);
    };

    const confirmSubmit = () => {
        if (submitting || isEmpty) {
            return;
        }

        setSubmitting(true);
        router.post(
            route('frontend.quotations.store-from-cart'),
            { cart_comment: cartCommentData.comment || null },
            {
                preserveScroll: true,
                onSuccess: () => setConfirmOpen(false),
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const selectedItem = notesModalOpen ? cart.items.find((item) => item.id === notesModalOpen) : null;

    return (
        <AuthenticatedLayout>
            <Head title="Quotation list" />

            <div className="space-y-6" id="cart">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Quotation list</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Review and submit all quotation requests together for merchandising review.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={submitQuotations}
                        disabled={isEmpty}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
                            isEmpty
                                ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                                : 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Submit quotations
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-4">
                        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80">
                            {isEmpty ? (
                                <div className="flex flex-col items-center justify-center space-y-4 p-16 text-sm text-slate-500">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                        className="h-12 w-12 text-slate-300"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                    <p>Your cart is empty. Explore the catalogue to add designs.</p>
                                    <Link
                                        href={route('frontend.catalog.index')}
                                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Browse catalogue
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="border-b border-slate-200 bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Product</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Mode</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Quantity</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Unit Price</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Total</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {cart.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {item.thumbnail && (
                                                                <img
                                                                    src={item.thumbnail}
                                                                    alt={item.name}
                                                                    className="h-16 w-16 rounded-lg object-cover shadow-sm"
                                                                />
                                                            )}
                                                            <div className="min-w-0 flex-1">
                                                                <Link
                                                                    href={route('frontend.catalog.show', { product: item.product_id })}
                                                                    className="text-sm font-semibold text-slate-900 truncate hover:text-sky-600 transition"
                                                                >
                                                                    {item.name}
                                                                </Link>
                                                                <p className="text-xs text-slate-400">SKU {item.sku}</p>
                                                                {item.variant_label && (
                                                                    <p className="mt-0.5 text-xs font-medium text-slate-500">{item.variant_label}</p>
                                                                )}
                                                                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                                                                    <span>Base {formatter.format(item.price_breakdown.base ?? 0)}</span>
                                                                    <span>·</span>
                                                                    <span>Making {formatter.format(item.price_breakdown.making ?? 0)}</span>
                                                                </div>
                                                                {(item.line_discount ?? 0) > 0 && (
                                                                    <p className="mt-1 text-xs font-semibold text-emerald-600">
                                                                        Discount −{formatter.format(item.line_discount ?? 0)}
                                                                        {item.price_breakdown.discount_details?.name
                                                                            ? ` (${item.price_breakdown.discount_details.name})`
                                                                            : ''}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                                (item.configuration?.mode ?? 'purchase') === 'jobwork'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-slate-100 text-slate-700'
                                                            }`}
                                                        >
                                                            {(item.configuration?.mode ?? 'purchase') === 'jobwork' ? (
                                                                <>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 00-3.586 3.586l4.655 5.653m8.048-8.048l-2.496 3.03a2.548 2.548 0 01-3.586-3.586l2.496-3.03" />
                                                                    </svg>
                                                                    Jobwork
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                                                    </svg>
                                                                    Purchase
                                                                </>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(item, -1)}
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                                                aria-label="Decrease quantity"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                                                </svg>
                                                            </button>
                                                            <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(item, 1)}
                                                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                                                aria-label="Increase quantity"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-sm font-medium text-slate-900">
                                                        {formatter.format(item.unit_total)}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <p className="text-sm font-semibold text-slate-900">{formatter.format(item.line_total)}</p>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openNotesModal(item)}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-sky-600"
                                                                aria-label="Edit notes"
                                                                title={item.configuration?.notes ? 'View/edit notes' : 'Add notes'}
                                                            >
                                                                {item.configuration?.notes ? (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                    </svg>
                                                                )}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(item)}
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                                                                aria-label="Remove item"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-medium">{formatter.format(cart.subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Tax</span>
                                    <span className="font-medium">{formatter.format(cart.tax)}</span>
                                </div>
                                {cart.discount > 0 && (
                                    <div className="flex items-center justify-between text-emerald-600">
                                        <span>Discount</span>
                                        <span className="font-medium">-{formatter.format(cart.discount)}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span>Shipping</span>
                                    <span className="font-medium">{formatter.format(cart.shipping)}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3">
                                    <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                                        <span>Total</span>
                                        <span>{formatter.format(cart.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Cart Notes</h2>
                            <p className="mt-1 text-xs text-slate-500">Add a comment for all items in this cart</p>
                            <textarea
                                value={cartCommentData.comment}
                                onChange={(e) => setCartCommentData('comment', e.target.value)}
                                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="Add notes for the merchandising team..."
                                rows={4}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={submitQuotations}
                            disabled={isEmpty}
                            className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                                isEmpty
                                    ? 'cursor-not-allowed bg-slate-300 text-slate-500'
                                    : 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 hover:bg-sky-500'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Submit quotations
                        </button>
                    </aside>
                </div>
            </div>

            <Modal show={confirmOpen} onClose={() => (!submitting ? setConfirmOpen(false) : undefined)} maxWidth="lg">
                <div className="space-y-5 p-6">
                    <h2 className="text-lg font-semibold text-slate-900">Submit all quotation requests?</h2>
                    <p className="text-sm text-slate-600">
                        We will create separate quotation tickets for each product so the merchandising team can review the
                        details. You can still add more items afterwards.
                    </p>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p>
                            <span className="font-semibold text-slate-800">Products selected:</span> {cart.items.length}
                        </p>
                        <p className="mt-1">
                            <span className="font-semibold text-slate-800">Total units:</span> {totalQuantity}
                        </p>
                        {jobworkCount > 0 && (
                            <p className="mt-1">
                                <span className="font-semibold text-slate-800">Jobwork requests:</span> {jobworkCount}
                            </p>
                        )}
                        <p className="mt-1">
                            <span className="font-semibold text-slate-800">Estimated total:</span> {formatter.format(cart.total)}
                        </p>
                        {cartCommentData.comment && (
                            <div className="mt-3 rounded-lg bg-white p-3">
                                <p className="text-xs font-semibold text-slate-700">Cart Notes:</p>
                                <p className="mt-1 text-xs text-slate-600">{cartCommentData.comment}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => (!submitting ? setConfirmOpen(false) : undefined)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmSubmit}
                            disabled={submitting}
                            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Submitting…' : 'Confirm & submit'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal show={notesModalOpen !== null} onClose={() => setNotesModalOpen(null)} maxWidth="md">
                {selectedItem && (
                    <div className="space-y-4 p-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Notes for {selectedItem.name}</h3>
                            <p className="mt-1 text-xs text-slate-500">SKU {selectedItem.sku}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Notes</label>
                            <textarea
                                value={notesValue[selectedItem.id] || ''}
                                onChange={(e) =>
                                    setNotesValue((prev) => ({
                                        ...prev,
                                        [selectedItem.id]: e.target.value,
                                    }))
                                }
                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                placeholder="Share expectations or deadlines..."
                                rows={5}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setNotesModalOpen(null)}
                                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => saveNotes(selectedItem)}
                                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500"
                            >
                                Save notes
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
