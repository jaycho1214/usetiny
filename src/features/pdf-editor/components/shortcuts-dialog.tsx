"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { useIsMac } from "@/hooks/use-is-mac";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsDialog({ open, onOpenChange }: Props) {
  const isMac = useIsMac();
  const mod = isMac ? "\u2318" : "Ctrl";

  const sections = [
    {
      title: "Tools",
      shortcuts: [
        { keys: ["V"], label: "Select tool" },
        { keys: ["T"], label: "Add text" },
        { keys: ["D"], label: "Draw / sign" },
        { keys: ["H"], label: "Highlight" },
        { keys: ["F"], label: "Form field" },
        { keys: ["G"], label: "Fill mode" },
        { keys: ["E"], label: "Eraser" },
      ],
    },
    {
      title: "Edit",
      shortcuts: [
        { keys: [mod, "Z"], label: "Undo" },
        { keys: [mod, "Shift", "Z"], label: "Redo" },
        { keys: [mod, "C"], label: "Copy (annotation or page)" },
        { keys: [mod, "V"], label: "Paste" },
        { keys: [mod, "D"], label: "Duplicate" },
        { keys: ["Backspace"], label: "Delete (annotation or page)" },
        { keys: ["Escape"], label: "Deselect / Cancel" },
      ],
    },
    {
      title: "Navigation",
      shortcuts: [
        { keys: ["\u2190"], label: "Previous page" },
        { keys: ["\u2192"], label: "Next page" },
      ],
    },
    {
      title: "View",
      shortcuts: [
        { keys: [mod, "+"], label: "Zoom in" },
        { keys: [mod, "-"], label: "Zoom out" },
        { keys: [mod, "0"], label: "Reset zoom" },
        { keys: [mod, "Scroll"], label: "Native zoom" },
        { keys: ["?"], label: "Show shortcuts" },
      ],
    },
    {
      title: "File",
      shortcuts: [{ keys: [mod, "S"], label: "Export PDF" }],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto">
          {sections.map((section, i) => (
            <div key={section.title}>
              {i > 0 && <Separator className="mb-4" />}
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <div className="space-y-1.5">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between py-0.5"
                  >
                    <span className="text-sm">{shortcut.label}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <Kbd key={j} className="min-w-[1.5rem] text-center">
                          {key}
                        </Kbd>
                      ))}
                    </div>
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
