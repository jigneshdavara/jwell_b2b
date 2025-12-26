import { toast } from 'react-toastify';

/**
 * Show a success toast
 */
export const toastSuccess = (message: string, duration?: number) => {
    toast.success(message, {
        autoClose: duration || 5000,
        position: 'top-right',
    });
};

/**
 * Show an error toast
 */
export const toastError = (message: string, duration?: number) => {
    toast.error(message, {
        autoClose: duration || 5000,
        position: 'top-right',
    });
};

/**
 * Show an info toast
 */
export const toastInfo = (message: string, duration?: number) => {
    toast.info(message, {
        autoClose: duration || 5000,
        position: 'top-right',
    });
};

/**
 * Show a warning toast
 */
export const toastWarning = (message: string, duration?: number) => {
    toast.warning(message, {
        autoClose: duration || 5000,
        position: 'top-right',
    });
};

/**
 * Show a toast (generic)
 */
export const showToast = (type: 'success' | 'error' | 'info' | 'warning', message: string, duration?: number) => {
    const toastFn = {
        success: toast.success,
        error: toast.error,
        info: toast.info,
        warning: toast.warning,
    }[type];

    toastFn(message, {
        autoClose: duration || 5000,
        position: 'top-right',
    });
};
