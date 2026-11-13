import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set by the Dockerfile. `next start` doesn't work with standalone output, so it stays off
  // for `npm run build` and Vercel.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Enables forbidden(), used for the admin pages.
    authInterrupts: true,
  },
};

export default nextConfig;
