import { Suspense } from "react";
import NotepadContent from "@/features/notepad/components/notepad-content";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notepad",
  description:
    "Distraction-free online notepad with tabs and keyboard shortcuts. Notes are saved locally in your browser — no account needed, nothing uploaded.",
  alternates: { canonical: "/notepad" },
  keywords: [
    "online notepad",
    "free notepad",
    "browser notepad",
    "text editor",
    "no sign-up",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny Notepad",
  url: "https://usetiny.app/notepad",
  description:
    "Distraction-free online notepad with tabs and keyboard shortcuts. Notes are saved locally in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function NotepadPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<FullscreenLoading />}>
        <NotepadContent />
      </Suspense>
    </>
  );
}
