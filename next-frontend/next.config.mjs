/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: "/auth/register",
                destination: "/register",
                permanent: true,
            },
            {
                source: "/auth/login",
                destination: "/login",
                permanent: true,
            },
            {
                source: "/auth/forgot-password",
                destination: "/forgot-password",
                permanent: true,
            },
            {
                source: "/auth/reset-password/:path*",
                destination: "/reset-password/:path*",
                permanent: true,
            },
            {
                source: "/auth/verify-email",
                destination: "/verify-email",
                permanent: true,
            },
            {
                source: "/auth/confirm-password",
                destination: "/confirm-password",
                permanent: true,
            },
        ];
    },
    async rewrites() {
        // Get backend URL from environment variable (server-side only, not exposed to client)
        // Use BACKEND_URL for server-side rewrites, or derive from NEXT_PUBLIC_API_URL if available
        const backendUrl =
            process.env.BACKEND_URL ||
            (process.env.NEXT_PUBLIC_API_URL
                ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "")
                : null);

        // If no backend URL is configured, return empty rewrites (will use relative URLs)
        if (!backendUrl) {
            console.warn(
                "Warning: BACKEND_URL or NEXT_PUBLIC_API_URL not set. Rewrites disabled."
            );
            return [];
        }

        return [
            {
                source: "/api/:path*",
                destination: `${backendUrl}/api/:path*`,
            },
            {
                source: "/storage/:path*",
                destination: `${backendUrl}/storage/:path*`,
            },
        ];
    },
    reactStrictMode: false,
};

export default nextConfig;
