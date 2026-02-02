const routes: Record<string, string> = {
    'home': '/',
    'login': '/login',
    'register': '/register',
    'auth.register': '/register',
    'auth.login': '/login',
    'password.request': '/forgot-password',
    'password.reset': '/reset-password',
    'verification.notice': '/verify-email',
    'password.confirm': '/confirm-password',
    'dashboard': '/dashboard',
    'frontend.dashboard': '/dashboard',
    'profile.edit': '/profile',
    'logout': '/logout', // This will need special handling
    'frontend.quotations.index': '/quotations',
    'frontend.quotations.show': '/quotations/{id}',
    'frontend.orders.index': '/orders',
    'frontend.orders.show': '/orders/{order}',
    'customer.orders.show': '/orders/{id}',
    'customer.invoices.index': '/invoices',
    'customer.invoices.show': '/invoices/{id}',
    'frontend.catalog.index': '/catalog',
    'frontend.catalog.show': '/catalog/{product}',
    'frontend.wishlist.index': '/wishlist',
    'frontend.cart.index': '/cart',
    'frontend.checkout.show': '/checkout',
    'frontend.checkout.confirm': '/checkout/confirm',
    'admin.dashboard': '/admin/dashboard',
    'admin.products.index': '/admin/products',
    'admin.products.edit': '/admin/products/{id}/edit',
    'admin.quotations.index': '/admin/quotations',
    'admin.quotations.show': '/admin/quotations/{id}',
    'admin.quotations.approve': '/admin/quotations/{id}/approve',
    'admin.quotations.reject': '/admin/quotations/{id}/reject',
    'admin.quotations.messages.store': '/admin/quotations/{id}/messages',
    'admin.quotations.request-confirmation': '/admin/quotations/{id}/request-confirmation',
    'admin.quotations.add-item': '/admin/quotations/{id}/add-item',
    'admin.quotations.update-product': '/admin/quotations/{id}/update-product',
    'admin.quotations.destroy': '/admin/quotations/{id}',
    'admin.orders.show': '/admin/orders/{id}',
    'admin.customers.index': '/admin/users',
    'admin.customers.kyc.show': '/admin/users/{id}/kyc',
    'production.dashboard': '/production/dashboard',
};

export function route(name: string, params?: any): string {
    let path = routes[name] ?? `/${name.replace(/\./g, '/')}`;
    
    if (params) {
        Object.keys(params).forEach(key => {
            path = path.replace(`{${key}}`, params[key]);
        });
    }
    
    return path;
}

;

