/**
 * Utility function to get media/image URLs
 * Uses environment configuration instead of hardcoded backend URLs
 */
import { env } from "@/config/env";

/**
 * Get the full URL for a media/image file
 * @param url - The relative URL from the backend (e.g., "/storage/products/image.jpg")
 * @returns The full URL or relative URL depending on configuration
 */
export function getMediaUrl(url: string | null | undefined): string {
    if (!url) return "";

    // If already absolute, return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }

    // Get backend base URL from environment
    const baseUrl = env.backendBaseUrl;

    // If no base URL configured, return relative URL (works with proxy/rewrite)
    if (!baseUrl) {
        return url.startsWith("/") ? url : `/${url}`;
    }

    // Construct full URL
    const cleanUrl = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`.replace(/(?<!:)\/{2,}/g, "/");
}

/**
 * Get media URL that returns null for empty inputs (for nullable types)
 */
export function getMediaUrlNullable(
    url: string | null | undefined
): string | null {
    if (!url) return null;
    return getMediaUrl(url);
}
