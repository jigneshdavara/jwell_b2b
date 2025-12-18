'use client';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    startIndex: number;
    endIndex: number;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    startIndex,
    endIndex,
}: PaginationProps) {
    if (totalItems === 0) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-sm text-slate-600">
                    Showing <span className="font-semibold text-slate-900">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-slate-900">{Math.min(endIndex, totalItems)}</span> of{' '}
                    <span className="font-semibold text-slate-900">{totalItems}</span> items
                </span>
                <div className="flex items-center gap-2">
                    <label htmlFor="items-per-page" className="text-sm text-slate-600">Show:</label>
                    <select
                        id="items-per-page" value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-elvee-blue focus:outline-none focus:ring-2 focus:ring-elvee-blue/20"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>
            {totalPages > 1 && (
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex items-center gap-1">
                        {getPageNumbers().map((page, index) => (
                            page === '...' ? <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400">...</span> :
                            <button key={page} type="button" onClick={() => onPageChange(page as number)} className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border px-3 text-sm font-medium ${page === currentPage ? 'border-elvee-blue bg-elvee-blue text-white shadow-sm' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>{page}</button>
                        ))}
                    </div>
                    <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            )}
        </div>
    );
}

