import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    // Optimize build performance
    optimizeCss: true,
    // Use incremental cache compilation for faster builds
    turbotrace: {
      logLevel: 'error',
    },
    // Improved bundle size optimization
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'framer-motion',
    ],
  },
  // Optimize image handling
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Improve build output
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimize memory usage during builds
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },
  // Add compression for responses
  compress: true,
  // Power by header
  poweredByHeader: false,
};

export default nextConfig;
