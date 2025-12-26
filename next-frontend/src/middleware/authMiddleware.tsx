'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { tokenService } from '@/services/tokenService';

/**
 * Auth Middleware Component
 * Protects routes by checking token on mount and page changes
 * Redirects to login if token is invalid or missing
 */
export function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Public paths that don't require authentication
  // Home page (/) is always public and should never redirect to login
  const publicPaths = [
    '/', // Home page - always accessible
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/confirm-password',
  ];

  const isPublicPath = publicPaths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path)));

  useEffect(() => {
    const checkAuth = async () => {
      // Allow public paths
      if (isPublicPath) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        // Check if token exists
        if (!tokenService.hasToken()) {
          // No token, redirect to login
          router.push('/login');
          return;
        }

        // Refresh token (this validates and gets a new token)
        const token = await tokenService.refreshToken();
        
        if (!token) {
          // Token invalid or refresh failed, redirect to login
          router.push('/login');
          return;
        }

        // Token is valid
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, isPublicPath]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated && !isPublicPath) {
    return null;
  }

  return <>{children}</>;
}

