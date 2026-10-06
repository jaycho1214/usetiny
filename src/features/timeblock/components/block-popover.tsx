"use client";

import { useRef, useState } from "react";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { withEnd, withStart } from "../lib/range";
import { DAY_MINUTES, parseTimeValue, toTimeValue } from "../lib/time";
import { PALETTE } from "../palette";
import type { BlockStatus, Category } from "../types";
import type { GridBlock, GridPatch } from "./grid-types";

const STATUSES: { value: BlockStatus; label: string; historyLabel: string }[] = [
  { value: "planned", label: "Planned", historyLabel: "Mark planned" },
  { value: "done", label: "Done", historyLabel: "Mark done" },
  { value: "skipped", label: "Skipped", historyLabel: "Mark skipped" },
];

const SECTION_LABEL = "text-xs uppercase tracking-wider text-muted-foreground";

interface BlockPopoverProps {
  block: GridBlock;
  /** Draft title, owned by the grid and committed on blur or close. */
  title: string;
  categories: Category[];
  showStatus: boolean;
  /** "bottom" in the single-day view, where a block spans the screen width. */
  side?: "right" | "bottom";
  onTitleChange: (title: string) => void;
  /** Commit the title draft without closing. */
  onTitleBlur: () => void;
  onChange: (patch: GridPatch, label: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  /** Close (and commit the title) — Enter in the title field. */
  onClose: () => void;
  onCloseAutoFocus: (e: Event) => void;
}

export function BlockPopover({
  block,
  title,
  categories,
  showStatus,
  side = "right",
  onTitleChange,
  onTitleBlur,
  onChange,
  onDuplicate,
  onDelete,
  onClose,
  onCloseAutoFocus,
}: BlockPopoverProps) {
  // Set when the editor closes because the user clicked or tabbed elsewhere:
  // focus then stays where they put it instead of jumping back to the block.
  const leftOutside = useRef(false);
  return (
    <PopoverContent
      side={side}
      align="start"
      collisionPadding={12}
      className="w-72 space-y-4"
      onCloseAutoFocus={(e) => {
        if (leftOutside.current) e.preventDefault();
        else onCloseAutoFocus(e);
      }}
      onInteractOutside={(e) => {
        // A press on this block itself (a double-click on a new block, a grab,
        // its ✓) isn't leaving it: keep the editor open.
        const target = e.target instanceof Element ? e.target.closest("[data-block-id]") : null;
        if (target?.getAttribute("data-block-id") === block.id) {
          e.preventDefault();
          return;
        }
        leftOutside.current = true;
        saveFocusedField();
      }}
      onEscapeKeyDown={saveFocusedField}
    >
      <Input
        value={title}
        placeholder="Untitled"
        aria-label="Block title"
        maxLength={120}
        onChange={(e) => onTitleChange(e.target.value)}
        onBlur={onTitleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onClose();
          }
        }}
      />
      <section className="space-y-1.5">
        <h3 className={SECTION_LABEL}>Category</h3>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const active = c.id === block.categoryId;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ categoryId: c.id }, "Change category")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent",
                  active && "border-foreground/30 bg-accent font-medium",
                )}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: PALETTE[c.color] }} />
                {c.name}
              </button>
            );
          })}
        </div>
      </section>
      <section className="space-y-1.5">
        <h3 className={SECTION_LABEL}>Time</h3>
        <div className="flex items-center gap-2">
          <TimeField
            label="Start time"
            value={toTimeValue(block.start)}
            onCommit={(value) => {
              const start = parseTimeValue(value);
              if (start !== null) onChange(withStart(block, start), "Change time");
            }}
          />
          <span className="text-muted-foreground">–</span>
          <TimeField
            label="End time"
            value={toTimeValue(block.end)}
            onCommit={(value) => {
              const end = parseTimeValue(value);
              // An end is always after the start, so 12:00 AM can only mean midnight.
              const range = end === null ? null : withEnd(block, end === 0 ? DAY_MINUTES : end);
              if (range) onChange(range, "Change time");
            }}
          />
        </div>
      </section>
      {showStatus && (
        <section className="space-y-1.5">
          <h3 className={SECTION_LABEL}>Status</h3>
          <ButtonGroup className="w-full">
            {STATUSES.map((s) => (
              <Button
                key={s.value}
                size="sm"
                variant={block.status === s.value ? "default" : "outline"}
                className="h-7 flex-1 text-xs"
                aria-pressed={block.status === s.value}
                onClick={() => onChange({ status: s.value }, s.historyLabel)}
              >
                {s.label}
              </Button>
            ))}
          </ButtonGroup>
        </section>
      )}
      <div className="-mx-1 flex justify-between border-t pt-3">
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onDuplicate}>
          <Copy /> Duplicate
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 /> Delete
        </Button>
      </div>
    </PopoverContent>
  );
}

/**
 * Clicking the grid doesn't move focus (it prevents default to stop text
 * selection), so a field being edited would never blur and its typed value
 * would be lost when the editor closes. Blur it first so it saves itself.
 */
function saveFocusedField() {
  const field = document.activeElement;
  if (field instanceof HTMLInputElement && field.closest("[data-slot=popover-content]")) field.blur();
}

interface TimeFieldProps {
  label: string;
  /** "HH:MM" */
  value: string;
  /** The typed value, on Enter or blur. Invalid values are the caller's to ignore. */
  onCommit: (value: string) => void;
}

/**
 * A time input that commits on Enter or blur instead of on every segment the
 * browser fills in, so typing "2:50" is one undo step. Afterwards the field
 * shows the block's actual time, whether the edit was taken, adjusted or
 * ignored.
 */
function TimeField({ label, value, onCommit }: TimeFieldProps) {
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(value);
  if (value !== shown) {
    setShown(value);
    setDraft(value);
  }
  const commit = () => {
    if (draft !== value) onCommit(draft);
    setDraft(value);
  };
  return (
    <Input
      type="time"
      step={60}
      value={draft}
      aria-label={label}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
      }}
      className="h-8 min-w-0 flex-1 appearance-none tabular-nums [&::-webkit-calendar-picker-indicator]:hidden"
    />
  );
}
