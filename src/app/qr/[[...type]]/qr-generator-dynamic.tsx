"use client";

import dynamic from "next/dynamic";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import type { QRType } from "@/features/qr-generator/utils";

const QRGeneratorContent = dynamic(
  () => import("@/features/qr-generator/components/qr-generator-content"),
  { ssr: false, loading: () => <FullscreenLoading /> },
);

export function QRGeneratorDynamic({ initialType }: { initialType: QRType }) {
  return <QRGeneratorContent initialType={initialType} />;
}
