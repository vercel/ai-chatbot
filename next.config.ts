import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        // port is optional, omitting based on example
        // pathname is optional, omitting based on example
      },
      // Add other patterns here if needed
    ],
  },
  // Add other Next.js config options here if needed
};

export default nextConfig;
