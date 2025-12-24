import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/confirm-password',
    '/',
  ];

  // Allow KYC onboarding route
  if (pathname === '/onboarding/kyc' || pathname.startsWith('/onboarding/kyc')) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // For customer routes, check KYC status
  // if (pathname.startsWith('/dashboard') || 
  //     pathname.startsWith('/catalog') ||
  //     pathname.startsWith('/cart') ||
  //     pathname.startsWith('/checkout') ||
  //     pathname.startsWith('/orders') ||
  //     pathname.startsWith('/quotations') ||
  //     pathname.startsWith('/wishlist') ||
  //     pathname.startsWith('/profile') ||
  //     pathname.startsWith('/jobwork')) {
    
  //   // Get user from cookie or header (if you're using cookies for auth)
  //   // For now, we'll let the client-side guard handle it
  //   // This middleware serves as an additional layer
    
  //   // If you have user info in cookies, check here:
  //   // const userCookie = request.cookies.get('user');
  //   // if (userCookie) {
  //   //   const user = JSON.parse(userCookie.value);
  //   //   const kycStatus = user?.kyc_status || user?.kycStatus;
  //   //   if (kycStatus !== 'approved') {
  //   //     return NextResponse.redirect(new URL('/onboarding/kyc', request.url));
  //   //   }
  //   // }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

