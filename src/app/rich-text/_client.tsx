"use client";

import dynamic from "next/dynamic";
import { FullscreenLoading } from "@/components/fullscreen-loading";

const RichTextContent = dynamic(
  () => import("@/features/rich-text/components/rich-text-content"),
  {
    ssr: false,
    loading: () => <FullscreenLoading />,
  },
);

export default function RichTextClient() {
  return <RichTextContent />;
}
