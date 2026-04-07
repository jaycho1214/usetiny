import type { MetadataRoute } from "next";
import { allTools } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://usetiny.app";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    ...allTools.map((tool) => ({
      url: `${baseUrl}${tool.href}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
