import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here - forced restart */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
