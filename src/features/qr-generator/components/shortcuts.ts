import type { ShortcutSection } from "@/components/shortcuts-dialog";

export function qrShortcutSections(isMac: boolean): ShortcutSection[] {
  const modKey = isMac ? "⌘" : "Ctrl+";
  return [
    {
      category: "QR Type",
      items: [
        { keys: [modKey, "1"], description: "Text" },
        { keys: [modKey, "2"], description: "URL" },
        { keys: [modKey, "3"], description: "WiFi" },
        { keys: [modKey, "4"], description: "Email" },
        { keys: [modKey, "5"], description: "Phone" },
        { keys: [modKey, "6"], description: "SMS" },
        { keys: [modKey, "7"], description: "Bitcoin" },
      ],
    },
    {
      category: "Actions",
      items: [
        { keys: [modKey, "C"], description: "Copy QR to clipboard" },
        { keys: [modKey, "D"], description: "Download QR code" },
        { keys: [modKey, "L"], description: "Clear input" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["/"], description: "Focus input" },
        { keys: ["?"], description: "Show shortcuts" },
      ],
    },
  ];
}
