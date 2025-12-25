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
      // Only refresh if we have a token
      if (tokenService.hasToken()) {
        try {
          await tokenService.refreshToken();
        } catch (error) {
          console.error('Failed to refresh token on page load:', error);
        }
      }
    };

    refreshTokenOnLoad();
  }, []);
}

