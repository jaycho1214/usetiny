import { Suspense, lazy } from "react";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import type { Metadata } from "next";

const TimeblockContent = lazy(
  () => import("@/features/timeblock/components/timeblock-content"),
);

const SHARE_DESCRIPTION =
  "Plan your week in color-coded time blocks, reuse weekly templates, and track planned vs. done hours. Runs in your browser, no sign-up.";

export const metadata: Metadata = {
  title: "Timeblock Planner",
  description:
    "Free time blocking planner. Drag to plan your week in color-coded blocks, reuse weekly templates, and track planned vs. done hours. No sign-up required.",
  alternates: { canonical: "/timeblock" },
  keywords: [
    "time blocking",
    "time block planner",
    "time blocking app",
    "weekly planner",
    "time blocking template",
    "ideal week template",
    "weekly schedule maker",
    "time block calendar",
    "weekly time blocking",
    "free time blocking tool",
  ],
  openGraph: {
    title: "Timeblock Planner",
    description: SHARE_DESCRIPTION,
    url: "https://usetiny.app/timeblock",
  },
  twitter: {
    card: "summary_large_image",
    title: "Timeblock Planner | UseTiny",
    description: SHARE_DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny Timeblock",
  url: "https://usetiny.app/timeblock",
  description:
    "Plan your week in color-coded time blocks with drag-and-drop, reusable weekly templates, planned vs. done tracking, and undo/redo. Runs entirely in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Drag to create, move, and resize time blocks on a weekly calendar",
    "Color-coded categories with weekly time totals",
    "Mark blocks done or skipped to compare planned vs. actual time",
    "Reusable named week templates",
    "Undo and redo for every change",
    "Saved locally in your browser, no account needed",
  ],
};

export default function TimeblockPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">Timeblock — Free Weekly Time Blocking Planner</h1>
      <p className="sr-only">
        Plan your week in color-coded time blocks. Drag on the calendar to
        create a block, move or resize it, and mark it done or skipped to
        compare planned and actual time per category. Save typical weeks as
        templates and apply them to any week. Everything stays in your browser,
        no sign-up.
      </p>
      <Suspense fallback={<FullscreenLoading />}>
        <TimeblockContent />
      </Suspense>
    </>
  );
}
