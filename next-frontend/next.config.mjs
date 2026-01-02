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
        // Get backend API URL from environment variable
        // Default to http://localhost:3001 if not set
        const backendUrl = process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
            : "http://localhost:3001";

        return [
            {
                source: "/api/:path*",
                destination: `${backendUrl}/api/:path*`,
            },
        ];
    },
    reactStrictMode: false,
};

export default nextConfig;
