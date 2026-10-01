import { DAY_MINUTES, MIN_BLOCK_MINUTES, SLOT_MINUTES, clamp } from "./time.ts";

export interface Range {
  start: number;
  end: number;
}

/** Start of the 15-minute slot containing `minute`, kept inside the day. */
export function slotStart(minute: number): number {
  return clamp(
    Math.floor(minute / SLOT_MINUTES) * SLOT_MINUTES,
    0,
    DAY_MINUTES - SLOT_MINUTES,
  );
}

/**
 * The shortest a drag or arrow-key resize may make this block: one slot, or
 * its current length if a typed time already made it shorter.
 */
export function resizeFloor(range: Range): number {
  return Math.min(SLOT_MINUTES, range.end - range.start);
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

/** Move the end by `delta` minutes, never below the resize floor. */
export function resizeEnd(range: Range, delta: number): Range {
  return {
    start: range.start,
    end: clamp(range.end + delta, range.start + resizeFloor(range), DAY_MINUTES),
  };
}

/** New start time: keep the duration, cut at midnight, at least the minimum length. */
export function withStart(range: Range, start: number): Range {
  const s = clamp(start, 0, DAY_MINUTES - MIN_BLOCK_MINUTES);
  return {
    start: s,
    end: clamp(s + (range.end - range.start), s + MIN_BLOCK_MINUTES, DAY_MINUTES),
  };
}

/** New end time, or null when it would leave less than the minimum length. */
export function withEnd(range: Range, end: number): Range | null {
  if (end - range.start < MIN_BLOCK_MINUTES || end > DAY_MINUTES) return null;
  return { start: range.start, end };
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
