import type { Metadata } from "next";
import { Suspense, lazy } from "react";
import { FullscreenLoading } from "@/components/fullscreen-loading";

const ImageContent = lazy(
  () => import("@/features/image/components/image-content"),
);

export const metadata: Metadata = {
  title: "Image Compressor",
  description:
    "Compress, resize, and convert images in your browser. JPEG, PNG, WebP, AVIF with side-by-side comparison. No uploads — everything runs locally.",
  alternates: { canonical: "/image" },
  keywords: [
    "image compressor",
    "image converter",
    "compress JPEG",
    "convert to WebP",
    "convert to AVIF",
    "resize image online",
    "batch image compression",
    "image optimizer",
    "free image compressor",
    "strip EXIF metadata",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny Image Compressor",
  url: "https://usetiny.app/image",
  description:
    "Compress, resize, and convert images in your browser with side-by-side comparison. Supports JPEG, PNG, WebP, and AVIF.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript and WebAssembly",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "JPEG, PNG, WebP, AVIF compression",
    "Side-by-side comparison slider",
    "Batch processing",
    "Image resizing with presets",
    "EXIF metadata management",
    "Quality control with live preview",
  ],
};

export default function ImagePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<FullscreenLoading />}>
        <ImageContent />
      </Suspense>
    </>
  );
}
