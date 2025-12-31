export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginationMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from?: number;
    to?: number;
    links?: PaginationLink[];
};

/**
 * Generate Laravel-style pagination links
 * Matches Laravel's default pagination behavior:
 * - Shows first page, pages around current, and last page
 * - Uses ellipsis for gaps
 * - Previous/Next links
 */
export function generatePaginationLinks(currentPage: number, lastPage: number): PaginationLink[] {
    const links: PaginationLink[] = [];
    
    if (lastPage <= 1) {
        return links;
    }
    
    // Previous link (Laravel uses "&laquo; Previous")
    links.push({
        url: currentPage > 1 ? `?page=${currentPage - 1}` : null,
        label: '&laquo; Previous',
        active: false,
    });
    
    // Calculate which pages to show
    const pagesToShow: number[] = [];
    
    if (lastPage <= 7) {
        // If 7 or fewer pages, show all
        for (let i = 1; i <= lastPage; i++) {
            pagesToShow.push(i);
        }
    } else {
        // Always show first page
        pagesToShow.push(1);
        
        // Calculate start and end around current page
        let start = Math.max(2, currentPage - 2);
        let end = Math.min(lastPage - 1, currentPage + 2);
        
        // Adjust if we're near the start
        if (currentPage <= 4) {
            start = 2;
            end = Math.min(5, lastPage - 1);
        }
        
        // Adjust if we're near the end
        if (currentPage >= lastPage - 3) {
            start = Math.max(2, lastPage - 4);
            end = lastPage - 1;
        }
        
        // Add ellipsis before if needed
        if (start > 2) {
            pagesToShow.push(-1); // -1 represents ellipsis
        }
        
        // Add pages around current
        for (let i = start; i <= end; i++) {
            pagesToShow.push(i);
        }
        
        // Add ellipsis after if needed
        if (end < lastPage - 1) {
            pagesToShow.push(-1); // -1 represents ellipsis
        }
        
        // Always show last page
        if (lastPage > 1) {
            pagesToShow.push(lastPage);
        }
    }
    
    // Convert page numbers to links
    for (const page of pagesToShow) {
        if (page === -1) {
            // Ellipsis
            links.push({
                url: null,
                label: '...',
                active: false,
            });
        } else {
            links.push({
                url: page !== currentPage ? `?page=${page}` : null,
                label: String(page),
                active: page === currentPage,
            });
        }
    }
    
    // Next link (Laravel uses "Next &raquo;")
    links.push({
        url: currentPage < lastPage ? `?page=${currentPage + 1}` : null,
        label: 'Next &raquo;',
        active: false,
    });
    
    return links;
}

/**
 * Extract page number from URL query string
 */
export function extractPageFromUrl(url: string | null): number | null {
    if (!url) {
        return null;
    }
    try {
        // Handle both full URLs and query strings
        let urlToParse = url;
        if (url.startsWith('?')) {
            // If it's just a query string, prepend the current pathname
            urlToParse = window.location.pathname + url;
        }
        const urlObj = new URL(urlToParse, window.location.origin);
        const page = urlObj.searchParams.get('page');
        return page ? Number(page) : null;
    } catch {
        // Fallback: try to extract page number directly from query string
        const match = url.match(/[?&]page=(\d+)/);
        return match ? Number(match[1]) : null;
    }
}

