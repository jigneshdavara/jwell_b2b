import { toast } from "react-toastify";

// Deduplication: Track recent toasts to prevent duplicates
const recentToasts = new Map<string, number>();
const DEDUPLICATION_INTERVAL = 3000; // 3 seconds (increased from 2 to catch more duplicates)

/**
 * Normalize message for deduplication
 * Removes trailing punctuation and normalizes whitespace to catch similar messages
 */
const normalizeMessage = (message: string): string => {
    return message
        .trim()
        .replace(/[.!?]+$/, "") // Remove trailing punctuation
        .replace(/\s+/g, " ") // Normalize whitespace
        .toLowerCase();
};

/**
 * Show a deduplicated toast
 * Prevents the same (or similar) message from showing multiple times within 3 seconds
 */
const showDeduplicatedToast = (
    toastFn: (message: string, options?: any) => void,
    message: string,
    duration?: number
) => {
    const normalizedMessage = normalizeMessage(message);
    const now = Date.now();
    const lastShown = recentToasts.get(normalizedMessage);

    // If the same (or similar) message was shown recently, skip it
    if (lastShown && now - lastShown < DEDUPLICATION_INTERVAL) {
        return;
    }

    // Show the toast
    toastFn(message, {
        autoClose: duration || 5000,
        position: "top-right",
    });

    // Record when this message was shown (use normalized key)
    recentToasts.set(normalizedMessage, now);

    // Clean up old entries to prevent memory leak
    setTimeout(() => {
        if (recentToasts.get(normalizedMessage) === now) {
            recentToasts.delete(normalizedMessage);
        }
    }, DEDUPLICATION_INTERVAL + 100); // A bit longer than the interval
};

/**
 * Show a success toast
 */
export const toastSuccess = (message: string, duration?: number) => {
    showDeduplicatedToast(toast.success, message, duration);
};

/**
 * Show an error toast
 */
export const toastError = (message: string, duration?: number) => {
    showDeduplicatedToast(toast.error, message, duration);
};

/**
 * Show an info toast
 */
export const toastInfo = (message: string, duration?: number) => {
    showDeduplicatedToast(toast.info, message, duration);
};

/**
 * Show a warning toast
 */
export const toastWarning = (message: string, duration?: number) => {
    showDeduplicatedToast(toast.warning, message, duration);
};

/**
 * Show a toast (generic)
 */
export const showToast = (
    type: "success" | "error" | "info" | "warning",
    message: string,
    duration?: number
) => {
    const toastFn = {
        success: toast.success,
        error: toast.error,
        info: toast.info,
        warning: toast.warning,
    }[type];

    showDeduplicatedToast(toastFn, message, duration);
};
