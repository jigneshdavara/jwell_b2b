import React from 'react';

export type NavChild = {
    label: string;
    href: string;
    match: string;
    icon?: string;
};

export type NavItem =
    | {
          label: string;
          href: string;
          match: string;
          icon?: string;
          children?: never;
      }
    | {
          label: string;
          icon?: string;
          href?: never;
          match?: string;
          children: NavChild[];
      };

export const adminNavigation: NavItem[] = [
    { label: 'Overview', href: '/admin/dashboard', match: '/admin/dashboard', icon: 'grid' },
    {
        label: 'Admins',
        icon: 'users',
        children: [
            { label: 'Admin list', href: '/admin/admins', match: '/admin/admins*' },
            { label: 'Admin groups', href: '/admin/admin-groups', match: '/admin/admin-groups*' },
        ],
    },
    {
        label: 'Users',
        icon: 'users',
        children: [
            { label: 'User list', href: '/admin/users', match: '/admin/users*' },
            { label: 'User groups', href: '/admin/user-groups', match: '/admin/user-groups*' },
            // { label: 'User types', href: '/admin/user-types', match: '/admin/user-types*' },
        ],
    },
    { label: 'Brands', href: '/admin/brands', match: '/admin/brands*', icon: 'sparkle' },
    { label: 'Categories', href: '/admin/categories', match: '/admin/categories*', icon: 'layers' },
    { label: 'Sizes', href: '/admin/sizes', match: '/admin/sizes*', icon: 'collection' },
    { label: 'Styles', href: '/admin/styles', match: '/admin/styles*', icon: 'sparkle' },
    {
        label: 'Metals',
        icon: 'ingot',
        children: [
            { label: 'Metals', href: '/admin/metals', match: '/admin/metals*' },
            { label: 'Tones', href: '/admin/metal-tones', match: '/admin/metal-tones*' },
            { label: 'Purities', href: '/admin/metal-purities', match: '/admin/metal-purities*' },
        ],
    },
    {
        label: 'Diamonds',
        icon: 'diamond',
        children: [
            { label: 'Diamonds', href: '/admin/diamond/diamonds', match: '/admin/diamond/diamonds*' },
            { label: 'Types', href: '/admin/diamond/types', match: '/admin/diamond/types*' },
            { label: 'Clarities', href: '/admin/diamond/clarities', match: '/admin/diamond/clarities*' },
            { label: 'Colors', href: '/admin/diamond/colors', match: '/admin/diamond/colors*' },
            { label: 'Shapes', href: '/admin/diamond/shapes', match: '/admin/diamond/shapes*' },
            { label: 'Shape sizes', href: '/admin/diamond/shape-sizes', match: '/admin/diamond/shape-sizes*' },
        ],
    },
    { label: 'Products', href: '/admin/products', match: '/admin/products*', icon: 'diamond' },
    { label: 'Catalogs', href: '/admin/catalogs', match: '/admin/catalogs*', icon: 'collection' },
    {
        label: 'Quotations',
        icon: 'inbox',
        children: [
            { label: 'Quotation list', href: '/admin/quotations', match: '/admin/quotations*' },
            { label: 'Quotation Report', href: '/admin/quotations/report', match: '/admin/quotations/report*' },
        ],
    },
    {
        label: 'Orders',
        icon: 'clipboard',
        children: [
            { label: 'Order list', href: '/admin/orders', match: '/admin/orders*' },
            { label: 'Order statuses', href: '/admin/orders/statuses', match: '/admin/orders/statuses*' },
            { label: 'Order Report', href: '/admin/orders/report', match: '/admin/orders/report*' },
        ],
    },
    { label: 'Invoices', href: '/admin/invoices', match: '/admin/invoices*', icon: 'receipt' },
    {
        label: 'Offers',
        icon: 'tag',
        children: [
            { label: 'Promo codes', href: '/admin/offers', match: '/admin/offers*', icon: 'tag' },
            {
                label: 'Making charge discounts',
                href: '/admin/offers/making-charge-discounts',
                match: '/admin/offers/making-charge-discounts*',
                icon: 'coin',
            },
        ],
    },
    { label: 'Rates', href: '/admin/rates', match: '/admin/rates*', icon: 'activity' },
    {
        label: 'Settings',
        icon: 'cog',
        children: [
            { label: 'General', href: '/admin/settings/general', match: '/admin/settings/general*' },
            { label: 'Tax Groups', href: '/admin/settings/tax-groups', match: '/admin/settings/tax-groups*' },
            { label: 'Tax', href: '/admin/settings/taxes', match: '/admin/settings/taxes*' },
            { label: 'Payments', href: '/admin/settings/payments', match: '/admin/settings/payments*' },
        ],
    },
];

export const iconMap: Record<string, React.ReactNode> = {
    grid: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3h-3a1.5 1.5 0 00-1.5 1.5v3a1.5 1.5 0 001.5 1.5h3A1.5 1.5 0 0011.25 7.5v-3A1.5 1.5 0 009.75 3zM17.25 3h-3A1.5 1.5 0 0012.75 4.5v3A1.5 1.5 0 0014.25 9h3A1.5 1.5 0 0018.75 7.5v-3A1.5 1.5 0 0017.25 3zM9.75 12h-3a1.5 1.5 0 00-1.5 1.5v3A1.5 1.5 0 006.75 18h3a1.5 1.5 0 001.5-1.5v-3A1.5 1.5 0 009.75 12zM17.25 12h-3a1.5 1.5 0 00-1.5 1.5v3a1.5 1.5 0 001.5 1.5h3a1.5 1.5 0 001.5-1.5v-3a1.5 1.5 0 00-1.5-1.5z" />
        </svg>
    ),
    users: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 14a4 4 0 10-8 0v2a4 4 0 008 0v-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
    ),
    sparkle: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19zM19 17l.75 2.25L22 20l-2.25.75L19 23l-.75-2.25L16 20l2.25-.75L19 17z" />
        </svg>
    ),
    layers: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5 9-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9 4.5 9-4.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5l9 4.5 9-4.5" />
        </svg>
    ),
    beaker: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12M9 3v6.75l-4.5 7.5A2 2 0 006.25 21h11.5a2 2 0 001.75-3.75L15 9.75V3" />
        </svg>
    ),
    collection: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
    ),
    coin: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v10m-3-3h6" />
        </svg>
    ),
    ingot: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 15.5 7 8h10l4 7.5-4 2.5H7l-4-2.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8l5 10" />
        </svg>
    ),
    gem: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3l6 12 6-12" />
        </svg>
    ),
    diamond: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3l-4.5 6 9.75 12 9.75-12-4.5-6h-10.5z" />
        </svg>
    ),
    clipboard: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6a2 2 0 012 2v1h1a1 1 0 011 1v12a1 1 0 01-1 1H6a1 1 0 01-1-1V8a1 1 0 011-1h1V6a2 2 0 012-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 2h6" />
        </svg>
    ),
    tag: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M3 11l8.586 8.586a2 2 0 002.828 0L21 11V5a2 2 0 00-2-2h-6L3 11z" />
        </svg>
    ),
    activity: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 12H18l-3 9-4-18-3 9H2" />
        </svg>
    ),
    'credit-card': (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <rect x="3" y="4.5" width="18" height="15" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M7.5 15h3" />
        </svg>
    ),
    inbox: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4l-1 9a2 2 0 002 2h14a2 2 0 002-2l-1-9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 11h6m-7 5l2-2h4l2 2" />
        </svg>
    ),
    cog: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    receipt: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
    chart: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
};

