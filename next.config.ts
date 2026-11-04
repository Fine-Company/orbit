import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Enables forbidden(), used for the admin pages.
    authInterrupts: true,
  },
};

export default nextConfig;
