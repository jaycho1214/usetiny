import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/_next/", "/relay-aqZo/"],
    },
    sitemap: "https://usetiny.app/sitemap.xml",
  };
}
