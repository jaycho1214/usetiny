import { Suspense, lazy } from "react";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import type { Metadata } from "next";

const YoutubeLooperContent = lazy(
  () => import("@/features/youtube-looper/components/youtube-looper-content"),
);

export const metadata: Metadata = {
  title: "YouTube Looper",
  description:
    "Free online YouTube looper — loop any section of a YouTube video with A-B repeat, custom speed, and keyboard shortcuts. Save and share loops instantly.",
  alternates: { canonical: "/youtube-looper" },
  keywords: [
    "youtube looper",
    "youtube loop",
    "loop youtube video",
    "a b repeat youtube",
    "youtube ab loop",
    "repeat youtube section",
    "youtube speed control",
    "practice loop youtube",
    "youtube segment loop",
    "loop youtube url",
  ],
  openGraph: {
    title: "YouTube Looper",
    description:
      "Loop any section of a YouTube video with A-B repeat and custom speed. Runs in your browser, no sign-up.",
    url: "https://usetiny.app/youtube-looper",
  },
  twitter: {
    title: "YouTube Looper | UseTiny",
    description:
      "Loop any section of a YouTube video with A-B repeat and custom speed. Runs in your browser, no sign-up.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny YouTube Looper",
  url: "https://usetiny.app/youtube-looper",
  description:
    "Loop any section of a YouTube video with A-B repeat, playback speed control, keyboard shortcuts, and saved loops. Runs entirely in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "A-B loop for any YouTube video",
    "Custom playback speed 0.25× to 2×",
    "Full keyboard shortcut control",
    "Save and name loops locally",
    "Shareable loop links with timestamps",
    "Works with youtube.com, youtu.be, and Shorts",
  ],
};

export default function YoutubeLooperPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">
        YouTube Looper — Free A-B Loop and Speed Control for YouTube Videos
      </h1>
      <p className="sr-only">
        Loop any section of a YouTube video with precise A-B repeat, playback
        speed from 0.25× to 2×, keyboard shortcuts, and locally saved loops.
        Paste any YouTube URL or video ID to start. Share loops with exact
        timestamps. No sign-up, everything runs in your browser.
      </p>
      <Suspense fallback={<FullscreenLoading />}>
        <YoutubeLooperContent />
      </Suspense>
    </>
  );
}
