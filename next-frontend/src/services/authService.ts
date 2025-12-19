import apiClient from "./api";

export const authService = {
  async login(data: any) {
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

  async logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    // NestJS side usually doesn't need a logout call for JWT unless blacklisting
    // but we can call it if implemented.
  },

  async me() {
    // If we have a user in local storage, return it, otherwise try to fetch profile
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      return { data: JSON.parse(savedUser) };
    }
    return await apiClient.get("/kyc/profile");
  },
};

