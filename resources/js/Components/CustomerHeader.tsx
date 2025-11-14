import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

type HeaderLink = {
    label: string;
    href: string;
};

type LanguageOption = {
    label: string;
    value: string;
};

type CustomerHeaderProps = {
    navLinks?: HeaderLink[];
    primaryCta?: HeaderLink;
    secondaryCta?: HeaderLink;
    tagline?: string;
    languages?: LanguageOption[];
    selectedLanguage?: string;
    onLanguageChange?: (value: string) => void;
};

const contactItems = [
    { label: '+91 99888 77665', href: 'tel:+919988877665' },
    { label: 'support@elvee.in', href: 'mailto:support@elvee.in' },
];

const ArrowIcon = () => (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M2 6h8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ShieldIcon = () => (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M12 3 4 6v6c0 5 3.5 9 8 9s8-4 8-9V6l-8-3Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default function CustomerHeader({
    navLinks = [],
    primaryCta,
    secondaryCta,
    tagline = '',
    languages = [
        { label: 'English', value: 'en' },
        { label: 'Hindi', value: 'hi' },
        { label: 'Gujarati', value: 'gu' },
    ],
    selectedLanguage,
    onLanguageChange,
}: CustomerHeaderProps) {
    const [currentLanguage, setCurrentLanguage] = useState(selectedLanguage ?? languages[0]?.value ?? 'en');

    const handleLanguageChange = (value: string) => {
        setCurrentLanguage(value);
        onLanguageChange?.(value);
    };

    return (
        <header className="relative z-40 bg-white/95 text-slate-900 shadow-sm backdrop-blur">
            <div className="hidden border-b border-slate-100 bg-slate-900 text-xs text-white lg:block">
                <div className="mx-auto flex max-w-[95rem] items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-6 text-white">
                        {contactItems.map((contact) => (
                            <a key={contact.label} href={contact.href} className="flex items-center gap-2 text-white transition hover:text-feather-gold">
                                <span className="h-1.5 w-1.5 rounded-full bg-feather-gold" />
                                <span>{contact.label}</span>
                            </a>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">Language</span>
                        <select
                            value={currentLanguage}
                            onChange={(event) => handleLanguageChange(event.target.value)}
                            className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white focus:border-white focus:outline-none"
                        >
                            {languages.map((lang) => (
                                <option key={lang.value} value={lang.value} className="text-slate-900">
                                    {lang.label}
                                </option>
                            ))}
                        </select>
                        {tagline && (
                            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-white/80">{tagline}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto flex max-w-[95rem] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <ApplicationLogo className="h-10 w-10 text-elvee-blue" />
                        <span className="text-lg font-semibold text-elvee-blue">Elvee</span>
                    </Link>
                    <div className="flex items-center gap-3 lg:hidden">
                        {secondaryCta && (
                            <Link
                                href={secondaryCta.href}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-feather-gold hover:text-feather-gold"
                            >
                                <ShieldIcon />
                                {secondaryCta.label}
                            </Link>
                        )}
                        {primaryCta && (
                            <Link
                                href={primaryCta.href}
                                className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-elvee-blue/30"
                            >
                                {primaryCta.label}
                                <ArrowIcon />
                            </Link>
                        )}
                    </div>
                </div>

                <nav className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {navLinks.map((link) => (
                        <a key={link.label} href={link.href} className="rounded-full px-3 py-1 transition hover:bg-elvee-blue/5 hover:text-elvee-blue">
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    {secondaryCta && (
                        <Link
                            href={secondaryCta.href}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-feather-gold hover:text-feather-gold"
                        >
                            <ShieldIcon />
                            {secondaryCta.label}
                        </Link>
                    )}
                    {primaryCta && (
                        <Link
                            href={primaryCta.href}
                            className="inline-flex items-center gap-2 rounded-full bg-elvee-blue px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-elvee-blue/30 transition hover:bg-navy"
                        >
                            {primaryCta.label}
                            <ArrowIcon />
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
