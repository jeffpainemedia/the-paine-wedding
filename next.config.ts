import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "khqmbphkdmexkknzvtgb.supabase.co",
            },
        ],
    },
    async rewrites() {
        return [
            {
                source: "/seatingchartdesigner",
                destination: "/seatingchartdesigner.html",
            },
        ];
    },
};

export default nextConfig;
