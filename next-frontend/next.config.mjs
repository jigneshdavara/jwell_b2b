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
    // reactStrictMode: false,
};

export default nextConfig;
