import { Link } from '@inertiajs/react';
import SectionHeading from './SectionHeading';

type CollectionCard = {
    id: string | number;
    title: string;
    description?: string;
    href: string;
    imageUrl: string;
    meta?: string;
};

type CollectionShowcaseProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    collections: CollectionCard[];
};

export default function CollectionShowcase({ eyebrow, title, description, collections }: CollectionShowcaseProps) {
    return (
        <section className="space-y-10">
            <SectionHeading eyebrow={eyebrow} title={title} description={description} align="center" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                    <Link
                        key={collection.id}
                        href={collection.href}
                        className="group relative overflow-hidden rounded-4xl bg-graphite-900 text-white shadow-floating-card transition hover:-translate-y-1 hover:shadow-soft-panel"
                    >
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundImage: `url(${collection.imageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                            aria-hidden="true"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-graphite-900/85 via-graphite-900/40 to-transparent" aria-hidden="true" />
                        <div className="relative flex h-full flex-col justify-end gap-3 p-8">
                            <span className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                                {collection.meta ?? 'Curated'}
                            </span>
                            <h3 className="font-display text-2xl leading-snug">{collection.title}</h3>
                            {collection.description && (
                                <p className="text-sm text-white/70">{collection.description}</p>
                            )}
                            <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition group-hover:text-white">
                                Shop now
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path
                                        fillRule="evenodd"
                                        d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

