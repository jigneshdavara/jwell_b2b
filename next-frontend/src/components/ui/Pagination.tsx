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

    const currentPageIndex = links.findIndex(link => link.active);

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
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                {links.map((link, index) => {
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
                                key={`${link.label}-${index}`}
                                className="rounded-full px-2.5 py-1 text-xs font-semibold bg-elvee-blue text-white shadow shadow-elvee-blue/25 cursor-default sm:px-3 sm:text-sm"
                            >
                                {cleanLabel}
                            </span>
                        );
                    }

                    // Disabled link (no URL) - Previous/Next when at boundaries, or ellipsis
                    if (!link.url) {
                        return (
                            <span 
                                key={`${link.label}-${index}`} 
                                className={isPreviousOrNext 
                                    ? "py-1 text-xs text-slate-400 cursor-not-allowed sm:text-sm" 
                                    : isEllipsis
                                    ? "px-1.5 py-1 text-xs text-slate-400 cursor-not-allowed sm:px-2 sm:text-sm"
                                    : "rounded-full px-2.5 py-1 text-xs text-slate-400 cursor-not-allowed sm:px-3 sm:text-sm"
                                }
                            >
                                {cleanLabel}
                            </span>
                        );
                    }

                    // Previous/Next links - button styling on all screens
                    if (isPreviousOrNext) {
                        return (
                            <button
                                key={`${link.label}-${index}`}
                                type="button"
                                onClick={() => handleLinkClick(link.url)}
                                className="rounded-full px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 text-elvee-blue transition hover:bg-elvee-blue hover:text-white hover:border-elvee-blue focus:outline-none focus:ring-2 focus:ring-feather-gold focus:ring-offset-1 sm:px-3 sm:text-sm sm:focus:ring-offset-2"
                            >
                                {cleanLabel}
                            </button>
                        );
                    }

                    // Clickable page number link - button styling
                    return (
                        <button
                            key={`${link.label}-${index}`}
                            type="button"
                            onClick={() => handleLinkClick(link.url)}
                            className="rounded-full px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 text-elvee-blue transition hover:bg-elvee-blue hover:text-white hover:border-elvee-blue focus:outline-none focus:ring-2 focus:ring-feather-gold focus:ring-offset-1 sm:px-3 sm:text-sm sm:focus:ring-offset-2"
                        >
                            {cleanLabel}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
