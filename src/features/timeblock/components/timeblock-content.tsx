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
