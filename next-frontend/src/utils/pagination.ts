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
 * Shows pages 1-10, then ellipsis, then last 2 pages
 */
export function generatePaginationLinks(currentPage: number, lastPage: number): PaginationLink[] {
    const links: PaginationLink[] = [];
    
    // Previous link
    links.push({
        url: currentPage > 1 ? `?page=${currentPage - 1}` : null,
        label: '« Previous',
        active: false,
    });
    
    // Page number links: Show 1-10, then ellipsis, then last 2 pages
    if (lastPage <= 10) {
        // If 10 or fewer pages, show all
        for (let i = 1; i <= lastPage; i++) {
            links.push({
                url: `?page=${i}`,
                label: String(i),
                active: i === currentPage,
            });
        }
    } else {
        // Show pages 1-10
        for (let i = 1; i <= 10; i++) {
            links.push({
                url: `?page=${i}`,
                label: String(i),
                active: i === currentPage,
            });
        }
        
        // Add ellipsis
        links.push({
            url: null,
            label: '...',
            active: false,
        });
        
        // Show last 2 pages
        for (let i = lastPage - 1; i <= lastPage; i++) {
            links.push({
                url: `?page=${i}`,
                label: String(i),
                active: i === currentPage,
            });
        }
    }
    
    // Next link
    links.push({
        url: currentPage < lastPage ? `?page=${currentPage + 1}` : null,
        label: 'Next »',
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
        const urlObj = new URL(url, window.location.origin);
        const page = urlObj.searchParams.get('page');
        return page ? Number(page) : null;
    } catch {
        return null;
    }
}

