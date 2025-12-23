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
    'frontend.orders.index': '/orders',
    'frontend.catalog.index': '/catalog',
    'frontend.wishlist.index': '/wishlist',
    'frontend.cart.index': '/cart',
    'admin.dashboard': '/admin/dashboard',
    'admin.products.index': '/admin/products',
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

route.current = (name?: string) => {
    // This would ideally check the current path from Next.js
    // For now, returning false to avoid errors
    return false;
};

