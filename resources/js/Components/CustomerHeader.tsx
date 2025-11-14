import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

type HeaderLink = {
    label: string;
    href: string;
};

type CustomerHeaderProps = {
    navLinks?: HeaderLink[];
    primaryCta?: HeaderLink;
    secondaryCta?: HeaderLink;
    tagline?: string;
};

const contactItems = [
    { label: '+91 99888 77665', href: 'tel:+919988877665' },
    { label: 'support@elvee.in', href: 'mailto:support@elvee.in' },
];

export default function CustomerHeader({
    navLinks = [],
    primaryCta,
    secondaryCta,
    tagline = 'Elvee Retailer Workspace',
}: CustomerHeaderProps) {
    return (
        <header className="relative z-40 bg-white text-slate-900 shadow">
            <div className="hidden border-b border-slate-100 bg-slate-900 text-xs text-white lg:block">
                <div className="mx-auto flex max-w-[95rem] items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-6 text-white/80">
                        {contactItems.map((contact) => (
                            <a key={contact.label} href={contact.href} className="flex items-center gap-2 transition hover:text-white">
                                <span>{contact.label}</span>
                            </a>
                        ))}
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/70">{tagline}</p>
                </div>
            </div>

            <div className="mx-auto flex max-w-[95rem] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <ApplicationLogo className="h-10 w-10 text-slate-900" />
                        <span className="text-lg font-semibold text-slate-900">Elvee</span>
                    </Link>
                    <div className="flex items-center gap-3 lg:hidden">
                        {secondaryCta && (
                            <Link
                                href={secondaryCta.href}
                                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 transition hover:border-feather-gold hover:text-feather-gold"
                            >
                                {secondaryCta.label}
                            </Link>
                        )}
                        {primaryCta && (
                            <Link
                                href={primaryCta.href}
                                className="rounded-full bg-elvee-blue px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-elvee-blue/30"
                            >
                                {primaryCta.label}
                            </Link>
                        )}
                    </div>
                </div>

                <nav className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {navLinks.map((link) => (
                        <a key={link.label} href={link.href} className="transition hover:text-elvee-blue">
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    {secondaryCta && (
                        <Link
                            href={secondaryCta.href}
                            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700 transition hover:border-feather-gold hover:text-feather-gold"
                        >
                            {secondaryCta.label}
                        </Link>
                    )}
                    {primaryCta && (
                        <Link
                            href={primaryCta.href}
                            className="rounded-full bg-elvee-blue px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-elvee-blue/30"
                        >
                            {primaryCta.label}
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
