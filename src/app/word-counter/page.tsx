import { Suspense, lazy } from "react";
import { FullscreenLoading } from "@/components/fullscreen-loading";

const WordCounterContent = lazy(
  () => import("@/features/word-counter/components/word-counter-content"),
);
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Word Counter",
  description:
    "Free online word counter — instantly count words, characters, sentences, paragraphs, and reading time. No sign-up, runs entirely in your browser.",
  alternates: { canonical: "/word-counter" },
  keywords: [
    "word counter",
    "word count",
    "character counter",
    "character count online",
    "online word counter",
    "free word counter",
    "sentence counter",
    "paragraph counter",
    "reading time calculator",
    "text analyzer",
    "word count tool",
  ],
  openGraph: {
    title: "Word Counter",
    description:
      "Count words, characters, sentences, paragraphs, and reading time. Free, no sign-up, runs in your browser.",
    url: "https://usetiny.app/word-counter",
  },
  twitter: {
    title: "Word Counter | UseTiny",
    description:
      "Count words, characters, sentences, paragraphs, and reading time. Free, no sign-up, runs in your browser.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny Word Counter",
  url: "https://usetiny.app/word-counter",
  description:
    "Free online word counter — instantly count words, characters, sentences, paragraphs, and reading time. Runs entirely in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Word count",
    "Character count",
    "Sentence count",
    "Paragraph count",
    "Reading time estimate",
    "Click to copy stats",
    "Local storage persistence",
  ],
};

export default function WordCounterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">Word Counter — Free Online Word Count Tool</h1>
      <p className="sr-only">
        Count words, characters, sentences, paragraphs, and estimate reading
        time instantly. Paste or type your text and see real-time statistics. No
        sign-up required — everything runs locally in your browser with no data
        uploaded.
      </p>
      <Suspense fallback={<FullscreenLoading />}>
        <WordCounterContent />
      </Suspense>
    </>
  );
}
