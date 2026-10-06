"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  pointToCell,
  resolveGesture,
  type Cell,
  type Gesture,
  type Placement,
} from "../lib/drag";

export const HOUR_HEIGHT = 48;
const DRAG_THRESHOLD_PX = 4;

export interface DragPreview extends Placement {
  /** null while drawing a new block */
  blockId: string | null;
}

interface Pending {
  pointerId: number;
  x: number;
  y: number;
  moved: boolean;
  touch: boolean;
  gesture: Gesture;
  blockId: string | null;
}

interface GridDragOptions {
  bodyRef: RefObject<HTMLDivElement | null>;
  /** Rendered column count. Every column index in this hook is a visible-column index. */
  columns: number;
  /** Visible column and range of a rendered block. */
  locate: (blockId: string) => Placement | null;
  /** While true (an editor or a menu is open) a press only dismisses it. */
  isBusy: () => boolean;
  /**
   * True while the grid is still scrolling. A touch then stops a fling, and
   * Android still reports it as a tap (with no click), so it is ignored.
   */
  isScrolling: () => boolean;
  onDraw: (placement: Placement) => void;
  onDrop: (blockId: string, fromCol: number, placement: Placement, kind: Gesture["kind"]) => void;
  onTapEmpty: (cell: Cell) => void;
  onTapBlock: (blockId: string) => void;
}

/**
 * Pointer gestures on the grid body: draw a block, move one, or resize an
 * edge. The preview lives in local state; callers get one callback on
 * release. Touch never drags (a moving touch is a scroll) — taps only.
 */
export function useGridDrag(options: GridDragOptions) {
  const pending = useRef<Pending | null>(null);
  const [preview, setPreview] = useState<DragPreview | null>(null);

  const cellAt = (e: { clientX: number; clientY: number }): Cell | null => {
    const body = options.bodyRef.current;
    if (!body) return null;
    return pointToCell(e.clientX, e.clientY, body.getBoundingClientRect(), options.columns, HOUR_HEIGHT);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || options.isBusy()) return;
    if (e.pointerType === "touch" && options.isScrolling()) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-block-action]")) return;
    const cell = cellAt(e);
    if (!cell) return;
    const blockEl = target.closest<HTMLElement>("[data-block-id]");
    const blockId = blockEl?.dataset.blockId ?? null;
    let gesture: Gesture;
    if (blockId) {
      const at = options.locate(blockId);
      if (!at) return;
      const edge = target.closest<HTMLElement>("[data-resize]")?.dataset.resize;
      gesture =
        edge === "start"
          ? { kind: "resize-start", ...at }
          : edge === "end"
            ? { kind: "resize-end", ...at }
            : { kind: "move", ...at, grabOffset: cell.minute - at.start };
    } else {
      gesture = { kind: "create", col: cell.col, anchor: cell.minute };
    }
    const touch = e.pointerType === "touch";
    pending.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, moved: false, touch, gesture, blockId };
    // No text selection while dragging. For a tap this also cancels the
    // compatibility mousedown, which would focus the block under the finger
    // and dismiss the editor the tap just opened. Panning is unaffected
    // (touch-action governs it).
    e.preventDefault();
    if (!touch) {
      e.currentTarget.setPointerCapture(e.pointerId);
      blockEl?.querySelector<HTMLElement>("[data-block-focus]")?.focus({ preventScroll: true });
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = pending.current;
    if (!p || p.pointerId !== e.pointerId) return;
    if (!p.moved) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD_PX) return;
      if (p.touch) {
        pending.current = null; // a touch that moves is a scroll
        return;
      }
      p.moved = true;
    }
    const cell = cellAt(e);
    if (cell) setPreview({ ...resolveGesture(p.gesture, cell, options.columns), blockId: p.blockId });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = pending.current;
    if (!p || p.pointerId !== e.pointerId) return;
    pending.current = null;
    setPreview(null);
    if (!p.moved) {
      if (p.blockId) options.onTapBlock(p.blockId);
      else if (p.gesture.kind === "create") options.onTapEmpty({ col: p.gesture.col, minute: p.gesture.anchor });
      return;
    }
    const cell = cellAt(e);
    if (!cell) return;
    const placement = resolveGesture(p.gesture, cell, options.columns);
    if (p.gesture.kind === "create") options.onDraw(placement);
    else if (p.blockId) options.onDrop(p.blockId, p.gesture.col, placement, p.gesture.kind);
  };

  const onPointerCancel = () => {
    pending.current = null;
    setPreview(null);
  };

  // Escape abandons a drag in progress.
  const dragging = preview !== null;
  useEffect(() => {
    if (!dragging) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      pending.current = null;
      setPreview(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dragging]);

  return {
    preview,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  };
}
