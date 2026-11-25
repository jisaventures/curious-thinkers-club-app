import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async redirects() {
    return [
      { source: "/my-packs", destination: "/my-quests", permanent: false },
      { source: "/club/uploads", destination: "/submit-work", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/brand/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
