import { PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

const productionNavigation = [
    { label: 'Dashboard', route: 'production.dashboard', match: 'production.dashboard', icon: 'gauge' },
    { label: 'Work Orders', route: 'production.work-orders.index', match: 'production.work-orders.*', icon: 'workflow' },
];

const iconMap: Record<string, JSX.Element> = {
    gauge: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
        </svg>
    ),
    workflow: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h10M7 16h6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 6l2-2 2 2M15 18l2 2 2-2" />
        </svg>
    ),
};

export default function ProductionLayout({ children }: PropsWithChildren) {
    const { auth, flash } = usePage<PageProps>().props;
    const user = auth?.user;

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-800/60 bg-slate-900/70 px-4 py-6 backdrop-blur lg:flex">
                <div className="flex items-center gap-3 px-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-feather-gold text-slate-900 font-bold">
                        PR
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-100">Production Ops</p>
                        <p className="text-xs text-slate-400">Manufacturing Control</p>
                    </div>
                </div>

                <nav className="mt-8 space-y-1 text-sm">
                    {productionNavigation.map((item) => {
                        const isActive = route().current(item.match);
                        const icon = iconMap[item.icon];

                        return (
                            <Link
                                key={item.route}
                                href={route(item.route)}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition ${
                                    isActive
                                        ? 'bg-feather-gold text-slate-900 shadow shadow-feather-gold/30'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
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
                <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-6 py-4 backdrop-blur">
                    <div className="flex flex-col gap-2">
                        {flash?.success && (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-4 py-1 text-xs font-semibold text-emerald-300">
                                {flash.success}
                            </span>
                        )}
                        {flash?.error && (
                            <span className="inline-flex items-center rounded-full bg-rose-500/10 px-4 py-1 text-xs font-semibold text-rose-300">
                                {flash.error}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right text-xs text-slate-400">
                            <p className="text-sm font-semibold text-slate-100">{user?.name}</p>
                            <p>{user?.email}</p>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                        >
                            Logout
                        </Link>
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 lg:px-8">
                    <div className="mx-auto w-full max-w-6xl space-y-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
