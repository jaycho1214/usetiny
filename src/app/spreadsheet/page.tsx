import { Suspense } from "react";
import SpreadsheetContent from "@/features/spreadsheet/components/spreadsheet-content";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spreadsheet",
  description:
    "Free disposable spreadsheet with formulas, multiple sheets, and XLSX export. Runs entirely in your browser — no sign-up, no uploads.",
  alternates: { canonical: "/spreadsheet" },
  keywords: [
    "online spreadsheet",
    "free spreadsheet",
    "browser spreadsheet",
    "excel online",
    "csv editor",
    "no sign-up",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny Spreadsheet",
  url: "https://usetiny.app/spreadsheet",
  description:
    "Free disposable spreadsheet with formulas, multiple sheets, and XLSX export. Runs entirely in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "400+ Excel-compatible formulas",
    "Multiple sheets",
    "Export to XLSX and CSV",
    "Undo/redo",
    "Copy/paste from Excel",
    "No account required",
  ],
};

export default function SpreadsheetPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<FullscreenLoading />}>
        <SpreadsheetContent />
      </Suspense>
    </>
  );
}
