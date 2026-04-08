"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMac: boolean;
}

export function ShortcutsDialog({
  open,
  onOpenChange,
  isMac,
}: ShortcutsDialogProps) {
  const modKey = isMac ? "⌘" : "Ctrl+";

  const shortcuts = [
    {
      category: "Export",
      items: [
        { keys: [modKey, "⇧", "E"], description: "Export as XLSX" },
      ],
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate and edit your spreadsheet efficiently.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 overflow-y-auto max-h-[60vh]">
          {shortcuts.map((section) => (
            <div key={section.category} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <KbdGroup>
                      {shortcut.keys.map((key, keyIndex) => (
                        <Kbd key={keyIndex}>{key}</Kbd>
                      ))}
                    </KbdGroup>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
