import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the tracing root to this project (a pnpm-lock.yaml exists higher up the
  // filesystem, which would otherwise be inferred as the workspace root).
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      // YouTube thumbnails (recipe video posters)
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

export default nextConfig;
