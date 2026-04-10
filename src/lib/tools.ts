import {
  FileDown,
  FileText,
  ImageDown,
  LetterText,
  NotepadText,
  QrCode,
  Sheet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Tool {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

export const allTools: Tool[] = [
  {
    name: "Notepad",
    description: "Distraction-free text editor with tabs",
    icon: NotepadText,
    href: "/notepad",
  },
  {
    name: "QR Generator",
    description: "Create and download QR codes instantly",
    icon: QrCode,
    href: "/qr",
  },
  {
    name: "PDF Editor",
    description: "Annotate, fill forms, and manage pages",
    icon: FileText,
    href: "/pdf-editor",
  },
  {
    name: "Spreadsheet",
    description: "Disposable spreadsheet with formulas and export",
    icon: Sheet,
    href: "/spreadsheet",
  },
  {
    name: "Markdown to PDF",
    description: "Convert Markdown to beautiful PDF",
    icon: FileDown,
    href: "/markdown",
  },
  {
    name: "Image Compressor",
    description: "Compress, resize, and convert images instantly",
    icon: ImageDown,
    href: "/image",
  },
  {
    name: "Word Counter",
    description: "Count words, characters, sentences, and reading time",
    icon: LetterText,
    href: "/word-counter",
  },
];
