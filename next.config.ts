import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: false, // Temporarily disabled due to trace error with Next.js 15 canary
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
      {
        hostname: "via.placeholder.com",
      },
    ],
  },
};

export default nextConfig;
