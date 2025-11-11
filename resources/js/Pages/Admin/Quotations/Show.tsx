import AdminLayout from '@/Layouts/AdminLayout';
import type { PageProps } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

type QuotationDetails = {
    id: number;
    mode: 'purchase' | 'jobwork';
    status: string;
    jobwork_status?: string | null;
    quantity: number;
    notes?: string | null;
    admin_notes?: string | null;
    approved_at?: string | null;
    selections?: Record<string, unknown> | null;
    product: {
        id: number;
        name: string;
        sku: string;
        base_price?: number | null;
        making_charge?: number | null;
        media: Array<{ url: string; alt: string }>;
        variants: Array<{
            id: number;
            label: string;
            metadata?: Record<string, unknown> | null;
            price_adjustment: number;
        }>;
    };
    variant?: {
        id: number;
        label: string;
        price_adjustment: number;
        metadata?: Record<string, unknown> | null;
    } | null;
    user?: {
        name?: string | null;
        email?: string | null;
    } | null;
    order?: {
        id: number;
        reference: string;
        status: string;
        total_amount: number;
        history: Array<{
            id: number;
            status: string;
            created_at?: string | null;
        }>;
    } | null;
    messages: Array<{
        id: number;
        sender: 'customer' | 'admin';
        message: string;
        created_at?: string | null;
        author?: string | null;
    }>;
};

type AdminQuotationShowProps = PageProps<{
    quotation: QuotationDetails;
    jobworkStages: Record<string, string>;
}>;

export default function AdminQuotationShow() {
    const { quotation, jobworkStages } = usePage<AdminQuotationShowProps>().props;

    const approveForm = useForm({
        admin_notes: quotation.admin_notes ?? '',
    });
    const rejectForm = useForm({
        admin_notes: quotation.admin_notes ?? '',
    });
    const jobworkForm = useForm({
        jobwork_status: quotation.jobwork_status ?? 'material_sending',
        admin_notes: quotation.admin_notes ?? '',
    });
    const messageForm = useForm({
        message: '',
    });

    const submitApprove = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        approveForm.post(route('admin.quotations.approve', quotation.id), {
            preserveScroll: true,
        });
    };

    const submitReject = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        rejectForm.post(route('admin.quotations.reject', quotation.id), {
            preserveScroll: true,
        });
    };

    const submitJobwork = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        jobworkForm.post(route('admin.quotations.jobwork-status', quotation.id), {
            preserveScroll: true,
        });
    };

    const submitMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!messageForm.data.message.trim()) {
            return;
        }

        messageForm.post(route('admin.quotations.messages.store', quotation.id), {
            preserveScroll: true,
            onSuccess: () => messageForm.reset('message'),
        });
    };

    return (
        <AdminLayout>
            <Head title={`Quotation #${quotation.id}`} />

            <div className="space-y-8">
                <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Quotation #{quotation.id}</h1>
                            <p className="mt-1 text-sm text-slate-500">
                                Mode: {quotation.mode === 'jobwork' ? 'Jobwork' : 'Jewellery purchase'} · Status: {quotation.status}
                            </p>
                        </div>
                        <Link
                            href={route('admin.quotations.index')}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                    <section className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Product</h2>
                            <div className="mt-4 flex flex-col gap-4 md:flex-row">
                                {quotation.product.media[0] && (
                                    <img
                                        src={quotation.product.media[0].url}
                                        alt={quotation.product.media[0].alt}
                                        className="h-32 w-32 rounded-2xl object-cover"
                                    />
                                )}
                                <div className="space-y-2 text-sm text-slate-600">
                                    <div>
                                        <p className="text-base font-semibold text-slate-900">{quotation.product.name}</p>
                                        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">SKU {quotation.product.sku}</p>
                                    </div>
                                    <div className="grid gap-2 text-xs md:grid-cols-2">
                                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                            Qty {quotation.quantity}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                            Base ₹ {(quotation.product.base_price ?? 0).toLocaleString('en-IN')}
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                            Making ₹ {(quotation.product.making_charge ?? 0).toLocaleString('en-IN')}
                                        </span>
                                        {quotation.variant && (
                                            <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                                                Variant adj. ₹ {quotation.variant.price_adjustment.toLocaleString('en-IN')}
                                            </span>
                                        )}
                                    </div>
                                    {quotation.selections && (
                                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                                Selections
                                            </h3>
                                            <ul className="mt-2 space-y-1">
                                                {Object.entries(quotation.selections).map(([key, value]) => (
                                                    <li key={key}>
                                                        <span className="capitalize text-slate-400">{key.replace(/_/g, ' ')}:</span>{' '}
                                                        <span className="text-slate-700">
                                                            {value === null || value === undefined || value === ''
                                                                ? '—'
                                                                : String(value)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Customer</h2>
                            <div className="mt-3 text-sm text-slate-600">
                                <p className="font-semibold text-slate-900">{quotation.user?.name ?? 'Unknown'}</p>
                                <p className="text-slate-500">{quotation.user?.email}</p>
                                {quotation.notes && (
                                    <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                                            Customer notes
                                        </h3>
                                        <p className="mt-2 whitespace-pre-line">{quotation.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {quotation.order && (
                            <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                                <h2 className="text-lg font-semibold text-slate-900">Linked order</h2>
                                <p className="mt-3 text-sm text-slate-600">
                                    Order reference{' '}
                                    <Link
                                        href={route('admin.orders.show', quotation.order.id)}
                                        className="font-semibold text-sky-600 hover:text-sky-500"
                                    >
                                        {quotation.order.reference}
                                    </Link>{' '}
                                    · Status {quotation.order.status} · Total ₹{' '}
                                    {quotation.order.total_amount.toLocaleString('en-IN')}
                                </p>
                                {quotation.order?.history?.length ? (
                                    <div className="mt-4 space-y-2 text-xs text-slate-500">
                                        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Status timeline</h3>
                                        <ul className="space-y-2">
                                            {quotation.order.history.map((entry) => (
                                                <li key={entry.id} className="rounded-2xl border border-slate-200 px-3 py-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-slate-700">{entry.status.replace(/_/g, ' ')}</span>
                                                        <span>
                                                            {entry.created_at
                                                                ? new Date(entry.created_at).toLocaleString('en-IN', {
                                                                      day: '2-digit',
                                                                      month: 'short',
                                                                      year: 'numeric',
                                                                      hour: '2-digit',
                                                                      minute: '2-digit',
                                                                  })
                                                                : 'N/A'}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Conversation</h2>
                            <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-2 text-sm text-slate-600">
                                {quotation.messages.length === 0 && (
                                    <p className="text-xs text-slate-400">No messages yet. Start by sending the customer a note below.</p>
                                )}
                                {quotation.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex flex-col gap-1 rounded-2xl border px-3 py-2 ${
                                            message.sender === 'admin'
                                                ? 'border-slate-200 bg-white'
                                                : 'border-sky-200 bg-sky-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-slate-400">
                                            <span>{message.sender === 'admin' ? (message.author ?? 'Admin') : 'Customer'}</span>
                                            <span>
                                                {message.created_at
                                                    ? new Date(message.created_at).toLocaleString('en-IN', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric',
                                                          hour: '2-digit',
                                                          minute: '2-digit',
                                                      })
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                        <p className="whitespace-pre-line text-sm text-slate-700">{message.message}</p>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={submitMessage} className="mt-4 space-y-2 text-sm text-slate-600">
                                <label className="flex flex-col gap-2">
                                    <span>Message</span>
                                    <textarea
                                        value={messageForm.data.message}
                                        onChange={(event) => messageForm.setData('message', event.target.value)}
                                        className="min-h-[120px] rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                        placeholder="Request more information or share updates with the client..."
                                        disabled={messageForm.processing}
                                    />
                                </label>
                                {messageForm.errors.message && (
                                    <p className="text-xs text-rose-500">{messageForm.errors.message}</p>
                                )}
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={messageForm.processing || !messageForm.data.message.trim()}
                                        className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {messageForm.processing ? 'Sending…' : 'Send message'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        {(quotation.status === 'pending' || quotation.status === 'customer_confirmed') && (
                            <form onSubmit={submitApprove} className="space-y-4 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-emerald-200/80">
                                <h3 className="text-base font-semibold text-slate-900">Approve quotation</h3>
                                <p className="text-xs text-slate-500">
                                    Approving will {quotation.mode === 'jobwork'
                                        ? 'move the request into jobwork workflow.'
                                        : 'create an order in pending payment.'}
                                </p>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Internal notes</span>
                                    <textarea
                                        value={approveForm.data.admin_notes}
                                        onChange={(event) => approveForm.setData('admin_notes', event.target.value)}
                                        className="min-h-[90px] rounded-2xl border border-slate-200 px-4 py-2 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    disabled={approveForm.processing}
                                    className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    Approve quotation
                                </button>
                            </form>
                        )}

                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                approveForm.reset();
                                rejectForm.reset();
                                jobworkForm.reset('admin_notes');
                                const formData = new FormData(event.currentTarget as HTMLFormElement);
                                router.post(route('admin.quotations.request-confirmation', quotation.id), formData, {
                                    preserveScroll: true,
                                });
                            }}
                            className="space-y-4 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80"
                        >
                            <h3 className="text-base font-semibold text-slate-900">Request customer confirmation</h3>
                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Quantity</span>
                                <input
                                    type="number"
                                    name="quantity"
                                    defaultValue={quotation.quantity}
                                    min={1}
                                    className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                />
                            </label>
                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Variant</span>
                                <select
                                    name="product_variant_id"
                                    defaultValue={quotation.variant?.id ?? ''}
                                    className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                >
                                    <option value="">Keep current</option>
                                    {quotation.product.variants.map((variant) => (
                                        <option key={variant.id} value={variant.id}>
                                            {variant.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col gap-2 text-sm text-slate-600">
                                <span>Notes to customer</span>
                                <textarea
                                    name="notes"
                                    className="min-h-[80px] rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    placeholder="Explain changes or pricing impact..."
                                />
                            </label>
                            <button
                                type="submit"
                                className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
                            >
                                Send for customer approval
                            </button>
                        </form>

                        {quotation.status !== 'rejected' && (
                            <form onSubmit={submitReject} className="space-y-4 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-rose-200/80">
                                <h3 className="text-base font-semibold text-slate-900">Reject quotation</h3>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Reason / feedback</span>
                                    <textarea
                                        value={rejectForm.data.admin_notes}
                                        onChange={(event) => rejectForm.setData('admin_notes', event.target.value)}
                                        className="min-h-[90px] rounded-2xl border border-slate-200 px-4 py-2 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    disabled={rejectForm.processing}
                                    className="w-full rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-400 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    Reject quotation
                                </button>
                            </form>
                        )}

                        {quotation.mode === 'jobwork' && quotation.status === 'approved' && (
                            <form
                                onSubmit={submitJobwork}
                                className="space-y-4 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-sky-200/80"
                            >
                                <h3 className="text-base font-semibold text-slate-900">Jobwork stage</h3>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Current stage</span>
                                    <select
                                        value={jobworkForm.data.jobwork_status}
                                        onChange={(event) => jobworkForm.setData('jobwork_status', event.target.value)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    >
                                        {Object.entries(jobworkStages).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-2 text-sm text-slate-600">
                                    <span>Notes</span>
                                    <textarea
                                        value={jobworkForm.data.admin_notes}
                                        onChange={(event) => jobworkForm.setData('admin_notes', event.target.value)}
                                        className="min-h-[80px] rounded-2xl border border-slate-200 px-4 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    disabled={jobworkForm.processing}
                                    className="w-full rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-600/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    Update stage
                                </button>
                            </form>
                        )}
                    </aside>
                </div>
            </div>
        </AdminLayout>
    );
}

