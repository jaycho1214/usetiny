import {
  FileDown,
  FileText,
  ImageDown,
  LetterText,
  NotepadText,
  Pilcrow,
  QrCode,
  Repeat,
  Sheet,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Tool {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  /** ISO date (YYYY-MM-DD) the tool was first published. Drives the "N new" badge. */
  addedAt: string;
}

export const allTools: Tool[] = [
  {
    name: "Notepad",
    description: "Distraction-free text editor with tabs",
    icon: NotepadText,
    href: "/notepad",
    addedAt: "2025-11-18",
  },
  {
    name: "QR Generator",
    description: "Create and download QR codes instantly",
    icon: QrCode,
    href: "/qr",
    addedAt: "2025-11-23",
  },
  {
    name: "PDF Editor",
    description: "Annotate, fill forms, and manage pages",
    icon: FileText,
    href: "/pdf-editor",
    addedAt: "2026-04-07",
  },
  {
    name: "Spreadsheet",
    description: "Disposable spreadsheet with formulas and export",
    icon: Sheet,
    href: "/spreadsheet",
    addedAt: "2026-04-08",
  },
  {
    name: "Markdown to PDF",
    description: "Convert Markdown to beautiful PDF",
    icon: FileDown,
    href: "/markdown",
    addedAt: "2026-04-08",
  },
  {
    name: "Image Compressor",
    description: "Compress, resize, and convert images instantly",
    icon: ImageDown,
    href: "/image",
    addedAt: "2026-04-08",
  },
  {
    name: "Word Counter",
    description: "Count words, characters, sentences, and reading time",
    icon: LetterText,
    href: "/word-counter",
    addedAt: "2026-04-10",
  },
  {
    name: "YouTube Looper",
    description: "A-B loop YouTube videos with speed and keyboard shortcuts",
    icon: Repeat,
    href: "/youtube-looper",
    addedAt: "2026-04-17",
  },
  {
    name: "Webhook Inspector",
    description: "Capture and inspect HTTP webhooks at a unique URL",
    icon: Webhook,
    href: "/webhook-inspector",
    addedAt: "2026-04-25",
  },
  {
    name: "Rich Text",
    description: "Rich-text editor with tabs, headings, lists, and formatting",
    icon: Pilcrow,
    href: "/rich-text",
    addedAt: "2026-05-11",
  },
];
