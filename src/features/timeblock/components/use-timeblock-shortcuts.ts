"use client";

import { useEffect, useRef } from "react";

export interface TimeblockShortcutHandlers {
  onToday: () => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onShowShortcuts: () => void;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/** Page-level shortcuts. Ignored while typing so inputs keep native undo. */
export function useTimeblockShortcuts(handlers: TimeblockShortcutHandlers) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isEditable(e.target)) return;
      const h = latest.current;
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "z") {
        e.preventDefault();
        if (e.shiftKey) h.onRedo();
        else h.onUndo();
        return;
      }
      if (e.ctrlKey && !e.metaKey && key === "y") {
        e.preventDefault();
        h.onRedo();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") h.onShowShortcuts();
      else if (key === "t") h.onToday();
      else if (e.key === "[") h.onPrevWeek();
      else if (e.key === "]") h.onNextWeek();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
