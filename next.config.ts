import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
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
  outputFileTracing: true,
};

export default nextConfig;
