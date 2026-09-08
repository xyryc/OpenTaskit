import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const target = process.env.BACKEND_API_URL;
    if (!target) {
      throw new Error(
        "Missing required environment variable: BACKEND_API_URL. Please define it in your .env.local file (see .env.example)."
      );
    }
    return [
      {
        source: "/api/backend/:path*",
        destination: `${target}/:path*`,
      },
    ];
  },
};

export default nextConfig;
