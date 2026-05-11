import type { ShortcutSection } from "@/components/shortcuts-dialog";

export function richTextShortcutSections(isMac: boolean): ShortcutSection[] {
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
        { keys: ["/"], description: "Focus editor / open slash menu" },
        { keys: ["F2"], description: "Rename tab" },
        { keys: ["Esc"], description: "Unfocus" },
        { keys: ["↑", "↓"], description: "Navigate tabs" },
        { keys: ["?"], description: "Show shortcuts" },
      ],
    },
    {
      category: "Formatting",
      items: [
        { keys: [modKey, "B"], description: "Bold" },
        { keys: [modKey, "I"], description: "Italic" },
        { keys: [modKey, "U"], description: "Underline" },
        { keys: [modKey, "Shift", "S"], description: "Strikethrough" },
        { keys: [modKey, "E"], description: "Inline code" },
        { keys: [modKey, "Shift", "1-6"], description: "Heading 1-6" },
        { keys: [modKey, "Shift", "8"], description: "Bullet list" },
        { keys: [modKey, "Shift", "7"], description: "Numbered list" },
        { keys: [modKey, "Shift", "9"], description: "Task list" },
        { keys: [modKey, "Alt", "C"], description: "Code block" },
        { keys: [modKey, "Shift", "B"], description: "Blockquote" },
        {
          keys: [modKey, "L / E / R / J"],
          description: "Align left / center / right / justify",
        },
        {
          keys: ["Tab", "/", "Shift+Tab"],
          description: "Sink / lift list item",
        },
      ],
    },
  ];
}
