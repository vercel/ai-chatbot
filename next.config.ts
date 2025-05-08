import type { NextConfig } from 'next';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const nextConfig: NextConfig = {
  experimental: {
    // ppr: true,
  },
  serverExternalPackages: ['bcrypt', 'postgres'],
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
        protocol: 'https',
      },
    ],
  },
  webpack: (config) => {
    // Ignore specific modules that cause issues in client builds
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      'perf_hooks': false,
      'mock-aws-s3': false,
      'nock': false,
    };
    return config;
  },
};

export default nextConfig;
