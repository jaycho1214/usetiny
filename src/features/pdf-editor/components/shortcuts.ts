import type { ShortcutSection } from "@/components/shortcuts-dialog";

export function pdfEditorShortcutSections(isMac: boolean): ShortcutSection[] {
  const mod = isMac ? "⌘" : "Ctrl";
  return [
    {
      category: "Tools",
      items: [
        { keys: ["V"], description: "Select tool" },
        { keys: ["T"], description: "Add text" },
        { keys: ["D"], description: "Draw / sign" },
        { keys: ["H"], description: "Highlight" },
        { keys: ["F"], description: "Form field" },
        { keys: ["G"], description: "Fill mode" },
        { keys: ["E"], description: "Eraser" },
      ],
    },
    {
      category: "Edit",
      items: [
        { keys: [mod, "Z"], description: "Undo" },
        { keys: [mod, "Shift", "Z"], description: "Redo" },
        { keys: [mod, "C"], description: "Copy (annotation or page)" },
        { keys: [mod, "V"], description: "Paste" },
        { keys: [mod, "D"], description: "Duplicate" },
        { keys: ["Backspace"], description: "Delete (annotation or page)" },
        { keys: ["Escape"], description: "Deselect / Cancel" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["←"], description: "Previous page" },
        { keys: ["→"], description: "Next page" },
      ],
    },
    {
      category: "View",
      items: [
        { keys: [mod, "+"], description: "Zoom in" },
        { keys: [mod, "-"], description: "Zoom out" },
        { keys: [mod, "0"], description: "Reset zoom" },
        { keys: [mod, "Scroll"], description: "Native zoom" },
        { keys: ["?"], description: "Show shortcuts" },
      ],
    },
    {
      category: "File",
      items: [{ keys: [mod, "S"], description: "Export PDF" }],
    },
  ];
}
