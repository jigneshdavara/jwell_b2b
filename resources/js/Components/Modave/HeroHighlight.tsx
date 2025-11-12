import { Link } from '@inertiajs/react';

type HeroStat = {
    label: string;
    value: string;
};

type HeroCta = {
    label: string;
    href: string;
};

type HeroHighlightProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    primaryCta: HeroCta;
    secondaryCta?: HeroCta;
    stats?: HeroStat[];
    backgroundImageUrl?: string;
};

export default function HeroHighlight({
    eyebrow,
    title,
    description,
    primaryCta,
    secondaryCta,
    stats = [],
    backgroundImageUrl,
}: HeroHighlightProps) {
    return (
        <section className="relative overflow-hidden rounded-5xl bg-hero-linear text-white shadow-soft-panel">
            {backgroundImageUrl && (
                <div
                    className="absolute inset-0 opacity-45 mix-blend-screen"
                    style={{
                        backgroundImage: `url(${backgroundImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                    aria-hidden="true"
                />
            )}
            <div className="absolute inset-0 bg-hero-radial opacity-80" aria-hidden="true" />

            <div className="relative section-container py-16 sm:py-20 lg:py-24">
                <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:items-center">
                    <div className="space-y-8">
                        {eyebrow && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
                                <span className="h-1 w-1 rounded-full bg-accent-400" aria-hidden="true" />
                                {eyebrow}
                            </span>
                        )}
                        <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
                        {description && (
                            <p className="max-w-2xl text-base text-white/80 sm:text-lg lg:text-xl">{description}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4">
                            <Link href={primaryCta.href} className="btn-primary">
                                {primaryCta.label}
                            </Link>
                            {secondaryCta && (
                                <Link
                                    href={secondaryCta.href}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/60 hover:text-white/90"
                                >
                                    {secondaryCta.label}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </Link>
                            )}
                        </div>
                    </div>

                    {stats.length > 0 && (
                        <div className="grid gap-4">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="rounded-3xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur"
                                >
                                    <div className="font-display text-3xl font-semibold text-white sm:text-4xl">
                                        {stat.value}
                                    </div>
                                    <p className="mt-2 text-sm uppercase tracking-[0.3em] text-white/70">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

