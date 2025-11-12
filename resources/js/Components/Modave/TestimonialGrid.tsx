type Testimonial = {
    id: string | number;
    quote: string;
    author: string;
    role?: string;
    avatarUrl?: string;
};

type TestimonialGridProps = {
    eyebrow?: string;
    title?: string;
    testimonials: Testimonial[];
};

export default function TestimonialGrid({ eyebrow, title, testimonials }: TestimonialGridProps) {
    return (
        <section className="space-y-8">
            {(eyebrow || title) && (
                <div className="space-y-2 text-center">
                    {eyebrow && <span className="badge-pill mx-auto">{eyebrow}</span>}
                    {title && <h2 className="font-display text-3xl text-graphite-900 sm:text-4xl">{title}</h2>}
                </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((testimonial) => (
                    <figure
                        key={testimonial.id}
                        className="flex h-full flex-col gap-6 rounded-4xl border border-graphite-100 bg-white/90 p-8 shadow-floating-card backdrop-blur"
                    >
                        <blockquote className="text-base leading-relaxed text-graphite-600">
                            “{testimonial.quote}”
                        </blockquote>
                        <figcaption className="mt-auto flex items-center gap-3">
                            {testimonial.avatarUrl ? (
                                <img
                                    src={testimonial.avatarUrl}
                                    alt={testimonial.author}
                                    className="h-12 w-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                                    {testimonial.author
                                        .split(' ')
                                        .map((part) => part[0])
                                        .join('')
                                        .toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="font-semibold text-graphite-900">{testimonial.author}</div>
                                {testimonial.role && <div className="text-sm text-graphite-500">{testimonial.role}</div>}
                            </div>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
}

