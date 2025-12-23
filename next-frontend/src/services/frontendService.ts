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

  // Wishlist
  async getWishlist() {
    return await apiClient.get('/wishlist');
  },

  async addToWishlist(data: {
    product_id: number;
    product_variant_id?: number;
    configuration?: Record<string, any>;
  }) {
    return await apiClient.post('/wishlist/items', data);
  },

  async removeFromWishlist(itemId: number) {
    return await apiClient.delete(`/wishlist/items/${itemId}`);
  },

  async moveToCart(itemId: number, quantity?: number) {
    return await apiClient.post(`/wishlist/items/${itemId}/move-to-cart`, {
      quantity: quantity || 1,
    });
  },

  async removeFromWishlistByProduct(productId: number, variantId?: number | null) {
    return await apiClient.delete(`/wishlist/product/${productId}`, {
      data: variantId ? { product_variant_id: variantId } : undefined,
    });
  },

  // Cart
  async getCart() {
    return await apiClient.get('/cart');
  },
  async addToCart(productId: number, variantId?: number | null, quantity: number = 1, configuration?: Record<string, any>) {
    return await apiClient.post('/cart/items', {
      product_id: productId,
      product_variant_id: variantId ?? undefined,
      quantity,
      configuration: configuration || {},
    });
  },
  async updateCartItem(itemId: number, quantity?: number, configuration?: Record<string, any>) {
    const body: any = {};
    if (quantity !== undefined) body.quantity = quantity;
    if (configuration !== undefined) body.configuration = configuration;
    return await apiClient.patch(`/cart/items/${itemId}`, body);
  },
  async removeCartItem(itemId: number) {
    return await apiClient.delete(`/cart/items/${itemId}`);
  },
  async submitQuotationsFromCart() {
    return await apiClient.post('/quotations/from-cart');
  },
};

