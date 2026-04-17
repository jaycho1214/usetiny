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
}

const shortcuts: Array<{ keys: string[]; description: string }> = [
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
];

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Available shortcuts for YouTube Looper.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.description}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="text-sm">{shortcut.description}</span>
              <KbdGroup>
                {shortcut.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </KbdGroup>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
