import type { NextConfig } from "next";
import { execSync } from "child_process";

let gitBranch = "unknown";
try {
  gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
    encoding: "utf-8",
  }).trim();
} catch {
  // Fallback if git command fails
  gitBranch = process.env.VERCEL_GIT_COMMIT_REF || "unknown";
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        //https://nextjs.org/docs/messages/next-image-unconfigured-host
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_GIT_BRANCH: gitBranch,
  },
};

export default nextConfig;
