import { toast } from "react-toastify";

// Simple deduplication: Track recent toasts to prevent duplicates
const recentToasts = new Map<string, number>();
const DEDUPLICATION_INTERVAL = 2000; // 2 seconds

/**
 * Normalize message for better deduplication
 * Removes trailing punctuation and normalizes whitespace
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
 * Prevents the same or similar message from showing multiple times within 2 seconds
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

    // Show the toast with a unique ID based on normalized message to prevent duplicates
    toastFn(message, {
        autoClose: duration || 5000,
        toastId: normalizedMessage, // Use normalized message as ID to prevent duplicates
    });

    // Record when this message was shown (use normalized key)
    recentToasts.set(normalizedMessage, now);

    // Clean up old entries to prevent memory leak
    setTimeout(() => {
        if (recentToasts.get(normalizedMessage) === now) {
            recentToasts.delete(normalizedMessage);
        }
    }, DEDUPLICATION_INTERVAL + 100);
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
