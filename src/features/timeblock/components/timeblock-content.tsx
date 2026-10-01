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
