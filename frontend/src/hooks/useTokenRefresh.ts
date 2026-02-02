'use client';

import { useEffect } from 'react';
import { tokenService } from '@/services/tokenService';

/**
 * Hook to refresh token on page load/mount
 * Runs once when component mounts
 */
export function useTokenRefresh() {
  useEffect(() => {
    const refreshTokenOnLoad = async () => {
      // Don't refresh token if logout is in progress
      if (typeof window !== 'undefined' && (window as any).__isLoggingOut === true) {
        return;
      }

      // Only refresh if we have a token
      if (tokenService.hasToken()) {
        try {
          // Check logout flag again before making API call
          if (typeof window !== 'undefined' && (window as any).__isLoggingOut === true) {
            return;
          }
          await tokenService.refreshToken();
        } catch (error) {
          // Don't log errors if logout is in progress
          if (typeof window !== 'undefined' && (window as any).__isLoggingOut === true) {
            return;
          }
          console.error('Failed to refresh token on page load:', error);
        }
      }
    };

    refreshTokenOnLoad();
  }, []);
}

