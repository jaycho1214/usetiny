import { Suspense, lazy } from "react";
import type { Metadata } from "next";
import { FullscreenLoading } from "@/components/fullscreen-loading";

const Inspector = lazy(
  () => import("@/features/webhook-inspector/components/inspector"),
);

export const metadata: Metadata = {
  title: "Webhook Inspector",
  description:
    "Capture and inspect HTTP webhooks at a unique URL. View headers, query, and body live in your browser. No sign-up, nothing stored on a server.",
  alternates: { canonical: "/webhook-inspector" },
  keywords: [
    "webhook inspector",
    "webhook tester",
    "request bin",
    "http debugger",
    "webhook.site alternative",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny Webhook Inspector",
  url: "https://usetiny.app/webhook-inspector",
  description:
    "Capture and inspect HTTP webhooks at a unique URL. View headers, query, and body live in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  featureList: [
    "Receive webhooks at a unique signed URL",
    "Inspect method, headers, query, and body",
    "Multiple endpoints with separate histories",
    "Local-only history — no account, no server storage",
  ],
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function WebhookInspectorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<FullscreenLoading />}>
        <Inspector />
      </Suspense>
    </>
  );
}
