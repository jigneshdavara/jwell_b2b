import apiClient from './api';

// Admin API Service - All admin endpoints
export const adminService = {
  // Dashboard
  async getDashboard() {
    return await apiClient.get('/admin/dashboard');
  },

  // Brands
  async getBrands(page = 1, perPage = 20) {
    return await apiClient.get('/admin/brands', { params: { page, per_page: perPage } });
  },
  async getBrand(id: number) {
    return await apiClient.get(`/admin/brands/${id}`);
  },
  async createBrand(data: FormData) {
    return await apiClient.post('/admin/brands', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  async updateBrand(id: number, data: FormData) {
    return await apiClient.patch(`/admin/brands/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  async deleteBrand(id: number) {
    return await apiClient.delete(`/admin/brands/${id}`);
  },
  async bulkDeleteBrands(ids: number[]) {
    return await apiClient.delete('/admin/brands/bulk', { data: { ids } });
  },

  // Categories
  async getCategories(page = 1, perPage = 20) {
    return await apiClient.get('/admin/categories', { params: { page, per_page: perPage } });
  },
  async getCategory(id: number) {
    return await apiClient.get(`/admin/categories/${id}`);
  },
  async createCategory(data: FormData) {
    return await apiClient.post('/admin/categories', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  async updateCategory(id: number, data: FormData) {
    return await apiClient.patch(`/admin/categories/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  async deleteCategory(id: number) {
    return await apiClient.delete(`/admin/categories/${id}`);
  },
  async bulkDeleteCategories(ids: number[]) {
    return await apiClient.delete('/admin/categories/bulk', { data: { ids } });
  },

  // Catalogs
  async getCatalogs(page = 1, perPage = 20) {
    return await apiClient.get('/admin/catalogs', { params: { page, per_page: perPage } });
  },
  async getCatalog(id: number) {
    return await apiClient.get(`/admin/catalogs/${id}`);
  },
  async createCatalog(data: any) {
    return await apiClient.post('/admin/catalogs', data);
  },
  async updateCatalog(id: number, data: any) {
    return await apiClient.put(`/admin/catalogs/${id}`, data);
  },
  async deleteCatalog(id: number) {
    return await apiClient.delete(`/admin/catalogs/${id}`);
  },
  async bulkDeleteCatalogs(ids: number[]) {
    return await apiClient.delete('/admin/catalogs/bulk', { data: { ids } });
  },
  async getAssignProducts(catalogId: number) {
    return await apiClient.get(`/admin/catalogs/${catalogId}/assign-products`);
  },
  async assignProducts(catalogId: number, productIds: number[]) {
    return await apiClient.post(`/admin/catalogs/${catalogId}/assign-products`, { product_ids: productIds });
  },

  // Customers
  async getCustomers(filters?: { page?: number; per_page?: number; search?: string; status?: string; type?: string; customer_group_id?: number }) {
    return await apiClient.get('/admin/customers', { params: filters });
  },
  async getCustomer(id: number) {
    return await apiClient.get(`/admin/customers/${id}`);
  },
  async updateCustomerKycStatus(id: number, status: string, notes?: string) {
    return await apiClient.post(`/admin/customers/${id}/kyc-status`, { 
      kyc_status: status,
      kyc_notes: notes || null
    });
  },
  async addKycMessage(id: number, message: string) {
    return await apiClient.post(`/admin/customers/${id}/kyc-messages`, { message });
  },
  async updateKycDocumentStatus(id: number, docId: number, status: string, remarks?: string) {
    return await apiClient.patch(`/admin/customers/${id}/kyc-documents/${docId}`, { status, remarks });
  },
  async toggleKycComments(id: number, allowReplies: boolean) {
    return await apiClient.post(`/admin/customers/${id}/kyc-comments`, { allow_replies: allowReplies });
  },
  async toggleCustomerStatus(id: number) {
    return await apiClient.post(`/admin/customers/${id}/toggle-status`);
  },
  async updateCustomerGroupAssignment(id: number, groupId: number | null) {
    return await apiClient.patch(`/admin/customers/${id}/group`, { group_id: groupId });
  },
  async deleteCustomer(id: number) {
    return await apiClient.delete(`/admin/customers/${id}`);
  },

  // Customer Groups
  async getCustomerGroups(page = 1, perPage = 20) {
    return await apiClient.get('/admin/customer-groups', { params: { page, per_page: perPage } });
  },
  async getCustomerGroup(id: number) {
    return await apiClient.get(`/admin/customer-groups/${id}`);
  },
  async createCustomerGroup(data: any) {
    return await apiClient.post('/admin/customer-groups', data);
  },
  async updateCustomerGroup(id: number, data: any) {
    return await apiClient.patch(`/admin/customer-groups/${id}`, data);
  },
  async deleteCustomerGroup(id: number) {
    return await apiClient.delete(`/admin/customer-groups/${id}`);
  },
  async bulkDeleteCustomerGroups(ids: number[]) {
    return await apiClient.delete('/admin/customer-groups/bulk', { data: { ids } });
  },

  // Customer Types
  async getCustomerTypes(page = 1, perPage = 20) {
    return await apiClient.get('/admin/customer-types', { params: { page, per_page: perPage } });
  },
  async getCustomerType(id: number) {
    return await apiClient.get(`/admin/customer-types/${id}`);
  },
  async createCustomerType(data: any) {
    return await apiClient.post('/admin/customer-types', data);
  },
  async updateCustomerType(id: number, data: any) {
    return await apiClient.patch(`/admin/customer-types/${id}`, data);
  },
  async deleteCustomerType(id: number) {
    return await apiClient.delete(`/admin/customer-types/${id}`);
  },
  async bulkDeleteCustomerTypes(ids: number[]) {
    return await apiClient.delete('/admin/customer-types/bulk', { data: { ids } });
  },

  // Metals
  async getMetals(page = 1, perPage = 20) {
    return await apiClient.get('/admin/metals', { params: { page, per_page: perPage } });
  },
  async getMetal(id: number) {
    return await apiClient.get(`/admin/metals/${id}`);
  },
  async createMetal(data: any) {
    return await apiClient.post('/admin/metals', data);
  },
  async updateMetal(id: number, data: any) {
    return await apiClient.patch(`/admin/metals/${id}`, data);
  },
  async deleteMetal(id: number) {
    return await apiClient.delete(`/admin/metals/${id}`);
  },
  async bulkDeleteMetals(ids: number[]) {
    return await apiClient.delete('/admin/metals/bulk', { data: { ids } });
  },

  // Metal Tones
  async getMetalTones(page = 1, perPage = 20) {
    return await apiClient.get('/admin/metal-tones', { params: { page, per_page: perPage } });
  },
  async getMetalTone(id: number) {
    return await apiClient.get(`/admin/metal-tones/${id}`);
  },
  async createMetalTone(data: any) {
    return await apiClient.post('/admin/metal-tones', data);
  },
  async updateMetalTone(id: number, data: any) {
    return await apiClient.patch(`/admin/metal-tones/${id}`, data);
  },
  async deleteMetalTone(id: number) {
    return await apiClient.delete(`/admin/metal-tones/${id}`);
  },
  async bulkDeleteMetalTones(ids: number[]) {
    return await apiClient.delete('/admin/metal-tones/bulk', { data: { ids } });
  },

  // Metal Purities
  async getMetalPurities(page = 1, perPage = 20) {
    return await apiClient.get('/admin/metal-purities', { params: { page, per_page: perPage } });
  },
  async getMetalPurity(id: number) {
    return await apiClient.get(`/admin/metal-purities/${id}`);
  },
  async createMetalPurity(data: any) {
    return await apiClient.post('/admin/metal-purities', data);
  },
  async updateMetalPurity(id: number, data: any) {
    return await apiClient.put(`/admin/metal-purities/${id}`, data);
  },
  async deleteMetalPurity(id: number) {
    return await apiClient.delete(`/admin/metal-purities/${id}`);
  },
  async bulkDeleteMetalPurities(ids: number[]) {
    return await apiClient.delete('/admin/metal-purities/bulk', { data: { ids } });
  },

  // Diamonds
  async getDiamonds(page = 1, perPage = 20) {
    return await apiClient.get('/admin/diamond/diamonds', { params: { page, per_page: perPage } });
  },
  async getDiamond(id: number) {
    return await apiClient.get(`/admin/diamond/diamonds/${id}`);
  },
  async createDiamond(data: any) {
    return await apiClient.post('/admin/diamond/diamonds', data);
  },
  async updateDiamond(id: number, data: any) {
    return await apiClient.patch(`/admin/diamond/diamonds/${id}`, data);
  },
  async deleteDiamond(id: number) {
    return await apiClient.delete(`/admin/diamond/diamonds/${id}`);
  },
  async bulkDeleteDiamonds(ids: number[]) {
    return await apiClient.delete('/admin/diamond/diamonds/bulk', { data: { ids } });
  },
  async getDiamondShapeSizesByShape(shapeId: number, typeId?: number) {
    const params = typeId ? { type_id: typeId } : {};
    return await apiClient.get(`/admin/diamond/diamonds/shape-sizes/${shapeId}`, { params });
  },
  async getDiamondClaritiesByType(typeId: number) {
    return await apiClient.get(`/admin/diamond/diamonds/clarities-by-type/${typeId}`);
  },
  async getDiamondColorsByType(typeId: number) {
    return await apiClient.get(`/admin/diamond/diamonds/colors-by-type/${typeId}`);
  },
  async getDiamondShapesByType(typeId: number) {
    return await apiClient.get(`/admin/diamond/diamonds/shapes-by-type/${typeId}`);
  },

  // Diamond Types
  async getDiamondTypes(page = 1, perPage = 20) {
    return await apiClient.get('/admin/diamond/types', { params: { page, per_page: perPage } });
  },
  async getDiamondType(id: number) {
    return await apiClient.get(`/admin/diamond/types/${id}`);
  },
  async createDiamondType(data: any) {
    return await apiClient.post('/admin/diamond/types', data);
  },
  async updateDiamondType(id: number, data: any) {
    return await apiClient.patch(`/admin/diamond/types/${id}`, data);
  },
  async deleteDiamondType(id: number) {
    return await apiClient.delete(`/admin/diamond/types/${id}`);
  },
  async bulkDeleteDiamondTypes(ids: number[]) {
    return await apiClient.delete('/admin/diamond/types/bulk', { data: { ids } });
  },

  // Diamond Shapes
  async getDiamondShapes(page = 1, perPage = 20) {
    return await apiClient.get('/admin/diamond/shapes', { params: { page, per_page: perPage } });
  },
  async getDiamondShape(id: number) {
    return await apiClient.get(`/admin/diamond/shapes/${id}`);
  },
  async createDiamondShape(data: any) {
    return await apiClient.post('/admin/diamond/shapes', data);
  },
  async updateDiamondShape(id: number, data: any) {
    return await apiClient.patch(`/admin/diamond/shapes/${id}`, data);
  },
  async deleteDiamondShape(id: number) {
    return await apiClient.delete(`/admin/diamond/shapes/${id}`);
  },
  async bulkDeleteDiamondShapes(ids: number[]) {
    return await apiClient.delete('/admin/diamond/shapes/bulk', { data: { ids } });
  },

  // Diamond Shape Sizes
  async getDiamondShapeSizes(page = 1, perPage = 20, shapeId?: number) {
    const params: any = { page, per_page: perPage };
    if (shapeId) {
      params.shape_id = shapeId;
    }
    return await apiClient.get('/admin/diamond/shape-sizes', { params });
  },
  async getDiamondShapeSize(id: number) {
    return await apiClient.get(`/admin/diamond/shape-sizes/${id}`);
  },
  async createDiamondShapeSize(data: any) {
    return await apiClient.post('/admin/diamond/shape-sizes', data);
  },
  async updateDiamondShapeSize(id: number, data: any) {
    return await apiClient.patch(`/admin/diamond/shape-sizes/${id}`, data);
  },
  async deleteDiamondShapeSize(id: number) {
    return await apiClient.delete(`/admin/diamond/shape-sizes/${id}`);
  },
  async bulkDeleteDiamondShapeSizes(ids: number[]) {
    return await apiClient.delete('/admin/diamond/shape-sizes/bulk', { data: { ids } });
  },

  // Diamond Colors
  async getDiamondColors(page = 1, perPage = 20) {
    return await apiClient.get('/admin/diamond/colors', { params: { page, per_page: perPage } });
  },
  async getDiamondColor(id: number) {
    return await apiClient.get(`/admin/diamond/colors/${id}`);
  },
  async createDiamondColor(data: any) {
    return await apiClient.post('/admin/diamond/colors', data);
  },
  async updateDiamondColor(id: number, data: any) {
    return await apiClient.patch(`/admin/diamond/colors/${id}`, data);
  },
  async deleteDiamondColor(id: number) {
    return await apiClient.delete(`/admin/diamond/colors/${id}`);
  },
  async bulkDeleteDiamondColors(ids: number[]) {
    return await apiClient.delete('/admin/diamond/colors/bulk', { data: { ids } });
  },

  // Diamond Clarities
  async getDiamondClarities(page = 1, perPage = 20) {
    return await apiClient.get('/admin/diamond/clarities', { params: { page, per_page: perPage } });
  },
  async getDiamondClarity(id: number) {
    return await apiClient.get(`/admin/diamond/clarities/${id}`);
  },
  async createDiamondClarity(data: any) {
    return await apiClient.post('/admin/diamond/clarities', data);
  },
  async updateDiamondClarity(id: number, data: any) {
    return await apiClient.patch(`/admin/diamond/clarities/${id}`, data);
  },
  async deleteDiamondClarity(id: number) {
    return await apiClient.delete(`/admin/diamond/clarities/${id}`);
  },
  async bulkDeleteDiamondClarities(ids: number[]) {
    return await apiClient.delete('/admin/diamond/clarities/bulk', { data: { ids } });
  },

  // Sizes
  async getSizes(page = 1, perPage = 20) {
    return await apiClient.get('/admin/sizes', { params: { page, per_page: perPage } });
  },
  async getSize(id: number) {
    return await apiClient.get(`/admin/sizes/${id}`);
  },
  async createSize(data: any) {
    return await apiClient.post('/admin/sizes', data);
  },
  async updateSize(id: number, data: any) {
    return await apiClient.put(`/admin/sizes/${id}`, data);
  },
  async deleteSize(id: number) {
    return await apiClient.delete(`/admin/sizes/${id}`);
  },
  async bulkDeleteSizes(ids: number[]) {
    return await apiClient.delete('/admin/sizes/bulk', { data: { ids } });
  },

  // Styles
  async getStyles(page = 1, perPage = 20) {
    return await apiClient.get('/admin/styles', { params: { page, per_page: perPage } });
  },
  async getStyle(id: number) {
    return await apiClient.get(`/admin/styles/${id}`);
  },
  async createStyle(data: any) {
    return await apiClient.post('/admin/styles', data);
  },
  async updateStyle(id: number, data: any) {
    return await apiClient.put(`/admin/styles/${id}`, data);
  },
  async deleteStyle(id: number) {
    return await apiClient.delete(`/admin/styles/${id}`);
  },
  async bulkDeleteStyles(ids: number[]) {
    return await apiClient.delete('/admin/styles/bulk', { data: { ids } });
  },

  // Orders
  async getOrders(filters?: { page?: number; per_page?: number; status?: string; search?: string }) {
    return await apiClient.get('/admin/orders', { params: filters });
  },
  async getOrder(id: number) {
    return await apiClient.get(`/admin/orders/${id}`);
  },
  async updateOrderStatus(id: number, status: string, meta?: any) {
    return await apiClient.post(`/admin/orders/${id}/status`, { status, meta });
  },

  // Order Statuses
  async getOrderStatuses(page = 1, perPage = 20) {
    return await apiClient.get('/admin/orders/statuses', { params: { page, per_page: perPage } });
  },
  async getOrderStatus(id: number) {
    return await apiClient.get(`/admin/orders/statuses/${id}`);
  },
  async createOrderStatus(data: any) {
    return await apiClient.post('/admin/orders/statuses', data);
  },
  async updateOrderStatusConfig(id: number, data: any) {
    return await apiClient.put(`/admin/orders/statuses/${id}`, data);
  },
  async deleteOrderStatus(id: number) {
    return await apiClient.delete(`/admin/orders/statuses/${id}`);
  },
  async bulkDeleteOrderStatuses(ids: number[]) {
    return await apiClient.delete('/admin/orders/statuses/bulk', { data: { ids } });
  },

  // Quotations
  async getQuotations(filters?: { page?: number; order_reference?: string; customer_name?: string; customer_email?: string }) {
    const params: any = {};
    if (filters?.page) params.page = String(filters.page);
    if (filters?.order_reference) params.order_reference = filters.order_reference;
    if (filters?.customer_name) params.customer_name = filters.customer_name;
    if (filters?.customer_email) params.customer_email = filters.customer_email;
    return await apiClient.get('/admin/quotations', { params });
  },
  async getQuotation(id: number) {
    return await apiClient.get(`/admin/quotations/${id}`);
  },
  async approveQuotation(id: number) {
    return await apiClient.post(`/admin/quotations/${id}/approve`);
  },
  async rejectQuotation(id: number) {
    return await apiClient.post(`/admin/quotations/${id}/reject`);
  },
  async deleteQuotation(id: number) {
    return await apiClient.delete(`/admin/quotations/${id}`);
  },

  // Offers
  async getOffers(page = 1, perPage = 20) {
    return await apiClient.get('/admin/offers', { params: { page, per_page: perPage } });
  },
  async getOffer(id: number) {
    return await apiClient.get(`/admin/offers/${id}`);
  },
  async createOffer(data: any) {
    return await apiClient.post('/admin/offers', data);
  },
  async updateOffer(id: number, data: any) {
    return await apiClient.put(`/admin/offers/${id}`, data);
  },
  async deleteOffer(id: number) {
    return await apiClient.delete(`/admin/offers/${id}`);
  },

  // Making Charge Discounts
  async getMakingChargeDiscounts(page = 1, perPage = 20) {
    return await apiClient.get('/admin/offers/making-charge-discounts', { params: { page, per_page: perPage } });
  },
  async getMakingChargeDiscount(id: number) {
    return await apiClient.get(`/admin/offers/making-charge-discounts/${id}`);
  },
  async createMakingChargeDiscount(data: any) {
    return await apiClient.post('/admin/offers/making-charge-discounts', data);
  },
  async updateMakingChargeDiscount(id: number, data: any) {
    return await apiClient.patch(`/admin/offers/making-charge-discounts/${id}`, data);
  },
  async deleteMakingChargeDiscount(id: number) {
    return await apiClient.delete(`/admin/offers/making-charge-discounts/${id}`);
  },
  async bulkDeleteMakingChargeDiscounts(ids: number[]) {
    return await apiClient.delete('/admin/offers/making-charge-discounts/bulk', { data: { ids } });
  },

  // Rates
  async getRates(page = 1, perPage = 20) {
    return await apiClient.get('/admin/rates', { params: { page, per_page: perPage } });
  },
  async syncRates(metal?: string) {
    return await apiClient.post(`/admin/rates/sync${metal ? `/${metal}` : ''}`);
  },
  async storeMetalRate(metal: string, data: any) {
    return await apiClient.post(`/admin/rates/${metal}/store`, data);
  },

  // Settings - General
  async getGeneralSettings() {
    return await apiClient.get('/admin/settings/general');
  },
  async updateGeneralSettings(data: FormData) {
    return await apiClient.put('/admin/settings/general', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Settings - Tax Groups
  async getTaxGroups(page = 1, perPage = 20) {
    return await apiClient.get('/admin/settings/tax-groups', { params: { page, per_page: perPage } });
  },
  async getTaxGroup(id: number) {
    return await apiClient.get(`/admin/settings/tax-groups/${id}`);
  },
  async createTaxGroup(data: any) {
    return await apiClient.post('/admin/settings/tax-groups', data);
  },
  async updateTaxGroup(id: number, data: any) {
    return await apiClient.patch(`/admin/settings/tax-groups/${id}`, data);
  },
  async deleteTaxGroup(id: number) {
    return await apiClient.delete(`/admin/settings/tax-groups/${id}`);
  },
  async bulkDeleteTaxGroups(ids: number[]) {
    return await apiClient.delete('/admin/settings/tax-groups/bulk', { data: { ids } });
  },

  // Settings - Taxes
  async getTaxes(page = 1, perPage = 20) {
    return await apiClient.get('/admin/settings/taxes', { params: { page, per_page: perPage } });
  },
  async getTax(id: number) {
    return await apiClient.get(`/admin/settings/taxes/${id}`);
  },
  async createTax(data: any) {
    return await apiClient.post('/admin/settings/taxes', data);
  },
  async updateTax(id: number, data: any) {
    return await apiClient.patch(`/admin/settings/taxes/${id}`, data);
  },
  async deleteTax(id: number) {
    return await apiClient.delete(`/admin/settings/taxes/${id}`);
  },
  async bulkDeleteTaxes(ids: number[]) {
    return await apiClient.delete('/admin/settings/taxes/bulk', { data: { ids } });
  },

  // Settings - Payments
  async getPaymentSettings() {
    return await apiClient.get('/admin/settings/payments');
  },
  async updatePaymentSettings(data: any) {
    return await apiClient.put('/admin/settings/payments', data);
  },

  // Team Users
  async getTeamUsers(page = 1, perPage = 20) {
    return await apiClient.get('/admin/team-users', { params: { page, per_page: perPage } });
  },
  async getTeamUser(id: number) {
    return await apiClient.get(`/admin/team-users/${id}`);
  },
  async createTeamUser(data: any) {
    return await apiClient.post('/admin/team-users', data);
  },
  async updateTeamUser(id: number, data: any) {
    return await apiClient.patch(`/admin/team-users/${id}`, data);
  },
  async deleteTeamUser(id: number) {
    return await apiClient.delete(`/admin/team-users/${id}`);
  },
  async bulkDeleteTeamUsers(ids: number[]) {
    return await apiClient.delete('/admin/team-users/bulk', { data: { ids } });
  },
  async updateTeamUserGroup(id: number, groupId: number | null) {
    return await apiClient.patch(`/admin/team-users/${id}/group`, { user_group_id: groupId });
  },

  // User Groups
  async getUserGroups(page = 1, perPage = 20) {
    return await apiClient.get('/admin/user-groups', { params: { page, per_page: perPage } });
  },
  async getUserGroup(id: number) {
    return await apiClient.get(`/admin/user-groups/${id}`);
  },
  async createUserGroup(data: any) {
    return await apiClient.post('/admin/user-groups', data);
  },
  async updateUserGroup(id: number, data: any) {
    return await apiClient.patch(`/admin/user-groups/${id}`, data);
  },
  async deleteUserGroup(id: number) {
    return await apiClient.delete(`/admin/user-groups/${id}`);
  },
  async bulkDeleteUserGroups(ids: number[]) {
    return await apiClient.delete('/admin/user-groups/bulk', { data: { ids } });
  },

  // Products
  async getProducts(filters?: { page?: number; per_page?: number; search?: string; status?: string; brand_id?: number; category_id?: number }) {
    return await apiClient.get('/admin/products', { params: filters });
  },
  async getProduct(id: number) {
    return await apiClient.get(`/admin/products/${id}`);
  },
  async getProductFormOptions() {
    return await apiClient.get('/admin/products/options');
  },
  async createProduct(data: FormData) {
    return await apiClient.post('/admin/products', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  async updateProduct(id: number, data: FormData) {
    return await apiClient.patch(`/admin/products/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  async deleteProduct(id: number) {
    return await apiClient.delete(`/admin/products/${id}`);
  },
  async bulkDeleteProducts(ids: number[]) {
    return await apiClient.delete('/admin/products/bulk', { data: { ids } });
  },
  async bulkUpdateProductStatus(ids: number[], status: boolean) {
    return await apiClient.post('/admin/products/bulk/status', { ids, is_active: status });
  },
  async copyProduct(id: number) {
    return await apiClient.post(`/admin/products/${id}/copy`);
  },
};

