import { Suspense } from "react";
import { notFound } from "next/navigation";
import QRGeneratorContent from "@/features/qr-generator/components/qr-generator-content";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import type { Metadata } from "next";
import { qrTypes, type QRType } from "@/features/qr-generator/utils";

const typeMeta: Record<
  string,
  { title: string; description: string; keywords: string[] }
> = {
  text: {
    title: "QR Generator",
    description:
      "Generate QR codes instantly in your browser. Download as PNG — free, no watermarks, no sign-up.",
    keywords: ["QR code generator", "free QR code", "text QR code"],
  },
  url: {
    title: "URL QR Generator",
    description:
      "Create QR codes for any URL or link. Scan to open websites instantly — free, no watermarks.",
    keywords: ["URL QR code", "link QR code", "website QR code generator"],
  },
  wifi: {
    title: "WiFi QR Generator",
    description:
      "Generate a QR code for your WiFi network. Guests scan to connect instantly — no typing passwords.",
    keywords: [
      "WiFi QR code",
      "WiFi QR code generator",
      "share WiFi password QR",
    ],
  },
  email: {
    title: "Email QR Generator",
    description:
      "Create a QR code that opens a pre-filled email. Set recipient, subject, and body — free and instant.",
    keywords: ["email QR code", "mailto QR code generator"],
  },
  phone: {
    title: "Phone QR Generator",
    description:
      "Generate a QR code for a phone number. Scan to dial instantly — free, no app required.",
    keywords: ["phone QR code", "call QR code generator", "tel QR code"],
  },
  sms: {
    title: "SMS QR Generator",
    description:
      "Create a QR code that opens a pre-filled text message. Set number and message — free and instant.",
    keywords: ["SMS QR code", "text message QR code generator"],
  },
  bitcoin: {
    title: "Bitcoin QR Generator",
    description:
      "Generate a QR code for Bitcoin payments. Include address and amount — scan to pay instantly.",
    keywords: ["Bitcoin QR code", "crypto QR code generator", "BTC payment QR"],
  },
};

function resolveType(params: { type?: string[] }): QRType {
  if (!params.type || params.type.length === 0) return "text";
  const t = params.type[0];
  if (qrTypes.includes(t as QRType)) return t as QRType;
  notFound();
}

export async function generateStaticParams() {
  return [
    { type: [] },
    ...qrTypes.filter((t) => t !== "text").map((t) => ({ type: [t] })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type?: string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const qrType = resolveType(resolvedParams);
  const meta = typeMeta[qrType];
  const canonical = qrType === "text" ? "/qr" : `/qr/${qrType}`;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical },
  };
}

const jsonLdBase = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default async function QRPage({
  params,
}: {
  params: Promise<{ type?: string[] }>;
}) {
  const resolvedParams = await params;
  const qrType = resolveType(resolvedParams);
  const meta = typeMeta[qrType];

  const jsonLd = {
    ...jsonLdBase,
    name: `UseTiny ${meta.title}`,
    url: `https://usetiny.app/qr${qrType === "text" ? "" : `/${qrType}`}`,
    description: meta.description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<FullscreenLoading />}>
        <QRGeneratorContent initialType={qrType} />
      </Suspense>
    </>
  );
}
