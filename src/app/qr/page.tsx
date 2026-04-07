import { Suspense } from "react";
import QRGeneratorContent from "@/features/qr-generator/components/qr-generator-content";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QR Generator",
  description:
    "Generate QR codes instantly in your browser. Supports URLs, WiFi, email, phone, SMS, and Bitcoin. Download as PNG — free, no watermarks, no sign-up.",
  alternates: { canonical: "/qr" },
  keywords: [
    "QR code generator",
    "free QR code",
    "QR code maker",
    "WiFi QR code",
    "URL QR code",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny QR Generator",
  url: "https://usetiny.app/qr",
  description:
    "Generate QR codes instantly in your browser. Supports URLs, WiFi, email, phone, SMS, and Bitcoin.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function QRPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<FullscreenLoading />}>
        <QRGeneratorContent />
      </Suspense>
    </>
  );
}
