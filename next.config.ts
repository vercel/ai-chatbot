import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    // Optimize build performance
    // optimizeCss: false, // Temporarily disabled to avoid critters dependency issues
    // Use incremental cache compilation for faster builds
    // turbotrace was removed as it's no longer supported in this Next.js version
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
  
  // Add redirects for deprecated routes
  // Add redirects for deprecated routes
  async redirects() {
    return [
      {
        source: '/api/knowledge-base/upload',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
      {
        source: '/api/knowledge/create',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
      {
        source: '/api/kb-new',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
      {
        source: '/api/knowledge-base/audio',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
      {
        source: '/api/knowledge-base/audio/record',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
      {
        source: '/api/knowledge-base/audio',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
      {
        source: '/api/knowledge-base/audio/record',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
      {
        source: '/api/knowledge-audio/:path*',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
      {
        source: '/api/knowledge-pdf/:path*',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
      {
        source: '/api/knowledge-text/:path*',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
      {
        source: '/api/knowledge-url/:path*',
        destination: '/api/knowledgeupload',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;