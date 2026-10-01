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
