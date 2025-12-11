import ApplicationLogo from '@/Components/ApplicationLogo';
import CustomerFooter from '@/Components/CustomerFooter';
import FlashMessage from '@/Components/FlashMessage';
import type { User } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { FormEvent, PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

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
    const page = usePage();
    const user = page.props.auth.user as User;
    const userType = (user?.type ?? '').toLowerCase();
    const isCustomer = ['retailer', 'wholesaler', 'sales'].includes(userType);
    const cart = (page.props as { cart?: { count?: number } }).cart;
    const cartCount = cart?.count ?? 0;
    const wishlist = (page.props as { wishlist?: { count?: number; product_ids?: number[] } }).wishlist;
    const wishlistCount = wishlist?.count ?? 0;
    const navigationData = (page.props as { navigation?: { categories?: any[]; catalogs?: any[]; brands?: any[] } }).navigation ?? {
        categories: [],
        catalogs: [],
        brands: [],
    };
    const currentUrl = page.url;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [language, setLanguage] = useState(user?.preferred_language ?? 'en');
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    useEffect(() => {
        if (!searchOpen) {
            return;
        }

        const timer = window.setTimeout(() => {
            searchInputRef.current?.focus();
        }, 120);

        return () => window.clearTimeout(timer);
    }, [searchOpen]);

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
            {
                label: 'Quotations',
                href: route('frontend.quotations.index'),
                active: route().current('frontend.quotations.*'),
            },
        ];
    }, [isCustomer]);

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

    const categoriesLinks = useMemo(
        () =>
            (navigationData.categories ?? []).map((category: any) => ({
                id: category.id,
                name: category.name,
                href: route('frontend.catalog.index', {
                    category: category.slug ?? category.id,
                }),
                image: category.cover_image_url ?? null,
            })),
        [navigationData.categories],
    );

    const catalogLinks = useMemo(
        () =>
            (navigationData.catalogs ?? []).map((catalog: any) => ({
                id: catalog.id,
                name: catalog.name,
                href: route('frontend.catalog.index', {
                    catalog: catalog.id,
                }),
            })),
        [navigationData.catalogs],
    );

    const primaryNav = useMemo(() => {
        const items: Array<
            | { type: 'link'; label: string; href: string; isActive?: boolean }
            | { type: 'mega'; label: string; items: Array<{ id: number; name: string; href: string; image?: string | null }> }
        > = [
            {
                type: 'link',
                label: 'Home',
                href: route('dashboard'),
                isActive: route().current('dashboard'),
            },
            {
                type: 'mega',
                label: 'Categories',
                items: categoriesLinks,
            },
            {
                type: 'mega',
                label: 'Catalog',
                items: catalogLinks,
            },
            {
                type: 'link',
                label: 'Contact us',
                href: 'mailto:support@elvee.in',
            },
        ];

        return items;
    }, [catalogLinks, categoriesLinks]);

    const accountLinks = useMemo(
        () => [
            { label: 'My quotations', href: route('frontend.quotations.index') },
            { label: 'My orders', href: route('frontend.orders.index') },
            { label: 'My profile', href: route('profile.edit') },
        ],
        [],
    );

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const term = searchTerm.trim();
        setSearchOpen(false);
        if (term.length === 0) {
            return;
        }

        router.get(route('frontend.catalog.index'), { search: term });
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            {isCustomer ? (
                <>
                    <header className="relative z-40 bg-white text-slate-900 shadow">
                        <div className="hidden border-b border-slate-100 bg-slate-900 text-xs text-white lg:block">
                            <div className="mx-auto flex max-w-[95rem] items-center justify-between px-4 py-2">
                                <div className="flex items-center gap-6 text-white">
                                    <a href="tel:+919988877665" className="flex items-center gap-2 text-white transition hover:text-feather-gold">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75l7.5 7.5a2.25 2.25 0 003.182 0l1.318-1.318a2.25 2.25 0 013.182 0l3.318 3.318" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 2.25l7.5 7.5" />
                                        </svg>
                                        <span>+91 99888 77665</span>
                                    </a>
                                    <a href="mailto:support@elvee.in" className="flex items-center gap-2 text-white transition hover:text-feather-gold">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75l7.5 6 7.5-6M4.5 18.75h15a.75.75 0 00.75-.75V6A1.5 1.5 0 0018.75 4.5H5.25A1.5 1.5 0 003.75 6v12a.75.75 0 00.75.75z" />
                                        </svg>
                                        <span>support@elvee.in</span>
                                    </a>
                                </div>
                                <div className="flex items-center gap-3 text-white/70">
                                    <span>Language</span>
                                    <select
                                        value={language}
                                        onChange={(event) => setLanguage(event.target.value)}
                                        className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white focus:border-white focus:outline-none"
                                    >
                                        <option value="en" className="text-slate-900">
                                            EN
                                        </option>
                                        <option value="hi" className="text-slate-900">
                                            Hindi
                                        </option>
                                        <option value="gu" className="text-slate-900">
                                            Gujarati
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="mx-auto flex max-w-[95rem] items-center justify-between px-4 py-4">
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
                                    onClick={() => setMobileMenuOpen(true)}
                                    aria-label="Open navigation"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <Link href={route('dashboard')} className="flex items-center gap-3">
                                    <ApplicationLogo className="h-10 w-10 text-slate-900" />
                        <span className="hidden text-lg font-semibold text-slate-900 sm:inline">
                                        Elvee
                                    </span>
                                </Link>
                            </div>
                            <nav className="hidden items-center gap-6 lg:flex">
                                {primaryNav.map((item) =>
                                    item.type === 'link' ? (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className={`text-sm font-semibold transition ${
                                                item.isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <div
                                            key={item.label}
                                            className="group relative"
                                            onMouseEnter={() => setOpenMenu(item.label)}
                                        >
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                                                onClick={() => setOpenMenu((prev) => (prev === item.label ? null : item.label))}
                                                onFocus={() => setOpenMenu(item.label)}
                                            >
                                                {item.label}
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                                    <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                            {(item.items.length > 0 || item.label === 'Brands') && (
                                                <div
                                                    className={`absolute left-1/2 z-30 mt-3 -translate-x-1/2 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl transition ${
                                                        item.label === 'Categories' || item.label === 'Catalog'
                                                            ? 'w-[38rem] lg:w-[46rem]'
                                                            : 'w-[28rem] lg:w-[32rem]'
                                                    } ${openMenu === item.label ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'}`}
                                                    onMouseEnter={() => setOpenMenu(item.label)}
                                                    onMouseLeave={() => setOpenMenu(null)}
                                                >
                                                    <div
                                                        className={`grid gap-3 ${
                                                            item.label === 'Categories' || item.label === 'Catalog'
                                                                ? 'sm:grid-cols-2 lg:grid-cols-3'
                                                                : 'sm:grid-cols-2'
                                                        }`}
                                                    >
                                                        {item.items.length > 0 ? (
                                                            item.items.map((link) =>
                                                                item.label === 'Categories' || item.label === 'Catalog' ? (
                                                                    <Link
                                                                        key={link.id}
                                                                        href={link.href}
                                                                        className="group/link relative overflow-hidden rounded-2xl border border-slate-100 bg-ivory p-5 transition hover:border-feather-gold hover:shadow-xl"
                                                                    >
                                                                        {link.image ? (
                                                                            <img
                                                                                src={link.image}
                                                                                alt={link.name}
                                                                                className="absolute inset-0 h-full w-full object-cover opacity-30 transition group-hover/link:opacity-40"
                                                                            />
                                                                        ) : null}
                                                                        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/80 to-white/60" />
                                                                        <div className="relative flex h-full flex-col justify-between">
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-slate-900">
                                                                                    {link.name}
                                                                                </p>
                                                                                <p className="mt-1 text-xs font-medium text-slate-500">
                                                                                    Explore now
                                                                                </p>
                                                                            </div>
                                                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition group-hover/link:border-feather-gold group-hover/link:text-feather-gold">
                                                                                →
                                                                            </span>
                                                                        </div>
                                                                    </Link>
                                                                ) : (
                                                                    <Link
                                                                        key={link.id}
                                                                        href={link.href}
                                                                        className="block rounded-2xl bg-ivory px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-feather-gold/10 hover:text-feather-gold"
                                                                    >
                                                                        {link.name}
                                                                    </Link>
                                                                ),
                                                            )
                                                        ) : (
                                                            <div className="px-4 py-3 text-sm text-slate-500">
                                                                No brands available
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ),
                                )}
                            </nav>
                            <div className="flex items-center gap-2.5 lg:gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSearchOpen(true);
                                    }}
                                    className="inline-flex h-7 w-7 items-center justify-center text-slate-600 transition hover:text-slate-900"
                                    aria-label="Search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                                    </svg>
                                </button>
                                <Link
                                    href={route('frontend.wishlist.index')}
                                    className="relative inline-flex h-7 w-7 items-center justify-center text-slate-600 transition hover:text-rose-600"
                                    aria-label="View wishlist"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill={wishlistCount > 0 ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        className="h-5 w-5"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 5.053 7.5 10.5 9 10.5s9-5.447 9-10.5z" />
                                    </svg>
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex min-h-[1.2rem] min-w-[1.2rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href={route('frontend.cart.index')}
                                    className="relative inline-flex h-7 w-7 items-center justify-center text-slate-600 transition hover:text-feather-gold"
                                    aria-label="View quotation list"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18l-1.5 11.25A2.25 2.25 0 0117.265 20.5H6.735a2.25 2.25 0 01-2.235-2.25L3 7z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5.5A2.5 2.5 0 0110.5 3h3A2.5 2.5 0 0116 5.5V7" />
                                    </svg>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex min-h-[1.2rem] min-w-[1.2rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                                <div className="relative hidden lg:block">
                                    <button
                                        type="button"
                                        onMouseEnter={() => setAccountMenuOpen(true)}
                                        onFocus={() => setAccountMenuOpen(true)}
                                        onBlur={() => setAccountMenuOpen(false)}
                                        onClick={() => setAccountMenuOpen((previous) => !previous)}
                                        className="inline-flex h-7 w-7 items-center justify-center text-slate-600 transition hover:text-slate-900"
                                        aria-label="Account menu"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
                                        </svg>
                                    </button>
                                    <div
                                        className={`absolute right-0 mt-3 w-56 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl transition ${
                                            accountMenuOpen ? 'visible opacity-100 pointer-events-auto' : 'invisible opacity-0 pointer-events-none'
                                        }`}
                                        onMouseEnter={() => setAccountMenuOpen(true)}
                                        onMouseLeave={() => setAccountMenuOpen(false)}
                                    >
                                        <p className="text-sm font-semibold text-slate-700">
                                            Hello, {user?.name?.split(' ')[0] ?? 'there'}
                                        </p>
                                        <div className="mt-3 space-y-0.5 text-sm text-slate-600">
                                            {accountLinks.map(({ label, href }) => (
                                                <Link
                                                    key={label}
                                                    href={href}
                                                    className="flex items-center justify-between px-0 py-2 font-medium text-slate-600 transition hover:text-feather-gold"
                                                >
                                                    <span>{label}</span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                        className="h-4 w-4"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            ))}
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="w-full px-0 py-2 text-left text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                                            >
                                                Logout
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
                                    onClick={() => setMobileMenuOpen(true)}
                                    aria-label="Open menu"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="border-t border-slate-100 bg-slate-900/5 px-6 py-2 text-xs text-slate-500 lg:hidden">
                            <div className="flex items-center justify-between">
                                <a href="tel:+919988877665" className="text-slate-600 hover:text-slate-900">
                                    +91 99888 77665
                                </a>
                                <select
                                    value={language}
                                    onChange={(event) => setLanguage(event.target.value)}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                                >
                                    <option value="en">English</option>
                                    <option value="hi">हिन्दी</option>
                                </select>
                            </div>
                        </div>
                    </header>
                    {searchOpen && (
                        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 px-4 pt-24">
                            <form onSubmit={handleSearchSubmit} className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
                                <div className="flex items-center gap-3">
                                    <input
                                        ref={searchInputRef}
                                        type="search"
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        placeholder="Search collections or SKU"
                                        className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                    />
                                    <button
                                        type="submit"
                                        className="rounded-full bg-elvee-blue px-4 py-2 text-sm font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy"
                                    >
                                        Search
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSearchOpen(false)}
                                        className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                    >
                                        Close
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    {mobileMenuOpen && (
                        <div className="fixed inset-0 z-50 flex">
                            <div className="h-full flex-1 bg-slate-900/50" onClick={() => setMobileMenuOpen(false)} />
                            <div className="flex h-full w-full max-w-xs flex-col bg-white p-6 shadow-2xl">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-700">Menu</p>
                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="rounded-full border border-slate-200 p-2 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                                        aria-label="Close menu"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="mt-6 space-y-4 overflow-y-auto">
                                    {primaryNav.map((item) =>
                                        item.type === 'link' ? (
                                            <Link
                                                key={item.label}
                                                href={item.href}
                                                className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-feather-gold hover:text-feather-gold"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <div key={item.label}>
                                                <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                                                <div
                                                    className={`mt-3 ${
                                                        item.label === 'Categories'
                                                            ? 'grid grid-cols-2 gap-3'
                                                            : 'grid gap-2'
                                                    }`}
                                                >
                                                    {item.items.map((link) =>
                                                        item.label === 'Categories' ? (
                                                            <Link
                                                                key={link.id}
                                                                href={link.href}
                                                                className="group relative h-28 overflow-hidden rounded-2xl border border-slate-200 bg-ivory p-4 text-sm font-semibold text-slate-700 hover:border-feather-gold hover:text-feather-gold"
                                                                onClick={() => setMobileMenuOpen(false)}
                                                            >
                                                                {link.image ? (
                                                                    <img
                                                                        src={link.image}
                                                                        alt={link.name}
                                                                        className="absolute inset-0 h-full w-full object-cover opacity-30 transition group-hover:opacity-40"
                                                                    />
                                                                ) : null}
                                                                <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/80 to-white/60" />
                                                                <span className="relative z-10">{link.name}</span>
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                key={link.id}
                                                                href={link.href}
                                                                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-feather-gold hover:text-feather-gold"
                                                                onClick={() => setMobileMenuOpen(false)}
                                                            >
                                                                {link.name}
                                                            </Link>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                                <div className="mt-6 border-t border-slate-200 pt-4">
                                    <p className="text-xs font-semibold text-slate-500">Account</p>
                                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                                        {accountLinks.map(({ label, href }) => (
                                            <Link
                                                key={label}
                                                href={href}
                                                className="block rounded-xl border border-slate-200 px-3 py-2 hover:border-feather-gold hover:text-feather-gold"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                {label}
                                            </Link>
                                        ))}
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className="w-full rounded-xl border border-rose-200 px-3 py-2 text-left text-rose-600 hover:border-rose-300 hover:text-rose-700"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Logout
                                        </Link>
                                    </div>
                                </div>
                                <div className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600">
                                    <a href="tel:+919988877665" className="block rounded-xl border border-slate-200 px-3 py-2 hover:border-feather-gold hover:text-feather-gold">
                                        +91 99888 77665
                                    </a>
                                    <a href="mailto:support@elvee.in" className="mt-2 block rounded-xl border border-slate-200 px-3 py-2 hover:border-feather-gold hover:text-feather-gold">
                                        support@elvee.in
                                    </a>
                                    <div className="mt-2">
                                        <label className="text-xs font-semibold text-slate-500">Language</label>
                                        <select
                                            value={language}
                                            onChange={(event) => setLanguage(event.target.value)}
                                            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20"
                                        >
                                            <option value="en">English</option>
                                            <option value="hi">हिन्दी</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <header className="relative z-40 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 text-white shadow-xl">
                        <div className="mx-auto flex max-w-[95rem] items-center justify-between px-4 py-4">
                            <div className="flex items-center gap-3">
                                <Link href="/" className="flex items-center gap-2">
                                    <ApplicationLogo className="h-10 w-10 text-white" />
                        <span className="hidden text-lg font-semibold text-white sm:inline">
                                        Elvee OS
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
                                                <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-feather-gold px-2 text-xs font-semibold text-white">
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
                                aria-label="Toggle menu"
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
                    </header>
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
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.label}
                                        {item.badge ? (
                                            <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-feather-gold px-2 text-xs font-semibold text-white">
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
                </>
            )}
            {header && (
                <div className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-[95rem] px-4 py-6">{header}</div>
                </div>
            )}

            <main className="relative z-0 flex-1">
                <div className="mx-auto max-w-[95rem] px-4 py-10 lg:py-12">
                    <FlashMessage />
                    {children}
                </div>
            </main>
            {isCustomer && <CustomerFooter className="mt-16" />}
        </div>
    );
}
