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
