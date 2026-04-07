import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ToolVisitTracker } from "@/components/tool-visit-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://usetiny.app"),
  title: { default: "UseTiny", template: "%s | UseTiny" },
  description:
    "Free browser-based tools that work instantly. Online notepad, QR code generator, and PDF editor. No sign-up, no uploads — everything runs locally in your browser.",
  keywords: [
    "free online tools",
    "browser tools",
    "online notepad",
    "QR code generator",
    "PDF editor",
    "no sign-up",
    "privacy",
    "client-side",
  ],
  authors: [{ name: "Jay Cho", url: "https://github.com/jaycho1214" }],
  creator: "Jay Cho",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://usetiny.app",
    siteName: "UseTiny",
    title: "UseTiny",
    description:
      "Free browser-based tools that work instantly. No sign-up, no uploads — everything runs locally.",
  },
  twitter: {
    card: "summary_large_image",
    title: "UseTiny",
    description:
      "Free browser-based tools that work instantly. No sign-up, no uploads — everything runs locally.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            {children}
            <Toaster />
            <ToolVisitTracker />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
