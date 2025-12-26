/**
 * Shared formatting utilities
 */

/**
 * Currency formatter for INR (Indian Rupees)
 * Used consistently across the application
 */
export const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
});

/**
 * Number formatter for Indian locale
 */
export const numberFormatter = new Intl.NumberFormat('en-IN');

/**
 * Format currency amount
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "₹10,000")
 */
export function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
        return currencyFormatter.format(0);
    }
    return currencyFormatter.format(amount);
}

/**
 * Format number with Indian locale
 * @param value - Number to format
 * @returns Formatted number string (e.g., "10,000")
 */
export function formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) {
        return '0';
    }
    return numberFormatter.format(value);
}

/**
 * Prettify key (convert snake_case to Title Case)
 * @param key - Key to prettify (e.g., "active_offers")
 * @returns Prettified string (e.g., "Active Offers")
 */
export function prettifyKey(key: string): string {
    return key
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

