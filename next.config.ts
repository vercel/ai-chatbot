import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Optional: for standalone deployment
  experimental: {
    ppr: true,
    serverComponentsExternalPackages: ['sharp', 'onnxruntime-node'],
  },
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
};

export default nextConfig;
