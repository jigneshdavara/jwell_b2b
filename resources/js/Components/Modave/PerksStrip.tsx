type Perk = {
    title: string;
    description: string;
    icon?: JSX.Element;
};

type PerksStripProps = {
    perks: Perk[];
    variant?: 'light' | 'dark';
};

export default function PerksStrip({ perks, variant = 'light' }: PerksStripProps) {
    const base =
        variant === 'dark'
            ? 'bg-graphite-900 text-white shadow-soft-panel'
            : 'bg-white text-graphite-800 shadow-floating-card';

    return (
        <section className={`rounded-4xl ${base}`}>
            <div className="section-container py-10">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {perks.map((perk) => (
                        <div key={perk.title} className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 shadow-inner">
                                {perk.icon ?? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-6 w-6"
                                    >
                                        <path d="M12 2a5 5 0 00-5 5v2H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 7V7a3 3 0 016 0v2H9zm3 11a2 2 0 01-2-2h4a2 2 0 01-2 2z" />
                                    </svg>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="font-semibold text-base">{perk.title}</h3>
                                <p className="text-sm text-graphite-500">{perk.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

