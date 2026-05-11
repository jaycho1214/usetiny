import type { ShortcutSection } from "@/components/shortcuts-dialog";

export function notepadShortcutSections(isMac: boolean): ShortcutSection[] {
  const modKey = isMac ? "⌘" : "Ctrl+";
  return [
    {
      category: "Tab Management",
      items: [
        { keys: [modKey, "K"], description: "Create new tab" },
        { keys: [modKey, "Shift", "⌫"], description: "Delete current tab" },
        { keys: [modKey, "1-9"], description: "Switch to tab 1-9" },
        { keys: [modKey, "."], description: "Next tab" },
        { keys: [modKey, ","], description: "Previous tab" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["/"], description: "Focus textarea" },
        { keys: ["F2"], description: "Rename tab" },
        { keys: ["Esc"], description: "Unfocus" },
        { keys: ["↑", "↓"], description: "Navigate tabs" },
        { keys: ["?"], description: "Show shortcuts" },
      ],
    },
  ];
}
