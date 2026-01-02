import axios from "axios";
import { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { toastError, toastSuccess } from "@/utils/toast";

// Custom params serializer to handle arrays without brackets
// NestJS expects repeated params: category=2&category=3 (not category[]=2&category[]=3)
const paramsSerializer = (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            return; // Skip null/undefined values
        }

        if (Array.isArray(value)) {
            // For arrays, append each value with the same key (repeated params)
            value.forEach((item) => {
                if (item !== null && item !== undefined) {
                    searchParams.append(key, String(item));
                }
            });
        } else {
            // For single values, just set the param
            searchParams.set(key, String(value));
        }
    });

    return searchParams.toString();
};

const apiClient = axios.create({
    baseURL: env.apiUrl,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    paramsSerializer: paramsSerializer, // Use custom serializer function
    timeout: 30000, // 30 seconds timeout
});

// Cancel token source for aborting requests during logout
let cancelTokenSource: AbortController | null = null;

// Function to cancel all pending requests
export const cancelAllRequests = () => {
    if (cancelTokenSource) {
        cancelTokenSource.abort();
    }
    cancelTokenSource = new AbortController();
};

// Create new cancel token source on initialization
cancelTokenSource = new AbortController();

// KYC check removed - backend will handle KYC validation
// User data is no longer stored in localStorage, only token is stored

// Helper function to check if endpoint is KYC-related (allowed)
const isKycEndpoint = (url: string): boolean => {
    const kycEndpoints = [
        "/auth/", // Auth endpoints are allowed
        "/kyc/", // KYC endpoints are allowed
        "/onboarding/kyc", // KYC onboarding
    ];

    return kycEndpoints.some((endpoint) => url.includes(endpoint));
};

// Import token service
import { tokenService } from "./tokenService";

// Add request interceptor for tokens and KYC check
apiClient.interceptors.request.use(
    async (config) => {
        if (typeof window !== "undefined") {
            // CRITICAL: Block all requests if logout is in progress
            const isLoggingOut = (window as any).__isLoggingOut === true;
            if (isLoggingOut) {
                // Cancel the request immediately
                const error = new Error(
                    "Request cancelled: Logout in progress"
                );
                (error as any).isCancel = true;
                return Promise.reject(error);
            }

            // Get token from token service
            let token = tokenService.getToken();

            // If no token and not a public endpoint, try to refresh
            // But NEVER try to refresh if we're on home page (/)
            // Home page should always be accessible without authentication
            const isOnHomePage = window.location.pathname === "/";

            if (!token && !isKycEndpoint(config.url || "") && !isOnHomePage) {
                token = await tokenService.refreshToken();
                // If refresh token returns null, token was removed due to error
                // The request will proceed without token and fail with 401,
                // which will be handled by the response interceptor
            }

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // Add cancel token to request
            if (cancelTokenSource) {
                config.signal = cancelTokenSource.signal;
            }

            // Block API calls if KYC is not approved (except KYC endpoints)
            // Note: KYC check removed as user data is no longer in localStorage
            // Backend will handle KYC validation
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle token refresh, errors, and success messages
apiClient.interceptors.response.use(
    (response) => {
        // Handle success messages if present in response
        // Check if response has a success message in data
        if (
            response.data?.message &&
            typeof response.data.message === "string"
        ) {
            // Only show success toast for POST, PUT, PATCH, DELETE methods
            const method = response.config.method?.toUpperCase();
            if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
                // Check if this is a silent request (no toast needed)
                const isSilent =
                    response.config.headers?.["X-Silent-Request"] === "true";

                // Don't show success toasts for customer panel routes
                const isCustomerPanel =
                    typeof window !== "undefined" &&
                    !window.location.pathname.startsWith("/admin") &&
                    !window.location.pathname.startsWith("/production");

                if (!isSilent && !isCustomerPanel) {
                    toastSuccess(response.data.message);
                }
            }
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // Handle 401 Unauthorized - token expired or invalid
        if (error.response?.status === 401) {
            // Don't try to refresh if we're on home page (/)
            // Home page should never trigger redirects to login
            const isOnHomePage =
                typeof window !== "undefined" &&
                window.location.pathname === "/";

            if (isOnHomePage) {
                return Promise.reject(error);
            }

            // Check if this is a refresh-token request itself
            // If refresh-token fails, we should redirect immediately (no retry loop)
            const requestUrl = originalRequest?.url || "";
            const isRefreshTokenRequest =
                requestUrl.includes("/auth/refresh-token") ||
                requestUrl.includes("refresh-token");

            // If this is a refresh-token request that failed, redirect immediately
            if (isRefreshTokenRequest) {
                if (typeof window !== "undefined") {
                    const currentPath = window.location.pathname;
                    const publicPaths = [
                        "/login",
                        "/register",
                        "/forgot-password",
                        "/reset-password",
                        "/verify-email",
                    ];

                    if (
                        !isOnHomePage &&
                        !publicPaths.some((path) =>
                            currentPath.startsWith(path)
                        )
                    ) {
                        tokenService.removeToken();
                        // Use replace to prevent back button navigation
                        window.location.replace("/login");
                        // Return a promise that never resolves to prevent further processing
                        return new Promise(() => {});
                    }
                }
                return Promise.reject(error);
            }

            // If this is not a retry, try to refresh token
            if (!originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Try to refresh token
                    const newToken = await tokenService.refreshToken();

                    if (newToken && originalRequest.headers) {
                        // Retry original request with new token
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return apiClient(originalRequest);
                    } else {
                        // No token returned from refresh - token was removed due to error
                        // Redirect to login
                        throw new Error(
                            "Token refresh failed - no token returned"
                        );
                    }
                } catch (refreshError: any) {
                    // Refresh failed - ensure token is removed and redirect to login
                    // ONLY if:
                    // 1. Not on home page (/)
                    // 2. Not on other public paths
                    // This ensures home page is always accessible and never redirected to login
                    tokenService.removeToken(); // Ensure token is removed

                    if (!isOnHomePage && typeof window !== "undefined") {
                        const currentPath = window.location.pathname;
                        const publicPaths = [
                            "/login",
                            "/register",
                            "/forgot-password",
                            "/reset-password",
                            "/verify-email",
                        ];

                        // Only redirect to login if not on public paths
                        // Home page (/) is explicitly excluded above (isOnHomePage check)
                        if (
                            !publicPaths.some((path) =>
                                currentPath.startsWith(path)
                            )
                        ) {
                            // Use replace to prevent back button navigation
                            window.location.replace("/login");
                            // Return a promise that never resolves to prevent further processing
                            return new Promise(() => {});
                        }
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // Already retried - redirect immediately
                if (typeof window !== "undefined") {
                    const currentPath = window.location.pathname;
                    const publicPaths = [
                        "/login",
                        "/register",
                        "/forgot-password",
                        "/reset-password",
                        "/verify-email",
                    ];

                    if (
                        !isOnHomePage &&
                        !publicPaths.some((path) =>
                            currentPath.startsWith(path)
                        )
                    ) {
                        tokenService.removeToken();
                        window.location.replace("/login");
                        // Return a promise that never resolves to prevent further processing
                        return new Promise(() => {});
                    }
                }
                return Promise.reject(error);
            }
        }

        // Handle 403 Forbidden - KYC or other permission issues
        if (error.response?.status === 403 && typeof window !== "undefined") {
            const errorMessage = error.response?.data as any;
            if (
                errorMessage?.message?.includes("KYC") ||
                errorMessage?.error?.includes("KYC")
            ) {
                // Only redirect if not already on KYC page
                if (window.location.pathname !== "/onboarding/kyc") {
                    window.location.href = "/onboarding/kyc";
                }
                // Don't show toast for KYC redirects
                return Promise.reject(error);
            }
        }

        // Check if request was cancelled (logout in progress)
        const isCancelled =
            (error as any).isCancel ||
            error.code === "ERR_CANCELED" ||
            error.message?.includes("cancelled");
        const isLoggingOut =
            typeof window !== "undefined" &&
            (window as any).__isLoggingOut === true;

        // If request was cancelled or logout is in progress, don't show error
        if (isCancelled || isLoggingOut) {
            return Promise.reject(error);
        }

        // Show error toast for all API errors (except 401/403 which are handled above)
        // BUT: Suppress errors when user is logged out (no token) to prevent multiple toasts during logout
        const hasToken =
            typeof window !== "undefined" && tokenService.hasToken();
        const isOnHomePage =
            typeof window !== "undefined" && window.location.pathname === "/";
        const isOnLoginPage =
            typeof window !== "undefined" &&
            window.location.pathname === "/login";

        // Don't show error toasts if:
        // 1. User is logging out (prevents multiple toasts during logout)
        // 2. User is logged out (no token) - prevents multiple toasts after logout
        // 3. On home page (public page, errors are expected)
        // 4. On login page (errors are handled by login form)
        const shouldSuppressToast =
            isLoggingOut || !hasToken || isOnHomePage || isOnLoginPage;

        if (error.response && typeof window !== "undefined") {
            const errorData = error.response.data as any;
            const errorMessage =
                errorData?.message ||
                errorData?.error ||
                error.response.statusText ||
                "An error occurred. Please try again.";

            // Check if this is a silent request (no toast needed)
            const isSilent =
                originalRequest?.headers?.["X-Silent-Request"] === "true";
            if (!isSilent && !shouldSuppressToast) {
                toastError(errorMessage);
            }
        } else if (error.request && typeof window !== "undefined") {
            // Network error (no response received)
            const isSilent =
                originalRequest?.headers?.["X-Silent-Request"] === "true";
            if (!isSilent && !shouldSuppressToast) {
                toastError(
                    "Network error. Please check your connection and try again."
                );
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
