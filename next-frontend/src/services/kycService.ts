import apiClient from "./api";

export const kycService = {
  async getProfile() {
    return await apiClient.get("/kyc/profile");
  },

  async updateProfile(data: any) {
    return await apiClient.patch("/kyc/profile", data);
  },

  async getDocuments() {
    return await apiClient.get("/kyc/documents");
  },

  async uploadDocument(type: string, file: File) {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);
    return await apiClient.post("/kyc/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async getMessages() {
    return await apiClient.get("/kyc/messages");
  },

  async addMessage(message: string) {
    return await apiClient.post("/kyc/messages", { message });
  },

  async updateStatus(id: string, status: string, remarks: string) {
    return await apiClient.patch(`/kyc/${id}/status`, { status, remarks });
  },
};

