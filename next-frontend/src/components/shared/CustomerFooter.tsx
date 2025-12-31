'use client';

import Link from 'next/link';
import { cn } from '@/utils/cn';
import { useEffect, useState } from 'react';
import { frontendService } from '@/services/frontendService';

type CustomerFooterProps = {
    className?: string;
};

type PublicSettings = {
    phone: string;
    email: string;
    address: string;
    studio_hours: string;
};

export default function CustomerFooter({ className }: CustomerFooterProps) {
    const currentYear = new Date().getFullYear();
    const [settings, setSettings] = useState<PublicSettings | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await frontendService.getPublicSettings();
                setSettings(response.data);
            } catch (error) {
                console.error('Failed to load footer settings:', error);
                // Use defaults if fetch fails
                setSettings({
                    phone: '+91 99888 77665',
                    email: 'hello@elvee.in',
                    address: 'Elvee, SEZ Jewellery Park, Mumbai',
                    studio_hours: 'Mon-Sat, 10:00 - 19:00 IST',
                });
            }
        };
        fetchSettings();
    }, []);

    const quickLinks = [
        { label: 'Explore catalogue', href: '/catalog' },
        { label: 'Design services', href: '/services/design' },
        { label: 'Merchandising desk', href: '/merchandising' },
        { label: 'FAQs', href: '/support/faqs' },
    ];

    const supportLinks = [
        { label: 'Quotation tracker', href: '/quotations' },
        { label: 'Order workflow', href: '/orders' },
        { label: 'After-sales support', href: '/support' },
        { label: 'Returns & refurbishing', href: '/support/returns' },
    ];

    // Default values if settings haven't loaded yet
    const defaultSettings: PublicSettings = {
        phone: '+91 99888 77665',
        email: 'hello@elvee.in',
        address: 'Elvee, SEZ Jewellery Park, Mumbai',
        studio_hours: 'Mon-Sat, 10:00 - 19:00 IST',
    };

    const currentSettings = settings || defaultSettings;

    // Build phone href (remove spaces and special chars for tel: link)
    const phoneHref = `tel:${currentSettings.phone.replace(/[\s\-()]/g, '')}`;

    const companyDetails = [
        {
            label: 'Call us',
            value: currentSettings.phone,
            href: phoneHref,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-feather-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 4.5 9 11.25m0 0 3-3m-3 3 6.75 6.75M10.5 21h.008v.008H10.5z" />
                </svg>
            ),
        },
        {
            label: 'Email',
            value: currentSettings.email,
            href: `mailto:${currentSettings.email}`,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-feather-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12.75v4.5a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 17.25v-4.5m18 0V6.75A2.25 2.25 0 0 0 18.75 4.5H5.25A2.25 2.25 0 0 0 3 6.75v6m18 0L12 12l-9 1.5" />
                </svg>
            ),
        },
        {
            label: 'Studio hours',
            value: currentSettings.studio_hours,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-feather-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            ),
        },
        {
            label: 'Flagship atelier',
            value: currentSettings.address,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-feather-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-3-7.5a9 9 0 0 0-9 9c0 7.5 9 12 9 12s9-4.5 9-12a9 9 0 0 0-9-9Z" />
                </svg>
            ),
        },
    ];

    return (
        <footer className={cn('relative w-full overflow-hidden bg-slate-950 text-slate-200', className)}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(174,129,53,0.15),_transparent_45%),_radial-gradient(circle_at_bottom_right,_rgba(174,129,53,0.12),_transparent_55%)]" />
            <div className="relative mx-auto grid w-full gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] lg:gap-10 lg:px-10 lg:py-12 xl:px-16 2xl:px-24">
                    <div className="space-y-3 sm:space-y-4">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-200 sm:px-3 sm:text-xs">
                            Est. 1998
                        </span>
                        <h4 className="text-xl font-semibold text-white sm:text-2xl">Elvee B2B Jewellery</h4>
                        <p className="text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
                            We partner with boutique retailers and private labels across India to craft bespoke fine jewellery,
                            blending responsible sourcing with award-winning design ateliers.
                        </p>
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 sm:gap-3 sm:text-xs">
                            <span className="rounded-full border border-white/10 px-2.5 py-1 sm:px-3">Hallmark certified</span>
                            <span className="rounded-full border border-white/10 px-2.5 py-1 sm:px-3">Conflict-free diamonds</span>
                            <span className="rounded-full border border-white/10 px-2.5 py-1 sm:px-3">Just-in-time production</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 sm:text-xs">Quick links</p>
                        <ul className="mt-3 space-y-2 text-xs text-white sm:mt-4 sm:space-y-3 sm:text-sm">
                            {quickLinks.map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="inline-flex items-center gap-1.5 text-white transition hover:text-feather-gold sm:gap-2">
                                        <span>{item.label}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M12.293 2.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L14 5.414V17a1 1 0 11-2 0V5.414L8.707 7.707A1 1 0 117.293 6.293l4-4z" />
                                        </svg>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 sm:text-xs">Client services</p>
                        <ul className="mt-3 space-y-2 text-xs text-white sm:mt-4 sm:space-y-3 sm:text-sm">
                            {supportLinks.map((item) => (
                                <li key={item.label}>
                                    <Link href={item.href} className="inline-flex items-center gap-1.5 text-white transition hover:text-feather-gold sm:gap-2">
                                        <span>{item.label}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M12.293 2.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L14 5.414V17a1 1 0 11-2 0V5.414L8.707 7.707A1 1 0 117.293 6.293l4-4z" />
                                        </svg>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 sm:text-xs">Contact & studio</p>
                        <ul className="mt-3 space-y-3 text-xs text-white sm:mt-4 sm:space-y-4 sm:text-sm">
                            {companyDetails.map((detail) => (
                                <li key={detail.label}>
                                    <a href={detail.href ?? '#'} className="group flex items-center gap-2 text-white transition hover:text-feather-gold sm:gap-3">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-900 sm:h-8 sm:w-8">
                                            {detail.icon}
                                        </span>
                                        <span className="text-xs sm:text-sm">{detail.value}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            <div className="relative mx-auto flex w-full flex-col gap-3 border-t border-white/10 px-4 py-4 text-[10px] text-white sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6 sm:text-xs lg:px-10 xl:px-16 2xl:px-24">
                <p>Copyright {currentYear} Elvee Jewellery Pvt. Ltd. All rights reserved.</p>
                <div className="flex flex-wrap gap-3 text-white sm:gap-4">
                    <Link href="/privacy" className="transition hover:text-feather-gold" style={{ color: '#FFFFFF' }}>
                        Privacy policy
                    </Link>
                    <Link href="/terms" className="transition hover:text-feather-gold" style={{ color: '#FFFFFF' }}>
                        Terms of trade
                    </Link>
                    <Link href="/compliance" className="transition hover:text-feather-gold" style={{ color: '#FFFFFF' }}>
                        Compliance & certifications
                    </Link>
                </div>
            </div>
        </footer>
    );
}

