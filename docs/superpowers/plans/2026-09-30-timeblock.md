# Timeblock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/timeblock` — a weekly time-blocking planner with drag-to-create blocks, dated weeks, named templates, category totals, plan-vs-actual status, and full undo/redo.

**Architecture:** All data logic is pure TypeScript in `src/features/timeblock/lib/` (time math, overlap layout, gesture math, stats, history reducer, data operations) and is unit-tested with Node's built-in test runner. A Zustand `persist` store wraps those operations behind one `commit(label, recipe)` that records undo history; `actions.ts` is the UI-facing layer (ids, toasts). The grid is a custom CSS layout driven by native Pointer Events, mode-agnostic via a `GridColumn[]` + `GridOps` adapter so Week mode and Templates mode share one component.

**Tech Stack:** Next.js 16 App Router, React 19, Zustand 5 (`persist`), shadcn/ui (Radix), Tailwind CSS 4, lucide-react, sonner, nanoid, `node:test` (Node 26 native TypeScript).

**Spec:** `docs/superpowers/specs/2026-09-30-timeblock-design.md`

## Global Constraints

- Package manager is `pnpm`. Never run `pnpm dev` — Jay keeps a dev server on `http://localhost:3000`; verify against it. If it is not running, ask Jay to start it.
- Work directly on `main`. Commit at the end of every task with explicit paths (never `git add -A`; `RESEARCH.md` and `.claude/` are Jay's untracked files). Every commit message ends with the trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Never hand-edit `src/components/ui/*`.
- Node-tested modules — `src/features/timeblock/types.ts`, `palette.ts`, `store.ts`, `lib/*.ts` — must: import siblings with an explicit `.ts` extension; use `import type` or inline `type` for type-only imports; use no `@/` aliases; use no enums, namespaces, or constructor parameter properties (Node strips types, it does not compile). UI files (`actions.ts`, `components/*`) use extensionless imports and `@/` aliases like the rest of the repo.
- React Compiler lint rules are errors (`react-hooks/refs`, `set-state-in-effect`, `purity`, `static-components`, `immutability`): never read or write `ref.current` during render; no synchronous `setState` in an effect body; no `Date.now()`/`new Date()` without arguments in render (use `useNow()`); define components at module level.
- No native `alert`/`confirm`/`prompt`; use shadcn `Dialog`/`AlertDialog`. Toggles use `ButtonGroup` with `variant="default"` for active and `variant="outline"` for inactive. Section labels are `text-xs uppercase tracking-wider text-muted-foreground`.
- Times are minutes from midnight on 15-minute slots, `0 ≤ start < end ≤ 1440`, `end - start ≥ 15`; no block crosses midnight. Dates are local `"YYYY-MM-DD"` strings. Template weekdays are ISO: `0 = Monday … 6 = Sunday`.
- Store: `name: "timeblock-storage"`, `version: 1`, `skipHydration: true`, hydrated with `useStoreHydration`, `FullscreenLoading` until hydrated. History (cap 100) is never persisted.
- Limits: 20 templates, 30 categories, 300 blocks per week and per template.
- Grid constant `HOUR_HEIGHT = 48` (px). Route `/timeblock`, tool `addedAt: "2026-09-30"`, accent `#84cc16`.

## Review Focus

1. **Toast "Undo" clicked after another edit** — must revert only its own change, never the newer one; if it isn't the latest change anymore, it does nothing and says so. Pinned by `store.test.ts` (`undoIfLatest`) in Task 7.
2. **Weeks that contain a DST change or cross a month/year boundary** — always exactly 7 consecutive, distinct dates; blocks stay on their date. Pinned by `time.test.ts` (run under `America/New_York`) in Task 1.
3. **Sunday week start** — template blocks land on the right weekday and save-as-template records the right weekday regardless of display order. Pinned by `ops.test.ts` in Task 6.
4. **Edges of the day** — dragging past the top or bottom, resizing below 15 minutes, keyboard-nudging at 0:00 or 24:00, and duplicating a block that ends at midnight all clamp inside 0:00–24:00 with at least 15 minutes. Pinned by `range.test.ts` / `drag.test.ts` (Task 3) and `ops.test.ts` (Task 6).
5. **Hitting a limit** (301st block in a week, 21st template, 31st category, deleting the last category, applying a template that overflows the week) — refused with a message, state untouched, no history entry. Pinned by `ops.test.ts` (Task 6) and `store.test.ts` (Task 7).

---

## File Structure

```
package.json                                   + "test" script
tsconfig.json                                  + allowImportingTsExtensions
CLAUDE.md                                      + Timeblock accent color
src/lib/tools.ts                               + Timeblock entry
src/hooks/use-now.ts                           moved from webhook-inspector (shared ticking clock)
src/hooks/use-media-query.ts                   new
src/features/webhook-inspector/components/request-list.tsx   import path update
src/app/timeblock/page.tsx                     metadata, JSON-LD, lazy content
src/app/timeblock/opengraph-image.tsx          OG image
src/features/timeblock/
  types.ts            domain types + UNCATEGORIZED_ID
  palette.ts          category colors, nextColor, categoryLook        (+ palette.test.ts)
  store.ts            Zustand persist store + history                  (+ store.test.ts)
  actions.ts          UI-facing commits: ids, labels, toasts
  lib/time.ts         slots, dates, formatting                         (+ time.test.ts)
  lib/layout.ts       side-by-side overlap layout                      (+ layout.test.ts)
  lib/range.ts        click/nudge/resize/duplicate range math          (+ range.test.ts)
  lib/drag.ts         pointer → cell, gesture → placement              (+ drag.test.ts)
  lib/stats.ts        per-category planned/done/skipped totals         (+ stats.test.ts)
  lib/history.ts      undo/redo reducer                                (+ history.test.ts)
  lib/ops.ts          pure data operations + limits + defaults         (+ ops.test.ts)
  components/
    timeblock-content.tsx    page shell: state, composition, status bar, dialogs
    timeblock-navbar.tsx     navbar layout, mode switch, undo/redo, WeekNav, NavIconButton
    use-timeblock-shortcuts.ts  global keyboard shortcuts
    shortcuts.ts             ShortcutSection[] for ShortcutsDialog
    grid-types.ts            GridBlock / GridColumn / GridPatch / GridOps
    grid-ops.ts              GridOps for Week mode and Templates mode
    use-grid-drag.ts         pointer gesture hook + HOUR_HEIGHT
    week-grid.tsx            header, gutter, day columns, now line, editor state, keyboard
    block-item.tsx           one block (visuals, resize handles, ✓ button, popover anchor)
    block-popover.tsx        block editor
    stats-panel.tsx          totals + per-category bars
    category-dialog.tsx      manage categories
    template-controls.tsx    TemplatePicker, ApplyTemplateMenu, MoreMenu, TemplatesEmpty
    template-dialogs.tsx     NameDialog, ApplyTemplateDialog, DeleteTemplateDialog
```

---

### Task 1: Test harness, domain types, time helpers

**Files:**
- Modify: `package.json` (scripts)
- Modify: `tsconfig.json` (compilerOptions)
- Create: `src/features/timeblock/types.ts`
- Create: `src/features/timeblock/lib/time.ts`
- Test: `src/features/timeblock/lib/time.test.ts`

**Interfaces:**
- Produces (types.ts): `BlockStatus`, `Block`, `Weekday`, `TemplateBlock`, `Template`, `PaletteKey`, `Category`, `TimeblockData`, `WeekStartsOn`, `UNCATEGORIZED_ID`.
- Produces (time.ts): `SLOT_MINUTES = 15`, `DAY_MINUTES = 1440`, `clamp(v, min, max)`, `snap(min)`, `toDateKey(date)`, `fromDateKey(key)`, `addDays(key, n)`, `isoWeekday(key): Weekday`, `startOfWeek(key, weekStartsOn)`, `weekDates(startKey): string[]`, `weekdayOrder(weekStartsOn): Weekday[]`, `formatMinutes(min, locale?)`, `formatTimeRange(start, end, locale?)`, `formatHour(hour, locale?)`, `formatWeekday(key, locale?)`, `weekdayLabel(weekday, locale?)`, `formatMonthDay(key, locale?)`, `formatWeekRange(dates, locale?)`, `formatDuration(minutes)`.

- [ ] **Step 1: Add the test script and TS option**

In `package.json`, add to `"scripts"` (after `"lint": "eslint"`):

```json
    "lint": "eslint",
    "test": "node --test \"src/**/*.test.ts\""
```

In `tsconfig.json`, add after `"noEmit": true,`:

```json
    "allowImportingTsExtensions": true,
```

- [ ] **Step 2: Create the domain types**

`src/features/timeblock/types.ts`:

```ts
export type BlockStatus = "planned" | "done" | "skipped";

/** A time block on a specific date. Times are minutes from midnight. */
export interface Block {
  id: string;
  title: string;
  categoryId: string;
  /** 0–1425, multiple of 15 */
  start: number;
  /** 15–1440, multiple of 15, greater than start */
  end: number;
  status: BlockStatus;
}

/** 0 = Monday … 6 = Sunday (ISO order, independent of the week-start setting). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TemplateBlock extends Omit<Block, "status"> {
  weekday: Weekday;
}

export interface Template {
  id: string;
  name: string;
  blocks: TemplateBlock[];
}

export type PaletteKey =
  | "blue"
  | "violet"
  | "slate"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "teal"
  | "lime"
  | "orange"
  | "pink";

export interface Category {
  id: string;
  name: string;
  color: PaletteKey;
}

export interface TimeblockData {
  categories: Category[];
  /** Keyed by local date "YYYY-MM-DD". Empty days are removed, never stored as []. */
  blocksByDate: Record<string, Block[]>;
  templates: Template[];
}

/** JS getDay() numbering: 0 = Sunday, 1 = Monday. */
export type WeekStartsOn = 0 | 1;

/** Stats/display key for blocks whose category was deleted. Never stored on a Category. */
export const UNCATEGORIZED_ID = "__uncategorized";
```

- [ ] **Step 3: Write the failing test**

`src/features/timeblock/lib/time.test.ts`:

```ts
// Pin a DST-observing zone so the DST cases below are meaningful on any machine.
process.env.TZ = "America/New_York";

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  formatDuration,
  formatHour,
  formatMinutes,
  formatMonthDay,
  formatTimeRange,
  formatWeekRange,
  formatWeekday,
  isoWeekday,
  snap,
  startOfWeek,
  toDateKey,
  weekDates,
  weekdayLabel,
  weekdayOrder,
} from "./time.ts";

// Intl output contains narrow/thin spaces (U+202F, U+2009); compare on plain spaces.
const plain = (s: string) => s.replace(/\s+/g, " ");

test("snap rounds to the nearest 15 minutes", () => {
  assert.equal(snap(7), 0);
  assert.equal(snap(8), 15);
  assert.equal(snap(22), 15);
  assert.equal(snap(23), 30);
  assert.equal(snap(-20), -15);
});

test("toDateKey pads month and day", () => {
  assert.equal(toDateKey(new Date(2026, 0, 5)), "2026-01-05");
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("weeks containing a DST change still have 7 consecutive dates", () => {
  // 2026-03-08: clocks spring forward in New York. 2026-11-01: they fall back.
  assert.deepEqual(weekDates("2026-03-02"), [
    "2026-03-02",
    "2026-03-03",
    "2026-03-04",
    "2026-03-05",
    "2026-03-06",
    "2026-03-07",
    "2026-03-08",
  ]);
  assert.deepEqual(weekDates("2026-11-01"), [
    "2026-11-01",
    "2026-11-02",
    "2026-11-03",
    "2026-11-04",
    "2026-11-05",
    "2026-11-06",
    "2026-11-07",
  ]);
  assert.equal(addDays("2026-03-08", 1), "2026-03-09");
  assert.equal(addDays("2026-11-02", -1), "2026-11-01");
});

test("isoWeekday is Monday-based", () => {
  assert.equal(isoWeekday("2026-09-28"), 0); // Monday
  assert.equal(isoWeekday("2026-10-04"), 6); // Sunday
});

test("startOfWeek honors the week-start setting", () => {
  assert.equal(startOfWeek("2026-09-30", 1), "2026-09-28");
  assert.equal(startOfWeek("2026-10-04", 1), "2026-09-28"); // Sunday ends a Monday-start week
  assert.equal(startOfWeek("2026-10-04", 0), "2026-10-04");
  assert.equal(startOfWeek("2026-09-30", 0), "2026-09-27");
  assert.equal(startOfWeek("2026-09-28", 1), "2026-09-28");
});

test("weekdayOrder starts on Monday or Sunday", () => {
  assert.deepEqual(weekdayOrder(1), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(weekdayOrder(0), [6, 0, 1, 2, 3, 4, 5]);
});

test("time formatters", () => {
  assert.equal(plain(formatMinutes(570, "en-US")), "9:30 AM");
  assert.equal(plain(formatMinutes(0, "en-US")), "12:00 AM");
  assert.equal(plain(formatMinutes(1440, "en-US")), "12:00 AM");
  assert.equal(plain(formatTimeRange(540, 600, "en-US")), "9:00 AM – 10:00 AM");
  assert.equal(plain(formatHour(7, "en-US")), "7 AM");
  assert.equal(plain(formatHour(0, "en-US")), "12 AM");
});

test("date formatters", () => {
  assert.equal(formatWeekday("2026-09-28", "en-US"), "Mon");
  assert.equal(weekdayLabel(0, "en-US"), "Mon");
  assert.equal(weekdayLabel(6, "en-US"), "Sun");
  assert.equal(formatMonthDay("2026-09-28", "en-US"), "Sep 28");
  assert.equal(
    plain(formatWeekRange(weekDates("2026-09-28"), "en-US")),
    "Sep 28 – Oct 4, 2026",
  );
  assert.equal(
    plain(formatWeekRange(weekDates("2026-12-28"), "en-US")),
    "Dec 28, 2026 – Jan 3, 2027",
  );
});

test("formatDuration shows hours", () => {
  assert.equal(formatDuration(0), "0h");
  assert.equal(formatDuration(90), "1.5h");
  assert.equal(formatDuration(75), "1.25h");
  assert.equal(formatDuration(600), "10h");
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '.../lib/time.ts'`.

- [ ] **Step 5: Implement time.ts**

`src/features/timeblock/lib/time.ts`:

```ts
import type { Weekday, WeekStartsOn } from "../types.ts";

export const SLOT_MINUTES = 15;
export const DAY_MINUTES = 24 * 60;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Round to the nearest 15-minute slot. */
export function snap(minutes: number): number {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

const pad = (n: number) => String(n).padStart(2, "0");

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

/** Minutes as hours: 0 → "0h", 90 → "1.5h", 75 → "1.25h". */
export function formatDuration(minutes: number): string {
  return `${Math.round((minutes / 60) * 100) / 100}h`;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all `time.test.ts` tests green.

- [ ] **Step 7: Type-check**

Run: `pnpm exec tsc --noEmit -p .`
Expected: no output (exit 0).

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json src/features/timeblock/types.ts src/features/timeblock/lib/time.ts src/features/timeblock/lib/time.test.ts
git commit -m "feat(timeblock): add domain types, time helpers, and node test runner" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Overlap layout

**Files:**
- Create: `src/features/timeblock/lib/layout.ts`
- Test: `src/features/timeblock/lib/layout.test.ts`

**Interfaces:**
- Produces: `interface LayoutSlot { column: number; columns: number }`, `layoutDay(blocks: readonly { id: string; start: number; end: number }[]): Map<string, LayoutSlot>`.

- [ ] **Step 1: Write the failing test**

`src/features/timeblock/lib/layout.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutDay } from "./layout.ts";

const span = (id: string, start: number, end: number) => ({ id, start, end });

test("no blocks, no slots", () => {
  assert.equal(layoutDay([]).size, 0);
});

test("touching blocks don't share columns", () => {
  const slots = layoutDay([span("a", 0, 60), span("b", 60, 120)]);
  assert.deepEqual(slots.get("a"), { column: 0, columns: 1 });
  assert.deepEqual(slots.get("b"), { column: 0, columns: 1 });
});

test("two overlapping blocks sit side by side", () => {
  const slots = layoutDay([span("a", 540, 600), span("b", 570, 630)]);
  assert.deepEqual(slots.get("a"), { column: 0, columns: 2 });
  assert.deepEqual(slots.get("b"), { column: 1, columns: 2 });
});

test("a chain reuses freed columns but shares the cluster width", () => {
  const slots = layoutDay([span("a", 0, 60), span("b", 30, 90), span("c", 60, 120)]);
  assert.deepEqual(slots.get("a"), { column: 0, columns: 2 });
  assert.deepEqual(slots.get("b"), { column: 1, columns: 2 });
  assert.deepEqual(slots.get("c"), { column: 0, columns: 2 });
});

test("three mutually overlapping blocks get three columns, longest first", () => {
  const slots = layoutDay([span("b", 0, 60), span("c", 30, 90), span("a", 0, 120)]);
  assert.deepEqual(slots.get("a"), { column: 0, columns: 3 });
  assert.deepEqual(slots.get("b"), { column: 1, columns: 3 });
  assert.deepEqual(slots.get("c"), { column: 2, columns: 3 });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '.../lib/layout.ts'`.

- [ ] **Step 3: Implement layout.ts**

`src/features/timeblock/lib/layout.ts`:

```ts
export interface LayoutSlot {
  column: number;
  columns: number;
}

interface Span {
  id: string;
  start: number;
  end: number;
}

/**
 * Side-by-side layout for overlapping blocks in one day (Google Calendar
 * style). Transitively overlapping blocks form a cluster; each block takes the
 * first column whose previous block has ended, and every block in a cluster
 * shares the cluster's column count.
 */
export function layoutDay(blocks: readonly Span[]): Map<string, LayoutSlot> {
  const result = new Map<string, LayoutSlot>();
  const sorted = [...blocks].sort(
    (a, b) => a.start - b.start || b.end - a.end,
  );
  let cluster: { id: string; column: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const { id, column } of cluster) {
      result.set(id, { column, columns: columnEnds.length });
    }
    cluster = [];
    columnEnds = [];
  };

  for (const block of sorted) {
    if (block.start >= clusterEnd) flush();
    let column = columnEnds.findIndex((end) => end <= block.start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(block.end);
    } else {
      columnEnds[column] = block.end;
    }
    cluster.push({ id: block.id, column });
    clusterEnd = Math.max(clusterEnd, block.end);
  }
  flush();
  return result;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/timeblock/lib/layout.ts src/features/timeblock/lib/layout.test.ts
git commit -m "feat(timeblock): add overlap layout for blocks in a day" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Range and gesture math

**Files:**
- Create: `src/features/timeblock/lib/range.ts`
- Create: `src/features/timeblock/lib/drag.ts`
- Test: `src/features/timeblock/lib/range.test.ts`
- Test: `src/features/timeblock/lib/drag.test.ts`

**Interfaces:**
- Consumes: `clamp`, `snap`, `SLOT_MINUTES`, `DAY_MINUTES` from `time.ts`.
- Produces (range.ts): `interface Range { start: number; end: number }`, `slotStart(minute)`, `clickRange(minute): Range`, `nudge(range, delta): Range`, `resizeEnd(range, delta): Range`, `withStart(range, start): Range`, `placeAfter(range): Range`.
- Produces (drag.ts): `type Gesture` (`create` | `move` | `resize-start` | `resize-end`), `interface Cell { col; minute }`, `interface Placement extends Range { col }`, `pointToCell(x, y, rect, columns, hourHeight): Cell`, `resolveGesture(gesture, cell, columns): Placement`.

- [ ] **Step 1: Write the failing tests**

`src/features/timeblock/lib/range.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { clickRange, nudge, placeAfter, resizeEnd, withStart } from "./range.ts";

test("clickRange makes a one-hour block from the clicked slot, cut at midnight", () => {
  assert.deepEqual(clickRange(545), { start: 540, end: 600 });
  assert.deepEqual(clickRange(1420), { start: 1410, end: 1440 });
  assert.deepEqual(clickRange(-5), { start: 0, end: 60 });
  assert.deepEqual(clickRange(1500), { start: 1425, end: 1440 });
});

test("nudge keeps the duration and stays inside the day", () => {
  assert.deepEqual(nudge({ start: 540, end: 600 }, 15), { start: 555, end: 615 });
  assert.deepEqual(nudge({ start: 0, end: 60 }, -15), { start: 0, end: 60 });
  assert.deepEqual(nudge({ start: 1380, end: 1440 }, 15), { start: 1380, end: 1440 });
});

test("resizeEnd keeps at least one slot and stops at midnight", () => {
  assert.deepEqual(resizeEnd({ start: 540, end: 600 }, -15), { start: 540, end: 585 });
  assert.deepEqual(resizeEnd({ start: 540, end: 555 }, -15), { start: 540, end: 555 });
  assert.deepEqual(resizeEnd({ start: 1380, end: 1440 }, 15), { start: 1380, end: 1440 });
});

test("withStart keeps the duration, cut at midnight", () => {
  assert.deepEqual(withStart({ start: 540, end: 600 }, 600), { start: 600, end: 660 });
  assert.deepEqual(withStart({ start: 540, end: 660 }, 1410), { start: 1410, end: 1440 });
  assert.deepEqual(withStart({ start: 540, end: 600 }, 1425), { start: 1425, end: 1440 });
});

test("placeAfter puts a duplicate right after, shifting up at midnight", () => {
  assert.deepEqual(placeAfter({ start: 540, end: 600 }), { start: 600, end: 660 });
  assert.deepEqual(placeAfter({ start: 1380, end: 1410 }), { start: 1410, end: 1440 });
  assert.deepEqual(placeAfter({ start: 1320, end: 1440 }), { start: 1320, end: 1440 });
});
```

`src/features/timeblock/lib/drag.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { pointToCell, resolveGesture } from "./drag.ts";

const RECT = { left: 50, top: 100, width: 700 };

test("pointToCell maps pixels to a column and minute", () => {
  assert.deepEqual(pointToCell(350, 148, RECT, 7, 48), { col: 3, minute: 60 });
  assert.equal(pointToCell(2000, 148, RECT, 7, 48).col, 6);
  assert.equal(pointToCell(0, 148, RECT, 7, 48).col, 0);
});

test("create covers both the anchor slot and the pointer slot", () => {
  const down = resolveGesture({ kind: "create", col: 2, anchor: 540 }, { col: 2, minute: 610 }, 7);
  assert.deepEqual(down, { col: 2, start: 540, end: 615 });
  const up = resolveGesture({ kind: "create", col: 2, anchor: 600 }, { col: 2, minute: 545 }, 7);
  assert.deepEqual(up, { col: 2, start: 540, end: 615 });
  const single = resolveGesture({ kind: "create", col: 2, anchor: 541 }, { col: 2, minute: 549 }, 7);
  assert.deepEqual(single, { col: 2, start: 540, end: 555 });
});

test("create stays in its column and inside the day", () => {
  const below = resolveGesture({ kind: "create", col: 1, anchor: 1400 }, { col: 5, minute: 2000 }, 7);
  assert.deepEqual(below, { col: 1, start: 1395, end: 1440 });
  const above = resolveGesture({ kind: "create", col: 1, anchor: 30 }, { col: 1, minute: -100 }, 7);
  assert.deepEqual(above, { col: 1, start: 0, end: 45 });
});

test("move keeps the duration, follows the column, and clamps to the day", () => {
  const g = { kind: "move" as const, col: 2, start: 540, end: 600, grabOffset: 20 };
  assert.deepEqual(resolveGesture(g, { col: 4, minute: 680 }, 7), { col: 4, start: 660, end: 720 });
  assert.deepEqual(resolveGesture(g, { col: 2, minute: 1500 }, 7), { col: 2, start: 1380, end: 1440 });
  assert.deepEqual(resolveGesture(g, { col: 2, minute: 0 }, 7), { col: 2, start: 0, end: 60 });
  assert.equal(resolveGesture(g, { col: 9, minute: 600 }, 7).col, 6);
});

test("resizing keeps at least one slot and stays inside the day", () => {
  const box = { col: 1, start: 540, end: 600 };
  assert.deepEqual(resolveGesture({ kind: "resize-end", ...box }, { col: 3, minute: 500 }, 7), { col: 1, start: 540, end: 555 });
  assert.deepEqual(resolveGesture({ kind: "resize-end", ...box }, { col: 1, minute: 2000 }, 7), { col: 1, start: 540, end: 1440 });
  assert.deepEqual(resolveGesture({ kind: "resize-start", ...box }, { col: 1, minute: 630 }, 7), { col: 1, start: 585, end: 600 });
  assert.deepEqual(resolveGesture({ kind: "resize-start", ...box }, { col: 1, minute: -50 }, 7), { col: 1, start: 0, end: 600 });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '.../lib/range.ts'` and `'.../lib/drag.ts'`.

- [ ] **Step 3: Implement range.ts**

`src/features/timeblock/lib/range.ts`:

```ts
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
```

- [ ] **Step 4: Implement drag.ts**

`src/features/timeblock/lib/drag.ts`:

```ts
import { slotStart, type Range } from "./range.ts";
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
 * inside one day and is at least one slot long.
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
        snap(cell.minute - gesture.grabOffset),
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
        start: clamp(snap(cell.minute), 0, gesture.end - SLOT_MINUTES),
        end: gesture.end,
      };
    case "resize-end":
      return {
        col: gesture.col,
        start: gesture.start,
        end: clamp(snap(cell.minute), gesture.start + SLOT_MINUTES, DAY_MINUTES),
      };
  }
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/timeblock/lib/range.ts src/features/timeblock/lib/drag.ts src/features/timeblock/lib/range.test.ts src/features/timeblock/lib/drag.test.ts
git commit -m "feat(timeblock): add range and drag gesture math" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Palette and stats

**Files:**
- Create: `src/features/timeblock/palette.ts`
- Create: `src/features/timeblock/lib/stats.ts`
- Test: `src/features/timeblock/palette.test.ts`
- Test: `src/features/timeblock/lib/stats.test.ts`

**Interfaces:**
- Consumes: `Category`, `PaletteKey`, `BlockStatus`, `UNCATEGORIZED_ID` from `types.ts`.
- Produces (palette.ts): `PALETTE: Record<PaletteKey, string>` (hex), `PALETTE_KEYS: PaletteKey[]`, `nextColor(categories): PaletteKey`, `interface CategoryLook { id; name; hex }`, `categoryLook(categories, id): CategoryLook`.
- Produces (stats.ts): `interface Totals { planned; done; skipped }` (minutes), `interface Stats extends Totals { count; byCategory: Record<string, Totals> }`, `computeStats(blocks, categoryIds: ReadonlySet<string>): Stats`.

- [ ] **Step 1: Write the failing tests**

`src/features/timeblock/palette.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { PALETTE, PALETTE_KEYS, categoryLook, nextColor } from "./palette.ts";
import { UNCATEGORIZED_ID, type Category } from "./types.ts";

const cat = (id: string, color: Category["color"]): Category => ({ id, name: id, color });

test("nextColor picks the first unused palette color", () => {
  const used = [cat("a", "blue"), cat("b", "violet"), cat("c", "slate"), cat("d", "emerald"), cat("e", "amber")];
  assert.equal(nextColor(used), "rose");
});

test("nextColor cycles once every color is taken", () => {
  const all = PALETTE_KEYS.map((key) => cat(key, key));
  assert.equal(nextColor(all), PALETTE_KEYS[all.length % PALETTE_KEYS.length]);
});

test("categoryLook resolves known and deleted categories", () => {
  const categories = [cat("deep", "blue")];
  assert.deepEqual(categoryLook(categories, "deep"), { id: "deep", name: "deep", hex: PALETTE.blue });
  assert.deepEqual(categoryLook(categories, "gone"), { id: UNCATEGORIZED_ID, name: "Uncategorized", hex: "#a1a1aa" });
});
```

`src/features/timeblock/lib/stats.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { UNCATEGORIZED_ID } from "../types.ts";
import { computeStats } from "./stats.ts";

const KNOWN = new Set(["deep", "meet"]);

test("no blocks, zero totals", () => {
  assert.deepEqual(computeStats([], KNOWN), { count: 0, planned: 0, done: 0, skipped: 0, byCategory: {} });
});

test("planned counts every block; done and skipped split out", () => {
  const stats = computeStats(
    [
      { categoryId: "deep", start: 540, end: 660, status: "done" },
      { categoryId: "deep", start: 660, end: 690, status: "planned" },
      { categoryId: "meet", start: 600, end: 660, status: "skipped" },
    ],
    KNOWN,
  );
  assert.equal(stats.count, 3);
  assert.equal(stats.planned, 210);
  assert.equal(stats.done, 120);
  assert.equal(stats.skipped, 60);
  assert.deepEqual(stats.byCategory.deep, { planned: 150, done: 120, skipped: 0 });
  assert.deepEqual(stats.byCategory.meet, { planned: 60, done: 0, skipped: 60 });
});

test("blocks in a deleted category count as Uncategorized", () => {
  const stats = computeStats([{ categoryId: "gone", start: 0, end: 30, status: "planned" }], KNOWN);
  assert.deepEqual(stats.byCategory[UNCATEGORIZED_ID], { planned: 30, done: 0, skipped: 0 });
});

test("template blocks without status count as planned", () => {
  const stats = computeStats([{ categoryId: "deep", start: 0, end: 60 }], KNOWN);
  assert.deepEqual(stats.byCategory.deep, { planned: 60, done: 0, skipped: 0 });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '.../palette.ts'` and `'.../lib/stats.ts'`.

- [ ] **Step 3: Implement palette.ts**

`src/features/timeblock/palette.ts`:

```ts
import { UNCATEGORIZED_ID, type Category, type PaletteKey } from "./types.ts";

/** Mid-tone hues that read on both light and dark backgrounds. Order drives nextColor(). */
export const PALETTE: Record<PaletteKey, string> = {
  blue: "#3b82f6",
  violet: "#8b5cf6",
  slate: "#64748b",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
  teal: "#14b8a6",
  lime: "#84cc16",
  orange: "#f97316",
  pink: "#ec4899",
};

export const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[];

const UNCATEGORIZED_HEX = "#a1a1aa";

/** First palette color no category uses yet; cycles when all are taken. */
export function nextColor(categories: readonly Category[]): PaletteKey {
  const used = new Set(categories.map((c) => c.color));
  return (
    PALETTE_KEYS.find((key) => !used.has(key)) ??
    PALETTE_KEYS[categories.length % PALETTE_KEYS.length]
  );
}

export interface CategoryLook {
  id: string;
  name: string;
  hex: string;
}

/** Display name and color for a block's category; deleted ones render gray. */
export function categoryLook(
  categories: readonly Category[],
  id: string,
): CategoryLook {
  const category = categories.find((c) => c.id === id);
  return category
    ? { id: category.id, name: category.name, hex: PALETTE[category.color] }
    : { id: UNCATEGORIZED_ID, name: "Uncategorized", hex: UNCATEGORIZED_HEX };
}
```

- [ ] **Step 4: Implement stats.ts**

`src/features/timeblock/lib/stats.ts`:

```ts
import { UNCATEGORIZED_ID, type BlockStatus } from "../types.ts";

/** Minutes. `planned` counts every block, done and skipped included. */
export interface Totals {
  planned: number;
  done: number;
  skipped: number;
}

export interface Stats extends Totals {
  count: number;
  byCategory: Record<string, Totals>;
}

interface StatBlock {
  categoryId: string;
  start: number;
  end: number;
  /** Absent for template blocks (always planned). */
  status?: BlockStatus;
}

export function computeStats(
  blocks: readonly StatBlock[],
  categoryIds: ReadonlySet<string>,
): Stats {
  const stats: Stats = { count: 0, planned: 0, done: 0, skipped: 0, byCategory: {} };
  for (const block of blocks) {
    const minutes = block.end - block.start;
    const key = categoryIds.has(block.categoryId)
      ? block.categoryId
      : UNCATEGORIZED_ID;
    const totals = (stats.byCategory[key] ??= { planned: 0, done: 0, skipped: 0 });
    stats.count += 1;
    stats.planned += minutes;
    totals.planned += minutes;
    if (block.status === "done") {
      stats.done += minutes;
      totals.done += minutes;
    } else if (block.status === "skipped") {
      stats.skipped += minutes;
      totals.skipped += minutes;
    }
  }
  return stats;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/timeblock/palette.ts src/features/timeblock/palette.test.ts src/features/timeblock/lib/stats.ts src/features/timeblock/lib/stats.test.ts
git commit -m "feat(timeblock): add category palette and per-category stats" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Undo/redo history reducer

**Files:**
- Create: `src/features/timeblock/lib/history.ts`
- Test: `src/features/timeblock/lib/history.test.ts`

**Interfaces:**
- Produces: `HISTORY_LIMIT = 100`, `interface HistoryEntry<T> { id: number; label: string; data: T }`, `interface History<T> { past; future; nextId }`, `emptyHistory<T>()`, `record(history, label, previous) → { history, id }`, `undo(history, current) → { history, data } | null`, `redo(history, current) → { history, data } | null`, `latestId(history): number | null`.

- [ ] **Step 1: Write the failing test**

`src/features/timeblock/lib/history.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { HISTORY_LIMIT, emptyHistory, latestId, record, redo, undo } from "./history.ts";

test("record pushes an undo point with increasing ids", () => {
  const a = record(emptyHistory<string>(), "First", "v0");
  const b = record(a.history, "Second", "v1");
  assert.equal(a.id, 1);
  assert.equal(b.id, 2);
  assert.deepEqual(b.history.past.map((e) => e.data), ["v0", "v1"]);
  assert.equal(latestId(b.history), 2);
});

test("undo restores the previous data and moves the entry to redo", () => {
  const { history } = record(emptyHistory<string>(), "Edit", "v0");
  const undone = undo(history, "v1");
  assert.ok(undone);
  assert.equal(undone.data, "v0");
  assert.deepEqual(undone.history.past, []);
  assert.deepEqual(undone.history.future, [{ id: 1, label: "Edit", data: "v1" }]);
});

test("redo reapplies and keeps the label", () => {
  const { history } = record(emptyHistory<string>(), "Edit", "v0");
  const undone = undo(history, "v1");
  assert.ok(undone);
  const redone = redo(undone.history, undone.data);
  assert.ok(redone);
  assert.equal(redone.data, "v1");
  assert.deepEqual(redone.history.past, [{ id: 1, label: "Edit", data: "v0" }]);
  assert.deepEqual(redone.history.future, []);
});

test("undo and redo on empty stacks do nothing", () => {
  assert.equal(undo(emptyHistory<string>(), "v"), null);
  assert.equal(redo(emptyHistory<string>(), "v"), null);
  assert.equal(latestId(emptyHistory<string>()), null);
});

test("a new change clears redo", () => {
  const { history } = record(emptyHistory<string>(), "Edit", "v0");
  const undone = undo(history, "v1");
  assert.ok(undone);
  const next = record(undone.history, "Other", "v0");
  assert.deepEqual(next.history.future, []);
});

test("history keeps only the newest entries", () => {
  let history = emptyHistory<number>();
  for (let i = 0; i < HISTORY_LIMIT + 5; i++) history = record(history, "Edit", i).history;
  assert.equal(history.past.length, HISTORY_LIMIT);
  assert.equal(history.past[0].id, 6);
  assert.equal(history.past[0].data, 5);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '.../lib/history.ts'`.

- [ ] **Step 3: Implement history.ts**

`src/features/timeblock/lib/history.ts`:

```ts
export const HISTORY_LIMIT = 100;

export interface HistoryEntry<T> {
  id: number;
  label: string;
  /** The state to restore when this entry is undone (or redone). */
  data: T;
}

export interface History<T> {
  past: HistoryEntry<T>[];
  future: HistoryEntry<T>[];
  nextId: number;
}

export function emptyHistory<T>(): History<T> {
  return { past: [], future: [], nextId: 1 };
}

/** Record `previous` as an undo point and clear redo. Returns the entry id. */
export function record<T>(
  history: History<T>,
  label: string,
  previous: T,
): { history: History<T>; id: number } {
  const id = history.nextId;
  return {
    id,
    history: {
      past: [...history.past, { id, label, data: previous }].slice(-HISTORY_LIMIT),
      future: [],
      nextId: id + 1,
    },
  };
}

export function undo<T>(
  history: History<T>,
  current: T,
): { history: History<T>; data: T } | null {
  const entry = history.past.at(-1);
  if (!entry) return null;
  return {
    data: entry.data,
    history: {
      ...history,
      past: history.past.slice(0, -1),
      future: [...history.future, { ...entry, data: current }],
    },
  };
}

export function redo<T>(
  history: History<T>,
  current: T,
): { history: History<T>; data: T } | null {
  const entry = history.future.at(-1);
  if (!entry) return null;
  return {
    data: entry.data,
    history: {
      ...history,
      past: [...history.past, { ...entry, data: current }],
      future: history.future.slice(0, -1),
    },
  };
}

export function latestId<T>(history: History<T>): number | null {
  return history.past.at(-1)?.id ?? null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/timeblock/lib/history.ts src/features/timeblock/lib/history.test.ts
git commit -m "feat(timeblock): add undo/redo history reducer" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Pure data operations

**Files:**
- Create: `src/features/timeblock/lib/ops.ts`
- Test: `src/features/timeblock/lib/ops.test.ts`

**Interfaces:**
- Consumes: types; `placeAfter` (range.ts); `isoWeekday` (time.ts).
- Produces: `LIMITS`, `interface OpError { error: string }`, `type OpResult = TimeblockData | OpError`, `isOpError`, `BlockPatch`, `TemplateBlockPatch`, `CategoryPatch`, `DEFAULT_CATEGORIES`, `initialData()`, `countBlocks(data, dates)`, and operations:
  - `addBlock(data, week, date, block): OpResult`
  - `updateBlock(data, date, id, patch): TimeblockData`
  - `moveBlock(data, fromDate, id, toDate, start, end): TimeblockData`
  - `deleteBlock(data, date, id): TimeblockData`
  - `duplicateBlock(data, week, date, id, newId): OpResult`
  - `clearDates(data, dates): TimeblockData`
  - `addTemplateBlock(data, templateId, block): OpResult`
  - `updateTemplateBlock(data, templateId, id, patch): OpResult`
  - `deleteTemplateBlock(data, templateId, id): OpResult`
  - `duplicateTemplateBlock(data, templateId, id, newId): OpResult`
  - `createTemplate(data, template): OpResult`
  - `renameTemplate(data, id, name): OpResult`
  - `deleteTemplate(data, id): TimeblockData`
  - `saveWeekAsTemplate(data, week, templateId, name, makeId): OpResult`
  - `applyTemplate(data, templateId, week, mode: "replace" | "add", makeId): OpResult`
  - `addCategory(data, category): OpResult`, `updateCategory(data, id, patch): TimeblockData`, `deleteCategory(data, id): OpResult`
- Contract: an operation that changes nothing returns **the same `data` object** (the store uses identity to skip recording history).

- [ ] **Step 1: Write the failing test**

`src/features/timeblock/lib/ops.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Block, Template, TimeblockData } from "../types.ts";
import { nextColor } from "../palette.ts";
import {
  LIMITS,
  addBlock,
  addCategory,
  applyTemplate,
  clearDates,
  countBlocks,
  createTemplate,
  deleteBlock,
  deleteCategory,
  duplicateBlock,
  duplicateTemplateBlock,
  initialData,
  isOpError,
  moveBlock,
  renameTemplate,
  saveWeekAsTemplate,
  updateBlock,
  updateCategory,
  updateTemplateBlock,
  type OpResult,
} from "./ops.ts";
import { weekDates } from "./time.ts";

const WEEK = weekDates("2026-09-28"); // Mon Sep 28 … Sun Oct 4
const MON = WEEK[0];
const TUE = WEEK[1];
const SUN = WEEK[6];

const block = (id: string, start: number, end: number, extra: Partial<Block> = {}): Block => ({
  id,
  title: id,
  categoryId: "deep-work",
  start,
  end,
  status: "planned",
  ...extra,
});

const withBlocks = (blocksByDate: Record<string, Block[]>): TimeblockData => ({
  ...initialData(),
  blocksByDate,
});

function counter(prefix = "n") {
  let i = 0;
  return () => `${prefix}${++i}`;
}

function expectData(result: OpResult): TimeblockData {
  if (isOpError(result)) assert.fail(result.error);
  return result;
}

const WORK: Template = {
  id: "work",
  name: "Work",
  blocks: [
    { id: "w1", title: "Focus", categoryId: "deep-work", start: 540, end: 660, weekday: 0 },
    { id: "w2", title: "Long run", categoryId: "exercise", start: 420, end: 480, weekday: 6 },
  ],
};

test("addBlock appends to the date", () => {
  const data = expectData(addBlock(initialData(), WEEK, MON, block("a", 540, 600)));
  assert.deepEqual(data.blocksByDate[MON].map((b) => b.id), ["a"]);
});

test("addBlock refuses the 301st block of a week", () => {
  const full = withBlocks(
    Object.fromEntries(
      WEEK.map((date, d) => [
        date,
        Array.from({ length: d < 6 ? 43 : 42 }, (_, i) => block(`${d}-${i}`, 0, 15)),
      ]),
    ),
  );
  assert.equal(countBlocks(full, WEEK), LIMITS.blocksPerWeek);
  assert.ok(isOpError(addBlock(full, WEEK, MON, block("x", 540, 600))));
});

test("updateBlock returns the same object when nothing changes", () => {
  const data = withBlocks({ [MON]: [block("a", 540, 600)] });
  assert.equal(updateBlock(data, MON, "a", { title: "a", start: 540 }), data);
  assert.equal(updateBlock(data, MON, "missing", { title: "x" }), data);
  assert.equal(updateBlock(data, MON, "a", { title: "Focus" }).blocksByDate[MON][0].title, "Focus");
});

test("moveBlock to another day keeps the id and drops the emptied day", () => {
  const data = moveBlock(withBlocks({ [MON]: [block("a", 540, 600)] }), MON, "a", TUE, 600, 660);
  assert.equal(MON in data.blocksByDate, false);
  assert.deepEqual(data.blocksByDate[TUE], [block("a", 600, 660)]);
});

test("deleteBlock removes the block and the empty day", () => {
  assert.deepEqual(deleteBlock(withBlocks({ [MON]: [block("a", 540, 600)] }), MON, "a").blocksByDate, {});
});

test("duplicateBlock places a planned copy right after the original", () => {
  const data = expectData(
    duplicateBlock(withBlocks({ [MON]: [block("a", 540, 600, { status: "done" })] }), WEEK, MON, "a", "b"),
  );
  assert.deepEqual(data.blocksByDate[MON][1], block("b", 600, 660, { title: "a" }));
});

test("duplicating a block that ends at midnight overlaps instead of spilling", () => {
  const data = expectData(duplicateBlock(withBlocks({ [MON]: [block("a", 1320, 1440)] }), WEEK, MON, "a", "b"));
  assert.equal(data.blocksByDate[MON][1].start, 1320);
  assert.equal(data.blocksByDate[MON][1].end, 1440);
});

test("clearDates removes only the given dates", () => {
  const data = withBlocks({ [MON]: [block("a", 0, 15)], "2026-10-05": [block("b", 0, 15)] });
  assert.deepEqual(Object.keys(clearDates(data, WEEK).blocksByDate), ["2026-10-05"]);
  const empty = initialData();
  assert.equal(clearDates(empty, WEEK), empty);
});

test("saveWeekAsTemplate records ISO weekdays and drops status", () => {
  const data = withBlocks({
    [MON]: [block("a", 540, 600, { status: "done" })],
    [SUN]: [block("b", 600, 660)],
  });
  const result = expectData(saveWeekAsTemplate(data, WEEK, "t1", "  Work week ", counter()));
  assert.deepEqual(result.templates, [
    {
      id: "t1",
      name: "Work week",
      blocks: [
        { id: "n1", title: "a", categoryId: "deep-work", start: 540, end: 600, weekday: 0 },
        { id: "n2", title: "b", categoryId: "deep-work", start: 600, end: 660, weekday: 6 },
      ],
    },
  ]);
});

test("createTemplate refuses the 21st template", () => {
  const data: TimeblockData = {
    ...initialData(),
    templates: Array.from({ length: LIMITS.templates }, (_, i) => ({ id: `t${i}`, name: `T${i}`, blocks: [] })),
  };
  assert.ok(isOpError(createTemplate(data, { id: "x", name: "X", blocks: [] })));
});

test("applyTemplate replace clears the week and adds fresh planned blocks", () => {
  const data: TimeblockData = { ...withBlocks({ [TUE]: [block("old", 0, 15)] }), templates: [WORK] };
  const result = expectData(applyTemplate(data, "work", WEEK, "replace", counter()));
  assert.deepEqual(Object.keys(result.blocksByDate).sort(), [MON, SUN]);
  assert.deepEqual(result.blocksByDate[MON], [
    { id: "n1", title: "Focus", categoryId: "deep-work", start: 540, end: 660, status: "planned" },
  ]);
  assert.equal(result.blocksByDate[SUN][0].id, "n2");
});

test("applyTemplate add keeps existing blocks", () => {
  const data: TimeblockData = { ...withBlocks({ [MON]: [block("old", 0, 15)] }), templates: [WORK] };
  const result = expectData(applyTemplate(data, "work", WEEK, "add", counter()));
  assert.deepEqual(result.blocksByDate[MON].map((b) => b.id), ["old", "n1"]);
});

test("applyTemplate maps weekdays correctly for a Sunday-start week", () => {
  const sundayWeek = weekDates("2026-09-27"); // Sun Sep 27 … Sat Oct 3
  const result = expectData(applyTemplate({ ...initialData(), templates: [WORK] }, "work", sundayWeek, "add", counter()));
  assert.equal(result.blocksByDate["2026-09-28"][0].title, "Focus"); // Monday
  assert.equal(result.blocksByDate["2026-09-27"][0].title, "Long run"); // Sunday
});

test("applyTemplate refuses to overflow the week", () => {
  const big: Template = {
    id: "big",
    name: "Big",
    blocks: Array.from({ length: LIMITS.blocksPerWeek }, (_, i) => ({
      id: `b${i}`,
      title: "",
      categoryId: "admin",
      start: 0,
      end: 15,
      weekday: 0 as const,
    })),
  };
  const data: TimeblockData = { ...withBlocks({ [MON]: [block("old", 0, 15)] }), templates: [big] };
  assert.ok(isOpError(applyTemplate(data, "big", WEEK, "add", counter())));
  assert.ok(!isOpError(applyTemplate(data, "big", WEEK, "replace", counter())));
});

test("template block edits", () => {
  const data: TimeblockData = { ...initialData(), templates: [WORK] };
  const moved = expectData(updateTemplateBlock(data, "work", "w1", { weekday: 2, start: 600, end: 720 }));
  assert.deepEqual(moved.templates[0].blocks[0], { ...WORK.blocks[0], weekday: 2, start: 600, end: 720 });
  assert.equal(updateTemplateBlock(data, "work", "w1", { start: 540 }), data);
  const dup = expectData(duplicateTemplateBlock(data, "work", "w1", "w3"));
  assert.deepEqual(dup.templates[0].blocks[2], { ...WORK.blocks[0], id: "w3", start: 660, end: 780 });
});

test("renameTemplate trims and ignores empty names", () => {
  const data: TimeblockData = { ...initialData(), templates: [WORK] };
  assert.equal(expectData(renameTemplate(data, "work", "  Deep week ")).templates[0].name, "Deep week");
  assert.equal(renameTemplate(data, "work", "   "), data);
});

test("categories: trimmed rename, add limit, keep at least one", () => {
  const data = initialData();
  assert.equal(updateCategory(data, "admin", { name: "  Ops " }).categories[2].name, "Ops");
  assert.equal(updateCategory(data, "admin", { name: "  " }), data);
  const full: TimeblockData = {
    ...data,
    categories: Array.from({ length: LIMITS.categories }, (_, i) => ({ id: `c${i}`, name: `C${i}`, color: "blue" as const })),
  };
  assert.ok(isOpError(addCategory(full, { id: "x", name: "X", color: nextColor(full.categories) })));
  assert.ok(isOpError(deleteCategory({ ...data, categories: [data.categories[0]] }, "deep-work")));
});

test("deleteCategory leaves blocks pointing at the old id", () => {
  const data = withBlocks({ [MON]: [block("a", 0, 15, { categoryId: "admin" })] });
  const result = expectData(deleteCategory(data, "admin"));
  assert.equal(result.categories.some((c) => c.id === "admin"), false);
  assert.equal(result.blocksByDate[MON][0].categoryId, "admin");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '.../lib/ops.ts'`.

- [ ] **Step 3: Implement ops.ts**

`src/features/timeblock/lib/ops.ts`:

```ts
import type {
  Block,
  BlockStatus,
  Category,
  Template,
  TemplateBlock,
  TimeblockData,
} from "../types.ts";
import { placeAfter } from "./range.ts";
import { isoWeekday } from "./time.ts";

export const LIMITS = { templates: 20, categories: 30, blocksPerWeek: 300 } as const;

export interface OpError {
  error: string;
}

export type OpResult = TimeblockData | OpError;

export function isOpError(result: OpResult): result is OpError {
  return "error" in result;
}

export type BlockPatch = Partial<Omit<Block, "id">>;
export type TemplateBlockPatch = Partial<Omit<TemplateBlock, "id">>;
export type CategoryPatch = Partial<Omit<Category, "id">>;

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "deep-work", name: "Deep work", color: "blue" },
  { id: "meetings", name: "Meetings", color: "violet" },
  { id: "admin", name: "Admin", color: "slate" },
  { id: "exercise", name: "Exercise", color: "emerald" },
  { id: "personal", name: "Personal", color: "amber" },
];

export function initialData(): TimeblockData {
  return { categories: DEFAULT_CATEGORIES, blocksByDate: {}, templates: [] };
}

const weekFull = (): OpError => ({
  error: `A week can hold up to ${LIMITS.blocksPerWeek} blocks`,
});
const templateFull = (): OpError => ({
  error: `A template can hold up to ${LIMITS.blocksPerWeek} blocks`,
});

/** True when applying `patch` would change nothing (undefined keys are ignored). */
function unchanged<T extends object>(target: T, patch: Partial<T>): boolean {
  return (Object.keys(patch) as (keyof T)[]).every(
    (key) => patch[key] === undefined || patch[key] === target[key],
  );
}

/** Apply `patch`, skipping undefined keys. */
function merge<T extends object>(target: T, patch: Partial<T>): T {
  const next = { ...target };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const value = patch[key];
    if (value !== undefined) next[key] = value as T[keyof T];
  }
  return next;
}

/** Replace one day's blocks; an empty day is removed rather than stored as []. */
function withDay(data: TimeblockData, date: string, blocks: Block[]): TimeblockData {
  const { [date]: _, ...rest } = data.blocksByDate;
  return {
    ...data,
    blocksByDate: blocks.length > 0 ? { ...rest, [date]: blocks } : rest,
  };
}

export function countBlocks(data: TimeblockData, dates: readonly string[]): number {
  return dates.reduce((n, date) => n + (data.blocksByDate[date]?.length ?? 0), 0);
}

// ── Week blocks ────────────────────────────────────────────────────────────

export function addBlock(
  data: TimeblockData,
  week: readonly string[],
  date: string,
  block: Block,
): OpResult {
  if (countBlocks(data, week) >= LIMITS.blocksPerWeek) return weekFull();
  return withDay(data, date, [...(data.blocksByDate[date] ?? []), block]);
}

export function updateBlock(
  data: TimeblockData,
  date: string,
  id: string,
  patch: BlockPatch,
): TimeblockData {
  const day = data.blocksByDate[date] ?? [];
  const block = day.find((b) => b.id === id);
  if (!block || unchanged(block, patch)) return data;
  return withDay(data, date, day.map((b) => (b.id === id ? merge(b, patch) : b)));
}

export function moveBlock(
  data: TimeblockData,
  fromDate: string,
  id: string,
  toDate: string,
  start: number,
  end: number,
): TimeblockData {
  if (fromDate === toDate) return updateBlock(data, fromDate, id, { start, end });
  const source = data.blocksByDate[fromDate] ?? [];
  const block = source.find((b) => b.id === id);
  if (!block) return data;
  const removed = withDay(data, fromDate, source.filter((b) => b.id !== id));
  return withDay(removed, toDate, [
    ...(removed.blocksByDate[toDate] ?? []),
    { ...block, start, end },
  ]);
}

export function deleteBlock(data: TimeblockData, date: string, id: string): TimeblockData {
  const day = data.blocksByDate[date] ?? [];
  if (!day.some((b) => b.id === id)) return data;
  return withDay(data, date, day.filter((b) => b.id !== id));
}

/** Copy placed right after the original, reset to planned. */
export function duplicateBlock(
  data: TimeblockData,
  week: readonly string[],
  date: string,
  id: string,
  newId: string,
): OpResult {
  const block = data.blocksByDate[date]?.find((b) => b.id === id);
  if (!block) return data;
  return addBlock(data, week, date, {
    ...block,
    ...placeAfter(block),
    id: newId,
    status: "planned",
  });
}

export function clearDates(data: TimeblockData, dates: readonly string[]): TimeblockData {
  if (!dates.some((date) => date in data.blocksByDate)) return data;
  const blocksByDate = { ...data.blocksByDate };
  for (const date of dates) delete blocksByDate[date];
  return { ...data, blocksByDate };
}

// ── Templates ──────────────────────────────────────────────────────────────

function withTemplate(
  data: TimeblockData,
  id: string,
  update: (template: Template) => Template | OpError,
): OpResult {
  const template = data.templates.find((t) => t.id === id);
  if (!template) return data;
  const next = update(template);
  if ("error" in next) return next;
  if (next === template) return data;
  return { ...data, templates: data.templates.map((t) => (t.id === id ? next : t)) };
}

export function addTemplateBlock(
  data: TimeblockData,
  templateId: string,
  block: TemplateBlock,
): OpResult {
  return withTemplate(data, templateId, (t) =>
    t.blocks.length >= LIMITS.blocksPerWeek
      ? templateFull()
      : { ...t, blocks: [...t.blocks, block] },
  );
}

export function updateTemplateBlock(
  data: TimeblockData,
  templateId: string,
  id: string,
  patch: TemplateBlockPatch,
): OpResult {
  return withTemplate(data, templateId, (t) => {
    const block = t.blocks.find((b) => b.id === id);
    if (!block || unchanged(block, patch)) return t;
    return { ...t, blocks: t.blocks.map((b) => (b.id === id ? merge(b, patch) : b)) };
  });
}

export function deleteTemplateBlock(
  data: TimeblockData,
  templateId: string,
  id: string,
): OpResult {
  return withTemplate(data, templateId, (t) =>
    t.blocks.some((b) => b.id === id)
      ? { ...t, blocks: t.blocks.filter((b) => b.id !== id) }
      : t,
  );
}

export function duplicateTemplateBlock(
  data: TimeblockData,
  templateId: string,
  id: string,
  newId: string,
): OpResult {
  return withTemplate(data, templateId, (t) => {
    const block = t.blocks.find((b) => b.id === id);
    if (!block) return t;
    if (t.blocks.length >= LIMITS.blocksPerWeek) return templateFull();
    return { ...t, blocks: [...t.blocks, { ...block, ...placeAfter(block), id: newId }] };
  });
}

export function createTemplate(data: TimeblockData, template: Template): OpResult {
  if (data.templates.length >= LIMITS.templates) {
    return { error: `You can save up to ${LIMITS.templates} templates` };
  }
  return { ...data, templates: [...data.templates, template] };
}

export function renameTemplate(data: TimeblockData, id: string, name: string): OpResult {
  const trimmed = name.trim();
  return withTemplate(data, id, (t) =>
    !trimmed || trimmed === t.name ? t : { ...t, name: trimmed },
  );
}

export function deleteTemplate(data: TimeblockData, id: string): TimeblockData {
  if (!data.templates.some((t) => t.id === id)) return data;
  return { ...data, templates: data.templates.filter((t) => t.id !== id) };
}

/** New template from a week's blocks: weekday taken from each date, status dropped. */
export function saveWeekAsTemplate(
  data: TimeblockData,
  week: readonly string[],
  templateId: string,
  name: string,
  makeId: () => string,
): OpResult {
  const blocks: TemplateBlock[] = week.flatMap((date) =>
    (data.blocksByDate[date] ?? []).map(({ status: _, ...block }) => ({
      ...block,
      id: makeId(),
      weekday: isoWeekday(date),
    })),
  );
  return createTemplate(data, {
    id: templateId,
    name: name.trim() || "Untitled template",
    blocks,
  });
}

/** Copy a template's blocks onto the week's dates by ISO weekday; "replace" clears the week first. */
export function applyTemplate(
  data: TimeblockData,
  templateId: string,
  week: readonly string[],
  mode: "replace" | "add",
  makeId: () => string,
): OpResult {
  const template = data.templates.find((t) => t.id === templateId);
  if (!template) return data;
  const base = mode === "replace" ? clearDates(data, week) : data;
  if (countBlocks(base, week) + template.blocks.length > LIMITS.blocksPerWeek) {
    return weekFull();
  }
  let next = base;
  for (const date of week) {
    const weekday = isoWeekday(date);
    const added: Block[] = template.blocks
      .filter((b) => b.weekday === weekday)
      .map(({ weekday: _, ...b }) => ({
        ...b,
        id: makeId(),
        status: "planned" as BlockStatus,
      }));
    if (added.length > 0) {
      next = withDay(next, date, [...(next.blocksByDate[date] ?? []), ...added]);
    }
  }
  return next;
}

// ── Categories ─────────────────────────────────────────────────────────────

export function addCategory(data: TimeblockData, category: Category): OpResult {
  if (data.categories.length >= LIMITS.categories) {
    return { error: `You can have up to ${LIMITS.categories} categories` };
  }
  return { ...data, categories: [...data.categories, category] };
}

export function updateCategory(
  data: TimeblockData,
  id: string,
  patch: CategoryPatch,
): TimeblockData {
  const category = data.categories.find((c) => c.id === id);
  const clean = patch.name === undefined ? patch : { ...patch, name: patch.name.trim() };
  if (!category || clean.name === "" || unchanged(category, clean)) return data;
  return {
    ...data,
    categories: data.categories.map((c) => (c.id === id ? merge(c, clean) : c)),
  };
}

/** Blocks keep their categoryId and render as Uncategorized. */
export function deleteCategory(data: TimeblockData, id: string): OpResult {
  if (!data.categories.some((c) => c.id === id)) return data;
  if (data.categories.length === 1) return { error: "Keep at least one category" };
  return { ...data, categories: data.categories.filter((c) => c.id !== id) };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Lint the new module**

Run: `pnpm exec eslint src/features/timeblock`
Expected: no errors (the `_` rest-sibling bindings are allowed by `ignoreRestSiblings`).

- [ ] **Step 6: Commit**

```bash
git add src/features/timeblock/lib/ops.ts src/features/timeblock/lib/ops.test.ts
git commit -m "feat(timeblock): add pure data operations with limits" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Store and actions

**Files:**
- Create: `src/features/timeblock/store.ts`
- Create: `src/features/timeblock/actions.ts`
- Test: `src/features/timeblock/store.test.ts`

**Interfaces:**
- Consumes: `history.ts`, `ops.ts`, `palette.ts`, types.
- Produces (store.ts): `type ActionResult = { ok: true; entryId: number | null } | { ok: false; error: string }`; `useTimeblockStore` with state `categories`, `blocksByDate`, `templates`, `weekStartsOn`, `lastCategoryId`, `history` and methods `commit(label, recipe)`, `undo()`, `redo()`, `undoIfLatest(entryId): boolean`, `setWeekStartsOn(v)`, `setLastCategoryId(id)`.
- Produces (actions.ts): `newId()`, `defaultCategoryId()`, `addBlock(week, date, block): boolean`, `updateBlock(date, id, patch, label?)`, `moveBlock(fromDate, id, toDate, start, end)`, `deleteBlock(date, id)`, `duplicateBlock(week, date, id)`, `clearWeek(week)`, `addTemplateBlock(templateId, block): boolean`, `updateTemplateBlock(templateId, id, patch, label?)`, `deleteTemplateBlock(templateId, id)`, `duplicateTemplateBlock(templateId, id)`, `createTemplate(name): string | null`, `renameTemplate(id, name)`, `deleteTemplate(id)`, `saveWeekAsTemplate(week, name): string | null`, `applyTemplate(templateId, week, mode)`, `addCategory()`, `updateCategory(id, patch, label?)`, `deleteCategory(id)`.

- [ ] **Step 1: Write the failing test**

`src/features/timeblock/store.test.ts`:

```ts
import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";

// zustand's persist reads window.localStorage; provide an in-memory one
// before the store module is evaluated.
const memory = new Map<string, string>();
Object.assign(globalThis, {
  window: {
    localStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => void memory.set(key, value),
      removeItem: (key: string) => void memory.delete(key),
    },
  },
});

const { useTimeblockStore } = await import("./store.ts");
const { emptyHistory } = await import("./lib/history.ts");
const { addCategory, deleteCategory, initialData, updateCategory } = await import("./lib/ops.ts");

const store = () => useTimeblockStore.getState();

beforeEach(() => {
  useTimeblockStore.setState({ ...initialData(), history: emptyHistory() });
  memory.clear();
});

test("commit records an undo point; undo and redo walk it", () => {
  const result = store().commit("Rename category", (d) => updateCategory(d, "admin", { name: "Ops" }));
  assert.deepEqual(result, { ok: true, entryId: 1 });
  assert.equal(store().categories[2].name, "Ops");
  assert.equal(store().history.past.at(-1)?.label, "Rename category");
  store().undo();
  assert.equal(store().categories[2].name, "Admin");
  assert.equal(store().history.future.at(-1)?.label, "Rename category");
  store().redo();
  assert.equal(store().categories[2].name, "Ops");
});

test("a no-op recipe records nothing", () => {
  const result = store().commit("Rename category", (d) => updateCategory(d, "admin", { name: "Admin" }));
  assert.deepEqual(result, { ok: true, entryId: null });
  assert.equal(store().history.past.length, 0);
});

test("a refused change returns the error and records nothing", () => {
  store().commit("Trim", (d) => ({ ...d, categories: [d.categories[0]] }));
  const before = store().categories;
  const result = store().commit("Delete category", (d) => deleteCategory(d, "deep-work"));
  assert.deepEqual(result, { ok: false, error: "Keep at least one category" });
  assert.equal(store().categories, before);
  assert.equal(store().history.past.length, 1);
});

test("undoIfLatest undoes its own change", () => {
  const result = store().commit("Add category", (d) => addCategory(d, { id: "x", name: "X", color: "lime" }));
  if (!result.ok || result.entryId === null) assert.fail("expected a history entry");
  assert.equal(store().undoIfLatest(result.entryId), true);
  assert.equal(store().categories.some((c) => c.id === "x"), false);
});

test("undoIfLatest refuses once a newer change exists", () => {
  const first = store().commit("Add category", (d) => addCategory(d, { id: "x", name: "X", color: "lime" }));
  if (!first.ok || first.entryId === null) assert.fail("expected a history entry");
  store().commit("Rename category", (d) => updateCategory(d, "x", { name: "Y" }));
  assert.equal(store().undoIfLatest(first.entryId), false);
  assert.equal(store().categories.at(-1)?.name, "Y");
});

test("only data and settings are persisted, never history", () => {
  store().commit("Add category", (d) => addCategory(d, { id: "x", name: "X", color: "lime" }));
  const saved = JSON.parse(memory.get("timeblock-storage") ?? "{}");
  assert.equal(saved.version, 1);
  assert.deepEqual(Object.keys(saved.state).sort(), [
    "blocksByDate",
    "categories",
    "lastCategoryId",
    "templates",
    "weekStartsOn",
  ]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module '.../timeblock/store.ts'`.

- [ ] **Step 3: Implement store.ts**

`src/features/timeblock/store.ts`:

```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  emptyHistory,
  latestId,
  record,
  redo as redoHistory,
  undo as undoHistory,
  type History,
} from "./lib/history.ts";
import { initialData, isOpError, type OpResult } from "./lib/ops.ts";
import type { TimeblockData, WeekStartsOn } from "./types.ts";

export type ActionResult =
  | { ok: true; entryId: number | null }
  | { ok: false; error: string };

interface TimeblockState extends TimeblockData {
  weekStartsOn: WeekStartsOn;
  /** Category given to newly created blocks. */
  lastCategoryId: string | null;
  /** Session-only undo/redo stacks; never persisted. */
  history: History<TimeblockData>;
  /**
   * Apply a content change as one undoable step. A recipe that returns its
   * input unchanged records nothing; a refused change returns its error.
   */
  commit: (label: string, recipe: (data: TimeblockData) => OpResult) => ActionResult;
  undo: () => void;
  redo: () => void;
  /** Undo only if `entryId` is still the latest change (toast "Undo" buttons). */
  undoIfLatest: (entryId: number) => boolean;
  setWeekStartsOn: (weekStartsOn: WeekStartsOn) => void;
  setLastCategoryId: (id: string) => void;
}

const pickData = ({ categories, blocksByDate, templates }: TimeblockData): TimeblockData => ({
  categories,
  blocksByDate,
  templates,
});

export const useTimeblockStore = create<TimeblockState>()(
  persist(
    (set, get) => ({
      ...initialData(),
      weekStartsOn: 1,
      lastCategoryId: null,
      history: emptyHistory<TimeblockData>(),
      commit: (label, recipe) => {
        const current = pickData(get());
        const next = recipe(current);
        if (isOpError(next)) return { ok: false, error: next.error };
        if (next === current) return { ok: true, entryId: null };
        const { history, id } = record(get().history, label, current);
        set({ ...pickData(next), history });
        return { ok: true, entryId: id };
      },
      undo: () => {
        const result = undoHistory(get().history, pickData(get()));
        if (result) set({ ...result.data, history: result.history });
      },
      redo: () => {
        const result = redoHistory(get().history, pickData(get()));
        if (result) set({ ...result.data, history: result.history });
      },
      undoIfLatest: (entryId) => {
        if (latestId(get().history) !== entryId) return false;
        get().undo();
        return true;
      },
      setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),
      setLastCategoryId: (lastCategoryId) => set({ lastCategoryId }),
    }),
    {
      name: "timeblock-storage",
      version: 1,
      skipHydration: true,
      partialize: ({ categories, blocksByDate, templates, weekStartsOn, lastCategoryId }) => ({
        categories,
        blocksByDate,
        templates,
        weekStartsOn,
        lastCategoryId,
      }),
    },
  ),
);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS (all suites).

- [ ] **Step 5: Implement actions.ts**

`src/features/timeblock/actions.ts`:

```ts
import { nanoid } from "nanoid";
import { toast } from "sonner";
import * as ops from "./lib/ops";
import { nextColor } from "./palette";
import { useTimeblockStore, type ActionResult } from "./store";
import {
  UNCATEGORIZED_ID,
  type Block,
  type TemplateBlock,
  type TimeblockData,
} from "./types";

export const newId = () => nanoid(10);

const store = () => useTimeblockStore.getState();

/** Commit through history; a refused change surfaces as an error toast. */
function run(label: string, recipe: (data: TimeblockData) => ops.OpResult): ActionResult {
  const result = store().commit(label, recipe);
  if (!result.ok) toast.error(result.error);
  return result;
}

/** Toast whose Undo button reverts exactly this change — never a newer one. */
function toastWithUndo(message: string, result: ActionResult) {
  if (!result.ok || result.entryId === null) return;
  const { entryId } = result;
  toast(message, {
    action: {
      label: "Undo",
      onClick: () => {
        if (!store().undoIfLatest(entryId)) {
          toast("You've made changes since — use Undo in the toolbar instead.");
        }
      },
    },
  });
}

/** Category for new blocks: the last one used, if it still exists. */
export function defaultCategoryId(): string {
  const { categories, lastCategoryId } = store();
  if (lastCategoryId && categories.some((c) => c.id === lastCategoryId)) return lastCategoryId;
  return categories[0]?.id ?? UNCATEGORIZED_ID;
}

// ── Week blocks ────────────────────────────────────────────────────────────

export function addBlock(week: readonly string[], date: string, block: Block): boolean {
  return run("Add block", (d) => ops.addBlock(d, week, date, block)).ok;
}

export function updateBlock(date: string, id: string, patch: ops.BlockPatch, label = "Edit block") {
  if (patch.categoryId) store().setLastCategoryId(patch.categoryId);
  run(label, (d) => ops.updateBlock(d, date, id, patch));
}

export function moveBlock(fromDate: string, id: string, toDate: string, start: number, end: number) {
  run("Move block", (d) => ops.moveBlock(d, fromDate, id, toDate, start, end));
}

export function deleteBlock(date: string, id: string) {
  toastWithUndo("Block deleted", run("Delete block", (d) => ops.deleteBlock(d, date, id)));
}

export function duplicateBlock(week: readonly string[], date: string, id: string) {
  run("Duplicate block", (d) => ops.duplicateBlock(d, week, date, id, newId()));
}

export function clearWeek(week: readonly string[]) {
  toastWithUndo("Week cleared", run("Clear week", (d) => ops.clearDates(d, week)));
}

// ── Template blocks ────────────────────────────────────────────────────────

export function addTemplateBlock(templateId: string, block: TemplateBlock): boolean {
  return run("Add block", (d) => ops.addTemplateBlock(d, templateId, block)).ok;
}

export function updateTemplateBlock(
  templateId: string,
  id: string,
  patch: ops.TemplateBlockPatch,
  label = "Edit block",
) {
  if (patch.categoryId) store().setLastCategoryId(patch.categoryId);
  run(label, (d) => ops.updateTemplateBlock(d, templateId, id, patch));
}

export function deleteTemplateBlock(templateId: string, id: string) {
  toastWithUndo(
    "Block deleted",
    run("Delete block", (d) => ops.deleteTemplateBlock(d, templateId, id)),
  );
}

export function duplicateTemplateBlock(templateId: string, id: string) {
  run("Duplicate block", (d) => ops.duplicateTemplateBlock(d, templateId, id, newId()));
}

// ── Templates ──────────────────────────────────────────────────────────────

export function createTemplate(name: string): string | null {
  const id = newId();
  const result = run("New template", (d) =>
    ops.createTemplate(d, { id, name: name.trim() || "Untitled template", blocks: [] }),
  );
  return result.ok ? id : null;
}

export function renameTemplate(id: string, name: string) {
  run("Rename template", (d) => ops.renameTemplate(d, id, name));
}

export function deleteTemplate(id: string) {
  toastWithUndo("Template deleted", run("Delete template", (d) => ops.deleteTemplate(d, id)));
}

export function saveWeekAsTemplate(week: readonly string[], name: string): string | null {
  const id = newId();
  const result = run("Save week as template", (d) =>
    ops.saveWeekAsTemplate(d, week, id, name, newId),
  );
  if (!result.ok) return null;
  toast.success(`Saved “${name.trim()}” as a template`);
  return id;
}

export function applyTemplate(templateId: string, week: readonly string[], mode: "replace" | "add") {
  const result = run(mode === "replace" ? "Replace week with template" : "Apply template", (d) =>
    ops.applyTemplate(d, templateId, week, mode, newId),
  );
  toastWithUndo(mode === "replace" ? "Week replaced with template" : "Template applied", result);
}

// ── Categories ─────────────────────────────────────────────────────────────

export function addCategory() {
  run("Add category", (d) =>
    ops.addCategory(d, { id: newId(), name: "New category", color: nextColor(d.categories) }),
  );
}

export function updateCategory(id: string, patch: ops.CategoryPatch, label = "Edit category") {
  run(label, (d) => ops.updateCategory(d, id, patch));
}

export function deleteCategory(id: string) {
  toastWithUndo("Category deleted", run("Delete category", (d) => ops.deleteCategory(d, id)));
}
```

- [ ] **Step 6: Type-check and lint**

Run: `pnpm exec tsc --noEmit -p . && pnpm exec eslint src/features/timeblock`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/timeblock/store.ts src/features/timeblock/store.test.ts src/features/timeblock/actions.ts
git commit -m "feat(timeblock): add persisted store with undo/redo and action layer" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Route, registration, and page shell

**Files:**
- Move: `src/features/webhook-inspector/components/use-now.ts` → `src/hooks/use-now.ts`
- Modify: `src/features/webhook-inspector/components/request-list.tsx:7` (import path)
- Create: `src/hooks/use-media-query.ts`
- Create: `src/app/timeblock/page.tsx`
- Modify: `src/lib/tools.ts`
- Create: `src/features/timeblock/components/use-timeblock-shortcuts.ts`
- Create: `src/features/timeblock/components/shortcuts.ts`
- Create: `src/features/timeblock/components/timeblock-navbar.tsx`
- Create: `src/features/timeblock/components/timeblock-content.tsx`

**Interfaces:**
- Produces: `useNow(): number` (`@/hooks/use-now`), `useMediaQuery(query): boolean` (`@/hooks/use-media-query`), `useTimeblockShortcuts(handlers)`, `timeblockShortcutSections(modKey)`, `type Mode = "week" | "templates"`, `TimeblockNavbar`, `WeekNav`, `NavIconButton` (props below), default export `TimeblockContent`.
- `TimeblockNavbar` props: `{ mode; onModeChange(mode); center: ReactNode; actions: ReactNode; undoLabel?: string; redoLabel?: string; onUndo(); onRedo(); modKey: string; onShowShortcuts() }`.
- `NavIconButton` props: `{ label: string; keys?: string[]; disabled?: boolean; onClick(); className?: string; children: ReactNode }`.

- [ ] **Step 1: Share the ticking clock hook**

```bash
git mv src/features/webhook-inspector/components/use-now.ts src/hooks/use-now.ts
```

In `src/features/webhook-inspector/components/request-list.tsx` replace

```ts
import { useNow } from "./use-now";
```

with

```ts
import { useNow } from "@/hooks/use-now";
```

- [ ] **Step 2: Add useMediaQuery**

`src/hooks/use-media-query.ts`:

```ts
"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Live `matchMedia` result; false during SSR. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
```

- [ ] **Step 3: Register the tool**

In `src/lib/tools.ts`, add `CalendarClock` to the lucide import (alphabetical, first in the list):

```ts
import {
  CalendarClock,
  FileDown,
```

and append to the end of `allTools` (after the Rich Text entry):

```ts
  {
    name: "Timeblock",
    description: "Plan your week in time blocks and track what got done",
    icon: CalendarClock,
    href: "/timeblock",
    addedAt: "2026-09-30",
  },
```

- [ ] **Step 4: Create the route**

`src/app/timeblock/page.tsx`:

```tsx
import { Suspense, lazy } from "react";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import type { Metadata } from "next";

const TimeblockContent = lazy(
  () => import("@/features/timeblock/components/timeblock-content"),
);

const SHARE_DESCRIPTION =
  "Plan your week in color-coded time blocks, reuse weekly templates, and track planned vs. done hours. Runs in your browser, no sign-up.";

export const metadata: Metadata = {
  title: "Timeblock Planner",
  description:
    "Free time blocking planner. Drag to plan your week in color-coded blocks, reuse weekly templates, and track planned vs. done hours. No sign-up required.",
  alternates: { canonical: "/timeblock" },
  keywords: [
    "time blocking",
    "time block planner",
    "time blocking app",
    "weekly planner",
    "time blocking template",
    "ideal week template",
    "weekly schedule maker",
    "time block calendar",
    "weekly time blocking",
    "free time blocking tool",
  ],
  openGraph: {
    title: "Timeblock Planner",
    description: SHARE_DESCRIPTION,
    url: "https://usetiny.app/timeblock",
  },
  twitter: {
    title: "Timeblock Planner | UseTiny",
    description: SHARE_DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UseTiny Timeblock",
  url: "https://usetiny.app/timeblock",
  description:
    "Plan your week in color-coded time blocks with drag-and-drop, reusable weekly templates, planned vs. done tracking, and undo/redo. Runs entirely in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Drag to create, move, and resize time blocks on a weekly calendar",
    "Color-coded categories with weekly time totals",
    "Mark blocks done or skipped to compare planned vs. actual time",
    "Reusable named week templates",
    "Undo and redo for every change",
    "Saved locally in your browser, no account needed",
  ],
};

export default function TimeblockPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="sr-only">Timeblock — Free Weekly Time Blocking Planner</h1>
      <p className="sr-only">
        Plan your week in color-coded time blocks. Drag on the calendar to
        create a block, move or resize it, and mark it done or skipped to
        compare planned and actual time per category. Save typical weeks as
        templates and apply them to any week. Everything stays in your browser,
        no sign-up.
      </p>
      <Suspense fallback={<FullscreenLoading />}>
        <TimeblockContent />
      </Suspense>
    </>
  );
}
```

- [ ] **Step 5: Add the shortcuts hook and list**

`src/features/timeblock/components/use-timeblock-shortcuts.ts`:

```ts
"use client";

import { useEffect, useRef } from "react";

export interface TimeblockShortcutHandlers {
  onToday: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onShowShortcuts: () => void;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/** Page-level shortcuts. Ignored while typing so inputs keep native undo. */
export function useTimeblockShortcuts(handlers: TimeblockShortcutHandlers) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isEditable(e.target)) return;
      const h = latest.current;
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "z") {
        e.preventDefault();
        if (e.shiftKey) h.onRedo();
        else h.onUndo();
        return;
      }
      if (e.ctrlKey && !e.metaKey && key === "y") {
        e.preventDefault();
        h.onRedo();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") h.onShowShortcuts();
      else if (key === "t") h.onToday();
      else if (e.key === "[") h.onPrevWeek();
      else if (e.key === "]") h.onNextWeek();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
```

`src/features/timeblock/components/shortcuts.ts`:

```ts
import type { ShortcutSection } from "@/components/shortcuts-dialog";

export function timeblockShortcutSections(modKey: string): ShortcutSection[] {
  return [
    {
      category: "Navigation",
      items: [
        { keys: ["T"], description: "Go to this week" },
        { keys: ["["], description: "Previous week" },
        { keys: ["]"], description: "Next week" },
      ],
    },
    {
      category: "Editing",
      items: [
        { keys: [modKey, "Z"], description: "Undo" },
        { keys: [modKey, "Shift", "Z"], description: "Redo" },
        { keys: ["Esc"], description: "Cancel a drag" },
      ],
    },
    {
      category: "Focused block",
      items: [
        { keys: ["↑", "↓"], description: "Move 15 minutes" },
        { keys: ["←", "→"], description: "Move to the previous or next day" },
        { keys: ["Shift", "↑", "↓"], description: "Shorten or lengthen" },
        { keys: ["Enter"], description: "Edit" },
        { keys: ["Space"], description: "Toggle done" },
        { keys: ["Delete"], description: "Delete" },
      ],
    },
    { items: [{ keys: ["?"], description: "Show shortcuts" }] },
  ];
}
```

- [ ] **Step 6: Add the navbar**

`src/features/timeblock/components/timeblock-navbar.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Keyboard, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type Mode = "week" | "templates";

const MODES: { value: Mode; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "templates", label: "Templates" },
];

interface TimeblockNavbarProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  /** Week navigation or template picker; wraps to its own row on mobile. */
  center: ReactNode;
  /** Extra right-side controls, rendered before the shortcuts button. */
  actions: ReactNode;
  undoLabel?: string;
  redoLabel?: string;
  onUndo: () => void;
  onRedo: () => void;
  modKey: string;
  onShowShortcuts: () => void;
}

export function TimeblockNavbar({
  mode,
  onModeChange,
  center,
  actions,
  undoLabel,
  redoLabel,
  onUndo,
  onRedo,
  modKey,
  onShowShortcuts,
}: TimeblockNavbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2">
      <Link
        href="/"
        className="text-sm font-semibold transition-opacity hover:opacity-70"
      >
        UseTiny
      </Link>
      <span className="hidden text-sm text-muted-foreground sm:inline">
        Timeblock
      </span>
      <ButtonGroup className="ml-1">
        {MODES.map((m) => (
          <Button
            key={m.value}
            size="sm"
            variant={mode === m.value ? "default" : "outline"}
            className="h-7 px-2.5 text-xs"
            aria-pressed={mode === m.value}
            onClick={() => onModeChange(m.value)}
          >
            {m.label}
          </Button>
        ))}
      </ButtonGroup>
      <div className="order-last flex w-full min-w-0 items-center gap-1 md:order-none md:ml-1 md:w-auto">
        {center}
      </div>
      <div className="flex-1" />
      <NavIconButton
        label={undoLabel ? `Undo ${undoLabel.toLowerCase()}` : "Nothing to undo"}
        keys={[modKey, "Z"]}
        disabled={!undoLabel}
        onClick={onUndo}
      >
        <Undo2 className="h-3.5 w-3.5" />
      </NavIconButton>
      <NavIconButton
        label={redoLabel ? `Redo ${redoLabel.toLowerCase()}` : "Nothing to redo"}
        keys={[modKey, "Shift", "Z"]}
        disabled={!redoLabel}
        onClick={onRedo}
      >
        <Redo2 className="h-3.5 w-3.5" />
      </NavIconButton>
      {actions}
      <NavIconButton
        label="Keyboard shortcuts"
        keys={["?"]}
        onClick={onShowShortcuts}
        className="hidden sm:inline-flex"
      >
        <Keyboard className="h-3.5 w-3.5" />
      </NavIconButton>
    </div>
  );
}

interface NavIconButtonProps {
  label: string;
  keys?: string[];
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}

export function NavIconButton({
  label,
  keys,
  disabled,
  onClick,
  className,
  children,
}: NavIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className={cn("h-7 w-7", className)}
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="flex items-center gap-2">
        <span>{label}</span>
        {keys && (
          <KbdGroup>
            {keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface WeekNavProps {
  label: string;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function WeekNav({ label, isCurrentWeek, onPrev, onNext, onToday }: WeekNavProps) {
  return (
    <>
      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Previous week" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span
        className="min-w-0 flex-1 truncate text-center text-sm font-medium tabular-nums md:min-w-48 md:flex-none"
        aria-live="polite"
      >
        {label}
      </span>
      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Next week" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="ml-1 h-7 px-2.5 text-xs"
        disabled={isCurrentWeek}
        onClick={onToday}
      >
        Today
      </Button>
    </>
  );
}
```

- [ ] **Step 7: Add the page shell**

`src/features/timeblock/components/timeblock-content.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { useIsMac } from "@/hooks/use-is-mac";
import { useNow } from "@/hooks/use-now";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { addDays, formatWeekRange, startOfWeek, toDateKey, weekDates } from "../lib/time";
import { useTimeblockStore } from "../store";
import { timeblockShortcutSections } from "./shortcuts";
import { TimeblockNavbar, WeekNav, type Mode } from "./timeblock-navbar";
import { useTimeblockShortcuts } from "./use-timeblock-shortcuts";

export default function TimeblockContent() {
  const hydrated = useStoreHydration(useTimeblockStore);
  const weekStartsOn = useTimeblockStore((s) => s.weekStartsOn);
  const history = useTimeblockStore((s) => s.history);
  const undo = useTimeblockStore((s) => s.undo);
  const redo = useTimeblockStore((s) => s.redo);
  const modKey = useIsMac() ? "⌘" : "Ctrl";
  const now = useNow();
  const today = toDateKey(new Date(now));

  const [mode, setMode] = useState<Mode>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const weekStart = addDays(startOfWeek(today, weekStartsOn), weekOffset * 7);
  const dates = useMemo(() => weekDates(weekStart), [weekStart]);

  const goToday = () => {
    setMode("week");
    setWeekOffset(0);
  };
  const stepWeek = (delta: number) => setWeekOffset((offset) => offset + delta);

  useTimeblockShortcuts({
    onToday: goToday,
    onPrevWeek: () => {
      if (mode === "week") stepWeek(-1);
    },
    onNextWeek: () => {
      if (mode === "week") stepWeek(1);
    },
    onUndo: undo,
    onRedo: redo,
    onShowShortcuts: () => setShowShortcuts(true),
  });

  if (!hydrated) return <FullscreenLoading />;

  return (
    <div className="flex h-dvh flex-col">
      <TimeblockNavbar
        mode={mode}
        onModeChange={setMode}
        center={
          mode === "week" ? (
            <WeekNav
              label={formatWeekRange(dates)}
              isCurrentWeek={weekOffset === 0}
              onPrev={() => stepWeek(-1)}
              onNext={() => stepWeek(1)}
              onToday={goToday}
            />
          ) : null
        }
        actions={null}
        undoLabel={history.past.at(-1)?.label}
        redoLabel={history.future.at(-1)?.label}
        onUndo={undo}
        onRedo={redo}
        modKey={modKey}
        onShowShortcuts={() => setShowShortcuts(true)}
      />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col" />
      </div>
      <div className="flex items-center gap-3 border-t bg-background px-4 py-1.5 text-xs text-muted-foreground">
        <span className="flex-1" />
        <span className="opacity-60">Saved</span>
      </div>
      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        description="Available keyboard shortcuts for Timeblock."
        sections={timeblockShortcutSections(modKey)}
        maxWidth={440}
      />
    </div>
  );
}
```

- [ ] **Step 8: Static checks**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint && pnpm test`
Expected: all pass.

- [ ] **Step 9: Verify in the browser (dev server on :3000)**

Run: `curl -s http://localhost:3000/timeblock | grep -o '<title>[^<]*</title>'`
Expected: `<title>Timeblock Planner | UseTiny</title>`.

With the agent-browser skill, open `http://localhost:3000/timeblock` and confirm:
- The navbar shows UseTiny · Timeblock · `Week | Templates` · `‹ Sep 28 – Oct 4, 2026 ›` · Today (disabled) · undo/redo (disabled) · keyboard button.
- `‹` / `›` / `[` / `]` change the range; `Today` and `T` return to the current week.
- `?` opens the shortcuts dialog.
- At 375px wide the week nav wraps to its own row.
- `http://localhost:3000/` lists **Timeblock** (and the "N new" badge counts it).
- The webhook inspector still renders its relative timestamps (moved `useNow`).

- [ ] **Step 10: Commit**

```bash
git add src/hooks/use-now.ts src/hooks/use-media-query.ts src/features/webhook-inspector/components/request-list.tsx src/app/timeblock/page.tsx src/lib/tools.ts src/features/timeblock/components/use-timeblock-shortcuts.ts src/features/timeblock/components/shortcuts.ts src/features/timeblock/components/timeblock-navbar.tsx src/features/timeblock/components/timeblock-content.tsx
git commit -m "feat(timeblock): add route, tool registration, and page shell" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`git mv` already staged the removal of the old `use-now.ts` path.)

---

### Task 9: Week grid — rendering, gestures, keyboard, editor

**Files:**
- Create: `src/features/timeblock/components/grid-types.ts`
- Create: `src/features/timeblock/components/grid-ops.ts`
- Create: `src/features/timeblock/components/use-grid-drag.ts`
- Create: `src/features/timeblock/components/block-item.tsx`
- Create: `src/features/timeblock/components/block-popover.tsx`
- Create: `src/features/timeblock/components/week-grid.tsx`
- Modify: `src/features/timeblock/components/timeblock-content.tsx` (full replacement below)

**Interfaces:**
- Consumes: `actions.*`, `layoutDay`, `clickRange`/`nudge`/`resizeEnd`/`withStart`, `pointToCell`/`resolveGesture`, formatters, `categoryLook`, `PALETTE`, `computeStats`.
- Produces: `GridBlock`, `GridColumn` (`{ key; label; dayNumber?; isToday; blocks }`), `GridPatch`, `GridOps` (`create(col,start,end): string | null`, `update(col,id,patch,label?)`, `move(fromCol,id,toCol,start,end)`, `remove(col,id)`, `duplicate(col,id)`), `createWeekOps(dates)`, `HOUR_HEIGHT`, `useGridDrag(options)`, `BlockItem`, `BlockPopover`, `WeekGrid` (props: `{ columns; visible: number[]; ops; categories; showStatus; now; scrollKey; onPrevDay?; onNextDay? }`).

- [ ] **Step 1: Grid adapter types and Week-mode ops**

`src/features/timeblock/components/grid-types.ts`:

```ts
import type { BlockStatus } from "../types";

/** A block as the grid sees it; template blocks are shown as planned. */
export interface GridBlock {
  id: string;
  title: string;
  categoryId: string;
  start: number;
  end: number;
  status: BlockStatus;
}

export interface GridColumn {
  key: string;
  label: string;
  /** Day of month — Week mode only. */
  dayNumber?: number;
  isToday: boolean;
  blocks: GridBlock[];
}

export type GridPatch = Partial<
  Pick<GridBlock, "title" | "categoryId" | "start" | "end" | "status">
>;

/** Mutations addressed by column index (0–6, display order). */
export interface GridOps {
  /** Returns the new block's id, or null when the add was refused. */
  create(col: number, start: number, end: number): string | null;
  update(col: number, id: string, patch: GridPatch, label?: string): void;
  move(fromCol: number, id: string, toCol: number, start: number, end: number): void;
  remove(col: number, id: string): void;
  duplicate(col: number, id: string): void;
}
```

`src/features/timeblock/components/grid-ops.ts`:

```ts
import * as actions from "../actions";
import type { GridOps } from "./grid-types";

export function createWeekOps(dates: readonly string[]): GridOps {
  return {
    create(col, start, end) {
      const id = actions.newId();
      const ok = actions.addBlock(dates, dates[col], {
        id,
        title: "",
        categoryId: actions.defaultCategoryId(),
        start,
        end,
        status: "planned",
      });
      return ok ? id : null;
    },
    update: (col, id, patch, label) => actions.updateBlock(dates[col], id, patch, label),
    move: (fromCol, id, toCol, start, end) =>
      actions.moveBlock(dates[fromCol], id, dates[toCol], start, end),
    remove: (col, id) => actions.deleteBlock(dates[col], id),
    duplicate: (col, id) => actions.duplicateBlock(dates, dates[col], id),
  };
}
```

- [ ] **Step 2: Pointer gesture hook**

`src/features/timeblock/components/use-grid-drag.ts`:

```ts
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
  /** While true (an editor is open) a press only dismisses it. */
  isBusy: () => boolean;
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
    if (!touch) {
      e.preventDefault(); // no text selection while dragging
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
```

- [ ] **Step 3: Block item**

`src/features/timeblock/components/block-item.tsx`:

```tsx
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
            <div data-resize="start" className="absolute inset-x-0 top-0 h-1.5 cursor-ns-resize" />
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
            <div data-resize="end" className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize" />
          </div>
          {showStatus && (
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
```

- [ ] **Step 4: Block editor popover**

`src/features/timeblock/components/block-popover.tsx`:

```tsx
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
  /** Draft title, owned by the grid and committed when the editor closes. */
  title: string;
  categories: Category[];
  showStatus: boolean;
  onTitleChange: (title: string) => void;
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
  onTitleChange,
  onChange,
  onDuplicate,
  onDelete,
  onClose,
  onCloseAutoFocus,
}: BlockPopoverProps) {
  return (
    <PopoverContent
      side="right"
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
```

- [ ] **Step 5: Week grid**

`src/features/timeblock/components/week-grid.tsx`:

```tsx
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

  // The title draft commits once, on close — one history entry per edit.
  const closeEditor = () => {
    if (!editing) return;
    const found = find(editing.id);
    const title = editing.title.trim();
    if (found && title !== found.block.title) ops.update(found.col, editing.id, { title }, "Rename block");
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

  const renderEditor = (col: number, block: GridBlock) => (
    <BlockPopover
      block={block}
      title={editing?.title ?? block.title}
      categories={categories}
      showStatus={showStatus}
      onTitleChange={(title) => setEditing({ id: block.id, title })}
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

  const single = visible.length === 1;
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
              editingId={editing?.id ?? null}
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
```

- [ ] **Step 6: Wire the grid into the page shell**

Replace `src/features/timeblock/components/timeblock-content.tsx` entirely with:

```tsx
"use client";

import { useMemo, useState } from "react";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { useIsMac } from "@/hooks/use-is-mac";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNow } from "@/hooks/use-now";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { computeStats } from "../lib/stats";
import {
  addDays,
  formatDuration,
  formatWeekRange,
  formatWeekday,
  fromDateKey,
  startOfWeek,
  toDateKey,
  weekDates,
} from "../lib/time";
import { useTimeblockStore } from "../store";
import { createWeekOps } from "./grid-ops";
import type { GridColumn } from "./grid-types";
import { timeblockShortcutSections } from "./shortcuts";
import { TimeblockNavbar, WeekNav, type Mode } from "./timeblock-navbar";
import { useTimeblockShortcuts } from "./use-timeblock-shortcuts";
import { WeekGrid } from "./week-grid";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function TimeblockContent() {
  const hydrated = useStoreHydration(useTimeblockStore);
  const weekStartsOn = useTimeblockStore((s) => s.weekStartsOn);
  const categories = useTimeblockStore((s) => s.categories);
  const blocksByDate = useTimeblockStore((s) => s.blocksByDate);
  const history = useTimeblockStore((s) => s.history);
  const undo = useTimeblockStore((s) => s.undo);
  const redo = useTimeblockStore((s) => s.redo);
  const modKey = useIsMac() ? "⌘" : "Ctrl";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const now = useNow();
  const today = toDateKey(new Date(now));

  const [mode, setMode] = useState<Mode>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [mobileDay, setMobileDay] = useState<number | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const weekStart = addDays(startOfWeek(today, weekStartsOn), weekOffset * 7);
  const dates = useMemo(() => weekDates(weekStart), [weekStart]);

  const columns = useMemo<GridColumn[]>(
    () =>
      dates.map((date) => ({
        key: date,
        label: formatWeekday(date),
        dayNumber: fromDateKey(date).getDate(),
        isToday: date === today,
        blocks: blocksByDate[date] ?? [],
      })),
    [dates, today, blocksByDate],
  );
  const ops = useMemo(() => createWeekOps(dates), [dates]);

  const categoryIds = useMemo(() => new Set(categories.map((c) => c.id)), [categories]);
  const stats = useMemo(
    () => computeStats(columns.flatMap((c) => c.blocks), categoryIds),
    [columns, categoryIds],
  );

  const dayIndex = mobileDay ?? Math.max(dates.indexOf(today), 0);
  const visible = useMemo(() => (isDesktop ? ALL_DAYS : [dayIndex]), [isDesktop, dayIndex]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setMobileDay(null);
  };
  const goToday = () => {
    switchMode("week");
    setWeekOffset(0);
  };
  const stepWeek = (delta: number) => setWeekOffset((offset) => offset + delta);
  const stepDay = (delta: 1 | -1) => {
    const next = dayIndex + delta;
    if (next >= 0 && next <= 6) {
      setMobileDay(next);
      return;
    }
    stepWeek(delta); // wrap into the neighboring week
    setMobileDay((next + 7) % 7);
  };

  useTimeblockShortcuts({
    onToday: goToday,
    onPrevWeek: () => {
      if (mode === "week") stepWeek(-1);
    },
    onNextWeek: () => {
      if (mode === "week") stepWeek(1);
    },
    onUndo: undo,
    onRedo: redo,
    onShowShortcuts: () => setShowShortcuts(true),
  });

  if (!hydrated) return <FullscreenLoading />;

  return (
    <div className="flex h-dvh flex-col">
      <TimeblockNavbar
        mode={mode}
        onModeChange={switchMode}
        center={
          mode === "week" ? (
            <WeekNav
              label={formatWeekRange(dates)}
              isCurrentWeek={weekOffset === 0}
              onPrev={() => stepWeek(-1)}
              onNext={() => stepWeek(1)}
              onToday={goToday}
            />
          ) : null
        }
        actions={null}
        undoLabel={history.past.at(-1)?.label}
        redoLabel={history.future.at(-1)?.label}
        onUndo={undo}
        onRedo={redo}
        modKey={modKey}
        onShowShortcuts={() => setShowShortcuts(true)}
      />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          {mode === "week" && (
            <WeekGrid
              columns={columns}
              visible={visible}
              ops={ops}
              categories={categories}
              showStatus
              now={now}
              scrollKey={`week:${weekStart}`}
              onPrevDay={() => stepDay(-1)}
              onNextDay={() => stepDay(1)}
            />
          )}
        </main>
      </div>
      <div className="flex items-center gap-3 border-t bg-background px-4 py-1.5 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {stats.count} {stats.count === 1 ? "block" : "blocks"} · {formatDuration(stats.planned)} planned ·{" "}
          {formatDuration(stats.done)} done · {formatDuration(stats.skipped)} skipped
        </span>
        <span className="flex-1" />
        <span className="opacity-60">Saved</span>
      </div>
      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        description="Available keyboard shortcuts for Timeblock."
        sections={timeblockShortcutSections(modKey)}
        maxWidth={440}
      />
    </div>
  );
}
```

- [ ] **Step 7: Static checks**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint && pnpm test`
Expected: all pass, no React Compiler lint errors.

- [ ] **Step 8: Verify in the browser**

With the agent-browser skill at `http://localhost:3000/timeblock` (desktop width ≥ 1280):
1. The grid opens scrolled to 7 AM; today's column is highlighted with a red now-line.
2. Drag on empty space from 9:00 to 10:30 → a dashed draft follows the pointer; on release a block appears and its editor opens with the title focused. Type "Deep work", press Enter → the title is saved; the undo tooltip reads "Undo rename block".
3. Click an empty slot → a 1-hour block is created and its editor opens.
4. Drag a block's body to another day and time → it moves (duration kept). Drag its bottom edge → it resizes, never below 15 minutes; drag far below the grid → it stops at midnight.
5. Start a drag and press Esc → nothing changes.
6. With an editor open, click empty grid → the editor just closes (no new block).
7. Hover a block → the ✓ button appears; click it → the block turns solid with a check; the status bar's "done" total updates.
8. Editor: change category, start/end selects (end options are always after start), status Planned/Done/Skipped, Duplicate (copy appears right after), Delete → a toast with Undo; clicking Undo restores the block.
9. Delete a block, then make another edit, then click the first toast's Undo → the block stays deleted and a "You've made changes since" toast appears.
10. Focus a block with Tab: ↑/↓ move by 15 minutes, ←/→ change days (focus stays on the block), Shift+↓ lengthens, Space toggles done, Enter opens the editor, Delete removes it.
11. ⌘Z / ⌘⇧Z (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y) walk the history; while typing in the title field, ⌘Z only undoes the text.
12. Overlapping blocks render side by side.
13. Reload → every block is still there; history is empty.
14. At 375px width: one day shows with ‹ › in the column header; › on the last day goes to the next week's first day; tapping empty space creates a block (touch emulation); vertical swipes scroll instead of dragging.
15. Toggle dark mode → block tints and text stay readable.

- [ ] **Step 9: Commit**

```bash
git add src/features/timeblock/components/grid-types.ts src/features/timeblock/components/grid-ops.ts src/features/timeblock/components/use-grid-drag.ts src/features/timeblock/components/block-item.tsx src/features/timeblock/components/block-popover.tsx src/features/timeblock/components/week-grid.tsx src/features/timeblock/components/timeblock-content.tsx
git commit -m "feat(timeblock): add interactive week grid with drag, keyboard, and block editor" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Stats panel and category management

**Files:**
- Create: `src/features/timeblock/components/stats-panel.tsx`
- Create: `src/features/timeblock/components/category-dialog.tsx`
- Modify: `src/features/timeblock/components/timeblock-content.tsx` (full replacement below)

**Interfaces:**
- Consumes: `Stats`/`Totals`, `formatDuration`, `categoryLook`, `PALETTE`/`PALETTE_KEYS`, `LIMITS`, `actions.addCategory/updateCategory/deleteCategory`, `NavIconButton`.
- Produces: `StatsPanel` (props `{ heading; stats; categories; showStatus; onManageCategories }`), `CategoryDialog` (props `{ open; onOpenChange }`).

- [ ] **Step 1: Stats panel**

`src/features/timeblock/components/stats-panel.tsx`:

```tsx
"use client";

import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import type { Stats, Totals } from "../lib/stats";
import { formatDuration } from "../lib/time";
import { categoryLook } from "../palette";
import { UNCATEGORIZED_ID, type Category } from "../types";

interface StatsPanelProps {
  heading: string;
  stats: Stats;
  categories: Category[];
  /** Week mode shows done/skipped; Templates mode shows planned only. */
  showStatus: boolean;
  onManageCategories: () => void;
}

export function StatsPanel({ heading, stats, categories, showStatus, onManageCategories }: StatsPanelProps) {
  const rows = [...categories.map((c) => c.id), UNCATEGORIZED_ID]
    .filter((id) => stats.byCategory[id])
    .map((id) => ({ look: categoryLook(categories, id), totals: stats.byCategory[id] }));
  const percent = stats.planned > 0 ? Math.round((stats.done / stats.planned) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-5">
        <div className="truncate text-xs uppercase tracking-wider text-muted-foreground">{heading}</div>
        {showStatus ? (
          <>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums tracking-tight">{formatDuration(stats.done)}</span>
              <span className="text-sm text-muted-foreground">done of {formatDuration(stats.planned)}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-1.5 text-xs tabular-nums text-muted-foreground">
              {percent}% done
              {stats.skipped > 0 && ` · ${formatDuration(stats.skipped)} skipped`}
            </div>
          </>
        ) : (
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums tracking-tight">{formatDuration(stats.planned)}</span>
            <span className="text-sm text-muted-foreground">planned</span>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blocks yet. Drag on the calendar to add one.</p>
        ) : (
          rows.map(({ look, totals }) => (
            <div key={look.id} style={{ "--c": look.hex } as CSSProperties}>
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-[var(--c)]" />
                  <span className="truncate">{look.name}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {showStatus
                    ? `${formatDuration(totals.done)} / ${formatDuration(totals.planned)}`
                    : formatDuration(totals.planned)}
                </span>
              </div>
              <CategoryBar totals={totals} total={stats.planned} showStatus={showStatus} />
            </div>
          ))
        )}
      </div>
      <div className="border-t p-3">
        <Button variant="outline" size="sm" className="w-full" onClick={onManageCategories}>
          Manage categories
        </Button>
      </div>
    </div>
  );
}

/** Week: done (solid) and skipped (hatched) within the category. Template: the category's share of the week. */
function CategoryBar({ totals, total, showStatus }: { totals: Totals; total: number; showStatus: boolean }) {
  const pct = (minutes: number, of: number) => `${of > 0 ? (minutes / of) * 100 : 0}%`;
  return (
    <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--c)_20%,transparent)]">
      {showStatus ? (
        <>
          <div className="h-full bg-[var(--c)]" style={{ width: pct(totals.done, totals.planned) }} />
          <div
            className="h-full"
            style={{
              width: pct(totals.skipped, totals.planned),
              backgroundImage: "repeating-linear-gradient(135deg, var(--c) 0 2px, transparent 2px 4px)",
            }}
          />
        </>
      ) : (
        <div className="h-full bg-[var(--c)]" style={{ width: pct(totals.planned, total) }} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Category dialog**

`src/features/timeblock/components/category-dialog.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import * as actions from "../actions";
import { LIMITS } from "../lib/ops";
import { PALETTE, PALETTE_KEYS } from "../palette";
import { useTimeblockStore } from "../store";
import type { Category } from "../types";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryDialog({ open, onOpenChange }: CategoryDialogProps) {
  const categories = useTimeblockStore((s) => s.categories);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Categories</DialogTitle>
          <DialogDescription>Blocks in a deleted category show as Uncategorized.</DialogDescription>
        </DialogHeader>
        <div className="-mx-1 max-h-[50vh] space-y-1.5 overflow-y-auto px-1 py-0.5">
          {categories.map((c) => (
            // Keyed by name too, so an undo or rename resets the field.
            <CategoryRow key={`${c.id}:${c.name}`} category={c} canDelete={categories.length > 1} />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={categories.length >= LIMITS.categories}
          onClick={() => actions.addCategory()}
        >
          <Plus /> Add category
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function CategoryRow({ category, canDelete }: { category: Category; canDelete: boolean }) {
  const [name, setName] = useState(category.name);
  const commitName = () => {
    if (name.trim()) actions.updateCategory(category.id, { name }, "Rename category");
    else setName(category.name);
  };
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label={`Change color of ${category.name}`}>
            <span className="size-3.5 rounded-full" style={{ backgroundColor: PALETTE[category.color] }} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="grid min-w-0 grid-cols-6 gap-1 p-2">
          {PALETTE_KEYS.map((key) => (
            <DropdownMenuItem
              key={key}
              aria-label={key}
              className={cn("size-7 justify-center p-0", category.color === key && "ring-2 ring-ring")}
              onSelect={() => actions.updateCategory(category.id, { color: key }, "Change color")}
            >
              <span className="size-4 rounded-full" style={{ backgroundColor: PALETTE[key] }} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Input
        value={name}
        maxLength={40}
        aria-label="Category name"
        className="h-8"
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${category.name}`}
        disabled={!canDelete}
        onClick={() => actions.deleteCategory(category.id)}
      >
        <Trash2 />
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Add the panel, mobile sheet, and dialog to the shell**

Replace `src/features/timeblock/components/timeblock-content.tsx` entirely with:

```tsx
"use client";

import { useMemo, useState } from "react";
import { ChartBar } from "lucide-react";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMac } from "@/hooks/use-is-mac";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNow } from "@/hooks/use-now";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import { computeStats } from "../lib/stats";
import {
  addDays,
  formatDuration,
  formatMonthDay,
  formatWeekRange,
  formatWeekday,
  fromDateKey,
  startOfWeek,
  toDateKey,
  weekDates,
} from "../lib/time";
import { useTimeblockStore } from "../store";
import { CategoryDialog } from "./category-dialog";
import { createWeekOps } from "./grid-ops";
import type { GridColumn } from "./grid-types";
import { timeblockShortcutSections } from "./shortcuts";
import { StatsPanel } from "./stats-panel";
import { NavIconButton, TimeblockNavbar, WeekNav, type Mode } from "./timeblock-navbar";
import { useTimeblockShortcuts } from "./use-timeblock-shortcuts";
import { WeekGrid } from "./week-grid";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function TimeblockContent() {
  const hydrated = useStoreHydration(useTimeblockStore);
  const weekStartsOn = useTimeblockStore((s) => s.weekStartsOn);
  const categories = useTimeblockStore((s) => s.categories);
  const blocksByDate = useTimeblockStore((s) => s.blocksByDate);
  const history = useTimeblockStore((s) => s.history);
  const undo = useTimeblockStore((s) => s.undo);
  const redo = useTimeblockStore((s) => s.redo);
  const modKey = useIsMac() ? "⌘" : "Ctrl";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const now = useNow();
  const today = toDateKey(new Date(now));

  const [mode, setMode] = useState<Mode>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [mobileDay, setMobileDay] = useState<number | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const weekStart = addDays(startOfWeek(today, weekStartsOn), weekOffset * 7);
  const dates = useMemo(() => weekDates(weekStart), [weekStart]);

  const columns = useMemo<GridColumn[]>(
    () =>
      dates.map((date) => ({
        key: date,
        label: formatWeekday(date),
        dayNumber: fromDateKey(date).getDate(),
        isToday: date === today,
        blocks: blocksByDate[date] ?? [],
      })),
    [dates, today, blocksByDate],
  );
  const ops = useMemo(() => createWeekOps(dates), [dates]);

  const categoryIds = useMemo(() => new Set(categories.map((c) => c.id)), [categories]);
  const stats = useMemo(
    () => computeStats(columns.flatMap((c) => c.blocks), categoryIds),
    [columns, categoryIds],
  );

  const dayIndex = mobileDay ?? Math.max(dates.indexOf(today), 0);
  const visible = useMemo(() => (isDesktop ? ALL_DAYS : [dayIndex]), [isDesktop, dayIndex]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setMobileDay(null);
  };
  const goToday = () => {
    switchMode("week");
    setWeekOffset(0);
  };
  const stepWeek = (delta: number) => setWeekOffset((offset) => offset + delta);
  const stepDay = (delta: 1 | -1) => {
    const next = dayIndex + delta;
    if (next >= 0 && next <= 6) {
      setMobileDay(next);
      return;
    }
    stepWeek(delta); // wrap into the neighboring week
    setMobileDay((next + 7) % 7);
  };
  const openCategories = () => {
    setStatsOpen(false);
    setCategoriesOpen(true);
  };

  useTimeblockShortcuts({
    onToday: goToday,
    onPrevWeek: () => {
      if (mode === "week") stepWeek(-1);
    },
    onNextWeek: () => {
      if (mode === "week") stepWeek(1);
    },
    onUndo: undo,
    onRedo: redo,
    onShowShortcuts: () => setShowShortcuts(true),
  });

  if (!hydrated) return <FullscreenLoading />;

  const panel = (
    <StatsPanel
      heading={weekOffset === 0 ? "This week" : `Week of ${formatMonthDay(dates[0])}`}
      stats={stats}
      categories={categories}
      showStatus
      onManageCategories={openCategories}
    />
  );

  return (
    <div className="flex h-dvh flex-col">
      <TimeblockNavbar
        mode={mode}
        onModeChange={switchMode}
        center={
          mode === "week" ? (
            <WeekNav
              label={formatWeekRange(dates)}
              isCurrentWeek={weekOffset === 0}
              onPrev={() => stepWeek(-1)}
              onNext={() => stepWeek(1)}
              onToday={goToday}
            />
          ) : null
        }
        actions={
          <NavIconButton label="Stats" onClick={() => setStatsOpen(true)} className="md:hidden">
            <ChartBar className="h-3.5 w-3.5" />
          </NavIconButton>
        }
        undoLabel={history.past.at(-1)?.label}
        redoLabel={history.future.at(-1)?.label}
        onUndo={undo}
        onRedo={redo}
        modKey={modKey}
        onShowShortcuts={() => setShowShortcuts(true)}
      />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          {mode === "week" && (
            <WeekGrid
              columns={columns}
              visible={visible}
              ops={ops}
              categories={categories}
              showStatus
              now={now}
              scrollKey={`week:${weekStart}`}
              onPrevDay={() => stepDay(-1)}
              onNextDay={() => stepDay(1)}
            />
          )}
        </main>
        <aside className="hidden w-64 shrink-0 border-l md:block">{panel}</aside>
      </div>
      <div className="flex items-center gap-3 border-t bg-background px-4 py-1.5 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {stats.count} {stats.count === 1 ? "block" : "blocks"} · {formatDuration(stats.planned)} planned ·{" "}
          {formatDuration(stats.done)} done · {formatDuration(stats.skipped)} skipped
        </span>
        <span className="flex-1" />
        <span className="opacity-60">Saved</span>
      </div>

      <Sheet open={statsOpen} onOpenChange={setStatsOpen}>
        <SheetContent side="right" className="w-72 gap-0 p-0 sm:max-w-72">
          <SheetTitle className="sr-only">Stats</SheetTitle>
          {panel}
        </SheetContent>
      </Sheet>
      <CategoryDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        description="Available keyboard shortcuts for Timeblock."
        sections={timeblockShortcutSections(modKey)}
        maxWidth={440}
      />
    </div>
  );
}
```

- [ ] **Step 4: Static checks**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint && pnpm test`
Expected: all pass.

- [ ] **Step 5: Verify in the browser**

At `http://localhost:3000/timeblock`:
1. The right panel shows "This week", "Xh done of Yh", the completion bar, and one row per category with time (done solid, skipped hatched); it updates live as blocks change status.
2. Navigate to another week → the heading reads "Week of …".
3. Manage categories → rename (blur or Enter commits; empty restores), recolor via the swatch menu, add (gets the next unused color), delete → toast with Undo; blocks of a deleted category render gray and count under "Uncategorized"; with one category left, delete is disabled.
4. Undo/redo in the toolbar covers category changes.
5. At 375px: the panel is hidden; the chart button opens it in a Sheet; "Manage categories" closes the Sheet and opens the dialog.

- [ ] **Step 6: Commit**

```bash
git add src/features/timeblock/components/stats-panel.tsx src/features/timeblock/components/category-dialog.tsx src/features/timeblock/components/timeblock-content.tsx
git commit -m "feat(timeblock): add stats panel and category management" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Templates mode and week menus

**Files:**
- Modify: `src/features/timeblock/components/grid-ops.ts` (append `createTemplateOps`)
- Create: `src/features/timeblock/components/template-controls.tsx`
- Create: `src/features/timeblock/components/template-dialogs.tsx`
- Modify: `src/features/timeblock/components/timeblock-content.tsx` (full replacement below)

**Interfaces:**
- Consumes: `actions.*Template*`, `actions.clearWeek`, `weekdayOrder`, `weekdayLabel`, `isoWeekday`, `formatMonthDay`, store `templates`/`setWeekStartsOn`.
- Produces: `createTemplateOps(templateId, weekdays): GridOps`; `TemplatePicker({ templates; value; onChange; onNew })`, `ApplyTemplateMenu({ templates; onApply; onCreate })`, `MoreMenu({ mode; weekHasBlocks; hasTemplate; weekStartsOn; onSaveWeek; onClearWeek; onNewTemplate; onRenameTemplate; onDeleteTemplate; onWeekStartsOnChange })`, `TemplatesEmpty({ onCreate })`; `NameDialog({ title; description; placeholder; initialName; confirmLabel; onSubmit; onCancel })`, `ApplyTemplateDialog({ template; weekLabel; weekHasBlocks; onApply; onCancel })`, `DeleteTemplateDialog({ template; onConfirm; onCancel })`.

- [ ] **Step 1: Templates-mode grid ops**

Append to `src/features/timeblock/components/grid-ops.ts` (and add the `Weekday` import at the top):

```ts
import type { Weekday } from "../types";
```

```ts
export function createTemplateOps(templateId: string, weekdays: readonly Weekday[]): GridOps {
  return {
    create(col, start, end) {
      const id = actions.newId();
      const ok = actions.addTemplateBlock(templateId, {
        id,
        title: "",
        categoryId: actions.defaultCategoryId(),
        start,
        end,
        weekday: weekdays[col],
      });
      return ok ? id : null;
    },
    // Template blocks have no status.
    update: (_col, id, { status: _, ...patch }, label) =>
      actions.updateTemplateBlock(templateId, id, patch, label),
    move: (_fromCol, id, toCol, start, end) =>
      actions.updateTemplateBlock(templateId, id, { weekday: weekdays[toCol], start, end }, "Move block"),
    remove: (_col, id) => actions.deleteTemplateBlock(templateId, id),
    duplicate: (_col, id) => actions.duplicateTemplateBlock(templateId, id),
  };
}
```

- [ ] **Step 2: Template controls**

`src/features/timeblock/components/template-controls.tsx`:

```tsx
"use client";

import { Ellipsis, Eraser, LayoutTemplate, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Template, WeekStartsOn } from "../types";
import type { Mode } from "./timeblock-navbar";

interface TemplatePickerProps {
  templates: Template[];
  value: string | null;
  onChange: (id: string) => void;
  onNew: () => void;
}

export function TemplatePicker({ templates, value, onChange, onNew }: TemplatePickerProps) {
  if (templates.length === 0) {
    return (
      <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={onNew}>
        <Plus className="h-3.5 w-3.5" /> New template
      </Button>
    );
  }
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-full text-xs data-[size=sm]:h-7 md:w-48" aria-label="Template">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {templates.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface ApplyTemplateMenuProps {
  templates: Template[];
  onApply: (template: Template) => void;
  onCreate: () => void;
}

/** `modal={false}` so a Dialog opened from an item doesn't fight the menu's focus trap. */
export function ApplyTemplateMenu({ templates, onApply, onCreate }: ApplyTemplateMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" aria-label="Apply template">
          <LayoutTemplate className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Apply template</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Apply to this week
        </DropdownMenuLabel>
        {templates.length === 0 ? (
          <DropdownMenuItem onSelect={onCreate}>
            <Plus /> Create a template…
          </DropdownMenuItem>
        ) : (
          templates.map((t) => (
            <DropdownMenuItem key={t.id} onSelect={() => onApply(t)}>
              <span className="truncate">{t.name}</span>
              <span className="ml-auto text-xs tabular-nums text-muted-foreground">{t.blocks.length}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface MoreMenuProps {
  mode: Mode;
  weekHasBlocks: boolean;
  hasTemplate: boolean;
  weekStartsOn: WeekStartsOn;
  onSaveWeek: () => void;
  onClearWeek: () => void;
  onNewTemplate: () => void;
  onRenameTemplate: () => void;
  onDeleteTemplate: () => void;
  onWeekStartsOnChange: (value: WeekStartsOn) => void;
}

export function MoreMenu({
  mode,
  weekHasBlocks,
  hasTemplate,
  weekStartsOn,
  onSaveWeek,
  onClearWeek,
  onNewTemplate,
  onRenameTemplate,
  onDeleteTemplate,
  onWeekStartsOnChange,
}: MoreMenuProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline" className="h-7 w-7" aria-label="More actions">
          <Ellipsis className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {mode === "week" ? (
          <>
            <DropdownMenuItem disabled={!weekHasBlocks} onSelect={onSaveWeek}>
              <LayoutTemplate /> Save week as template…
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!weekHasBlocks} variant="destructive" onSelect={onClearWeek}>
              <Eraser /> Clear week
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onSelect={onNewTemplate}>
              <Plus /> New template…
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!hasTemplate} onSelect={onRenameTemplate}>
              <Pencil /> Rename template…
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!hasTemplate} variant="destructive" onSelect={onDeleteTemplate}>
              <Trash2 /> Delete template…
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Week starts on</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={String(weekStartsOn)}
          onValueChange={(v) => onWeekStartsOnChange(v === "0" ? 0 : 1)}
        >
          <DropdownMenuRadioItem value="1">Monday</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="0">Sunday</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TemplatesEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <Empty className="flex-1">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LayoutTemplate />
        </EmptyMedia>
        <EmptyTitle>No templates yet</EmptyTitle>
        <EmptyDescription>
          Design a typical week once — deep work, meetings, workouts — then apply it to any week. You can also save a
          week you&apos;ve already planned.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" onClick={onCreate}>
          <Plus /> New template
        </Button>
      </EmptyContent>
    </Empty>
  );
}
```

- [ ] **Step 3: Template dialogs**

`src/features/timeblock/components/template-dialogs.tsx`:

```tsx
"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Template } from "../types";

const blocksLabel = (n: number) => `${n} ${n === 1 ? "block" : "blocks"}`;

interface NameDialogProps {
  title: string;
  description: string;
  placeholder: string;
  initialName: string;
  confirmLabel: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/** Mount only while open so the field starts fresh each time. */
export function NameDialog({
  title,
  description,
  placeholder,
  initialName,
  confirmLabel,
  onSubmit,
  onCancel,
}: NameDialogProps) {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (trimmed) onSubmit(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Input
            value={name}
            placeholder={placeholder}
            maxLength={60}
            aria-label="Template name"
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!trimmed}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ApplyTemplateDialogProps {
  template: Template;
  weekLabel: string;
  weekHasBlocks: boolean;
  onApply: (how: "replace" | "add") => void;
  onCancel: () => void;
}

export function ApplyTemplateDialog({ template, weekLabel, weekHasBlocks, onApply, onCancel }: ApplyTemplateDialogProps) {
  const count = blocksLabel(template.blocks.length);
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply “{template.name}”</DialogTitle>
          <DialogDescription>
            {weekHasBlocks
              ? `${weekLabel} already has blocks. Add the template's ${count} alongside them, or replace the week.`
              : `Add ${count} to ${weekLabel}.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {weekHasBlocks && (
            <Button variant="outline" onClick={() => onApply("add")}>
              Add to week
            </Button>
          )}
          <Button onClick={() => onApply(weekHasBlocks ? "replace" : "add")}>
            {weekHasBlocks ? "Replace week" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteTemplateDialogProps {
  template: Template;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteTemplateDialog({ template, onConfirm, onCancel }: DeleteTemplateDialogProps) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{template.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Weeks you already applied it to keep their blocks. You can undo this.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 4: Final page shell with Templates mode**

Replace `src/features/timeblock/components/timeblock-content.tsx` entirely with:

```tsx
"use client";

import { useMemo, useState } from "react";
import { ChartBar } from "lucide-react";
import { FullscreenLoading } from "@/components/fullscreen-loading";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMac } from "@/hooks/use-is-mac";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useNow } from "@/hooks/use-now";
import { useStoreHydration } from "@/hooks/use-store-hydration";
import * as actions from "../actions";
import { computeStats } from "../lib/stats";
import {
  addDays,
  formatDuration,
  formatMonthDay,
  formatWeekRange,
  formatWeekday,
  fromDateKey,
  isoWeekday,
  startOfWeek,
  toDateKey,
  weekDates,
  weekdayLabel,
  weekdayOrder,
} from "../lib/time";
import { useTimeblockStore } from "../store";
import type { Template } from "../types";
import { CategoryDialog } from "./category-dialog";
import { createTemplateOps, createWeekOps } from "./grid-ops";
import type { GridColumn } from "./grid-types";
import { timeblockShortcutSections } from "./shortcuts";
import { StatsPanel } from "./stats-panel";
import { ApplyTemplateMenu, MoreMenu, TemplatePicker, TemplatesEmpty } from "./template-controls";
import { ApplyTemplateDialog, DeleteTemplateDialog, NameDialog } from "./template-dialogs";
import { NavIconButton, TimeblockNavbar, WeekNav, type Mode } from "./timeblock-navbar";
import { useTimeblockShortcuts } from "./use-timeblock-shortcuts";
import { WeekGrid } from "./week-grid";

type TemplateDialog =
  | { kind: "new" }
  | { kind: "save-week" }
  | { kind: "apply" | "rename" | "delete"; template: Template }
  | null;

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function TimeblockContent() {
  const hydrated = useStoreHydration(useTimeblockStore);
  const weekStartsOn = useTimeblockStore((s) => s.weekStartsOn);
  const categories = useTimeblockStore((s) => s.categories);
  const blocksByDate = useTimeblockStore((s) => s.blocksByDate);
  const templates = useTimeblockStore((s) => s.templates);
  const history = useTimeblockStore((s) => s.history);
  const undo = useTimeblockStore((s) => s.undo);
  const redo = useTimeblockStore((s) => s.redo);
  const setWeekStartsOn = useTimeblockStore((s) => s.setWeekStartsOn);
  const modKey = useIsMac() ? "⌘" : "Ctrl";
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const now = useNow();
  const today = toDateKey(new Date(now));

  const [mode, setMode] = useState<Mode>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [mobileDay, setMobileDay] = useState<number | null>(null);
  const [dialog, setDialog] = useState<TemplateDialog>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const weekStart = addDays(startOfWeek(today, weekStartsOn), weekOffset * 7);
  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const weekdays = useMemo(() => weekdayOrder(weekStartsOn), [weekStartsOn]);
  const activeTemplate = templates.find((t) => t.id === templateId) ?? templates[0] ?? null;
  const activeTemplateId = activeTemplate?.id ?? null;

  const weekColumns = useMemo<GridColumn[]>(
    () =>
      dates.map((date) => ({
        key: date,
        label: formatWeekday(date),
        dayNumber: fromDateKey(date).getDate(),
        isToday: date === today,
        blocks: blocksByDate[date] ?? [],
      })),
    [dates, today, blocksByDate],
  );
  const templateColumns = useMemo<GridColumn[]>(
    () =>
      weekdays.map((weekday) => ({
        key: `weekday-${weekday}`,
        label: weekdayLabel(weekday),
        isToday: false,
        blocks: (activeTemplate?.blocks ?? [])
          .filter((b) => b.weekday === weekday)
          .map(({ id, title, categoryId, start, end }) => ({
            id,
            title,
            categoryId,
            start,
            end,
            status: "planned" as const,
          })),
      })),
    [weekdays, activeTemplate],
  );
  const columns = mode === "week" ? weekColumns : templateColumns;
  const ops = useMemo(
    () =>
      mode === "week"
        ? createWeekOps(dates)
        : activeTemplateId
          ? createTemplateOps(activeTemplateId, weekdays)
          : null,
    [mode, dates, activeTemplateId, weekdays],
  );

  const categoryIds = useMemo(() => new Set(categories.map((c) => c.id)), [categories]);
  const stats = useMemo(
    () => computeStats(columns.flatMap((c) => c.blocks), categoryIds),
    [columns, categoryIds],
  );
  const weekHasBlocks = weekColumns.some((c) => c.blocks.length > 0);

  const defaultDay =
    mode === "week" ? Math.max(dates.indexOf(today), 0) : weekdays.indexOf(isoWeekday(today));
  const dayIndex = mobileDay ?? defaultDay;
  const visible = useMemo(() => (isDesktop ? ALL_DAYS : [dayIndex]), [isDesktop, dayIndex]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setMobileDay(null);
  };
  const goToday = () => {
    switchMode("week");
    setWeekOffset(0);
  };
  const stepWeek = (delta: number) => setWeekOffset((offset) => offset + delta);
  const stepDay = (delta: 1 | -1) => {
    const next = dayIndex + delta;
    if (next >= 0 && next <= 6) {
      setMobileDay(next);
      return;
    }
    if (mode === "week") stepWeek(delta); // wrap into the neighboring week
    setMobileDay((next + 7) % 7);
  };
  const openCategories = () => {
    setStatsOpen(false);
    setCategoriesOpen(true);
  };
  const closeDialog = () => setDialog(null);

  useTimeblockShortcuts({
    onToday: goToday,
    onPrevWeek: () => {
      if (mode === "week") stepWeek(-1);
    },
    onNextWeek: () => {
      if (mode === "week") stepWeek(1);
    },
    onUndo: undo,
    onRedo: redo,
    onShowShortcuts: () => setShowShortcuts(true),
  });

  if (!hydrated) return <FullscreenLoading />;

  const weekLabel = formatWeekRange(dates);
  const panel = (
    <StatsPanel
      heading={
        mode === "week"
          ? weekOffset === 0
            ? "This week"
            : `Week of ${formatMonthDay(dates[0])}`
          : (activeTemplate?.name ?? "Template")
      }
      stats={stats}
      categories={categories}
      showStatus={mode === "week"}
      onManageCategories={openCategories}
    />
  );

  return (
    <div className="flex h-dvh flex-col">
      <TimeblockNavbar
        mode={mode}
        onModeChange={switchMode}
        center={
          mode === "week" ? (
            <WeekNav
              label={weekLabel}
              isCurrentWeek={weekOffset === 0}
              onPrev={() => stepWeek(-1)}
              onNext={() => stepWeek(1)}
              onToday={goToday}
            />
          ) : (
            <TemplatePicker
              templates={templates}
              value={activeTemplateId}
              onChange={setTemplateId}
              onNew={() => setDialog({ kind: "new" })}
            />
          )
        }
        actions={
          <>
            {mode === "week" && (
              <ApplyTemplateMenu
                templates={templates}
                onApply={(template) => setDialog({ kind: "apply", template })}
                onCreate={() => {
                  switchMode("templates");
                  setDialog({ kind: "new" });
                }}
              />
            )}
            <MoreMenu
              mode={mode}
              weekHasBlocks={weekHasBlocks}
              hasTemplate={activeTemplate !== null}
              weekStartsOn={weekStartsOn}
              onSaveWeek={() => setDialog({ kind: "save-week" })}
              onClearWeek={() => actions.clearWeek(dates)}
              onNewTemplate={() => setDialog({ kind: "new" })}
              onRenameTemplate={() => {
                if (activeTemplate) setDialog({ kind: "rename", template: activeTemplate });
              }}
              onDeleteTemplate={() => {
                if (activeTemplate) setDialog({ kind: "delete", template: activeTemplate });
              }}
              onWeekStartsOnChange={setWeekStartsOn}
            />
            <NavIconButton label="Stats" onClick={() => setStatsOpen(true)} className="md:hidden">
              <ChartBar className="h-3.5 w-3.5" />
            </NavIconButton>
          </>
        }
        undoLabel={history.past.at(-1)?.label}
        redoLabel={history.future.at(-1)?.label}
        onUndo={undo}
        onRedo={redo}
        modKey={modKey}
        onShowShortcuts={() => setShowShortcuts(true)}
      />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          {ops ? (
            <WeekGrid
              columns={columns}
              visible={visible}
              ops={ops}
              categories={categories}
              showStatus={mode === "week"}
              now={now}
              scrollKey={mode === "week" ? `week:${weekStart}` : `template:${activeTemplateId}`}
              onPrevDay={() => stepDay(-1)}
              onNextDay={() => stepDay(1)}
            />
          ) : (
            <TemplatesEmpty onCreate={() => setDialog({ kind: "new" })} />
          )}
        </main>
        <aside className="hidden w-64 shrink-0 border-l md:block">{panel}</aside>
      </div>
      <div className="flex items-center gap-3 border-t bg-background px-4 py-1.5 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {stats.count} {stats.count === 1 ? "block" : "blocks"} · {formatDuration(stats.planned)} planned
          {mode === "week" && ` · ${formatDuration(stats.done)} done · ${formatDuration(stats.skipped)} skipped`}
        </span>
        <span className="flex-1" />
        <span className="opacity-60">Saved</span>
      </div>

      <Sheet open={statsOpen} onOpenChange={setStatsOpen}>
        <SheetContent side="right" className="w-72 gap-0 p-0 sm:max-w-72">
          <SheetTitle className="sr-only">Stats</SheetTitle>
          {panel}
        </SheetContent>
      </Sheet>
      <CategoryDialog open={categoriesOpen} onOpenChange={setCategoriesOpen} />
      {dialog?.kind === "new" && (
        <NameDialog
          title="New template"
          description="A reusable week you can apply to any week."
          placeholder="Work week"
          initialName=""
          confirmLabel="Create"
          onCancel={closeDialog}
          onSubmit={(name) => {
            const id = actions.createTemplate(name);
            if (id) {
              setTemplateId(id);
              switchMode("templates");
            }
            closeDialog();
          }}
        />
      )}
      {dialog?.kind === "save-week" && (
        <NameDialog
          title="Save week as template"
          description={`Saves the blocks of ${weekLabel} as a reusable template.`}
          placeholder="Work week"
          initialName={`Week of ${formatMonthDay(dates[0])}`}
          confirmLabel="Save"
          onCancel={closeDialog}
          onSubmit={(name) => {
            actions.saveWeekAsTemplate(dates, name);
            closeDialog();
          }}
        />
      )}
      {dialog?.kind === "rename" && (
        <NameDialog
          title="Rename template"
          description="Weeks it was applied to are not affected."
          placeholder="Work week"
          initialName={dialog.template.name}
          confirmLabel="Rename"
          onCancel={closeDialog}
          onSubmit={(name) => {
            actions.renameTemplate(dialog.template.id, name);
            closeDialog();
          }}
        />
      )}
      {dialog?.kind === "apply" && (
        <ApplyTemplateDialog
          template={dialog.template}
          weekLabel={weekLabel}
          weekHasBlocks={weekHasBlocks}
          onCancel={closeDialog}
          onApply={(how) => {
            actions.applyTemplate(dialog.template.id, dates, how);
            closeDialog();
          }}
        />
      )}
      {dialog?.kind === "delete" && (
        <DeleteTemplateDialog
          template={dialog.template}
          onCancel={closeDialog}
          onConfirm={() => {
            actions.deleteTemplate(dialog.template.id);
            closeDialog();
          }}
        />
      )}
      <ShortcutsDialog
        open={showShortcuts}
        onOpenChange={setShowShortcuts}
        description="Available keyboard shortcuts for Timeblock."
        sections={timeblockShortcutSections(modKey)}
        maxWidth={440}
      />
    </div>
  );
}
```

- [ ] **Step 5: Static checks**

Run: `pnpm exec tsc --noEmit -p . && pnpm lint && pnpm test`
Expected: all pass.

- [ ] **Step 6: Verify in the browser**

At `http://localhost:3000/timeblock`:
1. Templates mode with no templates → the empty state; "New template" opens the name dialog; Create → the template grid shows weekday headers (no dates, no now-line, no ✓ buttons, no status in the editor).
2. Draw blocks in the template; move them across weekdays; the panel shows "Xh planned" per category; the status bar shows count + planned only.
3. ⋯ → Rename / Delete (AlertDialog; Undo restores it). Create a second template; the picker switches between them.
4. Week mode → "Apply template" lists templates with block counts. Empty week: the dialog offers "Apply". A week with blocks offers "Add to week" and "Replace week"; Replace shows a toast with Undo that restores the original blocks. Applied blocks are planned and land on the matching weekdays.
5. ⋯ → "Save week as template…" (disabled on an empty week) suggests "Week of Sep 28"; saving shows a success toast and the template appears in Templates mode.
6. ⋯ → "Clear week" (disabled when empty) → toast with Undo.
7. ⋯ → Week starts on Sunday → columns reorder Sun–Sat in both modes and the range label updates; applying a template still puts Monday blocks on Monday.
8. Apply menu with zero templates → "Create a template…" switches to Templates mode with the name dialog open.
9. At 375px: the template picker wraps to the second row; ‹ › day navigation wraps within the template week.

- [ ] **Step 7: Commit**

```bash
git add src/features/timeblock/components/grid-ops.ts src/features/timeblock/components/template-controls.tsx src/features/timeblock/components/template-dialogs.tsx src/features/timeblock/components/timeblock-content.tsx
git commit -m "feat(timeblock): add templates mode, apply/save templates, and week menu" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: OpenGraph image, docs, and final verification

**Files:**
- Create: `src/app/timeblock/opengraph-image.tsx`
- Modify: `CLAUDE.md` (accent color list)

**Interfaces:**
- Consumes: `renderOgImage`, `OG_SIZE`, `OG_CONTENT_TYPE` from `src/app/_og/frame.tsx`.

- [ ] **Step 1: OG image**

`src/app/timeblock/opengraph-image.tsx`:

```tsx
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_og/frame";

export const alt = "Timeblock | UseTiny";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const ACCENT = "#84cc16";

const WORDMARK_STYLE = {
  fontSize: 176,
  fontWeight: 900,
  letterSpacing: "-0.06em",
  lineHeight: 1,
} as const;

export default function Image() {
  return renderOgImage({
    tagline: "Plan every hour. Skip the calendar app.",
    children: (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            alignItems: "center",
            gap: 18,
            padding: "16px 24px 16px 20px",
            borderRadius: 14,
            borderLeft: `8px solid ${ACCENT}`,
            backgroundColor: "rgba(132, 204, 22, 0.14)",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Geist Mono",
              fontSize: 30,
              fontWeight: 500,
              color: "#ecfccb",
              letterSpacing: "-0.02em",
            }}
          >
            9:00 – 11:00
          </div>
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ACCENT}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginTop: 40 }}>
          <div style={{ ...WORDMARK_STYLE, color: "#fafafa" }}>Timeblock</div>
          <div style={{ ...WORDMARK_STYLE, color: ACCENT }}>.</div>
        </div>
      </div>
    ),
  });
}
```

- [ ] **Step 2: Check the OG render**

Run: `curl -s -o /private/tmp/claude-501/-Users-jay-Codes-jaycho1214-usetiny/91adf00a-1308-424e-8f8f-f5bb7346feb4/scratchpad/timeblock-og.png -w "%{http_code} %{content_type}\n" http://localhost:3000/timeblock/opengraph-image`
Expected: `200 image/png`. Open the PNG (Read tool) and confirm: dark background, lime chip with `9:00 – 11:00` and a check, "Timeblock." wordmark fully inside the frame (not clipped), the tagline, and `usetiny.app` bottom-right. If the wordmark clips, lower `fontSize` in steps of 8 until it fits.

- [ ] **Step 3: Document the accent color**

In `CLAUDE.md`, in the **Tool accent colors** line, append after `PDF Editor \`#f43f5e\``:

```
 · Timeblock `#84cc16`
```

so the line ends `… · PDF Editor \`#f43f5e\` · Timeblock \`#84cc16\`.`

- [ ] **Step 4: Full verification**

Run each and confirm:
- `pnpm test` → all suites pass.
- `pnpm lint` → no errors or warnings in `src/features/timeblock`, `src/hooks`, `src/app/timeblock`.
- `pnpm exec tsc --noEmit -p .` → exit 0.
- `pnpm build` → succeeds; `/timeblock` and `/timeblock/opengraph-image` appear in the route list.
- `curl -s http://localhost:3000/sitemap.xml | grep timeblock` → `https://usetiny.app/timeblock`.
- `curl -s http://localhost:3000/timeblock | grep -o 'application/ld+json'` → present.

- [ ] **Step 5: End-to-end walkthrough (agent-browser, :3000)**

Clear the `timeblock-storage` localStorage key, reload, then:
1. Plan a week: four blocks across three categories, mark two done and one skipped; the panel and status bar agree.
2. Save the week as a template, go to next week, apply it (Add), undo, apply it (Replace), undo.
3. Edit the template (move a block to another weekday), apply again — the change is reflected.
4. Switch the week start to Sunday and back.
5. Reload: blocks, templates, categories, and the week start setting persist; undo history is empty.
6. Light and dark themes; widths 1440, 1024, 768, 375.
7. Console has no errors or React warnings.

- [ ] **Step 6: Commit**

```bash
git add src/app/timeblock/opengraph-image.tsx CLAUDE.md
git commit -m "feat(timeblock): add OpenGraph image and document accent color" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
