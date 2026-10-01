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
