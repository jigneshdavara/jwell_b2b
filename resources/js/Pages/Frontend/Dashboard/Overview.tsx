import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import type { PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const titleMap: Record<string, string> = {
    open_orders: 'Open orders',
    jobwork_requests: 'Jobwork requests',
    active_offers: 'Active offers',
};

type DashboardProps = {
    stats: Record<string, number>;
    recentOrders: Array<{
        reference: string;
        status: string;
        total: number;
        items: number;
        placed_on: string;
    }>;
    jobworkTimeline: Array<{
        id: number;
        status?: string | null;
        product?: string | null;
        quantity: number;
        submitted_on: string | null;
    }>;
    dueOrders: Array<{
        reference: string;
        total: number;
        placed_on: string | null;
    }>;
    recentProducts: Array<{
        id: number;
        name: string;
        sku: string;
        brand?: string | null;
        catalog?: string | null;
        base_price: number;
        thumbnail?: string | null;
    }>;
    featuredCatalogs: Array<{
        id: number;
        name: string;
        slug?: string | null;
        description?: string | null;
        products_count: number;
    }>;
    featuredCategories: Array<{
        id: number;
        name: string;
        slug?: string | null;
        products_count: number;
        cover_image_url?: string | null;
    }>;
    brandSpotlight: Array<{
        id: number;
        name: string;
        products_count: number;
        cover_image_url?: string | null;
    }>;
};

const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    in_production: 'bg-elvee-blue/10 text-elvee-blue',
    quality_check: 'bg-indigo-100 text-indigo-700',
    ready_to_dispatch: 'bg-purple-100 text-purple-700',
    dispatched: 'bg-blue-100 text-blue-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
    submitted: 'bg-slate-100 text-slate-700',
    material_sending: 'bg-slate-100 text-slate-700',
    material_received: 'bg-elvee-blue/10 text-elvee-blue',
    under_preparation: 'bg-indigo-100 text-indigo-700',
    awaiting_billing: 'bg-amber-100 text-amber-700',
    billing_confirmed: 'bg-emerald-100 text-emerald-700',
    ready_to_ship: 'bg-slate-900 text-white',
};

export default function FrontendDashboardOverview() {
    const {
        stats,
        recentOrders,
        jobworkTimeline,
        dueOrders,
        recentProducts,
        featuredCatalogs,
        featuredCategories: _featuredCategories,
        brandSpotlight: _brandSpotlight,
    } = usePage<PageProps<DashboardProps>>().props;

    const statEntries = Object.entries(stats);

    return (
        <AuthenticatedLayout>
            <Head title="Wholesale Dashboard" />

            <div className="space-y-10">
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-elvee-blue via-navy to-ink text-white shadow-2xl">
                    <div className="absolute inset-0">
                        <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-feather-gold/20 blur-3xl" />
                        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
                    </div>
                    <div className="relative z-10 grid gap-8 px-6 py-10 lg:grid-cols-[1.8fr_1fr] lg:px-12 lg:py-14">
                        <div className="space-y-6">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
                                Wholesale cockpit
                            </span>
                            <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">
                                Welcome back to Elvee. Track operations and curate assortments just like a premium ecommerce backend.
                            </h1>
                            <p className="text-sm text-white/70 lg:text-base">
                                Start with ready-to-purchase drops, monitor jobwork in motion, keep dues in check, and move shortlisted pieces straight into quotations.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <Link
                                    href={route('frontend.catalog.index')}
                                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-900/20 transition hover:bg-white/90"
                                >
                                    Browse catalogue
                                </Link>
                                <Link
                                    href={route('frontend.wishlist.index')}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                                >
                                    View wishlist
                                </Link>
                                <a
                                    href="mailto:support@elvee.in"
                                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
                                >
                                    Relationship manager
                                </a>
                            </div>
                        </div>
                        <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
                            <p className="text-xs font-semibold text-white/60">
                                Live metrics
                            </p>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                {statEntries.length === 0 && (
                                    <div className="rounded-2xl border border-white/20 bg-white/5 p-4 text-sm text-white/70">
                                        Metrics sync as soon as orders or jobwork start flowing in.
                                    </div>
                                )}
                                {statEntries.map(([key, value]) => (
                                    <div key={key} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                                        <p className="text-xs text-white/60">
                                            {titleMap[key] ?? key.replace(/_/g, ' ')}
                                        </p>
                                        <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                                        <p className="mt-1 text-[11px] text-white/50">
                                            Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
                    <section className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">New arrivals for your shelves</h2>
                                    <p className="text-sm text-slate-500">
                                        Freshly activated designs curated for trade partners. Shortlist and request quotations instantly.
                                    </p>
                                </div>
                                <Link
                                    href={route('frontend.catalog.index')}
                                    className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:inline-flex"
                                >
                                    View all
                                </Link>
                            </div>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {recentProducts.map((product) => {
                                    const productLink = route('frontend.catalog.show', { product: product.id });
                                    return (
                                        <article
                                            key={product.id}
                                            className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
                                        >
                                            <Link href={productLink} className="block">
                                                <div className="relative h-44 w-full overflow-hidden">
                                                    {product.thumbnail ? (
                                                        <>
                                                            <img
                                                                src={product.thumbnail}
                                                                alt={product.name}
                                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                                                        </>
                                                    ) : (
                                                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
                                                        <span className="text-xs text-white/70">
                                                                {product.catalog ?? 'Signature drop'}
                                                            </span>
                                                            <span className="mt-2 text-lg font-semibold">
                                                                {product.brand ?? 'Elvee Atelier'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="absolute left-4 bottom-4 flex flex-col text-white">
                                                    <span className="text-xs text-white/70">
                                                            {product.catalog ?? 'Featured'}
                                                        </span>
                                                        <span className="text-sm font-semibold">
                                                            {product.brand ?? 'Elvee Atelier'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                            <div className="space-y-3 p-5">
                                                <Link
                                                    href={productLink}
                                                    className="text-base font-semibold text-slate-900 transition hover:text-feather-gold"
                                                >
                                                    {product.name}
                                                </Link>
                                                <p className="text-xs text-slate-400">SKU {product.sku}</p>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-slate-400">Base price</p>
                                                        <p className="text-lg font-semibold text-slate-900">
                                                            {currencyFormatter.format(product.base_price)}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href={productLink}
                                                        className="rounded-full bg-elvee-blue px-4 py-2 text-xs font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy"
                                                    >
                                                        View product
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                                {recentProducts.length === 0 && (
                                    <div className="col-span-full rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                        We are syncing fresh designs for you. Explore catalogues in the meantime.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                    <aside className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Curated catalogues</h2>
                            <p className="text-xs text-slate-400">Tailored for wholesale edits</p>
                            <div className="mt-4 space-y-3">
                                {featuredCatalogs.map((catalog) => (
                                    <Link
                                        key={catalog.id}
                                        href={route('frontend.catalog.index', { catalog: catalog.slug ?? catalog.id })}
                                        className="flex items-start justify-between rounded-2xl border border-slate-200 p-4 transition hover:border-feather-gold/50 hover:bg-feather-gold/5"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{catalog.name}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {catalog.description
                                                    ? catalog.description.slice(0, 90)
                                                    : 'A focused selection of ready-to-list designs.'}
                                            </p>
                                            <span className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                                                {catalog.products_count} designs
                                            </span>
                                        </div>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={1.5}
                                            className="mt-1 h-4 w-4 text-slate-400"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                ))}
                                {featuredCatalogs.length === 0 && (
                                    <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                                        Build catalogues in admin to surface curated assortments here.
                                    </p>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>

                <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">
                    <section className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
                                <p className="text-sm text-slate-500">Track fulfilment and reconcile with payments.</p>
                            </div>
                            <Link
                                href={route('frontend.orders.index')}
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                            >
                                View all orders
                            </Link>
                        </div>
                        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500">Reference</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-500">Status</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-500">Total</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-500">Items</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-500">Placed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {recentOrders.map((order) => (
                                        <tr key={order.reference}>
                                            <td className="px-4 py-3 font-medium text-slate-700">{order.reference}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                        statusColors[order.status] ?? 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {order.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-700">
                                                {currencyFormatter.format(order.total)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-500">{order.items}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">
                                                {new Date(order.placed_on).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                    {recentOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                                                No orders yet. Start curating from the catalogue to populate this view.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <aside className="space-y-6">
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Jobwork timeline</h2>
                            <p className="text-xs text-slate-400">Live production updates</p>
                            <div className="mt-4 space-y-4">
                                {jobworkTimeline.map((job) => (
                                    <div key={job.id} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-slate-800">Quotation #{job.id}</p>
                                            <span
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                    (job.status && statusColors[job.status]) ??
                                                    'bg-slate-100 text-slate-700'
                                                }`}
                                            >
                                                {(job.status ?? 'pending').replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-600">
                                            {job.product ?? 'Catalogue design'} · {job.quantity} pcs
                                        </p>
                                        <p className="mt-3 text-xs text-slate-500">
                                            Submitted{' '}
                                            {job.submitted_on
                                                ? new Date(job.submitted_on).toLocaleDateString('en-IN', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : 'N/A'}
                                        </p>
                                    </div>
                                ))}
                                {jobworkTimeline.length === 0 && (
                                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                        No jobwork submitted yet. Launch a custom request directly from any product page.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200/80">
                            <h2 className="text-lg font-semibold text-slate-900">Due payments</h2>
                            <p className="text-xs text-slate-400">Awaiting confirmation</p>
                            <div className="mt-4 space-y-4">
                                {dueOrders.map((order) => (
                                    <div key={order.reference} className="rounded-2xl border border-slate-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-slate-800">{order.reference}</p>
                                            <span className="text-sm font-semibold text-slate-900">
                                                {currencyFormatter.format(order.total)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            Raised{' '}
                                            {order.placed_on
                                                ? new Date(order.placed_on).toLocaleDateString('en-IN', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : 'N/A'}
                                        </p>
                                    </div>
                                ))}
                                {dueOrders.length === 0 && (
                                    <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                                        No pending payments right now.
                                    </p>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

