import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'framer-motion',
    ],
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  compress: true,
  poweredByHeader: false,
  
  // Redirects for deprecated routes - SIMPLIFIED TO AVOID LOOPS
  async redirects() {
    return [
      {
        source: '/api/knowledge-base/upload',
        destination: '/api/knowledge-new',
        permanent: true,
      },
      {
        source: '/api/knowledge/create',
        destination: '/api/knowledge-new',
        permanent: true,
      },
      {
        source: '/api/kb-new',
        destination: '/api/knowledge-new',
        permanent: true,
      },
      {
        source: '/api/knowledge-url/:path*',
        destination: '/api/knowledge-new',
        permanent: true,
      }
    ];
  },
};

export default nextConfig;