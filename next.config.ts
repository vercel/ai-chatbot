import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  output: 'standalone',
  outputFileTracingIncludes: {
    '*': ['public/**/*', '.next/static/**/*'],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
};

export default nextConfig;
