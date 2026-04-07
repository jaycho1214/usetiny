import type { MetadataRoute } from "next";
import { allTools } from "@/lib/tools";
import { qrTypes } from "@/features/qr-generator/utils";

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
    ...qrTypes
      .filter((t) => t !== "text")
      .map((type) => ({
        url: `${baseUrl}/qr/${type}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
  ];
}
