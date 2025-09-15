import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
//  experimental: {
//    ppr: true,
//  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { hostname: 'avatar.vercel.sh' },
    ],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;

