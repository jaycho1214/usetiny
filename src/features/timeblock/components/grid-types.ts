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
  /** The new block's id and the history entry of its add, or null when refused. */
  create(col: number, start: number, end: number): { id: string; entryId: number } | null;
  update(col: number, id: string, patch: GridPatch, label?: string): void;
  move(fromCol: number, id: string, toCol: number, start: number, end: number): void;
  remove(col: number, id: string): void;
  duplicate(col: number, id: string): void;
  /** Erase a history entry if it is still the latest change. */
  discard(entryId: number): boolean;
}
