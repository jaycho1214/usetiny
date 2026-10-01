"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { layoutDay, type LayoutSlot } from "../lib/layout";
import { clickRange, nudge, resizeEnd } from "../lib/range";
import { SLOT_MINUTES, formatHour, formatTimeRange } from "../lib/time";
import { categoryLook } from "../palette";
import type { Category } from "../types";
import { BlockItem } from "./block-item";
import { BlockPopover } from "./block-popover";
import type { GridBlock, GridColumn, GridOps } from "./grid-types";
import { HOUR_HEIGHT, useGridDrag, type DragPreview } from "./use-grid-drag";

/** Gutter labels 1 AM … 11 PM (midnight lines need no label). */
const HOURS = Array.from({ length: 23 }, (_, i) => i + 1);
const FULL_WIDTH: LayoutSlot = { column: 0, columns: 1 };

function focusBlock(id: string) {
  requestAnimationFrame(() =>
    document
      .querySelector<HTMLElement>(`[data-block-id="${id}"] [data-block-focus]`)
      ?.focus({ preventScroll: true }),
  );
}

interface WeekGridProps {
  columns: GridColumn[];
  /** Indexes into `columns` to render: all 7 on desktop, one on mobile. */
  visible: number[];
  ops: GridOps;
  categories: Category[];
  showStatus: boolean;
  now: number;
  /** Scroll back to 7 AM when this changes. */
  scrollKey: string;
  onPrevDay?: () => void;
  onNextDay?: () => void;
}

export function WeekGrid({
  columns,
  visible,
  ops,
  categories,
  showStatus,
  now,
  scrollKey,
  onPrevDay,
  onNextDay,
}: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 7 * HOUR_HEIGHT });
  }, [scrollKey]);

  const find = (id: string): { col: number; block: GridBlock } | null => {
    for (let col = 0; col < columns.length; col++) {
      const block = columns[col].blocks.find((b) => b.id === id);
      if (block) return { col, block };
    }
    return null;
  };

  const editorOpen =
    editing !== null && visible.some((i) => columns[i].blocks.some((b) => b.id === editing.id));

  const openEditor = (id: string) => {
    const found = find(id);
    if (found) setEditing({ id, title: found.block.title });
  };

  // The title draft commits on blur or close — one history entry per change.
  const commitTitle = () => {
    if (!editing) return;
    const found = find(editing.id);
    const title = editing.title.trim();
    if (found && title !== found.block.title) ops.update(found.col, editing.id, { title }, "Rename block");
  };

  const closeEditor = () => {
    if (!editing) return;
    commitTitle();
    setEditing(null);
  };

  const toggleDone = (col: number, block: GridBlock) => {
    const done = block.status === "done";
    ops.update(col, block.id, { status: done ? "planned" : "done" }, done ? "Mark planned" : "Mark done");
  };

  const createAt = (col: number, start: number, end: number) => {
    const id = ops.create(visible[col], start, end);
    if (id) setEditing({ id, title: "" });
  };

  const { preview, handlers } = useGridDrag({
    bodyRef,
    columns: visible.length,
    isBusy: () => editorOpen,
    locate: (id) => {
      const found = find(id);
      const col = found ? visible.indexOf(found.col) : -1;
      return found && col >= 0 ? { col, start: found.block.start, end: found.block.end } : null;
    },
    onDraw: ({ col, start, end }) => createAt(col, start, end),
    onTapEmpty: ({ col, minute }) => {
      const { start, end } = clickRange(minute);
      createAt(col, start, end);
    },
    onTapBlock: openEditor,
    onDrop: (id, fromCol, { col, start, end }, kind) => {
      const from = visible[fromCol];
      const to = visible[col];
      const found = find(id);
      if (!found) return;
      if (from !== to || found.block.start !== start || found.block.end !== end) {
        if (kind === "move") ops.move(from, id, to, start, end);
        else ops.update(from, id, { start, end }, "Resize block");
      }
      focusBlock(id); // the dragged copy replaced the original element
    },
  });

  const onBlockKeyDown = (e: KeyboardEvent<HTMLDivElement>, col: number, block: GridBlock) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    switch (e.key) {
      case "ArrowUp":
      case "ArrowDown": {
        const delta = e.key === "ArrowUp" ? -SLOT_MINUTES : SLOT_MINUTES;
        const next = e.shiftKey ? resizeEnd(block, delta) : nudge(block, delta);
        if (next.start !== block.start || next.end !== block.end) {
          ops.update(col, block.id, next, e.shiftKey ? "Resize block" : "Move block");
        }
        break;
      }
      case "ArrowLeft":
      case "ArrowRight": {
        const to = col + (e.key === "ArrowLeft" ? -1 : 1);
        if (to < 0 || to >= columns.length) break;
        ops.move(col, block.id, to, block.start, block.end);
        focusBlock(block.id);
        break;
      }
      case "Enter":
        openEditor(block.id);
        break;
      case " ":
        if (showStatus) toggleDone(col, block);
        break;
      case "Delete":
      case "Backspace":
        ops.remove(col, block.id);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const single = visible.length === 1;

  const renderEditor = (col: number, block: GridBlock) => (
    <BlockPopover
      block={block}
      title={editing?.title ?? block.title}
      categories={categories}
      showStatus={showStatus}
      side={single ? "bottom" : "right"}
      onTitleChange={(title) => setEditing({ id: block.id, title })}
      onTitleBlur={commitTitle}
      onChange={(patch, label) => ops.update(col, block.id, patch, label)}
      onDuplicate={() => {
        closeEditor();
        ops.duplicate(col, block.id);
      }}
      onDelete={() => {
        setEditing(null);
        ops.remove(col, block.id);
      }}
      onClose={closeEditor}
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        focusBlock(block.id);
      }}
    />
  );

  const dragged = preview?.blockId ? (find(preview.blockId)?.block ?? null) : null;

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="sticky top-0 z-30 flex border-b bg-background">
        <div className="w-14 shrink-0" />
        {visible.map((i) => {
          const column = columns[i];
          return (
            <div
              key={column.key}
              className={cn(
                "flex flex-1 items-center gap-1.5 border-l py-2",
                single ? "justify-between px-2" : "justify-center",
              )}
            >
              {single && (
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Previous day" onClick={onPrevDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-xs uppercase tracking-wider",
                    column.isToday ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {column.label}
                </span>
                {column.dayNumber !== undefined && (
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                      column.isToday && "bg-primary text-primary-foreground",
                    )}
                  >
                    {column.dayNumber}
                  </span>
                )}
              </div>
              {single && (
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Next day" onClick={onNextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      <div className="relative flex" style={{ height: 24 * HOUR_HEIGHT }}>
        <div className="relative w-14 shrink-0 select-none" aria-hidden>
          {HOURS.map((h) => (
            <span
              key={h}
              className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-muted-foreground"
              style={{ top: h * HOUR_HEIGHT }}
            >
              {formatHour(h)}
            </span>
          ))}
        </div>
        <div
          ref={bodyRef}
          className="relative flex flex-1 touch-pan-y"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${HOUR_HEIGHT}px)`,
          }}
          {...handlers}
        >
          {visible.map((col, visibleIndex) => (
            <DayColumn
              key={columns[col].key}
              column={columns[col]}
              col={col}
              visibleIndex={visibleIndex}
              preview={preview}
              dragged={dragged}
              categories={categories}
              showStatus={showStatus}
              now={now}
              editingId={editorOpen ? editing.id : null}
              renderEditor={renderEditor}
              onEditorClose={closeEditor}
              onBlockKeyDown={onBlockKeyDown}
              onToggleDone={toggleDone}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DayColumnProps {
  column: GridColumn;
  col: number;
  visibleIndex: number;
  preview: DragPreview | null;
  dragged: GridBlock | null;
  categories: Category[];
  showStatus: boolean;
  now: number;
  editingId: string | null;
  renderEditor: (col: number, block: GridBlock) => ReactNode;
  onEditorClose: () => void;
  onBlockKeyDown: (e: KeyboardEvent<HTMLDivElement>, col: number, block: GridBlock) => void;
  onToggleDone: (col: number, block: GridBlock) => void;
}

function DayColumn({
  column,
  col,
  visibleIndex,
  preview,
  dragged,
  categories,
  showStatus,
  now,
  editingId,
  renderEditor,
  onEditorClose,
  onBlockKeyDown,
  onToggleDone,
}: DayColumnProps) {
  const layout = useMemo(() => layoutDay(column.blocks), [column.blocks]);
  const previewHere = preview !== null && preview.col === visibleIndex;

  const item = (block: GridBlock, slot: LayoutSlot, isDragging: boolean) => (
    <BlockItem
      key={block.id}
      block={block}
      look={categoryLook(categories, block.categoryId)}
      slot={slot}
      showStatus={showStatus}
      dragging={isDragging}
      editor={!isDragging && editingId === block.id ? renderEditor(col, block) : null}
      onEditorClose={onEditorClose}
      onKeyDown={(e) => onBlockKeyDown(e, col, block)}
      onToggleDone={() => onToggleDone(col, block)}
    />
  );

  return (
    <div className={cn("relative flex-1 border-l", column.isToday && "bg-muted/30")}>
      {column.blocks.map((b) =>
        b.id === preview?.blockId ? null : item(b, layout.get(b.id) ?? FULL_WIDTH, false),
      )}
      {previewHere && dragged && item({ ...dragged, start: preview.start, end: preview.end }, FULL_WIDTH, true)}
      {previewHere && preview.blockId === null && <DraftBlock start={preview.start} end={preview.end} />}
      {column.isToday && <NowLine now={now} />}
    </div>
  );
}

function DraftBlock({ start, end }: { start: number; end: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0.5 z-20 rounded-md border border-dashed border-foreground/40 bg-foreground/5 px-1.5 pt-0.5 text-[10px] tabular-nums text-muted-foreground"
      style={{ top: (start / 60) * HOUR_HEIGHT, height: ((end - start) / 60) * HOUR_HEIGHT - 1 }}
    >
      {formatTimeRange(start, end)}
    </div>
  );
}

function NowLine({ now }: { now: number }) {
  const d = new Date(now);
  const top = ((d.getHours() * 60 + d.getMinutes()) / 60) * HOUR_HEIGHT;
  return (
    <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top }} aria-hidden>
      <span className="-ml-1 size-2 rounded-full bg-red-500" />
      <span className="h-px flex-1 bg-red-500" />
    </div>
  );
}
