import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "/*": [
      "./public/reverseclinic-mirror/site/**",
      "./public/reverseclinic-mirror/fonts/**",
    ],
  },
};

export default nextConfig;
