import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'lh3.googleusercontent.com', "tailwindcss.com"],
  },
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pg-hstore'],
  },
  typescript: {
    ignoreBuildErrors: false,
  }
};

export default nextConfig;
