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

                    if (!link.url) {
                        return (
                            <span key={`${link.label}-${index}`} className="rounded-full px-3 py-1 text-sm text-slate-400">
                                {cleanLabel}
                            </span>
                        );
                    }

                    return (
                        <button
                            key={`${link.label}-${index}`}
                            type="button"
                            onClick={() => handleLinkClick(link.url)}
                            className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                                link.active 
                                    ? 'bg-sky-600 text-white shadow shadow-sky-600/20' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {cleanLabel}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
