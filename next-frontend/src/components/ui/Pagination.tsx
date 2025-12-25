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

    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 ${className}`}>
            <div>
                Showing {from} to {to} of {meta.total} entries
            </div>
            <div className="flex flex-wrap gap-2">
                {links.map((link, index) => {
                    const cleanLabel = link.label
                        .replace('&laquo;', '«')
                        .replace('&raquo;', '»')
                        .replace(/&nbsp;/g, ' ')
                        .trim();

                    const isPreviousOrNext = cleanLabel.includes('Previous') || cleanLabel.includes('Next');

                    // Active page link (current page) - not clickable
                    if (link.active) {
                        return (
                            <span
                                key={`${link.label}-${index}`}
                                className="rounded-full px-3 py-1 text-sm font-semibold bg-elvee-blue text-white shadow shadow-elvee-blue/25 cursor-default"
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
                                    ? "py-1 text-sm text-slate-400 cursor-not-allowed" 
                                    : "rounded-full px-3 py-1 text-sm text-slate-400 cursor-not-allowed"
                                }
                            >
                                {cleanLabel}
                            </span>
                        );
                    }

                    // Previous/Next links - text only, no button styling
                    if (isPreviousOrNext) {
                        return (
                            <button
                                key={`${link.label}-${index}`}
                                type="button"
                                onClick={() => handleLinkClick(link.url)}
                                className="py-1 text-sm font-semibold text-elvee-blue transition hover:text-feather-gold focus:outline-none"
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
                            className="rounded-full px-3 py-1 text-sm font-semibold bg-white border border-slate-200 text-elvee-blue transition hover:bg-elvee-blue hover:text-white hover:border-elvee-blue focus:outline-none focus:ring-2 focus:ring-feather-gold focus:ring-offset-2"
                        >
                            {cleanLabel}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
