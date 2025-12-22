import apiClient from "./api";

export const homeService = {
  async getHomeData() {
    return await apiClient.get("/home");
  },
};

