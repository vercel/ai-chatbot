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
        hostname: "*.s3.us-east-1.amazonaws.com",
      },
      {
        hostname: "127.0.0.1",
      },
    ],
  },
};

export default nextConfig;
