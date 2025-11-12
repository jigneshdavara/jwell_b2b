import { Link } from '@inertiajs/react';

type ProductTag = {
    label: string;
    variant?: 'default' | 'sale' | 'new';
};

export type ProductCardProps = {
    id: number | string;
    name: string;
    url: string;
    imageUrl: string;
    priceFormatted: string;
    originalPriceFormatted?: string | null;
    badge?: ProductTag;
    swatches?: Array<{ label: string; value: string }>;
    onAddToQuote?: (id: number | string) => void;
};

export default function ProductCard({
    id,
    name,
    url,
    imageUrl,
    priceFormatted,
    originalPriceFormatted,
    badge,
    swatches = [],
    onAddToQuote,
}: ProductCardProps) {
    const showDiscount = originalPriceFormatted && originalPriceFormatted !== priceFormatted;

    const handleAddToQuote = () => {
        if (onAddToQuote) {
            onAddToQuote(id);
        }
    };

    return (
        <article className="group relative flex h-full flex-col overflow-hidden rounded-4xl bg-white shadow-floating-card transition hover:-translate-y-1 hover:shadow-soft-panel">
            <div className="relative">
                <Link href={url} className="block aspect-square overflow-hidden bg-graphite-50">
                    <img
                        src={imageUrl}
                        alt={name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        loading="lazy"
                    />
                </Link>
                {badge && (
                    <span
                        className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${
                            badge.variant === 'sale'
                                ? 'bg-accent-500 text-white'
                                : badge.variant === 'new'
                                ? 'bg-brand-500 text-white'
                                : 'bg-white/85 text-graphite-700'
                        }`}
                    >
                        {badge.label}
                    </span>
                )}

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 opacity-0 backdrop-blur-sm transition duration-300 group-hover:pointer-events-auto group-hover:opacity-100">
                    <Link
                        href={url}
                        className="inline-flex items-center gap-2 rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-graphite-900 shadow-md transition hover:bg-white"
                    >
                        Quick view
                    </Link>
                    {onAddToQuote && (
                        <button
                            type="button"
                            onClick={handleAddToQuote}
                            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-500"
                        >
                            Add to quote
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-6">
                <div className="space-y-2">
                    <Link
                        href={url}
                        className="text-base font-semibold text-graphite-900 transition hover:text-brand-600"
                    >
                        {name}
                    </Link>
                    <div className="flex items-center gap-2 text-sm font-medium text-graphite-500">
                        <span className="text-lg font-semibold text-graphite-900">{priceFormatted}</span>
                        {showDiscount && (
                            <span className="text-sm font-medium text-graphite-400 line-through">{originalPriceFormatted}</span>
                        )}
                    </div>
                </div>

                {swatches.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {swatches.map((swatch) => (
                            <span
                                key={swatch.value}
                                className="inline-flex items-center rounded-full border border-graphite-200 px-3 py-1 text-xs font-medium text-graphite-500"
                            >
                                {swatch.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}

