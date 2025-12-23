import apiClient from "./api";

export const kycService = {
  async getOnboardingData() {
    return await apiClient.get("/onboarding/kyc");
  },

  async getProfile() {
    return await apiClient.get("/kyc/profile");
  },

  async updateProfile(data: any) {
    return await apiClient.patch("/onboarding/kyc/profile", data);
  },

  async getDocuments() {
    return await apiClient.get("/kyc/documents");
  },

  async uploadDocument(type: string, file: File) {
    const formData = new FormData();
    formData.append("document_type", type);
    formData.append("document_file", file);
    return await apiClient.post("/onboarding/kyc/documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async deleteDocument(id: number) {
    return await apiClient.delete(`/onboarding/kyc/documents/${id}`);
  },

  async getMessages() {
    return await apiClient.get("/kyc/messages");
  },

  async addMessage(message: string) {
    return await apiClient.post("/onboarding/kyc/messages", { message });
  },

  async getDocumentTypes() {
    return await apiClient.get("/onboarding/kyc/document-types");
  },

  async updateStatus(id: string, status: string, remarks: string) {
    return await apiClient.patch(`/kyc/${id}/status`, { status, remarks });
  },
};

