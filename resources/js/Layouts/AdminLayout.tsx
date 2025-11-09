import { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

const adminNavigation = [
    { label: 'Overview', route: 'admin.dashboard', match: 'admin.dashboard', icon: 'grid' },
    { label: 'Customers', route: 'admin.users.index', match: 'admin.users.*', icon: 'users' },
    { label: 'Brands', route: 'admin.catalog.brands.index', match: 'admin.catalog.brands.*', icon: 'sparkle' },
    { label: 'Categories', route: 'admin.catalog.categories.index', match: 'admin.catalog.categories.*', icon: 'layers' },
    { label: 'Materials', route: 'admin.catalog.materials.index', match: 'admin.catalog.materials.*', icon: 'beaker' },
    { label: 'Products', route: 'admin.products.index', match: 'admin.products.*', icon: 'diamond' },
    { label: 'Orders', route: 'admin.orders.index', match: 'admin.orders.*', icon: 'clipboard' },
    { label: 'Offers', route: 'admin.offers.index', match: 'admin.offers.*', icon: 'tag' },
    { label: 'Rates', route: 'admin.rates.index', match: 'admin.rates.*', icon: 'activity' },
    { label: 'Payments', route: 'admin.settings.payments.edit', match: 'admin.settings.payments.*', icon: 'credit-card' },
];

const iconMap: Record<string, JSX.Element> = {
    grid: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3h-3a1.5 1.5 0 00-1.5 1.5v3a1.5 1.5 0 001.5 1.5h3A1.5 1.5 0 0011.25 7.5v-3A1.5 1.5 0 009.75 3zM17.25 3h-3A1.5 1.5 0 0012.75 4.5v3A1.5 1.5 0 0014.25 9h3A1.5 1.5 0 0018.75 7.5v-3A1.5 1.5 0 0017.25 3zM9.75 12h-3a1.5 1.5 0 00-1.5 1.5v3A1.5 1.5 0 006.75 18h3a1.5 1.5 0 001.5-1.5v-3A1.5 1.5 0 009.75 12zM17.25 12h-3a1.5 1.5 0 00-1.5 1.5v3a1.5 1.5 0 001.5 1.5h3a1.5 1.5 0 001.5-1.5v-3a1.5 1.5 0 00-1.5-1.5z" />
        </svg>
    ),
    users: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 10-8 0v2a4 4 0 008 0v-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
    ),
    sparkle: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19zM19 17l.75 2.25L22 20l-2.25.75L19 23l-.75-2.25L16 20l2.25-.75L19 17z" />
        </svg>
    ),
    layers: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5 9-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9 4.5 9-4.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5l9 4.5 9-4.5" />
        </svg>
    ),
    beaker: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12M9 3v6.75l-4.5 7.5A2 2 0 006.25 21h11.5a2 2 0 001.75-3.75L15 9.75V3" />
        </svg>
    ),
    diamond: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3l-4.5 6 9.75 12 9.75-12-4.5-6h-10.5z" />
        </svg>
    ),
    clipboard: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6a2 2 0 012 2v1h1a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V8a1 1 0 011-1h1V6a2 2 0 012-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6" />
        </svg>
    ),
    tag: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 11l8.586 8.586a2 2 0 002.828 0L21 11V5a2 2 0 00-2-2h-6L3 11z" />
        </svg>
    ),
    activity: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 12H18l-3 9-4-18-3 9H2" />
        </svg>
    ),
    'credit-card': (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="4.5" width="18" height="15" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M7.5 15h3" />
        </svg>
    ),
};

export default function AdminLayout({ children }: PropsWithChildren) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth?.user;

    return (
        <div className="flex min-h-screen bg-slate-100">
            <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white/95 px-4 py-6 shadow-lg shadow-slate-900/5 lg:flex">
                <div className="flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                        AC
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">AurumCraft Admin</p>
                        <p className="text-xs text-slate-400">Production & Retail Ops</p>
                    </div>
                </div>

                <nav className="mt-8 space-y-1 text-sm">
                    {adminNavigation.map((item) => {
                        const isActive = route().current(item.match);
                        const icon = iconMap[item.icon];

                        return (
                            <Link
                                key={item.route}
                                href={route(item.route)}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition ${
                                    isActive
                                        ? 'bg-slate-900 text-white shadow shadow-slate-900/20'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex w-full flex-col">
                <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
                    <div className="flex flex-col gap-2">
                        {flash?.success && (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold text-emerald-600">
                                {flash.success}
                            </span>
                        )}
                        {flash?.error && (
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-4 py-1 text-xs font-semibold text-rose-600">
                                {flash.error}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right text-xs text-slate-500">
                            <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                            <p>{user?.email}</p>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-400 hover:text-slate-800"
                        >
                            Logout
                        </Link>
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 lg:px-8">
                    <div className="mx-auto max-w-7xl space-y-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
