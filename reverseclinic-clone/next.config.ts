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
};

export default nextConfig;
