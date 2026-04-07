import { FileText, NotepadText, QrCode } from "lucide-react";
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
];
