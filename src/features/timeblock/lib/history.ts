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

/**
 * Forget the newest change as if it never happened: restore its snapshot
 * without offering it as a redo. Redo entries are dropped too — their
 * snapshots were taken on top of the discarded change.
 */
export function discardLatest<T>(
  history: History<T>,
): { history: History<T>; data: T } | null {
  const entry = history.past.at(-1);
  if (!entry) return null;
  return {
    data: entry.data,
    history: { ...history, past: history.past.slice(0, -1), future: [] },
  };
}

export function latestId<T>(history: History<T>): number | null {
  return history.past.at(-1)?.id ?? null;
}
