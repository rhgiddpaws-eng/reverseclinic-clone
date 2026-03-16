import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "/*": [
      "./public/reverseclinic-mirror/site/**",
      "./public/reverseclinic-mirror/fonts/**",
      "./public/reverseclinic-mirror/files/**",
      "./public/reverseclinic-mirror/pages/**",
    ],
  },
  serverExternalPackages: ["cheerio"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "reverseclinic.com" },
      { protocol: "https", hostname: "www.reverseclinic.com" },
      { protocol: "https", hostname: "*.reverseclinic.com" },
    ],
  },
  async rewrites() {
    return [
      // 깨진 로컬 폰트 → 원본 사이트에서 직접 로드
      {
        source: "/reverseclinic-mirror/fonts/:path*",
        destination: "https://reverseclinic.com/_files/:path*",
      },
    ];
  },
};

export default nextConfig;
