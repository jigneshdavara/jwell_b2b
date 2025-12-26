/**
 * Environment Configuration
 * Centralized access to environment variables with type safety
 */

/**
 * Get environment variable with fallback
 */
function getEnv(key: string, fallback: string = ''): string {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env[key] || fallback;
  }
  // Client-side - only NEXT_PUBLIC_ prefixed vars are available
  return process.env[key] || fallback;
}

export const env = {
  // API Configuration
  apiUrl: getEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/api'),
  
  // Stripe Configuration
  stripePublishableKey: getEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', ''),
  
  // Environment
  env: getEnv('NEXT_PUBLIC_ENV', 'development'),
  
  // Feature Flags
  enableAnalytics: getEnv('NEXT_PUBLIC_ENABLE_ANALYTICS', 'false') === 'true',
  enableDebugMode: getEnv('NEXT_PUBLIC_ENABLE_DEBUG_MODE', 'false') === 'true',
  
  // Helper to check if in development
  isDevelopment: () => env.env === 'development',
  
  // Helper to check if in production
  isProduction: () => env.env === 'production',
};


