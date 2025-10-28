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
      {
        hostname: "img.youtube.com",
      },
      {
        hostname: "i.ytimg.com",
      },
      {
        hostname: "imageio.forbes.com",
      },
      {
        hostname: "*.medium.com",
      },
      {
        hostname: "miro.medium.com",
      },
      {
        hostname: "cdn-images-1.medium.com",
      },
      {
        hostname: "*.substack.com",
      },
      {
        hostname: "substackcdn.com",
      },
      {
        hostname: "images.unsplash.com",
      },
      {
        hostname: "*.amazonaws.com",
      },
      {
        hostname: "*.cloudfront.net",
      },
      {
        hostname: "pbs.twimg.com",
      },
      {
        hostname: "*.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
