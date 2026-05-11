import type { ShortcutSection } from "@/components/shortcuts-dialog";

export function spreadsheetShortcutSections(isMac: boolean): ShortcutSection[] {
  const modKey = isMac ? "⌘" : "Ctrl+";
  return [
    {
      category: "Export",
      items: [{ keys: [modKey, "⇧", "E"], description: "Export as XLSX" }],
    },
    {
      category: "Editing",
      items: [
        { keys: [modKey, "C"], description: "Copy" },
        { keys: [modKey, "V"], description: "Paste" },
        { keys: [modKey, "X"], description: "Cut" },
        { keys: [modKey, "Z"], description: "Undo" },
        { keys: [modKey, "Y"], description: "Redo" },
        { keys: [modKey, "B"], description: "Bold" },
        { keys: [modKey, "I"], description: "Italic" },
        { keys: ["Delete"], description: "Clear cell" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["Tab"], description: "Next cell" },
        { keys: ["Enter"], description: "Confirm & move down" },
        { keys: ["Esc"], description: "Cancel editing" },
        { keys: ["Arrow keys"], description: "Move between cells" },
      ],
    },
    {
      category: "Auto-fill",
      items: [
        {
          keys: ["Drag corner"],
          description: "Fill series (1, 2, 3 → 4, 5, 6)",
        },
      ],
    },
  ];
}
