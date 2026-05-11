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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Manage tabs and format text without leaving the keyboard.
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
                    className="flex items-center justify-between py-2 border-b last:border-0 gap-3"
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
