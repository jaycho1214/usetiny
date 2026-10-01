import type { Weekday, WeekStartsOn } from "../types.ts";

/** Drag, resize and arrow keys step by one slot; typed times can be any minute. */
export const SLOT_MINUTES = 15;
/** The shortest block a typed time can make. */
export const MIN_BLOCK_MINUTES = 5;
export const DAY_MINUTES = 24 * 60;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Round to the nearest 15-minute slot. */
export function snap(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 170 → "02:50", the value format of `<input type="time">`. 1440 wraps to "00:00". */
export function toTimeValue(minutes: number): string {
  const m = minutes % DAY_MINUTES;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/** "02:50" → 170. Seconds are ignored; anything else (including "") is null. */
export function parseTimeValue(value: string): number | null {
  const match = /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

/** Local calendar date as "YYYY-MM-DD". */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Calendar-day arithmetic through the Date constructor — never adds 24h of
 * milliseconds, so a DST change can't skip or repeat a day.
 */
export function addDays(key: string, days: number): string {
  const d = fromDateKey(key);
  return toDateKey(
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + days),
  );
}

/** 0 = Monday … 6 = Sunday. */
export function isoWeekday(key: string): Weekday {
  return ((fromDateKey(key).getDay() + 6) % 7) as Weekday;
}

export function startOfWeek(key: string, weekStartsOn: WeekStartsOn): string {
  return addDays(key, -((fromDateKey(key).getDay() - weekStartsOn + 7) % 7));
}

export function weekDates(startKey: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startKey, i));
}

/** ISO weekdays in display order. */
export function weekdayOrder(weekStartsOn: WeekStartsOn): Weekday[] {
  return weekStartsOn === 1 ? [0, 1, 2, 3, 4, 5, 6] : [6, 0, 1, 2, 3, 4, 5];
}

// Intl.DateTimeFormat construction is comparatively slow; the grid formats
// hundreds of labels per render, so reuse one formatter per locale+options.
const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(
  locale: string | undefined,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, f);
  }
  return f;
}

/** 570 → "9:30 AM" (locale-aware). 1440 formats as midnight. */
export function formatMinutes(minutes: number, locale?: string): string {
  return formatter(locale, { hour: "numeric", minute: "2-digit" }).format(
    new Date(2000, 0, 1, 0, minutes),
  );
}

export function formatTimeRange(
  start: number,
  end: number,
  locale?: string,
): string {
  return `${formatMinutes(start, locale)} – ${formatMinutes(end, locale)}`;
}

/** 7 → "7 AM" */
export function formatHour(hour: number, locale?: string): string {
  return formatter(locale, { hour: "numeric" }).format(
    new Date(2000, 0, 1, hour),
  );
}

/** "2026-09-28" → "Mon" */
export function formatWeekday(key: string, locale?: string): string {
  return formatter(locale, { weekday: "short" }).format(fromDateKey(key));
}

/** 0 (Monday) → "Mon" */
export function weekdayLabel(weekday: Weekday, locale?: string): string {
  return formatWeekday(addDays("2024-01-01", weekday), locale); // 2024-01-01 was a Monday
}

/** "2026-09-28" → "Sep 28" */
export function formatMonthDay(key: string, locale?: string): string {
  return formatter(locale, { month: "short", day: "numeric" }).format(
    fromDateKey(key),
  );
}

/** A week's dates → "Sep 28 – Oct 4, 2026" */
export function formatWeekRange(
  dates: readonly string[],
  locale?: string,
): string {
  return formatter(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).formatRange(fromDateKey(dates[0]), fromDateKey(dates[dates.length - 1]));
}

/** 0 → "0h", 45 → "45m", 130 → "2h 10m", 600 → "10h". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}
