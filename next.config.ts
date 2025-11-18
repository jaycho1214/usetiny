import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  rewrites() {
    return [
      {
        source: "/relay-aqZo/static/(.*)",
        destination: "https://us-assets.i.posthog.com/static/$1",
      },
      {
        source: "/relay-aqZo/(.*)",
        destination: "https://us.i.posthog.com/$1",
      },
    ];
  },
};

export default nextConfig;
