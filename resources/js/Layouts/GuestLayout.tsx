import ApplicationLogo from '@/Components/ApplicationLogo';
import FlashMessage from '@/Components/FlashMessage';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-ivory text-ink">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-ivory to-ivory" />
                <div className="absolute inset-x-10 top-0 h-72 rounded-b-[48px] bg-gradient-to-br from-elvee-blue/10 via-ivory to-transparent blur-3xl" />
                <div className="absolute -left-20 top-32 h-64 w-64 rounded-full bg-feather-gold/10 blur-3xl" />
                <div className="absolute -right-10 bottom-10 h-52 w-52 rounded-full bg-warm-gold/20 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-12 lg:px-10 lg:py-16">
                <header className="flex flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 rounded-full bg-white/80 px-5 py-3 shadow-lg shadow-elvee-blue/5 ring-1 ring-elvee-blue/5 backdrop-blur"
                    >
                        <ApplicationLogo className="h-10 w-10 text-elvee-blue" />
                        <span className="text-sm font-semibold tracking-[0.2em] text-elvee-blue">ELVEE SUITE</span>
                    </Link>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ink/60">
                        Concierge onboarding for B2B jewellery partners
                    </p>
                </header>

                <div className="mt-10 flex flex-1 flex-col gap-6">
                    <FlashMessage />
                    <div className="flex-1">{children}</div>
                </div>

                <p className="mt-12 text-center text-xs text-ink/70">
                    Need enterprise onboarding?{' '}
                    <a href="mailto:onboarding@elvee.in" className="font-medium text-feather-gold transition hover:text-warm-gold">
                        Schedule a guided demo
                    </a>
                </p>
            </div>
        </div>
    );
}
