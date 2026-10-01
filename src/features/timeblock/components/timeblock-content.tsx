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
