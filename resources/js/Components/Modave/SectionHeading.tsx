type SectionHeadingProps = {
    eyebrow?: string;
    title: string;
    description?: string;
    align?: 'left' | 'center';
};

export default function SectionHeading({ eyebrow, title, description, align = 'left' }: SectionHeadingProps) {
    const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';
    const container = align === 'center' ? 'max-w-3xl' : 'max-w-2xl';

    return (
        <div className={`${alignment} ${container} space-y-4`}>
            {eyebrow && (
                <span className="badge-pill inline-flex items-center justify-center !px-4 !py-1 text-graphite-500">
                    {eyebrow}
                </span>
            )}
            <h2 className="font-display text-3xl leading-tight text-graphite-900 sm:text-4xl">{title}</h2>
            {description && <p className="text-base text-graphite-500 sm:text-lg">{description}</p>}
        </div>
    );
}

