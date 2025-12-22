import apiClient from './api';

// Frontend/Customer API Service - All customer-facing endpoints
export const frontendService = {
  // Dashboard
  async getDashboard() {
    return await apiClient.get('/dashboard');
  },
};

