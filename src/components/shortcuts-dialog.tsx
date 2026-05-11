"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export interface ShortcutItem {
  keys: string[];
  description: string;
}

export interface ShortcutSection {
  category?: string;
  items: ShortcutItem[];
}

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description?: string;
  sections: ShortcutSection[];
  /** Optional max width override. Defaults to 500px. */
  maxWidth?: number;
}

export function ShortcutsDialog({
  open,
  onOpenChange,
  description,
  sections,
  maxWidth = 500,
}: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] flex-col"
        style={{ maxWidth }}
      >
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="-mr-2 space-y-6 overflow-y-auto pr-2">
          {sections.map((section, sectionIndex) => (
            <div key={section.category ?? sectionIndex} className="space-y-3">
              {section.category && (
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {section.category}
                </h3>
              )}
              <div className="space-y-2">
                {section.items.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 border-b py-2 last:border-0"
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
