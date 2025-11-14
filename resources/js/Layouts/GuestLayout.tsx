import CustomerFooter from '@/Components/CustomerFooter';
import CustomerHeader from '@/Components/CustomerHeader';
import FlashMessage from '@/Components/FlashMessage';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    const navLinks = [
        { label: 'Solutions', href: '/#solutions' },
        { label: 'Partners', href: '/#partners' },
        { label: 'Jobwork', href: '/#jobwork' },
        { label: 'Stories', href: '/#stories' },
    ];

    return (
        <div className="min-h-screen bg-ivory text-ink">
            <CustomerHeader
                navLinks={navLinks}
                primaryCta={{ label: 'Request access', href: route('register') }}
                secondaryCta={{ label: 'Sign in', href: route('login') }}
                tagline=""
            />

            <div className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-ivory to-ivory" />
                    <div className="absolute inset-x-10 top-0 h-72 rounded-b-[48px] bg-gradient-to-br from-elvee-blue/10 via-ivory to-transparent blur-3xl" />
                    <div className="absolute -left-20 top-32 h-64 w-64 rounded-full bg-feather-gold/10 blur-3xl" />
                    <div className="absolute -right-10 bottom-10 h-52 w-52 rounded-full bg-warm-gold/20 blur-3xl" />
                </div>

                <div className="relative z-10 mx-auto flex min-h-[75vh] w-full max-w-6xl flex-col px-6 py-12 lg:px-10 lg:py-16">
                    <FlashMessage />
                    <div className="flex-1">{children}</div>
                </div>
            </div>

            <CustomerFooter className="mt-16" />
        </div>
    );
}
