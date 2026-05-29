import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // NGL ships as a mix of ESM/CJS and needs to be transpiled by Next.
  transpilePackages: ["ngl"],

  turbopack: {
    root: path.resolve(__dirname),
  },

  // Allow next/image to optimize thumbnails and avatars from these hosts.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "files.rcsb.org" },
    ],
  },
};

export default nextConfig;
