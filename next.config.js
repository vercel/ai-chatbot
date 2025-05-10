/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  experimental: {
    // ppr: true,
    serverComponentsExternalPackages: ['bcrypt', 'postgres'],
  },
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
      _http_common: false,
      perf_hooks: false,
      'mock-aws-s3': false,
      nock: false,
    };
    return config;
  },
};

module.exports = nextConfig;
