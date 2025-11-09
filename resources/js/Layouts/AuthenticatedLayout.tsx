import ApplicationLogo from '@/Components/ApplicationLogo';
import FlashMessage from '@/Components/FlashMessage';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useMemo, useState } from 'react';

type NavigationItem = {
    label: string;
    href: string;
    active: boolean;
    badge?: number;
};

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user as {
        name: string;
        email: string;
        type?: string;
    };
    const userType = (user?.type ?? '').toLowerCase();
    const isCustomer = ['retailer', 'wholesaler', 'sales'].includes(userType);
    const cart = (usePage().props as { cart?: { count?: number } }).cart;
    const cartCount = cart?.count ?? 0;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const customerNav = useMemo<NavigationItem[]>(() => {
        if (!isCustomer) {
            return [];
        }

        return [
            {
                label: 'Dashboard',
                href: route('dashboard'),
                active: route().current('dashboard'),
            },
        ];
    }, [isCustomer]);

    const retailQuickTabs = useMemo<NavigationItem[]>(() => {
        if (!isCustomer) {
            return [];
        }

        return [
            {
                label: 'Jewellery Purchase',
                href: route('frontend.catalog.index'),
                active:
                    route().current('frontend.catalog.*') ||
                    route().current('frontend.cart.*') ||
                    route().current('frontend.checkout.*'),
                badge: cartCount > 0 ? cartCount : undefined,
            },
            {
                label: 'Job Work',
                href: route('frontend.jobwork.index'),
                active: route().current('frontend.jobwork.*'),
            },
        ];
    }, [cartCount, isCustomer]);

    const adminNav: NavigationItem[] =
        userType && ['admin', 'super-admin'].includes(userType)
            ? [
                  {
                      label: 'Admin',
                      href: route('admin.dashboard'),
                      active: route().current('admin.*'),
                  },
              ]
            : [];

    const productionNav: NavigationItem[] =
        userType && ['production', 'super-admin'].includes(userType)
            ? [
                  {
                      label: 'Production',
                      href: route('production.dashboard'),
                      active: route().current('production.*'),
                  },
              ]
            : [];

    const navigation = [...customerNav, ...adminNav, ...productionNav];

    return (
        <div className="min-h-screen bg-slate-100">
            <header className="relative z-40 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 text-white shadow-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2">
                            <ApplicationLogo className="h-10 w-10 text-white" />
                            <span className="hidden text-lg font-semibold tracking-wide text-white sm:inline">
                                AurumCraft OS
                            </span>
                        </Link>
                        <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 shadow-inner lg:flex">
                            {navigation.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${
                                        item.active
                                            ? 'bg-white text-slate-900 shadow-lg'
                                            : 'text-slate-200 hover:bg-white/20 hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                    {item.badge ? (
                                        <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-sky-500 px-2 text-xs font-semibold text-white">
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="hidden items-center gap-4 lg:flex">
                        <div className="text-right text-sm">
                            <p className="font-semibold text-white">{user?.name}</p>
                            <p className="text-slate-200/80">{user?.email}</p>
                        </div>
                        <Link
                            href={route('profile.edit')}
                            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                        >
                            Profile
                        </Link>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
                        >
                            Log out
                        </Link>
                    </div>

                    <button
                        type="button"
                        className="inline-flex items-center rounded-full border border-white/20 p-2 text-white transition hover:bg-white/20 lg:hidden"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-6 w-6"
                        >
                            <path
                                fillRule="evenodd"
                                d="M3.75 5.25a.75.75 0 01.75-.75h15a.75.75 0 010 1.5H4.5a.75.75 0 01-.75-.75zm0 6.75a.75.75 0 01.75-.75h15a.75.75 0 010 1.5H4.5a.75.75 0 01-.75-.75zm0 6.75a.75.75 0 01.75-.75h15a.75.75 0 010 1.5H4.5a.75.75 0 01-.75-.75z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="border-t border-white/10 bg-slate-950/80 px-6 pb-6 lg:hidden">
                        <nav className="flex flex-col gap-2 py-4">
                            {navigation.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`relative rounded-xl px-4 py-3 text-base font-medium transition ${
                                        item.active
                                            ? 'bg-white text-slate-900 shadow-lg'
                                            : 'text-slate-100 hover:bg-white/10'
                                    }`}
                                >
                                    {item.label}
                                    {item.badge ? (
                                        <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-sky-500 px-2 text-xs font-semibold text-white">
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </Link>
                            ))}
                        </nav>
                        <div className="space-y-2 rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
                            <p className="font-semibold text-white">{user?.name}</p>
                            <p className="text-slate-300">{user?.email}</p>
                            <div className="flex gap-3 pt-3">
                                <Link
                                    href={route('profile.edit')}
                                    className="flex-1 rounded-full border border-white/30 px-4 py-2 text-center"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Profile
                                </Link>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex-1 rounded-full bg-white/90 px-4 py-2 text-center font-semibold text-slate-900"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Log out
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {header && (
                <div className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">{header}</div>
                </div>
            )}

            <main className="relative z-0">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-12">
                    <FlashMessage />
                    {retailQuickTabs.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-3">
                            {retailQuickTabs.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                                        item.active
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    {item.label}
                                    {item.badge ? (
                                        <span className="inline-flex items-center justify-center rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-white">
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </Link>
                            ))}
                        </div>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}
