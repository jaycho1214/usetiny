# Timeblock — weekly time-blocking planner

**Date:** 2026-09-30
**Route:** `/timeblock`
**Scope:** New tool. Dated weekly calendar with drag-to-create time blocks,
multiple named templates, category time totals, plan-vs-actual via block
status, and full undo/redo.

## Goal

Let a user plan their week as colored time blocks on a Mon–Sun grid, reuse
typical weeks via named templates, and see where their time goes — planned
hours vs. hours actually done — per category. Everything runs in the browser
and persists to localStorage; no accounts, no sync.

## Decisions (agreed during brainstorming)

| Topic            | Decision                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Week model       | Dated weeks (prev/next navigation) **and** templates                                      |
| Templates        | Multiple named templates, applied manually (Replace or Add)                               |
| Visualization    | Colored grid + category totals + plan vs actual                                           |
| "Actual"         | Block status `planned → done / skipped`; actual = hours of `done` blocks                  |
| Grid engine      | Custom grid + native Pointer Events (no calendar or DnD library)                          |
| Undo/redo        | Full history stack in the store; ⌘Z / ⌘⇧Z, toolbar buttons, and toast "Undo" actions      |
| Out of scope     | Google/ICS import-export, recurrence rules, reminders/notifications, cross-midnight blocks |

## Layout & interaction

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ UseTiny  Timeblock  [Week│Templates]  ‹ Sep 28 – Oct 4, 2026 › Today  ↶ ↷  [Apply template] [⋯] [⌨] │
├────────────────────────────────────────────────────────────────┬─────────────────────┤
│        MON 28  TUE 29  WED 30  THU 1   FRI 2   SAT 3   SUN 4    │ THIS WEEK           │
│  7 AM  ┃Deep   ┃Gym ✓                                           │ 18.5h done of 32h   │
│  8 AM  ┃work   ┃Deep work                                       │ ███████░░░          │
│  9 AM  ┃Standup ┃1:1                                            │ ● Deep work  6/10h  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━ now ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ● Meetings   3/4h   │
│ 10 AM         ┃Admin (faded, struck = skipped)                  │ [Manage categories] │
├─────────────────────────────────────────────────────────────────┴─────────────────────┤
│ 23 blocks · 32h planned · 18.5h done · 2 skipped                                Saved │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Page shell

Standard UseTiny layout: navbar → main (grid + right panel) → status bar,
matching Word Counter / Notepad. `h-dvh flex flex-col`.

### Navbar

- `UseTiny` home link + `Timeblock` label (hidden below `sm`).
- **Mode switch**: shadcn `ButtonGroup`, `Week | Templates` (active =
  `variant="default"`, inactive = `variant="outline"`).
- **Week mode**: `‹` / `›` week buttons, date-range label (e.g.
  "Sep 28 – Oct 4, 2026"), `Today` button, **Apply template** dropdown (lists
  templates; picking one opens the apply dialog; with no templates it shows a
  single "Create a template" item that switches to Templates mode), `⋯` menu
  with _Save week as template_ and _Clear week_ (both disabled when the week
  has no blocks), _Week starts on: Monday / Sunday_.
- **Templates mode**: template picker (`Select`) replaces the date controls;
  `⋯` menu with _New template_, _Rename_, _Delete_ (Delete uses `AlertDialog`).
- **Undo / Redo** icon buttons (disabled when their stack is empty; tooltip
  shows the action label, e.g. "Undo Move block", plus the shortcut).
- **Stats** button (below `md` only) opens the stats panel in a `Sheet`.
- Keyboard-shortcuts button (`?`), same pattern as other tools.

### Grid

- Seven day columns plus a left time gutter; all 24 hours, vertically
  scrollable. On mount (and on week/mode change) scroll so 7 AM is at the top.
- 15-minute snap. Hour height is a single constant (48px → 12px per slot).
- Week mode: column headers show weekday + date; today's column header is
  highlighted and a "now" line crosses today's column (updates every minute).
- Templates mode: headers show weekday only; no now line; no status UI.
- Column order follows `settings.weekStartsOn` (Monday or Sunday).
- Below `md`: a single day column with `‹` / `›` day navigation in a
  sub-header; day nav wraps into the previous/next week at the edges.

### Blocks

- Visual by status (color from the block's category):
  - **Planned**: light tint of the category color, solid left border.
  - **Done**: solid fill, check icon.
  - **Skipped**: reduced opacity, title struck through.
  - Template blocks always render as planned.
- Content: title (or "Untitled"), time range when height allows (≥ 30 min).
- Overlapping blocks within a day render side by side (column layout from
  `lib/layout.ts`), like Google Calendar.
- Unknown `categoryId` (category deleted) renders as gray "Uncategorized".

### Pointer interactions (mouse / pen)

Implemented with pointer capture in `use-grid-drag.ts`. During a gesture the
preview lives in component state; the store receives **one commit on
pointer-up**.

- **Drag on empty space** → create a block spanning the dragged range (upward
  drags normalized), using the last-used category; the block popover opens
  with the title input focused.
- **Click on empty space** (no movement past a small threshold) → create a
  1-hour block starting at the clicked slot (clamped to end ≤ 24:00), popover
  opens.
- **Drag block body** → move; horizontal movement changes day within the
  visible week, vertical movement changes time; duration preserved.
- **Drag top/bottom edge** → resize that edge; minimum 15 minutes.
- **Hover ✓ button** on a block → toggle `done` in one click.
- **Click block** → open block popover.
- All drags clamp to 0:00–24:00; no block crosses midnight.

### Touch

Tap-only (drag would fight grid scrolling): tap empty slot → create 1-hour
block + popover; tap block → popover. The popover's start/end selects cover
move and resize.

### Block popover

Title input, category swatches, start and end `Select`s (15-minute steps,
end > start), status `ButtonGroup` (Planned / Done / Skipped; hidden in
Templates mode), Duplicate (places the copy directly after the original; if it would pass
24:00 it is shifted up to end at 24:00 and may overlap), Delete. Title edits are held locally and committed on
blur, Enter, or popover close — one history entry per edit session.

### Keyboard

- Focused block: `↑`/`↓` move 15 min, `←`/`→` move one day,
  `Shift+↑`/`Shift+↓` resize the end by 15 min, `Enter` opens popover,
  `Space` toggles done (week mode), `Delete`/`Backspace` removes.
- Global: `T` today, `[` / `]` previous / next week, `⌘Z` / `Ctrl+Z` undo,
  `⌘⇧Z` / `Ctrl+Shift+Z` / `Ctrl+Y` redo, `?` shortcuts dialog.
- Global shortcuts are ignored while focus is in an input, textarea, select,
  or contenteditable.

### Right panel (desktop) / Sheet (mobile)

- Week mode: headline "18.5h done of 32h", completion bar; one row per
  category that has time this week: color dot, name, stacked bar
  (done solid / skipped hatched / remaining tint), "done / planned h".
- Templates mode: planned hours per category only.
- **Manage categories** button → category dialog.

### Status bar

Week mode: `N blocks · Xh planned · Yh done · Z skipped` and `Saved`.
Templates mode: `N blocks · Xh planned`.

### Destructive actions

No confirm dialogs for reversible actions. Deleting a block, clearing a week,
deleting a category, and applying a template with **Replace** each show a
Sonner toast with an **Undo** action that calls the store's `undo()`.
Deleting a template uses `AlertDialog` (it is still undoable).

## Data model

```ts
type BlockStatus = "planned" | "done" | "skipped";

interface Block {
  id: string;
  title: string;
  categoryId: string;
  start: number; // minutes from midnight, 0–1425, multiple of 15
  end: number; // 15–1440, multiple of 15, end > start
  status: BlockStatus;
}

interface TemplateBlock extends Omit<Block, "status"> {
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday (ISO), independent of weekStartsOn
}

interface Template {
  id: string;
  name: string;
  blocks: TemplateBlock[];
}

type PaletteKey =
  | "amber" | "orange" | "rose" | "pink" | "violet"
  | "blue" | "sky" | "teal" | "emerald" | "lime" | "slate";

interface Category {
  id: string;
  name: string;
  color: PaletteKey;
}

interface TimeblockData {
  categories: Category[];
  blocksByDate: Record<string, Block[]>; // key: local date "YYYY-MM-DD"
  templates: Template[];
}

interface Settings {
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday (default 1)
}
```

**Why date-keyed:** a week view is simply the 7 date keys it covers, so
changing `weekStartsOn` never reshuffles stored data. Times are minutes, not
timestamps, so DST and time zones are irrelevant — every day is 24 hours.
Empty date keys are deleted rather than stored as `[]`.

**Default categories:** Deep work (blue), Meetings (violet), Admin (slate),
Exercise (emerald), Personal (amber).

**Limits** (toast on hit, action aborted): 20 templates, 30 categories,
300 blocks per week (and per template).

## Store (`features/timeblock/store.ts`)

Zustand + `persist`: `name: "timeblock-storage"`, `version: 1`,
`skipHydration: true`, hydrated via `useStoreHydration`;
`FullscreenLoading` until hydrated.

- **Persisted** (via `partialize`): `categories`, `blocksByDate`, `templates`,
  `settings`.
- **Not persisted**: history stacks. View state (current week, mode, active
  template, mobile day) lives in component state; the page always opens on
  the current week in Week mode.

### Actions

All content-changing actions go through history (see below):

- Blocks (week): `addBlock(date, block)`, `updateBlock(date, id, patch)`,
  `moveBlock(fromDate, id, toDate, start, end)`, `deleteBlock(date, id)`,
  `duplicateBlock(date, id)`, `clearWeek(dates)`.
- Blocks (template): `addTemplateBlock`, `updateTemplateBlock`,
  `deleteTemplateBlock`, `duplicateTemplateBlock` (move = update of
  `weekday`/`start`/`end`).
- Templates: `createTemplate(name)`, `renameTemplate`, `deleteTemplate`,
  `saveWeekAsTemplate(name, dates)`, `applyTemplate(templateId, dates,
  "replace" | "add")`.
- Categories: `addCategory`, `updateCategory`, `deleteCategory`.
- Settings (no history): `setWeekStartsOn`.

Actions that would exceed a limit return a failure result (e.g.
`{ ok: false, reason: "limit" }`) so the UI can toast; they do not commit.

### Undo / redo

History is a pure reducer in `lib/history.ts`, used by the store:

```ts
interface HistoryEntry { label: string; data: TimeblockData }
interface History { past: HistoryEntry[]; future: HistoryEntry[] }
```

- `commit(label, recipe)`: push `{ label, data: current }` to `past` (cap
  100, drop oldest), clear `future`, set data to `recipe(current)`.
- `undo()`: pop `past` → push current (with the popped entry's label) to
  `future` → restore popped data.
- `redo()`: mirror of undo.
- Updates are immutable, so snapshots are reference copies of
  `TimeblockData` — no deep cloning.
- Labels (e.g. "Move block", "Apply template") drive button tooltips.
- A recipe that returns the same object (no-op) does not create an entry.
- History is session-only (cleared on reload) and excludes settings.

## Pure helpers (`features/timeblock/lib/`)

- `time.ts` — `snap(min)`, `clampRange(start, end)`, `formatMinutes(min)`
  (locale-aware via `Intl.DateTimeFormat`, `hour: "numeric"`),
  `toDateKey(date)`, `fromDateKey(key)`, `startOfWeek(date, weekStartsOn)`,
  `weekDates(start)` → 7 keys, `isoWeekday(key)` → 0 (Mon)…6 (Sun),
  `formatWeekRange(dates)`.
- `layout.ts` — `layoutDay(blocks)` → per block `{ column, columns }` for
  side-by-side overlap rendering (group transitively overlapping blocks,
  greedy column assignment).
- `stats.ts` — `weekStats(blocks[])` / `templateStats(templateBlocks[])` →
  totals and per-category `{ planned, done, skipped }` minutes.
- `history.ts` — the undo/redo reducer above.

These modules import nothing from React, Next, or `@/` aliases so they run
directly under `node --test`.

## Files

```
src/app/timeblock/
  page.tsx                 server component: metadata, JSON-LD, sr-only h1/p, lazy content
  opengraph-image.tsx      renderOgImage()
src/features/timeblock/
  store.ts
  palette.ts               PaletteKey → hex
  lib/time.ts   lib/layout.ts   lib/stats.ts   lib/history.ts   (+ *.test.ts each)
  components/
    timeblock-content.tsx  shell: navbar, grid + panel, status bar, shortcuts, hydration
    week-nav.tsx           week range nav (Week) / template picker (Templates)
    week-grid.tsx          gutter, headers, day columns, now line, scroll-to-7am
    use-grid-drag.ts       pointer-capture state machine: create / move / resize
    block-item.tsx         block visuals, resize handles, hover ✓, keyboard
    block-popover.tsx      block editor
    stats-panel.tsx        totals + per-category bars
    category-dialog.tsx    add / rename / recolor / delete categories
    template-dialogs.tsx   apply (Replace | Add), save-as, new, rename
    shortcuts.ts           ShortcutSection[] for ShortcutsDialog
```

Category colors are applied via an inline CSS variable
(`style={{ "--c": hex }}`) with Tailwind arbitrary values using
`color-mix(...)` for tints, so no dynamic class names are needed.

## Registration & SEO

- `src/lib/tools.ts`:
  `{ name: "Timeblock", description: "Plan your week in time blocks and track what got done", icon: CalendarClock, href: "/timeblock", addedAt: "2026-09-30" }`.
  Sitemap and home/command palette pick this up automatically.
- Metadata: `title: "Timeblock Planner"`, 140–155-char keyword-rich
  description with "no sign-up / runs in your browser", keywords (time
  blocking, time block planner, weekly planner, time blocking template, ideal
  week, weekly schedule maker, …), `alternates.canonical: "/timeblock"`,
  OpenGraph/Twitter overrides.
- JSON-LD `WebApplication`, `applicationCategory: "UtilityApplication"`,
  `offers.price: "0"`, `featureList` covering drag-to-create blocks, named
  templates, plan vs actual, category totals, undo/redo, local storage.

### OG image

- Accent: **lime `#84cc16`** (new; distinct from the existing ten tools).
- Wordmark `Timeblock` + lime `.` in Geist Black.
- Inline element: one small lime time-block chip reading `9:00 – 11:00 ✓`,
  placed above the wordmark.
- Tagline: _"Plan every hour. Skip the calendar app."_
- Add `Timeblock #84cc16` to the accent-color list in `CLAUDE.md`.

## Testing

- **Unit** (`node:test`, Node 26 native TypeScript): tests for
  `lib/time.ts` (snap/clamp, week ranges for Monday and Sunday starts, date
  keys across month/year boundaries), `lib/layout.ts` (non-overlapping,
  pairwise, and chained overlaps), `lib/stats.ts` (per-category totals,
  uncategorized, status split), `lib/history.ts` (commit, undo, redo, cap at
  100, redo cleared on commit, no-op recipe).
  - Add `"test": "node --test \"src/**/*.test.ts\""` to `package.json`.
  - Add `"allowImportingTsExtensions": true` to `tsconfig.json` (valid with
    `noEmit`); `lib/` modules import each other with explicit `.ts`
    extensions.
- **Manual (browser, against the dev server at :3000)**: create / move /
  resize / status; undo and redo via keyboard, toolbar, and toast; apply
  template (Replace and Add) and save-as-template; category delete →
  Uncategorized; reload persistence; week-start switch; dark mode; mobile
  width (single-day view + Sheet); `/timeblock/opengraph-image`.
- `pnpm lint` and `pnpm build` pass.
