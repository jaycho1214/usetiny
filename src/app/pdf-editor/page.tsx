import type { Metadata } from "next";
import { Suspense, lazy } from "react";
import { FullscreenLoading } from "@/components/fullscreen-loading";

const PDFEditor = lazy(() =>
  import("@/features/pdf-editor/components/pdf-editor").then((m) => ({
    default: m.PDFEditor,
  }))
);

export const metadata: Metadata = {
  title: "PDF Editor",
  description:
    "Edit PDFs securely in your browser. Add text, draw, highlight, and form fields — all client-side, your files never leave your device.",
};

export default function PDFEditorPage() {
  return (
    <Suspense fallback={<FullscreenLoading />}>
      <PDFEditor />
    </Suspense>
  );
}
