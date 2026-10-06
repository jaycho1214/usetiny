"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import type { Template, Weekday } from "../types";
import { CategoryDialog } from "./category-dialog";
import { createTemplateOps, createWeekOps } from "./grid-ops";
import type { GridColumn } from "./grid-types";
import { timeblockShortcutSections } from "./shortcuts";
import { StatsPanel } from "./stats-panel";
import { ApplyTemplateMenu, MoreMenu, TemplatePicker, TemplatesEmpty } from "./template-controls";
import { ApplyTemplateDialog, DeleteTemplateDialog, NameDialog } from "./template-dialogs";
import { NavIconButton, TimeblockNavbar, WeekNav, type Mode } from "./timeblock-navbar";
import { useTimeblockShortcuts } from "./use-timeblock-shortcuts";
import { WeekGrid, type WeekGridHandle } from "./week-grid";

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
  // The day Week mode shows: its week on desktop, the day itself in the
  // single-day view. A date, not an offset from today, so the clock passing
  // midnight or a week boundary never moves the view (or a block's open editor).
  const [focusDay, setFocusDay] = useState<string | null>(null);
  // Templates mode's single-day view, as an ISO weekday so it survives a
  // week-start change.
  const [templateDay, setTemplateDay] = useState<Weekday | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<TemplateDialog>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const gridRef = useRef<WeekGridHandle>(null);

  // Pin the view to today once the page is ready; only navigation moves it.
  if (hydrated && focusDay === null) setFocusDay(today);
  const day = focusDay ?? today;
  const weekStart = startOfWeek(day, weekStartsOn);
  const isCurrentWeek = weekStart === startOfWeek(today, weekStartsOn);
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

  const dayIndex =
    mode === "week" ? dates.indexOf(day) : weekdays.indexOf(templateDay ?? isoWeekday(day));
  const visible = useMemo(() => (isDesktop ? ALL_DAYS : [dayIndex]), [isDesktop, dayIndex]);
  // What "Today" would change: the week on desktop, the day in the single-day view.
  const showingToday = isDesktop ? isCurrentWeek : day === today;

  // Every view change closes the block editor first, so an untitled block is
  // committed or auto-deleted instead of being left behind off-screen.
  const closeEditor = () => gridRef.current?.closeEditor();
  // The view can also change under the user (rotating a phone, resizing past
  // the single-day breakpoint); close the editor if that took its block off-screen.
  useEffect(() => {
    gridRef.current?.closeHiddenEditor();
  }, [visible]);
  const switchMode = (next: Mode) => {
    closeEditor();
    setMode(next);
    setTemplateDay(null);
  };
  const goToday = () => {
    switchMode("week");
    setFocusDay(today);
  };
  const stepWeek = (delta: number) => {
    closeEditor();
    setFocusDay(addDays(day, delta * 7));
  };
  const selectTemplate = (id: string) => {
    closeEditor();
    setTemplateId(id);
  };
  const stepDay = (delta: 1 | -1) => {
    closeEditor();
    if (mode === "week") setFocusDay(addDays(day, delta)); // wraps into the neighboring week
    else setTemplateDay(weekdays[(dayIndex + delta + 7) % 7]);
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
  const applyMenu = (
    <ApplyTemplateMenu
      templates={templates}
      onApply={(template) => setDialog({ kind: "apply", template })}
      onCreate={() => {
        switchMode("templates");
        setDialog({ kind: "new" });
      }}
    />
  );
  const panel = (
    <StatsPanel
      heading={
        mode === "week"
          ? isCurrentWeek
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
          <>
            {mode === "week" ? (
              <WeekNav
                label={weekLabel}
                showingToday={showingToday}
                onPrev={() => stepWeek(-1)}
                onNext={() => stepWeek(1)}
                onToday={goToday}
              />
            ) : (
              // min-w-0 lets a long template name truncate instead of pushing Stats off-screen.
              <div className="min-w-0 flex-1 md:flex-none">
                <TemplatePicker
                  templates={templates}
                  value={activeTemplateId}
                  onChange={selectTemplate}
                  onNew={() => setDialog({ kind: "new" })}
                />
              </div>
            )}
            {/* Below md, Apply and Stats share the second row so row 1 never wraps. */}
            <div className="ml-auto flex shrink-0 items-center gap-1 pl-1 md:hidden">
              {mode === "week" && applyMenu}
              <NavIconButton label="Stats" onClick={() => setStatsOpen(true)}>
                <ChartBar className="h-3.5 w-3.5" />
              </NavIconButton>
            </div>
          </>
        }
        actions={
          <>
            {mode === "week" && <div className="hidden md:flex">{applyMenu}</div>}
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
              ref={gridRef}
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
