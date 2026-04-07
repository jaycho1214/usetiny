import type { Metadata } from "next";
import { Suspense, lazy } from "react";
import { FullscreenLoading } from "@/components/fullscreen-loading";

const PDFEditor = lazy(() =>
  import("@/features/pdf-editor/components/pdf-editor").then((m) => ({
    default: m.PDFEditor,
  })),
);

export const metadata: Metadata = {
  title: "PDF Editor",
  description:
    "Edit PDFs securely in your browser. Add text, draw, highlight, fill forms, and manage pages — all client-side, your files never leave your device.",
  alternates: { canonical: "/pdf-editor" },
  keywords: [
    "PDF editor",
    "online PDF editor",
    "free PDF editor",
    "edit PDF online",
    "annotate PDF",
    "fill PDF forms",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny PDF Editor",
  url: "https://usetiny.app/pdf-editor",
  description:
    "Edit PDFs securely in your browser. Add text, draw, highlight, fill forms, and manage pages.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Add text annotations",
    "Draw and highlight",
    "Fill form fields",
    "Manage pages",
    "Export edited PDF",
  ],
};

export default function PDFEditorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<FullscreenLoading />}>
        <PDFEditor />
      </Suspense>
    </>
  );
}
