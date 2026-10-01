import type { ShortcutSection } from "@/components/shortcuts-dialog";

export function timeblockShortcutSections(modKey: string): ShortcutSection[] {
  return [
    {
      category: "Navigation",
      items: [
        { keys: ["T"], description: "Go to this week" },
        { keys: ["["], description: "Previous week" },
        { keys: ["]"], description: "Next week" },
      ],
    },
    {
      category: "Editing",
      items: [
        { keys: [modKey, "Z"], description: "Undo" },
        { keys: [modKey, "Shift", "Z"], description: "Redo" },
        { keys: ["Esc"], description: "Cancel a drag" },
      ],
    },
    {
      category: "Focused block",
      items: [
        { keys: ["↑", "↓"], description: "Move 15 minutes" },
        { keys: ["←", "→"], description: "Move to the previous or next day" },
        { keys: ["Shift", "↑", "↓"], description: "Shorten or lengthen" },
        { keys: ["Enter"], description: "Edit" },
        { keys: ["Space"], description: "Toggle done" },
        { keys: ["Delete"], description: "Delete" },
      ],
    },
    { items: [{ keys: ["?"], description: "Show shortcuts" }] },
  ];
}
