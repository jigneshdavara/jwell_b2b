'use client';

import { useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/shared/CustomerHeader';
import CustomerFooter from '@/components/shared/CustomerFooter';
import { route } from '@/utils/route';
import { homeService } from '@/services/homeService';
import { authService } from '@/services/authService';
import { formatCurrency, formatNumber, prettifyKey } from '@/utils/formatting';
import type { HomePageProps } from '@/types';


// Default features (always available, matching Laravel)
const defaultFeatures = [
    {
        title: 'Live Bullion & Diamond Pricing',
        description: 'Lock rates in seconds with automated hedging notifications and daily market snapshots.',
    },
    {
        title: 'Collaborative Jobwork',
        description: 'Track incoming material, production stages, QC, and dispatch in one shared workflow.',
    },
    {
        title: 'Personalised Offers',
        description: 'Segment retailers vs wholesalers, push promotions, and monitor ROI on every campaign.',
    },
];

export default function HomeIndex() {
    const [data, setData] = useState<HomePageProps | null>({
        stats: { products: 0, orders: 0, jobworks: 0, active_offers: 0 },
        brands: [],
        spotlight: [],
        features: defaultFeatures,
    });
    const [loading, setLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Set page title (like Laravel's Head component)
        document.title = 'Elvee B2B Jewellery OS';
    }, []);

    useEffect(() => {
        // Check authentication - only check token (no user storage)
        const checkAuth = async () => {
            if (typeof window === 'undefined') return false;
            
            // Don't redirect if logout is in progress
            if ((window as any).__isLoggingOut === true) {
                return false;
            }
            
            const { tokenService } = await import('@/services/tokenService');
            return tokenService.hasToken();
        };

        // If authenticated, check user type and redirect to appropriate dashboard
        // Use a small delay to prevent redirect loop if user just logged out
        checkAuth().then(async (isAuth) => {
            if (isAuth && !redirecting) {
                // Small delay to ensure logout redirect completes first
                setTimeout(async () => {
                    // Double-check token still exists and we're not logging out
                    if (typeof window === 'undefined') return;
                    
                    const { tokenService } = require('@/services/tokenService');
                    const stillLoggingOut = (window as any).__isLoggingOut === true;
                    
                    // Only redirect if:
                    // 1. Token still exists
                    // 2. Not already redirecting
                    // 3. Not in the middle of logout
                    if (tokenService.hasToken() && !redirecting && !stillLoggingOut) {
                        try {
                            // Fetch user data to determine user type
                            const userResponse = await authService.me();
                            const user = userResponse.data;
                            const userType = (user?.type || '').toLowerCase();
                            
                            setRedirecting(true);
                            
                            // Redirect based on user type
                            if (['admin', 'super-admin'].includes(userType)) {
                                router.push(route('admin.dashboard'));
                            } else if (userType === 'production') {
                                router.push(route('production.dashboard'));
                            } else {
                                // Customer (retailer, wholesaler, sales) or default
                                router.push(route('dashboard'));
                            }
                        } catch (error) {
                            // If fetching user fails, redirect to login
                            console.error('Failed to fetch user data:', error);
                            router.push(route('login'));
                        }
                    }
                }, 300);
            }
        });

        // Load home page data for unauthenticated users
        const loadData = async () => {
            try {
                const response = await homeService.getHomeData();
                if (response.data) {
                    // Convert spotlight IDs from string to number for consistency
                    const spotlight = response.data.spotlight.map((item: any) => ({
                        ...item,
                        id: typeof item.id === 'string' ? parseInt(item.id, 10) : item.id,
                    }));
                    setData({
                        ...response.data,
                        spotlight,
                    });
                }
            } catch (error) {
                console.error('Failed to load home page data:', error);
                // Keep default data, just update with empty stats/brands/spotlight
                setData((prev) => ({
                    ...prev!,
                    stats: { products: 0, orders: 0, jobworks: 0, active_offers: 0 },
                    brands: [],
                    spotlight: [],
                }));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [router]);

    const headerLinks = [
        { label: 'Solutions', href: '#solutions' },
        { label: 'Partners', href: '#partners' },
        { label: 'Jobwork', href: '#jobwork' },
        { label: 'Stories', href: '#stories' },
    ];

    const personaHighlights: Array<{ title: string; detail: string; icon: ReactNode }> = [
        {
            title: 'Retailers',
            detail: 'Curated retail drops, clear delivery timelines, and concierge-grade visibility.',
            icon: (
                <svg className="h-6 w-6 text-feather-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 9h16l-1.5 11h-13Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 9V5h14v4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 13h6" />
                </svg>
            ),
        },
        {
            title: 'Wholesalers',
            detail: 'Lock bullion rates, manage credit, and track every milestone with confidence.',
            icon: (
                <svg className="h-6 w-6 text-feather-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M10 8h4a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h4" strokeLinecap="round" />
                    <path d="M12 6v12" strokeLinecap="round" />
                </svg>
            ),
        },
        {
            title: 'Jobworkers',
            detail: 'Share briefs, receive production inputs, and sync dispatches with ERP timelines.',
            icon: (
                <svg className="h-6 w-6 text-feather-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
                    <path d="M9 13h6" />
                    <path d="M9 17h6" />
                </svg>
            ),
        },
    ];

    const ArrowRightIcon = () => (
        <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 8h10" strokeLinecap="round" strokeLinejoin="round" />
            <path d="m9.5 4.5 3.5 3.5-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    const SparkIcon = () => (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 2v4" strokeLinecap="round" />
            <path d="M10 14v4" strokeLinecap="round" />
            <path d="M3.757 5.757 6.343 8.343" strokeLinecap="round" />
            <path d="M13.657 12.657 16.243 15.243" strokeLinecap="round" />
            <path d="M2 10h4" strokeLinecap="round" />
            <path d="M14 10h4" strokeLinecap="round" />
            <path d="M3.757 14.243 6.343 11.657" strokeLinecap="round" />
            <path d="M13.657 7.343 16.243 4.757" strokeLinecap="round" />
        </svg>
    );

    if (redirecting) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-ivory">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-ivory">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
            </div>
        );
    }

    const stats = data?.stats ?? { products: 0, orders: 0, jobworks: 0, active_offers: 0 };
    const brands = data?.brands ?? [];
    const spotlight = data?.spotlight ?? [];
    const features = data?.features ?? [];

    return (
        <div className="min-h-screen bg-ivory text-ink">
            <CustomerHeader
                navLinks={headerLinks}
                primaryCta={{ label: 'Request access', href: route('register') }}
                secondaryCta={{ label: 'Sign in', href: route('login') }}
                tagline=""
            />

            <section className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-white via-ivory to-feather-gold/5" />
                    <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-feather-gold/20 blur-3xl" />
                    <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-elvee-blue/10 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-1 pb-12 pt-8 sm:gap-12 sm:px-6 sm:pb-16 sm:pt-12 lg:flex-row lg:items-center lg:gap-16 lg:px-10 lg:pb-24 lg:pt-16">
                    <div className="max-w-2xl space-y-6 sm:space-y-8">
                        <p className="inline-flex items-center gap-2 rounded-full bg-feather-gold/10 px-3 py-1 text-[10px] font-semibold tracking-[0.3em] text-feather-gold sm:px-4 sm:text-xs">
                            ELVEE SUITE
                        </p>
                        <h1 className="text-2xl font-semibold text-elvee-blue sm:text-4xl lg:text-5xl xl:text-6xl">
                            White-glove commerce for luxury retailers & wholesale partners.
                        </h1>
                        <p className="text-sm text-ink/80 sm:text-base">
                            Present elevated collections, lock live rates, manage jobwork, and keep every retail partner informed without leaving one secure platform.
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                            <Link href={route('login')} className="btn-primary gap-2 text-xs sm:text-sm">
                                <span>Sign in to your workspace</span>
                                <ArrowRightIcon />
                            </Link>
                            <Link href={route('register')} className="btn-secondary gap-2 text-xs sm:text-sm">
                                <SparkIcon />
                                <span>Request partner access</span>
                            </Link>
                        </div>

                        <div className="grid gap-3 pt-6 sm:grid-cols-2 sm:gap-4 sm:pt-8">
                            {Object.entries(stats).map(([key, value]) => (
                                <div key={key} className="rounded-2xl border border-elvee-blue/10 bg-white/80 p-4 shadow-lg shadow-elvee-blue/5 sm:p-5">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/60 sm:text-xs">{prettifyKey(key)}</p>
                                    <p className="mt-2 text-2xl font-semibold text-elvee-blue sm:mt-3 sm:text-3xl">{formatNumber(value)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full max-w-xl space-y-4 rounded-3xl bg-white p-4 shadow-2xl shadow-elvee-blue/10 ring-1 ring-elvee-blue/10 sm:space-y-6 sm:p-6 lg:p-8">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-ink/60 sm:text-sm">Featured Drops</h2>
                        <div className="space-y-3 sm:space-y-4">
                            {spotlight.map((product) => (
                                <div key={product.id} className="rounded-2xl border border-elvee-blue/10 bg-ivory/60 p-4 transition hover:border-feather-gold/40 hover:bg-white sm:p-5">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-elvee-blue sm:text-base">{product.name}</p>
                                            <p className="text-[10px] uppercase tracking-[0.3em] text-ink/50 sm:text-xs">
                                                {product.brand ?? 'Signature Collection'}
                                            </p>
                                        </div>
                                        <div className="text-left text-xs text-ink/80 sm:text-right sm:text-sm">
                                            <p>{formatCurrency(product.price)}</p>
                                            <p className="text-[10px] text-ink/60 sm:text-xs">
                                                {(() => {
                                                    const types = product.making_charge_types || [];
                                                    const hasFixed = types.includes('fixed') && product.making_charge_amount && product.making_charge_amount > 0;
                                                    const hasPercentage = types.includes('percentage') && product.making_charge_percentage && product.making_charge_percentage > 0;
                                                    
                                                    if (hasFixed && hasPercentage) {
                                                        return `Making: ₹${product.making_charge_amount?.toLocaleString('en-IN')} + ${product.making_charge_percentage}%`;
                                                    } else if (hasFixed) {
                                                        return `Making: ${formatCurrency(product.making_charge_amount)}`;
                                                    } else if (hasPercentage) {
                                                        return `Making: ${product.making_charge_percentage}% of metal`;
                                                    }
                                                    return `Making: ${formatCurrency(product.making_charge_amount)}`;
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <main className="space-y-12 bg-white/80 py-12 sm:space-y-16 sm:py-16 lg:space-y-24 lg:py-24">
                <section className="mx-auto max-w-6xl px-1 sm:px-6 lg:px-10" id="solutions">
                    <div className="mb-6 flex flex-col gap-3 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-feather-gold sm:text-xs">Who we serve</p>
                            <h2 className="text-xl font-semibold text-elvee-blue sm:text-2xl">Tailored workflows for each partner segment</h2>
                        </div>
                        <div className="text-xs text-ink/70 sm:text-sm lg:max-w-sm">
                            From retail storefronts to jobworkers, Elvee adapts onboarding, catalogues, and approvals to the way your network operates.
                        </div>
                    </div>
                    <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                        {personaHighlights.map((persona) => (
                            <div
                                key={persona.title}
                                className="rounded-3xl border border-elvee-blue/10 bg-white p-4 shadow-lg shadow-elvee-blue/5 transition hover:-translate-y-1 hover:shadow-2xl sm:p-6"
                            >
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-feather-gold/40 bg-feather-gold/15 sm:mb-4 sm:h-12 sm:w-12">
                                    {persona.icon}
                                </div>
                                <h3 className="text-base font-semibold text-elvee-blue sm:text-lg">{persona.title}</h3>
                                <p className="mt-2 text-xs text-ink/70 sm:text-sm">{persona.detail}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-1 sm:px-6 lg:px-10" id="partners">
                    <h2 className="text-xl font-semibold text-elvee-blue sm:text-2xl">Why partners choose Elvee</h2>
                    <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.title} className="rounded-3xl border border-elvee-blue/10 bg-ivory/60 p-4 shadow-inner shadow-white sm:p-6">
                                <div className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/50 sm:px-3 sm:text-xs">
                                    FEATURE
                                </div>
                                <h3 className="mt-3 text-base font-semibold text-elvee-blue sm:mt-4 sm:text-lg">{feature.title}</h3>
                                <p className="mt-2 text-xs text-ink/70 sm:text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {brands.length > 0 && (
                    <section className="bg-ivory py-12 sm:py-16">
                        <div className="mx-auto max-w-5xl px-1 text-center sm:px-6 lg:px-10">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-ink/60 sm:text-xs">Trusted by leading houses</p>
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-ink/70 sm:mt-8 sm:gap-6 sm:text-sm">
                                {brands.map((brand) => (
                                    <span key={brand} className="rounded-full border border-elvee-blue/10 bg-white px-4 py-1.5 sm:px-5 sm:py-2">
                                        {brand}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section className="mx-auto max-w-6xl px-1 sm:px-6 lg:px-10" id="jobwork">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-elvee-blue via-navy to-slate-900 p-6 text-white shadow-[0_25px_60px_-20px_rgba(10,30,70,0.7)] sm:p-8 lg:p-10">
                        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%)] blur-3xl lg:block" />
                        <div className="relative z-10 flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
                            <div className="max-w-xl space-y-3 sm:space-y-4">
                                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-feather-gold sm:px-4 sm:text-xs">
                                    Experience it live
                                </p>
                                <h2 className="text-xl font-semibold leading-tight sm:text-2xl lg:text-3xl">
                                    Bring retail partners closer with immersive catalogues, bullion controls, and production intelligence.
                                </h2>
                                <p className="text-xs text-white/80 sm:text-sm">
                                    From bullion hedging to dispatch updates, Elvee keeps every stakeholder aligned with tasteful, high-trust interfaces.
                                </p>
                                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                                    {[
                                        { label: 'Live demo', value: '5 mins', sub: 'Guided walkthrough' },
                                        { label: 'Avg. onboarding', value: '48 hrs', sub: 'Retail partners' },
                                        { label: 'Support', value: '24/7', sub: 'Concierge desk' },
                                    ].map((metric) => (
                                        <div key={metric.label} className="rounded-2xl bg-white/5 p-3 text-xs sm:p-4 sm:text-sm">
                                            <p className="text-[10px] uppercase tracking-[0.3em] text-white/70 sm:text-xs">{metric.label}</p>
                                            <p className="mt-1 text-xl font-semibold text-white sm:text-2xl">{metric.value}</p>
                                            <p className="text-[10px] text-white/70 sm:text-xs">{metric.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 text-slate-900 lg:min-w-[320px]">
                                <Link
                                    href={route('login')}
                                    className="flex items-center justify-between rounded-2xl bg-white/90 px-4 py-2.5 text-xs font-semibold text-elvee-blue shadow-lg shadow-navy/30 transition hover:bg-white sm:px-5 sm:py-3 sm:text-sm"
                                >
                                    <span>Explore the live demo</span>
                                    <span className="rounded-full bg-elvee-blue px-2 py-1 text-[10px] text-white sm:text-xs">5 min tour</span>
                                </Link>
                                <a
                                    href="mailto:onboarding@elvee.in"
                                    className="flex items-center justify-between rounded-2xl border border-white/40 bg-transparent px-4 py-2.5 text-xs font-semibold text-white transition hover:border-feather-gold hover:text-feather-gold sm:px-5 sm:py-3 sm:text-sm"
                                >
                                    <span>Talk to our team</span>
                                    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white sm:text-xs">Concierge</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <div id="stories">
                <CustomerFooter className="mt-24" />
            </div>
        </div>
    );
}
