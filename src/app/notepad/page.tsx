import { Suspense } from "react";
import NotepadContent from "@/features/notepad/components/notepad-content";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notepad",
  description: "Simple notepad with tabs and keyboard shortcuts",
};

export default function NotepadPage() {
  return (
    <Suspense fallback={<FullscreenLoading />}>
      <NotepadContent />
    </Suspense>
  );
}
