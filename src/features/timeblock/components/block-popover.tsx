"use client";

import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { withStart } from "../lib/range";
import { DAY_MINUTES, SLOT_MINUTES, formatMinutes } from "../lib/time";
import { PALETTE } from "../palette";
import type { BlockStatus, Category } from "../types";
import type { GridBlock, GridPatch } from "./grid-types";

/** 0, 15, … 1440 */
const SLOTS = Array.from({ length: DAY_MINUTES / SLOT_MINUTES + 1 }, (_, i) => i * SLOT_MINUTES);
const START_OPTIONS = SLOTS.slice(0, -1);

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
  return (
    <PopoverContent
      side={side}
      align="start"
      collisionPadding={12}
      className="w-72 space-y-4"
      onCloseAutoFocus={onCloseAutoFocus}
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
          <TimeSelect
            label="Start time"
            value={block.start}
            options={START_OPTIONS}
            onChange={(start) => onChange(withStart(block, start), "Change time")}
          />
          <span className="text-muted-foreground">–</span>
          <TimeSelect
            label="End time"
            value={block.end}
            options={SLOTS.filter((m) => m > block.start)}
            onChange={(end) => onChange({ end }, "Change time")}
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

interface TimeSelectProps {
  label: string;
  value: number;
  options: number[];
  onChange: (minutes: number) => void;
}

function TimeSelect({ label, value, options, onChange }: TimeSelectProps) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger size="sm" className="flex-1" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {options.map((m) => (
          <SelectItem key={m} value={String(m)}>
            {m === DAY_MINUTES ? "Midnight" : formatMinutes(m)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
