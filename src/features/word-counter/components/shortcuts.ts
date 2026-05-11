import type { ShortcutSection } from "@/components/shortcuts-dialog";

export const wordCounterShortcutSections: ShortcutSection[] = [
  {
    items: [
      { keys: ["/"], description: "Focus textarea" },
      { keys: ["Esc"], description: "Unfocus textarea" },
      { keys: ["?"], description: "Show shortcuts" },
    ],
  },
];
