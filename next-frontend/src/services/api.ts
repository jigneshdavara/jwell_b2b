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
            // Get token from token service
            let token = tokenService.getToken();

            // If no token and not a public endpoint, try to refresh
            // But NEVER try to refresh if we're on home page (/)
            // Home page should always be accessible without authentication
            const isOnHomePage = window.location.pathname === "/";

            if (!token && !isKycEndpoint(config.url || "") && !isOnHomePage) {
                token = await tokenService.refreshToken();
            }

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
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
                if (!isSilent) {
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
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't try to refresh if we're on home page (/)
            // Home page should never trigger redirects to login
            const isOnHomePage =
                typeof window !== "undefined" &&
                window.location.pathname === "/";

            if (isOnHomePage) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                // Try to refresh token
                const newToken = await tokenService.refreshToken();

                if (newToken && originalRequest.headers) {
                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed - redirect to login ONLY if:
                // 1. Not on home page (/)
                // 2. Not on other public paths
                // This ensures home page is always accessible and never redirected to login
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
                        tokenService.removeToken();
                        window.location.href = "/login";
                    }
                }
                return Promise.reject(refreshError);
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

        // Show error toast for all API errors (except 401/403 which are handled above)
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
            if (!isSilent) {
                toastError(errorMessage);
            }
        } else if (error.request && typeof window !== "undefined") {
            // Network error (no response received)
            const isSilent =
                originalRequest?.headers?.["X-Silent-Request"] === "true";
            if (!isSilent) {
                toastError(
                    "Network error. Please check your connection and try again."
                );
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
