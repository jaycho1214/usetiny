import type { ShortcutSection } from "@/components/shortcuts-dialog";

export function imageShortcutSections(isMac: boolean): ShortcutSection[] {
  const mod = isMac ? "⌘" : "Ctrl";
  return [
    {
      category: "Files",
      items: [
        { keys: [mod, "O"], description: "Open files" },
        { keys: [mod, "S"], description: "Download" },
        { keys: [mod, "⇧", "S"], description: "Download all (ZIP)" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: [mod, "["], description: "Previous file" },
        { keys: [mod, "]"], description: "Next file" },
      ],
    },
    {
      category: "View",
      items: [
        { keys: ["←"], description: "Move divider left" },
        { keys: ["→"], description: "Move divider right" },
      ],
    },
  ];
}
