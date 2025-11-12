import { FormEvent } from 'react';

type NewsletterCtaProps = {
    title: string;
    description?: string;
    onSubmit?: (email: string) => Promise<void> | void;
    placeholder?: string;
    submitLabel?: string;
};

export default function NewsletterCta({
    title,
    description,
    onSubmit,
    placeholder = 'Enter your email address',
    submitLabel = 'Subscribe',
}: NewsletterCtaProps) {
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        if (!onSubmit) return;

        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const email = String(formData.get('email') ?? '').trim();
        if (email) {
            onSubmit(email);
        }
    };

    return (
        <section className="rounded-5xl bg-gradient-to-r from-brand-700 via-brand-600 to-accent-500 text-white shadow-soft-panel">
            <div className="section-container flex flex-col gap-8 py-12 lg:flex-row lg:items-center lg:justify-between lg:py-16">
                <div className="max-w-2xl space-y-4">
                    <h2 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h2>
                    {description && <p className="text-base text-white/80 sm:text-lg">{description}</p>}
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="flex w-full flex-col gap-4 rounded-3xl bg-white/10 p-5 text-left shadow-inner backdrop-blur sm:flex-row sm:items-center sm:gap-3"
                >
                    <div className="flex-1">
                        <label htmlFor="newsletter-email" className="sr-only">
                            Email address
                        </label>
                        <input
                            id="newsletter-email"
                            name="email"
                            type="email"
                            required
                            placeholder={placeholder}
                            className="h-12 w-full rounded-full border-none bg-white/80 px-6 text-sm text-graphite-800 placeholder:text-graphite-400 focus:ring-2 focus:ring-brand-200"
                        />
                    </div>
                    <button
                        type="submit"
                        className="inline-flex h-12 items-center justify-center rounded-full bg-graphite-900 px-6 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-graphite-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-graphite-300"
                    >
                        {submitLabel}
                    </button>
                </form>
            </div>
        </section>
    );
}

