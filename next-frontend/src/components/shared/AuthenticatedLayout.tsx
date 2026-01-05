'use client';

import { FormEvent, PropsWithChildren, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import ApplicationLogo from '@/components/shared/ApplicationLogo';
import CustomerFooter from '@/components/shared/CustomerFooter';
import { route } from '@/utils/route';
import { getMediaUrlNullable } from '@/utils/mediaUrl';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchNavigationData } from '@/store/slices/navigationSlice';
import { fetchUser, logout } from '@/store/slices/authSlice';
import { toggleMobileMenu, toggleAccountMenu, toggleSearch, setSearchTerm, setOpenMenu, setMobileMenuOpen, setAccountMenuOpen, setSearchOpen, setLanguage } from '@/store/slices/uiSlice';
import { selectUser, selectAuthLoading, selectIsCustomer, selectIsKycApproved } from '@/store/selectors/authSelectors';
import { selectNavigationData } from '@/store/selectors/navigationSelectors';
import { selectWishlistCount } from '@/store/selectors/wishlistSelectors';
import { selectCartCount } from '@/store/selectors/cartSelectors';
import { selectMobileMenuOpen, selectAccountMenuOpen, selectSearchOpen, selectSearchTerm, selectOpenMenu, selectLanguage } from '@/store/selectors/uiSelectors';

type NavigationItem = {
    label: string;
    href: string;
    active: boolean;
    badge?: number;
};

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    
    // Get user and navigation from RTK store (using memoized selectors)
    const user = useAppSelector(selectUser);
    const loading = useAppSelector(selectAuthLoading);
    const navigationData = useAppSelector(selectNavigationData);
    
    // Get wishlist and cart counts from RTK store (using memoized selectors)
    const wishlistCount = useAppSelector(selectWishlistCount);
    const cartCount = useAppSelector(selectCartCount);

    // Get UI state from RTK store (using memoized selectors)
    const mobileMenuOpen = useAppSelector(selectMobileMenuOpen);
    const accountMenuOpen = useAppSelector(selectAccountMenuOpen);
    const searchOpen = useAppSelector(selectSearchOpen);
    const searchTerm = useAppSelector(selectSearchTerm);
    const openMenu = useAppSelector(selectOpenMenu);
    const language = useAppSelector(selectLanguage);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const accountMenuRef = useRef<HTMLDivElement>(null);
    const accountButtonRef = useRef<HTMLButtonElement>(null);

    // Use memoized selectors for derived state
    const isCustomer = useAppSelector(selectIsCustomer);
    const isKycApproved = useAppSelector(selectIsKycApproved);
    
    // Check if logout is in progress - if so, don't show user info in header
    const isLoggingOut = typeof window !== 'undefined' && (window as any).__isLoggingOut === true;
    
    // Keep userType for backward compatibility in other parts of the component
    // If logging out, treat as no user to prevent header from showing user info
    const userType = isLoggingOut ? '' : ((user?.type ?? '').toLowerCase());
    
    // If logging out, preserve current layout to prevent header from switching
    // This prevents the header from changing appearance during logout
    // Use a ref to remember the layout type before logout starts
    const layoutTypeRef = useRef<'customer' | 'admin' | null>(null);
    if (!isLoggingOut && isCustomer) {
        layoutTypeRef.current = 'customer';
    } else if (!isLoggingOut && !isCustomer && user) {
        layoutTypeRef.current = 'admin';
    }
    const effectiveIsCustomer = isLoggingOut 
        ? (layoutTypeRef.current === 'customer') 
        : isCustomer;

    // Fetch user on mount
    useEffect(() => {
        // Don't make API calls if logout is in progress
        if (typeof window !== 'undefined' && (window as any).__isLoggingOut === true) {
            return;
        }

        if (!user) {
            dispatch(fetchUser()).catch(() => {
                // Don't redirect if logout is in progress
                if (typeof window !== 'undefined' && (window as any).__isLoggingOut === true) {
                    return;
                }
                // Don't redirect to login if we're on KYC onboarding page (user just registered)
                if (pathname === '/onboarding/kyc' || pathname?.startsWith('/onboarding/kyc')) {
                    return;
                }
                router.push('/login');
            });
        }
    }, [dispatch, router, user]);

    // Fetch navigation data (categories, catalogs, brands) via RTK
    useEffect(() => {
        // Don't make API calls if logout is in progress
        if (typeof window !== 'undefined' && (window as any).__isLoggingOut === true) {
            return;
        }

        // Don't fetch navigation if on onboarding page
        if (pathname === '/onboarding/kyc') {
            return;
        }

        // Check if user is a customer and KYC approved
        if (!isCustomer || !user || !isKycApproved) {
            return;
        }

        // Fetch navigation data via RTK
        dispatch(fetchNavigationData());
    }, [dispatch, user, pathname, isCustomer, isKycApproved]);

    useEffect(() => {
        if (!searchOpen) {
            return;
        }

        const timer = window.setTimeout(() => {
            searchInputRef.current?.focus();
        }, 120);

        return () => window.clearTimeout(timer);
    }, [searchOpen]);

    // Close account menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (
                accountMenuOpen &&
                accountMenuRef.current &&
                accountButtonRef.current &&
                !accountMenuRef.current.contains(event.target as Node) &&
                !accountButtonRef.current.contains(event.target as Node)
            ) {
                dispatch(setAccountMenuOpen(false));
            }
        };

        if (accountMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [accountMenuOpen, dispatch]);

    const customerNav = useMemo<NavigationItem[]>(() => {
        if (!isCustomer) {
            return [];
        }

        return [
            {
                label: 'Dashboard',
                href: route('dashboard'),
                active: pathname === '/dashboard',
            },
            {
                label: 'Quotations',
                href: route('frontend.quotations.index'),
                active: pathname.startsWith('/quotations'),
            },
        ];
    }, [isCustomer, pathname]);

    const adminNav: NavigationItem[] =
        userType && ['admin', 'super-admin'].includes(userType)
            ? [
                  {
                      label: 'Admin',
                      href: route('admin.dashboard'),
                      active: pathname.startsWith('/admin'),
                  },
              ]
            : [];

    const productionNav: NavigationItem[] =
        userType && ['production', 'super-admin'].includes(userType)
            ? [
                  {
                      label: 'Production',
                      href: route('production.dashboard'),
                      active: pathname.startsWith('/production'),
                  },
              ]
            : [];

    const navigation = [...customerNav, ...adminNav, ...productionNav];


    const categoriesLinks = useMemo(
        () =>
            (navigationData.categories ?? []).map((category: any) => {
                // Use category ID as the filter value (categories don't have slugs in DB)
                return {
                id: category.id,
                name: category.name,
                    href: `${route('frontend.catalog.index')}?category=${encodeURIComponent(category.id)}`,
                    image: category.cover_image_url ? getMediaUrlNullable(category.cover_image_url) : null,
                };
                }),
        [navigationData.categories],
    );

    const catalogLinks = useMemo(
        () =>
            (navigationData.catalogs ?? []).map((catalog: any) => ({
                id: catalog.id,
                name: catalog.name,
                href: `${route('frontend.catalog.index')}?catalog=${encodeURIComponent(catalog.id)}`,
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
                isActive: pathname === '/dashboard',
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
    }, [catalogLinks, categoriesLinks, pathname]);

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
        dispatch(setSearchOpen(false));
        if (term.length === 0) {
            return;
        }

        router.push(`${route('frontend.catalog.index')}?search=${encodeURIComponent(term)}`);
    };

    const handleLogout = async () => {
        await dispatch(logout());
        // Redirect is handled by authService.logout() inside the RTK action
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-100">
            {effectiveIsCustomer ? (
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
                        <div className="mx-auto flex max-w-[95rem] items-center justify-between px-3 py-3 sm:px-4 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                <Link href={route('dashboard')} className="flex items-center gap-2 sm:gap-3">
                                    <ApplicationLogo className="h-8 w-8 text-slate-900 sm:h-10 sm:w-10" />
                                    <span className="hidden text-base font-semibold text-slate-900 sm:inline sm:text-lg">
                                        Elvee
                                    </span>
                                </Link>
                            </div>
                            <nav className="hidden items-center gap-4 lg:flex lg:gap-6">
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
                                            onMouseEnter={() => dispatch(setOpenMenu(item.label))}
                                        >
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
                                                onClick={() => dispatch(setOpenMenu(openMenu === item.label ? null : item.label))}
                                                onFocus={() => dispatch(setOpenMenu(item.label))}
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
                                                    onMouseEnter={() => dispatch(setOpenMenu(item.label))}
                                                    onMouseLeave={() => dispatch(setOpenMenu(null))}
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
                            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        dispatch(setSearchTerm(''));
                                        dispatch(setSearchOpen(true));
                                    }}
                                    className="inline-flex h-6 w-6 items-center justify-center text-slate-600 transition hover:text-slate-900 sm:h-7 sm:w-7"
                                    aria-label="Search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 sm:h-5 sm:w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                                    </svg>
                                </button>
                                <Link
                                    href={route('frontend.wishlist.index')}
                                    className="relative inline-flex h-6 w-6 items-center justify-center text-slate-600 transition hover:text-rose-600 sm:h-7 sm:w-7"
                                    aria-label="View wishlist"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill={wishlistCount > 0 ? 'currentColor' : 'none'}
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        className="h-4 w-4 sm:h-5 sm:w-5"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 5.053 7.5 10.5 9 10.5s9-5.447 9-10.5z" />
                                    </svg>
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-semibold text-white sm:-top-1 sm:-right-1 sm:min-h-[1.2rem] sm:min-w-[1.2rem] sm:px-1 sm:text-[10px]">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    href={route('frontend.cart.index')}
                                    className="relative inline-flex h-6 w-6 items-center justify-center text-slate-600 transition hover:text-feather-gold sm:h-7 sm:w-7"
                                    aria-label="View cart"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 sm:h-5 sm:w-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18l-1.5 11.25A2.25 2.25 0 0117.265 20.5H6.735a2.25 2.25 0 01-2.235-2.25L3 7z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5.5A2.5 2.5 0 0110.5 3h3A2.5 2.5 0 0116 5.5V7" />
                                    </svg>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-semibold text-white sm:-top-1 sm:-right-1 sm:min-h-[1.2rem] sm:min-w-[1.2rem] sm:px-1 sm:text-[10px]">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                                <div className="relative" ref={accountMenuRef}>
                                    <button
                                        ref={accountButtonRef}
                                        type="button"
                                        onMouseEnter={() => {
                                            // Only auto-open on hover for desktop (not touch devices)
                                            if (window.matchMedia('(hover: hover)').matches) {
                                                dispatch(setAccountMenuOpen(true));
                                            }
                                        }}
                                        onFocus={() => dispatch(setAccountMenuOpen(true))}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(toggleAccountMenu());
                                        }}
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 sm:h-7 sm:w-7"
                                        aria-label="Account menu"
                                        aria-expanded={accountMenuOpen}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 sm:h-5 sm:w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
                                        </svg>
                                    </button>
                                    <div
                                        className={`absolute right-0 z-[60] mt-1.5 w-48 origin-top-right rounded-xl border border-slate-200 bg-white p-3 shadow-2xl ring-1 ring-black/5 transition-all duration-200 ease-out sm:mt-2 sm:w-56 sm:rounded-2xl sm:p-4 ${
                                            accountMenuOpen 
                                                ? 'visible scale-100 opacity-100 pointer-events-auto' 
                                                : 'invisible scale-95 opacity-0 pointer-events-none'
                                        }`}
                                        onMouseEnter={() => {
                                            if (window.matchMedia('(hover: hover)').matches) {
                                                dispatch(setAccountMenuOpen(true));
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            if (window.matchMedia('(hover: hover)').matches) {
                                                dispatch(setAccountMenuOpen(false));
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <p className="text-xs font-semibold text-slate-700 sm:text-sm">
                                            Hello, {isLoggingOut ? 'there' : (user?.name?.split(' ')[0] ?? 'there')}
                                        </p>
                                        <div className="mt-2 space-y-0.5 text-xs text-slate-600 sm:mt-3 sm:text-sm">
                                            {accountLinks.map(({ label, href }) => (
                                                <Link
                                                    key={label}
                                                    href={href}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dispatch(setAccountMenuOpen(false));
                                                    }}
                                                    className="flex items-center justify-between rounded-lg px-2 py-1.5 font-medium text-slate-600 transition hover:bg-slate-50 hover:text-feather-gold active:bg-slate-100 sm:px-0 sm:py-2"
                                                >
                                                    <span>{label}</span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            ))}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    dispatch(setAccountMenuOpen(false));
                                                    handleLogout();
                                                }}
                                                className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100 sm:px-0 sm:py-2 sm:text-sm"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center rounded-full border border-slate-200 p-1.5 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:p-2 lg:hidden"
                                    onClick={() => dispatch(toggleMobileMenu())}
                                    aria-label="Toggle menu"
                                >
                                    {mobileMenuOpen ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </header>
                    {/* Mobile Menu Drawer */}
                    {mobileMenuOpen && (
                        <div className="fixed inset-0 z-50 lg:hidden">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => dispatch(setMobileMenuOpen(false))}
                            />
                            {/* Menu Panel */}
                            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl">
                                <div className="flex h-full flex-col">
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                                        <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
                                        <button
                                            type="button"
                                            onClick={() => dispatch(setMobileMenuOpen(false))}
                                            className="inline-flex items-center justify-center rounded-full p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                            aria-label="Close menu"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    {/* Navigation Links */}
                                    <nav className="flex-1 overflow-y-auto px-4 py-6">
                                        <div className="space-y-1">
                                            {primaryNav.map((item) =>
                                                item.type === 'link' ? (
                                                    <Link
                                                        key={item.label}
                                                        href={item.href}
                                                        onClick={() => dispatch(setMobileMenuOpen(false))}
                                                        className={`block rounded-lg px-4 py-3 text-sm font-semibold transition ${
                                                            item.isActive
                                                                ? 'bg-elvee-blue/10 text-elvee-blue'
                                                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                ) : (
                                                    <div key={item.label} className="space-y-1">
                                                        <div className="px-4 py-2 text-sm font-semibold text-slate-700">
                                                            {item.label}
                                                        </div>
                                                        {item.items.map((subItem) => (
                                                            <Link
                                                                key={subItem.id}
                                                                href={subItem.href}
                                                                onClick={() => dispatch(setMobileMenuOpen(false))}
                                                                className="block rounded-lg px-6 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                                                            >
                                                                {subItem.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                    {searchOpen && (
                        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 px-2 pt-16 sm:px-4 sm:pt-24">
                            <form onSubmit={handleSearchSubmit} className="w-full max-w-xl rounded-2xl bg-white p-3 shadow-2xl sm:rounded-3xl sm:p-6">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                    <input
                                        ref={searchInputRef}
                                        type="search"
                                        value={searchTerm}
                                        onChange={(event) => dispatch(setSearchTerm(event.target.value))}
                                        placeholder="Search collections or SKU"
                                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:border-feather-gold focus:outline-none focus:ring-2 focus:ring-feather-gold/20 sm:rounded-2xl sm:px-4 sm:py-3"
                                    />
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <button
                                            type="submit"
                                            className="flex-1 rounded-full bg-elvee-blue px-4 py-2.5 text-xs font-semibold text-white shadow-elvee-blue/30 transition hover:bg-navy active:scale-[0.98] sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                                        >
                                            Search
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => dispatch(setSearchOpen(false))}
                                            className="rounded-full border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] sm:px-3 sm:py-2 sm:text-sm"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </form>
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
                                    <p className="font-semibold text-white">{isLoggingOut ? '' : (user?.name || '')}</p>
                                    <p className="text-slate-200/80">{isLoggingOut ? '' : (user?.email || '')}</p>
                                </div>
                                <Link
                                    href={route('profile.edit')}
                                    className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
                                >
                                    Log out
                                </button>
                            </div>

                            <button
                                type="button"
                                className="inline-flex items-center rounded-full border border-white/20 p-2 text-white transition hover:bg-white/20 lg:hidden"
                                onClick={() => dispatch(toggleMobileMenu())}
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
                </>
            )}
            {header && (
                <div className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-[95rem] px-4 py-6">{header}</div>
                </div>
            )}

            <main className="relative z-0 flex-1">
                <div className="mx-auto max-w-[95rem] px-2 py-10 sm:px-4 lg:py-12">
                    {children}
                </div>
            </main>
            {isCustomer && <CustomerFooter className="mt-16" />}
        </div>
    );
}

