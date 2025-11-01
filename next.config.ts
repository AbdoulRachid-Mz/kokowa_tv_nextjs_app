import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pg-hstore'],
  },
  typescript: {
    ignoreBuildErrors: false,
  }
};

export default nextConfig;
