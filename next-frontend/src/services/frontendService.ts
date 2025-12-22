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
    // Build query params
    // Axios automatically handles arrays by repeating the parameter name
    // e.g., catalog: ['1'] becomes catalog=1, catalog: ['1', '2'] becomes catalog=1&catalog=2
    // Backend DTO uses @Transform(toArray) which converts single values to arrays
    const params: Record<string, any> = {};
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Convert all values to strings for query params
          if (Array.isArray(value)) {
            // Array: axios will serialize as repeated params (catalog=1&catalog=2)
            params[key] = value.map(v => String(v));
          } else {
            // Single value: convert to string
            // Backend @Transform(toArray) will convert to array if needed
            params[key] = String(value);
          }
        }
      });
    }

    return await apiClient.get('/catalog', { params });
  },

  // Navigation
  async getNavigation() {
    return await apiClient.get('/navigation');
  },
};

