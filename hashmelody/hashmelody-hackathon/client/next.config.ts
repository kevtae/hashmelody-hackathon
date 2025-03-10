import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["static-cos.mureka.ai", "picsum.photos"],
  },
  experimental: {
    serverComponentsExternalPackages: ["@upstash/qstash"], // Add any server-only deps
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false, // Disable problematic crypto polyfills
    };
    return config;
  },
};
export default nextConfig;
