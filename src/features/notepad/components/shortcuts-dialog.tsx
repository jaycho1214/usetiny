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
      category: "Tab Management",
      items: [
        {
          keys: [modKey, "K"],
          description: "Create new tab",
        },
        {
          keys: [modKey, "Shift", "⌫"],
          description: "Delete current tab",
        },
        {
          keys: [modKey, "1-9"],
          description: "Switch to tab 1-9",
        },
        {
          keys: [modKey, "."],
          description: "Next tab",
        },
        {
          keys: [modKey, ","],
          description: "Previous tab",
        },
      ],
    },
    {
      category: "Navigation",
      items: [
        {
          keys: ["/"],
          description: "Focus textarea",
        },
        {
          keys: ["F2"],
          description: "Rename tab",
        },
        {
          keys: ["Esc"],
          description: "Unfocus",
        },
        {
          keys: ["↑", "↓"],
          description: "Navigate tabs",
        },
        {
          keys: ["?"],
          description: "Show shortcuts",
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
            Use these shortcuts to navigate and manage your notepad efficiently.
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
