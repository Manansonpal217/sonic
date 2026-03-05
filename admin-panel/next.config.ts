import type { NextConfig } from "next";

// Proxy media to backend so images load same-origin (avoids ERR_BLOCKED_BY_ORB)
const mediaBackend = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/media\/?$/, '') || 'http://localhost:8000';

const nextConfig = {
  async rewrites() {
    return [{ source: '/media/:path*', destination: `${mediaBackend}/media/:path*` }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http' as const,
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http' as const,
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'sonic-db-n7v6t.ondigitalocean.app',
        pathname: '/media/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig as import('next').NextConfig;
