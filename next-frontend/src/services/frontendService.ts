import apiClient from './api';

// Frontend/Customer API Service - All customer-facing endpoints
export const frontendService = {
  // Dashboard
  async getDashboard() {
    return await apiClient.get('/dashboard');
  },

  // Catalog
  async getCatalog(filters?: {
    brand?: string | string[];
    metal?: string | string[];
    metal_purity?: string | string[];
    metal_tone?: string | string[];
    diamond?: string | string[];
    price_min?: number;
    price_max?: number;
    search?: string;
    category?: string | string[] | number[];
    catalog?: string | string[] | number[];
    sort?: string;
    ready_made?: string;
    page?: number;
  }) {
    // Convert filters to query params
    const params: Record<string, any> = {};
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // For arrays, append each value
            value.forEach(v => {
              if (!params[key]) params[key] = [];
              params[key].push(v);
            });
          } else {
            params[key] = value;
          }
        }
      });
    }

    return await apiClient.get('/catalog', { params });
  },
};

