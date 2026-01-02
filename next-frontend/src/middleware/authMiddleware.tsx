'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { tokenService } from '@/services/tokenService';
import { authService } from '@/services/authService';
import { route } from '@/utils/route';

/**
 * Auth Middleware Component
 * Protects routes by checking token on mount and page changes
 * Redirects to login if token is invalid or missing
 * For public paths (login, register, etc.), redirects to dashboard if already authenticated
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

  // Special paths that require authentication but allow unapproved KYC users
  const authenticatedPaths = [
    '/onboarding/kyc',
  ];

  const isPublicPath = publicPaths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path)));
  const isAuthenticatedPath = authenticatedPaths.some(path => pathname === path || pathname.startsWith(path));

  useEffect(() => {
    const checkAuth = async () => {
      // For public paths, check if user is already authenticated and redirect if so
      if (isPublicPath) {
        try {
          // Check if token exists
          if (tokenService.hasToken()) {
            // Try to refresh token and get user data
            const token = await tokenService.refreshToken();
            
            if (token) {
              // Token is valid, get user data to determine redirect
              try {
                const response = await authService.me();
                const user = response.data;

                if (user) {
                  const userType = (user?.type || '').toLowerCase();
                  
                  // Determine redirect URL based on user type and KYC status
                  let redirectUrl: string;
                  if (['admin', 'super-admin'].includes(userType)) {
                    redirectUrl = route('admin.dashboard');
                  } else if (userType === 'production') {
                    redirectUrl = route('production.dashboard');
                  } else {
                    // For customer users, check KYC status
                    const kycStatus = user?.kyc_status || user?.kycStatus;
                    if (kycStatus === 'approved') {
                      redirectUrl = route('dashboard');
                    } else {
                      redirectUrl = '/onboarding/kyc';
                    }
                  }
                  
                  // Redirect to appropriate page
                  router.replace(redirectUrl);
                  return;
                }
              } catch (error) {
                // User fetch failed, token might be invalid - allow access to auth page
                console.error('Failed to fetch user:', error);
              }
            }
          }
          
          // No token or invalid token - allow access to public path
          setIsAuthenticated(true);
          setIsLoading(false);
        } catch (error) {
          // Error checking auth - allow access to public path
          setIsAuthenticated(true);
          setIsLoading(false);
        }
        return;
      }

      // For protected paths (including authenticated paths like KYC onboarding), check authentication
      try {
        // Check if token exists
        if (!tokenService.hasToken()) {
          // No token, redirect to login
          router.push('/login');
          return;
        }

        // For authenticated paths (like KYC onboarding), allow access if token exists
        // Don't try to refresh token for newly registered users - just allow access
        if (isAuthenticatedPath) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // For other protected paths, refresh token (this validates and gets a new token)
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
        // For authenticated paths (like KYC), allow access even if check fails (user just registered)
        if (isAuthenticatedPath) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router, isPublicPath, isAuthenticatedPath]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-elvee-blue border-t-transparent" />
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  // Allow authenticated paths (like KYC) even if not fully authenticated (token exists but refresh might fail)
  if (!isAuthenticated && !isPublicPath && !isAuthenticatedPath) {
    return null;
  }

  return <>{children}</>;
}

