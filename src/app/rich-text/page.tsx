import type { Metadata } from "next";
import RichTextClient from "./_client";

export const metadata: Metadata = {
  title: "Rich Text",
  description:
    "Distraction-free rich-text editor with tabs. Format with a floating toolbar or slash menu — saved locally in your browser, no sign-up.",
  alternates: { canonical: "/rich-text" },
  keywords: [
    "online rich text editor",
    "free rich text editor",
    "browser rich text editor",
    "tiptap editor",
    "wysiwyg",
    "no sign-up",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny Rich Text",
  url: "https://usetiny.app/rich-text",
  description:
    "Distraction-free rich-text editor with tabs, headings, lists, tables, and slash commands. Saved locally in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  featureList: [
    "Bold / italic / underline / strike / code",
    "Headings 1–6",
    "Bullet, numbered, and task lists",
    "Tables, images, code blocks",
    "Floating bubble toolbar",
    "Slash command menu",
    "Tabs with local storage",
    "Keyboard shortcuts",
  ],
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function RichTextPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RichTextClient />
    </>
  );
}
