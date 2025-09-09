import { fileURLToPath } from 'node:url'

import createJiti from 'jiti'
import type { NextConfig } from 'next'

const jiti = createJiti(fileURLToPath(import.meta.url))
jiti('./env')

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
      ],
    },
  },
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
};

export default nextConfig;