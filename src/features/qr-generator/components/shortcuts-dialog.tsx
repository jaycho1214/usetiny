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
      category: "QR Type",
      items: [
        {
          keys: [modKey, "1"],
          description: "Text",
        },
        {
          keys: [modKey, "2"],
          description: "URL",
        },
        {
          keys: [modKey, "3"],
          description: "WiFi",
        },
        {
          keys: [modKey, "4"],
          description: "Email",
        },
        {
          keys: [modKey, "5"],
          description: "Phone",
        },
        {
          keys: [modKey, "6"],
          description: "SMS",
        },
        {
          keys: [modKey, "7"],
          description: "Bitcoin",
        },
      ],
    },
    {
      category: "Actions",
      items: [
        {
          keys: [modKey, "C"],
          description: "Copy QR to clipboard",
        },
        {
          keys: [modKey, "D"],
          description: "Download QR code",
        },
        {
          keys: [modKey, "L"],
          description: "Clear input",
        },
      ],
    },
    {
      category: "Navigation",
      items: [
        {
          keys: ["/"],
          description: "Focus input",
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
            Use these shortcuts to quickly generate and manage QR codes.
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
