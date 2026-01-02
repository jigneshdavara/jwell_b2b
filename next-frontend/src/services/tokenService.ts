import apiClient from "./api";

// Token management service - handles all token operations
class TokenService {
    private refreshPromise: Promise<string | null> | null = null;
    private readonly TOKEN_KEY = "auth_token";

    /**
     * Get current token from storage
     */
    getToken(): string | null {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Set token in storage
     */
    setToken(token: string): void {
        if (typeof window === "undefined") return;
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    /**
     * Remove token from storage
     */
    removeToken(): void {
        if (typeof window === "undefined") return;
        localStorage.removeItem(this.TOKEN_KEY);
    }

    /**
     * Check if token exists
     */
    hasToken(): boolean {
        return !!this.getToken();
    }

    /**
     * Refresh/Validate token - validates existing token and gets new one if needed
     * Uses request deduplication to prevent multiple simultaneous refresh calls
     * Since backend doesn't have a dedicated refresh endpoint, we validate by calling /kyc/profile
     * which returns user data and potentially a new token
     */
    async refreshToken(): Promise<string | null> {
        // If a refresh is already in progress, return the same promise
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = (async () => {
            const currentToken = this.getToken();

            // If no token exists, return null
            if (!currentToken) {
                return null;
            }

            try {
                // Call the token refresh endpoint with current token
                const response = await apiClient.post(
                    "/auth/refresh-token",
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${currentToken}`,
                        },
                    }
                );

                const newToken =
                    response.data?.access_token || response.data?.token;

                if (newToken) {
                    this.setToken(newToken);
                    return newToken;
                }

                // If no token returned, remove existing token
                this.removeToken();
                return null;
            } catch (error: any) {
                // If refresh-token endpoint returns ANY error (401, 500, etc.),
                // the token is invalid or the refresh failed
                // Remove token for ALL errors from refresh-token endpoint
                this.removeToken();

                // NEVER redirect to login from refreshToken() method
                // Let the API interceptor handle redirects based on the current route
                // This ensures home page (/) is never redirected to login
                return null;
            } finally {
                // Clear the promise so subsequent calls can make new requests
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    /**
     * Validate token by making a test API call
     */
    async validateToken(): Promise<boolean> {
        const token = this.getToken();
        if (!token) return false;

        try {
            // Make a lightweight API call to validate token
            // Use /profile as it requires authentication and works for both admins and users
            await apiClient.get("/profile", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return true;
        } catch (error: any) {
            // If 401, token is invalid
            if (error.response?.status === 401) {
                return false;
            }
            // For other errors, assume token is valid (network issues, etc.)
            return true;
        }
    }
}

export const tokenService = new TokenService();
