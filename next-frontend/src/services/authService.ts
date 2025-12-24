import apiClient from "./api";

// Request deduplication: prevent multiple simultaneous calls to me()
let meRequestPromise: Promise<any> | null = null;

export const authService = {
  async login(data: { email: string; password: string; remember?: boolean }) {
    const response = await apiClient.post("/auth/login", data);
    if (response.data.access_token) {
      localStorage.setItem("auth_token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response;
  },

  async requestOtp(email: string) {
    return await apiClient.post("/auth/otp/request", { email });
  },

  async verifyOtp(data: { email: string; code: string }) {
    const response = await apiClient.post("/auth/otp/verify", data);
    if (response.data.access_token) {
      localStorage.setItem("auth_token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response;
  },

  async register(data: any) {
    const response = await apiClient.post("/auth/register", data);
    if (response.data.access_token) {
      localStorage.setItem("auth_token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response;
  },

  async forgotPassword(email: string) {
    return await apiClient.post("/auth/forgot-password", { email });
  },

  async resetPassword(data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    return await apiClient.post("/auth/reset-password", data);
  },

  async verifyEmail(id: string, hash: string) {
    return await apiClient.get(`/auth/verify-email/${id}/${hash}`);
  },

  async resendVerification(email: string) {
    return await apiClient.post("/auth/email/verification-notification", {
      email,
    });
  },

  async confirmPassword(password: string) {
    return await apiClient.post("/auth/confirm-password", { password });
  },

  async logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    // NestJS side usually doesn't need a logout call for JWT unless blacklisting
    // but we can call it if implemented.
  },

  async me() {
    // Request deduplication: if a request is already in flight, return the same promise
    if (meRequestPromise) {
      return meRequestPromise;
    }

    // ALWAYS fetch fresh user data from API to get latest KYC status
    // Don't rely on localStorage cache as KYC status can change on backend
    // This ensures localStorage is always up-to-date
    meRequestPromise = (async () => {
      try {
        // Preserve existing token before updating (in case API doesn't return one)
        const existingToken = localStorage.getItem("auth_token");
        
        // Always fetch fresh data from API
        const response = await apiClient.get("/kyc/profile");
        
        // Update localStorage atomically - both user and token together
        if (response.data) {
          // Update user data with fresh data from API
          localStorage.setItem("user", JSON.stringify(response.data));
          
          // Update auth_token if provided in response, otherwise preserve existing token
          // This ensures token and user data stay in sync
          if (response.data.access_token) {
            localStorage.setItem("auth_token", response.data.access_token);
          } else if (existingToken) {
            // If API doesn't return token, preserve existing token
            localStorage.setItem("auth_token", existingToken);
          }
        }
        
        return response;
      } catch (error) {
        // If API call fails, fall back to localStorage cache as last resort
        // But log the error so we know there's an issue
        console.error("Failed to fetch user data from API:", error);
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          return { data: JSON.parse(savedUser) };
        }
        throw error;
      } finally {
        // Clear the promise so subsequent calls can make new requests
        meRequestPromise = null;
      }
    })();

    return meRequestPromise;
  },
};

