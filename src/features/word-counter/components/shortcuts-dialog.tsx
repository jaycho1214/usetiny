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

const shortcuts = [
  { keys: ["/"], description: "Focus textarea" },
  { keys: ["Esc"], description: "Unfocus textarea" },
  { keys: ["?"], description: "Show shortcuts" },
];

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Available keyboard shortcuts for Word Counter.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
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
