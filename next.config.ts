import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ai"],
  experimental: {
    ppr: true,
    turbo: {
      resolveAlias: {
        'graphql/language/visitor': './lib/stubs/graphql.ts',
        'graphql/language/printer': './lib/stubs/graphql.ts',
        'graphql/utilities': './lib/stubs/graphql.ts',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
    ],
  },
};

export default nextConfig;
