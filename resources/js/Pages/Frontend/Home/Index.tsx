import { Head, Link, usePage } from '@inertiajs/react';
import type { PageProps } from '@/types';

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
        making_charge: number;
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
    const { stats, brands, spotlight, features } = usePage<PageProps<HomePageProps>>().props;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Head title="AurumCraft B2B Jewellery OS" />

            <header className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_40%),_radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.25),_transparent_45%)]" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950" />

                <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-16 px-6 pb-24 pt-20 lg:flex-row lg:items-center lg:px-10">
                    <div className="max-w-2xl space-y-8">
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200">
                            Crafted for high-value jewellery partnerships
                        </p>
                        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                            The operating system for B2B jewellery sourcing, jobwork, and production.
                        </h1>
                        <p className="text-lg text-slate-200">
                            Present curated collections, lock bullion and diamond rates instantly, and
                            monitor production milestones with your network of retailers and wholesalers.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link href={route('login')} className="btn-primary">
                                Sign in to your workspace
                            </Link>
                            <Link
                                href={route('register')}
                                className="btn-secondary"
                            >
                                Request partner access
                            </Link>
                        </div>

                        <div className="grid gap-4 pt-10 sm:grid-cols-2">
                            {Object.entries(stats).map(([key, value]) => (
                                <div key={key} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                                    <p className="text-xs uppercase tracking-wide text-slate-300">
                                        {prettifyKey(key)}
                                    </p>
                                    <p className="mt-2 text-3xl font-semibold text-white">
                                        {numberFormatter.format(value)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full max-w-xl space-y-6 rounded-3xl bg-white/10 p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
                        <h2 className="text-sm font-medium uppercase tracking-[0.35em] text-slate-200">
                            Featured Drops
                        </h2>
                        <div className="space-y-4">
                            {spotlight.map((product) => (
                                <div
                                    key={product.id}
                                    className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                {product.name}
                                            </p>
                                            <p className="text-xs uppercase tracking-wide text-slate-300">
                                                {product.brand ?? 'Signature Collection'}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm text-slate-200">
                                            <p>{currencyFormatter.format(product.price)}</p>
                                            <p className="text-xs text-slate-300">
                                                Making {currencyFormatter.format(product.making_charge)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="space-y-24 bg-slate-100 text-slate-900">
                <section className="mx-auto max-w-6xl px-6 pt-20 lg:px-10">
                    <h2 className="text-2xl font-semibold text-slate-900">Why partners choose AurumCraft</h2>
                    <div className="mt-8 grid gap-6 md:grid-cols-3">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-200/80"
                            >
                                <div className="absolute left-6 top-6 h-10 w-10 rounded-full bg-sky-500/10" />
                                <div className="relative space-y-3">
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-slate-600">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {brands.length > 0 && (
                    <section className="bg-white py-16">
                        <div className="mx-auto max-w-6xl px-6 text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-400">
                                Trusted by leading houses
                            </p>
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-500">
                                {brands.map((brand) => (
                                    <span key={brand} className="rounded-full border border-slate-200 px-4 py-2">
                                        {brand}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-10">
                    <div className="flex flex-col gap-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-900 p-10 text-white lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-xl space-y-4">
                            <h2 className="text-3xl font-semibold">
                                Bring retail partners closer with immersive catalog and production intelligence.
                            </h2>
                            <p className="text-sm text-slate-200">
                                From bullion hedging to dispatch updates, AurumCraft keeps every stakeholder
                                aligned. Dive into the experience with our fully loaded demo environment.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link href={route('login')} className="btn-primary">
                                Explore the live demo
                            </Link>
                            <a
                                href="mailto:onboarding@aurumcraft.test"
                                className="btn-secondary"
                            >
                                Talk to our team
                            </a>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

