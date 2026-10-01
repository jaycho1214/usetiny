"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { Check } from "lucide-react";
import { Popover, PopoverAnchor } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { LayoutSlot } from "../lib/layout";
import { formatMinutes, formatTimeRange } from "../lib/time";
import type { CategoryLook } from "../palette";
import type { GridBlock } from "./grid-types";
import { HOUR_HEIGHT } from "./use-grid-drag";

interface BlockItemProps {
  block: GridBlock;
  look: CategoryLook;
  slot: LayoutSlot;
  showStatus: boolean;
  dragging: boolean;
  /** Popover content while this block's editor is open, else null. */
  editor: ReactNode;
  onEditorClose: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
  onToggleDone: () => void;
}

export function BlockItem({
  block,
  look,
  slot,
  showStatus,
  dragging,
  editor,
  onEditorClose,
  onKeyDown,
  onToggleDone,
}: BlockItemProps) {
  const minutes = block.end - block.start;
  const compact = minutes < 45;
  /**
   * A 15-minute block is 11px tall: two handles would cover it all. Keep a
   * body to grab (move), resize from a thinner bottom edge only, and leave
   * out the ✓ button, which would overflow — the solid fill shows done.
   */
  const short = minutes < 30;
  const width = 100 / slot.columns;
  const done = showStatus && block.status === "done";
  const skipped = showStatus && block.status === "skipped";
  const title = block.title || "Untitled";

  return (
    <Popover open={editor !== null} onOpenChange={(open) => !open && onEditorClose()}>
      <PopoverAnchor asChild>
        <div
          data-block-id={block.id}
          className={cn("group absolute", dragging && "z-20")}
          style={
            {
              "--c": look.hex,
              top: (block.start / 60) * HOUR_HEIGHT,
              height: (minutes / 60) * HOUR_HEIGHT - 1,
              left: `calc(${slot.column * width}% + 2px)`,
              width: `calc(${width}% - 4px)`,
            } as CSSProperties
          }
        >
          <div
            data-block-focus
            role="button"
            tabIndex={0}
            onKeyDown={onKeyDown}
            aria-label={`${title}, ${look.name}, ${formatTimeRange(block.start, block.end)}${showStatus ? `, ${block.status}` : ""}`}
            className={cn(
              "h-full cursor-grab select-none overflow-hidden rounded-md border-l-[3px] border-[var(--c)] px-1.5 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring",
              done
                ? "bg-[color-mix(in_oklab,var(--c)_42%,var(--background))]"
                : "bg-[color-mix(in_oklab,var(--c)_16%,var(--background))]",
              skipped && "border-dashed opacity-55",
              dragging && "cursor-grabbing shadow-lg ring-1 ring-foreground/10",
            )}
          >
            {!short && (
              <div data-resize="start" className="absolute inset-x-0 top-0 h-1.5 cursor-ns-resize" />
            )}
            <div
              className={cn(
                "pr-4",
                compact ? "flex items-baseline gap-1.5 text-[10px] leading-none" : "pt-1 text-xs",
              )}
            >
              <span
                className={cn(
                  "min-w-0 truncate font-medium",
                  !compact && "block",
                  !block.title && "text-muted-foreground",
                  skipped && "line-through",
                )}
              >
                {title}
              </span>
              <span
                className={cn(
                  "shrink-0 truncate tabular-nums text-muted-foreground",
                  !compact && "block text-[10px]",
                )}
              >
                {compact ? formatMinutes(block.start) : formatTimeRange(block.start, block.end)}
              </span>
            </div>
            <div
              data-resize="end"
              className={cn("absolute inset-x-0 bottom-0 cursor-ns-resize", short ? "h-1" : "h-1.5")}
            />
          </div>
          {showStatus && !short && (
            <button
              type="button"
              data-block-action
              aria-label={done ? "Mark as planned" : "Mark as done"}
              onClick={onToggleDone}
              className={cn(
                "absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full border border-[var(--c)] transition-opacity focus-visible:opacity-100",
                done ? "bg-[var(--c)] text-white" : "opacity-0 group-hover:opacity-100",
              )}
            >
              <Check className="size-2.5" strokeWidth={3} />
            </button>
          )}
        </div>
      </PopoverAnchor>
      {editor}
    </Popover>
  );
}
