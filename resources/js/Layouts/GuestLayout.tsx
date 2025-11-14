import ApplicationLogo from '@/Components/ApplicationLogo';
import FlashMessage from '@/Components/FlashMessage';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-50">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.25),_transparent_45%),_radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.3),_transparent_40%)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950" />

            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-12">
                <Link href="/" className="flex items-center gap-3 text-slate-200">
                    <ApplicationLogo className="h-10 w-10 text-white" />
                    <span className="text-base font-semibold tracking-wide text-slate-100">
                        Elvee B2B Suite
                    </span>
                </Link>

                <div className="mt-8 w-full max-w-4xl space-y-6">
                    <FlashMessage />
                    {children}
                </div>

                <p className="mt-10 text-center text-xs text-slate-400">
                    Need enterprise onboarding?{' '}
                    <a
                        href="mailto:onboarding@elvee.in"
                        className="font-medium text-feather-gold transition hover:text-warm-gold"
                    >
                        Schedule a guided demo
                    </a>
                </p>
            </div>
        </div>
    );
}
