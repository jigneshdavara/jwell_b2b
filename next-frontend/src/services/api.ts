import axios from "axios";
import { AxiosError, InternalAxiosRequestConfig } from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Helper function to check if KYC is approved
const isKycApproved = (): boolean => {
  if (typeof window === "undefined") return true; // Server-side, allow
  
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return true; // No user, let auth handle it
    
    const user = JSON.parse(userStr);
    const userType = (user?.type ?? "").toLowerCase();
    const isCustomer = ["retailer", "wholesaler", "sales"].includes(userType);
    
    // Only enforce KYC for customers
    if (!isCustomer) return true;
    
    const kycStatus = user?.kyc_status || user?.kycStatus;
    return kycStatus === "approved";
  } catch {
    return true; // On error, allow (let backend handle)
  }
};

// Helper function to check if endpoint is KYC-related (allowed)
const isKycEndpoint = (url: string): boolean => {
  const kycEndpoints = [
    "/auth/", // Auth endpoints are allowed
    "/kyc/", // KYC endpoints are allowed
    "/onboarding/kyc", // KYC onboarding
  ];
  
  return kycEndpoints.some((endpoint) => url.includes(endpoint));
};

// Add request interceptor for tokens and KYC check
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Block API calls if KYC is not approved (except KYC endpoints)
      if (!isKycEndpoint(config.url || "")) {
        if (!isKycApproved()) {
          // Reject the request with a clear error
          return Promise.reject(
            new axios.AxiosError(
              "KYC approval required to access this resource.",
              "KYC_REQUIRED",
              config,
              undefined,
              {
                status: 403,
                statusText: "KYC approval required",
              } as any
            )
          );
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 403 KYC errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // If backend returns 403 for KYC, redirect to KYC page
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

