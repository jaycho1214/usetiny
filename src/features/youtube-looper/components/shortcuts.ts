import type { ShortcutSection } from "@/components/shortcuts-dialog";

export const youtubeLooperShortcutSections: ShortcutSection[] = [
  {
    items: [
      { keys: ["Space"], description: "Play / pause" },
      { keys: ["["], description: "Set loop start (A)" },
      { keys: ["]"], description: "Set loop end (B)" },
      { keys: ["L"], description: "Toggle loop" },
      { keys: ["\\"], description: "Clear loop" },
      { keys: [","], description: "Seek −5 seconds" },
      { keys: ["."], description: "Seek +5 seconds" },
      { keys: ["−"], description: "Speed down" },
      { keys: ["+"], description: "Speed up" },
      { keys: ["R"], description: "Reset speed to 1×" },
      { keys: ["S"], description: "Save current loop" },
      { keys: ["J"], description: "Jump to loop start" },
      { keys: ["/"], description: "Focus URL input" },
      { keys: ["Esc"], description: "Unfocus input" },
      { keys: ["?"], description: "Show shortcuts" },
    ],
  },
];
