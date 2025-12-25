import axios from "axios";
import { AxiosError, InternalAxiosRequestConfig } from "axios";

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
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  paramsSerializer: paramsSerializer, // Use custom serializer function
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
import { tokenService } from './tokenService';

// Add request interceptor for tokens and KYC check
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      // Get token from token service
      let token = tokenService.getToken();
      
      // If no token and not a public endpoint, try to refresh
      if (!token && !isKycEndpoint(config.url || "")) {
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

// Add response interceptor to handle token refresh and errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        // Refresh failed, redirect to login
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
          
          if (!publicPaths.some(path => currentPath.startsWith(path))) {
            tokenService.removeToken();
            window.location.href = '/login';
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
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

