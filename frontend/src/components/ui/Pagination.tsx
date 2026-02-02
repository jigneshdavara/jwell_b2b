"use client";

import { PaginationMeta, extractPageFromUrl } from "@/utils/pagination";

type PaginationProps = {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    className?: string;
};

export default function Pagination({ meta, onPageChange, className = "" }: PaginationProps) {
    if (meta.last_page <= 1) {
        return null;
    }

    const links = meta.links || [];

    const handleLinkClick = (url: string | null) => {
        if (!url) {
            return;
        }
        const page = extractPageFromUrl(url);
        if (page) {
            onPageChange(page);
        }
    };

    const from = meta.from ?? (meta.total > 0 ? (meta.current_page - 1) * meta.per_page + 1 : 0);
    const to = meta.to ?? Math.min(meta.current_page * meta.per_page, meta.total);

    // Generate mobile-friendly pagination (shows fewer pages)
    const generateMobileLinks = () => {
        const currentPage = meta.current_page;
        const lastPage = meta.last_page;
        const mobileLinks: typeof links = [];

        // Helper to clean label
        const cleanLabel = (label: string) => {
            return label
                .replace(/&laquo;/g, '')
                .replace(/&raquo;/g, '')
                .replace(/&nbsp;/g, ' ')
                .trim();
        };

        // Helper to check if link is Previous
        const isPreviousLink = (link: typeof links[0]) => {
            const label = cleanLabel(link.label).toLowerCase();
            return (label.includes('previous') || label === '«') && !/^\d+$/.test(cleanLabel(link.label));
        };

        // Helper to check if link is Next
        const isNextLink = (link: typeof links[0]) => {
            const label = cleanLabel(link.label).toLowerCase();
            return (label.includes('next') || label === '»') && !/^\d+$/.test(cleanLabel(link.label));
        };

        // Helper to check if link is a page number
        const isPageNumberLink = (link: typeof links[0]) => {
            const label = cleanLabel(link.label);
            return /^\d+$/.test(label) && !isPreviousLink(link) && !isNextLink(link);
        };

        // Find Previous and Next links (only one of each)
        const previousLink = links.find(link => isPreviousLink(link));
        const nextLink = links.find(link => isNextLink(link));

        // Get all page number links only
        const pageLinks = links.filter(link => isPageNumberLink(link));

        // Add Previous link if it exists
        if (previousLink) {
            mobileLinks.push(previousLink);
        }

        // Show current page ± 1 page on mobile (max 3 page numbers)
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(lastPage, currentPage + 1);

        // Track which pages we've added to avoid duplicates
        const addedPages = new Set<number>();

        // Add first page if not in range and not already included
        if (startPage > 1 && currentPage !== 1) {
            const firstPageLink = pageLinks.find(link => {
                const page = extractPageFromUrl(link.url || '');
                return page === 1;
            });
            if (firstPageLink && !addedPages.has(1)) {
                mobileLinks.push(firstPageLink);
                addedPages.add(1);
            }
            if (startPage > 2) {
                mobileLinks.push({ label: '...', url: null, active: false });
            }
        }

        // Add pages in range (current ± 1)
        for (let page = startPage; page <= endPage; page++) {
            if (!addedPages.has(page)) {
                const pageLink = pageLinks.find(link => {
                    const pageNum = extractPageFromUrl(link.url || '');
                    return pageNum === page;
                });
                if (pageLink) {
                    mobileLinks.push(pageLink);
                    addedPages.add(page);
                }
            }
        }

        // Add last page if not in range and not already included
        if (endPage < lastPage && currentPage !== lastPage) {
            if (endPage < lastPage - 1) {
                mobileLinks.push({ label: '...', url: null, active: false });
            }
            const lastPageLink = pageLinks.find(link => {
                const page = extractPageFromUrl(link.url || '');
                return page === lastPage;
            });
            if (lastPageLink && !addedPages.has(lastPage)) {
                mobileLinks.push(lastPageLink);
                addedPages.add(lastPage);
            }
        }

        // Add Next link if it exists
        if (nextLink) {
            mobileLinks.push(nextLink);
        }

        return mobileLinks;
    };

    const mobileLinks = generateMobileLinks();

    const renderLink = (link: typeof links[0], index: number, isMobile: boolean = false) => {
                    const cleanLabel = link.label
                        .replace('&laquo;', '«')
                        .replace('&raquo;', '»')
                        .replace(/&nbsp;/g, ' ')
                        .trim();

        const isPreviousOrNext = cleanLabel.includes('Previous') || cleanLabel.includes('Next') || cleanLabel === '«' || cleanLabel === '»';
        const isEllipsis = cleanLabel === '...';

                    // Active page link (current page) - not clickable
                    if (link.active) {
                        return (
                            <span
                    key={`${link.label}-${index}-${isMobile ? 'mobile' : 'desktop'}`}
                    className={`rounded-full font-semibold bg-elvee-blue text-white shadow shadow-elvee-blue/25 cursor-default ${
                        isMobile 
                            ? 'px-2 py-1 text-xs min-w-[28px]' 
                            : 'px-2.5 py-1 text-xs sm:px-3 sm:text-sm'
                    }`}
                            >
                                {cleanLabel}
                            </span>
                        );
                    }

                    // Disabled link (no URL) - Previous/Next when at boundaries, or ellipsis
                    if (!link.url) {
                        return (
                            <span 
                    key={`${link.label}-${index}-${isMobile ? 'mobile' : 'desktop'}`} 
                                className={isPreviousOrNext 
                        ? `py-1 text-xs text-slate-400 cursor-not-allowed ${!isMobile ? 'sm:text-sm' : ''}` 
                        : isEllipsis
                        ? `px-1.5 py-1 text-xs text-slate-400 cursor-not-allowed ${!isMobile ? 'sm:px-2 sm:text-sm' : ''}`
                        : `rounded-full px-2 py-1 text-xs text-slate-400 cursor-not-allowed ${!isMobile ? 'sm:px-3 sm:text-sm' : ''}`
                                }
                            >
                                {cleanLabel}
                            </span>
                        );
                    }

        // Previous/Next links - button styling
                    if (isPreviousOrNext) {
                        return (
                            <button
                    key={`${link.label}-${index}-${isMobile ? 'mobile' : 'desktop'}`}
                                type="button"
                                onClick={() => handleLinkClick(link.url)}
                    className={`rounded-full font-semibold bg-white border border-slate-200 text-elvee-blue transition hover:bg-elvee-blue hover:text-white hover:border-elvee-blue focus:outline-none focus:ring-2 focus:ring-feather-gold ${
                        isMobile
                            ? 'px-2 py-1 text-xs min-w-[28px] focus:ring-offset-0'
                            : 'px-2.5 py-1 text-xs focus:ring-offset-1 sm:px-3 sm:text-sm sm:focus:ring-offset-2'
                    }`}
                            >
                                {cleanLabel}
                            </button>
                        );
                    }

                    // Clickable page number link - button styling
                    return (
                        <button
                key={`${link.label}-${index}-${isMobile ? 'mobile' : 'desktop'}`}
                            type="button"
                            onClick={() => handleLinkClick(link.url)}
                className={`rounded-full font-semibold bg-white border border-slate-200 text-elvee-blue transition hover:bg-elvee-blue hover:text-white hover:border-elvee-blue focus:outline-none focus:ring-2 focus:ring-feather-gold ${
                    isMobile
                        ? 'px-2 py-1 text-xs min-w-[28px] focus:ring-offset-0'
                        : 'px-2.5 py-1 text-xs focus:ring-offset-1 sm:px-3 sm:text-sm sm:focus:ring-offset-2'
                }`}
                        >
                            {cleanLabel}
                        </button>
                    );
    };

    return (
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
            <div className="text-xs text-slate-600 sm:text-sm text-center sm:text-left">
                <span>Showing </span>
                <span className="font-semibold">{from}</span>
                <span> to </span>
                <span className="font-semibold">{to}</span>
                <span> of </span>
                <span className="font-semibold">{meta.total}</span>
                <span> entries</span>
            </div>
            {/* Mobile pagination - shows fewer pages */}
            <div className="flex flex-wrap items-center justify-center gap-0.5 md:hidden">
                {mobileLinks.map((link, index) => renderLink(link, index, true))}
            </div>
            {/* Desktop pagination - shows all pages */}
            <div className="hidden md:flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {links.map((link, index) => renderLink(link, index, false))}
            </div>
        </div>
    );
}
