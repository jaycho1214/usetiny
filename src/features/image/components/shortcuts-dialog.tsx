"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useIsMac } from "@/hooks/use-is-mac";

const SHORTCUT_GROUPS = [
  {
    title: "Files",
    items: [
      { label: "Open files", keys: ["mod", "O"] },
      { label: "Download", keys: ["mod", "S"] },
      { label: "Download all (ZIP)", keys: ["mod", "Shift", "S"] },
    ],
  },
  {
    title: "Navigation",
    items: [
      { label: "Previous file", keys: ["mod", "["] },
      { label: "Next file", keys: ["mod", "]"] },
    ],
  },
  {
    title: "View",
    items: [
      { label: "Move divider left", keys: ["←"] },
      { label: "Move divider right", keys: ["→"] },
    ],
  },
];

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMac = useIsMac();
  const mod = isMac ? "⌘" : "Ctrl";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{item.label}</span>
                    <KbdGroup>
                      {item.keys.map((k) => (
                        <Kbd key={k}>
                          {k === "mod"
                            ? mod
                            : k === "Shift"
                              ? "⇧"
                              : k}
                        </Kbd>
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
