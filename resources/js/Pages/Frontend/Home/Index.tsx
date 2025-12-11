import CustomerFooter from '@/Components/CustomerFooter';
import CustomerHeader from '@/Components/CustomerHeader';
import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';
import { ReactNode } from 'react';

type HomePageProps = {
    stats: {
        products: number;
        orders: number;
        jobworks: number;
        active_offers: number;
    };
    brands: string[];
    spotlight: Array<{
        id: number;
        name: string;
        brand?: string | null;
        price: number;
        making_charge_amount: number;
        making_charge_percentage?: number | null;
        making_charge_types?: string[];
    }>;
    features: Array<{ title: string; description: string }>;
};

const numberFormatter = new Intl.NumberFormat('en-IN');
const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

const prettifyKey = (key: string) =>
    key
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

export default function HomeIndex() {
    const { stats, brands = [], spotlight, features } = usePage<PageProps<HomePageProps>>().props;

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

    return (
        <div className="min-h-screen bg-ivory text-ink">
            <Head title="Elvee B2B Jewellery OS" />

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

                <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 pt-16 lg:flex-row lg:items-center lg:px-10">
                    <div className="max-w-2xl space-y-8">
                        <p className="inline-flex items-center gap-2 rounded-full bg-feather-gold/10 px-4 py-1 text-xs font-semibold tracking-[0.3em] text-feather-gold">
                            ELVEE SUITE
                        </p>
                        <h1 className="text-4xl font-semibold text-elvee-blue sm:text-5xl lg:text-6xl">
                            White-glove commerce for luxury retailers & wholesale partners.
                        </h1>
                        <p className="text-base text-ink/80">
                            Present elevated collections, lock live rates, manage jobwork, and keep every retail partner informed without leaving one secure platform.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link href={route('login')} className="btn-primary gap-2">
                                <span>Sign in to your workspace</span>
                                <ArrowRightIcon />
                            </Link>
                            <Link href={route('register')} className="btn-secondary gap-2">
                                <SparkIcon />
                                <span>Request partner access</span>
                            </Link>
                        </div>

                        <div className="grid gap-4 pt-8 sm:grid-cols-2">
                            {Object.entries(stats).map(([key, value]) => (
                                <div key={key} className="rounded-2xl border border-elvee-blue/10 bg-white/80 p-5 shadow-lg shadow-elvee-blue/5">
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink/60">{prettifyKey(key)}</p>
                                    <p className="mt-3 text-3xl font-semibold text-elvee-blue">{numberFormatter.format(value)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full max-w-xl space-y-6 rounded-3xl bg-white p-8 shadow-2xl shadow-elvee-blue/10 ring-1 ring-elvee-blue/10">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink/60">Featured Drops</h2>
                        <div className="space-y-4">
                            {spotlight.map((product) => (
                                <div key={product.id} className="rounded-2xl border border-elvee-blue/10 bg-ivory/60 p-5 transition hover:border-feather-gold/40 hover:bg-white">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-base font-semibold text-elvee-blue">{product.name}</p>
                                            <p className="text-xs uppercase tracking-[0.3em] text-ink/50">
                                                {product.brand ?? 'Signature Collection'}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm text-ink/80">
                                            <p>{currencyFormatter.format(product.price)}</p>
                                            <p className="text-xs text-ink/60">
                                                {(() => {
                                                    const types = product.making_charge_types || [];
                                                    const hasFixed = types.includes('fixed') && product.making_charge_amount && product.making_charge_amount > 0;
                                                    const hasPercentage = types.includes('percentage') && product.making_charge_percentage && product.making_charge_percentage > 0;
                                                    
                                                    if (hasFixed && hasPercentage) {
                                                        return `Making: ₹${product.making_charge_amount?.toLocaleString('en-IN')} + ${product.making_charge_percentage}%`;
                                                    } else if (hasFixed) {
                                                        return `Making: ${currencyFormatter.format(product.making_charge_amount ?? 0)}`;
                                                    } else if (hasPercentage) {
                                                        return `Making: ${product.making_charge_percentage}% of metal`;
                                                    }
                                                    return `Making: ${currencyFormatter.format(product.making_charge_amount ?? 0)}`;
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

            <main className="space-y-24 bg-white/80 py-24">
                <section className="mx-auto max-w-6xl px-6 lg:px-10" id="solutions">
                    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-feather-gold">Who we serve</p>
                            <h2 className="text-2xl font-semibold text-elvee-blue">Tailored workflows for each partner segment</h2>
                        </div>
                        <div className="text-sm text-ink/70 lg:max-w-sm">
                            From retail storefronts to jobworkers, Elvee adapts onboarding, catalogues, and approvals to the way your network operates.
                        </div>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {personaHighlights.map((persona) => (
                            <div
                                key={persona.title}
                                className="rounded-3xl border border-elvee-blue/10 bg-white p-6 shadow-lg shadow-elvee-blue/5 transition hover:-translate-y-1 hover:shadow-2xl"
                            >
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-feather-gold/40 bg-feather-gold/15">
                                    {persona.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-elvee-blue">{persona.title}</h3>
                                <p className="mt-2 text-sm text-ink/70">{persona.detail}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-6 lg:px-10" id="partners">
                    <h2 className="text-2xl font-semibold text-elvee-blue">Why partners choose Elvee</h2>
                    <div className="mt-8 grid gap-6 md:grid-cols-3">
                        {features.map((feature) => (
                            <div key={feature.title} className="rounded-3xl border border-elvee-blue/10 bg-ivory/60 p-6 shadow-inner shadow-white">
                                <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-ink/50">
                                    FEATURE
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-elvee-blue">{feature.title}</h3>
                                <p className="mt-2 text-sm text-ink/70">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {brands.length > 0 && (
                    <section className="bg-ivory py-16">
                        <div className="mx-auto max-w-5xl px-6 text-center lg:px-10">
                            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-ink/60">Trusted by leading houses</p>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-ink/70">
                                {brands.map((brand) => (
                                    <span key={brand} className="rounded-full border border-elvee-blue/10 bg-white px-5 py-2">
                                        {brand}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section className="mx-auto max-w-6xl px-6 lg:px-10" id="jobwork">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-elvee-blue via-navy to-slate-900 p-10 text-white shadow-[0_25px_60px_-20px_rgba(10,30,70,0.7)]">
                        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%)] blur-3xl lg:block" />
                        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-xl space-y-4">
                                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-feather-gold">
                                    Experience it live
                                </p>
                                <h2 className="text-3xl font-semibold leading-tight">
                                    Bring retail partners closer with immersive catalogues, bullion controls, and production intelligence.
                                </h2>
                                <p className="text-sm text-white/80">
                                    From bullion hedging to dispatch updates, Elvee keeps every stakeholder aligned with tasteful, high-trust interfaces.
                                </p>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {[
                                        { label: 'Live demo', value: '5 mins', sub: 'Guided walkthrough' },
                                        { label: 'Avg. onboarding', value: '48 hrs', sub: 'Retail partners' },
                                        { label: 'Support', value: '24/7', sub: 'Concierge desk' },
                                    ].map((metric) => (
                                        <div key={metric.label} className="rounded-2xl bg-white/5 p-4 text-sm">
                                            <p className="text-xs uppercase tracking-[0.3em] text-white/70">{metric.label}</p>
                                            <p className="mt-1 text-2xl font-semibold text-white">{metric.value}</p>
                                            <p className="text-xs text-white/70">{metric.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 text-slate-900 lg:min-w-[320px]">
                                <Link
                                    href={route('login')}
                                    className="flex items-center justify-between rounded-2xl bg-white/90 px-5 py-3 text-sm font-semibold text-elvee-blue shadow-lg shadow-navy/30 transition hover:bg-white"
                                >
                                    <span>Explore the live demo</span>
                                    <span className="rounded-full bg-elvee-blue px-2 py-1 text-xs text-white">5 min tour</span>
                                </Link>
                                <a
                                    href="mailto:onboarding@elvee.in"
                                    className="flex items-center justify-between rounded-2xl border border-white/40 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:border-feather-gold hover:text-feather-gold"
                                >
                                    <span>Talk to our team</span>
                                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white">Concierge</span>
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
