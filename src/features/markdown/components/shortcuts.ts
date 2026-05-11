import type { ShortcutSection } from "@/components/shortcuts-dialog";

export function markdownShortcutSections(isMac: boolean): ShortcutSection[] {
  const modKey = isMac ? "⌘" : "Ctrl+";
  return [
    {
      category: "Export",
      items: [
        { keys: [modKey, "⇧", "E"], description: "Export PDF" },
        { keys: [modKey, "P"], description: "Print" },
      ],
    },
    {
      category: "View",
      items: [
        { keys: [modKey, "1"], description: "Editor only" },
        { keys: [modKey, "2"], description: "Split view" },
        { keys: [modKey, "3"], description: "Preview only" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["/"], description: "Focus editor" },
        { keys: ["?"], description: "Show shortcuts" },
      ],
    },
  ];
}
