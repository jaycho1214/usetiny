import { Suspense } from "react";
import MarkdownContent from "@/features/markdown/components/markdown-content";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markdown to PDF",
  description:
    "Convert Markdown to beautifully formatted PDF. Live preview, syntax highlighting, and configurable export — all running locally in your browser.",
  alternates: { canonical: "/markdown" },
  keywords: [
    "markdown to pdf",
    "markdown converter",
    "markdown preview",
    "pdf export",
    "free markdown editor",
    "no sign-up",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny Markdown to PDF",
  url: "https://usetiny.app/markdown",
  description:
    "Convert Markdown to beautifully formatted PDF with live preview and syntax highlighting. Runs locally in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Live Markdown preview",
    "Syntax-highlighted code blocks",
    "GFM tables and task lists",
    "Configurable PDF export",
    "Client-side processing",
  ],
};

export default function MarkdownPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<FullscreenLoading />}>
        <MarkdownContent />
      </Suspense>
    </>
  );
}
