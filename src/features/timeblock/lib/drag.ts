import { resizeFloor, slotStart, type Range } from "./range.ts";
import { DAY_MINUTES, SLOT_MINUTES, clamp, snap } from "./time.ts";

export type Gesture =
  | { kind: "create"; col: number; anchor: number }
  | {
      kind: "move";
      col: number;
      start: number;
      end: number;
      /** Pointer minute minus block start at press time. */
      grabOffset: number;
    }
  | { kind: "resize-start" | "resize-end"; col: number; start: number; end: number };

/** A pointer position in grid terms: visible-column index and unsnapped minute of day. */
export interface Cell {
  col: number;
  minute: number;
}

export interface Placement extends Range {
  col: number;
}

export function pointToCell(
  x: number,
  y: number,
  rect: { left: number; top: number; width: number },
  columns: number,
  hourHeight: number,
): Cell {
  return {
    col: clamp(
      Math.floor(((x - rect.left) / rect.width) * columns),
      0,
      columns - 1,
    ),
    minute: ((y - rect.top) / hourHeight) * 60,
  };
}

/**
 * Where the block lands for the current pointer position. Every result stays
 * inside one day. Moves step in whole slots from where the block sits, so a
 * typed 2:50 start stays on :50; resizing snaps the dragged edge to the grid.
 */
export function resolveGesture(
  gesture: Gesture,
  cell: Cell,
  columns: number,
): Placement {
  switch (gesture.kind) {
    case "create": {
      const a = slotStart(gesture.anchor);
      const b = slotStart(cell.minute);
      return {
        col: gesture.col,
        start: Math.min(a, b),
        end: Math.max(a, b) + SLOT_MINUTES,
      };
    }
    case "move": {
      const duration = gesture.end - gesture.start;
      const start = clamp(
        gesture.start + snap(cell.minute - gesture.grabOffset - gesture.start),
        0,
        DAY_MINUTES - duration,
      );
      return {
        col: clamp(cell.col, 0, columns - 1),
        start,
        end: start + duration,
      };
    }
    case "resize-start":
      return {
        col: gesture.col,
        start: clamp(snap(cell.minute), 0, gesture.end - resizeFloor(gesture)),
        end: gesture.end,
      };
    case "resize-end":
      return {
        col: gesture.col,
        start: gesture.start,
        end: clamp(snap(cell.minute), gesture.start + resizeFloor(gesture), DAY_MINUTES),
      };
  }
}
