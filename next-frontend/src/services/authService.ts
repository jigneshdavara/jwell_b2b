import apiClient from "./api";

export const authService = {
  async csrf() {
    return await apiClient.get("/csrf-cookie", { baseURL: "http://localhost:8000/sanctum" });
  },

  async login(data: any) {
    return await apiClient.post("/login", data);
  },

  async confirmPassword(data: any) {
    return await apiClient.post("/user/confirm-password", data);
  },

  async resendVerificationEmail() {
    return await apiClient.post("/email/verification-notification");
  },

  async resetPassword(data: any) {
    return await apiClient.post("/reset-password", data);
  },

  async forgotPassword(data: any) {
    return await apiClient.post("/forgot-password", data);
  },

  async register(data: any) {
    return await apiClient.post("/register", data);
  },

  async logout() {
    return await apiClient.post("/logout");
  },

  async me() {
    return await apiClient.get("/user");
  },
};

