import apiClient from "./api";
import { tokenService } from "./tokenService";

// Request deduplication: prevent multiple simultaneous calls to me()
let meRequestPromise: Promise<any> | null = null;

export const authService = {
  async login(data: { email: string; password: string; remember?: boolean }) {
    const response = await apiClient.post("/auth/login", data);
    if (response.data.access_token) {
      // Store token only, no user data
      tokenService.setToken(response.data.access_token);
      
      // Refresh token to ensure it's valid
      await tokenService.refreshToken();
    }
    return response;
  },

  async requestOtp(email: string) {
    return await apiClient.post("/auth/otp/request", { email });
  },

  async verifyOtp(data: { email: string; code: string }) {
    const response = await apiClient.post("/auth/otp/verify", data);
    if (response.data.access_token) {
      // Store token only, no user data
      tokenService.setToken(response.data.access_token);
      
      // Refresh token to ensure it's valid
      await tokenService.refreshToken();
    }
    return response;
  },

  async register(data: any) {
    const response = await apiClient.post("/auth/register", data);
    if (response.data.access_token) {
      // Store token only, no user data
      tokenService.setToken(response.data.access_token);
      
      // Refresh token to ensure it's valid
      await tokenService.refreshToken();
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
    // Remove token only
    tokenService.removeToken();
    // NestJS side usually doesn't need a logout call for JWT unless blacklisting
    // but we can call it if implemented.
  },

  async me() {
    // Request deduplication: if a request is already in flight, return the same promise
    if (meRequestPromise) {
      return meRequestPromise;
    }

    // ALWAYS fetch fresh user data from API
    // User data is never stored in localStorage, only token is stored
    meRequestPromise = (async () => {
      try {
        // Ensure token is valid before making request
        if (!tokenService.hasToken()) {
          await tokenService.refreshToken();
        }
        
        // Always fetch fresh data from API
        const response = await apiClient.get("/kyc/profile");
        
        // Update token if provided in response
        if (response.data?.access_token) {
          tokenService.setToken(response.data.access_token);
        }
        
        return response;
      } catch (error) {
        // If API call fails, try to refresh token and retry once
        try {
          await tokenService.refreshToken();
          const retryResponse = await apiClient.get("/kyc/profile");
          if (retryResponse.data?.access_token) {
            tokenService.setToken(retryResponse.data.access_token);
          }
          return retryResponse;
        } catch (retryError) {
          // If retry also fails, throw error
          throw retryError;
        }
      } finally {
        // Clear the promise so subsequent calls can make new requests
        meRequestPromise = null;
      }
    })();

    return meRequestPromise;
  },
};

