import type { NextConfig } from "next";
import { withPostHogConfig } from "@posthog/nextjs-config";

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
