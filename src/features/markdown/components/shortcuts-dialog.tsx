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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Shortcuts for the Markdown editor.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
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
