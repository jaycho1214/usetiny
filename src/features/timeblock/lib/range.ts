import { DAY_MINUTES, SLOT_MINUTES, clamp } from "./time.ts";

export interface Range {
  start: number;
  end: number;
}

const LAST_START = DAY_MINUTES - SLOT_MINUTES;

/** Start of the 15-minute slot containing `minute`, kept inside the day. */
export function slotStart(minute: number): number {
  return clamp(
    Math.floor(minute / SLOT_MINUTES) * SLOT_MINUTES,
    0,
    LAST_START,
  );
}

/** A plain click on empty grid: one hour from the clicked slot, cut at midnight. */
export function clickRange(minute: number): Range {
  const start = slotStart(minute);
  return { start, end: Math.min(start + 60, DAY_MINUTES) };
}

/** Shift by `delta` minutes, keeping the duration and staying inside the day. */
export function nudge(range: Range, delta: number): Range {
  const duration = range.end - range.start;
  const start = clamp(range.start + delta, 0, DAY_MINUTES - duration);
  return { start, end: start + duration };
}

/** Move the end by `delta` minutes, keeping at least one slot. */
export function resizeEnd(range: Range, delta: number): Range {
  return {
    start: range.start,
    end: clamp(range.end + delta, range.start + SLOT_MINUTES, DAY_MINUTES),
  };
}

/** New start time: keep the duration, cut at midnight, at least one slot. */
export function withStart(range: Range, start: number): Range {
  const s = clamp(start, 0, LAST_START);
  return {
    start: s,
    end: clamp(s + (range.end - range.start), s + SLOT_MINUTES, DAY_MINUTES),
  };
}

/**
 * Where a duplicate goes: right after the original. If that would spill past
 * midnight it is shifted up to end at midnight (and may overlap).
 */
export function placeAfter(range: Range): Range {
  const duration = range.end - range.start;
  const start = Math.min(range.end, DAY_MINUTES - duration);
  return { start, end: start + duration };
}
