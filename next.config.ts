import type { NextConfig } from "next";
import { withPostHogConfig } from "@posthog/nextjs-config";

const nextConfig: NextConfig = {
  async rewrites() {
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
  async redirects() {
    return [
      {
        source: "/qr-code-generator",
        destination: "/qr",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

const isProduction = process.env.NODE_ENV === "production";
const hasPostHogKeys =
  !!process.env.POSTHOG_API_KEY && !!process.env.POSTHOG_PROJECT_ID;

export default isProduction && hasPostHogKeys
  ? withPostHogConfig(nextConfig, {
      personalApiKey: process.env.POSTHOG_API_KEY!,
      projectId: process.env.POSTHOG_PROJECT_ID!,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      sourcemaps: {
        enabled: true,
        deleteAfterUpload: true,
      },
    })
  : nextConfig;
