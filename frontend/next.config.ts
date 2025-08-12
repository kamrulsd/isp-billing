import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow common local network IPs and patterns
  allowedDevOrigins: ['*'],
  // basePath: '/frontend', // to use as localhost/frontend
};

export default nextConfig;